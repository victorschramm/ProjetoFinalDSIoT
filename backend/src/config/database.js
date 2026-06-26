const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dialect = process.env.DB_DIALECT || 'mysql';

const baseOptions = {
  dialect,
  logging: false,
  ...(dialect !== 'sqlite' && { timezone: '-03:00' }),
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
};

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    ...baseOptions,
    storage: process.env.DB_STORAGE || ':memory:'
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...baseOptions,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialectOptions: { charset: 'utf8mb4' }
    }
  );

  sequelize
    .authenticate()
    .then(() => console.log('✓ Conectado ao MySQL com sucesso'))
    .catch(err => console.error('Erro ao conectar com o banco de dados:', err));
}

module.exports = sequelize;
