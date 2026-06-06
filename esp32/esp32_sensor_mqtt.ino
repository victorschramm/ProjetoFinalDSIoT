/*
 * ESP32 - Sensor DHT11 - MQTT Publisher
 * Envia temperatura e umidade ao servidor ManutAI via MQTT
 *
 * Biblioteca necessária: DHT sensor library (Adafruit)
 * Instalar via Arduino IDE: Sketch > Include Library > Manage Libraries > DHT
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>
#include <ArduinoJson.h>

// ============ CONFIGURAÇÕES WiFi ============
const char* WIFI_SSID = "SEU_SSID_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";

// ============ CONFIGURAÇÕES MQTT ============
const char* MQTT_SERVER = "c35e052ade714fca9ddce72e63df4c3e.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "admin";
const char* MQTT_PASSWORD = "Admin123";
const char* MQTT_TOPIC = "manutai/leitura";
const char* MQTT_TOPIC_CONFIG = "manutai/config";  // tópico de controle remoto

// ============ CONFIGURAÇÕES SENSOR DHT11 ============
#define DHT_PIN 4          // GPIO 4 (D4) - onde está conectado o DHT11
#define DHT_TYPE DHT11     // Tipo do sensor
#define SENSOR_ID 1        // ID do sensor no banco de dados

// ============ OBJETOS GLOBAIS ============
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long ultimaLeitura = 0;
int tentativasConexao = 0;
unsigned long intervaloLeitura = 30000;  // padrão: 30 segundos (ajustável remotamente)

// ============ CALLBACK MQTT ============
// Chamado quando uma mensagem chega no tópico manutai/config
// Payload: número em ms, ex: "30000"
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char msg[16];
  unsigned int len = length < sizeof(msg) - 1 ? length : sizeof(msg) - 1;
  memcpy(msg, payload, len);
  msg[len] = '\0';

  unsigned long novoIntervalo = atol(msg);
  if (novoIntervalo >= 5000 && novoIntervalo <= 600000) {
    intervaloLeitura = novoIntervalo;
    Serial.print("⚙️  Novo intervalo de leitura: ");
    Serial.print(intervaloLeitura / 1000);
    Serial.println("s");
  } else {
    Serial.print("⚠️  Intervalo ignorado (fora de faixa): ");
    Serial.println(msg);
  }
}

// ============ FUNÇÕES ============

// Conectar ao WiFi
void conectarWiFi() {
  Serial.print("\n[WiFi] Conectando a: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Falha ao conectar WiFi");
  }
}

// Conectar ao MQTT
void conectarMQTT() {
  while (!client.connected()) {
    Serial.print("[MQTT] Conectando a: ");
    Serial.println(MQTT_SERVER);

    String clientId = "ESP32_DHT11_";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("✅ MQTT conectado!");
      tentativasConexao = 0;
      // Subscrever no tópico de configuração remota
      client.subscribe(MQTT_TOPIC_CONFIG);
      Serial.println("✓ Inscrito em " + String(MQTT_TOPIC_CONFIG));
    } else {
      Serial.print("❌ Erro MQTT: ");
      Serial.println(client.state());

      tentativasConexao++;
      if (tentativasConexao > 5) {
        Serial.println("⚠️  Muitas tentativas de reconexão. Aguardando...");
        delay(10000);
        tentativasConexao = 0;
      }
      delay(2000);
    }
  }
}

// Obter timestamp ISO 8601
String obterTimestamp() {
  time_t agora = time(nullptr);
  struct tm* timeinfo = gmtime(&agora);
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  return String(buffer);
}

// Publicar leitura no MQTT
void publicarLeitura(String tipo_leitura, float valor) {
  if (!client.connected()) {
    conectarMQTT();
  }

  StaticJsonDocument<200> doc;
  doc["id_sensor"] = SENSOR_ID;
  doc["valor"] = valor;
  doc["tipo_leitura"] = tipo_leitura;
  doc["timestamp"] = obterTimestamp();

  String payload;
  serializeJson(doc, payload);

  if (client.publish(MQTT_TOPIC, payload.c_str())) {
    Serial.print("📤 Publicado: ");
    Serial.println(payload);
  } else {
    Serial.println("❌ Erro ao publicar mensagem");
  }
}

// Ler sensor DHT11
void lerSensorDHT11() {
  float temperatura = dht.readTemperature();
  float umidade = dht.readHumidity();

  if (isnan(temperatura) || isnan(umidade)) {
    Serial.println("❌ Erro ao ler DHT11!");
    return;
  }

  Serial.print("📊 Temperatura: ");
  Serial.print(temperatura);
  Serial.print("°C | Umidade: ");
  Serial.print(umidade);
  Serial.println("%");

  publicarLeitura("temperatura", temperatura);
  delay(500);
  publicarLeitura("umidade", umidade);
}

// ============ SETUP ============
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n╔════════════════════════════════════╗");
  Serial.println("║ ESP32 - DHT11 - MQTT Publisher    ║");
  Serial.println("║ ManutAI IoT System                ║");
  Serial.println("╚════════════════════════════════════╝\n");

  dht.begin();
  Serial.println("✓ DHT11 inicializado no GPIO " + String(DHT_PIN));

  conectarWiFi();

  espClient.setInsecure();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);  // registrar callback de config

  conectarMQTT();

  Serial.print("\n✅ Setup concluído! Intervalo inicial: ");
  Serial.print(intervaloLeitura / 1000);
  Serial.println("s\n");
}

// ============ LOOP ============
void loop() {
  if (!client.connected()) {
    conectarMQTT();
  }
  client.loop();  // necessário para receber mensagens MQTT (config)

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi desconectado. Reconectando...");
    conectarWiFi();
  }

  if (millis() - ultimaLeitura >= intervaloLeitura) {
    ultimaLeitura = millis();
    lerSensorDHT11();
    Serial.println("---");
  }

  delay(100);
}
