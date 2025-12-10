# Projeto Final IoT - Sistema Completo de Monitoramento

## 📋 Visão Geral

Sistema completo de monitoramento ambiental com ESP32/ESP8266 que envia dados via MQTT para um backend Node.js, que armazena em banco SQLite e exibe em um dashboard React.

### Fluxo de Funcionamento

```
ESP32 → MQTT (broker.hivemq.com) → Backend (Node.js) → Banco de Dados → Frontend (React)
  ↓                                                                        ↓
Sensores de                                                          Dashboard
Temperatura/Umidade                                                  em Tempo Real
```

## 🚀 Início Rápido

### 1️⃣ Configurar e Iniciar o Backend

```bash
cd backend
npm install
npm run seed        # Popula banco com dados de teste
npm run dev         # Inicia servidor (http://localhost:3000)
```

### 2️⃣ Configurar e Iniciar o Frontend

```bash
cd front-ambiental
npm install
npm start           # Inicia em http://localhost:3000 ou :3001
```

### 3️⃣ Configurar o ESP32

Edite `Iot/include/credentials.h`:

```cpp
#define WIFI_SSID "sua_rede_wifi"
#define WIFI_PASS "sua_senha_wifi"
```

Compile e upload:

```bash
cd Iot
pio run -t upload  # PlatformIO
```

## 🔑 Primeiros Passos no Sistema

### 1. Login
- Email: `admin@test.com`
- Senha: `senha123`

### 2. Criar Ambientes (se não existir)
`Menu > Configurações > Ambientes > + Novo Ambiente`

- Nome: "Sala Principal"
- Localização: "Primeiro andar"
- Temperatura Ideal: 22°C
- Umidade Ideal: 50%

### 3. Registrar Dispositivos ESP
`Menu > Configurações > Dispositivos ESP > + Novo Dispositivo`

- **Nome**: ESP32 Sala
- **Tipo**: ESP32
- **Tópico MQTT**: `ProjetoFinalIot` (mesmo do seu ESP)
- **Status**: Ativo

### 4. Criar Sensores
`Menu > Configurações > Sensores > + Novo Sensor`

- **Nome**: Temperatura Sala
- **Tipo**: 🌡️ Temperatura
- **Modelo**: DHT22
- **Ambiente**: Sala Principal
- **Dispositivo**: ESP32 Sala

### 5. Visualizar Dados
- **Dashboard**: Resumo geral
- **Tempo Real**: Atualiza a cada 5 segundos
- **Histórico**: Gráficos dos últimos dias
- **Leituras**: Lista completa

## 📱 Páginas do Sistema

### Dashboard
- 📊 Estatísticas gerais
- 🟢 Sensores ativos/offline
- ⚠️ Alertas críticos
- 📈 Gráficos de temperatura e umidade

### Monitoramento Tempo Real
- Atualização automática a cada 5 segundos
- Status de cada sensor
- Última leitura e hora
- Detecção de dispositivos offline

### Histórico e Gráficos
- Período personalizável
- Gráficos interativos
- Download de dados
- Análise de tendências

### Configurações
- **Dispositivos ESP**: Gerenciar tópicos MQTT
- **Ambientes**: Criar salas/zonas monitoradas
- **Sensores**: Vincular sensores aos ambientes
- **Leituras**: Ver histórico completo

### Administração
- **Usuários**: Criar/editar/deletar
- **Níveis de Acesso**: Gerenciar permissões
- **Alertas**: Configurar limites

## 🔌 Estrutura do Projeto

```
ProjetoFinalDSIoT/
├── backend/                    # Node.js + Express
│   ├── src/
│   │   ├── server.js          # Servidor principal
│   │   ├── config/
│   │   │   ├── database.js    # Configuração SQLite
│   │   │   └── mqtt.js        # Conexão MQTT
│   │   ├── models/            # Modelos Sequelize
│   │   ├── controllers/       # Lógica das rotas
│   │   ├── routes/            # Definição de rotas
│   │   └── middleware/        # Autenticação, etc
│   ├── seedDatabase.js        # Dados de teste
│   └── package.json
│
├── front-ambiental/           # React
│   ├── src/
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── services/         # Chamadas à API
│   │   └── styles/           # CSS
│   └── package.json
│
└── Iot/                       # PlatformIO + ESP32
    ├── src/
    │   └── main.cpp          # Código principal
    ├── include/
    │   └── credentials.h     # WiFi e credenciais
    ├── lib/                  # Bibliotecas
    └── platformio.ini        # Configuração
```

## 🔐 Modelo de Dados

### Tabelas

