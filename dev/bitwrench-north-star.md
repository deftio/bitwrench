# Bitwrench North Star

Read this before every implementation task. If your code violates these
principles, stop and rethink.

---

## Background: why TACO exists

Modern web frameworks treat UI as a rendering problem: you write templates
(JSX, .vue, .svelte), a compiler turns them into DOM instructions, and a
runtime manages updates. The template is not the component — the compiled
output is.

Bitwrench rejects this split. A TACO object `{t, a, c, o}` IS the
component. It's a plain JavaScript object that fully describes structure,
attributes, content, state, behavior, and lifecycle. No compilation is
needed to make it work. No special syntax to learn. No toolchain to
configure.

This isn't a new idea. It's how desktop UI frameworks have always worked:

- **Windows MFC**: `CButton`, `CEdit`, `CListBox` — each is a C++ class
  that encapsulates a Win32 window. You call `SetWindowText()`, the control
  repaints. You don't reach into the device context.
- **Java Swing**: `JButton`, `JTextField`, `JTable` — each is a Java object
  with getters/setters and event listeners. The look-and-feel system
  (equivalent to bitwrench themes) can reskin every component at once.
- **Borland C++ OWL/VCL**: `TButton`, `TEdit`, `TPanel` — Delphi's VCL
  components owned their rendering, published properties, and emitted
  events. The Object Inspector was possible because components were
  self-describing data.

These frameworks shared a philosophy: **the component is a self-contained
object with an API. The rendering substrate (GDI, AWT, Win32) is an
implementation detail the user doesn't touch.**

TACO brings this philosophy to the web. The rendering substrate is
JS + DOM + CSS. The component API is get/set/on/sub. The TACO object is
the component definition — like a window class in MFC or a bean in Swing.

---

## Principle 1: TACO is a component specification, not a DOM template

A TACO object declares what a component IS — its structure, state,
behavior, and lifecycle. It is not an instruction to emit HTML.

```javascript
// This is a component definition, not a render call:
{
  t: 'div',
  a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: title },
    { t: 'p', c: body }
  ],
  o: {
    state: { expanded: false },
    render: function(el) { /* self-manages */ }
  }
}
```

Think: MFC `CButton`, Swing `JTextField`, Borland `TEdit`.
Not: jQuery `.html()`, Handlebars template, innerHTML string builder.

**Test**: Can the same TACO definition render to DOM (browser), HTML string
(server), or compiled JS (production) without changing user code? If yes,
you're thinking correctly. If your code only works with `document`, you've
drifted.

---

## Principle 2: Components own their rendering

A BCCL `make*()` factory returns a self-contained component object.
Internal state changes trigger internal re-renders. The user never
manually updates the DOM for a component's internal state.

```
WRONG:  el._bw_state.count++; bw.update(el);    // user is the message pump
RIGHT:  counter.set('count', 42);                // component repaints itself
```

This is the MFC/Swing model: you call `SetWindowText("hello")` and the
control repaints. You don't call `InvalidateRect()` yourself. You don't
reach into the device context. The control owns its rendering.

The user interacts through the component API: `get()`, `set()`, `on()`,
`sub()`. Reaching into `el._bw_state` is like calling `SendMessage(hwnd,
WM_SETTEXT)` directly — possible, but it means the abstraction failed.

**The low-level layer stays**: `o.render`, `bw.update()`, `bw.patch()`,
`bw.DOM()` are the "Win32 API" of bitwrench. They exist for custom
components and escape hatches. But BCCL components should never require
the user to call them. If a user needs `bw.update()` to make a standard
component work, that's a bug in the component, not a missing step by
the user.

### How component reactivity should work

```javascript
// The factory returns a component handle, not raw DOM:
var card = bw.makeCard({
  title: 'Users Online',
  content: '${count}',                          // reactive binding
  variant: '${count > 100 ? "success" : "warning"}'  // derived
});

// Mount it:
bw.DOM('#target', card);

// Interact through the API:
card.set('count', 42);       // card re-renders internally, no bw.update()
card.get('count');            // → 42
card.on('click', handler);   // event interface
card.destroy();              // cleanup

// Cross-component via pub/sub:
card.sub('data:update', function(d) { card.set('count', d.n); });
bw.pub('data:update', { n: 99 });   // card auto-updates
```

The `make*()` factory compiles template strings into internal render
functions that know which state keys they depend on. State mutations
trigger only the affected DOM nodes. The user never thinks about DOM —
they think about component state and component APIs.

---

## Principle 3: Design system, not CSS collection

All BCCL components share a single design language. A bitwrench button
and a bitwrench card and a bitwrench modal must feel like they were
designed by the same person — because they were designed by the same
system.

### Shared design tokens (all components consume these)

- **Spacing scale**: derived from a base unit (e.g., 4px: 4, 8, 12, 16, 24, 32, 48)
- **Font size scale**: a defined type ramp (e.g., 12, 14, 16, 18, 20, 24, 30)
- **Font weight scale**: limited set (400 regular, 500 medium, 600 semibold, 700 bold)
- **Shadow elevation scale**: named levels (sm, md, lg, xl) — not per-component shadows
- **Motion curves**: shared duration + easing (e.g., 150ms ease-out for hover, 250ms ease for expand)
- **Border radius scale**: none, sm, md, lg, pill (already in RADIUS_PRESETS — enforce usage)
- **Color roles**: primary, secondary, surface, muted, error, warning, success, info

