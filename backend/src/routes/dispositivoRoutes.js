const express = require('express');
const router = express.Router();
const dispositivoController = require('../controllers/dispositivoController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/ativos', dispositivoController.getAtivos);
router.get('/', dispositivoController.list);
router.get('/:id', dispositivoController.getById);
router.post('/', adminMiddleware, dispositivoController.create);
router.put('/:id', adminMiddleware, dispositivoController.update);
router.delete('/:id', adminMiddleware, dispositivoController.delete);
router.post('/:id/publicar', adminMiddleware, dispositivoController.publicar);

module.exports = router;
