import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header, Drawer, Footer } from '../components';
import { 
  getAmbientes, 
  getAmbienteById,
  createAmbiente,
  updateAmbiente, 
  deleteAmbiente,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  isAdmin as checkIsAdmin,
  getProfile
} from '../services/api';
import '../styles/Ambientes.css';

const Ambientes = () => {
  const navigate = useNavigate();
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Estados principais
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedAmbiente, setSelectedAmbiente] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    localizacao: '',
    temperatura_ideal: '',
    umidade_ideal: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ambienteToDelete, setAmbienteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    loadAmbientes();
  }, [navigate]);

  // Keyboard events para drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Carregar ambientes
  const loadAmbientes = async () => {
    try {
      setLoading(true);
      const data = await getAmbientes();
      setAmbientes(data);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar ambientes');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      localizacao: '',
      temperatura_ideal: '',
      umidade_ideal: '',
    });
    setFormErrors({});
  };

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm();
    setModalMode('create');
    setSelectedAmbiente(null);
    setShowModal(true);
  };

  // Abrir modal para visualizar
  const handleView = async (ambiente) => {
    try {
      setLoading(true);
      const data = await getAmbienteById(ambiente.id);
      setSelectedAmbiente(data);
      setFormData({
        nome: data.nome || '',
        descricao: data.descricao || '',
        localizacao: data.localizacao || '',
        temperatura_ideal: data.temperatura_ideal || '',
        umidade_ideal: data.umidade_ideal || '',
      });
      setModalMode('view');
      setShowModal(true);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar detalhes do ambiente');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para editar
  const handleEdit = (ambiente) => {
    setFormData({
      nome: ambiente.nome || '',
      descricao: ambiente.descricao || '',
      localizacao: ambiente.localizacao || '',
      temperatura_ideal: ambiente.temperatura_ideal || '',
      umidade_ideal: ambiente.umidade_ideal || '',
    });
    setFormErrors({});
    setSelectedAmbiente(ambiente);
    setModalMode('edit');
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setSelectedAmbiente(null);
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    } else if (formData.nome.length < 2) {
      errors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.localizacao.trim()) {
      errors.localizacao = 'Localização é obrigatória';
    }
    
    if (formData.temperatura_ideal !== '' && formData.temperatura_ideal !== null) {
      const temp = parseFloat(formData.temperatura_ideal);
      if (isNaN(temp) || temp < -50 || temp > 100) {
        errors.temperatura_ideal = 'Temperatura deve estar entre -50°C e 100°C';
      }
    }
    
    if (formData.umidade_ideal !== '' && formData.umidade_ideal !== null) {
      const umid = parseFloat(formData.umidade_ideal);
      if (isNaN(umid) || umid < 0 || umid > 100) {
        errors.umidade_ideal = 'Umidade deve estar entre 0% e 100%';
      }
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
        descricao: formData.descricao || null,
        localizacao: formData.localizacao,
        temperatura_ideal: formData.temperatura_ideal ? parseFloat(formData.temperatura_ideal) : null,
        umidade_ideal: formData.umidade_ideal ? parseFloat(formData.umidade_ideal) : null,
      };
      
      if (modalMode === 'create') {
        await createAmbiente(dataToSend);
        toast.success('Ambiente criado com sucesso!');
      } else if (modalMode === 'edit') {
        await updateAmbiente(selectedAmbiente.id, dataToSend);
        toast.success('Ambiente atualizado com sucesso!');
      }
      
      handleCloseModal();
      loadAmbientes();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar ambiente');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir confirmação de exclusão
  const handleDeleteClick = (ambiente) => {
    setAmbienteToDelete(ambiente);
    setShowDeleteConfirm(true);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!ambienteToDelete) return;
    
    try {
      setDeleting(true);
      await deleteAmbiente(ambienteToDelete.id);
      toast.success('Ambiente deletado com sucesso!');
      setShowDeleteConfirm(false);
      setAmbienteToDelete(null);
      loadAmbientes();
    } catch (err) {
      toast.error(err.message || 'Erro ao deletar ambiente');
    } finally {
      setDeleting(false);
    }
  };

  // Cancelar exclusão
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAmbienteToDelete(null);
  };

  // Voltar para dashboard
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Renderizar título do modal
  const getModalTitle = () => {
    switch (modalMode) {
      case 'create': return '➕ Novo Ambiente';
      case 'edit': return '✏️ Editar Ambiente';
      case 'view': return '👁️ Detalhes do Ambiente';
      default: return 'Ambiente';
    }
  };

  return (
    <div className="ambientes-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Gerenciar Ambientes"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="ambientes-container">
        {/* Toolbar */}
        <div className="ambientes-toolbar">
          <h2>🏢 Ambientes Cadastrados</h2>
          <button className="btn-new" onClick={handleCreate}>
            + Novo Ambiente
          </button>
        </div>

      {/* Loading */}
      {loading && !showModal ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando ambientes...</p>
        </div>
      ) : (
        /* Cards de ambientes */
        <div className="ambientes-grid">
          {ambientes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏢</span>
              <p>Nenhum ambiente cadastrado.</p>
              <button className="btn-new-empty" onClick={handleCreate}>
                Criar primeiro ambiente
              </button>
            </div>
          ) : (
            ambientes.map((ambiente) => (
              <div key={ambiente.id} className="ambiente-card">
                <div className="card-header">
                  <h3>{ambiente.nome}</h3>
                  <span className="ambiente-id">#{ambiente.id}</span>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span className="info-icon">📍</span>
                    <span className="info-label">Localização:</span>
                    <span className="info-value">{ambiente.localizacao || '-'}</span>
                  </div>
                  
                  {ambiente.descricao && (
                    <div className="info-row">
                      <span className="info-icon">📝</span>
                      <span className="info-label">Descrição:</span>
                      <span className="info-value description">{ambiente.descricao}</span>
                    </div>
                  )}
                  
                  <div className="metrics-row">
                    <div className="metric">
                      <span className="metric-icon">🌡️</span>
                      <span className="metric-label">Temp. Ideal</span>
                      <span className="metric-value">
                        {ambiente.temperatura_ideal !== null ? `${ambiente.temperatura_ideal}°C` : '-'}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">💧</span>
                      <span className="metric-label">Umid. Ideal</span>
                      <span className="metric-value">
                        {ambiente.umidade_ideal !== null ? `${ambiente.umidade_ideal}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="btn-action btn-view" 
                    onClick={() => handleView(ambiente)}
                    title="Visualizar"
                  >
                    👁️
                  </button>
                  <button 
                    className="btn-action btn-edit" 
                    onClick={() => handleEdit(ambiente)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-action btn-delete" 
                    onClick={() => handleDeleteClick(ambiente)}
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
                  placeholder="Ex: Sala dos Servidores"
                  className={formErrors.nome ? 'error' : ''}
                  disabled={submitting || modalMode === 'view'}
                />
                {formErrors.nome && <span className="error-message">{formErrors.nome}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="localizacao">Localização *</label>
                <input
                  type="text"
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Bloco A, 2º Andar"
                  className={formErrors.localizacao ? 'error' : ''}
                  disabled={submitting || modalMode === 'view'}
                />
                {formErrors.localizacao && <span className="error-message">{formErrors.localizacao}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do ambiente..."
                  rows="3"
                  disabled={submitting || modalMode === 'view'}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="temperatura_ideal">Temperatura Ideal (°C)</label>
                  <input
                    type="number"
                    id="temperatura_ideal"
                    value={formData.temperatura_ideal}
                    onChange={(e) => setFormData({ ...formData, temperatura_ideal: e.target.value })}
                    placeholder="Ex: 22"
                    step="0.1"
                    min="-50"
                    max="100"
                    className={formErrors.temperatura_ideal ? 'error' : ''}
                    disabled={submitting || modalMode === 'view'}
                  />
                  {formErrors.temperatura_ideal && <span className="error-message">{formErrors.temperatura_ideal}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="umidade_ideal">Umidade Ideal (%)</label>
                  <input
                    type="number"
                    id="umidade_ideal"
                    value={formData.umidade_ideal}
                    onChange={(e) => setFormData({ ...formData, umidade_ideal: e.target.value })}
                    placeholder="Ex: 60"
                    step="0.1"
                    min="0"
                    max="100"
                    className={formErrors.umidade_ideal ? 'error' : ''}
                    disabled={submitting || modalMode === 'view'}
                  />
                  {formErrors.umidade_ideal && <span className="error-message">{formErrors.umidade_ideal}</span>}
                </div>
              </div>

              {/* Informações adicionais no modo visualização */}
              {modalMode === 'view' && selectedAmbiente && (
                <div className="view-info">
                  <div className="info-item">
                    <span className="info-label">ID:</span>
                    <span className="info-value">{selectedAmbiente.id}</span>
                  </div>
                  {selectedAmbiente.createdAt && (
                    <div className="info-item">
                      <span className="info-label">Criado em:</span>
                      <span className="info-value">
                        {new Date(selectedAmbiente.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {selectedAmbiente.updatedAt && (
                    <div className="info-item">
                      <span className="info-label">Atualizado em:</span>
                      <span className="info-value">
                        {new Date(selectedAmbiente.updatedAt).toLocaleString('pt-BR')}
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
                      className="btn-edit-action" 
                      onClick={() => {
                        setModalMode('edit');
                      }}
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
              <p>Tem certeza que deseja excluir o ambiente:</p>
              <strong>"{ambienteToDelete?.nome}"</strong>
              <p className="location-info">📍 {ambienteToDelete?.localizacao}</p>
              <p className="warning-text">Esta ação não pode ser desfeita!</p>
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

export default Ambientes;
