/**
 * Serviço para gerenciar Leituras (Temperatura, Umidade, Potenciômetro)
 * Conecta com o backend para salvar e recuperar dados de sensores
 */

import { login } from './api';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

/**
 * Criar uma nova leitura
 */
export const criarLeitura = async (dados) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leituras`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar leitura');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar leitura:', error);
    throw error;
  }
};

/**
 * Listar todas as leituras
 */
export const listarLeituras = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/leituras`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao listar leituras');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao listar leituras:', error);
    throw error;
  }
};

/**
 * Obter leituras recentes (últimas N minutos)
 * @param {number} minutos - Últimos N minutos (padrão: 60)
 */
export const obterLeiturasRecentes = async (minutos = 60) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leituras/recentes?minutos=${minutos}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter leituras recentes');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter leituras recentes:', error);
    throw error;
  }
};

/**
 * Obter a última leitura de um sensor específico
 * @param {number} id_sensor - ID do sensor
 */
export const obterUltimaLeitura = async (id_sensor) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leituras/sensor/${id_sensor}/ultima`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter última leitura');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter última leitura:', error);
    throw error;
  }
};

/**
 * Obter leituras de um sensor específico
 * @param {number} id_sensor - ID do sensor
 * @param {number} limite - Quantidade máxima de registros
 * @param {string} tipo - Tipo de leitura (temperatura, umidade, potenciometro)
 */
export const obterLeiturasPorSensor = async (id_sensor, limite = 50, tipo = null) => {
  try {
    let url = `${API_BASE_URL}/leituras/sensor/${id_sensor}?limite=${limite}`;
    if (tipo) {
      url += `&tipo=${tipo}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter leituras do sensor');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter leituras do sensor:', error);
    throw error;
  }
};

/**
 * Obter leituras em um período específico
 * @param {Date} inicio - Data inicial
 * @param {Date} fim - Data final
 * @param {number} id_sensor - ID do sensor (opcional)
 */
export const obterLeiturasPorPeriodo = async (inicio, fim, id_sensor = null) => {
  try {
    let url = `${API_BASE_URL}/leituras/periodo?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`;
    if (id_sensor) {
      url += `&id_sensor=${id_sensor}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter leituras por período');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter leituras por período:', error);
    throw error;
  }
};

/**
 * Obter estatísticas das leituras
 * @param {number} id_sensor - ID do sensor (opcional)
 * @param {string} tipo_leitura - Tipo de leitura (opcional)
 * @param {Date} inicio - Data inicial (opcional)
 * @param {Date} fim - Data final (opcional)
 */
export const obterEstatisticas = async (id_sensor = null, tipo_leitura = null, inicio = null, fim = null) => {
  try {
    let url = `${API_BASE_URL}/leituras/estatisticas?`;
    const params = [];

    if (id_sensor) params.push(`id_sensor=${id_sensor}`);
    if (tipo_leitura) params.push(`tipo_leitura=${tipo_leitura}`);
    if (inicio) params.push(`inicio=${inicio.toISOString()}`);
    if (fim) params.push(`fim=${fim.toISOString()}`);

    url += params.join('&');

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter estatísticas');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};

/**
 * Deletar uma leitura
 * @param {number} id - ID da leitura
 */
export const deletarLeitura = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leituras/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar leitura');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao deletar leitura:', error);
    throw error;
  }
};
