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
