const mqtt = require('mqtt');
const Leitura = require('../models/Leitura');
const Sensor = require('../models/Sensor');
const Dispositivo = require('../models/Dispositivo');
const Alerta = require('../models/Alerta');
const Ambiente = require('../models/Ambiente');
const { sendAlert } = require('../services/notificationService');
const { logAssetEvent } = require('../services/assetHistoryService');
const { updateOperatingHours } = require('../services/preventiveMaintenanceService');

let client;

if (!process.env.MQTT_BROKER || !process.env.MQTT_USERNAME || !process.env.MQTT_PASSWORD) {
  console.error('⚠️  ALERTA: Variáveis MQTT_BROKER, MQTT_USERNAME e MQTT_PASSWORD devem estar definidas no .env');
}

const MQTT_BROKER = process.env.MQTT_BROKER;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_TOPIC_DEFAULT = process.env.MQTT_TOPIC || 'manutai/leitura';

// Armazena tópicos inscritos
let topicosInscritos = new Set();

// Hooks executados toda vez que o cliente MQTT conecta (ou reconecta)
const onConnectHooks = [];
function registrarOnConnect(fn) {
  onConnectHooks.push(fn);
}

// Definir unidades padrão por tipo de leitura
const UNIDADES_PADRAO = {
  'temperatura': '°C',
  'umidade': '%',
  'potenciometro': '%'
};

async function initMQTT() {
  return new Promise((resolve, reject) => {
    try {
      client = mqtt.connect(MQTT_BROKER, {
        clientId: `backend-${Date.now()}`,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        reconnectPeriod: 5000,
      });

      // Controla se a promise já foi resolvida (primeira conexão bem-sucedida)
      let conectado = false;

      client.on('connect', async () => {
        console.log('✓ Conectado ao broker MQTT:', MQTT_BROKER);
        conectado = true;

        try {
          // Inscrever no tópico padrão
          await inscreverTopico(MQTT_TOPIC_DEFAULT);

          // Inscrever nos tópicos de todos os dispositivos cadastrados
          await inscreverTodosDispositivos();

          // Re-inscrever em tópicos já conhecidos (após reconexão)
          for (const topico of topicosInscritos) {
            client.subscribe(topico, (err) => {
              if (err) console.error(`Erro ao re-inscrever no tópico ${topico}:`, err);
            });
          }
        } catch (err) {
          console.error('Erro ao configurar tópicos MQTT:', err);
        }

        // Re-publica configs registradas (ex: intervalo do sensor) para que
        // o ESP32 receba o valor correto mesmo após reconexão do broker
        for (const hook of onConnectHooks) {
          try { await hook(); } catch (e) { console.warn('Erro em hook onConnect:', e.message); }
        }

        resolve(client);
      });

      client.on('message', async (topic, message) => {
        try {
          const raw = message.toString();
          let data;
          try {
            data = JSON.parse(raw);
          } catch (parseErr) {
            console.warn(`⚠️  Mensagem não-JSON ignorada em ${topic}:`, raw.substring(0, 100));
            return;
          }
          console.log(`📨 Mensagem recebida em ${topic}:`, data);

          await processarLeitura(data, topic);
        } catch (error) {
          console.error('Erro ao processar mensagem MQTT:', error);
        }
      });

      client.on('error', (error) => {
        console.error('Erro MQTT:', error.message);
        // Rejeita a promise apenas na primeira tentativa de conexão
        // Após conectado, erros são tratados pelo mecanismo de reconexão
        if (!conectado) {
          client.end(true);
          reject(error);
        }
      });

      client.on('reconnect', () => {
        console.log('🔄 Reconectando ao broker MQTT...');
      });

      client.on('offline', () => {
        console.log('⚠️  Desconectado do broker MQTT');
      });
    } catch (error) {
      reject(error);
    }
  });
}
// Inscrever em um tópico específico
async function inscreverTopico(topico) {
  return new Promise((resolve, reject) => {
    if (topicosInscritos.has(topico)) {
      resolve();
      return;
    }
    
    client.subscribe(topico, (err) => {
      if (err) {
        console.error(`Erro ao inscrever no tópico ${topico}:`, err);
        reject(err);
      } else {
        topicosInscritos.add(topico);
        console.log(`✓ Inscrito no tópico: ${topico}`);
        resolve();
      }
    });
  });
}

