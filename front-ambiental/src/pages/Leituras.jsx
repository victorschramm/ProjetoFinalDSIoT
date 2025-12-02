import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/Leituras.css';

function Leituras() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sensorIdFromUrl = searchParams.get('sensor');

  // Estados principais
  const [leituras, setLeituras] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [filtroSensor, setFiltroSensor] = useState(sensorIdFromUrl || '');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeitura, setSelectedLeitura] = useState(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    id_sensor: '',
    valor: '',
    tipo_leitura: '',
    timestamp: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Carregar sensores
  const loadSensores = useCallback(async () => {
    try {
      const response = await api.getSensores();
      setSensores(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar sensores:', error);
    }
  }, []);

  // Carregar leituras
  const loadLeituras = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (filtroSensor) {
        // Filtrar por sensor específico
        response = await api.getLeiturasBySensor(filtroSensor);
      } else if (dataInicio && dataFim) {
        // Filtrar por período
        response = await api.getLeiturasByPeriodo(dataInicio, dataFim);
      } else {
        // Carregar todas
        response = await api.getLeituras();
      }

      setLeituras(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar leituras:', error);
      toast.error('Erro ao carregar leituras');
      setLeituras([]);
    } finally {
      setLoading(false);
    }
  }, [filtroSensor, dataInicio, dataFim]);

  useEffect(() => {
    loadSensores();
  }, [loadSensores]);

  useEffect(() => {
    loadLeituras();
  }, [loadLeituras]);

  // Atualiza filtro de sensor quando vem da URL
  useEffect(() => {
    if (sensorIdFromUrl) {
      setFiltroSensor(sensorIdFromUrl);
    }
  }, [sensorIdFromUrl]);

  // Obter nome do sensor
  const getSensorNome = (idSensor) => {
    const sensor = sensores.find(s => s.id === idSensor);
    return sensor ? sensor.nome : `Sensor #${idSensor}`;
  };

  // Formatar data/hora
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  // Formatar valor com unidade
  const formatValor = (valor, tipo) => {
    const unidades = {
      temperatura: '°C',
      umidade: '%',
      pressao: 'hPa',
      luminosidade: 'lux',
      co2: 'ppm',
      ruido: 'dB'
    };
    const unidade = unidades[tipo?.toLowerCase()] || '';
    return `${valor}${unidade}`;
  };

  // Obter ícone do tipo de leitura
  const getTipoIcon = (tipo) => {
    const icons = {
      temperatura: '🌡️',
      umidade: '💧',
      pressao: '🌡️',
      luminosidade: '💡',
      co2: '☁️',
      ruido: '🔊'
    };
    return icons[tipo?.toLowerCase()] || '📊';
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};

    if (!formData.id_sensor) {
      errors.id_sensor = 'Selecione um sensor';
    }

    if (!formData.valor) {
      errors.valor = 'Informe o valor';
    } else if (isNaN(parseFloat(formData.valor))) {
      errors.valor = 'Valor deve ser numérico';
    }

    if (!formData.tipo_leitura) {
      errors.tipo_leitura = 'Selecione o tipo de leitura';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Abrir modal de criação
  const handleOpenCreate = () => {
    setFormData({
      id_sensor: filtroSensor || '',
      valor: '',
      tipo_leitura: '',
      timestamp: new Date().toISOString().slice(0, 16) // Formato: YYYY-MM-DDTHH:mm
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Abrir modal de visualização
  const handleView = (leitura) => {
    setSelectedLeitura(leitura);
    setShowViewModal(true);
  };

  // Abrir modal de exclusão
  const handleOpenDelete = (leitura) => {
    setSelectedLeitura(leitura);
    setShowDeleteModal(true);
  };

  // Criar leitura
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        id_sensor: parseInt(formData.id_sensor),
        valor: parseFloat(formData.valor),
        tipo_leitura: formData.tipo_leitura,
        timestamp: formData.timestamp || new Date().toISOString()
      };

      await api.createLeitura(payload);
      toast.success('Leitura registrada com sucesso!');
      setShowCreateModal(false);
      loadLeituras();
    } catch (error) {
      console.error('Erro ao criar leitura:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar leitura');
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir leitura
  const handleDelete = async () => {
    if (!selectedLeitura) return;

    try {
      setSubmitting(true);
      await api.deleteLeitura(selectedLeitura.id);
      toast.success('Leitura excluída com sucesso!');
      setShowDeleteModal(false);
      setSelectedLeitura(null);
      loadLeituras();
    } catch (error) {
      console.error('Erro ao excluir leitura:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir leitura');
    } finally {
      setSubmitting(false);
    }
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFiltroSensor('');
    setDataInicio('');
    setDataFim('');
    navigate('/leituras', { replace: true });
  };

  // Aplicar filtro de período
  const handleApplyPeriod = () => {
    if (dataInicio && dataFim) {
      loadLeituras();
    }
  };

  return (
    <div className="leituras-container">
      {/* Header */}
      <header className="leituras-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
        <h1>📊 Leituras dos Sensores</h1>
        <button className="btn-new" onClick={handleOpenCreate}>
          + Nova Leitura
        </button>
      </header>

      {/* Filtros */}
      <div className="leituras-filters">
        <div className="filter-group">
          <label>Sensor:</label>
          <select
            value={filtroSensor}
            onChange={(e) => setFiltroSensor(e.target.value)}
          >
            <option value="">Todos os sensores</option>
            {sensores.map(sensor => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.nome} ({sensor.tipo})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>De:</label>
          <input
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Até:</label>
          <input
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <button className="btn-filter" onClick={handleApplyPeriod}>
          🔍 Filtrar
        </button>

        <button className="btn-clear" onClick={handleClearFilters}>
          ✕ Limpar
        </button>

        <div className="filter-stats">
          <span className="stat-badge">
            {leituras.length} leitura{leituras.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Lista de leituras */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando leituras...</p>
        </div>
      ) : (
        <div className="leituras-content">
          {leituras.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>Nenhuma leitura encontrada</p>
              <button className="btn-new-empty" onClick={handleOpenCreate}>
                + Registrar Nova Leitura
              </button>
            </div>
          ) : (
            <div className="leituras-table-wrapper">
              <table className="leituras-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sensor</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Data/Hora</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leituras.map(leitura => (
                    <tr key={leitura.id}>
                      <td className="td-id">#{leitura.id}</td>
                      <td className="td-sensor">
                        <span className="sensor-badge">
                          {getSensorNome(leitura.id_sensor)}
                        </span>
                      </td>
                      <td className="td-tipo">
                        <span className="tipo-badge">
                          {getTipoIcon(leitura.tipo_leitura)} {leitura.tipo_leitura}
                        </span>
                      </td>
                      <td className="td-valor">
                        <span className="valor-badge">
                          {formatValor(leitura.valor, leitura.tipo_leitura)}
                        </span>
                      </td>
                      <td className="td-timestamp">
                        {formatDateTime(leitura.timestamp)}
                      </td>
                      <td className="td-actions">
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleView(leitura)}
                          title="Visualizar"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleOpenDelete(leitura)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="leituras-footer">
        <p>Sistema de Monitoramento Ambiental © 2025</p>
      </footer>

      {/* Modal Criar Leitura */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Registrar Nova Leitura</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Sensor *</label>
                <select
                  value={formData.id_sensor}
                  onChange={(e) => setFormData({...formData, id_sensor: e.target.value})}
                  className={formErrors.id_sensor ? 'error' : ''}
                >
                  <option value="">Selecione um sensor</option>
                  {sensores.filter(s => s.status === 'ativo').map(sensor => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.nome} ({sensor.tipo})
                    </option>
                  ))}
                </select>
                {formErrors.id_sensor && (
                  <span className="error-message">{formErrors.id_sensor}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 22.5"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    className={formErrors.valor ? 'error' : ''}
                  />
                  {formErrors.valor && (
                    <span className="error-message">{formErrors.valor}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Tipo de Leitura *</label>
                  <select
                    value={formData.tipo_leitura}
                    onChange={(e) => setFormData({...formData, tipo_leitura: e.target.value})}
                    className={formErrors.tipo_leitura ? 'error' : ''}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="temperatura">🌡️ Temperatura</option>
                    <option value="umidade">💧 Umidade</option>
                    <option value="pressao">🌡️ Pressão</option>
                    <option value="luminosidade">💡 Luminosidade</option>
                    <option value="co2">☁️ CO₂</option>
                    <option value="ruido">🔊 Ruído</option>
                  </select>
                  {formErrors.tipo_leitura && (
                    <span className="error-message">{formErrors.tipo_leitura}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Data/Hora (opcional)</label>
                <input
                  type="datetime-local"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({...formData, timestamp: e.target.value})}
                />
                <small className="form-hint">Se não informado, será usado o horário atual</small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Registrar Leitura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar Leitura */}
      {showViewModal && selectedLeitura && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Detalhes da Leitura #{selectedLeitura.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="view-body">
              <div className="view-main-value">
                <span className="view-icon">{getTipoIcon(selectedLeitura.tipo_leitura)}</span>
                <span className="view-valor">
                  {formatValor(selectedLeitura.valor, selectedLeitura.tipo_leitura)}
                </span>
                <span className="view-tipo">{selectedLeitura.tipo_leitura}</span>
              </div>

              <div className="view-info">
                <div className="info-item">
                  <span className="info-label">ID:</span>
                  <span className="info-value">#{selectedLeitura.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Sensor:</span>
                  <span className="info-value">{getSensorNome(selectedLeitura.id_sensor)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tipo:</span>
                  <span className="info-value">{selectedLeitura.tipo_leitura}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Valor:</span>
                  <span className="info-value">{selectedLeitura.valor}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Data/Hora:</span>
                  <span className="info-value">{formatDateTime(selectedLeitura.timestamp)}</span>
                </div>
                {selectedLeitura.createdAt && (
                  <div className="info-item">
                    <span className="info-label">Registrado em:</span>
                    <span className="info-value">{formatDateTime(selectedLeitura.createdAt)}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowViewModal(false)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn-sensor-link"
                  onClick={() => navigate(`/sensores`)}
                >
                  🔧 Ver Sensores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showDeleteModal && selectedLeitura && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmar Exclusão</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="confirm-body">
              <p>Deseja realmente excluir esta leitura?</p>
              <strong>
                {getTipoIcon(selectedLeitura.tipo_leitura)}{' '}
                {formatValor(selectedLeitura.valor, selectedLeitura.tipo_leitura)}
              </strong>
              <p className="location-info">
                Sensor: {getSensorNome(selectedLeitura.id_sensor)}<br />
                Data: {formatDateTime(selectedLeitura.timestamp)}
              </p>
              <p className="warning-text">
                Esta ação não pode ser desfeita!
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-delete-confirm"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? 'Excluindo...' : 'Excluir Leitura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leituras;
