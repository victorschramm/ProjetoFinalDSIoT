const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Leitura = require('./Leitura');
const Sensor = require('./Sensor');
const Usuario = require('./Usuario');

const Alerta = sequelize.define('Alerta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mensagem: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nivel_severidade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  valor_detectado: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'aberto'
  },
  resolucao: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Alertas'
});

Alerta.belongsTo(Leitura, {
  foreignKey: 'id_leitura',
  as: 'leitura'
});

Alerta.belongsTo(Sensor, {
  foreignKey: 'id_sensor',
  as: 'sensor'
});

Alerta.belongsTo(Usuario, {
  foreignKey: 'id_usuario_conclusao',
  as: 'usuarioConclusao'
});

Leitura.hasMany(Alerta, {
  foreignKey: 'id_leitura',
  as: 'alertas'
});

Sensor.hasMany(Alerta, {
  foreignKey: 'id_sensor',
  as: 'alertas'
});

Usuario.hasMany(Alerta, {
  foreignKey: 'id_usuario_conclusao',
  as: 'alertasConcluidos'
});

module.exports = Alerta;