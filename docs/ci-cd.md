# CI/CD — ManutAI

## O que é

CI/CD (Integração Contínua / Entrega Contínua) é um pipeline automatizado que executa testes e faz o deploy do projeto automaticamente sempre que código novo é enviado para a branch `main`.

No ManutAI, o pipeline é gerenciado pelo **GitHub Actions** e o deploy é feito na plataforma **Vercel**.

--- Para subir o código (Verificar se está na branch certa https://github.com/victorschramm/ProjetoFinalDSIoT)

git add .
git commit -m "sua mensagem"
git push origin main

## Como funciona o fluxo

```
git push origin main
        │
        ▼
┌─────────────────────────────────────────┐
│           GitHub Actions                │
│                                         │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ Backend Tests│  │ Frontend Build   │ │
│  │ (Jest)       │  │ (react-scripts)  │ │
│  └──────┬───────┘  └────────┬─────────┘ │
│         │                   │           │
│         └─────────┬─────────┘           │
│                   │ (ambos passaram?)   │
│                   ▼                     │
│  ┌──────────────────────────────────┐   │
│  │  Deploy Frontend → Vercel        │   │
│  │  Deploy Backend  → Vercel        │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

O pipeline só avança para o deploy se os testes **e** o build passarem. Se qualquer etapa falhar, o deploy é bloqueado.

---

## Arquivo do pipeline

`.github/workflows/ci-cd.yml`

### Jobs

| Job | Trigger | O que faz |
|---|---|---|
| `test-backend` | Todo push/PR na `main` | Instala dependências e roda `npm test` no backend |
| `build-frontend` | Todo push/PR na `main` | Instala dependências e roda `npm run build` no frontend |
| `deploy-frontend` | Push na `main` (após testes passarem) | Publica o frontend no Vercel |
| `deploy-backend` | Push na `main` (após testes passarem) | Publica o backend no Vercel |

Pull Requests **não fazem deploy** — apenas rodam os testes e o build para validação.

---

## Testes automatizados

Os testes ficam em `backend/src/__tests__/api.test.js` e usam **Jest** + **Supertest**.

### Testes implementados (6 no total)

| Teste | Endpoint | Resultado esperado |
|---|---|---|
| Login com credenciais erradas | `POST /api/login` | 401 |
| Acesso sem token | `GET /api/sensores` | 401 |
| Acesso sem token | `GET /api/alertas` | 401 |
| Cadastro de usuário | `POST /api/register` | 201 |
| Login com credenciais corretas | `POST /api/login` | 200 + token JWT |
| Acesso autenticado | `GET /api/alertas` | 200 |

### Ambiente de teste

Os testes rodam com banco de dados **SQLite em memória** (`:memory:`), ou seja, não tocam no banco de dados real. As configurações ficam em `backend/src/__tests__/setup.js`.

Para rodar os testes localmente:

```bash
cd backend
npm test
```

---

## Estrutura de arquivos criados

```
ProjetoFinalDSIoT/
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # Definição do pipeline
├── backend/
│   ├── api/
│   │   └── index.js             # Entrada serverless (Vercel)
│   ├── src/
│   │   ├── app.js               # Express app (separado do server.js)
│   │   └── __tests__/
│   │       ├── setup.js         # Variáveis de ambiente para testes
│   │       └── api.test.js      # Testes Jest/Supertest
│   ├── jest.config.js           # Configuração do Jest
│   └── vercel.json              # Roteamento serverless do backend
└── frontend/
    └── vercel.json              # Rewrite para SPA (React Router)
```

### Por que `app.js` foi separado de `server.js`?

O `server.js` inicializa MQTT, WebSocket e escuta uma porta — operações que não podem existir em testes automatizados nem em ambientes serverless. O `app.js` contém apenas o Express com middlewares e rotas, podendo ser importado isoladamente pelos testes e pelo Vercel.

---

## Secrets do GitHub necessários

Configurados em: **Repositório → Settings → Secrets and variables → Actions**

| Secret | Descrição |
|---|---|
| `VERCEL_TOKEN` | Token de autenticação da conta Vercel |
| `VERCEL_ORG_ID` | ID da organização/time no Vercel |
| `VERCEL_FRONTEND_PROJECT_ID` | ID do projeto `manutai-frontend` no Vercel |
| `VERCEL_BACKEND_PROJECT_ID` | ID do projeto `manutai-backend` no Vercel |
| `REACT_APP_API_URL` | URL pública do backend no Vercel |

---

## Variáveis de ambiente no Vercel (backend)

Configuradas em: **Vercel → manutai-backend → Settings → Environment Variables**

| Variável | Descrição |
|---|---|
| `JWT_SECRET` | Chave secreta para assinar os tokens JWT |
| `CORS_ORIGINS` | URL do frontend em produção (ex: `https://manutai-frontend.vercel.app`) |

---

## Limitações do ambiente serverless (Vercel)

O Vercel usa funções serverless, o que impõe algumas restrições em relação ao servidor local:

| Funcionalidade | Local | Vercel |
|---|---|---|
| API REST (login, alertas, sensores) | ✅ | ✅ |
| MQTT (dados do ESP32 em tempo real) | ✅ | ❌ |
| WebSocket (notificações em tempo real) | ✅ | ❌ |
| SQLite persistente | ✅ | ❌ (efêmero) |

Para produção completa com MQTT e WebSocket, o backend precisaria rodar em um servidor dedicado (ex: Railway, Render).

---

## Como acompanhar o pipeline

Após cada push na `main`, acesse:

```
github.com/<usuario>/ProjetoFinalDSIoT → Actions
```

Cada execução mostra o status de cada job com logs detalhados em caso de falha.
