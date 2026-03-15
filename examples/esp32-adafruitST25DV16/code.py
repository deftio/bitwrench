"""
NFC Tag Scanner Web App
=======================
Runs on Adafruit QT Py ESP32 (S2/S3/C3) with ST25DV16K attached via I2C.
Serves a web UI on the local LAN using bitwrench.js for display.
Browse to the printed IP address to see scanned NFC tags.

bitwrench.js is served locally from a pre-gzipped file (~40KB) so the
app works without internet access.
"""

import os
import time
import json
import board
import busio
import socketpool
import wifi
import microcontroller
from adafruit_httpserver import Server, Request, Response, FileResponse

from st25dv16 import ST25DV16

# ---- WiFi connection ----
# CircuitPython auto-connects using settings.toml credentials.
# Don't call wifi.radio.connect() again - it can disrupt the connection.

ip_addr = str(wifi.radio.ipv4_address)
if ip_addr == "0.0.0.0":
    print("WiFi not connected! Check settings.toml")
else:
    print("WiFi connected - IP: {}".format(ip_addr))
    print("Open http://{}:8100 in your browser".format(ip_addr))

# ---- I2C + ST25DV16 setup ----

i2c = busio.I2C(board.SCL, board.SDA, frequency=400000)
nfc = ST25DV16(i2c)

# Scan the bus so the user can see what's actually there
addrs = nfc.scan_bus()
if addrs:
    print("I2C devices found: {}".format(
        ", ".join("0x{:02X}".format(a) for a in addrs)))
else:
    print("No I2C devices found! Check wiring/cable.")

tag_info = None
if nfc.connected:
    try:
        tag_info = nfc.get_tag_info()
        print("ST25DV16 UID: {}".format(tag_info["uid"]))
        print("Memory: {} bytes".format(tag_info["memory_bytes"]))
    except OSError as e:
        print("ST25DV16 found but read failed: {}".format(e))
        nfc.connected = False
else:
    print("ST25DV16 not found at 0x53 - will keep retrying")
    print("Web server will still start.")

# ---- Application state ----

MAX_HISTORY = 50
scan_history = []
scan_count = 0
last_scan_time = 0
boot_time = time.monotonic()
current_ndef = []
last_rf_event = None
# Monotonically increasing version counter - browser uses this to detect
# when NDEF records or history have changed and a full re-render is needed.
ndef_version = 0


def do_scan():
    """Perform an NFC memory scan and update state."""
    global current_ndef, scan_count, last_scan_time, last_rf_event, ndef_version

    if not nfc.connected:
        return {"error": "NFC tag not connected"}

    try:
        records = nfc.read_ndef_records()
        it_sts = nfc.read_interrupt_status()
        eh = nfc.read_eh_status()

        # Check if NDEF content actually changed
        if records != current_ndef:
            ndef_version += 1
        current_ndef = records

        now = time.monotonic()
        uptime = now - boot_time

        scan_result = {
            "timestamp": uptime,
            "time_str": format_uptime(uptime),
            "records": records,
            "record_count": len(records),
            "interrupts": it_sts,
            "energy_harvest": eh,
        }

        has_rf = it_sts["rf_activity"] or it_sts["field_rising"] or it_sts["rf_write"]
        if has_rf or (len(records) > 0 and scan_count == 0):
            scan_count += 1
            last_scan_time = uptime
            ndef_version += 1
            scan_result["scan_number"] = scan_count
            scan_history.append(scan_result)
            if len(scan_history) > MAX_HISTORY:
                scan_history.pop(0)
            last_rf_event = scan_result

        return scan_result
    except OSError as e:
        print("I2C error during scan: {}".format(e))
        return {"error": str(e)}


def format_uptime(seconds):
    """Format seconds into human-readable uptime."""
    s = int(seconds)
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    if h > 0:
        return "{}h {:02d}m {:02d}s".format(h, m, sec)
    elif m > 0:
        return "{}m {:02d}s".format(m, sec)
    else:
        return "{}s".format(sec)


