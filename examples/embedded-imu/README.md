# Embedded IMU Dashboard Tutorial

Build a bitwrench-powered IMU (Inertial Measurement Unit) dashboard served from
a microcontroller. Adds real-time accelerometer, gyroscope, and optional
magnetometer visualizations to the basic board dashboard.

## What You'll Build

- 3-axis accelerometer bars (X/Y/Z in g) with bidirectional visualization
- 3-axis gyroscope readout (X/Y/Z in deg/s) with bidirectional bars
- 3-axis magnetometer (ICM-20948 only, in uT)
- Tilt indicator dot that moves with board orientation
- Adjustable sample rate (100ms / 250ms / 500ms / 1s)
- System stats (temp, voltage, RSSI, heap, uptime)

## Boards

| Board | IMU | Connection | Sketch |
|-------|-----|------------|--------|
| ESP32-S3 Pro | MPU6050 or ICM-20948 | STEMMA QT | `esp32s3-pro/esp32s3_imu.ino` |
| Pico 2W | MPU6050 or ICM-20948 | I2C (GP4/GP5) | `pico2w/pico2w_imu.ino` |

Both boards use the same `dashboard.html` served from flash.

---

## How Bitwrench Embedded Works

The device runs an HTTP server and serves `dashboard.html` + `bitwrench.umd.min.js`
from flash. The browser loads the page, bitwrench renders the UI from TACO objects,
and then the device pushes small JSON patches over SSE to update individual elements.

This example adds a twist: **two update intervals**. IMU data is pushed at a
configurable fast rate (100ms-1s) for smooth visualization, while system stats
(temperature, voltage, uptime) are pushed at a fixed 2-second interval. The
browser's `renderIMU()` function does partial updates for the bars and tilt
indicator without re-rendering the entire page.

For the full primer on TACO format, the style pipeline, and the SSE protocol,
see the [basic example tutorial](../embedded-basic/README.md).

---

## IMU Dashboard Walkthrough

The `dashboard.html` file extends the basic dashboard with IMU-specific
visualizations. Here are the key additions.

### IMU State

The state object adds fields for all IMU axes:

```javascript
var state = {
    // ... board + system fields ...
    accelX: 0, accelY: 0, accelZ: 0,
    gyroX: 0,  gyroY: 0,  gyroZ: 0,
    magX: 0,   magY: 0,   magZ: 0,
    hasMag: false,
    sampleRate: 500
};
```

### SSE Ref ID Mapping

The dashboard maps SSE patch refs to state fields:

```javascript
var refMap = {
    'val-accel-x': 'accelX', 'val-accel-y': 'accelY', 'val-accel-z': 'accelZ',
    'val-gyro-x': 'gyroX',   'val-gyro-y': 'gyroY',   'val-gyro-z': 'gyroZ',
    'val-mag-x': 'magX',     'val-mag-y': 'magY',      'val-mag-z': 'magZ',
    'val-has-mag': 'hasMag',  'val-imu-chip': 'imuChip',
    // ... plus all the system refs from the basic dashboard
};
```

### Accelerometer Bars

Each axis is rendered as a bidirectional bar centered at zero. Positive values
extend right, negative values extend left:

```javascript
function makeAxisBar(label, value, max, color) {
    // Map [-max..+max] to 0..100% (50% = center = zero)
    var pct = Math.round(((value / max) + 1) * 50);
    pct = Math.max(0, Math.min(100, pct));
    var barLeft = pct < 50 ? pct : 50;
    var barWidth = Math.abs(pct - 50);

    return { t: 'div', a: { class: 'axis-row' }, c: [
        { t: 'span', a: { class: 'axis-label' }, c: label },
        { t: 'div', a: { class: 'axis-track' }, c: [
            { t: 'div', a: {
                class: 'axis-bar',
                style: 'background:' + color +
                       ';position:absolute;left:' + barLeft + '%;width:' + barWidth + '%'
            }, c: '' }
        ]},
        { t: 'span', a: { class: 'axis-val' }, c: value.toFixed(2) }
    ]};
}
```

