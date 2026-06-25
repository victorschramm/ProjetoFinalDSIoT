import { authFetch } from './api';

// Faz o parse seguro da resposta — se o servidor retornar HTML ou texto (ex: rota não encontrada),
// lança um erro legível em vez de um SyntaxError genérico do JSON.parse
async function parseJson(response, msgPadrao) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (response.status === 404) {
      throw new Error('Endpoint não encontrado. Reinicie o servidor backend e tente novamente.');
    }
    throw new Error(`Resposta inválida do servidor (${response.status}). Reinicie o backend.`);
  }
  if (!response.ok) {
    throw Object.assign(new Error(data.error || msgPadrao), { status: response.status });
  }
  return data;
}

// Retorna os registros de manutenção configurados pelo operador
export const getMaintenance = async () => {
  const response = await authFetch('/maintenance');
  return parseJson(response, 'Erro ao listar manutenções');
};

// Operador configura manutenção preventiva para um sensor pela primeira vez
export const createMaintenance = async (payload) => {
  const response = await authFetch('/maintenance', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return parseJson(response, 'Erro ao configurar manutenção');
};

// Operador edita limiteHoras ou descricao de um sensor já configurado
export const updateMaintenance = async (deviceId, payload) => {
  const response = await authFetch(`/maintenance/${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return parseJson(response, 'Erro ao atualizar manutenção');
};

// Zera o contador após a manutenção ser realizada
export const resetMaintenance = async (deviceId) => {
  const response = await authFetch(`/maintenance/reset/${deviceId}`, { method: 'POST' });
  return parseJson(response, 'Erro ao resetar contador');
};

// MTBF de todos os sensores: { [sensorId]: { falhas, horasObservadas, mtbfHoras } }
export const getMTBF = async () => {
  const response = await authFetch('/maintenance/mtbf');
  return parseJson(response, 'Erro ao calcular MTBF');
};
