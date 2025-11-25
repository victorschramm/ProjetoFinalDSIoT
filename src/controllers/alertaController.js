const Alerta = require('../models/Alerta');

module.exports = {
  async create(req, res) {
    try {
      const { id_sensor, tipo, mensagem, nivel_severidade, valor_detectado, timestamp } = req.body;
      const alerta = await Alerta.create({
        id_sensor,
        tipo,
        mensagem,
        nivel_severidade,
        valor_detectado,
        timestamp,
        status: 'aberto'
      });
      res.status(201).json(alerta);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar alerta' });
    }
  },

  async list(req, res) {
    try {
      const alertas = await Alerta.findAll();
      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar alertas' });
    }
  },

  async getById(req, res) {
    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      res.json(alerta);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alerta' });
    }
  },

  async getBySensor(req, res) {
    try {
      const alertas = await Alerta.findAll({
        where: { id_sensor: req.params.id }
      });
      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alertas do sensor' });
    }
  },

  async getBySeveridade(req, res) {
    try {
      const alertas = await Alerta.findAll({
        where: { nivel_severidade: req.params.nivel }
      });
      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alertas por severidade' });
    }
  },

  async update(req, res) {
    try {
      const { status, resolucao } = req.body;
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      await alerta.update({ status, resolucao });
      res.json(alerta);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar alerta' });
    }
  },

  async delete(req, res) {
    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      await alerta.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar alerta' });
    }
  }
};