The bars use distinct colors per axis:
- Accelerometer: X=red (`#ef4444`), Y=green (`#22c55e`), Z=blue (`#3b82f6`), range +/-4g
- Gyroscope: X=orange (`#f97316`), Y=purple (`#a855f7`), Z=cyan (`#06b6d4`), range +/-500 deg/s
- Magnetometer: X=amber (`#f59e0b`), Y=pink (`#ec4899`), Z=teal (`#14b8a6`), range +/-100 uT

### Tilt Indicator

Maps accelerometer X/Y to a dot position inside a circular indicator:

```javascript
function makeTiltIndicator() {
    var maxG = 2.0;
    var dotX = 50 + (state.accelX / maxG) * 40;  // % from center
    var dotY = 50 + (state.accelY / maxG) * 40;
    dotX = Math.max(10, Math.min(90, dotX));
    dotY = Math.max(10, Math.min(90, dotY));

    var isLevel = Math.abs(state.accelX) < 0.15 && Math.abs(state.accelY) < 0.15;

    return bw.makeCard({
        title: 'Tilt',
        content: [
            { t: 'div', a: { class: 'tilt-indicator' }, c: [
                { t: 'div', a: { class: 'tilt-dot',
                    style: 'left:' + dotX + '%;top:' + dotY + '%' }, c: '' }
            ]},
            { t: 'div', a: { style: 'text-align:center' }, c:
                bw.makeBadge({
                    text: isLevel ? 'Level' : 'Tilted',
                    variant: isLevel ? 'success' : 'warning', pill: true
                })
            }
        ]
    });
}
```

When the board is flat, the dot centers and shows a green "Level" badge. Tilt
the board and the dot tracks the tilt angle.

### Sample Rate Selector

Four buttons let the user change the IMU data push rate:

```javascript
var rateButtons = [100, 250, 500, 1000].map(function(ms) {
    var label = ms < 1000 ? ms + 'ms' : (ms / 1000) + 's';
    return bw.makeButton({
        text: label, size: 'sm',
        variant: state.sampleRate === ms ? 'primary' : 'outline_secondary',
        onclick: function() { setSampleRate(ms); }
    });
});

function setSampleRate(ms) {
    state.sampleRate = ms;
    sendCmd('set_rate', { rate: ms });
    render();
}
```

### Partial Updates with `renderIMU()`

IMU data arrives at up to 10 Hz. Re-rendering the entire page at that rate would
be wasteful. Instead, `applyOp()` calls `renderIMU()` which only updates the
bars and tilt dot:

```javascript
function renderIMU() {
    var imuEl = bw.$('#imu-section')[0];
    if (!imuEl) return;

    // Update accelerometer bars
    bw.DOM('#imu-accel', { t: 'div', c: [
        makeAxisBar('X', state.accelX, 4, '#ef4444'),
        makeAxisBar('Y', state.accelY, 4, '#22c55e'),
        makeAxisBar('Z', state.accelZ, 4, '#3b82f6')
    ]});

    // Update gyroscope bars
    bw.DOM('#imu-gyro', { t: 'div', c: [
        makeAxisBar('X', state.gyroX, 500, '#f97316'),
        makeAxisBar('Y', state.gyroY, 500, '#a855f7'),
        makeAxisBar('Z', state.gyroZ, 500, '#06b6d4')
    ]});

    // Update tilt dot position
    var dot = bw.$('.tilt-dot')[0];
    if (dot) {
        var dotX = 50 + (state.accelX / 2.0) * 40;
        var dotY = 50 + (state.accelY / 2.0) * 40;
        dot.style.left = Math.max(10, Math.min(90, dotX)) + '%';
        dot.style.top  = Math.max(10, Math.min(90, dotY)) + '%';
    }
}
```

### Magnetometer (Conditional)

The magnetometer section only renders when `state.hasMag === true` (ICM-20948):

