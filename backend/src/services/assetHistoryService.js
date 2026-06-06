const AssetHistory = require('../models/AssetHistory');

// Serviço reutilizável para qualquer tipo de log/auditoria de ativo
async function logAssetEvent(deviceId, tipoEvento, descricao) {
  try {
    await AssetHistory.create({
      deviceId: String(deviceId),
      tipoEvento,
      descricao,
      dataEvento: new Date()
    });
    console.log(`[HISTÓRICO] ${tipoEvento} | device=${deviceId} | ${descricao}`);
  } catch (err) {
    console.error('Erro ao registrar histórico de ativo:', err.message);
  }
}

module.exports = { logAssetEvent };
