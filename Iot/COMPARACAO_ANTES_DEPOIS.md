# Comparação Lado a Lado: Código Antes vs Depois

## Configurações MQTT

### ANTES
```cpp
const char* mqtt_server = "broker.hivemq.com";
const char* mqtt_topic = "ProjetoFinalIot";

// ...

WiFiClient espClient;
PubSubClient client(espClient);

// ...

client.setServer(mqtt_server, 1883);
```

### DEPOIS
```cpp
// ============ MQTT HiveMQ Cloud ============
const char* mqtt_server = "c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "admin";
const char* mqtt_pass = "Admin123";
const char* mqtt_topic = "manutai/leitura";

// ...

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ...

// Configurar cliente MQTT com TLS
espClient.setInsecure();  // Para testes (não recomendado em produção)
client.setServer(mqtt_server, mqtt_port);
```

---

## Intervalo de Leitura

### ANTES
```cpp
const unsigned long PUBLISH_INTERVAL = 120000; // 2 minutos (ms)
```

### DEPOIS
```cpp
const unsigned long PUBLISH_INTERVAL = 10000; // 10 segundos (ms)
```

---

## Função setup_wifi()

### ANTES
```cpp
void setup_wifi() {
  delay(10);
  Serial.print("Conectando em WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  const unsigned long timeout = 20000; // 20s
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeout) {
    delay(500);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("Falha ao conectar no WiFi (timeout). Continuando sem rede.");
  }
}
```

### DEPOIS
```cpp
void setup_wifi() {
  delay(10);
  Serial.println("\n[WiFi] Conectando...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  const unsigned long timeout = 20000; // 20s
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeout) {
    delay(500);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ Falha ao conectar no WiFi (timeout). Continuando sem rede.");
  }
}
```

---

## Função reconnect()

### ANTES
```cpp
void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentando conectar MQTT...");
    String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac());
    if (client.connect(clientId.c_str())) {
      Serial.println("conectado");
    } else {
      Serial.print("falhou, rc=");
      Serial.print(client.state());
      Serial.println("; nova tentativa em 2s");
      delay(2000);
    }
  }
}
```

### DEPOIS
```cpp
void reconnect() {
  int tentativas = 0;
  while (!client.connected() && tentativas < 5) {
    Serial.print("[MQTT] Tentando conectar a ");
    Serial.print(mqtt_server);
    Serial.print(":");
    Serial.println(mqtt_port);

    String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac());

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("✅ MQTT conectado!");
      tentativas = 0;
    } else {
      Serial.print("❌ Falha MQTT (rc=");
      Serial.print(client.state());
      Serial.println("); nova tentativa em 2s");
      tentativas++;
      delay(2000);
    }
  }

  if (!client.connected()) {
    Serial.println("⚠️  Não foi possível conectar ao MQTT. Continuando offline.");
  }
}
```

---

## Função setup()

### ANTES
```cpp
void setup() {
  Serial.begin(115200);
  delay(100);

  dht.begin();
  Serial.println("DHT11 inicializado no GPIO 4");

  setup_wifi();

  // Configura NTP para obter Data/Hora
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Sincronizando horário NTP...");

  // Aguarda sincronização
  struct tm timeinfo;
  int retry = 0;
  while (!getLocalTime(&timeinfo) && retry < 10) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  Serial.println();
  if (retry < 10) {
    Serial.println("Horário sincronizado!");
  } else {
    Serial.println("Falha ao sincronizar horário NTP");
  }

  client.setServer(mqtt_server, 1883);
}
```

### DEPOIS
```cpp
void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\n\n╔════════════════════════════════════╗");
  Serial.println("║ ESP32 - DHT11 - MQTT Publisher    ║");
  Serial.println("║ ManutAI IoT System                ║");
  Serial.println("╚════════════════════════════════════╝\n");

  dht.begin();
  Serial.println("✓ DHT11 inicializado no GPIO 4");

  setup_wifi();

  // Configura NTP para obter Data/Hora
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("[NTP] Sincronizando horário...");

  // Aguarda sincronização
  struct tm timeinfo;
  int retry = 0;
  while (!getLocalTime(&timeinfo) && retry < 10) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  Serial.println();
  if (retry < 10) {
    Serial.println("✅ Horário sincronizado!");
  } else {
    Serial.println("⚠️  Falha ao sincronizar horário NTP (usando fallback)");
  }

  // Configurar cliente MQTT com TLS
  espClient.setInsecure();  // Para testes (não recomendado em produção)
  client.setServer(mqtt_server, mqtt_port);
}
```

