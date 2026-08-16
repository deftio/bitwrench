# Feedback on `dev/bitwrench-2.2-release-plan.md`

Status: **review response**
Reviewer: Claude (Opus 5)
Date: 2026-08-09
Measured against: 2.1.7 working tree, `dist/` as built 2026-08-09

---

## 0. One-paragraph summary

The plan's product decisions are right: `lean` => `core`, no `bitwrench-full`,
and "loading a script never injects CSS". The plan's *diagnosis* of the CSS
problem is also right but understated -- the boundary is not merely blurry, the
core build ships byte-identical CSS to the full build. Where the plan goes
wrong is scope and sequencing: it spends a breaking API rename (`loadCSSReset`)
that buys nothing, it recommends moving `makeTable` out of core against its own
stated embedded strategy, and it asks for sign-off on the CSS plan before the
inventory that would make sign-off possible. Most importantly, it models CSS as
a single core/BCCL split when the code already has a *second*, orthogonal split
(reset / structural / themed) that the plan never mentions. That omission is
the reason "core CSS = reset + utilities" is currently unimplementable as
written.

---

## 1. Corrections to facts in the plan

### 1.1 The size baseline is wrong, and the wrong artifact is at risk

The plan (Sec. 8) states the full UMD is 46,082 B gzipped, "2 bytes over" the
46,080 B gate, and uses that to constrain the Sec. 4.1 alias decision.

The gate does not read that number. `tools/release.js:174-178` prefers the
shipped `.gz` file, falling back to `gzipSync(..., {level: 9})`:

| Artifact | plan says | what the gate reads | headroom |
|---|---:|---:|---:|
| `dist/bitwrench.umd.min.js.gz` | 46,082 | **45,940** | 140 B |
| `dist/bitwrench.esm.min.js.gz` | not listed | **46,071** | **9 B** |

46,082 is zlib *default* compression (level 6), which is what
`tools/build-builds-manifest.js:45` uses. So two tools in this repo report
"gzipped size" at two different compression levels and disagree by ~140 bytes.

Two consequences:

1. There is headroom, but the binding constraint is **ESM at 9 bytes**, not
   UMD. The plan's "measure, do not assume" instinct is correct and is aimed at
   the wrong file.
2. Reconciling the two gzip levels belongs on the Sec. 5.3 list as a defect,
   not just as part of the rename sweep.

### 1.2 The core/BCCL CSS problem is measured, not hypothetical

`bitwrench-lean` and `bitwrench` generate **byte-identical CSS**:

```
lean.makeStyles({}).css === full.makeStyles({}).css   // true
length: 27,864 B (both)
unique .bw_bccl_* selectors present in lean: 53 (160 occurrences)
lean exports makeButton: undefined
lean exports makeTable:  function
lean exports makeBarChart: function
```

Splitting generated rules by selector prefix:

| Layer | bytes | share |
|---|---:|---:|
| `.bw_bccl_*` rules | 14,403 | **51.7%** |
| everything else | 13,154 | 48.3% |

So the core build carries ~14 KB of CSS for components it cannot construct.
This answers the Sec. 8 open item "confirm the core CSS split creates a real
embedded payload reduction" -- yes, roughly half the runtime stylesheet. Put
the number in the plan rather than listing it as future verification.

It also sharpens Sec. 7.7: the CSS is not runtime-filtered in core today, it is
emitted wholesale. The Rollup BCCL stub works for JS (35,813 vs 45,940 gz) and
does nothing at all for CSS.

### 1.3 The `bw_bccl_*` namespace is already partly shipped

Sec. 7.6 reads as a greenfield proposal. It is mid-flight. `src/bitwrench-styles.js`
contains both migrated and unmigrated categories, adjacent to each other:

```js
// ---- Hero ----      (migrated)
'.bw_bccl_hero', '.bw_bccl_hero_title', '.bw_bccl_hero_actions', ...

// ---- Features ----  (not migrated, 10 lines later)
'.bw_feature', '.bw_feature_icon', '.bw_feature_title', ...

// ---- Sections ----  (not migrated)
'.bw_section', '.bw_section_header', '.bw_section_title'

// ---- CTA ----       (not migrated)
'.bw_cta', '.bw_cta_content', '.bw_cta_title', '.bw_cta_actions'
```

