import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ title, userEmail, onMenuToggle, onLogout }) => {
  return (
    <header className="app-header">
      <button
        className="menu-toggle"
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu size={22} className="icon-inline" />
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
