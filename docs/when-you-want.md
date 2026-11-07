# When You Want X, Call Y

The [core API card](core-api.md) is indexed by function. This page is the same
material indexed by the problem you have. Every entry comes from something a
real app built with bitwrench reached for -- and in most cases hand-rolled,
because the call existed but was filed under a name the author did not know to
search for. Every code block on this page runs in the test suite.

Everything here is in the lean build as well as the full one, except where an
entry says otherwise. If you are on `bitwrench-lean` and about to write a
helper, check this page first.

## Build it

**You want to write a TACO without spelling out the keys.** `bw.h` takes
positional arguments and returns the same `{t, a, c, o}` object. Mix the two
forms freely; the renderer cannot tell them apart.

```javascript
var h = bw.h;
bw.mount('#app', h('ul', { class: 'menu' }, ['Home', 'Docs'].map(function(x) {
  return h('li', null, x);
})));
```

**You want a list from an array.** `.map()` is the loop. Nested arrays in `c`
are flattened, so you can concatenate groups without `.flat()`.

```javascript
var head = [{ t: 'h2', c: 'People' }];
var rows = data.map(function(d) { return { t: 'li', c: d.name }; });
bw.mount('#app', { t: 'div', c: [head, { t: 'ul', c: rows }] });
```

**You want to show something only sometimes.** `null`, `undefined`, `false`
and `true` in `c` render nothing, so `cond && taco` is the conditional child
and a ternary chooses between two.

```javascript
var isAdmin = false;
bw.mount('#app', { t: 'nav', c: [
  { t: 'a', a: { href: '#' }, c: 'Home' },
  isAdmin && { t: 'a', a: { href: '#admin' }, c: 'Admin' }
]});
```

**You want to put trusted HTML in.** Content is escaped by default, so
`c: '<b>x</b>'` renders as visible text. `bw.raw()` marks a string as
already-safe HTML. Use it for HTML you produced, never for user input.

```javascript
bw.mount('#app', { t: 'p', c: ['Rendered from ', bw.raw('<code>bw.raw</code>')] });
```

**You want to draw SVG.** SVG is ordinary TACO starting at `{ t: 'svg' }`.
Attribute names stay as SVG spells them. Do not build SVG as strings.

```javascript
bw.mount('#app', { t: 'svg', a: { viewBox: '0 0 100 20', width: 200 }, c: [
  { t: 'rect', a: { x: 0, y: 5, width: 60, height: 10, fill: '#3b82f6' } },
  { t: 'text', a: { x: 65, y: 14, 'font-size': 10 }, c: '60%' }
]});
```

Full guide, including interactive drawings: [svg.md](svg.md).

**You want an HTML string instead of DOM** -- for a static site, an email, a
Node script. Same TACO, different output. `o` never appears in the string.

```javascript
var html = bw.html({ t: 'p', a: { class: 'lead' }, c: 'Hello' });
// '<p class="lead">Hello</p>'
bw.mount('#app', { t: 'pre', c: html });
```

## Change it

Rebuilding what is already on screen was the pattern that recurred in the
audited apps. Each change below names the smallest verb that does it.
Cheapest first.

**You want to flip a visual state** -- open, selected, busy, pressed.
`bw.toggleClass` touches no node, so focus, scroll position and CSS transitions
survive. It takes a selector and changes every match, which replaces the
`querySelectorAll` + `classList.toggle` loop.

```javascript
bw.mount('#app', { t: 'div', c: [
  { t: 'div', a: { id: 'panel', class: 'panel' }, c: 'Panel' },
  { t: 'span', a: { class: 'key' }, c: 'C' }, { t: 'span', a: { class: 'key' }, c: 'E' }
]});
bw.toggleClass('panel', 'open');            // flip
bw.toggleClass('panel', 'open', false);     // force
bw.toggleClass('.key', 'down', true);       // every match
```

**You want to change one value or label.** `bw.patch(id, text)`. Nothing else
is rebuilt. This is also the answer to "my `<input type=range>` loses its drag
when I update the label": patch the label from the `input` event instead of
re-mounting the view.

```javascript
bw.mount('#app', { t: 'p', c: [
  { t: 'input', a: { type: 'range', min: 0, max: 100, value: 40,
    oninput: function(e) { bw.patch('readout', e.target.value + '%'); } } },
  ' ', { t: 'span', a: { id: 'readout' }, c: '40%' }
]});
```

**You want to change an attribute** -- the width of a bar, an `aria-*` flag, a
`src`. Pass a plain object to `bw.patch` and each key becomes an attribute.

