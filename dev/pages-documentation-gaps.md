# Pages Documentation Gaps — Full Audit

Audited all 22 files in `pages/`. Date: 2026-03-12.

---

## Page-by-page assessment

### Scoring key

- **Philosophy**: Does the page explain *why* bitwrench works this way?
- **TACO-as-computation**: Does it teach functions in attrs/content, IIFEs, .map(), composition?
- **CSS-as-strings**: Does it teach JS variables for CSS, Object.assign, functions that return styles?
- **Three-level model**: Does it mention Level 0 (data) / Level 1 (DOM) / Level 2 (component)?
- Scale: ❌ absent, ⚠️ partial/implicit, ✅ present, ✅✅ exemplary

| # | Page | Philosophy | Computation | CSS-strings | 3-Level | Notes |
|---|------|:---:|:---:|:---:|:---:|-------|
| — | **index.html** | ✅ | ⚠️ | ✅ | ⚠️ | Good hero/thesis. Uses `bw.css()`. Has raw DOM in modal handler (`document.querySelector`). No computation teaching. |
| 00 | **quick-start** | ✅ | ⚠️ | ⚠️ | ⚠️ | Strong onboarding. Teaches `.map()` and closure+render. Template binding `${count}` introduced but not explained. CSS section shallow. Levels implicit. |
| 01 | **components** | ❌ | ⚠️ | ⚠️ | ⚠️ | API showcase (25+ components). No "why". Shows nesting but not functions-in-attrs. Raw DOM in modal/toast handlers. Very long (1170 lines). |
| 02 | **tables-forms** | ⚠️ | ✅ | ⚠️ | ⚠️ | Good `col.render` cell transforms. Interactive table with closure state. CSS limited. 1487 lines. |
| 02 | **tables** (split) | ❌ | ✅ | ⚠️ | ⚠️ | Duplicates content from tables-forms. Unclear if kept intentionally. |
| 02 | **forms** (split) | ❌ | ⚠️ | ⚠️ | ⚠️ | Subset of tables-forms. Less comprehensive. |
| 03 | **styling** | ✅✅ | ✅ | ✅✅ | ⚠️ | **Best CSS page.** Teaches all 3 strategies (inline, generated, external). `bw.css()`, `bw.responsive()`, theme palette. Missing: Object.assign composition, functions returning style objects. |
| 04 | **dashboard** | ⚠️ | ✅ | ✅ | ⚠️ | Full app demo. Large `bw.css()` block. `.map()` for data. No philosophy intro. Very complex (691 lines). Mock interactions. |
| 05 | **state** | ✅✅ | ✅ | ⚠️ | ✅✅ | **Best state page.** Explicit Level 0/1/2 decision table. Template bindings. `o.render`, `bw.component()`, `bw.patch()`. CSS is just `var(--bw_*)` lookups, no computed CSS teaching. |
| 06 | **clock** | ❌ | ⚠️ | ✅✅ | ❌ | Beautiful showcase. Excellent CSS (`@keyframes`, responsive, pseudo-classes). No pedagogical intro. No levels. |
| 06 | **tic-tac-toe** | ✅✅ | ✅✅ | ⚠️ | ⚠️ | **Best tutorial.** Gold standard for TACO computation: `.map()`, `.slice()`, conditionals, immutable state. Pub/sub in Step 5. Doesn't use `bw.component()`. Levels implicit. |
| 07 | **framework-comparison** | ✅ | ⚠️ | ⚠️ | ❌ | Side-by-side code (React/Vue/Svelte/Bootstrap/Solid). Strong framing. But `bw.component()` absent entirely. Uses `arguments.callee._last` (fragile). No levels. |
| 08 | **api-reference** | ❌ | N/A | N/A | ❌ | Reference page. Clean, searchable. No cross-links to examples. Isolated. |
| 09 | **builds** | ❌ | ⚠️ | ❌ | ⚠️ | Operational page. Format/size tables, CDN, SRI. Hardcoded CSS, no `bw.css()`. |
| 10 | **themes** | ✅ | ⚠️ | ✅ | ✅ | Strong palette theory. Live generator. Multi-theme scoping. Missing: `o.render` pattern (rebuilds everything on change). |
| 11 | **code-editor** | ❌ | ❌ | ❌ | ⚠️ | Pure API reference for `bw.highlight()`/`bw.codeEditor()`. No philosophy. No interactive editing demo. |
| 11 | **debugging** | ✅✅ | ✅ | ✅ | ✅✅ | **Strongest philosophy page.** Defines 3-level model explicitly. Win32 `SendMessage` analogy for `bw.message()`. `o.methods` pattern. |
| 12 | **bwserve-protocol** | ✅ | ⚠️ | ❌ | ⚠️ | Comprehensive protocol spec. 9 message types, multi-language examples (C/Python/Rust). Missing: when NOT to use bwserve. |
| — | **bwserve-sandbox** | ❌ | ✅ | ❌ | ⚠️ | Interactive editor+preview. 6 presets. Good for exploration. No teaching narrative. |
| — | **state-debug** | ✅ | ✅✅ | ❌ | ✅✅ | Validates state architecture. Counter cards, dynamic lists, pub/sub. 404 lines of inline `<style>` — doesn't use `bw.css()` at all. 1546 lines total. |
| — | **self-load-test** | ❌ | ⚠️ | ❌ | ❌ | Performance/health dashboard. Not educational. |
| — | **src-sizes** | ❌ | ⚠️ | ❌ | ❌ | Build metrics. Canvas charts with raw DOM. Not educational. |

