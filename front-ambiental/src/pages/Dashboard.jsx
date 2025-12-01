import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Drawer, Footer, InfoCard } from '../components';
import { getProfile, logout as apiLogout, isAuthenticated, getUserEmail, isAdmin as checkIsAdmin } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Função de logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Fechar drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Carregar dados do usuário
  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Obter email do usuário
    const email = getUserEmail();
    setUserEmail(email || '');
    
    // Verificar se é admin do localStorage
    const adminFromStorage = checkIsAdmin();
    console.log('🔍 isAdmin do localStorage:', adminFromStorage);
    setIsUserAdmin(adminFromStorage);

    // Carregar perfil
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        console.log('👤 Perfil carregado:', profile);
        setUserProfile(profile);
        // Atualizar isAdmin com dados do perfil (verifica ambos formatos)
        if (profile) {
          const tipoUsuario = profile.tipo_Usuario || profile.tipo_usuario;
          console.log('🔐 Tipo de usuário do perfil:', tipoUsuario);
          const isAdminUser = tipoUsuario === 'admin';
          console.log('✅ É admin?', isAdminUser);
          setIsUserAdmin(isAdminUser);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar perfil:', err);
        setError(`Erro ao carregar dados do perfil: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  // Fechar drawer com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Fechar drawer ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && drawerOpen) {
        closeDrawer();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerOpen]);

  return (
    <div className="dashboard-page">
      {/* Debug - remover depois */}
      {console.log('🎯 Renderizando Dashboard - isUserAdmin:', isUserAdmin)}
      
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Dashboard"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      {/* Conteúdo */}
      <div className="container">
        <div className="dashboard-content">
          <h2>Bem-vindo ao Dashboard</h2>
          
          {loading ? (
            <p>Carregando...</p>
          ) : error ? (
            <div className="error-message-box">{error}</div>
          ) : userProfile ? (
            <>
              <InfoCard label="ID do Usuário" value={userProfile.id} />
              <InfoCard label="Nome" value={userProfile.name} />
              <InfoCard label="Email" value={userProfile.email} />
              <InfoCard label="Tipo de Usuário" value={userProfile.tipo_usuario} />
            </>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;
