const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Todas as rotas requerem autenticação e permissão de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Listar todos os usuários
router.get('/', usuarioController.list);

// Obter usuário por ID
router.get('/:id', usuarioController.getById);

// Atualizar usuário
router.put('/:id', usuarioController.update);

// Deletar usuário
router.delete('/:id', usuarioController.delete);

module.exports = router;
