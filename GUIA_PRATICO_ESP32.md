# 🚀 Guia Prático: Cadastro do ESP32 no Frontend

## Resumo Rápido

O sistema funciona assim:

1. **ESP32** → Lê sensores → Envia via MQTT
2. **Backend** → Ouve MQTT → Salva no banco
3. **Frontend** → Exibe dados do banco

---

## 🎯 Passo a Passo Completo

### **Passo 1: Preparar o ESP32**

#### A. Editar Credenciais WiFi

Abra: `Iot/include/credentials.h`

```cpp
#ifndef CREDENTIALS_H
#define CREDENTIALS_H

#define WIFI_SSID "seu_wifi"        // ← Seu WiFi
#define WIFI_PASS "sua_senha"       // ← Sua senha

#endif
```

#### B. Fazer Upload

1. Abrir VSCode com PlatformIO
2. Conectar ESP32 via USB
3. Clique em "Upload" ou `Ctrl+Shift+U`
4. Monitor Serial para verificar:
   ```
   Conectando em WiFi: seu_wifi
   IP: 192.168.1.100
   Conectado ao MQTT
   ```

---

### **Passo 2: Iniciar Backend**

```bash
cd backend
npm install    # (se não tiver feito)
npm run dev
```

**Esperado:**
```
✓ Conectado ao broker MQTT: mqtt://broker.hivemq.com
✓ Inscrito no tópico: ProjetoFinalIot
🚀 Servidor rodando em http://localhost:3000
```

---

### **Passo 3: Iniciar Frontend**

```bash
cd front-ambiental
npm install    # (se não tiver feito)
npm start
```

**Abre em:** `http://localhost:3000` automaticamente

---

### **Passo 4: Login no Frontend**

1. Faça login com credenciais existentes
   - Email: (criar usuário primeiro se necessário)
   - Senha: (sua senha)

---

### **Passo 5: Criar um Ambiente (Sala)**

**Navegue até:** Menu → Ambientes

#### Clique em "+ Novo Ambiente"

```
Nome:                "Sala de Servidores"
Descrição:           "Monitoramento ambiental"
Localização:         "Andar 2 - Sala 201"
Temperatura Ideal:   25
Umidade Ideal:       60
```

**Clique em "Salvar"**

✅ Ambiente criado com sucesso!

---

### **Passo 6: Cadastrar o Sensor ESP32**

**Navegue até:** Menu → Sensores

#### Clique em "+ Novo Sensor"

```
Nome:        "ESP32-Sala1"
Tipo:        "temperatura_umidade"
Modelo:      "ESP32-DEV"
Descrição:   "Sensor IoT para monitoramento ambiental"
Ambiente:    "Sala de Servidores" (aquele que você criou)
Status:      "ativo"
```

**Clique em "Salvar"**

✅ Sensor cadastrado com sucesso!

---

### **Passo 7: Verificar se Dados Estão Chegando**

**Navegue até:** Menu → Monitoramento (ou Dashboard)

#### Você deve ver:

```
╔════════════════════════════════════════════╗
║   ESP32-Sala1  [Ativo]                     ║
╠════════════════════════════════════════════╣
║ 🌡️  Temperatura:   28.5°C                 ║
║ 💧 Umidade:       65.2%                   ║
║ 📡 Última atualização: Agora               ║
╚════════════════════════════════════════════╝
```

Se não aparecer em 30 segundos:

1. Verifique se **Backend está rodando**
2. Verifique se **ESP32 está conectado** (Serial Monitor)
3. Aguarde 5-10 segundos (primeira leitura leva tempo)

---

## 📊 Visualizar Histórico de Leituras

**Navegue até:** Menu → Histórico ou Leituras

Você verá:

```
Temperatura (últimas 24h)
┌─────────────────────────────────────┐
│   ╱                                  │
│  ╱  ╲                                │
│ ╱    ╲ ╱ ╲                           │
└─────────────────────────────────────┘
  00h  06h  12h  18h  24h

Estatísticas:
- Máximo: 32.5°C
- Mínimo: 24.1°C
- Média: 28.3°C
```

---

## 🔧 Solução de Problemas

### **Problema: "Nenhum dado aparece no Frontend"**

**Checklist:**

- [ ] ESP32 está conectado ao WiFi? (Verificar Serial Monitor)
- [ ] Backend está rodando? (`npm run dev` no terminal)
- [ ] Sensor foi cadastrado no Frontend?
- [ ] Ambiente foi criado e associado ao sensor?

**Solução:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd front-ambiental && npm start

