# Embedded Developer Outreach & Microsite — v2.0.18 Roadmap

This document plans the embedded-focused content, community outreach, and
documentation improvements for the v2.0.18 "embedded and server" release cycle.

---

## 1. Existing Content Audit

| Asset | Location | Lines | Status |
|-------|----------|-------|--------|
| ESP32 Arduino tutorial | `docs/tutorial-embedded.md` | 309 | Good — DHT22 + SSE + bwserve C macros, r-prefix JSON |
| Standalone IoT dashboard | `examples/embedded/index.html` | 277 | Good — mock sensor data, dark theme, SSE simulation |
| Arduino sketch | `examples/embedded/sketch.ino` | ~120 | Good — matches tutorial |
| CMake POSIX demo | `examples/embedded/cmake-demo/` | — | Good — compiles on Linux/macOS, simulated sensors |
| C header (bitwrench) | `embedded_c/bitwrench.h` | ~200 | Utility macros (BW_TYPE, BW_JSON_*) |
| C header (bwserve) | `embedded_c/bwserve.h` | ~300 | BW_PATCH, BW_PATCH_SAFE, bw_batch_* macros, r-prefix |
| Python bwserve | `embedded_python/bwserve.py` | ~500 | Full bwserve client — SSE + HTTP, Flask/aiohttp helpers |
| Rust bwserve | `embedded_rust/src/` | — | Cargo crate, protocol types + SSE client |
| bwserve docs | `docs/bwserve.md` | ~720 | Comprehensive — protocol, API ref, examples, pipe server |
| bwserve protocol page | `pages/12-bwserve-protocol.html` | — | Live — interactive protocol reference |
| bwserve sandbox page | `pages/14-bwserve-sandbox.html` | — | Live — try protocol in browser, no server |

### Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| No dedicated embedded landing page on the site | Embedded devs can't find content from nav | High |
| Tutorial not linked from site navigation | Discoverable only via direct URL | High |
| No device control panel example (GPIO, PWM, relays) | Missing the #1 embedded use case | High |
| No system info / diagnostics example | Common need for embedded dashboards | Medium |
| No comparison table vs ESPUI/ESP-DASH/raw HTML | Devs can't evaluate tradeoffs | High |
| No PlatformIO project template | PlatformIO is dominant in ESP32 community | Medium |
| embedded_python/ not linked from tutorial or site | Python/MicroPython devs miss it | Medium |
| embedded_rust/ not linked from tutorial or site | Rust embedded devs miss it | Low |
| No "try without hardware" path on the site | Can't evaluate without buying hardware | High |
| v2.0.17 doc trust issues (see Section 6) | New devs hit broken APIs in first hour | High |

---

## 2. Embedded Value Proposition

### Why bitwrench for embedded devices?

**Size budget** — bitwrench at 40KB gzipped (~95KB UMD min) fits comfortably in
ESP32's 1.5MB SPIFFS partition, using ~6.5% of available flash. A typical
dashboard HTML page adds 2-5KB. Total: ~100KB out of 1.5MB.

**No build step** — No Node.js, npm, webpack, or transpilation on the device.
Upload `bitwrench.umd.min.js` and your HTML to SPIFFS. Done.

**bwserve SSE protocol** — Purpose-built for constrained devices. The MCU sends
tiny JSON patches (~200 bytes per update); the browser does all rendering.
SSE is HTTP/1.1-native — no WebSocket upgrade, no library dependencies.

**C macros** — `BW_PATCH`, `BW_PATCH_SAFE`, `bw_batch_*` compose protocol
messages from C string literals. The r-prefix relaxed JSON format avoids
double-quote escaping in C — a major ergonomic win over raw `snprintf`.

**Multi-language** — Same protocol works from C/C++ (Arduino), Python
(MicroPython/CircuitPython), Rust (esp-idf), and Node.js. Write the
firmware in your language; the browser UI is always the same.

