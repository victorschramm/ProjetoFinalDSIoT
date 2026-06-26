import React from 'react';
import { Thermometer, Droplet, SlidersHorizontal, Wind, Gauge, Lightbulb, Radio, Calendar, AlertTriangle } from 'lucide-react';
import '../styles/SensorCard.css';

const TIPOS_CONFIG = {
  temperatura:   { icon: Thermometer, unidade: '°C',  label: 'Temperatura' },
  umidade:       { icon: Droplet, unidade: '%',   label: 'Umidade' },
  potenciometro: { icon: SlidersHorizontal, unidade: '%',   label: 'Potenciômetro' },
  co2:           { icon: Wind, unidade: 'ppm', label: 'CO₂' },
  pressao:       { icon: Gauge, unidade: 'hPa', label: 'Pressão' },
  luz:           { icon: Lightbulb, unidade: 'lux', label: 'Luminosidade' },
  luminosidade:  { icon: Lightbulb, unidade: 'lux', label: 'Luminosidade' },
};

const getStatusPorTipo = (tipo, valor) => {
  if (tipo === 'temperatura') {
    if (valor < 15 || valor > 35) return 'critico';
    if (valor < 18 || valor > 30) return 'atencao';
    return 'normal';
  }
  if (tipo === 'umidade') {
    if (valor < 20 || valor > 80) return 'critico';
    if (valor < 30 || valor > 70) return 'atencao';
    return 'normal';
  }
  if (tipo === 'co2' || tipo === 'gas') {
    if (valor > 1000) return 'critico';
    if (valor > 800) return 'atencao';
    return 'normal';
  }
  return 'normal';
};

const PRIORITY = { critico: 3, atencao: 2, normal: 1, offline: 0 };

/**
 * Card de sensor — exibe todas as leituras disponíveis (temperatura, umidade, etc.)
 * @param {Object}  sensor        - Dados do sensor
 * @param {Object}  leituras      - Mapa { tipo_leitura: leituraObj } com as últimas leituras por tipo
 * @param {Array}   alertasAtivos - Alertas ativos do sensor
 */
const SensorCard = ({ sensor, leituras = {}, alertasAtivos = [] }) => {
  const tiposDisponiveis = Object.keys(leituras).filter(k => leituras[k]);

  const getStatusGeral = () => {
    if (tiposDisponiveis.length === 0) return 'offline';

    let pior = 'normal';
    tiposDisponiveis.forEach(tipo => {
      const s = getStatusPorTipo(tipo, parseFloat(leituras[tipo].valor));
      if (PRIORITY[s] > PRIORITY[pior]) pior = s;
    });

    if (alertasAtivos.length > 0) {
      const temAlto = alertasAtivos.some(a => (a.nivel_severidade || a.severidade) === 'alto');
      const candidato = temAlto ? 'critico' : 'atencao';
      if (PRIORITY[candidato] > PRIORITY[pior]) pior = candidato;
    }

    return pior;
  };

  const status = getStatusGeral();

  const statusLabels = { normal: 'Normal', atencao: 'Atenção', critico: 'Crítico', offline: 'Offline' };

  const getIconSensor = () => {
    const temTemp = tiposDisponiveis.includes('temperatura');
    const temUmid = tiposDisponiveis.includes('umidade');
    if (temTemp) return Thermometer;
    if (temUmid) return Droplet;
    const tipo = sensor.tipo?.toLowerCase() || '';
    if (tipo.includes('co2') || tipo.includes('gas')) return Wind;
    if (tipo.includes('pressao')) return Gauge;
    if (tipo.includes('luz') || tipo.includes('luminosidade')) return Lightbulb;
    return Radio;
  };

  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '--';
    return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getUltimaData = () => {
    const datas = tiposDisponiveis
      .map(t => leituras[t]?.timestamp || leituras[t]?.data_hora || leituras[t]?.createdAt)
      .filter(Boolean)
      .map(d => new Date(d).getTime())
      .filter(n => !isNaN(n));
    return datas.length > 0 ? new Date(Math.max(...datas)) : null;
  };

  const ultimaData = getUltimaData();
  const IconSensor = getIconSensor();

  return (
    <div className={`sensor-card status-${status}`}>
      <div className="sensor-card-header">
        <span className="sensor-icon"><IconSensor size={22} className="icon-inline" /></span>
        <div className="sensor-info">
          <h4 className="sensor-name">{sensor.nome || `Sensor ${sensor.id}`}</h4>
          <span className="sensor-type">{sensor.tipo || 'Desconhecido'}</span>
        </div>
        <div className={`status-badge ${status}`}>
          {statusLabels[status]}
        </div>
      </div>

      <div className="sensor-card-body">
        {tiposDisponiveis.length === 0 ? (
          <div className="sensor-value">
            <span className="value">--</span>
          </div>
        ) : (
          <div className="sensor-readings">
            {tiposDisponiveis.map(tipo => {
              const config = TIPOS_CONFIG[tipo] || { icon: Radio, unidade: '', label: tipo };
              const valor = parseFloat(leituras[tipo].valor);
              const statusTipo = getStatusPorTipo(tipo, valor);
              const ReadingIcon = config.icon;
              return (
                <div key={tipo} className={`reading-item reading-${statusTipo}`}>
                  <span className="reading-icon"><ReadingIcon size={18} className="icon-inline" /></span>
                  <div className="reading-data">
                    <span className="reading-label">{config.label}</span>
                    <span className="reading-value">
                      {valor.toFixed(1)}<span className="reading-unit"> {config.unidade}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="sensor-meta">
          <span className="last-update">
            <Calendar size={14} className="icon-inline icon-muted" /> {ultimaData ? formatarData(ultimaData) : '--'}
          </span>
        </div>
      </div>

      {alertasAtivos.length > 0 && (
        <div className="sensor-alerts">
          <span className="alert-icon"><AlertTriangle size={16} className="icon-inline" /></span>
          <span className="alert-count">
            {alertasAtivos.length} alerta{alertasAtivos.length > 1 ? 's' : ''} ativo{alertasAtivos.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default SensorCard;
