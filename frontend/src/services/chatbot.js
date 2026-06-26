import { authFetch } from './api';

export const enviarMensagem = async (mensagem, historico = []) => {
  const response = await authFetch('/chatbot/chat', {
    method: 'POST',
    body: JSON.stringify({ mensagem, historico })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao enviar mensagem');
  }

  return data;
};
