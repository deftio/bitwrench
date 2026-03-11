"""
bwserve.py — Minimal bwserve protocol server for Python3.

Works with CPython 3.6+, MicroPython, and CircuitPython. Zero dependencies
beyond stdlib (CPython) or built-in modules (MicroPython/CircuitPython).

Provides:
  - TACO builder functions (taco, patch, replace, etc.)
  - SSE server using http.server (CPython), raw sockets (MicroPython),
    or socketpool (CircuitPython)
  - Same wire protocol as Node.js bwserve and C/Rust embedded versions

Usage (CPython):
  python bwserve.py                    # serve on :8080
  python -c "import bwserve; bwserve.serve(port=3000)"

Usage (MicroPython on ESP32):
  import bwserve
  app = bwserve.App(port=80)
  app.page('/', my_handler)
  app.serve()

Usage (CircuitPython on ESP32-S3 / RP2040-W):
  import bwserve
  app = bwserve.App(port=80)
  app.page('/', my_handler)
  app.serve()

License: BSD-2-Clause
Copyright (c) 2026 Manu Chatterjee / deftio
"""

import json
import sys
import time

# Detect runtime: CPython, MicroPython, or CircuitPython
_IMPL = getattr(getattr(sys, "implementation", None), "name", "cpython")
_IS_MICROPYTHON = _IMPL == "micropython"
_IS_CIRCUITPYTHON = _IMPL == "circuitpython"
_IS_CPYTHON = not _IS_MICROPYTHON and not _IS_CIRCUITPYTHON

# =========================================================================
# TACO builders
# =========================================================================

def taco(tag, content="", cls=None, id=None, attrs=None):
    """Build a TACO dict: {'t': tag, 'c': content, 'a': {...}}"""
    node = {"t": tag, "c": content}
    if cls or id or attrs:
        a = {}
        if cls:
            a["class"] = cls
        if id:
            a["id"] = id
        if attrs:
            a.update(attrs)
        node["a"] = a
    return node


def taco_json(tag, content="", **kwargs):
    """Build a TACO node and return as JSON string."""
    return json.dumps(taco(tag, content, **kwargs))


# =========================================================================
# Protocol message builders
# =========================================================================

def patch(target, content, attr=None):
    """Build a patch protocol message."""
    msg = {"type": "patch", "target": target, "content": str(content)}
    if attr:
        msg["attr"] = attr
    return msg


def replace(target, node):
    """Build a replace protocol message. node is a TACO dict or pre-built dict."""
    return {"type": "replace", "target": target, "node": node}


def append(target, node):
    """Build an append protocol message."""
    return {"type": "append", "target": target, "node": node}


def remove(target):
    """Build a remove protocol message."""
    return {"type": "remove", "target": target}


def batch(*ops):
    """Build a batch protocol message from multiple ops."""
    return {"type": "batch", "ops": list(ops)}


def message(level, text):
    """Build a notification message."""
    return {"type": "message", "level": level, "text": text}


def to_json(msg):
    """Serialize a protocol message to JSON string."""
    return json.dumps(msg, separators=(",", ":"))


def sse_frame(msg):
    """Wrap a protocol message (dict or string) as an SSE data frame."""
    data = msg if isinstance(msg, str) else to_json(msg)
    return "data: " + data + "\n\n"


# =========================================================================
# Bootstrap HTML
# =========================================================================

BOOTSTRAP_HTML = """<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<style>
body{{font-family:system-ui,sans-serif;margin:0;padding:1rem}}
</style>
</head><body>
<div id="app">Connecting...</div>
<script>
var es=new EventSource('/events');
es.onmessage=function(e){{
  try{{var msg=JSON.parse(e.data)}}catch(x){{return}}
  if(msg.type==='batch'){{msg.ops.forEach(applyOp)}}
  else{{applyOp(msg)}}
}};
function applyOp(op){{
  if(op.type==='patch'){{
    var el=document.getElementById(op.target);
    if(el)el.textContent=op.content;
    if(op.attr)Object.keys(op.attr).forEach(function(k){{el.setAttribute(k,op.attr[k])}});
  }}else if(op.type==='replace'){{
    var el2=document.querySelector(op.target);
    if(el2){{el2.innerHTML='';var d=document.createElement(op.node.t||'div');
      if(op.node.a)Object.keys(op.node.a).forEach(function(k){{d.setAttribute(k,op.node.a[k])}});
      if(op.node.c)d.textContent=op.node.c;el2.appendChild(d);}}
  }}else if(op.type==='append'){{
    var el3=document.querySelector(op.target);
    if(el3){{var d2=document.createElement(op.node.t||'div');
      if(op.node.a)Object.keys(op.node.a).forEach(function(k){{d2.setAttribute(k,op.node.a[k])}});
      if(op.node.c)d2.textContent=op.node.c;el3.appendChild(d2);}}
  }}else if(op.type==='remove'){{
    var el4=document.querySelector(op.target);
    if(el4)el4.remove();
  }}
}}
function sendAction(action,data){{
  fetch('/action',{{method:'POST',headers:{{'Content-Type':'application/json'}},
    body:JSON.stringify({{type:'action',action:action,data:data||{{}}}})
  }});
}}
</script>
</body></html>"""


