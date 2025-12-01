const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 1, // praticamente sem espera
  max: 1000, // limite muito alto
  message: {
    error: 'Limite de requisições atingido'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = authLimiter;