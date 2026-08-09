# Embedded tutorial series — design doc (2.1.x)

Status: design, not yet implemented. Target branch: `feature/embedded-workflows`.

This is the plan for the embedded story: what we teach, in what order, on which
boards, and why. It covers the CircuitPython series first. MicroPython and C/C++
are ports of the same ladder and are scoped at the end.

---

## 1. The thesis

bitwrench brings modern, styled, component-based UI to embedded devices, and it
does it in a way no other library can:

- **The device holds no UI framework.** It holds a fixed HTML shell (~400 bytes)
  and produces TACO objects. In Python a TACO *is a dict* -- there is no helper
  library to install, no template engine, no build step.
- **One file, 52 components.** `bitwrench.umd.min.js` is 44.8KB gzipped and
  contains the framework *and* all 52 BCCL factories (`makeCard`, `makeTable`,
  `makeForm`, `makeNavbar`, ...). A React equivalent needs React, a component
  library, and a bundler -- none of which fit on, or run on, a microcontroller.
- **Theming is JSON.** `bw.loadStyles({primary: '#2563eb'})` derives an entire
  palette from a seed colour. An embedded developer brands their device UI by
  changing a hex string, with no CSS file anywhere in the project.

The measurable claim we lead with in every article: **device-side code footprint
in single-digit KB**, printed in the README of each rung.

---

## 2. Delivery modes, and the moment CDN stops working

Two ways to get bitwrench into the page. They are interchangeable -- one line in
the shell -- but they fail differently, and that difference drives article order.

| Mode | Device cost | Requires |
|---|---|---|
| CDN (`cdn.jsdelivr.net/npm/bitwrench@x.y.z/...`) | ~0 | the **browser** to have internet |
| Local (`/js/bitwrench.js`) | 44.8KB gz on flash | nothing |

The non-obvious part, and worth stating plainly in article 1: **CDN mode does not
require the device to have internet -- it requires the laptop or phone viewing the
page to have it.** The device only serves the shell.

That is fine for a dashboard on home WiFi. It **fails completely for provisioning**,
where the client is joined to the device's own access point with no route out.
Since provisioning is our strongest use case, the series moves to local delivery in
article 2 and stays there.

Verified: jsDelivr and unpkg both serve `bitwrench@2.1.5` (full and lean), HTTP 200.
SRI hashes for every dist file are published in `dist/sri.json`, so the CDN shell can
carry `integrity=`.

---

## 3. The shell

Fixed across every rung and both delivery modes. The only thing that varies is the
final boot line.

```html
<!doctype html><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Sensor Node</title>
<script src="/js/bitwrench.js"></script>   <!-- or the pinned CDN URL -->
<div id=app></div>
<script>
  bw.loadStyles({ primary: '#2563eb' });
  /* rung-specific boot line goes here */
</script>
```

No CSS file is ever served. `bw.loadStyles()` generates the design system at
runtime, so local delivery is exactly **one** file.

### The spine

Every rung makes the same call. Only the origin of `taco` changes:

```js
bw.DOM('#app', taco)
```

| Rung | Where `taco` comes from |
|---|---|
| 1 | a literal in the page |
| 2 | Python built it, substituted into the page |
| 3 | fetched from `/ui.json` after load |
| 4 | refetched after the device handled a form post |
| 5 | pushed by the device over SSE |

This is why the first page is a *static TACO* rather than static HTML: nothing the
reader learns in rung 1 gets thrown away.

---

## 4. The ladder

Each rung introduces exactly one idea.

**Rung 1a — one object, one element.**
Device serves the shell; each TACO is shown three ways -- the object, the live
element, and the HTML behind it. Introduces `t`, `a`, `c` and `bw.DOM()`. Loads
bitwrench from the CDN, so the device holds a shell and nothing else. No BCCL --
that comes later, once raw TACO is second nature.

**Rung 1b — TACOs inside TACOs.**
The only remaining rule: `c` holds a string, a TACO, or an array of them. Ends on
children built from data with `.map()`, which is the part that lands -- a TACO is
an ordinary object, so ordinary code makes one.

**Rung 2 — making it look good.**
Styling, in three sizes: `bw.s()` inline styles, the classes that already ship,
and `bw.loadStyles({primary})` deriving an entire palette from one seed colour.
First event handler (`a: {onclick}`) drives a theme switcher, which establishes
the update model: something changed, so call `render()` again. Also the first
example to serve bitwrench off the filesystem rather than a CDN -- from here on
the page works with no internet at all.

