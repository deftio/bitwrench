# bitwrench on CircuitPython -- 5: input comes back
#
# Everything so far went one way: device -> browser. Now the browser sends
# something back.
#
#     GET  /          -> the shell
#     GET  /ui.json   -> the UI
#     POST /set       -> the browser sends values; the device stores them
#
# This is a device settings page, which is the shape of most real embedded UI:
# a name, a mode, a threshold, and a Save button.
#
# It is deliberately clunky. After a save the whole page refetches, because the
# device has no way to tell the browser what changed. Example 6 fixes that -- and
# the clunkiness here is what makes the fix worth having.

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
    from adafruit_httpserver import Server, Request, Response, FileResponse, JSONResponse, POST
except ImportError:
    raise SystemExit(
        "\n  adafruit_httpserver is not installed.\n"
        "\n  Easiest:  ../run.sh 6        (sets up a virtualenv for you)"
        "\n  Or:       pip install adafruit-circuitpython-httpserver"
        "\n  On a board:  circup install adafruit_httpserver\n"
    )

# The device's state. In a real product this would be persisted; on CIRCUITPY
# the filesystem is read-only to code by default, so we keep it in memory.
settings = {
    "name": "sensor-01",
    "mode": "balanced",
    "threshold": 40,
}

SHELL = """<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>bitwrench on CircuitPython</title>
<link rel=icon href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%232563eb'/></svg>">
<script src="/js/bitwrench.js"></script>
<div id=app></div>
<script>
bw.loadStyles({ primary: '#2563eb' });

function refresh() {
  fetch('/ui.json').then(function (r) { return r.json(); })
                   .then(function (t) { bw.DOM('#app', t); });
}

// One handler for the whole form. bitwrench put the values in the DOM; we read
// them back the ordinary way and post them.
window.save = function () {
  var body = new URLSearchParams();
  ['name', 'mode', 'threshold'].forEach(function (k) {
    body.append(k, document.getElementById(k).value);
  });
  fetch('/set', { method: 'POST', body: body })
    .then(refresh);           // <- the clunky part: refetch everything
};

refresh();
</script>
"""


def build_ui():
    return {
        "t": "div",
        "a": {"class": "bw_bccl_container"},
        "c": [
            {"t": "h1", "c": "Device settings"},
            {
                "t": "p",
                "a": {"class": "bw_text_muted"},
                "c": "Saved on the device. Change something and press Save.",
            },
            _field("name", "Device name", {"t": "input", "a": {
                "id": "name", "class": "bw_bccl_form_control", "value": settings["name"]}}),
            _field("mode", "Mode", {
                "t": "select",
                "a": {"id": "mode", "class": "bw_bccl_form_control"},
                "c": [
                    {"t": "option",
                     "a": _selected(m, settings["mode"]),
                     "c": m}
                    for m in ("eco", "balanced", "performance")
                ],
            }),
            _field("threshold", "Threshold", {"t": "input", "a": {
                "id": "threshold", "class": "bw_bccl_form_control",
                "type": "number", "value": str(settings["threshold"])}}),
            {"t": "button",
             "a": {"class": "bw_bccl_btn bw_primary", "onclick": "save()"},
             "c": "Save"},
            {"t": "pre",
             "a": {"class": "bw_code"},
             "c": "on device: " + json.dumps(settings)},
        ],
    }


def _selected(value, current):
    a = {"value": value}
    if value == current:
        a["selected"] = "selected"
    return a


def _field(field_id, label, control):
    return {
        "t": "div",
        "a": {"class": "bw_bccl_form_group"},
        "c": [{"t": "label", "a": {"for": field_id}, "c": label}, control],
    }


pool, host, port = bw_board.start(
    "5 - input comes back",
    serving="bitwrench.umd.min.js.gz from %s" % bw_board.WWW,
)
server = Server(pool, "/static", debug=True)


@server.route("/")
def index(request: Request):
    return Response(request, SHELL, content_type="text/html")


@server.route("/ui.json")
def ui(request: Request):
    return JSONResponse(request, build_ui())


@server.route("/set", POST)
def set_settings(request: Request):
    form = request.form_data
    settings["name"] = form.get("name", settings["name"])
    settings["mode"] = form.get("mode", settings["mode"])
    try:
        settings["threshold"] = int(form.get("threshold", settings["threshold"]))
    except ValueError:
        pass                      # keep the old value rather than crash the server
    print("  saved:", settings)
    return JSONResponse(request, {"ok": True})


@server.route("/js/bitwrench.js")
def bitwrench_js(request: Request):
    return FileResponse(
        request,
        "bitwrench.umd.min.js.gz",
        bw_board.WWW,
        headers={"Content-Encoding": "gzip"},
        content_type="text/javascript",
    )


server.serve_forever(host, port)
