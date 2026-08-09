# 3 -- Python composes the UI

The UI moves out of the page and into Python. `json.dumps()` on a dict is the whole trick.

bitwrench also moves onto the device here, so the page works with no internet.

**Try it:** add a field to `build_ui()`. You are composing UI in Python now.

**Routes:** `GET /`, `GET /js/bitwrench.js`

## Run it on your computer first

No board needed. This catches typos and lets you see the UI before flashing.

```
cd 02-json-dumps
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
5. Open the serial console -- it prints the URL to visit

Works unchanged on ProS3, QT Py ESP32-S3 and Pico 2 W.
