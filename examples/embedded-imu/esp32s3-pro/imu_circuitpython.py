"""
ESP32-S3 Pro IMU Dashboard — CircuitPython version.

Extends the basic dashboard with MPU6050 or ICM-20948 accelerometer/gyroscope.

Requirements:
  - CircuitPython 9.x for ESP32-S3
  - Libraries: adafruit_httpserver, neopixel, adafruit_mpu6050 or adafruit_icm20x
  - bwserve.py from embedded_python/

Flash contents:
  /dashboard.html      <- from examples/embedded-imu/
  /bitwrench.umd.min.js
  /lib/bwserve.py
  /lib/adafruit_httpserver/
  /lib/neopixel.mpy
  /lib/adafruit_mpu6050.mpy  (or adafruit_icm20x.mpy)
  /lib/adafruit_register/
  /lib/adafruit_bus_device/

settings.toml:
  CIRCUITPY_WIFI_SSID = "YOUR_SSID"
  CIRCUITPY_WIFI_PASSWORD = "YOUR_PASS"

License: BSD-2-Clause
"""

import os
import gc
import time
import board
import busio
import microcontroller
import neopixel
import wifi
import socketpool
import json

from adafruit_httpserver import Server, Request, Response, SSEResponse, POST

import bwserve

# ── Select IMU — uncomment one ──────────────────────────────────────

USE_MPU6050 = True
USE_ICM20948 = False

if USE_MPU6050:
    import adafruit_mpu6050
elif USE_ICM20948:
    import adafruit_icm20x

# ── Configuration ────────────────────────────────────────────────────

NEOPIXEL_PIN = board.NEOPIXEL
SSE_INTERVAL = 2       # system stats interval (seconds)
IMU_INTERVAL = 0.5     # IMU sample interval (seconds)

# ── Hardware ─────────────────────────────────────────────────────────

pixel = neopixel.NeoPixel(NEOPIXEL_PIN, 1, brightness=0.1)
pixel.fill((0, 0, 0))
current_color = (0, 0, 0)

# I2C for IMU (STEMMA QT)
i2c = busio.I2C(board.SCL, board.SDA)

imu = None
imu_name = "Not found"
has_mag = False

try:
    if USE_MPU6050:
        imu = adafruit_mpu6050.MPU6050(i2c)
        imu_name = "MPU6050"
        print("MPU6050 initialized")
    elif USE_ICM20948:
        imu = adafruit_icm20x.ICM20948(i2c)
        imu_name = "ICM-20948"
        has_mag = True
        print("ICM-20948 initialized")
except Exception as e:
    print(f"IMU init failed: {e}")

# ── WiFi ─────────────────────────────────────────────────────────────

print("Connecting to WiFi...")
wifi.radio.connect(
    os.getenv("CIRCUITPY_WIFI_SSID"),
    os.getenv("CIRCUITPY_WIFI_PASSWORD")
)
print(f"IP: {wifi.radio.ipv4_address}")

pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, "/static", debug=True)

sse_responses = []


def broadcast(msg):
    data = json.dumps(msg)
    dead = []
    for sse in sse_responses:
        try:
            sse.send_event(data)
        except Exception:
            dead.append(sse)
    for d in dead:
        sse_responses.remove(d)


# ── Routes ───────────────────────────────────────────────────────────

@server.route("/")
def index(request: Request):
    return Response(request, body=open("/dashboard.html", "r").read(),
                    content_type="text/html")


@server.route("/bitwrench.umd.min.js")
def serve_bw(request: Request):
    return Response(request, body=open("/bitwrench.umd.min.js", "r").read(),
                    content_type="application/javascript")


@server.route("/events")
def events_handler(request: Request):
    sse = SSEResponse(request)
    sse_responses.append(sse)

    board_info = bwserve.batch(
        bwserve.patch("val-board", "ESP32-S3 Pro"),
        bwserve.patch("val-chip", "ESP32-S3"),
        bwserve.patch("val-imu-chip", imu_name),
        bwserve.patch("val-has-mag", "1" if has_mag else "0"),
    )
    sse.send_event(json.dumps(board_info))
    return sse


@server.route("/api/command", methods=[POST])
def command_handler(request: Request):
    global current_color, IMU_INTERVAL

    try:
        body = json.loads(request.body)
    except Exception:
        return Response(request, body='{"ok":false}',
                        content_type="application/json")

    cmd = body.get("cmd", "")

    if cmd == "set_color":
        hex_str = body.get("color", "#000000").lstrip("#")
        r = int(hex_str[0:2], 16)
        g = int(hex_str[2:4], 16)
        b = int(hex_str[4:6], 16)
        current_color = (r, g, b)
        pixel.fill(current_color)
    elif cmd == "toggle_led":
        if current_color == (0, 0, 0):
            current_color = (255, 255, 255)
        else:
            current_color = (0, 0, 0)
        pixel.fill(current_color)
    elif cmd == "set_rate":
        rate = body.get("rate", 500)
        if 50 <= rate <= 5000:
            IMU_INTERVAL = rate / 1000.0

    return Response(request, body='{"ok":true}',
                    content_type="application/json")


# ── Main loop ────────────────────────────────────────────────────────

start_time = time.monotonic()
last_sys = 0
last_imu = 0

print("Server started")

while True:
    try:
        server.poll()
    except Exception as e:
        print(f"Server error: {e}")
        continue

    now = time.monotonic()

    # IMU data at sample rate
    if now - last_imu >= IMU_INTERVAL and sse_responses and imu:
        last_imu = now

        accel = imu.acceleration  # (x, y, z) in m/s^2
        gyro = imu.gyro           # (x, y, z) in rad/s

        ops = [
            bwserve.patch("val-accel-x", f"{accel[0] / 9.81:.2f}"),
            bwserve.patch("val-accel-y", f"{accel[1] / 9.81:.2f}"),
            bwserve.patch("val-accel-z", f"{accel[2] / 9.81:.2f}"),
            bwserve.patch("val-gyro-x", f"{gyro[0] * 57.2958:.1f}"),
            bwserve.patch("val-gyro-y", f"{gyro[1] * 57.2958:.1f}"),
            bwserve.patch("val-gyro-z", f"{gyro[2] * 57.2958:.1f}"),
        ]

        if has_mag and hasattr(imu, "magnetic"):
            mag = imu.magnetic  # (x, y, z) in uT
            ops.extend([
                bwserve.patch("val-mag-x", f"{mag[0]:.1f}"),
                bwserve.patch("val-mag-y", f"{mag[1]:.1f}"),
                bwserve.patch("val-mag-z", f"{mag[2]:.1f}"),
            ])

        broadcast(bwserve.batch(*ops))

    # System stats at slower rate
    if now - last_sys >= SSE_INTERVAL and sse_responses:
        last_sys = now
        gc.collect()

        uptime_s = int(now - start_time)
        h = uptime_s // 3600
        m = (uptime_s % 3600) // 60
        s = uptime_s % 60

        msg = bwserve.batch(
            bwserve.patch("val-temp", f"{microcontroller.cpu.temperature:.1f} C"),
            bwserve.patch("val-voltage", "USB"),
            bwserve.patch("val-rssi", f"{wifi.radio.ap_info.rssi} dBm"),
            bwserve.patch("val-heap", f"{gc.mem_free() // 1024} KB"),
            bwserve.patch("val-uptime", f"{h}h {m}m {s}s"),
        )
        broadcast(msg)
