const express = require('express');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();
app.use(express.json());

app.use('/api', apiLimiter);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(o => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next();
});

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