# Terminal 3: Monitor Serial do ESP32
# Abrir em VSCode com PlatformIO
# Clique em "Serial Monitor"
```

---

### **Problema: "Backend conecta MQTT, mas nenhuma leitura é salva"**

**Causa:** Sensor com ID incorreto no `mqtt.js`

**Solução:** Editar `backend/src/config/mqtt.js`

Procure por:
```javascript
id_ambiente: 1 // Assumindo ambiente padrão
```

Mude para o ID do ambiente que você criou:
```javascript
id_ambiente: 5 // Seu ID do ambiente
```

---

### **Problema: "ESP32 não conecta WiFi"**

**Verificar:**

1. SSID está correto em `Iot/include/credentials.h`?
2. Senha está correta?
3. WiFi não tem caracteres especiais?
4. Está próximo do roteador?

**Solução:**
```cpp
// Editar: Iot/include/credentials.h

#define WIFI_SSID "seu_wifi_exato"
#define WIFI_PASS "sua_senha_exata"
```

Recompile e faça upload.

---

## 📈 Fluxo de Dados Esperado

```
⏰ Tempo: 0s
ESP32: Lê sensores
ESP32: Publica via MQTT "ProjetoFinalIot"
Payload: {"Temp": 28.5, "Umidade": 65.2, "Potenciometro": 2048}

⏰ Tempo: 0.1s
Backend: Recebe mensagem MQTT
Backend: Processa dados
Backend: Salva 3 registros no banco (Temp, Umidade, Potenciômetro)

⏰ Tempo: 1-5s
Frontend: Faz polling para /api/leituras/sensor/:id
Frontend: Recebe dados JSON
Frontend: Renderiza gráficos e números

⏰ Tempo: 5s (repete)
ESP32: Próxima leitura
...
```

---

## 🎨 Estrutura do Banco de Dados

### **Ambientes** (Salas/Locais)

```
┌─────────────────────────────────────────────┐
│ id │ nome                │ temperatura_ideal │
├────┼──────────────────────┼──────────────────┤
│ 1  │ Sala de Servidores  │ 25                │
│ 2  │ Laboratório         │ 22                │
└─────────────────────────────────────────────┘
```

### **Sensores** (Dispositivos IoT)

```
┌──────────────────────────────────────────────────────┐
│ id │ nome        │ tipo                 │ id_ambiente │
├────┼─────────────┼──────────────────────┼─────────────┤
│ 1  │ ESP32-Sala1 │ temperatura_umidade  │ 1           │
│ 2  │ ESP32-Lab   │ temperatura_umidade  │ 2           │
└──────────────────────────────────────────────────────┘
```

### **Leituras** (Dados Coletados)

```
┌──────────────────────────────────────────────────────┐
│ id │ id_sensor │ tipo_leitura   │ valor │ timestamp  │
├────┼───────────┼────────────────┼───────┼────────────┤
│ 1  │ 1         │ temperatura    │ 28.5  │ 2025-12... │
│ 2  │ 1         │ umidade        │ 65.2  │ 2025-12... │
│ 3  │ 1         │ potenciometro  │ 2048  │ 2025-12... │
└──────────────────────────────────────────────────────┘
```

---

## ✨ Features Disponíveis no Frontend

| Feature | Página | O que faz |
|---------|--------|-----------|
| **Dashboard** | Dashboard | Visão geral de todos os sensores |
| **Criar Ambiente** | Ambientes | Define salas/locais |
| **Cadastrar Sensor** | Sensores | Registra dispositivos IoT |
| **Monitoramento** | Monitoramento | Visualiza dados em tempo real |
| **Histórico** | Histórico | Gráficos e estatísticas |
| **Alertas** | Alertas | Define limites de temperatura/umidade |
| **Relatórios** | Leituras | Tabela de todas as leituras |

---

## 📞 Suporte Rápido

**Q: Por quanto tempo os dados são armazenados?**
- A: Indefinidamente no banco SQLite (até deletar manualmente)

**Q: Posso ter múltiplos ESP32?**
- A: Sim! Cada um com seu sensor e tópico MQTT

**Q: E se o WiFi cair?**
- A: ESP32 reconecta automaticamente a cada 5 segundos

**Q: Posso exportar os dados?**
- A: Sim! Use a API `/api/leituras` ou PostgreSQL

**Q: Qual é a resolução do ADC do ESP32?**
- A: 12 bits (0-4095 valores)

---

**Pronto para usar!** 🎉

Se tiver dúvidas, verifique o arquivo `FLUXO_CADASTRO_ESP32.md` para mais detalhes.
