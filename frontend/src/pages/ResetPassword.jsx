import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Footer, Loading } from '../components';
import '../styles/Login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [tokenInvalido, setTokenInvalido] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setTokenInvalido(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes('expirado')) {
          setTokenInvalido(true);
        }
        toast.error(data.error || 'Erro ao redefinir senha');
        return;
      }

      setConcluido(true);
      toast.success('Senha redefinida com sucesso!');
      setTimeout(() => navigate('/login'), 3000);
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
            <p>Redefinir Senha</p>
          </div>

          {tokenInvalido && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: '#ef4444' }}>
                <AlertTriangle size={48} className="icon-inline" strokeWidth={1.5} />
              </div>
              <div className="error-alert" style={{ marginBottom: '20px' }}>
                <strong>Link inválido ou expirado</strong>
                <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                  Este link de redefinição não é mais válido. Solicite um novo.
                </p>
              </div>
              <Link to="/forgot-password">
                <button className="login-button" style={{ width: '100%' }}>
                  Solicitar novo link
                </button>
              </Link>
            </div>
          )}

          {!tokenInvalido && !concluido && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.6' }}>
                Crie uma nova senha para sua conta.<br />
                Use pelo menos 6 caracteres.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="novaSenha">Nova senha</label>
                  <div className="password-wrapper">
                    <input
                      type={showNova ? 'text' : 'password'}
                      id="novaSenha"
                      placeholder="Digite a nova senha"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowNova(!showNova)}>
                      {showNova ? (
                        <EyeOff size={18} className="icon-inline icon-muted" />
                      ) : (
                        <Eye size={18} className="icon-inline icon-muted" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmar ? 'text' : 'password'}
                      id="confirmarSenha"
                      placeholder="Repita a nova senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirmar(!showConfirmar)}>
                      {showConfirmar ? (
                        <EyeOff size={18} className="icon-inline icon-muted" />
                      ) : (
                        <Eye size={18} className="icon-inline icon-muted" />
                      )}
                    </button>
                  </div>
                  {confirmarSenha && novaSenha !== confirmarSenha && (
                    <span className="error-message">As senhas não coincidem</span>
                  )}
                </div>

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}

          {concluido && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: '#10b981' }}>
                <CheckCircle2 size={52} className="icon-inline" strokeWidth={1.5} />
              </div>
              <div className="success-alert" style={{ marginBottom: '20px' }}>
                <strong>Senha redefinida com sucesso!</strong>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Redirecionando para o login em instantes...
              </p>
            </div>
          )}

          {!concluido && (
            <div className="login-form-footer">
              <p>Lembrou a senha? <Link to="/login">Voltar ao login</Link></p>
            </div>
          )}
        </div>
      </div>

      {loading && <Loading />}
      <Footer isLoginPage />
    </div>
  );
};

export default ResetPassword;
