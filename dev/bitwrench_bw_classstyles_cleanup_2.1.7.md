# bw_ class namespacing cleanup -- core vs BCCL

Status: **open discussion** (opened during 2.1.7). Nothing implemented.
Measurements in §§1–5 / §8 came from an exploratory agent pass — useful
diagnostics, **not a signed-off plan**. Maintainer direction and product
naming are in §9 onward.

Context that changes the tradeoff calculus:

- ~8 GitHub stars; pre-marketing (embedded community first).
- Goal: tighten inconsistencies before the campaign, not accumulate
  compatibility debt.
- This is a window where **honest breaking changes are cheaper than
  dual-emit forever**.

---

## 1. The problem, in one sentence

`bw_bccl_*` was introduced so that BCCL owned its own CSS namespace, but the
boundary was never enforced: BCCL still styles itself with core utility classes,
and core still ships BCCL's stylesheet. Neither library can change its own CSS
without moving the other.

### 1.1 What it looks like

**Example A -- BCCL reaches into core's utilities.**

```js
// src/bitwrench-bccl.js, inside a factory
{ a: { class: 'bw_bccl_hero bw_container bw_text_center bw_mb_4 bw_py_5' } }
```

Four of those five classes belong to core. Retune the core spacing scale and
every BCCL hero moves. Retune it for BCCL's sake and every hand-written page
moves. There is no way to change one without the other.

**Example B -- BCCL's private parts sit in core's namespace.**

```js
// makeListGroup emits BOTH
a: { class: 'bw_bccl_listGroup bw_list_group' }
//            ^ identity marker    ^ where the styling actually lives
```

`bw_list_group` is BCCL-internal -- nothing outside BCCL uses it -- but it is
named as though it were core's. That is also the direct cause of the collision
found in 2.1.6: the new prose class `bw_list` reads like the parent of the
`bw_list_group*` family and is unrelated to it. Same for `bw_code` against
`bw_code_pre` / `bw_code_demo`.

**Example C -- core ships CSS it cannot use.**

```
bitwrench-lean:  makeCard              -> undefined      (factories dropped)
                 .bw_bccl_* CSS rules  -> 126 present    (styles NOT dropped)
```

A lean user who chose the build specifically to shed BCCL still injects BCCL's
entire stylesheet at runtime.

### 1.2 Why this matters beyond tidiness

bitwrench core (TACO, `bw.DOM()`, utility classes, bwserve) and BCCL are meant
to be separable -- that is the whole point of the lean build. Today they are
separable in JavaScript and fused in CSS.

---

## 2. Measurements

Generated stylesheet, full build:

| metric | value |
|---|---|
| distinct `bw_` classes with a rule | 524 |
| of which `bw_bccl_*` | 126 |
| of which NOT `bw_bccl_*` | 398 |

So `bw_bccl_*` was never the universal rule. Bare `bw_*` is the *style* layer
and `bw_bccl_*` is the *identity/type* layer -- the intended three-layer scheme.
The defect is not a missing prefix, it is that the two libraries share the style
layer.

What BCCL factories actually emit:

| metric | value |
|---|---|
| distinct classes emitted by BCCL factories | 171 |
| `bw_bccl_*` | 86 |
| bare `bw_*` | 85 |
| ...of those, core utilities (defect D1) | 20 |
| ...of those, BCCL-private parts (defect D2) | 65 |

Lean build cost (defect D3):

| metric | value |
|---|---|
| lean runtime CSS | 105.9KB raw / 14.0KB gz |
| of which `bw_bccl_*` rules | 50.1KB raw (**47%**) |
| BCCL factories available in lean | none |

Namespace collision scan across all 524 classes found exactly one bare-vs-bccl
pair: `bw_container` <-> `bw_bccl_container`, which was added deliberately in
2.1.6 because the docs taught the short form.

---

## 3. Defect D1 -- BCCL depends on core utility classes

The 20 classes BCCL is wired to:

| kind | classes |
|---|---|
| layout | `bw_container` `bw_row` `bw_g_0` `bw_g_4` |
| spacing | `bw_mb_2` `bw_mb_3` `bw_mb_4` `bw_mb_5` `bw_mt_4` `bw_ms_1` `bw_py_5` |
| typography | `bw_h5` `bw_lead` `bw_display_4` `bw_text_center` `bw_text_muted` `bw_text_primary` `bw_text_danger` |
| other | `bw_bg_*` `bw_visually_hidden` |

### Checklist

