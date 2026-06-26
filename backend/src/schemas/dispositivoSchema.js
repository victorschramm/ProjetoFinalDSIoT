const { z } = require('zod');

const createDispositivoSchema = z.object({
  nome: z.string().min(1, 'nome é obrigatório').max(100),
  tipo: z.string().optional(),
  topico_mqtt: z.string().min(1, 'topico_mqtt é obrigatório'),
  mac_address: z.string().optional(),
  descricao: z.string().optional(),
  status: z.enum(['ativo', 'inativo']).optional()
});

const updateDispositivoSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  tipo: z.string().optional(),
  topico_mqtt: z.string().min(1).optional(),
  mac_address: z.string().optional(),
  descricao: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'offline']).optional()
});

module.exports = { createDispositivoSchema, updateDispositivoSchema };
