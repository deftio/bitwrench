# Changelog

All notable changes to bitwrench are documented here.
Versions correspond to git tags and npm releases.

## v2.0.26 (unreleased)

### New APIs
- **`bw.el(target, apply?)`** -- Public element resolver. Accepts DOM element, id string, CSS selector (`#id`, `.class`), or UUID class. Returns first matching element or null. Optional `apply` arg: string (textContent), function (called with el), TACO (mount), or array (append items). Replaces internal `bw._el()`.
- **`bw.$(selector, apply?)`** -- Now accepts optional `apply` second arg, same semantics as `bw.el()` but applied to every matched element. Enables v1.x-style `bw.DOM(sel, apply)` ergonomics.
- **`bw.toggleThemeMode(scope?)`** -- Renamed from `bw.toggleStyles()`. Toggles primary/alternate palette on ALL matching elements (was first-only). `bw.toggleStyles` kept as alias for one release cycle.
- **`bw.inspect(target, depth)`** -- Rewritten. Now returns a plain-object tree with bitwrench metadata (tag, uuid, type, handles, state, hasRender, hasSubs, refs, children). Recursive with configurable depth (default 3). The old `bw.inspect()` only logged to console with no useful return value.
- **Wildcard subscriptions** -- `bw.sub('ns:*', handler)` matches any topic starting with the prefix before `*`. Handler receives `(detail, topic)` so it can distinguish which topic fired. Works with `bw.once()`, element lifecycle, and `bw.unsub()`. Bare `'*'` matches all topics.
- **`bw.once(topic, handler, el)`** -- Subscribe for a single event; auto-unsubscribes after first fire. Returns cancel function.
- **`bw.formData(target)`** -- Collect all form inputs from a container into a plain object (text, checkbox, radio, multi-select, textarea).
- **`bw.catalog([type])`** -- Introspect the BCCL component registry. No args returns all types; with type arg returns single entry or null.
- **`bw.jsonPatch(obj, ops)`** -- RFC 6902 JSON Patch on plain objects. Supports add, remove, replace, move, copy, test operations with JSON Pointer paths. Mutates and returns the target object. Distinct from `bw.patch()` which is DOM content patching.

### Component Engine
- **SVG namespace support** -- `bw.createDOM()` now detects SVG context and uses `createElementNS()` for proper SVG rendering. `{t:'svg'}` starts SVG context; child elements inherit it. `foreignObject` children revert to HTML namespace. Lifecycle hooks, handles, state, UUID addressing all work on SVG elements.
- **Slot caching fix** -- `o.slots` setters/getters now cache the target element at creation time instead of calling `querySelector` on every invocation.
- **`o.type` wiring** -- `o.type` in TACO options now sets `el._bw_type` on the DOM element for component type introspection.
- **Error boundaries** -- `o.mounted`, `o.unmount`, and `o.render` (via `bw.update()`) wrapped in try/catch; errors logged via `console.warn` instead of crashing the component.

### Breaking Changes
- **`bw.inspect()` signature changed** -- now takes `(target, depth)` and returns a plain object (or null). No longer logs to console. Code that called `bw.inspect(el)` and ignored the return value will still work; code that expected the returned DOM element must update to use `bw.inspect(el, 0)` for the info object.

### bwserve
- **`client.inspect(selector?, opts?)`** -- Server-side convenience method for DOM tree inspection. Calls `_bw_tree` builtin on the client. Returns a promise resolving to a plain-object tree (same shape as `bw.inspect()`).

### CLI
- **`/inspect` command** -- Renamed from `/tree` in bwcli attach REPL. `/tree` kept as alias.

### Internal
- `bw._el` renamed to `bw.el()` (public API). `bw._el` kept as alias for one release cycle.
- `_applyTo()` internal helper shared between `bw.el()` and `bw.$()` for content application.
- `_bw_tree` builtin in bwclient.js now delegates to `bw.inspect()` when available (falls back to hand-rolled walker for older bitwrench versions).

## v2.0.25 (unreleased)

### Site CSS Architecture
- **Replaced `shared-theme.js`/`shared-theme.css` with palette-driven `site.js`**: all site chrome CSS generated via `bw.css()` from palette objects, no CSS custom properties
- Site CSS split into structural (layout-only) + per-component themed rule functions; no shared selectors between structural and themed (eliminates Object.assign merge-clobber bugs)
- Dark mode auto-generated via `bw.scopeRulesUnder()` -- no manual `.bw_theme_alt` overrides
- Migrated all 25+ doc pages from old class names to BCCL flat-class pattern (`bw_site_pages_*` prefix)
- Page-level CSS (08-api-reference) converted from hardcoded hex to palette-driven

