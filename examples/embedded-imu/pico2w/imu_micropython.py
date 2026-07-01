"""
Pico 2W IMU Dashboard — MicroPython version.

Extends the basic dashboard with MPU6050 or ICM-20948 accelerometer/gyroscope.

Requirements:
  - MicroPython for RP2350 (Pico 2W)
  - bwserve.py from embedded_python/
  - MPU6050 or ICM-20948 driver (mpy-lib or Adafruit)

Flash contents (via mpremote or Thonny):
  /dashboard.html      <- from examples/embedded-imu/
  /bitwrench.umd.min.js
  /lib/bwserve.py
  /lib/mpu6050.py       (or icm20948.py)

I2C wiring: SDA=GP4, SCL=GP5

License: BSD-2-Clause
"""

import gc
import time
import json
import machine
import network
import socket
import struct

import bwserve

# ── Configuration ────────────────────────────────────────────────────

WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASS = "YOUR_WIFI_PASSWORD"
PORT = 80
SSE_INTERVAL = 2     # system stats interval (seconds)
IMU_INTERVAL = 0.5   # IMU sample interval (seconds)

I2C_SDA = 4
I2C_SCL = 5

# ── Select IMU — change to False/True as needed ─────────────────────

USE_MPU6050 = True
USE_ICM20948 = False

# ── Hardware ─────────────────────────────────────────────────────────

led = machine.Pin("LED", machine.Pin.OUT)
led_state = False

temp_sensor = machine.ADC(4)
vsys_adc = machine.ADC(29)

# I2C
i2c = machine.I2C(0, sda=machine.Pin(I2C_SDA), scl=machine.Pin(I2C_SCL), freq=400000)

# ── Minimal MPU6050 driver (register-level) ──────────────────────────
# This avoids external library dependencies. For ICM-20948, install the
# appropriate MicroPython driver and replace the read functions.

MPU6050_ADDR = 0x68
imu_found = False
imu_name = "Not found"
has_mag = False


def mpu6050_init():
    """Wake up MPU6050 and set ranges."""
    global imu_found, imu_name
    try:
        # Check WHO_AM_I
        who = i2c.readfrom_mem(MPU6050_ADDR, 0x75, 1)[0]
        if who != 0x68:
            print(f"MPU6050 WHO_AM_I mismatch: {who:#x}")
            return False
        # Wake up (clear sleep bit)
        i2c.writeto_mem(MPU6050_ADDR, 0x6B, bytes([0x00]))
        # Set accel range to +/-4g (AFS_SEL=1)
        i2c.writeto_mem(MPU6050_ADDR, 0x1C, bytes([0x08]))
        # Set gyro range to +/-500 deg/s (FS_SEL=1)
        i2c.writeto_mem(MPU6050_ADDR, 0x1B, bytes([0x08]))
        imu_found = True
        imu_name = "MPU6050"
        print("MPU6050 initialized")
        return True
    except Exception as e:
        print(f"MPU6050 init failed: {e}")
        return False


def mpu6050_read():
    """Read accel (g) and gyro (deg/s) from MPU6050."""
    data = i2c.readfrom_mem(MPU6050_ADDR, 0x3B, 14)
    # Accel: 14-bit, ±4g range → 8192 LSB/g
    ax = struct.unpack(">h", data[0:2])[0] / 8192.0
    ay = struct.unpack(">h", data[2:4])[0] / 8192.0
    az = struct.unpack(">h", data[4:6])[0] / 8192.0
    # Skip temp (bytes 6-7)
    # Gyro: ±500 deg/s → 65.5 LSB/(deg/s)
    gx = struct.unpack(">h", data[8:10])[0] / 65.5
    gy = struct.unpack(">h", data[10:12])[0] / 65.5
    gz = struct.unpack(">h", data[12:14])[0] / 65.5
    return (ax, ay, az, gx, gy, gz)


# Initialize IMU
if USE_MPU6050:
    mpu6050_init()
elif USE_ICM20948:
    # For ICM-20948, install appropriate driver and initialize here
    print("ICM-20948 requires external MicroPython driver")

# ── WiFi ─────────────────────────────────────────────────────────────

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(WIFI_SSID, WIFI_PASS)

print("Connecting to WiFi...")
while not wlan.isconnected():
    time.sleep(0.5)

ip = wlan.ifconfig()[0]
print(f"IP: {ip}")

# ── Helpers ──────────────────────────────────────────────────────────


def read_temp():
    raw = temp_sensor.read_u16()
    voltage = raw * 3.3 / 65535
    return 27 - (voltage - 0.706) / 0.001721


