import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, BarChart3, Radio, TrendingUp, AlertTriangle, History,
  Wrench, Settings, Building2, SlidersHorizontal, Crown, Users,
  ClipboardList, LogOut
} from 'lucide-react';
import '../styles/Drawer.css';

const Drawer = ({ isOpen, onClose, onLogout, isAdmin }) => {
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
              <Home size={16} className="icon-inline" /> Início
            </NavLink>
          </li>

          <li className="drawer-divider" />
          <li className="drawer-section-title">
            <span><BarChart3 size={16} className="icon-inline" /> Monitoramento</span>
          </li>
          <li>
            <NavLink to="/monitoramento" onClick={onClose}>
              <Radio size={16} className="icon-inline" /> Tempo Real
            </NavLink>
          </li>
          <li>
            <NavLink to="/historico" onClick={onClose}>
              <TrendingUp size={16} className="icon-inline" /> Histórico e Gráficos
            </NavLink>
          </li>
          <li>
            <NavLink to="/alertas" onClick={onClose}>
              <AlertTriangle size={16} className="icon-inline" /> Alertas
            </NavLink>
          </li>
          <li>
            <NavLink to="/historico-ativo" onClick={onClose}>
              <History size={16} className="icon-inline" /> Currículo da Máquina
            </NavLink>
          </li>
          <li>
            <NavLink to="/manutencao-preventiva" onClick={onClose}>
              <Wrench size={16} className="icon-inline" /> Manutenção Preventiva
            </NavLink>
          </li>

          <li className="drawer-divider" />
          <li className="drawer-section-title">
            <span><Settings size={16} className="icon-inline" /> Configurações</span>
          </li>
          <li>
            <NavLink to="/dispositivos" onClick={onClose}>
              <Radio size={16} className="icon-inline" /> Dispositivos ESP
            </NavLink>
          </li>
          <li>
            <NavLink to="/ambientes" onClick={onClose}>
              <Building2 size={16} className="icon-inline" /> Ambientes
            </NavLink>
          </li>
          <li>
            <NavLink to="/sensores" onClick={onClose}>
              <SlidersHorizontal size={16} className="icon-inline" /> Sensores
            </NavLink>
          </li>
          <li>
            <NavLink to="/leituras" onClick={onClose}>
              <BarChart3 size={16} className="icon-inline" /> Leituras
            </NavLink>
          </li>

          {/* Opções de Administrador */}
          {isAdmin && (
            <>
              <li className="drawer-divider" />
              <li className="drawer-section-title">
                <span><Crown size={16} className="icon-inline" /> Administração</span>
              </li>
              <li>
                <NavLink to="/usuarios" onClick={onClose}>
                  <Users size={16} className="icon-inline" /> Usuários
                </NavLink>
              </li>
              <li>
                <NavLink to="/historico-acoes" onClick={onClose}>
                  <ClipboardList size={16} className="icon-inline" /> Histórico de Ações
                </NavLink>
              </li>
            </>
          )}

          <li className="drawer-divider" />
          <li>
            <button onClick={onLogout}>
              <LogOut size={16} className="icon-inline" /> Logout
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Drawer;
