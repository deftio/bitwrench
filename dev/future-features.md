# Future Features -- Landscape Comparison and Gap Analysis

Honest assessment of bitwrench vs the 2026 lightweight UI library landscape.
Not compared against React/Vue/Angular ecosystems (different category entirely).
Compared against: HTMX, Alpine.js, Lit, Preact, Solid, Svelte, Mithril, Van.js.

Written Mar 2026. Intended to be revised as bitwrench evolves.


## 1. DOM Diffing / Morphing

**Landscape:** React/Preact diff virtual DOM. Lit diffs tagged templates. HTMX uses
Idiomorph to morph real DOM. Solid patches individual text nodes.

**Bitwrench answer:** Component handles (`el.bw.setFoo()`) and `bw.patch()` do
surgical O(1) updates without re-rendering. The design philosophy is Swing/MFC-style:
components own their DOM, expose methods. You call methods, not re-render trees.

**Where the answer works:** Well-designed components with handles/slots. Call
`el.bw.setTitle('new')` -- focus, scroll, input state all preserved. This is the
correct pattern and bitwrench's strongest differentiator.

**Where it doesn't:** `o.render` + `bw.update()` is the documented quick-path for
state-driven re-rendering, and it replaces children wholesale. Focus, scroll, input
state are lost. During rapid prototyping -- bitwrench's core value prop -- developers
WILL reach for `bw.update()` because it's simpler than designing handle methods for
every update scenario. And it will bite them.

**Honest verdict:** The design model is sound, but the easy path has a real UX
penalty. Handle/slots is the right answer for production components. The gap is in
the prototyping-to-production transition: the quick approach (`o.render`) has
sharp edges that the correct approach (handles) doesn't.

**Action:**
- Investigate morph-on-update as opt-in: `o.morph: true` on TACO options
- Idiomorph is 2KB MIT -- could be vendored as optional
- Even a simple "preserve focus/scroll" heuristic in `bw.update()` would help
- Medium priority -- directly affects the rapid-prototyping use case


## 2. Fine-Grained Reactivity / Signals

**Landscape:** Solid, Svelte 5 runes, Preact Signals, Angular Signals, Vue refs.
TC39 Stage 1 proposal to standardize signals. The pattern: declare reactive state,
framework tracks dependencies, surgically updates only affected DOM.

**Bitwrench answer:** `el.bw.setFoo()` IS fine-grained updating. `bw.patch(id, val)`
IS surgical. `bw.pub/sub` decouples publishers from subscribers.

**Where the answer works:** Simple UIs with clear update paths. Change a value,
call the setter. Explicit, debuggable, no magic.

**Where it doesn't:** Dashboard with 15 stat cards, a filter dropdown, and a date
picker. Change the filter -- 8 cards need updating. With bitwrench: publish to a
topic, each card subscribes and calls its own update. That's 8 subscription setups +
8 handler functions. With signals: declare dependencies once, updates propagate
automatically. For complex interdependent UIs, the boilerplate gap is real.

**Honest verdict:** Philosophical difference, but the boilerplate cost is real for
complex UIs. Bitwrench's explicit model is clearer for simple cases and harder for
complex cases. pub/sub helps but isn't as ergonomic as signals.

**Action:**
- Monitor TC39 Signals proposal -- if it lands as browser primitive, bitwrench gets
  it for free (native `Signal` + `bw.patch()` = best of both)
- Consider optional `bw.signal()` / `bw.computed()` helper for v2.1+
- Low priority -- pub/sub covers the need, just with more boilerplate


## 3. Accessibility (a11y)

**Landscape:** Radix UI, Headless UI, and Lion treat a11y as first-class. Lit has
ESLint plugins for a11y linting. HTMX benefits from server-rendered semantic HTML.
WAI-ARIA 1.2 patterns are well-documented and increasingly expected.

**Bitwrench current state:** Some BCCL components have ARIA (makeTabs has
role="tablist", makeProgress has role="progressbar"). But coverage is inconsistent.

**Specific gaps:**
- Missing ARIA on interactive components: dropdown, popover, tooltip, modal
  (role="dialog", aria-modal, aria-haspopup, aria-expanded)
