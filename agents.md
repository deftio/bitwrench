# agents.md -- Instructions for AI coding agents working on bitwrench

## What bitwrench is

bitwrench is a JavaScript UI library where every UI element is a plain JS
object called a TACO: `{t, a, c, o}` (Tag, Attributes, Content, Options).
bitwrench renders TACOs to live DOM or HTML strings and provides a complete
component library (47 components), palette-based theming, state management,
client-side routing, and server-driven UI via SSE (bwserve). 165 KB on disk
(45 KB gzipped), zero dependencies, no build step.

bitwrench started in 2011 -- by an author who'd previously co-founded the
Lampdesk webVM that became Palm/HP webOS -- with a simple premise:
JavaScript objects should be the UI primitive, not markup strings. Where
Bootstrap required writing HTML and bolting on behavior separately, TACO
keeps tag, attributes, content, and behavior in one object. JSX went the
other direction (markup-first, toolchain required); bitwrench bets that the
object-first approach is more composable and needs zero tooling. That same
design choice happens to work everywhere from cloud dashboards to ESP32
microcontrollers.

bitwrench is NOT a DOM helper or a lightweight Bootstrap. It is a complete
UI system with its own rendering model. Code that uses bitwrench should
look fundamentally different from code that uses jQuery, vanilla JS, or
React. If the code you are writing contains `document.querySelector`,
`innerHTML`, raw CSS strings, or `addEventListener` inside lifecycle hooks,
you are doing it wrong. Read the patterns below.

## Lifecycle

1. **Define** -- write a TACO object: `{t, a, c, o}`
2. **Create** -- `bw.create(taco)` builds a real DOM element (hydrates; does not fire `o.mounted`)
3. **Hydrate** -- handles attach to `el.bw`, slots wire getters/setters, UUID assigned, state initialized
4. **Mount** -- `bw.mount` / `bw.DOM` / `bw.append` / `bw.replace` insert and run `mountTree`; `o.mounted(el)` fires. Never `parent.appendChild(bw.create(taco))` for lifecycle components.
5. **Interact** -- external code calls `el.bw.method()` -- the component updates its own DOM
6. **Unmount** -- `bw.unmount(el)` fires `o.unmount(el)`, tears down subscriptions, removes element

## Required reading

Before writing or modifying bitwrench code, read these docs in order:

1. **docs/quickstart.md** -- Annotated 100-line tutorial. Covers the
   full lifecycle from theming through stateful components in a single
   working HTML file. Start here for the fastest onramp.

2. **docs/llm-bitwrench-guide.md** -- Compact code-first tutorial.
   Covers TACO format, rendering, events, CSS, BCCL components, state,
   handles/slots, routing, bwserve, and the #1 mistake (events in
   o.mounted). ~700 lines -- you can read it in full.

3. **docs/thinking-in-bitwrench.md** -- Full progressive walkthrough.
   Builds from a static HTML string to a live server-driven app, one
   layer at a time. Explains WHY bitwrench works the way it does and
   how it differs from frameworks. Read when you need to understand
   design rationale, not just API calls.

4. **docs/component-cheatsheet.md** -- Every built-in component with
   key props and handle methods. Check this BEFORE building custom
   UI -- bitwrench ships 47 components. If one exists for your need,
   use it; do not hand-build a replacement.

5. **docs/bitwrench-northstar-principles.md** -- Core design philosophy.
   Read when proposing architectural changes or new patterns.

## The bitwrench mental model

This is what most AI agents get wrong. bitwrench is closer to Qt/MFC
than to React or jQuery:

- **UI is data.** You never write HTML strings. You build JS objects.
  Functions return objects. Arrays of objects are lists. .map() is
  iteration. Ternaries are conditionals. The full language is available
  at every point in the tree.

- **Components own their DOM.** After `bw.mount()`, the component has a
  real DOM element. You call methods on it: `el.bw.setTitle('new')`,
  `el.bw.goToSlide(3)`. There is no virtual DOM, no diffing, no
  automatic re-render. You tell the component what to update.