```javascript
bw.mount('#app', { t: 'svg', a: { viewBox: '0 0 100 10' }, c: [
  { t: 'rect', a: { id: 'bar', width: 30, height: 10, fill: '#3b82f6' } }
]});
bw.patch('bar', { width: 72, 'aria-valuenow': 72 });
```

**You want to replace what is inside an element with new content.** Still
`bw.patch`: a TACO or an array replaces the children, and whatever they replace
is unmounted properly.

```javascript
bw.mount('#app', { t: 'div', a: { id: 'info' }, c: 'loading' });
bw.patch('info', { t: 'em', c: 'done' });
bw.patch('info', [{ t: 'b', c: 'done' }, ' in 2s']);
```

**You want to update a list whose items come and go** without losing the
`<input>` someone is typing into. `bw.syncChildren` keys the children; items
that stay keep their DOM nodes and only move.

```javascript
var list = bw.mount('#app', { t: 'ul' });
function show(people) {
  bw.syncChildren(list, people, {
    key:    function(p) { return p.name; },
    create: function(p) { return { t: 'li', c: [{ t: 'span', c: p.name }, ' ', { t: 'input', a: { value: '' } }] }; },
    update: function(li, p) { bw.patch(li.firstElementChild, p.name); }
  });
}
show(data);
show(data.slice().reverse());   // same <li> nodes, reordered
```

**You want to empty a container.** `bw.clear(ref)`. Not `innerHTML = ''`,
which drops children without running their unmount hooks.

```javascript
bw.mount('#app', { t: 'ul', a: { id: 'log' }, c: [{ t: 'li', c: 'a' }, { t: 'li', c: 'b' }] });
bw.clear('log');
bw.append('log', { t: 'li', c: 'fresh' });
```

**You want to swap one element for another.** `bw.replace(ref, taco)`. The
old element is unmounted, the new one takes its place.

```javascript
bw.mount('#app', { t: 'div', c: [{ t: 'p', a: { id: 'old' }, c: 'before' }] });
bw.replace('old', { t: 'p', a: { id: 'new' }, c: 'after' });
```

**You want to rebuild a whole component from its state.** `bw.refresh(el)`
re-runs its `o.render`. This is the most expensive update on the page; reach for
it when most of the component changed, not for one label.

```javascript
var counter = bw.mount('#app', {
  t: 'div',
  o: {
    state: { n: 0 },
    render: function(el, s) { bw.DOM(el, { t: 'b', c: 'n = ' + s.n }); }
  }
});
counter._bw_state.n = 5;
bw.refresh(counter);
```

## Find it

**You want an element.** `bw.el(ref)` takes an id, a selector, a `bw_uuid_*`
token or the element itself and returns one element or null. `bw.$(selector)`
always returns an array. Neither warns on a miss, because a miss is an answer.

```javascript
bw.mount('#app', { t: 'div', c: [{ t: 'p', a: { id: 'status', class: 'line' }, c: 'ok' }] });
var one = bw.el('status');          // by id
var same = bw.el('#status');        // by selector
var all = bw.$('.line');            // array, possibly empty
bw.patch(one, same === one && all.length === 1 ? 'found' : 'lost');
```

**You want to find and change in one call.** The second argument of `bw.el`
and `bw.$` applies: a string sets text, a TACO or array replaces content, a
function runs once per element.

```javascript
bw.mount('#app', { t: 'div', c: [
  { t: 'span', a: { class: 'status' }, c: '?' }, { t: 'span', a: { class: 'status' }, c: '?' }
]});
bw.$('.status', 'Online');
bw.$('.status', function(el) { bw.addClass(el, 'lit'); });
```

**You want to know what a verb will do when the target is missing.** Every
verb that acts (`mount`, `append`, `replace`, `patch`, `remove`, `clear`,
`refresh`, `emit`, `on`, ...) accepts the same four target forms, warns
`bw.<verb>: target not found` on a miss, and returns null. You never need to
pre-check with `bw.el` before acting.

## Components

**You want to call a method on a component.** The element `bw.mount` returns
carries `el.bw`; methods from `o.handle` and setters from `o.slots` live there.
`bw.message(ref, action, data)` does the same by id, which is how a server or
another component reaches it.

```javascript
var card = bw.mount('#app', bw.makeCard({ id: 'stats', title: 'Stats', content: '0' }));
card.bw.setTitle('Revenue');
bw.message('stats', 'setContent', { t: 'b', c: '$42k' });
```

