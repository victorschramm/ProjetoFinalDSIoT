import React from 'react';
import '../styles/SensorCard.css';

/**
 * Card para exibição de sensor com status visual
 * @param {Object} sensor - Dados do sensor
 * @param {Object} ultimaLeitura - Última leitura do sensor
 * @param {Array} alertasAtivos - Alertas ativos do sensor
 */
const SensorCard = ({ sensor, ultimaLeitura, alertasAtivos = [] }) => {
  // Determina o status baseado na leitura
  const getStatus = () => {
    if (!ultimaLeitura) return 'offline';
    
    const valor = parseFloat(ultimaLeitura.valor);
    const tipo = sensor.tipo?.toLowerCase() || '';
    
    // Lógica de status baseada no tipo de sensor
    if (tipo.includes('temperatura')) {
      if (valor < 15 || valor > 35) return 'critico';
      if (valor < 18 || valor > 30) return 'atencao';
      return 'normal';
    }
    
    if (tipo.includes('umidade')) {
      if (valor < 20 || valor > 80) return 'critico';
      if (valor < 30 || valor > 70) return 'atencao';
      return 'normal';
    }
    
    if (tipo.includes('co2') || tipo.includes('gas')) {
      if (valor > 1000) return 'critico';
      if (valor > 800) return 'atencao';
      return 'normal';
    }
    
    // Verifica se há alertas ativos
    if (alertasAtivos.length > 0) {
      const severidadeAlta = alertasAtivos.some(a => (a.nivel_severidade || a.severidade) === 'alto');
      if (severidadeAlta) return 'critico';
      return 'atencao';
    }
    
    return 'normal';
  };

  const status = getStatus();
  
  const statusLabels = {
    normal: 'Normal',
    atencao: 'Atenção',
    critico: 'Crítico',
    offline: 'Offline'
  };

  const getIcon = () => {
    const tipo = sensor.tipo?.toLowerCase() || '';
    if (tipo.includes('temperatura')) return '🌡️';
    if (tipo.includes('umidade')) return '💧';
    if (tipo.includes('co2') || tipo.includes('gas')) return '💨';
    if (tipo.includes('pressao')) return '🔵';
    if (tipo.includes('luz') || tipo.includes('luminosidade')) return '💡';
    if (tipo.includes('movimento') || tipo.includes('presenca')) return '🚶';
    return '📡';
  };

  const getUnidade = () => {
    const tipo = sensor.tipo?.toLowerCase() || '';
    if (tipo.includes('temperatura')) return '°C';
    if (tipo.includes('umidade')) return '%';
    if (tipo.includes('co2')) return 'ppm';
    if (tipo.includes('pressao')) return 'hPa';
    if (tipo.includes('luz') || tipo.includes('luminosidade')) return 'lux';
    return '';
  };

  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`sensor-card status-${status}`}>
      <div className="sensor-card-header">
        <span className="sensor-icon">{getIcon()}</span>
        <div className="sensor-info">
          <h4 className="sensor-name">{sensor.nome || `Sensor ${sensor.id}`}</h4>
          <span className="sensor-type">{sensor.tipo || 'Desconhecido'}</span>
        </div>
        <div className={`status-badge ${status}`}>
          {statusLabels[status]}
        </div>
      </div>
      
      <div className="sensor-card-body">
        <div className="sensor-value">
          <span className="value">
            {ultimaLeitura ? parseFloat(ultimaLeitura.valor).toFixed(1) : '--'}
          </span>
          <span className="unit">{getUnidade()}</span>
        </div>
        
        <div className="sensor-meta">
          <span className="last-update">
            📅 {formatarData(ultimaLeitura?.data_hora || ultimaLeitura?.createdAt)}
          </span>
        </div>
      </div>

      {alertasAtivos.length > 0 && (
        <div className="sensor-alerts">
          <span className="alert-icon">⚠️</span>
          <span className="alert-count">
            {alertasAtivos.length} alerta{alertasAtivos.length > 1 ? 's' : ''} ativo{alertasAtivos.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default SensorCard;
