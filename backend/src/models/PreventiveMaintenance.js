// Modelo reutilizável para qualquer tipo de ativo (máquinas, veículos, equipamentos, etc.)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PreventiveMaintenance = sequelize.define('PreventiveMaintenance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // ID do sensor/dispositivo monitorado
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  // Horas acumuladas de operação desde o último reset
  horasOperadas: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  // Limite de horas para acionar alerta de manutenção preventiva
  limiteHoras: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100
  },
  // Momento da última vez que as horas foram atualizadas
  ultimaAtualizacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // "OK" = dentro do limite | "MANUTENCAO_PENDENTE" = limite atingido
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'OK',
    validate: {
      isIn: {
        args: [['OK', 'MANUTENCAO_PENDENTE']],
        msg: 'Status deve ser OK ou MANUTENCAO_PENDENTE'
      }
    }
  },
  // Descrição da ação de manutenção necessária (ex: "Limpeza de filtro")
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Manutenção preventiva'
  }
}, {
  tableName: 'PreventiveMaintenances'
});

module.exports = PreventiveMaintenance;
