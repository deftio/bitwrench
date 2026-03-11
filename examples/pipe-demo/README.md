# Pipe Demo — bwcli serve + any language

Demonstrates the `bwcli serve` pipe server. Any language can push UI to a browser by POSTing JSON — no Node.js library needed.

## Quick Start

Terminal 1 — start the server:
```bash
cd examples/pipe-demo
npx bwcli serve --port 8080 --listen 9000 -v
# Open http://localhost:8080
```

Terminal 2 — send UI from the command line:
```bash
# Replace #app with a heading
curl -s -X POST http://localhost:9000 \
  -d '{"type":"replace","target":"#app","node":{"t":"h1","c":"Hello from curl!"}}'

# Patch text into an element
curl -s -X POST http://localhost:9000 \
  -d '{"type":"replace","target":"#app","node":{"t":"div","c":[{"t":"h2","c":"Temperature"},{"t":"div","a":{"id":"temp","style":"font-size:3rem"},"c":"--"}]}}'

curl -s -X POST http://localhost:9000 \
  -d '{"type":"patch","target":"temp","content":"23.5 C"}'
```

## Pipe mode (stdin)

```bash
# From a shell script
echo '{"type":"replace","target":"#app","node":{"t":"h1","c":"Piped!"}}' | npx bwcli serve --stdin --port 8080
```

## sensor.sh — simulated sensor loop

```bash
bash sensor.sh
```

Sends temperature readings every 2 seconds via `curl`. See `sensor.sh` for the full script.

## From other languages

The pipe server accepts any HTTP POST with a JSON body. Examples:

**Python:**
```python
import requests
requests.post("http://localhost:9000", json={
    "type": "patch", "target": "temp", "content": "24.1 C"
})
```

**Rust:**
```bash
curl -X POST http://localhost:9000 -d '{"type":"patch","target":"temp","content":"24.1 C"}'
```

**C (ESP32):**
Uses relaxed JSON — see `embedded_c/` for r-prefix macros.

## Files

| File | Description |
|------|-------------|
| `sensor.sh` | Bash loop that curls sensor data every 2s |
| `README.md` | This file |
