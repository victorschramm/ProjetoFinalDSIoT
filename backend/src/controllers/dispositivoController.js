const Dispositivo = require('../models/Dispositivo');
const Sensor = require('../models/Sensor');
const { adicionarTopico, removerTopico, publicarMensagem } = require('../config/mqtt');
const { createDispositivoSchema, updateDispositivoSchema } = require('../schemas/dispositivoSchema');

module.exports = {
  // Listar todos os dispositivos
  async list(req, res) {
    try {
      const dispositivos = await Dispositivo.findAll({
        order: [['createdAt', 'DESC']]
      });
      res.json(dispositivos);
    } catch (error) {
      console.error('Erro ao listar dispositivos:', error);
      res.status(500).json({ error: 'Erro ao listar dispositivos' });
    }
  },

  // Obter dispositivo por ID
  async getById(req, res) {
    try {
      const dispositivo = await Dispositivo.findByPk(req.params.id);
      if (!dispositivo) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
      }
      res.json(dispositivo);
    } catch (error) {
      console.error('Erro ao buscar dispositivo:', error);
      res.status(500).json({ error: 'Erro ao buscar dispositivo' });
    }
  },

  // Criar dispositivo
  async create(req, res) {
    const result = createDispositivoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.errors.map(e => e.message)
      });
    }

    try {
      const { nome, tipo, topico_mqtt, mac_address, descricao, status } = result.data;

      // Verificar se tópico já existe
      const existente = await Dispositivo.findOne({ where: { topico_mqtt } });
      if (existente) {
        return res.status(400).json({ error: 'Já existe um dispositivo com este tópico MQTT' });
      }

      const dispositivo = await Dispositivo.create({
        nome,
        tipo: tipo || 'ESP32',
        topico_mqtt,
        mac_address,
        descricao,
        status: status || 'ativo'
      });

      // Inscrever no tópico MQTT do novo dispositivo
      try {
        await adicionarTopico(topico_mqtt);
        console.log(`✓ Inscrito no tópico do dispositivo: ${topico_mqtt}`);
      } catch (mqttErr) {
        console.error('Aviso: não foi possível inscrever no tópico MQTT:', mqttErr.message);
      }
      
      res.status(201).json(dispositivo);
    } catch (error) {
      console.error('Erro ao criar dispositivo:', error);
      res.status(500).json({ error: 'Erro ao criar dispositivo' });
    }
  },

  // Atualizar dispositivo
  async update(req, res) {
    const result = updateDispositivoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.errors.map(e => e.message)
      });
    }

    try {
      const { nome, tipo, topico_mqtt, mac_address, descricao, status } = result.data;
      const dispositivo = await Dispositivo.findByPk(req.params.id);
      
      if (!dispositivo) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
      }

      // Verificar se novo tópico já existe (se foi alterado)
      if (topico_mqtt && topico_mqtt !== dispositivo.topico_mqtt) {
        const existente = await Dispositivo.findOne({ where: { topico_mqtt } });
        if (existente) {
          return res.status(400).json({ error: 'Já existe um dispositivo com este tópico MQTT' });
        }
      }

      const topicoAntigo = dispositivo.topico_mqtt;

      await dispositivo.update({
        nome: nome || dispositivo.nome,
        tipo: tipo || dispositivo.tipo,
        topico_mqtt: topico_mqtt || dispositivo.topico_mqtt,
        mac_address: mac_address !== undefined ? mac_address : dispositivo.mac_address,
        descricao: descricao !== undefined ? descricao : dispositivo.descricao,
        status: status || dispositivo.status
      });

      // Se o tópico MQTT mudou, desinscrever do antigo e inscrever no novo
      if (topico_mqtt && topico_mqtt !== topicoAntigo) {
        try {
          await removerTopico(topicoAntigo);
          await adicionarTopico(topico_mqtt);
          console.log(`✓ Tópico MQTT atualizado: ${topicoAntigo} → ${topico_mqtt}`);
        } catch (mqttErr) {
          console.error('Aviso: erro ao atualizar tópico MQTT:', mqttErr.message);
        }
      }

      res.json(dispositivo);
    } catch (error) {
      console.error('Erro ao atualizar dispositivo:', error);
      res.status(500).json({ error: 'Erro ao atualizar dispositivo' });
    }
  },

  // Deletar dispositivo
  async delete(req, res) {
    try {
      const dispositivo = await Dispositivo.findByPk(req.params.id);
      
      if (!dispositivo) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
      }

      // Desinscrever do tópico MQTT do dispositivo
      try {
        await removerTopico(dispositivo.topico_mqtt);
      } catch (mqttErr) {
        console.error('Aviso: erro ao desinscrever do tópico MQTT:', mqttErr.message);
      }

      await dispositivo.destroy();
      res.json({ message: 'Dispositivo deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar dispositivo:', error);
      res.status(500).json({ error: 'Erro ao deletar dispositivo' });
    }
  },

  // Obter dispositivos ativos (para lista de seleção)
  async getAtivos(req, res) {
    try {
      const dispositivos = await Dispositivo.findAll({
        where: { status: 'ativo' },
        attributes: ['id', 'nome', 'topico_mqtt', 'tipo'],
        order: [['nome', 'ASC']]
      });
      res.json(dispositivos);
    } catch (error) {
      console.error('Erro ao listar dispositivos ativos:', error);
      res.status(500).json({ error: 'Erro ao listar dispositivos ativos' });
    }
  },

  // Publicar mensagem no tópico MQTT do dispositivo
  async publicar(req, res) {
    try {
      const dispositivo = await Dispositivo.findByPk(req.params.id);
      if (!dispositivo) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
      }

      const { mensagem } = req.body;
      if (!mensagem) {
        return res.status(400).json({ error: 'Campo "mensagem" é obrigatório' });
      }

      await publicarMensagem(dispositivo.topico_mqtt, mensagem);

      res.json({
        message: 'Mensagem publicada com sucesso',
        topico: dispositivo.topico_mqtt,
        payload: mensagem
      });
    } catch (error) {
      console.error('Erro ao publicar mensagem MQTT:', error);
      res.status(500).json({ error: 'Erro ao publicar mensagem MQTT' });
    }
  },

  // Atualizar última conexão (chamado pelo MQTT)
  async atualizarConexao(topicoMqtt) {
    try {
      const dispositivo = await Dispositivo.findOne({ 
        where: { topico_mqtt: topicoMqtt } 
      });
      
      if (dispositivo) {
        await dispositivo.update({
          ultima_conexao: new Date(),
          status: 'ativo'
        });
        return dispositivo;
      }
      return null;
    } catch (error) {
      console.error('Erro ao atualizar conexão do dispositivo:', error);
      return null;
    }
  }
};
