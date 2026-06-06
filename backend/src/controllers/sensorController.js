const Sensor = require('../models/Sensor');
const { logAction } = require('../services/auditLogService');

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
      logAction({
        userId: req.user?.id,
        acao: 'CRIOU_SENSOR',
        entidade: 'SENSOR',
        entidadeId: sensor.id,
        descricao: `Sensor "${sensor.nome}" (${sensor.tipo}) criado.`,
        origem: 'WEB'
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
      const statusAnterior = sensor.status;
      await sensor.update({
        nome,
        tipo,
        modelo,
        descricao,
        id_ambiente,
        id_dispositivo: id_dispositivo || null,
        status
      });
      if (status && status !== statusAnterior) {
        logAction({
          userId: req.user?.id,
          acao: 'ALTEROU_STATUS_SENSOR',
          entidade: 'SENSOR',
          entidadeId: sensor.id,
          descricao: `Sensor "${sensor.nome}" alterado de "${statusAnterior}" para "${status}".`,
          origem: 'WEB'
        });
      } else {
        logAction({
          userId: req.user?.id,
          acao: 'EDITOU_SENSOR',
          entidade: 'SENSOR',
          entidadeId: sensor.id,
          descricao: `Sensor "${sensor.nome}" atualizado.`,
          origem: 'WEB'
        });
      }
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
      const nomeSensor = sensor.nome;
      await sensor.destroy();
      logAction({
        userId: req.user?.id,
        acao: 'EXCLUIU_SENSOR',
        entidade: 'SENSOR',
        entidadeId: parseInt(req.params.id),
        descricao: `Sensor "${nomeSensor}" excluído do sistema.`,
        origem: 'WEB'
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar sensor' });
    }
  }
};