- **CSS is generated from data.** bitwrench generates a full color
  palette from 2-3 seed colors. Custom CSS uses `bw.css()` with palette
  values, not string literals with hardcoded hex colors. Dark mode is
  `bw.toggleThemeMode()`, not a `.dark` class override.

- **bitwrench is the rendering layer.** You do not "use bitwrench to
  help build a page" -- bitwrench IS how the page is built. Every
  element goes through bw.DOM(), bw.mount(), or bw.html(). If you
  find yourself mixing bitwrench calls with raw DOM manipulation,
  something is wrong.

## The five patterns you must follow

### 1. TACO objects, not DOM calls

Every UI element is a TACO object. Never use document.getElementById(),
document.querySelector(), document.createElement(), or innerHTML.

```javascript
// WRONG -- raw DOM
document.getElementById('app').innerHTML = '<div class="card"><h2>Title</h2></div>';
var el = document.querySelector('.card');
el.style.background = '#f5f5f5';

// WRONG -- building HTML strings
var html = '<ul>' + items.map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';

// RIGHT -- TACO objects
bw.DOM('#app', bw.makeCard({ title: 'Title' }));

// RIGHT -- lists as arrays of TACOs
bw.DOM('#app', { t: 'ul', c: items.map(function(i) { return { t: 'li', c: i }; }) });
```

For querying existing elements, use `bw.$()` (returns array) or `bw.el()`.

### 2. BCCL components first, custom TACO second

bitwrench ships 47 ready-made components. ALWAYS check the component
library before building custom UI:

```javascript
// WRONG -- hand-building a table
{ t: 'table', c: [
  { t: 'thead', c: { t: 'tr', c: cols.map(function(c) { return { t: 'th', c: c }; }) } },
  { t: 'tbody', c: rows.map(function(r) {
    return { t: 'tr', c: cols.map(function(c) { return { t: 'td', c: r[c] }; }) };
  }) }
]}

// RIGHT -- bitwrench has a sortable, paginated table
bw.makeTable({ data: rows, columns: cols, sortable: true, pageSize: 20 })

// WRONG -- hand-building a modal
{ t: 'div', a: { class: 'modal-overlay', onclick: close }, c: [
  { t: 'div', a: { class: 'modal-box' }, c: [
    { t: 'h2', c: 'Confirm' }, { t: 'p', c: 'Are you sure?' },
    { t: 'button', a: { onclick: close }, c: 'OK' }
  ]}
]}

// RIGHT -- bitwrench modal with ESC/backdrop/X/handles
var el = bw.mount('#app', bw.makeModal({
  title: 'Confirm', content: 'Are you sure?',
  footer: bw.makeButton({ text: 'OK', variant: 'primary', onclick: confirm })
}));
el.bw.open();   // programmatic control
el.bw.close();
```

Key components: makeCard, makeTable, makeModal, makeToast, makeTabs,
makeAccordion, makeCarousel, makeButton, makeNavbar, makeNav, makeInput,
makeSelect, makeSwitch, makeFormGroup, makeProgress, makeStatCard,
makeAlert, makeDropdown, makeChipInput, makeSearchInput, makeBadge,
makeBarChart. See `docs/component-cheatsheet.md` for the full list.

### 3. CSS from palette, not string literals

bitwrench generates a complete color palette from seed colors. All CSS
should reference palette values, not hardcoded colors.

```javascript
// WRONG -- hardcoded colors, no theme integration, won't dark-mode
bw.injectCSS('.sidebar { background: #f5f5f5; border-right: 1px solid #ddd; }');
bw.injectCSS('.header { color: #333; font-size: 1.25rem; }');

// drift-lint:ignore-start: counter-example of CSS custom properties as theming path
// WRONG -- CSS custom properties (bitwrench does not use var(--bw_*))
bw.injectCSS('.card { background: var(--bw_surface); }');
// drift-lint:ignore-end

// RIGHT -- CSS as a function of the palette + layout tokens
var p = styles.palette;
var L = styles.layout;
bw.injectCSS(bw.css({
  '.sidebar': {
    background: p.surfaceAlt,
    'border-right': '1px solid ' + p.light.border,
    padding: L.spacing.card
  },
  '.header': {
    color: p.dark.base,
    'font-size': L.typeScale.xl + 'px',
    'border-radius': L.radius.card,
    'box-shadow': L.elevation.sm
  }
}));
```

