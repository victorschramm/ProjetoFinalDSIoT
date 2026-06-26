import React from 'react';
import { Calendar, Home, Search, X } from 'lucide-react';
import '../styles/DateTimeFilter.css';

/**
 * Componente de filtro por data, hora, ambiente e sensor
 */
const DateTimeFilter = ({
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  horaInicio,
  setHoraInicio,
  horaFim,
  setHoraFim,
  ambienteSelecionado,
  setAmbienteSelecionado,
  sensorSelecionado,
  setSensorSelecionado,
  ambientes = [],
  sensores = [],
  onFilter,
  onClear
}) => {
  // Filtra sensores pelo ambiente selecionado
  const sensoresFiltrados = ambienteSelecionado
    ? sensores.filter(s => 
        (s.ambiente_id || s.ambienteId) === parseInt(ambienteSelecionado)
      )
    : sensores;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onFilter) onFilter();
  };

  const handleClear = () => {
    setDataInicio('');
    setDataFim('');
    setHoraInicio('');
    setHoraFim('');
    setAmbienteSelecionado('');
    setSensorSelecionado('');
    if (onClear) onClear();
  };

  return (
    <form className="datetime-filter" onSubmit={handleSubmit}>
      <div className="filter-section">
        <h4 className="filter-title"><Calendar size={16} className="icon-inline" /> Período</h4>
        <div className="filter-row">
          <div className="filter-group">
            <label>Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Hora Início</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Hora Fim</label>
            <input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4 className="filter-title"><Home size={16} className="icon-inline" /> Local</h4>
        <div className="filter-row">
          <div className="filter-group">
            <label>Ambiente</label>
            <select
              value={ambienteSelecionado}
              onChange={(e) => {
                setAmbienteSelecionado(e.target.value);
                setSensorSelecionado(''); // Reset sensor ao mudar ambiente
              }}
              className="filter-select"
            >
              <option value="">Todos os ambientes</option>
              {ambientes.map(amb => (
                <option key={amb.id} value={amb.id}>
                  {amb.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Sensor</label>
            <select
              value={sensorSelecionado}
              onChange={(e) => setSensorSelecionado(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os sensores</option>
              {sensoresFiltrados.map(sensor => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.nome} ({sensor.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <button type="submit" className="btn-filter">
          <Search size={16} className="icon-inline" /> Filtrar
        </button>
        <button type="button" className="btn-clear" onClick={handleClear}>
          <X size={16} className="icon-inline" /> Limpar
        </button>
      </div>
    </form>
  );
};

export default DateTimeFilter;
