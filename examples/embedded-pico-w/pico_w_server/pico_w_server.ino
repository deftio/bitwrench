// =============================================================================
// Raspberry Pi Pico W / Pico 2W -- Arduino C++ Web Server for bitwrench
// =============================================================================
//
// Board support: arduino-pico by Earle Philhower
//   https://github.com/earlephilhower/arduino-pico
//
// Install:
//   1. Arduino IDE > Preferences > Additional Board Manager URLs:
//      https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json
//   2. Board Manager > Install "Raspberry Pi Pico/RP2040/RP2350"
//   3. Select: Tools > Board > "Raspberry Pi Pico W" or "Raspberry Pi Pico 2W"
//
// Filesystem:
//   Upload dashboard.html and bitwrench.umd.min.js.gz to LittleFS:
//   Tools > "Pico LittleFS Data Upload"
//
//   data/
//     index.html                  <- copy of dashboard.html
//     dist/
//       bitwrench.umd.min.js.gz  <- gzip -k bitwrench.umd.min.js
//
// Pin assignments (same as server.py):
//   GP0-GP3   PWM outputs
//   GP4-GP7   Digital inputs (pull-down)
//   GP8-GP15  Digital outputs (togglable)
//   GP26-GP28 ADC inputs (0-3.3V)
//   Internal  Temperature sensor
//   CYW43 LED Onboard LED
//
// =============================================================================

#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

// =============================================================================
// Configuration
// =============================================================================

const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int HTTP_PORT = 80;
const int SSE_INTERVAL_MS = 2000;

// =============================================================================
// Pin Definitions
// =============================================================================

// PWM outputs
const int PWM_PINS[] = {0, 1, 2, 3};
const int PWM_COUNT = 4;
int pwmDutyPct[4] = {0, 0, 0, 0};

// Digital inputs
const int DIN_PINS[] = {4, 5, 6, 7};
const int DIN_COUNT = 4;

// Digital outputs
const int DOUT_START = 8;
const int DOUT_COUNT = 8;
const int DOUT_PINS[] = {8, 9, 10, 11, 12, 13, 14, 15};

// ADC inputs
const int ADC_PINS[] = {26, 27, 28};
const int ADC_COUNT = 3;

// =============================================================================
// Board Detection
// =============================================================================

#if defined(ARDUINO_RASPBERRY_PI_PICO_2W)
  const char* BOARD_NAME = "Pico 2W";
  const char* CHIP_NAME = "RP2350";
  const int TOTAL_SRAM_KB = 520;
#else
  const char* BOARD_NAME = "Pico W";
  const char* CHIP_NAME = "RP2040";
  const int TOTAL_SRAM_KB = 264;
#endif

// =============================================================================
// Globals
// =============================================================================

WebServer server(HTTP_PORT);
unsigned long bootTime;
unsigned long lastSSEPush = 0;

// SSE client tracking
WiFiClient sseClients[3];  // max 3 concurrent SSE connections
int sseClientCount = 0;

// =============================================================================
// Sensor Reading
// =============================================================================

float readOnboardTemp() {
  // RP2040/RP2350 internal temperature sensor on ADC4
  // T = 27 - (V - 0.706) / 0.001721
  analogReadResolution(12);
  int raw = analogRead(A4);  // ADC4 = internal temp
  float voltage = raw * 3.3f / 4095.0f;
  return 27.0f - (voltage - 0.706f) / 0.001721f;
}

String buildSensorJSON() {
  JsonDocument doc;

  doc["board"] = BOARD_NAME;
  doc["chip"] = CHIP_NAME;
  doc["totalSram"] = TOTAL_SRAM_KB;
  doc["onboardTemp"] = round(readOnboardTemp() * 10.0f) / 10.0f;
  doc["led"] = digitalRead(LED_BUILTIN) ? 1 : 0;

  JsonArray adc = doc["adc"].to<JsonArray>();
  analogReadResolution(12);
  for (int i = 0; i < ADC_COUNT; i++) {
    float v = analogRead(ADC_PINS[i]) * 3.3f / 4095.0f;
    adc.add(round(v * 1000.0f) / 1000.0f);
  }

  JsonArray pwm = doc["pwm"].to<JsonArray>();
  for (int i = 0; i < PWM_COUNT; i++) {
    pwm.add(pwmDutyPct[i]);
  }

  JsonArray din = doc["digitalIn"].to<JsonArray>();
  for (int i = 0; i < DIN_COUNT; i++) {
    din.add(digitalRead(DIN_PINS[i]));
  }

  JsonArray gpio = doc["gpioOut"].to<JsonArray>();
  for (int i = 0; i < DOUT_COUNT; i++) {
    gpio.add(digitalRead(DOUT_PINS[i]));
  }

  doc["uptime"] = (millis() - bootTime) / 1000;
  doc["freeMemory"] = rp2040.getFreeHeap();
  doc["wifiRssi"] = WiFi.RSSI();

  String output;
  serializeJson(doc, output);
  return output;
}

