const { z } = require('zod');

const createAlertaSchema = z.object({
  id_sensor: z.number({ required_error: 'id_sensor é obrigatório' }).int().positive(),
  tipo: z.string().min(1, 'tipo é obrigatório'),
  mensagem: z.string().min(1, 'mensagem é obrigatória'),
  nivel_severidade: z.enum(['alto', 'médio', 'baixo'], {
    errorMap: () => ({ message: 'nivel_severidade deve ser: alto, médio ou baixo' })
  }),
  valor_detectado: z.number().optional(),
  timestamp: z.string().optional()
});

const updateAlertaSchema = z.object({
  status: z.enum(['ativo', 'pendente', 'resolvido', 'ignorado'], {
    errorMap: () => ({ message: 'status deve ser: ativo, pendente, resolvido ou ignorado' })
  }).optional(),
  resolucao: z.string().optional()
});

module.exports = { createAlertaSchema, updateAlertaSchema };
