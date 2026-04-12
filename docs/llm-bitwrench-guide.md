# Bitwrench LLM Guide

> Compact tutorial for AI-assisted bitwrench development.
> For the full teaching narrative, see `docs/thinking-in-bitwrench.md`.

---

## Step 1: Build Something

Start here. This is a complete bitwrench page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    bw.loadStyles();  // structural CSS (buttons, cards, tables)
    bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });  // themed colors

    bw.DOM('#app', {
      t: 'div', a: { class: 'bw-container' },
      c: [
        bw.makeNavbar({ brand: 'My App', items: [{ text: 'Home', href: '#' }] }),
        bw.makeCard({ title: 'Hello', content: 'Built with bitwrench.' }),
        bw.makeTable({ data: [
          { name: 'Alice', role: 'Admin' },
          { name: 'Bob', role: 'User' }
        ], sortable: true })
      ]
    });
  </script>
</body>
</html>
```

That's it. No build step. No npm install. Open the file in a browser.

**What happened:**
1. `bw.loadStyles()` injected Bootstrap-like CSS
2. `bw.loadStyles({...})` generated a themed color palette from two seed colors
3. `bw.makeNavbar()`, `bw.makeCard()`, `bw.makeTable()` returned TACO objects
4. `bw.DOM('#app', taco)` rendered them into the page

---

## Step 2: Understand TACO

Every UI element is a plain JS object `{t, a, c, o}`:

```javascript
{ t: 'div', a: { class: 'card', id: 'x' }, c: 'Hello world' }
//  tag       attributes                      content
// => <div class="card" id="x">Hello world</div>
```

- `t` -- tag name (defaults to `'div'` if omitted)
- `a` -- object of HTML attributes (including event handlers)
- `c` -- string, TACO, or array of TACOs (nested arbitrarily deep)
- `o` -- bitwrench-only metadata (lifecycle, state) -- never in HTML output

Content is HTML-escaped by default. Use `bw.raw(str)` for trusted HTML.
`null`/`undefined`/`false` in content arrays are silently skipped.

### Nesting

```javascript
{ t: 'div', c: [
    { t: 'h2', c: 'Title' },
    { t: 'p', c: 'Body text' },
    { t: 'ul', c: items.map(function(i) { return { t: 'li', c: i }; }) }
]}
```

### TACO is computation

Every field is a JS expression. This is the key insight:

```javascript
var isAdmin = true;
var items = ['Apples', 'Bananas'];

{
  t: isAdmin ? 'h1' : 'h2',                         // computed tag
  a: { class: 'header ' + (isAdmin ? 'admin' : '') }, // computed attrs
  c: items.map(function(i) { return { t: 'li', c: i }; }) // .map() => children
}
```

**Functions are components. Arrays are slots. `.map()` is iteration. Ternaries are conditionals.**

```javascript
// A "component" is just a function that returns TACO
function colorCard(title, body, color) {
  return {
    t: 'div', a: { style: 'border-left:4px solid ' + color + '; padding:1rem' },
    c: [{ t: 'h3', c: title }, { t: 'p', c: body }]
  };
}

