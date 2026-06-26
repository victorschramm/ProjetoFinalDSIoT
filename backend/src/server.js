const { Op } = require('sequelize');
const sequelize = require('./config/database');
const { initMQTT } = require('./config/mqtt');
const app = require('./app');
const Sensor = require('./models/Sensor');
const Alerta = require('./models/Alerta');
const Usuario = require('./models/Usuario');
const NotificationSettings = require('./models/NotificationSettings');
const { WebSocketServer, WebSocket } = require('ws');
const { sendAlert } = require('./services/notificationService');
const { logAssetEvent } = require('./services/assetHistoryService');
require('./models/AuditLog');
require('./models/PreventiveMaintenance');

sequelize.sync().then(async () => {
  console.log('✓ Banco de dados sincronizado');

  try {
    const [count] = await sequelize.query(
      "UPDATE Alertas SET status = 'pendente' WHERE status = 'aberto'"
    );
    if (count > 0) console.log(`✓ Migração: ${count} alerta(s) 'aberto' convertido(s) para 'pendente'`);
  } catch (err) {
    console.warn('⚠️  Migração de alertas ignorada:', err.message);
  }

  // Migração: criar NotificationSettings para usuários que ainda não têm
  try {
    const usuarios = await Usuario.findAll();
    let criados = 0;
    for (const u of usuarios) {
      const existe = await NotificationSettings.findOne({ where: { id_usuario: u.id } });
      if (!existe) {
        await NotificationSettings.create({
          id_usuario: u.id,
          emailEnabled: true,
          whatsappEnabled: false,
          email: u.email,
          telefone: null
        });
        criados++;
      }
    }
    if (criados > 0) console.log(`✓ Migração: ${criados} configuração(ões) de notificação criada(s)`);
  } catch (err) {
    console.warn('⚠️  Migração de notificações ignorada:', err.message);
  }

  initMQTT().catch(err => {
    console.error('⚠️  Erro ao inicializar MQTT:', err.message);
    console.log('Continuando sem MQTT...');
  });

  const PORT = process.env.PORT || 3000;
  const httpServer = app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));

  const wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', (ws) => {
    console.log('✓ Cliente WebSocket conectado');
    ws.on('close', () => console.log('Cliente WebSocket desconectado'));
  });

  function broadcast(event, payload) {
    const message = JSON.stringify({ event, ...payload });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  }

  const CINCO_MINUTOS_MS = 5 * 60 * 1000;
  setInterval(async () => {
    try {
      const limite = new Date(Date.now() - CINCO_MINUTOS_MS);
      const sensoresOffline = await Sensor.findAll({
        where: { status: 'ONLINE', lastSeen: { [Op.lt]: limite } }
      });
      for (const sensor of sensoresOffline) {
        await sensor.update({ status: 'OFFLINE' });
        broadcast('sensor-offline', {
          sensorId: sensor.id,
          mensagem: 'Sensor offline há mais de 5 minutos'
        });
        console.log(`⚠️  Sensor ${sensor.id} (${sensor.nome}) marcado como OFFLINE`);

        logAssetEvent(
          sensor.id_dispositivo || sensor.id,
          'SENSOR_OFFLINE',
          `Sensor "${sensor.nome}" (ID: ${sensor.id}) ficou offline há mais de 5 minutos.`
        ).catch(() => {});

        sendAlert({
          assunto: '[ManutAI] Sensor offline',
          mensagem: `O sensor "${sensor.nome}" (ID: ${sensor.id}) está offline há mais de 5 minutos.`
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Erro no monitor de sensores:', error.message);
    }
  }, 60 * 1000);

}).catch(err => {
  console.error('Erro ao sincronizar o banco de dados:', err);
  process.exit(1);
});
