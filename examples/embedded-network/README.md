# Network Device Monitor

Simulated network switch/router monitoring panel with interface status, throughput, and error rates.

## What It Demonstrates

- `makeStatCard` for overview metrics (uptime, total traffic, packets, errors)
- `makeCard` for per-interface detail panels
- `makeProgress` for TX/RX load bars
- `makeBadge` for interface status (UP/DOWN), speed, and error counts
- `makeListGroup` for TX/RX statistics
- `makeButton` for port enable/disable
- Realistic traffic patterns with occasional burst simulation

## Simulated vs Real

**Simulated:** Traffic counters increment via random intervals. Interface enable/disable updates local state. Burst traffic events occur randomly.

**Real hardware:** A network switch or router serves this page and exposes:
- `GET /api/interfaces` — read interface states and counters
- `POST /api/interfaces/:id` — enable/disable interface
- `GET /events` — SSE stream of traffic stats (or poll SNMP MIBs)

Replace the mock functions with `fetch()` and `EventSource` (or SNMP polling) calls.

## Running

Open `index.html` in any browser. No build step, no server needed for simulation mode.
