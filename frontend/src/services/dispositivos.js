import { authFetch } from './api';

export const getDispositivos = async () => {
  const response = await authFetch('/dispositivos');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar dispositivos' };
  return data;
};

export const getDispositivosAtivos = async () => {
  const response = await authFetch('/dispositivos/ativos');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar dispositivos ativos' };
  return data;
};

export const getDispositivoById = async (id) => {
  const response = await authFetch(`/dispositivos/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter dispositivo' };
  return data;
};

export const createDispositivo = async (payload) => {
  const response = await authFetch('/dispositivos', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao criar dispositivo' };
  return data;
};

export const updateDispositivo = async (id, payload) => {
  const response = await authFetch(`/dispositivos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao atualizar dispositivo' };
  return data;
};

export const deleteDispositivo = async (id) => {
  const response = await authFetch(`/dispositivos/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Dispositivo deletado com sucesso' };
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar dispositivo' };
  return data;
};