The plan should state what fraction of Sec. 7.6 is remaining delta. That
changes the migration-guide size materially, and it changes whether "one-shot
rename" is a large break or a small one.

---

## 2. What the plan gets right

- **`lean` => `core`.** Correct, and cheap: 21 files, ~60 real references.
  (Most `grep -i lean` hits are "clean" / "cleanbuild".) A name that describes
  an architectural boundary rather than an optimization is worth the churn now.
- **No `bitwrench-full` / `bitwrench-all`** (Sec. 2.2). The unqualified name
  meaning the complete product is the correct npm/CDN convention, and the
  reasoning about what "all" would imply is sound.
- **"Loading a script must not inject CSS"** (Sec. 3). This is the real
  architectural commitment of 2.2. Everything in Sec. 7 follows from it.
- **Silent alias over console warning** (Sec. 4.1). A zero-dependency UI
  library writing to an application's console is a genuine cost, correctly
  identified.
- **Sec. 7.1's `bw_bccl_btn bw_primary` composition.** Refusing to duplicate
  palette roles into the BCCL namespace is right, and following it through to
  "the test rule cannot be *every emitted class starts with bw_bccl_*" is the
  kind of consequence most plans miss.
- **Sec. 7.9 step 1 and the "do not publish an intermediate state" rule.**
  Characterization tests before the split is exactly right.

---

## 3. Changes I recommend

### 3.1 Cut the `loadCSSReset` rename from 2.2

The style family is `loadStyles` / `makeStyles` / `applyStyles` / `clearStyles`
-- noun-last, no "CSS" infix. `loadReset` fits that shape; `loadCSSReset` does
not. The plan justifies the infix by pointing at `injectCSS`, but `injectCSS`
belongs to a different family (raw-CSS delivery), and `bw.css()` is the
generator. Adding "CSS" back into the Styles family makes naming *less*
consistent, not more.

Cost: 11 files -- runtime (`src/bitwrench.js:4103`), `src/bitwrench.d.ts:469`,
API reference generation, three test files, `pages/08-api-reference.html`,
`docs/bitwrench_api.md`.

The stronger argument is budgetary rather than aesthetic. 2.2 already has one
break worth paying for (the Sec. 7.6 class normalization). Two breaking changes
in one minor release halves the attention each one gets in the migration guide,
and the alias competes for the 9 bytes of ESM headroom identified in 1.1.

Recommendation: keep `loadReset`. Revisit at 3.0 if the naming still grates.

### 3.2 `makeTable` stays core -- Sec. 7.3 already argues for this

Sec. 7.3 establishes the correct axis: **semantic baseline vs. component
chrome**. Applying that axis to the four factories answers Sec. 7.5 directly:

| Factory | emits | axis | owner |
|---|---|---|---|
| `makeTable` | semantic `<table>`, legible with zero CSS | baseline | **core** |
| `makeTableFromArray` | same | baseline | **core** |
| `makeDataTable` | sorting, controls, interactive chrome | chrome | BCCL |
| `makeBarChart` | SVG geometry | chrome | BCCL |

Sec. 7.5 option A contradicts Sec. 7.3: if core owns a semantic baseline for
`table {}`, core can own the factory that emits a semantic table.

The product argument is stronger still. Sec. 1 names the embedded campaign as
the reason 2.2 exists, and the embedded story *is* the core build. A device
serving a status page wants a table more than it wants any other component. If
`bitwrench-core` cannot produce a table, the embedded pitch degrades to "use
the full build", which removes the reason for shipping core at all.

The plan also gives away the answer: "2.2 must preserve that low-friction
capability." A capability you must preserve is a primitive, not a component.

### 3.3 Fix the Sec. 10 / Sec. 7.9 sequencing inversion

Sec. 10 item 3 asks for sign-off on the Sec. 7 CSS recommendations before
implementation begins. But Sec. 7.9 step 1 (build the class/layer inventory) is
the artifact that makes that sign-off possible. You cannot approve a one-shot
rename without knowing how many public classes change.

Run Sec. 7.9 step 1 **before** the plan is approved, as a pre-planning task.
It is cheap -- it is a script over `structuralRules` plus the BCCL factory
output -- and it converts three of the five Sec. 10 decisions from judgment
calls into arithmetic.

---

## 4. What the plan is missing: the consistency audit

