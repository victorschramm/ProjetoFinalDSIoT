const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Este model pode ser reutilizado como histórico genérico de qualquer entidade
const AssetHistory = sequelize.define('AssetHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipoEvento: {
    type: DataTypes.STRING,
    allowNull: false
    // Exemplos: "ALERTA_TEMPERATURA", "SENSOR_OFFLINE", "MANUTENCAO", "ALERTA_RESOLVIDO"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dataEvento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'AssetHistory'
});

module.exports = AssetHistory;
