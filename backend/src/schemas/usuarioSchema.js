import {z} from 'zod';

export const usuarioSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().min(5, "Email deve ter pelo menos 5 caracteres").max(100, "Email deve ter no máximo 100 caracteres").email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(20, "Senha deve ter no máximo 20 caracteres"),
  tipo_Usuario: z.enum(["Administrador", "Operador"], {
    errorMap: () => ({ message: "Tipo inválido" })
  })
});