bw.DOM('#app', { t: 'div', c: [
    colorCard('Warning', 'Disk low', '#e67e22'),
    colorCard('OK', 'All clear', '#27ae60')
]});
```

---

## Step 3: Three Levels

| Level | What | How | When |
|-------|------|-----|------|
| **0 -- Data** | Plain JS object | `bw.makeCard({...})` or `{t,a,c}` | Static content, SSR |
| **1 -- DOM** | Rendered tree | `bw.DOM('#x', taco)` | Re-render on demand |
| **2 -- Stateful** | Reactive component | `o.state` + `o.render` + `bw.update()` | Interactive UI |

**Most UI should be Level 0.** Escalate only when needed.

### Level 1 -- re-render when data changes

```javascript
var filter = 'all';
function render() {
  var items = filter === 'all' ? all : all.filter(function(i) { return i.type === filter; });
  bw.DOM('#list', { t: 'div', c: items.map(function(i) {
    return bw.makeCard({ title: i.name, content: i.desc });
  })});
}
render();
```

### Level 2 -- stateful TACO

```javascript
bw.DOM('#app', {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, { t: 'div', c: [
        { t: 'h3', c: 'Count: ' + s.count },
        bw.makeButton({ text: '+1', onclick: function() {
          s.count++;
          bw.update(el);
        }})
      ]});
    }
  }
});
```

**How it works:** `createDOM()` copies `o.state` to `el._bw_state`, stores `o.render` as `el._bw_render`, calls it immediately. On state change, call `bw.update(el)` to re-invoke render.

---

## Step 4: Events -- the #1 Mistake

**Always put event handlers in `a: { onclick: fn }`, never in `o.mounted`.**

When a stateful component re-renders (after `bw.update()`), old DOM children are replaced. Listeners attached via `addEventListener` in `o.mounted` are silently lost.

```javascript
// CORRECT -- re-attached on every render
{ t: 'button', a: { onclick: function() { save(); } }, c: 'Save' }
bw.makeButton({ text: 'Save', onclick: function() { save(); } })

// WRONG -- silently breaks after first re-render
{ t: 'button', c: 'Save',
  o: { mounted: function(el) { el.addEventListener('click', save); } } }
```

**When is `o.mounted` OK?** Only for non-event setup: IntersectionObserver, ResizeObserver, measuring dimensions. Never for click/input handlers.

### Cross-component: pub/sub

```javascript
// Publisher
bw.pub('cart:updated', { count: cart.length });

// Subscriber (auto-cleans when element is removed)
bw.sub('cart:updated', function(d) {
  el._bw_state.n = d.count;
  bw.update(el);
}, el);
```

### Component handles (o.handle / o.slots)

**This is the recommended way to update rendered components without re-rendering.** Use `bw.mount()` + `el.bw.method()` instead of re-rendering the entire component when you only need to change a slot, advance a carousel, or toggle an accordion.

BCCL components expose methods via `el.bw`:

```javascript
var el = bw.mount('#target', bw.makeCarousel({ items: slides }));
el.bw.goToSlide(2);
el.bw.next();
el.bw.pause();

var card = bw.mount('#info', bw.makeCard({ title: 'Stats', content: '0' }));
card.bw.setTitle('Updated');
card.bw.setContent({ t: 'b', c: '42' });
```

Build your own with `o.handle` and `o.slots`:

```javascript
{
  t: 'div', c: [
    { t: 'h3', a: { class: 'title' }, c: 'Default' },
    { t: 'div', a: { class: 'body' }, c: 'Content' }
  ],
  o: {
    slots: { title: '.title', body: '.body' },  // => el.bw.setTitle(), el.bw.getTitle()
    handle: {
      reset: function(el) { el.bw.setTitle('Default'); el.bw.setBody('Content'); }
    }
  }
}
```

---

## Step 5: CSS and Theming

### Inline styles -- JS variables

```javascript
var brand = '#336699', radius = '12px';
{ t: 'div', a: { style: 'background:' + brand + '; border-radius:' + radius }, c: 'Hi' }
```

### bw.s() -- merge style objects

```javascript
{ t: 'div', a: { style: bw.s({ display: 'flex' }, { gap: '1rem' }, { padding: '1rem' }) }, c: '...' }
// Conditional: null args skipped
{ t: 'div', a: { style: bw.s({ padding: '1rem' }, isActive ? { fontWeight: '700' } : null) } }
```

### bw.css() -- generate stylesheet from JS objects

```javascript
bw.injectCSS(bw.css({
  '.card': { borderRadius: '12px', padding: '1.5rem', border: '1px solid #ddd' },
  '.card:hover': { boxShadow: '0 4px 12px rgba(0,0,0,.1)' },
  '@keyframes fadeIn': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
  '@media (max-width: 768px)': { '.card': { padding: '0.75rem' } }
}));
```

CamelCase auto-converts to kebab-case. All `@`-prefix keys nest recursively.

### Functions as CSS generators (like Sass mixins)

```javascript
function cardStyles(accent) {
  var s = bw.deriveShades(accent);
  return { background: s.light, border: '1px solid ' + s.border, color: s.darkText };
}
bw.injectCSS(bw.css({ '.warn': cardStyles('#e67e22'), '.ok': cardStyles('#27ae60') }));
```

### Theme system -- complete palette from 2 colors

```javascript
bw.loadStyles();  // structural CSS only (call once)

