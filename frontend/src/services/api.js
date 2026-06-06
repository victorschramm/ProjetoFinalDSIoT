const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Requisição autenticada — adiciona JWT automaticamente
export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  return fetch(`${API_BASE_URL}${endpoint}`, config);
};

// Autenticação
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao fazer login'), { status: response.status });
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw Object.assign(new Error('Servidor indisponível. Verifique se o backend está rodando.'), { status: 0 });
    }
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao cadastrar usuário'), { status: response.status });
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw Object.assign(new Error('Servidor indisponível. Verifique se o backend está rodando.'), { status: 0 });
    }
    throw error;
  }
};

export const getProfile = async () => {
  const response = await authFetch('/profile');
  if (!response.ok) throw new Error(`Erro ao carregar perfil: ${response.status}`);
  return response.json();
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userData');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const saveAuthData = (token, email, userData = null) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userEmail', email);
  if (userData) localStorage.setItem('userData', JSON.stringify(userData));
};

export const getUserEmail = () => localStorage.getItem('userEmail');

export const getUserData = () => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

export const isAdmin = () => {
  const userData = getUserData();
  if (!userData) return false;
  const tipo = userData.tipo_usuario || userData.tipo_Usuario;
  return tipo === 'admin';
};

// Re-exportações dos serviços de domínio
// Permite que imports existentes de './api' continuem funcionando
export {
  getAmbientes, getAmbienteById, createAmbiente, updateAmbiente, deleteAmbiente
} from './ambientes';

export {
  getSensores, getSensorById, createSensor, updateSensor, deleteSensor
} from './sensores';

export {
  getLeituras, getLeituraById, getLeiturasBySensor, getUltimaLeituraBySensor,
  getLeiturasRecentes, getEstatisticas, getLeiturasByPeriodo, createLeitura, deleteLeitura
} from './leituras';

export {
  getAlertas, getAlertaById, getAlertasBySensor, getAlertasBySeveridade,
  createAlerta, updateAlerta, deleteAlerta
} from './alertas';

export {
  getDispositivos, getDispositivosAtivos, getDispositivoById,
  createDispositivo, updateDispositivo, deleteDispositivo
} from './dispositivos';

export {
  getUsuarios, getUsuarioById, updateUsuario, deleteUsuario,
  getNiveisAcesso, getNivelAcessoById, createNivelAcesso, updateNivelAcesso, deleteNivelAcesso
} from './usuarios';

export { getAssetHistory } from './assetHistory';

export { getAuditLogs } from './auditLogs';

export const setSensorInterval = async (intervalMs) => {
  const response = await authFetch('/config/sensor-interval', {
    method: 'PUT',
    body: JSON.stringify({ interval: intervalMs }),
  });
  if (!response.ok) throw new Error('Erro ao configurar intervalo');
  return response.json();
};
