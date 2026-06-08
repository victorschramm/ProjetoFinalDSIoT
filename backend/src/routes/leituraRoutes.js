const express = require('express');
const router = express.Router();
const leituraController = require('../controllers/leituraController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/', leituraController.list);
router.get('/estatisticas', leituraController.getStatisticas);
router.get('/recentes', leituraController.getRecentes);
router.get('/sensor/:id_sensor/ultima', leituraController.getLatestBySensor);
router.get('/sensor/:id', leituraController.getBySensor);
router.get('/periodo', leituraController.getByPeriod);
router.get('/:id', leituraController.getById);
router.post('/', adminMiddleware, leituraController.create);
router.delete('/:id', adminMiddleware, leituraController.delete);

module.exports = router;