# bw_board.py -- shared setup for every bitwrench example.
#
# Runs in two places, unchanged:
#
#   On a board (CircuitPython)  copy this next to code.py on CIRCUITPY.
#                               WiFi is connected by CircuitPython itself from
#                               settings.toml, before code.py runs.
#
#   On your computer (CPython)  pip install adafruit-circuitpython-httpserver
#                               python code.py    -> http://127.0.0.1:8085
#
# Being able to run an example on a laptop first means you can get the UI right
# without a reflash cycle, then move the identical file to the board.

import time

try:                                   # ---- on a board ----
    import wifi
    import socketpool
    ON_DEVICE = True
except ImportError:                    # ---- on a desktop ----
    import socket as _socket
    wifi = None
    ON_DEVICE = False

try:
    import mdns
except ImportError:
    mdns = None

try:
    # Note: on a desktop `board` may be installed (Blinka) yet raise
    # NotImplementedError because there is no real board to detect -- so catch
    # more than ImportError here.
    import board
    BOARD_ID = getattr(board, "board_id", "unknown board")
except Exception:                      # noqa: BLE001 - identification only
    import platform
    BOARD_ID = "%s %s (desktop)" % (platform.system(), platform.machine())

# Where bitwrench.umd.min.js.gz lives. On a board that is the drive root; on a
# desktop it is a folder beside the example, so the same code.py works in both.
if ON_DEVICE:
    WWW = "/www"                       # CIRCUITPY drive root
else:
    import os as _os                   # beside this file, whatever the cwd is
    WWW = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "www")

_BOOT = time.monotonic()


def uptime():
    """Seconds since import, formatted. Works everywhere."""
    s = int(time.monotonic() - _BOOT)
    return "%dh %02dm %02ds" % (s // 3600, (s % 3600) // 60, s % 60)


def mem_free():
    """Free memory as a display string, or 'n/a' where it is not measurable."""
    try:
        import gc
        return "%d bytes" % gc.mem_free()      # CircuitPython / MicroPython
    except (ImportError, AttributeError):
        return "n/a (desktop)"                 # CPython has no mem_free


def signal():
    """WiFi signal strength as a display string."""
    if not ON_DEVICE or wifi is None:
        return "n/a (desktop)"
    info = wifi.radio.ap_info
    return ("%d dBm" % info.rssi) if info else "n/a"


def _desktop_ip():
    """Best guess at this machine's LAN address, so phones can reach it too."""
    s = _socket.socket(_socket.AF_INET, _socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 1))          # no packets sent; just picks a route
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def start(example, hostname="bitwrench", serving=None):
    """Return (pool, host, port) ready for Server, and print how to reach us."""
    local_name = None

    if ON_DEVICE:
        ip = wifi.radio.ipv4_address
        if ip is None:
            raise RuntimeError(
                "No IP address. CircuitPython connects WiFi before code.py runs, "
                "so this usually means settings.toml is missing or has the wrong "
                "CIRCUITPY_WIFI_SSID / CIRCUITPY_WIFI_PASSWORD."
            )
        ip, port, pool = str(ip), 80, socketpool.SocketPool(wifi.radio)
        bind = ip
        network = wifi.radio.ap_info.ssid if wifi.radio.ap_info else "?"

        # .local is friendlier than an IP, but it does not resolve on some
        # corporate networks or older Android clients -- so print both.
        if mdns is not None:
            try:
                srv = mdns.Server(wifi.radio)
                srv.hostname = hostname
                srv.advertise_service(service_type="_http", protocol="_tcp", port=80)
                local_name = hostname + ".local"
            except Exception as e:              # informational only
                print("  (mdns unavailable: %s)" % e)
    else:
        # Port 80 needs root on a desktop; 8085 does not (and is quieter than 8080,
        # which half the dev tools on a machine already want). Bind every interface
        # so both localhost and the LAN address work -- the latter lets you open
        # the page on a phone, which is the closest thing to testing on a board.
        ip, port, pool, network = _desktop_ip(), 8085, _socket, "desktop"
        bind = "0.0.0.0"

    print("")
    print("bitwrench example -- %s" % example)
    print("  board    : %s" % BOARD_ID)
    print("  network  : %s" % network)
    if local_name:
        print("  open     : http://%s" % local_name)
        print("             http://%s" % ip)
    else:
        print("  open     : http://%s:%d" % (ip, port) if port != 80
              else "  open     : http://%s" % ip)
    if serving:
        print("  serving  : %s" % serving)
    print("")

    return pool, bind, port
