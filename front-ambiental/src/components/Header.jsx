import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, userEmail, onMenuToggle, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="app-header">
      <button 
        className="menu-toggle" 
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        ☰
      </button>
      
      <div className="header-logo-center" onClick={handleLogoClick}>
        <div className="logo-icon">🌡️</div>
        <div className="logo-text">
          <span className="logo-title">EcoMonitor</span>
          <span className="logo-subtitle">Sistema Ambiental</span>
        </div>
      </div>
      
      <div className="header-user">
        <span className="user-email">{userEmail}</span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
