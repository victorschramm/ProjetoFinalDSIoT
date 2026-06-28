const Alerta = require('../models/Alerta');
const Sensor = require('../models/Sensor');
const { createAlertaSchema, updateAlertaSchema } = require('../schemas/alertaSchema');
const { logAssetEvent } = require('../services/assetHistoryService');
const { logAction } = require('../services/auditLogService');

module.exports = {
  async create(req, res) {
    const result = createAlertaSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.issues.map(e => e.message)
      });
    }

    try {
      const { id_sensor, tipo, mensagem, nivel_severidade, valor_detectado, timestamp } = result.data;
      const alerta = await Alerta.create({
        id_sensor,
        tipo,
        mensagem,
        nivel_severidade,
        valor_detectado,
        timestamp,
        status: 'pendente'
      });
      res.status(201).json(alerta);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar alerta' });
    }
  },

  async list(req, res) {
    try {
      const alertas = await Alerta.findAll();
      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar alertas' });
    }
  },

  async getById(req, res) {
    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      res.json(alerta);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alerta' });
    }
  },

  async getBySensor(req, res) {
    try {
      const alertas = await Alerta.findAll({
        where: { id_sensor: req.params.id }
      });
      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alertas do sensor' });
    }
  },

  async getBySeveridade(req, res) {
    try {
      const alertas = await Alerta.findAll({
        where: { nivel_severidade: req.params.nivel }
      });
      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alertas por severidade' });
    }
  },

  async update(req, res) {
    const result = updateAlertaSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.issues.map(e => e.message)
      });
    }

    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }

      const statusAnterior = alerta.status;
      await alerta.update(result.data);

      // Registra no histórico quando o status muda (intervenção manual)
      if (result.data.status && result.data.status !== statusAnterior) {
        const sensor = await Sensor.findByPk(alerta.id_sensor);
        const deviceId = sensor?.id_dispositivo || alerta.id_sensor;
        const tipoMap = {
          resolvido: 'MANUTENCAO',
          ignorado: 'INTERVENCAO_MANUAL',
          ativo: 'ALERTA_ATIVADO',
          pendente: 'ALERTA_PENDENTE'
        };
        const tipoEvento = tipoMap[result.data.status] || 'INTERVENCAO_MANUAL';
        const resolucaoInfo = result.data.resolucao ? ` Resolução: ${result.data.resolucao}` : '';
        logAssetEvent(
          deviceId,
          tipoEvento,
          `Alerta "${alerta.tipo}" atualizado para status "${result.data.status}".${resolucaoInfo}`
        ).catch(() => {});

        const acaoMap = { resolvido: 'FECHOU_ALERTA', ignorado: 'IGNOROU_ALERTA', ativo: 'REABRIU_ALERTA' };
        logAction({
          userId: req.user?.id,
          acao: acaoMap[result.data.status] || 'ALTEROU_STATUS_ALERTA',
          entidade: 'ALERTA',
          entidadeId: alerta.id,
          descricao: `Alerta "${alerta.tipo}" alterado de "${statusAnterior}" para "${result.data.status}".${resolucaoInfo}`,
          origem: 'WEB'
        });
      }

      res.json(alerta);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar alerta' });
    }
  },

  async delete(req, res) {
    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      await alerta.destroy();
      logAction({
        userId: req.user?.id,
        acao: 'EXCLUIU_ALERTA',
        entidade: 'ALERTA',
        entidadeId: parseInt(req.params.id),
        descricao: `Alerta do tipo "${alerta.tipo}" excluído.`,
        origem: 'WEB'
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar alerta' });
    }
  }
};