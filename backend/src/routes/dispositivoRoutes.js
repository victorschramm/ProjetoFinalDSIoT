const express = require('express');
const router = express.Router();
const dispositivoController = require('../controllers/dispositivoController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// CRUD de dispositivos
// IMPORTANTE: Rotas específicas devem vir antes de rotas com parâmetros
router.get('/ativos', dispositivoController.getAtivos);
router.get('/', dispositivoController.list);
router.get('/:id', dispositivoController.getById);
router.post('/', dispositivoController.create);
router.put('/:id', dispositivoController.update);
router.delete('/:id', dispositivoController.delete);

module.exports = router;