### Comparison: bitwrench vs alternatives

| Feature | bitwrench + bwserve | ESPUI | ESP-DASH | Raw HTML | React SPA |
|---------|-------------------|-------|----------|----------|-----------|
| Flash size (JS+CSS) | ~100KB | ~180KB | ~120KB | 0 | 500KB+ |
| Build step required | No | No | No | No | Yes (Node.js) |
| Custom UI layout | Full (TACO) | Widget grid | Card grid | Full (manual) | Full (JSX) |
| Real-time updates | SSE (built-in) | WebSocket | WebSocket | Manual polling | Manual |
| Server protocol | bwserve (9 ops) | Internal | Internal | None | REST/WS |
| Multi-device support | C, Python, Rust, JS | C++ only | C++ only | Any | JS only |
| Theming | `generateTheme()` | Basic | Basic | Manual | CSS-in-JS |
| IE11 / legacy browser | Yes | No | No | Depends | No |
| Reusable outside IoT | Yes (full UI lib) | No | No | N/A | Yes |
| Node.js on device | Not needed | Not needed | Not needed | Not needed | Required |

### Key differentiator

ESPUI and ESP-DASH are widget toolkits — they give you buttons, sliders, and
charts with a fixed layout. bitwrench gives you a **full UI composition
system** that happens to also work on microcontrollers. The same skills and
components you use for a desktop web app work identically on an ESP32 dashboard.

---

## 3. New Example Pages Needed

### 3a. Sensor Dashboard (real-time charts)

**What**: Multi-sensor dashboard with live updating values and sparkline
history charts via bwserve SSE.

**Content**:
- Temperature, humidity, pressure, light level cards
- Sparkline history using `bw.makeTable()` or inline SVG via TACO
- Connection status indicator
- Configurable update interval

**Files to create**:
- `examples/embedded/sensor-dashboard.html` — browser-side UI
- `examples/embedded/sensor-dashboard.ino` — Arduino sketch (ESP32 + BME280)
- `examples/embedded/platformio-sensor/` — PlatformIO project template

**Demonstrates**: `bw.patch()`, `bw.patchAll()`, batch updates, SSE reconnection

### 3b. Device Control Panel (GPIO, PWM, relays)

**What**: Interactive control panel for toggling GPIO pins, adjusting PWM
duty cycle via sliders, and controlling relay modules.

**Content**:
- Toggle switches for digital outputs (LED, relay)
- PWM slider with live duty cycle percentage
- Pin status readback (input pins)
- Command acknowledgment display

**Files to create**:
- `examples/embedded/control-panel.html` — browser-side UI
- `examples/embedded/control-panel.ino` — Arduino sketch

**Demonstrates**: `data-bw-action` (browser-to-device), `bw.patch()` (device-to-browser), bidirectional control

### 3c. System Info Page (diagnostics)

**What**: Device health and diagnostics dashboard showing memory usage,
uptime, WiFi signal strength, filesystem stats.

**Content**:
- Free heap / total heap progress bar
- SPIFFS used / total progress bar
- WiFi RSSI signal strength indicator
- Uptime counter
- IP address, MAC address, chip model
- Auto-refresh via `bw.patchAll()` batch

**Files to create**:
- `examples/embedded/system-info.html` — browser-side UI
- `examples/embedded/system-info.ino` — Arduino sketch

**Demonstrates**: `bw.makeTable()`, `bw.patchAll()`, progress bars via TACO

### Implementation notes for all examples

- Each example must work standalone (single HTML file + sketch)
- Include a "try without hardware" mode using `examples/embedded/cmake-demo/` pattern
- HTML pages should use bitwrench dogfooding pattern (`bw.DOM('#app', ...)`)
- Sketches should use `bwserve.h` macros, not raw `snprintf`
- PlatformIO configs should target `esp32dev` board with `ESPAsyncWebServer` lib

---

## 4. Embedded Microsite Page

### New page: `pages/16-embedded.html`

