import { authFetch } from './api';

// Usuários
export const getUsuarios = async () => {
  const response = await authFetch('/usuarios');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar usuários' };
  return data;
};

export const getUsuarioById = async (id) => {
  const response = await authFetch(`/usuarios/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter usuário' };
  return data;
};

export const updateUsuario = async (id, payload) => {
  const response = await authFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao atualizar usuário' };
  return data;
};

export const deleteUsuario = async (id) => {
  const response = await authFetch(`/usuarios/${id}`, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar usuário' };
  return data;
};

// Níveis de Acesso
export const getNiveisAcesso = async () => {
  const response = await authFetch('/niveis-acesso');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar níveis de acesso' };
  return data;
};

export const getNivelAcessoById = async (id) => {
  const response = await authFetch(`/niveis-acesso/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter nível de acesso' };
  return data;
};

export const createNivelAcesso = async (payload) => {
  const response = await authFetch('/niveis-acesso', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao criar nível de acesso' };
  return data;
};

export const updateNivelAcesso = async (id, payload) => {
  const response = await authFetch(`/niveis-acesso/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao atualizar nível de acesso' };
  return data;
};

export const deleteNivelAcesso = async (id) => {
  const response = await authFetch(`/niveis-acesso/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Nível de acesso deletado com sucesso' };
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar nível de acesso' };
  return data;
};
