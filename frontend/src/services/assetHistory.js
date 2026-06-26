import { authFetch } from './api';

// Retorna o histórico completo de um dispositivo, com filtros opcionais
export async function getAssetHistory(deviceId, { tipoEvento, inicio, fim } = {}) {
  const params = new URLSearchParams();
  if (tipoEvento) params.set('tipoEvento', tipoEvento);
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await authFetch(`/assets/${deviceId}/history${query}`);
  if (!response.ok) throw new Error(`Erro ao buscar histórico: ${response.status}`);
  return response.json();
}

// Registra uma falha identificada manualmente pelo usuário (fora dos critérios automáticos)
export async function registrarFalhaManual(deviceId, { descricao, dataEvento } = {}) {
  const response = await authFetch(`/assets/${deviceId}/history`, {
    method: 'POST',
    body: JSON.stringify({ descricao, dataEvento })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Erro ao registrar falha: ${response.status}`);
  }
  return response.json();
}

// MTBF do dispositivo: { falhas, horasObservadas, mtbfHoras }
export async function getAssetMTBF(deviceId) {
  const response = await authFetch(`/assets/${deviceId}/mtbf`);
  if (!response.ok) throw new Error(`Erro ao buscar MTBF: ${response.status}`);
  return response.json();
}