---

## Structural issues

### 1. Numbering gaps and duplicates
- **02-tables.html** and **02-forms.html** duplicate content from **02-tables-forms.html**. Decision needed: keep merged version only, or keep split versions and delete merged.
- **11-code-editor.html** and **11-debugging.html** share the `11-` prefix. One should be renumbered.
- No page `13-*` or beyond. Gap after `12-bwserve-protocol`.

### 2. No learning path
Pages don't reference each other. A newcomer has no idea that:
- 00 → 01 → 03 → 05 is the conceptual path
- 06-tic-tac-toe is the best hands-on tutorial
- 11-debugging defines the three-level model
- 07-framework-comparison should come after proficiency, not before

### 3. Raw DOM violations
Multiple pages use `document.querySelector()`, `document.getElementById()`, `appendChild()`, `innerHTML` — violating bitwrench's own rules. Pages affected:
- **index.html**: modal handler
- **01-components**: modal, toast
- **state-debug**: tab switching
- **src-sizes**: canvas drawing

### 4. CSS dogfooding gaps
Several pages have large inline `<style>` blocks instead of using `bw.css()`:
- **state-debug**: 404 lines of raw CSS
- **09-builds**: hardcoded hex colors
- **src-sizes**: inline styles
- **self-load-test**: relies on bitwrench.css defaults without showing generation

---

## The four teaching gaps (cross-cutting)

### Gap 1: "TACO is computation" — taught in 2/22 pages
Only **06-tic-tac-toe** (exemplary) and **05-state** (good) teach this. Every other page uses TACO as a static format. Missing across the board:
- Functions as attribute values
- IIFEs for compile-time vs instantiation-time
- Factory functions as "components"
- Composition via arrays, Object.assign, filter(Boolean)

**Recommendation**: This should be in a foundational doc (Thinking in Bitwrench) and then reinforced with callouts on pages 00, 01, 03, 04.

### Gap 2: "CSS is just strings" — taught in 1/22 pages
Only **03-styling** teaches this well. The insight that CSS values are JS variables you can reuse, compose, and compute is absent everywhere else. Even pages that use `bw.css()` heavily (04-dashboard, 10-themes, 06-clock) treat it as a convenience API, not as the expression of a core idea.

Missing patterns (not shown on any page):
- `Object.assign({}, baseStyles, overrides)` for CSS composition
- Functions that return style objects (Sass mixin equivalent)
- Theme palette values used in custom `bw.css()` rules
- Ternary/conditional CSS in inline styles

