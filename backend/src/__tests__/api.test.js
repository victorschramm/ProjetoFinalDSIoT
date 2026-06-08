jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Resposta de teste', tool_calls: null } }]
        })
      }
    }
  }));
});

jest.mock('../middleware/rateLimiter', () => ({
  authLimiter: (req, res, next) => next(),
  apiLimiter:  (req, res, next) => next(),
}));

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  transporter: {},
}));

jest.mock('../services/whatsappService', () => ({
  sendWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request   = require('supertest');
const sequelize  = require('../config/database');
const app        = require('../app');
const { sendEmail }    = require('../services/emailService');
const { sendWhatsApp } = require('../services/whatsappService');
const { sendAlert }    = require('../services/notificationService');
const NotificationSettings = require('../models/NotificationSettings');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('Auth — login inválido', () => {
  test('POST /api/login com credenciais erradas retorna 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nao@existe.com', password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas');
  });
});

describe('Rotas protegidas sem token', () => {
  test('GET /api/sensores sem token retorna 401', async () => {
    const res = await request(app).get('/api/sensores');
    expect(res.status).toBe(401);
  });

  test('GET /api/alertas sem token retorna 401', async () => {
    const res = await request(app).get('/api/alertas');
    expect(res.status).toBe(401);
  });
});

describe('Fluxo completo: cadastro → login → acesso autenticado', () => {
  let token;

  test('POST /api/register cria usuário com sucesso', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Usuário Teste',
        email: 'teste@manutai.com',
        password: 'senha123',
        tipo_usuario: 'usuario',
      });

    expect(res.status).toBe(201);
    expect(res.body.usuario.email).toBe('teste@manutai.com');
  });

  test('POST /api/login retorna token JWT', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'teste@manutai.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('GET /api/alertas com token retorna 200', async () => {
    const res = await request(app)
      .get('/api/alertas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// ─── Notificações ─────────────────────────────────────────────────────────────

describe('Notificações — sendAlert', () => {
  let settingsId;

  beforeEach(async () => {
    await NotificationSettings.destroy({ where: {} });
  });

  test('envia email quando emailEnabled=true', async () => {
    await NotificationSettings.create({
      id_usuario: 99,
      emailEnabled: true,
      whatsappEnabled: false,
      email: 'alerta@teste.com',
      telefone: null
    });

    await sendAlert({ assunto: 'Teste', mensagem: 'Mensagem de teste' });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith('alerta@teste.com', 'Teste', 'Mensagem de teste');
  });

  test('chama sendWhatsApp quando whatsappEnabled=true', async () => {
    await NotificationSettings.create({
      id_usuario: 99,
      emailEnabled: false,
      whatsappEnabled: true,
      email: null,
      telefone: '+5511999999999'
    });

    await sendAlert({ assunto: 'Teste WA', mensagem: 'Msg WA' });

    expect(sendWhatsApp).toHaveBeenCalledTimes(1);
    expect(sendWhatsApp).toHaveBeenCalledWith('+5511999999999', 'Teste WA\n\nMsg WA');
  });

  test('não envia nada quando ambos desativados', async () => {
    await NotificationSettings.create({
      id_usuario: 99,
      emailEnabled: false,
      whatsappEnabled: false,
      email: 'silencio@teste.com',
      telefone: '+5511999999999'
    });

    await sendAlert({ assunto: 'Silêncio', mensagem: 'Não deve chegar' });

    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });

  test('continua funcionando mesmo se envio falhar', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP offline'));

    await NotificationSettings.create({
      id_usuario: 99,
      emailEnabled: true,
      whatsappEnabled: false,
      email: 'falha@teste.com',
      telefone: null
    });

    await expect(
      sendAlert({ assunto: 'Erro', mensagem: 'Deve continuar' })
    ).resolves.not.toThrow();
  });
});

// ─── AuditLog ─────────────────────────────────────────────────────────────────

describe('AuditLog — logAction', () => {
  const { logAction } = require('../services/auditLogService');

  test('registra ação no banco sem lançar erro', async () => {
    await expect(
      logAction({ userId: 1, acao: 'TESTE', entidade: 'TESTE', entidadeId: 1, descricao: 'Teste de auditoria', origem: 'WEB' })
    ).resolves.not.toThrow();
  });

  test('não quebra o fluxo se userId for nulo', async () => {
    await expect(
      logAction({ userId: null, acao: 'TESTE_SEM_USER', entidade: 'SISTEMA', descricao: 'Sem usuário' })
    ).resolves.not.toThrow();
  });

  test('não lança erro se o banco falhar', async () => {
    const AuditLog = require('../models/AuditLog');
    const spy = jest.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('DB offline'));
    await expect(
      logAction({ userId: 1, acao: 'FALHA_DB', entidade: 'TESTE' })
    ).resolves.not.toThrow();
    spy.mockRestore();
  });
});

describe('AuditLog — GET /api/audit-logs', () => {
  let adminToken;

  beforeAll(async () => {
    const { logAction } = require('../services/auditLogService');

    // Criar admin e obter token
    await request(app).post('/api/register').send({
      name: 'Admin Teste',
      email: 'admin.audit@manutai.com',
      password: 'senha123',
      tipo_usuario: 'usuario'
    });
    const Usuario = require('../models/Usuario');
    await Usuario.update({ tipo_usuario: 'admin' }, { where: { email: 'admin.audit@manutai.com' } });

    const res = await request(app).post('/api/login').send({
      email: 'admin.audit@manutai.com',
      password: 'senha123'
    });
    adminToken = res.body.token;

    // Criar um log para filtrar
    await logAction({ userId: 1, acao: 'FECHOU_ALERTA', entidade: 'ALERTA', entidadeId: 10, descricao: 'Log de teste', origem: 'WEB' });
  });

  test('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/audit-logs');
    expect(res.status).toBe(401);
  });

  test('retorna 403 para usuário comum', async () => {
    const loginRes = await request(app).post('/api/login').send({
      email: 'teste@manutai.com',
      password: 'senha123'
    });
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(403);
  });

  test('retorna lista de logs para admin', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });

  test('filtra logs por acao', async () => {
    const res = await request(app)
      .get('/api/audit-logs?acao=FECHOU_ALERTA')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.logs.forEach(log => expect(log.acao).toBe('FECHOU_ALERTA'));
  });

  test('filtra logs por entidade', async () => {
    const res = await request(app)
      .get('/api/audit-logs?entidade=ALERTA')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.logs.forEach(log => expect(log.entidade).toBe('ALERTA'));
  });
});
