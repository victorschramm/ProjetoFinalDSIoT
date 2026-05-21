# CT-001 — Recuperação e Redefinição de Senha

**Versão:** 1.1.0  
**Data:** 2026-05-20  
**Módulo:** Autenticação  
**Sprint/Fase:** Fase 2 — Segurança e Fluxo de Autenticação Completo  

---

## 1. Visão Geral da Funcionalidade

Implementação do fluxo completo de recuperação de senha via email para o sistema ManutAI. O usuário que esqueceu sua senha pode solicitar um link de redefinição por email, receber um token seguro com validade de 1 hora e criar uma nova senha pela interface web.

### Arquivos envolvidos

| Camada | Arquivo | Papel |
|--------|---------|-------|
| Model | `backend/src/models/Usuario.js` | Campos `reset_token` e `reset_token_expiry` |
| Config | `backend/src/config/email.js` | Transporter Nodemailer + template HTML do email |
| Controller | `backend/src/controllers/authController.js` | `forgotPassword` e `resetPassword` |
| Rotas | `backend/src/routes/authRoutes.js` | `POST /forgot-password` e `POST /reset-password` |
| Frontend | `frontend/src/pages/ForgotPassword.jsx` | Formulário de solicitação de link |
| Frontend | `frontend/src/pages/ResetPassword.jsx` | Formulário de nova senha com validação de token |
| Frontend | `frontend/src/pages/Login.jsx` | Link "Esqueci minha senha" |
| Frontend | `frontend/src/App.js` | Rotas `/forgot-password` e `/reset-password` |

---

## 2. Fluxo do Sistema

```
[Usuário] → /forgot-password (form email)
           → POST /api/forgot-password
           → Backend gera token (crypto 32 bytes hex)
           → Salva token + expiry (NOW + 1h) no banco
           → Envia email via Gmail SMTP (Nodemailer)
           → Retorna resposta genérica (não revela se email existe)

[Email]    → Link: /reset-password?token=<hex64chars>

[Usuário] → /reset-password?token=... (form nova senha)
           → POST /api/reset-password { token, novaSenha }
           → Backend valida token no banco
           → Verifica se não expirou
           → Atualiza senha (bcrypt via hook beforeUpdate)
           → Limpa reset_token e reset_token_expiry
           → Redireciona para /login em 3 segundos
```

---

## 3. Casos de Teste

### CT-001.01 — Solicitação de link com email válido cadastrado

**Pré-condição:** Usuário com `email@exemplo.com` existe no banco.

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/forgot-password` |
| **Body** | `{ "email": "email@exemplo.com" }` |
| **Resultado esperado** | HTTP 200 |
| **Body esperado** | `{ "message": "Se este email estiver cadastrado, você receberá as instruções em breve." }` |
| **Efeito colateral** | Email enviado; campos `reset_token` e `reset_token_expiry` preenchidos no banco |

---

### CT-001.02 — Solicitação de link com email não cadastrado

**Pré-condição:** Email não existe no banco.

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/forgot-password` |
| **Body** | `{ "email": "inexistente@teste.com" }` |
| **Resultado esperado** | HTTP 200 |
| **Body esperado** | `{ "message": "Se este email estiver cadastrado, você receberá as instruções em breve." }` |
| **Observação** | Resposta idêntica ao CT-001.01 — não revela enumeração de usuários |

---

### CT-001.03 — Solicitação sem campo email

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/forgot-password` |
| **Body** | `{}` |
| **Resultado esperado** | HTTP 400 |
| **Body esperado** | `{ "error": "Email é obrigatório" }` |

---

### CT-001.04 — Redefinição com token válido

**Pré-condição:** Token gerado há menos de 1 hora, ainda não utilizado.

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/reset-password` |
| **Body** | `{ "token": "<token_hex_64_chars>", "novaSenha": "nova123" }` |
| **Resultado esperado** | HTTP 200 |
| **Body esperado** | `{ "message": "Senha redefinida com sucesso! Faça login com a nova senha." }` |
| **Efeito colateral** | `password` atualizado (bcrypt), `reset_token` = null, `reset_token_expiry` = null |

---

### CT-001.05 — Redefinição com token expirado

**Pré-condição:** Token existe no banco mas `reset_token_expiry` < NOW.

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/reset-password` |
| **Body** | `{ "token": "<token_expirado>", "novaSenha": "nova123" }` |
| **Resultado esperado** | HTTP 400 |
| **Body esperado** | `{ "error": "Token expirado. Solicite uma nova redefinição de senha." }` |

---

### CT-001.06 — Redefinição com token inválido/inexistente

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/reset-password` |
| **Body** | `{ "token": "tokenqualquerinvalido", "novaSenha": "nova123" }` |
| **Resultado esperado** | HTTP 400 |
| **Body esperado** | `{ "error": "Token inválido ou já utilizado" }` |

---

### CT-001.07 — Redefinição com token já utilizado

