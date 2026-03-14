# Raspberry Pi GPIO Controller

Simulated Raspberry Pi GPIO pin controller with 8 configurable pins, state table, and activity log.

## What It Demonstrates

- `makeButton`, `makeButtonGroup` for pin toggle controls
- `makeBadge` for pin state (HIGH/LOW) and direction (IN/OUT) indicators
- `makeTable` for pin state overview
- `makeCard` for per-pin control panels
- `makeListGroup` for activity log
- `makeAlert` for simulation banner
- Event-driven re-rendering on state changes

## Simulated vs Real

**Simulated:** Pin toggling updates local JS state. Input pins change randomly every 3 seconds.

**Real hardware:** The Raspberry Pi serves this HTML page and exposes:
- `GET /api/gpio` — read all pin states
- `POST /api/gpio/:pin` — set pin state `{ value: 0|1, direction: "in"|"out" }`
- `GET /events` — SSE stream of pin change events

Replace the mock functions in the `<script>` block with `fetch()` and `EventSource` calls.

## Running

Open `index.html` in any browser. No build step, no server needed for simulation mode.
