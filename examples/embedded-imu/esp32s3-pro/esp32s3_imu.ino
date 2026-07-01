/**
 * ESP32-S3 Pro IMU Dashboard
 *
 * Extends the basic dashboard with MPU6050 or ICM-20948 accelerometer/gyroscope.
 * Connected via I2C through the STEMMA QT / Qwiic connector.
 *
 * Features (in addition to basic):
 *   - 3-axis accelerometer (g)
 *   - 3-axis gyroscope (deg/s)
 *   - 3-axis magnetometer (ICM-20948 only, uT)
 *   - Adjustable sample rate
 *   - NeoPixel LED control
 *   - On-chip temp, battery voltage, WiFi RSSI, heap, uptime
 *
 * Flash filesystem (LittleFS) must contain:
 *   /dashboard.html             <- from examples/embedded-imu/
 *   /bitwrench.umd.min.js.gz   <- gzip -k dist/bitwrench.umd.min.js
 *
 * Required libraries:
 *   - ESPAsyncWebServer, AsyncTCP
 *   - Adafruit_NeoPixel
 *   - Adafruit_MPU6050  (for MPU6050)
 *   - Adafruit_ICM20X   (for ICM-20948, includes magnetometer)
 *   - Adafruit_Sensor
 *
 * Board: Unexpected Maker ESP32-S3 Pro
 * License: BSD-2-Clause
 */

#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <Wire.h>
#include <Adafruit_NeoPixel.h>
#include "bitwrench.h"
#include "bwserve.h"

// Uncomment ONE of these to select your IMU:
#define USE_MPU6050
// #define USE_ICM20948

#ifdef USE_MPU6050
  #include <Adafruit_MPU6050.h>
  #include <Adafruit_Sensor.h>
  Adafruit_MPU6050 imu;
#endif

#ifdef USE_ICM20948
  #include <Adafruit_ICM20X.h>
  #include <Adafruit_ICM20948.h>
  #include <Adafruit_Sensor.h>
  Adafruit_ICM20948 imu;
#endif

// ── Configuration ──────────────────────────────────────────────────────

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

#define NEOPIXEL_PIN   40
#define NEOPIXEL_COUNT 1
#define VBAT_PIN       10
#define VBAT_DIVIDER   2.0f

// Default sample rate (ms between IMU reads). Adjustable via web UI.
unsigned long sampleRateMs = 500;
#define SYSTEM_INTERVAL_MS 2000  // System stats update interval

// ── Globals ────────────────────────────────────────────────────────────

