const NivelAcesso = require('../models/NivelAcesso');

module.exports = {
  async create(req, res) {
    try {
      const { nome, descricao, nivel } = req.body;
      const nivelAcesso = await NivelAcesso.create({ nome, descricao, nivel });
      res.status(201).json(nivelAcesso);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar nível de acesso' });
    }
  },

  async list(req, res) {
    try {
      const niveisAcesso = await NivelAcesso.findAll();
      res.json(niveisAcesso);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar níveis de acesso' });
    }
  },

  async getById(req, res) {
    try {
      const nivelAcesso = await NivelAcesso.findByPk(req.params.id);
      if (!nivelAcesso) {
        return res.status(404).json({ error: 'Nível de acesso não encontrado' });
      }
      res.json(nivelAcesso);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar nível de acesso' });
    }
  },

  async update(req, res) {
    try {
      const { nome, descricao } = req.body;
      const nivelAcesso = await NivelAcesso.findByPk(req.params.id);
      if (!nivelAcesso) {
        return res.status(404).json({ error: 'Nível de acesso não encontrado' });
      }
      await nivelAcesso.update({ nome, descricao });
      res.json(nivelAcesso);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar nível de acesso' });
    }
  },

  async delete(req, res) {
    try {
      const nivelAcesso = await NivelAcesso.findByPk(req.params.id);
      if (!nivelAcesso) {
        return res.status(404).json({ error: 'Nível de acesso não encontrado' });
      }
      await nivelAcesso.destroy();
      return res.status(404).json({ error: 'Nível de acesso DELETADO' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar nível de acesso' });
    }
  }
};