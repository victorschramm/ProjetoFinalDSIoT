const NotificationSettings = require('../models/NotificationSettings');

module.exports = {
  async getSettings(req, res) {
    try {
      let settings = await NotificationSettings.findOne({
        where: { id_usuario: req.user.id }
      });

      if (!settings) {
        settings = await NotificationSettings.create({
          id_usuario: req.user.id,
          emailEnabled: true,
          whatsappEnabled: false,
          email: req.user.email,
          telefone: null
        });
      }

      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  },

  async updateSettings(req, res) {
    const { emailEnabled, whatsappEnabled, email, telefone } = req.body;

    try {
      let settings = await NotificationSettings.findOne({
        where: { id_usuario: req.user.id }
      });

      if (!settings) {
        settings = await NotificationSettings.create({
          id_usuario: req.user.id,
          emailEnabled: true,
          whatsappEnabled: false,
          email: req.user.email,
          telefone: null
        });
      }

      await settings.update({ emailEnabled, whatsappEnabled, email, telefone });
      res.json(settings);
    } catch (error) {
      console.error('Erro ao atualizar configurações de notificação:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }
};