- [ ] Choose the mechanism:
      (a) BCCL derives its own values from the `layout` + `palette` tokens
          (`bw.makeStyles()` already returns `layout` as of 2.1.6 -- this is
          what that addition unlocks), or
      (b) BCCL gets `bw_bccl_*` equivalents of the utilities it needs
- [ ] Rewrite the emitting factories so no `class:` string in
      `src/bitwrench-bccl.js` names a core utility
- [ ] Rule on `bw_container` specifically -- it is a core convenience class, and
      `.bw_bccl_container, .bw_container` is currently one grouped selector
- [ ] Add a lint or test that fails when a BCCL factory emits a
      non-`bw_bccl_` class, so this cannot drift back

### Affected

- `src/bitwrench-bccl.js` -- factory class strings
- `src/bitwrench-styles.js` -- BCCL rule groups stop assuming utility rules exist
- **No public class names change.** Docs, examples and user CSS are untouched.

This is the invisible half: pure decoupling, no user-visible diff.

---

## 4. Defect D2 -- BCCL's parts live in core's namespace

65 classes across 21 families:

```
bw_step*(6)   bw_cta*(5)      bw_feature*(5)  bw_popover*(5)  bw_skeleton*(5)
bw_code*(4)   bw_nav*(4)      bw_section*(4)  bw_stat*(4)
bw_chip*(3)   bw_file_upload*(3)  bw_media*(3)  bw_range*(3)
bw_avatar*(2) bw_page*(2)     bw_search*(2)
bw_close  bw_copy_btn  bw_list_group  bw_spinner_*  bw_switch_input
```

### Blast radius is much smaller than the count suggests

18 of the 21 families are referenced nowhere outside `src/`:

| family | files outside `src/` |
|---|---|
| `bw_list_group` | 4 |
| `bw_nav_link` | 3 |
| `bw_stat_value` | 1 |
| the other 18 families | 0 |

### Checklist

- [ ] Decide rename outright vs dual-emit for one deprecation cycle
      (`bw_bccl_navLink bw_nav_link`, drop the bare form later)
- [ ] Rename in `src/bitwrench-bccl.js`, the matching `structuralRules` groups,
      and the themed generators
- [ ] Update the 8 files outside `src/` that reference the three exposed families
- [ ] Handle the trailing-underscore stems with care -- `bw_avatar_`,
      `bw_popover_`, `bw_spinner_`, `bw_step_` are built by string concatenation,
      so a naive find-and-replace will miss or corrupt them
- [ ] Pick the surviving casing convention: identity markers are camelCase
      (`bw_bccl_listGroup`) while style classes are snake_case
      (`bw_list_group`). Merging the layers forces a choice
- [ ] Confirm ownership of `bw_code_pre` / `bw_code_demo` -- they are used by
      `makeCodeDemo` in BCCL *and* by `src/bitwrench-code-edit.js`

### Affected

- Class names are public API. Even with near-zero references in this repo,
  any user CSS targeting `.bw_nav_link` or `.bw_stat_value` breaks.
- **This is the only breaking piece. Major-version shaped.**
- Resolves the `bw_list` / `bw_code` prose-class collision as a side effect,
  with no rename needed on the core side.

---

## 5. Defect D3 -- core ships BCCL's CSS to lean users

`structuralRules` has 46 top-level groups, and the split point largely exists
already:

| bucket | count | groups |
|---|---|---|
| clearly core | 6 | `base` `typography` `grid` `stacks` `offsets` `responsive` |
| contested | 6 | `buttons` `cards` `forms` `formChecks` `navigation` `tables` |
| clearly one BCCL component each | 34 | `alerts` `badges` `progress` `tabs` `listGroups` `pagination` `breadcrumb` `hero` `features` `sections` `cta` `spinner` `closeButton` `codeDemo` `buttonGroup` `accordion` `carousel` `modal` `toast` `dropdown` `formSwitch` `skeleton` `avatar` `statCard` `tooltip` `popover` `searchInput` `range` `mediaObject` `fileUpload` `timeline` `stepper` `chipInput` `barChart` |

There are also 24 `generate*Themed()` functions needing the same split.

### Checklist

- [ ] Rule on the contested six: are `buttons` / `forms` / `tables` /
      `navigation` core primitives or BCCL components? A plain `<button>` in a
      hand-written page arguably deserves styling with no BCCL present
- [ ] Split `structuralRules` and the 24 themed generators along that line
- [ ] Choose the gating mechanism: build-time (the lean bundle omits the rules)
      or runtime (`loadStyles` checks whether BCCL registered). Only build-time
      actually shrinks the payload