bw.loadStyles({
  primary: '#336699', secondary: '#cc6633',
  spacing: 'normal',    // 'compact'|'normal'|'spacious'
  radius: 'md',         // 'none'|'sm'|'md'|'lg'|'pill'
  elevation: 'md',      // 'flat'|'sm'|'md'|'lg'
  harmonize: 0.20       // hue shift semantics toward primary (0-1)
});

bw.toggleStyles();  // switch primary <=> alternate palette

// Or generate separately:
var theme = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' });
bw.applyStyles(theme);
// Use tokens: theme.palette.primary.base, theme.palette.secondary.light, etc.

// 12 built-in presets:
bw.loadStyles(bw.THEME_PRESETS.ocean);
// teal, ocean, sunset, forest, slate, rose, indigo, amber, emerald, nord, coral, midnight
```

### Responsive breakpoints

```javascript
bw.injectCSS(bw.responsive('.grid', {
  base: { gridTemplateColumns: '1fr' },
  md:   { gridTemplateColumns: 'repeat(2, 1fr)' },
  lg:   { gridTemplateColumns: 'repeat(4, 1fr)' }
}));
```

### bw.u() -- Tailwind-style shorthand (optional plugin)

Load `bitwrench-util-css.umd.min.js` after bitwrench (~1KB gzipped):

```javascript
bw.u('flex gap4 p4 alignCenter')       // => { display:'flex', gap:'1rem', ... }
bw.u.css('flex gap4 p4 alignCenter')   // => "display:flex;gap:1rem;padding:1rem;..."
bw.u.cls('flex gap4 p4')               // => "bw_flex bw_gap_4 bw_p_4"

// Compose with bw.s()
a: { style: bw.s(bw.u('flex gap4'), { borderBottom: '2px solid #336699' }) }

// Scale: {n} = n * 0.25rem. p4 = 1rem, gap8 = 2rem, m1 = 0.25rem
// Tokens: p/m/pt/pb/pl/pr/px/py/mt/mb/ml/mr/mx/my + {n}, gap{n}, w{n}, h{n}
// Keywords: flex, flexCol, flexRow, block, hidden, bold, textCenter, justifyCenter, alignCenter
// Colors: bg-[#hex], text-[#hex], bg-name, text-name
// Sizes: textSm, textBase, textLg, textXl, text2xl, text3xl

