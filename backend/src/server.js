const express = require('express');
const path = require('path');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { initMQTT } = require('./config/mqtt');
const authRoutes = require('./routes/authRoutes');
const ambienteRoutes = require('./routes/ambienteRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const leituraRoutes = require('./routes/leituraRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const nivelAcessoRoutes = require('./routes/nivelAcessoRoutes');
const dispositivoRoutes = require('./routes/dispositivoRoutes');

const app = express();
app.use(express.json());

// Configurar CORS para aceitar requisições do frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal - redireciona para login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Middleware para tratar erros de JSON inválido
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next();
});

// Rotas de autenticação (não precisam de autenticação)
app.use('/api', authRoutes);

// Rotas protegidas (precisam de autenticação)
app.use('/api/ambientes', ambienteRoutes);
app.use('/api/sensores', sensorRoutes);
app.use('/api/leituras', leituraRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/niveis-acesso', nivelAcessoRoutes);
app.use('/api/dispositivos', dispositivoRoutes);

// Middleware de tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

sequelize.sync().then(() => {
  console.log('✓ Banco de dados sincronizado');
  
  // Inicializar MQTT
  initMQTT().catch(err => {
    console.error('⚠️  Erro ao inicializar MQTT:', err.message);
    console.log('Continuando sem MQTT...');
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
}).catch(err => {
  console.error('Erro ao sincronizar o banco de dados:', err);
  process.exit(1);
});