**Rung 3 — Python composes the UI.**
`json.dumps(taco)` substituted into the served page. Still a static page, but the
*device* now owns the content. This is the "oh" moment.

**Rung 4 — the device owns the page.**
Shell fetches `/ui.json` on load. Single-page app. Note this is **pull, not push** --
saying "push" here would rob rung 6 of its payoff.

**Rung 5 — input comes back.**
A button or select posts to a route; the device updates state and the page refetches.
Deliberately clunky. The clunkiness is what earns rung 6.

**Rung 6 — bwserve.**
SSE. The device pushes UI and receives events without a reload. `adafruit_httpserver`
supports Server-Sent Events and chunked transfer encoding, so the whole ladder runs on
one library with no stack swap partway.

**Rung 7 (planned) — BCCL.**
"Send data, not UI": the device sends rows and values, the browser composes them
with `makeTable`, `makeCard` and the rest. Deliberately last, so the reader meets
the components knowing exactly what they return.

---

## 5. Boards

All verified on CircuitPython 10.2.1 via circuitpython.org.

| Board | Chip | Flash / PSRAM | Role |
|---|---|---|---|
| Unexpected Maker ProS3 | ESP32-S3 | 16MB / 8MB | reference; most headroom |
| Adafruit QT Py ESP32-S3 | ESP32-S3 | 4MB / 2MB | Adafruit representation, STEMMA QT |
| Raspberry Pi Pico 2 W | RP2350 + CYW43 | 4MB / no PSRAM | different silicon, tightest RAM |

Two silicon families, three vendors -- enough to make the portability claim credible.

**QT Py's STEMMA QT matters**: a sensor demo becomes "plug the cable in", with no
soldering and no wiring diagram. That serves the "dead easy setup" goal better than
any prose.

### Boards evaluated and deferred

- **XIAO ESP32-C6** -- CircuitPython 10.2.1, WiFi 6, fully supported, *but no native
  USB*: no CIRCUITPY drive appears, and code must be loaded via Web Workflow. That
  needs its own setup section rather than a footnote.
- **Arduino Nano RP2040 Connect** -- WiFi comes from a u-blox NINA-W102 co-processor
  rather than native `wifi`, so network bring-up differs. `adafruit_httpserver`
  accepts `socketpool` *or* `socket`, so the server code should port; only connection
  setup changes.
- **Adafruit Feather ESP32-S3** -- equivalent to the QT Py. Note CircuitPython 10+ on
  4MB boards needs TinyUF2 bootloader >= 0.33.0.

### Repository layout

One `code.py` per rung plus a single board shim -- **not** fifteen files.

```
examples/circuitpython/
  bw_board.py           # boot banner, mDNS, WWW path; desktop and board
  run.sh                # ./run.sh 3  -- runs any rung on a laptop, no board
  settings.toml.example
  01a-taco-basics/code.py
  01b-taco-nesting/code.py
  02-styling/code.py
  03-json-dumps/code.py
  04-fetch-ui/code.py
  05-round-trip/code.py
  06-bwserve/code.py
```

Board differences turned out to be smaller than expected -- CircuitPython connects
WiFi from `settings.toml` before `code.py` runs -- so the three per-board shims
collapsed into one `bw_board.py` that also runs on desktop CPython. Each `code.py`
is byte-identical across boards. That is the thesis made visible: the device
returns a dict, the board is a footnote.

---

## 5a. Boot banner convention (all runtimes)

Every example prints a banner on boot giving the reader the URL to open. Without
it they have to go hunting in the router's DHCP table, which alone breaks the
five-minute promise.

```
bitwrench example 03 - fetch-ui
board    : Unexpected Maker ProS3 (CircuitPython 10.2.1)
network  : MyWiFi
open     : http://sensor.local     <- mDNS
           http://192.168.1.42     <- direct, if .local does not resolve
serving  : bitwrench 2.1.6 from /js/bitwrench.js (local, gzipped)
```

Rules:

- **Print both the mDNS name and the raw IP.** `mdns.Server(wifi.radio)` is
  available on 300+ CircuitPython boards including the ESP32 family and Pico W,
  and `.local` is far friendlier than an address. But mDNS resolution fails on
  some corporate networks and older Android clients, so the IP is the fallback
  that always works. (Verify mDNS on the Pico 2 W specifically -- the module list
  names RP2040 Pico W; RP2350 needs confirming on hardware.)
- **Print it as a full `http://` URL.** Most terminals linkify it, so the reader
  clicks instead of typing.
- **State the delivery mode and version** -- CDN or local, and which bitwrench
  version. This is the first thing to check when a page renders unstyled.