The palette provides: primary, secondary, tertiary, success, danger,
warning, info, light, dark (each an object with .base, .hover, .active,
.light, .darkText, .border, .focus, .textOn). Also surface, surfaceAlt,
background (plain strings -- NOT objects, do not access .base on them).

`styles.layout` provides spacing, radius, typeScale, elevation, and motion
tokens resolved from the same `loadStyles` / `makeStyles` config.

For dark mode, call `bw.toggleThemeMode()`. Do not write `.bw_theme_alt`
CSS overrides or `.dark` class selectors.

### 4. Events in attributes, not addEventListener

This is the single most common bug. Handlers attached via addEventListener
in o.mounted are silently lost when a component re-renders.

```javascript
// WRONG -- lost after bw.refresh()
{
  t: 'div', c: [
    { t: 'button', c: 'Save' },
    { t: 'input', c: '' }
  ],
  o: {
    mounted: function(el) {
      el.querySelector('button').addEventListener('click', save);
      el.querySelector('input').addEventListener('input', filter);
    }
  }
}

// RIGHT -- survives re-render
{
  t: 'div', c: [
    { t: 'button', a: { onclick: save }, c: 'Save' },
    { t: 'input', a: { oninput: filter } }
  ]
}

// ALSO RIGHT -- use BCCL
bw.makeButton({ text: 'Save', onclick: save })
```

o.mounted is only for non-event setup: IntersectionObserver, measuring
dimensions, third-party library initialization.

<!-- drift-lint:ignore-start: naming the retired attribute is the point of this note -->
No `data-*` attributes anywhere, including bwserve. Declarative attribute
binding (`data-bw-action` and similar) is a framework pattern, not a
bitwrench one; bwserve carried it by mistake until v2.1.0. Server-driven
click handling uses `bw_act_*` class tokens instead, which the thin client
delegates on: `{ t: 'button', a: { class: 'bw_act_save' } }`.
<!-- drift-lint:ignore-end -->

### 5. Explicit state, not hand-coded reactivity

Do not manually track state in outer variables and update DOM nodes by
hand. Use bitwrench's state model:

```javascript
// WRONG -- manual state tracking and DOM updates
var count = 0;
function render() {
  document.getElementById('count').textContent = count;
}
document.getElementById('btn').onclick = function() { count++; render(); };

// RIGHT -- stateful TACO
bw.DOM('#app', {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el, state) {
      bw.DOM(el, { t: 'div', c: [
        { t: 'span', c: 'Count: ' + state.count },
        bw.makeButton({ text: '+1', onclick: function() {
          state.count++;
          bw.refresh(el);
        }})
      ]});
    }
  }
});

// ALSO RIGHT -- for targeted updates without full re-render, use handles
var el = bw.mount('#app', {
  t: 'div', c: [
    { t: 'span', a: { class: 'val' }, c: '0' },
    { t: 'button', a: { onclick: function() { el.bw.increment(); } }, c: '+1' }
  ],
  o: {
    handle: {
      increment: function(el) {
        var span = el.querySelector('.val');
        span.textContent = String(Number(span.textContent) + 1);
      }
    }
  }
});
```

Three levels -- use the simplest that fits:
1. **Static TACO**: plain objects, no state. Most UI is this.
2. **Re-render on demand**: call bw.DOM() again with new data.
3. **Stateful TACO**: o.state + o.render + bw.refresh().

## Source layout

