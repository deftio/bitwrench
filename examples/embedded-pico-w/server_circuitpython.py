# =============================================================================
# Raspberry Pi Pico W / Pico 2W -- CircuitPython Web Server
# =============================================================================
#
# Hardware: Raspberry Pi Pico W (RP2040) or Pico 2W (RP2350)
#           Optional: Freenove Breakout Board (FNK0081)
# Language: CircuitPython (9.x recommended)
# Framework: adafruit_httpserver
#
# WiFi credentials: Set in settings.toml (NOT in this file):
#   CIRCUITPY_WIFI_SSID = "YOUR_SSID"
#   CIRCUITPY_WIFI_PASSWORD = "YOUR_PASSWORD"
#
# Dependencies (copy to /lib/ on CIRCUITPY drive):
#   adafruit_httpserver/    (from CircuitPython Bundle)
#
# Upload:
#   1. Install CircuitPython firmware (.uf2) from circuitpython.org
#   2. Copy this file as code.py to the CIRCUITPY drive
#   3. Copy dashboard.html to www/index.html on CIRCUITPY
#   4. Copy bitwrench.umd.min.js.gz to www/dist/ on CIRCUITPY
#   5. Create settings.toml with WiFi credentials
#
# Pin assignments (same as server.py):
#   GP0-GP3   PWM outputs (4 channels)
#   GP4-GP7   Digital inputs (pull-down)
#   GP8-GP15  Digital outputs (togglable)
#   GP26-GP28 ADC inputs (0-3.3V)
#   Internal  Temperature sensor
#   CYW43 LED Onboard LED
#
# =============================================================================

import gc
import json
import os
import time

import analogio
import board
import digitalio
import microcontroller
import pwmio
import socketpool
import wifi

from adafruit_httpserver import Server, Request, Response, FileResponse, SSEResponse, GET, POST

# =============================================================================
# Board Detection
# =============================================================================

_board_id = board.board_id or ""
IS_PICO_2W = "pico2" in _board_id.lower() or "rp2350" in _board_id.lower()
CHIP_NAME = "RP2350" if IS_PICO_2W else "RP2040"
BOARD_NAME = "Pico 2W" if IS_PICO_2W else "Pico W"
TOTAL_SRAM_KB = 520 if IS_PICO_2W else 264

# =============================================================================
# Hardware Initialization
# =============================================================================

# Onboard LED
led = digitalio.DigitalInOut(board.LED)
led.direction = digitalio.Direction.OUTPUT
led.value = False

# ADC channels
adc_pins = [board.GP26, board.GP27, board.GP28]
adc_channels = [analogio.AnalogIn(pin) for pin in adc_pins]

# Temperature sensor
temp_sensor = microcontroller.cpu.temperature  # property, not callable

# Digital input pins GP4-GP7
input_pins = [board.GP4, board.GP5, board.GP6, board.GP7]
digital_inputs = []
for pin in input_pins:
    dio = digitalio.DigitalInOut(pin)
    dio.direction = digitalio.Direction.INPUT
    dio.pull = digitalio.Pull.DOWN
    digital_inputs.append(dio)

# PWM outputs GP0-GP3
PWM_FREQ = 1000
pwm_pins = [board.GP0, board.GP1, board.GP2, board.GP3]
pwm_channels = [pwmio.PWMOut(pin, frequency=PWM_FREQ, duty_cycle=0) for pin in pwm_pins]
pwm_duty_pct = [0, 0, 0, 0]

# Digital output pins GP8-GP15
GPIO_OUT_START = 8
GPIO_OUT_COUNT = 8
output_pin_names = [board.GP8, board.GP9, board.GP10, board.GP11,
                    board.GP12, board.GP13, board.GP14, board.GP15]
gpio_outputs = []
for pin in output_pin_names:
    dio = digitalio.DigitalInOut(pin)
    dio.direction = digitalio.Direction.OUTPUT
    dio.value = False
    gpio_outputs.append(dio)

# =============================================================================
# Sensor Reading
# =============================================================================

ADC_REF_VOLTAGE = 3.3

boot_time = time.monotonic()


def read_sensors():
    """Build sensor payload dict."""
    gc.collect()
    return {
        "board": BOARD_NAME,
        "chip": CHIP_NAME,
        "totalSram": TOTAL_SRAM_KB,
        "onboardTemp": round(microcontroller.cpu.temperature, 1),
        "led": 1 if led.value else 0,
        "adc": [round(ch.value * ADC_REF_VOLTAGE / 65535, 3) for ch in adc_channels],
        "pwm": pwm_duty_pct[:],
        "digitalIn": [1 if pin.value else 0 for pin in digital_inputs],
        "gpioOut": [1 if pin.value else 0 for pin in gpio_outputs],
        "uptime": int(time.monotonic() - boot_time),
        "freeMemory": gc.mem_free(),
        "wifiRssi": wifi.radio.ap_info.rssi if wifi.radio.ap_info else -99,
    }


# =============================================================================
# WiFi Connection
# =============================================================================