```javascript
var magSection = state.hasMag ? bw.makeCard({
    title: 'Magnetometer (uT)',
    content: [
        makeAxisBar('X', state.magX, 100, '#f59e0b'),
        makeAxisBar('Y', state.magY, 100, '#ec4899'),
        makeAxisBar('Z', state.magZ, 100, '#14b8a6')
    ]
}) : null;
```

---

## Sketch Walkthrough

### Selecting the IMU

At the top of each sketch, uncomment one `#define`:

```cpp
// Uncomment ONE of these to select your IMU:
#define USE_MPU6050
// #define USE_ICM20948
```

This controls conditional compilation throughout the sketch:

```cpp
#ifdef USE_MPU6050
    #include <Adafruit_MPU6050.h>
    Adafruit_MPU6050 imu;
#endif

#ifdef USE_ICM20948
    #include <Adafruit_ICM20X.h>
    #include <Adafruit_ICM20948.h>
    Adafruit_ICM20948 imu;
#endif
```

### I2C Initialization

```cpp
Wire.begin();  // ESP32-S3: default SDA/SCL, STEMMA QT compatible
// Pico 2W:
// Wire.setSDA(4);
// Wire.setSCL(5);
// Wire.begin();
```

### IMU Setup and Range Configuration

```cpp
#ifdef USE_MPU6050
if (imu.begin()) {
    imuFound = true;
    imu.setAccelerometerRange(MPU6050_RANGE_4_G);   // +/-4g
    imu.setGyroRange(MPU6050_RANGE_500_DEG);        // +/-500 deg/s
    imu.setFilterBandwidth(MPU6050_BAND_21_HZ);     // Low-pass filter
}
#endif
```

### Separate Update Intervals

IMU data is pushed at the user-configurable rate. System stats use a fixed 2-second interval:

```cpp
unsigned long sampleRateMs = 500;       // Configurable via web UI
#define SYSTEM_INTERVAL_MS 2000         // Fixed

void loop() {
    unsigned long now = millis();

    // IMU data: fast, configurable rate
    if (now - lastIMUPush >= sampleRateMs) {
        lastIMUPush = now;
        if (events.count() > 0) sendIMUData();
    }

    // System stats: slow, fixed rate
    if (now - lastSysPush >= SYSTEM_INTERVAL_MS) {
        lastSysPush = now;
        if (events.count() > 0) sendSystemData();
    }
}
```

### IMU Data with Unit Conversion

Raw sensor values are converted to human-readable units:

```cpp
void sendIMUData() {
    sensors_event_t accel, gyro, temp;
    imu.getEvent(&accel, &gyro, &temp);

    // Accelerometer: m/s^2 -> g (divide by 9.81)
    snprintf(val, sizeof(val), "%.2f", accel.acceleration.x / 9.81f);
    BW_PATCH(m, "val-accel-x", val);
    bw_batch_add(&batch, m);

    // Gyroscope: rad/s -> deg/s (multiply by 57.2958 = 180/PI)
    snprintf(val, sizeof(val), "%.1f", gyro.gyro.x * 57.2958f);
    BW_PATCH(m, "val-gyro-x", val);
    bw_batch_add(&batch, m);

    // Magnetometer (ICM-20948 only): direct uT values
    #ifdef USE_ICM20948
    snprintf(val, sizeof(val), "%.1f", mag.magnetic.x);
    BW_PATCH(m, "val-mag-x", val);
    bw_batch_add(&batch, m);
    #endif
}
```

### Board Info with IMU Detection

```cpp
#ifdef USE_MPU6050
    BW_PATCH(m, "val-imu-chip", imuFound ? "MPU6050" : "Not found");
    BW_PATCH(m, "val-has-mag", "0");  // No magnetometer
#endif

#ifdef USE_ICM20948
    BW_PATCH(m, "val-imu-chip", imuFound ? "ICM-20948" : "Not found");
    BW_PATCH(m, "val-has-mag", imuFound ? "1" : "0");  // Has magnetometer
#endif
```

