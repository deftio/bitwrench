# Raspberry Pi Pico W Dashboard

Microcontroller dashboard for the Raspberry Pi Pico W (RP2040 + CYW43 WiFi).

## What it shows

- RP2040 onboard temperature sensor
- 3 ADC channels (12-bit, 0-3.3V range) with voltage display and progress bars
- 4 PWM outputs with duty cycle controls (0%, 25%, 50%, 100%)
- 4 digital input pins with state table
- Onboard LED toggle (CYW43 on Pico W, GP25 on Pico)
- WiFi RSSI, free memory, uptime
- Event log

## Simulation

This example runs entirely in the browser with simulated data. Sensor values drift realistically. On real hardware:

1. Flash bitwrench.umd.min.js (~42KB) to the Pico W filesystem
2. Serve this HTML page from the Pico W's web server (microdot, phew, or raw usocket)
3. Replace mock functions with `fetch()` calls to device endpoints
4. Use SSE or polling for live sensor updates

## Pico W server (MicroPython)

See the commented code at the bottom of `index.html` for a minimal microdot server example that exposes sensor data and accepts LED/PWM commands.

## Hardware endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sensors` | Read all sensor values (JSON) |
| POST | `/api/led` | Set onboard LED `{ state: 0\|1 }` |
| POST | `/api/pwm/:ch` | Set PWM duty `{ duty: 0-100 }` |
| GET | `/events` | SSE stream of sensor updates |

## Key differences from ESP32

| | Pico W | ESP32 |
|--|--------|-------|
| CPU | RP2040 dual-core ARM Cortex-M0+ | Xtensa LX6 or RISC-V |
| RAM | 264KB SRAM | 520KB SRAM |
| Flash | 2MB (external) | 4MB+ |
| WiFi | CYW43 (2.4GHz) | Built-in (2.4GHz + BLE) |
| ADC | 3 channels, 12-bit | 18 channels, 12-bit |
| PIO | 2 PIO blocks (unique) | No equivalent |
| Language | MicroPython, C/C++ | Arduino, ESP-IDF, MicroPython |
| Price | ~$6 | ~$4-10 |

Both can serve bitwrench UIs. The Pico W has less RAM but PIO for custom protocols.
