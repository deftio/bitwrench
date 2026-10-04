/**
 * Pico 2W IMU Dashboard
 *
 * Raspberry Pi Pico 2W with MPU6050 or ICM-20948 accelerometer/gyroscope.
 * Connected via I2C (GP4=SDA, GP5=SCL or STEMMA QT breakout).
 *
 * Features (in addition to basic):
 *   - 3-axis accelerometer (g)
 *   - 3-axis gyroscope (deg/s)
 *   - 3-axis magnetometer (ICM-20948 only, uT)
 *   - Adjustable sample rate
 *   - Onboard LED toggle
 *   - On-die temp, VSYS voltage, WiFi RSSI, heap, uptime
 *
 * Flash filesystem (LittleFS) must contain:
 *   /dashboard.html             <- from examples/embedded-imu/
 *   /bitwrench.umd.min.js.gz   <- gzip -k dist/bitwrench.umd.min.js
 *
 * Required libraries:
 *   - Adafruit_MPU6050  (for MPU6050)
 *   - Adafruit_ICM20X   (for ICM-20948)
 *   - Adafruit_Sensor
 *
 * Board: Raspberry Pi Pico 2W (via arduino-pico board manager)
 * License: BSD-2-Clause
 */

#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <Wire.h>
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

// Pico 2W I2C pins (use Wire, default GP4=SDA GP5=SCL)
#define I2C_SDA 4
#define I2C_SCL 5

#define MAX_SSE_CLIENTS 4

unsigned long sampleRateMs = 500;
#define SYSTEM_INTERVAL_MS 2000

// ── Globals ────────────────────────────────────────────────────────────

WebServer server(80);
WiFiClient sseClients[MAX_SSE_CLIENTS];
int sseClientCount = 0;

bool ledState = false;
unsigned long lastIMUPush = 0;
unsigned long lastSysPush = 0;
bool initialInfoSent = false;
bool imuFound = false;

// ── Helpers ────────────────────────────────────────────────────────────

void formatUptime(char* buf, size_t len) {
    unsigned long s = millis() / 1000;
    snprintf(buf, len, "%luh %lum %lus", s / 3600, (s % 3600) / 60, s % 60);
}

float readVsysVoltage() {
    int raw = analogRead(A3);
    return (raw / 4095.0f) * 3.3f * 3.0f;
}

// ── SSE helpers ────────────────────────────────────────────────────────

void sseCleanup() {
    for (int i = 0; i < sseClientCount; ) {
        if (!sseClients[i].connected()) {
            sseClients[i] = sseClients[--sseClientCount];
        } else {
            i++;
        }
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

// ── Send board info ────────────────────────────────────────────────────

void sendBoardInfo() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    BW_PATCH(m, "val-board", "Pico 2W");
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-chip", "RP2350");
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
    sseBroadcast(out);
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

    snprintf(val, sizeof(val), "%.2f", accel.acceleration.x / 9.81f);
    BW_PATCH(m, "val-accel-x", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.2f", accel.acceleration.y / 9.81f);
    BW_PATCH(m, "val-accel-y", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.2f", accel.acceleration.z / 9.81f);
    BW_PATCH(m, "val-accel-z", val);
    bw_batch_add(&batch, m);

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
    sseBroadcast(out);
}

// ── Send system stats ──────────────────────────────────────────────────

void sendSystemData() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];
    char val[32];

    snprintf(val, sizeof(val), "%.1f C", analogReadTemp());
    BW_PATCH(m, "val-temp", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%.2f V", readVsysVoltage());
    BW_PATCH(m, "val-voltage", val);
    bw_batch_add(&batch, m);

    snprintf(val, sizeof(val), "%d dBm", WiFi.RSSI());
    BW_PATCH(m, "val-rssi", val);
    bw_batch_add(&batch, m);

    bw_format_bytes(val, sizeof(val), rp2040.getFreeHeap());
    BW_PATCH(m, "val-heap", val);
    bw_batch_add(&batch, m);

    formatUptime(val, sizeof(val));
    BW_PATCH(m, "val-uptime", val);
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

    sseCleanup();
    if (sseClientCount < MAX_SSE_CLIENTS) {
        sseClients[sseClientCount++] = client;
    }
    initialInfoSent = false;
}

void handleCommand() {
    String body = server.arg("plain");

    if (body.indexOf("toggle_led") >= 0) {
        ledState = !ledState;
        digitalWrite(LED_BUILTIN, ledState ? HIGH : LOW);
    } else if (body.indexOf("set_rate") >= 0) {
        int idx = body.indexOf("rate");
        if (idx >= 0) {
            int colon = body.indexOf(':', idx);
            if (colon >= 0) {
                unsigned long rate = body.substring(colon + 1).toInt();
                if (rate >= 50 && rate <= 5000) {
                    sampleRateMs = rate;
                }
            }
        }
    }

    server.send(200, "application/json", "{\"ok\":true}");
}

void handleNotFound() {
    String path = server.uri();
    if (path.endsWith("/")) path += "dashboard.html";

    if (LittleFS.exists(path + ".gz")) {
        File file = LittleFS.open(path + ".gz", "r");
        String ct = "application/octet-stream";
        if (path.endsWith(".js")) ct = "application/javascript";
        else if (path.endsWith(".html")) ct = "text/html";
        else if (path.endsWith(".css")) ct = "text/css";
        server.sendHeader("Content-Encoding", "gzip");
        server.streamFile(file, ct);
        file.close();
        return;
    }

    if (LittleFS.exists(path)) {
        File file = LittleFS.open(path, "r");
        String ct = "application/octet-stream";
        if (path.endsWith(".js")) ct = "application/javascript";
        else if (path.endsWith(".html")) ct = "text/html";
        else if (path.endsWith(".css")) ct = "text/css";
        server.streamFile(file, ct);
        file.close();
        return;
    }

    server.send(404, "text/plain", "Not Found");
}

// ── Setup ──────────────────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LOW);
    analogReadResolution(12);

    // I2C
    Wire.setSDA(I2C_SDA);
    Wire.setSCL(I2C_SCL);
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

    if (!initialInfoSent && sseClientCount > 0) {
        sendBoardInfo();
        initialInfoSent = true;
    }

    if (now - lastIMUPush >= sampleRateMs) {
        lastIMUPush = now;
        if (sseClientCount > 0) {
            sendIMUData();
        }
    }

    if (now - lastSysPush >= SYSTEM_INTERVAL_MS) {
        lastSysPush = now;
        if (sseClientCount > 0) {
            sendSystemData();
        }
    }
}
