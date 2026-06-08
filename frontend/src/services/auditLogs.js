import { authFetch } from './api';

export const getAuditLogs = async ({ userId, entidade, acao, dataInicio, dataFim, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (entidade) params.append('entidade', entidade);
  if (acao) params.append('acao', acao);
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  params.append('page', page);
  params.append('limit', limit);

  const response = await authFetch(`/audit-logs?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Erro ao carregar histórico de ações'), { status: response.status });
  return data;
};
