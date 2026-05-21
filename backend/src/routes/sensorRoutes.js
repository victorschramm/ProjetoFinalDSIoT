const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/', sensorController.list);
router.get('/:id', sensorController.getById);
router.post('/', adminMiddleware, sensorController.create);
router.put('/:id', adminMiddleware, sensorController.update);
router.delete('/:id', adminMiddleware, sensorController.delete);

module.exports = router;