No ad-hoc values. If a component needs `padding: 0.625rem`, that should
map to a token like `spacing.md`. If it doesn't fit the scale, the scale
needs adjusting — not the component.

### Visual consistency checklist

When implementing or modifying any component, verify:

- **Padding/margins** use the spacing scale — not arbitrary values
- **Font sizes** use the type ramp — not arbitrary rem values
- **Colors** use role tokens (primary, surface, muted) — not hardcoded hex
- **Shadows** use the elevation scale — not per-component box-shadow values
- **Transitions** use shared motion curves — not per-component duration/easing
- **Border radius** uses the radius scale — not hardcoded px/rem
- **Focus states** are visible and consistent across all interactive components
- **Hover states** exist on all clickable elements and use consistent feedback
- **Dark mode** works through token inversion, not per-component overrides

### Reference frameworks

Study for consistency patterns (not to copy):
- **MUI**: Design tokens, consistent elevation system, motion guidelines
- **shadcn/ui**: CSS variables consumed by all components, Radix primitives
- **Ant Design**: Systematic spacing, consistent form control sizing

Not the goal: Bootstrap 3 (grab-bag of unrelated CSS classes), jQuery UI
(inconsistent skinning), ad-hoc component libraries.

### The theme generator advantage

`bw.generateTheme()` is bitwrench's differentiator — regenerate an entire
design system from 3 seed colors. No other framework can do this as
seamlessly. But it only works if the base components consume tokens
consistently. A theme that changes colors but leaves spacing, shadows,
and motion untouched is only half a design system.

---

## Principle 4: No raw DOM in examples or components

All bitwrench examples and BCCL components use TACO patterns:

| Instead of | Use |
|------------|-----|
| `innerHTML = '<div>...'` | `bw.DOM('#target', taco)` |
| `<style>` blocks | `bw.css({...})` + `bw.injectCSS()` |
| `document.createElement()` | `bw.createDOM(taco)` |
| `document.querySelector()` | `bw.$()` |
| `element.addEventListener()` | `component.on()` or `bw.on()` |
| `element.style.color = 'red'` | TACO `a: { style: ... }` or CSS tokens |

If you find yourself writing `document.getElementById()` or raw HTML
strings in component code, that's drift. The whole point of TACO is
that you don't need to think about the DOM. If the TACO API can't do
what you need, that's a gap in the API — fix the API, don't work around
it with raw DOM.

---

## Principle 5: Compilation is optimization, not a prerequisite

TACO works interpreted (zero build step) and compiled (production
optimization). This is a feature — you can develop without any toolchain,
then compile for production.

**Reactivity comes from the component model (Principle 2), not from a
compile step.** A component's `.set()` triggers re-render because the
component was built that way, not because a compiler wired it up.

The compile step adds performance optimizations:
- Static template extraction (cloneNode instead of createElement)
- Dead CSS elimination (tree-shake unused component styles)
- Targeted DOM updates (patch only changed nodes)
- Pre-rendered HTML with hydration markers (fast first paint)

These are performance features, not correctness features. A TACO
component must work identically interpreted and compiled. If it only
works compiled, the component model is broken.

This is how MFC/Swing worked too — debug and release builds produced
the same behavior. Release builds were faster (optimized, stripped), not
functionally different.

---

## Principle 6: Assembly language is JS + DOM + CSS

The browser platform (JS + DOM + CSS) is to bitwrench what Win32/GDI
was to MFC, what AWT was to Swing. It's the substrate, not the API.
Users work with components, not with the substrate.

| Desktop analogy | Bitwrench equivalent |
|-----------------|---------------------|
| Win32 `CreateWindowEx()` | `document.createElement()` |
| GDI `BitBlt()`, `TextOut()` | DOM `innerHTML`, `textContent` |
| MFC `CButton`, `CEdit` | BCCL `makeButton()`, `makeInput()` |
| `SetWindowText()` | `component.set('text', 'hello')` |
| `WM_PAINT` / `OnDraw()` | `o.render` |
| `SendMessage()` | `bw.patch()`, `bw.update()` |
| Resource file (.rc) | TACO object literal |
| Look-and-feel / themes | `bw.generateTheme()` |

The user should never need to think about `addEventListener`, `classList`,
`style.setProperty`, or `insertBefore`. These are the assembly instructions
that the component framework abstracts away.

---

## Quick drift checks

Before writing code, ask:

| Question | If yes | If no |
|----------|--------|-------|
| Am I using `document.*` directly? | Drift. Use bw.$() or TACO. | Good. |
| Does the user need to call `bw.update()`? | Drift. Component should self-update. | Good. |
| Am I hardcoding px/rem/hex values? | Drift. Use design tokens. | Good. |
| Would this code break in Node (no DOM)? | Drift. TACO should be universal. | Good. |
| Am I writing `<style>` or raw HTML in body? | Drift. Use bw.css() and TACO. | Good. |
| Does this component look different from others? | Drift. Check design tokens. | Good. |
| Does this button have different padding than that button? | Drift. Shared spacing scale. | Good. |
| Does hover/focus feedback feel different across components? | Drift. Shared motion curves. | Good. |
| Am I treating TACO as "nicer innerHTML"? | Drift. It's a component spec. | Good. |
| Would an MFC/Swing developer recognize this pattern? | Good. | Rethink. |
