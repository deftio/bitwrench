#!/usr/bin/env python3
"""
Raspberry Pi System Monitor -- Flask SSE Server
================================================

Hardware:  Raspberry Pi 3 / 4 / 5 (any model with Linux + GPIO)
OS:        Raspberry Pi OS (Bookworm or later), any Debian-based distro

Dependencies:
    pip install flask psutil gpiod

GPIO Pin Assignments (matching the bitwrench dashboard in index.html):
    OUTPUT pins:  17 (Status LED), 22 (Relay 2), 27 (Relay 1)      -- was 23 in early drafts; see note
    INPUT  pins:  23 (Button), 24 (Motion Sensor), 25 (Door Sensor)

    Note: The HTML dashboard defines GPIO 27 as "Relay 1" (OUT) and
    GPIO 23 as "Button" (IN).  This server mirrors those assignments
    exactly.

Run:
    python3 server.py                     # default: 0.0.0.0:8080
    python3 server.py --port 9000         # custom port
    python3 server.py --host 127.0.0.1    # bind to localhost only

The server:
  - Serves index.html and bitwrench assets as static files
  - Streams real-time system metrics via SSE at GET /events (every 2 s)
  - Exposes GPIO control:
      GET  /api/gpio         -- read all pin states
      POST /api/gpio/<pin>   -- set output pin HIGH/LOW  { "value": 0|1 }

When gpiod is unavailable (e.g. running on a laptop for development),
the server falls back to simulated GPIO state and logs a warning.
"""

import argparse
import json
import logging
import os
import platform
import socket
import time
import threading
from pathlib import Path

from flask import Flask, Response, jsonify, request, send_from_directory

import psutil

# ---------------------------------------------------------------------------
# GPIO setup -- graceful fallback when gpiod is not available
# ---------------------------------------------------------------------------

# Pin configuration matching the HTML dashboard
GPIO_CONFIG = [
    {"pin": 17, "label": "Status LED",    "mode": "OUT", "default": 0},
    {"pin": 27, "label": "Relay 1",       "mode": "OUT", "default": 0},
    {"pin": 22, "label": "Relay 2",       "mode": "OUT", "default": 0},
    {"pin": 23, "label": "Button",        "mode": "IN",  "default": 0},
    {"pin": 24, "label": "Motion Sensor", "mode": "IN",  "default": 0},
    {"pin": 25, "label": "Door Sensor",   "mode": "IN",  "default": 0},
]

OUTPUT_PINS = {g["pin"] for g in GPIO_CONFIG if g["mode"] == "OUT"}
INPUT_PINS  = {g["pin"] for g in GPIO_CONFIG if g["mode"] == "IN"}
ALL_PINS    = {g["pin"] for g in GPIO_CONFIG}

# gpiod handle (None when running without real hardware)
_gpio_chip = None
_gpio_lines = {}        # pin -> gpiod.Line
_simulated_gpio = {}    # pin -> int (fallback state)

logger = logging.getLogger("rpi-monitor")


def _init_gpio():
    """Try to open the GPIO chip via gpiod.  Fall back to simulation."""
    global _gpio_chip

    try:
        import gpiod  # type: ignore

        # Raspberry Pi 5 uses /dev/gpiochip4; Pi 3/4 use gpiochip0.
        # Try both in order of likelihood.
        chip_path = None
        for candidate in ("/dev/gpiochip4", "/dev/gpiochip0"):
            if os.path.exists(candidate):
                chip_path = candidate
                break

        if chip_path is None:
            raise FileNotFoundError("No GPIO chip device found")

        _gpio_chip = gpiod.Chip(chip_path)
        logger.info("Opened GPIO chip: %s", chip_path)

        for entry in GPIO_CONFIG:
            pin = entry["pin"]
            line = _gpio_chip.get_line(pin)
            if entry["mode"] == "OUT":
                line.request(
                    consumer="rpi-monitor",
                    type=gpiod.LINE_REQ_DIR_OUT,
                    default_vals=[entry["default"]],
                )
            else:
                line.request(
                    consumer="rpi-monitor",
                    type=gpiod.LINE_REQ_DIR_IN,
                )
            _gpio_lines[pin] = line
            logger.info("  GPIO %d (%s) configured as %s", pin, entry["label"], entry["mode"])

    except Exception as exc:
        logger.warning(
            "gpiod unavailable (%s) -- running in simulated GPIO mode", exc
        )
        _gpio_chip = None
        for entry in GPIO_CONFIG:
            _simulated_gpio[entry["pin"]] = entry["default"]


