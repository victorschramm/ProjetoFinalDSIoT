import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, X, LayoutDashboard, AlertTriangle } from 'lucide-react';
import '../styles/HelpWidget.css';

// Widget global de ajuda
// Disponível em todas as telas para melhorar a experiência do usuário
//
// Pode ser expandido futuramente para chatbot real ou FAQ dinâmico
const HelpWidget = () => {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);

  const irPara = (rota) => {
    setAberto(false);
    navigate(rota);
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        className="help-widget-fab"
        onClick={() => setAberto((prev) => !prev)}
        aria-label="Abrir ajuda"
        title="Ajuda"
      >
        {aberto ? <X size={22} /> : <HelpCircle size={24} />}
      </button>

      {/* Painel de ajuda rápida */}
      {aberto && (
        <div className="help-widget-painel">
          <p className="help-widget-pergunta">Precisa de ajuda?</p>
          <p className="help-widget-texto">
            Consulte a central de ajuda para entender como utilizar o sistema.
          </p>

          <button className="help-widget-botao-principal" onClick={() => irPara('/help')}>
            Abrir Central de Ajuda
          </button>

          <div className="help-widget-links">
            <button className="help-widget-link" onClick={() => irPara('/dashboard')}>
              <LayoutDashboard size={14} className="icon-inline" /> Dashboard
            </button>
            <button className="help-widget-link" onClick={() => irPara('/alertas')}>
              <AlertTriangle size={14} className="icon-inline" /> Alertas
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpWidget;
