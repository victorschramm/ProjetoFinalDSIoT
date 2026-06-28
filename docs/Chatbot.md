# Implementação do ChatBot IA — ManutAI

## Sumário

1. [Visão Geral](#visão-geral)
2. [Decisão Técnica](#decisão-técnica)
3. [Arquitetura Implementada](#arquitetura-implementada)
4. [Etapas de Implementação](#etapas-de-implementação)
5. [Problemas Encontrados em Produção](#problemas-encontrados-em-produção)
6. [Troca de Provedor: Gemini → Groq](#troca-de-provedor-gemini--groq)
7. [Configuração Final](#configuração-final)
8. [Como Testar](#como-testar)

---

## Visão Geral

O ManutAI, além de monitorar ambientes via IoT, conta com um **assistente inteligente baseado em IA** acessível por um botão flutuante presente em todas as páginas do sistema após o login.

O ChatBot é capaz de:

- Responder perguntas gerais sobre o projeto (o que é o ManutAI, como usar, tecnologias)
- Consultar dados reais do banco de dados em linguagem natural (temperatura atual, alertas, sensores offline, estatísticas)
- Sugerir manutenções preventivas com base nos dados do sistema
- Guiar o usuário pelas funcionalidades do sistema

---

## Decisão Técnica

### Provedores avaliados

Antes de implementar, foram avaliadas as opções disponíveis no mercado:

| Provedor | Tipo | Observação |
|---|---|---|
| Google Gemini API | Gratuito com limites | Escolhido inicialmente |
| Groq API | Gratuito com limites | Escolhido na versão final |
| OpenAI API | Pago | Descartado por custo |
| Anthropic Claude API | Pago | Descartado por custo |
| Ollama (local) | Gratuito / offline | Descartado pela complexidade de deploy |

### Escolha inicial: Google Gemini

O Google Gemini foi escolhido inicialmente por ser gratuito, bem documentado e ter suporte nativo a **Function Calling** — recurso essencial para que a IA consulte o banco de dados antes de responder.

---

## Arquitetura Implementada

O ChatBot utiliza a técnica de **Function Calling** (chamada de funções), que permite à IA decidir sozinha quando precisa consultar dados reais antes de responder.

```
Usuário faz uma pergunta
        ↓
  ChatBot.jsx (frontend)
        ↓ POST /api/chatbot/chat
  chatbotRoutes.js (auth + rate limit + validação Zod)
        ↓
  chatbotController.js
        ↓
  geminiService.js (lógica principal)
        ↓
  Modelo de IA (decide se precisa de dados)
        ↓ (se precisar)
  Funções de busca no banco (Sequelize)
  buscarSensores / buscarAlertas / buscarLeituras / etc.
        ↓
  Resultado retorna para a IA
        ↓
  IA formula resposta com dados reais
        ↓
  Resposta exibida no chat
```

### Funções disponíveis para a IA

| Função | O que faz |
|---|---|
| `buscarLeiturasRecentes` | Retorna leituras de temperatura/umidade dos últimos N minutos |
| `buscarAlertas` | Lista alertas por status (pendente, resolvido, ignorado) e severidade |
| `buscarAmbientes` | Lista ambientes com temperaturas e umidades ideais configuradas |
| `buscarSensores` | Lista sensores com status (ativo/OFFLINE) e último dado recebido |
| `buscarEstatisticas` | Calcula média, mínimo e máximo de leituras em um período |

---

## Etapas de Implementação

### Backend

**1. Instalação do SDK**
```bash
npm install @google/generative-ai  # versão inicial (Gemini)
# posteriormente substituído por:
npm install groq-sdk
```

**2. Arquivos criados**

| Arquivo | Responsabilidade |
|---|---|
| `backend/src/services/geminiService.js` | Lógica da IA, Function Calling, loop de respostas |
| `backend/src/controllers/chatbotController.js` | Recebe requisição, chama o service, registra no AuditLog |
| `backend/src/routes/chatbotRoutes.js` | Rota `POST /api/chatbot/chat` com autenticação JWT e rate limiting |

**3. Registro da rota** em `backend/src/routes/index.js`:
```javascript
const chatbotRoutes = require('./chatbotRoutes');
router.use('/chatbot', chatbotRoutes);
```

**4. Proteção de acesso**

A rota usa apenas `authMiddleware` — qualquer usuário autenticado (admin ou comum) tem acesso ao ChatBot.

### Frontend

**5. Serviço de API** criado em `frontend/src/services/chatbot.js`:
```javascript
export const enviarMensagem = async (mensagem, historico = []) => {
  const response = await authFetch('/chatbot/chat', {
    method: 'POST',
    body: JSON.stringify({ mensagem, historico })
  });
  return response.json();
};
```

**6. Componente ChatBot** em `frontend/src/components/ChatBot.jsx`:
- Botão flutuante no canto inferior direito com animação *pulse*
- Painel de chat com histórico de conversa
- Sugestões de perguntas rápidas ao abrir pela primeira vez
- Indicador de "digitando..." durante processamento
- Botão para limpar a conversa

**7. Integração global** em `frontend/src/App.js`:
```javascript
import ChatBot from './components/ChatBot';
import { isAuthenticated } from './services/api';

// Renderizado fora das rotas, visível em todas as páginas autenticadas
{isAuthenticated() && <ChatBot />}
```

---

## Problemas Encontrados em Produção

### Problema 1 — Tipos de schema em maiúsculas (SDK v0.24.1)

**Sintoma:** Erro genérico ao tentar usar o ChatBot.

**Causa:** A definição das ferramentas (`tools`) usava tipos em maiúsculas (`'OBJECT'`, `'STRING'`, `'NUMBER'`), mas o SDK `@google/generative-ai` v0.24.1 exige tipos em minúsculas (`'object'`, `'string'`, `'number'`).

```javascript
// ❌ Errado
parameters: { type: 'OBJECT', properties: { valor: { type: 'NUMBER' } } }

// ✅ Correto
parameters: { type: 'object', properties: { valor: { type: 'number' } } }
```

---

### Problema 2 — Loop de Function Calling com `undefined`

**Sintoma:** Erro `TypeError: Cannot read properties of undefined (reading 'length')`.

**Causa:** O método `functionCalls()` do SDK retorna `undefined` quando não há chamadas de funções, e o código tentava acessar `.length` diretamente sem verificar.

```javascript
// ❌ Errado — functionCalls() pode retornar undefined
while (result.response.functionCalls && result.response.functionCalls().length > 0)

// ✅ Correto — optional chaining e reavaliação a cada iteração
let chamadas = result.response.functionCalls?.();
while (chamadas && chamadas.length > 0) {
  // ... executa funções
  result = await chatSession.sendMessage(respostasFuncoes);
  chamadas = result.response.functionCalls?.();
}
```

---

### Problema 3 — `getHistory()` era assíncrono

**Sintoma:** `historico_atualizado` retornava uma Promise em vez do array de mensagens.

**Causa:** No SDK v0.24.1, o método `getHistory()` é assíncrono e exige `await`. O `await` havia sido removido por engano durante uma correção anterior.

```javascript
// ❌ Errado
const historico_atualizado = chatSession.getHistory();

// ✅ Correto
const historico_atualizado = await chatSession.getHistory();
```

---

### Problema 4 — Cota gratuita zerada no Google Gemini

**Sintoma:** Erro 429 com a mensagem:
```
Quota exceeded — limit: 0, model: gemini-2.0-flash
```

**Causa:** O Google bloqueou o free tier (`limit: 0`) para todas as chaves com o formato `AQ.` (novo formato de chaves do AI Studio), mesmo geradas por contas diferentes. Após testes com múltiplos modelos (`gemini-2.0-flash`, `gemini-2.0-flash-lite`) e múltiplas chaves, todas retornavam `limit: 0` no free tier.

**Tentativas realizadas:**
1. Trocar para `gemini-1.5-flash` → erro 404 (modelo não disponível para esse tipo de chave)
2. Trocar para `gemini-2.0-flash-lite` → mesmo erro 429 com `limit: 0`
3. Gerar nova chave em conta diferente → mesmo resultado
4. Trocar versão da API de `v1beta` para `v1` → erro 400 (`systemInstruction` e `tools` não existem na `v1`)

**Conclusão:** O tipo de chave `AQ.` não tem acesso ao free tier do Gemini. Seria necessário ativar faturamento no Google Cloud para usar qualquer modelo.

---

## Troca de Provedor: Gemini → Groq

### Por que o Groq?

O **Groq** foi escolhido como substituto por oferecer:
- Free tier com **14.400 requisições/dia** e **30 req/minuto**
- Suporte completo a **Function Calling** (compatível com formato OpenAI)
- Modelos de alta qualidade (Llama 3.3 70B)
- Velocidade de inferência muito alta (especialidade do Groq)
- SDK simples (`groq-sdk`) e API compatível com OpenAI

### O que mudou no código

| Aspecto | Gemini (anterior) | Groq (atual) |
|---|---|---|
| SDK | `@google/generative-ai` / `@google/genai` | `groq-sdk` |
| Inicialização | `new GoogleGenAI({ apiKey })` | `new Groq({ apiKey })` |
| Modelo | `gemini-2.0-flash-lite` | `llama-3.3-70b-versatile` |
| Formato de ferramentas | Google style | OpenAI-compatible |
| Histórico de conversa | Objetos `Content` do Google | Array de mensagens `{ role, content }` |
| Respostas de funções | `functionResponse: { id, name, response }` | `{ role: 'tool', tool_call_id, content }` |
| Variável de ambiente | `GEMINI_API_KEY` | `GROQ_API_KEY` |

### Formato do histórico de conversa no Groq

O Groq usa o formato OpenAI, onde o histórico é um array de mensagens com `role`:

```javascript
[
  { role: 'system', content: 'Você é o ManutAI...' },
  { role: 'user', content: 'Quais sensores estão offline?' },
  { role: 'assistant', content: null, tool_calls: [...] },
  { role: 'tool', tool_call_id: 'call_abc', content: '{"total":2,...}' },
  { role: 'assistant', content: 'Os sensores X e Y estão offline.' }
]
```

### Loop de Function Calling no Groq

```javascript
let response = await groq.chat.completions.create({ model, messages, tools });
let assistantMessage = response.choices[0].message;
messages.push(assistantMessage);

while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
  for (const toolCall of assistantMessage.tool_calls) {
    const args = JSON.parse(toolCall.function.arguments);
    const resultado = await executarFuncao(toolCall.function.name, args);
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultado)
    });
  }
  response = await groq.chat.completions.create({ model, messages, tools });
  assistantMessage = response.choices[0].message;
  messages.push(assistantMessage);
}
```

---

## Configuração Final

### Variáveis de ambiente necessárias (`backend/.env`)

```env
# GROQ IA (ChatBot)
# Gere sua chave em: https://console.groq.com/keys
GROQ_API_KEY=gsk_sua_chave_aqui
GROQ_MODEL=llama-3.3-70b-versatile
```

### Como obter a chave Groq

1. Acesse `console.groq.com`
2. Crie uma conta (qualquer e-mail)
3. Vá em **API Keys** → **Create API Key**
4. A chave gerada começa com `gsk_`
5. Cole no `backend/.env`

### Modelos disponíveis no Groq (gratuitos)

| Modelo | Características |
|---|---|
| `llama-3.3-70b-versatile` | Melhor qualidade, recomendado para produção |
| `llama-3.1-8b-instant` | Mais rápido, menor consumo de tokens |
| `mixtral-8x7b-32768` | Boa performance, contexto maior |

---

## Como Testar

### 1. Verificar se o backend está respondendo

```bash
curl -X POST https://projetofinaldsiot.onrender.com/api/chatbot/chat \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "O que é o ManutAI?"}'
```

Resposta esperada:
```json
{
  "resposta": "O ManutAI é um sistema completo de monitoramento ambiental IoT...",
  "historico_atualizado": [...],
  "timestamp": "2026-06-06T..."
}
```

### 2. Perguntas para testar Function Calling

| Pergunta | Função chamada pela IA |
|---|---|
| "Qual a temperatura atual?" | `buscarLeiturasRecentes` |
| "Há alertas pendentes?" | `buscarAlertas({ status: "pendente" })` |
| "Quais sensores estão offline?" | `buscarSensores({ status: "OFFLINE" })` |
| "Qual a média de umidade hoje?" | `buscarEstatisticas({ tipo_leitura: "umidade", horas: 24 })` |
| "Me liste os ambientes monitorados" | `buscarAmbientes` |

### 3. Verificar no terminal do backend

Quando o Function Calling está funcionando, o terminal exibe a cadeia completa:
1. Recebe a mensagem do usuário
2. IA decide chamar uma função
3. Função consulta o banco
4. IA recebe os dados e formula resposta

---

*Documentação criada em: 2026-06-06*
*Versão do ChatBot: 1.0 (Groq — Llama 3.3 70B)*