- [ ] Re-measure lean CSS after the split. Target: 14.0KB gz down toward
      7-8KB gz
- [ ] Update the bundle-size gate and `dist/builds.json` expectations

### Affected

- `src/bitwrench-styles.js`, `src/bitwrench-esm-entry.js`, `rollup.config.js`
- `tools/release.js` bundle budget gate, `dist/builds.json`
- **No class names change.** Non-breaking, and this is where the user-visible
  win is.

---

## 6. Prior sequencing proposal (not signed off)

An exploratory pass suggested: 2.1.7 = ship current branch only; 2.2 = D1+D3
non-breaking; 3.0 = D2 rename. That assumed dual-emit / soft breaks and a
large installed base. **With ~8 stars and a pending marketing push, that
conservatism may be the wrong default** — see §9–§11.

---

## 7. Prior open questions (still useful)

1. BCCL utilities: derive from tokens vs duplicate as `bw_bccl_*`?
2. Is `bw_container` core (BCCL may use) or BCCL-owned?
3. Contested six: `buttons` / `cards` / `forms` / `formChecks` / `navigation` /
   `tables` — core primitives or BCCL?
4. Rename outright vs dual-emit?
5. Casing: `bw_bccl_listGroup` vs `bw_bccl_list_group`?

---

## 8. How the measurements were taken

For anyone re-checking these numbers later:

- Class inventory: `bw.loadStyles({primary:'#2563eb'})` under jsdom, then scan
  every injected `<style>` for `\.bw_[a-z0-9_]+`
- BCCL emissions: scan `src/bitwrench-bccl.js` for `class:` string literals and
  extract `bw_` tokens
- Lean comparison: import `dist/bitwrench-lean.esm.js` and repeat the class
  inventory; confirm `bw.makeCard === undefined`
- Blast radius: `grep -rl <class> pages/ docs/ examples/ blog/ readme.html`

---

## 9. Product shape: what “core” should mean (discussion)

### 9.1 Today’s naming is inverted for the story you want

| Artifact today | What it actually is | What the name implies |
|---|---|---|
| `bitwrench*.js` (default / “full”) | core + BCCL factories + BCCL CSS fused | “the library” |
| `bitwrench-lean*.js` | core JS, but **still ships ~47% BCCL CSS** | “core without components” |

So “lean” is already a half-truth (JS lean, CSS fat), and the default CDN
script teaches newcomers that batteries-included *is* bitwrench. For an
embedded-first campaign that is the wrong default: MCU flash budgets care
about the small honest core.

### 9.2 Proposed product model (names TBD)

Think in **two products that compose**, not “full minus features”:

1. **Core** — TACO, DOM/html/mount lifecycle, palette + layout tokens,
   utility/reset CSS, bwserve client hooks as appropriate.  
   **This should be what `bitwrench.js` means.**  
   Roughly: today’s lean *intent*, after D3 (no BCCL stylesheet).

2. **Batteries / UI kit** — BCCL factories + BCCL-owned CSS, optionally
   code-edit, etc.  
   Loaded as a second script/import *or* shipped as a convenience bundle
   that concatenates core+BCCL for demos.  
   Name candidates (undecided): `bitwrench-all`, `bitwrench-ui`,
   `bitwrench-bccl` (already exists as a partial), `bitwrench-full`.

Important: **`bitwrench-bccl` today is factories-only** (expects core already
present). A “batteries” bundle is a different packaging choice: one file for
CDN demos vs two files for embedded.

### 9.3 Release terminology (semver vs product)

Easy to mix these up:

| Term | Means |
|---|---|
| **Semver (2.1.7 / 2.2 / 3.0)** | Compatibility promise for *APIs and public class names* |
| **Build / SKU** (`bitwrench` vs `bitwrench-lean` vs future `*-all`) | Which code+CSS is in the file |
| **Layer** (core vs BCCL) | Architectural ownership of JS + CSS |

Flipping the default SKU (`bitwrench.js` = core) **is** a breaking packaging
change for anyone who `script src`’s the default UMD and expects `makeCard`.
With 8 stars that is probably acceptable **if** the README/CDN snippet and
embedded tutorials are updated in the same breath — and if you pick a clear
migration: either bump major, or keep `bitwrench.js` as batteries for one
minor while introducing `bitwrench-core.js` and flipping at 3.0.

**Recommendation:** don’t half-flip. Either:

