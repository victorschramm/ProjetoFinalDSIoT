/**
 * =============================================================================
 * ROTAS DE NÍVEIS DE ACESSO
 * =============================================================================
 * 
 * Todas as rotas exigem:
 * 1. Autenticação (token JWT válido)
 * 2. Permissão de administrador (tipo_usuario = 'admin')
 * 
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const nivelAcessoController = require('../controllers/nivelAcessoController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protege todas as rotas: requer autenticação + permissão de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// CRUD de Níveis de Acesso (apenas admin)
router.post('/', nivelAcessoController.create);      // Criar
router.get('/', nivelAcessoController.list);         // Listar todos
router.get('/:id', nivelAcessoController.getById);   // Buscar por ID
router.put('/:id', nivelAcessoController.update);    // Atualizar
router.delete('/:id', nivelAcessoController.delete); // Deletar

module.exports = router;