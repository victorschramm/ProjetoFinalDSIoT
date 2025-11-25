const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Ambiente = require('./Ambiente');

const Sensor = sequelize.define('Sensor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ativo'
  }
}, {
  tableName: 'Sensores'
});

Sensor.belongsTo(Ambiente, {
  foreignKey: 'id_ambiente',
  as: 'ambiente'
});
Ambiente.hasMany(Sensor, {
  foreignKey: 'id_ambiente',
  as: 'sensores'
});
  
module.exports = Sensor;