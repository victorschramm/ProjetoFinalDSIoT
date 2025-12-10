const express = require('express');
const router = express.Router();
const leituraController = require('../controllers/leituraController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protege todas as rotas

router.post('/', leituraController.create);
router.get('/', leituraController.list);
router.get('/estatisticas', leituraController.getStatisticas);
router.get('/recentes', leituraController.getRecentes);
router.get('/sensor/:id_sensor/ultima', leituraController.getLatestBySensor);
router.get('/sensor/:id', leituraController.getBySensor);
router.get('/periodo', leituraController.getByPeriod);
router.get('/:id', leituraController.getById);
router.delete('/:id', leituraController.delete);

module.exports = router;