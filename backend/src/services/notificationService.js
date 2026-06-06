const NotificationSettings = require('../models/NotificationSettings');
const { sendEmail } = require('./emailService');
const { sendWhatsApp } = require('./whatsappService');

// sendAlert não lança erro — falhas em canais individuais são logadas e ignoradas
async function sendAlert({ assunto, mensagem, id_usuario = null }) {
  try {
    let settingsList;

    if (id_usuario) {
      const s = await NotificationSettings.findOne({ where: { id_usuario } });
      settingsList = s ? [s] : [];
    } else {
      settingsList = await NotificationSettings.findAll();
    }

    console.log(`🔔 sendAlert: ${settingsList.length} destinatário(s) encontrado(s)`);

    if (settingsList.length === 0) {
      console.warn('⚠️  Nenhuma configuração de notificação encontrada no banco');
      return;
    }

    for (const settings of settingsList) {
      console.log(`   → id_usuario=${settings.id_usuario} | email=${settings.email} | emailEnabled=${settings.emailEnabled} | whatsappEnabled=${settings.whatsappEnabled}`);

      if (settings.emailEnabled && settings.email) {
        try {
          await sendEmail(settings.email, assunto, mensagem);
          console.log(`📧 Email enviado para ${settings.email}`);
        } catch (err) {
          console.error(`❌ Falha ao enviar email para ${settings.email}:`, err.message);
        }
      } else if (settings.emailEnabled && !settings.email) {
        console.warn(`⚠️  emailEnabled=true mas email não definido para id_usuario=${settings.id_usuario}`);
      }

      if (settings.whatsappEnabled && settings.telefone) {
        try {
          await sendWhatsApp(settings.telefone, `${assunto}\n\n${mensagem}`);
        } catch (err) {
          console.error(`❌ Falha ao enviar WhatsApp para ${settings.telefone}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Erro no serviço de notificações:', err.message);
  }
}

module.exports = { sendAlert };