- **Handle AP mode.** When the device is its own access point (provisioning),
  the address is the gateway, typically `http://192.168.4.1`. Print that instead.

Implementation lives in the shared board shim (`boards/pros3.py` and friends), so
all five rungs get it automatically and no rung duplicates it. Per runtime:

| Runtime | Address source |
|---|---|
| CircuitPython | `wifi.radio.ipv4_address`, `mdns.Server(wifi.radio)` |
| MicroPython | `wlan.ifconfig()[0]` |
| Arduino / C++ | `WiFi.localIP()` |
| ESP-IDF | `esp_netif_get_ip_info()` |

## 6. Verified constraints

Checked against `adafruit_httpserver` docs; these shape the code we write.

- **`FileResponse` streams from disk** with a configurable buffer (default 1024
  bytes). Serving the 44.8KB gzipped library is safe on every board including the
  Pico 2 W.
- **`Response` holds its whole body in memory.** Inlining the library as a large
  Python string is a RAM trap -- the Pico 2 W has 520KB SRAM and no PSRAM, so it
  would likely fail there while succeeding on the 8MB-PSRAM ProS3 and hiding the
  bug. Article 1 covers this as a sidebar: *why not just inline it?*
- **`ChunkedResponse`** takes a generator, for large dynamic bodies.
- **No built-in gzip**, but `Response` and `FileResponse` accept a `headers`
  parameter, so pre-compressed files are served by setting `Content-Encoding: gzip`
  explicitly. Two lines, and a useful teaching beat.
- **SSE and chunked transfer encoding are supported**, so rung 5 needs no stack change.

---

## 7. BCCL, and how we frame it

We lead with BCCL in every rung, because three lines producing a good-looking card
is the entire pitch. But **show raw TACO exactly once**, early:

```python
{'t': 'h2', 'c': 'Sensor Node'}       # this is a TACO
bw.makeCard({'title': 'Sensor Node'})  # BCCL returns ... a TACO
```

BCCL *emits* TACO. That one comparison proves there is no hidden layer, which is the
philosophical difference from React. If a reader only ever sees `makeCard()`, BCCL
looks like a component framework and the point is lost. One paragraph buys the
"no magic" story; every later rung can be pure BCCL.

Margin note for each article: batteries included, you can author your own components
(link to the component docs), and there is a lean build for people counting bytes
(34.9KB gz, no BCCL).

Secondary benefit: writing five tutorials against `makeCard` / `makeTable` /
`makeForm` will surface awkward prop names and missing variants faster than any audit.
Expect BCCL polish to fall out of this work.

---

## 8. Use cases to write

Ordered by how well they sell the idea.

1. **Device provisioning** -- WiFi credentials, static IP, hostname. Everyone has
   suffered a bad one. Proves the input round trip, needs no SSE, and is the case
   where CDN delivery genuinely cannot work.
2. **Status / diagnostics** -- uptime, RSSI, free heap, error states.
3. **Sensor dashboard** -- live values (this one wants rung 5).
4. **Control panel** -- relay toggle, setpoint, calibration.
5. **Data log viewer** -- recent readings, CSV download.
6. **OTA / firmware page.**

---

## 9. Language plan

**CircuitPython first.** Clearest possible demonstration -- a TACO is a dict, the
helper library is zero lines. Natural home: Adafruit Learn.

**MicroPython second, as a port not a rewrite.** App code is identical
(`dict` -> `json.dumps`); only the server binding changes (`adafruit_httpserver` ->
`microdot`, which also supports SSE). Worth its own article because **Pico 2 W's
official Raspberry Pi path is MicroPython**, so that audience arrives expecting it,
and it reaches different channels.

**C / C++ third.** Needed for production and tight RAM. `embedded_c/` already has C
macros and a C++ layer (`taco()`, `array({...})`); the C++ layer reads far better and
Arduino is C++ anyway, so lead with C++ and keep the C macros as a fallback.

**Known gap:** the C side is currently *send-only*. There is no receive path -- no
action parsing, no dispatch. The wire contract is small and known:

```
POST /bw/return/action/<clientId>
{ "requestId": null, "route": "action",
  "result": { "action": "scram", "data": { "inputValue": "42" } }, "error": null }
```

An embedded host needs three endpoints: serve the shell, hold SSE at
`/bw/events/<clientId>`, accept POSTs at `/bw/return/...`. Whether the C return path
is in scope decides whether the C story is "dashboard" or "interactive UI". Only the
second matches the pitch.

---

