# bitwrench 2.2 release plan

Status: **draft implementation plan**  
Target: `2.2.0`  
Opened: 2026-08-09

This document records decisions that have been agreed for 2.2. The separate
CSS namespace/ownership design is still under discussion in
`dev/bitwrench_bw_classstyles_cleanup_2.1.7.md`; §7 below is only a boundary
note and is not approval to implement that CSS plan.

---

## 1. Why 2.2 exists

2.1.6 exposed two related inconsistencies:

1. The build called `lean` is really the intended **core** layer, but the name
   describes an optimization rather than an architectural boundary.
2. Core and BCCL are separable in JavaScript but not yet honestly separable in
   CSS.

The project is still early (about eight GitHub stars) and has not started its
embedded-community marketing campaign. This is the least expensive time to
tighten names, build boundaries, and styling contracts before copied examples
become compatibility obligations.

At the same time, bitwrench's batteries-included default is a product strength,
especially for embedded prototypes. 2.2 will preserve that default rather than
making every new user assemble the component library manually.

---

## 2. Signed-off product model

### 2.1 Build roles

| Build | Role | BCCL factories |
|---|---|---|
| `bitwrench` | Default, batteries-included product | included |
| `bitwrench-core` | Core TACO/rendering/state/CSS APIs without BCCL | excluded |
| `bitwrench-bccl` | Addon registered onto an existing core instance | addon only |

`bitwrench-lean` is replaced by the clearer `bitwrench-core` name.

The current lean build is not yet a perfect core boundary: `makeTable`,
`makeTableFromArray`, `makeDataTable`, and `makeBarChart` are defined in
`src/bitwrench.js`, survive the BCCL stub, and are registered into `bw.BCCL`.
Their ownership remains a product decision (§7.5), not a mechanical cleanup.
`makeTable` in particular was a killer 1.x feature: drop in data and get a
working table. 2.2 must preserve that low-friction capability in the default
build regardless of which layer owns its implementation.

The default package import and default CDN artifact remain batteries-included:

```js
import bw from 'bitwrench';
```

The explicit core import becomes:

```js
import bw from 'bitwrench/core';
```

The addon remains:

```js
import { registerBCCL } from 'bitwrench/bccl';
registerBCCL(bw);
```

Browser usage:

```html
<!-- batteries included -->
<script src="bitwrench.umd.min.js"></script>

<!-- or explicit composition -->
<script src="bitwrench-core.umd.min.js"></script>
<script src="bitwrench-bccl.umd.min.js"></script>
```

### 2.2 Why there is no `bitwrench-full` build

The unqualified `bitwrench` artifact already means the complete standard
product. Adding an identical `bitwrench-full` binary would duplicate files,
release checks, SRI entries, and documentation without adding capability.

Likewise, avoid `bitwrench-all`: “all” would imply optional router, debug,
code-editor, and future addons, not just core + BCCL.

Documentation may describe the default as the **full build**, but `full` is not
part of its filename.

---

## 3. Styling contract (signed off at the product level)

Loading a bitwrench script must not inject CSS.

Calling `bw.DOM()` with a hand-written TACO:

- renders only the attributes/classes supplied by the author;
- does not invent bitwrench classes;
- does not install a reset or stylesheet;
- remains compatible with bring-your-own CSS.

Styles are explicitly activated:

```js
bw.loadCSSReset(); // neutral baseline only (new canonical name)
bw.loadStyles();   // opt into the standard bitwrench style system
```

BCCL factories deliberately emit named component hooks, but merely making a
BCCL factory available must not inject CSS.

Exact ownership and loading behavior of the core and BCCL CSS layers is **not
yet signed off**. See §7.

---

## 4. `loadCSSReset` API rename

`bw.loadCSSReset()` becomes the canonical spelling because it says what is
loaded and matches existing CSS-oriented API names such as `injectCSS`.

Required changes once the compatibility choice is made:

- runtime API in `src/bitwrench.js`;
- declaration in `src/bitwrench.d.ts`;
- API reference generation;
- theme/coverage/semantic HTML tests;
- docs, examples, and internal callers;
- drift-lint rule for whichever spelling is retired.

### 4.1 Unresolved compatibility choice (release blocker)

Choose after measuring actual minified + gzipped cost:

**Option A — remove `loadReset` in 2.2**

- smallest and cleanest artifact;
- deliberate breaking API rename in a minor release;
- acceptable only if explicitly called out in the migration guide.

**Option B — keep a silent deprecated alias**

