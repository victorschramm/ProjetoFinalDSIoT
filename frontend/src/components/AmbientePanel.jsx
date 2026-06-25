import React, { useState } from 'react';
import { MapPin, Radio, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import SensorCard from './SensorCard';
import '../styles/AmbientePanel.css';

/**
 * Painel de ambiente com seus sensores
 * @param {Object} ambiente    - Dados do ambiente
 * @param {Array}  sensores    - Sensores do ambiente
 * @param {Object} leiturasMap - Map de "sensorId-tipo_leitura" -> última leitura
 * @param {Array}  alertas     - Alertas do ambiente
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
           (a.status === 'ativo' || a.status === 'pendente');
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

  const statusColors = {
    normal: '#10b981',
    atencao: '#f59e0b',
    critico: '#ef4444',
    offline: '#6b7280'
  };

  return (
    <div className={`ambiente-panel status-${status}`}>
      <div 
        className="ambiente-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="ambiente-info">
          <span className="status-indicator">
            <span className="status-dot" style={{ background: statusColors[status] }} />
          </span>
          <div className="ambiente-details">
            <h3 className="ambiente-name">{ambiente.nome}</h3>
            <span className="ambiente-location">
              <MapPin size={14} className="icon-inline icon-muted" /> {ambiente.localizacao || 'Localização não definida'}
            </span>
          </div>
        </div>

        <div className="ambiente-stats">
          <span className="sensor-count">
            <Radio size={14} className="icon-inline icon-muted" /> {sensoresDoAmbiente.length} sensor{sensoresDoAmbiente.length !== 1 ? 'es' : ''}
          </span>
          {alertasAtivos.length > 0 && (
            <span className="alert-badge">
              <AlertTriangle size={14} className="icon-inline" /> {alertasAtivos.length}
            </span>
          )}
          <button className="expand-btn">
            {expanded ? <ChevronUp size={16} className="icon-inline" /> : <ChevronDown size={16} className="icon-inline" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ambiente-content">
          {sensoresDoAmbiente.length === 0 ? (
            <div className="no-sensors">
              <span className="icon"><Radio size={32} className="icon-muted" /></span>
              <p>Nenhum sensor cadastrado neste ambiente</p>
            </div>
          ) : (
            <div className="sensors-grid">
              {sensoresDoAmbiente.map(sensor => {
                // Coleta todas as leituras disponíveis para este sensor (por tipo)
                const leiturasSensor = {};
                Object.entries(leiturasMap).forEach(([key, leitura]) => {
                  if (key.startsWith(`${sensor.id}-`)) {
                    const tipo = key.slice(`${sensor.id}-`.length);
                    leiturasSensor[tipo] = leitura;
                  }
                });

                return (
                  <SensorCard
                    key={sensor.id}
                    sensor={sensor}
                    leituras={leiturasSensor}
                    alertasAtivos={alertasAtivos.filter(
                      a => (a.id_sensor || a.sensor_id || a.sensorId) === sensor.id
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmbientePanel;
