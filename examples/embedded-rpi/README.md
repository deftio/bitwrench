# Raspberry Pi System Monitor Tutorial

Build a bitwrench system monitor dashboard for a Raspberry Pi 3, 4, or 5.
The Pi runs a web server that streams system metrics to the browser over SSE.

Works with any Raspberry Pi model that runs Linux (Raspberry Pi OS, Ubuntu, etc.).

## What You'll Build

- CPU temperature and per-core usage bars (4 cores)
- Memory (RAM + swap) with progress bars
- Disk usage
- Network RX/TX throughput
- Top processes table with sorting
- 6 GPIO pins (3 output toggles, 3 input read-only)
- System info table (model, OS, kernel, hostname, IP, uptime, load avg)
- Event log

---

## How Bitwrench Works

If you're new to bitwrench, here's a quick overview. For the full primer, see
the [basic example tutorial](../embedded-basic/README.md).

### TACO Format

Bitwrench describes UI elements as plain JavaScript objects:

```javascript
{ t: 'div', a: { class: 'card' }, c: [
    { t: 'h3', c: 'CPU Temp' },
    { t: 'span', c: '45.2 C' }
]}
```

When you call `bw.DOM('#app', taco)`, bitwrench converts this tree into DOM
elements and mounts them. No HTML strings needed.

### RPi vs Microcontroller

The Raspberry Pi is a full Linux machine, so the architecture is different from
the embedded microcontroller examples:

- **Node.js:** Uses the `bwserve` npm package (`require('bitwrench/bwserve')`),
  which provides `app.page()`, `client.mount()`, `client.batch()`, and SSE
  management out of the box.
- **Python:** Uses Flask with `psutil` for system metrics and `gpiod` for GPIO.

Both servers push full system snapshots over SSE every 2 seconds. The Node.js
version uses the bwserve protocol (mount + batch), while the Python version
sends raw JSON that the dashboard renders.

### SSE Architecture

**Node.js (bwserve):** On first connect, `client.mount('#app', taco)` sends a
complete TACO tree to the browser. Then every 2 seconds, `client.batch([...])`
sends mount operations that replace specific sections (CPU bars, memory card,
GPIO controls, process table).

**Python (Flask):** The SSE stream pushes a complete JSON object with all system
metrics. The browser receives it, updates state, and calls `render()` to rebuild
the page.

---

## Dashboard Code Walkthrough

The `dashboard.html` file renders a comprehensive system monitor using BCCL
components.

### Theme

```javascript
bw.loadStyles({ primary: '#c51a4a', secondary: '#2563eb', spacing: 'compact', radius: 'sm' });
bw.injectCSS(bw.css({ 'body': { background: '#0f172a', color: '#e2e8f0', margin: '0' } }));
```

### BCCL Components Used

**Overview stat cards** -- CPU temp, usage, memory, disk as compact cards:

```javascript
bw.makeRow({ children: [
    bw.makeCol({ size: { xs: 6, md: 3 }, content:
        bw.makeStatCard({
            value: sys.cpuTemp.toFixed(1) + '\u00B0C',
            label: 'CPU Temp',
            variant: sys.cpuTemp > 70 ? 'danger' : 'primary'
        })
    }),
    bw.makeCol({ size: { xs: 6, md: 3 }, content:
        bw.makeStatCard({ value: cpuAvg + '%', label: 'CPU Usage' })
    }),
    // ... memory, disk ...
]})
```

**CPU core bars** with color-coded progress:

```javascript
bw.makeCard({
    title: 'CPU Cores',
    content: sys.cpuUsage.map(function(usage, i) {
        return { t: 'div', a: { class: 'bw_mb_1' }, c: [
            { t: 'div', a: { style: 'display:flex;justify-content:space-between' }, c: [
                { t: 'span', c: 'Core ' + i },
                { t: 'span', c: Math.round(usage) + '%' }
            ]},
            bw.makeProgress({ value: Math.round(usage), variant: cpuVariant(usage) })
        ]};
    })
})
```

**Memory card** (RAM + swap with separate progress bars):

```javascript
bw.makeCard({
    title: 'Memory',
    content: [
        { t: 'div', c: 'RAM: ' + Math.round(sys.memUsed) + ' / ' + sys.memTotal + ' MB' },
        bw.makeProgress({ value: memPct, variant: memPct > 85 ? 'danger' : 'primary' }),
        { t: 'div', c: 'Swap: ' + sys.swapUsed + ' / ' + sys.swapTotal + ' MB' },
        bw.makeProgress({ value: swapPct, variant: 'info' })
    ]
})
```

