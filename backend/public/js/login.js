// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api'; // Ajuste conforme necessário
const LOGIN_ENDPOINT = '/login';

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const togglePasswordBtn = document.getElementById('togglePassword');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');
const loadingSpinner = document.getElementById('loadingSpinner');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

/**
 * Toggle para mostrar/ocultar senha
 */
togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
});

/**
 * Limpar mensagens de erro ao digitar
 */
emailInput.addEventListener('input', () => {
    emailError.textContent = '';
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
});

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Exibir mensagem de erro
 */
function showError(message, fieldError = null) {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
    successAlert.style.display = 'none';
    
    if (fieldError) {
        fieldError.textContent = message;
    }
    
    hideLoadingSpinner();
}

/**
 * Exibir mensagem de sucesso
 */
function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.style.display = 'block';
    errorAlert.style.display = 'none';
}

/**
 * Mostrar spinner de carregamento
 */
function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
}

/**
 * Ocultar spinner de carregamento
 */
function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

/**
 * Desabilitar/Habilitar formulário
 */
function setFormDisabled(disabled) {
    loginButton.disabled = disabled;
    emailInput.disabled = disabled;
    passwordInput.disabled = disabled;
    togglePasswordBtn.disabled = disabled;
}

/**
 * Manipular submissão do formulário
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Limpar mensagens anteriores
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    emailError.textContent = '';
    passwordError.textContent = '';

    // Obter valores
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validação básica
    if (!email) {
        showError('Por favor, insira seu email', emailError);
        return;
    }

    if (!isValidEmail(email)) {
        showError('Por favor, insira um email válido', emailError);
        return;
    }

    if (!password) {
        showError('Por favor, insira sua senha', passwordError);
        return;
    }

    if (password.length < 3) {
        showError('A senha deve ter pelo menos 3 caracteres', passwordError);
        return;
    }

    // Desabilitar formulário e mostrar spinner
    setFormDisabled(true);
    showLoadingSpinner();

    try {
        // Fazer requisição POST para o backend
        const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        // Parsing da resposta
        const data = await response.json();

        if (!response.ok) {
            // Tratamento de erro
            throw {
                status: response.status,
                message: data.error || 'Erro desconhecido ao fazer login'
            };
        }

        // Sucesso no login
        showSuccess(data.message || 'Login realizado com sucesso!');

        // Armazenar token no localStorage
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userEmail', email);
            
            // Opcional: Salvar informações do usuário
            if (data.usuario) {
                localStorage.setItem('userData', JSON.stringify(data.usuario));
            }

            console.log('✅ Login bem-sucedido. Token armazenado.');

            // Redirecionar após 2 segundos
            setTimeout(() => {
                // Altere a URL para o dashboard ou página desejada
                window.location.href = '/dashboard.html';
            }, 2000);
        }

    } catch (error) {
        console.error('❌ Erro no login:', error);

        // Tratamento específico de erros
        let mensagemErro = 'Erro ao conectar com o servidor';

        if (error.status === 401) {
            mensagemErro = 'Email ou senha incorretos';
        } else if (error.status === 400) {
            mensagemErro = 'Dados inválidos. Verifique seus dados de entrada';
        } else if (error.status === 500) {
            mensagemErro = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            mensagemErro = '⚠️ Servidor indisponível. Verifique se o servidor está rodando.';
        } else if (error.message) {
            mensagemErro = error.message;
        }

        showError(mensagemErro);

    } finally {
        // Re-habilitar formulário
        setFormDisabled(false);
        hideLoadingSpinner();
    }
});

/**
 * Permitir que Enter envie o formulário
 */
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement !== loginButton) {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

/**
 * Restaurar campo de senha quando a página carregar
 */
window.addEventListener('load', () => {
    // Se houver token salvo, redirecionar para dashboard
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        console.log('✅ Token encontrado. Redirecionando...');
        // Descomente se quiser redirecionar automaticamente se já estiver logado
        // window.location.href = '/dashboard.html';
    }

    // Focar no campo de email
    emailInput.focus();
});

/**
 * Logout - Função auxiliar para ser usada em outras páginas
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
}

// Exportar função de logout para uso global
window.logout = logout;
