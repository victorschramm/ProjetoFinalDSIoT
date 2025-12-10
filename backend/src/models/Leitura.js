const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sensor = require('./Sensor');

const Leitura = sequelize.define('Leitura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  tipo_leitura: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'temperatura, umidade, potenciometro, etc'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  unidade: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: '°C, %, etc'
  }
}, {
  tableName: 'Leituras',
  timestamps: true
});

Leitura.belongsTo(Sensor, {
  foreignKey: 'id_sensor',
  as: 'sensor'
});

Sensor.hasMany(Leitura, {
  foreignKey: 'id_sensor',
  as: 'leituras'
});
  
module.exports = Leitura;