def gpio_read(pin):
    """Read the current value of a GPIO pin (0 or 1)."""
    if _gpio_chip is not None and pin in _gpio_lines:
        return _gpio_lines[pin].get_value()
    return _simulated_gpio.get(pin, 0)


def gpio_write(pin, value):
    """Set an output GPIO pin to HIGH (1) or LOW (0)."""
    value = 1 if value else 0
    if _gpio_chip is not None and pin in _gpio_lines:
        _gpio_lines[pin].set_value(value)
    else:
        _simulated_gpio[pin] = value


def gpio_read_all():
    """Return the full GPIO state list expected by the dashboard."""
    result = []
    for entry in GPIO_CONFIG:
        result.append({
            "pin":   entry["pin"],
            "label": entry["label"],
            "mode":  entry["mode"],
            "value": gpio_read(entry["pin"]),
        })
    return result


# ---------------------------------------------------------------------------
# System metrics collection
# ---------------------------------------------------------------------------

# Snapshot of previous network counters for computing rates
_prev_net = {"rx": 0, "tx": 0, "ts": 0.0}


def _read_cpu_temp():
    """Read CPU temperature in degrees Celsius."""
    # Primary: read directly from sysfs (works on all Raspberry Pi models)
    thermal_path = "/sys/class/thermal/thermal_zone0/temp"
    try:
        with open(thermal_path) as f:
            return int(f.read().strip()) / 1000.0
    except (FileNotFoundError, ValueError, PermissionError):
        pass

    # Fallback: psutil sensors (not always available)
    try:
        temps = psutil.sensors_temperatures()
        for name in ("cpu_thermal", "cpu-thermal", "coretemp"):
            if name in temps and temps[name]:
                return temps[name][0].current
    except Exception:
        pass

    return 0.0


def collect_system_metrics():
    """Gather a complete snapshot of system metrics."""
    global _prev_net

    # CPU
    cpu_temp = _read_cpu_temp()
    cpu_usage = psutil.cpu_percent(interval=None, percpu=True)
    load_avg = list(os.getloadavg())

    # Memory
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()

    # Disk
    disk = psutil.disk_usage("/")

    # Network rate calculation
    net = psutil.net_io_counters()
    now = time.monotonic()
    elapsed = now - _prev_net["ts"] if _prev_net["ts"] > 0 else 1.0
    elapsed = max(elapsed, 0.1)  # avoid division by zero
    net_rx_rate = int((net.bytes_recv - _prev_net["rx"]) / elapsed) if _prev_net["ts"] > 0 else 0
    net_tx_rate = int((net.bytes_sent - _prev_net["tx"]) / elapsed) if _prev_net["ts"] > 0 else 0
    _prev_net = {"rx": net.bytes_recv, "tx": net.bytes_sent, "ts": now}

    # Top processes (by CPU, up to 10)
    procs = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
        try:
            info = proc.info
            procs.append({
                "pid":  info["pid"],
                "name": info["name"] or "?",
                "cpu":  round(info["cpu_percent"] or 0.0, 1),
                "mem":  round((info["memory_info"].rss if info["memory_info"] else 0) / (1024 * 1024), 1),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    procs.sort(key=lambda p: p["cpu"], reverse=True)
    procs = procs[:10]

    # System identity
    uname = platform.uname()
    uptime_seconds = int(time.time() - psutil.boot_time())

    # Detect Raspberry Pi model
    model = _detect_rpi_model()

    return {
        "model":     model,
        "os":        "{} {}".format(uname.system, uname.release),
        "kernel":    uname.release,
        "hostname":  socket.gethostname(),
        "ip":        _get_local_ip(),
        "cpuTemp":   round(cpu_temp, 1),
        "cpuUsage":  [round(u, 1) for u in cpu_usage],
        "loadAvg":   [round(l, 2) for l in load_avg],
        "memTotal":  round(vm.total / (1024 * 1024)),
        "memUsed":   round(vm.used / (1024 * 1024)),
        "swapTotal": round(sw.total / (1024 * 1024)),
        "swapUsed":  round(sw.used / (1024 * 1024)),
        "diskTotal": round(disk.total / (1024 * 1024 * 1024)),
        "diskUsed":  round(disk.used / (1024 * 1024 * 1024), 1),
        "uptime":    uptime_seconds,
        "netRx":     max(net_rx_rate, 0),
        "netTx":     max(net_tx_rate, 0),
        "processes": procs,
        "gpio":      gpio_read_all(),
    }


def _detect_rpi_model():
    """Attempt to read the Raspberry Pi model string from /proc/device-tree."""
    try:
        with open("/proc/device-tree/model") as f:
            return f.read().strip().rstrip("\x00")
    except (FileNotFoundError, PermissionError):
        return platform.machine() or "Unknown"


def _get_local_ip():
    """Best-effort determination of the primary LAN IP address."""
    try:
        # This does not actually send traffic; it discovers the default route IP.
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ---------------------------------------------------------------------------
# Flask application
# ---------------------------------------------------------------------------

# Resolve paths.  This file lives in examples/embedded-rpi/.
# The bitwrench dist folder is at ../../dist/ relative to this script.
_THIS_DIR  = Path(__file__).resolve().parent
_DIST_DIR  = (_THIS_DIR / ".." / ".." / "dist").resolve()

app = Flask(__name__, static_folder=None)  # disable default static handler


# -- Static file serving ----------------------------------------------------

@app.route("/")
def index():
    """Serve the dashboard HTML."""
    return send_from_directory(str(_THIS_DIR), "index.html")


@app.route("/dist/<path:filename>")
def dist_files(filename):
    """Serve bitwrench distribution files."""
    return send_from_directory(str(_DIST_DIR), filename)


@app.route("/<path:filename>")
def static_files(filename):
    """Serve any other static files from the example directory."""
    return send_from_directory(str(_THIS_DIR), filename)


# -- SSE endpoint -----------------------------------------------------------

@app.route("/events")
def events():
    """
    Server-Sent Events stream.

    Pushes a full system metrics snapshot every 2 seconds.  The client
    connects with:
        var es = new EventSource('/events');
        es.onmessage = function(e) { var data = JSON.parse(e.data); ... };
    """

    def generate():
        # Initial cpu_percent call primes psutil (first call always returns 0).
        psutil.cpu_percent(interval=None, percpu=True)

        while True:
            data = collect_system_metrics()
            payload = "data: {}\n\n".format(json.dumps(data, separators=(",", ":")))
            yield payload
            time.sleep(2)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable nginx buffering if proxied
        },
    )


