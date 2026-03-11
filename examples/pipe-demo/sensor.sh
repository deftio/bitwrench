#!/usr/bin/env bash
# sensor.sh — Simulated sensor loop for bwcli serve pipe demo
#
# Usage:
#   Terminal 1: npx bwcli serve --port 8080 --listen 9000 -v
#   Terminal 2: bash sensor.sh
#   Browser:    http://localhost:8080

INPUT_PORT=${1:-9000}
URL="http://localhost:$INPUT_PORT"

echo "Sending sensor data to $URL every 2 seconds..."
echo "Press Ctrl+C to stop."

# Set up the dashboard layout first
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "type": "replace",
  "target": "#app",
  "node": {
    "t": "div",
    "a": {"style": "max-width:500px;margin:2rem auto;font-family:system-ui,sans-serif"},
    "c": [
      {"t": "h1", "a": {"style": "text-align:center"}, "c": "Sensor Dashboard"},
      {"t": "div", "a": {"style": "display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:2rem 0"}, "c": [
        {"t": "div", "a": {"style": "background:#f0f9ff;padding:1.5rem;border-radius:8px;text-align:center"}, "c": [
          {"t": "div", "a": {"style": "color:#64748b;font-size:0.8rem"}, "c": "Temperature"},
          {"t": "div", "a": {"id": "temp", "style": "font-size:2rem;font-weight:700;color:#0369a1"}, "c": "--"}
        ]},
        {"t": "div", "a": {"style": "background:#f0fdf4;padding:1.5rem;border-radius:8px;text-align:center"}, "c": [
          {"t": "div", "a": {"style": "color:#64748b;font-size:0.8rem"}, "c": "Humidity"},
          {"t": "div", "a": {"id": "hum", "style": "font-size:2rem;font-weight:700;color:#15803d"}, "c": "--"}
        ]}
      ]},
      {"t": "div", "a": {"id": "status", "style": "text-align:center;color:#94a3b8;font-size:0.8rem"}, "c": "Waiting for data..."}
    ]
  }
}' > /dev/null

echo "Dashboard created. Sending readings..."

while true; do
  # Generate random sensor values
  TEMP=$(awk "BEGIN{printf \"%.1f\", 20 + rand() * 10}")
  HUM=$(awk "BEGIN{printf \"%.0f\", 40 + rand() * 30}")
  TIME=$(date +%H:%M:%S)

  # Send batch update
  curl -s -X POST "$URL" -H "Content-Type: application/json" -d "{
    \"type\": \"batch\",
    \"ops\": [
      {\"type\": \"patch\", \"target\": \"temp\", \"content\": \"${TEMP} C\"},
      {\"type\": \"patch\", \"target\": \"hum\", \"content\": \"${HUM}%\"},
      {\"type\": \"patch\", \"target\": \"status\", \"content\": \"Last update: ${TIME}\"}
    ]
  }" > /dev/null

  echo "  $TIME  temp=${TEMP}C  hum=${HUM}%"
  sleep 2
done