AsyncWebServer server(80);
AsyncEventSource events("/events");
Adafruit_NeoPixel pixel(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

uint32_t currentColor = 0;
unsigned long lastIMUPush = 0;
unsigned long lastSysPush = 0;
bool initialInfoSent = false;
bool imuFound = false;

// ── Helpers ────────────────────────────────────────────────────────────

void formatUptime(char* buf, size_t len) {
    unsigned long s = millis() / 1000;
    snprintf(buf, len, "%luh %lum %lus", s / 3600, (s % 3600) / 60, s % 60);
}

float readBatteryVoltage() {
    return (analogRead(VBAT_PIN) / 4095.0f) * 3.3f * VBAT_DIVIDER;
}

uint32_t parseHexColor(const char* hex) {
    if (hex[0] == '#') hex++;
    unsigned long val = strtoul(hex, NULL, 16);
    return pixel.Color((val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF);
}

// ── Send board + IMU info ──────────────────────────────────────────────

void sendBoardInfo() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    BW_PATCH(m, "val-board", "ESP32-S3 Pro");
    bw_batch_add(&batch, m);

    char chipStr[64];
    snprintf(chipStr, sizeof(chipStr), "ESP32-S3 rev%d", ESP.getChipRevision());
    BW_PATCH(m, "val-chip", chipStr);
    bw_batch_add(&batch, m);

#ifdef USE_MPU6050
    BW_PATCH(m, "val-imu-chip", imuFound ? "MPU6050" : "Not found");
    bw_batch_add(&batch, m);
    BW_PATCH(m, "val-has-mag", "0");
    bw_batch_add(&batch, m);
#endif

#ifdef USE_ICM20948
    BW_PATCH(m, "val-imu-chip", imuFound ? "ICM-20948" : "Not found");
    bw_batch_add(&batch, m);
    BW_PATCH(m, "val-has-mag", imuFound ? "1" : "0");
    bw_batch_add(&batch, m);
#endif

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}

// ── Send IMU data ──────────────────────────────────────────────────────

void sendIMUData() {
    if (!imuFound) return;

    sensors_event_t accel, gyro, temp;

#ifdef USE_MPU6050
    imu.getEvent(&accel, &gyro, &temp);
#endif

#ifdef USE_ICM20948
    sensors_event_t mag;
    imu.getEvent(&accel, &gyro, &temp, &mag);
#endif

    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];
    char val[16];

    // Accelerometer (m/s^2 -> g)
    snprintf(val, sizeof(val), "%.2f", accel.acceleration.x / 9.81f);
    BW_PATCH(m, "val-accel-x", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.2f", accel.acceleration.y / 9.81f);
    BW_PATCH(m, "val-accel-y", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.2f", accel.acceleration.z / 9.81f);
    BW_PATCH(m, "val-accel-z", val);
    bw_batch_add(&batch, m);

    // Gyroscope (rad/s -> deg/s)
    snprintf(val, sizeof(val), "%.1f", gyro.gyro.x * 57.2958f);
    BW_PATCH(m, "val-gyro-x", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.1f", gyro.gyro.y * 57.2958f);
    BW_PATCH(m, "val-gyro-y", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.1f", gyro.gyro.z * 57.2958f);
    BW_PATCH(m, "val-gyro-z", val);
    bw_batch_add(&batch, m);

#ifdef USE_ICM20948
    // Magnetometer (uT)
    snprintf(val, sizeof(val), "%.1f", mag.magnetic.x);
    BW_PATCH(m, "val-mag-x", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.1f", mag.magnetic.y);
    BW_PATCH(m, "val-mag-y", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.1f", mag.magnetic.z);
    BW_PATCH(m, "val-mag-z", val);
    bw_batch_add(&batch, m);
#endif

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}

// ── Send system stats ──────────────────────────────────────────────────

void sendSystemData() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];
    char val[32];

    snprintf(val, sizeof(val), "%.1f C", temperatureRead());
    BW_PATCH(m, "val-temp", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.2f V", readBatteryVoltage());
    BW_PATCH(m, "val-voltage", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%d dBm", WiFi.RSSI());
    BW_PATCH(m, "val-rssi", val);
    bw_batch_add(&batch, m);

    bw_format_bytes(val, sizeof(val), ESP.getFreeHeap());
    BW_PATCH(m, "val-heap", val);
    bw_batch_add(&batch, m);

    formatUptime(val, sizeof(val));
    BW_PATCH(m, "val-uptime", val);
    bw_batch_add(&batch, m);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}

// ── Handle commands ────────────────────────────────────────────────────

void handleCommand(AsyncWebServerRequest* req, uint8_t* data, size_t len,
                   size_t index, size_t total) {
    char body[256];
    size_t copyLen = len < sizeof(body) - 1 ? len : sizeof(body) - 1;
    memcpy(body, data, copyLen);
    body[copyLen] = '\0';

    if (strstr(body, "set_color")) {
        const char* hexStart = strchr(body, '#');
        if (hexStart) {
            char hex[8];
            strncpy(hex, hexStart, 7);
            hex[7] = '\0';
            currentColor = parseHexColor(hex);
            pixel.setPixelColor(0, currentColor);
            pixel.show();
        }
    } else if (strstr(body, "toggle_led")) {
        currentColor = currentColor ? 0 : pixel.Color(255, 255, 255);
        pixel.setPixelColor(0, currentColor);
        pixel.show();
    } else if (strstr(body, "set_rate")) {
        // Extract rate from JSON: {"cmd":"set_rate","rate":250}
        const char* rateStr = strstr(body, "rate");
        if (rateStr) {
            rateStr = strchr(rateStr, ':');
            if (rateStr) {
                unsigned long rate = strtoul(rateStr + 1, NULL, 10);
                if (rate >= 50 && rate <= 5000) {
                    sampleRateMs = rate;
                }
            }
        }
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

    analogReadResolution(12);

    // I2C for IMU (default SDA/SCL, STEMMA QT compatible)
    Wire.begin();

    // Initialize IMU
#ifdef USE_MPU6050
    if (imu.begin()) {
        imuFound = true;
        imu.setAccelerometerRange(MPU6050_RANGE_4_G);
        imu.setGyroRange(MPU6050_RANGE_500_DEG);
        imu.setFilterBandwidth(MPU6050_BAND_21_HZ);
        Serial.println("MPU6050 initialized");
    } else {
        Serial.println("MPU6050 not found");
    }
#endif

#ifdef USE_ICM20948
    if (imu.begin_I2C()) {
        imuFound = true;
        Serial.println("ICM-20948 initialized");
    } else {
        Serial.println("ICM-20948 not found");
    }
#endif

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

    // Serve static files
    server.serveStatic("/", LittleFS, "/")
        .setDefaultFile("dashboard.html");

    // SSE
    events.onConnect([](AsyncEventSourceClient* client) {
        Serial.println("Browser connected via SSE");
        initialInfoSent = false;
    });
    server.addHandler(&events);

    // Commands
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

    if (!initialInfoSent && events.count() > 0) {
        sendBoardInfo();
        initialInfoSent = true;
    }

    // IMU data at configurable rate
    if (now - lastIMUPush >= sampleRateMs) {
        lastIMUPush = now;
        if (events.count() > 0) {
            sendIMUData();
        }
    }

    // System stats at fixed slower rate
    if (now - lastSysPush >= SYSTEM_INTERVAL_MS) {
        lastSysPush = now;
        if (events.count() > 0) {
            sendSystemData();
        }
    }
}
