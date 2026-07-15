/**
 * Pico 2W Basic Dashboard
 *
 * Raspberry Pi Pico 2W (RP2350) serves a bitwrench-powered web dashboard.
 * No external peripherals — just the board itself.
 *
 * Features:
 *   - Onboard LED toggle (CYW43 WiFi chip GPIO)
 *   - On-die temperature sensor
 *   - VSYS voltage via ADC
 *   - WiFi RSSI signal strength
 *   - Free heap usage
 *   - Uptime counter
 *   - Board identifier
 *
 * Flash filesystem (LittleFS) must contain:
 *   /dashboard.html             <- from examples/embedded-basic/
 *   /bitwrench.umd.min.js.gz   <- gzip -k dist/bitwrench.umd.min.js
 *
 * Required board support:
 *   - arduino-pico (Earle Philhower's RP2040/RP2350 core)
 *     https://github.com/earlephilhower/arduino-pico
 *
 * Board: Raspberry Pi Pico 2W (via arduino-pico board manager)
 * License: BSD-2-Clause
 */

#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include "bitwrench.h"
#include "bwserve.h"

// ── Configuration ──────────────────────────────────────────────────────

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

#define SSE_INTERVAL_MS 2000
#define MAX_SSE_CLIENTS 4

// ── Globals ────────────────────────────────────────────────────────────

WebServer server(80);
WiFiClient sseClients[MAX_SSE_CLIENTS];
int sseClientCount = 0;

bool ledState = false;
unsigned long lastPush = 0;
bool initialInfoSent = false;

// ── Helper: format uptime ──────────────────────────────────────────────

void formatUptime(char* buf, size_t len) {
    unsigned long s = millis() / 1000;
    unsigned long h = s / 3600;
    unsigned long m = (s % 3600) / 60;
    unsigned long sec = s % 60;
    snprintf(buf, len, "%luh %lum %lus", h, m, sec);
}

// ── Helper: read VSYS voltage ──────────────────────────────────────────

float readVsysVoltage() {
    // VSYS is connected to ADC3 (GP29) through a voltage divider (3:1)
    int raw = analogRead(A3);
    float voltage = (raw / 4095.0f) * 3.3f * 3.0f;
    return voltage;
}

// ── SSE helpers ────────────────────────────────────────────────────────

void sseAddClient(WiFiClient client) {
    // Clean up disconnected clients first
    for (int i = 0; i < sseClientCount; ) {
        if (!sseClients[i].connected()) {
            sseClients[i] = sseClients[--sseClientCount];
        } else {
            i++;
        }
    }
    if (sseClientCount < MAX_SSE_CLIENTS) {
        sseClients[sseClientCount++] = client;
    }
}

void sseBroadcast(const char* data) {
    char frame[BW_BUF_SIZE * 2];
    BW_SSE_FRAME(frame, data);
    size_t frameLen = strlen(frame);

    for (int i = 0; i < sseClientCount; ) {
        if (sseClients[i].connected()) {
            sseClients[i].write(frame, frameLen);
            i++;
        } else {
            sseClients[i] = sseClients[--sseClientCount];
        }
    }
}

// ── Send board info (once on connect) ──────────────────────────────────

void sendBoardInfo() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    BW_PATCH(m, "val-board", "Pico 2W");
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-chip", "RP2350 (dual Cortex-M33)");
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-flash", "4 MB");
    bw_batch_add(&batch, m);

    char macStr[18];
    uint8_t mac[6];
    WiFi.macAddress(mac);
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
        mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    BW_PATCH(m, "val-mac", macStr);
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-firmware", "bitwrench 2.1");
    bw_batch_add(&batch, m);

    // Pico 2W has no NeoPixel, only onboard LED
    BW_PATCH(m, "val-neopixel", "0");
    bw_batch_add(&batch, m);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    sseBroadcast(out);
}

// ── Send sensor data (periodic) ────────────────────────────────────────

