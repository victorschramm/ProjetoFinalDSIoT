const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'segredo123';

module.exports = {
  async register(req, res) {
    try {
      const { name, email, password, tipo_usuario, id_nivel_acesso } = req.body;

      const existingUsuario = await Usuario.findOne({ where: { email } });
      if (existingUsuario) return res.status(400).json({ error: 'Usuário já cadastrado' });

      const novoUsuario = await Usuario.create({ 
        name, 
        email, 
        password,
        tipo_usuario,
        id_nivel_acesso
      });
      res.status(201).json({ message: 'Usuário criado com sucesso', usuario: novoUsuario });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario || !(await usuario.checkPassword(password))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ 
        id: usuario.id, 
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario 
      }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        message: 'Login realizado com sucesso', 
        token,
        usuario: {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro no login' });
    }
  },

  async profile(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.user.id, { 
        attributes: ['id', 'name', 'email', 'tipo_usuario'] 
      });
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(usuario);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao obter perfil' });
    }
  }
};
