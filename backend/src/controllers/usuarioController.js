const Usuario = require('../models/Usuario');

module.exports = {
  // Listar todos os usuários (apenas admin)
  async list(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'name', 'email', 'tipo_usuario', 'id_nivel_acesso', 'createdAt', 'updatedAt'],
        order: [['id', 'ASC']]
      });
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },

  // Obter usuário por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByPk(id, {
        attributes: ['id', 'name', 'email', 'tipo_usuario', 'id_nivel_acesso', 'createdAt', 'updatedAt']
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(usuario);
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      res.status(500).json({ error: 'Erro ao obter usuário' });
    }
  },

  // Atualizar usuário (admin pode alterar tipo_usuario e nivel_acesso)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, tipo_usuario, id_nivel_acesso } = req.body;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir que o admin altere a si mesmo para usuário comum
      if (req.user.id === parseInt(id) && tipo_usuario === 'usuario') {
        return res.status(400).json({ error: 'Você não pode rebaixar a si mesmo' });
      }

      // Atualizar campos
      if (name) usuario.name = name;
      if (email) usuario.email = email;
      if (tipo_usuario) usuario.tipo_usuario = tipo_usuario;
      if (id_nivel_acesso !== undefined) usuario.id_nivel_acesso = id_nivel_acesso;

      await usuario.save();

      res.json({ 
        message: 'Usuário atualizado com sucesso',
        usuario: {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario,
          id_nivel_acesso: usuario.id_nivel_acesso
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Este email já está em uso' });
      }
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  },

  // Deletar usuário
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Não permitir que o admin delete a si mesmo
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'Você não pode deletar a si mesmo' });
      }

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await usuario.destroy();

      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  }
};
