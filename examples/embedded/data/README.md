# SPIFFS Data Folder

Upload this folder to your ESP32's flash filesystem (SPIFFS/LittleFS).

## Setup

1. Copy the dashboard page:
   ```bash
   cp ../esp32-dashboard.html index.html
   ```

2. Copy the gzipped bitwrench library (built by `npm run build`):
   ```bash
   cp ../../../dist/bitwrench.umd.min.js.gz .
   ```

3. Edit `index.html` to load bitwrench from the local path:
   ```html
   <script src="/bitwrench.umd.min.js"></script>
   ```
   ESPAsyncWebServer automatically serves the `.gz` file when the
   browser requests the uncompressed name.

4. Upload to SPIFFS:
   - **Arduino IDE**: Tools > ESP32 Sketch Data Upload
   - **PlatformIO**: `pio run -t uploadfs`

## Contents after setup

```
data/
  index.html                  ~5 KB
  bitwrench.umd.min.js.gz   ~40 KB
                             ------
  Total:                     ~45 KB  (out of 1.5 MB SPIFFS)
```