This section is the substance of the response. The plan models the CSS problem
as a single split (core vs BCCL). The code has a *second, orthogonal* split
that the plan never names, and several concrete inconsistencies that a
core/BCCL reorganization will not fix on its own.

### 4.1 There are two axes, not one

The code already has horizontal layers, each with its own loader and style
element ID:

| Layer | ID | loader | content |
|---|---|---|---|
| reset | `bw_style_reset` | `bw.loadReset()` | box-sizing, html/body font, reduced-motion |
| structural | `bw_style_structural` | `bw.loadStructural()` | theme-independent geometry **and** utilities |
| themed | `bw_style_global` | `bw.applyStyles()` | palette-derived rules |

`bw.loadStyles()` (`src/bitwrench.js:4052`) injects **structural + themed** and
notably does *not* call `loadReset()`.

The 2.2 plan proposes a vertical split (core vs BCCL). The two are independent.
Every rule in the codebase needs a cell in a matrix, not a slot in a list:

```
                  core            BCCL
  reset        [ yes ]         [ none ]
  utilities    [ yes ]         [ none ]
  chrome       [ minimal ]     [ yes  ]
  themed       [ roles ]       [ component variants ]
```

Until that matrix exists and every current rule is assigned a cell, "core CSS =
reset + utilities" is not implementable -- the structural layer today spans
both columns and both the utilities and chrome rows.

**This is the single most important missing piece.** Freeze the matrix first;
the file split in Sec. 7.7 then falls out of it mechanically.

### 4.2 `makeStyles()`, `loadStyles()`, and `bitwrench.css` are three different stylesheets

| Source | bytes | contains |
|---|---:|---|
| `bw.makeStyles({}).css` | 27,864 | themed only |
| `bw.loadStyles()` injects | ~80,000 | structural + themed |
| `dist/bitwrench.css` | 80,467 | structural + themed |

`dist/bitwrench.css` carries the header:

> This is a static snapshot of what bw.loadStyles() produces

which is true of `loadStyles()` and false of `makeStyles()`. So a user doing
SSR or static extraction via `makeStyles()` gets a stylesheet missing roughly
52 KB of rules, including **every spacing and typography utility**. Their
components render unstyled in ways that are hard to diagnose, because the
themed colors are all present.

