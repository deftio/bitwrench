# Bitwrench 2.x Implementation Assessment

**Date**: February 2026
**Purpose**: Gap analysis between the v2 design (bitwrench-2x-discussion.md) and the current codebase, plus recommended approach for updating.

## Current Codebase State

### Source Files

| File | Lines | Role | Module System |
|------|-------|------|---------------|
| `src/bitwrench.js` | 561 | Legacy v1 bootstrap (UMD/IIFE) | Old IIFE wrapper |
| `src/bitwrench_v2.js` | 2,082 | Main v2 implementation | ES modules |
| `src/bitwrench-styles.js` | 1,554 | CSS generation & theme | ES modules |
| `src/bitwrench-components-v2.js` | 1,231 | Component library (27 components) | ES modules |
| `src/version.js` | 17 | Auto-generated version | ES modules |

**Entry point**: `bitwrench_v2.js` (Rollup builds from this)
**Total active source**: ~4,900 lines

### What's Implemented

**Core engine:**
- `bw.html(taco)` - TACO to HTML string
- `bw.createDOM(taco)` - TACO to DOM element
- `bw.DOM(selector, taco)` - Mount TACO to page
- `bw.css(rules)` - Generate CSS from JS objects
- `bw.injectCSS(css)` - Inject CSS into document
- `bw.loadDefaultStyles()` - Bootstrap-inspired defaults
- `bw.typeOf()`, `bw.uuid()`, `bw.escapeHTML()`, `bw.$()` - Utilities

**Components (27 make* functions):**
- Layout: Container, Row, Col, Stack
- Content: Card, CardV2, Hero, Section, CTA, FeatureGrid
- Navigation: Nav, Navbar, Breadcrumb
- Interactive: Button, Tabs, Alert, Badge, Progress, ListGroup, Spinner
- Forms: Form, FormGroup, Input, Textarea, Select, Checkbox
- Utility: CodeDemo

**Legacy v1 functions retained:**
- Color: colorParse, colorInterp, colorHslToRgb, colorRgbToHsl
- Arrays: arrayUniq, arrayBinA, arrayBNotInA
- Browser: setCookie, getCookie, getURLParam
- Data: loremIpsum, multiArray, naturalCompare
- Timing: setIntervalX, repeatUntil
- Tables: htmlTable, htmlTabs
- File I/O: saveClientFile, saveClientJSON

### Test State

| Suite | Framework | Tests | Status |
|-------|-----------|-------|--------|
| Unit (CI) | Mocha + Chai | 28 | All passing |
| Unit (pending) | Mocha | 10 | Skipped (documented) |
| Unit (v1 legacy) | Mocha | 63 | Failing (v1 API) |
| E2E | Playwright | 151 | 83 pass / 67 fail |
| Coverage | nyc | - | 0% (instrumentation broken for ES modules) |

**CI**: Only CodeQL security scanning. No automated test runner in GitHub Actions.

### Build Output

6 formats via Rollup: UMD, UMD.min, ESM, ESM.min, CJS, ES5, ES5.min (all with source maps)

---

## Gap Analysis: Design vs. Implementation

### 1. CSS Class Naming Convention

**Design says**: All underscore (`bw_table`, `bw_btn`, `bw_card`)
**Code uses**: All hyphen (`bw-table`, `bw-btn`, `bw-card`)

**Impact**: Every CSS class name in `bitwrench-styles.js`, `bitwrench-components-v2.js`, and all examples needs renaming. This is a bulk find-replace but must be done atomically (everything at once).

**Effort**: Medium. ~200 class name references across 3 source files and ~10 example files.

### 2. Three-Layer Class System

**Design says**: Style classes (`bw_table`) + item type classes (`bw_item_table`) + UUID classes (`bw_uuid_xxxx`)
**Code has**: Style classes only. No `bw_item_*` classes. No auto-UUID assignment.

**Impact**: The `createDOM()` and `DOM()` functions need to:
- Auto-assign `bw_uuid_xxxx` class to every rendered element
- Add `bw_item_*` class to component root elements
- Make `bw.$()` the primary lookup mechanism (already exists)

**Effort**: Medium. Core rendering pipeline change.

### 3. DOM-as-Registry (No Map)

**Design says**: No `bw._registry`. querySelector on UUID/item classes is the registry.
**Code has**: `_componentRegistry = new Map()` and `_unmountCallbacks = new Map()`

**Impact**: Remove `_componentRegistry` Map. Keep `_unmountCallbacks` (still needed for lifecycle hooks, but can be keyed by UUID class). The DOM is the source of truth.

**Effort**: Low-Medium. Simplification.

### 4. TACO Attribute Keys

