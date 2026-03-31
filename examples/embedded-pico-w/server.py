# =============================================================================
# Raspberry Pi Pico W / Pico 2W -- MicroPython Web Server for bitwrench Dashboard
# =============================================================================
#
# Hardware: Raspberry Pi Pico W (RP2040) or Pico 2W (RP2350)
#           Optional: Freenove Breakout Board (FNK0081)
# Language: MicroPython (v1.20+ recommended)
# Framework: microdot (lightweight HTTP server for MicroPython)
#
# The board type (Pico W vs Pico 2W) is auto-detected at startup.
# Both boards share the same pinout and WiFi chip (CYW43439).
#
# Freenove Breakout Board compatibility:
#   The breakout board routes every GPIO to screw terminals + header pins,
#   with 74HC04 buffer-isolated LEDs on each pin. GPIO outputs (digital
#   toggles and PWM) are directly visible on the breakout board LEDs --
#   no external wiring needed for a functional demo.
#
# Dependencies:
#   Install microdot on the Pico W/2W via mpremote:
#     $ mpremote mip install github:miguelgrinberg/microdot/microdot.py
#     $ mpremote mip install github:miguelgrinberg/microdot/microdot_sse.py
#
#   Or copy microdot.py and microdot_sse.py directly to the Pico filesystem.
#
# Upload instructions:
#   1. Connect the Pico W/2W via USB while holding BOOTSEL
#   2. Install MicroPython firmware (.uf2) from micropython.org
#      (use the Pico W build for Pico W, Pico 2W build for Pico 2W)
#   3. Upload files to the Pico filesystem:
#        $ mpremote cp server.py :main.py
#        $ mpremote cp index.html :www/index.html
#        $ mpremote cp ../../dist/bitwrench.umd.min.js :www/dist/bitwrench.umd.min.js
#   4. Reset the board -- the server starts automatically as main.py
#
# Pin assignments (matching the HTML dashboard):
#   GP0-GP3   PWM outputs (4 channels, 1 kHz, 16-bit duty)
#   GP4-GP7   Digital inputs (with internal pull-down resistors)
#   GP8-GP15  Digital outputs (togglable from dashboard)
#   GP26      ADC0 (channel 0, 0-3.3V)
#   GP27      ADC1 (channel 1, 0-3.3V)
#   GP28      ADC2 (channel 2, 0-3.3V)
#   ADC4      Internal temperature sensor (no external pin)
#   CYW43 LED Onboard LED (active high, controlled via network driver)
#
# Endpoints:
#   GET  /               Serve index.html
#   GET  /dist/<path>    Serve static assets (bitwrench JS)
#   GET  /api/sensors    JSON snapshot of all sensor readings
#   GET  /events         SSE stream -- pushes sensor data every 2 seconds
#   POST /api/led        Toggle or set onboard LED: { "state": 0|1 }
#   POST /api/pwm/<ch>   Set PWM duty cycle: { "duty": 0-100 }
#   POST /api/gpio/<pin> Toggle or set digital output: { "state": 0|1 }
#
# =============================================================================

import gc
import json
import os
import time
import network
import machine
from machine import Pin, ADC, PWM

from microdot import Microdot, Response, send_file
from microdot_sse import with_sse

# =============================================================================
# Board Detection (Pico W vs Pico 2W)
# =============================================================================

_uname = os.uname()
IS_PICO_2W = "Pico 2" in _uname.machine
CHIP_NAME = "RP2350" if IS_PICO_2W else "RP2040"
BOARD_NAME = "Pico 2W" if IS_PICO_2W else "Pico W"
TOTAL_SRAM_KB = 520 if IS_PICO_2W else 264

# =============================================================================
# Configuration
# =============================================================================

WIFI_SSID = "YOUR_SSID"          # <-- Replace with your WiFi network name
WIFI_PASSWORD = "YOUR_PASSWORD"  # <-- Replace with your WiFi password

HTTP_PORT = 80
SSE_INTERVAL_S = 2  # Seconds between SSE pushes
WWW_ROOT = "/www"   # Root directory for static files on flash

# ADC conversion factor: 3.3V reference, 16-bit unsigned reading
ADC_CONVERSION_FACTOR = 3.3 / 65535

