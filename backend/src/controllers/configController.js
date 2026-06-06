const { publicarMensagem, getMQTTClient } = require('../config/mqtt');

let currentInterval = 30000; // padrão igual ao firmware

async function getSensorInterval(req, res) {
  res.json({ interval: currentInterval });
}

async function setSensorInterval(req, res) {
  const ms = parseInt(req.body.interval, 10);
  if (!ms || ms < 5000 || ms > 600000) {
    return res.status(400).json({ error: 'Intervalo inválido. Use entre 5000 e 600000 ms.' });
  }

  currentInterval = ms;

  const mqttClient = getMQTTClient();
  if (mqttClient && mqttClient.connected) {
    try {
      await publicarMensagem('manutai/config', String(ms));
      console.log(`⚙️  Intervalo do sensor atualizado para ${ms / 1000}s via MQTT`);
    } catch (err) {
      console.warn('⚠️  MQTT indisponível para envio de config:', err.message);
    }
  } else {
    console.warn('⚠️  MQTT não conectado — intervalo salvo mas não enviado ao ESP');
  }

  res.json({ interval: currentInterval });
}

module.exports = { getSensorInterval, setSensorInterval };