# =========================================================================
# Client — represents one connected browser
# =========================================================================

class Client:
    """A connected SSE client. Send protocol messages via render/patch/etc."""

    def __init__(self, send_fn):
        self._send = send_fn
        self._handlers = {}

    def render(self, target, node):
        """Replace target with a TACO node."""
        self._send(replace(target, node))

    def patch(self, target, content, attr=None):
        """Patch target's text content (and optionally attributes)."""
        self._send(patch(target, content, attr))

    def append(self, target, node):
        """Append a TACO node as child of target."""
        self._send(append(target, node))

    def remove(self, target):
        """Remove target element from DOM."""
        self._send(remove(target))

    def batch(self, *ops):
        """Send multiple ops atomically."""
        self._send(batch(*ops))

    def message(self, level, text):
        """Send a notification to the browser."""
        self._send(message(level, text))

    def on(self, action, handler):
        """Register an action handler."""
        self._handlers[action] = handler

    def _dispatch(self, action, data):
        """Dispatch an incoming action from the browser."""
        handler = self._handlers.get(action)
        if handler:
            handler(data)


# =========================================================================
# App — the bwserve application
# =========================================================================

class App:
    """bwserve application. Register pages, then call serve()."""

    def __init__(self, title="bwserve", port=8080):
        self.title = title
        self.port = port
        self._pages = {}
        self._clients = {}  # id -> Client
        self._next_id = 0

    def page(self, path, handler):
        """Register a page handler. handler(client) is called when a browser connects."""
        self._pages[path] = handler

    def broadcast(self, msg):
        """Send a message to all connected clients."""
        for client in self._clients.values():
            try:
                client._send(msg)
            except Exception:
                pass

    def serve(self, blocking=True):
        """Start the HTTP server."""
        if _IS_CIRCUITPYTHON:
            self._serve_circuitpython()
        elif _IS_MICROPYTHON:
            self._serve_micropython()
        else:
            self._serve_cpython(blocking)

    # --- CPython implementation using http.server ---

    def _serve_cpython(self, blocking):
        from http.server import HTTPServer, BaseHTTPRequestHandler
        import threading

        app = self

        class Handler(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.1"

            def log_message(self, format, *args):
                print("[bwserve] " + (format % args))

            def do_GET(self):
                path = self.path.split("?")[0]

                if path == "/events":
                    self._handle_sse()
                elif path in app._pages or path == "/":
                    html = BOOTSTRAP_HTML.format(title=app.title)
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=UTF-8")
                    self.send_header("Content-Length", str(len(html)))
                    self.send_header("Connection", "close")
                    self.end_headers()
                    self.wfile.write(html.encode())
                else:
                    self.send_error(404)

            def do_POST(self):
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length) if length > 0 else b""
                try:
                    data = json.loads(body)
                except (json.JSONDecodeError, ValueError):
                    self.send_error(400, "Invalid JSON")
                    return

                # Find client by path or broadcast
                action = data.get("action", "")
                action_data = data.get("data", {})

                # Dispatch to all clients
                for client in list(app._clients.values()):
                    client._dispatch(action, action_data)

                resp = b'{"ok":true}'
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(resp)))
                self.send_header("Connection", "close")
                self.end_headers()
                self.wfile.write(resp)

            def _handle_sse(self):
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "keep-alive")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()

                client_id = app._next_id
                app._next_id += 1

                def send_fn(msg):
                    frame = sse_frame(msg).encode()
                    self.wfile.write(frame)
                    self.wfile.flush()

                client = Client(send_fn)
                app._clients[client_id] = client

                # Call the page handler for "/"
                handler = app._pages.get("/")
                if handler:
                    handler(client)

                # Keep connection alive with keepalives
                try:
                    while True:
                        time.sleep(15)
                        self.wfile.write(b":keepalive\n\n")
                        self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError, OSError):
                    pass
                finally:
                    del app._clients[client_id]

        server = HTTPServer(("", self.port), Handler)
        server.daemon_threads = True
        print("bwserve listening on http://localhost:{}".format(self.port))

        if blocking:
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                print("\nbwserve stopped.")
                server.shutdown()
        else:
            t = threading.Thread(target=server.serve_forever, daemon=True)
            t.start()
            return server

    # --- MicroPython implementation using raw sockets ---

    def _serve_micropython(self):
        import socket

        s = socket.socket()
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("", self.port))
        s.listen(5)
        print("bwserve (MicroPython) on port", self.port)

        while True:
            conn, addr = s.accept()
            try:
                req = conn.recv(2048).decode()
                method = req.split(" ")[0]
                path = req.split(" ")[1] if " " in req else "/"

                if method == "GET" and path == "/":
                    html = BOOTSTRAP_HTML.format(title=self.title)
                    conn.send("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n"
                              "Connection: close\r\n\r\n")
                    conn.send(html)
                elif method == "GET" and path.startswith("/events"):
                    conn.send("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n"
                              "Cache-Control: no-cache\r\nConnection: keep-alive\r\n\r\n")

                    def send_fn(msg):
                        conn.send(sse_frame(msg))

                    client = Client(send_fn)
                    client_id = self._next_id
                    self._next_id += 1
                    self._clients[client_id] = client

                    handler = self._pages.get("/")
                    if handler:
                        handler(client)
                    # MicroPython: connection stays open for SSE
                    # The caller's loop handles pushing updates
                    continue  # Don't close
                elif method == "POST":
                    # Extract body after \r\n\r\n
                    body_start = req.find("\r\n\r\n")
                    if body_start >= 0:
                        body = req[body_start + 4:]
                        try:
                            data = json.loads(body)
                            action = data.get("action", "")
                            for c in self._clients.values():
                                c._dispatch(action, data.get("data", {}))
                        except Exception:
                            pass
                    conn.send("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n"
                              "Connection: close\r\n\r\n{\"ok\":true}")
                else:
                    conn.send("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\nNot Found")
            except Exception as e:
                print("Error:", e)
            finally:
                if method != "GET" or not path.startswith("/events"):
                    conn.close()


    # --- CircuitPython implementation using socketpool ---

    def _serve_circuitpython(self):
        import wifi
        import socketpool

        pool = socketpool.SocketPool(wifi.radio)
        s = pool.socket(pool.AF_INET, pool.SOCK_STREAM)
        s.setsockopt(pool.SOL_SOCKET, pool.SO_REUSEADDR, 1)
        s.bind(("", self.port))
        s.listen(5)
        print("bwserve (CircuitPython) on port", self.port)
        print("IP:", wifi.radio.ipv4_address)

        buf = bytearray(2048)

        while True:
            conn, addr = s.accept()
            try:
                n = conn.recv_into(buf)
                req = str(buf[:n], "utf-8")
                parts = req.split(" ")
                method = parts[0] if len(parts) > 0 else "GET"
                path = parts[1] if len(parts) > 1 else "/"

                if method == "GET" and path == "/":
                    html = BOOTSTRAP_HTML.format(title=self.title)
                    resp = ("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n"
                            "Connection: close\r\n\r\n" + html)
                    conn.send(resp.encode())
                elif method == "GET" and path.startswith("/events"):
                    headers = ("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n"
                               "Cache-Control: no-cache\r\nConnection: keep-alive\r\n\r\n")
                    conn.send(headers.encode())

                    def send_fn(msg):
                        conn.send(sse_frame(msg).encode())

                    client = Client(send_fn)
                    client_id = self._next_id
                    self._next_id += 1
                    self._clients[client_id] = client

                    handler = self._pages.get("/")
                    if handler:
                        handler(client)
                    continue  # Don't close SSE connection
                elif method == "POST":
                    body_start = req.find("\r\n\r\n")
                    if body_start >= 0:
                        body = req[body_start + 4:]
                        try:
                            data = json.loads(body)
                            action = data.get("action", "")
                            for c in self._clients.values():
                                c._dispatch(action, data.get("data", {}))
                        except Exception:
                            pass
                    resp = ("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n"
                            "Connection: close\r\n\r\n{\"ok\":true}")
                    conn.send(resp.encode())
                else:
                    conn.send(b"HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\nNot Found")
            except Exception as e:
                print("Error:", e)
            finally:
                if method != "GET" or not path.startswith("/events"):
                    conn.close()

# =========================================================================
# Convenience: run as standalone server
# =========================================================================

def serve(port=8080, title="bwserve"):
    """Quick-start: run a bwserve server that accepts broadcast messages."""
    app = App(title=title, port=port)

    def default_page(client):
        client.render("#app", taco("div", "bwserve ready. Send protocol messages to update this page.", cls="container"))

    app.page("/", default_page)
    app.serve()


# =========================================================================
# CLI entry point
# =========================================================================

if __name__ == "__main__":
    _port = 8080
    for i, arg in enumerate(sys.argv[1:]):
        if arg in ("-p", "--port") and i + 2 <= len(sys.argv[1:]):
            _port = int(sys.argv[i + 2])
    serve(port=_port)
