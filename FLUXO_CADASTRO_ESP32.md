# Fluxo Completo: Cadastrar ESP32 e Registrar Leituras

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SISTEMA DE MONITORAMENTO IoT                    │
└─────────────────────────────────────────────────────────────────────────┘

ESP32 (Iot/)
├─ WiFi: Conecta à rede
├─ ADC: Lê potenciômetro
├─ MQTT: Publica dados em "ProjetoFinalIot"
└─ Dados: { Temp, Umidade, Potenciometro }
         ↓ (JSON via MQTT)

Broker MQTT: broker.hivemq.com
             ↓

Backend Node.js (backend/)
├─ Escuta tópico "ProjetoFinalIot"
├─ Recebe dados do ESP32
├─ Processa e salva no Banco de Dados
└─ Disponibiliza dados via API REST
             ↓

Banco de Dados SQLite
├─ Sensores (id, nome, tipo, modelo, id_ambiente)
├─ Leituras (id, id_sensor, valor, tipo_leitura, timestamp)
├─ Ambientes (id, nome, descricao, localizacao)
└─ Usuarios, Alertas, etc.
             ↓

Frontend React (front-ambiental/)
├─ Página Sensores: Cadastra/edita/deleta sensores
├─ Página Ambientes: Cria salas/ambientes
├─ Página Monitoramento: Visualiza leituras em tempo real
├─ Página Histórico: Gráficos e dados históricos
└─ Página Leituras: Lista todas as leituras
```

---

## 🔧 Processo Completo: Passo a Passo

### **ETAPA 1: Preparar o ESP32** (Pasta Iot/)

1. **Editar credenciais WiFi**
   - Arquivo: `Iot/include/credentials.h`
   - Adicionar seu SSID e senha WiFi

2. **Configuração MQTT (já está pronta)**
   - Broker: `broker.hivemq.com`
   - Tópico: `ProjetoFinalIot`
   - O ESP publica a cada 5 segundos

3. **Upload do código**
   - Usar PlatformIO para compilar e fazer upload

---

### **ETAPA 2: Criar um Ambiente (Sala)** no Frontend

**Página: Ambientes**

1. Clique em "+ Novo Ambiente"
2. Preencha:
   - **Nome**: ex: "Sala de Servidores"
   - **Descrição**: ex: "Monitoramento de temperatura"
   - **Localização**: ex: "Andar 2"
   - **Temperatura Ideal**: ex: 25°C
   - **Umidade Ideal**: ex: 60%
3. Clique em "Salvar"

**O que acontece:**
```
Frontend → POST /api/ambientes → Backend
         → Salva em "Ambientes" table
         → Retorna ID do ambiente (ex: id = 5)
```

---

### **ETAPA 3: Cadastrar o Sensor ESP32** no Frontend

**Página: Sensores**

1. Clique em "+ Novo Sensor"
2. Preencha:
   - **Nome**: `ESP32-Sala1`
   - **Tipo**: `temperatura_umidade` (ou outro)
   - **Modelo**: `ESP32-DEV`
   - **Descrição**: `Sensor ambiental IoT - Sala de Servidores`
   - **Ambiente**: Selecione o ambiente criado (ex: "Sala de Servidores")
   - **Status**: `ativo`
3. Clique em "Salvar"

**O que acontece:**
```
Frontend → POST /api/sensores → Backend
{
  "nome": "ESP32-Sala1",
  "tipo": "temperatura_umidade",
  "modelo": "ESP32-DEV",
  "descricao": "...",
  "id_ambiente": 5,
  "status": "ativo"
}
         → Salva em "Sensores" table
         → Retorna ID do sensor (ex: id = 10)