**GPIO controls** -- output pins get toggle buttons, input pins are read-only:

```javascript
gpioState.map(function(g) {
    var isOut = g.mode === 'OUT';
    return bw.makeCard({
        title: 'GPIO ' + g.pin + ' -- ' + g.label,
        content: [
            bw.makeBadge({ text: g.mode, variant: isOut ? 'primary' : 'warning', pill: true }),
            bw.makeBadge({ text: g.value ? 'HIGH' : 'LOW',
                           variant: g.value ? 'success' : 'secondary', pill: true }),
            isOut ? bw.makeButton({
                text: g.value ? 'Turn Off' : 'Turn On',
                variant: g.value ? 'danger' : 'success', size: 'sm',
                onclick: function() { toggleGpio(g.pin, g.value); }
            }) : { t: 'span', c: 'Read-only input' }
        ]
    });
})
```

**Process table** with sortable columns:

```javascript
bw.makeTable({
    data: processes.map(function(p) {
        return { PID: p.pid, Process: p.name, 'CPU %': p.cpu.toFixed(1), 'Memory': p.mem.toFixed(1) + ' MB' };
    }),
    columns: [
        { key: 'PID', label: 'PID' },
        { key: 'Process', label: 'Process' },
        { key: 'CPU %', label: 'CPU %' },
        { key: 'Memory', label: 'Memory (MB)' }
    ],
    striped: true, hover: true, sortable: true,
    onSort: function(column, direction) { sortCol = column; sortDir = direction; render(); }
})
```

**System info table** and **event log:**

```javascript
bw.makeTable({
    data: [
        { Property: 'Model', Value: sys.model },
        { Property: 'Uptime', Value: formatUptime(sys.uptime) },
        { Property: 'Load Average', Value: sys.loadAvg.map(function(v) { return v.toFixed(2); }).join(', ') },
        { Property: 'Network RX', Value: formatBytes(sys.netRx) + '/s' },
        // ... hostname, IP, kernel, OS ...
    ]
})

bw.makeListGroup({ items: logEntries.length ? logEntries : ['Waiting for events...'] })
```

### SSE Connection

```javascript
function connectSSE() {
    var es = new EventSource('/events');

    es.addEventListener('system', function(e) {
        var data = JSON.parse(e.data);
        sys = data;
        if (data.processes) processes = data.processes;
        if (data.gpio) gpioState = data.gpio;
        isConnected = true;
        render();
    });
}
```

### GPIO Toggle via REST

```javascript
function toggleGpio(pin, currentValue) {
    fetch('/api/gpio/' + pin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: currentValue ? 0 : 1 })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(result) {
        gpioState.forEach(function(g) {
            if (g.pin === pin) g.value = result.value;
        });
        addLog('GPIO ' + pin + ' set to ' + (result.value ? 'HIGH' : 'LOW'));
        render();
    });
}
```

---

## Server Code Walkthrough

### Node.js (`server.js`) -- bwserve

Uses the `bwserve` npm package for SSE-based TACO rendering:

**App setup:**

```javascript
var bwserve = require('bitwrench/bwserve');

var app = bwserve.create({
    port: 7902,
    title: 'Raspberry Pi System Monitor',
    theme: { primary: '#c51a4a', secondary: '#2563eb' }
});
```

**Initial mount on client connect:**

```javascript
app.page('/', function(client) {
    // Send the full page TACO tree on first connect
    client.mount('#app', {
        t: 'div', c: [
            { t: 'h1', c: 'Raspberry Pi System Monitor' },
            buildOverviewCards(cpuTemp, cpuAvg, memPct, ...),
            buildCpuBars(cpuUsage),
            buildMemCard(memUsed, memTotal, swapUsed, swapTotal),
            buildGpioControls(gpioState),
            buildProcessTable(processes),
            buildInfoTable(sysInfo, uptime, loadAvg, netRate),
            buildLogSection(logEntries)
        ]
    });
```

**Periodic batch updates (every 2 seconds):**

```javascript
    setInterval(function() {
        client.batch([
            { type: 'mount', ref: '#overview',     taco: buildOverviewCards(...) },
            { type: 'mount', ref: '#cpu-bars',     taco: buildCpuBars(cpuUsage) },
            { type: 'mount', ref: '#mem-card',     taco: buildMemCard(...) },
            { type: 'mount', ref: '#gpio-section', taco: buildGpioControls(gpioState) },
            { type: 'mount', ref: '#proc-body',    taco: buildProcessTableBody(procs) },
            { type: 'mount', ref: '#info-body',    taco: buildInfoTableBody(...) },
            { type: 'mount', ref: '#log-section',  taco: buildLogSection(logEntries) }
        ]);
    }, 2000);
```

