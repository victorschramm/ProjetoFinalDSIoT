const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dispositivo = sequelize.define('Dispositivo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome identificador do dispositivo ESP'
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ESP32',
    comment: 'Tipo do dispositivo (ESP32, ESP8266, etc)'
  },
  topico_mqtt: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Tópico MQTT que o dispositivo publica'
  },
  mac_address: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Endereço MAC do dispositivo'
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ativo',
    comment: 'Status: ativo, inativo, offline'
  },
  ultima_conexao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que o dispositivo enviou dados'
  }
}, {
  tableName: 'Dispositivos',
  timestamps: true
});
  
module.exports = Dispositivo;
