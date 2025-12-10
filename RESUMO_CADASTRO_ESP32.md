## 📋 Resumo Final: Como Funciona o Cadastro e Registro do ESP32

### 🎯 Visão Geral em 60 Segundos

```
┌─────────────────────────────────────────────────────────────────┐
│  ESP32 Lê Sensores → Envia MQTT → Backend Salva → Frontend Exibe  │
└─────────────────────────────────────────────────────────────────┘
```

**Tempo:** ~5-10 segundos do ESP32 ao Frontend

---

## 🔄 Processo em 5 Etapas

### **Etapa 1: Preparar ESP32** (5 minutos)

```cpp
// Arquivo: Iot/include/credentials.h
#define WIFI_SSID "seu_wifi"
#define WIFI_PASS "sua_senha"
```

✅ Upload via PlatformIO  
✅ Verificar conexão no Serial Monitor

---

### **Etapa 2: Iniciar Backend** (2 minutos)

```bash
cd backend
npm run dev
```

✅ Esperar: `✓ Inscrito no tópico: ProjetoFinalIot`

---

### **Etapa 3: Iniciar Frontend** (2 minutos)

```bash
cd front-ambiental
npm start
```

✅ Abre em `http://localhost:3000`

---

### **Etapa 4: Criar Ambiente no Frontend** (2 minutos)

**Menu → Ambientes → "+ Novo"**

```
Nome:               "Sala de Servidores"
Localização:        "Andar 2"
Temperatura Ideal:  25°C
Umidade Ideal:      60%
```

✅ Clique "Salvar"

---

### **Etapa 5: Cadastrar Sensor ESP32** (2 minutos)

**Menu → Sensores → "+ Novo"**

```
Nome:        "ESP32-Sala1"
Tipo:        "temperatura_umidade"
Modelo:      "ESP32-DEV"
Ambiente:    "Sala de Servidores" (que você criou)
Status:      "ativo"
```

✅ Clique "Salvar"

---

## 📊 Fluxo de Dados Automático

```
╔═══════════════════════════════════════════════════════════════╗
║                    FLUXO AUTOMÁTICO CONTÍNUO                  ║
╚═══════════════════════════════════════════════════════════════╝

⏱️  A CADA 5 SEGUNDOS:

1. ESP32 Lê ADC
   └─ Pino 32: 0-4095
   └─ Converte para Temp: 15-35°C
   └─ Converte para Umidade: 0-100%

2. ESP32 Publica MQTT
   ├─ Broker: broker.hivemq.com
   ├─ Tópico: ProjetoFinalIot
   └─ Payload: {"Temp": 28.5, "Umidade": 65.2}

3. Backend Recebe (mqtt.js)
   ├─ Ouve tópico ProjetoFinalIot
   └─ Processa mensagem JSON

4. Backend Salva no Banco (processarLeitura())
   ├─ Temperatura: 28.5°C
   ├─ Umidade: 65.2%
   └─ Timestamp: agora

5. Frontend Busca Dados (api.js)
   ├─ GET /api/leituras/sensor/:id
   └─ Polling a cada 5-10 segundos

6. Frontend Exibe Dashboard
   ├─ 🌡️ Temperatura: 28.5°C
   ├─ 💧 Umidade: 65.2%
   ├─ 📊 Gráficos históricos
   └─ ⏰ Última atualização: Agora
```

---

## 🗄️ Banco de Dados

### **Estrutura**

```
┌─────────────────────┐
│   Ambientes         │ ← Salas (Sala de Servidores)
├─────────────────────┤
│ id, nome, local     │
└──────────┬──────────┘
           │ (1:N)
           ↓
┌─────────────────────┐
│   Sensores          │ ← Dispositivos (ESP32-Sala1)
├─────────────────────┤
│ id, nome, tipo      │
│ id_ambiente         │
└──────────┬──────────┘
           │ (1:N)
           ↓
┌─────────────────────┐
│   Leituras          │ ← Dados (Temperatura, Umidade)
├─────────────────────┤
│ id, valor, tipo     │
│ id_sensor, timestamp│
└─────────────────────┘
```

### **Exemplo de Dados Salvos**

```sql
-- Ambiente criado
INSERT INTO Ambientes (nome, descricao, localizacao, temperatura_ideal, umidade_ideal)
VALUES ('Sala de Servidores', '...', 'Andar 2', 25, 60);
-- ID: 1

-- Sensor cadastrado
INSERT INTO Sensores (nome, tipo, modelo, descricao, id_ambiente, status)
VALUES ('ESP32-Sala1', 'temperatura_umidade', 'ESP32-DEV', '...', 1, 'ativo');
-- ID: 5

-- Leituras salvas automaticamente
INSERT INTO Leituras (id_sensor, valor, tipo_leitura, unidade, timestamp)
VALUES 
  (5, 28.5, 'temperatura', '°C', NOW()),
  (5, 65.2, 'umidade', '%', NOW()),
  (5, 2048, 'potenciometro', NULL, NOW());
-- IDs: 1, 2, 3
```

