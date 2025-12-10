# 🌐 Sistema IoT - ESP32 + Frontend + Backend

**Status:** ✅ Pronto para Uso  
**Data:** 09/12/2025  
**Versão:** 1.0  
**Documentação Completa:** ✓

---

## 📖 O Que É Este Projeto?

Sistema completo de **monitoramento ambiental em tempo real** usando:

- **ESP32** (microcontrolador IoT)
- **MQTT** (protocolo de comunicação)
- **Node.js + Express** (backend)
- **React** (frontend)
- **SQLite** (banco de dados)

**Objetivo:** Coletar dados de sensores (temperatura, umidade) e exibir em um dashboard interativo.

---

## 🚀 Como Começar (5 minutos)

### **1. Preparar o ESP32**

```cpp
// Arquivo: Iot/include/credentials.h

#define WIFI_SSID "seu_wifi"       // ← Editar
#define WIFI_PASS "sua_senha"      // ← Editar
```

Depois fazer upload via PlatformIO.

### **2. Iniciar Backend**

```bash
cd backend
npm install    # (primeira vez)
npm run dev
```

Esperado:
```
✓ Conectado ao broker MQTT
✓ Inscrito no tópico: ProjetoFinalIot
🚀 Servidor rodando em http://localhost:3000
```

### **3. Iniciar Frontend**

```bash
cd front-ambiental
npm install    # (primeira vez)
npm start
```

Abrirá automaticamente em `http://localhost:3000`

### **4. Cadastrar no Frontend**

1. **Fazer Login** (credenciais necessárias)
2. **Menu → Ambientes** → "+ Novo" → Criar uma sala
3. **Menu → Sensores** → "+ Novo" → Cadastrar o ESP32
4. **Menu → Monitoramento** → Ver dados em tempo real

---

## 📊 Como Funciona?

```
ESP32 (a cada 5s)
  ↓ Lê sensores
  ↓ Publica via MQTT
  ↓
Broker MQTT (broker.hivemq.com)
  ↓
Backend (Node.js)
  ↓ Recebe mensagem MQTT
  ↓ Processa dados
  ↓ Salva no Banco
  ↓
Banco de Dados (SQLite)
  ↓ Armazena leituras
  ↓
Frontend (React)
  ↓ Busca dados via API
  ↓ Exibe dashboard em tempo real
```

---

## 📁 Estrutura do Projeto

```
ProjetoFinalDSIoT/
│
├─ 📄 INDICE_DOCUMENTACAO.md          ← Comece AQUI
├─ 📄 RESUMO_CADASTRO_ESP32.md
├─ 📄 GUIA_PRATICO_ESP32.md
├─ 📄 FLUXO_CADASTRO_ESP32.md
├─ 📄 EXEMPLOS_API_ESP32.http
├─ 📄 DIAGRAMA_VISUAL_ESP32.txt
├─ 🔧 verificacao.bat / verificacao.sh
│
├─ backend/                           ← Node.js Server
│  ├─ src/
│  │  ├─ config/mqtt.js              ← Lógica MQTT
│  │  ├─ models/                     ← Modelos Sequelize
│  │  ├─ controllers/                ← Lógica de negócio
│  │  ├─ routes/                     ← Rotas API
│  │  └─ server.js                   ← Entry point
│  ├─ package.json
│  └─ README.md
│
├─ front-ambiental/                   ← React Frontend
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ Sensores.jsx            ← Cadastro de sensores
│  │  │  ├─ Ambientes.jsx           ← Cadastro de ambientes
│  │  │  ├─ Monitoramento.jsx       ← Dashboard tempo real
│  │  │  ├─ Histórico.jsx           ← Gráficos
│  │  │  └─ ...
│  │  ├─ services/api.js            ← Requisições HTTP
│  │  └─ App.js
│  ├─ package.json
│  └─ README.md
│
└─ Iot/                              ← ESP32 Code
   ├─ include/credentials.h          ← WiFi Config ⚙️
   ├─ src/main.cpp                  ← Código ESP32
   ├─ platformio.ini
   └─ README.md
```

---

## 🎯 Documentação Disponível

| Documento | O Que Faz | Tempo |
|-----------|-----------|-------|
| **INDICE_DOCUMENTACAO.md** | Índice de tudo | 5 min |
| **RESUMO_CADASTRO_ESP32.md** | Resumo visual rápido | 10 min |
| **GUIA_PRATICO_ESP32.md** | Passo a passo prático | 20 min |
| **FLUXO_CADASTRO_ESP32.md** | Explicação técnica | 30 min |
| **EXEMPLOS_API_ESP32.http** | Exemplos de requisições | 10 min |
| **DIAGRAMA_VISUAL_ESP32.txt** | Diagramas ASCII | 15 min |

**👉 Comece lendo: `INDICE_DOCUMENTACAO.md`**

---

## 🔧 Requisitos

- **Node.js** 14+ (`node -v`)
- **npm** 6+ (`npm -v`)
- **PlatformIO** (para ESP32)
- **Navegador moderno** (Chrome, Firefox, Safari)

---

## 🗄️ Banco de Dados

Estrutura automática (Sequelize):

