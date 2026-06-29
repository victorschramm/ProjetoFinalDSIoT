# ManutAI — Sistema de Monitoramento Ambiental IoT com Manutenção Preditiva

Sistema completo de monitoramento ambiental desenvolvido como Projeto Final de Desenvolvimento de Sistemas IoT (SENAI). Integra um sensor físico (ESP32 + DHT11) a uma plataforma web com alertas automáticos, manutenção preditiva (MTBF) e um assistente de IA (Groq/Llama) que consulta dados reais do sistema.

**Stack:** ESP32 + DHT11 → MQTT/TLS (HiveMQ Cloud) → Node.js/Express + Sequelize (SQLite/MySQL) → React Dashboard

---

## Sumário

- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Primeiro Uso](#primeiro-uso)
- [Formato das Mensagens MQTT](#formato-das-mensagens-mqtt)
- [Modelo de Dados](#modelo-de-dados)
- [Alertas Automáticos](#alertas-automáticos)
- [Manutenção Preditiva (MTBF)](#manutenção-preditiva-mtbf)
- [Chatbot com IA (Groq)](#chatbot-com-ia-groq)
- [API Endpoints](#api-endpoints)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)
- [Documentação adicional](#documentação-adicional)

---

## Arquitetura

```
ESP32 (DHT11)
    │
    │ WiFiClientSecure + TLS (porta 8883)
    ▼
HiveMQ Cloud Broker
    ├── manutai/leitura   (ESP32 → backend: temperatura/umidade)
    ├── manutai/config    (backend → ESP32: intervalo de leitura remoto)
    └── manutai/buzzer    (backend → ESP32: alerta sonoro)
    │
    │ MQTT subscribe
    ▼
Backend Node.js
    ├── Salva Leitura no banco (SQLite em dev, MySQL em produção)
    ├── Gera Alerta se fora dos limites do Ambiente
    ├── Atualiza status do Sensor/Dispositivo (online/offline)
    ├── Calcula MTBF e registra eventos no histórico (AssetHistory)
    └── Publica comando de buzzer + envia e-mail quando há alerta
    │
    │ REST API + JWT / WebSocket
    ▼
Frontend React (atualiza a cada 5s)
    └── Dashboard, Monitoramento, Histórico, Alertas, Manutenção Preventiva, Chatbot IA
```

---

## Estrutura do Projeto

```
ProjetoFinalDSIoT/
├── backend/                    # API REST — Node.js + Express
│   ├── src/
│   │   ├── config/             # database.js, mqtt.js, email, groq
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── models/             # Modelos Sequelize
│   │   ├── routes/             # Endpoints da API
│   │   ├── middleware/         # Auth, rate limiting, erros
│   │   ├── schemas/            # Validação com Zod
│   │   ├── services/           # IA (Groq), MTBF, notificações
│   │   └── server.js           # Entry point + WebSocket
│   ├── seedDatabase.js         # Dados de teste
│   └── package.json
│
├── frontend/                   # Dashboard — React 19
│   ├── src/
│   │   ├── pages/              # Dashboard, Monitoramento, Alertas, Manutenção...
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── services/           # Chamadas à API
│   │   └── styles/             # CSS por componente
│   └── package.json
│
├── Iot/                        # Firmware — PlatformIO + ESP32
│   ├── src/main.cpp            # Código principal
│   ├── include/                # credentials.h (NÃO commitar — está no .gitignore)
│   └── platformio.ini
│
├── docs/                       # Documentação técnica complementar
│   ├── Chatbot.md, Manutenção.md, Buzzer.md, Central-de-Ajuda.md, ...
│
└── .env.example                # Modelo de variáveis de ambiente do backend
```

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| IoT | ESP32, DHT11, PlatformIO, PubSubClient, WiFiClientSecure |
| Protocolo | MQTT (HiveMQ Cloud, TLS na porta 8883) |
| Backend | Node.js, Express 5, Sequelize, SQLite (dev) / MySQL (produção), JWT, bcrypt, Zod, WebSocket (ws), express-rate-limit, Nodemailer |
| IA | Groq SDK — modelo `llama-3.3-70b-versatile` (function calling) |
| Frontend | React 19, React Router 7, Recharts, React Toastify, Lucide React, date-fns |
| Deploy | Backend no Railway, Frontend na Vercel, Broker MQTT no HiveMQ Cloud |

---

## Pré-requisitos

- Node.js 18+
- npm
- PlatformIO (para compilar o firmware do ESP32)
- Conta no HiveMQ Cloud (gratuita) — broker MQTT
- Conta na Groq (gratuita) — chave de API para o chatbot

---

## Instalação

### 1. Backend

```bash
cd backend
npm install
```

Copie o arquivo de variáveis de ambiente da raiz do projeto e preencha com seus próprios dados:

```bash
cp ../.env.example .env
```

Principais variáveis (`.env`):

```env
# Banco de dados — SQLite em dev ou MySQL em produção
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Autenticação
JWT_SECRET=gere_uma_chave_forte_aqui

# MQTT (HiveMQ Cloud)
MQTT_BROKER=mqtts://SEU_BROKER.hivemq.cloud:8883
MQTT_USERNAME=SEU_USUARIO_MQTT
MQTT_PASSWORD=SUA_SENHA_MQTT
MQTT_TOPIC=manutai/leitura

# Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3001

# E-mail (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# IA (Groq)
GROQ_API_KEY=sua-chave-groq
GROQ_MODEL=llama-3.3-70b-versatile
```

> Para gerar um `JWT_SECRET` seguro: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
> Gere a chave Groq em: https://console.groq.com/keys

Popule o banco com dados iniciais (opcional):

```bash
npm run seed
```

Inicie o servidor:

```bash
npm run dev
```

Saída esperada:
```
✓ Banco de dados sincronizado
✓ Conectado ao broker MQTT: mqtts://...
✓ Inscrito no tópico: manutai/leitura
🚀 Servidor rodando em http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Acesse: `http://localhost:3001`

> Se houver conflito de porta com o backend, configure `frontend/.env`:
> ```
> REACT_APP_API_URL=http://localhost:3000/api
> PORT=3001
> ```

### 3. ESP32 (firmware)

Crie `Iot/include/credentials.h` (não é versionado) com:

```cpp
#define WIFI_SSID "sua_rede"
#define WIFI_PASS "sua_senha"
#define MQTT_SERVER "seu-broker.hivemq.cloud"
#define MQTT_USER "seu_usuario_mqtt"
#define MQTT_PASS "sua_senha_mqtt"
```

Compile e faça upload via PlatformIO:

```bash
cd Iot
pio run --target upload
pio device monitor --baud 115200
```

Saída esperada no Serial Monitor:
```
✓ DHT11 inicializado no GPIO 4
✓ Buzzer inicializado no GPIO 18
✅ WiFi conectado! IP: 192.168.x.x
✅ MQTT conectado!
📊 Temperatura: 25.50°C
📤 Temperatura publicada!
```

**Conexões de hardware:**

| Componente | Pino ESP32 |
|---|---|
| DHT11 — DATA | GPIO 4 |
| Buzzer | GPIO 18 |

---

## Primeiro Uso

1. Acesse `http://localhost:3001` e faça login (ou cadastre um usuário em `/register`)
2. Crie um **Ambiente**: Menu → Ambientes → "+ Novo" (nome, localização, temperatura ideal, umidade ideal)
3. Cadastre um **Dispositivo**: Menu → Dispositivos → "+ Novo" (tópico MQTT igual ao do ESP32: `manutai/leitura`)
4. Cadastre um **Sensor**: Menu → Sensores → "+ Novo" (vincule ao Ambiente e ao Dispositivo criados)
5. Vá para **Monitoramento** — os dados aparecem em poucos segundos

Credenciais de teste (após `npm run seed`):

| Email | Senha | Perfil |
|---|---|---|
| admin@manutai.com | admin123 | admin |
| usuario@manutai.com | user123 | usuário comum |

---

## Formato das Mensagens MQTT

O ESP32 publica no tópico `manutai/leitura` uma mensagem JSON por tipo de leitura:

```json
{"id_sensor":1,"valor":25.50,"tipo_leitura":"temperatura","timestamp":"2026-06-02T19:30:45Z"}
{"id_sensor":1,"valor":60.00,"tipo_leitura":"umidade","timestamp":"2026-06-02T19:30:46Z"}
```

O backend também publica comandos de volta para o ESP32:

- `manutai/config` — novo intervalo de leitura em ms (5000–600000)
- `manutai/buzzer` — `2` (leitura abaixo do limite) ou `3` (leitura acima do limite)

---

## Modelo de Dados

```
Ambientes (id, nome, descricao, localizacao, temperatura_ideal, umidade_ideal)
    └── 1:N → Sensores

Dispositivos (id, nome, tipo, topico_mqtt, mac_address, status, ultima_conexao)
    └── 1:N → Sensores

Sensores (id, nome, tipo, status, lastSeen, id_ambiente, id_dispositivo)
    └── 1:N → Leituras
    └── 1:N → Alertas

Leituras (id, valor, tipo_leitura, unidade, timestamp, id_sensor)

Alertas (id, tipo, mensagem, nivel_severidade, valor_detectado, status, timestamp, id_sensor)

AssetHistory (id, deviceId, tipoEvento, descricao, dataEvento, id_usuario)

PreventiveMaintenance (id, deviceId, horasOperadas, limiteHoras, status, descricao)

Usuarios (id, name, email, password_hash, tipo_usuario, id_nivel_acesso)

AuditLogs (id, userId, acao, entidade, descricao, origem, timestamp)
```

---

## Alertas Automáticos

O backend gera alertas automaticamente quando um valor sai da faixa configurada no Ambiente:

- **Temperatura:** `temperatura_ideal ± 2°C`
- **Umidade:** `umidade_ideal ± 10%`

Um alerta aberto por sensor/tipo não gera duplicatas — um novo alerta só é criado depois que o anterior é resolvido ou ignorado. Quando um alerta é gerado, o backend também aciona o buzzer remotamente (via `manutai/buzzer`) e envia notificação por e-mail.

---

## Manutenção Preditiva (MTBF)

O sistema calcula o **MTBF (Mean Time Between Failures)** de cada sensor/dispositivo a partir do histórico de eventos (`AssetHistory`), contando falhas automáticas (sensor ficou offline) e falhas manuais registradas pelo operador. Quando o tempo atual sem resposta de um sensor supera seu MTBF histórico, o sensor é destacado na tela **Manutenção Preventiva** como candidato a manutenção.

---

## Chatbot com IA (Groq)

O sistema possui um assistente técnico (ManutAI) que responde perguntas em linguagem natural usando a API da Groq (modelo `llama-3.3-70b-versatile`) com **function calling** — ou seja, a IA consulta os dados reais do sistema antes de responder, em vez de inventar respostas.

Ferramentas disponíveis para a IA: `buscarLeiturasRecentes`, `buscarAlertas`, `buscarAmbientes`, `buscarSensores`, `buscarEstatisticas`, `calcularMTBF`, `analisarManutencao`.

Endpoint: `POST /api/chatbot` — `{ "mensagem": "...", "historico": [...] }`

Mais detalhes em [docs/Chatbot.md](docs/Chatbot.md).

---

## API Endpoints

Todas as rotas (exceto `/login` e `/register`) exigem o header `Authorization: Bearer <token>`.

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/register` | Cadastrar usuário |
| POST | `/api/login` | Login (retorna JWT) |
| GET | `/api/profile` | Dados do usuário autenticado |

### Leituras
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/leituras` | Últimas 100 leituras |
| GET | `/api/leituras/recentes?minutos=60` | Leituras dos últimos N minutos |
| GET | `/api/leituras/estatisticas` | Média, mín, máx, total |
| GET | `/api/leituras/sensor/:id` | Leituras de um sensor |
| GET | `/api/leituras/sensor/:id/ultima` | Última leitura do sensor |
| GET | `/api/leituras/periodo?inicio=&fim=` | Por período (ISO-8601) |
| POST | `/api/leituras` | Criar leitura manual |
| DELETE | `/api/leituras/:id` | Deletar leitura |

### Recursos com CRUD completo (GET/POST/PUT/DELETE)
| Recurso | Base |
|---|---|
| Ambientes | `/api/ambientes` |
| Dispositivos | `/api/dispositivos` |
| Sensores | `/api/sensores` |
| Alertas | `/api/alertas` |
| Usuários (admin) | `/api/usuarios` |

### Outros recursos
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/assets` | Histórico de eventos (Asset History) |
| POST | `/api/assets/falha-manual` | Registrar falha manual |
| GET | `/api/maintenance` | Configurações de manutenção preventiva |
| GET | `/api/maintenance/mtbf` | MTBF calculado de todos os sensores |
| GET | `/api/audit-logs` | Log de ações dos usuários (admin) |
| GET/POST | `/api/notifications` | Preferências de notificação (e-mail/WhatsApp) |
| GET/POST | `/api/config` | Configurações remotas (ex: intervalo de leitura do ESP32) |
| POST | `/api/chatbot` | Conversa com o assistente de IA |

---

## Segurança

- Autenticação JWT (expiração 24h)
- Senhas com hash bcrypt
- Rate limiting: 5 tentativas por 15 minutos em `/api/login`
- Validação de entrada com Zod (body/query/params)
- Conexão MQTT com TLS (porta 8883)
- Níveis de acesso por usuário (admin / usuário comum)
- Auditoria completa de ações (`AuditLogs`)

---

## Troubleshooting

### Backend não conecta ao MQTT
- Verifique `MQTT_BROKER`, `MQTT_USERNAME` e `MQTT_PASSWORD` no `.env`
- Verifique a conexão com a internet
- O servidor continua funcionando sem MQTT (apenas sem dados do ESP32)

### ESP32 não conecta ao WiFi
- Verifique `Iot/include/credentials.h` — SSID e senha corretos
- Garanta que o ESP32 está no alcance do roteador
- Redes 5GHz não são suportadas pelo ESP32 (use 2.4GHz)

### Frontend não exibe dados
- Verifique se o backend está rodando em `http://localhost:3000`
- Abra o DevTools (F12) → Console para ver erros
- Confirme que o Sensor foi cadastrado e está com status `ativo`
- O token JWT expira em 24h — faça logout e login novamente

### Banco não salva leituras
- Verifique se o `id_sensor` no payload do ESP32 corresponde a um sensor cadastrado no banco
- Consulte os logs do backend (`npm run dev` exibe cada leitura salva)

### Conflito de portas (backend e frontend na 3000)
Crie `frontend/.env` com:
```
REACT_APP_API_URL=http://localhost:3000/api
PORT=3001
```

---

## Documentação adicional

Documentação técnica detalhada por funcionalidade está em [docs/](docs/):

- [Chatbot.md](docs/Chatbot.md) — assistente de IA
- [Manutenção.md](docs/Manuten%C3%A7%C3%A3o.md) — manutenção preventiva e MTBF
- [Buzzer.md](docs/Buzzer.md) — alertas sonoros
- [Central-de-Ajuda.md](docs/Central-de-Ajuda.md) — central de ajuda contextual
- [Rastreabilidade.md](docs/Rastreabilidade.md) — auditoria e histórico
- [Recuperacao-senha.md](docs/Recuperacao-senha.md) — fluxo de recuperação de senha
- [CI-CD.md](docs/CI-CD.md) — pipeline de integração contínua
- [Dados-mokados.md](docs/Dados-mokados.md) — seed/dados de teste
- [Login-Legado.md](docs/Login-Legado.md) — notas sobre o login legado

---

## Autores

- Victor Schramm

**Projeto Final — DS IoT | SENAI**
