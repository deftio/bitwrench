# Boilerroom field report — bitwrench/bwserve in production

Field report from building Boilerroom, a multi-perspective AI document review
app (~5,500 LOC) on bitwrench/bwserve. 5 tabs, 31 AI panelists, 3 AI
backends, 12 SQLite tables, SSE real-time streaming. Built over ~3 days.

This is an honest assessment: what worked, what's genuinely missing, and —
critically — what appeared to be missing but was actually developer habit
colliding with undocumented capabilities.

---

## Executive summary

Bitwrench is a better framework than it appears to be. The capabilities are
ahead of the documentation. A developer using bitwrench today will underuse
it significantly — reaching for CSS classes instead of JS composition,
hand-coding things that are built in, missing APIs that exist — not because
the framework is lacking, but because nothing guides them toward the right
patterns.

The single biggest issue is discoverability/documentation. The genuine API
gaps are minor (4 items). The documentation gap is the one that determines
whether bitwrench gets adopted or dismissed.

---

## What works well (no changes needed)

These are strong and correct:

- **TACO model** — Composable, serializable, correct. Structure composition
  works exactly as intended.
- **SSE transport** — Solid. Handles 5+ parallel AI streams pushing into the
  feed simultaneously. No reconnection issues.
- **`data-bw-action` declarative binding** — Clean, scales to 20+ actions
  without issues. No listener wiring, no event delegation boilerplate.
- **Component model (Level 0-2)** — Right levels of abstraction. Level 0 for
  static pushes, Level 2 for stateful client widgets, clear upgrade path.
- **`client.render/patch/append/remove/mount/message/call`** — Good API
  surface. Each verb does one thing well.
- **`o.state` + `o.render` + `bw.update(el)`** — Simple, correct reactivity.
  No magic, no dependency tracking, no stale closures.
- **`o.handle`** — Clean imperative API for components.
  `el.bw.setPanelists(list)` reads like a real API.
- **BCCL** — 50+ factories, behavioral composition works.
- **`bw.loadStyles()` theming** — Full design system from 2 seed colors.

---

## The discoverability problem (THE issue)

### What happened

A competent developer built a full production app on bitwrench and:

1. **Never found `client.mount()`** — Used `client.register()` with
   string bodies to mount components. `client.mount()` exists
   (client.js:254), does exactly what was needed, and returns a promise.
   Discovered only by reading source code.

2. **Wrote custom Enter key handlers** — Built `brInitChatInput` and
   `brInitBoilerroomInput` as registered functions with keydown listeners.
   bwclient.js already handles Enter on inputs by finding the nearest
   `data-bw-action` button. The custom handlers were completely redundant.

3. **Wrote 3,019 lines of CSS** — Created 13 separate button classes, 6 card
   variants, 3 copies of markdown body styling. The TACO model already
   supports JS-first styling via composable style strings in `a.style`, plus
   function-valued attributes for runtime/hydration-time styling. None of
   this was discovered during development.

4. **Never used function-valued TACO attributes** — Functions in `a.style`
   (plain function for hydration-time, IIFE for creation-time) enable
   dynamic per-element styling composed from shared JS dictionaries. Never
   reached for because it wasn't documented as a styling pattern.

5. **Never found `bw.s()` style helpers** — Exist, solve style composition
   on the fly. Not documented prominently.

6. **Never used `bw.loadStyles()`** — Full theming engine, generates CSS
   from seed colors. App hand-wrote 35 CSS variables instead.

7. **Couldn't find `sendAction()`** — Tried `bw.action()` (doesn't exist),
   eventually found `bw._bwClient.sendAction()` by reading bwclient.js
   source. The underscore prefix actively discouraged using it.

### Why this matters

Every developer who picks up bitwrench will make these same mistakes. The
path of least resistance follows web-development habits (CSS classes, manual
event handlers, separate stylesheets), and nothing in the documentation
redirects toward bitwrench's actual idioms.

This makes bitwrench look limited when it's actually capable. People will
evaluate it, hit friction, and conclude it can't do things it already does
well.

### What would fix it

**One document: "How to build a bwserve app"** — an opinionated guide that
leads with the right patterns from page one:

1. **JS-first styling as the primary approach.** Show the style dictionary
   pattern before mentioning CSS classes. Show function-valued attributes.
   Show `bw.s()`. Show `bw.loadStyles()`. Explicitly call out the
   anti-pattern of CSS-class-per-element.

   ```js
   // The right way: composable JS style tokens
   const S = {
     btn: 'padding:6px 14px;border:1px solid #ccc;font-size:12px;cursor:pointer',
     pill: 'border-radius:20px',
     accent: 'background:#4361ee;color:#fff;border-color:#4361ee',
   };
   { t: 'button', a: { style: `${S.btn};${S.pill};${S.accent}` }, c: 'Go' }

   // Function-valued for dynamic styling at hydration time
   { t: 'div', a: { style: ()=> isActive ? `${S.card};${S.active}` : S.card }, c: '...' }

   // IIFE for dynamic styling at creation time
   { t: 'div', a: { style: (()=> `${S.card};border-color:${color}`)() }, c: '...' }
   ```

