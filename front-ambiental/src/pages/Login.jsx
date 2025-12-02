import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Footer, Loading } from '../components';
import { login, saveAuthData } from '../services/api';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validar formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Toggle mostrar/ocultar senha
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Limpar erros ao digitar
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpar mensagens anteriores
    setEmailError('');
    setPasswordError('');

    // Validação básica
    if (!email) {
      setEmailError('Por favor, insira seu email');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Por favor, insira um email válido');
      return;
    }

    if (!password) {
      setPasswordError('Por favor, insira sua senha');
      return;
    }

    if (password.length < 3) {
      setPasswordError('A senha deve ter pelo menos 3 caracteres');
      return;
    }

    setLoading(true);

    try {
      const data = await login(email, password);

      toast.success(data.message || 'Login realizado com sucesso! 🎉');

      // Armazenar token
      if (data.token) {
        saveAuthData(data.token, email, data.usuario);
        
        // Redirecionar após 1.5 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }

    } catch (err) {
      console.error('❌ Erro no login:', err);

      let mensagemErro = 'Erro ao conectar com o servidor';

      if (err.status === 401) {
        mensagemErro = 'Email ou senha incorretos';
      } else if (err.status === 400) {
        mensagemErro = 'Dados inválidos. Verifique seus dados de entrada';
      } else if (err.status === 500) {
        mensagemErro = 'Erro no servidor. Tente novamente mais tarde';
      } else if (err.message) {
        mensagemErro = err.message;
      }

      toast.error(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          {/* Logo */}
          <div className="login-logo">
            <img src="/logo.png" alt="Logo" className="form-logo" />
          </div>

          {/* Header */}
          <div className="login-header">
            <h1>Monitoramento Ambiental</h1>
            <p>Sistema de Controle IoT</p>
          </div>

          {/* Formulário */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Campo de Email */}
            <div className="form-group">
              <label htmlFor="email">Email ou Usuário</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Digite seu email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                required
              />
              {emailError && <span className="error-message">{emailError}</span>}
            </div>

            {/* Campo de Senha */}
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePassword}
                  aria-label="Mostrar/Ocultar senha"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Footer do Form */}
          <div className="login-form-footer">
            <p>Não tem uma conta? <Link to="/register">Cadastre-se aqui</Link></p>
            <p><Link to="/forgot-password">Esqueceu sua senha?</Link></p>
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && <Loading />}

      {/* Footer */}
      <Footer isLoginPage />
    </div>
  );
};

export default Login;
