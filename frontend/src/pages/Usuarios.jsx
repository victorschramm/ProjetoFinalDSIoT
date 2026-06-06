import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header, Drawer, Footer } from '../components';
import { 
  getUsuarios, 
  updateUsuario, 
  deleteUsuario,
  getNiveisAcesso,
  isAdmin,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  getProfile
} from '../services/api';
import '../styles/Usuarios.css';

const Usuarios = () => {
  const navigate = useNavigate();
  
  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [niveisAcesso, setNiveisAcesso] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tipo_usuario: 'usuario',
    id_nivel_acesso: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Funções do Drawer
  const handleLogout = async () => {
    try {
      await apiLogout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      navigate('/login');
    }
  };

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Verificar permissão de admin e carregar perfil
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    
    // Carregar perfil do usuário
    const loadProfile = async () => {
      try {
        const profileData = await getProfile();
        setUserEmail(profileData.email || getUserEmail());
        setIsUserAdmin(profileData.tipo_usuario === 'admin');
      } catch {
        setUserEmail(getUserEmail());
        setIsUserAdmin(isAdmin());
      }
    };
    loadProfile();
    
    loadData();
    
    // Keyboard events
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, drawerOpen]);

  // Carregar usuários e níveis de acesso
  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, niveisData] = await Promise.all([
        getUsuarios(),
        getNiveisAcesso()
      ]);
      setUsuarios(usuariosData);
      setNiveisAcesso(niveisData);
    } catch (err) {
      if (err.status === 403) {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      } else {
        toast.error(err.message || 'Erro ao carregar dados');
      }
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para editar
  const handleEdit = (usuario) => {
    setFormData({
      name: usuario.name,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      id_nivel_acesso: usuario.id_nivel_acesso || '',
    });
    setFormErrors({});
    setSelectedUsuario(usuario);
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', email: '', tipo_usuario: 'usuario', id_nivel_acesso: '' });
    setFormErrors({});
    setSelectedUsuario(null);
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.tipo_usuario) {
      errors.tipo_usuario = 'Tipo de usuário é obrigatório';
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
        ...formData,
        id_nivel_acesso: formData.id_nivel_acesso || null
      };
      
      await updateUsuario(selectedUsuario.id, dataToSend);
      toast.success('Usuário atualizado com sucesso!');
      
      handleCloseModal();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir confirmação de exclusão
  const handleDeleteClick = (usuario) => {
    setUsuarioToDelete(usuario);
    setShowDeleteConfirm(true);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!usuarioToDelete) return;
    
    try {
      setDeleting(true);
      await deleteUsuario(usuarioToDelete.id);
      toast.success('Usuário deletado com sucesso!');
      setShowDeleteConfirm(false);
      setUsuarioToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao deletar usuário');
    } finally {
      setDeleting(false);
    }
  };

  // Cancelar exclusão
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setUsuarioToDelete(null);
  };

  return (
    <div className="usuarios-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Gerenciar Usuários"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="usuarios-container">
        {/* Toolbar */}
        <div className="usuarios-toolbar">
          <h2>👥 Usuários do Sistema</h2>
        </div>

        {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      ) : (
        /* Tabela de usuários */
        <div className="table-container">
          {usuarios.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>Nenhum usuário cadastrado.</p>
            </div>
          ) : (
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Nível de Acesso</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td className="nome-cell">{usuario.name}</td>
                    <td className="email-cell">{usuario.email}</td>
                    <td>
                      <span className={`tipo-badge tipo-${usuario.tipo_usuario}`}>
                        {usuario.tipo_usuario === 'admin' ? '👑 Admin' : '👤 Usuário'}
                      </span>
                    </td>
                    <td>
                      {usuario.id_nivel_acesso ? (
                        <span className="nivel-badge">
                          {niveisAcesso.find(n => n.id === usuario.id_nivel_acesso)?.nome || `ID: ${usuario.id_nivel_acesso}`}
                        </span>
                      ) : (
                        <span className="nivel-none">-</span>
                      )}
                    </td>
                    <td>{new Date(usuario.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="actions-cell">
                      <button 
                        className="btn-action btn-edit" 
                        onClick={() => handleEdit(usuario)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-action btn-delete" 
                        onClick={() => handleDeleteClick(usuario)}
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

      {/* Modal de edição */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Usuário</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nome *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do usuário"
                  className={formErrors.name ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className={formErrors.email ? 'error' : ''}
                  disabled={submitting}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="tipo_usuario">Tipo de Usuário *</label>
                <select
                  id="tipo_usuario"
                  value={formData.tipo_usuario}
                  onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                  className={formErrors.tipo_usuario ? 'error' : ''}
                  disabled={submitting}
                >
                  <option value="usuario">👤 Usuário Comum</option>
                  <option value="admin">👑 Administrador</option>
                </select>
                {formErrors.tipo_usuario && <span className="error-message">{formErrors.tipo_usuario}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="id_nivel_acesso">Nível de Acesso</label>
                <select
                  id="id_nivel_acesso"
                  value={formData.id_nivel_acesso}
                  onChange={(e) => setFormData({ ...formData, id_nivel_acesso: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">Nenhum</option>
                  {niveisAcesso.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nome} (Nível {nivel.nivel})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
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
              <p>Tem certeza que deseja excluir o usuário:</p>
              <strong>"{usuarioToDelete?.name}"</strong>
              <p className="email-info">{usuarioToDelete?.email}</p>
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

export default Usuarios;
