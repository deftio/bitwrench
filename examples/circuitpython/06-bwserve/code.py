# bitwrench on CircuitPython -- 6: the device pushes
#
# Example 4 could only refresh because the browser asked. Example 5 had to
# refetch the entire page after every save. Both are the same limitation: the
# device cannot say anything unless spoken to.
#
# Server-Sent Events fix that. The browser opens one long-lived connection and
# the device sends updates whenever it likes -- and it sends *patches*, not whole
# pages, so a changing value costs a few dozen bytes instead of a full re-render.
#
# This is the first example that uses bwserve.py. Examples 1-4 needed nothing but
# json.dumps, because a TACO is a dict. Here there is a real protocol -- message
# types, client tracking, framing -- and that is what bwserve.py is for.
#
# Extra setup step:
#   5. Copy embedded_python/bwserve.py to /lib/ on the CIRCUITPY drive

import json
import time
try:
    import bw_board
except ImportError:
    # On a board, bw_board.py sits next to code.py and the import above works.
    # On a desktop this file lives in a subfolder, so add its parent and retry.
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    import bw_board

try:
    import bwserve
except ImportError:
    # On a board bwserve.py is copied into /lib. From the repo it lives in
    # embedded_python/, three levels up from this file.
    import sys, os
    _here = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, os.path.join(_here, "..", "..", "..", "embedded_python"))
    import bwserve
try:
    from adafruit_httpserver import Server, Request, Response, FileResponse, SSEResponse
except ImportError:
    raise SystemExit(
        "\n  adafruit_httpserver is not installed.\n"
        "\n  Easiest:  ../run.sh 7        (sets up a virtualenv for you)"
        "\n  Or:       pip install adafruit-circuitpython-httpserver"
        "\n  On a board:  circup install adafruit_httpserver\n"
    )

PUSH_INTERVAL = 2          # seconds

SHELL = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>bitwrench on CircuitPython</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
<script src="/js/bitwrench.js"></script>
<div id=app></div>
<script>
bw.loadStyles({ primary: '#2563eb' });

// The layout is sent once. After that the device only sends patches, which
// target these ids -- so the page is never rebuilt.
fetch('/ui.json').then(function (r) { return r.json(); })
                 .then(function (t) {
  bw.DOM('#app', t);
  new EventSource('/events').onmessage = function (e) {
    bw.apply(JSON.parse(e.data));      // bw.apply understands the bwserve protocol
  };
});
</script>
"""


def build_ui():
    """Sent once. Values are placeholders -- the device patches them by id."""
    return {
        "t": "div",
        "a": {"class": "bw_bccl_container"},
        "c": [
            {"t": "h1", "c": "Live device status"},
            {
                "t": "p",
                "a": {"class": "bw_text_muted"},
                "c": "Pushed by the device every %d seconds. No polling, no reloads."
                     % PUSH_INTERVAL,
            },
            {
                "t": "div",
                "a": {"class": "bw_bccl_row bw_row"},
                "c": [
                    _stat("uptime", "Uptime"),
                    _stat("mem", "Free memory"),
                    _stat("rssi", "Signal"),
                ],
            },
        ],
    }


def _stat(ref, label):
    # The id is the address the device patches later.
    return {
        "t": "div",
        "a": {"class": "bw_bccl_col bw_col"},
        "c": [
            {"t": "div", "a": {"class": "bw_text_muted"}, "c": label},
            {"t": "strong", "a": {"id": ref}, "c": "--"},
        ],
    }


def readings():
    return bw_board.uptime(), bw_board.mem_free(), bw_board.signal()


pool, host, port = bw_board.start(
    "6 - the device pushes",
    serving="bitwrench.umd.min.js.gz from %s" % bw_board.WWW,
)
server = Server(pool, "/static", debug=True)

connections = []


@server.route("/")
def index(request: Request):
    return Response(request, SHELL, content_type="text/html")


@server.route("/ui.json")
def ui(request: Request):
    return Response(request, json.dumps(build_ui()), content_type="application/json")


@server.route("/events")
def events(request: Request):
    sse = SSEResponse(request)
    connections.append(sse)
    print("  client connected (%d open)" % len(connections))
    return sse


@server.route("/js/bitwrench.js")
def bitwrench_js(request: Request):
    return FileResponse(
        request,
        "bitwrench.umd.min.js.gz",
        bw_board.WWW,
        headers={"Content-Encoding": "gzip"},
        content_type="text/javascript",
    )


def push():
    """One batch of patches to every connected browser."""
    uptime, mem, rssi = readings()
    msg = bwserve.batch(
        bwserve.patch("uptime", uptime),
        bwserve.patch("mem", mem),
        bwserve.patch("rssi", rssi),
    )
    payload = json.dumps(msg)

    dead = []
    for sse in connections:
        try:
            sse.send_event(payload)
        except Exception:                 # noqa: BLE001 - client went away
            dead.append(sse)
    for d in dead:
        connections.remove(d)
    if dead:
        print("  %d client(s) disconnected (%d open)" % (len(dead), len(connections)))


# Non-blocking: poll() handles requests, and we push on our own schedule.
server.start(host, port)
next_push = time.monotonic()

while True:
    server.poll()
    now = time.monotonic()
    if now >= next_push:
        next_push = now + PUSH_INTERVAL
        if connections:
            push()