// Custom tokens
bw.u.extend({ shadow: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } });
bw.u.css('p4 shadow')  // includes your custom token
```

---

## Step 6: BCCL Components

**Bitwrench ships ready-made components. Check the table below BEFORE writing custom TACO for common UI patterns.** All `bw.make*()` return Level 0 TACO objects. Factory dispatcher: `bw.make('card', props)`.

### Most-Used Components

| Component | Key Props | Capabilities |
|-----------|-----------|-------------|
| makeTable | data, columns, sortable, pageSize, onRowClick | **Click-to-sort (default!)**, pagination, row selection, column renderers |
| makeCard | title, content, footer, image, variant | Image positions, shadow variants, **slots: setTitle/setContent/setFooter** |
| makeModal | title, content, footer, onClose | ESC dismiss, backdrop close, **handles: open(), close()** |
| makeToast | title, content, variant, delay, position | Auto-dismiss 5s, 6 positions, **handle: dismiss()** |
| makeTabs | tabs [{label,content}], activeIndex | Arrow/Home/End keys, WAI-ARIA, **handles: setActiveTab(i), getActiveTab()** |
| makeAccordion | items [{title,content}], multiOpen | Animations, ARIA, **handles: toggle(i), openAll(), closeAll()** |
| makeCarousel | items, autoPlay, interval | Auto-play, keyboard, **handles: goToSlide(i), next(), prev(), pause(), play()** |
| makeFormGroup | label, input, help, validation, required | Required indicator, validation feedback -- **don't reinvent this** |
| makeTextarea | placeholder, value, rows | bw_form_control styling -- **use this, not raw `{t:'textarea'}`** |
| makeInput | type, placeholder, value, oninput | All HTML5 types with bw_form_control styling |
| makeSelect | options [{value,text}], value | Dropdown select with bw_form_control styling |
| makeProgress | value, max, variant, striped, animated | Striped + animated, **handles: setValue(n), getValue()** |
| makeStatCard | value, label, change, variant | Dashboard KPI with change arrows, **slots: setValue/setLabel** |
| makeSearchInput | placeholder, onSearch, onInput | Enter to search, clear button |
| makeChipInput | chips, placeholder, onAdd, onRemove | Enter to add, X to remove, **handles: addChip(), removeChip(), getChips(), clear()** |
| makeNav | items [{text,href,active}], pills | Tab/pill/vertical navigation |
| makeNavbar | brand, items, dark | Navigation bar with brand |
| makeButton | text, variant, size, onclick | 8 variants + outline-* variants |
| makeDropdown | trigger, items, align | Click menu with outside-click-to-close |
| makeAlert | content, variant, dismissible | Dismissible notification banner |

For the full 47-component table with all props and handles, see [Component Cheat Sheet](component-cheatsheet.md).

### Components with Imperative Handles

Six components expose `el.bw` methods for direct control. Use `bw.mount()` to get the element:

```javascript
var el = bw.mount('#app', bw.makeCarousel({ items: slides }));
el.bw.goToSlide(2);   // handle method
el.bw.pause();

var card = bw.mount('#info', bw.makeCard({ title: 'Stats', content: '0' }));
card.bw.setTitle('Revenue');   // slot setter
card.bw.setContent({ t: 'b', c: '$42k' });
```

| Factory | Handle Methods | Slot Methods |
|---------|---------------|-------------|
| makeCarousel | goToSlide, next, prev, getActiveIndex, pause, play | -- |
| makeTabs | setActiveTab, getActiveTab | -- |
| makeAccordion | toggle, openAll, closeAll | -- |
| makeModal | open, close | -- |
| makeProgress | setValue, getValue | -- |
| makeChipInput | addChip, removeChip, getChips, clear | -- |
| makeCard | -- | setTitle/getTitle, setContent/getContent, setFooter/getFooter |
| makeStatCard | -- | setValue/getValue, setLabel/getLabel |

### Other Components

**Layout**: makeContainer, makeRow, makeCol ({xs,sm,md,lg,xl}), makeStack
**Content**: makeBadge, makeHero, makeSection, makeFeatureGrid, makeCTA, makeCodeDemo, makeMediaObject, makeTimeline, makeStepper, makeListGroup, makeAvatar, makeSkeleton, makeSpinner
**Forms**: makeForm, makeCheckbox, makeRadio, makeSwitch, makeRange, makeFileUpload
**Buttons**: makeButtonGroup (vertical/horizontal)
**Tables**: makeTableFromArray (2D arrays), makeDataTable (with title + scroll wrapper), makeBarChart (CSS-only)
**Overlays**: makeTooltip, makePopover
**Navigation**: makeBreadcrumb, makePagination

### Variants
`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`

---

## Step 7: Debugging with bwcli

### Browser console

```javascript
var el = bw.$('#app')[0];
el._bw_state;         // current state
el._bw_render;        // render function
bw.inspect(el, 0);       // introspect element (state, handles, type, classes)
```

### bwcli attach -- remote debugging REPL

Connect a terminal REPL to any page for live inspection:

```bash
npm install -g bitwrench
bwcli attach                              # starts on port 7902
bwcli attach --port 3000 --allow-screenshot  # custom port + screenshots
```

Add this to your page:
```html
<script src="http://localhost:7902/bw/attach.js"></script>
```

Then from the terminal:
```
> bw.$('#app')[0]._bw_state     // evaluate any JS
> /tree                           // DOM tree of current page
> /tree #app                      // subtree of #app
> /screenshot                     // capture page as PNG
> /screenshot #my-card            // capture specific element
> /listen                         // stream DOM events
> /mount #target {t:'h1',c:'Hi'} // mount TACO into page
> /render {t:'div',c:'test'}     // render TACO to HTML string
> /patch #status "Loading..."    // update element text
```

### LLM visual feedback loop

Use bwserve screenshots for iterative UI refinement:

```javascript
import bwserve from 'bitwrench/bwserve';
var app = bwserve.create({ port: 7902, allowScreenshot: true });