# Internal temperature sensor conversion constants
# RP2040 datasheet: T = 27 - (ADC_voltage - 0.706) / 0.001721
# RP2350 uses the same formula (same analog temp sensor design)
TEMP_SENSOR_OFFSET_V = 0.706
TEMP_SENSOR_SLOPE = 0.001721
TEMP_SENSOR_REF_C = 27.0

# PWM frequency for all output channels
PWM_FREQ_HZ = 1000

# =============================================================================
# Hardware Initialization
# =============================================================================

# Onboard LED -- On both Pico W and Pico 2W, the LED is connected to the
# CYW43 WiFi chip, not directly to a GPIO. We use the special 'LED' string
# identifier which MicroPython maps to the CYW43 GPIO.
led = Pin("LED", Pin.OUT)
led.value(0)

# ADC channels 0-2 on GP26, GP27, GP28
adc_channels = [
    ADC(26),  # ADC0 on GP26
    ADC(27),  # ADC1 on GP27
    ADC(28),  # ADC2 on GP28
]

# ADC channel 4 -- internal temperature sensor (both RP2040 and RP2350)
# This is a built-in sensor, not connected to any external pin
adc_temp = ADC(4)

# Digital input pins GP4-GP7 with internal pull-down resistors
# Pull-down means the pin reads 0 (LOW) when nothing is connected,
# and 1 (HIGH) when driven externally
digital_inputs = [
    Pin(4, Pin.IN, Pin.PULL_DOWN),
    Pin(5, Pin.IN, Pin.PULL_DOWN),
    Pin(6, Pin.IN, Pin.PULL_DOWN),
    Pin(7, Pin.IN, Pin.PULL_DOWN),
]

# PWM outputs on GP0-GP3
# Initialize all channels at the configured frequency with 0% duty cycle
pwm_channels = []
for i in range(4):
    p = PWM(Pin(i))
    p.freq(PWM_FREQ_HZ)
    p.duty_u16(0)
    pwm_channels.append(p)

# Track PWM duty percentages for reporting back to the dashboard
pwm_duty_pct = [0, 0, 0, 0]

# Digital output pins GP8-GP15
# On the Freenove Breakout Board, each pin has a buffer-isolated LED.
# Toggling these outputs from the dashboard lights up the corresponding LED
# on the breakout board -- no external wiring needed.
GPIO_OUT_START = 8
GPIO_OUT_COUNT = 8
gpio_outputs = []
for i in range(GPIO_OUT_COUNT):
    p = Pin(GPIO_OUT_START + i, Pin.OUT)
    p.value(0)
    gpio_outputs.append(p)

# =============================================================================
# WiFi Connection
# =============================================================================

def connect_wifi():
    """Connect to WiFi and return the WLAN interface.

    Blocks until connected or raises RuntimeError after 20 seconds.
    The Pico W uses the CYW43439 chip for 2.4 GHz WiFi (802.11n).
    """
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    # Set power management to performance mode for lower latency
    # CYW43 power modes: 0xa11140 = aggressive PM, 0xa11142 = performance
    try:
        wlan.config(pm=0xa11142)
    except Exception:
        pass  # Older MicroPython versions may not support pm config

    print("Connecting to WiFi: {}".format(WIFI_SSID))
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    # Wait for connection with timeout
    max_wait = 20
    while max_wait > 0:
        status = wlan.status()
        # status == 3 means CYW43_LINK_UP (connected with IP)
        if status == 3:
            break
        if status < 0:
            raise RuntimeError("WiFi connection failed, status={}".format(status))
        max_wait -= 1
        print("  Waiting for connection... (status={})".format(status))
        time.sleep(1)

    if wlan.status() != 3:
        raise RuntimeError("WiFi connection timed out after 20 seconds")

    ip_info = wlan.ifconfig()
    print("Connected!")
    print("  IP address : {}".format(ip_info[0]))
    print("  Subnet mask: {}".format(ip_info[1]))
    print("  Gateway    : {}".format(ip_info[2]))
    print("  DNS        : {}".format(ip_info[3]))
    print("  RSSI       : {} dBm".format(wlan.status("rssi")))
    print()
    return wlan