```

---

### **ETAPA 4: Backend Recebe Dados do ESP32** (Automático via MQTT)

**Fluxo MQTT (acontece automaticamente):**

1. **ESP32 envia dados**:
```json
{
  "Temp": 28.5,
  "Umidade": 65.2,
  "Potenciometro": 2048
}
```

2. **Backend recebe em `mqtt.js`**:
   - Inscreve no tópico `ProjetoFinalIot`
   - Recebe mensagem JSON
   - Processa em `processarLeitura(data)`

3. **Backend salva leituras no Banco**:
   - Se não existir sensor "ESP32_Principal", cria um
   - Salva 3 registros na tabela "Leituras":
     - Temperatura: 28.5°C
     - Umidade: 65.2%
     - Potenciômetro: 2048

4. **Banco de Dados (Leituras)**:
```
id | id_sensor | valor | tipo_leitura | timestamp
--- |-----------|-------|--------------|----------
1  | 10        | 28.5  | temperatura  | 2025-12-09...
2  | 10        | 65.2  | umidade      | 2025-12-09...
3  | 10        | 2048  | potenciometro| 2025-12-09...
```

---

### **ETAPA 5: Frontend Exibe as Leituras** (Tempo Real)

**Página: Monitoramento**
- Conecta via WebSocket ou polling ao Backend
- Busca `/api/leituras/sensor/:id`
- Exibe:
  - 🌡️ Temperatura em tempo real
  - 💧 Umidade em tempo real
  - 📊 Gráficos com dados históricos

**Página: Sensores**
- Mostra lista de sensores
- Cada sensor mostra:
  - Nome, tipo, modelo
  - Ambiente associado
  - Última leitura
  - Status (ativo/inativo/manutenção)

**Página: Histórico**
- Gráficos com dados do período
- Estatísticas (máximo, mínimo, média)

---

## 📱 Fluxo Simplificado

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Você cria um Ambiente no Frontend (sala/local)               │
│    ↓                                                             │
│ 2. Você cadastra o Sensor ESP32 no Frontend (associado à sala) │
│    ↓                                                             │
│ 3. Backend já está ouvindo tópico MQTT "ProjetoFinalIot"       │
│    ↓                                                             │
│ 4. ESP32 publica dados a cada 5 segundos                       │
│    ↓                                                             │
│ 5. Backend processa e salva cada leitura no Banco               │
│    ↓                                                             │
│ 6. Frontend busca leituras via API REST                         │
│    ↓                                                             │
│ 7. Você vê os dados em tempo real no Dashboard                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Configuração do ESP32

### **Arquivo: `Iot/include/credentials.h`**

```cpp
#ifndef CREDENTIALS_H
#define CREDENTIALS_H

#define WIFI_SSID "SEU_WIFI_AQUI"
#define WIFI_PASS "SUA_SENHA_AQUI"

#endif
```

### **Arquivo: `Iot/src/main.cpp`** (Resumido)

- Lê ADC no pino 32
- Converte para temperatura (0-4095 → 15-35°C)
- Converte para umidade (0-4095 → 0-100%)
- Envia JSON via MQTT a cada 5 segundos
- Broker: `broker.hivemq.com`
- Tópico: `ProjetoFinalIot`

---

## 📋 API Endpoints Utilizados

### **Ambientes**
```
POST   /api/ambientes          → Criar ambiente
GET    /api/ambientes          → Listar ambientes
GET    /api/ambientes/:id      → Detalhes do ambiente
PUT    /api/ambientes/:id      → Editar ambiente
DELETE /api/ambientes/:id      → Deletar ambiente
```

### **Sensores**
```
POST   /api/sensores           → Criar sensor
GET    /api/sensores           → Listar sensores
GET    /api/sensores/:id       → Detalhes do sensor
PUT    /api/sensores/:id       → Editar sensor
DELETE /api/sensores/:id       → Deletar sensor
```

### **Leituras**
```
GET    /api/leituras           → Listar todas as leituras
GET    /api/leituras/sensor/:id → Leituras de um sensor
POST   /api/leituras           → Criar leitura (manual)
```

---

## ✅ Checklist de Implementação

- [ ] 1. Editar `Iot/include/credentials.h` com WiFi
- [ ] 2. Upload do código ESP32 via PlatformIO
- [ ] 3. Iniciar Backend: `npm run dev` (na pasta backend/)
- [ ] 4. Iniciar Frontend: `npm start` (na pasta front-ambiental/)
- [ ] 5. Criar Ambiente no Frontend (Ambientes.jsx)
- [ ] 6. Cadastrar Sensor ESP32 no Frontend (Sensores.jsx)
- [ ] 7. Verificar dados em tempo real no Dashboard/Monitoramento
- [ ] 8. Visualizar histórico e gráficos

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| ESP32 não conecta WiFi | Verificar credenciais em `credentials.h` |
| Nenhuma leitura aparece | Verificar se Backend está rodando e ouvindo MQTT |
| Dashboard vazio | Aguardar 5-10 segundos para primeira leitura chegar |
| Banco não tem dados | Verificar conexão MQTT: `broker.hivemq.com:1883` |

---

**Criado em:** 09/12/2025
**Status:** Pronto para Implementação ✓