```js
bw.loadReset = bw.loadCSSReset;
```

- preserves compatibility;
- likely small, but must be measured rather than assumed;
- docs and new code use only `loadCSSReset`;
- remove in a future major.

Do **not** make the alias print a console warning in production bundles unless
measurement and policy explicitly approve it. A warning costs materially more
than the alias, adds runtime noise, and makes a zero-dependency UI library
write to an application's console. If an alias is retained, prefer silent
runtime compatibility plus drift-lint/documentation deprecation.

---

## 5. Build and package work

### 5.1 Source/build entries

- Rename `src/bitwrench-lean.js` to `src/bitwrench-core.js`.
- Reuse the existing Rollup BCCL-stub mechanism for the core build initially;
  do not fork core implementation.
- Resolve ownership of the four surviving table/chart factories (§7.5). If
  they move to BCCL, split out any genuinely non-visual conversion helpers
  core still needs; if `makeTable` remains core, give its CSS an honest core
  ownership rather than making core depend on hidden BCCL rules.
- Rename Rollup banners, output filenames, comments, and build labels from
  `lean` to `core`.
- Keep default UMD/CJS/ESM/ES5 inputs batteries-included.
- Keep `src/bitwrench-bccl-entry.js`, but update examples/comments from
  `bitwrench-lean` to `bitwrench-core`.

Expected core artifacts:

```text
dist/bitwrench-core.umd.js
dist/bitwrench-core.umd.min.js
dist/bitwrench-core.esm.js
dist/bitwrench-core.esm.min.js
dist/bitwrench-core.cjs
dist/bitwrench-core.min.cjs
dist/bitwrench-core.es5.js
dist/bitwrench-core.es5.min.js
```

Plus existing source maps and gzip artifacts generated by the release build.

### 5.2 Package exports

- Add canonical `"./core"` export targeting `bitwrench-core`.
- Keep package root (`"."`) targeting batteries-included `bitwrench`.
- Keep `"./bccl"` targeting the addon.
- Decide whether `"./lean"` remains a temporary file/export alias or is
  removed in 2.2. This is separate from the `loadReset` API alias decision.
- Ensure types describe the actual surface of each export. Core types must not
  imply that BCCL factories exist if runtime core does not provide them.

### 5.3 Generated/release artifacts

Update every filename-aware tool:

- build manifest classification;
- SRI generation and verification;
- release archive copying;
- release artifact inventory;
- bundle-size metrics and budgets;
- generated README/download listings;
- clean task and stale-artifact checks.

The release must fail if a stale `bitwrench-lean*` file survives unexpectedly
or if a required `bitwrench-core*` format is absent.

---

## 6. Documentation and migration

### 6.1 One consistent build table

All public docs use the same terminology:

| Need | Build |
|---|---|
| Fastest prototype / standard UI | `bitwrench` |
| Bring your own components/CSS or minimize flash | `bitwrench-core` |
| Add standard components to core | `bitwrench-core` + `bitwrench-bccl` |

### 6.2 Embedded campaign story

The embedded examples should teach both choices without implying that the
larger build is wrong:

> Start with the full build when convenience matters. Switch to core when
> flash size or bring-your-own styling matters; add BCCL separately when you
> want selected standard components.

### 6.3 Migration page

Document:

- `bitwrench-lean*` → `bitwrench-core*`;
- `bitwrench/lean` → `bitwrench/core`;
- `bw.loadReset()` → `bw.loadCSSReset()` and the chosen alias policy;
- whether any CSS class names change (pending §7);
- exact before/after CDN and ESM snippets.

Search and update README, quickstart, LLM guide, component/lifecycle docs,
embedded tutorial, CLI/bwserve-generated shells, AGENTS guidance, examples,
and generated API/build pages.

---

## 7. CSS cleanup recommendation — detailed proposal for review

2.2 is the intended opportunity to make core/BCCL CSS ownership coherent.
The product-level styling contract in §3 is signed off; the implementation
recommendations below are recorded in detail for maintainer review and are not
approved merely by appearing here.

The open design lives in:

```text
dev/bitwrench_bw_classstyles_cleanup_2.1.7.md
```

### 7.1 Class ownership model

Recommended invariant:

| Prefix | Owner | Examples |
|---|---|---|
| `bw_*` | Core public utilities, palette roles, layout primitives and prose hooks | `bw_primary`, `bw_container`, `bw_text_muted` |
| `bw_bccl_*` | BCCL component structure and chrome | `bw_bccl_btn`, `bw_bccl_card_body` |
| `bw_act_*` | Declarative action identity; not a style layer | `bw_act_save` |
| `bw_code_*` | Code-editor component and its substructure | `bw_code_editor`, `bw_code_gutter` |

