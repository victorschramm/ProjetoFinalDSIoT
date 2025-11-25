const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const authLimiter = require('../middleware/rateLimiter');
const validateFields = require('../middleware/validateFields');

router.post('/register', 
  validateFields(['name', 'email', 'password', 'tipo_usuario']),
  authController.register
);

router.post('/login', 
  validateFields(['email', 'password']),
  authController.login
);

router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
