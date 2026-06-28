const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { registerSchema, loginSchema } = require('../schemas/usuarioSchema');
const { enviarEmailRedefinicaoSenha } = require('../config/email');
const NotificationSettings = require('../models/NotificationSettings');
const { logAction } = require('../services/auditLogService');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

if (!process.env.JWT_SECRET) {
  console.error('⚠️  ALERTA: Variável JWT_SECRET não definida! Defina no arquivo .env');
}
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-padrao-dev-apenas';

module.exports = {
  async register(req, res) {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.issues.map(e => e.message)
      });
    }

    try {
      const { name, email, password, id_nivel_acesso, receberEmails } = result.data;

      const existingUsuario = await Usuario.findOne({ where: { email } });
      if (existingUsuario) return res.status(400).json({ error: 'Usuário já cadastrado' });

      // tipo_usuario sempre 'usuario' no auto-cadastro — promoção a admin só via painel admin
      const novoUsuario = await Usuario.create({ name, email, password, tipo_usuario: 'usuario', id_nivel_acesso });

      await NotificationSettings.create({
        id_usuario: novoUsuario.id,
        emailEnabled: receberEmails !== false,
        whatsappEnabled: false,
        email: novoUsuario.email,
        telefone: null
      });

      logAction({
        userId: novoUsuario.id,
        acao: 'CRIOU_USUARIO',
        entidade: 'USUARIO',
        entidadeId: novoUsuario.id,
        descricao: `Novo usuário registrado: "${novoUsuario.name}" (${novoUsuario.email}).`,
        origem: 'WEB'
      });

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        usuario: {
          id: novoUsuario.id,
          name: novoUsuario.name,
          email: novoUsuario.email,
          tipo_usuario: novoUsuario.tipo_usuario
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  async login(req, res) {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.issues.map(e => e.message)
      });
    }

    try {
      const { email, password } = result.data;
      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario || !(await usuario.checkPassword(password))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

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

  async forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    try {
      const usuario = await Usuario.findOne({ where: { email } });

      // Resposta genérica — não revela se o email existe ou não
      const resposta = { message: 'Se este email estiver cadastrado, você receberá as instruções em breve.' };

      if (!usuario) return res.json(resposta);

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await usuario.update({ reset_token: token, reset_token_expiry: expiry });

      await enviarEmailRedefinicaoSenha(email, token);

      res.json(resposta);
    } catch (error) {
      console.error('Erro no forgotPassword:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  },

  async resetPassword(req, res) {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    try {
      const usuario = await Usuario.findOne({ where: { reset_token: token } });

      if (!usuario) {
        return res.status(400).json({ error: 'Token inválido ou já utilizado' });
      }

      if (new Date() > new Date(usuario.reset_token_expiry)) {
        await usuario.update({ reset_token: null, reset_token_expiry: null });
        return res.status(400).json({ error: 'Token expirado. Solicite uma nova redefinição de senha.' });
      }

      await usuario.update({
        password: novaSenha,
        reset_token: null,
        reset_token_expiry: null
      });

      res.json({ message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
    } catch (error) {
      console.error('Erro no resetPassword:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
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
