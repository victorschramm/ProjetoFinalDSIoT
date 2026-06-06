const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/assetHistoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:deviceId/history', authMiddleware, getHistory);

module.exports = router;