- **A (clean break, prefer now):** next notable release makes
  `bitwrench.js` = core; `bitwrench-ui.js` / `bitwrench-all.js` = core+BCCL;
  drop or deprecate `-lean` as a name (lean *is* the default). Semver **3.0**
  even if the JS API barely changed — packaging *is* the contract for UMD users.

- **B (softer):** introduce `bitwrench-core.js` now (= honest lean); keep
  `bitwrench.js` = batteries through the marketing launch; rename/flip when
  you’re ready. Slightly more docs debt, less “my CDN link broke.”

For embedded marketing, **A matches the story** (“bitwrench is small; add UI
when you want it”). For “copy this script tag and see a card,” **B is kinder**.
You can still *teach* core-first under B by making every embedded example load
core (+ optional BCCL).

---

## 10. Right way to do the CSS cleanup (given early stage)

The D1/D2/D3 taxonomy is still the right *technical* map. What changes is
**how aggressively you break**.

### 10.1 Principle

Before the campaign: optimize for **one coherent mental model**, not for
dual-emit compatibility. After the campaign: freeze the model hard.

Mental model to lock:

```
core owns:     TACO, lifecycle, palette/layout tokens, reset, utilities
BCCL owns:     make* factories + bw_bccl_* (all of its chrome CSS)
composition:   BCCL may read tokens; it must not emit core utility class
               names as its public surface (or if it does, that is an
               explicit allowlisted “layout primitive” API)
lean/default:  must not inject BCCL CSS
```

### 10.2 Recommended technical choices (debate, not signed off)

| # | Question | Lean toward |
|---|---|---|
| 1 | BCCL spacing/type | **Tokens** (`styles.layout` / palette) baked into BCCL rules or BCCL-private classes — not a second utility grid |
| 2 | `bw_container` | **Core layout primitive**; BCCL uses `bw_bccl_*` for its own chrome. Drop long-term grouped selectors |
| 3 | Contested six | **BCCL**, with core reset making naked `<button>`/`<table>` merely sane — not “Bootstrap without BCCL” |
| 4 | Rename D2 | **Rename outright** (or very short dual-emit ≤1 minor). Dual-emit-for-a-year is for libraries with real dependents |
| 5 | Casing | **snake_case everywhere public** (`bw_bccl_list_group`) |

### 10.3 Sequencing that matches marketing

Not “2.1.7 empty / 2.2 soft / 3.0 someday.” More like one intentional break:

| Phase | Scope | Why |
|---|---|---|
| **Now (2.1.7 branch)** | Finish embedded/examples consistency; **do not** start D1–D3 mid-flight unless you want to slip the campaign | Keep the release train predictable |
| **Next “model lock” release (likely 3.0, or a bold 2.2 if you reject major)** | D1 + D3 + D2 together (or D1+D3 then D2 in the same major train) + **SKU honesty** (core default or `bitwrench-core` + deprecate lean name) | One migration story for the blog/post: “bitwrench core vs UI kit” |
| **After campaign** | Freeze class names and SKUs; only additive BCCL | Stars and copy-paste snippets become real dependents |

Doing D1+D3 without D2 leaves the `bw_list` / `bw_list_group` footgun and the
sandbox-style “stale class” class of bugs alive. Early stage argues for
**bundling the breaks** so marketing explains one model once.

### 10.4 What “breaking” means when you have 8 stars

Real break surface today:

- CDN / README default script expectations
- In-repo pages/examples/docs (you control these)
- A handful of external class references (blast radius in-repo was tiny)
- Anyone who already pinned `bitwrench@2.1.6` for embedded — **document a
  one-page upgrade**, don’t maintain shims for years

Fake break surface (don’t over-index):

- Dual-emitting every old class “just in case”
- Keeping lean’s BCCL CSS so gzip tables look continuous

---

## 11. Strawman end state (for argument)

**Files**

- `bitwrench.js` → core only (honest; no BCCL CSS/JS)
- `bitwrench-ui.js` (or `-all`) → core + BCCL, one tag for demos/dashboards
- `bitwrench-bccl.js` → optional addon if someone already loaded core
- retire `-lean` name (or alias lean → bitwrench for one release)

**CSS**

- Core stylesheet: reset, utilities, palette helpers
- BCCL stylesheet: only `bw_bccl_*` (and only loaded with BCCL)
- No BCCL factory emits bare `bw_mb_*` / `bw_text_*` unless allowlisted

**Docs story for embedded**

> Start with core. Serve one small JS file from flash. Add the UI kit when you
> want cards and modals.

**Docs story for web demos**

> Drop in `bitwrench-ui` and call `makeCard`.

