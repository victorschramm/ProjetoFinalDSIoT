import React from 'react';
import '../styles/HistoryTable.css';

/**
 * Tabela de histórico de leituras
 * @param {Array} leituras - Lista de leituras
 * @param {Array} sensores - Lista de sensores
 * @param {Array} ambientes - Lista de ambientes
 * @param {boolean} loading - Estado de carregamento
 * @param {Function} onLoadMore - Callback para carregar mais
 * @param {boolean} hasMore - Se há mais dados para carregar
 */
const HistoryTable = ({ 
  leituras = [], 
  sensores = [], 
  ambientes = [],
  loading = false,
  onLoadMore,
  hasMore = false
}) => {
  // Cria maps para lookup rápido
  const sensoresMap = sensores.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const ambientesMap = ambientes.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {});

  const getSensor = (leitura) => {
    return sensoresMap[leitura.id_sensor || leitura.sensor_id || leitura.sensorId];
  };

  const getAmbiente = (leitura) => {
    const sensor = getSensor(leitura);
    if (!sensor) return null;
    return ambientesMap[sensor.id_ambiente || sensor.ambiente_id || sensor.ambienteId];
  };

  const getStatus = (leitura) => {
    const sensor = getSensor(leitura);
    if (!sensor) return { label: '--', class: 'status-unknown' };
    
    const valor = parseFloat(leitura.valor);
    const tipo = sensor.tipo?.toLowerCase() || '';
    
    if (tipo.includes('temperatura')) {
      if (valor < 15 || valor > 35) return { label: 'Crítico', class: 'status-critical' };
      if (valor < 18 || valor > 30) return { label: 'Atenção', class: 'status-warning' };
      return { label: 'Normal', class: 'status-normal' };
    }
    
    if (tipo.includes('umidade')) {
      if (valor < 20 || valor > 80) return { label: 'Crítico', class: 'status-critical' };
      if (valor < 30 || valor > 70) return { label: 'Atenção', class: 'status-warning' };
      return { label: 'Normal', class: 'status-normal' };
    }
    
    return { label: 'Normal', class: 'status-normal' };
  };

  const getUnidade = (leitura) => {
    const sensor = getSensor(leitura);
    if (!sensor) return '';
    
    const tipo = sensor.tipo?.toLowerCase() || '';
    if (tipo.includes('temperatura')) return '°C';
    if (tipo.includes('umidade')) return '%';
    if (tipo.includes('co2')) return 'ppm';
    if (tipo.includes('pressao')) return 'hPa';
    return '';
  };

  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (leituras.length === 0 && !loading) {
    return (
      <div className="history-table empty">
        <div className="no-data">
          <span className="icon">📋</span>
          <p>Nenhum registro encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-table">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Ambiente</th>
              <th>Sensor</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leituras.map((leitura, index) => {
              const sensor = getSensor(leitura);
              const ambiente = getAmbiente(leitura);
              const status = getStatus(leitura);
              const unidade = getUnidade(leitura);
              
              return (
                <tr key={leitura.id || index}>
                  <td className="col-datetime">
                    {formatarData(leitura.timestamp || leitura.data_hora || leitura.createdAt)}
                  </td>
                  <td className="col-ambiente">
                    {ambiente?.nome || '--'}
                  </td>
                  <td className="col-sensor">
                    {sensor?.nome || '--'}
                  </td>
                  <td className="col-tipo">
                    {sensor?.tipo || '--'}
                  </td>
                  <td className="col-valor">
                    {parseFloat(leitura.valor).toFixed(1)} {unidade}
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="loading-more">
          <span className="spinner"></span>
          <span>Carregando...</span>
        </div>
      )}

      {hasMore && !loading && onLoadMore && (
        <div className="load-more">
          <button onClick={onLoadMore} className="btn-load-more">
            Carregar mais
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
