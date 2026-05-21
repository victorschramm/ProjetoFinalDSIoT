// Estrutura pronta para integração futura com providers reais
// (ex: Twilio, Meta Business API, Z-API)

async function sendWhatsApp(telefone, mensagem) {
  // TODO: substituir pelo provider escolhido
  // Exemplo Twilio:
  //   const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  //   await client.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:${telefone}`, body: mensagem });

  console.log(`[WhatsApp] Para: ${telefone} | ${mensagem}`);
}

module.exports = { sendWhatsApp };
