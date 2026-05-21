const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').min(5).max(100),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  tipo_usuario: z.enum(['admin', 'usuario'], {
    errorMap: () => ({ message: 'Tipo de usuário deve ser admin ou usuario' })
  }),
  id_nivel_acesso: z.number().int().positive().optional()
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

module.exports = { registerSchema, loginSchema };