### Sample Rate Command

```cpp
if (strstr(body, "set_rate")) {
    unsigned long rate = /* parse rate from JSON */;
    if (rate >= 50 && rate <= 5000) {
        sampleRateMs = rate;
    }
}
```

---

## Python Variants

| File | Language | Board | IMU Support |
|------|----------|-------|-------------|
| `esp32s3-pro/imu_circuitpython.py` | CircuitPython | ESP32-S3 | `adafruit_mpu6050` or `adafruit_icm20x` |
| `pico2w/imu_micropython.py` | MicroPython | Pico 2W | Inline register-level MPU6050 driver |

**CircuitPython** uses the Adafruit sensor libraries:

```python
if USE_MPU6050:
    imu = adafruit_mpu6050.MPU6050(i2c)
elif USE_ICM20948:
    imu = adafruit_icm20x.ICM20948(i2c)
    has_mag = True

# Read and convert
accel = imu.acceleration  # (x, y, z) in m/s^2
gyro = imu.gyro           # (x, y, z) in rad/s

ops = [
    bwserve.patch("val-accel-x", f"{accel[0] / 9.81:.2f}"),
    bwserve.patch("val-gyro-x",  f"{gyro[0] * 57.2958:.1f}"),
]
broadcast(bwserve.batch(*ops))
```

**MicroPython** on Pico 2W uses raw I2C register reads (no library dependency):

```python
MPU6050_ADDR = 0x68

def mpu6050_init():
    i2c.writeto_mem(MPU6050_ADDR, 0x6B, bytes([0x00]))  # Wake up
    i2c.writeto_mem(MPU6050_ADDR, 0x1C, bytes([0x08]))   # +/-4g range
    i2c.writeto_mem(MPU6050_ADDR, 0x1B, bytes([0x08]))   # +/-500 deg/s

def mpu6050_read():
    data = i2c.readfrom_mem(MPU6050_ADDR, 0x3B, 14)  # Burst read
    ax = struct.unpack(">h", data[0:2])[0] / 8192.0  # 8192 LSB/g at +/-4g
    gx = struct.unpack(">h", data[8:10])[0] / 65.5   # 65.5 LSB/(deg/s) at +/-500
    return (ax, ay, az, gx, gy, gz)
```

---

## BOM

### With MPU6050