Each `mount` operation replaces the children of the target selector with a new
TACO tree. This is more efficient than patching individual values when many
elements change simultaneously.

**GPIO toggle handler:**

```javascript
    client.on('gpio-toggle', function(data) {
        var pin = parseInt(data.bwId, 10);
        var current = gpioRead(pin);
        gpioWrite(pin, current ? 0 : 1);
        addLog('GPIO ' + pin + ' set to ' + (current ? 'LOW' : 'HIGH'));
        client.batch([
            { type: 'mount', ref: '#gpio-section', taco: buildGpioControls(readAllGpio()) },
            { type: 'mount', ref: '#log-section',  taco: buildLogSection(logEntries) }
        ]);
    });
});
```

**GPIO via sysfs:**

```javascript
function gpioWrite(pin, value) {
    writeFileSync('/sys/class/gpio/gpio' + pin + '/value', String(value));
}

function gpioRead(pin) {
    return parseInt(readFileSync('/sys/class/gpio/gpio' + pin + '/value', 'utf8').trim(), 10);
}
```

### Python (`server.py`) -- Flask

Uses `psutil` for system metrics and `gpiod` for GPIO (with simulated fallback):

**System metrics collection:**

```python
def collect_system_metrics():
    cpu_temp = _read_cpu_temp()              # /sys/class/thermal/thermal_zone0/temp
    cpu_usage = psutil.cpu_percent(percpu=True)
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    # ... network rate, processes, load average ...
    return {
        "cpuTemp": round(cpu_temp, 1),
        "cpuUsage": [round(u, 1) for u in cpu_usage],
        "memTotal": round(vm.total / (1024*1024)),
        "memUsed": round(vm.used / (1024*1024)),
        "processes": procs[:10],
        "gpio": gpio_read_all(),
        # ...
    }
```

**SSE stream (every 2 seconds):**

```python
@app.route("/events")
def events():
    def generate():
        psutil.cpu_percent(interval=None, percpu=True)  # Prime psutil
        while True:
            data = collect_system_metrics()
            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(2)
    return Response(generate(), mimetype="text/event-stream")
```

**GPIO via gpiod (with Pi 5 support):**

```python
# Auto-detect GPIO chip: Pi 5 uses gpiochip4, Pi 3/4 use gpiochip0
for candidate in ("/dev/gpiochip4", "/dev/gpiochip0"):
    if os.path.exists(candidate):
        _gpio_chip = gpiod.Chip(candidate)
        break

# Falls back to simulated GPIO if gpiod unavailable
```

---

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

---

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

---

## GPIO Pin Assignments

| Pin | Label | Mode | Notes |
|-----|-------|------|-------|
| GPIO 17 | Status LED | Output | Toggle from dashboard |
| GPIO 22 | Relay 2 | Output | Toggle from dashboard |
| GPIO 27 | Relay 1 | Output | Toggle from dashboard |
| GPIO 23 | Button | Input | Read-only |
| GPIO 24 | Motion Sensor | Input | Read-only |
| GPIO 25 | Door Sensor | Input | Read-only |

## API Endpoints

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

---

## Customization Guide

### Adding System Metrics

To add a new metric (e.g., disk I/O, network connections):

**Node.js:**

```javascript
function buildOverviewCards(/* ... add diskIO */) {
    // Add a new stat card column:
    bw.makeCol({ size: { xs: 6, md: 3 }, content:
        bw.makeStatCard({ value: diskIO + ' MB/s', label: 'Disk I/O' })
    })
}
```

**Python:**

```python
# In collect_system_metrics():
io = psutil.disk_io_counters()
data["diskReadRate"] = round(io.read_bytes / elapsed)
data["diskWriteRate"] = round(io.write_bytes / elapsed)
```

### Adding GPIO Controls

1. Add the pin to the config:
   ```javascript
   // Node.js:
   GPIO_PINS.push({ pin: 18, label: 'Fan', mode: 'out' });

   // Python:
   GPIO_CONFIG.append({"pin": 18, "label": "Fan", "mode": "OUT", "default": 0})
   ```

2. The GPIO section auto-generates toggle buttons for output pins.

### Changing the Dashboard Layout

The layout is just a TACO tree. Rearrange sections, change column sizes, or
add new sections:

```javascript
// Move GPIO controls to a full-width row
bw.makeRow({ children: [
    bw.makeCol({ size: { xs: 12 }, content:
        bw.makeSection({ title: 'GPIO Controls', content: [gpioCards] })
    })
]})
```

---

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
