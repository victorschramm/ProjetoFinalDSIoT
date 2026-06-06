const mqtt = require("mqtt");
const Leitura = require("./src/models/Leitura");
const Sensor = require("./src/models/Sensor");
const Dispositivo = require("./src/models/Dispositivo");

const client = mqtt.connect("mqtts://c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud:8883", {
  username: "admin",
  password: "Admin123"
});

client.on("connect", () => {
  console.log("✅ Conectado ao HiveMQ");
  client.subscribe("manutai/leitura");
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📡 Recebido:", data);

    // Validar id_sensor
    const sensor = await Sensor.findByPk(data.id_sensor);
    if (!sensor) {
      console.warn(`⚠️  Sensor com id ${data.id_sensor} não encontrado`);
      return;
    }

    // Salvar leitura conforme formato recebido
    await Leitura.create({
      id_sensor: data.id_sensor,
      valor: data.valor,
      tipo_leitura: data.tipo_leitura,
      timestamp: new Date(data.timestamp)
    });

    console.log(`💾 Leitura salva: ${data.tipo_leitura}=${data.valor} (sensor ${data.id_sensor})`);

    // Atualizar última conexão do dispositivo
    const dispositivo = await Dispositivo.findOne({ where: { topico_mqtt: topic } });
    if (dispositivo) {
      await dispositivo.update({ ultima_conexao: new Date(), status: 'ativo' });
    }

  } catch (error) {
    console.error("❌ Erro ao salvar:", error.message);
  }
});

client.on("error", (error) => {
  console.error("❌ Erro MQTT:", error);
});

module.exports = client;