---

## 12. Decisions the maintainer still needs to make

1. **SKU flip timing:** clean break (A) vs introduce `-core` and flip later (B)?
2. **Batteries name:** `-all` vs `-ui` vs keep “full” as today’s default filename?
3. **One major train vs soft minors** for D1/D2/D3?
4. Sign off or reject each row in §10.2.
5. Does the embedded campaign lead with **core-only** examples (forces A or
   careful B), or with **UI kit** demos (allows default to stay fat longer)?

Until those are marked decided, §§1–5 remain background research — not a
backlog to execute.

---

## 13. Styling contract: zero interference by default

Maintainer direction:

> TACO is a rendering format, not a mandatory visual theme. Loading core and
> calling `bw.DOM()` must not silently install a reset, global element styles,
> utility rules, or BCCL CSS. A user may bring all of their own CSS.

This separates three choices that are currently blurred:

| Developer action | Result |
|---|---|
| Load core; call `bw.DOM()` | Browser/author CSS only. TACO attributes pass through. No bitwrench CSS side effects. |
| Call `bw.loadReset()` | Opt into a small, documented normalization layer. (`cssReset` is not the current API name.) |
| Call `bw.loadStyles(config)` | Opt into bitwrench's core reset/utility/palette style layer. Classes only affect elements that explicitly carry those named classes; global reset/element selectors must be listed separately. |
| Load BCCL addon; call its style loader (API TBD) | Opt into BCCL component chrome. Factories always emit named `bw_bccl_*` hooks, but loading the factories must not itself inject CSS. |
| Load convenience full build | Core + BCCL code is available in one artifact; CSS still activates explicitly, not merely because the script was loaded. |

### 13.1 “Inject classes” vs “inject CSS”

These are different contracts and docs must say which one they mean:

- `bw.DOM()` does not invent classes for a hand-written TACO. It renders the
  `a.class` value supplied by the author.
- Core helpers/utilities may return TACOs with documented `bw_*` classes.
- BCCL factories return TACOs with documented `bw_bccl_*` classes.
- `loadReset` / `loadStyles` inject **rules**, not class attributes.
- A global reset or raw-element selector can affect unclassed author HTML;
  therefore it is opt-in and must be inventoried as global behavior.

### 13.2 Proposed explicit style layers

Conceptually:

```
none       browser + bring-your-own CSS; zero injected rules
reset      neutral normalization only
core       reset + core utilities + palette/layout rules
bccl       BCCL structural/themed rules, derived from the same tokens
full       core + bccl (convenience selection, not a new ownership layer)
```

The exact API is undecided. Two viable designs:

1. Separate calls: `loadReset()`, `loadStyles()`, `loadBCCLStyles()`.
2. Registered layers: BCCL registers a style layer and
   `loadStyles({ layers: ['reset', 'core', 'bccl'] })` selects explicitly.

Avoid an implicit rule where the same bare `loadStyles()` call changes scope
depending on which scripts happened to load first. Convenience is useful, but
predictability and BYOC isolation are more important.

### 13.3 Build naming implication

The clean end state is likely:

- `bitwrench.js` — core code, zero automatic CSS.
- `bitwrench-bccl.js` — BCCL addon for à-la-carte composition with core.
- `bitwrench-full.js` — core + BCCL convenience bundle.

Prefer `full` over `all`: “all” promises future router/debug/code-editor
addons too, while “full” can be precisely documented as core + standard BCCL.
Retire “lean” once core becomes the default; it describes an optimization
rather than an architectural boundary.

### 13.4 Semver consequence

Calling the architectural cleanup 2.2 is reasonable only if the existing
`bitwrench.js` default remains batteries-included and a new honest core build
is added. Changing `bitwrench.js` (or the package root export) from
core+BCCL to core-only removes `makeCard` et al. for existing consumers and is
a semver-major packaging break. A major number does not require a total
architecture rewrite; it means an existing supported usage no longer works.

Therefore the two honest options are:

- **2.2 bridge:** add an honest `bitwrench-core` artifact and split CSS, keep
  current default intact; teach core-first in embedded docs. Flip later.
- **3.0 model lock:** make `bitwrench` itself core, add `bitwrench-full`, clean
  the BCCL namespace in the same migration, and freeze this model before
  marketing creates a larger compatibility surface.

For the cleanest long-term developer experience, the 3.0 model lock is
cleaner. For the least disruption to current CDN snippets, the 2.2 bridge is
cleaner. The star count affects migration cost, but not what semver means.
