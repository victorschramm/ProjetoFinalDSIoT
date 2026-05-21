const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const NivelAcesso = sequelize.define('NivelAcesso', {
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
  nivel: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { 
  tableName: 'NivelAcesso' 
});
  
module.exports = NivelAcesso;
