const { Op } = require('sequelize');
const AssetHistory = require('../models/AssetHistory');
const Sensor = require('../models/Sensor');
const { chaveHistorico, calcularMTBFDispositivo } = require('../services/mtbfService');

module.exports = {
  // Registra uma falha que o usuário identificou fora dos critérios automáticos
  // (ex: sensor dando leitura errada, problema mecânico) — entra na mesma linha do
  // tempo do histórico do ativo e conta para o cálculo de MTBF.
  //
  // :deviceId aqui é o id do Sensor (é assim que a tela de Manutenção Preventiva
  // chama esta rota). Resolvemos para a mesma chave usada pelos eventos automáticos
  // (id_dispositivo do sensor, quando existir) para não fragmentar o histórico do ativo.
  async registrarFalhaManual(req, res) {
    try {
      const { deviceId } = req.params;
      const { descricao, dataEvento } = req.body;

      if (!descricao || !descricao.trim()) {
        return res.status(400).json({ error: 'descricao é obrigatória' });
      }

      const sensor = await Sensor.findByPk(deviceId);
      if (!sensor) return res.status(404).json({ error: 'Sensor não encontrado' });

      const chave = chaveHistorico(sensor);
      const descricaoFinal = sensor.id_dispositivo
        ? `[${sensor.nome}] ${descricao.trim()}`
        : descricao.trim();

      const evento = await AssetHistory.create({
        deviceId: chave,
        tipoEvento: 'INTERVENCAO_MANUAL',
        descricao: descricaoFinal,
        dataEvento: dataEvento ? new Date(dataEvento) : new Date(),
        id_usuario: req.user.id
      });

      res.status(201).json(evento);
    } catch (error) {
      console.error('Erro ao registrar falha manual:', error);
      res.status(500).json({ error: 'Erro ao registrar falha manual' });
    }
  },

  async getHistory(req, res) {
    try {
      const { deviceId } = req.params;
      const { tipoEvento, inicio, fim } = req.query;

      const where = { deviceId: String(deviceId) };

      if (tipoEvento) {
        where.tipoEvento = tipoEvento;
      }

      if (inicio || fim) {
        where.dataEvento = {};
        if (inicio) where.dataEvento[Op.gte] = new Date(inicio);
        if (fim) where.dataEvento[Op.lte] = new Date(fim);
      }

      const eventos = await AssetHistory.findAll({
        where,
        order: [['dataEvento', 'DESC']]
      });

      res.json(eventos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar histórico do ativo' });
    }
  },

  // MTBF do dispositivo selecionado na tela "Currículo da Máquina"
  async getMTBF(req, res) {
    try {
      const { deviceId } = req.params;
      const resultado = await calcularMTBFDispositivo(deviceId);
      if (!resultado) return res.status(404).json({ error: 'Dispositivo não encontrado' });
      res.json(resultado);
    } catch (error) {
      console.error('Erro ao calcular MTBF do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao calcular MTBF do dispositivo' });
    }
  }
};
