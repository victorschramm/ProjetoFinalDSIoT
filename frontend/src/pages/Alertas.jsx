import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertTriangle, Bell, Clock, CheckCircle2, Ban, HelpCircle,
  Thermometer, Droplet, Radio, BatteryWarning, BarChart3,
  Eye, Pencil, Trash2, X
} from 'lucide-react';
import { Header, Drawer, Footer } from '../components';
import {
  getAlertas,
  getAlertasBySensor,
  getAlertasBySeveridade,
  updateAlerta,
  deleteAlerta,
  getSensores,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  isAdmin as checkIsAdmin,
  getProfile
} from '../services/api';
import '../styles/Alertas.css';

function Alertas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sensorIdFromUrl = searchParams.get('sensor');

  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Estados principais
  const [alertas, setAlertas] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [filtroSensor, setFiltroSensor] = useState(sensorIdFromUrl || '');
  const [filtroSeveridade, setFiltroSeveridade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Estados de modais
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState(null);

  // Estado do formulário de atualização
  const [formData, setFormData] = useState({
    status: '',
    resolucao: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Função de logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    setUserEmail(getUserEmail() || '');
    setIsUserAdmin(checkIsAdmin());

    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          const tipoUsuario = profile.tipo_Usuario || profile.tipo_usuario;
          setIsUserAdmin(tipoUsuario === 'admin');
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    loadProfile();
  }, [navigate]);

  // Keyboard events para drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Carregar sensores
  const loadSensores = useCallback(async () => {
    try {
      const data = await getSensores();
      setSensores(data || []);
    } catch (error) {
      console.error('Erro ao carregar sensores:', error);
    }
  }, []);

  // Carregar alertas
  const loadAlertas = useCallback(async () => {
    try {
      setLoading(true);
      let data;

      if (filtroSensor) {
        data = await getAlertasBySensor(filtroSensor);
      } else if (filtroSeveridade) {
        data = await getAlertasBySeveridade(filtroSeveridade);
      } else {
        data = await getAlertas();
      }

      // Aplicar filtro de status localmente
      let alertasFiltrados = data || [];
      if (filtroStatus) {
        alertasFiltrados = alertasFiltrados.filter(a => a.status === filtroStatus);
      }

      setAlertas(alertasFiltrados);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast.error(error.message || 'Erro ao carregar alertas');
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  }, [filtroSensor, filtroSeveridade, filtroStatus]);

  useEffect(() => {
    loadSensores();
  }, [loadSensores]);

  useEffect(() => {
    loadAlertas();
  }, [loadAlertas]);

  // Atualizar filtro de sensor quando vem da URL
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

  // Obter cor de severidade
  const getSeveridadeColor = (severidade) => {
    const colors = {
      baixo: '#2ecc71',
      medio: '#f1c40f',
      alto: '#e67e22',
      critico: '#e74c3c'
    };
    return colors[severidade?.toLowerCase()] || '#95a5a6';
  };

  // Obter ícone de status
  const getStatusIcon = (status) => {
    const icons = {
      ativo: Bell,
      pendente: Clock,
      resolvido: CheckCircle2,
      ignorado: Ban
    };
    return icons[status?.toLowerCase()] || HelpCircle;
  };

  // Obter cor de status
  const getStatusColor = (status) => {
    const colors = {
      ativo: '#e74c3c',
      pendente: '#f39c12',
      resolvido: '#27ae60',
      ignorado: '#95a5a6'
    };
    return colors[status?.toLowerCase()] || '#bdc3c7';
  };

  // Obter ícone do tipo de alerta
  const getTipoIcon = (tipo) => {
    const icons = {
      temperatura_alta: Thermometer,
      temperatura_baixa: Thermometer,
      umidade_alta: Droplet,
      umidade_baixa: Droplet,
      sensor_offline: Radio,
      bateria_baixa: BatteryWarning,
      limite_excedido: BarChart3
    };
    return icons[tipo?.toLowerCase()] || AlertTriangle;
  };

  // Abrir modal de visualização
  const handleView = (alerta) => {
    setSelectedAlerta(alerta);
    setShowViewModal(true);
  };

  // Abrir modal de atualização
  const handleOpenUpdate = (alerta) => {
    setSelectedAlerta(alerta);
    setFormData({
      status: alerta.status || 'ativo',
      resolucao: alerta.resolucao || ''
    });
    setShowUpdateModal(true);
  };

  // Abrir modal de exclusão
  const handleOpenDelete = (alerta) => {
    setSelectedAlerta(alerta);
    setShowDeleteModal(true);
  };

  // Atualizar alerta
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedAlerta) return;

    try {
      setSubmitting(true);
      await updateAlerta(selectedAlerta.id, formData);
      toast.success('Alerta atualizado com sucesso!');
      setShowUpdateModal(false);
      setSelectedAlerta(null);
      loadAlertas();
    } catch (error) {
      console.error('Erro ao atualizar alerta:', error);
      toast.error(error.message || 'Erro ao atualizar alerta');
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir alerta
  const handleDelete = async () => {
    if (!selectedAlerta) return;

    try {
      setSubmitting(true);
      await deleteAlerta(selectedAlerta.id);
      toast.success('Alerta excluído com sucesso!');
      setShowDeleteModal(false);
      setSelectedAlerta(null);
      loadAlertas();
    } catch (error) {
      console.error('Erro ao excluir alerta:', error);
      toast.error(error.message || 'Erro ao excluir alerta');
    } finally {
      setSubmitting(false);
    }
  };

  // Resolver alerta rapidamente
  const handleQuickResolve = async (alerta) => {
    try {
      await updateAlerta(alerta.id, { status: 'resolvido' });
      toast.success('Alerta marcado como resolvido!');
      loadAlertas();
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      toast.error(error.message || 'Erro ao resolver alerta');
    }
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFiltroSensor('');
    setFiltroSeveridade('');
    setFiltroStatus('');
    navigate('/alertas', { replace: true });
  };

  // Contar alertas por status
  const countByStatus = (statusPendenteOuArray) => {
    if (Array.isArray(statusPendenteOuArray)) {
      return alertas.filter(a => statusPendenteOuArray.includes(a.status)).length;
    }
    return alertas.filter(a => a.status === statusPendenteOuArray).length;
  };

  return (
    <div className="alertas-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Central de Alertas"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="alertas-container">
        {/* Toolbar */}
        <div className="alertas-toolbar">
          <h2><AlertTriangle size={18} className="icon-inline" /> Alertas do Sistema</h2>
          <div className="toolbar-stats">
            <span className="stat-item stat-ativo">
              <Bell size={14} className="icon-inline" /> {countByStatus('ativo')} Ativos
            </span>
            <span className="stat-item stat-pendente">
              <Clock size={14} className="icon-inline" /> {countByStatus('pendente')} Pendentes
            </span>
            <span className="stat-item stat-resolvido">
              <CheckCircle2 size={14} className="icon-inline" /> {countByStatus('resolvido')} Resolvidos
            </span>
            <span className="stat-item stat-ignorado">
              <Ban size={14} className="icon-inline" /> {countByStatus('ignorado')} Ignorados
            </span>
          </div>
        </div>

        {/* Filtros */}
      <div className="alertas-filters">
        <div className="filter-group">
          <label>Sensor:</label>
          <select
            value={filtroSensor}
            onChange={(e) => setFiltroSensor(e.target.value)}
          >
            <option value="">Todos os sensores</option>
            {sensores.map(sensor => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severidade:</label>
          <select
            value={filtroSeveridade}
            onChange={(e) => setFiltroSeveridade(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
            <option value="critico">Crítico</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="resolvido">Resolvido</option>
            <option value="ignorado">Ignorado</option>
          </select>
        </div>

        <button className="btn-clear" onClick={handleClearFilters}>
          <X size={16} className="icon-inline" /> Limpar
        </button>

        <div className="filter-stats">
          <span className="stat-badge">
            {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando alertas...</p>
        </div>
      ) : (
        <div className="alertas-content">
          {alertas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Bell size={32} className="icon-muted" /></span>
              <p>Nenhum alerta encontrado</p>
              <span className="empty-subtitle">
                Os alertas aparecerão aqui quando forem gerados
              </span>
            </div>
          ) : (
            <div className="alertas-list">
              {alertas.map(alerta => {
                const TipoIcon = getTipoIcon(alerta.tipo);
                const StatusIcon = getStatusIcon(alerta.status);
                return (
                <div
                  key={alerta.id}
                  className={`alerta-card severidade-${alerta.nivel_severidade?.toLowerCase()}`}
                >
                  <div className="alerta-header">
                    <div className="alerta-tipo">
                      <span className="tipo-icon"><TipoIcon size={18} className="icon-inline" /></span>
                      <span className="tipo-text">{alerta.tipo?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="alerta-badges">
                      <span
                        className="badge-severidade"
                        style={{ backgroundColor: getSeveridadeColor(alerta.nivel_severidade) }}
                      >
                        {alerta.nivel_severidade}
                      </span>
                      <span
                        className="badge-status"
                        style={{ backgroundColor: getStatusColor(alerta.status) }}
                      >
                        <StatusIcon size={14} className="icon-inline" /> {alerta.status}
                      </span>
                    </div>
                  </div>

                  <div className="alerta-body">
                    <p className="alerta-mensagem">{alerta.mensagem}</p>

                    <div className="alerta-details">
                      <div className="detail-item">
                        <span className="detail-icon"><Radio size={14} className="icon-inline icon-muted" /></span>
                        <span className="detail-label">Sensor:</span>
                        <span className="detail-value">{getSensorNome(alerta.id_sensor)}</span>
                      </div>

                      {alerta.valor_detectado !== null && alerta.valor_detectado !== undefined && (
                        <div className="detail-item">
                          <span className="detail-icon"><BarChart3 size={14} className="icon-inline icon-muted" /></span>
                          <span className="detail-label">Valor:</span>
                          <span className="detail-value valor">{alerta.valor_detectado}</span>
                        </div>
                      )}

                      <div className="detail-item">
                        <span className="detail-icon"><Clock size={14} className="icon-inline icon-muted" /></span>
                        <span className="detail-label">Data:</span>
                        <span className="detail-value">{formatDateTime(alerta.timestamp)}</span>
                      </div>
                    </div>

                    {alerta.resolucao && (
                      <div className="alerta-resolucao">
                        <span className="resolucao-icon"><CheckCircle2 size={14} className="icon-inline" /></span>
                        <span className="resolucao-text">{alerta.resolucao}</span>
                      </div>
                    )}
                  </div>

                  <div className="alerta-actions">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleView(alerta)}
                      title="Visualizar"
                    >
                      <Eye size={16} className="icon-inline" />
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleOpenUpdate(alerta)}
                      title="Atualizar Status"
                    >
                      <Pencil size={16} className="icon-inline" />
                    </button>
                    {alerta.status !== 'resolvido' && (
                      <button
                        className="btn-action btn-resolve"
                        onClick={() => handleQuickResolve(alerta)}
                        title="Marcar como Resolvido"
                      >
                        <CheckCircle2 size={16} className="icon-inline" />
                      </button>
                    )}
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleOpenDelete(alerta)}
                      title="Excluir"
                    >
                      <Trash2 size={16} className="icon-inline" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Visualizar Alerta */}
      {showViewModal && selectedAlerta && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><AlertTriangle size={18} className="icon-inline" /> Detalhes do Alerta #{selectedAlerta.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="view-body">
              <div className="view-main-alert">
                {(() => {
                  const ViewTipoIcon = getTipoIcon(selectedAlerta.tipo);
                  const ViewStatusIcon = getStatusIcon(selectedAlerta.status);
                  return (
                    <>
                      <span className="view-icon"><ViewTipoIcon size={20} className="icon-inline" /></span>
                      <span className="view-tipo">{selectedAlerta.tipo?.replace(/_/g, ' ')}</span>
                      <div className="view-badges">
                        <span
                          className="badge-severidade"
                          style={{ backgroundColor: getSeveridadeColor(selectedAlerta.nivel_severidade) }}
                        >
                          {selectedAlerta.nivel_severidade}
                        </span>
                        <span
                          className="badge-status"
                          style={{ backgroundColor: getStatusColor(selectedAlerta.status) }}
                        >
                          <ViewStatusIcon size={14} className="icon-inline" /> {selectedAlerta.status}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="view-message">
                <p>{selectedAlerta.mensagem}</p>
              </div>

              <div className="view-info">
                <div className="info-item">
                  <span className="info-label">ID:</span>
                  <span className="info-value">#{selectedAlerta.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Sensor:</span>
                  <span className="info-value">{getSensorNome(selectedAlerta.id_sensor)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tipo:</span>
                  <span className="info-value">{selectedAlerta.tipo}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Severidade:</span>
                  <span className="info-value">{selectedAlerta.nivel_severidade}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{selectedAlerta.status}</span>
                </div>
                {selectedAlerta.valor_detectado !== null && selectedAlerta.valor_detectado !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Valor Detectado:</span>
                    <span className="info-value">{selectedAlerta.valor_detectado}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Data/Hora:</span>
                  <span className="info-value">{formatDateTime(selectedAlerta.timestamp)}</span>
                </div>
                {selectedAlerta.resolucao && (
                  <div className="info-item">
                    <span className="info-label">Resolução:</span>
                    <span className="info-value">{selectedAlerta.resolucao}</span>
                  </div>
                )}
                {selectedAlerta.createdAt && (
                  <div className="info-item">
                    <span className="info-label">Criado em:</span>
                    <span className="info-value">{formatDateTime(selectedAlerta.createdAt)}</span>
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
                  className="btn-edit-action"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenUpdate(selectedAlerta);
                  }}
                >
                  <Pencil size={14} className="icon-inline" /> Atualizar Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atualizar Status */}
      {showUpdateModal && selectedAlerta && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Pencil size={18} className="icon-inline" /> Atualizar Alerta #{selectedAlerta.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowUpdateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="update-preview">
                {(() => {
                  const PreviewTipoIcon = getTipoIcon(selectedAlerta.tipo);
                  return <span className="preview-icon"><PreviewTipoIcon size={18} className="icon-inline" /></span>;
                })()}
                <span className="preview-tipo">{selectedAlerta.tipo?.replace(/_/g, ' ')}</span>
                <p className="preview-msg">{selectedAlerta.mensagem}</p>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="ignorado">Ignorado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resolução / Observação</label>
                <textarea
                  value={formData.resolucao}
                  onChange={(e) => setFormData({...formData, resolucao: e.target.value})}
                  placeholder="Descreva a ação tomada ou observações..."
                  rows="4"
                />
                <small className="form-hint">
                  Opcional: Descreva a ação tomada para resolver o alerta
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showDeleteModal && selectedAlerta && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><AlertTriangle size={18} className="icon-inline" /> Confirmar Exclusão</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="confirm-body">
              <p>Deseja realmente excluir este alerta?</p>
              <div className="confirm-preview">
                {(() => {
                  const ConfirmTipoIcon = getTipoIcon(selectedAlerta.tipo);
                  return <span className="preview-icon"><ConfirmTipoIcon size={18} className="icon-inline" /></span>;
                })()}
                <strong>{selectedAlerta.tipo?.replace(/_/g, ' ')}</strong>
              </div>
              <p className="confirm-msg">"{selectedAlerta.mensagem}"</p>
              <p className="location-info">
                Sensor: {getSensorNome(selectedAlerta.id_sensor)}<br />
                Data: {formatDateTime(selectedAlerta.timestamp)}
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
                  {submitting ? 'Excluindo...' : 'Excluir Alerta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Alertas;