# -- GPIO REST API ----------------------------------------------------------

@app.route("/api/gpio", methods=["GET"])
def api_gpio_read():
    """Return current state of all GPIO pins."""
    return jsonify(gpio_read_all())


@app.route("/api/gpio/<int:pin>", methods=["POST"])
def api_gpio_write(pin):
    """
    Set an output GPIO pin.

    Request body (JSON):  { "value": 0 }  or  { "value": 1 }
    """
    if pin not in ALL_PINS:
        return jsonify({"error": "Unknown GPIO pin: {}".format(pin)}), 404

    if pin not in OUTPUT_PINS:
        return jsonify({"error": "GPIO {} is an input pin and cannot be written".format(pin)}), 400

    body = request.get_json(silent=True)
    if body is None or "value" not in body:
        return jsonify({"error": "Request body must be JSON with a 'value' key (0 or 1)"}), 400

    value = int(bool(body["value"]))
    gpio_write(pin, value)

    # Find the label for the log message
    label = next((g["label"] for g in GPIO_CONFIG if g["pin"] == pin), "?")
    logger.info("GPIO %d (%s) set to %s", pin, label, "HIGH" if value else "LOW")

    return jsonify({"pin": pin, "label": label, "value": value})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Raspberry Pi System Monitor server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8080, help="Port (default: 8080)")
    parser.add_argument("--debug", action="store_true", help="Enable Flask debug mode")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    _init_gpio()

    # Prime psutil cpu_percent (first call always returns 0.0)
    psutil.cpu_percent(interval=None, percpu=True)

    logger.info(
        "Starting Raspberry Pi Monitor on http://%s:%d",
        args.host if args.host != "0.0.0.0" else _get_local_ip(),
        args.port,
    )
    logger.info("Dashboard:  index.html served from %s", _THIS_DIR)
    logger.info("Bitwrench:  dist files served from %s", _DIST_DIR)

    if _gpio_chip is None:
        logger.warning("GPIO is SIMULATED -- no real hardware control")

    # threaded=True allows multiple SSE clients and API calls concurrently
    app.run(host=args.host, port=args.port, debug=args.debug, threaded=True)


if __name__ == "__main__":
    main()
