const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Model reutilizável como sistema genérico de auditoria para qualquer projeto
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  acao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entidade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entidadeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  origem: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'WEB'
  },
  dataAcao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'AuditLogs'
});

module.exports = AuditLog;
