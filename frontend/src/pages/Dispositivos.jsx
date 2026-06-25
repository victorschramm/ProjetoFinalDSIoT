import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Radio, Wifi, Plug, Cpu, Wrench, Plus, Info, Eye, Pencil, Trash2,
  AlertTriangle, MessageSquare, Link2, Clock
} from 'lucide-react';
import { Header, Drawer, Footer } from '../components';
import { 
  getDispositivos, 
  getDispositivoById,
  createDispositivo,
  updateDispositivo, 
  deleteDispositivo,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  isAdmin as checkIsAdmin,
  getProfile
} from '../services/api';
import '../styles/Dispositivos.css';

const Dispositivos = () => {
  const navigate = useNavigate();
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Estados principais
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDispositivo, setSelectedDispositivo] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'ESP32',
    topico_mqtt: '',
    mac_address: '',
    descricao: '',
    status: 'ativo',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dispositivoToDelete, setDispositivoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filtros
  const [filterStatus, setFilterStatus] = useState('todos');

  // Função de logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Tipos de dispositivos disponíveis
  const tiposDispositivo = [
    { value: 'ESP32', label: 'ESP32' },
    { value: 'ESP8266', label: 'ESP8266' },
    { value: 'Arduino', label: 'Arduino' },
    { value: 'Raspberry', label: 'Raspberry Pi' },
    { value: 'outro', label: 'Outro' },
  ];

  // Status disponíveis
  const statusOptions = [
    { value: 'ativo', label: 'Ativo', color: '#2ecc71' },
    { value: 'inativo', label: 'Inativo', color: '#e74c3c' },
    { value: 'offline', label: 'Offline', color: '#95a5a6' },
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

  // Carregar dispositivos
  const loadData = async () => {
    try {
      setLoading(true);
      const dispositivosData = await getDispositivos();
      setDispositivos(dispositivosData);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'ESP32',
      topico_mqtt: '',
      mac_address: '',
      descricao: '',
      status: 'ativo',
    });
    setFormErrors({});
  };

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm();
    setModalMode('create');
    setSelectedDispositivo(null);
    setShowModal(true);
  };

  // Abrir modal para visualizar
  const handleView = async (dispositivo) => {
    try {
      setLoading(true);
      const data = await getDispositivoById(dispositivo.id);
      setSelectedDispositivo(data);
      setFormData({
        nome: data.nome || '',
        tipo: data.tipo || 'ESP32',
        topico_mqtt: data.topico_mqtt || '',
        mac_address: data.mac_address || '',
        descricao: data.descricao || '',
        status: data.status || 'ativo',
      });
      setModalMode('view');
      setShowModal(true);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar detalhes do dispositivo');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para editar
  const handleEdit = (dispositivo) => {
    setFormData({
      nome: dispositivo.nome || '',
      tipo: dispositivo.tipo || 'ESP32',
      topico_mqtt: dispositivo.topico_mqtt || '',
      mac_address: dispositivo.mac_address || '',
      descricao: dispositivo.descricao || '',
      status: dispositivo.status || 'ativo',
    });
    setFormErrors({});
    setSelectedDispositivo(dispositivo);
    setModalMode('edit');
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setSelectedDispositivo(null);
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    } else if (formData.nome.length < 2) {
      errors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.topico_mqtt.trim()) {
      errors.topico_mqtt = 'Tópico MQTT é obrigatório';
    } else if (formData.topico_mqtt.includes(' ')) {
      errors.topico_mqtt = 'Tópico não pode conter espaços';
    }
    
    if (!formData.tipo) {
      errors.tipo = 'Tipo é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        await createDispositivo(formData);
        toast.success('Dispositivo cadastrado com sucesso!');
      } else if (modalMode === 'edit') {
        await updateDispositivo(selectedDispositivo.id, formData);
        toast.success('Dispositivo atualizado com sucesso!');
      }
      
      handleCloseModal();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar dispositivo');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar exclusão
  const handleDeleteClick = (dispositivo) => {
    setDispositivoToDelete(dispositivo);
    setShowDeleteConfirm(true);
  };

  // Executar exclusão
  const handleDeleteConfirm = async () => {
    if (!dispositivoToDelete) return;
    
    setDeleting(true);
    
    try {
      await deleteDispositivo(dispositivoToDelete.id);
      toast.success('Dispositivo excluído com sucesso!');
      setShowDeleteConfirm(false);
      setDispositivoToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir dispositivo');
    } finally {
      setDeleting(false);
    }
  };

  // Filtrar dispositivos
  const dispositivosFiltrados = dispositivos.filter(d => {
    if (filterStatus !== 'todos' && d.status !== filterStatus) return false;
    return true;
  });

  // Formatar última conexão
  const formatUltimaConexao = (data) => {
    if (!data) return 'Nunca conectou';
    const date = new Date(data);
    return date.toLocaleString('pt-BR');
  };

  // Obter cor do status
  const getStatusColor = (status) => {
    const colors = {
      ativo: '#2ecc71',
      inativo: '#e74c3c',
      offline: '#95a5a6',
    };
    return colors[status] || '#bdc3c7';
  };

  // Obter ícone do tipo de dispositivo
  const getTipoIcon = (tipo) => {
    const icons = {
      ESP32: Radio,
      ESP8266: Wifi,
      Arduino: Plug,
      Raspberry: Cpu,
    };
    return icons[tipo] || Wrench;
  };

  return (
    <div className="dispositivos-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Dispositivos ESP"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      {/* Conteúdo */}
      <div className="container">
        {/* Cabeçalho da página */}
        <div className="page-header">
          <div className="page-title">
            <h1><Radio size={22} className="icon-inline" /> Dispositivos IoT</h1>
            <p>Gerencie seus dispositivos ESP32/ESP8266 e tópicos MQTT</p>
          </div>
          <button className="btn-primary" onClick={handleCreate}>
            <Plus size={16} className="icon-inline" /> Novo Dispositivo
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h3><Info size={16} className="icon-inline" /> Como funciona?</h3>
          <ol>
            <li><strong>Cadastre o dispositivo</strong> com o tópico MQTT que ele publica</li>
            <li><strong>Crie um sensor</strong> e vincule ao dispositivo</li>
            <li><strong>Vincule o sensor a um ambiente</strong> (sala, laboratório, etc.)</li>
            <li><strong>Pronto!</strong> As leituras serão exibidas no Dashboard</li>
          </ol>
        </div>

        {/* Filtros */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="filter-stats">
            <span className="stat-badge">
              <Radio size={14} className="icon-inline" /> {dispositivos.length} dispositivo(s)
            </span>
            <span className="stat-badge success">
              <span className="status-dot" style={{ background: '#2ecc71' }} /> {dispositivos.filter(d => d.status === 'ativo').length} ativo(s)
            </span>
          </div>
        </div>

        {/* Lista de dispositivos */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando dispositivos...</p>
          </div>
        ) : dispositivosFiltrados.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><Radio size={32} className="icon-muted" /></span>
            <h3>Nenhum dispositivo cadastrado</h3>
            <p>Cadastre seu primeiro dispositivo ESP para começar a receber dados</p>
            <button className="btn-primary" onClick={handleCreate}>
              <Plus size={16} className="icon-inline" /> Cadastrar Dispositivo
            </button>
          </div>
        ) : (
          <div className="dispositivos-grid">
            {dispositivosFiltrados.map((dispositivo) => {
              const TipoIcon = getTipoIcon(dispositivo.tipo);
              return (
              <div key={dispositivo.id} className={`dispositivo-card ${dispositivo.status}`}>
                <div className="card-header">
                  <div className="card-icon">
                    <TipoIcon size={20} className="icon-inline" />
                  </div>
                  <div className="card-status">
                    <span className="status-dot" style={{ background: getStatusColor(dispositivo.status) }} /> {dispositivo.status}
                  </div>
                </div>

                <div className="card-body">
                  <h3>{dispositivo.nome}</h3>
                  <p className="card-tipo">{dispositivo.tipo}</p>

                  <div className="card-info">
                    <div className="info-item">
                      <span className="info-label"><MessageSquare size={14} className="icon-inline icon-muted" /> Tópico MQTT:</span>
                      <code className="info-value">{dispositivo.topico_mqtt}</code>
                    </div>

                    {dispositivo.mac_address && (
                      <div className="info-item">
                        <span className="info-label"><Link2 size={14} className="icon-inline icon-muted" /> MAC:</span>
                        <code className="info-value">{dispositivo.mac_address}</code>
                      </div>
                    )}

                    <div className="info-item">
                      <span className="info-label"><Clock size={14} className="icon-inline icon-muted" /> Última conexão:</span>
                      <span className="info-value">{formatUltimaConexao(dispositivo.ultima_conexao)}</span>
                    </div>
                  </div>

                  {dispositivo.descricao && (
                    <p className="card-descricao">{dispositivo.descricao}</p>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleView(dispositivo)}
                    title="Visualizar"
                  >
                    <Eye size={16} className="icon-inline" />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(dispositivo)}
                    title="Editar"
                  >
                    <Pencil size={16} className="icon-inline" />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDeleteClick(dispositivo)}
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

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'create' ? <><Plus size={18} className="icon-inline" /> Novo Dispositivo</> :
                 modalMode === 'edit' ? <><Pencil size={18} className="icon-inline" /> Editar Dispositivo</> :
                 <><Eye size={18} className="icon-inline" /> Detalhes do Dispositivo</>}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Nome */}
                <div className="form-group">
                  <label htmlFor="nome">Nome do Dispositivo *</label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    disabled={modalMode === 'view'}
                    placeholder="Ex: ESP32 Sala Principal"
                    className={formErrors.nome ? 'error' : ''}
                  />
                  {formErrors.nome && <span className="error-text">{formErrors.nome}</span>}
                </div>

                {/* Tipo */}
                <div className="form-group">
                  <label htmlFor="tipo">Tipo de Dispositivo *</label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    disabled={modalMode === 'view'}
                    className={formErrors.tipo ? 'error' : ''}
                  >
                    {tiposDispositivo.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.tipo && <span className="error-text">{formErrors.tipo}</span>}
                </div>

                {/* Tópico MQTT */}
                <div className="form-group">
                  <label htmlFor="topico_mqtt">Tópico MQTT *</label>
                  <input
                    type="text"
                    id="topico_mqtt"
                    value={formData.topico_mqtt}
                    onChange={(e) => setFormData({...formData, topico_mqtt: e.target.value})}
                    disabled={modalMode === 'view'}
                    placeholder="Ex: ProjetoFinalIot"
                    className={formErrors.topico_mqtt ? 'error' : ''}
                  />
                  <small className="form-hint">
                    O mesmo tópico configurado no código do ESP
                  </small>
                  {formErrors.topico_mqtt && <span className="error-text">{formErrors.topico_mqtt}</span>}
                </div>

                {/* MAC Address */}
                <div className="form-group">
                  <label htmlFor="mac_address">Endereço MAC (opcional)</label>
                  <input
                    type="text"
                    id="mac_address"
                    value={formData.mac_address}
                    onChange={(e) => setFormData({...formData, mac_address: e.target.value})}
                    disabled={modalMode === 'view'}
                    placeholder="Ex: AA:BB:CC:DD:EE:FF"
                  />
                </div>

                {/* Descrição */}
                <div className="form-group">
                  <label htmlFor="descricao">Descrição (opcional)</label>
                  <textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    disabled={modalMode === 'view'}
                    placeholder="Descreva o dispositivo e sua localização"
                    rows={3}
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    disabled={modalMode === 'view'}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Última conexão (apenas view) */}
                {modalMode === 'view' && selectedDispositivo && (
                  <div className="form-group">
                    <label>Última Conexão</label>
                    <p className="view-value">
                      {formatUltimaConexao(selectedDispositivo.ultima_conexao)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                {modalMode !== 'view' && (
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Salvando...' : modalMode === 'create' ? 'Cadastrar' : 'Salvar'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger">
              <h2><AlertTriangle size={18} className="icon-inline" /> Confirmar Exclusão</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>

            <div className="modal-body">
              <p>
                Tem certeza que deseja excluir o dispositivo <strong>"{dispositivoToDelete?.nome}"</strong>?
              </p>
              <p className="warning-text">
                <AlertTriangle size={14} className="icon-inline" /> Os sensores vinculados a este dispositivo deixarão de receber dados!
              </p>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dispositivos;
