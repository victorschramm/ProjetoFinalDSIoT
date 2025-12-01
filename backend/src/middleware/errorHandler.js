const { ValidationError } = require('sequelize');

module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // Erros de validação do Sequelize
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.errors.map(error => ({
        message: error.message,
        field: error.path
      }))
    });
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  // Erros personalizados da aplicação
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erro genérico do servidor
  return res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};