// =============================================================================
// Route Handlers
// =============================================================================

void handleRoot() {
  File f = LittleFS.open("/index.html", "r");
  if (!f) {
    server.send(404, "text/plain", "index.html not found in LittleFS");
    return;
  }
  server.streamFile(f, "text/html");
  f.close();
}

void handleStaticFile() {
  String path = server.uri();
  // Check for gzipped version first
  String gzPath = path + ".gz";
  if (LittleFS.exists(gzPath)) {
    File f = LittleFS.open(gzPath, "r");
    String mime = "application/javascript";
    if (path.endsWith(".css")) mime = "text/css";
    else if (path.endsWith(".html")) mime = "text/html";
    server.sendHeader("Content-Encoding", "gzip");
    server.streamFile(f, mime);
    f.close();
    return;
  }
  if (LittleFS.exists(path)) {
    File f = LittleFS.open(path, "r");
    String mime = "application/octet-stream";
    if (path.endsWith(".js")) mime = "application/javascript";
    else if (path.endsWith(".css")) mime = "text/css";
    else if (path.endsWith(".html")) mime = "text/html";
    else if (path.endsWith(".json")) mime = "application/json";
    server.streamFile(f, mime);
    f.close();
    return;
  }
  server.send(404, "text/plain", "Not found: " + path);
}

void handleApiSensors() {
  String json = buildSensorJSON();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleApiLed() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("plain")) {
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    if (doc.containsKey("state")) {
      digitalWrite(LED_BUILTIN, doc["state"].as<int>() ? HIGH : LOW);
    } else {
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    }
  } else {
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  }
  String resp = "{\"ok\":true,\"led\":" + String(digitalRead(LED_BUILTIN)) + "}";
  server.send(200, "application/json", resp);
}

void handleApiPwm() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  // Extract channel from URI: /api/pwm/N
  String uri = server.uri();
  int ch = uri.substring(uri.lastIndexOf('/') + 1).toInt();
  if (ch < 0 || ch >= PWM_COUNT) {
    server.send(400, "application/json", "{\"ok\":false,\"error\":\"Channel 0-3\"}");
    return;
  }
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"ok\":false,\"error\":\"Missing body\"}");
    return;
  }
  JsonDocument doc;
  deserializeJson(doc, server.arg("plain"));
  int duty = constrain(doc["duty"].as<int>(), 0, 100);
  analogWrite(PWM_PINS[ch], duty * 255 / 100);
  pwmDutyPct[ch] = duty;
  String resp = "{\"ok\":true,\"channel\":" + String(ch) + ",\"duty\":" + String(duty) + "}";
  server.send(200, "application/json", resp);
}

void handleApiGpio() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  // Extract pin from URI: /api/gpio/N
  String uri = server.uri();
  int pin = uri.substring(uri.lastIndexOf('/') + 1).toInt();
  int idx = pin - DOUT_START;
  if (idx < 0 || idx >= DOUT_COUNT) {
    server.send(400, "application/json", "{\"ok\":false,\"error\":\"Pin 8-15\"}");
    return;
  }
  if (server.hasArg("plain")) {
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    if (doc.containsKey("state")) {
      digitalWrite(DOUT_PINS[idx], doc["state"].as<int>() ? HIGH : LOW);
    } else {
      digitalWrite(DOUT_PINS[idx], !digitalRead(DOUT_PINS[idx]));
    }
  } else {
    digitalWrite(DOUT_PINS[idx], !digitalRead(DOUT_PINS[idx]));
  }
  int state = digitalRead(DOUT_PINS[idx]);
  String resp = "{\"ok\":true,\"pin\":" + String(pin) + ",\"state\":" + String(state) + "}";
  server.send(200, "application/json", resp);
}

