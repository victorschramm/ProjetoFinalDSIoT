import React from 'react';

const Header = ({ title, userEmail, onMenuToggle, onLogout }) => {
  return (
    <header className="app-header">
      <button 
        className="menu-toggle" 
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        ☰
      </button>
      
      <div className="header-title">
        <h1>{title}</h1>
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
