const { Op } = require('sequelize');
const AuditLog = require('../models/AuditLog');

module.exports = {
  async list(req, res) {
    try {
      const { userId, entidade, acao, dataInicio, dataFim, page = 1, limit = 50 } = req.query;

      const where = {};

      if (userId) where.userId = parseInt(userId);
      if (entidade) where.entidade = entidade;
      if (acao) where.acao = acao;

      if (dataInicio || dataFim) {
        where.dataAcao = {};
        if (dataInicio) where.dataAcao[Op.gte] = new Date(dataInicio);
        if (dataFim) {
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999);
          where.dataAcao[Op.lte] = fim;
        }
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const [total, logs] = await Promise.all([
        AuditLog.count({ where }),
        AuditLog.findAll({
          where,
          order: [['dataAcao', 'DESC']],
          limit: limitNum,
          offset
        })
      ]);

      res.json({
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        logs
      });
    } catch (error) {
      console.error('Erro ao listar audit logs:', error.message);
      if (error.name === 'SequelizeDatabaseError') {
        return res.status(503).json({ error: `Erro no banco de dados: ${error.message}` });
      }
      res.status(500).json({ error: error.message || 'Erro ao listar histórico de ações' });
    }
  }
};
