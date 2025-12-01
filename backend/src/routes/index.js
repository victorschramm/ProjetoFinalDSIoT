const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const ambienteRoutes = require('./ambienteRoutes');
const sensorRoutes = require('./sensorRoutes');
const leituraRoutes = require('./leituraRoutes');
const alertaRoutes = require('./alertaRoutes');
const nivelAcessoRoutes = require('./nivelAcessoRoutes');
const usuarioRoutes = require('./usuarioRoutes');

router.use('/auth', authRoutes);
router.use('/ambientes', ambienteRoutes);
router.use('/sensores', sensorRoutes);
router.use('/leituras', leituraRoutes);
router.use('/alertas', alertaRoutes);
router.use('/niveis-acesso', nivelAcessoRoutes);
router.use('/usuarios', usuarioRoutes);

module.exports = router;