void handleSSE() {
  WiFiClient client = server.client();
  // Send SSE headers
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/event-stream");
  client.println("Cache-Control: no-cache");
  client.println("Connection: keep-alive");
  client.println("Access-Control-Allow-Origin: *");
  client.println();

  // Store client for periodic push
  if (sseClientCount < 3) {
    sseClients[sseClientCount] = client;
    sseClientCount++;
    Serial.print("SSE client connected (");
    Serial.print(sseClientCount);
    Serial.println(" active)");
  }
}

void handleCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

// =============================================================================
// Setup
// =============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("============================================================");
  Serial.print("  Raspberry Pi ");
  Serial.print(BOARD_NAME);
  Serial.println(" -- bitwrench Dashboard Server");
  Serial.println("  (Arduino C++)");
  Serial.println("============================================================");
  Serial.println();

  // Initialize filesystem
  if (!LittleFS.begin()) {
    Serial.println("ERROR: LittleFS mount failed!");
    Serial.println("Upload filesystem image first: Tools > Pico LittleFS Data Upload");
    while (1) delay(1000);
  }

  // Initialize pins
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  for (int i = 0; i < PWM_COUNT; i++) {
    pinMode(PWM_PINS[i], OUTPUT);
    analogWrite(PWM_PINS[i], 0);
  }

  for (int i = 0; i < DIN_COUNT; i++) {
    pinMode(DIN_PINS[i], INPUT_PULLDOWN);
  }

  for (int i = 0; i < DOUT_COUNT; i++) {
    pinMode(DOUT_PINS[i], OUTPUT);
    digitalWrite(DOUT_PINS[i], LOW);
  }

  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int maxWait = 20;
  while (WiFi.status() != WL_CONNECTED && maxWait > 0) {
    delay(1000);
    Serial.print(".");
    maxWait--;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("ERROR: WiFi connection failed!");
    while (1) delay(1000);
  }

  Serial.println("Connected!");
  Serial.print("  IP address : ");
  Serial.println(WiFi.localIP());
  Serial.print("  RSSI       : ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.println();

  // Register routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/sensors", HTTP_GET, handleApiSensors);
  server.on("/api/led", HTTP_POST, handleApiLed);
  server.on("/api/led", HTTP_OPTIONS, handleCORS);
  server.on("/events", HTTP_GET, handleSSE);

  // PWM routes: /api/pwm/0 through /api/pwm/3
  for (int i = 0; i < PWM_COUNT; i++) {
    String path = "/api/pwm/" + String(i);
    server.on(path.c_str(), HTTP_POST, handleApiPwm);
    server.on(path.c_str(), HTTP_OPTIONS, handleCORS);
  }

  // GPIO routes: /api/gpio/8 through /api/gpio/15
  for (int i = 0; i < DOUT_COUNT; i++) {
    String path = "/api/gpio/" + String(DOUT_START + i);
    server.on(path.c_str(), HTTP_POST, handleApiGpio);
    server.on(path.c_str(), HTTP_OPTIONS, handleCORS);
  }

  // Catch-all for static files (dist/bitwrench.umd.min.js etc.)
  server.onNotFound(handleStaticFile);

  server.begin();
  bootTime = millis();

  Serial.print("Dashboard URL  : http://");
  Serial.print(WiFi.localIP());
  Serial.print(":");
  Serial.println(HTTP_PORT);
  Serial.println();
  Serial.println("Pin assignments:");
  Serial.println("  GP0-GP3   PWM outputs");
  Serial.println("  GP4-GP7   Digital inputs (pull-down)");
  Serial.println("  GP8-GP15  Digital outputs (togglable)");
  Serial.println("  GP26-GP28 ADC inputs (0-3.3V)");
  Serial.println("  Internal  Temperature sensor");
  Serial.println("  CYW43 LED Onboard LED");
  Serial.println();
}

// =============================================================================
// Loop
// =============================================================================

void loop() {
  server.handleClient();

  // Push SSE sensor data periodically
  unsigned long now = millis();
  if (now - lastSSEPush >= SSE_INTERVAL_MS) {
    lastSSEPush = now;

    if (sseClientCount > 0) {
      String payload = buildSensorJSON();
      String sseData = "event: sensors\ndata: " + payload + "\n\n";

      // Push to all active SSE clients
      for (int i = sseClientCount - 1; i >= 0; i--) {
        if (sseClients[i].connected()) {
          sseClients[i].print(sseData);
        } else {
          // Remove disconnected client
          Serial.println("SSE client disconnected");
          for (int j = i; j < sseClientCount - 1; j++) {
            sseClients[j] = sseClients[j + 1];
          }
          sseClientCount--;
        }
      }
    }
  }
}