// Desinscrever de um tópico
async function desinscreverTopico(topico) {
  return new Promise((resolve, reject) => {
    if (!topicosInscritos.has(topico)) {
      resolve();
      return;
    }
    
    client.unsubscribe(topico, (err) => {
      if (err) {
        console.error(`Erro ao desinscrever do tópico ${topico}:`, err);
        reject(err);
      } else {
        topicosInscritos.delete(topico);
        console.log(`✓ Desinscrito do tópico: ${topico}`);
        resolve();
      }
    });
  });
}

// Inscrever em todos os tópicos dos dispositivos cadastrados
async function inscreverTodosDispositivos() {
  try {
    const dispositivos = await Dispositivo.findAll({
      where: { status: 'ativo' }
    });
    
    for (const dispositivo of dispositivos) {
      if (dispositivo.topico_mqtt) {
        await inscreverTopico(dispositivo.topico_mqtt);
      }
    }
    
    console.log(`✓ Inscrito em ${dispositivos.length} tópicos de dispositivos`);
  } catch (error) {
    console.error('Erro ao inscrever nos tópicos dos dispositivos:', error);
  }
}

// Adicionar novo tópico (quando um dispositivo é cadastrado)
async function adicionarTopico(topico) {
  if (client && client.connected) {
    await inscreverTopico(topico);
  }
}

// Remover tópico (quando um dispositivo é removido)
async function removerTopico(topico) {
  if (client && client.connected) {
    await desinscreverTopico(topico);
  }
}