```sql
-- Usuários
Usuarios (id, nome, email, password, tipo_usuario, createdAt)

-- Ambientes (Salas/Zonas)
Ambientes (id, nome, descricao, localizacao, temperatura_ideal, umidade_ideal)

-- Dispositivos ESP
Dispositivos (id, nome, tipo, topico_mqtt, mac_address, status, ultima_conexao)

-- Sensores
Sensores (id, nome, tipo, modelo, descricao, status, id_ambiente, id_dispositivo)

-- Leituras
Leituras (id, valor, tipo_leitura, unidade, timestamp, id_sensor)

-- Alertas
Alertas (id, descricao, status, nivel_severidade, id_sensor)

-- Níveis de Acesso
NiveisAcesso (id, nome, descricao, permissoes)
```

### Relacionamentos

```
Ambiente ─── (1:N) ─── Sensores
                         ├── Dispositivo
                         └── Leituras

Dispositivo ─── (1:N) ─── Sensores
                             └── Leituras
```

## 📡 Protocolo MQTT

### Tópico Padrão
```
ProjetoFinalIot
```

### Formato de Mensagem JSON
```json
{
  "Temp": 25.5,
  "Umidade": 60,
  "Potenciometro": 75
}
```

### Como Enviar do ESP
```cpp
// Criar JSON
DynamicJsonDocument doc(1024);
doc["Temp"] = temperatura;
doc["Umidade"] = umidade;
doc["Potenciometro"] = potenciometro;

// Serializar
char buffer[512];
serializeJson(doc, buffer);

// Publicar
client.publish("ProjetoFinalIot", buffer);
```

## 🛠️ Troubleshooting

### ❌ "Ambientes não aparecem no formulário"
**Solução**:
1. Verifique se há ambientes criados
2. Execute `npm run seed` no backend
3. Recarregue a página (F5)

### ❌ "MQTT não conecta"
**Solução**:
1. Verifique WiFi: `Serial.println(WiFi.localIP());`
2. Teste tópico MQTT: Use app como MQTT.fx
3. Verifique broker: `broker.hivemq.com` (padrão)

### ❌ "Sensores não recebem dados"
**Solução**:
1. Verifique se Dispositivo foi registrado
2. Tópico MQTT deve ser idêntico
3. Verifique status do Dispositivo (deve ser "ativo")
4. Veja logs: `npm run dev` no backend

### ❌ "Erro ao conectar servidor"
**Solução**:
1. Backend rodando? `http://localhost:3000/api/sensores`
2. Erro no terminal? Veja logs
3. Banco de dados? Execute `npm run seed`

### ❌ "Dados muito antigos ou não atualiza"
**Solução**:
1. Verifique data/hora do sistema
2. Atualize sensor: Editar > Salvar
3. Limpe browser cache (Ctrl+Shift+Del)

## 📊 API Endpoints

### Autenticação
- `POST /api/login` - Login
- `POST /api/register` - Registrar usuário
- `GET /api/auth/profile` - Dados do usuário

### Ambientes
- `GET /api/ambientes` - Listar
- `POST /api/ambientes` - Criar
- `PUT /api/ambientes/:id` - Editar
- `DELETE /api/ambientes/:id` - Deletar

### Dispositivos ESP
- `GET /api/dispositivos` - Listar
- `POST /api/dispositivos` - Criar
- `PUT /api/dispositivos/:id` - Editar
- `DELETE /api/dispositivos/:id` - Deletar

### Sensores
- `GET /api/sensores` - Listar
- `POST /api/sensores` - Criar
- `PUT /api/sensores/:id` - Editar
- `DELETE /api/sensores/:id` - Deletar

### Leituras
- `GET /api/leituras` - Listar todas
- `GET /api/leituras/:id` - Obter por ID
- `POST /api/leituras` - Criar
- `DELETE /api/leituras/:id` - Deletar

### Alertas
- `GET /api/alertas` - Listar
- `POST /api/alertas` - Criar
- `PUT /api/alertas/:id` - Editar
- `DELETE /api/alertas/:id` - Deletar

## 🎨 Tecnologias Utilizadas

### Backend
- **Node.js** + Express
- **SQLite** + Sequelize ORM
- **MQTT** (mqtt library)
- **JWT** (jsonwebtoken)
- **bcrypt** (senha segura)

### Frontend
- **React** 19.2.0
- **React Router** 7.9.6
- **Recharts** (gráficos)
- **React Toastify** (notificações)

### IoT
- **ESP32** (microcontrolador)
- **PlatformIO** (IDE/compilador)
- **PubSubClient** (MQTT)
- **WiFi** (conexão de rede)

## 📝 Licença

Este projeto é de código aberto e pode ser usado livremente.

## 🤝 Contribuindo

Sinta-se livre para fazer fork, enviar issues e pull requests!

## 👨‍💻 Autores

- Victor Schramm (Projeto original)

---

**Última atualização**: Dezembro 2024
