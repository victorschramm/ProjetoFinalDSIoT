const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const validateFields = require('../middleware/validateFields');

router.post('/register', 
  authLimiter,
  validateFields(['name', 'email', 'password', 'tipo_usuario']),
  authController.register
);

router.post('/login', 
  authLimiter,
  validateFields(['email', 'password']),
  authController.login
);

router.get('/profile', authMiddleware, authController.profile);

router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
