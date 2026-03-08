# Bitwrench TODO

Canonical task list. Updated 2026-03-07.

## Status Legend
- **DONE** — Implemented, tested, shipped
- **PARTIAL** — Some work done, details noted
- **NOT STARTED** — Design only or no work yet

---

## Quick Wins (low-hanging fruit)

### BCCL Bug Fixes — DONE (v2.0.14)
Bugs found in component audit. Triage result: 4 of 6 were already fixed in prior work, 1 real fix applied, 1 README fix applied.
1. **makeAlert dismiss**: Already fixed — has onclick handler that removes via `.closest()`.
2. **makeNavbar CSS mismatch**: Already fixed — CSS targets both `.bw-container` and `.container`.
3. **makeCodeDemo hardcoded colors**: FIXED — replaced inline color manipulation with `.bw-code-copy-btn-copied` CSS class toggle.
4. **makeFeatureGrid icon color**: Already fixed — uses class `bw-text-primary`, themed by `generateUtilityColors()`.
5. **makeCheckbox missing onchange**: Already fixed — has `...eventHandlers` spread.
6. **makeButton**: README fixed — `label:` → `text:` corrected.

### README Staleness — DONE (v2.0.14)
- `makeButton({ label: ... })` → fixed to `text:`
- Test count updated: 558 tests
- Component count updated: 45+ (was 30+)
- `bw.toggleDarkMode()` → `bw.toggleTheme()`
- Dead LLM Guide link → Themes page link

### LLM One-Pager — NOT STARTED
- Create `dev/llm-bitwrench-guide.md` — single-file reference an LLM can ingest to build bitwrench sites
- Cover: TACO format, bw.html/DOM/css, all make* functions with signatures, loadDefaultStyles, generateTheme, state management, CLI usage
- Target: fits in one LLM context window (~8K tokens)
- This is the highest-leverage docs improvement — enables AI-assisted site generation

