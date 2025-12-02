import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Drawer.css';

const Drawer = ({ isOpen, onClose, onLogout, isAdmin }) => {
  console.log('📋 Drawer - isAdmin:', isAdmin);
  
  return (
    <>
      {/* Overlay */}
      <div 
        className={`drawer-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      
      {/* Menu Drawer */}
      <nav className={`drawer ${isOpen ? 'active' : ''}`}>
        <div className="drawer-header">
          <img src="/logo.png" alt="Logo" className="drawer-logo" />
          <h2>Menu</h2>
          <button 
            className="drawer-close" 
            onClick={onClose}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>
        
        <ul className="drawer-menu">
          <li>
            <NavLink to="/dashboard" onClick={onClose}>
              🏠 Início
            </NavLink>
          </li>
          
          <li className="drawer-divider" />
          <li className="drawer-section-title">
            <span>📊 Monitoramento</span>
          </li>
          <li>
            <NavLink to="/monitoramento" onClick={onClose}>
              📡 Tempo Real
            </NavLink>
          </li>
          <li>
            <NavLink to="/historico" onClick={onClose}>
              📈 Histórico e Gráficos
            </NavLink>
          </li>
          <li>
            <NavLink to="/alertas" onClick={onClose}>
              ⚠️ Alertas
            </NavLink>
          </li>
          
          <li className="drawer-divider" />
          <li className="drawer-section-title">
            <span>⚙️ Configurações</span>
          </li>
          <li>
            <NavLink to="/ambientes" onClick={onClose}>
              🏢 Ambientes
            </NavLink>
          </li>
          <li>
            <NavLink to="/sensores" onClick={onClose}>
              📡 Sensores
            </NavLink>
          </li>
          <li>
            <NavLink to="/leituras" onClick={onClose}>
              📊 Leituras
            </NavLink>
          </li>
          
          {/* Opções de Administrador */}
          {isAdmin && (
            <>
              <li className="drawer-divider" />
              <li className="drawer-section-title">
                <span>👑 Administração</span>
              </li>
              <li>
                <NavLink to="/niveis-acesso" onClick={onClose}>
                  🔐 Níveis de Acesso
                </NavLink>
              </li>
              <li>
                <NavLink to="/usuarios" onClick={onClose}>
                  👥 Usuários
                </NavLink>
              </li>
            </>
          )}
          
          <li className="drawer-divider" />
          <li>
            <button onClick={onLogout}>
              🚪 Logout
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Drawer;
