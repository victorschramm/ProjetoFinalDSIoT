# Adaptação do ESP32 - Mudanças Realizadas

## 📋 Resumo das Alterações no `main.cpp`

### 🔄 Broker MQTT
| Antes | Depois |
|-------|--------|
| `broker.hivemq.com` (porta 1883) | `c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud` (porta 8883) |
| Sem autenticação | `admin` / `Admin123` |
| Cliente WiFi comum | WiFiClientSecure (TLS) |

### 📌 Tópico
| Antes | Depois |
|-------|--------|
| `ProjetoFinalIot` | `manutai/leitura` |

### ⏱️ Intervalo de Leitura
| Antes | Depois |
|-------|--------|
| 120 segundos (2 min) | 10 segundos |

### 🕐 Timestamp
| Antes | Depois |
|-------|--------|
| `"2024-01-15 10:30:45"` | `"2024-01-15T10:30:45Z"` (ISO-8601 UTC) |

### 🏷️ Payload JSON
**Antes:**
```json
{
  "id_sensor": 1,
  "valor": 25.5,
  "tipo_leitura": "temperatura",
  "unidade": "Celsius",
  "timestamp": "2024-01-15 10:30:45"
}
```

**Depois:**
```json
{
  "id_sensor": 1,
  "valor": 25.5,
  "tipo_leitura": "temperatura",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

## ✨ Melhorias Implementadas

✅ **TLS/SSL**: Conexão segura com HiveMQ Cloud (porta 8883)
✅ **Autenticação**: Credenciais de acesso (admin/Admin123)
✅ **ISO-8601**: Timestamp em formato universal (UTC)
✅ **Logs Melhorados**: Emojis e mensagens mais claras
✅ **Tratamento de Erros**: Melhor feedback no Serial Monitor
✅ **Reconexão Robusta**: Até 5 tentativas de reconexão MQTT

## 📝 Código Mantém

- ✅ Estrutura geral (setup, loop, funções)
- ✅ DHT11 no GPIO 4
- ✅ NTP para sincronização de hora
- ✅ ID do sensor configurável (`SENSOR_ID = 1`)
- ✅ Arquivo de credenciais WiFi (`credentials.h`)

## 🚀 Como Compilar e Upload

### 1. Editar Credenciais WiFi
```cpp
// File: Iot/include/credentials.h
#define WIFI_SSID "SEU_WIFI_AQUI"
#define WIFI_PASS "SUA_SENHA_AQUI"
```

### 2. PlatformIO (via VS Code)
```bash
cd Iot
pio run --target upload
```

Ou via Arduino IDE:
1. Tools → Board → ESP32 → ESP32 Dev Module
2. Tools → Port → COM3 (ou sua porta)
3. Upload

### 3. Monitorar Serial Monitor
```
Baud Rate: 115200
```

## 📊 Serial Monitor Esperado

```
╔════════════════════════════════════╗
║ ESP32 - DHT11 - MQTT Publisher    ║
║ ManutAI IoT System                ║
╚════════════════════════════════════╝

✓ DHT11 inicializado no GPIO 4

[WiFi] Conectando...
SSID: SENAI_ACADEMICO
.....
✅ WiFi conectado!
IP: 192.168.1.100

[NTP] Sincronizando horário...
✅ Horário sincronizado!

[MQTT] Tentando conectar a c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud:8883
✅ MQTT conectado!

---
📊 Temperatura: 25.50°C
📊 Umidade: 60.00%
📤 Temperatura publicada!
📤 Umidade publicada!
---
```

## ✅ Validação no Backend

### Logs do Node.js (esperado)
```
✓ Conectado ao broker MQTT: mqtts://c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud:8883
✓ Inscrito no tópico: manutai/leitura

📨 Mensagem recebida em manutai/leitura: {"id_sensor":1,"valor":25.5,"tipo_leitura":"temperatura",...}
💾 TEMPERATURA salva: 25.5°C (sensor 1)

📨 Mensagem recebida em manutai/leitura: {"id_sensor":1,"valor":60.0,"tipo_leitura":"umidade",...}
💾 UMIDADE salva: 60.0% (sensor 1)
```

### Verificar no Database
```sql
SELECT id, id_sensor, valor, tipo_leitura, unidade, timestamp
FROM Leituras
WHERE id_sensor = 1
ORDER BY timestamp DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### DHT11 não responde
- Verificar fiação: VCC (3.3V), GND, DATA (GPIO 4)
- Resistor 4.7kΩ pull-up entre DATA e 3.3V
- Testar com código original de teste DHT11

### WiFi não conecta
- Verificar `credentials.h`: SSID e senha corretos
- Verificar sinal WiFi no local
- Ressetar ESP32 (botão RESET)

### MQTT não conecta
- Verificar Internet (ping)
- Verificar porta 8883 aberta (porta TLS)
- Verificar credenciais: `admin` / `Admin123`
- Testar com MQTT Explorer

### Timestamps "1970-01-01"
- NTP não sincronizou
- Verificar conexão WiFi
- Aguardar mais tempo na primeira inicialização

## 📂 Arquivos Relacionados

```
Iot/
├── src/main.cpp                  ← ✅ ADAPTADO (MQTT HiveMQ Cloud)
├── include/credentials.h         ← Credenciais WiFi
├── platformio.ini                ← Configuração PlatformIO
└── README_ADAPTACAO.md           ← Este arquivo
```

## 🔔 Importante

⚠️ **Segurança**: O arquivo `credentials.h` contém suas credenciais WiFi.
- **Nunca** commite com credenciais reais no GitHub
- Use `.gitignore` para excluir `credentials.h` do controle de versão

⚠️ **setInsecure()**: No código uso `espClient.setInsecure()` para testes.
- Para **produção**: Implementar certificados SSL/TLS

---

**Tudo pronto! O código está integrado com o novo sistema ManutAI.** 🚀
