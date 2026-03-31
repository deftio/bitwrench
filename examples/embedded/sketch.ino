/**
 * ESP32 Sensor Dashboard — Arduino Sketch
 *
 * Serves a bitwrench-powered dashboard over WiFi.
 * The HTML page (index.html) is stored in SPIFFS/LittleFS.
 * The ESP32 only sends JSON data — bitwrench renders the UI.
 *
 * Hardware: ESP32 DevKit + DHT22 (GPIO 4) + LDR (GPIO 34)
 *
 * Upload flow:
 *   1. Upload data/ folder to SPIFFS (contains index.html + bitwrench assets)
 *   2. Upload this sketch
 *   3. Open Serial Monitor for the IP address
 *   4. Navigate to http://<ip-address>/
 *
 * Dependencies (Arduino Library Manager):
 *   - ESPAsyncWebServer
 *   - AsyncTCP
 *   - DHT sensor library
 *   - ArduinoJson
 */

#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <DHT.h>
#include <ArduinoJson.h>

// =========================================================================
// Configuration
// =========================================================================
const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

#define DHT_PIN    4
#define DHT_TYPE   DHT22
#define LDR_PIN    34
#define LED_PIN    2       // Built-in LED

// =========================================================================
// Globals
// =========================================================================
AsyncWebServer server(80);
AsyncEventSource events("/events");
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 2000;  // 2 seconds

// =========================================================================
// Sensor reading → JSON
// =========================================================================
String readSensorsJSON() {
  StaticJsonDocument<256> doc;

  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  doc["temperature"] = isnan(temp) ? 0.0 : temp;
  doc["humidity"]    = isnan(hum)  ? 0.0 : hum;
  doc["pressure"]    = 1013.25;  // placeholder — add BMP280 for real pressure
  doc["light"]       = analogRead(LDR_PIN);
  doc["uptime"]      = millis() / 1000;
  doc["heap"]        = ESP.getFreeHeap();
  doc["wifi_rssi"]   = WiFi.RSSI();

  String output;
  serializeJson(doc, output);
  return output;
}

// =========================================================================
// Command handler
// =========================================================================
void handleCommand(AsyncWebServerRequest* request, uint8_t* data, size_t len) {
  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, data, len);

  if (err) {
    request->send(400, "application/json", "{\"error\":\"invalid json\"}");
    return;
  }

  const char* cmd = doc["cmd"];
  const char* val = doc["val"];

  if (!cmd || cmd[0] == '\0') {
    request->send(400, "application/json", "{\"ok\":false,\"error\":\"missing cmd\"}");
    return;
  }

  if (strcmp(cmd, "led") == 0) {
    // Default to OFF if val is missing/invalid. This avoids undefined behavior
    // while keeping the demo command surface simple.
    bool ledOn = (val && strcmp(val, "on") == 0);
    digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
  } else if (strcmp(cmd, "restart") == 0) {
    request->send(200, "application/json", "{\"ok\":true}");
    delay(500);
    ESP.restart();
    return;
  } else {
    request->send(400, "application/json", "{\"ok\":false,\"error\":\"unknown cmd\"}");
    return;
  }

  request->send(200, "application/json", "{\"ok\":true}");
}

// =========================================================================
// Setup
// =========================================================================
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();

  // Mount filesystem
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed");
    return;
  }

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Serve static files from SPIFFS (index.html, bitwrench.umd.min.js, bitwrench.css)
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");

  // JSON API: current sensor readings
  server.on("/api/sensors", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "application/json", readSensorsJSON());
  });

  // Command endpoint
  server.on("/api/command", HTTP_POST, [](AsyncWebServerRequest* request) {},
    NULL, handleCommand);

  // SSE endpoint: push sensor data every SENSOR_INTERVAL
  events.onConnect([](AsyncEventSourceClient* client) {
    Serial.printf("SSE client connected, id: %u\n", client->lastId());
    client->send(readSensorsJSON().c_str(), NULL, millis(), SENSOR_INTERVAL);
  });
  server.addHandler(&events);

  server.begin();
  Serial.println("Server started");
}

// =========================================================================
// Loop
// =========================================================================
void loop() {
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    String json = readSensorsJSON();
    events.send(json.c_str(), NULL, now);
  }
}
