import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header, Drawer, Footer } from '../components';
import { 
  getSensores, 
  getSensorById,
  createSensor,
  updateSensor, 
  deleteSensor,
  getAmbientes,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  isAdmin as checkIsAdmin,
  getProfile
} from '../services/api';
import '../styles/Sensores.css';

const Sensores = () => {
  const navigate = useNavigate();
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Estados principais
  const [sensores, setSensores] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSensor, setSelectedSensor] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    modelo: '',
    descricao: '',
    id_ambiente: '',
    status: 'ativo',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sensorToDelete, setSensorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filtros
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Função de logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Tipos de sensores disponíveis
  const tiposSensor = [
    { value: 'temperatura', label: '🌡️ Temperatura', icon: '🌡️' },
    { value: 'umidade', label: '💧 Umidade', icon: '💧' },
    { value: 'pressao', label: '🌀 Pressão', icon: '🌀' },
    { value: 'luminosidade', label: '💡 Luminosidade', icon: '💡' },
    { value: 'movimento', label: '🚶 Movimento', icon: '🚶' },
    { value: 'gas', label: '💨 Gás', icon: '💨' },
    { value: 'outro', label: '📡 Outro', icon: '📡' },
  ];

  // Status disponíveis
  const statusOptions = [
    { value: 'ativo', label: '🟢 Ativo', color: '#2ecc71' },
    { value: 'inativo', label: '🔴 Inativo', color: '#e74c3c' },
    { value: 'manutencao', label: '🟡 Manutenção', color: '#f39c12' },
  ];

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
    loadData();
  }, [navigate]);

  // Keyboard events para drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Carregar sensores e ambientes
  const loadData = async () => {
    try {
      setLoading(true);
      const [sensoresData, ambientesData] = await Promise.all([
        getSensores(),
        getAmbientes()
      ]);
      setSensores(sensoresData);
      setAmbientes(ambientesData);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: '',
      modelo: '',
      descricao: '',
      id_ambiente: '',
      status: 'ativo',
    });
    setFormErrors({});
  };

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm();
    setModalMode('create');
    setSelectedSensor(null);
    setShowModal(true);
  };

  // Abrir modal para visualizar
  const handleView = async (sensor) => {
    try {
      setLoading(true);
      const data = await getSensorById(sensor.id);
      setSelectedSensor(data);
      setFormData({
        nome: data.nome || '',
        tipo: data.tipo || '',
        modelo: data.modelo || '',
        descricao: data.descricao || '',
        id_ambiente: data.id_ambiente || '',
        status: data.status || 'ativo',
      });
      setModalMode('view');
      setShowModal(true);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar detalhes do sensor');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para editar
  const handleEdit = (sensor) => {
    setFormData({
      nome: sensor.nome || '',
      tipo: sensor.tipo || '',
      modelo: sensor.modelo || '',
      descricao: sensor.descricao || '',
      id_ambiente: sensor.id_ambiente || '',
      status: sensor.status || 'ativo',
    });
    setFormErrors({});
    setSelectedSensor(sensor);
    setModalMode('edit');
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setSelectedSensor(null);
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    } else if (formData.nome.length < 2) {
      errors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.tipo) {
      errors.tipo = 'Tipo é obrigatório';
    }
    
    if (!formData.id_ambiente) {
      errors.id_ambiente = 'Ambiente é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const dataToSend = {
        nome: formData.nome,
        tipo: formData.tipo,
        modelo: formData.modelo || null,
        descricao: formData.descricao || null,
        id_ambiente: parseInt(formData.id_ambiente),
        status: formData.status,
      };
      
      if (modalMode === 'create') {
        await createSensor(dataToSend);
        toast.success('Sensor criado com sucesso!');
      } else if (modalMode === 'edit') {
        await updateSensor(selectedSensor.id, dataToSend);
        toast.success('Sensor atualizado com sucesso!');
      }
      
      handleCloseModal();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar sensor');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir confirmação de exclusão
  const handleDeleteClick = (sensor) => {
    setSensorToDelete(sensor);
    setShowDeleteConfirm(true);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!sensorToDelete) return;
    
    try {
      setDeleting(true);
      await deleteSensor(sensorToDelete.id);
      toast.success('Sensor deletado com sucesso!');
      setShowDeleteConfirm(false);
      setSensorToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao deletar sensor');
    } finally {
      setDeleting(false);
    }
  };

  // Cancelar exclusão
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSensorToDelete(null);
  };

  // Voltar para dashboard
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Navegar para leituras do sensor
  const handleViewLeituras = (sensor) => {
    navigate(`/leituras?sensor=${sensor.id}`);
  };

  // Obter nome do ambiente
  const getAmbienteNome = (id) => {
    const ambiente = ambientes.find(a => a.id === id);
    return ambiente ? ambiente.nome : 'N/A';
  };

  // Obter ícone do tipo
  const getTipoIcon = (tipo) => {
    const tipoObj = tiposSensor.find(t => t.value === tipo);
    return tipoObj ? tipoObj.icon : '📡';
  };

  // Obter cor do status
  const getStatusColor = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.color : '#888';
  };

  // Renderizar título do modal
  const getModalTitle = () => {
    switch (modalMode) {
      case 'create': return '➕ Novo Sensor';
      case 'edit': return '✏️ Editar Sensor';
      case 'view': return '👁️ Detalhes do Sensor';
      default: return 'Sensor';
    }
  };

  // Filtrar sensores
  const sensoresFiltrados = sensores.filter(sensor => {
    if (filterStatus !== 'todos' && sensor.status !== filterStatus) return false;
    if (filterTipo !== 'todos' && sensor.tipo !== filterTipo) return false;
    return true;
  });

  return (
    <div className="sensores-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Gerenciar Sensores"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="sensores-container">
        {/* Toolbar */}
        <div className="sensores-toolbar">
          <h2>📡 Sensores Cadastrados</h2>
          <button className="btn-new" onClick={handleCreate}>
            + Novo Sensor
          </button>
        </div>

      {/* Filtros */}
      <div className="sensores-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="todos">Todos</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Tipo:</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="todos">Todos</option>
            {tiposSensor.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-stats">
          <span className="stat-badge">
            📡 {sensoresFiltrados.length} sensor{sensoresFiltrados.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && !showModal ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando sensores...</p>
        </div>
      ) : (
        /* Cards de sensores */
        <div className="sensores-grid">
          {sensoresFiltrados.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📡</span>
              <p>Nenhum sensor encontrado.</p>
              <button className="btn-new-empty" onClick={handleCreate}>
                Criar primeiro sensor
              </button>
            </div>
          ) : (
            sensoresFiltrados.map((sensor) => (
              <div key={sensor.id} className="sensor-card">
                <div className="card-header">
                  <div className="sensor-icon">{getTipoIcon(sensor.tipo)}</div>
                  <div className="sensor-info">
                    <h3>{sensor.nome}</h3>
                    <span className="sensor-modelo">{sensor.modelo || 'Sem modelo'}</span>
                  </div>
                  <span 
                    className="sensor-status" 
                    style={{ backgroundColor: getStatusColor(sensor.status) }}
                  >
                    {sensor.status}
                  </span>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span className="info-icon">🏷️</span>
                    <span className="info-label">Tipo:</span>
                    <span className="info-value">{sensor.tipo}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-icon">🏢</span>
                    <span className="info-label">Ambiente:</span>
                    <span className="info-value">{getAmbienteNome(sensor.id_ambiente)}</span>
                  </div>
                  
                  {sensor.descricao && (
                    <div className="info-row">
                      <span className="info-icon">📝</span>
                      <span className="info-label">Descrição:</span>
                      <span className="info-value description">{sensor.descricao}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  <button 
                    className="btn-action btn-leituras" 
                    onClick={() => handleViewLeituras(sensor)}
                    title="Ver Leituras"
                  >
                    📊
                  </button>
                  <button 
                    className="btn-action btn-view" 
                    onClick={() => handleView(sensor)}
                    title="Visualizar"
                  >
                    👁️
                  </button>
                  <button 
                    className="btn-action btn-edit" 
                    onClick={() => handleEdit(sensor)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-action btn-delete" 
                    onClick={() => handleDeleteClick(sensor)}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de criação/edição/visualização */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getModalTitle()}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Sensor Temperatura 01"
                  className={formErrors.nome ? 'error' : ''}
                  disabled={submitting || modalMode === 'view'}
                />
                {formErrors.nome && <span className="error-message">{formErrors.nome}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipo">Tipo *</label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className={formErrors.tipo ? 'error' : ''}
                    disabled={submitting || modalMode === 'view'}
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposSensor.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                  {formErrors.tipo && <span className="error-message">{formErrors.tipo}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={submitting || modalMode === 'view'}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modelo">Modelo</label>
                  <input
                    type="text"
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ex: DHT22"
                    disabled={submitting || modalMode === 'view'}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="id_ambiente">Ambiente *</label>
                  <select
                    id="id_ambiente"
                    value={formData.id_ambiente}
                    onChange={(e) => setFormData({ ...formData, id_ambiente: e.target.value })}
                    className={formErrors.id_ambiente ? 'error' : ''}
                    disabled={submitting || modalMode === 'view'}
                  >
                    <option value="">Selecione o ambiente</option>
                    {ambientes.map(ambiente => (
                      <option key={ambiente.id} value={ambiente.id}>
                        {ambiente.nome} - {ambiente.localizacao}
                      </option>
                    ))}
                  </select>
                  {formErrors.id_ambiente && <span className="error-message">{formErrors.id_ambiente}</span>}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do sensor..."
                  rows="3"
                  disabled={submitting || modalMode === 'view'}
                />
              </div>

              {/* Informações adicionais no modo visualização */}
              {modalMode === 'view' && selectedSensor && (
                <div className="view-info">
                  <div className="info-item">
                    <span className="info-label">ID:</span>
                    <span className="info-value">{selectedSensor.id}</span>
                  </div>
                  {selectedSensor.createdAt && (
                    <div className="info-item">
                      <span className="info-label">Criado em:</span>
                      <span className="info-value">
                        {new Date(selectedSensor.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {selectedSensor.updatedAt && (
                    <div className="info-item">
                      <span className="info-label">Atualizado em:</span>
                      <span className="info-value">
                        {new Date(selectedSensor.updatedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="modal-actions">
                {modalMode === 'view' ? (
                  <>
                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                      Fechar
                    </button>
                    <button 
                      type="button" 
                      className="btn-leituras-action" 
                      onClick={() => handleViewLeituras(selectedSensor)}
                    >
                      📊 Ver Leituras
                    </button>
                    <button 
                      type="button" 
                      className="btn-edit-action" 
                      onClick={() => setModalMode('edit')}
                    >
                      ✏️ Editar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit" disabled={submitting}>
                      {submitting ? 'Salvando...' : (modalMode === 'create' ? 'Criar' : 'Salvar')}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmar Exclusão</h2>
            </div>
            
            <div className="confirm-body">
              <p>Tem certeza que deseja excluir o sensor:</p>
              <strong>"{sensorToDelete?.nome}"</strong>
              <p className="location-info">🏢 {getAmbienteNome(sensorToDelete?.id_ambiente)}</p>
              <p className="warning-text">Esta ação não pode ser desfeita!</p>
              <p className="warning-text">Todas as leituras associadas serão perdidas.</p>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleDeleteCancel} disabled={deleting}>
                Cancelar
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Sensores;
