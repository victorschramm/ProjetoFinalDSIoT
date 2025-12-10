const Leitura = require('../models/Leitura');
const Sensor = require('../models/Sensor');
const { Op } = require('sequelize');

module.exports = {
  async create(req, res) {
    try {
      const { id_sensor, valor, tipo_leitura, timestamp, unidade } = req.body;
      const leitura = await Leitura.create({
        id_sensor,
        valor,
        tipo_leitura,
        unidade,
        timestamp: timestamp || new Date()
      });
      res.status(201).json(leitura);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar leitura' });
    }
  },

  async list(req, res) {
    try {
      const leituras = await Leitura.findAll({
        include: [{ association: 'sensor', attributes: ['id', 'nome', 'tipo'] }],
        order: [['timestamp', 'DESC']],
        limit: 100
      });
      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar leituras' });
    }
  },

  async getById(req, res) {
    try {
      const leitura = await Leitura.findByPk(req.params.id, {
        include: [{ association: 'sensor', attributes: ['id', 'nome', 'tipo'] }]
      });
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
      const { limite = 50, tipo } = req.query;
      const where = { id_sensor: req.params.id };
      
      if (tipo) {
        where.tipo_leitura = tipo;
      }

      const leituras = await Leitura.findAll({
        where,
        include: [{ association: 'sensor', attributes: ['id', 'nome', 'tipo'] }],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limite)
      });
      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar leituras do sensor' });
    }
  },

  async getByPeriod(req, res) {
    try {
      const { inicio, fim, id_sensor } = req.query;
      const where = {
        timestamp: {
          [Op.between]: [new Date(inicio), new Date(fim)]
        }
      };

      if (id_sensor) {
        where.id_sensor = id_sensor;
      }

      const leituras = await Leitura.findAll({
        where,
        include: [{ association: 'sensor', attributes: ['id', 'nome', 'tipo'] }],
        order: [['timestamp', 'DESC']]
      });
      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar leituras por período' });
    }
  },

  async getLatestBySensor(req, res) {
    try {
      const { id_sensor } = req.params;
      const leituras = await Leitura.findAll({
        where: { id_sensor },
        attributes: ['id', 'valor', 'tipo_leitura', 'unidade', 'timestamp'],
        order: [['timestamp', 'DESC']],
        limit: 1,
        raw: true
      });
      res.json(leituras[0] || null);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar última leitura' });
    }
  },

  async getStatisticas(req, res) {
    try {
      const { id_sensor, tipo_leitura, inicio, fim } = req.query;
      const where = {};

      if (id_sensor) where.id_sensor = id_sensor;
      if (tipo_leitura) where.tipo_leitura = tipo_leitura;
      
      if (inicio && fim) {
        where.timestamp = {
          [Op.between]: [new Date(inicio), new Date(fim)]
        };
      }

      const leituras = await Leitura.findAll({ where });

      if (leituras.length === 0) {
        return res.json({ mensagem: 'Nenhuma leitura encontrada', dados: null });
      }

      const valores = leituras.map(l => l.valor);
      const stats = {
        total: leituras.length,
        media: (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2),
        minimo: Math.min(...valores).toFixed(2),
        maximo: Math.max(...valores).toFixed(2),
        primeira: leituras[leituras.length - 1].timestamp,
        ultima: leituras[0].timestamp
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular estatísticas' });
    }
  },

  async getRecentes(req, res) {
    try {
      const { minutos = 60 } = req.query;
      const dataLimite = new Date(Date.now() - minutos * 60 * 1000);

      const leituras = await Leitura.findAll({
        where: {
          timestamp: { [Op.gte]: dataLimite }
        },
        include: [{ association: 'sensor', attributes: ['id', 'nome', 'tipo'] }],
        order: [['timestamp', 'DESC']]
      });

      res.json(leituras);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar leituras recentes' });
    }
  },

  async delete(req, res) {
    try {
      const leitura = await Leitura.findByPk(req.params.id);
      if (!leitura) {
        return res.status(404).json({ error: 'Leitura não encontrada' });
      }
      await leitura.destroy();
      res.json({ mensagem: 'Leitura deletada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar leitura' });
    }
  }
};