# =============================================================================
# Sensor Reading Helpers
# =============================================================================

def read_onboard_temp():
    """Read the internal temperature sensor via ADC channel 4.

    Both RP2040 and RP2350 use the same formula:
      T(C) = 27 - (V_adc - 0.706) / 0.001721

    Returns temperature in degrees Celsius (float).
    Typical range: 20-55C depending on workload and ambient temperature.
    """
    raw = adc_temp.read_u16()
    voltage = raw * ADC_CONVERSION_FACTOR
    temp_c = TEMP_SENSOR_REF_C - (voltage - TEMP_SENSOR_OFFSET_V) / TEMP_SENSOR_SLOPE
    return round(temp_c, 1)


def read_adc_voltages():
    """Read ADC channels 0-2 and convert to voltages.

    The ADC is 12-bit on both RP2040 and RP2350. MicroPython's read_u16()
    returns a 16-bit value (0-65535) for portability. Reference voltage is 3.3V.

    Returns a list of 3 floats in the range [0.0, 3.3].
    """
    voltages = []
    for adc in adc_channels:
        raw = adc.read_u16()
        voltage = round(raw * ADC_CONVERSION_FACTOR, 3)
        voltages.append(voltage)
    return voltages


def read_digital_inputs():
    """Read digital input pins GP4-GP7.

    Returns a list of 4 integers (0 or 1).
    With pull-down resistors, unconnected pins read 0.
    """
    return [pin.value() for pin in digital_inputs]


def read_gpio_outputs():
    """Read current state of GPIO output pins GP8-GP15.

    Returns a list of 8 integers (0 or 1).
    """
    return [pin.value() for pin in gpio_outputs]


def get_free_memory():
    """Return free heap memory in bytes after garbage collection.

    RP2040 has 264KB SRAM, RP2350 has 520KB SRAM. MicroPython uses
    a portion for the interpreter and heap.
    """
    gc.collect()
    return gc.mem_free()


def get_wifi_rssi(wlan):
    """Return current WiFi signal strength in dBm.

    Typical values:
      -30 to -50 dBm  Excellent
      -50 to -70 dBm  Good
      -70 to -80 dBm  Fair
      -80 to -90 dBm  Poor
    """
    try:
        return wlan.status("rssi")
    except Exception:
        return -99


def build_sensor_payload(wlan, boot_time):
    """Assemble a complete sensor reading as a JSON-serializable dict.

    This is the payload format expected by the index.html dashboard.
    The board/chip/totalSram fields are included so the dashboard can
    auto-detect and display the correct board name.
    """
    return {
        "board": BOARD_NAME,
        "chip": CHIP_NAME,
        "totalSram": TOTAL_SRAM_KB,
        "onboardTemp": read_onboard_temp(),
        "led": led.value(),
        "adc": read_adc_voltages(),
        "pwm": pwm_duty_pct[:],  # Copy to avoid mutation during serialization
        "digitalIn": read_digital_inputs(),
        "gpioOut": read_gpio_outputs(),
        "uptime": time.time() - boot_time,
        "freeMemory": get_free_memory(),
        "wifiRssi": get_wifi_rssi(wlan),
    }


# =============================================================================
# MIME Type Helper
# =============================================================================

MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".gz": "application/gzip",
}


def get_mime_type(path):
    """Determine MIME type from file extension."""
    for ext, mime in MIME_TYPES.items():
        if path.endswith(ext):
            return mime
    return "application/octet-stream"


# =============================================================================
# Application Setup
# =============================================================================

app = Microdot()

# Record boot time for uptime calculation
boot_time = time.time()

# The WLAN interface is set after connect_wifi() -- stored globally so
# route handlers and SSE can access RSSI without passing it around
wlan = None


# -- Static File Routes -------------------------------------------------------

@app.route("/")
def serve_index(request):
    """Serve the main dashboard HTML page."""
    return send_file(WWW_ROOT + "/index.html", content_type="text/html")


