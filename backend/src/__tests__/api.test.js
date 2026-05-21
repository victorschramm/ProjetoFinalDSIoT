jest.mock('../middleware/rateLimiter', () => ({
  authLimiter: (req, res, next) => next(),
  apiLimiter:  (req, res, next) => next(),
}));

const request  = require('supertest');
const sequelize = require('../config/database');
const app      = require('../app');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

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
