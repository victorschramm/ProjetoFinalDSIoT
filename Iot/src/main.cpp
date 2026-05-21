/*
  Projeto ManutAI - ESP32 + DHT11 + MQTT
  Lê temperatura e umidade do sensor DHT11 e envia via MQTT
  para o tópico "manutai/leitura" no broker HiveMQ Cloud.

  Formato JSON:
  { "id_sensor": 1, "valor": 25.5, "tipo_leitura": "temperatura", "timestamp": "2024-01-15T10:30:45Z" }

  Antes de compilar, edite `include/credentials.h` com sua rede WiFi.
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>
#include "credentials.h"

// ============ MQTT HiveMQ Cloud ============
const char* mqtt_server = "c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "admin";
const char* mqtt_pass = "Admin123";
const char* mqtt_topic = "manutai/leitura";

// Configuração NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -3 * 3600;  // Fuso horário Brasil (GMT-3)
const int daylightOffset_sec = 0;      // Sem horário de verão

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Configuração do DHT11
#define DHT_PIN 4       // GPIO 4
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// ID do sensor cadastrado no backend.
// IMPORTANTE: Altere este valor para cada ESP32/sensor diferente!
const int SENSOR_ID = 1;
const unsigned long PUBLISH_INTERVAL = 10000; // 10 segundos (ms)

unsigned long lastPublish = 0;

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

// Obter timestamp em formato ISO 8601 (UTC)
void obterTimestampISO8601(char* timestamp, size_t size) {
  struct tm timeinfo;

  if (getLocalTime(&timeinfo)) {
    strftime(timestamp, size, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  } else {
    snprintf(timestamp, size, "1970-01-01T00:00:00Z");
  }
}

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

void loop() {
  // Reconectar WiFi caso tenha caído durante operação
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi desconectado. Reconectando...");
    setup_wifi();
  }

  if (WiFi.status() == WL_CONNECTED && !client.connected()) {
    reconnect();
  }

  client.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;

    // Leitura do DHT11
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    // Verifica se a leitura é válida
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("❌ Erro ao ler DHT11!");
      return; // Skip this iteration
    }

    // Obtém timestamp ISO 8601
    char timestamp[35];
    obterTimestampISO8601(timestamp, sizeof(timestamp));

    // Payload para temperatura (°C)
    char payloadTemp[250];
    snprintf(payloadTemp, sizeof(payloadTemp),
      "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"temperatura\",\"timestamp\":\"%s\"}",
      SENSOR_ID, temperature, timestamp);

    // Payload para umidade (%)
    char payloadHum[250];
    snprintf(payloadHum, sizeof(payloadHum),
      "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"umidade\",\"timestamp\":\"%s\"}",
      SENSOR_ID, humidity, timestamp);

    Serial.print("📊 Temperatura: ");
    Serial.print(temperature);
    Serial.println("°C");
    Serial.print("📊 Umidade: ");
    Serial.print(humidity);
    Serial.println("%");

    if (WiFi.status() == WL_CONNECTED && client.connected()) {
      // Publicar temperatura
      if (client.publish(mqtt_topic, payloadTemp)) {
        Serial.println("📤 Temperatura publicada!");
      } else {
        Serial.println("❌ Erro ao publicar temperatura");
      }

      delay(100); // Pequeno delay entre publicações

      // Publicar umidade
      if (client.publish(mqtt_topic, payloadHum)) {
        Serial.println("📤 Umidade publicada!");
      } else {
        Serial.println("❌ Erro ao publicar umidade");
      }
    } else {
      Serial.println("⚠️  Não publicado (sem conexão MQTT/WiFi)");
    }

    Serial.println("---");
  }
}