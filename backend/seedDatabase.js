/**
 * Script para popular o banco de dados com dados de teste
 * Execute: node seedDatabase.js
 */

const sequelize = require('./src/config/database');
const Usuario = require('./src/models/Usuario');
const Ambiente = require('./src/models/Ambiente');
const Sensor = require('./src/models/Sensor');
const Dispositivo = require('./src/models/Dispositivo');

async function seedDatabase() {
  try {
    console.log('🌱 Sincronizando banco de dados...');
    await sequelize.sync({ alter: true });
    console.log('✓ Banco de dados sincronizado');

    // 1. Criar usuário admin
    console.log('\n👤 Criando usuário admin...');
    const usuario = await Usuario.findOrCreate({
      where: { email: 'admin@test.com' },
      defaults: {
        name: 'Admin Teste',
        email: 'admin@test.com',
        password: 'senha123', // bcrypt fará o hash no modelo
        tipo_usuario: 'admin'
      }
    });
    console.log('✓ Usuário criado:', usuario[0].email);

    // 2. Criar ambientes
    console.log('\n🏢 Criando ambientes...');
    const ambientes = await Promise.all([
      Ambiente.findOrCreate({
        where: { nome: 'Sala Principal' },
        defaults: {
          nome: 'Sala Principal',
          descricao: 'Sala de controle principal',
          localizacao: 'Primeiro andar',
          temperatura_ideal: 22,
          umidade_ideal: 50
        }
      }),
      Ambiente.findOrCreate({
        where: { nome: 'Laboratório' },
        defaults: {
          nome: 'Laboratório',
          descricao: 'Laboratório de pesquisa',
          localizacao: 'Segundo andar',
          temperatura_ideal: 20,
          umidade_ideal: 45
        }
      }),
      Ambiente.findOrCreate({
        where: { nome: 'Armazém' },
        defaults: {
          nome: 'Armazém',
          descricao: 'Armazém de produtos',
          localizacao: 'Terceiro andar',
          temperatura_ideal: 18,
          umidade_ideal: 40
        }
      })
    ]);
    console.log('✓ Ambientes criados:', ambientes.length);

    // 3. Criar dispositivos
    console.log('\n📡 Criando dispositivos ESP...');
    const dispositivos = await Promise.all([
      Dispositivo.findOrCreate({
        where: { topico_mqtt: 'ProjetoFinalIot' },
        defaults: {
          nome: 'ESP32 Sala Principal',
          tipo: 'ESP32',
          topico_mqtt: 'ProjetoFinalIot',
          mac_address: 'AA:BB:CC:DD:EE:01',
          descricao: 'Dispositivo na sala principal',
          status: 'ativo'
        }
      }),
      Dispositivo.findOrCreate({
        where: { topico_mqtt: 'sensor/laboratorio' },
        defaults: {
          nome: 'ESP32 Laboratório',
          tipo: 'ESP32',
          topico_mqtt: 'sensor/laboratorio',
          mac_address: 'AA:BB:CC:DD:EE:02',
          descricao: 'Dispositivo no laboratório',
          status: 'ativo'
        }
      })
    ]);
    console.log('✓ Dispositivos criados:', dispositivos.length);

    // 4. Criar sensores
    console.log('\n🎛️ Criando sensores...');
    const sensores = await Promise.all([
      Sensor.findOrCreate({
        where: { nome: 'Temperatura Sala' },
        defaults: {
          nome: 'Temperatura Sala',
          tipo: 'temperatura',
          modelo: 'DHT22',
          descricao: 'Sensor de temperatura da sala principal',
          status: 'ativo',
          id_ambiente: ambientes[0][0].id,
          id_dispositivo: dispositivos[0][0].id
        }
      }),
      Sensor.findOrCreate({
        where: { nome: 'Umidade Sala' },
        defaults: {
          nome: 'Umidade Sala',
          tipo: 'umidade',
          modelo: 'DHT22',
          descricao: 'Sensor de umidade da sala principal',
          status: 'ativo',
          id_ambiente: ambientes[0][0].id,
          id_dispositivo: dispositivos[0][0].id
        }
      }),
      Sensor.findOrCreate({
        where: { nome: 'Temperatura Laboratório' },
        defaults: {
          nome: 'Temperatura Laboratório',
          tipo: 'temperatura',
          modelo: 'DS18B20',
          descricao: 'Sensor de temperatura do laboratório',
          status: 'ativo',
          id_ambiente: ambientes[1][0].id,
          id_dispositivo: dispositivos[1][0].id
        }
      })
    ]);
    console.log('✓ Sensores criados:', sensores.length);

    console.log('\n✅ Banco de dados populado com sucesso!\n');
    console.log('📋 Dados de teste criados:');
    console.log('   👤 Usuário: admin@test.com | Senha: senha123');
    console.log('   🏢 Ambientes: Sala Principal, Laboratório, Armazém');
    console.log('   📡 Dispositivos: ESP32 Sala, ESP32 Laboratório');
    console.log('   🎛️ Sensores: Temperatura e Umidade em cada ambiente\n');

  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    console.error('Detalhes:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  -', e.message));
    }
  } finally {
    try {
      await sequelize.close();
      console.log('🔌 Conexão com banco de dados fechada');
    } catch (e) {
      // Ignora erro ao fechar
    }
    process.exit(0);
  }
}

seedDatabase();
