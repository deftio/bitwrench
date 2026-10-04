# Embedded release plan (2.1.x => 2.1.12)

**Status: 2.1.11 laid the groundwork. 2.1.12 is the embedded release.**

> **2.1.12 also carries `bitwrench-verify`** (approved 2026-10-04, see
> `dev/bw-verify-design.md`). Two workstreams in one patch release -- that
> doc's section 15 lays out the three scope options. Decide the split before
> work starts. The embedded side's gating item is the registry submission,
> because the C++ article cannot be written until "install from Library
> Manager" is true.

This doc consolidates the embedded notes that were scattered across `dev/`,
plus the decisions made in the 2.1.11 cycle. It exists so that:

- someone reading 2.1.11 can see the embedded story is **not finished**, and
  where it is going;
- 2.1.12 can start from a decision list instead of a re-litigation;
- the hygiene backlog is written down rather than rediscovered.

**Headline finding: embedded is close, and it needs no fundamental bitwrench
code.** The hard parts (TACO composition, the protocol, the receive path, the
flash asset) exist and are tested. What is missing is consistency, a stated
boundary, the last mile of glue, and documentation. That is cleanup work, not
design work.

---

## 1. What 2.1.11 is, and is not

**Is:** an inconsistency cleanup. It fixed five real protocol bugs, closed the
"C is send-only" gap, added the composition primitives the headers lacked, and
shipped a C++ demo that runs on a laptop.

**Is not:** the embedded release. Nothing is submitted to any registry. The
name is undecided. There is no per-stack glue. `embedded_c/README.md` says all
of this plainly, and it must keep saying it until 2.1.12 lands.

Do not treat the version-locked manifests (`library.properties`,
`library.json`, `idf_component.yml`) as a promise. They are inert until
somebody submits them.

---

## 2. The mental model to design for

In Manu's words, with the embedded hat on:

> When I put on my embedded hat I am thinking like a C++ programmer. I am
> expecting to install a C++ or header file in my project, compile and go.
> Sure there can be a bw.js but I expect, in my C++ view, that to be a binary
> "file" or compiled asset. So I install some C++ and poof I get web stuff.

Everything below follows from that sentence. Two consequences:

1. **"Install, compile, go" is a library expectation.** Examples do not get
   installed. If we ship only examples and say so, we will spend the next year
   being asked for a library.
2. **`bitwrench.js` is an asset, not a dependency.** The C++ author should
   never think about a CDN, a filesystem, or a build step. A byte array in
   flash with a length is the right abstraction, and
   `embedded_c/bitwrench_embedded.h` already is exactly that.

---

## 3. The decision: a library, with a narrow scope

The supported thing is **not** "a C++ web framework". It is three things, none
of which can break when someone swaps web stacks:

| Layer | Contents | Why it is safe to support |
|-------|----------|---------------------------|
| Compose | `bw::taco`, `nest`, `nest_attr`, `taco_attr`, `array`, `escape`; `BW_TACO*`, `BW_NEST*`, `BW_ARRAY_*` | Pure string building. No I/O, no platform. |
| Protocol + receive | `bwserve::mount/patch/patch_attr/append/remove/message/batch/sse_frame`; `bw_parse_action`, `bw_action_field`, `bw_clients_t` | Pure string building and parsing; the registry drives I/O through a caller callback. |
| Asset | `bitwrench_embedded.h`, `bitwrench_embedded_lean.h` | A byte array, a length, a version and an SRI hash. |

**Out of scope, deliberately:** HTTP routing, SSE response headers,
keep-alive, chunked transfer, TLS, auth. That is per-stack, and it is where the
support promise gets expensive (the trap flagged in
`dev/embedded-tutorial-2.1.x.md` section 12).

### This boundary already holds (verified, 2.1.11)

- `embedded_c/bitwrench.h` (361 lines) and `bwserve.h` (627 lines) perform
  **zero I/O**. Their entire dependency surface is `stdio.h`, `string.h`,
  `<string>`, `<vector>`.
