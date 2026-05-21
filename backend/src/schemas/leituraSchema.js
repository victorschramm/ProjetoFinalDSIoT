const { z } = require('zod');

const createLeituraSchema = z.object({
  id_sensor: z.number({ required_error: 'id_sensor é obrigatório' }).int().positive(),
  valor: z.number({ required_error: 'valor é obrigatório' }),
  tipo_leitura: z.enum(['temperatura', 'umidade', 'potenciometro'], {
    errorMap: () => ({ message: 'tipo_leitura deve ser: temperatura, umidade ou potenciometro' })
  }),
  unidade: z.string().optional(),
  timestamp: z.string().optional()
});

module.exports = { createLeituraSchema };
