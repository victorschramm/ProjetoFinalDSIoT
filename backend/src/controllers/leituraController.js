const Leitura = require('../models/Leitura');
const { Op } = require('sequelize');

module.exports = {
  async create(req, res) {
    try {
      const { id_sensor, valor, tipo_leitura, timestamp } = req.body;
      const leitura = await Leitura.create({
        id_sensor,
        valor,
        tipo_leitura,
        timestamp: timestamp || new Date()
      });
      res.status(201).json(leitura);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar leitura' });
    }
  },

  async list(req, res) {
    try {
      const leituras = await Leitura.findAll();
      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar leituras' });
    }
  },

  async getById(req, res) {
    try {
      const leitura = await Leitura.findByPk(req.params.id);
      if (!leitura) {
        return res.status(404).json({ error: 'Leitura não encontrada' });
      }
      res.json(leitura);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar leitura' });
    }
  },

  async getBySensor(req, res) {
    try {
      const leituras = await Leitura.findAll({
        where: { id_sensor: req.params.id }
      });
      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar leituras do sensor' });
    }
  },

  async getByPeriod(req, res) {
    try {
      const { inicio, fim } = req.query;
      const leituras = await Leitura.findAll({
        where: {
          timestamp: {
            [Op.between]: [new Date(inicio), new Date(fim)]
          }
        }
      });
      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar leituras por período' });
    }
  }
};