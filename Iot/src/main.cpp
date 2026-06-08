/*
  Projeto ManutAI - ESP32 + DHT11 + MQTT
  Lê temperatura e umidade do sensor DHT11 e envia via MQTT
  para o tópico "manutai/leitura" no broker HiveMQ Cloud.

  Formato JSON:
  { "id_sensor": 1, 
   "valor": 25.5, 
   "tipo_leitura": "temperatura", 
   "timestamp": "2026-06-02T19:30:45Z" }

  Antes de compilar, edite `include/credentials.h` com sua rede WiFi.
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>
#include "credentials.h"

// ============ MQTT HiveMQ Cloud ============
const char* mqtt_server = MQTT_SERVER;
const int mqtt_port = 8883;
const char* mqtt_user = MQTT_USER;
const char* mqtt_pass = MQTT_PASS;
const char* mqtt_topic = "manutai/leitura";
const char* mqtt_topic_config = "manutai/config";   // intervalo de leitura remoto
const char* mqtt_topic_buzzer = "manutai/buzzer";   // comandos de alerta sonoro

// Configuração NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;  // UTC puro — o "Z" no timestamp exige UTC sem offset
const int daylightOffset_sec = 0;

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Configuração do DHT11
#define DHT_PIN 4
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Configuração do Buzzer
// GPIO 18: sem restrições, não é strapping pin, ideal para output digital
// Nota: ESP32 opera a 3.3V; para volume máximo use transistor NPN (BC547/2N2222) como driver
#define BUZZER_PIN 18

const int SENSOR_ID = 1;
unsigned long PUBLISH_INTERVAL = 30000;  // padrão: 30s (ajustável remotamente)

unsigned long lastPublish = 0;
bool primeiraConexao = true;     // controla o bip de inicialização (dispara só uma vez)
int bipPendente = 0;             // bip de maior criticidade aguardando execução
unsigned long bipRecebidoEm = 0; // timestamp do último comando recebido (debounce)

// ============ BUZZER ============
// 2 bips = leitura abaixo do limite | 3 bips = leitura acima do limite
// Acionado apenas uma vez por alerta (controle feito no backend)
void bip(int vezes) {
  for (int i = 0; i < vezes; i++) {
    digitalWrite(BUZZER_PIN, HIGH);  // HIGH = ligado
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);   // LOW = desligado
    if (i < vezes - 1) delay(150);
  }
}

// ============ CALLBACK MQTT ============
// Roteamento por tópico: manutai/config (intervalo) | manutai/buzzer (alerta sonoro)
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char msg[16];
  unsigned int len = length < sizeof(msg) - 1 ? length : sizeof(msg) - 1;
  memcpy(msg, payload, len);
  msg[len] = '\0';

  if (strcmp(topic, mqtt_topic_config) == 0) {
    unsigned long novoIntervalo = atol(msg);
    if (novoIntervalo >= 5000 && novoIntervalo <= 600000) {
      PUBLISH_INTERVAL = novoIntervalo;
      Serial.print("⚙️  Novo intervalo de leitura: ");
      Serial.print(PUBLISH_INTERVAL / 1000);
      Serial.println("s");
    } else {
      Serial.print("⚠️  Intervalo ignorado (fora de faixa): ");
      Serial.println(msg);
    }

  } else if (strcmp(topic, mqtt_topic_buzzer) == 0) {
    int bips = atoi(msg);
    if (bips == 2 || bips == 3) {
      // Acumula o mais crítico: 3 bips (acima do limite) tem prioridade sobre 2 (abaixo)
      // O bip real só executa após debounce no loop(), consolidando alertas simultâneos
      if (bips > bipPendente) bipPendente = bips;
      bipRecebidoEm = millis();
      Serial.print("🔔 Alerta sonoro pendente: ");
      Serial.print(bipPendente);
      Serial.println(" bip(s)");
    }
  }
}

void setup_wifi() {
  delay(10);
  Serial.println("\n[WiFi] Conectando...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  const unsigned long timeout = 20000;
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
      // Subscrever nos tópicos de configuração e alertas sonoros
      client.subscribe(mqtt_topic_config);
      Serial.print("✓ Inscrito em ");
      Serial.println(mqtt_topic_config);
      client.subscribe(mqtt_topic_buzzer);
      Serial.print("✓ Inscrito em ");
      Serial.println(mqtt_topic_buzzer);

      // Bip contínuo de 2s na primeira conexão — indica que o sistema está online
      if (primeiraConexao) {
        primeiraConexao = false;
        Serial.println("🔔 Bip de inicialização (sistema online)...");
        digitalWrite(BUZZER_PIN, HIGH);  // HIGH = ligado
        delay(2000);
        digitalWrite(BUZZER_PIN, LOW);   // LOW = desligado
      }
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

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);   // LOW = desligado
  Serial.println("✓ Buzzer inicializado no GPIO " + String(BUZZER_PIN));

  // Bip curto de boot — confirma que o hardware do buzzer está funcionando
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);

  setup_wifi();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("[NTP] Sincronizando horário...");

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

  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);  // registrar callback de config

  Serial.print("\n✅ Setup concluído! Intervalo inicial: ");
  Serial.print(PUBLISH_INTERVAL / 1000);
  Serial.println("s\n");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi desconectado. Reconectando...");
    setup_wifi();
  }

  if (WiFi.status() == WL_CONNECTED && !client.connected()) {
    reconnect();
  }

  client.loop();  // necessário para receber mensagens MQTT (config e buzzer)

  // Debounce de 300ms: aguarda possíveis alertas simultâneos (temp + umidade)
  // e executa apenas o bip de maior criticidade
  if (bipPendente > 0 && millis() - bipRecebidoEm >= 300) {
    int b = bipPendente;
    bipPendente = 0;
    Serial.print("🔔 Executando bip: ");
    Serial.print(b);
    Serial.println(" bip(s)");
    bip(b);
  }

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("❌ Erro ao ler DHT11!");
      return;
    }

    char timestamp[35];
    obterTimestampISO8601(timestamp, sizeof(timestamp));

    char payloadTemp[250];
    snprintf(payloadTemp, sizeof(payloadTemp),
      "{\"id_sensor\":%d,\"valor\":%.2f,\"tipo_leitura\":\"temperatura\",\"timestamp\":\"%s\"}",
      SENSOR_ID, temperature, timestamp);

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
      if (client.publish(mqtt_topic, payloadTemp)) {
        Serial.println("📤 Temperatura publicada!");
      } else {
        Serial.println("❌ Erro ao publicar temperatura");
      }

      delay(100);

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