@app.route("/dist/<path:path>")
def serve_dist(request, path):
    """Serve bitwrench distribution files from flash.

    Supports .gz files with Content-Encoding: gzip so the browser
    transparently decompresses them. This saves flash space on the Pico W --
    bitwrench.umd.min.js.gz is ~40KB vs ~130KB uncompressed.
    """
    file_path = WWW_ROOT + "/dist/" + path
    content_type = get_mime_type(path)

    # If the requested file ends in .js and a .gz version exists, serve that
    # with gzip content-encoding for transparent decompression
    if path.endswith(".js"):
        gz_path = file_path + ".gz"
        try:
            # Check if gzipped version exists
            import os
            os.stat(gz_path)
            return send_file(
                gz_path,
                content_type=content_type,
                headers={"Content-Encoding": "gzip"},
            )
        except OSError:
            pass  # No .gz version, serve uncompressed

    return send_file(file_path, content_type=content_type)


# -- REST API Routes -----------------------------------------------------------

@app.route("/api/sensors")
def api_sensors(request):
    """Return a JSON snapshot of all sensor readings.

    This endpoint is useful for one-shot polling. For continuous updates,
    use the /events SSE endpoint instead.
    """
    payload = build_sensor_payload(wlan, boot_time)
    return Response(
        body=json.dumps(payload),
        headers={"Content-Type": "application/json"},
    )


@app.post("/api/led")
def api_led(request):
    """Toggle or set the onboard LED (CYW43).

    Request body (JSON):
      { "state": 1 }   -- Turn LED on
      { "state": 0 }   -- Turn LED off

    If no body is provided, the LED is toggled.

    Response:
      { "ok": true, "led": 1 }
    """
    body = request.json
    if body and "state" in body:
        led.value(int(body["state"]))
    else:
        # Toggle: read current value and invert
        led.value(1 - led.value())

    return Response(
        body=json.dumps({"ok": True, "led": led.value()}),
        headers={"Content-Type": "application/json"},
    )


@app.post("/api/pwm/<ch>")
def api_pwm(request, ch):
    """Set PWM duty cycle for a specific channel.

    URL parameter:
      ch -- PWM channel number (0-3), mapped to GP0-GP3

    Request body (JSON):
      { "duty": 50 }   -- Set duty cycle to 50% (range: 0-100)

    The duty percentage is converted to a 16-bit value (0-65535) for
    the RP2040 PWM hardware. The PWM frequency is fixed at 1 kHz.

    Response:
      { "ok": true, "channel": 0, "duty": 50 }
    """
    ch = int(ch)
    if ch < 0 or ch > 3:
        return Response(
            body=json.dumps({"ok": False, "error": "Channel must be 0-3"}),
            status_code=400,
            headers={"Content-Type": "application/json"},
        )

    body = request.json
    if not body or "duty" not in body:
        return Response(
            body=json.dumps({"ok": False, "error": "Missing 'duty' in request body"}),
            status_code=400,
            headers={"Content-Type": "application/json"},
        )

    # Clamp duty to 0-100 range
    duty_pct = max(0, min(100, int(body["duty"])))

    # Convert percentage to 16-bit duty cycle value
    # 0% = 0, 100% = 65535
    duty_u16 = int(duty_pct * 65535 / 100)
    pwm_channels[ch].duty_u16(duty_u16)
    pwm_duty_pct[ch] = duty_pct

    return Response(
        body=json.dumps({"ok": True, "channel": ch, "duty": duty_pct}),
        headers={"Content-Type": "application/json"},
    )


@app.post("/api/gpio/<pin>")
def api_gpio(request, pin):
    """Toggle or set a digital output pin (GP8-GP15).

    URL parameter:
      pin -- GPIO pin number (8-15)

    Request body (JSON):
      { "state": 1 }   -- Set pin HIGH (LED on)
      { "state": 0 }   -- Set pin LOW (LED off)

    If no body is provided, the pin is toggled.

    On the Freenove Breakout Board, each GPIO has a buffer-isolated LED.
    Setting a pin HIGH lights up the corresponding LED on the board.

    Response:
      { "ok": true, "pin": 8, "state": 1 }
    """
    pin = int(pin)
    idx = pin - GPIO_OUT_START
    if idx < 0 or idx >= GPIO_OUT_COUNT:
        return Response(
            body=json.dumps({"ok": False, "error": "Pin must be {}-{}".format(
                GPIO_OUT_START, GPIO_OUT_START + GPIO_OUT_COUNT - 1)}),
            status_code=400,
            headers={"Content-Type": "application/json"},
        )

    body = request.json
    if body and "state" in body:
        gpio_outputs[idx].value(int(body["state"]))
    else:
        # Toggle: read current value and invert
        gpio_outputs[idx].value(1 - gpio_outputs[idx].value())

    return Response(
        body=json.dumps({"ok": True, "pin": pin, "state": gpio_outputs[idx].value()}),
        headers={"Content-Type": "application/json"},
    )


