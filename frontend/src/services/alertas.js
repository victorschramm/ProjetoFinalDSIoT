import { authFetch } from './api';

export const getAlertas = async () => {
  const response = await authFetch('/alertas');
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao listar alertas'), { status: response.status });
  return data;
};

export const getAlertaById = async (id) => {
  const response = await authFetch(`/alertas/${id}`);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao obter alerta'), { status: response.status });
  return data;
};

export const getAlertasBySensor = async (sensorId) => {
  const response = await authFetch(`/alertas/sensor/${sensorId}`);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao listar alertas do sensor'), { status: response.status });
  return data;
};

export const getAlertasBySeveridade = async (severidade) => {
  const response = await authFetch(`/alertas/severidade/${severidade}`);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao listar alertas por severidade'), { status: response.status });
  return data;
};

export const createAlerta = async (payload) => {
  const response = await authFetch('/alertas', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao criar alerta'), { status: response.status });
  return data;
};

export const updateAlerta = async (id, payload) => {
  const response = await authFetch(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao atualizar alerta'), { status: response.status });
  return data;
};

export const deleteAlerta = async (id) => {
  const response = await authFetch(`/alertas/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Alerta deletado com sucesso' };
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao deletar alerta'), { status: response.status });
  return data;
};