**Design says**: `bw_id`, `bw_meta`, `bw_events` (unquoted, underscore)
**Code has**: No `bw_id` or `bw_meta` support at all.

**Impact**: The rendering pipeline needs to:
- Recognize `bw_id` and add a corresponding class (`bw_id_xxx`)
- Strip `bw_meta` from rendered attributes (don't emit to DOM)
- Process `bw_events` for event forwarding (bw.remote feature)

**Effort**: Medium. New feature in the rendering path.

### 5. Content Escaping

**Design says**: All text content escaped by default. `o: { raw: true }` or `bw.raw()` for opt-in raw HTML.
**Code does**: `bw.escapeHTML()` exists but is NOT called by default in `html()` or `createDOM()`. Content is passed through raw.

**Impact**: Breaking change. All content needs escaping by default. Need `bw.raw()` wrapper function.

**Effort**: Low code change, but need to audit all examples for breakage.

### 6. Accessibility (ARIA)

**Design says**: Components emit correct ARIA by default.
**Code has**: Tabs have `role="tablist"/"tab"/"tabpanel"` and `aria-selected`. Most other components have NO ARIA attributes.

**Impact**: Every component needs ARIA audit. Buttons need `aria-disabled`, alerts need `role="alert"`, modals need `aria-modal`, forms need `aria-required`/`aria-invalid`, nav needs `aria-current`, etc.

**Effort**: Medium. Per-component changes.

### 7. Helper Functions as TACO Generators

**Design says**: All helpers emit TACO objects, never HTML strings.
**Code has**: Mixed. `bw.htmlTable()` and `bw.htmlTabs()` still generate HTML strings (v1 pattern). `bw.makeTable()` exists but is separate.

**Impact**: `htmlTable()` and `htmlTabs()` should be deprecated. `makeTable()` and `makeTabs()` are the v2 replacements.

**Effort**: Low. The TACO versions already exist.

### 8. bw.remote() / Server-Driven UI

**Design says**: Full protocol with patch operations, SSE/WS transport, event capture.
**Code has**: Nothing. No `bw.patch()`, no `bw.remote`, no event serialization.

**Impact**: Entirely new subsystem. But it builds on the core (TACO rendering + UUID classes + `bw_id`).

**Effort**: High. This is a Phase 2 feature.

### 9. Forms / JSON Schema

**Design says**: `bw.makeFormFromSchema(schema)`, `bw.formValues()`, `bw.formValidate()`
**Code has**: Basic form components (makeInput, makeSelect, etc.) but no `formValues()`, no `formValidate()`, no JSON Schema support.

**Effort**: Medium. New functions, but form components exist.

### 10. CSP / Nonce Support

**Design says**: `bw.config.cspNonce` applied to all injected `<style>` tags.
**Code has**: `injectCSS()` creates `<style>` tags with no nonce.

**Effort**: Low. One-line change to `injectCSS()`.

### 11. Test Coverage

**Design says**: 100% unit test coverage.
**Code has**: 28 passing tests, 0% measured coverage (nyc can't instrument ES modules as configured).

**Impact**: Major gap. Need ~200+ tests to hit 100% on 4,900 lines of source.

**Effort**: High. But can be done incrementally.

### 12. GitHub Pages Site

**Design says**: Should be written in bitwrench.
**Code has**: `index.html` is auto-generated by `docbat.js` (legacy tool). It's a v1-era page.

**Impact**: Rewrite `index.html` as a bitwrench-rendered page that serves as both documentation and a demo of the library's capabilities. Dog-food the library.

**Effort**: Medium. The examples_v2r2/index.html is already close to this pattern.

---

## Recommended Approach

### Phase 0: Foundation Cleanup (Do First)

1. **Rename all CSS classes** from `bw-` to `bw_` across source, styles, components, and examples. This is mechanical but must be done atomically.

2. **Delete `src/bitwrench.js`** (the old 561-line IIFE file). The v2 file is the real source. Keep it in git history.

3. **Fix nyc/coverage** for ES modules. Either:
   - Use c8 instead of nyc (native ESM coverage)
   - Or configure nyc with `--experimental-modules` + babel transform

4. **Add GitHub Actions CI** that runs `npm test` + `npm run test:e2e` on push/PR.

### Phase 1: Core Engine Updates

5. **Auto-UUID assignment** in `createDOM()` - every element gets `bw_uuid_xxxx` class.

6. **Item type classes** - `makeCard()` adds `bw_item_card`, `makeTable()` adds `bw_item_table`, etc.

7. **Content escaping by default** - `html()` and `createDOM()` escape text content. Add `bw.raw()` wrapper.

8. **`bw_id` support** - rendering pipeline recognizes `bw_id` in TACO attributes, adds as class.

9. **`bw_meta` stripping** - rendering pipeline strips `bw_meta` from DOM output (internal use only).

10. **Remove `_componentRegistry` Map** - DOM is the registry. querySelector replaces Map lookups.

### Phase 2: Component Polish

11. **ARIA attributes** on all components - audit and add.

12. **Deprecate `htmlTable()` / `htmlTabs()`** - point users to `makeTable()` / `makeTabs()`.

13. **`bw.formValues(selector)`** - collect form data as JSON object.

14. **`bw.formValidate(selector)`** - basic validation (required, type, min/max).

15. **`bw.makeFormFromSchema(schema)`** - JSON Schema → form TACO.

16. **CSP nonce** - `bw.config.cspNonce` applied in `injectCSS()`.

### Phase 3: Testing

17. **100% unit test coverage** - write tests for every public function. Start with core (`html`, `createDOM`, `DOM`, `css`), then utilities, then components.

18. **Fix Playwright tests** - 67 currently failing. Fix or update expectations.

19. **Add coverage enforcement** - `nyc` with `--check-coverage --lines 100 --branches 100 --functions 100`.

### Phase 4: GitHub Pages & Documentation

20. **Rewrite `index.html`** in bitwrench - use `bw.DOM()`, `bw.makeCard()`, `bw.makeTabs()`, etc. The site IS the demo. Include:
    - Interactive TACO playground (type TACO, see rendered output)
    - Component gallery (every BCCL component)
    - Theme switcher (demonstrate CSS class bulk reactivity)
    - Getting started guide
    - API reference (generated from JSDoc or similar)

### Phase 5: bw.remote() (Future)

21. **`bw.patch(operations)`** - apply patch operations to live DOM using UUID/bw_id targeting.

22. **Transport layer** - SSE (default) + WebSocket client.

23. **Event capture** - serialize user events as JSON, send to server.

24. **Server libraries** - Node.js reference implementation, then Python.

---

## What NOT to Do

- **Don't add virtual DOM** - the whole point is direct DOM manipulation
- **Don't add a reactive state system** - explicit re-render is a feature
- **Don't break the 45KB gzipped budget** - measure after each phase
- **Don't add TypeScript source** - .d.ts file for consumers is enough
- **Don't start bw.remote() before Phase 1-2 are solid** - the foundation must be right first
- **Don't rewrite from scratch** - the existing code is 80% there, iterate on it

---

## Design Documents Index

All design docs live in `/dev/`. Here's what's current vs. superseded:

### Current (Authoritative)

| File | Purpose |
|------|---------|
| `bitwrench-2x-discussion.md` | **Master design doc** - Core thesis, CSS strategy, component scope, bw.remote protocol, UUID/class system, all resolved decisions |
| `bw2x-compatibility.md` | Browser compatibility tiers (Tier 1/2/3) and graceful degradation strategy |
| `bw2x-implementation-assessment.md` | This file - gap analysis and implementation plan |

### Historical (Reference Only)

These documents informed the current design but are now superseded by `bitwrench-2x-discussion.md`:

| File | Status | Notes |
|------|--------|-------|
| `bitwrench_v2_design.md` | Superseded | Original v2 philosophy - key ideas folded into discussion doc |
| `bitwrench_v2r2.md` | Superseded | v2r2 architecture - rendering modes folded into discussion doc |
| `bitwrench_v2_components.md` | Reference | Component specs - still useful for detailed component API |
| `bitwrench_v2_bccl.md` | Reference | BCCL component list - still useful for scope |
| `bitwrench_v2_css.md` | Partially superseded | CSS details - three-approach strategy now in discussion doc |
| `bitwrench_v2_core_fns.md` | Reference | Core function specs - still useful |
| `bitwrench_v2_evaluation.md` | Superseded | Initial evaluation (score 6/10) |
| `bitwrench_v2_evaluation_revised.md` | Superseded | Revised evaluation (score 8/10) |
| `bitwrench_v2_action_plan.md` | Superseded | Action items - now in discussion doc and this assessment |
| `bitwrench_v2_implementation_plan.md` | Superseded | Phased plan - replaced by this assessment |
| `bitwrench_v2_implementation.md` | Superseded | Implementation gaps - replaced by this assessment |
| `bitwrench_v2_concerns.md` | Superseded | Risks addressed in discussion doc |
| `bitwrench_v2_performance_notes.md` | Reference | Performance data still useful |
| `bitwrench_v2_examples.md` | Reference | Example patterns still useful |
| `bitwrench_v2r1.md` | Historical | v2r1 iteration |
| `bitwrench-todo.md` | Historical | Legacy todo list |

### Recommendation

Keep all files for historical reference (git history is useful), but day-to-day work should reference only the three current documents. The discussion doc is the source of truth for architectural decisions.
