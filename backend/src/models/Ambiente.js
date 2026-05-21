const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Ambiente = sequelize.define('Ambiente', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  localizacao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  temperatura_ideal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  umidade_ideal: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  tableName: 'Ambientes'
});
  
module.exports = Ambiente;