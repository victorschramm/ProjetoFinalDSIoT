const express = require('express');
const path = require('path');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { initMQTT } = require('./config/mqtt');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();
app.use(express.json());

// Rate limiter global para API
app.use('/api', apiLimiter);

// Configurar CORS
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
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

// Rotas da API (centralizadas em routes/index.js)
app.use('/api', routes);

// Middleware de tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true };
sequelize.sync(syncOptions).then(() => {
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
