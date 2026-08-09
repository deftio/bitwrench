# bitwrench on CircuitPython -- 3: Python composes the UI
#
# So far the UI has been written as JavaScript inside the page. Here the UI is a
# Python dict, and json.dumps() turns it into the same thing.
#
# That is the whole idea: a TACO is a dict. There is no template engine, no
# helper library, and nothing to install on the device.
#
# This example also stops using the CDN. bitwrench now lives on the device, so
# the page works with no internet at all -- which matters for anything that
# configures a device before it has a network.
#
# Setup adds one step to the earlier examples:
#   4. Copy dist/bitwrench.umd.min.js.gz to /www/ on the CIRCUITPY drive
#      (44.8KB gzipped -- see README for where to get it)

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
    from adafruit_httpserver import Server, Request, Response, FileResponse
except ImportError:
    raise SystemExit(
        "\n  adafruit_httpserver is not installed.\n"
        "\n  Easiest:  ../run.sh 4        (sets up a virtualenv for you)"
        "\n  Or:       pip install adafruit-circuitpython-httpserver"
        "\n  On a board:  circup install adafruit_httpserver\n"
    )

# Compare with example 2: the only change is the URL. CDN and local delivery
# are interchangeable.
BITWRENCH = '<script src="/js/bitwrench.js"></script>'

SHELL = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>bitwrench on CircuitPython</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
{{BITWRENCH}}
<div id=app></div>
<script>
bw.loadStyles({ primary: '#2563eb' });
bw.DOM('#app', {{UI}});
</script>
"""


def build_ui():
    """Return the UI as a plain Python structure.

    Every value here could come from a sensor, a config file, or a pin. That is
    the point of moving it out of the page.
    """
    return {
        "t": "div",
        "a": {"class": "bw_bccl_container"},
        "c": [
            {"t": "h1", "c": "Composed in Python"},
            {
                "t": "p",
                "c": "This tree was a dict a few milliseconds ago.",
            },
            {
                "t": "div",
                "a": {"class": "bw_bccl_row bw_row"},
                "c": [
                    _stat("Language", "Python"),
                    _stat("Transport", "one HTTP GET"),
                    _stat("Templates", "none"),
                ],
            },
        ],
    }


def _stat(label, value):
    """A small reusable piece. Composition is just building dicts."""
    return {
        "t": "div",
        "a": {"class": "bw_bccl_col bw_col"},
        "c": [
            {"t": "div", "a": {"class": "bw_text_muted"}, "c": label},
            {"t": "strong", "c": value},
        ],
    }


pool, host, port = bw_board.start(
    "3 - Python composes the UI",
    serving="bitwrench.umd.min.js.gz from %s" % bw_board.WWW,
)
server = Server(pool, "/static", debug=True)


@server.route("/")
def index(request: Request):
    page = (SHELL.replace("{{BITWRENCH}}", BITWRENCH)
                 .replace("{{UI}}", json.dumps(build_ui())))
    return Response(request, page, content_type="text/html")


@server.route("/js/bitwrench.js")
def bitwrench_js(request: Request):
    # FileResponse streams from disk in small chunks, so the 45KB library never
    # sits in RAM. Serving it as a Python string would, and on a board without
    # PSRAM that is enough to run out of memory.
    return FileResponse(
        request,
        "bitwrench.umd.min.js.gz",
        bw_board.WWW,
        headers={"Content-Encoding": "gzip"},
        content_type="text/javascript",
    )


server.serve_forever(host, port)
