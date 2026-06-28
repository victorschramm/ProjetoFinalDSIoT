const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️  EMAIL_USER e EMAIL_PASS não definidos — envio de email desabilitado');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarEmailRedefinicaoSenha(destinatario, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const link = `${frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f1923; padding: 32px; border-radius: 12px;">
      <h2 style="color: #00cec9; text-align: center; margin-bottom: 8px;">MANUT.AI</h2>
      <p style="color: #aaa; text-align: center; margin-bottom: 32px;">Monitoramento Inteligente do Ambiente</p>

      <h3 style="color: #fff; margin-bottom: 12px;">Redefinição de Senha</h3>
      <p style="color: #ccc; line-height: 1.6;">
        Recebemos uma solicitação para redefinir a senha da sua conta associada a este email.
      </p>
      <p style="color: #ccc; line-height: 1.6;">
        Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong style="color:#00b894">1 hora</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}"
           style="background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 14px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Redefinir Senha
        </a>
      </div>

      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Se você não solicitou a redefinição de senha, ignore este email — sua senha permanece a mesma.
      </p>
      <hr style="border-color: #333; margin: 24px 0;" />
      <p style="color: #555; font-size: 12px; text-align: center;">
        Link direto: <a href="${link}" style="color: #00cec9;">${link}</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ManutAI" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Redefinição de senha — ManutAI',
    html
  });
}

module.exports = { enviarEmailRedefinicaoSenha };
