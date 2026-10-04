/**
 * ESP32-S3 Pro Basic Dashboard
 *
 * Unexpected Maker ESP32-S3 Pro serves a bitwrench-powered web dashboard.
 * No external peripherals — just the board itself.
 *
 * Features:
 *   - NeoPixel LED color control (1 pixel on GPIO 40)
 *   - On-chip temperature sensor
 *   - Battery voltage via ADC (GPIO 10)
 *   - WiFi RSSI signal strength
 *   - Free heap / PSRAM usage
 *   - Uptime counter
 *   - Board identifier (chip model, flash size, MAC address)
 *
 * Flash filesystem (LittleFS) must contain:
 *   /dashboard.html             <- from examples/embedded-basic/
 *   /bitwrench.umd.min.js.gz   <- gzip -k dist/bitwrench.umd.min.js
 *
 * Required libraries:
 *   - ESPAsyncWebServer (me-no-dev/ESPAsyncWebServer)
 *   - AsyncTCP (me-no-dev/AsyncTCP)
 *   - Adafruit_NeoPixel
 *   - LittleFS (built-in with ESP32 Arduino core)
 *
 * Board: Unexpected Maker ESP32-S3 Pro (Arduino board manager)
 * License: BSD-2-Clause
 */

#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <Adafruit_NeoPixel.h>
#include "bitwrench.h"
#include "bwserve.h"

// ── Configuration ──────────────────────────────────────────────────────

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

#define NEOPIXEL_PIN   40    // UM ESP32-S3 Pro onboard NeoPixel
#define NEOPIXEL_COUNT 1
#define VBAT_PIN       10    // Battery voltage ADC pin
#define VBAT_DIVIDER   2.0f  // Voltage divider ratio

#define SSE_INTERVAL_MS 2000

// ── Globals ────────────────────────────────────────────────────────────

AsyncWebServer server(80);
AsyncEventSource events("/events");
Adafruit_NeoPixel pixel(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

uint32_t currentColor = 0;  // NeoPixel color (packed RGB)
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

// ── Helper: parse hex color ────────────────────────────────────────────

uint32_t parseHexColor(const char* hex) {
    // Skip leading # if present
    if (hex[0] == '#') hex++;
    unsigned long val = strtoul(hex, NULL, 16);
    return pixel.Color((val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF);
}

// ── Helper: read battery voltage ───────────────────────────────────────

float readBatteryVoltage() {
    int raw = analogRead(VBAT_PIN);
    float voltage = (raw / 4095.0f) * 3.3f * VBAT_DIVIDER;
    return voltage;
}

// ── Send board info (once on connect) ──────────────────────────────────

void sendBoardInfo() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    BW_PATCH(m, "val-board", "ESP32-S3 Pro");
    bw_batch_add(&batch, m);

    char chipStr[64];
    snprintf(chipStr, sizeof(chipStr), "ESP32-S3 rev%d (%d cores)",
        ESP.getChipRevision(), ESP.getChipCores());
    BW_PATCH(m, "val-chip", chipStr);
    bw_batch_add(&batch, m);

    char flashStr[32];
    snprintf(flashStr, sizeof(flashStr), "%d MB", ESP.getFlashChipSize() / (1024 * 1024));
    BW_PATCH(m, "val-flash", flashStr);
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

    BW_PATCH(m, "val-neopixel", "1");
    bw_batch_add(&batch, m);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}

// ── Send sensor data (periodic) ────────────────────────────────────────

void sendSensorData() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    // Temperature
    char tempStr[16];
    snprintf(tempStr, sizeof(tempStr), "%.1f C", temperatureRead());
    BW_PATCH(m, "val-temp", tempStr);
    bw_batch_add(&batch, m);

    // Battery voltage
    char voltStr[16];
    snprintf(voltStr, sizeof(voltStr), "%.2f V", readBatteryVoltage());
    BW_PATCH(m, "val-voltage", voltStr);
    bw_batch_add(&batch, m);

    // WiFi RSSI
    char rssiStr[16];
    snprintf(rssiStr, sizeof(rssiStr), "%d dBm", WiFi.RSSI());
    BW_PATCH(m, "val-rssi", rssiStr);
    bw_batch_add(&batch, m);

    // Free heap
    char heapStr[32];
    bw_format_bytes(heapStr, sizeof(heapStr), ESP.getFreeHeap());
    BW_PATCH(m, "val-heap", heapStr);
    bw_batch_add(&batch, m);

    // PSRAM
    char psramStr[32];
    if (ESP.getPsramSize() > 0) {
        bw_format_bytes(psramStr, sizeof(psramStr), ESP.getFreePsram());
    } else {
        snprintf(psramStr, sizeof(psramStr), "N/A");
    }
    BW_PATCH(m, "val-psram", psramStr);
    bw_batch_add(&batch, m);

    // Uptime
    char uptimeStr[32];
    formatUptime(uptimeStr, sizeof(uptimeStr));
    BW_PATCH(m, "val-uptime", uptimeStr);
    bw_batch_add(&batch, m);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}

// ── Handle commands from browser ───────────────────────────────────────

void handleCommand(AsyncWebServerRequest* req, uint8_t* data, size_t len,
                   size_t index, size_t total) {
    // Null-terminate the body
    char body[256];
    size_t copyLen = len < sizeof(body) - 1 ? len : sizeof(body) - 1;
    memcpy(body, data, copyLen);
    body[copyLen] = '\0';

    if (strstr(body, "set_color")) {
        // Extract color from JSON: {"cmd":"set_color","color":"#ff0000"}
        const char* colorStart = strstr(body, "color");
        if (colorStart) {
            const char* hexStart = strchr(colorStart, '#');
            if (hexStart) {
                char hex[8];
                strncpy(hex, hexStart, 7);
                hex[7] = '\0';
                currentColor = parseHexColor(hex);
                pixel.setPixelColor(0, currentColor);
                pixel.show();
            }
        }
    } else if (strstr(body, "toggle_led")) {
        if (currentColor == 0) {
            currentColor = pixel.Color(255, 255, 255);
        } else {
            currentColor = 0;
        }
        pixel.setPixelColor(0, currentColor);
        pixel.show();
    }

    req->send(200, "application/json", "{\"ok\":true}");
}

// ── Setup ──────────────────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    delay(500);

    // NeoPixel
    pixel.begin();
    pixel.setBrightness(30);
    pixel.show();

    // ADC for battery
    analogReadResolution(12);

    // LittleFS
    if (!LittleFS.begin(true)) {
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

    // Serve static files from LittleFS
    server.serveStatic("/", LittleFS, "/")
        .setDefaultFile("dashboard.html");

    // SSE endpoint
    events.onConnect([](AsyncEventSourceClient* client) {
        Serial.println("Browser connected via SSE");
        initialInfoSent = false;  // Send board info to new client
    });
    server.addHandler(&events);

    // Command endpoint
    server.on("/api/command", HTTP_POST,
        [](AsyncWebServerRequest* req) {},
        NULL,
        handleCommand
    );

    server.begin();
    Serial.println("Server started");
}

// ── Loop ───────────────────────────────────────────────────────────────

void loop() {
    unsigned long now = millis();

    // Send board info once after connect
    if (!initialInfoSent && events.count() > 0) {
        sendBoardInfo();
        initialInfoSent = true;
    }

    // Periodic sensor push
    if (now - lastPush >= SSE_INTERVAL_MS) {
        lastPush = now;
        if (events.count() > 0) {
            sendSensorData();
        }
    }
}
