# NFC Tag Scanner - ESP32 + ST25DV16 + Bitwrench

A CircuitPython web app running on an Adafruit QT Py ESP32 with an ST25DV16K NFC/RFID EEPROM breakout. Displays scanned NFC tag data on a web dashboard using [bitwrench.js](https://github.com/deftio/bitwrench) and nothing else.

Works fully offline on your LAN - bitwrench.js is served from the ESP32 itself (pre-gzipped, ~40KB).

## What You Need

### Hardware

| Part | Product | Price |
|------|---------|-------|
| Microcontroller | [Adafruit QT Py ESP32-S3](https://www.adafruit.com/product/5426) | ~$10 |
| NFC Tag | [Adafruit ST25DV16K Breakout](https://www.adafruit.com/product/4701) | ~$8 |
| Cable | [STEMMA QT cable](https://www.adafruit.com/product/4210) (any length) | ~$1 |
| USB Cable | USB-C data cable (not charge-only) | -- |

**Other QT Py ESP32 variants also work:** ESP32-S2 ([#5325](https://www.adafruit.com/product/5325)), ESP32-C3 ([#5405](https://www.adafruit.com/product/5405)). Any WiFi-capable QT Py with a STEMMA QT connector will do. The original ESP32 Pico is not recommended (limited CircuitPython support).

### Software (on your computer)

- Python 3.x (for `circup`)
- A web browser
- A serial terminal (screen, PuTTY, or the Mu editor's serial console)

## Setup: Step by Step

### Step 1: Install CircuitPython on the QT Py

1. Go to [circuitpython.org/downloads](https://circuitpython.org/downloads)
2. Search for your board (e.g. "QT Py ESP32-S3")
3. Download the latest `.bin` or `.uf2` file (CircuitPython 8.x or 9.x)
4. Follow the board-specific install instructions on that page
5. After flashing, a USB drive called **CIRCUITPY** should appear on your computer

If the CIRCUITPY drive doesn't appear, check that your USB cable supports data (not charge-only).

### Step 2: Install the HTTP server library

```bash
pip install circup
circup install adafruit_httpserver
```

`circup` installs libraries directly to the connected CIRCUITPY drive. If it can't find the board, make sure the CIRCUITPY drive is mounted.

### Step 3: Prepare bitwrench.js

Download and compress bitwrench on your computer (not on the ESP32):

**macOS / Linux:**
```bash
curl -o bitwrench.umd.min.js \
  https://cdn.jsdelivr.net/npm/bitwrench@2.0.17/dist/bitwrench.umd.min.js
gzip -9 bitwrench.umd.min.js
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/bitwrench@2.0.17/dist/bitwrench.umd.min.js" `
  -OutFile bitwrench.umd.min.js
# Install 7zip if needed, or use WSL:
# In WSL: gzip -9 bitwrench.umd.min.js
# Or use any tool that creates a .gz file
```

This produces `bitwrench.umd.min.js.gz` (~40KB).

### Step 4: Copy project files to the board

Copy everything to your CIRCUITPY drive so it looks like this:

```
CIRCUITPY/
  settings.toml                    <-- from this repo
  code.py                          <-- from this repo
  lib/
    st25dv16.py                    <-- from this repo (lib/ folder)
    adafruit_httpserver/           <-- already here from Step 2
  static/
    index.html                     <-- from this repo (static/ folder)
    bitwrench.umd.min.js.gz        <-- from Step 3
```

You can drag-and-drop files in your file manager. Create the `static/` directory on the CIRCUITPY drive if it doesn't exist.

### Step 5: Set your WiFi credentials

Open `settings.toml` on the CIRCUITPY drive and replace the placeholder values:

```toml
CIRCUITPY_WIFI_SSID = "YourActualNetworkName"
CIRCUITPY_WIFI_PASSWORD = "YourActualPassword"
```

Use your 2.4GHz WiFi network name (ESP32 does not support 5GHz).

### Step 6: Connect the hardware

Plug the STEMMA QT cable between the QT Py and the ST25DV16K breakout. Either STEMMA QT port on the ST25DV16K board works. No soldering required.

```
  QT Py ESP32          STEMMA QT cable         ST25DV16K
  ┌──────────┐        ┌──────────────┐        ┌──────────┐
  │ STEMMA QT├────────┤              ├────────┤STEMMA QT │
  └──────────┘        └──────────────┘        └──────────┘
       │                                           │
    USB-C to                                  NFC antenna
    computer                                  (tap phone here)
```

### Step 7: Boot and connect

1. Connect the QT Py to your computer via USB (powers both boards)
2. Open a serial terminal at 115200 baud:
   - **macOS:** `screen /dev/tty.usbmodem* 115200`
   - **Linux:** `screen /dev/ttyACM0 115200`
   - **Windows:** PuTTY or the Mu editor's serial console
   - **Any OS:** The Mu editor ([codewith.mu](https://codewith.mu)) has a built-in serial console
3. Press the reset button (or wait for code.py to auto-run)
4. You should see output like:

```
Connecting to WiFi: YourNetwork
Connected! IP: 192.168.1.42
Open http://192.168.1.42 in your browser
ST25DV16 UID: 02:A3:B4:C5:D6:E7:F8:01
Memory: 2048 bytes
Server started on http://192.168.1.42
```

5. Open that IP address in any browser on the same WiFi network

### Step 8: Use it

- The dashboard shows 5 tabs: NDEF Records, Tag Info, Live Status, Scan History, Raw Memory
- To scan: tap an NFC-capable phone on the ST25DV16's antenna
- The board auto-detects the RF activity and reads the tag memory
- Live values (uptime, RF status, CPU temp) update every 3 seconds automatically
- Click "Scan Now" to force a manual read

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CIRCUITPY drive doesn't appear | Try a different USB cable (many are charge-only). Hold BOOT button while plugging in to enter bootloader mode. |
| `circup` can't find the board | Make sure CIRCUITPY is mounted. Run `circup --path /Volumes/CIRCUITPY install adafruit_httpserver` (macOS) or specify the path explicitly. |
| Serial says "WiFi SSID not set" | Check `settings.toml` - values must be in double quotes. Make sure the file is saved. |
| Serial says "No network with that ssid" | Check spelling. Must be 2.4GHz network (not 5GHz). |
| Serial says "ST25DV16 not found" | Check STEMMA QT cable. Try unplugging and replugging both ends. The cable must be seated fully. |
| Browser can't reach the IP | Make sure your phone/laptop is on the same WiFi network as the ESP32. Try `ping <ip>` from a terminal. |
| Page loads but shows "Connecting..." forever | Check the serial console for errors. The ESP32 HTTP server handles one request at a time - give it a moment. |
| bitwrench.js fails to load (blank page) | Verify `bitwrench.umd.min.js.gz` exists in `CIRCUITPY/static/`. Check the browser dev console for 404 errors. |

## How It Works

1. ESP32 connects to WiFi, starts an HTTP server
2. Browser loads `index.html` and `bitwrench.js` (both served from the ESP32)
3. On page load, browser fetches `/api/status` for full state, renders UI with `bw.DOM()`
4. Every 3 seconds, browser polls `/api/patches` for lightweight bwserve-compatible patch ops
5. `bw.clientApply()` applies patches to specific DOM elements by ID (no full rebuild)
6. When NDEF content changes (detected via `ndef_version`), browser does a full re-fetch
7. ESP32 polls the ST25DV16 every 500ms for RF activity via the IT_STS_Dyn register
8. On RF activity (phone tap), a full NDEF scan runs automatically

### Update Strategy

| Scenario | Endpoint | Rendering | Frequency |
|----------|----------|-----------|-----------|
| Page load, tab switch, new NDEF records | `/api/status` | Full `bw.DOM()` rebuild | On change only |
| Live data (uptime, RF flags, CPU temp) | `/api/patches` | `bw.clientApply()` patches | Every 3s |

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main web UI |
| `GET /bitwrench.js` | Pre-gzipped bitwrench.js (~40KB) |
| `GET /api/patches` | Lightweight patch ops for live data |
| `GET /api/status` | Full device state, NDEF records, history |
| `GET /api/scan` | Trigger a manual NFC scan |
| `GET /api/ndef` | Current NDEF records only |
| `GET /api/raw?start=0&length=64` | Raw EEPROM hex dump |
| `GET /api/tag` | Tag identity (UID, memory size) |

## Project Files

| File | What it does |
|------|-------------|
| `settings.toml` | WiFi credentials (edit this) |
| `code.py` | Main app: WiFi, HTTP server, NFC polling, JSON APIs |
| `lib/st25dv16.py` | Custom ST25DV16 I2C driver with NDEF parser (no official CircuitPython library exists) |
| `static/index.html` | Web UI built entirely with bitwrench.js |
| `static/bitwrench.umd.min.js.gz` | Pre-gzipped bitwrench library (you create this in Step 3) |
| `bitwrench-feedback-2.0.17.md` | Feedback on the bitwrench library from this project |

## Dependencies

Only two:
- **`adafruit_httpserver`** - HTTP server for CircuitPython (installed via circup)
- **`bitwrench.js` v2.0.17** - Client-side UI library (served locally, pre-gzipped)

Everything else is built-in CircuitPython (`wifi`, `socketpool`, `busio`, `json`, `microcontroller`) or custom code in this repo (`st25dv16.py`).

## License

MIT
