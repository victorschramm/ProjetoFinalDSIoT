const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/', alertaController.list);
router.get('/sensor/:id', alertaController.getBySensor);
router.get('/severidade/:nivel', alertaController.getBySeveridade);
router.get('/:id', alertaController.getById);
router.put('/:id', alertaController.update);          // usuário comum pode atualizar status
router.post('/', adminMiddleware, alertaController.create);
router.delete('/:id', adminMiddleware, alertaController.delete);

module.exports = router;