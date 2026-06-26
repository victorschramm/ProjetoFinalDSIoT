const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

if (!process.env.JWT_SECRET) {
  console.error('⚠️  ALERTA: Variável JWT_SECRET não definida! Defina no arquivo .env');
}
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-padrao-dev-apenas';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
