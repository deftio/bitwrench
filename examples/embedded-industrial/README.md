# Industrial HMI Panel

Simulated Human-Machine Interface for industrial process control with process variables, alarms, and equipment controls.

## What It Demonstrates

- `makeStatCard` for process variable readings (pressure, flow, temperature, pH)
- `makeProgress` as process variable gauges with color-coded thresholds
- `makeAlert` for alarm indicators (normal/warning/critical)
- `makeBadge` for equipment status (RUNNING/STOPPED)
- `makeButton` for pump/mixer controls and emergency stop
- `makeCard` for equipment control panels
- Random-walk simulation for realistic process variable drift

## Simulated vs Real

**Simulated:** Process variables drift via random walk. Equipment controls update local state. E-Stop disables all equipment.

**Real hardware:** A PLC or industrial PC serves this page and exposes:
- `GET /api/process` — read process variables
- `POST /api/control` — send control commands (pump on/off, e-stop)
- `GET /events` — SSE stream of process updates and alarms

Replace the mock functions with `fetch()` and `EventSource` calls to connect to real SCADA/PLC systems.

## Running

Open `index.html` in any browser. No build step, no server needed for simulation mode.
