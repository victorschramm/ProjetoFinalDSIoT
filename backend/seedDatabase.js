/**
 * Script para popular o banco de dados com dados de teste
 * Execute: node seedDatabase.js
 * Execute: npm run seed (no terminal, dentro da pasta backend)
 */

const sequelize = require('./src/config/database');
const Usuario    = require('./src/models/Usuario');
const Ambiente   = require('./src/models/Ambiente');
const Sensor     = require('./src/models/Sensor');
const Dispositivo = require('./src/models/Dispositivo');
const Leitura    = require('./src/models/Leitura');
const Alerta     = require('./src/models/Alerta');
const PreventiveMaintenance = require('./src/models/PreventiveMaintenance');
const AssetHistory = require('./src/models/AssetHistory');

// Gera timestamp retroativo em minutos / horas / dias
const minutesAgo = (min) => new Date(Date.now() - min * 60 * 1000);
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

async function seedDatabase() {
  try {
    console.log('🌱 Sincronizando banco de dados...');
    await sequelize.sync({ alter: true });
    console.log('✓ Banco de dados sincronizado\n');

    // ─── 1. USUÁRIOS ──────────────────────────────────────────────────────────
    console.log('👤 Criando usuários...');

    const [admin] = await Usuario.findOrCreate({
      where: { email: 'admin@manutai.com' },
      defaults: {
        name: 'Administrador',
        password: 'admin123',
        tipo_usuario: 'admin'
      }
    });

    await Usuario.findOrCreate({
      where: { email: 'usuario@manutai.com' },
      defaults: {
        name: 'Usuário Padrão',
        password: 'user123',
        tipo_usuario: 'usuario'
      }
    });

    console.log('✓ Usuários: admin@manutai.com (admin) | usuario@manutai.com (usuário)');

    // ─── 2. AMBIENTES ─────────────────────────────────────────────────────────
    console.log('\n🏢 Criando ambientes...');

    const [salaPrincipal] = await Ambiente.findOrCreate({
      where: { nome: 'Sala de Servidores' },
      defaults: {
        descricao: 'Sala de controle e servidores do sistema',
        localizacao: 'Bloco A — Térreo',
        temperatura_ideal: 22,
        umidade_ideal: 50
      }
    });

    const [laboratorio] = await Ambiente.findOrCreate({
      where: { nome: 'Laboratório de IoT' },
      defaults: {
        descricao: 'Laboratório de desenvolvimento e testes de IoT',
        localizacao: 'Bloco B — 1º Andar',
        temperatura_ideal: 21,
        umidade_ideal: 55
      }
    });

    const [almoxarifado] = await Ambiente.findOrCreate({
      where: { nome: 'Almoxarifado' },
      defaults: {
        descricao: 'Estoque de componentes eletrônicos',
        localizacao: 'Bloco C — Subsolo',
        temperatura_ideal: 18,
        umidade_ideal: 40
      }
    });

    console.log('✓ Ambientes: Sala de Servidores | Laboratório de IoT | Almoxarifado');

    // ─── 3. DISPOSITIVOS ──────────────────────────────────────────────────────
    console.log('\n📡 Criando dispositivos ESP32...');

    const [disp1] = await Dispositivo.findOrCreate({
      where: { topico_mqtt: 'manutai/sala-servidores' },
      defaults: {
        nome: 'ESP32 — Sala de Servidores',
        tipo: 'ESP32',
        topico_mqtt: 'manutai/sala-servidores',
        mac_address: 'AA:BB:CC:DD:EE:01',
        descricao: 'ESP32 com sensor DHT11 instalado na Sala de Servidores',
        status: 'ativo',
        ultima_conexao: minutesAgo(5)
      }
    });

    const [disp2] = await Dispositivo.findOrCreate({
      where: { topico_mqtt: 'manutai/laboratorio' },
      defaults: {
        nome: 'ESP32 — Laboratório',
        tipo: 'ESP32',
        topico_mqtt: 'manutai/laboratorio',
        mac_address: 'AA:BB:CC:DD:EE:02',
        descricao: 'ESP32 com sensor DHT11 instalado no Laboratório de IoT',
        status: 'ativo',
        ultima_conexao: minutesAgo(8)
      }
    });

    const [disp3] = await Dispositivo.findOrCreate({
      where: { topico_mqtt: 'manutai/almoxarifado' },
      defaults: {
        nome: 'ESP32 — Almoxarifado',
        tipo: 'ESP32',
        topico_mqtt: 'manutai/almoxarifado',
        mac_address: 'AA:BB:CC:DD:EE:03',
        descricao: 'ESP32 com sensor DHT11 instalado no Almoxarifado',
        status: 'ativo',
        ultima_conexao: minutesAgo(12)
      }
    });

    console.log('✓ Dispositivos ESP32 criados nos 3 ambientes');

    // ─── 4. SENSORES ──────────────────────────────────────────────────────────
    console.log('\n🎛️ Criando sensores DHT11...');

    // Sala de Servidores
    const [sensorTempSala] = await Sensor.findOrCreate({
      where: { nome: 'DHT11 — Temp. Sala de Servidores' },
      defaults: {
        tipo: 'DHT11',
        modelo: 'DHT11',
        descricao: 'Sensor de temperatura da Sala de Servidores',
        status: 'ativo',
        id_ambiente: salaPrincipal.id,
        id_dispositivo: disp1.id,
        lastSeen: minutesAgo(5)
      }
    });

    const [sensorUmidSala] = await Sensor.findOrCreate({
      where: { nome: 'DHT11 — Umid. Sala de Servidores' },
      defaults: {
        tipo: 'DHT11',
        modelo: 'DHT11',
        descricao: 'Sensor de umidade da Sala de Servidores',
        status: 'ativo',
        id_ambiente: salaPrincipal.id,
        id_dispositivo: disp1.id,
        lastSeen: minutesAgo(5)
      }
    });

    // Laboratório
    const [sensorTempLab] = await Sensor.findOrCreate({
      where: { nome: 'DHT11 — Temp. Laboratório' },
      defaults: {
        tipo: 'DHT11',
        modelo: 'DHT11',
        descricao: 'Sensor de temperatura do Laboratório de IoT',
        status: 'ativo',
        id_ambiente: laboratorio.id,
        id_dispositivo: disp2.id,
        lastSeen: minutesAgo(8)
      }
    });

    const [sensorUmidLab] = await Sensor.findOrCreate({
      where: { nome: 'DHT11 — Umid. Laboratório' },
      defaults: {
        tipo: 'DHT11',
        modelo: 'DHT11',
        descricao: 'Sensor de umidade do Laboratório de IoT',
        status: 'ativo',
        id_ambiente: laboratorio.id,
        id_dispositivo: disp2.id,
        lastSeen: minutesAgo(8)
      }
    });

    // Almoxarifado
    const [sensorTempAlmox] = await Sensor.findOrCreate({
      where: { nome: 'DHT11 — Temp. Almoxarifado' },
      defaults: {
        tipo: 'DHT11',
        modelo: 'DHT11',
        descricao: 'Sensor de temperatura do Almoxarifado',
        status: 'ativo',
        id_ambiente: almoxarifado.id,
        id_dispositivo: disp3.id,
        lastSeen: minutesAgo(12)
      }
    });

    const [sensorUmidAlmox] = await Sensor.findOrCreate({
      where: { nome: 'DHT11 — Umid. Almoxarifado' },
      defaults: {
        tipo: 'DHT11',
        modelo: 'DHT11',
        descricao: 'Sensor de umidade do Almoxarifado',
        status: 'ativo',
        id_ambiente: almoxarifado.id,
        id_dispositivo: disp3.id,
        lastSeen: minutesAgo(12)
      }
    });

    console.log('✓ 6 sensores criados (temperatura e umidade por ambiente)');

    // ─── 5. LEITURAS ──────────────────────────────────────────────────────────
    console.log('\n📊 Criando leituras simuladas...');

    // Sala de Servidores — temperatura alta (servidores geram calor)
    const leiturasTempSala = [
      { valor: 28.5, timestamp: minutesAgo(60) },
      { valor: 29.1, timestamp: minutesAgo(45) },
      { valor: 30.3, timestamp: minutesAgo(30) },
      { valor: 31.7, timestamp: minutesAgo(15) },
      { valor: 33.0, timestamp: minutesAgo(5)  }
    ];

    // Sala de Servidores — umidade baixa
    const leiturasUmidSala = [
      { valor: 48.0, timestamp: minutesAgo(60) },
      { valor: 47.5, timestamp: minutesAgo(45) },
      { valor: 46.0, timestamp: minutesAgo(30) },
      { valor: 45.2, timestamp: minutesAgo(15) },
      { valor: 44.0, timestamp: minutesAgo(5)  }
    ];

    // Laboratório — temperatura estável, levemente acima do ideal
    const leiturasTempLab = [
      { valor: 22.0, timestamp: minutesAgo(60) },
      { valor: 22.4, timestamp: minutesAgo(45) },
      { valor: 23.1, timestamp: minutesAgo(30) },
      { valor: 23.8, timestamp: minutesAgo(15) },
      { valor: 24.5, timestamp: minutesAgo(8)  }
    ];

    // Laboratório — umidade ideal
    const leiturasUmidLab = [
      { valor: 55.0, timestamp: minutesAgo(60) },
      { valor: 54.5, timestamp: minutesAgo(45) },
      { valor: 56.0, timestamp: minutesAgo(30) },
      { valor: 55.8, timestamp: minutesAgo(15) },
      { valor: 57.0, timestamp: minutesAgo(8)  }
    ];

    // Almoxarifado — temperatura abaixo do ideal (ambiente frio)
    const leiturasTempAlmox = [
      { valor: 16.0, timestamp: minutesAgo(60) },
      { valor: 15.5, timestamp: minutesAgo(45) },
      { valor: 15.0, timestamp: minutesAgo(30) },
      { valor: 14.5, timestamp: minutesAgo(20) },
      { valor: 14.0, timestamp: minutesAgo(12) }
    ];

    // Almoxarifado — umidade alta (risco para componentes)
    const leiturasUmidAlmox = [
      { valor: 62.0, timestamp: minutesAgo(60) },
      { valor: 65.0, timestamp: minutesAgo(45) },
      { valor: 68.5, timestamp: minutesAgo(30) },
      { valor: 71.0, timestamp: minutesAgo(20) },
      { valor: 73.0, timestamp: minutesAgo(12) }
    ];

    const criarLeituras = async (sensorId, tipo, unidade, dados) => {
      for (const d of dados) {
        await Leitura.findOrCreate({
          where: { id_sensor: sensorId, timestamp: d.timestamp },
          defaults: { valor: d.valor, tipo_leitura: tipo, unidade, id_sensor: sensorId, timestamp: d.timestamp }
        });
      }
    };

    await criarLeituras(sensorTempSala.id,  'temperatura', '°C', leiturasTempSala);
    await criarLeituras(sensorUmidSala.id,  'umidade',     '%',  leiturasUmidSala);
    await criarLeituras(sensorTempLab.id,   'temperatura', '°C', leiturasTempLab);
    await criarLeituras(sensorUmidLab.id,   'umidade',     '%',  leiturasUmidLab);
    await criarLeituras(sensorTempAlmox.id, 'temperatura', '°C', leiturasTempAlmox);
    await criarLeituras(sensorUmidAlmox.id, 'umidade',     '%',  leiturasUmidAlmox);

    console.log('✓ 30 leituras criadas (5 por variável por ambiente)');

    // ─── 6. ALERTAS ───────────────────────────────────────────────────────────
    console.log('\n⚠️  Criando alertas simulados...');

    await Alerta.findOrCreate({
      where: { id_sensor: sensorTempSala.id, status: 'pendente', tipo: 'TEMPERATURA_ALTA' },
      defaults: {
        tipo: 'TEMPERATURA_ALTA',
        mensagem: 'Temperatura da Sala de Servidores acima do limite: 33.0°C (limite: 24°C)',
        nivel_severidade: 'alto',
        valor_detectado: 33.0,
        timestamp: minutesAgo(5),
        status: 'pendente'
      }
    });

    await Alerta.findOrCreate({
      where: { id_sensor: sensorUmidAlmox.id, status: 'pendente', tipo: 'UMIDADE_ALTA' },
      defaults: {
        tipo: 'UMIDADE_ALTA',
        mensagem: 'Umidade do Almoxarifado acima do limite: 73.0% (limite: 50%)',
        nivel_severidade: 'alto',
        valor_detectado: 73.0,
        timestamp: minutesAgo(12),
        status: 'pendente'
      }
    });

    await Alerta.findOrCreate({
      where: { id_sensor: sensorTempAlmox.id, status: 'pendente', tipo: 'TEMPERATURA_BAIXA' },
      defaults: {
        tipo: 'TEMPERATURA_BAIXA',
        mensagem: 'Temperatura do Almoxarifado abaixo do limite: 14.0°C (limite: 16°C)',
        nivel_severidade: 'medio',
        valor_detectado: 14.0,
        timestamp: minutesAgo(12),
        status: 'pendente'
      }
    });

    await Alerta.findOrCreate({
      where: { id_sensor: sensorTempLab.id, status: 'resolvido', tipo: 'TEMPERATURA_ALTA' },
      defaults: {
        tipo: 'TEMPERATURA_ALTA',
        mensagem: 'Temperatura do Laboratório acima do limite: 24.5°C (limite: 23°C)',
        nivel_severidade: 'baixo',
        valor_detectado: 24.5,
        timestamp: minutesAgo(8),
        status: 'resolvido',
        resolucao: 'Ar-condicionado ajustado manualmente. Temperatura voltando ao normal.'
      }
    });

    console.log('✓ 4 alertas criados (3 pendentes, 1 resolvido)');

    // ─── 7. MANUTENÇÃO PREVENTIVA ─────────────────────────────────────────────
    console.log('\n🔧 Criando configurações de manutenção preventiva...');

    await PreventiveMaintenance.findOrCreate({
      where: { deviceId: sensorTempSala.id },
      defaults: {
        deviceId: sensorTempSala.id,
        horasOperadas: 480,
        limiteHoras: 500,
        ultimaAtualizacao: hoursAgo(5),
        status: 'OK',
        descricao: 'Limpeza e calibração do sensor DHT11'
      }
    });

    await PreventiveMaintenance.findOrCreate({
      where: { deviceId: sensorUmidLab.id },
      defaults: {
        deviceId: sensorUmidLab.id,
        horasOperadas: 620,
        limiteHoras: 600,
        ultimaAtualizacao: hoursAgo(8),
        status: 'MANUTENCAO_PENDENTE',
        descricao: 'Substituição do sensor DHT11 (fim de vida útil)'
      }
    });

    await PreventiveMaintenance.findOrCreate({
      where: { deviceId: sensorTempAlmox.id },
      defaults: {
        deviceId: sensorTempAlmox.id,
        horasOperadas: 150,
        limiteHoras: 1000,
        ultimaAtualizacao: hoursAgo(12),
        status: 'OK',
        descricao: 'Verificação geral do ESP32 e conexões'
      }
    });

    console.log('✓ 3 configurações de manutenção preventiva criadas');

    // ─── 8. CURRÍCULO DA MÁQUINA (HISTÓRICO DE EVENTOS) ────────────────────────
    console.log('\n📜 Criando histórico de eventos (currículo da máquina)...');

    const criarEvento = async (deviceId, tipoEvento, descricao, dataEvento) => {
      await AssetHistory.findOrCreate({
        where: { deviceId: String(deviceId), tipoEvento, dataEvento },
        defaults: { deviceId: String(deviceId), tipoEvento, descricao, dataEvento }
      });
    };

    // ESP32 — Sala de Servidores
    await criarEvento(disp1.id, 'SENSOR_ONLINE', `Sensor "${sensorTempSala.nome}" (ID: ${sensorTempSala.id}) iniciado e conectado.`, daysAgo(5));
    await criarEvento(disp1.id, 'MANUTENCAO', 'Limpeza do sensor DHT11 e verificação das conexões realizada pelo técnico.', daysAgo(3));
    await criarEvento(disp1.id, 'ALERTA_TEMPERATURA', 'Temperatura acima do normal (31.7). O ideal é 22 (máximo configurado de 24).', minutesAgo(15));
    await criarEvento(disp1.id, 'INTERVENCAO_MANUAL', 'Ar-condicionado da Sala de Servidores ajustado manualmente pelo operador.', minutesAgo(10));
    await criarEvento(disp1.id, 'ALERTA_TEMPERATURA', 'Temperatura acima do normal (33.0). O ideal é 22 (máximo configurado de 24).', minutesAgo(5));

    // ESP32 — Laboratório
    await criarEvento(disp2.id, 'MANUTENCAO', 'Manutenção preventiva: limpeza do sensor DHT11 do Laboratório realizada.', daysAgo(10));
    await criarEvento(disp2.id, 'SENSOR_OFFLINE', `Sensor "${sensorUmidLab.nome}" (ID: ${sensorUmidLab.id}) ficou offline há mais de 5 minutos.`, daysAgo(2));
    await criarEvento(disp2.id, 'SENSOR_ONLINE', `Sensor "${sensorUmidLab.nome}" (ID: ${sensorUmidLab.id}) voltou a ficar online.`, new Date(daysAgo(2).getTime() + 10 * 60 * 1000));
    await criarEvento(disp2.id, 'MANUTENCAO_PREVENTIVA', 'Manutenção preventiva necessária: Substituição do sensor DHT11 (fim de vida útil) (620.0h operadas / limite: 600h).', hoursAgo(8));
    await criarEvento(disp2.id, 'ALERTA_TEMPERATURA', 'Temperatura do Laboratório acima do limite: 24.5°C (limite: 23°C).', minutesAgo(8));
    await criarEvento(disp2.id, 'RETORNO_NORMALIDADE', 'Temperatura voltou ao normal (23.0). Ideal: 21.', minutesAgo(3));

    // ESP32 — Almoxarifado
    await criarEvento(disp3.id, 'MANUTENCAO', 'Substituição do sensor DHT11 antigo do Almoxarifado.', daysAgo(7));
    await criarEvento(disp3.id, 'ALERTA_UMIDADE', 'Umidade acima do normal (73.0). O ideal é 40 (máximo configurado de 50).', minutesAgo(12));
    await criarEvento(disp3.id, 'ALERTA_TEMPERATURA', 'Temperatura abaixo do normal (14.0). O ideal é 18 (mínimo configurado de 16).', minutesAgo(12));

    console.log('✓ 14 eventos de histórico criados (3 dispositivos)');

    // ─── RESUMO ───────────────────────────────────────────────────────────────
    console.log('\n✅ Banco de dados populado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMO DOS DADOS DE TESTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Usuários:');
    console.log('   admin@manutai.com   | Senha: admin123 | Admin');
    console.log('   usuario@manutai.com | Senha: user123  | Usuário');
    console.log('\n🏢 Ambientes (3):');
    console.log('   Sala de Servidores — Temp. ideal: 22°C | Umid. ideal: 50%');
    console.log('   Laboratório de IoT — Temp. ideal: 21°C | Umid. ideal: 55%');
    console.log('   Almoxarifado       — Temp. ideal: 18°C | Umid. ideal: 40%');
    console.log('\n📡 Dispositivos (3): ESP32 em cada ambiente');
    console.log('\n🎛️  Sensores (6): DHT11 de temperatura e umidade por ambiente');
    console.log('\n📊 Leituras (30): 5 leituras × 2 variáveis × 3 ambientes');
    console.log('   Sala de Servidores: temp. subindo (28.5 → 33.0°C) 🔴');
    console.log('   Laboratório de IoT: temp. estável (22.0 → 24.5°C) 🟡');
    console.log('   Almoxarifado:       temp. baixa  (16.0 → 14.0°C) 🔵');
    console.log('\n⚠️  Alertas (4):');
    console.log('   🔴 PENDENTE  — Temperatura Alta: Sala de Servidores (33.0°C)');
    console.log('   🔴 PENDENTE  — Umidade Alta: Almoxarifado (73.0%)');
    console.log('   🟡 PENDENTE  — Temperatura Baixa: Almoxarifado (14.0°C)');
    console.log('   ✅ RESOLVIDO — Temperatura Alta: Laboratório (resolvido)');
    console.log('\n🔧 Manutenção Preventiva (3):');
    console.log('   DHT11 — Temp. Sala de Servidores — 480h / 500h (OK)');
    console.log('   DHT11 — Umid. Laboratório         — 620h / 600h (MANUTENÇÃO PENDENTE)');
    console.log('   DHT11 — Temp. Almoxarifado         — 150h / 1000h (OK)');
    console.log('\n📜 Currículo da Máquina (14 eventos):');
    console.log('   ESP32 — Sala de Servidores: 5 eventos (manutenção, alertas, intervenção)');
    console.log('   ESP32 — Laboratório:        6 eventos (manutenção, offline/online, alertas)');
    console.log('   ESP32 — Almoxarifado:       3 eventos (manutenção, alertas)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Erro ao popular banco de dados:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  -', e.message));
    }
  } finally {
    try {
      await sequelize.close();
      console.log('🔌 Conexão fechada.');
    } catch (_) {}
    process.exit(0);
  }
}

seedDatabase();