app.page('/', function(client) {
  client.render('#app', myTaco);

  // Capture what the user sees
  var img = await client.screenshot('#app', { maxWidth: 800 });
  // img.data is a Buffer (PNG) -- send to vision model for evaluation
  // Vision model says "button is too small" => adjust TACO => re-render => screenshot again
});
```

---

## Step 8: bwserve -- Server-Driven UI

Push TACO from any server to the browser via SSE. No client-side app logic needed.

```javascript
import bwserve from 'bitwrench/bwserve';
var app = bwserve.create({ port: 7902 });

app.page('/', function(client) {
  // Render initial UI
  client.render('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Hello from server' },
      { t: 'p', a: { id: 'status' }, c: 'Connected.' },
      { t: 'button', a: { 'data-bw-action': 'greet' }, c: 'Say hello' }
    ]
  });

  // Incremental updates
  client.patch('#status', 'Processing...');
  client.append('#log', { t: 'p', c: 'New entry' });
  client.remove('.old-item');

  // Handle user actions (data-bw-action elements)
  client.on('greet', function() { client.patch('#status', 'Hello!'); });

  // Register + call client-side functions
  client.register('showAlert', 'function(msg) { alert(msg); }');
  client.call('showAlert', 'Server says hi!');
});
app.listen();
```

**Protocol**: `replace`, `patch`, `append`, `remove`, `batch`, `message`, `register`, `call`, `exec`.
**Language-agnostic**: any server that writes SSE works (Python, Go, Rust, C, shell scripts).

---

## Step 9: Client-Side Routing

Map URLs to views with `bw.router()`. Hash mode (default) works everywhere; history mode uses `pushState`.

```javascript
bw.router({
  target: '#app',
  routes: {
    '/':          function() { return { t: 'h1', c: 'Home' }; },
    '/about':     function() { return { t: 'h1', c: 'About' }; },
    '/users/:id': function(params) { return { t: 'div', c: 'User ' + params.id }; },
    '/docs/*':    function(params) { return { t: 'div', c: 'Doc: ' + params._rest }; },
    '*':          function() { return { t: 'h1', c: '404' }; }
  },
  before: function(to, from) {
    if (to === '/admin' && !loggedIn) return '/login';  // redirect
  },
  after: function(to) { console.log('navigated to', to); }
});

// Programmatic navigation
bw.navigate('/users/42');
bw.navigate('/about', { replace: true });

// Navigation links (returns TACO <a> with onclick wired)
bw.link('/about', 'About Us', { class: 'nav-item' })

// Query strings: /search?q=hello => params._query.q === 'hello'

// React to route changes via pub/sub
bw.sub('bw:route', function(d) { navEl.bw.setActive(d.path); }, navEl);