## 9a. Library bugs found by writing the examples

Section 7 predicted that writing tutorials against BCCL would surface rough
edges faster than an audit. It did, within the first example.

### Responsive grid classes cannot work (bitwrench bug)

`makeCol({ size: { xs: 12, md: 4 } })` emits `bw_col_12 bw_col_md_4`. Both
rules exist and are correct in isolation, but the generated stylesheet emits
them in the wrong order:

```
.bw_col_md_4   (inside @media min-width:768px)   at index 2592
.bw_col_12     (unconditional)                   at index 5189   <- later
```

Equal specificity, later wins, so the unconditional base class overrides the
responsive one at every width. The standard responsive pattern is unusable.
Fix is to emit base column classes before the responsive blocks.

Example 1 works around it with a flex wrapper styled via `bw.s()`, which also
happens to demonstrate JS-value styling -- but that is a workaround, not a
preference.

### makeSection silently discards children

`makeSection({ children: [...] })` renders an empty section. It takes
`content`, not `children`, and mismatched props are dropped with no warning.
`makeStack` takes `children`. Both are layout containers; the inconsistency is
easy to hit and produces a blank page rather than an error.

This is the third naming inconsistency to bite in one sitting -- after
`bw_bccl_*` class names (5 of 9 guessed wrong) and `makeTableFromArray` taking
a config object rather than positional arguments. Worth an audit of BCCL prop
names for consistency, and possibly a development-mode warning when a factory
receives props it does not recognise.

### Structural CSS does not style bare elements

`h1`, `p`, `button`, `input`, `select`, `table` are unstyled; only `body` is
touched. Any non-JS host composing TACO must therefore carry `bw_bccl_*` class
names, which is the ergonomics problem described in section 7 -- and the reason
a thin Python/C++ naming layer, or structural styling for semantic elements,
keeps coming up.

## 9b. Release checklist -- MUST DO before shipping the tutorial

- [ ] **Restore the CDN script tag in examples 1a and 1b.**
      They are temporarily pointed at the locally built bitwrench so that
      `npm run build` plus a test pass exercises the tutorials against the
      working tree. Example 1a's whole point is that the device holds almost
      nothing, so it must ship using the CDN.

      Grep for `TODO(before-release)` -- there are marker comments in both
      `code.py` files and in the examples README.

      Why they were switched: two fixes made during 2.1.6 silently did nothing
      in these examples, because the CDN serves the last published release.
      `bw_container` rendered an uncapped full-width page, and `bw_list` /
      `bw_code` had no effect at all. Both looked like example bugs.

- [ ] Once restored, re-check that 1b still renders correctly without
      `bw_list` and `bw_code`, or bump the CDN pin to a release that has them.

## 10. Open questions

- Does the theme seed live in the shell, or arrive with the first TACO?
- Does `#app` remain the mount point throughout? (Assumed yes.)
- Full build or lean for the tutorials? Assumed **full** -- lean drops BCCL, and
  BCCL is the selling point. Lean gets a footnote.
- Is the C/C++ return path in scope for this cycle?
- Should `pages/` host a live version of each rung, rendered by bwserve?

---

## 10a. What already exists (this is not greenfield)

Surveyed on the 2.1.6 branch. The sections above were drafted before this survey
and read as though we are starting from zero. We are not.

### Helper libraries, three languages

| Path | Contents |
|---|---|
| `embedded_c/` | `bitwrench.h`, `bwserve.h`, `CMakeLists.txt` -- C macros plus a C++ layer |
| `embedded_python/` | `bwserve.py`, 514 lines -- `taco()`, `patch()`, `mount()`, `append()`, `remove()`, `batch()`, `sse_frame()`, plus `Client`, `App`, `serve()` |
| `embedded_rust/` | `Cargo.toml`, `src/lib.rs` |

`embedded_python/bwserve.py` is the significant one for this plan: it is a working
Python bwserve implementation, and it is already imported by
`examples/embedded-imu/{pico2w,esp32s3-pro}/`. Any CircuitPython tutorial has to
decide whether it builds on this or deliberately avoids it -- see the tension below.

### Examples

| Path | Contents |
|---|---|
| `examples/embedded/` | `sketch.ino`, `cmake-demo/`, `esp32-tutorial.html`, `esp32-dashboard.html` |
| `examples/embedded-basic/` | `esp32s3-pro/basic_circuitpython.py`, `pico2w/basic_micropython.py`, plus `.ino` for both |
| `examples/embedded-imu/` | same board layout, IMU variants, imports `bwserve.py` |
| `examples/embedded-pico-w/` | `server_circuitpython.py` (adafruit_httpserver, `settings.toml` for credentials), `server.ino` |
| `examples/embedded-rpi/` | `server.js`, `server.py` |