- No focus trap utility -- modal/dropdown MUST trap focus for keyboard users
- No `aria-live` region helper for dynamic content announcements
- No arrow-key navigation for menus/listboxes (WAI-ARIA composite widget pattern)
- No skip-link or landmark helpers
- No WCAG contrast ratio function (`relativeLuminance` exists but no
  `contrastRatio(fg, bg)` that returns the 4.5:1 / 3:1 ratio)
- No automated a11y audit in test suite

**Honest verdict:** This is the clearest real gap. a11y is not optional -- it's a
legal requirement in many contexts (ADA, EN 301 549, WCAG 2.1 AA). Any library
claiming to produce production UI needs this. The fix is incremental: audit each BCCL
component against WAI-ARIA authoring practices and add the missing attributes,
keyboard handlers, and focus management.

**Action (P3 priority):**
- Audit all 50+ BCCL components against WAI-ARIA 1.2 authoring practices
- Add `bw.contrastRatio(hex1, hex2)` to color utils (simple: ratio of luminances)
- Add `bw.focusTrap(el)` / `bw.releaseFocusTrap(el)` utility
- Add keyboard navigation to: dropdown, popover, tooltip, modal, accordion
- Add `aria-live` helper: `bw.announce(text, priority)` for screen readers
- Add a11y tests to test suite (e.g., check that makeTabs output has correct roles)
- Track in qa-todo.md


## 4. Transitions / Exit Animations

**Landscape:** Svelte has `transition:fade`. Vue has `<Transition>`. HTMX has swap
transition classes. View Transitions API (Chrome/Edge, coming to Firefox) is the
browser-native solution for page-level transitions.

**Bitwrench current state:** CSS transitions on hover/focus/active states via design
tokens. Accordion/carousel use CSS for expand/slide. No exit animation support --
when `bw.DOM()` replaces content, old nodes vanish instantly.

**Gaps:**
- No `o.beforeRemove` lifecycle hook with animation delay
- No View Transitions API integration
- No `bw.transition()` helper for enter/exit class toggling

**Honest verdict:** CSS handles ~80% of real transition needs (hover, focus,
expand/collapse). The missing 20% -- exit animations and page transitions -- matters
for polished UIs but not for prototyping. View Transitions API is the right long-term
answer since it's a browser primitive, not a library feature.

**Action:**
- Investigate: `o.beforeRemove(el, done)` hook that delays removal until `done()` called
- Investigate: View Transitions API integration in `bw.DOM()` replacement
- Low priority -- CSS covers most cases, View Transitions API still maturing
- Track in qa-todo.md as investigation item


## 5. Web Components / Shadow DOM Interop

**Landscape:** Lit creates true custom elements (`<my-card>`). These work in any
HTML context with Shadow DOM style isolation.

**Bitwrench answer:** Bitwrench IS ad-hoc addable to any page. Drop a `<script>` tag,
call `bw.DOM('#target', taco)`, done. Works in WordPress, Drupal, static HTML, inside
React apps, anywhere. This is real interop -- no wrapper needed.

**Two narrow gaps:**

1. **No HTML-only instantiation.** Web Components let you write
   `<bw-card title="Hello">` in plain HTML. Bitwrench requires JS. This matters
   only for content authors writing HTML but not JS -- a small audience.

2. **No style encapsulation.** Bitwrench intentionally lets design tokens flow
   through all components (no Shadow DOM). This is a feature in controlled
   environments. In hostile CSS environments (WordPress with 5 plugins, each
   adding conflicting global styles), host CSS CAN override bitwrench classes.
   e.g., a Bootstrap `.btn` rule could affect `bw_btn`. bitwrench's `bw_` prefix
   mitigates this but doesn't eliminate it.

**Honest verdict:** Ad-hoc JS model covers 95%+ of real use cases. The style
leakage risk is real but low (prefix convention works in practice). A Custom Element
wrapper is possible but low demand.

**Action:** Consider `bitwrench-elements.js` addon that wraps BCCL factories as
Custom Elements. Low priority.


## 6. Hydration (SSR + Client Interactivity)

**Landscape:** React, Angular, Qwik support SSR -> client hydration (attaching event
handlers to server-rendered HTML without re-rendering). Qwik has "resumability"
(zero hydration cost).