**You want an id or a class on a built-in component.** Every `make*()` factory
takes `id` and `class`. The id lands on the element you will address later;
the class is merged with the component's own. The prop is `class`, the HTML
name, the same key TACO uses in `a` -- so factory props and `a` spread into
each other without a rename.

```javascript
bw.mount('#app', { t: 'div', c: [
  bw.makeButton({ id: 'save', class: 'wide', text: 'Save' }),
  bw.makeAlert({ id: 'msg', class: 'mt', content: 'Saved', variant: 'success' })
]});
bw.patch('msg', 'Saved twice');
bw.toggleClass('save', 'is_busy', true);
```

**You want a toggle button** -- a thing that stays pressed. `makeButton` has a
`toggle` mode with `aria-pressed` and a pressed style; the handle flips it.

```javascript
var btn = bw.mount('#app', bw.makeButton({
  text: 'Mute', toggle: true, pressed: false,
  onToggle: function(pressed) { bw.patch('state', pressed ? 'muted' : 'live'); }
}));
bw.append('#app', { t: 'span', a: { id: 'state' }, c: 'live' });
btn.bw.setPressed(true);
```

**You want a tooltip or help bubble.** `bw.makeTooltip` wraps a trigger and
shows on hover and focus with `role="tooltip"`. It is a BCCL component, so it
is in the full build and not in lean -- two apps hand-rolled a `data-help`
system because they were on lean and did not know it existed.

```javascript
bw.mount('#app', bw.makeTooltip({
  content: { t: 'button', c: 'Export' },
  text: 'Download as CSV',
  placement: 'right'
}));
```

**You want a table that sorts and pages.** `bw.makeTable` is in both builds,
and its handle updates it in place -- `setData`, `sort`, `update` -- so you do
not re-mount the table when the data changes.

```javascript
var table = bw.mount('#app', bw.makeTable({ data: data, sortable: true }));
table.bw.sort('age');
table.bw.setData(data.slice(0, 1));
```

Every component, its props and its handle methods:
[component-cheatsheet.md](component-cheatsheet.md).

## Style it

**You want CSS written in JavaScript.** `bw.css` turns `{ selector: { prop:
value } }` into a stylesheet; `bw.injectCSS` puts it in a `<style>`. Same `id`
with `append: false` replaces an earlier injection, which is how you re-theme.

```javascript
bw.injectCSS(bw.css({
  '.panel': { padding: '1rem', borderRadius: '6px' },
  '.panel.open': { display: 'block' },
  '@media (max-width: 600px)': { '.panel': { padding: '0.5rem' } }
}), { id: 'app_css', append: false });
```

**You want the same selector twice, or a guaranteed order.** An object cannot
repeat a key. Pass an array of rule objects.

```javascript
var css = bw.css([
  { '.btn': { padding: '4px 8px' } },
  { '.btn': { borderRadius: '4px' } }
]);
bw.injectCSS(css, { id: 'btn_css' });
```

**You want your own design tokens.** Custom properties are fine in application
CSS; `bw.css` passes `--names` through untouched. Switch themes by attribute.

```javascript
bw.injectCSS(bw.css({
  ':root': { '--bg': '#0f1115', '--fg': '#e6e6e6' },
  '[data-theme="light"]': { '--bg': '#ffffff', '--fg': '#111111' },
  'body': { background: 'var(--bg)', color: 'var(--fg)' }
}), { id: 'tokens' });
```

The library's own source defines no custom properties and emits no `data-*`;
that rule is for `src/`, not for your app.

**You want colors that match a theme without hand-picking hex.**
`bw.loadStyles` with two or three seed colors generates a palette with hover,
active, border and text-on variants for every role, plus the structural CSS for
the built-in components. Use the palette object in your own `bw.css`.

```javascript
var styles = bw.loadStyles({ primary: '#2d6a4f', secondary: '#d4a373' });
var p = styles.palette;
bw.injectCSS(bw.css({
  '.sidebar': { background: p.surfaceAlt, borderRight: '1px solid ' + p.light.border }
}), { id: 'site' });
```

**You want dark mode.** Every palette has an alternate. `bw.toggleThemeMode()`
switches; `alternate: {...}` in the config seeds the dark side yourself when
the derived one is not what you want. The body gets `color-scheme` so native
controls and scrollbars follow.

```javascript
bw.loadStyles({ primary: '#6366f1', alternate: { primary: '#8284ed', background: '#0b0e14' } });
bw.toggleThemeMode();
bw.mount('#app', { t: 'p', c: 'dark' });
```

