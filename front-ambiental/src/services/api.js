/**
 * =============================================================================
 * API SERVICE - Centraliza todas as requisições HTTP
 * =============================================================================
 * Este arquivo contém todas as funções para comunicação com o backend.
 * Evita dados estáticos no frontend - sempre busca via API.
 * =============================================================================
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Função para fazer requisições autenticadas
 * Adiciona automaticamente o token JWT no header Authorization
 */
const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return response;
};

// Login
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'Erro desconhecido ao fazer login',
      };
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível. Verifique se o servidor está rodando.',
      };
    }
    throw error;
  }
};

/**
 * =============================================================================
 * REGISTRO DE USUÁRIO
 * =============================================================================
 * Envia os dados do formulário para o endpoint POST /api/register
 * Os dados são salvos no banco de dados SQLite via Sequelize
 * A senha é automaticamente hasheada com bcrypt no backend
 * 
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.name - Nome do usuário (2-100 caracteres)
 * @param {string} userData.email - Email único do usuário
 * @param {string} userData.password - Senha (mínimo 6 caracteres)
 * @param {string} userData.tipo_usuario - Tipo: 'admin' ou 'usuario'
 * @returns {Promise<Object>} - Resposta da API com mensagem e dados do usuário
 */
export const register = async (userData) => {
  try {
    // Faz requisição POST para o endpoint de registro
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Indica que estamos enviando JSON
      },
      body: JSON.stringify(userData), // Converte objeto JS para JSON string
    });

    // Converte a resposta para JSON
    const data = await response.json();

    // Se a resposta não for OK (status 2xx), lança erro
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'Erro desconhecido ao cadastrar usuário',
      };
    }

    // Retorna os dados de sucesso
    return data;
  } catch (error) {
    // Trata erro de conexão (servidor offline)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível. Verifique se o servidor está rodando.',
      };
    }
    // Re-lança outros erros
    throw error;
  }
};

// Obter perfil do usuário
export const getProfile = async () => {
  const response = await authFetch('/auth/profile');
  
  if (!response.ok) {
    throw new Error(`Erro ao carregar perfil: ${response.status}`);
  }
  
  return response.json();
};

// Logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userData');
};

// Verificar se está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

// Salvar dados de autenticação
export const saveAuthData = (token, email, userData = null) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userEmail', email);
  if (userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
};

// Obter email do usuário
export const getUserEmail = () => {
  return localStorage.getItem('userEmail');
};

// Obter dados do usuário logado
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Verificar se é admin
export const isAdmin = () => {
  const userData = getUserData();
  if (!userData) return false;
  // Verifica ambos os formatos possíveis (tipo_usuario ou tipo_Usuario)
  const tipoUsuario = userData.tipo_usuario || userData.tipo_Usuario;
  return tipoUsuario === 'admin';
};

/**
 * =============================================================================
 * NÍVEIS DE ACESSO - CRUD
 * =============================================================================
 * Funções para gerenciar níveis de acesso (apenas admin)
 * =============================================================================
 */

// Listar todos os níveis de acesso
export const getNiveisAcesso = async () => {
  try {
    const response = await authFetch('/niveis-acesso');
    
    if (!response.ok) {
      const data = await response.json();
      throw {
        status: response.status,
        message: data.error || 'Erro ao listar níveis de acesso',
      };
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Obter nível de acesso por ID
export const getNivelAcessoById = async (id) => {
  try {
    const response = await authFetch(`/niveis-acesso/${id}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw {
        status: response.status,
        message: data.error || 'Erro ao obter nível de acesso',
      };
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Criar novo nível de acesso
export const createNivelAcesso = async (data) => {
  try {
    const response = await authFetch('/niveis-acesso', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: result.error || 'Erro ao criar nível de acesso',
      };
    }
    
    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Atualizar nível de acesso
export const updateNivelAcesso = async (id, data) => {
  try {
    const response = await authFetch(`/niveis-acesso/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: result.error || 'Erro ao atualizar nível de acesso',
      };
    }
    
    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Deletar nível de acesso
export const deleteNivelAcesso = async (id) => {
  try {
    const response = await authFetch(`/niveis-acesso/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw {
        status: response.status,
        message: result.error || 'Erro ao deletar nível de acesso',
      };
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

/**
 * =============================================================================
 * USUÁRIOS - CRUD (apenas admin)
 * =============================================================================
 */

// Listar todos os usuários
export const getUsuarios = async () => {
  try {
    const response = await authFetch('/usuarios');
    
    if (!response.ok) {
      const data = await response.json();
      throw {
        status: response.status,
        message: data.error || 'Erro ao listar usuários',
      };
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Obter usuário por ID
export const getUsuarioById = async (id) => {
  try {
    const response = await authFetch(`/usuarios/${id}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw {
        status: response.status,
        message: data.error || 'Erro ao obter usuário',
      };
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Atualizar usuário
export const updateUsuario = async (id, data) => {
  try {
    const response = await authFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: result.error || 'Erro ao atualizar usuário',
      };
    }
    
    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

// Deletar usuário
export const deleteUsuario = async (id) => {
  try {
    const response = await authFetch(`/usuarios/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: result.error || 'Erro ao deletar usuário',
      };
    }
    
    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: '⚠️ Servidor indisponível.',
      };
    }
    throw error;
  }
};

export default {
  login,
  register,
  getProfile,
  logout,
  isAuthenticated,
  saveAuthData,
  getUserEmail,
  getUserData,
  isAdmin,
  // Níveis de Acesso
  getNiveisAcesso,
  getNivelAcessoById,
  createNivelAcesso,
  updateNivelAcesso,
  deleteNivelAcesso,
  // Usuários
  getUsuarios,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
};