A BCCL component may legitimately compose a BCCL component class with a core
palette role:

```text
bw_bccl_btn bw_primary
```

`bw_bccl_btn` identifies and styles the component; `bw_primary` is a reusable
core palette role. Do not duplicate palette roles as
`bw_bccl_primary`/`bw_bccl_secondary`.

This means the test rule cannot be “every BCCL-emitted class starts with
`bw_bccl_`.” It must accept a narrow, reviewed set of core role/action classes.

### 7.2 Core utilities inside BCCL factories

BCCL depending on core is legitimate—it is an addon to core. The defect is
not every occurrence of a core class; it is using public utility classes as
undocumented private component geometry.

Recommended distinction:

- **Allowed composition:** palette roles (`bw_primary`), action tokens
  (`bw_act_*`), accessibility helpers such as `bw_visually_hidden`, and any
  deliberately approved core layout primitive.
- **Move into BCCL rules:** private spacing/type/layout currently implemented
  by factory strings such as `bw_mb_4`, `bw_py_5`, or `bw_h5`.

BCCL private geometry should be expressed by its `bw_bccl_*` selectors and
derived from shared palette/layout tokens. Do not create a duplicate
`bw_bccl_mb_4` utility grid.

Maintain a small machine-readable allowlist for intentional core classes
emitted by BCCL. Any addition requires a test update and design review.

### 7.3 Bare HTML baseline versus BCCL chrome

Buttons/cards/forms/form checks/navigation/tables need not be forced wholly
into one bucket. Split **semantic baseline** from **component chrome**:

- Core reset/styles may make naked semantic HTML predictable and usable.
- BCCL owns `.bw_bccl_btn`, `.bw_bccl_card`, `.bw_bccl_table`, interactive
  states, component geometry and polished chrome.

Example:

```text
core:  button { font: inherit; ...minimal baseline... }
BCCL:  .bw_bccl_btn { padding, radius, variants, transitions, ... }
```

This preserves BYOC when no style loader is called, gives hand-written TACOs a
clean baseline after explicit core style activation, and keeps the component
library separable.

### 7.4 Style activation

Recommended deterministic behavior:

```js
// Browser/author CSS only
bw.DOM('#app', taco);

// Reset only
bw.loadCSSReset();

// All standard layers installed in this build
bw.loadStyles();
```

- Core build: `loadStyles()` loads reset + core rules.
- Default build: `loadStyles()` loads reset + core + registered BCCL rules.
- Core + BCCL addon: after `registerBCCL(bw)`, `loadStyles()` produces the same
  result as the default build.
- Loading/registering an artifact never injects CSS by itself.
- Registration must happen before `loadStyles()`; loading BCCL later does not
  silently mutate the page. Calling `loadStyles()` again remains idempotent and
  may install the newly registered layer.

Implementation should use a style-layer registry/composer shared by the
default build and the core+addon path. The core build must not import the BCCL
style module at all; runtime filtering alone does not recover flash space.

`makeStyles()` and `loadStyles()` must use the same registered-layer set so
generated CSS, runtime CSS and static CSS cannot disagree.

### 7.5 `makeTable` / table and chart ownership (decision still open)

Current “lean” retains:

- `makeTable`
- `makeTableFromArray`
- `makeDataTable`
- `makeBarChart`

They live in core source but are registered in `bw.BCCL`. This is an existing
architectural contradiction.

`makeTable` deserves special treatment. “Drop in data and it works” was a
killer 1.x feature and remains aligned with bitwrench's low-friction promise.
Moving it to BCCL does not remove it from the default build, but it removes it
from explicit core.

Two coherent choices:

**A. Move all four factories to BCCL**

- cleanest “core has no visual components” boundary;
- default `bitwrench` retains the killer feature unchanged;
- explicit core users add BCCL when they want a styled table/chart;
- non-visual array/object conversion may remain as separately named core data
  utilities.

**B. Keep `makeTable` as a core flagship primitive**

- preserves drop-in tables for core/embedded users;
- table structural/themed CSS becomes explicitly core-owned;
- `makeDataTable` and `makeBarChart` may still move to BCCL;
- weakens the simple rule that all polished components live in BCCL.

