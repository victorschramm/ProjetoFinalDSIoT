const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationSettings = sequelize.define('NotificationSettings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  whatsappEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'NotificationSettings'
});

module.exports = NotificationSettings;
