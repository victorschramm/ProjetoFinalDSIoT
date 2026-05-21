const Ambiente = require('../models/Ambiente');

module.exports = {
  async create(req, res) {
    try {
      const { nome, descricao, localizacao, temperatura_ideal, umidade_ideal } = req.body;
      const ambiente = await Ambiente.create({
        nome,
        descricao,
        localizacao,
        temperatura_ideal,
        umidade_ideal
      });
      res.status(201).json(ambiente);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar ambiente' });
    }
  },

  async list(req, res) {
    try {
      const ambientes = await Ambiente.findAll();
      res.json(ambientes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar ambientes' });
    }
  },

  async getById(req, res) {
    try {
      const ambiente = await Ambiente.findByPk(req.params.id);
      if (!ambiente) {
        return res.status(404).json({ error: 'Ambiente não encontrado' });
      }
      res.json(ambiente);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar ambiente' });
    }
  },

  async update(req, res) {
    try {
      const { nome, descricao, localizacao, temperatura_ideal, umidade_ideal } = req.body;
      const ambiente = await Ambiente.findByPk(req.params.id);
      if (!ambiente) {
        return res.status(404).json({ error: 'Ambiente não encontrado' });
      }
      await ambiente.update({
        nome,
        descricao,
        localizacao,
        temperatura_ideal,
        umidade_ideal
      });
      res.json(ambiente);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar ambiente' });
    }
  },

  async delete(req, res) {
    try {
      const ambiente = await Ambiente.findByPk(req.params.id);
      if (!ambiente) {
        return res.status(404).json({ error: 'Ambiente não encontrado' });
      }
      await ambiente.destroy();
      res.json({ message: 'Ambiente deletado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar ambiente' });
    }
  }
};