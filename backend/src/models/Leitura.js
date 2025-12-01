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
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'Leituras'
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