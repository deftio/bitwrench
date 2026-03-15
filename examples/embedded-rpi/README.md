# Raspberry Pi System Monitor

Full Linux SBC dashboard for Raspberry Pi 3/4/5. Monitors CPU, memory, disk, network, processes, and GPIO pins.

## What it shows

- CPU temperature and per-core usage bars (4 cores)
- Memory (RAM + swap) with progress bars
- Disk usage
- Network RX/TX throughput
- Top processes table (PID, name, CPU%, memory) with sorting
- 6 GPIO pins (3 output with toggle buttons, 3 input read-only)
- System info table (model, OS, kernel, hostname, IP, uptime, load avg)
- Event log

## Simulation

This example runs entirely in the browser with simulated data. CPU temp drifts between 35-75C, cores fluctuate independently, input pins change randomly. On real hardware, two deployment options:

### Option A: bwserve (recommended)

Server owns all UI state. The Pi runs Node.js and bwserve pushes updates over SSE.

```bash
npm install bitwrench
node server.js
# Open http://raspberrypi.local:7902
```

See the commented bwserve code at the bottom of `index.html`.

### Option B: Static HTML + REST API

Serve this HTML from nginx or Python and expose REST endpoints. The page polls or subscribes via SSE.

```bash
pip install flask psutil
python api_server.py
# Open http://raspberrypi.local:8080
```

## Hardware endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system` | CPU temp, load, memory, disk |
| GET | `/api/processes` | Top processes by CPU |
| GET | `/api/gpio` | GPIO pin states (via pigpio/gpiod) |
| POST | `/api/gpio/:pin` | Set pin `{ value: 0\|1 }` |
| GET | `/events` | SSE stream of system metrics |

## Key differences from Pico W

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

The Pi runs bwserve natively. The Pico W serves static HTML from flash.