Recommendation for review: prefer **A** if `bitwrench-core` is truly a
rendering/state/BYOC layer. Preserve the feature prominently in the default
build and docs; do not describe the move as feature removal. Prefer **B** only
if data-to-table is declared a foundational TACO primitive alongside
`bw.DOM()`, not merely retained for history.

### 7.6 Public class normalization

Recommended one-shot 2.2 cleanup:

- BCCL component roots and parts use public snake_case `bw_bccl_*` names.
- Remove camelCase identity/style duplication where one class can serve both.
- Rename BCCL-private bare families (`bw_list_group`, `bw_nav_*`,
  `bw_stat_*`, etc.) into the BCCL namespace.
- Keep core palette modifiers such as `bw_primary`.
- Keep action classes in `bw_act_*`.
- Code editor owns `bw_code_*`.
- Code-demo and Try It are examples/compositions built around the code-editor
  component; they do not establish a second competing class namespace.
- Update BCCL handles/slots/query selectors at the same time as emitted
  classes and CSS rules.

Because this is the pre-adoption cleanup window, the recommendation is to
rename coherently rather than dual-emit every stale BCCL class indefinitely.
If 2.2 takes that break, the migration guide must call it out plainly.

### 7.7 Physical CSS split

Conceptual modules:

```text
bitwrench-style-tokens.js   shared palette/layout generation
bitwrench-core-styles.js    reset, semantic baseline, core utilities/roles
bitwrench-bccl-styles.js    BCCL structural and themed rules
```

The exact filenames may differ, but the import graph is mandatory:

```text
core build  ──> tokens + core styles
BCCL addon  ──> BCCL styles (registered onto core)
default     ──> core + registered BCCL
```

Split both halves of the current monolith:

- `structuralRules` categories;
- themed `generate*()` functions;
- static `bitwrench.css` generation;
- `defaultStyles`/public style exports;
- alternate theme generation;
- clear/idempotency style-element IDs.

Audit reset contents while splitting: current reset data also contains named
classes such as `.bw_page`; reset-only output should contain only the explicitly
approved normalization/global selectors.

### 7.8 Test, drift-lint and northstar gates

The cleanup must strengthen tests rather than mechanically rename snapshots.

**Factory/class contract**

1. Instantiate every catalogued BCCL component with representative variants.
2. Recursively collect every emitted class.
3. Require every token to belong to `bw_bccl_*`, `bw_act_*`, or the reviewed
   core allowlist.
4. Require every emitted component class to have a structural or themed rule
   in the BCCL layer.
5. Fail on orphan rules and orphan emitted classes.
6. Verify handles, slots, and interactive selectors still resolve after class
   renames.

**Layer/build contract**

1. Importing any build and calling `bw.DOM()` injects no style elements.
2. `loadCSSReset()` injects reset only and is idempotent.
3. Core `loadStyles()` emits zero `bw_bccl_*` selectors.
4. Default and core+addon produce equivalent component API and CSS.
5. BCCL registration alone injects no CSS.
6. Static generated CSS matches runtime generation for each layer.
7. Track raw/gzip size separately for core, BCCL and default.

**Component behavior**

- Every BCCL catalog entry receives at least one DOM/SSR contract test.
- Interactive components receive handle/event/lifecycle tests.
- Representative variants/sizes/states are covered.
- Browser tests cover the component gallery, forms, tables, modal/toast,
  responsive behavior, theme switching and core+addon loading.
- Tests should assert behavior and ownership, not preserve accidental class
  duplication.

**drift-lint**

- ban retired BCCL class names from source/docs/pages/examples;
- ban new unapproved core utility classes in BCCL factory output;
- detect manual stale component classes where a `make*` factory should be used;
- validate build-name migration (`lean` → `core`);
- keep explicit ignore pragmas for intentional historical/migration examples.

**northstar-llm**

- add the final namespace/layer contract to its rubric;
- audit docs/pages/examples for BYOC violations, implicit style assumptions,
  stale BCCL classes and hand-built component chrome;
- keep northstar audit-only and outside CI/release gating;
- run a full report before the 2.2 release candidate and review all high
  findings manually;
- promote repeated mechanical findings into drift-lint rules.

### 7.9 One release, many reviewable commits

2.2 is one coordinated migration and one public release, but implementation
should remain bisectable:

