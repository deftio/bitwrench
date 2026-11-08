# CSS split — core sheet and BCCL sheet

Decided 2026-10-11. **Implemented 2026-11-07 on `feature/css-lean-split`
(2.1.14).** Measured on the shipped level-9 `.gz`: lean 36,995 -> 29,758 (UMD)
and 36,783 -> 29,548 (ESM), a 20% cut and 1.6 KB more than the 5.6 KB this plan
predicted, because the responsive widget lines and the role-override block
also left. BCCL 11,398 -> 19,731. Full 47,387 -> 47,709 (UMD) and 47,527 ->
47,860 (ESM): the glue and the pager rules cost ~320 bytes, under the 47 KB
gate with ~270 bytes left on ESM. Deviations from
the order of work below: the sheets are passed into `generateThemedCSS`,
`getStructuralStyles` and `generateAlternateCSS` as an argument rather than
read from `bw` inside the styles module, so the styles module stays free of
`bw`; the table pager (which emits the button classes) carries a pager-scoped
copy of the small-button rules in core so lean renders it; a lean gate of 30 KB
is in `tools/release.js`. Earlier history: retargeted to 2.1.13 on
2026-10-11, then slid to 2.1.14 when 2.1.13 became the API-consistency release.

Why it moved: the prize is lean-only, nothing about shipping verify depends on
it, and `feature/verify-tool` ended up carrying the verify feature plus seven
review fixes across 55+ files. The split touches `generatePaletteClasses`, the
responsive block, `defaultStyles` consumers, a tool and a test file -- not work
to land on top of that.

The `tools/release.js` note has been corrected already: it said 2.2 and claimed
~14 KB would leave the full file. Both wrong; the full file does not shrink.
The budget was raised to 47 KB for 2.1.13 (API consistency, Manu 2026-11-07);
this split must not raise it again.

