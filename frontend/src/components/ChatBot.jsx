import React, { useState, useRef, useEffect } from 'react';
import { enviarMensagem } from '../services/chatbot';
import '../styles/ChatBot.css';

const SUGESTOES = [
  'Qual a temperatura atual?',
  'Há algum alerta ativo?',
  'Quais sensores estão offline?',
  'Sugira uma manutenção preventiva'
];

const MENSAGEM_BOAS_VINDAS = {
  id: 'boas-vindas',
  tipo: 'bot',
  texto: 'Olá! Sou o ManutAI, seu assistente de monitoramento IoT. Posso consultar temperatura, umidade, alertas, status dos sensores e muito mais. Como posso ajudar?'
};

export default function ChatBot() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([MENSAGEM_BOAS_VINDAS]);
  const [entrada, setEntrada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (aberto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [aberto]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, carregando]);

  const handleEnviar = async (texto) => {
    const mensagemTexto = (texto || entrada).trim();
    if (!mensagemTexto || carregando) return;

    setMostrarSugestoes(false);
    setMensagens(prev => [...prev, { id: Date.now(), tipo: 'usuario', texto: mensagemTexto }]);
    setEntrada('');
    setCarregando(true);

    try {
      const { resposta, historico_atualizado } = await enviarMensagem(mensagemTexto, historico);
      setHistorico(historico_atualizado);
      setMensagens(prev => [...prev, { id: Date.now() + 1, tipo: 'bot', texto: resposta }]);
    } catch (error) {
      setMensagens(prev => [
        ...prev,
        { id: Date.now() + 1, tipo: 'erro', texto: error.message || 'Erro ao conectar com a IA. Tente novamente.' }
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleLimpar = () => {
    setMensagens([MENSAGEM_BOAS_VINDAS]);
    setHistorico([]);
    setMostrarSugestoes(true);
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        className={`chatbot-fab ${aberto ? 'chatbot-fab--ativo' : ''}`}
        onClick={() => setAberto(prev => !prev)}
        aria-label="Abrir assistente ManutAI"
        title="ManutAI — Assistente IA"
      >
        {aberto ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>

      {/* Painel de chat */}
      {aberto && (
        <div className="chatbot-painel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header__info">
              <div className="chatbot-header__avatar">AI</div>
              <div>
                <div className="chatbot-header__nome">ManutAI</div>
                <div className="chatbot-header__status">
                  <span className="chatbot-status-dot" />
                  Assistente ativo
                </div>
              </div>
            </div>
            <button className="chatbot-header__limpar" onClick={handleLimpar} title="Limpar conversa">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
            </button>
          </div>

          {/* Mensagens */}
          <div className="chatbot-mensagens">
            {mensagens.map((msg) => (
              <div key={msg.id} className={`chatbot-balao chatbot-balao--${msg.tipo}`}>
                {msg.tipo === 'bot' && (
                  <div className="chatbot-balao__avatar">AI</div>
                )}
                <div className="chatbot-balao__texto">{msg.texto}</div>
              </div>
            ))}

            {carregando && (
              <div className="chatbot-balao chatbot-balao--bot">
                <div className="chatbot-balao__avatar">AI</div>
                <div className="chatbot-balao__texto chatbot-digitando">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {/* Sugestões de perguntas rápidas */}
            {mostrarSugestoes && !carregando && (
              <div className="chatbot-sugestoes">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    className="chatbot-sugestao"
                    onClick={() => handleEnviar(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça uma pergunta ao ManutAI..."
              disabled={carregando}
              maxLength={1000}
            />
            <button
              className="chatbot-enviar"
              onClick={() => handleEnviar()}
              disabled={carregando || !entrada.trim()}
              aria-label="Enviar mensagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
