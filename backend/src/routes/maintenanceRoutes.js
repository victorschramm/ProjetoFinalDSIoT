const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/preventiveMaintenanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Todos os usuários autenticados podem visualizar e alterar (sem restrição por perfil)
router.use(authMiddleware);

router.get('/', maintenanceController.list);
router.post('/', maintenanceController.create);
router.put('/:deviceId', maintenanceController.update);
router.post('/reset/:deviceId', maintenanceController.reset);

module.exports = router;