A dedicated landing page for embedded developers, accessible from the site
navigation.

### Content sections

1. **Hero**: "bitwrench for Embedded Devices" — one-sentence pitch
2. **Size comparison**: Visual bar chart showing bitwrench vs ESPUI vs ESP-DASH vs React, relative to ESP32 flash
3. **Architecture diagram**: ASCII/SVG showing ESP32 → SSE → browser → bw.clientApply() → DOM
4. **Quick start code**: Minimal Arduino sketch + HTML (copy-pasteable)
5. **Supported platforms**: Table of C/Python/Rust/Node.js with links to respective embedded_* dirs
6. **Example gallery**: Cards linking to sensor-dashboard, control-panel, system-info examples
7. **"Try without hardware"**: Instructions for cmake-demo POSIX build and `bwcli serve --stdin` pipe mode
8. **Community links**: Forums and platforms for feedback (see Section 5)

### Nav integration

Add "Embedded" to the site navigation. Current page numbering goes up to 15.
Page 16 is the next available slot.

### Implementation

- Use TACO dogfooding pattern (no raw HTML body)
- Use `bw.generateTheme()` for consistent styling
- Use `bw.makeCard()`, `bw.makeTable()` for content layout
- Include comparison table from Section 2

---

## 5. Community Feedback & Guidance

### Where to get feedback from embedded developers

| Platform | Section / Subreddit | Format | Notes |
|----------|-------------------|--------|-------|
| **Arduino Forum** (forum.arduino.cc) | Project Guidance | Forum thread | Largest Arduino community. Post as "feedback request" with link to tutorial + examples. Moderators prefer self-contained posts, not just links. |
| **ESP32 Forum** (esp32.com) | General Discussion | Forum thread | Official Espressif community forum. Technical audience, expects working code. |
| **r/esp32** | — | Reddit post | ~120K members. Show the dashboard screenshot + code snippet. "Weekend project" framing works well. |
| **r/arduino** | — | Reddit post | ~1M members. Focus on the "no build step" angle — Arduino devs hate npm. |
| **r/embedded** | — | Reddit post | More experienced audience. Emphasize protocol design and multi-language support. |
| **Hackaday.io** | Project page | Project writeup | Create a full project page with photos, schematic, BOM. Hackaday editors may feature it. |
| **Hackster.io** | Tutorial | Step-by-step tutorial | Similar to Hackaday but more tutorial-focused. Include PlatformIO integration. |
| **Adafruit Playground** | Learning guide | Guide format | CircuitPython angle — use `embedded_python/bwserve.py` with Adafruit boards. |
| **Raspberry Pi Forums** | Interfacing | Forum thread | Python bwserve on RPi — sensor monitoring, home automation dashboards. |
| **PlatformIO Community** (community.platformio.org) | Projects | Forum thread | PlatformIO users are power users. Show the `platformio.ini` integration. |

### Outreach strategy

1. **Build all examples first** — Never post to forums with incomplete code
2. **Screenshot-driven** — Every post leads with a screenshot of the running dashboard
3. **Self-contained** — Forum posts include the complete minimal example (sketch + HTML), not just "go read our docs"
4. **Honest positioning** — bitwrench is not a competitor to ESPUI for simple widget dashboards. It's for developers who want full UI control without a build step
5. **Ask for feedback, not users** — "I built this, would love feedback on the approach" framing, not "use my library"
6. **Link to "try without hardware"** — Lower the barrier. Devs can evaluate without buying an ESP32

### What to post

**Short version** (Reddit, forum threads):
> I built a lightweight way to serve web dashboards from ESP32 without needing
> Node.js or a build step. The JS library is 39KB gzipped, the MCU sends JSON
> patches over SSE, and the browser does all rendering. It supports C macros
> for composing protocol messages without double-quote escaping.
>
> [screenshot]
>
> Full tutorial: [link to tutorial-embedded.md or pages/16-embedded.html]
> Try without hardware: [link to cmake-demo instructions]
>
> Looking for feedback on the approach, especially from anyone who's used
> ESPUI or ESP-DASH and hit their limits.

