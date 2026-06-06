const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Logs só podem ser lidos — nenhuma rota de escrita, edição ou exclusão
router.get('/', authMiddleware, adminMiddleware, auditLogController.list);

module.exports = router;
