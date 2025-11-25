const express = require('express');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const ambienteRoutes = require('./routes/ambienteRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const leituraRoutes = require('./routes/leituraRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const nivelAcessoRoutes = require('./routes/nivelAcessoRoutes');

const app = express();
app.use(express.json());

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

// Middleware de tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

sequelize.sync().then(() => {
  console.log('Banco de dados sincronizado');
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
}).catch(err => {
  console.error('Erro ao sincronizar o banco de dados:', err);
  process.exit(1);
});