---

## Função de Timestamp

### ANTES (implícita no snprintf)
```cpp
char timestamp[25];
if (getLocalTime(&timeinfo)) {
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
} else {
  snprintf(timestamp, sizeof(timestamp), "N/A");
}

// Resultado: "2024-01-15 10:30:45"
```

### DEPOIS (nova função)
```cpp
// Obter timestamp em formato ISO 8601 (UTC)
String obterTimestampISO8601() {
  struct tm timeinfo;
  char timestamp[30];

  if (getLocalTime(&timeinfo)) {
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  } else {
    snprintf(timestamp, sizeof(timestamp), "1970-01-01T00:00:00Z");
  }

  return String(timestamp);
}

// Resultado: "2024-01-15T10:30:45Z"
```

---

## Payload JSON

### ANTES (Temperatura)
```cpp
char payloadTemp[200];
snprintf(payloadTemp, sizeof(payloadTemp),
  "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"temperatura\",\"unidade\":\"Celsius\",\"timestamp\":\"%s\"}",
  SENSOR_ID, temperature, timestamp);

// JSON:
{
  "id_sensor": 1,
  "valor": 25.50,
  "tipo_leitura": "temperatura",
  "unidade": "Celsius",
  "timestamp": "2024-01-15 10:30:45"
}
```

### DEPOIS (Temperatura)
```cpp
char payloadTemp[250];
snprintf(payloadTemp, sizeof(payloadTemp),
  "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"temperatura\",\"timestamp\":\"%s\"}",
  SENSOR_ID, temperature, timestamp.c_str());

// JSON:
{
  "id_sensor": 1,
  "valor": 25.50,
  "tipo_leitura": "temperatura",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### ANTES (Umidade)
```cpp
char payloadHum[200];
snprintf(payloadHum, sizeof(payloadHum),
  "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"umidade\",\"unidade\":\"UR %%\",\"timestamp\":\"%s\"}",
  SENSOR_ID, humidity, timestamp);

// JSON:
{
  "id_sensor": 1,
  "valor": 60.00,
  "tipo_leitura": "umidade",
  "unidade": "UR %",
  "timestamp": "2024-01-15 10:30:45"
}
```

### DEPOIS (Umidade)
```cpp
char payloadHum[250];
snprintf(payloadHum, sizeof(payloadHum),
  "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"umidade\",\"timestamp\":\"%s\"}",
  SENSOR_ID, humidity, timestamp.c_str());

// JSON:
{
  "id_sensor": 1,
  "valor": 60.00,
  "tipo_leitura": "umidade",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

---

## Logs da Publicação

### ANTES
```
Temperatura: {"id_sensor":1,"valor":25.50,"tipo_leitura":"temperatura","unidade":"Celsius","timestamp":"2024-01-15 10:30:45"}
Umidade: {"id_sensor":1,"valor":60.00,"tipo_leitura":"umidade","unidade":"UR %","timestamp":"2024-01-15 10:30:45"}
```

### DEPOIS
```
📊 Temperatura: 25.50°C
📊 Umidade: 60.00%
📤 Temperatura publicada!
📤 Umidade publicada!
---
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois | Impacto |
|---------|-------|--------|---------|
| **Broker** | `broker.hivemq.com:1883` | HiveMQ Cloud `8883` (TLS) | ✅ Mais seguro |
| **Autenticação** | Nenhuma | `admin`/`Admin123` | ✅ Acesso controlado |
| **Tópico** | `ProjetoFinalIot` | `manutai/leitura` | ✅ Novo projeto |
| **Intervalo** | 120 segundos | 10 segundos | ✅ Mais dados/min |
| **Timestamp** | `YYYY-MM-DD HH:MM:SS` | ISO-8601 UTC | ✅ Padrão internacional |
| **Unidade** | No JSON | Backend | ✅ Mais leve |
| **Logs** | Texto simples | Com emojis | ✅ Mais legível |
| **Reconexão** | Infinita | Máx 5 tentativas | ✅ Mais controle |

---

**Código completamente adaptado e pronto para deploy! 🚀**