def build_patches_json():
    """Build a bwserve-compatible batch of patch operations for live-updating
    elements. The browser applies these with bw.clientApply() - no full
    DOM re-render needed."""
    uptime = time.monotonic() - boot_time

    it_sts = {"raw": 0, "rf_activity": False, "field_rising": False,
              "field_falling": False, "rf_write": False,
              "rf_put_msg": False, "rf_get_msg": False}
    eh = {"raw": 0, "eh_on": False, "field_on": False, "vcc_on": False}
    mb = {"raw": 0, "mb_enabled": False, "host_put_msg": False, "rf_put_msg": False}

    if nfc.connected:
        try:
            it_sts = nfc.read_interrupt_status()
            eh = nfc.read_eh_status()
            mb = nfc.read_mailbox_status()
        except OSError:
            pass

    cpu_temp = round(microcontroller.cpu.temperature, 1)
    uptime_str = format_uptime(uptime)
    last_scan_str = format_uptime(last_scan_time) if last_scan_time else "never"

    # Build bwserve-compatible patch ops for all live-updating elements
    ops = [
        # Stat cards
        {"type": "patch", "target": "stat-scans", "content": str(scan_count)},
        {"type": "patch", "target": "stat-records", "content": str(len(current_ndef))},
        {"type": "patch", "target": "stat-rf", "content": "Active" if eh["field_on"] else "None"},
        {"type": "patch", "target": "stat-uptime", "content": uptime_str},
        # Live panel values
        {"type": "patch", "target": "live-rf-activity", "content": "YES" if it_sts["rf_activity"] else "no"},
        {"type": "patch", "target": "live-field-rising", "content": "YES" if it_sts["field_rising"] else "no"},
        {"type": "patch", "target": "live-field-falling", "content": "YES" if it_sts["field_falling"] else "no"},
        {"type": "patch", "target": "live-rf-write", "content": "YES" if it_sts["rf_write"] else "no"},
        {"type": "patch", "target": "live-rf-put", "content": "YES" if it_sts["rf_put_msg"] else "no"},
        {"type": "patch", "target": "live-rf-get", "content": "YES" if it_sts["rf_get_msg"] else "no"},
        {"type": "patch", "target": "live-eh", "content": "Active" if eh["eh_on"] else "Off"},
        {"type": "patch", "target": "live-field", "content": "Yes" if eh["field_on"] else "No"},
        {"type": "patch", "target": "live-vcc", "content": "Yes" if eh["vcc_on"] else "No"},
        {"type": "patch", "target": "live-mb-en", "content": "Yes" if mb["mb_enabled"] else "No"},
        {"type": "patch", "target": "live-mb-host", "content": "Yes" if mb["host_put_msg"] else "No"},
        {"type": "patch", "target": "live-mb-rf", "content": "Yes" if mb["rf_put_msg"] else "No"},
        # System stats
        {"type": "patch", "target": "sys-temp", "content": str(cpu_temp) + "\u00b0C"},
        {"type": "patch", "target": "sys-ip", "content": ip_addr},
        {"type": "patch", "target": "sys-lastscan", "content": last_scan_str},
        {"type": "patch", "target": "sys-history", "content": str(len(scan_history))},
        {"type": "patch", "target": "sys-nfc", "content": "Connected" if nfc.connected else "Not found"},
    ]

    return {
        "type": "batch",
        "ops": ops,
        "ndef_version": ndef_version,
        "scan_count": scan_count,
        "nfc_connected": nfc.connected,
    }


def build_status_json():
    """Build full status JSON (used for initial load and when ndef_version changes)."""
    uptime = time.monotonic() - boot_time

    it_sts = {"raw": 0}
    eh = {"raw": 0}
    mb = {"raw": 0}

    if nfc.connected:
        try:
            it_sts = nfc.read_interrupt_status()
            eh = nfc.read_eh_status()
            mb = nfc.read_mailbox_status()
        except OSError:
            pass

    tag_data = None
    if tag_info:
        tag_data = {
            "uid": tag_info["uid"],
            "memory_bytes": tag_info["memory_bytes"],
            "ic_ref": tag_info["ic_ref"],
            "ic_rev": tag_info["ic_rev"],
            "cc": tag_info["cc"],
        }

    return {
        "tag": tag_data,
        "nfc_connected": nfc.connected,
        "live": {
            "interrupts": it_sts,
            "energy_harvest": eh,
            "mailbox": mb,
        },
        "ndef": current_ndef,
        "ndef_version": ndef_version,
        "stats": {
            "scan_count": scan_count,
            "uptime": format_uptime(uptime),
            "uptime_sec": int(uptime),
            "last_scan": format_uptime(last_scan_time) if last_scan_time else "never",
            "cpu_temp_c": round(microcontroller.cpu.temperature, 1),
            "ip": ip_addr,
            "history_size": len(scan_history),
            "nfc_connected": nfc.connected,
        },
        "history": scan_history[-20:],
    }


