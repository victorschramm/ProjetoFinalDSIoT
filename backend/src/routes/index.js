const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const ambienteRoutes = require('./ambienteRoutes');
const sensorRoutes = require('./sensorRoutes');
const leituraRoutes = require('./leituraRoutes');
const alertaRoutes = require('./alertaRoutes');
const nivelAcessoRoutes = require('./nivelAcessoRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const dispositivoRoutes = require('./dispositivoRoutes');

// Rotas de autenticação (register, login, profile)
router.use('/', authRoutes);

// Rotas de recursos (protegidas por authMiddleware internamente)
router.use('/ambientes', ambienteRoutes);
router.use('/sensores', sensorRoutes);
router.use('/leituras', leituraRoutes);
router.use('/alertas', alertaRoutes);
router.use('/niveis-acesso', nivelAcessoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/dispositivos', dispositivoRoutes);

module.exports = router;