2. **`client.mount()` front and center.** The bwserve tutorial should show
   `client.mount()` for interactive components before showing
   `client.register()`. Most developers will encounter mount-a-component
   before register-a-utility.

3. **Complete `BwServeClient` API reference.** Document ALL methods:
   `render`, `patch`, `append`, `remove`, `exec`, `call`, `register`,
   `message`, `mount`, `inspect`, `screenshot`, `query`, `listen`. Currently
   docs show 8 of ~13 methods.

4. **Built-in behaviors page.** List everything bwclient.js already does:
   - Enter key handling on inputs (algorithm documented)
   - `inputValue` resolution (algorithm documented)
   - Action delegation via `data-bw-action`
   - What `data-bw-id` provides

5. **Client-to-server communication.** Document `bw._bwClient.sendAction()`
   prominently (or expose it as `bw.sendAction()`). This is the primary
   programmatic client→server path and it's currently hidden behind an
   underscore-prefixed internal object.

---

## Genuine API gaps (4 items)

These are real missing features, not documentation issues:

### 1. `bw._bwClient.sendAction()` naming

The primary client→server programmatic path looks like a private API. The
underscore prefix actively discourages its use. Should be promoted to
`bw.sendAction(name, data)` or `bw.action(name, data)` on the main `bw`
object.

### 2. Multi-field form collection

`data-bw-action` resolves one `inputValue` from the nearest sibling input.
Any form with 2+ fields requires a `client.exec()` workaround:

```js
// Current workaround — ugly
client.exec(`
  var name = document.getElementById("field-name").value;
  var genre = document.getElementById("field-genre").value;
  var persona = document.getElementById("field-persona").value;
  bw._bwClient.sendAction("save-panelist", { name, genre, persona });
`);
```

**Suggestion:** `data-bw-form="selector"` attribute on action buttons that
serializes all inputs/selects/textareas in the target container as a
key-value object (keyed by `name` attribute), sent alongside the action.

### 3. No modal/dialog primitive

Every app needs modals (confirmations, forms, alerts). Current pattern:

```js
client.append('body', overlayTaco);
// ... later ...
client.remove('#modal-overlay-id');
```

Works but is boilerplate every app will write. A `client.modal(taco, opts)`
or BCCL `makeModal({ title, body, actions })` would cover 90% of cases.

### 4. `client.register()` string bodies

`client.mount()` solves component mounting. But small utility functions
(disable/enable helpers, scroll-to-bottom, form collection) still need
`client.register()` with JS-as-a-string:

```js
client.register('scrollToBottom', `function(id) {
  var el = document.getElementById(id);
  if (el) el.scrollTop = el.scrollHeight;
}`);
```

No syntax highlighting, no linting, errors only surface at runtime in the
browser console. The mitigation is putting logic in a client-side `app.js`
file instead, but this isn't obvious to new users.

**Suggestion:** Document the `app.js` pattern as the recommended approach
for client-side utilities. Or: allow `client.register()` to accept a
function reference (serialized via `.toString()`) instead of requiring a
hand-written string.

---

## LLM-driven development feedback

Boilerroom was built with AI assistance (Claude) using bwserve's
`client.inspect()` and `client.screenshot()` for closed-loop development.

### What worked

- **`client.inspect(selector, { depth })`** — Useful for verifying structure
  without opening a browser. Confirmed component mounting, element presence,
  DOM structure.
- **Parameterized selectors** (`?selector=%23br-tab-body`) — Essential for
  deep nesting. Body-level inspection cuts off too early.

### What didn't work

- **`client.screenshot()`** requires html2canvas served from
  `/bw/lib/vendor/`. Not bundled in the npm package. Screenshots fail.
- **Inspect shows structure but not appearance.** Can verify `.br-header`
  exists, but can't see if spacing/colors/layout are correct. CSS changes
  are untestable without visual feedback.

### What would help

1. Screenshot without html2canvas dependency (native browser API or bundled)
2. Computed style queries — `client.inspect(selector, { computedStyles: ['display', 'background'] })`
3. Layout queries — bounding rect of elements for verifying flex layout

---

## Conclusion

Bitwrench has the right architecture. TACO is sound. The server-driven model
with SSE works. The component model is clean. JS-first styling with
function-valued attributes is the right approach.

The gap is between what bitwrench can do and what developers discover it can
do. Close that gap — with an opinionated guide, complete API reference, and
prominent examples of the JS-first patterns — and bitwrench becomes a
serious contender in the front-end space. The framework is ready; the
on-ramp isn't.