Sec. 7.4 gestures at this ("`makeStyles()` and `loadStyles()` must use the same
registered-layer set") but files it under CSS-plan recommendations pending
sign-off. It is not a design question. It is a correctness bug that exists
today, independent of core/BCCL, and it should be fixed in 2.2 regardless of
what happens to Sec. 7.

Also note `tools/export-bw-default-css.js` is dead v1 code -- it requires
`../bitwrench.js` and calls `bw.CSSSimpleStyles()`, neither of which exists.
The live generator is `src/generate-css.js`.

### 4.3 The utilities layer you want does not exist as a layer

Utilities exist, but scattered across two generators with no category of their
own:

- **Color utilities** (`bw_bg_*`, `bw_text_*`) -- generated in the *themed*
  path, derived from palette. Correct location.
- **Spacing / typography / layout utilities** (`bw_mb_3`, `bw_py_5`, `bw_mt_4`,
  `bw_text_center`, `bw_lead`, `bw_h5`, `bw_display_4`) -- buried inside
  `structuralRules` among component geometry. There is no `utilities` category.

There is also no coherent utility *scale*. Bootstrap-style `mb-0..5` implies a
full grid; bitwrench has whichever few values BCCL happened to need. A user
authoring against "core = reset + utilities" will reach for `bw_mb_1` or
`bw_p_3` and find nothing.

Getting to your stated target requires **extracting and completing** a
utilities layer, not relocating files. That is real design work (which scale?
which properties? responsive variants or not?) and it should be a named
deliverable in the plan, not an implicit consequence of the split.

### 4.4 Unnamespaced selectors leak into user pages

In the grid category:

```js
'.col, [class*="col-"]': { ... }
```

`[class*="col-"]` matches **any** element in a user's page whose class
attribute contains the substring `col-`: `.color-picker`, `.column-header`,
`.protocol-row`, `.collapse-btn`. Bare `.col` matches any element classed
`col`. This is a direct violation of the Sec. 3 bring-your-own-CSS contract and
is more damaging than any naming inconsistency, because it silently breaks
*the user's* styles rather than bitwrench's.

Separately, the *themed* layer contains bare element selectors:

```
body, a, a:hover, hr
```

These are in the themed layer, not the reset. So a user who calls
`loadStyles()` expecting palette rules also gets their `<a>` and `<body>`
restyled, with no way to opt out short of not calling it. The Sec. 7.7 note to
"audit reset contents" is right but points at the wrong layer -- the leak is in
themed.

### 4.5 Page-template vocabulary is in the library

`structuralRules` contains `hero`, `features`, `sections`, and `cta`
categories, producing `.bw_section_subtitle`, `.bw_feature_description`,
`.bw_cta_description`, `.bw_cta_actions`, `.bw_hero_overlay`.

That is marketing-landing-page vocabulary, not UI-library vocabulary. Before
deciding whether these are core or BCCL, decide whether they belong in the
library at all. They look like site chrome from `pages/` that migrated inward.
If they stay, they are BCCL page-composition components and need that framing;
if they go, that is ~1 KB of CSS and four categories removed from the problem.

### 4.6 The palette layer hardcodes component selectors

The themed generator loops over color roles and emits, per role:

```
.bw_stat_card.bw_primary
.bw_spinner_border.bw_primary
.bw_spinner_border.bw_primary:hover
.bw_spinner_grow.bw_primary
```

So the *palette* layer enumerates specific components. "Core owns palette
roles" and "BCCL owns components" cannot both be true while this holds.

The dependency needs to invert: a component should opt into a role, and the
role should not know which components exist. Concretely, `.bw_primary` should
set role tokens (background, foreground, border, focus ring) that component
rules consume, rather than the role generator emitting one rule per
(role x component) pair. That also collapses a chunk of the 14 KB, since the
current approach is O(roles x components).

This is arguably the deepest structural issue in the stylesheet, and the plan
does not mention it.

### 4.7 BCCL emits classes that no layer guarantees

`src/bitwrench-bccl.js` emits utility classes from factories:

```js
// makeCard
class: 'bw_bccl_card_subtitle bw_mb_2 bw_text_muted'
// makeHero
class: 'bw_bccl_hero_title bw_display_4 bw_mb_3'
class: 'bw_bccl_hero_subtitle bw_lead bw_mb_4'
class: `bw_bccl_hero ... ${centered ? 'bw_text_center' : ''}`
// makeCTA
class: `bw_bccl_cta bw_cta bw_bg_${variant} bw_py_5`
```

Counted across the file: `bw_text_center` x4, `bw_mb_3` x4, `bw_py_5` x3,
`bw_py_6` x2, `bw_py_4` x2, `bw_py_3` x2, `bw_mb_4` x2, `bw_mb_2` x2,
`bw_mt_4`, `bw_mb_5`, `bw_h5`.

These resolve only if the **structural** layer is loaded. Under the Sec. 7.4
contract they will resolve only if core's utilities layer is loaded. That is
probably fine -- BCCL depends on core, legitimately -- but it must be *stated*
as a contract, and Sec. 7.8's test list needs one more rule:

> Every class emitted by any factory must have a matching rule in a layer that
> the containing build guarantees to install.

That test would have caught the `makeStyles()` gap in 4.2 automatically.

Note also `makeCTA` emits both `bw_bccl_cta` and `bw_cta` -- transitional
dual-emission that Sec. 7.6 should explicitly retire.

### 4.8 CSS custom properties are in use, contradicting the project's own rule

`.claude/CLAUDE.md` states: "NEVER use `var(--bw_*)` CSS custom properties."
`src/bitwrench-styles.js` uses eight:

```
--bw_gutter_x        --bw_body_font_family
--bw_gutter_y        --bw_body_font_size
--bw_font_sans_serif --bw_body_font_weight
--bw_font_monospace  --bw_body_line_height
```

They are used for exactly the two things custom properties are genuinely good
at: cascading gutters through a grid, and a font stack a user may want to
override without regenerating a palette.

Either the rule is too absolute or the code is wrong. Pick one in 2.2 and
encode it in drift-lint. Right now the rule is unenforceable and new
contributors get contradictory signals from the guidance and the source.

My read: the rule's *intent* -- palette values come from JS, not from
`var()` indirection -- is correct and should stay. Carve out an explicit,
enumerated exception for inherited-value plumbing (gutters, font stacks) and
ban everything else.

### 4.9 The hyphen/underscore canonical claim is stale

Project notes describe hyphenated names as canonical with dual selectors
emitted for underscore forms. The shipped stylesheet contains **zero** `.bw-*`
selectors:

```
/\.bw-[a-z]/.test(makeStyles({}).css)  // false
```

Only underscore forms ship. Either restore dual emission or correct the docs.
As it stands, a user following the documentation writes `bw-card` and gets
nothing.

### 4.10 Component chrome dominates the non-BCCL half

Of 148 non-`bw_bccl_` class selectors in the generated CSS, the large majority
are component chrome, not utilities or roles:

```
bw_nav_pills   bw_nav_tabs      bw_nav_link      bw_list_group_item
bw_page_item   bw_page_link     bw_stat_card     bw_stat_change_up
bw_step        bw_step_indicator bw_chip         bw_chip_input
bw_file_upload bw_search_input  bw_search_clear  bw_range
bw_popover     bw_popover_body  bw_skeleton      bw_close
bw_spinner_border bw_spinner_grow bw_code_demo   bw_copy_btn
bw_quote       bw_code          bw_hr
```

So the 48% "core" half of the stylesheet is not reset-plus-utilities either.
The vertical split has substantial work on *both* sides, and the plan's framing
("core is mostly fine, BCCL needs namespacing") understates it.

---

## 5. Recommended 2.2 scope

Ordered by dependency. Items 1-3 are prerequisites for everything else.

**Phase 0 -- inventory (before plan sign-off)**

1. Script the full class/rule inventory: every selector in `structuralRules`
   and the themed generators, every class emitted by every BCCL factory, cross
   referenced. Output the core/BCCL x reset/utilities/chrome/themed matrix with
   every rule assigned a cell. This makes Sec. 10 items 2-4 decidable.

**Phase 1 -- correctness (independent of the core/BCCL split)**

2. Unify `makeStyles()` / `loadStyles()` / `dist/bitwrench.css` so all three
   describe the same stylesheet, with layer selection explicit rather than
   implicit (4.2).
3. Remove `.col, [class*="col-"]` and move bare-element rules out of the themed
   layer (4.4). These are contract violations shipping today.
4. Add the "every emitted class has a rule in a guaranteed layer" test (4.7).

**Phase 2 -- structure**

5. Extract and complete a real utilities layer with a defined scale (4.3).
6. Invert the palette/component dependency so roles do not enumerate
   components (4.6).
7. Decide the fate of hero/features/sections/cta (4.5).
8. Finish the `bw_bccl_*` migration in one pass, retiring dual emission (1.3,
   4.9).

**Phase 3 -- build**

9. `lean` => `core` rename, package exports, artifact/tooling sweep.
10. Physical CSS module split per the Phase 0 matrix; per-SKU budgets; reconcile
    the two gzip levels (1.1).

**Cut from 2.2**

- `loadCSSReset` rename (3.1).
- Moving `makeTable` out of core (3.2).

**Decide in 2.2, do not defer (currently Sec. 7.10)**

- `bw.htmlPage()` / CLI emitting `loadStyles()`. My read: generators should
  keep emitting the call, because a generator emits *source the user can read
  and delete* -- that is opt-in by construction, not hidden injection. State it
  in Sec. 3 as an explicit carve-out rather than leaving the headline contract
  with an unstated exception.
- Static CSS artifact naming. It is the file embedded users are most likely to
  `<link>` from a CDN; it is a public-artifact decision at the same level as the
  build rename and should not sit in an open-questions list.

---

## 6. Answering the question directly

> core CSS is util classes and CSS reset to give someone a clean slate; BCCL
> styles build on those or use their own BCCL-namespaced styles.

That is the right target. What the plan does not tell you is how far the code
is from it:

- The utilities layer does not exist as a layer and its scale is incomplete
  (4.3).
- Roughly 148 non-BCCL selectors are component chrome that must move, not
  utilities that can stay (4.10).
- The reset/structural/themed axis has to be reconciled with the core/BCCL axis
  before anything can move (4.1).
- Two rules leak outside the `bw_` namespace entirely (4.4).
- The palette layer names components, so the two columns are not yet separable
  (4.6).
- Three different functions currently answer "what is bitwrench's CSS" with
  three different stylesheets (4.2).

The clean version you want is reachable, and 2.2 is the right release for it.
But it is a larger job than "namespace BCCL and split the file", and the
inventory in Phase 0 should come before sign-off, not after.
