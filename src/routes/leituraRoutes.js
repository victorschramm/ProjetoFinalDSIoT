const express = require('express');
const router = express.Router();
const leituraController = require('../controllers/leituraController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protege todas as rotas

router.post('/', leituraController.create);
router.get('/', leituraController.list);
router.get('/:id', leituraController.getById);
router.get('/sensor/:id', leituraController.getBySensor);
router.get('/periodo', leituraController.getByPeriod);

module.exports = router;