- The single `send(...)` call in the headers is the **caller's function
  pointer** passed to `bw_clients_each()`, not a syscall.
- 21 tests in `test/bitwrench_test_embedded_c.js` compile the headers as C99
  and C++11 with `-Wall -Wextra -Werror`, check the wire output against
  `bw.parseJSONFlex()`, compile both desktop demos, run the C++ one, drive it
  over a real socket, and render its frames into a DOM.

So the core is already a stack-independent library. What makes it *feel* like
example code is that the boundary is unstated and the glue is absent.

---

## 4. The missing last mile: per-stack adapters

The "poof I get web stuff" experience needs the install story to be four lines:

```cpp
#include <bitwrench.h>           // compose
#include <bwserve.h>             // protocol + clients
#include <bitwrench_embedded.h>  // the asset, in flash
bw_attach(server);               // <- DOES NOT EXIST YET
```

`bw_attach()` is a thin per-stack adapter, roughly 60-100 lines each, that
wires the three endpoints. It is the only place that knows about a web stack,
so each adapter is small, individually labelled, and individually droppable.

### The integration contract (already settled)

From `dev/embedded-tutorial-2.1.x.md` section 9 -- an embedded host needs
exactly three endpoints:

1. serve the shell (`GET /`)
2. hold an SSE stream open (`GET /bw/events`)
3. accept the post-back (`POST` -- see section 7 on which path)

Plus a fourth we added in 2.1.11: `GET /bitwrench.js` from flash.

Document this contract prominently so anyone on an unsupported stack can write
their own adapter in an afternoon. That is what keeps the promise narrow.

### Candidate adapters (needs Manu's board list)

- ESPAsyncWebServer (ESP32, the common Arduino path)
- Arduino `WebServer` (ESP32/ESP8266 core, synchronous)
- ESP-IDF `esp_http_server`
- POSIX sockets (already demonstrated by `examples/embedded/posix-cpp/`)
- arduino-pico `WebServer` (Pico W / Pico 2 W)

### Proposed: make the asset self-describing

So adapters do not hardcode a symbol name, and full <=> lean is a one-line swap:

```c
typedef struct {
    const unsigned char *data;
    unsigned             len;
    const char          *encoding;   /* "gzip" */
    const char          *sri;        /* "sha384-..." */
    const char          *version;    /* "2.1.12" */
} bw_asset_t;

static const bw_asset_t bitwrench_js = { bitwrench_js_gz, bitwrench_js_gz_len,
                                         "gzip", BITWRENCH_SRI,
                                         BITWRENCH_EMBEDDED_VERSION };
```

Generated by `tools/build-embedded-header.js`, which already emits the version
and the SRI into a comment.

---

## 5. Inconsistency register

This is the actual work. Each item is a thing a C++ reader hits.

