/**
 * =============================================================================
 * CONTROLLER DE NÍVEIS DE ACESSO
 * =============================================================================
 * 
 * CRUD completo para gerenciamento de níveis de acesso.
 * Apenas administradores podem acessar estas operações.
 * 
 * Endpoints:
 * - POST   /api/niveis-acesso     - Criar novo nível
 * - GET    /api/niveis-acesso     - Listar todos
 * - GET    /api/niveis-acesso/:id - Buscar por ID
 * - PUT    /api/niveis-acesso/:id - Atualizar
 * - DELETE /api/niveis-acesso/:id - Deletar
 * 
 * =============================================================================
 */

const NivelAcesso = require('../models/NivelAcesso');

module.exports = {
  /**
   * CREATE - Criar novo nível de acesso
   * POST /api/niveis-acesso
   * Body: { nome, descricao, nivel }
   */
  async create(req, res) {
    try {
      const { nome, descricao, nivel } = req.body;

      // Validação básica
      if (!nome || !descricao || nivel === undefined) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: nome, descricao, nivel' 
        });
      }

      const nivelAcesso = await NivelAcesso.create({ nome, descricao, nivel });
      res.status(201).json({ 
        message: 'Nível de acesso criado com sucesso',
        nivelAcesso 
      });
    } catch (error) {
      console.error('Erro ao criar nível de acesso:', error);
      res.status(500).json({ error: 'Erro ao criar nível de acesso' });
    }
  },

  /**
   * READ - Listar todos os níveis de acesso
   * GET /api/niveis-acesso
   */
  async list(req, res) {
    try {
      const niveisAcesso = await NivelAcesso.findAll({
        order: [['nivel', 'ASC']] // Ordena por nível
      });
      res.json(niveisAcesso);
    } catch (error) {
      console.error('Erro ao listar níveis de acesso:', error);
      res.status(500).json({ error: 'Erro ao listar níveis de acesso' });
    }
  },

  /**
   * READ - Buscar nível de acesso por ID
   * GET /api/niveis-acesso/:id
   */
  async getById(req, res) {
    try {
      const nivelAcesso = await NivelAcesso.findByPk(req.params.id);
      if (!nivelAcesso) {
        return res.status(404).json({ error: 'Nível de acesso não encontrado' });
      }
      res.json(nivelAcesso);
    } catch (error) {
      console.error('Erro ao buscar nível de acesso:', error);
      res.status(500).json({ error: 'Erro ao buscar nível de acesso' });
    }
  },

  /**
   * UPDATE - Atualizar nível de acesso
   * PUT /api/niveis-acesso/:id
   * Body: { nome?, descricao?, nivel? }
   */
  async update(req, res) {
    try {
      const { nome, descricao, nivel } = req.body;
      const nivelAcesso = await NivelAcesso.findByPk(req.params.id);
      
      if (!nivelAcesso) {
        return res.status(404).json({ error: 'Nível de acesso não encontrado' });
      }

      // Atualiza apenas os campos fornecidos
      const updateData = {};
      if (nome !== undefined) updateData.nome = nome;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (nivel !== undefined) updateData.nivel = nivel;

      await nivelAcesso.update(updateData);
      
      res.json({ 
        message: 'Nível de acesso atualizado com sucesso',
        nivelAcesso 
      });
    } catch (error) {
      console.error('Erro ao atualizar nível de acesso:', error);
      res.status(500).json({ error: 'Erro ao atualizar nível de acesso' });
    }
  },

  /**
   * DELETE - Deletar nível de acesso
   * DELETE /api/niveis-acesso/:id
   */
  async delete(req, res) {
    try {
      const nivelAcesso = await NivelAcesso.findByPk(req.params.id);
      
      if (!nivelAcesso) {
        return res.status(404).json({ error: 'Nível de acesso não encontrado' });
      }

      const nomeNivel = nivelAcesso.nome;
      await nivelAcesso.destroy();
      
      res.json({ 
        message: `Nível de acesso "${nomeNivel}" deletado com sucesso` 
      });
    } catch (error) {
      console.error('Erro ao deletar nível de acesso:', error);
      res.status(500).json({ error: 'Erro ao deletar nível de acesso' });
    }
  }
};