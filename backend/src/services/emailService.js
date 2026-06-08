const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, message) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email não configurado — notificação por email ignorada');
    return;
  }

  await transporter.sendMail({
    from: `"ManutAI" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;
                  background: #0f1923; padding: 28px; border-radius: 12px;">
        <h2 style="color: #00cec9; margin-bottom: 4px;">MANUT.AI</h2>
        <p style="color: #aaa; margin-bottom: 24px; font-size: 13px;">
          Monitoramento Inteligente do Ambiente
        </p>
        <p style="color: #ddd; line-height: 1.7; white-space: pre-line;">${message}</p>
        <hr style="border-color: #333; margin: 24px 0;" />
        <p style="color: #555; font-size: 12px;">
          Para gerenciar suas notificações, acesse as configurações da sua conta.
        </p>
      </div>
    `
  });
}

module.exports = { sendEmail, transporter };