# -- SSE (Server-Sent Events) -------------------------------------------------

@app.route("/events")
@with_sse
def sse_events(request, sse):
    """Push sensor readings to connected clients via Server-Sent Events.

    The dashboard's EventSource connects to this endpoint and receives
    JSON sensor payloads every 2 seconds. SSE format:

      data: {"onboardTemp": 26.3, "adc": [...], ...}

    The connection stays open indefinitely. The client reconnects
    automatically if the connection drops (EventSource built-in behavior).

    Memory note: Each SSE connection holds a socket open. The Pico W has
    limited RAM, so keep concurrent connections low (1-3 clients).
    """
    print("SSE client connected from {}".format(request.client_addr))
    try:
        while True:
            payload = build_sensor_payload(wlan, boot_time)
            sse.send(json.dumps(payload), event="sensors")
            # Yield to other tasks and sleep between pushes
            time.sleep(SSE_INTERVAL_S)
    except Exception as e:
        print("SSE client disconnected: {}".format(e))


# -- CORS Headers (optional, useful during development) ------------------------

@app.after_request
def add_cors_headers(request, response):
    """Add CORS headers so the dashboard can be served from a dev server
    while the Pico W handles API requests on a different origin.

    In production (serving index.html from the Pico W itself), CORS is
    not needed, but it doesn't hurt to include it.
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


# =============================================================================
# Main Entry Point
# =============================================================================

def main():
    """Initialize hardware, connect to WiFi, and start the web server."""
    global wlan

    print()
    print("=" * 60)
    print("  Raspberry Pi {} -- bitwrench Dashboard Server".format(BOARD_NAME))
    print("=" * 60)
    print()

    # Report hardware info
    freq_mhz = machine.freq() // 1_000_000
    print("Board          : {} ({})".format(BOARD_NAME, CHIP_NAME))
    print("SRAM           : {} KB".format(TOTAL_SRAM_KB))
    print("{} clock    : {} MHz".format(CHIP_NAME, freq_mhz))
    print("Free memory    : {} bytes".format(get_free_memory()))
    print("Flash root     : {}".format(WWW_ROOT))
    print("Onboard temp   : {} C".format(read_onboard_temp()))
    print()

    # Connect to WiFi
    wlan = connect_wifi()
    ip = wlan.ifconfig()[0]

    print("Starting web server on port {}...".format(HTTP_PORT))
    print("Dashboard URL  : http://{}:{}/".format(ip, HTTP_PORT))
    print()
    print("Pin assignments:")
    print("  GP0-GP3   PWM outputs ({}Hz)".format(PWM_FREQ_HZ))
    print("  GP4-GP7   Digital inputs (pull-down)")
    print("  GP8-GP15  Digital outputs (togglable)")
    print("  GP26-GP28 ADC inputs (0-3.3V)")
    print("  ADC4      Internal temperature sensor")
    print("  CYW43 LED Onboard LED")
    print()
    print("Endpoints:")
    print("  GET  /              Dashboard HTML")
    print("  GET  /api/sensors   Sensor snapshot (JSON)")
    print("  GET  /events        SSE sensor stream (2s interval)")
    print("  POST /api/led       Toggle onboard LED")
    print("  POST /api/pwm/<n>   Set PWM duty (0-3)")
    print("  POST /api/gpio/<n>  Toggle GPIO output (8-15)")
    print()

    # Start the server -- this blocks forever
    app.run(host="0.0.0.0", port=HTTP_PORT)


# Run when executed as main.py on the Pico W
if __name__ == "__main__":
    main()
