"""
ESP32-S3 Pro Basic Dashboard — CircuitPython version.

Serves a bitwrench-powered web dashboard from the ESP32-S3 Pro.
NeoPixel control, on-chip temp, battery voltage, WiFi RSSI.

Requirements:
  - CircuitPython 9.x for ESP32-S3
  - Libraries: adafruit_httpserver, neopixel
  - bwserve.py from embedded_python/

Flash contents:
  /dashboard.html
  /bitwrench.umd.min.js (or .gz)
  /lib/bwserve.py
  /lib/adafruit_httpserver/
  /lib/neopixel.mpy

settings.toml:
  CIRCUITPY_WIFI_SSID = "YOUR_SSID"
  CIRCUITPY_WIFI_PASSWORD = "YOUR_PASS"

License: BSD-2-Clause
"""

import os
import gc
import time
import board
import microcontroller
import neopixel
import wifi
import socketpool
import json

from adafruit_httpserver import Server, Request, Response, SSEResponse, POST

import bwserve

# ── Configuration ────────────────────────────────────────────────────

NEOPIXEL_PIN = board.NEOPIXEL
SSE_INTERVAL = 2  # seconds

# ── Hardware ─────────────────────────────────────────────────────────

pixel = neopixel.NeoPixel(NEOPIXEL_PIN, 1, brightness=0.1)
pixel.fill((0, 0, 0))

current_color = (0, 0, 0)

# ── WiFi ─────────────────────────────────────────────────────────────

print("Connecting to WiFi...")
wifi.radio.connect(
    os.getenv("CIRCUITPY_WIFI_SSID"),
    os.getenv("CIRCUITPY_WIFI_PASSWORD")
)
print(f"IP: {wifi.radio.ipv4_address}")

pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, "/static", debug=True)

# ── SSE clients ──────────────────────────────────────────────────────

sse_responses = []


def broadcast(msg):
    """Send a bwserve message to all SSE clients."""
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

    # Send board info immediately
    board_info = bwserve.batch(
        bwserve.patch("val-board", "ESP32-S3 Pro"),
        bwserve.patch("val-chip", "ESP32-S3"),
        bwserve.patch("val-flash", "16 MB"),
        bwserve.patch("val-mac", ":".join(f"{b:02X}" for b in wifi.radio.mac_address)),
        bwserve.patch("val-firmware", "CircuitPython " + os.uname().version),
        bwserve.patch("val-neopixel", "1"),
    )
    sse.send_event(json.dumps(board_info))
    return sse


@server.route("/api/command", methods=[POST])
def command_handler(request: Request):
    global current_color

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

    return Response(request, body='{"ok":true}',
                    content_type="application/json")


# ── Main loop ────────────────────────────────────────────────────────

start_time = time.monotonic()
last_push = 0

print("Server started")

while True:
    try:
        server.poll()
    except Exception as e:
        print(f"Server error: {e}")
        continue

    now = time.monotonic()
    if now - last_push >= SSE_INTERVAL and sse_responses:
        last_push = now

        uptime_s = int(now - start_time)
        h = uptime_s // 3600
        m = (uptime_s % 3600) // 60
        s = uptime_s % 60

        gc.collect()

        msg = bwserve.batch(
            bwserve.patch("val-temp", f"{microcontroller.cpu.temperature:.1f} C"),
            bwserve.patch("val-voltage", "USB"),
            bwserve.patch("val-rssi", f"{wifi.radio.ap_info.rssi} dBm"),
            bwserve.patch("val-heap", f"{gc.mem_free() // 1024} KB"),
            bwserve.patch("val-psram", "N/A"),
            bwserve.patch("val-uptime", f"{h}h {m}m {s}s"),
        )
        broadcast(msg)
