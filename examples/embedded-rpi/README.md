# Raspberry Pi System Monitor Tutorial

Build a bitwrench system monitor dashboard for a Raspberry Pi 3, 4, or 5.
The Pi runs a web server that streams system metrics to the browser over SSE.

Works with any Raspberry Pi model that runs Linux (Raspberry Pi OS, Ubuntu, etc.).

## What you will build

- CPU temperature and per-core usage bars (4 cores)
- Memory (RAM + swap) with progress bars
- Disk usage
- Network RX/TX throughput
- Top processes table with sorting
- 6 GPIO pins (3 output toggles, 3 input read-only)
- System info table (model, OS, kernel, hostname, IP, uptime, load avg)
- Event log

## Prerequisites

### Hardware

- Raspberry Pi 3, 4, or 5
- Ethernet or WiFi connection
- SD card with Raspberry Pi OS (Bookworm or later)

### Software (pick one)

- **Node.js:** Node.js 18+ (bwserve)
- **Python:** Python 3 + Flask + psutil + gpiod

### Server implementations

| File | Language | Framework |
|------|----------|-----------|
| [server.js](server.js) | Node.js | bwserve (SSE) |
| [server.py](server.py) | Python | Flask + psutil + gpiod |

Both serve the same `dashboard.html` and expose the same REST + SSE API.

## Option A: Node.js (recommended)

### Step 1: Install Node.js

```bash
sudo apt update && sudo apt install nodejs npm
```

### Step 2: Set up project

```bash
mkdir -p ~/rpi-monitor/dist
cp dashboard.html ~/rpi-monitor/index.html
cp ../../dist/bitwrench.umd.min.js ~/rpi-monitor/dist/
cp server.js ~/rpi-monitor/
cd ~/rpi-monitor
npm install bitwrench
```

### Step 3: Run

```bash
node server.js
```

### Step 4: Connect

Open your browser to `http://raspberrypi.local:7902` or the Pi's IP address.

## Option B: Python (Flask)

### Step 1: Install dependencies

```bash
pip install flask psutil gpiod
```

### Step 2: Set up project

```bash
mkdir -p ~/rpi-monitor/dist
cp dashboard.html ~/rpi-monitor/index.html
cp ../../dist/bitwrench.umd.min.js ~/rpi-monitor/dist/
cp server.py ~/rpi-monitor/
```

### Step 3: Run

```bash
python3 server.py
```

### Step 4: Connect

Open your browser to `http://raspberrypi.local:8080`.

## GPIO pin assignments

| Pin | Label | Mode | Notes |
|-----|-------|------|-------|
| GPIO 17 | Status LED | Output | Toggle from dashboard |
| GPIO 22 | Relay 2 | Output | Toggle from dashboard |
| GPIO 27 | Relay 1 | Output | Toggle from dashboard |
| GPIO 23 | Button | Input | Read-only |
| GPIO 24 | Motion Sensor | Input | Read-only |
| GPIO 25 | Door Sensor | Input | Read-only |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serve dashboard HTML |
| GET | `/api/system` | CPU, memory, disk, network metrics |
| GET | `/api/processes` | Top processes by CPU |
| GET | `/api/gpio` | GPIO pin states |
| POST | `/api/gpio/:pin` | Set output pin: `{ "value": 0|1 }` |
| GET | `/events` | SSE stream (every 2 seconds) |

## Raspberry Pi vs Pico W

| | Raspberry Pi | Pico W |
|--|--------------|--------|
| Type | Single-board computer (Linux) | Microcontroller |
| CPU | ARM Cortex-A (1.5-2.4 GHz) | ARM Cortex-M0+ (133 MHz) |
| RAM | 1-8 GB | 264 KB |
| Storage | SD card (32-512 GB) | 2 MB flash |
| OS | Raspbian/Ubuntu | MicroPython / C |
| Node.js | Yes (bwserve) | No |
| GPIO | 40-pin header, libgpiod | 26 GP pins |
| Network | Ethernet + WiFi 5/6 | WiFi 4 (CYW43) |
| Price | $35-80 | ~$6 |

The Pi runs bwserve natively (Node.js) or Flask (Python). The Pico W serves static HTML from flash.

## Troubleshooting

**GPIO permission denied:** Add your user to the gpio group:
`sudo usermod -aG gpio $USER` then log out/in. Or run with `sudo`.

**psutil not found:** Run `pip install psutil`.

**Port already in use:** Change the port in server.js (PORT variable) or
server.py (--port argument).

**No CPU temperature:** Check that `/sys/class/thermal/thermal_zone0/temp`
exists. Some Pi models may use a different path.

**Dashboard shows "Connecting...":** Make sure the server is running. Check
firewall: `sudo ufw allow 7902` (or 8080 for Flask).
