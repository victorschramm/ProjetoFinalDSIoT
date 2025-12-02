import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header, Drawer, Footer } from '../components';
import { 
  getNiveisAcesso, 
  createNivelAcesso, 
  updateNivelAcesso, 
  deleteNivelAcesso,
  isAdmin,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  getProfile
} from '../services/api';
import '../styles/NiveisAcesso.css';

const NiveisAcesso = () => {
  const navigate = useNavigate();
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Estados
  const [niveis, setNiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [selectedNivel, setSelectedNivel] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nivel: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nivelToDelete, setNivelToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Função de logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Verificar permissão de admin
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    
    setUserEmail(getUserEmail() || '');
    setIsUserAdmin(true); // Se chegou até aqui, é admin

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
    loadNiveis();
  }, [navigate]);

  // Keyboard events para drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Carregar níveis de acesso
  const loadNiveis = async () => {
    try {
      setLoading(true);
      const data = await getNiveisAcesso();
      setNiveis(data);
    } catch (err) {
      if (err.status === 403) {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      } else {
        toast.error(err.message || 'Erro ao carregar níveis de acesso');
      }
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setModalMode('create');
    setFormData({ nome: '', descricao: '', nivel: 1 });
    setFormErrors({});
    setSelectedNivel(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (nivel) => {
    setModalMode('edit');
    setFormData({
      nome: nivel.nome,
      descricao: nivel.descricao || '',
      nivel: nivel.nivel || 1,
    });
    setFormErrors({});
    setSelectedNivel(nivel);
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nome: '', descricao: '', nivel: 1 });
    setFormErrors({});
    setSelectedNivel(null);
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    } else if (formData.nome.length < 2) {
      errors.nome = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.nome.length > 50) {
      errors.nome = 'Nome deve ter no máximo 50 caracteres';
    }
    
    if (formData.descricao && formData.descricao.length > 255) {
      errors.descricao = 'Descrição deve ter no máximo 255 caracteres';
    }
    
    if (!formData.nivel || formData.nivel < 1 || formData.nivel > 10) {
      errors.nivel = 'Nível deve ser entre 1 e 10';
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
      
      if (modalMode === 'create') {
        await createNivelAcesso(formData);
        toast.success('Nível de acesso criado com sucesso!');
      } else {
        await updateNivelAcesso(selectedNivel.id, formData);
        toast.success('Nível de acesso atualizado com sucesso!');
      }
      
      handleCloseModal();
      loadNiveis();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar nível de acesso');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir confirmação de exclusão
  const handleDeleteClick = (nivel) => {
    setNivelToDelete(nivel);
    setShowDeleteConfirm(true);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!nivelToDelete) return;
    
    try {
      setDeleting(true);
      await deleteNivelAcesso(nivelToDelete.id);
      toast.success('Nível de acesso deletado com sucesso!');
      setShowDeleteConfirm(false);
      setNivelToDelete(null);
      loadNiveis();
    } catch (err) {
      toast.error(err.message || 'Erro ao deletar nível de acesso');
    } finally {
      setDeleting(false);
    }
  };

  // Cancelar exclusão
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setNivelToDelete(null);
  };

  return (
    <div className="niveis-acesso-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Níveis de Acesso"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="niveis-acesso-container">
        {/* Toolbar */}
        <div className="niveis-toolbar">
          <h2>🔐 Gerenciar Níveis</h2>
          <button className="btn-create" onClick={handleCreate}>
            + Novo Nível
          </button>
        </div>

        {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando níveis de acesso...</p>
        </div>
      ) : (
        /* Tabela de níveis */
        <div className="table-container">
          {niveis.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>Nenhum nível de acesso cadastrado.</p>
              <button className="btn-create" onClick={handleCreate}>
                Criar primeiro nível
              </button>
            </div>
          ) : (
            <table className="niveis-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Nível</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {niveis.map((nivel) => (
                  <tr key={nivel.id}>
                    <td>{nivel.id}</td>
                    <td className="nome-cell">{nivel.nome}</td>
                    <td className="descricao-cell">{nivel.descricao || '-'}</td>
                    <td>
                      <span className={`nivel-badge nivel-${nivel.nivel}`}>
                        {nivel.nivel}
                      </span>
                    </td>
                    <td>{new Date(nivel.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="actions-cell">
                      <button 
                        className="btn-action btn-edit" 
                        onClick={() => handleEdit(nivel)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-action btn-delete" 
                        onClick={() => handleDeleteClick(nivel)}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? '➕ Novo Nível de Acesso' : '✏️ Editar Nível de Acesso'}</h2>
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
                  placeholder="Ex: Administrador, Operador, Visitante"
                  className={formErrors.nome ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.nome && <span className="error-message">{formErrors.nome}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição das permissões deste nível"
                  rows="3"
                  className={formErrors.descricao ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.descricao && <span className="error-message">{formErrors.descricao}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="nivel">Nível de Permissão * (1-10)</label>
                <input
                  type="number"
                  id="nivel"
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                  className={formErrors.nivel ? 'error' : ''}
                  disabled={submitting}
                />
                <small className="form-hint">1 = Menor permissão, 10 = Maior permissão</small>
                {formErrors.nivel && <span className="error-message">{formErrors.nivel}</span>}
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : (modalMode === 'create' ? 'Criar' : 'Salvar')}
                </button>
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
              <p>Tem certeza que deseja excluir o nível de acesso:</p>
              <strong>"{nivelToDelete?.nome}"</strong>
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

export default NiveisAcesso;