### Missing make* Functions — PARTIAL
Components with CSS already written but no make* function:
- `makePagination` — DONE (added in v2.0.14)
- `makeRadio` — NOT STARTED (checkbox exists, radio doesn't)

---

## BCCL Polish (Baseline Component Class Library)

### Component Demo Coverage — PARTIAL
`pages/01-components.html` demos most components. Missing demos for:
- Page-level: `makeHero`, `makeFeatureGrid`, `makeCTA`, `makeSection`
- Code: `makeCodeDemo` (used throughout but no standalone demo)
- Forms already on `02-tables-forms.html` (OK)
- New components (v2.0.14): tooltip, popover, stat card, file upload, range, search input, timeline, stepper, chip input, media object — need demo sections
- Consider: add a "Page Building Blocks" section to 01-components or a new page

### Visual Quality Audit — PARTIAL
Component TACO output and class attribution is solid across all 45+ functions. CSS coverage is comprehensive — every component has structural + themed rules. Two areas to improve:
- **Cosmetic polish**: Do all components look *beautiful* with default palette? Need visual review in browser.
- **Alternate palette**: Does `bw.toggleTheme()` produce good results for all components? Visual check needed.
- **Theme consistency**: Do all 12 preset themes look good with all components?

### Missing Component Features — PARTIAL
- `makeNavbar` has no hamburger/collapse for mobile
- `makeTabs` missing: className prop, vertical tabs option
- `makeBreadcrumb` missing: className prop, separator customization
- `makeNav` missing: onclick handler on items
- ~~No modal, dropdown, accordion, toast, tooltip, or popover~~ — All added in v2.0.12-v2.0.14

---

## Documentation

### Pages Quality Assessment
| Page | Quality | Notes |
|------|---------|-------|
| 00-quick-start | Excellent | Progressive tutorial with try-it editors |
| 01-components | Good | 13/28 components demoed, missing page-level components |
| 02-tables-forms | Good | Thorough table + form tutorial |
| 03-styling | Excellent | Covers all 3 CSS strategies clearly |
| 04-dashboard | Good | Real-world layout composition example |
| 05-state | Excellent | Thorough state management coverage |
| 06-tic-tac-toe | Excellent | Full app tutorial |
| 07-framework-comparison | Good | Useful positioning doc |
| 08-api-reference | Adequate | Auto-generated, functional, search works. JSDoc quality is actually good now (44 @example, 66 @category). Layout could be more polished. |
| 09-builds | Good | Build formats, SRI hashes, downloads |
| 10-themes | Good | Interactive generator, 12 presets |
| 11-code-editor | Good | Addon documentation |

### Docs Improvements Needed — PARTIAL
1. **LLM one-pager** (see Quick Wins above) — highest priority
2. **01-components page**: add demos for Hero, FeatureGrid, CTA, Section, CodeDemo, and new v2.0.14 components
3. **Cookbook / recipes page**: common patterns (login form, data dashboard, CRUD list, landing page) — shows bitwrench solving real problems
4. ~~**index.html cleanup**~~: DONE — fully converted to TACO dogfooding pattern (v2.0.12)

---

## Completed

### Release Infrastructure — DONE (v2.0.10)
- `npm run start-release -- [patch|minor|major] "name"` creates feature branch + bumps version
- `npm run release` validates, builds, tests, commits dist, pushes; CI handles tag + GitHub Release + npm publish
- Version chain: package.json → generate-version.cjs → src/version.js → rollup banner
- SRI hashes, builds manifest, bundle budget (45KB gzip gate)

### API Reference — DONE (v2.0.8)
- `tools/build-api-reference.js` uses `comment-parser` devDep
- JSDoc quality: 44 @example, 66 @category across 67 public functions
- Generated page (`pages/08-api-reference.html`): search bar, TOC, card layout
- Integrated into `npm run build:generated` pipeline

### CSS Structural/Cosmetic Split — DONE (v2.0.7)
- `getStructuralStyles()` — ~420 lines of layout-only CSS (no colors/shadows)
- `loadDefaultStyles()` injects structural CSS separately (`bw-structural` id)
- Cosmetic layer generated dynamically by `generateTheme()` from seed colors
- Two-tier injection: structural is static, cosmetic varies with palette

### Palette-Driven Theme Generation — DONE (v2.0.5)
- `bw.generateTheme(name, config)` — seed colors → scoped CSS
- `deriveShades()`, `derivePalette()`, spacing/radius presets
- 12 built-in theme presets, dark mode CSS generation
- 68 tests in `bitwrench_test_theme.js`

### State Management — DONE (v2.0.3)
- UUID addressing: `bw.uuid()`, `bw.patch()`, `bw.update()`, `bw.patchAll()`
- `o.render` lifecycle, `bw.emit()`/`bw.on()` DOM events
- `bw.pub()`/`bw.sub()`/`bw.unsub()` app-scoped pub/sub (23 tests)
- `bw._nodeMap` O(1) cache for UUID/ID lookups (43 tests)

### CLI Phase 1 — DONE (v2.0.6)
- Single-file conversion: .md/.html/.json → wrapped HTML
- Injection modes: `--standalone`, `--cdn`, `--no-bw`
- Theme presets + hex color pairs, favicon, highlight.js
- Vendored quikdown.js (zero-dep MD parser)
- 49 tests in `bitwrench_test_cli.js`

### Versioning & CDN Strategy — DONE (v2.0.4)
- Design doc: `dev/archive/bw2x-versioning-strategy.md`
- `dist/` = v2 only, `releases/v1/` = frozen v1.2.16, `releases/v2/` = snapshot

### Examples Restructure — DONE (v2.0.3)
- 6 pages: 00-quick-start through 05-state, plus builds, api-reference, themes
- Served from root, `examples_v2r2/` kept as archive
- 39 Playwright + 111 state-debug tests

---

## Future (larger efforts)

### CLI Phase 2: Site Generation (`bitwrench build`)
- Design doc: `dev/bw-cli-design.md` (Phase 2)
- Directory-to-site pipeline: scan dir → convert all pages → generate nav → output site
- `bitwrench.config.json` support, `_layout.js` custom layouts
- `--nav` directory-based navigation
- Target: v2.1.0

### CLI Phase 3: Dev Mode (`bitwrench dev`)
- Design doc: `dev/bw-cli-design.md` (Phase 3)
- Watch + live-reload server for local development
- `--watch` flag, `--port` option

### CLI Phase 4: Polish
- Design doc: `dev/bw-cli-design.md` (Phase 4)
- `bitwrench init` scaffolding
- `bitwrench theme` subcommand
- Front matter parsing in .md files

### bw.make() Factory Dispatcher
- Thin `bw.make(type, props)` that delegates to `bw.makeCard`, `bw.makeButton`, etc.
- Enables data-driven component creation from config/JSON
- 28 make* functions currently exist (26 in components-v2, 2 in bitwrench.js)
- Audit: which make* functions earn their keep vs. trivially thin wrappers?

### bwserve / Client-Server Protocol
- Design docs (3 documents, ~2200 lines of design):
  - `dev/bitwrench-serve-and-protocol.md` — original exploration
  - `dev/bw-client-server.md` — detailed protocol (5 message types, 3 scenarios)
  - `dev/bw-stream-agent-protocol-draft-2026-03-06.md` — agent-driven UI protocol
- Runtime SSR using server-push (SSE default, WS opt-in)
- `bw.clientConnect()`, `bw.clientApply()`, `bw.clientParse()` — no code exists yet
- Streamlit competitor for embedded/IoT dashboards
- Deferred past CLI completion

---

## Notes
- Bundle budget: 45KB gzipped max (currently 35KB — within budget)
- Test count: 558 unit + 49 CLI + 13 Playwright example tests
- Branch: `main` (active), `master` (legacy default, will eventually retire)
- NO direct DOM manipulation in examples — always `bw.DOM()` + TACO
- All pages fully dogfooded: TACO objects + `bw.injectCSS(bw.css({...}))` — no raw HTML body or `<style>` blocks
