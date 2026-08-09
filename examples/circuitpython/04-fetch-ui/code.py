# bitwrench on CircuitPython -- 4: the device owns the page
#
# So far the UI was baked into the page at request time. Now the page is a fixed
# shell that asks the device for its UI:
#
#     GET  /          -> the shell (never changes)
#     GET  /ui.json   -> the UI, as JSON
#
# The shell is now genuinely static, so it can be cached, and the device can
# change what the page shows without the page changing at all.
#
# Note this is still PULL: the browser asks. The device cannot yet update the
# page on its own -- that arrives in example 6.
#
# Live values here come from the board itself, so nothing needs wiring up.

import json
try:
    import bw_board
except ImportError:
    # On a board, bw_board.py sits next to code.py and the import above works.
    # On a desktop this file lives in a subfolder, so add its parent and retry.
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    import bw_board
try:
    from adafruit_httpserver import Server, Request, Response, FileResponse, JSONResponse
except ImportError:
    raise SystemExit(
        "\n  adafruit_httpserver is not installed.\n"
        "\n  Easiest:  ../run.sh 5        (sets up a virtualenv for you)"
        "\n  Or:       pip install adafruit-circuitpython-httpserver"
        "\n  On a board:  circup install adafruit_httpserver\n"
    )


SHELL = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>bitwrench on CircuitPython</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
<script src="/js/bitwrench.js"></script>
<div id=app></div>
<script>
bw.loadStyles({ primary: '#2563eb' });

// The shell no longer contains any UI -- it asks the device for it.
function refresh() {
  fetch('/ui.json')
    .then(function (r) { return r.json(); })
    .then(function (taco) { bw.DOM('#app', taco); });
}
refresh();
setInterval(refresh, 5000);
</script>
"""


def build_ui():
    return {
        "t": "div",
        "a": {"class": "bw_bccl_container"},
        "c": [
            {"t": "h1", "c": "Device status"},
            {
                "t": "p",
                "a": {"class": "bw_text_muted"},
                "c": "Refreshes every 5 seconds. The page never changes -- only this data does.",
            },
            {
                "t": "div",
                "a": {"class": "bw_bccl_row bw_row"},
                "c": [
                    _stat("Uptime", bw_board.uptime()),
                    _stat("Free memory", bw_board.mem_free()),
                    _stat("Signal", bw_board.signal()),
                ],
            },
        ],
    }


def _stat(label, value):
    return {
        "t": "div",
        "a": {"class": "bw_bccl_col bw_col"},
        "c": [
            {"t": "div", "a": {"class": "bw_text_muted"}, "c": label},
            {"t": "strong", "c": value},
        ],
    }


pool, host, port = bw_board.start(
    "4 - the device owns the page",
    serving="bitwrench.umd.min.js.gz from %s" % bw_board.WWW,
)
server = Server(pool, "/static", debug=True)


@server.route("/")
def index(request: Request):
    return Response(request, SHELL, content_type="text/html")


@server.route("/ui.json")
def ui(request: Request):
    return JSONResponse(request, build_ui())


@server.route("/js/bitwrench.js")
def bitwrench_js(request: Request):
    return FileResponse(
        request,
        "bitwrench.umd.min.js.gz",
        bw_board.WWW,
        headers={"Content-Encoding": "gzip"},
        content_type="text/javascript",
    )


print("  shell size: %d bytes (fixed)" % len(SHELL))
print("  ui.json   : %d bytes (changes)" % len(json.dumps(build_ui())))
server.serve_forever(host, port)
