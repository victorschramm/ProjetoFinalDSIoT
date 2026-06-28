const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const authMiddleware = require('../middleware/authMiddleware');
const chatbotController = require('../controllers/chatbotController');

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas mensagens em pouco tempo. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false
});

const chatSchema = z.object({
  mensagem: z.string().min(1, 'Mensagem não pode ser vazia').max(1000, 'Mensagem muito longa (máx. 1000 caracteres)'),
  historico: z.array(z.any()).optional().default([])
});

function validateChat(req, res, next) {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Dados inválidos',
      detalhes: result.error.issues.map(e => e.message)
    });
  }
  req.body = result.data;
  next();
}

router.use(authMiddleware);
router.post('/chat', chatLimiter, validateChat, chatbotController.chat);

module.exports = router;
