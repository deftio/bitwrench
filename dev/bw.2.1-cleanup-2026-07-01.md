# bw 2.1 Cleanup — Source-vs-Spec Tensions

Captured 2026-07-01 during docs/examples consistency pass.
These require source-level changes and are NOT addressed in the doc fixes.

---

## 1. `bw.refresh()` event name — doc says `bw:statechange`, source emits `bw:refresh`

`bitwrench_api.md` line 403 says `bw.refresh()` "emits `bw:statechange`".
Source (`src/bitwrench.js` ~line 1981) emits `bw:refresh`.
`bw:statechange` is emitted by `bw.update()` only.

**Fix (doc):** Already corrected in this pass — doc now says `bw:refresh`.
**Decision needed:** Is the event name split (`bw:refresh` vs `bw:statechange`) intentional? If so, document the distinction. If not, unify on one event name.

## 2. `bw.render()` / `bw.getComponent()` / `bw.getAllComponents()` — parallel registry

`bitwrench_api.md` documents these as a component registry system (render at position, retrieve by id). They exist in source but are not mentioned in the v2.1 lifecycle spec (`create` → `mount` → `unmount`). Unclear whether they coexist with the lifecycle or are legacy holdovers.

**Decision needed:** Keep, deprecate, or remove? If kept, clarify relationship to `bw.mount()` / `bw.DOM()`.

## 3. `bw.DOM()` return value — doc says "target element", source says created root

`bitwrench_api.md` documents `bw.DOM()` as returning "the target element". Source line ~1900 aliases `bw.DOM = bw.mount`, and `bw.mount` returns the created root element (the child, not the container).

**Decision needed:** Is the return value the container or the created child? Clarify and align doc + source.

## 4. `cmake-demo/main.c` — `document.getElementById` in C string literals

The C source generates JavaScript with `document.getElementById` in string literals. This is intentional for the minimal-no-bitwrench demo. If bitwrench is ever bundled with the cmake demo, this should switch to `bw.apply()`. No action needed now.

## 5. `bw._el` in source JSDoc comment

`src/bitwrench.js` line ~3117 JSDoc for `bw.apply()` says "Otherwise → getElementById, then bw._el fallback". `bw._el` does not exist — the public API is `bw.el()`. The doc has been fixed; the source JSDoc comment should be updated to match.
