# ESP32 + DHT11 - Guia de Setup

## 📋 Esquema de Montagem do DHT11

```
DHT11 (3 pinos)
├─ VCC (Pino 1) ───────→ 3.3V (ESP32)
├─ DATA (Pino 2) ──────→ GPIO 4 (ESP32) + Resistor 4.7kΩ para VCC
└─ GND (Pino 3) ────────→ GND (ESP32)

Resistor pull-up:
- DHT11 DATA ───[4.7kΩ]───→ 3.3V

GPIO 4 é definido como DHT_PIN no código
```

## 🔌 Pinagem ESP32

| DHT11 | ESP32 | Descrição |
|-------|-------|-----------|
| VCC (1) | 3V3 | Alimentação positiva |
| DATA (2) | GPIO 4 | Sinal de dados (com resistor pull-up) |
| GND (3) | GND | Terra |

## 📦 Bibliotecas Necessárias

Instalar via Arduino IDE:

1. **Para DHT11**: `DHT sensor library` (por Adafruit)
   - Sketch → Include Library → Manage Libraries
   - Buscar: "DHT"
   - Instalar: "DHT sensor library by Adafruit"

2. **Para JSON**: `ArduinoJson` (por Benoit Blanchon)
   - Buscar: "ArduinoJson"
   - Instalar: "ArduinoJson by Benoit Blanchon"

3. **Bibliotecas já incluídas no ESP32 Core**:
   - WiFi.h
   - PubSubClient.h (MQTT)

## ⚙️ Configurações IMPORTANTES

### 1. WiFi (Editar no código)
```cpp
const char* WIFI_SSID = "SEU_SSID_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";
```

### 2. MQTT (Usar o HiveMQ Cloud)
```cpp
const char* MQTT_SERVER = "c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "admin";
const char* MQTT_PASSWORD = "Admin123";
const char* MQTT_TOPIC = "manutai/leitura";
```

### 3. Sensor
```cpp
#define DHT_PIN 4          // GPIO 4 - Pino do DHT11
#define SENSOR_ID 1        // ID no banco de dados (1)
#define INTERVAL_LEITURA 10000  // A cada 10 segundos
```

## 🚀 Procedimento de Upload

1. **Conectar ESP32 ao computador via USB**

2. **Abrir código no Arduino IDE**
   - File → Open → esp32_sensor_mqtt.ino

3. **Configurar placa**
   - Tools → Board → ESP32 → ESP32 Dev Module

4. **Configurar porta**
   - Tools → Port → COM3 (ou a porta do seu ESP32)

5. **Upload**
   - Verificar (✓) para compilar
   - Upload (→) para enviar

6. **Monitor Serial**
   - Tools → Serial Monitor (115200 baud)
   - Observar mensagens de conexão

## ✅ Sequência Esperada na Serial Monitor

```
╔════════════════════════════════════╗
║ ESP32 - DHT11 - MQTT Publisher    ║
║ ManutAI IoT System                ║
╚════════════════════════════════════╝

✓ DHT11 inicializado no GPIO 4
[WiFi] Conectando a: SUA_REDE
.....
✅ WiFi conectado!
IP: 192.168.1.100

[MQTT] Conectando a: c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud
✅ MQTT conectado!

✅ Setup concluído! Iniciando leituras...

---
📊 Temperatura: 25.50°C | Umidade: 60.00%
📤 Publicado: {"id_sensor":1,"valor":25.5,"tipo_leitura":"temperatura","timestamp":"2024-01-15T10:30:45Z"}
📤 Publicado: {"id_sensor":1,"valor":60.0,"tipo_leitura":"umidade","timestamp":"2024-01-15T10:30:46Z"}
---
```

## 🔍 Verificar Dados no Backend

### 1. Checar logs do Node.js
```bash
# Backend deve mostrar:
✓ Conectado ao broker MQTT: mqtts://c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud:8883
✓ Inscrito no tópico: manutai/leitura
📨 Mensagem recebida em manutai/leitura...
💾 TEMPERATURA salva: 25.5°C (sensor 1)
💾 UMIDADE salva: 60.0% (sensor 1)
```

### 2. Query no banco (verificar Leituras salvas)
```sql
SELECT * FROM Leituras
WHERE id_sensor = 1
ORDER BY timestamp DESC
LIMIT 10;
```

## 🐛 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| DHT11 não responde | Pino errado ou desconectado | Verificar GPIO 4 e fiação |
| WiFi não conecta | Senha errada | Verificar SSID e password |
| MQTT não conecta | Broker inacessível | Verificar internet e credenciais HiveMQ |
| Leitura = -999 ou NaN | DHT com problema | Ressetar ESP32, verificar sensor |
| Nenhuma mensagem no backend | Tópico diferente | Verificar `MQTT_TOPIC` = "manutai/leitura" |

## 📝 Notas

- **Intervalo padrão**: 10 segundos entre leituras (editable no `INTERVAL_LEITURA`)
- **Timestamp**: Enviado em ISO 8601 (UTC)
- **Precisão DHT11**: ±2°C para temperatura, ±5% para umidade
- **Segurança**: `setInsecure()` é para testes. Para produção, usar certificados SSL/TLS

## 🎯 Próximos Passos

1. ✅ Upload do código no ESP32
2. ✅ Verificar conexão WiFi e MQTT
3. ✅ Confirmar leituras no banco de dados
4. ✅ Criar alertas no backend para temperatura/umidade fora dos limites
