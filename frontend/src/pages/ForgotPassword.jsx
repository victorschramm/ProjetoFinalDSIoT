import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MailCheck } from 'lucide-react';
import { Footer, Loading } from '../components';
import '../styles/Login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://import.meta.env.VITE_API_URL:3000/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!email) { setEmailError('Por favor, insira seu email'); return; }
    if (!isValidEmail(email)) { setEmailError('Por favor, insira um email válido'); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao processar solicitação');
        return;
      }

      setEnviado(true);
    } catch {
      toast.error('Servidor indisponível. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">

          <div className="login-logo">
            <img src="/logo.png" alt="Logo" className="form-logo" />
          </div>

          <div className="login-header">
            <h1>MANUT.AI</h1>
            <p>Recuperação de Senha</p>
          </div>

          {!enviado ? (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.6' }}>
                Informe o email cadastrado na sua conta.<br />
                Enviaremos um link para redefinir sua senha.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email cadastrado</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    disabled={loading}
                    required
                  />
                  {emailError && <span className="error-message">{emailError}</span>}
                </div>

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.7)' }}>
                <MailCheck size={52} className="icon-inline" strokeWidth={1.5} />
              </div>

              <div className="success-alert" style={{ marginBottom: '20px' }}>
                <strong>Email enviado para {email}</strong>
              </div>

              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.7', textAlign: 'left' }}>
                <p style={{ marginBottom: '14px' }}>Verifique sua caixa de entrada e siga as instruções do email para criar uma nova senha.</p>

                <ul style={{ paddingLeft: '18px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  <li>O link é válido por <strong style={{ color: '#00b894' }}>1 hora</strong></li>
                  <li>Verifique também a pasta de spam</li>
                  <li>Não compartilhe o link com ninguém</li>
                </ul>
              </div>

              <button
                className="login-button"
                style={{ marginTop: '24px', width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => { setEnviado(false); setEmail(''); }}
              >
                Tentar outro email
              </button>
            </div>
          )}

          <div className="login-form-footer">
            <p>Lembrou a senha? <Link to="/login">Voltar ao login</Link></p>
          </div>
        </div>
      </div>

      {loading && <Loading />}
      <Footer isLoginPage />
    </div>
  );
};

export default ForgotPassword;
