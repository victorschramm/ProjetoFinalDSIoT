const { Op } = require('sequelize');
const AssetHistory = require('../models/AssetHistory');

module.exports = {
  async getHistory(req, res) {
    try {
      const { deviceId } = req.params;
      const { tipoEvento, inicio, fim } = req.query;

      const where = { deviceId: String(deviceId) };

      if (tipoEvento) {
        where.tipoEvento = tipoEvento;
      }

      if (inicio || fim) {
        where.dataEvento = {};
        if (inicio) where.dataEvento[Op.gte] = new Date(inicio);
        if (fim) where.dataEvento[Op.lte] = new Date(fim);
      }

      const eventos = await AssetHistory.findAll({
        where,
        order: [['dataEvento', 'DESC']]
      });

      res.json(eventos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar histórico do ativo' });
    }
  }
};