So CircuitPython, MicroPython, and Arduino variants already exist, already targeting
**ProS3 and Pico 2 W** -- the same boards chosen in section 5.

### Docs and pages

- `docs/tutorial-embedded.md` -- ESP32 IoT dashboard: SSE sensor push, LED control
  back to the device, "~5KB payload". This covers roughly rungs 3 through 5 already.
- `docs/bwserve.md`, `docs/tutorial-bwserve.md`, `docs/bitwrench-for-wasm.md`
- `pages/20-embedded.html`, `pages/12-bwserve-protocol.html`,
  `pages/14-bwserve-sandbox.html`

### State of the existing material

- **Not stale in the mechanical sense.** drift-lint scans `docs/`, `pages/`,
  `examples/`, and `embedded_python/`, and reports zero stale patterns. No
  `data-bw-action` remains anywhere in `examples/`.
- **No CDN usage anywhere.** Examples load bitwrench from `../../dist/...` for
  local viewing or `/bitwrench.umd.min.js` when device-served. The CDN stage in
  article 1 is genuinely new material.
- **Overlapping and unexplained.** Five example directories with no stated
  relationship. A reader cannot tell where to start, which is the actual problem --
  not correctness.

### The tension to resolve first

Section 1 claims the appeal is that **a TACO is just a dict and there is no helper
library to install**. But `embedded_python/bwserve.py` is a 514-line helper library,
and the IMU examples import it. Both positions are defensible and they lead to
different tutorials:

- **Dict-first** -- rungs 1 through 4 use nothing but `json.dumps`, and `bwserve.py`
  appears only at rung 5, where SSE and client tracking genuinely earn it. This
  keeps the "zero library" claim honest for the first four articles.
- **Library-first** -- use `bwserve.py` throughout for consistency with existing
  examples, and drop the zero-dependency framing.

Dict-first is the stronger story and matches the pitch, but it means rungs 1 through
4 deliberately do not use code we already ship. That should be a decision, not an
accident.

### Refresh work implied

- Decide which existing example directories are folded into the five rungs, which
  are kept as advanced references, and which retire.
- Reconcile `docs/tutorial-embedded.md` with the ladder -- it substantially overlaps
  rungs 3 through 5 and should either become one of them or be retired.
- Add a README to `examples/` explaining what each directory is for and where to
  start.
- Point `pages/20-embedded.html` at whatever ends up canonical.
- Check whether `embedded_rust/` is maintained or vestigial. Note it carried the
  fabricated `nicktackes` repository URL until v2.1.0, which suggests little review.

## 11. Parked: TACO tree diffing (not this round)

An optional helper that diffs two TACO trees and emits the minimal set of
`patch` operations, for callers who want partial updates without hand-writing
each patch.

Worth noting the premise differs from React's. React diffs because it treats the
DOM as untrusted and re-runs render functions to discover what changed. Here both
trees are plain data we authored, and TACO -> DOM is effectively a compilation, so
a diff compares two known inputs rather than reverse-engineering unknown state.
That is incremental compilation, not reconciliation.

Two things to settle before building it:

- **It requires retaining the previous TACO.** The north star says bitwrench does
  not keep element descriptors, because TACO is consumed during create+hydrate and
  the DOM is the result. A diff helper must hold that tree. Opt-in and external, but
  it bumps against a stated principle, so it should be a decision rather than drift.
- **Which host does it run on?** For embedded the win is bytes over the wire and
  RAM, not render CPU -- and the protocol already has `patch` and `batch`, so a diff
  that emits patch messages fits naturally. But running a tree diff *on an MCU* to
  save a few hundred bytes is likely a net loss. This probably belongs on the
  JS/server side, with microcontrollers continuing to send explicit patches.

## 12. Distribution note (deferred, deliberately)

Whether the embedded C helpers become a published package on PlatformIO / Espressif /
Arduino registries is **not decided here**. The current position is that the supported
product is the JS library and the embedded code is high-quality example code.
Registry publishing makes a support promise across many C++ web stacks, and naming
matters if we do it (`bitwrench-embedded`, not `bitwrench`).

One consequence to fix if we ever publish: `start-release` bumps `library.json`,
`library.properties`, and `idf_component.yml` in lockstep with `package.json`, so a
JS-only release currently bumps the C manifests with no C changes. Either decouple
the C version or publish only when C actually changes.
