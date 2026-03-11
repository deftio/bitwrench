# bitwrench embedded Python

Minimal bwserve protocol server for Python. Works on:

- **CPython 3.6+** — desktop/server, Raspberry Pi, any Linux SBC
- **MicroPython** — ESP32, RP2040, STM32
- **CircuitPython** — Adafruit ESP32-S3, RP2040-W, etc.

Zero dependencies beyond built-in modules.

## Install

### CPython (desktop / Raspberry Pi / Linux SBC)

Copy `bwserve.py` into your project, or add the folder to your Python path:

```bash
cp embedded_python/bwserve.py my_project/
cd my_project
python bwserve.py                # run standalone on :8080
```

Or import it programmatically:

```python
import bwserve
bwserve.serve(port=3000)
```

### MicroPython (ESP32, RP2040)

1. Flash MicroPython onto your board
   ([micropython.org/download](https://micropython.org/download))
2. Copy `bwserve.py` to the board's filesystem:
   ```bash
   mpremote cp bwserve.py :bwserve.py
   ```
3. In your `main.py`, import and use it:
   ```python
   import bwserve
   ```

### CircuitPython (Adafruit boards)

1. Install CircuitPython on your board
   ([circuitpython.org/downloads](https://circuitpython.org/downloads))
2. Copy `bwserve.py` to the `CIRCUITPY` USB drive's `lib/` folder:
   ```
   CIRCUITPY/
     lib/
       bwserve.py
     code.py        ← your program
   ```
3. Make sure WiFi is configured in `settings.toml`:
   ```toml
   CIRCUITPY_WIFI_SSID = "YOUR_WIFI"
   CIRCUITPY_WIFI_PASSWORD = "YOUR_PASS"
   ```

## Write Your First Program

### CPython — Counter Dashboard

Create `counter.py`:

```python
import bwserve
import time
import threading

app = bwserve.App(title="My Counter", port=8080)
count = 0

def home(client):
    # Send initial UI
    client.render("#app", {
        "t": "div", "c": [
            bwserve.taco("h1", "Counter"),
            bwserve.taco("div", "0", id="count"),
            bwserve.taco("button", "+1",
                attrs={"onclick": "sendAction('increment')"})
        ]
    })

    # Handle button clicks
    def on_increment(data):
        global count
        count += 1
        client.patch("count", str(count))

    client.on("increment", on_increment)

app.page("/", home)
app.serve()
```

Run it:
```bash
python counter.py
# Open http://localhost:8080
```

### MicroPython — ESP32 Temperature Monitor

Create `main.py` on your ESP32:

```python
import network
import bwserve
import time

# Connect to WiFi
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect("YOUR_WIFI", "YOUR_PASS")
while not wlan.isconnected():
    time.sleep(0.5)
print("IP:", wlan.ifconfig()[0])

# Create bwserve app
app = bwserve.App(port=80)

def home(client):
    client.render("#app", bwserve.taco("h1", "ESP32 Ready"))
    # After initial render, push sensor updates in a loop
    while True:
        import machine
        adc = machine.ADC(machine.Pin(34))
        temp = adc.read() * 0.1  # your calibration here
        client.patch("temp", "{:.1f} C".format(temp))
        time.sleep(2)

app.page("/", home)
app.serve()
```

### CircuitPython — Adafruit ESP32-S3 Dashboard

Create `code.py` on the CIRCUITPY drive:

```python
import wifi
import bwserve

# WiFi is auto-connected via settings.toml
print("IP:", wifi.radio.ipv4_address)

app = bwserve.App(port=80)

def home(client):
    import microcontroller
    client.render("#app", {
        "t": "div", "c": [
            bwserve.taco("h1", "Adafruit Dashboard"),
            bwserve.taco("div", "--", id="cpu-temp"),
        ]
    })
    while True:
        temp_c = microcontroller.cpu.temperature
        client.patch("cpu-temp", "{:.1f} C".format(temp_c))
        import time
        time.sleep(2)

app.page("/", home)
app.serve()
```

Make sure `bwserve.py` is in `CIRCUITPY/lib/`.

## API Reference

### TACO Builders

```python
bwserve.taco("div", "Hello")                    # {'t': 'div', 'c': 'Hello'}
bwserve.taco("div", "Hello", cls="card")         # with class attribute
bwserve.taco("span", "0", id="counter")          # with id attribute
bwserve.taco("a", "Link", attrs={"href": "/"})   # arbitrary attributes
bwserve.taco_json("h1", "Title")                 # returns JSON string
```

### Protocol Messages

```python
bwserve.patch("temp", "23.5")                    # update text content
bwserve.replace("#app", taco("div", "Hi"))       # replace element
bwserve.append("#log", taco("p", "Entry"))       # append child
bwserve.remove("#old-item")                      # remove element
bwserve.batch(patch("a", "1"), patch("b", "2"))  # atomic batch
bwserve.message("info", "Connected")             # notification
```

### Client Methods

Inside a page handler, the `client` object provides:

```python
client.render(target, node)         # replace target with TACO node
client.patch(target, content)       # update target's text content
client.append(target, node)         # append child node to target
client.remove(target)               # remove target from DOM
client.batch(op1, op2, ...)         # send multiple ops atomically
client.message(level, text)         # send browser notification
client.on(action, handler)          # register action handler from browser
```

### Serialization

```python
bwserve.to_json(msg)                # dict -> compact JSON string
bwserve.sse_frame(msg)              # dict -> "data: {...}\n\n"
```

## Architecture

The same bwserve wire protocol (JSON over SSE + POST) runs across all
languages. The browser doesn't know or care which backend is sending:

| Platform | Language | File |
|----------|----------|------|
| Desktop / RPi / SBC | CPython | `embedded_python/bwserve.py` |
| ESP32, RP2040 | MicroPython | `embedded_python/bwserve.py` |
| Adafruit boards | CircuitPython | `embedded_python/bwserve.py` |
| ESP32, STM32 | C/C++ | `embedded_c/bwserve.h` |
| ESP32 (esp-idf) | Rust | `embedded_rust/` |
| Node.js | JavaScript | `npm install bitwrench` |
| Any language | CLI pipe | `bwserve --stdin` |

## Compatibility Notes

| Runtime | Server impl | WiFi setup |
|---------|-------------|------------|
| CPython 3.6+ | `http.server` + `threading` | N/A (use OS networking) |
| MicroPython | Raw `socket` | `network.WLAN` |
| CircuitPython | `socketpool.SocketPool(wifi.radio)` | `settings.toml` auto-connect |

All three runtimes use the same `bwserve.App` API. The transport layer
is selected automatically at import time.
