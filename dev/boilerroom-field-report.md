# Boilerroom field report — bitwrench/bwserve in production

Field report from building Boilerroom, a multi-perspective AI document review
app (~5,500 LOC) on bitwrench/bwserve. 5 tabs, 31 AI panelists, 3 AI
backends, 12 SQLite tables, SSE real-time streaming. Built over ~3 days.

This is an honest assessment: what worked, what's genuinely missing, and —
critically — what appeared to be missing but was actually developer habit
colliding with undocumented capabilities.

---

## Executive summary

Bitwrench is a capable framework with strong core documentation. The
"Thinking in Bitwrench" guide covers the mental model, JS-first styling
(`bw.s()`, `bw.css()`, function-valued attributes, `bw.loadStyles()`),
component levels, and composition patterns well.

The gap is **bwserve-specific**. "Thinking in Bitwrench" is written for
client-side bitwrench (the primary mode). Section 7 (bwserve) covers 8 of
~13 `BwServeClient` methods and doesn't show the patterns needed for
server-driven apps — `client.mount()`, `client.message()`,
`inspect/screenshot`, `sendAction()`. A developer building a bwserve app
gets the conceptual foundation but hits a wall when they need the
server-side API.

Important context: bitwrench runs in three modes — pure client-side (no
server needed), shim/loader (bare page that fetches TACOs statically or
dynamically), and bwserve (server pushes TACOs over SSE). This report
covers the bwserve mode. The client-side docs are not the problem.

The genuine API gaps are minor (4 items). The bwserve documentation gap is
what caused most of the friction in this project.

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

## The bwserve documentation gap

### What's already well-documented (credit where due)

The "Thinking in Bitwrench" guide covers the core mental model effectively:

- **Section 2 (Styling)** — JS-first styling, `bw.s()`, `bw.css()`,
  `bw.responsive()`, `bw.loadStyles()`, function-as-style-value, `bw.u()`
  utility shorthand. All the patterns needed.
- **Section 3** — Function-valued attributes with both timing modes (IIFE
  vs plain function), clearly explained with examples.
- **Section 5** — Level 0/1/2 component model, when to use which.
- **Section 6** — Handles, slots, pub/sub.
- **Framework translation table** — Strong teaching tool for developers
  coming from React/Vue/Svelte.

A developer who reads the full guide before starting would have the right
mental model. The styling patterns, composition approaches, and component
levels are all there.

### What happened anyway

Despite the docs existing, a developer building a bwserve app:

1. **Wrote 3,019 lines of CSS** instead of using the JS-first styling
   patterns documented in Section 2. The styling section is thorough but
   written for client-side bitwrench. A bwserve developer building TACO on
   the server side might skip to Section 7 and never read Section 2,
   assuming styling is a separate concern.

2. **Never found `client.mount()`** — Section 7 shows `render`, `patch`,
   `append`, `remove`, `on`, `register`, `call`, `batch` — 8 methods. It
   does NOT show `mount`, `message`, `inspect`, or `screenshot`. These 5
   missing methods are arguably the most important for real bwserve apps.

3. **Wrote custom Enter key handlers** — bwclient.js built-in behavior.
   Not documented in "Thinking in Bitwrench" or (apparently) in the bwserve
   tutorial. Discovered by reading source.

4. **Couldn't find `sendAction()`** — The programmatic client→server path.
   Not in Section 7 or the bwserve tutorial.

5. **Didn't know `allowScreenshot: true` was needed** — Assumed screenshots
   were broken. The flag and its requirement aren't surfaced in the guide.

### The pattern

Items 1 is a developer-habit problem — the docs exist, the developer didn't
read them (or read the wrong section). Items 2-5 are genuine bwserve doc
gaps — the information isn't in the guide at all.

### What would fix it

**Expand Section 7 of "Thinking in Bitwrench"** or create a companion
**"Thinking in bwserve"** that covers the full server-driven API:

1. **Complete `BwServeClient` method reference.** All ~13 methods:
   `render`, `patch`, `append`, `remove`, `exec`, `call`, `register`,
   `message`, `mount`, `inspect`, `screenshot`, `query`, `listen`.
   Currently 8 of 13 are documented.

2. **`client.mount()` front and center.** Show it for interactive components
   before showing `client.register()`. Most bwserve developers will need
   mount-a-component before register-a-utility.

3. **Built-in bwclient.js behaviors.** List everything the thin client
   already does automatically:
   - Enter key handling on inputs (algorithm: find nearest `data-bw-action`)
   - `inputValue` resolution (algorithm: `el.closest("div").querySelector("input")`)
   - Action delegation via `data-bw-action`
   - What `data-bw-id` provides
   - `allowScreenshot` flag requirement

4. **Client-to-server communication.** Document `bw._bwClient.sendAction()`
   prominently (or expose it as `bw.sendAction()`). This is the primary
   programmatic client→server path and it's currently hidden behind an
   underscore-prefixed internal object.

5. **Cross-reference to styling.** A bwserve developer building TACO on the
   server will naturally construct `a: { class: '...' }` and write a CSS
   file. A note in Section 7 pointing back to Section 2 ("your TACO styles
   are JS strings — compose them from dictionaries, not CSS classes") would
   intercept this habit at the right moment.

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

### What appeared broken but wasn't (another discoverability issue)

- **`client.screenshot()` works — but requires `allowScreenshot: true` in
  server options.** html2canvas IS vendored in bitwrench
  (`src/vendor/html2canvas.min.js`, 193KB) and IS served via an allowlisted
  route. The flag defaults to `false` as a security gate. Without it,
  screenshots silently fail. This was initially reported as "html2canvas not
  bundled" — it was actually the missing server flag.

  This is another instance of the discoverability problem: a working feature
  that appears broken because the required configuration isn't surfaced.

  **Suggestion:** When `allowScreenshot` is false and a screenshot is
  attempted, the rejection message should say:
  `"Screenshot not enabled. Set allowScreenshot: true in bwserve.create() options."`
  (It may already say this — if so, it wasn't visible enough in the error
  chain to diagnose.)

### What would still help

1. Computed style queries — `client.inspect(selector, { computedStyles: ['display', 'background'] })` for programmatic CSS debugging without a full screenshot
2. Layout queries — bounding rect of elements for verifying flex layout
3. Document the `inspect()` + `screenshot()` combo as a first-class LLM development loop in the bwserve guide — this is a differentiating capability that no other framework offers as cleanly

---

## Conclusion

Bitwrench has the right architecture and better core documentation than
initially credited. The "Thinking in Bitwrench" guide effectively teaches
the mental model, JS-first styling, component composition, and client-side
patterns. The framework runs in multiple modes (pure client, shim/loader,
bwserve) and the client-side docs are solid.

The gap is specifically in **bwserve documentation**. Section 7 of "Thinking
in Bitwrench" covers the concept but not the full API. A developer building
a server-driven app needs `client.mount()`, `client.message()`,
`inspect/screenshot`, `sendAction()`, and bwclient.js built-in behaviors —
none of which are in the current guide. Expanding Section 7 (or creating a
companion "Thinking in bwserve" guide) with the complete API and
cross-references to the styling section would close the gap.

The genuine API issues (sendAction naming, multi-field forms, modal
primitive, register string bodies) are minor and well-defined. The framework
itself is sound and — given proper bwserve documentation — ready to be a
serious contender.
