const { chat } = require('../services/geminiService');
const { logAction } = require('../services/auditLogService');

module.exports = {
  async chat(req, res) {
    const { mensagem, historico = [] } = req.body;

    try {
      const { resposta, historico_atualizado } = await chat(mensagem, historico);

      await logAction({
        userId: req.user?.id,
        acao: 'CHATBOT_CONSULTA',
        entidade: 'ChatBot',
        descricao: `Consulta: "${mensagem.substring(0, 80)}${mensagem.length > 80 ? '...' : ''}"`,
        origem: 'WEB'
      });

      res.json({ resposta, historico_atualizado, timestamp: new Date() });
    } catch (error) {
      console.error('[ChatBot] Erro:', error.message);
      if (error.message?.includes('API_KEY') || error.message?.includes('API key') || error.message?.includes('GROQ')) {
        return res.status(500).json({ error: 'Chave da API Groq não configurada. Adicione GROQ_API_KEY no arquivo .env do backend.' });
      }
      res.status(500).json({
        error: 'Erro ao processar mensagem. Tente novamente.',
        detalhe: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};
