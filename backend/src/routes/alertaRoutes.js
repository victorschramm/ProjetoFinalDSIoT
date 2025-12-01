const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protege todas as rotas

router.post('/', alertaController.create);
router.get('/', alertaController.list);
router.get('/:id', alertaController.getById);
router.get('/sensor/:id', alertaController.getBySensor);
router.get('/severidade/:nivel', alertaController.getBySeveridade);
router.put('/:id', alertaController.update);
router.delete('/:id', alertaController.delete);

module.exports = router;