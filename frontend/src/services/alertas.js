import { authFetch } from './api';

export const getAlertas = async () => {
  const response = await authFetch('/alertas');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar alertas' };
  return data;
};

export const getAlertaById = async (id) => {
  const response = await authFetch(`/alertas/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter alerta' };
  return data;
};

export const getAlertasBySensor = async (sensorId) => {
  const response = await authFetch(`/alertas/sensor/${sensorId}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar alertas do sensor' };
  return data;
};

export const getAlertasBySeveridade = async (severidade) => {
  const response = await authFetch(`/alertas/severidade/${severidade}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar alertas por severidade' };
  return data;
};

export const createAlerta = async (payload) => {
  const response = await authFetch('/alertas', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao criar alerta' };
  return data;
};

export const updateAlerta = async (id, payload) => {
  const response = await authFetch(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao atualizar alerta' };
  return data;
};

export const deleteAlerta = async (id) => {
  const response = await authFetch(`/alertas/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Alerta deletado com sucesso' };
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar alerta' };
  return data;
};
