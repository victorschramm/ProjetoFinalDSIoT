import React, { useState } from 'react';
import SensorCard from './SensorCard';
import '../styles/AmbientePanel.css';

/**
 * Painel de ambiente com seus sensores
 * @param {Object} ambiente - Dados do ambiente
 * @param {Array} sensores - Sensores do ambiente
 * @param {Object} leiturasMap - Map de sensorId -> última leitura
 * @param {Array} alertas - Alertas do ambiente
 */
const AmbientePanel = ({ ambiente, sensores = [], leiturasMap = {}, alertas = [] }) => {
  const [expanded, setExpanded] = useState(true);

  // Filtra sensores do ambiente
  const sensoresDoAmbiente = sensores.filter(
    s => s.id_ambiente === ambiente.id || s.ambiente_id === ambiente.id || s.ambienteId === ambiente.id
  );

  // Conta alertas ativos do ambiente
  const alertasAtivos = alertas.filter(a => {
    const sensorIds = sensoresDoAmbiente.map(s => s.id);
    return sensorIds.includes(a.id_sensor || a.sensor_id || a.sensorId) && 
           (a.status === 'aberto' || a.status === 'ativo');
  });

  // Determina status geral do ambiente
  const getStatusAmbiente = () => {
    if (sensoresDoAmbiente.length === 0) return 'offline';
    
    const temAlertaCritico = alertasAtivos.some(a => (a.nivel_severidade || a.severidade) === 'alto');
    if (temAlertaCritico) return 'critico';
    
    const temAlertaAtencao = alertasAtivos.some(a => (a.nivel_severidade || a.severidade) === 'medio');
    if (temAlertaAtencao) return 'atencao';
    
    return 'normal';
  };

  const status = getStatusAmbiente();

  const statusIcons = {
    normal: '🟢',
    atencao: '🟡',
    critico: '🔴',
    offline: '⚫'
  };

  return (
    <div className={`ambiente-panel status-${status}`}>
      <div 
        className="ambiente-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="ambiente-info">
          <span className="status-indicator">{statusIcons[status]}</span>
          <div className="ambiente-details">
            <h3 className="ambiente-name">{ambiente.nome}</h3>
            <span className="ambiente-location">
              📍 {ambiente.localizacao || 'Localização não definida'}
            </span>
          </div>
        </div>
        
        <div className="ambiente-stats">
          <span className="sensor-count">
            📡 {sensoresDoAmbiente.length} sensor{sensoresDoAmbiente.length !== 1 ? 'es' : ''}
          </span>
          {alertasAtivos.length > 0 && (
            <span className="alert-badge">
              ⚠️ {alertasAtivos.length}
            </span>
          )}
          <button className="expand-btn">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ambiente-content">
          {sensoresDoAmbiente.length === 0 ? (
            <div className="no-sensors">
              <span className="icon">📡</span>
              <p>Nenhum sensor cadastrado neste ambiente</p>
            </div>
          ) : (
            <div className="sensors-grid">
              {sensoresDoAmbiente.map(sensor => (
                <SensorCard
                  key={sensor.id}
                  sensor={sensor}
                  ultimaLeitura={leiturasMap[sensor.id]}
                  alertasAtivos={alertasAtivos.filter(
                    a => (a.sensor_id || a.sensorId) === sensor.id
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmbientePanel;
