const mqtt = require('mqtt');
const Leitura = require('../models/Leitura');
const Sensor = require('../models/Sensor');
const Dispositivo = require('../models/Dispositivo');

let client;
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const MQTT_TOPIC_DEFAULT = process.env.MQTT_TOPIC || 'ProjetoFinalIot';

// Armazena tópicos inscritos
let topicosInscritos = new Set();

async function initMQTT() {
  return new Promise(async (resolve, reject) => {
    try {
      client = mqtt.connect(MQTT_BROKER, {
        clientId: `backend-${Date.now()}`,
        reconnectPeriod: 5000,
      });

      client.on('connect', async () => {
        console.log('✓ Conectado ao broker MQTT:', MQTT_BROKER);
        
        // Inscrever no tópico padrão
        await inscreverTopico(MQTT_TOPIC_DEFAULT);
        
        // Inscrever nos tópicos de todos os dispositivos cadastrados
        await inscreverTodosDispositivos();
        
        resolve(client);
      });

      client.on('message', async (topic, message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`📨 Mensagem recebida em ${topic}:`, data);
          
          await processarLeitura(data, topic);
        } catch (error) {
          console.error('Erro ao processar mensagem MQTT:', error);
        }
      });

      client.on('error', (error) => {
        console.error('Erro MQTT:', error);
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

async function processarLeitura(data, topic) {
  try {
    // Buscar dispositivo pelo tópico
    let dispositivo = await Dispositivo.findOne({
      where: { topico_mqtt: topic }
    });

    // Atualizar última conexão do dispositivo
    if (dispositivo) {
      await dispositivo.update({
        ultima_conexao: new Date(),
        status: 'ativo'
      });
    }

    // Buscar sensores vinculados ao dispositivo
    let sensores = [];
    if (dispositivo) {
      sensores = await Sensor.findAll({
        where: { id_dispositivo: dispositivo.id, status: 'ativo' }
      });
    }

    // Se não houver sensores vinculados, criar um sensor padrão
    if (sensores.length === 0) {
      let sensorPadrao = await Sensor.findOne({
        where: { nome: 'ESP32_Principal' }
      });

      if (!sensorPadrao) {
        sensorPadrao = await Sensor.create({
          nome: 'ESP32_Principal',
          tipo: 'Ambiental',
          modelo: 'ESP32',
          status: 'ativo',
          id_ambiente: 1,
          id_dispositivo: dispositivo ? dispositivo.id : null
        });
        console.log('✓ Sensor padrão criado:', sensorPadrao.nome);
      }
      sensores = [sensorPadrao];
    }

    // Usar o primeiro sensor para salvar leituras
    const sensor = sensores[0];

    // Salvar temperatura
    if (data.Temp !== undefined) {
      await Leitura.create({
        valor: data.Temp,
        tipo_leitura: 'temperatura',
        unidade: '°C',
        timestamp: new Date(),
        id_sensor: sensor.id
      });
      console.log('💾 Temperatura salva:', data.Temp + '°C');
    }

    // Salvar umidade
    if (data.Umidade !== undefined) {
      await Leitura.create({
        valor: data.Umidade,
        tipo_leitura: 'umidade',
        unidade: '%',
        timestamp: new Date(),
        id_sensor: sensor.id
      });
      console.log('💾 Umidade salva:', data.Umidade + '%');
    }

    // Salvar potenciômetro (opcional)
    if (data.Potenciometro !== undefined) {
      await Leitura.create({
        valor: data.Potenciometro,
        tipo_leitura: 'potenciometro',
        unidade: '%',
        timestamp: new Date(),
        id_sensor: sensor.id
      });
      console.log('💾 Potenciômetro salvo:', data.Potenciometro + '%');
    }
  } catch (error) {
    console.error('Erro ao salvar leitura no banco:', error);
  }
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
  adicionarTopico,
  removerTopico,
  inscreverTodosDispositivos
};