**Bitwrench paths (none require traditional hydration):**
- **bwserve:** Server pushes updates via SSE. Server stays in control. No hydration.
- **Client-side:** Client renders from TACO directly. No server HTML to hydrate.
- **Static pages:** `bw.htmlPage({ runtime: 'inline' })` embeds runtime + TACOs.
  Components self-initialize via `o.mounted`. Effectively double-renders (server
  generates HTML string, client re-creates DOM), but for typical page sizes this
  is fast enough.

**Where this falls short:**
- **SEO + interactivity on static hosting:** If you pre-render HTML for Googlebot
  (via `bw.html()`) and host on GitHub Pages / Netlify / S3, the client must
  re-render the entire page from TACOs to get event handlers. For large pages,
  this causes a visible flash of inert content.
- **bwserve requires a persistent server.** Static hosting is out. This is fine
  for the server-driven use case but rules out the JAMstack pattern.

**Honest verdict:** bwserve and inlined runtime cover the common cases well. The
gap is narrow: large pre-rendered pages on static hosts that need client
interactivity. A `bw.hydrate(root, taco)` that walks existing DOM and attaches
handlers (rather than re-creating nodes) would close it.

**Action:** Consider `bw.hydrate()` for v2.1+. Low priority -- affects a niche
use case (SEO + static hosting + rich interactivity).


## 7. Error Boundaries

**Landscape:** React has error boundaries -- a component catches render errors from
its children and shows a fallback. Vue has `onErrorCaptured`. Solid has `<ErrorBoundary>`.

**Bitwrench current state:** No error boundary concept. If a TACO's `o.mounted` or
`o.render` callback throws, the error propagates uncaught. This can leave partially
mounted DOM with no cleanup, or crash the caller's render flow.

**Honest verdict:** Real gap for production UIs. A single bad component shouldn't
take down the whole page. The fix is straightforward: wrap `o.mounted`/`o.render`
calls in try/catch inside `bw.createDOM()` / `bw.update()`, and support an
`o.onError(el, err)` callback or a fallback TACO.

**Action:**
- Add try/catch around lifecycle hooks in `bw.createDOM()` and `bw.update()`
- Add `o.onError(el, err)` lifecycle hook
- Consider `bw.errorBoundary(taco, fallbackTaco)` wrapper
- Medium priority -- prevents cascading failures in production


## 8. Developer Tooling

**Landscape:** React DevTools, Vue DevTools are browser extensions that let you
inspect component trees, state, props, events in real time. Svelte has its own
inspector. These are huge productivity boosters.

**Bitwrench current state:** `bwcli` provides live DOM inspection and screenshots
via a dev server. Standard browser DevTools work (bitwrench produces real DOM, not
abstracted virtual DOM). But there's no dedicated bitwrench inspector.

**What's actually good:** Since bitwrench components ARE real DOM with `el.bw`
methods, you can inspect them in the browser's element panel and call
`$0.bw.setTitle('test')` in the console. No special tooling needed.

**What's missing:** No way to see the TACO tree, state objects, pub/sub topics,
or UUID mappings at a glance. You have to know where to look.

**Honest verdict:** Mild gap. Real DOM is inherently inspectable (unlike virtual
DOM which needs special tooling). A lightweight console helper
(`bw.inspect('#target')` -> prints TACO tree + state + subscriptions) would help
without needing a browser extension.

**Action:** Consider `bw.inspect(el)` utility that dumps component info.
Low priority -- browser DevTools + `el.bw` already work well.


## Summary

| # | Feature | Gap? | Priority | Notes |
|---|---------|------|----------|-------|
| 1 | DOM morphing | Real | Med | handle/slots is the answer; o.render path has sharp edges |
| 2 | Signals | Mild | Low | Explicit is by design; boilerplate grows with complexity |
| 3 | Accessibility | Real | P3 | Audit BCCL, add ARIA, focus trap, contrast ratio |
| 4 | Transitions | Real | Low | Investigate o.beforeRemove + View Transitions API |
| 5 | Web Components | Mild | Low | Ad-hoc JS works; style leakage risk is real but low |
| 6 | Hydration | Mild | Low | bwserve covers most cases; SEO+static is the gap |
| 7 | Error boundaries | Real | Med | Prevents cascading failures in production |
| 8 | Dev tooling | Mild | Low | Real DOM is inspectable; bw.inspect() would help |