print()
print("=" * 60)
print("  Raspberry Pi {} -- bitwrench Dashboard Server".format(BOARD_NAME))
print("  (CircuitPython)")
print("=" * 60)
print()
print("Board          : {} ({})".format(BOARD_NAME, CHIP_NAME))
print("SRAM           : {} KB".format(TOTAL_SRAM_KB))
print("CPU freq       : {} MHz".format(microcontroller.cpu.frequency // 1_000_000))
print("Free memory    : {} bytes".format(gc.mem_free()))
print("Onboard temp   : {} C".format(round(microcontroller.cpu.temperature, 1)))
print()

print("Connecting to WiFi...")
wifi.radio.connect(
    os.getenv("CIRCUITPY_WIFI_SSID"),
    os.getenv("CIRCUITPY_WIFI_PASSWORD"),
)
ip = str(wifi.radio.ipv4_address)
print("Connected!")
print("  IP address : {}".format(ip))
print("  RSSI       : {} dBm".format(wifi.radio.ap_info.rssi))
print()

# =============================================================================
# HTTP Server
# =============================================================================

pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, root_path="/www", debug=True)

# Track active SSE connections for sensor push
sse_connections = []


@server.route("/api/sensors", GET)
def api_sensors(request: Request):
    return Response(request, json.dumps(read_sensors()),
                    content_type="application/json")


@server.route("/api/led", POST)
def api_led(request: Request):
    body = request.json()
    if body and "state" in body:
        led.value = bool(int(body["state"]))
    else:
        led.value = not led.value
    return Response(request, json.dumps({"ok": True, "led": 1 if led.value else 0}),
                    content_type="application/json")


@server.route("/api/pwm/<ch>", POST)
def api_pwm(request: Request, ch: str):
    ch = int(ch)
    if ch < 0 or ch > 3:
        return Response(request, json.dumps({"ok": False, "error": "Channel must be 0-3"}),
                        content_type="application/json", status=(400, "Bad Request"))
    body = request.json()
    if not body or "duty" not in body:
        return Response(request, json.dumps({"ok": False, "error": "Missing 'duty'"}),
                        content_type="application/json", status=(400, "Bad Request"))
    duty_pct = max(0, min(100, int(body["duty"])))
    pwm_channels[ch].duty_cycle = int(duty_pct * 65535 / 100)
    pwm_duty_pct[ch] = duty_pct
    return Response(request, json.dumps({"ok": True, "channel": ch, "duty": duty_pct}),
                    content_type="application/json")


@server.route("/api/gpio/<pin>", POST)
def api_gpio(request: Request, pin: str):
    pin = int(pin)
    idx = pin - GPIO_OUT_START
    if idx < 0 or idx >= GPIO_OUT_COUNT:
        return Response(request, json.dumps({"ok": False, "error": "Pin must be 8-15"}),
                        content_type="application/json", status=(400, "Bad Request"))
    body = request.json()
    if body and "state" in body:
        gpio_outputs[idx].value = bool(int(body["state"]))
    else:
        gpio_outputs[idx].value = not gpio_outputs[idx].value
    return Response(request, json.dumps({"ok": True, "pin": pin,
                    "state": 1 if gpio_outputs[idx].value else 0}),
                    content_type="application/json")


@server.route("/dist/bitwrench.umd.min.js", GET)
def serve_bitwrench(request: Request):
    """Serve pre-gzipped bitwrench.js with Content-Encoding: gzip.
    The browser transparently decompresses it. ~40KB transfer vs ~130KB."""
    return FileResponse(
        request,
        filename="bitwrench.umd.min.js.gz",
        root_path="/www/dist",
        content_type="application/javascript",
        headers={"Content-Encoding": "gzip"},
    )


@server.route("/events", GET)
def sse_events(request: Request):
    sse = SSEResponse(request)
    sse_connections.append(sse)
    return sse


# =============================================================================
# Main Loop
# =============================================================================

print("Starting web server on port 80...")
print("Dashboard URL  : http://{}:80/".format(ip))
print()
print("Pin assignments:")
print("  GP0-GP3   PWM outputs ({}Hz)".format(PWM_FREQ))
print("  GP4-GP7   Digital inputs (pull-down)")
print("  GP8-GP15  Digital outputs (togglable)")
print("  GP26-GP28 ADC inputs (0-3.3V)")
print("  Internal  Temperature sensor")
print("  CYW43 LED Onboard LED")
print()

server.start(host=ip, port=80)

last_push = time.monotonic()
SSE_INTERVAL = 2

while True:
    server.poll()

    now = time.monotonic()
    if now - last_push >= SSE_INTERVAL:
        last_push = now
        payload = json.dumps(read_sensors())
        # Push to all active SSE connections
        closed = []
        for i, sse in enumerate(sse_connections):
            try:
                sse.send_event(payload, event="sensors")
            except Exception:
                closed.append(i)
        # Remove closed connections (iterate in reverse)
        for i in reversed(closed):
            sse_connections.pop(i)
