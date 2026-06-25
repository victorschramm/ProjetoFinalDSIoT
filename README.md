# ManutAI — Sistema de Monitoramento IoT

Sistema completo de monitoramento ambiental desenvolvido como Projeto Final de DS IoT.

**Stack:** ESP32 + DHT11 → MQTT (HiveMQ Cloud) → Node.js/Express + SQLite → React Dashboard

---

## Arquitetura

```
ESP32 (DHT11)
    │
    │ WiFiClientSecure + TLS (porta 8883)
    ▼
HiveMQ Cloud Broker
    │
    │ MQTT subscribe (manutai/leitura)
    ▼
Backend Node.js
    ├── Salva Leitura no SQLite
    ├── Gera Alerta se fora dos limites
    └── Atualiza status do Dispositivo
    │
    │ REST API + JWT
    ▼
Frontend React (atualiza a cada 5s)
    └── Dashboard, Monitoramento, Histórico, Alertas
```

---

## Estrutura do Projeto

```
ProjetoFinalDSIoT/
├── backend/                    # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # SQLite via Sequelize
│   │   │   └── mqtt.js         # Conexão MQTT + processamento
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── models/             # Modelos Sequelize
│   │   ├── routes/             # Endpoints da API
│   │   ├── middleware/         # Auth, rate limiting, erros
│   │   ├── schemas/            # Validação com Zod
│   │   └── server.js           # Entry point
│   ├── .env.example            # Variáveis de ambiente (modelo)
│   ├── seedDatabase.js         # Dados de teste
│   └── package.json
│
├── frontend/                   # React 19 + Vite
│   ├── src/
│   │   ├── pages/              # Dashboard, Monitoramento, Alertas...
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── services/           # Chamadas à API (api.js, leituras.js)
│   │   └── styles/             # CSS por componente
│   └── package.json
│
└── Iot/                        # PlatformIO + ESP32
    ├── src/main.cpp            # Código principal
    ├── include/
    │   ├── credentials.h       # WiFi (NÃO commitar — está no .gitignore)
    │   └── credentials.example.h  # Modelo para preencher
    └── platformio.ini
```

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- PlatformIO (para compilar o ESP32)
- Conta no HiveMQ Cloud (gratuita)

---

## Instalação

### 1. Backend

```bash
cd backend
npm install
```

Copie o arquivo de variáveis de ambiente e preencha com seus dados:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
MQTT_BROKER=mqtts://SEU_BROKER.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=SEU_USUARIO_MQTT
MQTT_PASSWORD=SUA_SENHA_MQTT
MQTT_TOPIC=manutai/leitura

JWT_SECRET=gere_uma_chave_forte_aqui

PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

> Para gerar um JWT_SECRET seguro: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

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

---

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Acesse: `http://localhost:3001`

> Se houver conflito de porta com o backend, o Vite sobe automaticamente na 3001.

---

### 3. ESP32

Copie o arquivo de credenciais:

```bash
cp Iot/include/credentials.example.h Iot/include/credentials.h
```

Edite `Iot/include/credentials.h` com sua rede WiFi:

```cpp
#define WIFI_SSID "sua_rede"
#define WIFI_PASS "sua_senha"
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
✅ WiFi conectado! IP: 192.168.x.x
✅ MQTT conectado!
📤 Temperatura publicada: 25.5°C
📤 Umidade publicada: 60.0%
```

---

## Primeiro Uso

1. Acesse `http://localhost:3001` e faça login (ou cadastre um usuário em `/register`)
2. Crie um **Ambiente**: Menu → Ambientes → "+ Novo"
   - Nome, Localização, Temperatura Ideal, Umidade Ideal
3. Cadastre um **Dispositivo**: Menu → Dispositivos → "+ Novo"
   - Tópico MQTT: `manutai/leitura` (deve ser igual ao do ESP32)
4. Cadastre um **Sensor**: Menu → Sensores → "+ Novo"
   - Vincule ao Ambiente e ao Dispositivo criados
5. Vá para **Monitoramento** — os dados aparecem em até 10 segundos

---

## API Endpoints

