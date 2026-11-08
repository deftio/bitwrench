# Lean engine cuts -- the follow-on to the CSS split

Drafted 2026-11-07 on `feature/css-lean-split`, after the split landed at
29,941 bytes gzipped for `bitwrench-lean.umd.min.js` (final 2.1.14 number, after #124, #128 and #129). Not scheduled. This is
the plan the CSS split's "What this does not do" section deferred, and the
reference consumer is jazzmac (#108): it loads lean and calls six functions,
`mount`, `append`, `html`, `raw`, `css`, `injectCSS`. Its ask was a "core"
build of 20 to 30 KB minified. Lean is 86 KB minified / 29 KB gzipped today.

## Measured attribution

Minified bytes of `dist/bitwrench-lean.esm.min.js` (87,712 mapped), attributed
to the top-level definition each byte came from through the source map.
Pre-gzip; gzip shrinks CSS-like data more than code, so the styles rows
overstate their gzipped share. Script: a 60-line trace-mapping walk, rerun it
rather than trust these numbers after any change.

| Group | Minified bytes | Share |
|---|---|---|
| styles module (css engine + core sheet) | 20,253 | 23.1% |
| core factories (`makeTable`, `makeDataTable`, `makeTableFromArray`, `makeBarChart`) | 6,647 | 7.6% |
| wire client (`connect`, `apply`, `actions`, `registerRemote`, `parseJSONFlex`) | 5,115 | 5.8% |
| color utils | 5,114 | 5.8% |
| router | 3,563 | 4.1% |
| file I/O | 2,006 | 2.3% |
| cookies, URL params, log, lorem, intervals | 945 | 1.1% |

The ten largest single definitions:

| Definition | Bytes |
|---|---|
| `structuralRules` (core sheet: reset, typography, grid, tables, bar chart) | 6,711 |
| `generateUtilityRules` (spacing, display, flex, type, border, ... classes) | 6,152 |
| `bw.makeTable` | 4,609 |
| `bw.janitor` | 2,698 |
| `bw.htmlPage` | 2,615 |
| `initRouter` | 2,407 |
| `bw.jsonPatch` | 2,242 |
| `bw.html` | 2,131 |
| `bw.apply` | 2,029 |
| `bindFileOps` | 2,006 |

## What this says

- **The utility kit is the single largest removable block** that a
  bring-your-own-design page does not use. jazzmac wrote its own CSS and
  never emitted a `bw_p_4` or `bw_d_flex`. Moving `generateUtilityRules` to
  an installable sheet, the same `_installStyleSheet` mechanism the split
  introduced, is the next cut with no API change: `bw.loadStyles()` stays
  the one call, and the utility sheet rides with BCCL (every widget page
  uses utilities) or as its own tiny file.
- **The four core factories are 7.6%** and the split plan kept them in lean
  on purpose: a device, a script or a generated report wants a table. Keep
  that decision. A "core" that lacks `makeTable` is not what the plan called
  lean.
- **The wire client is 5.8%** and is the thing a jazzmac-shaped page never
  calls, but it is also what makes lean the right file for a microcontroller.
  Those are two different consumers, and one artifact cannot serve both at
  the minimum. That is the real question behind the `core` ask.
- `bw.janitor`, `bw.htmlPage` and `bw.jsonPatch` are 7.5 KB between them and
  none is on jazzmac's list. `htmlPage` is a Node/CLI concern. These are the
  cheapest individual moves after the utilities.

## Proposed shape

No new package, no rename (decided 2026-11-01). Two steps, each measured
against the 30 KB lean gate before and after:

1. **Utilities become a sheet.** `generateUtilityRules` leaves core for
   `bitwrench-util-styles.js`, installed by the full build at load and by the
   BCCL entry (a widget page always wants them). Lean's `loadStyles()` then
   emits the reset, typography, role colours, grid and tables only. Expected
   cut: 6 KB minified, roughly 1.5 to 2 KB gzipped. A page on lean that wants
   `bw_d_flex` loads the sheet file, one script tag.
2. **Node-only and server-only verbs leave lean.** `htmlPage`, `jsonPatch`,
   `janitor` and the file-ops binding move behind the same install pattern,
   present in the full build, absent from lean. Expected cut: 7 to 9 KB
   minified. Each needs a loader story before it moves: the CLI uses
   `htmlPage` and must import it explicitly.

Both steps leave the wire client in lean. A third artifact for the
browser-only, own-design page is the `core` ask proper; it is worth building
only if a second consumer appears, and it would be the full build minus BCCL,
utilities, wire, Node verbs, router: around 18 KB gzipped by these numbers.

## Not in this plan

Focus and scroll preservation across `bw.mount` of a structurally identical
tree (#108, item 3) is a behaviour question, not a size one. `syncChildren`
and `makeTable` each save and restore `document.activeElement` today. The
general form would be: before `mount` replaces a target's children, record
the focused element's id (or its path from the target) and its selection
range and the target's `scrollTop`; after mounting, restore what still
resolves. It is about 30 lines inside `_applyTo`, costs a mount nothing when
nothing inside had focus, and cannot preserve a drag in progress (the drag
belongs to the old node). Decide separately.
