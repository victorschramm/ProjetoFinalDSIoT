import { authFetch } from './api';

export const getSensores = async () => {
  const response = await authFetch('/sensores');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar sensores' };
  return data;
};

export const getSensorById = async (id) => {
  const response = await authFetch(`/sensores/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter sensor' };
  return data;
};

export const createSensor = async (payload) => {
  const response = await authFetch('/sensores', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao criar sensor' };
  return data;
};

export const updateSensor = async (id, payload) => {
  const response = await authFetch(`/sensores/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao atualizar sensor' };
  return data;
};

export const deleteSensor = async (id) => {
  const response = await authFetch(`/sensores/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Sensor deletado com sucesso' };
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar sensor' };
  return data;
};
