const rateLimit = require('express-rate-limit');

// Rate limiter para endpoints de autenticação (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas por janela
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter geral para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: {
    error: 'Limite de requisições atingido. Tente novamente em instantes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter };