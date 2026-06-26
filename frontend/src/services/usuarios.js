import { authFetch } from './api';

// Usuários
export const getUsuarios = async () => {
  const response = await authFetch('/usuarios');
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao listar usuários'), { status: response.status });
  return data;
};

export const getUsuarioById = async (id) => {
  const response = await authFetch(`/usuarios/${id}`);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao obter usuário'), { status: response.status });
  return data;
};

export const updateUsuario = async (id, payload) => {
  const response = await authFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao atualizar usuário'), { status: response.status });
  return data;
};

export const deleteUsuario = async (id) => {
  const response = await authFetch(`/usuarios/${id}`, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao deletar usuário'), { status: response.status });
  return data;
};