Todas as rotas (exceto login/register) exigem header `Authorization: Bearer <token>`.

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/login` | Login (retorna JWT) |
| POST | `/api/register` | Cadastrar usuário |
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

### Outros recursos (CRUD completo)
- `/api/ambientes` — Ambientes/salas
- `/api/dispositivos` — Dispositivos ESP32
- `/api/sensores` — Sensores
- `/api/alertas` — Alertas gerados automaticamente
- `/api/usuarios` — Usuários (admin only)
- `/api/niveis-acesso` — Níveis de acesso (admin only)

---

## Formato das Mensagens MQTT

O ESP32 publica no tópico `manutai/leitura` mensagens separadas por tipo:

```json
{ "id_sensor": 1, "valor": 25.5, "tipo_leitura": "temperatura", "timestamp": "2025-01-15T10:30:45Z" }
{ "id_sensor": 1, "valor": 60.0, "tipo_leitura": "umidade",     "timestamp": "2025-01-15T10:30:46Z" }
```

Campos suportados em `tipo_leitura`: `temperatura`, `umidade`, `potenciometro`

---

## Modelo de Dados

```
Ambientes (id, nome, descricao, localizacao, temperatura_ideal, umidade_ideal)
    └── 1:N → Sensores

Dispositivos (id, nome, tipo, topico_mqtt, mac_address, status, ultima_conexao)
    └── 1:N → Sensores

Sensores (id, nome, tipo, status, id_ambiente, id_dispositivo)
    └── 1:N → Leituras
    └── 1:N → Alertas

Leituras (id, valor, tipo_leitura, unidade, timestamp, id_sensor)

Alertas (id, tipo, mensagem, nivel_severidade, valor_detectado, status, timestamp, id_sensor)

Usuarios (id, name, email, password_hash, tipo_usuario, id_nivel_acesso)
```

---

## Alertas Automáticos

O backend gera alertas automaticamente quando um valor sai da faixa configurada no Ambiente:

- **Temperatura**: `temperatura_ideal ± 2°C`
- **Umidade**: `umidade_ideal ± 10%`

Um alerta aberto por sensor/tipo não gera duplicatas — apenas um novo alerta é criado quando o anterior for fechado.

---

## Troubleshooting

### Backend não conecta ao MQTT
- Verifique o arquivo `.env` — `MQTT_BROKER`, `MQTT_USERNAME` e `MQTT_PASSWORD` devem estar preenchidos
- Verifique conexão com a internet
- O servidor continua funcionando sem MQTT (apenas sem recebimento de dados do ESP32)

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
- Consulte os logs do backend: `npm run dev` exibe cada leitura salva

### Conflito de portas (backend e frontend na 3000)
Crie `frontend/.env` com:
```
REACT_APP_API_URL=http://localhost:3000/api
PORT=3001
```

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| IoT | ESP32, DHT11, PlatformIO, PubSubClient, ArduinoJson |
| Protocolo | MQTT 5 (HiveMQ Cloud, TLS 8883) |
| Backend | Node.js, Express 5, Sequelize, SQLite, JWT, bcrypt, Zod |
| Frontend | React 19, React Router 7, Recharts, React Toastify |

---

## Autores

- Victor Schramm

Email	Senha	Perfil
admin@manutai.com	admin123	admin
usuario@manutai.com	user123	usuário comum


---

**Projeto Final — DS IoT | SENAI**


-------------------------------------
Tudo bem, paro por aqui.

Resumo do que ficou pronto nesta sessão:

Corrigi um bug real no cálculo de MTBF: o histórico (AssetHistory) grava eventos automáticos usando o ID do Dispositivo (ESP32), não o ID do Sensor, quando o sensor está vinculado a um. O serviço de MTBF e o registro de falha manual agora usam essa mesma chave — antes, 5 dos 9 sensores estavam puxando dados do dispositivo errado.
Adicionei exibição do MTBF na tela Currículo da Máquina, ao lado das infos do dispositivo selecionado.
Build do frontend e sintaxe do backend validados sem erros.
Pendência para retomar: o backend não chegou a reiniciar limpo no final (mesmo bug pré-existente de churn de foreign key no MySQL do Railway, que já tinha aparecido antes — não é causado por essas últimas mudanças). Quando voltar, é só rodar npm run dev na pasta backend de novo; se travar com erro de ALTER TABLE ... DROP FOREIGN KEY, mate os processos node residual (taskkill / kill -9) e suba de novo — geralmente estabiliza numa segunda tentativa, como aconteceu hoje.

Se quiser, quando retomar posso também corrigir a causa raiz desse bug de FK (é uma definição duplicada de chave estrangeira no Sensor.js) para parar de acontecer.

---------------------------------------