async function verificarEGerarAlerta(sensorId, tipo_leitura, valor) {
  try {
    const sensor = await Sensor.findByPk(sensorId);
    if (!sensor || !sensor.id_ambiente) return;

    const ambiente = await Ambiente.findByPk(sensor.id_ambiente);
    if (!ambiente) return;

    let limiteIdeal = null;
    let margem = 0;
    let msgTipo = '';

    if (tipo_leitura === 'temperatura') {
      limiteIdeal = ambiente.temperatura_ideal;
      margem = 2.0;
      msgTipo = 'Temperatura';
    } else if (tipo_leitura === 'umidade') {
      limiteIdeal = ambiente.umidade_ideal;
      margem = 10.0;
      msgTipo = 'Umidade';
    } else {
      return;
    }

    if (limiteIdeal === null || limiteIdeal === undefined) return;

    const numValor = parseFloat(valor);
    let alertaAcionado = false;
    let mensagem = '';
    let acima = false; // true = acima do limite (3 bips) | false = abaixo (2 bips)

    if (numValor > (limiteIdeal + margem)) {
      alertaAcionado = true;
      acima = true;
      mensagem = `${msgTipo} acima do normal (${numValor}). O ideal é ${limiteIdeal} (máximo configurado de ${limiteIdeal + margem}).`;
    } else if (numValor < (limiteIdeal - margem)) {
      alertaAcionado = true;
      acima = false;
      mensagem = `${msgTipo} abaixo do normal (${numValor}). O ideal é ${limiteIdeal} (mínimo configurado de ${limiteIdeal - margem}).`;
    }

    if (alertaAcionado) {
      const alertaExistente = await Alerta.findOne({
        where: {
          id_sensor: sensor.id,
          tipo: msgTipo,
          status: 'pendente'
        }
      });

      if (alertaExistente) {
        console.log(`⏭️  Alerta de ${msgTipo} já existe (pendente) para sensor ${sensorId} — notificação suprimida`);
      }

      if (!alertaExistente) {
        await Alerta.create({
          id_sensor: sensor.id,
          tipo: msgTipo,
          mensagem: mensagem,
          nivel_severidade: 'alto',
          valor_detectado: numValor,
          timestamp: new Date(),
          status: 'pendente'
        });
        console.log(`[ALERTA GERADO] ${mensagem}`);

        // Acionar buzzer no ESP32: 3 bips = acima do limite | 2 bips = abaixo do limite
        // Disparado apenas uma vez por alerta (mesmo controle do alertaExistente acima)
        publicarMensagem('manutai/buzzer', acima ? '3' : '2').catch(() => {});

        const tipoEvento = tipo_leitura === 'temperatura' ? 'ALERTA_TEMPERATURA' : 'ALERTA_UMIDADE';
        logAssetEvent(
          sensor.id_dispositivo || sensor.id,
          tipoEvento,
          mensagem
        ).catch(() => {});

        sendAlert({
          assunto: `[ManutAI] Alerta: ${msgTipo} fora do limite`,
          mensagem
        }).catch(() => {});
      }
    } else {
      // Retorno à normalidade: se havia alerta pendente, registra o evento
      const alertaPendente = await Alerta.findOne({
        where: { id_sensor: sensor.id, tipo: msgTipo, status: 'pendente' }
      });
      if (alertaPendente) {
        logAssetEvent(
          sensor.id_dispositivo || sensor.id,
          'RETORNO_NORMALIDADE',
          `${msgTipo} voltou ao normal (${numValor}). Ideal: ${limiteIdeal}.`
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Erro ao verificar alerta:', err);
  }
}

async function processarLeitura(data, topic) {
  try {
    // Validar formato esperado: { id_sensor, valor, tipo_leitura, timestamp?, unidade? }
    if (data.id_sensor === undefined || data.valor === undefined || data.tipo_leitura === undefined) {
      console.warn(`⚠️  Formato inválido em ${topic}:`, JSON.stringify(data).substring(0, 100));
      return;
    }

    // Verificar se o sensor existe
    const sensor = await Sensor.findByPk(data.id_sensor);
    if (!sensor) {
      console.warn(`⚠️  Sensor com id ${data.id_sensor} não encontrado, ignorando leitura`);
      return;
    }

    // Registra retorno ONLINE se o sensor estava OFFLINE
    if (sensor.status === 'OFFLINE') {
      logAssetEvent(
        sensor.id_dispositivo || sensor.id,
        'SENSOR_ONLINE',
        `Sensor "${sensor.nome}" (ID: ${sensor.id}) voltou a ficar online.`
      ).catch(() => {});
    }

    // Atualizar lastSeen e status do sensor
    await sensor.update({ lastSeen: new Date(), status: 'ONLINE' });

    // Incrementar horas de operação para manutenção preventiva
    await updateOperatingHours(data.id_sensor);

    // Definir unidade: usar fornecida, ou padrão, ou null
    const unidade = data.unidade || UNIDADES_PADRAO[data.tipo_leitura] || null;

    // Salvar leitura
    await Leitura.create({
      id_sensor: data.id_sensor,
      valor: data.valor,
      tipo_leitura: data.tipo_leitura,
      unidade: unidade,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
    });

    console.log(`💾 ${data.tipo_leitura.toUpperCase()} salva: ${data.valor}${unidade ? ' ' + unidade : ''} (sensor ${data.id_sensor})`);

    // Verificar e gerar alerta se necessário
    await verificarEGerarAlerta(data.id_sensor, data.tipo_leitura, data.valor);

    // Atualizar última conexão do dispositivo pelo tópico
    const dispositivo = await Dispositivo.findOne({ where: { topico_mqtt: topic } });
    if (dispositivo) {
      await dispositivo.update({
        ultima_conexao: new Date(),
        status: 'ativo'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao processar leitura:', error.message);
  }
}

// Publicar mensagem em um tópico MQTT
// opcoes: { qos, retain } — padrão qos:1, retain:false
async function publicarMensagem(topico, mensagem, opcoes = {}) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      console.error('❌ Cliente MQTT não está conectado');
      return reject(new Error('Cliente MQTT não está conectado'));
    }

    const payload = typeof mensagem === 'string' ? mensagem : JSON.stringify(mensagem);
    const publishOpts = { qos: 1, ...opcoes };

    client.publish(topico, payload, publishOpts, (err) => {
      if (err) {
        console.error(`❌ Erro ao publicar no tópico ${topico}:`, err);
        reject(err);
      } else {
        console.log(`📤 Mensagem publicada em ${topico}:`, payload);
        resolve();
      }
    });
  });
}

function getMQTTClient() {
  return client;
}

function closeMQTT() {
  if (client) {
    client.end();
    console.log('Conexão MQTT encerrada');
  }
}

module.exports = {
  initMQTT,
  getMQTTClient,
  closeMQTT,
  processarLeitura,
  publicarMensagem,
  adicionarTopico,
  removerTopico,
  inscreverTodosDispositivos,
  registrarOnConnect
};
