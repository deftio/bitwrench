# Bitwrench 2.1.x — CSS & Theming Cleanup (companion spec)

**Date**: 2026-06-09
**Status**: companion to `bitwrench-lifecycle-cleanup-2026-06-09.md` (§15
points here). Same release, same rules: breaking changes allowed, tests
are the contract.
**Verdict up front**: the theme *model* (seeds → derived palette →
generated rules → inject → toggle, alternate = luminance inversion, the
quikchat scoped-toggle pattern) **proofreads as sound** — same architecture
as quikchat, and it holds. The problems found are plumbing: a lossy
scope→id mapping, three small bugs, one doc-vs-code contradiction, and a
missing verb. All listed below.

---

## §0 Quick Card

```
DEFINE/CREATE   styles = bw.makeStyles(seeds)     pure: seeds → {css, rules,
                                                  palette, alternate*}
MOUNT           bw.applyStyles(styles, scope?)    inject <style>, scoped or global
COMPOUND        bw.loadStyles(seeds?, scope?)     structural + make + apply
LIVE OP         bw.setThemeMode(mode, scope?)     NEW — deterministic 'primary'|'alternate'
                bw.toggleThemeMode(scope?)        sugar over setThemeMode
UNMOUNT         bw.clearStyles(scope?)            remove <style> + theme class
UTILITIES       bw.css(rules) · bw.injectCSS(str) · bw.s(...) ·
                bw.responsive(sel, bp) · bw.scopeRulesUnder(rules, prefix) ·
                bw.u() (optional plugin)
```

Styles follow the same atomic/compound grammar as components. Names kept
(`makeStyles`/`applyStyles`/`loadStyles` per Manu — they already are
create/mount/compound). One new verb (`setThemeMode`), zero renames.

---

## 1. The Layer Model (make it explicit — it exists, undocumented)

Injected CSS is four ordered layers, each one `<style>` element:

| Layer | Style element id | Injected by | Content |
|---|---|---|---|
| 1 reset | `bw_style_reset` | `bw.loadReset()` | box-sizing, base font, reduced-motion |
| 2 structural | `bw_style_structural` (renamed from `bw_structural` — consistency) | `loadStyles` (once) | layout-only: flex/grid/spacing, no colors |
| 3 theme (global) | `bw_style_global` | `applyStyles(styles)` | themed rules + `.bw_theme_alt`-scoped alternate |
| 3' theme (scoped) | `bw_style_<slug>_<hash>` | `applyStyles(styles, scope)` | scope-prefixed rules + `scope.bw_theme_alt` alternate |
| 4 user | caller's id via `injectCSS(css, {id})` | user | anything |

**Ordering is part of the contract (new)**: bitwrench-owned layers are
inserted in layer order *regardless of call order* — `injectCSS` places a
bw layer element before any higher-layer bw element already in `<head>`.
Today the order is whatever the call order was; reset injected after a
theme silently changes specificity outcomes. Cheap fix, real determinism.

Scoped theming note (the quikchat pattern, verified): `applyStyles(s,
'#panel')` emits `#panel .bw_bccl_card` and `#panel.bw_theme_alt
.bw_bccl_card`; `setThemeMode('alternate', '#panel')` puts the class on
the panel root. Theme class on the component root, not `<html>` — each
scope owns its mode independently. This works today and is the model.

---

## 2. Proofread Findings (CSS-1 … CSS-8)

**CSS-1. `_scopeToStyleId` is lossy — collisions overwrite themes.**
`#dash` and `.dash` both map to `bw_style_dash`: the second
`applyStyles` silently replaces the first scope's CSS. `'#a .b'` maps to
an id containing a space (invalid HTML id). A scope class literally named
`.global` collides with the global layer. Fix: id = `bw_style_` + slug +
`_` + short hash of the *raw* scope string. Unique, stable, valid.

**CSS-2. `clearStyles` removes the theme class from `targets[0]` only**,
while `toggleThemeMode` correctly operates on ALL matching elements.
Clear a `.panel` scope with three panels → two panels keep a
`bw_theme_alt` class whose rules just vanished. Fix: all matches.

**CSS-3. `scopeRulesUnder` corrupts `@keyframes`.** The at-rule branch
prefixes every inner selector — correct for `@media`, wrong for
`@keyframes`, where the "selectors" are steps: `0%` becomes
`#scope 0%`, which is invalid CSS. Fix: `@keyframes` (and `@font-face`)
blocks pass through unprefixed; only `@media`/`@supports` recurse.

**CSS-4. The scoped alternate emits a dead `body` rule.** `makeStyles`
appends `body` overrides to `alternateRules`; under a scope this becomes
`#scope.bw_theme_alt body` — body is an *ancestor* of the scope, so the
rule can never match. Harmless but emitted on every scoped apply. Fix:
`applyStyles` drops the `body` key when scoping (a scoped theme should
not recolor the page body anyway; the scope root gets the surface
colors instead — add `#scope.bw_theme_alt` self-rule for background and
color so a scoped dark panel actually looks dark).

**CSS-5. Doc-vs-code contradiction on `loadStyles()` no-arg — RESOLVED
(Manu, 2026-06-09): the code is correct, the docs are wrong.**
`bw.loadStyles()` with no args injects structural CSS *plus the full
default theme* — deliberately. The design goal is a great out-of-box
experience with minimal effort: one call, complete pleasant page. Fix
CLAUDE.md and any doc repeating "structural only"; add
`bw.loadStructural()` for the explicit layout-only case. (Out-of-box
polish matters slightly less in the agent-coding era, but a human's
first 30 seconds with the library still decides whether there's a
second 30.)