**You want Tailwind-style shorthand.** The optional `bitwrench-util-css`
plugin installs `bw.u`, which turns tokens into a style object, a CSS string or
class names. It is a separate file loaded after bitwrench, so it costs the core
nothing.

```javascript
// <script src=".../dist/bitwrench-util-css.umd.min.js"></script> after bitwrench
bw.mount('#app', { t: 'div', a: { style: bw.u('flex gap4 p4 alignCenter') }, c: [
  { t: 'span', c: 'left' }, { t: 'span', c: 'right' }
]});
```

## Wire it up

**You want two components to talk without knowing each other.** `bw.pub` and
`bw.sub`. Pass the element as the third argument to `bw.sub` and the
subscription dies with the element.

```javascript
var badge = bw.mount('#app', { t: 'span', a: { id: 'count' }, c: '0' });
bw.sub('cart:changed', function(d) { bw.patch('count', String(d.count)); }, badge);
bw.pub('cart:changed', { count: 3 });
```

**You want a value computed from other values.** `bw.derive` publishes
`fn(...latest)` on a new topic whenever any input topic publishes.

```javascript
bw.mount('#app', { t: 'span', a: { id: 'total' }, c: '0' });
bw.derive(['price', 'qty'], function(price, qty) { return price * qty; }, 'total');
bw.sub('total', function(t) { bw.patch('total', String(t)); });
bw.pub('price', 4); bw.pub('qty', 5);
```

**You want an event scoped to one element rather than a global topic.**
`bw.emit(ref, name, data)` dispatches a DOM event prefixed `bw:`; `bw.on(ref,
name, fn)` listens and hands the handler `(detail, event)`. Both take the usual
four target forms; `bw.on` returns the function that removes the listener.

```javascript
bw.mount('#app', { t: 'div', a: { id: 'widget' }, c: 'widget' });
var off = bw.on('widget', 'statechange', function(d) { bw.patch('widget', 'count ' + d.count); });
bw.emit('widget', 'statechange', { count: 42 });
off();
```

**You want pages, with URLs.** `bw.router` maps paths to functions that return
TACO. Hash mode by default; `params` for `:id` segments; `'*'` for not found.

```javascript
bw.router({
  target: '#app',
  routes: {
    '/':          function() { return { t: 'h1', c: 'Home' }; },
    '/users/:id': function(params) { return { t: 'h1', c: 'User ' + params.id }; },
    '*':          function() { return { t: 'h1', c: 'Not found' }; }
  }
});
```

Guards, history mode and pub/sub hooks: [routing.md](routing.md).

**You want the logic somewhere other than the browser** -- a C++ program on a
microcontroller, a Python process, a shell script. bwserve: the page is four
calls, the server sends TACO and patches over SSE, clicks come back as
actions. The device never sends code or CSS. See [bwserve.md](bwserve.md) and
the [tutorial](tutorial-bwserve.md).

## Check it and ship it

**You want to know a generated TACO is well formed** before it reaches a page --
from a template, an LLM, a wire frame. `verify(taco)` returns findings;
`verify.assert(taco)` throws. It is a separate module, not in either build,
never in production.

```javascript
var findings = verify({ t: 'h1', cc: 'typo' });
bw.mount('#app', { t: 'pre', c: findings[0].code + ' -> ' + findings[0].hint });
```

**You want to drive a live page from a terminal** -- inspect state, click,
screenshot -- when a headless browser cannot (Web MIDI, hardware, a page on a
device). `bwcli attach` is a REPL on any bitwrench page:
[bw-attach.md](bw-attach.md). From the browser console, the
`bitwrench-debug.js` script installs the same tools as `bwd.*`.

**You want to know which file to load.** The table in
[core-api.md](core-api.md#what-is-in-which-build). In one line: the full build
is everything; lean is everything except the 47 BCCL component factories, and
it still has the router, pub/sub, `patch`, `syncChildren`, the class verbs and
the table factories.

**You want to convert, theme or serve files from the command line.** `bwcli`
turns Markdown into themed pages, applies presets, verifies TACO and pipes any
program into a bwserve backend: [cli.md](cli.md).

## Not on this page

- Keeping state inside a component and rendering from it: [state-management.md](state-management.md)
- The lifecycle hooks and why `onclick` goes in `a`, not `o.mounted`: [component-lifecycle.md](component-lifecycle.md)
- What bitwrench is, and why it looks like this: [thinking-in-bitwrench.md](thinking-in-bitwrench.md)
