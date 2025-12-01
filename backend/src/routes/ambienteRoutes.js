const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protege todas as rotas

router.post('/', ambienteController.create);
router.get('/', ambienteController.list);
router.get('/:id', ambienteController.getById);
router.put('/:id', ambienteController.update);
router.delete('/:id', ambienteController.delete);

module.exports = router;