```
src/bitwrench.js              Main library (~3900 lines)
src/bitwrench-styles.js       Theme/CSS generation (~2190 lines)
src/bitwrench-color-utils.js  Color utilities (~460 lines)
src/bitwrench-bccl.js         Component library (BCCL)
src/bitwrench-code-edit.js    Code editor component
src/bitwrench-router.js       Client-side routing
src/bitwrench-file-ops.js     File I/O (browser + Node)
src/bitwrench-debug.js        Debug utilities
src/bwserve/                  Server-driven UI (SSE)
src/cli/                      CLI tool (bwcli)
dist/                         Built output (UMD, ESM, CJS, ES5)
test/                         Mocha + Karma tests
pages/                        Live demo pages (dogfood bitwrench)
examples/                     Standalone examples
docs/                         Documentation
```

## Build and test

```bash
npm run build          # Rollup -> dist/ (UMD, ESM, CJS, ES5)
npm run test           # Mocha + c8 coverage (80% min)
npm run lint           # ESLint on src/
npm run lint:drift     # Doc/API consistency checker
npm run test:e2e       # Browser tests (Playwright)
npm run cleanbuild     # Full build + SRI hashes + README
```

## Key API

### Rendering
| Function | Returns | When to use |
|----------|---------|-------------|
| bw.DOM(sel, taco) | void | Mount into existing container |
| bw.mount(sel, taco) | root element | Need el.bw handle/slot access after mount |
| bw.create(taco) | detached element | Build/hydrate before inserting (does not fire `o.mounted`) |
| bw.append(target, taco) | new child element | Add child + `mountTree` (prefer over create+appendChild) |
| bw.html(taco) | HTML string | SSR, emails, Node.js, CLI output |
| bw.h(tag, a?, c?, o?) | TACO object | Shorthand TACO constructor |

### Styling
| Function | What it does |
|----------|-------------|
| bw.loadStyles() | Inject structural CSS (component styles) |
| bw.loadStyles(config) | Generate palette + inject themed CSS |
| bw.makeStyles(config) | Generate styles object (palette, css, rules) |
| bw.css(rules) | JS object to CSS string |
| bw.injectCSS(css, {id}) | Insert CSS into document |
| bw.toggleThemeMode() | Switch primary/alternate palettes |

### State and lifecycle
| Function | What it does |
|----------|-------------|
| bw.refresh(el) | Re-invoke o.render |
| bw.update(ref, data) | Dispatch to el.bw.update(data) |
| bw.unmount(el) | Tear down lifecycle, remove element |
| bw.patch(ref, content) | Update element content by id/UUID |
| bw.pub(topic, data) | Publish to all subscribers |
| bw.sub(topic, fn, el?) | Subscribe (auto-cleans on unmount if el given) |

### Components (BCCL)
All `bw.make*()` functions return static TACO objects. Mount with bw.DOM()
or bw.mount(). Components with handles (modal, carousel, tabs, accordion,
progress, chipInput) need bw.mount() for el.bw access.

## Commit and release rules

- NEVER commit directly to main -- work on feature branches
- NEVER push feature branches to GitHub -- only main is pushed
- NEVER run npm publish or create tags manually -- CI owns this
- Run `npm run release` on feature branch, then squash-merge to main
- Bundle budget: 46 KB gzipped for both UMD and ESM (45 KB through 2.1.6)

<!-- drift-lint:ignore-start: removal documentation must name the removed APIs -->
## Removed APIs (will throw or silently fail)

- bw.component(), bw.compile(), bw.when(), bw.each() -- REMOVED
- bw.toggleStyles() -- REMOVED, use bw.toggleThemeMode()
- bw.createDOM() -- renamed to bw.create()
- bw.cleanup() -- renamed to bw.unmount()
- bw.random() -- never existed
<!-- drift-lint:ignore-end -->

## Documentation

For the full doc map, see llms.txt in the project root.

Essential reading for code changes:
- docs/quickstart.md -- annotated 100-line tutorial, lifecycle overview
- docs/llm-bitwrench-guide.md -- compact tutorial with all API patterns
- docs/thinking-in-bitwrench.md -- progressive walkthrough, design rationale
- docs/component-cheatsheet.md -- all 47 components, props, handles
- docs/bitwrench-northstar-principles.md -- core design philosophy
