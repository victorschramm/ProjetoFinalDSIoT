const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/', ambienteController.list);
router.get('/:id', ambienteController.getById);
router.post('/', adminMiddleware, ambienteController.create);
router.put('/:id', adminMiddleware, ambienteController.update);
router.delete('/:id', adminMiddleware, ambienteController.delete);

module.exports = router;