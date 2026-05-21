import { authFetch } from './api';

export const getLeituras = async () => {
  const response = await authFetch('/leituras');
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar leituras' };
  return data;
};

export const getLeituraById = async (id) => {
  const response = await authFetch(`/leituras/${id}`);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao obter leitura' };
  return data;
};

export const getLeiturasBySensor = async (sensorId, limite = 50, tipo = null) => {
  let endpoint = `/leituras/sensor/${sensorId}?limite=${limite}`;
  if (tipo) endpoint += `&tipo=${tipo}`;
  const response = await authFetch(endpoint);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar leituras do sensor' };
  return data;
};

export const getUltimaLeituraBySensor = async (sensorId) => {
  const response = await authFetch(`/leituras/sensor/${sensorId}/ultima`);
  if (!response.ok) throw new Error('Erro ao obter última leitura');
  return response.json();
};

export const getLeiturasRecentes = async (minutos = 60) => {
  const response = await authFetch(`/leituras/recentes?minutos=${minutos}`);
  if (!response.ok) throw new Error('Erro ao obter leituras recentes');
  return response.json();
};

export const getEstatisticas = async (id_sensor = null, tipo_leitura = null, inicio = null, fim = null) => {
  const params = [];
  if (id_sensor) params.push(`id_sensor=${id_sensor}`);
  if (tipo_leitura) params.push(`tipo_leitura=${tipo_leitura}`);
  if (inicio) params.push(`inicio=${inicio instanceof Date ? inicio.toISOString() : inicio}`);
  if (fim) params.push(`fim=${fim instanceof Date ? fim.toISOString() : fim}`);
  const response = await authFetch(`/leituras/estatisticas${params.length ? '?' + params.join('&') : ''}`);
  if (!response.ok) throw new Error('Erro ao obter estatísticas');
  return response.json();
};

export const getLeiturasByPeriodo = async (inicio, fim, id_sensor = null) => {
  const ini = inicio instanceof Date ? inicio.toISOString() : inicio;
  const fim_ = fim instanceof Date ? fim.toISOString() : fim;
  let endpoint = `/leituras/periodo?inicio=${ini}&fim=${fim_}`;
  if (id_sensor) endpoint += `&id_sensor=${id_sensor}`;
  const response = await authFetch(endpoint);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao listar leituras por período' };
  return data;
};

export const createLeitura = async (payload) => {
  const response = await authFetch('/leituras', { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao registrar leitura' };
  return data;
};

export const deleteLeitura = async (id) => {
  const response = await authFetch(`/leituras/${id}`, { method: 'DELETE' });
  if (response.status === 204) return { message: 'Leitura deletada com sucesso' };
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.error || 'Erro ao deletar leitura' };
  return data;
};

// Aliases para compatibilidade com código existente
export const criarLeitura = createLeitura;
export const listarLeituras = getLeituras;
export const obterLeiturasRecentes = getLeiturasRecentes;
export const obterUltimaLeitura = getUltimaLeituraBySensor;
export const obterLeiturasPorSensor = getLeiturasBySensor;
export const obterLeiturasPorPeriodo = getLeiturasByPeriodo;
export const obterEstatisticas = getEstatisticas;
export const deletarLeitura = deleteLeitura;