### Core
- `bw.loadStyles()` now returns the full styles object (palette, rules, etc.) instead of just the style element
- `bw.scopeRulesUnder()` exposed as public API for scoping CSS rules under a prefix selector
- Theme color tuning: interactive elements (links, tabs, breadcrumbs, steppers) use `tertiary` palette for better visual hierarchy
- `bw_text_muted` uses `palette.secondary.base` instead of hardcoded `#6c757d`

### Embedded Examples
- New tutorial-depth examples: ESP32, Pico W (MicroPython + CircuitPython), Raspberry Pi
- Real networking code (no mock data), hardware-specific dashboard UIs
- Adafruit ST25DV16 NFC example with I2C register-level detail
- Examples gallery reorganized with category cards

### Docs & Testing
- TypeScript definitions (`bitwrench.d.ts`) for full public API
- Test coverage to 97%; new test suites for bwserve, MCP, code editor
- Coverage badge auto-update script

## v2.0.24

- Fix flatted CVE (prototype pollution via `parse()`)

## v2.0.23

- MCP server, MCP tools, live rendering via bwserve
- `bwmcp` CLI entry point (`bin/bwmcp.js`)
- MCP stdio transport, tool dispatch, knowledge base

## v2.0.22

- README fixes and documentation cleanup

## v2.0.21

- `bw.router()` client-side hash router
- Removed legacy v1.x source (`src_1x/`)
- Updated homepage, docs, and tutorial pages

## v2.0.20

- Updated logo and branding

## v2.0.19

- **Identity unification**: removed `data-bw_id` attributes and `bw_id_*` classes; all identity via `bw_uuid_*` classes + `bw_lc` marker class
- **`o.handle` / `o.slots`**: replacement for ComponentHandle; methods on `el.bw`, slots auto-generate setters/getters
- **`bw.mount()`**: like `bw.DOM()` but returns root element for `el.bw` access
- **Removed `bw.component()`, `bw.compile()`, `bw.when()`, `bw.each()`** -- all now throw Error
- Eliminated all `data-*` attributes from bitwrench.js and bitwrench-bccl.js
- Debug toolkit additions

## v2.0.18

- `bwserve` attach protocol and `bwcli attach` for live DOM inspection
- Structural CSS cleanup: all pages use `bw.loadStyles()` instead of `<link>` tags
- `bw.u()` utility CSS extracted to plugin (`bitwrench-util-css.js`)
- Component structural CSS improvements
- Embedded and server example updates

## v2.0.17

- Documentation overhaul: HTML generation docs, enhanced examples
- Bug fixes: local `_to`/`_toa` scope, minor component fixes
- Build metrics tracking

## v2.0.16

- **`bwserve`**: real-time server-driven UI over SSE (~200 LOC)
- `bwserve` protocol: 9 message types (replace, append, patch, remove, eval, screenshot, etc.)
- `bwcli` CLI tool for file conversion, markdown-to-HTML, theme presets
- Phase 2 component handles
- Reactivity pattern tutorials

## v2.0.15

- Three-layer reactivity model (`o.state`, `o.render`, pub/sub)
- `bw.u()` utility CSS classes
- BCCL component registry and `bw.make()` factory dispatch
- Dead code elimination
- `start-release` / `release` workflow scripts

## v2.0.14

- BCCL component and theme consistency fixes
- Removed accidentally committed root `CLAUDE.md`
- Updated release procedure docs

## v2.0.13

- Refresh SRI hashes and build artifacts

## v2.0.12

- Dogfood all pages with bitwrench components
- Visual test fixes and content polish
- BCCL parity improvements

## v2.0.11

- `bw.makeBarChart()` component
- LLM integration guide (`docs/llm-bitwrench-guide.md`)
- BCCL bug fixes, page cleanup
- `start-release` script for feature branch dev cycles

## v2.0.10

- Release script automation

## v2.0.9

- `bw._nodeMap`: O(1) node reference cache for UUID/ID lookups
- Fix dependabot alerts (mocha vulnerable deps override)
- CI/publish pipeline fixes

## v2.0.8

- bwserve protocol design doc
- Renamed default branch to `main`
- Release procedure documentation

## v2.0.7

- CI/CD workflow updates

## v2.0.6

- npm publishing setup

## v2.0.5

- npm workflow updates

## v2.0.4

- Initial v2.x release on npm
- TACO format, `bw.html()`, `bw.createDOM()`, `bw.DOM()`
- Color utilities, random data generation, cookie handling
- UMD/ESM/CJS/ES5 build formats via Rollup
