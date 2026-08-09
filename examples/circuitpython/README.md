# bitwrench on CircuitPython

Examples that build up from a single element to a device pushing live UI
updates. Each adds exactly one idea, and each runs unchanged on every board
below.

> **TODO(before-release):** examples 1a and 1b are temporarily served from the
> locally built bitwrench (`/www`) rather than the CDN, so that a full build and
> test pass exercises them against the working tree. Restore the CDN tag before
> publishing -- see `dev/embedded-tutorial-2.1.x.md`.
>
> **Status: not yet tested on hardware.** These were written against the
> CircuitPython and `adafruit_httpserver` documentation. Expect rough edges until
> they have been run on a real board.

## Who this is for

Makers who can flash a board and know enough HTML and CSS to be dangerous. You
do not need to know a JavaScript framework. If you have used one, the thing to
unlearn is that UI requires a build step -- it does not, and that is why this
works on a microcontroller at all.

bitwrench is a general-purpose web UI library; nothing here is embedded-only.
This series just runs it from a device, because that is the hardest case and
the one where having no bundler matters most.

## The idea

The device does not run a UI framework. It holds a fixed HTML shell and produces
**TACO** objects -- and in Python a TACO is just a dict:

```python
{"t": "h2", "c": "Sensor Node"}
```

`json.dumps()` and you are done. There is no template engine and, until the last
example, nothing to install on the device beyond a web server.

The browser loads one file -- `bitwrench.umd.min.js`, 44.8KB gzipped -- which
contains the rendering engine, 52 UI components, and the theming system. On the
device side you are writing dicts.

## The examples

| # | What it adds | The call that never changes |
|---|---|---|
| [1a](01a-taco-basics/) | One object makes one element. Shows the object, the HTML it produced, and the live element side by side. | `bw.DOM('#app', taco)` |
| [1b](01b-taco-nesting/) | TACOs inside TACOs -- strings, single children, arrays, and children built from data. | same |
| [2](02-styling/) | Styling: inline styles, the classes that ship, and one seed colour deriving a whole palette. Plus the first click handler. | same |
| [3](03-json-dumps/) | Python composes the UI with `json.dumps`. bitwrench moves onto the device. | same |
| [4](04-fetch-ui/) | The shell asks for `/ui.json`. The page becomes static; the device owns the content. | same |
| [5](05-round-trip/) | A settings form posts back. Deliberately clunky -- the whole page refetches. | same |
| [6](06-bwserve/) | Server-Sent Events. The device pushes patches whenever it likes. | same |

Only where `taco` comes from changes: a literal, then Python, then a fetch, then
a push.

## Boards

| Board | Chip | Notes |
|---|---|---|
| Unexpected Maker ProS3 | ESP32-S3 | most headroom |
| Adafruit QT Py ESP32-S3 | ESP32-S3 | STEMMA QT, no soldering for sensors |
| Raspberry Pi Pico 2 W | RP2350 | tightest RAM of the three |

All three run CircuitPython 10.x. `code.py` is byte-identical across them --
`bw_board.py` handles the differences, and there are fewer than you would expect,
because CircuitPython connects WiFi from `settings.toml` before your code runs.

## Run them on your computer first

No board required. One command sets up a virtualenv, stages the bundle, and
serves on <http://localhost:8085>:

```
./run.sh          # list the examples
./run.sh 3        # run example 3
./run.sh all      # smoke-test every one
```

The same `code.py` then runs unchanged on a board.

## Setup on a board

1. Install CircuitPython from [circuitpython.org](https://circuitpython.org/downloads)
2. Copy `settings.toml.example` to the drive as `settings.toml`; fill in your WiFi
3. Install the server library: `circup install adafruit_httpserver`
4. Copy `bw_board.py` to the drive root
5. Copy one example's `code.py` to the drive root
6. Open the serial console -- the URL to visit is printed on boot

Every example from 2 on also needs bitwrench on the device:

```
mkdir /www  (on the CIRCUITPY drive)
cp dist/bitwrench.umd.min.js.gz  /Volumes/CIRCUITPY/www/
```

Get that file from a release, from npm, or by running `npm run build` in this
repository. It is served pre-compressed, so it costs 44.8KB of flash.

Example 6 additionally needs `embedded_python/bwserve.py` copied to `/lib/`.

## Notes

**Why not inline the library in the page?** `Response` holds its whole body in
memory. The Pico 2 W has 520KB of RAM and no PSRAM, so a 166KB string plus HTTP
buffers is enough to run out. `FileResponse` streams from disk in 1KB chunks
instead, which is why every example from 2 on serves it from `/www`.

**CDN or on-device?** Interchangeable -- one line in the shell. But CDN delivery
needs *the browser* to reach the internet, not the device. That is fine on a home
network and impossible when the device is its own access point, which is exactly
the case for a setup or provisioning page. Examples 1a and 1b use the CDN;
everything after them is self-contained.

**Why 1a and 1b have no `integrity=` hash.** Subresource Integrity pins an exact
file, so it cannot be combined with a floating version -- and pinning an exact
version means the example goes stale the moment the next release ships. They
therefore track the v2 major line without SRI, which is the right trade for a
tutorial and the wrong one for production.

If you do add SRI, take the hash from the file the CDN actually serves rather
than from that release's `dist/sri.json`. The two currently disagree: CI rebuilds
the bundles before publishing, which re-stamps an embedded build timestamp and
changes every hash, without regenerating the SRI manifest.

**BCCL** is the component library baked into the same file: `makeCard`,
`makeTable`, `makeForm`, `makeNavbar` and 48 more. You can write raw TACO dicts
instead -- BCCL factories just return TACOs -- and there is a `lean` build without
them if you are counting bytes.
