const express = require('express');
const router = express.Router();
const { getHistory, registrarFalhaManual, getMTBF } = require('../controllers/assetHistoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:deviceId/history', authMiddleware, getHistory);
router.post('/:deviceId/history', authMiddleware, registrarFalhaManual);
router.get('/:deviceId/mtbf', authMiddleware, getMTBF);

module.exports = router;
