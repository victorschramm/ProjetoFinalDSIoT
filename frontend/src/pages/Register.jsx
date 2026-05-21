
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Footer, Loading } from '../components';
import { register } from '../services/api'; // Importa função de registro da API
import '../styles/Register.css';

const Register = () => {
  // Hook para navegação programática
  const navigate = useNavigate();
  
  // ==========================================================================
  // ESTADOS DO COMPONENTE
  // ==========================================================================
  
  // Estados dos campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Indica se está processando
  
  // Estados de validação por campo
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [receberEmails, setReceberEmails] = useState(true);

  // ==========================================================================
  // FUNÇÕES DE VALIDAÇÃO
  // ==========================================================================

  /**
   * Valida formato de email usando regex
   * @param {string} email - Email a ser validado
   * @returns {boolean} - true se válido
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Valida o nome (mínimo 2 caracteres)
   * @param {string} name - Nome a ser validado
   * @returns {boolean} - true se válido
   */
  const isValidName = (name) => {
    return name.trim().length >= 2;
  };

  /**
   * Valida a senha (mínimo 6 caracteres)
   * @param {string} password - Senha a ser validada
   * @returns {boolean} - true se válida
   */
  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  // ==========================================================================
  // HANDLERS DE EVENTOS
  // ==========================================================================

  /**
   * Toggle para mostrar/ocultar senha
   */
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggle para mostrar/ocultar confirmação de senha
   */
  const toggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  /**
   * Limpa erros do campo nome quando usuário digita
   */
  const handleNameChange = (e) => {
    setName(e.target.value);
    setNameError(''); // Limpa erro ao digitar
  };

  /**
   * Limpa erros do campo email quando usuário digita
   */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  /**
   * Limpa erros do campo senha quando usuário digita
   */
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
  };

  /**
   * Limpa erros do campo confirmar senha quando usuário digita
   */
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError('');
  };

  /**
   * Limpa o formulário após cadastro bem-sucedido
   */
  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // ==========================================================================
  // SUBMISSÃO DO FORMULÁRIO
  // ==========================================================================

  /**
   * Processa o envio do formulário
   * 1. Valida todos os campos
   * 2. Envia dados para a API
   * 3. Trata resposta (sucesso ou erro)
   * 4. Atualiza estados de feedback
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne reload da página
    
    // Limpa mensagens anteriores
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // ========================================================================
    // VALIDAÇÃO DOS CAMPOS
    // ========================================================================
    
    let hasError = false;

    // Validar nome
    if (!name.trim()) {
      setNameError('Por favor, insira seu nome');
      hasError = true;
    } else if (!isValidName(name)) {
      setNameError('O nome deve ter pelo menos 2 caracteres');
      hasError = true;
    }

    // Validar email
    if (!email.trim()) {
      setEmailError('Por favor, insira seu email');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Por favor, insira um email válido');
      hasError = true;
    }

    // Validar senha
    if (!password) {
      setPasswordError('Por favor, insira sua senha');
      hasError = true;
    } else if (!isValidPassword(password)) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      hasError = true;
    }

    // Validar confirmação de senha
    if (!confirmPassword) {
      setConfirmPasswordError('Por favor, confirme sua senha');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      hasError = true;
    }

    // Se houver erros de validação, não prossegue
    if (hasError) {
      return;
    }

    // ========================================================================
    // ENVIO PARA A API
    // ========================================================================
    
    setLoading(true); // Ativa estado de loading (desabilita botão)

    try {
      // Monta objeto com dados do usuário para enviar
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        tipo_usuario: 'usuario',
        receberEmails,
      };

      // Chama função de registro da API
      // Esta função faz POST para /api/register
      // O backend salva no banco SQLite via Sequelize
      const data = await register(userData);

      // Se chegou aqui, cadastro foi bem-sucedido
      toast.success(data.message || 'Cadastro realizado com sucesso! 🎉');
      
      // Limpa o formulário
      clearForm();

      // Redireciona para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // ======================================================================
      // TRATAMENTO DE ERROS
      // ======================================================================
      
      console.error('❌ Erro no cadastro:', err);

      // Mensagens de erro amigáveis baseadas no status
      let mensagemErro = 'Erro ao realizar cadastro';

      if (err.status === 400) {
        // Erro de validação ou email já existe
        mensagemErro = err.message || 'Este email já está cadastrado';
      } else if (err.status === 500) {
        mensagemErro = 'Erro no servidor. Tente novamente mais tarde';
      } else if (err.status === 0) {
        // Servidor offline
        mensagemErro = err.message;
      } else if (err.message) {
        mensagemErro = err.message;
      }

      toast.error(mensagemErro);
    } finally {
      // Sempre executado (sucesso ou erro)
      setLoading(false); // Desativa loading
    }
  };

  // ==========================================================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================================================

  return (
    <div className="register-page">
      {/* Componente de Loading (spinner) */}
      {loading && <Loading />}
      
      <div className="register-container">
        <div className="register-box">
          {/* Logo */}
          <div className="register-logo">
            <img src="/logo.png" alt="Logo" className="form-logo" />
          </div>
          
          {/* Cabeçalho */}
          <div className="register-header">
            <h1>Criar Conta</h1>
            <p>Sistema de Monitoramento do Ambiente IoT</p>
          </div>

          {/* Formulário de Cadastro */}
          <form onSubmit={handleSubmit} className="register-form">
            
            {/* Campo: Nome */}
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Digite seu nome"
                disabled={loading} // Desabilita durante loading
                className={nameError ? 'input-error' : ''}
              />
              {/* Mensagem de erro do campo */}
              {nameError && <span className="error-message">{nameError}</span>}
            </div>

            {/* Campo: Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Digite seu email"
                disabled={loading}
                className={emailError ? 'input-error' : ''}
              />
              {emailError && <span className="error-message">{emailError}</span>}
            </div>

            {/* Campo: Senha */}
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  className={passwordError ? 'input-error' : ''}
                />
                {/* Botão toggle mostrar/ocultar senha */}
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePassword}
                  disabled={loading}
                  aria-label="Mostrar/Ocultar senha"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            {/* Campo: Confirmar Senha */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Repita sua senha"
                  disabled={loading}
                  className={confirmPasswordError ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={toggleConfirmPassword}
                  disabled={loading}
                  aria-label="Mostrar/Ocultar senha"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPasswordError && <span className="error-message">{confirmPasswordError}</span>}
            </div>

            {/* Checkbox de notificações */}
            <div className="form-check">
              <input
                type="checkbox"
                id="receberEmails"
                checked={receberEmails}
                onChange={(e) => setReceberEmails(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="receberEmails">
                Quero receber emails e notificações da ManutAI
              </label>
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </button>
          </form>

          {/* Link para Login */}
          <div className="register-footer">
            <p>
              Já tem uma conta? <Link to="/login">Faça login aqui</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

export default Register;