**CSS-6. Structural CSS is unreachable by `clearStyles`** (its id is
outside the `_scopeToStyleId` namespace) and is injected **globally even
on a scoped `loadStyles`** — a scoped preview pane silently adds global
layout rules. First half: fix via the layer table ids +
`clearStyles('structural')`. Second half: document as intended
(structural is shared layout, one copy) — it is the right behavior, just
currently a surprise.

**CSS-7. No deterministic mode-set — toggle is the only control.**
`toggleThemeMode` on a mixed-state multi-element scope makes the states
*more* mixed (each flips independently), and a server/bwserve can never
say "go dark" idempotently — toggle twice = no-op. Fix:
**`bw.setThemeMode(mode, scope?)`** (`'primary' | 'alternate'`) as the
real verb; `toggleThemeMode` becomes sugar (reads first element, sets
all to the inverse). Wire-friendly: `{v:1, type:'message', …}` or a
`call` can now set dark mode idempotently.

**CSS-8. Mode events.** Theme mode changes are currently silent. Emit
`bw:thememode` (pub/sub mirror, `{mode, scope}`) so components that need
to redraw palette-derived inline values (charts, canvas) can react, and
bwattach observers see it. One line, consistent with `bw:lifecycle`.

---

## 3. Decisions

| Decision | Choice |
|---|---|
| Verb names | **Keep** `makeStyles` / `applyStyles` / `loadStyles` — they already are create/mount/compound. No churn for symmetry's sake. |
| New verb | `bw.setThemeMode(mode, scope?)`; toggle becomes sugar (CSS-7) |
| Scope→id | slug + hash (CSS-1) |
| Structural id | `bw_style_structural`; clearable; still global-once by design (CSS-6) |
| Layer ordering | deterministic insertion regardless of call order (§1) |
| `loadStyles()` no-arg | full default theme — code is correct, docs get fixed; + `bw.loadStructural()` (CSS-5, decided) |
| CSS custom properties | still none — palette values are JS; unchanged stance |
| RTL | logical properties pass over `bitwrench-styles.js` (lifecycle spec §7.2 rides here) |
| Contrast guarantee | AA check lives in `derivePalette` (warn via `bw:diag`); the marketing line comes free |
| `bw.u()` | stays an optional plugin; `bw.s()`/`bw.responsive()` documented as composition utilities of the one system, not parallel systems |
| Typed rules | `BwCssRules` / CSSProperties-style interface in `bitwrench.d.ts` → editor autocomplete inside `bw.css({...})` today; LSP later if traction (per Manu) |
| **CSP** (lifted from the Feb 2026 discussion doc — was designed, never specced) | `bw.config.cspNonce` — when set, every bitwrench-injected `<style>` (and `bw.htmlPage`'s function-registry `<script>`) carries the nonce. Strict-CSP deployments (enterprise/gov, no inline anything): write `bw.makeStyles(seeds).css` to a static `.css` file at build/deploy time and skip injection entirely — `makeStyles` being pure makes this a one-liner. Documented in `docs/security.md`. |

One paragraph on why CSP matters here specifically: bitwrench's two
signature moves — runtime style injection and the htmlPage handler
registry — are both *inline* content, which is exactly what strict CSP
blocks. A reviewer deploying behind `style-src 'self'` hits this in the
first hour. The nonce config plus the pure-`makeStyles`-to-file escape
hatch answers both, and the answer was already designed in Feb 2026 —
it just never made it into a spec until now.

## 4. Test Contract (adds to lifecycle spec §10)

- make/apply/load: `makeStyles` is pure (no DOM, call twice → deep-equal
  results); `applyStyles` same-scope reapply replaces (idempotent);
  distinct scopes coexist as distinct style elements
- CSS-1: `#dash` vs `.dash` scopes coexist; complex selector scopes
  produce valid ids; `.global` class scope does not clobber global
- CSS-2: clearStyles removes theme class from ALL matched elements
- CSS-3: scoping a rules object containing `@keyframes` leaves step
  selectors untouched; `@media` inner selectors get prefixed
- CSS-4: scoped apply emits no descendant-`body` rule; scope root gets
  self surface rule; scoped panel visually darkens (browser test)
- CSS-5: `loadStyles()` no-arg behavior matches the decided semantics;
  `loadStructural()` injects layer 2 only
- CSS-6: `clearStyles('structural')` works; scoped loadStyles injects
  structural once, globally (asserted + documented)
- CSS-7: `setThemeMode('alternate', '.panel')` is idempotent across
  mixed prior states; toggle = set(inverse of first); wire round-trip
  test (server sets dark deterministically)
- CSS-8: `bw:thememode` fires on pub/sub with `{mode, scope}`
- Layers: inject theme then reset → reset element still precedes theme
  element in `<head>`
- Contrast: a seed pair chosen to fail AA produces a `bw:diag` warning
- CSP: with `bw.config.cspNonce` set, every injected `<style>` and the
  htmlPage registry `<script>` carry the nonce; `makeStyles().css`
  written to file + linked statically renders identically to injection
- d.ts: type-level test that misspelled CSS property errors under TS

## 5. Out of Scope

- CSS variables mode, constructable stylesheets, CSS modules interop —
  philosophy unchanged, revisit never unless measured need
- LSP / syntax highlighting — community/traction project (typed rules
  objects cover the near term)
- Style-system plugin API beyond `bw.u.extend` — wait for a real request

---

*Companion: `bitwrench-lifecycle-cleanup-2026-06-09.md` (grammar, §15);
quikchat (github.com/deftio/quikchat) — prior art for the scoped theme
class pattern, which this spec confirms and keeps.*