def build_raw_memory_json(start, length):
    """Read raw memory and return as JSON."""
    if not nfc.connected:
        return {"error": "NFC tag not connected"}
    try:
        raw = nfc.read_raw_memory(start, min(length, 256))
        return raw
    except OSError as e:
        return {"error": str(e)}


# ---- HTTP server ----

pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, "/static", debug=True)


@server.route("/")
def index(request: Request):
    """Serve the main HTML page."""
    print(">> Request: /")
    return FileResponse(request, "index.html", "/static")


@server.route("/test")
def test_page(request: Request):
    """Plain text test - no files, no JS."""
    print(">> Request: /test")
    return Response(request, "OK - server is working", content_type="text/plain")


@server.route("/bitwrench.js")
def serve_bitwrench(request: Request):
    """Serve pre-gzipped bitwrench.js with Content-Encoding: gzip.
    The browser transparently decompresses it. ~40KB transfer."""
    return FileResponse(
        request,
        filename="bitwrench.umd.min.js.gz",
        root_path="/static",
        content_type="application/javascript",
        headers={"Content-Encoding": "gzip"},
    )


@server.route("/api/patches")
def api_patches(request: Request):
    """Return bwserve-compatible patch ops for live-updating elements.
    Lightweight alternative to /api/status - only sends changed values,
    browser applies with bw.clientApply(). Also returns ndef_version so
    the browser knows when to do a full re-fetch."""
    data = build_patches_json()
    return Response(request, json.dumps(data), content_type="application/json")


@server.route("/api/status")
def api_status(request: Request):
    """Return full device and scan status as JSON.
    Used for initial page load and when ndef_version changes."""
    data = build_status_json()
    return Response(request, json.dumps(data), content_type="application/json")


@server.route("/api/scan")
def api_scan(request: Request):
    """Trigger a scan and return results."""
    result = do_scan()
    return Response(request, json.dumps(result), content_type="application/json")


@server.route("/api/ndef")
def api_ndef(request: Request):
    """Return current NDEF records."""
    if not nfc.connected:
        return Response(request, json.dumps({"error": "NFC not connected"}),
                        content_type="application/json")
    try:
        records = nfc.read_ndef_records()
        return Response(request, json.dumps(records), content_type="application/json")
    except OSError as e:
        return Response(
            request,
            json.dumps({"error": str(e)}),
            content_type="application/json",
        )


@server.route("/api/raw")
def api_raw(request: Request):
    """Read raw memory. Query params: start=0&length=64"""
    start = 0
    length = 64
    if "?" in request.path:
        qs = request.path.split("?", 1)[1]
        for pair in qs.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                if k == "start":
                    start = int(v)
                elif k == "length":
                    length = int(v)
    data = build_raw_memory_json(start, length)
    return Response(request, json.dumps(data), content_type="application/json")


@server.route("/api/tag")
def api_tag(request: Request):
    """Return tag identity info."""
    data = tag_info if tag_info else {"error": "NFC not connected"}
    return Response(request, json.dumps(data), content_type="application/json")


# ---- Main loop ----

server.start(str(wifi.radio.ipv4_address), 8100)
print("Server started on http://{}:8100".format(ip_addr))

RF_POLL_INTERVAL = 2.0
NFC_RETRY_INTERVAL = 5.0
last_rf_poll = time.monotonic()
last_nfc_retry = time.monotonic()

while True:
    try:
        server.poll()
    except OSError as e:
        print("Server error: {}".format(e))
        continue

    now = time.monotonic()

    if not nfc.connected:
        if now - last_nfc_retry >= NFC_RETRY_INTERVAL:
            last_nfc_retry = now
            if nfc.try_reconnect():
                print("ST25DV16 connected!")
                try:
                    tag_info = nfc.get_tag_info()
                    print("UID: {}".format(tag_info["uid"]))
                except OSError as e:
                    print("Tag read failed: {}".format(e))
                    nfc.connected = False
    elif now - last_rf_poll >= RF_POLL_INTERVAL:
        last_rf_poll = now
        try:
            it_sts = nfc.read_interrupt_status()
            if it_sts["raw"] != 0:
                print("RF event: 0x{:02X}".format(it_sts["raw"]))
                do_scan()
        except OSError:
            pass