**Pré-condição:** Token foi usado; `reset_token` = null no banco.

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/reset-password` |
| **Body** | `{ "token": "<token_ja_usado>", "novaSenha": "nova123" }` |
| **Resultado esperado** | HTTP 400 |
| **Body esperado** | `{ "error": "Token inválido ou já utilizado" }` |

---

### CT-001.08 — Redefinição com senha muito curta

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/reset-password` |
| **Body** | `{ "token": "<token_valido>", "novaSenha": "abc" }` |
| **Resultado esperado** | HTTP 400 |
| **Body esperado** | `{ "error": "A senha deve ter pelo menos 6 caracteres" }` |

---

### CT-001.09 — Redefinição sem campos obrigatórios

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/reset-password` |
| **Body** | `{}` |
| **Resultado esperado** | HTTP 400 |
| **Body esperado** | `{ "error": "Token e nova senha são obrigatórios" }` |

---

### CT-001.10 — Rate limit em tentativas excessivas

**Pré-condição:** Mais de 10 requisições ao mesmo endpoint em 15 minutos.

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/forgot-password` ou `POST /api/reset-password` |
| **Resultado esperado** | HTTP 429 |
| **Body esperado** | Mensagem de rate limit do `authLimiter` |

---

### CT-001.11 — Interface: link sem token na URL

**Pré-condição:** Usuário acessa `/reset-password` sem parâmetro `?token=`.

| Campo | Valor |
|-------|-------|
| **URL** | `http://localhost:3001/reset-password` |
| **Resultado esperado** | Exibe estado de "Link inválido ou expirado" imediatamente |
| **Comportamento** | Botão "Solicitar novo link" redireciona para `/forgot-password` |

---

### CT-001.12 — Interface: senhas não coincidem no formulário

**Pré-condição:** Usuário preenche "Nova senha" e "Confirmar senha" com valores diferentes.

| Campo | Valor |
|-------|-------|
| **Comportamento esperado** | Mensagem de erro inline abaixo do campo de confirmação |
| **Mensagem** | "As senhas não coincidem" |
| **Envio do form** | Bloqueado até que as senhas coincidam |

---

### CT-001.13 — Interface: redirecionamento automático após sucesso

**Pré-condição:** Senha redefinida com sucesso (CT-001.04 via UI).

| Campo | Valor |
|-------|-------|
| **Comportamento esperado** | Toast "Senha redefinida com sucesso!" + tela de confirmação |
| **Redirecionamento** | Automático para `/login` após 3 segundos |

---

## 4. Configuração de Ambiente para Execução dos Testes

### Variáveis de ambiente necessárias (`backend/.env`)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=manutaiempresa@gmail.com
EMAIL_PASS=<app-password-16-chars>   # Senha de App do Google (não a senha da conta)
FRONTEND_URL=http://localhost:3001
```

> **Atenção:** O Gmail exige **Senha de App** (Google Account → Segurança → Verificação em 2 etapas → Senhas de app). Senhas comuns são rejeitadas desde 2022.

### Como obter uma Senha de App do Google

1. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecione "Email" e "Outro dispositivo" → nomeie como "ManutAI"
3. Copie os 16 caracteres gerados (formato `xxxx xxxx xxxx xxxx`)
4. Cole no `.env` sem espaços ou com espaços — ambos são aceitos

---

## 5. Checklist de Verificação Manual

Execute na ordem após subir `npm start` no backend e `npm start` no frontend:

- [ ] Acessar `/login` → link "Esqueci minha senha" visível
- [ ] Clicar no link → redirecionado para `/forgot-password`
- [ ] Inserir email cadastrado → exibe tela de confirmação com ícone 📧
- [ ] Verificar caixa de entrada do email → email recebido com botão "Redefinir Senha"
- [ ] Clicar no botão do email → abre `/reset-password?token=...`
- [ ] Preencher nova senha (≥ 6 chars) e confirmar → botão habilitado
- [ ] Submeter → toast de sucesso + contador de redirecionamento
- [ ] Após 3s → redirecionado para `/login`
- [ ] Fazer login com a nova senha → acesso concedido
- [ ] Tentar reutilizar o mesmo link → exibe "Link inválido ou expirado"

---

## 6. Decisões de Implementação

| Decisão | Motivo |
|---------|--------|
| Resposta genérica no `forgotPassword` | Evitar enumeração de usuários cadastrados (OWASP A07) |
| Token com `crypto.randomBytes(32)` | 256 bits de entropia — inviável por força bruta |
| Expiração de 1 hora | Janela curta minimiza risco em caso de interceptação |
| Token anulado após uso (`null`) | Tokens de uso único — reutilização bloqueada |
| Hash de senha via hook `beforeUpdate` | Consistência — toda atualização de `password` é hasheada automaticamente |
| Rate limit em ambas as rotas | Protege contra automação e enumeração por tempo de resposta |

---

## 7. Histórico de Versão

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2026-05-19 | Implementação inicial: modelo, controller, rotas, emails, UI |
| 1.1.0 | 2026-05-20 | Configuração da Senha de App do Gmail; documentação de casos de teste |