def read_vsys():
    raw = vsys_adc.read_u16()
    return raw * 3.3 * 3.0 / 65535


def format_uptime(s):
    return f"{s // 3600}h {(s % 3600) // 60}m {s % 60}s"


def read_file(path):
    with open(path, "rb") as f:
        return f.read()


# ── Simple HTTP + SSE server ────────────────────────────────────────

sse_clients = []
start_time = time.time()
last_sys = 0
last_imu_push = 0

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("0.0.0.0", PORT))
srv.listen(4)
srv.settimeout(0.05)

print(f"Server started on port {PORT}")


def send_sse(data):
    frame = f"data: {data}\n\n"
    dead = []
    for cl in sse_clients:
        try:
            cl.send(frame.encode())
        except Exception:
            dead.append(cl)
    for d in dead:
        sse_clients.remove(d)
        try:
            d.close()
        except Exception:
            pass


def send_board_info():
    msg = bwserve.batch(
        bwserve.patch("val-board", "Pico 2W"),
        bwserve.patch("val-chip", "RP2350"),
        bwserve.patch("val-imu-chip", imu_name),
        bwserve.patch("val-has-mag", "1" if has_mag else "0"),
    )
    send_sse(json.dumps(msg))


def handle_request(cl):
    global led_state, IMU_INTERVAL

    try:
        data = cl.recv(2048).decode()
    except Exception:
        cl.close()
        return

    if not data:
        cl.close()
        return

    lines = data.split("\r\n")
    parts = lines[0].split(" ")
    if len(parts) < 2:
        cl.close()
        return

    method, path = parts[0], parts[1]

    if method == "GET" and path == "/":
        body = read_file("/dashboard.html")
        cl.send(b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n")
        cl.send(body)
        cl.close()
        return

    if method == "GET" and path == "/bitwrench.umd.min.js":
        body = read_file("/bitwrench.umd.min.js")
        cl.send(b"HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n\r\n")
        cl.send(body)
        cl.close()
        return

    if method == "GET" and path == "/events":
        cl.send(b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: text/event-stream\r\n"
                b"Cache-Control: no-cache\r\n"
                b"Connection: keep-alive\r\n\r\n")
        sse_clients.append(cl)
        send_board_info()
        return

    if method == "POST" and path == "/api/command":
        body_start = data.find("\r\n\r\n")
        if body_start >= 0:
            body_str = data[body_start + 4:]
            if "toggle_led" in body_str:
                led_state = not led_state
                led.value(1 if led_state else 0)
            elif "set_rate" in body_str:
                try:
                    body_json = json.loads(body_str)
                    rate = body_json.get("rate", 500)
                    if 50 <= rate <= 5000:
                        IMU_INTERVAL = rate / 1000.0
                except Exception:
                    pass

        cl.send(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n")
        cl.send(b'{"ok":true}')
        cl.close()
        return

    cl.send(b"HTTP/1.1 404 Not Found\r\n\r\nNot Found")
    cl.close()


# ── Main loop ────────────────────────────────────────────────────────

while True:
    try:
        cl, addr = srv.accept()
        handle_request(cl)
    except OSError:
        pass

    now = time.time()

    # IMU data
    if now - last_imu_push >= IMU_INTERVAL and sse_clients and imu_found:
        last_imu_push = now

        ax, ay, az, gx, gy, gz = mpu6050_read()

        msg = bwserve.batch(
            bwserve.patch("val-accel-x", f"{ax:.2f}"),
            bwserve.patch("val-accel-y", f"{ay:.2f}"),
            bwserve.patch("val-accel-z", f"{az:.2f}"),
            bwserve.patch("val-gyro-x", f"{gx:.1f}"),
            bwserve.patch("val-gyro-y", f"{gy:.1f}"),
            bwserve.patch("val-gyro-z", f"{gz:.1f}"),
        )
        send_sse(json.dumps(msg))

    # System stats
    if now - last_sys >= SSE_INTERVAL and sse_clients:
        last_sys = now
        gc.collect()
        uptime_s = int(now - start_time)
        rssi = wlan.status("rssi") if hasattr(wlan, "status") else 0

        msg = bwserve.batch(
            bwserve.patch("val-temp", f"{read_temp():.1f} C"),
            bwserve.patch("val-voltage", f"{read_vsys():.2f} V"),
            bwserve.patch("val-rssi", f"{rssi} dBm"),
            bwserve.patch("val-heap", f"{gc.mem_free() // 1024} KB"),
            bwserve.patch("val-uptime", format_uptime(uptime_s)),
        )
        send_sse(json.dumps(msg))