**Long version** (Hackaday, Hackster):
- Full project writeup with architecture diagram
- Bill of materials (ESP32 DevKit + DHT22)
- Step-by-step with photos
- Performance numbers (heap usage, SSE frame size, update latency)
- Comparison table (Section 2)

---

## 6. v2.0.17 Feedback Fixes

Items from `dev/bw-v2.0.17-feedback.md` (Ember & Oak assessment) that directly
affect embedded developer trust and experience.

### 6a. `makeDataTable()` — documented but doesn't exist

**Problem**: The LLM guide lists `bw.makeDataTable({ title, data, columns,
responsive, striped })`. It doesn't exist. The source has `makeTable()` and
`makeTableFromArray()`. A new developer copying from the docs gets a runtime
error on their first table.

**Fix**: Either implement `makeDataTable()` as an alias/wrapper, or remove it
from the LLM guide and all documentation. Decision: **remove from docs** —
`makeTableFromArray()` already covers this use case.

**Impact on embedded**: Sensor dashboards use tables extensively. A broken
table API in the first 10 minutes destroys confidence.

### 6b. Tier 1 vs Tier 2 template binding — silent failures

**Problem**: Writing `${count * 2}` in a template string silently fails in
Tier 1 mode (shows `0` or the literal string). No console warning. Only
the LLM guide mentions this, and only briefly.

**Fix**:
- Add a `console.warn` in bitwrench when a Tier 2 expression is detected
  in a Tier 1 context (regex: `\$\{[^}]*[^a-zA-Z0-9_.}\s][^}]*\}`)
- Document the constraint prominently in the events/template section
- Show explicit examples of what doesn't work in Tier 1

**Impact on embedded**: Embedded devs often compute display values
(`${temp * 9/5 + 32}` for F/C conversion). Silent failure is confusing.

### 6c. `onclick` in `a:` rule — critical but buried

**Problem**: The most important behavioral rule — "put event handlers in
`onclick` inside `a:{}`, never in `o.mounted`" — appears once in the LLM
guide with no emphasis. When a component re-renders, mounted-hook listeners
on the old element are silently lost.

**Fix**:
- Add a bold warning box at the top of the events documentation
- Show side-by-side BAD (mounted + addEventListener) vs GOOD (a: { onclick })
- Include the failure mode: "handlers silently lost on re-render"

**Impact on embedded**: Device control buttons (LED toggle, relay switch)
that stop working after a UI update are a critical failure.

### 6d. `bw.responsive()` vs `bw.css()` — return value confusion

**Problem**: Both return CSS strings, but they feel like they should be the
same API. Developers need to `.join('\n')` them before `bw.injectCSS()`.
This isn't immediately obvious.

**Fix**: Document the join pattern prominently:
```javascript
bw.injectCSS([
  bw.css({ '.card': { padding: '1rem' } }),
  bw.responsive('.card', { base: { width: '100%' }, md: { width: '50%' } })
].join('\n'));
```

**Impact on embedded**: Embedded dashboards need responsive layouts (phone
vs tablet vs desktop viewing the same device). The join pattern must be obvious.

### 6e. `bw.funcRegister()` — retrieval asymmetry

**Problem**: Register with `bw.funcRegister(fn, 'myName')`, retrieve with
`bw.funcGetById('myName')`. The asymmetry (funcRegister vs funcGetById)
suggests different mental models (name-based vs id-based).

**Fix**: Document the SSR use case explicitly — `funcRegister` exists so
that `onclick` handlers survive `bw.htmlPage()` serialization. Without this
context, it looks like a solution without a problem.

**Impact on embedded**: Lower priority for embedded (SSR isn't common on
MCUs), but confusing API names erode trust in the whole library.

---

