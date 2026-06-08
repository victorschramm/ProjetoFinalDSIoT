// Serviço reutilizável para contagem de horas de operação de qualquer ativo
const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const Sensor = require('../models/Sensor');
const { logAssetEvent } = require('./assetHistoryService');
const { sendAlert } = require('./notificationService');

// Incrementa horas operadas apenas para sensores configurados manualmente pelo operador.
// Chamado a cada mensagem MQTT recebida do sensor.
async function updateOperatingHours(deviceId) {
  try {
    const record = await PreventiveMaintenance.findOne({ where: { deviceId } });

    // Só rastreia sensores que o operador configurou explicitamente
    if (!record) return;

    const agora = new Date();
    const diffMs = agora - new Date(record.ultimaAtualizacao);
    const diffHoras = diffMs / (1000 * 60 * 60);

    // Ignora incrementos inválidos: negativos ou maiores que 24h (ex: servidor reiniciado)
    if (diffHoras <= 0 || diffHoras > 24) {
      await record.update({ ultimaAtualizacao: agora });
      return;
    }

    const novasHoras = record.horasOperadas + diffHoras;
    const novoStatus = novasHoras >= record.limiteHoras ? 'MANUTENCAO_PENDENTE' : 'OK';

    const limiteAtingidoAgora = record.status === 'OK' && novoStatus === 'MANUTENCAO_PENDENTE';

    await record.update({
      horasOperadas: novasHoras,
      ultimaAtualizacao: agora,
      status: novoStatus
    });

    // Gera evento e envia e-mail apenas na primeira vez que o limite é atingido
    if (limiteAtingidoAgora) {
      const sensor = await Sensor.findByPk(deviceId);
      const nomeSensor = sensor ? sensor.nome : `Sensor #${deviceId}`;
      const mensagem = `Manutenção preventiva necessária: ${record.descricao} (${novasHoras.toFixed(1)}h operadas / limite: ${record.limiteHoras}h)`;

      console.log(`[MANUTENCAO_PREVENTIVA] ${nomeSensor}: ${mensagem}`);
      logAssetEvent(deviceId, 'MANUTENCAO_PREVENTIVA', mensagem).catch(() => {});

      sendAlert({
        assunto: `[ManutAI] Manutenção Preventiva: ${nomeSensor}`,
        mensagem: `O sensor <strong>${nomeSensor}</strong> atingiu o limite de horas de operação configurado pelo operador.<br><br>` +
          `<strong>Manutenção necessária:</strong> ${record.descricao}<br>` +
          `<strong>Horas operadas:</strong> ${novasHoras.toFixed(1)}h<br>` +
          `<strong>Limite configurado:</strong> ${record.limiteHoras}h<br><br>` +
          `Acesse o sistema para registrar a manutenção realizada e resetar o contador.`
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Erro ao atualizar horas de operação:', err.message);
  }
}

module.exports = { updateOperatingHours };
