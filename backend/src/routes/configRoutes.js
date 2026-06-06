const express = require('express');
const router = express.Router();
const { getSensorInterval, setSensorInterval } = require('../controllers/configController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/sensor-interval', authMiddleware, getSensorInterval);
router.put('/sensor-interval', authMiddleware, setSensorInterval);

module.exports = router;