## 7. Documentation Improvements

### 7a. "Embedded Quick Start" in main docs

Add a new section to `docs/` (or a prominent callout in the README) with:
- 3-step quick start: upload files, flash sketch, open browser
- Memory budget table (from tutorial)
- Link to full tutorial and examples

### 7b. Link tutorial from site navigation

`docs/tutorial-embedded.md` is currently only discoverable via direct URL
or the bwserve docs cross-reference. Add it to:
- The site index page (`pages/index.html`)
- The new embedded landing page (`pages/16-embedded.html`)
- The bwserve protocol page (`pages/12-bwserve-protocol.html`) sidebar

### 7c. Size budget comparison table

Create a reusable comparison showing bitwrench vs alternatives vs device
flash capacity:

| Library | Minified | Gzipped | % of ESP32 SPIFFS (1.5MB) | % of ESP8266 SPIFFS (1MB) |
|---------|----------|---------|---------------------------|---------------------------|
| bitwrench UMD min | ~95KB | ~39KB | 6.2% | 9.3% |
| bitwrench + HTML page | ~100KB | ~41KB | 6.5% | 9.8% |
| ESPUI | ~180KB | ~60KB | 11.7% | 17.6% |
| ESP-DASH | ~120KB | ~45KB | 7.8% | 11.7% |
| React + ReactDOM | ~140KB | ~45KB | 9.1% | 13.7% |
| React + build deps | 500KB+ | 150KB+ | 32.6%+ | 48.8%+ |

Note: React requires a Node.js build step that can't run on the MCU.
bitwrench, ESPUI, and ESP-DASH are all upload-and-go.

### 7d. "Try without hardware" documentation

Ensure every embedded example includes a "try without hardware" path:
- `cmake-demo/` POSIX build for the sensor dashboard pattern
- `bwcli serve --stdin` pipe mode for any language
- `pages/14-bwserve-sandbox.html` for protocol experimentation
- Mock data mode in browser-side HTML (already in `examples/embedded/index.html`)

### 7e. Cross-link embedded language implementations

Each `embedded_*/README.md` should link to:
- The main tutorial (`docs/tutorial-embedded.md`)
- The bwserve protocol docs (`docs/bwserve.md`)
- The embedded landing page (`pages/16-embedded.html`)
- The other language implementations (C devs might want to see the Python version)

---

## Implementation Priority

| Priority | Item | Section | Est. effort |
|----------|------|---------|------------|
| P0 | Fix `makeDataTable()` doc inconsistency | 6a | Small |
| P0 | Add `onclick in a:` warning to docs | 6c | Small |
| P0 | Create `pages/16-embedded.html` landing page | 4 | Medium |
| P1 | Device control panel example | 3b | Medium |
| P1 | System info example | 3c | Medium |
| P1 | Link tutorial from site nav | 7b | Small |
| P1 | Tier 1/2 silent failure warning | 6b | Medium |
| P2 | Sensor dashboard with charts | 3a | Large |
| P2 | PlatformIO project templates | 3 (all) | Medium |
| P2 | Size budget comparison table | 7c | Small |
| P2 | Cross-link embedded READMEs | 7e | Small |
| P3 | Community forum posts | 5 | Ongoing |
| P3 | Hackaday/Hackster project pages | 5 | Large |
| P3 | `bw.responsive()` join pattern docs | 6d | Small |
| P3 | `funcRegister()` SSR context docs | 6e | Small |

---

## Success Criteria

1. A developer with an ESP32 can go from zero to running dashboard in < 30 minutes
2. All examples work without hardware (cmake-demo or mock data mode)
3. The site has a discoverable embedded section (nav link + landing page)
4. The v2.0.17 doc trust issues (Section 6) are resolved before community posting
5. At least one forum post gets substantive technical feedback (not just "cool project")
6. The comparison table honestly shows where bitwrench wins AND where ESPUI/ESP-DASH are simpler choices
