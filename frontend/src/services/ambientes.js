import { authFetch } from './api';

export const getAmbientes = async () => {
  const response = await authFetch('/ambientes');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar ambientes' };
  return data;
};

export const getAmbienteById = async (id) => {
  const response = await authFetch(`/ambientes/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter ambiente' };
  return data;
};

export const createAmbiente = async (payload) => {
  const response = await authFetch('/ambientes', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao criar ambiente' };
  return data;
};

export const updateAmbiente = async (id, payload) => {
  const response = await authFetch(`/ambientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao atualizar ambiente' };
  return data;
};

export const deleteAmbiente = async (id) => {
  const response = await authFetch(`/ambientes/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Ambiente deletado com sucesso' };
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar ambiente' };
  return data;
};
