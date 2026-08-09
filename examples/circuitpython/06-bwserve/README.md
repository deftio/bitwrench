# 6 -- the device pushes

Server-Sent Events. The browser opens one connection and the device sends *patches* whenever it likes -- a changed value costs a few dozen bytes, not a re-render.

This is the first example that needs `bwserve.py`. Examples 1-4 needed nothing but `json.dumps`.

**Try it:** open the page in two browsers. Both update together, with no polling.

**Routes:** `GET /`, `GET /ui.json`, `GET /events` (SSE), `GET /js/bitwrench.js`

## Run it on your computer first

No board needed. This catches typos and lets you see the UI before flashing.

```
cd 05-bwserve
python3 code.py
```

If it says `adafruit_httpserver is not installed`, either
`pip install adafruit-circuitpython-httpserver` or use `../run.sh`,
which sets up a virtualenv for you.

Open the URL it prints. The same `code.py` then runs unchanged on a board.

## Put it on a board

1. Copy `bw_board.py` and this `code.py` to the CIRCUITPY drive
2. Copy `settings.toml.example` to the drive as `settings.toml`, fill in your WiFi
3. `circup install adafruit_httpserver`
4. Copy `dist/bitwrench.umd.min.js.gz` to `/www/` on the drive (44.8KB)
5. Copy `embedded_python/bwserve.py` to `/lib/` on the drive
6. Open the serial console -- it prints the URL to visit

Works unchanged on ProS3, QT Py ESP32-S3 and Pico 2 W.