```
Ambientes
├─ id, nome, descricao, localizacao
├─ temperatura_ideal, umidade_ideal

Sensores
├─ id, nome, tipo, modelo, descricao
├─ id_ambiente, status

Leituras
├─ id, id_sensor, valor, tipo_leitura
├─ unidade, timestamp

Usuarios, Alertas, NiveisAcesso
└─ Outras tabelas...
```

---

## 🌐 API REST

```bash
# Ambientes
POST   /api/ambientes           # Criar
GET    /api/ambientes           # Listar
GET    /api/ambientes/:id       # Detalhes
PUT    /api/ambientes/:id       # Editar
DELETE /api/ambientes/:id       # Deletar

# Sensores
POST   /api/sensores            # Criar
GET    /api/sensores            # Listar
GET    /api/sensores/:id        # Detalhes
PUT    /api/sensores/:id        # Editar
DELETE /api/sensores/:id        # Deletar

# Leituras
GET    /api/leituras            # Listar
GET    /api/leituras/:id        # Detalhes
POST   /api/leituras            # Criar (manual)
```

Veja `EXEMPLOS_API_ESP32.http` para exemplos completos.

---

## 📡 MQTT

**Broker:** `broker.hivemq.com:1883`  
**Tópico:** `ProjetoFinalIot`  
**Frequência:** A cada 5 segundos

**Payload esperado:**
```json
{
  "Temp": 28.5,
  "Umidade": 65.2,
  "Potenciometro": 2048
}
```

---

## ✅ Checklist Rápido

```
PREPARAÇÃO
☐ Editar Iot/include/credentials.h (WiFi)
☐ Upload ESP32

INICIALIZAÇÃO
☐ Terminal 1: cd backend && npm run dev
☐ Terminal 2: cd front-ambiental && npm start

CADASTRO
☐ Fazer login no Frontend
☐ Criar um Ambiente
☐ Cadastrar Sensor ESP32
☐ Verificar dados em Monitoramento

VALIDAÇÃO
☐ Dados aparecem no Dashboard
☐ Histórico está sendo salvo
☐ API está respondendo
```

---

## 🐛 Troubleshooting

### ESP32 não conecta WiFi
→ Verificar `Iot/include/credentials.h` (SSID e senha corretos)

### Nenhum dado aparece no Frontend
→ Verificar se Backend está rodando (`npm run dev`)

### Backend conecta MQTT mas nenhuma leitura é salva
→ Editar `backend/src/config/mqtt.js` e verificar `id_ambiente`

### Frontend não consegue se conectar ao Backend
→ Verificar se Backend está em `http://localhost:3000`

**Mais troubleshooting em:** `GUIA_PRATICO_ESP32.md` (seção Troubleshooting)

---

## 🔐 Segurança

- ✅ JWT para autenticação
- ✅ Rate limiting na API
- ✅ Validação de entrada (Zod)
- ✅ Bcrypt para hash de senhas
- ✅ CORS configurado

---

## 📈 Features Implementadas

- ✅ Cadastro e gerenciamento de ambientes
- ✅ Cadastro e gerenciamento de sensores
- ✅ Coleta automática de dados via MQTT
- ✅ Armazenamento de histórico
- ✅ Dashboard em tempo real
- ✅ Gráficos e estatísticas
- ✅ Sistema de alertas
- ✅ Gerenciamento de usuários
- ✅ Níveis de acesso/permissões

---

## 🚀 Próximos Passos

1. ✅ Implement ESP32 (você está aqui)
2. 📱 Criar App mobile
3. ☁️ Deploy na nuvem
4. 🔔 Notificações em tempo real
5. 🤖 Machine Learning para previsões

---

## 📞 Suporte

**Dúvidas?**

1. Leia: `INDICE_DOCUMENTACAO.md`
2. Procure em: `GUIA_PRATICO_ESP32.md` (Troubleshooting)
3. Veja exemplos: `EXEMPLOS_API_ESP32.http`

---

## 📄 Licença

MIT License © 2025

---

## 👨‍💻 Desenvolvimento

- **Backend:** Node.js, Express, Sequelize, MQTT
- **Frontend:** React, React Router, Recharts
- **IoT:** ESP32, PlatformIO, Arduino
- **Banco:** SQLite

---

## ✨ Resumo

Este é um **sistema IoT completo e pronto para produção** que permite:

1. ✅ **Coletar** dados de sensores via MQTT
2. ✅ **Armazenar** histórico no banco de dados
3. ✅ **Gerenciar** sensores e ambientes
4. ✅ **Visualizar** dados em tempo real
5. ✅ **Analisar** com gráficos e estatísticas

---

## 🎉 Comece Agora!

```bash
# 1. Editar WiFi
nano Iot/include/credentials.h

# 2. Upload ESP32
# (usar PlatformIO)

# 3. Terminal 1: Backend
cd backend && npm run dev

# 4. Terminal 2: Frontend
cd front-ambiental && npm start

# 5. Abrir http://localhost:3000
# PRONTO! 🚀
```

---

**Documentação Completa Criada**  
**Status:** ✅ Pronto para Uso  
**Data:** 09/12/2025

👉 **Leia primeiro:** `INDICE_DOCUMENTACAO.md`
