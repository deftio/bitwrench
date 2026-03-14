# Home Automation Panel

Simulated smart home control panel with room sensors, light controls, thermostat, and door locks.

## What It Demonstrates

- `makeCard` for room panels with multiple control types
- `makeBadge` for sensor readings (temperature, humidity) and lock status
- `makeButton` for light toggles and lock controls
- `makeRange` for brightness dimmer sliders
- `makeButtonGroup` for thermostat mode selection (heat/cool/auto/off)
- `makeStatCard` for thermostat setpoint display
- `makeTable` for room summary overview
- Sensor drift simulation for realistic temperature/humidity changes

## Simulated vs Real

**Simulated:** Sensor values drift every 3 seconds. Light, brightness, lock, and thermostat controls update local JS state.

**Real hardware:** A smart home hub (Raspberry Pi, ESP32, etc.) serves this page and exposes:
- `GET /api/rooms` — read room sensor data and device states
- `POST /api/devices/:id` — control devices (light, thermostat, lock)
- `GET /events` — SSE stream of sensor updates

Replace the mock functions with `fetch()` and `EventSource` calls to connect to your home automation hub (Home Assistant, custom, etc.).

## Running

Open `index.html` in any browser. No build step, no server needed for simulation mode.
