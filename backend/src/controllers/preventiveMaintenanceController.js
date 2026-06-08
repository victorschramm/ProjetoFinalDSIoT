const PreventiveMaintenance = require('../models/PreventiveMaintenance');
const Sensor = require('../models/Sensor');
const { logAssetEvent } = require('../services/assetHistoryService');

module.exports = {
  // Retorna apenas os registros de manutenção configurados pelo operador.
  // O frontend busca /sensores separadamente e faz o merge.
  async list(req, res) {
    try {
      const registros = await PreventiveMaintenance.findAll({ order: [['createdAt', 'ASC']] });
      res.json(registros);
    } catch (error) {
      console.error('Erro ao listar manutenções:', error);
      res.status(500).json({ error: 'Erro ao listar manutenções' });
    }
  },

  // Operador configura manutenção preventiva para um sensor pela primeira vez
  async create(req, res) {
    try {
      const { deviceId, limiteHoras, descricao } = req.body;

      if (!deviceId || !limiteHoras || !descricao) {
        return res.status(400).json({ error: 'deviceId, limiteHoras e descricao são obrigatórios' });
      }

      const sensor = await Sensor.findByPk(deviceId);
      if (!sensor) return res.status(404).json({ error: 'Sensor não encontrado' });

      const existe = await PreventiveMaintenance.findOne({ where: { deviceId } });
      if (existe) return res.status(409).json({ error: 'Manutenção preventiva já configurada para este sensor' });

      const registro = await PreventiveMaintenance.create({
        deviceId,
        horasOperadas: 0,
        limiteHoras: parseFloat(limiteHoras),
        ultimaAtualizacao: new Date(),
        status: 'OK',
        descricao
      });

      logAssetEvent(
        parseInt(deviceId),
        'MANUTENCAO_CONFIGURADA',
        `Manutenção preventiva configurada: "${descricao}" (limite: ${limiteHoras}h).`
      ).catch(() => {});

      res.status(201).json(registro);
    } catch (error) {
      console.error('Erro ao criar configuração de manutenção:', error);
      res.status(500).json({ error: 'Erro ao criar configuração de manutenção' });
    }
  },

  // Operador edita limiteHoras e/ou descricao de um sensor já configurado
  async update(req, res) {
    try {
      const { deviceId } = req.params;
      const { limiteHoras, descricao } = req.body;

      const registro = await PreventiveMaintenance.findOne({ where: { deviceId } });
      if (!registro) return res.status(404).json({ error: 'Registro não encontrado' });

      const updates = {};
      if (limiteHoras !== undefined) updates.limiteHoras = parseFloat(limiteHoras);
      if (descricao !== undefined) updates.descricao = descricao;

      await registro.update(updates);
      res.json(registro);
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error);
      res.status(500).json({ error: 'Erro ao atualizar manutenção' });
    }
  },

  // Zera o contador após manutenção realizada, volta status para "OK"
  async reset(req, res) {
    try {
      const { deviceId } = req.params;

      const registro = await PreventiveMaintenance.findOne({ where: { deviceId } });
      if (!registro) return res.status(404).json({ error: 'Registro não encontrado' });

      await registro.update({
        horasOperadas: 0,
        ultimaAtualizacao: new Date(),
        status: 'OK'
      });

      logAssetEvent(
        parseInt(deviceId),
        'MANUTENCAO_REALIZADA',
        `Manutenção realizada: ${registro.descricao}. Contador zerado.`
      ).catch(() => {});

      res.json({ message: 'Contador zerado com sucesso', registro });
    } catch (error) {
      console.error('Erro ao resetar contador:', error);
      res.status(500).json({ error: 'Erro ao resetar contador' });
    }
  }
};