**Recommendation**: Add a "CSS composition" section to 03-styling. Reference it from 04-dashboard and 10-themes.

### Gap 3: Three-level model — taught in 2/22 pages
Only **05-state** and **11-debugging** explicitly teach Levels 0/1/2. The model is the single most important conceptual framework for using bitwrench correctly, and it's buried in two pages deep in the navigation.

Most pages use Level 1 without saying so. The tic-tac-toe tutorial uses Level 1 throughout but never labels it. The framework comparison doesn't mention levels at all — making bitwrench look like "just another way to write DOM" rather than a system with intentional design choices at each tier.

**Recommendation**: Add a one-line callout to every page: "This demo uses Level X. See [State Management](05-state.html) for all three levels."

### Gap 4: `bw.component()` — undersold across the site
`bw.component()` with `.set()`/`.get()` is the recommended Level 2 pattern, but:
- **06-tic-tac-toe** doesn't use it (uses `o.render` + `bw.update()`)
- **07-framework-comparison** doesn't show it at all
- **06-clock** uses `o.render` throughout
- **04-dashboard** uses closure+render pattern

A newcomer could read 5-6 pages and never see `bw.component()`. When they finally encounter it in 05-state, it feels like an afterthought rather than the recommended path.

**Recommendation**: Show `bw.component()` as the primary pattern in 00-quick-start. Use it in at least one comparison in 07-framework-comparison.

---

## Recommended page restructure

### Current order (as linked from index.html)
```
00-quick-start → 01-components → 02-tables-forms → 03-styling →
04-dashboard → 05-state → 06-clock → 06-tic-tac-toe →
07-framework-comparison → 08-api-reference → 09-builds →
10-themes → 11-code-editor → 11-debugging → 12-bwserve-protocol
```

### Proposed order (learning path)
```
00 Quick Start (keep — add bw.component() example)
01 Components (keep — add BCCL-returns-TACO callout)
02 Tables & Forms (keep merged version, delete split pages)
03 Styling & CSS (keep — add Object.assign/function composition section)
04 Dashboard (keep — add "this uses Level 1" label)
05 State Management (keep — it's strong, reorder sections: 1b before 1)
06 Tutorials: Clock + Tic-Tac-Toe (keep — add Level labels)
07 Framework Comparison (fix: add bw.component(), remove arguments.callee hack)
08 API Reference (keep — add cross-links to example pages)
09 Builds & Installation (keep — operational)
10 Themes (keep — good)
11 Debugging & Inspection (keep — rename to avoid 11- collision with code-editor)
12 bwserve Protocol (keep)
13 bwserve Sandbox (promote from unnumbered)
```

### Pages to consider removing or demoting
- **02-tables.html** / **02-forms.html**: Duplicates. Delete or redirect.
- **self-load-test.html**: Internal QA. Move to `test/` or `tools/`.
- **src-sizes.html**: Internal metrics. Move to `tools/` or `dbg/`.
- **state-debug.html**: Testing/validation page. Keep but mark as "developer internals."
- **11-code-editor.html**: Thin content. Could merge into API reference or make it a section of a "Tools" page.

---

## Priority actions

1. **Write "Thinking in Bitwrench"** doc (outline exists at `dev/thinking-in-bitwrench-outline.md`). This becomes the foundational reference that all pages link back to.

2. **Add Level labels** to every page — one line, links to 05-state.

3. **Fix raw DOM violations** in index.html, 01-components, state-debug.

4. **Add CSS composition section** to 03-styling (Object.assign, functions, palette values).

5. **Show `bw.component()`** in 00-quick-start and 07-framework-comparison.

6. **Delete duplicate pages** (02-tables.html, 02-forms.html).

7. **Move internal pages** (self-load-test, src-sizes) out of pages/.

8. **Add learning path** to index.html sidebar or a dedicated "Getting Started" guide.

9. **Convert state-debug CSS** to `bw.css()` — it's the most visible dogfooding failure.

10. **Cross-link API reference** entries to example pages.