1. Add characterization inventories/tests for current classes and layers.
2. Freeze the ownership map and BCCL core-class allowlist.
3. Split style modules without intentional visual changes.
4. Add registered-layer composition and prove default/core+addon parity.
5. Resolve table/chart ownership and move code as needed.
6. Normalize BCCL/code-editor classes, selectors, handles and slots.
7. Update drift-lint and northstar rubric/config.
8. Update all docs/pages/examples and migration material.
9. Rebuild artifacts; enforce per-SKU budgets and clean-room tests.
10. Run unit, browser, drift-lint and northstar audits for the release
    candidate.

Do not publish an intermediate state where core is renamed but still embeds
BCCL CSS, or where factories emit renamed classes before matching rules land.

### 7.10 Remaining CSS decisions

The recommendations above reduce the open list to:

- whether generated `bw.htmlPage()` and CLI output should continue inserting
  a runtime `bw.loadStyles()` call automatically (plain script loading is
  already CSS-neutral, but these generators are hidden opt-in exceptions);
- final core allowlist for BCCL-emitted role/layout/accessibility classes;
- `makeTable` ownership: option A or B in §7.5;
- exact reset/global selector inventory;
- whether any retired BCCL class receives a short compatibility alias despite
  the one-shot recommendation;
- static CSS artifact names after the physical layer split.

Do not implement D1/D2/D3 merely because this 2.2 plan exists.

---

## 8. Verification and release gates

### Current size baseline

Measured from the 2.1.7 working tree as shipped, reading the `.gz` files the
build writes at level 9 -- which is what `tools/release.js` gates on. (An
earlier draft of this section quoted level-6 numbers from
`tools/build-builds-manifest.js`, which run ~140 B heavier and are measured
against a file nobody is ever sent. Two tools in this repo still report
"gzipped size" at two different compression levels; reconciling them belongs on
the §5.3 list.)

| Artifact | Gzipped |
|---|---:|
| `bitwrench.esm.min.js` | **46,118 B** |
| `bitwrench.umd.min.js` | 45,985 B |
| `bitwrench.min.cjs` | 45,892 B |
| `bitwrench-lean.umd.min.js` (future core) | 35,851 B |

The gate was raised to `46 * 1024 = 47,104` bytes in 2.1.7, so there is now
about 1 KB of headroom -- and **ESM, not UMD, is the binding artifact**, which
it had quietly been for some time. Treat that kilobyte as a ceiling rather than
a budget to spend: it exists to absorb 2.1.7's correctness fixes, not to fund
deprecation warnings or duplicate compatibility machinery in 2.2. The
`loadReset` alias decision still turns on measurement rather than assumption,
and the CSS/build split is what is expected to give real room back.

### Build matrix

- Default, core, and BCCL addon in every supported module format.
- Default contains BCCL factories.
- Core does not contain/register BCCL factories.
- Core + addon exposes the same BCCL factory surface as default.
- UMD, ESM, and CJS agree on public API.
- ES5 behavior remains covered if ES5 remains a 2.2 deliverable.

### Styling

- Importing/loading any build injects no style elements.
- `bw.DOM()` alone injects no styles.
- `loadCSSReset()` is idempotent.
- `loadStyles()` remains idempotent.
- Core build does not inject BCCL CSS once the CSS plan is approved.
- Full and core+addon produce equivalent BCCL styling once explicitly loaded.

### Size

- Record raw and gzip deltas for every canonical minified build.
- Measure the reset alias separately before deciding §4.1.
- Set independent budgets for default and core; do not make core inherit the
  current full-build 45 KB budget.
- Confirm the core CSS split creates a real embedded payload reduction.

### Clean-room release

- Fresh npm install/package export test.
- CDN-style two-script test: core then BCCL addon.
- Default one-script quick-prototype test.
- Clean-room probes must import package root, `bitwrench/core`, and
  `bitwrench/bccl`; the current release probe checks only package root.
- SRI/manifest/release archive consistency.
- No stale `lean` artifacts unless explicitly retained as aliases.

---

## 9. Explicit non-goals

- No rewrite of TACO/rendering/lifecycle architecture.
- No automatic CSS injection.
- No `bitwrench-full` or `bitwrench-all` duplicate artifact.
- No implementation of the CSS namespace proposal before sign-off.
- No expansion of “batteries included” to router/debug/code-editor.

---

## 10. Decisions remaining before implementation

1. Keep or remove the `bw.loadReset` runtime alias after measuring gzip cost?
2. Keep or remove a temporary `bitwrench-lean` artifact/package-export alias?
3. Sign off on the CSS ownership/class migration recommendations in §7.
4. Choose `makeTable` ownership option A or B (§7.5).
5. Confirm whether ES5 remains in the complete 2.2 build matrix.