void sendSensorData() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    // On-die temperature
    char tempStr[16];
    snprintf(tempStr, sizeof(tempStr), "%.1f C", analogReadTemp());
    BW_PATCH(m, "val-temp", tempStr);
    bw_batch_add(&batch, m);

    // VSYS voltage
    char voltStr[16];
    snprintf(voltStr, sizeof(voltStr), "%.2f V", readVsysVoltage());
    BW_PATCH(m, "val-voltage", voltStr);
    bw_batch_add(&batch, m);

    // WiFi RSSI
    char rssiStr[16];
    snprintf(rssiStr, sizeof(rssiStr), "%d dBm", WiFi.RSSI());
    BW_PATCH(m, "val-rssi", rssiStr);
    bw_batch_add(&batch, m);

    // Free heap
    char heapStr[32];
    bw_format_bytes(heapStr, sizeof(heapStr), rp2040.getFreeHeap());
    BW_PATCH(m, "val-heap", heapStr);
    bw_batch_add(&batch, m);

    // No PSRAM on Pico
    BW_PATCH(m, "val-psram", "N/A");
    bw_batch_add(&batch, m);

    // Uptime
    char uptimeStr[32];
    formatUptime(uptimeStr, sizeof(uptimeStr));
    BW_PATCH(m, "val-uptime", uptimeStr);
    bw_batch_add(&batch, m);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    sseBroadcast(out);
}

// ── Route handlers ─────────────────────────────────────────────────────

void handleEvents() {
    WiFiClient client = server.client();
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/event-stream");
    client.println("Cache-Control: no-cache");
    client.println("Connection: keep-alive");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.flush();

    sseAddClient(client);
    initialInfoSent = false;
}

void handleCommand() {
    String body = server.arg("plain");

    if (body.indexOf("toggle_led") >= 0) {
        ledState = !ledState;
        digitalWrite(LED_BUILTIN, ledState ? HIGH : LOW);
    }

    server.send(200, "application/json", "{\"ok\":true}");
}

void handleNotFound() {
    // Try to serve from LittleFS
    String path = server.uri();
    if (path.endsWith("/")) path += "dashboard.html";

    // Check for gzipped version first
    if (LittleFS.exists(path + ".gz")) {
        File file = LittleFS.open(path + ".gz", "r");
        String contentType = "application/octet-stream";
        if (path.endsWith(".js")) contentType = "application/javascript";
        else if (path.endsWith(".html")) contentType = "text/html";
        else if (path.endsWith(".css")) contentType = "text/css";
        server.sendHeader("Content-Encoding", "gzip");
        server.streamFile(file, contentType);
        file.close();
        return;
    }

    if (LittleFS.exists(path)) {
        File file = LittleFS.open(path, "r");
        String contentType = "application/octet-stream";
        if (path.endsWith(".js")) contentType = "application/javascript";
        else if (path.endsWith(".html")) contentType = "text/html";
        else if (path.endsWith(".css")) contentType = "text/css";
        server.streamFile(file, contentType);
        file.close();
        return;
    }

    server.send(404, "text/plain", "Not Found");
}

// ── Setup ──────────────────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    delay(500);

    // LED
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LOW);

    // ADC for VSYS and temperature
    analogReadResolution(12);

    // LittleFS
    if (!LittleFS.begin()) {
        Serial.println("LittleFS mount failed");
        return;
    }

    // WiFi
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    // Routes
    server.on("/", HTTP_GET, []() {
        File file = LittleFS.open("/dashboard.html", "r");
        if (file) {
            server.streamFile(file, "text/html");
            file.close();
        } else {
            server.send(404, "text/plain", "dashboard.html not found");
        }
    });
    server.on("/events", HTTP_GET, handleEvents);
    server.on("/api/command", HTTP_POST, handleCommand);
    server.onNotFound(handleNotFound);

    server.begin();
    Serial.println("Server started");
}

// ── Loop ───────────────────────────────────────────────────────────────

void loop() {
    server.handleClient();

    unsigned long now = millis();

    // Send board info once after connect
    if (!initialInfoSent && sseClientCount > 0) {
        sendBoardInfo();
        initialInfoSent = true;
    }

    // Periodic sensor push
    if (now - lastPush >= SSE_INTERVAL_MS) {
        lastPush = now;
        if (sseClientCount > 0) {
            sendSensorData();
        }
    }
}