---

## 🌐 API REST Endpoints

### **Criar e Listar**

```bash
POST   /api/ambientes           # Criar ambiente
GET    /api/ambientes           # Listar ambientes
POST   /api/sensores            # Cadastrar sensor
GET    /api/sensores            # Listar sensores
GET    /api/leituras            # Listar leituras
```

### **Por ID**

```bash
GET    /api/sensores/:id        # Detalhes do sensor
PUT    /api/sensores/:id        # Editar sensor
DELETE /api/sensores/:id        # Deletar sensor
```

### **Filtros**

```bash
GET /api/leituras?id_sensor=5        # Leituras de um sensor
GET /api/leituras?tipo=temperatura   # Leituras de um tipo
```

---

## ✅ Checklist de Implementação

```
┌─ PREPARAÇÃO
├─ [ ] 1. Editar Iot/include/credentials.h (WiFi)
├─ [ ] 2. Upload ESP32 (PlatformIO)
└─ [ ] 3. Verificar Serial Monitor: IP e MQTT conectado

┌─ INICIALIZAÇÃO
├─ [ ] 4. Iniciar Backend (npm run dev)
├─ [ ] 5. Verificar: ✓ Inscrito no tópico ProjetoFinalIot
└─ [ ] 6. Iniciar Frontend (npm start)

┌─ CADASTRO
├─ [ ] 7. Fazer login no Frontend
├─ [ ] 8. Criar um Ambiente (Menu → Ambientes)
└─ [ ] 9. Cadastrar Sensor ESP32 (Menu → Sensores)

┌─ VERIFICAÇÃO
├─ [ ] 10. Abrir Menu → Monitoramento
├─ [ ] 11. Verificar dados em tempo real
└─ [ ] 12. Visualizar histórico (Menu → Histórico)
```

---

## 🐛 Troubleshooting Rápido

| Problema | Causa | Solução |
|----------|-------|---------|
| ESP32 não conecta WiFi | Credenciais erradas | Editar `credentials.h` |
| Nenhum dado aparece | Backend não rodando | `npm run dev` no backend |
| Backend não recebe MQTT | Tópico incorreto | Usar `ProjetoFinalIot` |
| Frontend não atualiza | Sensor não cadastrado | Cadastrar em Sensores.jsx |
| Leituras antigas aparecem | Banco com dados antigos | Normal, histórico é preservado |

---

## 💡 Dicas Importantes

1. **Primeira leitura:** Leva 5-10 segundos para aparecer
2. **WiFi cai:** ESP32 reconecta automaticamente
3. **Múltiplos ESP32:** Crie um sensor para cada um
4. **Alertas:** Configure em Menu → Alertas
5. **Exportar dados:** Use `/api/leituras` para extrair

---

## 📝 Arquivos Principais

```
backend/
├─ src/config/mqtt.js          ← Lógica MQTT (processarLeitura)
├─ src/models/Leitura.js       ← Modelo de leituras
├─ src/models/Sensor.js        ← Modelo de sensores
└─ src/controllers/            ← APIs REST

front-ambiental/
├─ src/pages/Sensores.jsx      ← Cadastro de sensores
├─ src/pages/Ambientes.jsx     ← Cadastro de ambientes
├─ src/pages/Monitoramento.jsx ← Visualização em tempo real
└─ src/services/api.js         ← Requisições ao backend

Iot/
├─ include/credentials.h       ← WiFi SSID/Password
└─ src/main.cpp                ← Código ESP32
```

---

## 🎬 Exemplo Prático Completo

### **Cenário: Monitorar Sala de Servidores**

```
1️⃣  Editar credentials.h:
    WIFI_SSID = "WiFi_da_Empresa"
    WIFI_PASS = "senha123"

2️⃣  Fazer upload do ESP32

3️⃣  Abrir Frontend e fazer login

4️⃣  Criar Ambiente:
    Nome: "Sala de Servidores"
    Local: "Prédio A - Andar 2"
    Temp Ideal: 25°C
    Umidade Ideal: 60%

5️⃣  Cadastrar Sensor:
    Nome: "ESP32-Servidor1"
    Tipo: "temperatura_umidade"
    Modelo: "ESP32-DEV"
    Ambiente: "Sala de Servidores"

6️⃣  Verificar Dashboard:
    🌡️ Temperatura: 28.5°C
    💧 Umidade: 65.2%

7️⃣  Visualizar histórico de 24 horas
```

---

**Status:** ✅ Pronto para implementação

**Documentos de Referência:**
- `FLUXO_CADASTRO_ESP32.md` - Fluxo detalhado
- `GUIA_PRATICO_ESP32.md` - Guia passo a passo
- `EXEMPLOS_API_ESP32.http` - Exemplos de requisições

**Criado em:** 09/12/2025  
**Versão:** 1.0
