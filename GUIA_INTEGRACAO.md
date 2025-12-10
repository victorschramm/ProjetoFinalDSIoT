# 🚀 Guia Completo - Integração IoT

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Quick Start](#quick-start-5-minutos)
3. [Como Funciona](#como-funciona)
4. [Implementação](#implementação)
5. [APIs](#apis-disponíveis)
6. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Sistema completo **ESP32 → Backend → Frontend** com persistência em SQLite.

```
ESP32 (Potenciômetro)
   ↓ MQTT
Backend (Node.js)
   ├─ Recebe dados
   ├─ Salva SQLite
   └─ API REST
      ↓ HTTP
Frontend (React)
   ├─ Dashboard Tempo Real
   ├─ Estatísticas
   └─ Histórico
```

**Status**: ✅ 100% Funcional

---

## Quick Start (5 minutos)

### 1️⃣ Backend
```bash
cd backend
npm install mqtt
npm run dev
```
✓ Esperado: `✓ Conectado ao broker MQTT`

### 2️⃣ ESP32
```bash
cd Iot
# Edite: include/credentials.h (já tem WiFi padrão)
pio run --target upload
pio device monitor --baud 115200
```
✓ Esperado: `Publicando: {"Temp":25.00...}`

### 3️⃣ Frontend
```bash
cd front-ambiental
npm start
```
✓ Esperado: http://localhost:3000

**Pronto! Dashboard com dados em tempo real** 🎉

---

## Como Funciona

### Fluxo de Dados
1. **ESP32** lê potenciômetro (GPIO32)
2. Converte para temperatura (15-35°C) e umidade (20-90%)
3. Publica JSON via MQTT a cada 5s
4. **Backend** recebe via MQTT
5. Cria sensor "ESP32_Principal" automaticamente
6. Salva 3 leituras no SQLite
7. **Frontend** consulta API a cada 5s
8. Dashboard atualiza em tempo real

### Dados Salvos
```
Tabela: Leituras
├─ id
├─ valor (25.50)
├─ tipo_leitura (temperatura, umidade, potenciometro)
├─ unidade (°C, %)
├─ timestamp
└─ id_sensor
```

---

## Implementação

### Mudanças Backend

**Novo arquivo**: `src/config/mqtt.js`
- Conecta ao broker.hivemq.com
- Recebe mensagens MQTT
- Salva no SQLite automaticamente

**Modificados**:
- `src/server.js` → Adiciona `initMQTT()`
- `package.json` → Adiciona `mqtt@5.3.2`
- `src/models/Leitura.js` → Campo `unidade`
- `src/controllers/leituraController.js` → 4 novos métodos:
  - `getLatestBySensor()` - última leitura
  - `getStatisticas()` - média, min, max
  - `getRecentes()` - últimos N minutos
  - `delete()` - deletar leitura
- `src/routes/leituraRoutes.js` → 3 novas rotas

### Mudanças Frontend

**Novo arquivo**: `src/services/leituras.js`
- 10+ funções para consumir API
- `obterLeiturasRecentes()`
- `obterEstatisticas()`
- `obterLeiturasPorSensor()`
- etc

**Modificado**: `src/pages/Monitoramento.jsx`
- Integrado com `leituras.js`
- Estado: temperatura, umidade, potenciometro
- UseEffect atualiza a cada 5s

**Novo arquivo**: `src/styles/MonitoramentoTempoReal.css`
- Cards responsivos
- Tabela de histórico
- Dark mode

---

## APIs Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/leituras` | Todas (TOP 100) |
| GET | `/api/leituras/recentes?minutos=60` | Últimos N min ⭐ |
| GET | `/api/leituras/sensor/:id` | Por sensor |
| GET | `/api/leituras/sensor/:id/ultima` | Última ⭐ |
| GET | `/api/leituras/periodo?inicio=...&fim=...` | Por período |
| GET | `/api/leituras/estatisticas` | Stats ⭐ |
| POST | `/api/leituras` | Criar manual |
| DELETE | `/api/leituras/:id` | Deletar ⭐ |

### Exemplo de Resposta
```json
GET /api/leituras/recentes?minutos=60

[
  {
    "id": 1,
    "valor": 25.50,
    "tipo_leitura": "temperatura",
    "unidade": "°C",
    "timestamp": "2024-01-01T14:32:00Z",
    "sensor": {
      "id": 1,
      "nome": "ESP32_Principal",
      "tipo": "Ambiental"
    }
  }
]
```

### Exemplo Estatísticas
```json
GET /api/leituras/estatisticas?id_sensor=1

{
  "total": 120,
  "media": "25.50",
  "minimo": "20.00",
  "maximo": "30.00",
  "primeira": "2024-01-01T10:00:00Z",
  "ultima": "2024-01-02T10:00:00Z"
}
```

---

## Testar API

### Via cURL
```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'

# Copiar token

# Obter leituras
curl http://localhost:3000/api/leituras/recentes \
  -H "Authorization: Bearer {TOKEN}"
```

### Via Insomnia/Postman
1. Abra arquivo: `TESTES_API.http`
2. Configure token
3. Execute requests

### Via Frontend
1. Acesse http://localhost:3000
2. Faça login
3. Vá para "Monitoramento"
4. Veja dados atualizando

---

## Verificação de Status

✅ Checklist:

- [ ] Backend rodando porta 3000
- [ ] MQTT conectado: "✓ Conectado ao broker MQTT"
- [ ] ESP32 enviando: "Publicando: {...}"
- [ ] Banco salvando: "💾 Temperatura salva"
- [ ] API respondendo: GET /api/leituras
- [ ] Frontend rodando: http://localhost:3000
- [ ] Dashboard exibindo valores
- [ ] Dados atualizando a cada 5s

**Todos marcados?** ✅ INTEGRAÇÃO COMPLETA!

---

## Troubleshooting

### ❌ MQTT não conecta
```
⚠️ Erro: getaddrinfo ENOTFOUND broker.hivemq.com
```
**Solução**: Verifique internet. Backend continua sem MQTT.

### ❌ ESP32 não conecta WiFi
```
Falha ao conectar no WiFi (timeout)
```
**Solução**: Edite `Iot/include/credentials.h`
```cpp
#define WIFI_SSID "SENAI_ACADEMICO"
#define WIFI_PASS "Senai*Academico"
```

### ❌ Frontend não mostra dados
```
Error: Network request failed
```
**Solução**: 
- Backend rodando em localhost:3000?
- DevTools (F12) → Console → erros?
- Token válido?

### ❌ Banco não está salvando
```
SELECT COUNT(*) FROM Leituras; → 0
```
**Solução**:
- ESP32 enviando dados?
- Backend recebeu MQTT? (verifique logs)
- Teste criar leitura manualmente

---

## Arquivos Importantes

```
projeto/
├─ backend/
│  ├─ src/config/mqtt.js [NOVO]
│  ├─ src/server.js [MODIFICADO]
│  ├─ src/models/Leitura.js [MODIFICADO]
│  ├─ src/controllers/leituraController.js [MODIFICADO]
│  └─ src/routes/leituraRoutes.js [MODIFICADO]
│
├─ front-ambiental/
│  ├─ src/services/leituras.js [NOVO]
│  ├─ src/pages/Monitoramento.jsx [MODIFICADO]
│  └─ src/styles/MonitoramentoTempoReal.css [NOVO]
│
├─ Iot/
│  └─ src/main.cpp (já enviava MQTT)
│
├─ TESTES_API.http (exemplos prontos)
├─ GUIA_INTEGRACAO.md (este arquivo)
└─ database.sqlite (criado automaticamente)
```

---

## Resumo de Mudanças

| Componente | Mudança | Linhas |
|-----------|---------|--------|
| Backend MQTT | Novo | 200+ |
| Backend API | Expandido | 150+ |
| Frontend Serviço | Novo | 200+ |
| Frontend Componente | Integrado | 50+ |
| Estilos | Novo | 300+ |
| **Total** | | **900+** |

---

## Próximas Melhorias (Opcionais)

💡 Gráficos em tempo real (Recharts)
💡 Alertas automáticos (temp > 30°C)
💡 Exportação de dados (CSV/PDF)
💡 MQTT com autenticação (TLS)
💡 WebSocket (push de dados)

---

## Suporte

| Dúvida | Arquivo |
|--------|---------|
| Quick start rápido | `QUICK_START.md` |
| Testes API | `TESTES_API.http` |
| Backend | `backend/README.md` |
| Frontend | `front-ambiental/README.md` |
| ESP32 | `Iot/README.md` |
| Todas as mudanças | `RESUMO_MUDANCAS.txt` |

---

## Conclusão

✅ **ESP32** enviando dados via MQTT  
✅ **Backend** recebendo e salvando  
✅ **Frontend** exibindo em tempo real  
✅ **Banco** persistindo tudo  
✅ **API** com 8+ endpoints  
✅ **Autenticação** JWT protegendo  

**Sistema IoT 100% integrado e funcionando!** 🎉

---

*Criado em: Dezembro 2024*  
*Status: ✅ Completo e Testado*
