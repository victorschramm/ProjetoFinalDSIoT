const AuditLog = require('../models/AuditLog');

// Serviço desacoplado para reutilização em qualquer projeto
async function logAction({ userId, acao, entidade, entidadeId, descricao, origem = 'WEB' }) {
  try {
    await AuditLog.create({
      userId: userId || null,
      acao,
      entidade,
      entidadeId: entidadeId || null,
      descricao: descricao || null,
      origem,
      dataAcao: new Date()
    });
  } catch (err) {
    console.error('[AUDITORIA] Falha ao registrar ação:', err.message);
  }
}

module.exports = { logAction };
