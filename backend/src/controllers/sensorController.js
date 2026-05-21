const Sensor = require('../models/Sensor');

module.exports = {
  async create(req, res) {
    try {
      const { nome, tipo, modelo, descricao, id_ambiente, id_dispositivo, status } = req.body;
      const sensor = await Sensor.create({
        nome,
        tipo,
        modelo,
        descricao,
        id_ambiente,
        id_dispositivo: id_dispositivo || null,
        status: status || 'ativo'
      });
      res.status(201).json(sensor);
    } catch (error) {
      console.error('Erro ao criar sensor:', error);
      res.status(500).json({ error: 'Erro ao criar sensor' });
    }
  },

  async list(req, res) {
    try {
      const sensores = await Sensor.findAll({
        order: [['createdAt', 'DESC']]
      });
      res.json(sensores);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar sensores' });
    }
  },

  async getById(req, res) {
    try {
      const sensor = await Sensor.findByPk(req.params.id);
      if (!sensor) {
        return res.status(404).json({ error: 'Sensor não encontrado' });
      }
      res.json(sensor);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar sensor' });
    }
  },

  async update(req, res) {
    try {
      const { nome, tipo, modelo, descricao, id_ambiente, id_dispositivo, status } = req.body;
      const sensor = await Sensor.findByPk(req.params.id);
      if (!sensor) {
        return res.status(404).json({ error: 'Sensor não encontrado' });
      }
      await sensor.update({
        nome,
        tipo,
        modelo,
        descricao,
        id_ambiente,
        id_dispositivo: id_dispositivo || null,
        status
      });
      res.json(sensor);
    } catch (error) {
      console.error('Erro ao atualizar sensor:', error);
      res.status(500).json({ error: 'Erro ao atualizar sensor' });
    }
  },

  async delete(req, res) {
    try {
      const sensor = await Sensor.findByPk(req.params.id);
      if (!sensor) {
        return res.status(404).json({ error: 'Sensor não encontrado' });
      }
      await sensor.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar sensor' });
    }
  }
};