| Item | Approx. Price | Notes |
|------|---------------|-------|
| ESP32-S3 Pro or Pico 2W | $10-18 | Main board |
| Adafruit MPU6050 breakout | $7 | [Product 3886](https://www.adafruit.com/product/3886) |
| STEMMA QT cable | $1 | 100mm JST-SH 4-pin |
| USB cable | -- | Power + programming |

### With ICM-20948

| Item | Approx. Price | Notes |
|------|---------------|-------|
| ESP32-S3 Pro or Pico 2W | $10-18 | Main board |
| Adafruit ICM-20948 breakout | $15 | [Product 4554](https://www.adafruit.com/product/4554). Adds magnetometer. |
| STEMMA QT cable | $1 | 100mm JST-SH 4-pin |
| USB cable | -- | Power + programming |

## Wiring

### Option A: STEMMA QT / Qwiic (recommended)

One cable. Both the Adafruit IMU breakouts and the ESP32-S3 Pro have STEMMA QT
connectors. Just plug in a 4-pin JST-SH cable.

For Pico 2W, use a [STEMMA QT adapter cable to male headers](https://www.adafruit.com/product/4209)
connected to GP4 (SDA) and GP5 (SCL).

### Option B: Jumper wires

| IMU Pin | ESP32-S3 Pro | Pico 2W |
|---------|-------------|---------|
| VCC / VIN | 3V3 | 3V3 (pin 36) |
| GND | GND | GND (pin 38) |
| SDA | GPIO 8 (default) | GP4 (pin 6) |
| SCL | GPIO 9 (default) | GP5 (pin 7) |

## Setup

### 1. Install board support

Same as the [basic example](../embedded-basic/README.md#1-install-board-support).

### 2. Install libraries

**All boards:**
- `Adafruit Unified Sensor`

**For MPU6050:**
- `Adafruit MPU6050`

**For ICM-20948:**
- `Adafruit ICM20X`

**ESP32-S3 Pro additionally:**
- `ESPAsyncWebServer` (me-no-dev)
- `AsyncTCP` (me-no-dev)
- `Adafruit NeoPixel`

### 3. Prepare flash filesystem

```
data/
  dashboard.html             <- copy from this directory
  bitwrench.umd.min.js.gz   <- gzip -k dist/bitwrench.umd.min.js
```

Copy `bitwrench.h` and `bwserve.h` from `embedded_c/` into your sketch folder.

### 4. Upload

- Upload filesystem (LittleFS upload tool)
- Edit `WIFI_SSID` and `WIFI_PASS`
- Upload sketch
- Open Serial Monitor to see IP address
- Open `http://<ip>/` in your browser

---

## Pin Table

### ESP32-S3 Pro

| Function | GPIO | Notes |
|----------|------|-------|
| I2C SDA | 8 | Default, STEMMA QT |
| I2C SCL | 9 | Default, STEMMA QT |
| NeoPixel | 40 | Onboard |
| Battery ADC | 10 | Voltage divider |

### Pico 2W

| Function | GPIO | Notes |
|----------|------|-------|
| I2C SDA | GP4 | Wire default |
| I2C SCL | GP5 | Wire default |
| LED | CYW43 | Onboard (WiFi chip) |
| VSYS ADC | A3 (GP29) | 3:1 divider |

## Flash Usage

| File | Size |
|------|------|
| `dashboard.html` | ~8 KB |
| `bitwrench.umd.min.js.gz` | ~40 KB |
| **Total** | **~48 KB** |

---

## Customization Guide

### Adding a Different I2C Sensor

The pattern is the same for any I2C sensor:

1. **Initialize** the sensor in `setup()` (or the Python equivalent)
2. **Read** the sensor value periodically
3. **Patch** the value with a unique ref ID:
   ```cpp
   BW_PATCH(m, "val-baro-pressure", pressureStr);
   bw_batch_add(&batch, m);
   ```
4. **Display** it in the dashboard:
   ```javascript
   makeStatCard('Pressure', 'val-baro-pressure')
   ```

### Changing Bar Colors or Ranges

Edit `makeAxisBar()` calls in `renderIMU()`:

```javascript
// Change accel X from red to orange, range from +/-4g to +/-8g
makeAxisBar('X', state.accelX, 8, '#f97316')
```

### Adding Data Logging

Add a log array in the dashboard and push values on each IMU update:

```javascript
var accelLog = [];
function renderIMU() {
    accelLog.push({ t: Date.now(), x: state.accelX, y: state.accelY, z: state.accelZ });
    if (accelLog.length > 100) accelLog.shift();  // Keep last 100 samples
    // ... render bars ...
}
```

---

## Troubleshooting

**I2C device not found:** Run an I2C scanner sketch to verify the address.
MPU6050 default address is `0x68` (or `0x69` if AD0 is pulled high). ICM-20948
is `0x68` (or `0x69`).

**Axis orientation seems wrong:** The IMU's axis orientation depends on how
the breakout board is mounted. The MPU6050 datasheet shows the axis directions
relative to the chip markings. Swap axis assignments in the dashboard if needed.

**Noisy data / jitter:** Enable the low-pass filter on the IMU. For MPU6050,
`imu.setFilterBandwidth(MPU6050_BAND_21_HZ)` helps. Lower sample rates also
reduce noise.

**Magnetometer reads zero:** Make sure you selected `USE_ICM20948` in the
sketch. The MPU6050 does not have a magnetometer. Also check that `val-has-mag`
is being sent as `"1"`.

**Tilt dot doesn't move:** Check that the accelerometer patches are arriving
(open browser console, look for `val-accel-x` updates). If the IMU is not
found, all values stay at zero.