| # | Inconsistency | Where | Fix |
|---|---------------|-------|-----|
| 1 | **Three ways to do everything**: `BW_*` macros (caller's buffer), `bw_*` C functions, `bw::`/`bwserve::` namespaces -- with no stated canonical path | `embedded_c/*.h` | State once, loudly: *C++ uses the namespaces; the macros are the C fallback.* Lead every C++ doc with namespaces. |
| 2 | `BW_REPLACE` is a dead v2.0 alias for `BW_MOUNT` | `bwserve.h` | Remove, or document as deprecated with a removal version. |
| 3 | **Buffer discipline differs by language**: C macros write into a caller buffer and truncate silently; C++ builds with `std::string` and cannot | both | Fixed in 2.1.11; now needs a short "buffers" section so the seam is taught, not discovered. |
| 4 | **The same fact in three places**: real headers in `embedded_c/`, forwarding shims in `src/`, `includes=` in `library.properties` | repo root | Keep (Arduino needs it) but explain it in one place; it currently looks like duplication. |
| 5 | **Two ESP-IDF component registrations**: root `CMakeLists.txt` and `embedded_c/CMakeLists.txt` | repo root | Document which path wins when, or collapse to one. |
| 6 | **"Embedded" means three different promises**: `embedded_python/bwserve.py` (514 lines, imported by real examples), `embedded_rust/src/lib.rs` (414 lines, suspected vestigial -- carried a fabricated repo URL until 2.1.0), `embedded_c/` (988 lines, now tested) | `embedded_*/` | Decide supported vs example vs retired, per language, and say so in each README. |
| 7 | **Five `examples/embedded*` directories with no stated relationship** (`embedded/`, `embedded-basic/`, `embedded-imu/`, `embedded-pico-w/`, `embedded-rpi/`) -- the reader cannot tell where to start | `examples/` | One `examples/README.md` index: what each is, which to start with, which are advanced references, which retire. |
| 8 | **Structural CSS does not style bare elements** (`h1`, `p`, `button`, `input`, `select`, `table`), so every device-composed node must carry `bw_bccl_*` classes | `src/bitwrench-styles.js` | Decide: style semantic elements, or document the class requirement as deliberate. This is the first thing a C++ reader feels. |
| 9 | **No `BW_CALL` / `bwserve::call()`** even though `bw.apply` supports `type:'call'` -- so a device cannot invoke a registered remote without hand-writing the frame | `bwserve.h` | Add it; needed for device-driven theming (section 6). |
| 10 | **Version lockstep**: `tools/start-release.js:140-142` bumps all three C manifests with `package.json`, so a JS-only patch publishes a new C library version with zero C changes | `tools/start-release.js` | Decouple the C version, or publish only when C changes. |
| 12 | **`bw.connect`'s post-back URL is dead code for the URL we document.** `url.replace('/events/', '/apply/')` cannot match `/bw/events` (no trailing slash), so the POST lands on the SSE path itself. The POSIX demo depends on that, so it was left alone in 2.1.11 | `src/bitwrench.js` (`bw.connect`) | Pick one post-back path. This is the root cause of the "which URL does a click go to" confusion. |
| 13 | **`BW_BOOTSTRAP_HTML` predates the flash asset.** It serves `/bitwrench.umd.min.js` and `/bitwrench.css` as files from a filesystem, calls no `bw.connect()` and no `bw.actions.enable()`, so a page built from it renders nothing and cannot post a click. Documented honestly in 2.1.11 rather than changed | `embedded_c/bwserve.h` | Replace with the per-stack adapter, or retire. |
| 11 | **Registry name undecided**: manifests say `name=bitwrench`; `dev/embedded-tutorial-2.1.x.md` section 12 argued for `bitwrench-embedded` | `library.properties`, `library.json` | Decide before submitting. Library Manager indexes by name; renaming later orphans the first entry. |

---

## 6. Device-driven theming (verified, but needs a macro)

The device should never author CSS (the project forbids CSS string literals and
`var(--bw_*)`). It sends a **seed**, and the page derives everything:

```
device  =>  r{'v':1,'type':'call','name':'theme','args':[{'primary':'#b5179e','mode':'auto'}]}
page    =>  bw.registerRemote('theme', function(cfg) { bw.loadStyles(cfg); });
```

Measured in 2.1.11: ~70 bytes on the wire produced a 60,101-byte stylesheet
containing 804 derived colours. This is one of the strongest beats available
for the C++ audience, and it is the honest framing -- the device sends intent,
not styling.

**Blocked on inconsistency #9**: no macro emits a `call` message yet.

Open question carried from `dev/embedded-tutorial-2.1.x.md` section 10: does
the theme seed live in the shell, or arrive with the first TACO? For the C++
story, recommend **shell default + optional device override via `call`**, so a
page is styled before the first frame arrives.

---

## 7. Two post-back shapes (document, do not unify)

Both exist and both are supported as of 2.1.11:

| Shape | Sender | Body |
|-------|--------|------|
| `bw.actions` event | bitwrench core, `bw.actions.enable()` + `bw.connect()` | `{"v":1,"type":"event","action":"set_rate","value":"5","name":"rate"}` |
| thin-client action | `bwclient.js` (bwserve shell) | `POST /bw/return/action/<clientId>` with `{"result":{"action":"save","data":{...}}}` |

`bw_parse_action()` accepts both; `bw_action_field()` reads a top-level field
or one inside `data`. Firmware needs one code path. **Say this explicitly in
the docs** -- the two shapes are the single most confusing thing in the
protocol for a device author.

---

## 8. Hygiene checklist for 2.1.12

Code:

- [ ] Add `bwserve::call()` / `BW_CALL` (inconsistency #9)
- [ ] Add `bw_asset_t` and generate it (section 4)
- [ ] Remove or deprecate-with-version `BW_REPLACE` (#2)
- [ ] Write 1-2 per-stack adapters, with the 3-endpoint contract documented (#4)
- [ ] Decide and act on structural styling for bare elements (#8)
- [ ] Pick one post-back path; `bw.connect`'s URL rewrite is currently dead (#12)
- [ ] Replace or retire `BW_BOOTSTRAP_HTML` (#13)
- [ ] A C/C++ doc-example harness: compile the self-contained snippets in
      `embedded_c/README.md` the way `test/bitwrench_test_doc_examples.js`
      runs the JS ones. The 2026-10-04 review found the README's first
      program emitting an unparseable frame; a harness would have caught it
- [ ] Decouple the C manifest version from `package.json` (#10)

Repo hygiene:

- [ ] `examples/README.md` index explaining all five embedded dirs (#7)
- [ ] Per-language status note in `embedded_c/`, `embedded_python/`,
      `embedded_rust/` READMEs: supported, example, or retired (#6)
- [ ] Reconcile `docs/tutorial-embedded.md` with the ladder -- it overlaps
      rungs 3-5 and should become one of them or retire
- [ ] Point `pages/20-embedded.html` at whatever becomes canonical
- [ ] Decide whether `embedded_rust/` is maintained or retired (#6)

Docs that must be updated together (the user called these out specifically):

- [ ] `README.md` -- embedded section reflects the library story, not examples
- [ ] `agents.md` -- the C++ mental model, the three layers, the adapter boundary
- [ ] `llms.txt` -- embedded entries point at the canonical path
- [ ] `docs/thinking-in-bitwrench.md` -- a "driving bitwrench from a device"
      section: the device sends descriptions, names what changed, and never
      authors CSS or DOM
- [ ] `embedded_c/README.md` -- flip the "not submitted" note only when true

Before submitting to registries:

- [ ] Settle the name (#11)
- [ ] Settle version decoupling (#10)
- [ ] Verify with `arduino-lint` (not installed locally as of 2.1.11)
- [ ] Submit from the released tag, never from a feature branch

---

## 9. The tutorial ladder

`dev/embedded-tutorial-2.1.x.md` section 4 defines a 7-rung ladder and remains
the authority on teaching order. It is written **Python-first** (section 9:
"CircuitPython first ... C/C++ third"). The C++ article Manu wants is a cut of
that outline, not a new one.

Mapping the C++ article beats onto the existing rungs:

| C++ article beat | Rung | State after 2.1.11 |
|------------------|------|--------------------|
| What is bitwrench; UI as `{taco}` | 1a | Written, Python. Needs a C++ cut. |
| Static example, CDN | 1a | Exists. Note section 9b: rung 1a tests against *published* npm, not the working tree. |
| Static example, locally served bundle | 1b / 2 | Stronger now: serve from flash, no filesystem. |
| Updating values from C++ | 4 / 6 | Done and tested. |
| Updating the UI with new components | 7 | Needs care: BCCL factories are browser-side. A device sends TACO carrying `bw_bccl_*` classes, or sends **data** and the page composes. There is no `bw::make_card()` and there should not be. |
| Styles from C++ | 2 + section 6 here | Works via `call` + `registerRemote`; blocked on #9. |
| Full mini dashboard | 6 | `examples/embedded/posix-cpp/` is this. |

**Venue note:** Adafruit and the Arduino blog will expect a real board as the
hero (`embedded-basic`, `embedded-imu` target ProS3 and Pico 2 W) with the
POSIX C++ demo as the no-hardware opener. Writing before the registry
submission lands means the install step reads "copy two headers", which
undercuts the piece. **Article after submission, not before.**

---

## 10. What 2.1.11 delivered (so 2.1.12 does not redo it)

Added:

- `BW_NEST`, `BW_NEST_CLS`, `BW_NEST_ATTR`, `BW_SKIP_R`; `bw::nest`,
  `bw::nest_attr`, `bw::taco_attr`, `bw::inner`, `bw::array(vector)`,
  `bwserve::batch(vector)`, `bwserve::patch_attr`
- `bitwrench_embedded.h` / `_lean.h` (gzipped bundle in flash: 45.6 KB and
  35.8 KB payloads; 2,974 and 2,341 lines of C) plus `src/` Arduino shims
- `examples/embedded/posix-cpp/` -- C++11 demo with a 7-step round-trip README
- `examples/embedded/cmake-demo/` rewritten (it had been serving a hand-written
  SSE client built on `document.getElementById` and `innerHTML`)
- 21 compile-and-run tests, including an end-to-end device-to-DOM check

Fixed (five protocol bugs, all found by writing the demo):

1. `bw.connect()` used `JSON.parse`, rejecting the relaxed `r{...}` form every
   C macro emits -- and swallowed the error. The embedded path only worked if
   you hand-wrote your own SSE client.
2. `BW_ARRAY_ITEM` kept each child's `r` prefix, so any array content was
   unparseable. Arrays were unusable.
3. `bw.apply()` dropped `attrs` when `text` was also present, so
   `BW_PATCH_ATTR` lost its styling half.
4. `message` collided: device notifications were rejected because the type also
   means component dispatch. Now disambiguated by `action`, and a notification
   publishes on `bw:message`.
5. The C++ protocol wrappers copied through a fixed `BW_BUF_SIZE` buffer and
   silently truncated a page-sized `mount`. They build with `std::string` now.

Packaging: Arduino example folders renamed to match their sketch names,
`keywords.txt` extended, `library.json` excludes in-tree build dirs.

**The lesson worth keeping:** every one of those five bugs was invisible to unit
tests on either side alone. They surfaced only when a real C++ program talked to
a real browser. Keep the end-to-end test, and write examples to find bugs.

---

## 11. Related notes in dev/

| Doc | Status |
|-----|--------|
| `dev/embedded-tutorial-2.1.x.md` | **Live.** Authority on the teaching ladder, board choices, delivery modes, and the "what already exists" survey. Its sections 9 (C receive path) and 12 (distribution) are superseded by this doc. |
| `dev/v2.1_embedded_examples.md` | **Partly superseded.** Board/example plan and the measurement ("receipts") table are still useful; its protocol-migration items are done. Open questions on camera MJPEG and MicroPython SSE concurrency remain live. |
| `dev/qa-todo.md` | Task tracker; embedded items should reference this doc. |
| `dev/bw-client-server.md` | bwserve protocol design. |
| `docs/tutorial-embedded.md` | Shipped tutorial; overlaps ladder rungs 3-5, needs reconciling. |

---

## 12. Open decisions (answer these to start 2.1.12)

1. **Name**: `bitwrench` or `bitwrench-embedded` in the registries?
2. **Which stacks get adapters?** Manu has the boards.
3. **`embedded_rust/`**: supported, example, or retired?
4. **Structural CSS**: style bare semantic elements, or keep requiring
   `bw_bccl_*` classes and document it?
5. **C manifest version**: decouple from the JS version?
6. **Theme seed**: shell, first TACO, or both?
7. **Lean build**: does it get an adapter story, or a footnote?