**Build shape, decided 2026-11-01 (Manu).** `bitwrench.js` stays the
full build with BCCL included; `bitwrench-lean` stays the smaller artifact.
The alternative that was under consideration for a while -- `bitwrench.js`
becoming the lean build and some other name carrying BCCL -- is dropped: it
changes every CDN pin and import for no capability gain, and the 2.2 plan
already rules out a `bitwrench-full` duplicate for the same reason. The
direction is instead "make lean leaner": this CSS split is the first cut
(about 5.6 KB gz), and further cuts to the lean engine (see "What this does
not do") are a follow-on plan, not a rename.

**Re-measure before starting.** The baseline in the Sizes table below is from
2026-10-11 and the tree moved after it (see the note there). In particular the
ESM headroom this plan budgets its glue against is smaller than the table says.

## The split

**Core** (`src/bitwrench-styles.js`, in both the full build and lean) keeps:

- The converter: `bw.css()`, `bw.s()`, `bw.injectCSS()`, `makeStyles`,
  `loadStyles`, palette and layout tokens.
- The reset: `structuralRules.base` and `generateResetThemed` (box model,
  list indent, `prefers-reduced-motion`, `body` color from the seed).
- `generateTypographyThemed` and `generateProseThemed`. Leave bare `a` and
  `hr` as they are. This pass does not restyle elements.
- Role colors and the bg/text utilities inside `generatePaletteClasses`:
  `.bw_primary` (and the other roles) plus `:hover`, `:active`,
  `:focus-visible`, `.bw_bg_*`, `.bw_text_*`, `.bw_text_muted`,
  `.bw_bg_dark`, `.bw_bg_light`, `.bw_text_light`, `.bw_text_dark`.
- The utility kit, generated from loops: spacing (`.bw_m_*`, `.bw_p_*`,
  `.bw_g_*`, `.bw_gap_*`), display, flex, type, border, radius, shadow,
  size, position, overflow, opacity.
- The grid: `structuralRules.grid`, `stacks`, `offsets`, and the
  breakpoint columns in `structuralRules.responsive`. `.bw_bccl_container`
  and `.bw_bccl_container_fluid` are aliases on that grid and stay.
- Table and bar-chart rules, and the four factories: `makeTable`,
  `makeTableFromArray`, `makeDataTable`, `makeBarChart`. A strict split
  would put them in BCCL with the other widgets. They stay in core on
  purpose. A data table and a bar chart are the things a lean page
  actually needs (a device, a script, a generated report), and they are
  useful enough to keep on `bw` without loading the component sheet.
  Their CSS stays with them: `structuralRules.tables`,
  `structuralRules.barChart`, `generateTables`, and the
  `defaultStyles.tableResponsive` alias (`.bw_bccl_table_responsive`).
  The small-screen `.bw_bccl_table` rule stays with the table.

**BCCL** (a new `src/bitwrench-bccl-styles.js`, imported only by
`src/bitwrench-bccl.js`) keeps both halves of each widget.

Structural categories that move, as one object:

`buttons`, `cards`, `forms`, `formChecks`, `navigation`, `alerts`,
`badges`, `progress`, `tabs`, `listGroups`, `pagination`, `breadcrumb`,
`hero`, `features`, `sections`, `cta`, `spinner`, `closeButton`,
`codeDemo`, `buttonGroup`, `accordion`, `carousel`, `modal`, `toast`,
`dropdown`, `formSwitch`, `skeleton`, `avatar`, `statCard`, `tooltip`,
`popover`, `searchInput`, `range`, `mediaObject`, `fileUpload`,
`timeline`, `stepper`, `chipInput`.

Themed generators that move, called from today's `generateThemedCSS`:

`generateButtons`, `generateAlerts`, `generateCards`, `generateForms`,
`generateNavigation`, `generateTabs`, `generateListGroups`,
`generatePagination`, `generateProgress`, `generateBreadcrumbThemed`,
`generateCloseButtonThemed`, `generateSectionsThemed`,
`generateAccordionThemed`, `generateCarouselThemed`, `generateModalThemed`,
`generateToastThemed`, `generateDropdownThemed`, `generateSwitchThemed`,
`generateSkeletonThemed`, `generateStatCardThemed`,
`generateTimelineThemed`, `generateStepperThemed`,
`generateChipInputThemed`, `generateFileUploadThemed`,
`generateRangeThemed`, `generateSearchThemed`, `generateTooltipThemed`,
`generatePopoverThemed`, `generateCodeDemoThemed`, `generateNavPillsThemed`.

`generateTables`, `generateResetThemed`, `generateTypographyThemed`, and
`generateProseThemed` stay in the core call list.

Widget lines that move out of `generatePaletteClasses` (the role classes
above stay):

`.bw_bccl_alert.bw_*`, `.bw_bccl_toast.bw_*`, `.bw_stat_card.bw_*`,
`.bw_bccl_card.bw_*`, `.bw_bccl_timeline_marker.bw_*`,
`.bw_spinner_border.bw_*` and its `:hover`, `.bw_spinner_grow.bw_*`,
`.bw_bccl_btn_outline.bw_*` and its `:hover`, `.bw_bccl_hero.bw_*`,
`.bw_bccl_progress_bar.bw_*`.

Widget lines that move out of the `@media (max-width: 575px)` block.
Grid lines in that block stay:

Move: `.bw_bccl_card_img_left`, `.bw_bccl_card_img_right`,
`.bw_bccl_hero`, `.bw_cta_actions`, `.bw_bccl_modal_dialog`,
`.bw_bccl_modal_lg`, `.bw_bccl_modal_xl`, `.bw_bccl_navbar`,
`.bw_bccl_navbar_brand`, `.bw_bccl_navbar_nav`, `.bw_bccl_tooltip`.

Stay: `.bw_hstack`, the `.bw_col*` stack, `.bw_bccl_container`,
`.bw_bccl_container_fluid`, `.bw_bccl_table`.

A widget rule ships with the factory. A factory ships with its rule. Lean
does not contain either.

## How the two bundles pick up the sheet

`bw.loadStyles()` stays the one call. Core always emits the core sheet.
The BCCL module exports the widget sheet. Something has to hand that
sheet to `bw` at call time, because of three facts about the build:

1. Lean does not contain `bitwrench-bccl.js`. `rollup.config.js`
   `stubComponents()` redirects every import whose specifier contains
   `bitwrench-bccl` to `src/bitwrench-components-stub.js`. Core
   (`bitwrench.js`, `bitwrench-styles.js`) must not import
   `bitwrench-bccl-styles.js`. Only `bitwrench-bccl.js` imports it.
   The stub exports `bcclStyles = null`.

   Note the match is `source.includes('bitwrench-bccl')` -- a **substring**, so
   it catches `bitwrench-bccl-styles.js` too. Harmless as designed, because
   lean stubs the whole of `bitwrench-bccl.js` and its import never runs. But
   it makes the filename load-bearing: if core ever imports the widget sheet,
   the lean build silently gets the stub instead of failing. The lean
   `loadStyles()` assertion in step 5 is the only thing that catches that.
2. The standalone BCCL bundle (`src/bitwrench-bccl-entry.js`) has no
   external for the style engine. `bitwrench-bccl-styles.js` must not
   import `bitwrench-styles.js`. An import copies the engine into the
   BCCL artifact and the ~20 KB figure is gone. The widget file is pure
   data plus functions. Core passes helpers in: `{ sx, tr, fr, sf }`,
   the existing `_sx` / `_tr` / `_fr` / `_sf`.
3. `bw.makeStyles` closes over the module it was bundled with. Loading
   the BCCL script after lean does not change that closure. Read the
   sheet when `makeStyles` and `loadStructural` run, from a list on
   `bw`.

Shape:

```javascript
// bitwrench-bccl-styles.js — no imports
export function bcclStructural() { /* the categories above */ }
export function bcclThemed(scope, palette, layout, h) { /* moved generate* */ }

// bitwrench-bccl.js
export var bcclStyles = { structural: bcclStructural, themed: bcclThemed };

// bitwrench.js, at call time
var sheets = bw._bw_style_sheets || [];
```

Install the sheet in both places that already register factories: the
block at the bottom of `bitwrench.js` (full build, `components.bcclStyles`),
and `registerBCCL` in `bitwrench-bccl-entry.js` (lean script, then the
BCCL script). Push once. A second push would print every widget rule twice.

Merge in two places, or widgets show up in one mode and not the other:

- `bw.loadStructural` — append each sheet's structural rules after
  `getStructuralStyles()`. This is the display, flex, and position half.
- `bw.makeStyles` — append each sheet's `themed('', palette, layout, h)`
  onto **both** `generateThemedCSS` results, the primary and the
  alternate. The alternate path is what paints a button under
  `.bw_theme_alt`. Missing it means dark mode drops widget colors.

`loadStructural` is idempotent. The supported order is the one the BCCL
entry already documents: lean script, then BCCL script, then
`loadStyles()`. A `loadStyles()` that ran before the BCCL script does
not pick up widget structure later. Do not add a re-inject.

`getStructuralStyles()`, `defaultStyles`, and `generateThemedCSS` stay
core-only. Tests and tools that want a widget category import it from
`bitwrench-bccl-styles.js`. `defaultStyles.modal` and the other moved
keys leave the core export. `defaultStyles.enhancedCards` is an alias of
`cards` and moves with it. `reset`, `utilities`, grid, table, and
`barChart` stay.

No second public entry point. A page that wants widgets loads the full
build, or loads lean plus the BCCL artifact. Both already exist.

## Sizes

Measured 2026-10-11 against the shipped level-9 `.gz` files (the same
files the release gate measures). The lean number is a real rebuild:
component structural categories emptied, component `generate*` calls
removed so the bundler dropped the function bodies, then terser and gzip
level 9. Table and bar-chart rules were left in. The palette-role
overrides and the mixed responsive block were also left in, so the lean
figure is a few hundred bytes high. The BCCL number appends that moved
chunk, minified on its own, to today's `bitwrench-bccl.umd.min.js` and
gzips the result. It assumes the chunk does not drag in
`bitwrench-styles.js`.

| Artifact | Today (level-9 gzip) | After the split |
|---|---|---|
| Lean `bitwrench-lean.umd.min.js` | 36,671 (35.8 KB) | **31,113 (30.4 KB)** |
| BCCL `bitwrench-bccl.umd.min.js` | 11,135 (10.9 KB) | **~20,000 (19.5 KB)** |
| Full `bitwrench.umd.min.js` | 46,791 (45.7 KB) | **≤ 47,104** |
| Full `bitwrench.esm.min.js` | 46,928 | **≤ 47,104** |

The gate is `46 * 1024` = **47,104** bytes, level-9 gzip, on **both** the
UMD and the ESM min files (`tools/release.js` `gzSize`).

**Stale as of end-of-day 2026-10-11.** `builds.json` now reports the shipped
level-9 `.gz` -- the same number the gate reads -- so the level-6 caveat no
longer applies. And the headroom this plan budgets its glue against has
shrunk, because the 2.1.12 review fixes cost about 75 bytes:

| | this table | actual at 2.1.12 ship |
|---|---|---|
| UMD headroom | 313 | **234** |
| ESM headroom | **176** | **101** |
| lean `.umd.min.js.gz` | 36,671 | 36,740 |
| bccl `.umd.min.js.gz` | 11,135 | 11,398 |

101 bytes is not much to fit install-and-merge glue into. Measure the glue
against the gate after steps 1-3 and before touching
`generatePaletteClasses`, so there is a cheap abort. The full file does not shrink: the rules leave
the core half and enter the BCCL half, and the full file is both halves.
Concatenating the three separately minified pieces read 50 KB; that
overstates it, because one minify of the joined program shares the
dictionary the way today's full build does. Expect the gate number to
stay near 46,791. Any growth is the install-and-merge glue.

If either full file exceeds 48,128 (the 47 KB gate as of 2.1.13), shorten the
glue. Do not raise the budget, and do not ship the split over the gate.

Lean shrinks by about **5.6 KB** gzipped. That is the whole prize.

One open question on that figure: a sourcemap-attribution estimate taken the
same day put it at **6.6 KB** while *keeping* `buttons` and `closeButton` in
core, which this plan moves. Moving more should save more, so the two numbers
disagree in the wrong direction. The real rebuild here is the sounder method;
reproduce it before the figure is used as the justification. The
source that moves is large (widget structural categories are most of the
40 KB structural object, plus the themed generators the bundler then
drops). Those objects are repetitive, and gzip was already crushing them.
They are why lean contains hundreds of `bw_bccl_` selectors. They are not
why lean is 37 KB. The rest is the engine: both renderers, the lifecycle,
the router, the wire protocol, color math, and the four core factories.

## Order of work

1. Add `src/bitwrench-bccl-styles.js` with the categories and generators
   listed above. No import from `bitwrench-styles.js`. Export
   `bcclStructural` and `bcclThemed(scope, palette, layout, helpers)`.
2. Export `bcclStyles` from `bitwrench-bccl.js`. Export
   `bcclStyles = null` from the lean stub. Install it from the bottom of
   `bitwrench.js` and from `registerBCCL`, pushing onto
   `bw._bw_style_sheets` once.
3. Merge that list in `bw.loadStructural` and in both themed results
   inside `bw.makeStyles`. Split `generatePaletteClasses` and the
   small-screen block so the selectors listed above are not still emitted
   by core.
4. Point `defaultStyles` consumers at the sheet that owns the category.
   `test/bitwrench_test_components.js` asserts the moved keys on
   `defaultStyles`. `tools/build-css-class-inventory.js` walks
   `defaultStyles` and must also walk the BCCL sheet, or the inventory
   loses the widget classes. Grep `defaultStyles.` for the moved names.
   Rewrite the comment in `bitwrench-styles.js` that says a new BCCL
   component is a category in `structuralRules`. It is a category in the
   BCCL styles file.
5. Rebuild. Check the four gate numbers against the table. Confirm a
   full-build `loadStyles()` string contains `.bw_bccl_btn`, and a lean
   `loadStyles()` string does not contain `.bw_bccl_btn`,
   `.bw_bccl_card`, or `.bw_bccl_modal`. Lean still contains
   `.bw_bccl_table` and `.bw_bccl_container`. The BCCL artifact does not
   contain `derivePalette` or `generateUtilityRules`. Loading BCCL twice
   does not duplicate a widget rule. The alternate palette still colors
   a button.
6. Docs and the stale note. `docs/core-api.md` and the lean row of the
   README: lean is "renderer, reset, utilities, grid, tables, bar chart,"
   not "the full look without the factories." The header comment in
   `src/bitwrench-lean.js` says the same. Replace the 2.2 paragraph in
   `tools/release.js`: this split is 2.1.12, it removes about 5.6 KB
   gzip from lean, and the full file stays under the same 47 KB ceiling.

## What this does not do

It does not make lean a micro kernel. 30 KB gzipped is still both
renderers and the protocol. A further cut is a different plan, and that
plan is the agreed direction (2026-11-01): keep `bitwrench.js` as the full
build and keep taking weight out of lean. Candidates to measure for that
follow-on: the wire protocol and `bw.connect` client, the router, the
four core factories, and the file I/O and cookie utilities. Each needs a
sourcemap-attribution number before it is moved, and anything moved out
of lean must still be loadable after it (the `registerBCCL` pattern).

It does not change the north-star decision on bare elements. Reset and
`body` stay. Widget chrome does not move onto `button` or `h1`.

It does not move the four table and chart factories, or their CSS.

It does not publish a new package. Same three artifacts, different
contents.
