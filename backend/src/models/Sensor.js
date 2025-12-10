const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Ambiente = require('./Ambiente');
const Dispositivo = require('./Dispositivo');

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
    allowNull: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ativo'
  },
  id_dispositivo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Dispositivos',
      key: 'id'
    },
    comment: 'Dispositivo ESP que envia dados para este sensor'
  }
}, {
  tableName: 'Sensores'
});

// Relação com Ambiente
Sensor.belongsTo(Ambiente, {
  foreignKey: 'id_ambiente',
  as: 'ambiente'
});
Ambiente.hasMany(Sensor, {
  foreignKey: 'id_ambiente',
  as: 'sensores'
});

// Relação com Dispositivo
Sensor.belongsTo(Dispositivo, {
  foreignKey: 'id_dispositivo',
  as: 'dispositivo'
});
Dispositivo.hasMany(Sensor, {
  foreignKey: 'id_dispositivo',
  as: 'sensores'
});
  
module.exports = Sensor;