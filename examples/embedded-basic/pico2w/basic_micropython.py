"""
Pico 2W Basic Dashboard — MicroPython version.

Serves a bitwrench-powered web dashboard from the Raspberry Pi Pico 2W.
Onboard LED toggle, on-die temp, VSYS voltage, WiFi RSSI.

Requirements:
  - MicroPython for RP2350 (Pico 2W)
  - bwserve.py from embedded_python/

Flash contents (via mpremote or Thonny):
  /dashboard.html
  /bitwrench.umd.min.js
  /lib/bwserve.py

License: BSD-2-Clause
"""

import gc
import time
import json
import machine
import network
import socket

import bwserve

# ── Configuration ────────────────────────────────────────────────────

WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASS = "YOUR_WIFI_PASSWORD"
PORT = 80
SSE_INTERVAL = 2  # seconds

# ── Hardware ─────────────────────────────────────────────────────────

led = machine.Pin("LED", machine.Pin.OUT)
led_state = False

# On-die temperature sensor (ADC channel 4)
temp_sensor = machine.ADC(4)

# VSYS voltage (ADC channel 3, GP29)
vsys_adc = machine.ADC(29)

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
    """Read on-die temperature from ADC4."""
    raw = temp_sensor.read_u16()
    voltage = raw * 3.3 / 65535
    temp_c = 27 - (voltage - 0.706) / 0.001721
    return temp_c


def read_vsys():
    """Read VSYS voltage from ADC3 (GP29) with 3:1 divider."""
    raw = vsys_adc.read_u16()
    return raw * 3.3 * 3.0 / 65535


def format_uptime(s):
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    return f"{h}h {m}m {sec}s"


def read_file(path):
    """Read a file from flash, return bytes."""
    with open(path, "rb") as f:
        return f.read()


def content_type_for(path):
    if path.endswith(".html"):
        return "text/html"
    elif path.endswith(".js"):
        return "application/javascript"
    elif path.endswith(".css"):
        return "text/css"
    return "application/octet-stream"


# ── Simple HTTP + SSE server ────────────────────────────────────────

sse_clients = []
start_time = time.time()
last_push = 0

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("0.0.0.0", PORT))
srv.listen(4)
srv.settimeout(0.1)

print(f"Server started on port {PORT}")


def send_sse(data):
    """Broadcast SSE data to all connected clients."""
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
    """Send one-time board info."""
    mac = wlan.config("mac")
    mac_str = ":".join(f"{b:02X}" for b in mac)
    msg = bwserve.batch(
        bwserve.patch("val-board", "Pico 2W"),
        bwserve.patch("val-chip", "RP2350"),
        bwserve.patch("val-flash", "4 MB"),
        bwserve.patch("val-mac", mac_str),
        bwserve.patch("val-firmware", "MicroPython"),
        bwserve.patch("val-neopixel", "0"),
    )
    send_sse(json.dumps(msg))


def send_sensor_data():
    """Send periodic sensor readings."""
    gc.collect()
    uptime_s = time.time() - start_time

    rssi = wlan.status("rssi") if hasattr(wlan, "status") else 0

    msg = bwserve.batch(
        bwserve.patch("val-temp", f"{read_temp():.1f} C"),
        bwserve.patch("val-voltage", f"{read_vsys():.2f} V"),
        bwserve.patch("val-rssi", f"{rssi} dBm"),
        bwserve.patch("val-heap", f"{gc.mem_free() // 1024} KB"),
        bwserve.patch("val-psram", "N/A"),
        bwserve.patch("val-uptime", format_uptime(int(uptime_s))),
    )
    send_sse(json.dumps(msg))


def handle_request(cl):
    """Parse HTTP request and route."""
    global led_state

    try:
        data = cl.recv(2048).decode()
    except Exception:
        cl.close()
        return

    if not data:
        cl.close()
        return

    # Parse first line
    lines = data.split("\r\n")
    parts = lines[0].split(" ")
    if len(parts) < 2:
        cl.close()
        return

    method = parts[0]
    path = parts[1]

    # GET / — serve dashboard
    if method == "GET" and path == "/":
        body = read_file("/dashboard.html")
        cl.send(b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n")
        cl.send(body)
        cl.close()
        return

    # GET /bitwrench.umd.min.js
    if method == "GET" and path == "/bitwrench.umd.min.js":
        body = read_file("/bitwrench.umd.min.js")
        cl.send(b"HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n\r\n")
        cl.send(body)
        cl.close()
        return

    # GET /events — SSE
    if method == "GET" and path == "/events":
        cl.send(b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: text/event-stream\r\n"
                b"Cache-Control: no-cache\r\n"
                b"Connection: keep-alive\r\n\r\n")
        sse_clients.append(cl)
        send_board_info()
        return  # Don't close — kept alive for SSE

    # POST /api/command
    if method == "POST" and path == "/api/command":
        # Find body after headers
        body_start = data.find("\r\n\r\n")
        if body_start >= 0:
            body_str = data[body_start + 4:]
            if "toggle_led" in body_str:
                led_state = not led_state
                led.value(1 if led_state else 0)

        cl.send(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n")
        cl.send(b'{"ok":true}')
        cl.close()
        return

    # 404
    cl.send(b"HTTP/1.1 404 Not Found\r\n\r\nNot Found")
    cl.close()


# ── Main loop ────────────────────────────────────────────────────────

need_board_info = False

while True:
    # Accept connections
    try:
        cl, addr = srv.accept()
        handle_request(cl)
    except OSError:
        pass  # timeout, no connection

    # Periodic sensor push
    now = time.time()
    if now - last_push >= SSE_INTERVAL and sse_clients:
        last_push = now
        send_sensor_data()
