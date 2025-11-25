const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protege todas as rotas

router.post('/', sensorController.create);
router.get('/', sensorController.list);
router.get('/:id', sensorController.getById);
router.put('/:id', sensorController.update);
router.delete('/:id', sensorController.delete);

module.exports = router;