// Cleanup
var r = bw.router({ ... });
r.destroy();  // remove listeners, stop routing
```

**Route priority**: exact > parameterized (`:id`) > catch-all (`/prefix/*`) > global wildcard (`*`).

**Modes**: `mode: 'hash'` (default, `#/path`) or `mode: 'history'` (pushState, needs server SPA fallback). History mode supports `base: '/app'` for prefix stripping.

---

## Step 10: HTML Generation and CLI

### bw.html() -- TACO to HTML string

```javascript
bw.html({ t: 'button', a: { onclick: function() { alert('hi'); } }, c: 'Click' })
// => '<button onclick="bw.funcGetById(\'bw_fn_0\')(event)">Click</button>'
```

Event handlers are auto-serialized via `funcRegister`.

### bw.htmlPage() -- complete standalone document

```javascript
var page = bw.htmlPage({
  title: 'My App',
  body: [{ t: 'h1', c: 'Hello' }, bw.makeButton({ text: 'Click', onclick: fn })],
  runtime: 'shim',  // 'inline'(120KB offline)|'cdn'|'shim'(500B)|'none'
  theme: 'ocean',   // preset name or { primary: '#hex', secondary: '#hex' }
  css: '.custom { color: red; }'
});
// page is a complete <!DOCTYPE html> string with working event handlers
```

### bwcli -- command-line conversion

```bash
bwcli input.md -o output.html                # markdown to HTML
bwcli input.md -o output.html --theme ocean   # with theme preset
bwcli input.md -o output.html --standalone    # bitwrench inlined (offline)
bwcli input.md --theme "#336699,#cc6633"      # custom seed colors
bwcli serve                                   # dev server (port 7902)
```

---

## Core API Quick Reference

### Rendering
| Function | Description |
|----------|-------------|
| `bw.html(taco)` | TACO to HTML string |
| `bw.createDOM(taco)` | TACO to detached DOM element |
| `bw.DOM(sel, taco)` | Mount TACO into existing element |
| `bw.mount(sel, taco)` | Like DOM() but returns root element (for el.bw access) |
| `bw.h(tag, a?, c?, o?)` | TACO constructor from positional args |
| `bw.raw(str)` | Mark string as pre-escaped HTML |
| `bw.htmlPage(opts)` | TACO to complete HTML document |

### CSS and Styling
| Function | Description |
|----------|-------------|
| `bw.css(rules)` | JS object to CSS string (handles @media, @keyframes) |
| `bw.injectCSS(css, {id})` | Insert CSS into document |
| `bw.s(...styles)` | Merge style objects into style string |
| `bw.responsive(sel, bp)` | Generate @media CSS from breakpoint object |
| `bw.loadStyles()` | Load structural CSS (no args) or generate+apply theme (with config) |
| `bw.makeStyles(cfg)` | Generate styles from seed colors (returns styles object) |
| `bw.applyStyles(styles)` | Inject generated styles into document |
| `bw.toggleStyles()` | Switch primary/alternate palettes |

### State and Lifecycle
| Function | Description |
|----------|-------------|
| `o.state` | Initial state (copied to `el._bw_state`) |
| `o.render(el, state)` | Render function, called on mount and `bw.update()` |
| `o.handle` | Methods attached to `el.bw` namespace |
| `o.slots` | `{name: '.selector'}` => auto `el.bw.setName()`/`el.bw.getName()` |
| `o.mounted(el)` | After DOM insertion (NOT for event handlers) |
| `o.unmount(el)` | Before DOM removal |
| `bw.update(el)` | Re-invoke render function |
| `bw.mount(sel, taco)` | Mount + return root element |
| `bw.cleanup(el)` | Run unmount hooks, clear subscriptions |
| `bw.patch(id, content)` | Update element by id or UUID |
| `bw.inspect(el, depth)` | Introspect DOM subtree with bitwrench metadata |

### Communication
| Function | Description |
|----------|-------------|
| `bw.pub(topic, data)` | App-wide publish (fires exact + wildcard matches) |
| `bw.sub(topic, fn, el?)` | Subscribe (supports wildcard `'ns:*'`; optional lifecycle tie) |
| `bw.once(topic, fn, el?)` | One-shot subscribe (auto-unsub after first fire) |
| `bw.message(target, action, data)` | Dispatch to `el.bw[action](data)` |
| `bw.emit(el, event, detail)` | DOM-scoped CustomEvent |

### Routing
| Function | Description |
|----------|-------------|
| `bw.router(config)` | Create and start client-side router. Returns `{ navigate, current, destroy }` |
| `bw.navigate(path, opts)` | Programmatic navigation (delegates to active router) |
| `bw.link(path, content, attrs)` | Returns TACO `<a>` with navigation wired |

### Utilities
| Function | Description |
|----------|-------------|
| `bw.$('selector')` | querySelectorAll as array |
| `bw.uuid(prefix)` | Generate unique ID |
| `bw.typeOf(x)` | Enhanced typeof: 'array', 'null', 'date' |
| `bw.escapeHTML(str)` | Escape HTML special chars |
| `bw.deriveShades(hex)` | 8 shade variants from one color |
| `bw.textOnColor(hex)` | Contrast-safe text color ('#fff' or '#000') |
| `bw.random(min, max)` | Random integer (or array variant) |
| `bw.loremIpsum(n)` | Placeholder text |
| `bw.parseRJSON(str)` | Relaxed JSON (unquoted keys, trailing commas) |
| `bw.saveClientFile(name, data)` | Browser file download |

---

## Key Rules Summary

1. **Events in `a: { onclick: fn }`** -- never in `o.mounted`. This is the #1 mistake.
2. **Call `bw.loadStyles()`** before rendering. Use `bw.loadStyles(config)` for themed colors.
3. **Content is escaped by default.** Use `bw.raw(str)` for trusted HTML only.
4. **All `make*()` return Level 0 TACOs** -- pass to `bw.DOM()` or `bw.html()`.
5. **TACO is computation** -- every field is a JS expression. Use variables, `.map()`, ternaries.
6. **CSS is just strings** -- store in variables, compose with `bw.s()`, generate with `bw.css()`.
7. **Three levels are explicit** -- you always know if you have data (L0), DOM (L1), or stateful (L2).
8. **No raw DOM** -- use `bw.DOM()`, not `innerHTML` or `document.querySelector`.
9. **CSS classes use `bw-` prefix**: `bw-card`, `bw-btn`, `bw-container`.
10. **Routing is built in** -- `bw.router()` for SPAs. Hash mode by default, history mode optional.
11. **Use `bw.mount()` + `el.bw`** for targeted updates. `o.handle` for methods, `o.slots` for content areas. Avoids re-render side effects (lost focus, scroll reset).
12. **Debug**: `bw.inspect(el, 0)`, `el._bw_state`, `bwcli attach` for remote REPL.

---

## TypeScript

Full type declarations ship with the package (`dist/bitwrench.d.ts`). No `@types`
package needed.

```typescript
import bw from 'bitwrench';
import type { Taco, TacoOptions, StyleConfig, Palette } from 'bitwrench';

// TACO objects are fully typed
var card: Taco = bw.makeCard({ title: 'Hello', content: 'World' });

// Style configs get autocomplete
var styles = bw.makeStyles({ primary: '#336699' } as StyleConfig);

// Named BCCL imports for tree-shaking
import { makeCard, makeTable, makeButton } from 'bitwrench/bccl';
```

Core types: `Taco`, `TacoContent`, `TacoAttributes`, `TacoOptions`, `StyleConfig`,
`Palette`, `ColorShades`, `Styles`, `RouterConfig`. All component configs are
typed (e.g. `CardConfig`, `ButtonConfig`, `TableConfig`).

See [TypeScript Usage Guide](bitwrench_typescript_usage.md) for full details.

---

## Removed APIs (v2.0.19)

`bw.component()`, `bw.compile()`, `bw.when()`, `bw.each()` -- all throw Error.
Replaced by `o.handle` + `o.slots` + `bw.mount()`. See Step 4.

---

*Bitwrench: 40KB gzipped, zero dependencies, no build step. [github.com/deftio/bitwrench](https://github.com/deftio/bitwrench)*
