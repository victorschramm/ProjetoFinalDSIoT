/**
 * =============================================================================
 * MIDDLEWARE DE VERIFICAÇÃO DE ADMIN
 * =============================================================================
 * 
 * Este middleware verifica se o usuário autenticado é um administrador.
 * Deve ser usado APÓS o authMiddleware.
 * 
 * Uso: router.use(authMiddleware, adminMiddleware)
 * 
 * =============================================================================
 */

const Usuario = require('../models/Usuario');

const adminMiddleware = async (req, res, next) => {
  try {
    // O authMiddleware já colocou req.user com o id do usuário
    const usuario = await Usuario.findByPk(req.user.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verifica se o tipo de usuário é 'admin'
    if (usuario.tipo_usuario !== 'admin') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
      });
    }

    // Adiciona dados do usuário ao request para uso posterior
    req.usuario = usuario;
    
    next();
  } catch (error) {
    console.error('Erro no adminMiddleware:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

module.exports = adminMiddleware;
