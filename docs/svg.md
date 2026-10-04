<!-- doc-test: sequential (this guide builds on helpers defined in earlier blocks) -->

# SVG in bitwrench

SVG is ordinary TACO. There is no SVG mode, no helper to learn, no namespace to
declare: start a tree with `t: 'svg'` and every element inside it is created in
the SVG namespace. Everything else you know still applies -- handlers in `a:`,
state in `o:`, `bw.patch`, `bw.toggleClass`, `bw.css` for styling.

That matters because SVG is where "describe the UI as data" pays off most.
A chart, a diagram, a keyboard, a gauge: these are the places where you have
real data and need real geometry, and where string templates fall apart fastest.

```javascript
bw.mount('#app', {
  t: 'svg', a: { viewBox: '0 0 120 40', width: 240, class: 'badge' },
  c: [
    { t: 'rect', a: { x: 1, y: 1, width: 118, height: 38, rx: 6, fill: 'none', stroke: '#888' } },
    { t: 'text', a: { x: 60, y: 25, 'text-anchor': 'middle' }, c: 'ready' }
  ]
});
```

## Contents

- [The five rules](#the-five-rules)
- [Coordinates: viewBox versus width](#coordinates-viewbox-versus-width)
- [Building shapes from data](#building-shapes-from-data)
- [Styling: classes, not fill attributes](#styling-classes-not-fill-attributes)
- [Interaction: handlers go in `a:`](#interaction-handlers-go-in-a)
- [Updating SVG that is already on the page](#updating-svg-that-is-already-on-the-page)
- [Mixing SVG with components](#mixing-svg-with-components)
- [HTML inside SVG: foreignObject](#html-inside-svg-foreignobject)
- [Accessibility](#accessibility)
- [Recipes](#recipes)
- [Server-driven SVG](#server-driven-svg)
- [Saving and exporting](#saving-and-exporting)
- [Gotchas](#gotchas)

## The five rules

1. **`t: 'svg'` starts an SVG tree.** Children are created with
   `createElementNS`, recursively, with no further ceremony. You do not need
   `xmlns` for `bw.mount()`; include it only when you serialise standalone
   files with `bw.html()`.
2. **Attribute names are written exactly as SVG spells them.** `viewBox`,
   `stroke-width`, `text-anchor`, `stroke-dasharray`, `preserveAspectRatio`.
   Nothing is camelCased for you, and nothing is converted.
3. **`class` works**, so SVG is styled by the same `bw.css()` rules as the rest
   of your page.
4. **Everything in `o:` works**: `state`, `handle`, `slots`, `mounted`,
   `unmount`, UUID addressing. An SVG element can be a component.
5. **`foreignObject` switches back to HTML**, so its children are normal HTML
   elements.

```javascript
var tree = { t: 'svg', a: { viewBox: '0 0 10 10' }, c: { t: 'circle', a: { cx: 5, cy: 5, r: 4 } } };

bw.mount('#app', tree);        // live SVG elements, correct namespace
bw.html(tree);                 // '<svg viewBox="0 0 10 10"><circle .../></svg>'
```

`bw.html()` needs no special handling either: the browser's parser switches
namespaces when it sees `<svg>`.

## Coordinates: viewBox versus width

Put the geometry in `viewBox` and the display size in CSS or `width`. Then your
shape maths stays in whatever units suit the data, and the element scales.

```javascript
// Draw in a 0..100 space, display at whatever the container allows
bw.mount('#app', {
  t: 'svg',
  a: { viewBox: '0 0 100 50', style: 'width:100%;height:auto', role: 'img', 'aria-label': 'Trend' },
  c: { t: 'polyline', a: { points: '0,40 25,22 50,28 75,10 100,16', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 } }
});
```

Two things worth knowing:

- **`stroke-width: 2` means 2 user units**, so it scales with the viewBox. For
  hairlines that stay 1px at any size, add
  `vector-effect: 'non-scaling-stroke'`.
- **`preserveAspectRatio: 'none'`** lets a sparkline stretch to its container
  without letterboxing. Use it deliberately; it distorts circles and text.

## Building shapes from data

This is the part that makes SVG-as-objects worth it: geometry is arithmetic,
and arithmetic is JavaScript. No template language is involved.

```javascript
function barChart(values, { w = 200, h = 60, gap = 2 } = {}) {
  var max = Math.max.apply(null, values) || 1;
  var bw_ = (w - gap * (values.length - 1)) / values.length;
  return {
    t: 'svg', a: { viewBox: '0 0 ' + w + ' ' + h, style: 'width:100%;height:auto' },
    c: values.map(function(v, i) {
      var bh = Math.round((v / max) * (h - 2));
      return { t: 'rect', a: {
        x: Math.round(i * (bw_ + gap)), y: h - bh, width: Math.round(bw_), height: bh,
        class: 'bar', rx: 1
      }, c: { t: 'title', c: String(v) } };     // native tooltip, no JS
    })
  };
}

bw.mount('#chart', barChart([3, 9, 5, 12, 8, 6]));
```

A reusable SVG component is just a function returning TACO -- the same as any
other bitwrench component. Keep it pure: take data and options, return objects,
touch no DOM. That keeps it usable with `bw.html()` for server rendering and
with `bw.mount()` in the browser.

## Styling: classes, not fill attributes

Put presentation in CSS so a theme change does not mean re-rendering your
shapes. SVG has its own property names (`fill`, `stroke`), and they work in
`bw.css()` like any others.

```javascript
var styles = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' });
var p = styles.palette;

bw.injectCSS(bw.css({
  '.bar':        { fill: p.primary.base, transition: 'fill 150ms ease-out' },
  '.bar:hover':  { fill: p.primary.hover },
  '.bar.warn':   { fill: p.warning.base },
  '.axis':       { stroke: p.light.border, 'stroke-width': 1 },
  '.label':      { fill: p.dark.base, 'font-size': '10px', 'pointer-events': 'none' }
}), { id: 'chart_css' });
```

- **`currentColor`** is the cheapest theming trick in SVG: set `color` on an
  ancestor and use `fill: 'currentColor'` on the shape, and the icon follows
  its surroundings, including dark mode.
- **`pointer-events: 'none'`** on text and decorations means clicks land on the
  shape underneath. This is how you keep hit targets sane.

## Interaction: handlers go in `a:`

Handlers belong in the TACO, exactly as in HTML. Do not mount the SVG and then
attach listeners to it -- that is the one pattern the docs warn about
everywhere else, and it is no different here.

```javascript
function swatch(color, onPick) {
  return { t: 'rect', a: {
    width: 20, height: 20, fill: color, class: 'swatch',
    tabindex: 0, role: 'button', 'aria-label': 'Pick ' + color,
    onclick: function() { onPick(color); },
    onkeydown: function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(color); } }
  } };
}

bw.mount('#app', {
  t: 'svg', a: { viewBox: '0 0 70 20', width: 210 },
  c: ['#e63946', '#457b9d', '#2a9d8f'].map(function(c, i) {
    var s = swatch(c, function(picked) { bw.patch('picked', 'picked ' + picked); });
    s.a.x = i * 25;
    return s;
  })
});
bw.append('#app', { t: 'p', a: { id: 'picked' }, c: 'pick a colour' });
```

For many small targets, one delegated handler on the root is less work than a
handler per node -- and it keeps working when you add or remove shapes. Give
each shape an id and read it back from the event:

```javascript
bw.mount('#app', {
  t: 'svg', a: { viewBox: '0 0 100 20', width: 300,
    onclick: function(e) {
      var hit = e.target.closest ? e.target.closest('.cell') : null;
      if (hit) bw.patch('out', 'cell ' + hit.id.slice(5));   // 'cell_2' -> '2'
    } },
  c: [0, 1, 2, 3].map(function(i) {
    return { t: 'rect', a: { id: 'cell_' + i, x: i * 25, width: 24, height: 20, class: 'cell' } };
  })
});
bw.append('#app', { t: 'p', a: { id: 'out' }, c: '-' });
```

**Addressing is ids and classes, not `data-*`.** bitwrench itself emits no
`data-*` attributes -- identity is a `bw_uuid_*` class, state is a class, and
anything you need to look up has an id. Nothing stops you using `data-*` in
your own markup, and `data-testid` for a test harness is sensible, but an
element you address from code is clearer with an id, and it keeps your markup
consistent with the library's.

## Updating SVG that is already on the page

The whole point of building SVG as elements rather than a string is that you
can change it afterwards. Cheapest first:

| Change | Call | Cost |
|---|---|---|
| A visual state (on/off, selected, error) | `bw.toggleClass(ref, 'down', isDown)` | No node touched |
| A number or label | `bw.patch('readout', '42%')` | One text node |
| A geometric attribute | `bw.patch(ref, { width: 120 })` | One attribute |
| A series whose points come and go | `bw.syncChildren(svgEl, data, {key, create, update})` | Kept nodes move |
| A different picture entirely | `bw.mount(hostEl, newSvgTaco)` | Full rebuild |

```javascript
// 1. State as a class -- nothing is rebuilt, so focus and transitions survive
bw.mount('#app', { t: 'svg', a: { viewBox: '0 0 40 20', width: 120 }, c: [
  { t: 'rect', a: { id: 'led', width: 40, height: 20, class: 'led' } }
]});
bw.toggleClass('led', 'on', true);

// 2. Attribute patch: a plain object (no `t`) sets attributes
bw.patch('led', { width: 60 });

// 3. Text patch
bw.mount('#gauge', { t: 'svg', a: { viewBox: '0 0 60 20', width: 180 },
  c: { t: 'text', a: { id: 'readout', x: 30, y: 14, 'text-anchor': 'middle' }, c: '0%' } });
bw.patch('readout', '42%');
```

`bw.syncChildren()` is the one to reach for when the *set* of shapes changes --
a live series, a list of markers, notes held on a keyboard. Keys that stay keep
their nodes, so transitions continue and nothing flickers:

```javascript
var svgEl = bw.mount('#series', { t: 'svg', a: { viewBox: '0 0 100 30', style: 'width:100%' } });

function draw(points) {
  bw.syncChildren(svgEl, points, {
    key:    function(p) { return String(p.id); },
    create: function(p) { return { t: 'circle', a: { cx: p.x, cy: p.y, r: 3, class: 'pt' } }; },
    update: function(el, p) { bw.patch(el, { cx: p.x, cy: p.y }); }
  });
}

draw([{ id: 'a', x: 10, y: 15 }, { id: 'b', x: 40, y: 8 }]);
draw([{ id: 'b', x: 45, y: 10 }, { id: 'c', x: 80, y: 20 }]);   // 'a' removed, 'b' moved, 'c' added
```

Re-mounting the whole `<svg>` is always correct and sometimes the clearest
thing to do -- for a small static chart, just rebuild it. Avoid it when
something inside has state the user can see: focus, a drag in progress, a CSS
transition mid-flight.

## Mixing SVG with components

An SVG tree is a TACO, so it goes anywhere a TACO goes: in a card's content, a
button's label, a table cell, a list item.

```javascript
bw.mount('#app', bw.makeCard({
  title: 'Throughput',
  content: [
    barChart([4, 8, 6, 11, 7]),
    { t: 'p', a: { class: 'bw_text_muted' }, c: 'Last five minutes' }
  ],
  footer: bw.makeButton({ text: 'Refresh', variant: 'primary', onclick: function() {} })
}));
```

An icon inside a button is the same idea -- and `currentColor` makes it inherit
the button's text colour, including in the alternate palette:

```javascript
var icon = { t: 'svg', a: { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
  c: { t: 'path', a: { d: 'M8 1v14M1 8h14', stroke: 'currentColor', 'stroke-width': 2, fill: 'none' } } };

bw.mount('#app', { t: 'button', a: { class: 'bw_bccl_btn bw_primary' }, c: [icon, ' Add row'] });
```

Table cells accept TACO too, so a sparkline per row is a `render` away:

```javascript
bw.mount('#app', bw.makeTable({
  data: [{ host: 'web-1', load: [2, 5, 3, 8] }, { host: 'web-2', load: [7, 6, 9, 4] }],
  columns: [
    { key: 'host', label: 'Host' },
    { key: 'load', label: 'Load', render: function(v) { return barChart(v, { w: 80, h: 20 }); } }
  ]
}));
```

## HTML inside SVG: foreignObject

Text wrapping, form controls and rich content are HTML's job. `foreignObject`
puts an HTML subtree inside the SVG coordinate system, and bitwrench switches
namespaces back automatically:

```javascript
bw.mount('#app', {
  t: 'svg', a: { viewBox: '0 0 200 80', width: 400 },
  c: [
    { t: 'rect', a: { width: 200, height: 80, fill: '#f3f4f6' } },
    { t: 'foreignObject', a: { x: 10, y: 10, width: 180, height: 60 },
      c: { t: 'div', a: { style: 'font: 12px system-ui' }, c: [
        { t: 'strong', c: 'Wrapped HTML' },
        { t: 'p', c: 'Real paragraphs, real line breaking, inside the drawing.' }
      ]} }
  ]
});
```

Use it for prose and inputs. Do not use it for shapes: a `rect` is cheaper than
a styled `div`, and it exports cleanly.

## Accessibility

SVG is invisible to assistive technology unless you say what it is.

- **Decorative** (an icon next to a label that already says it):
  `'aria-hidden': 'true'`.
- **Informative** (a chart, a diagram): `role: 'img'` plus
  `'aria-label': 'CPU load, last hour'`. A short label beats a long one.
- **Interactive** children need `tabindex: 0`, a `role`, an `aria-label`, and a
  keyboard handler -- see the swatch example above. A `<rect>` is not a button
  until you make it one.
- A `<title>` child gives a native tooltip on hover and is read by screen
  readers, which is why the bar chart above includes one.

```javascript
bw.mount('#app', { t: 'svg', a: { viewBox: '0 0 100 20', role: 'img', 'aria-label': 'Queue depth, steady' },
  c: { t: 'polyline', a: { points: '0,15 50,12 100,13', fill: 'none', stroke: 'currentColor' } } });
```

## Recipes

### Progress ring

`stroke-dasharray` plus `stroke-dashoffset` on a circle is a progress ring. The
arithmetic is the circumference, and updating it is one attribute patch.

```javascript
function ring(pct, { size = 48, stroke = 6 } = {}) {
  var r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return {
    t: 'svg', a: { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size,
                   role: 'img', 'aria-label': pct + '% complete' },
    c: [
      { t: 'circle', a: { cx: size / 2, cy: size / 2, r: r, fill: 'none', stroke: '#e5e7eb', 'stroke-width': stroke } },
      { t: 'circle', a: { id: 'ring_arc', cx: size / 2, cy: size / 2, r: r, fill: 'none',
          stroke: 'currentColor', 'stroke-width': stroke, 'stroke-linecap': 'round',
          'stroke-dasharray': c.toFixed(1),
          'stroke-dashoffset': (c * (1 - pct / 100)).toFixed(1),
          transform: 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')' } }
    ]
  };
}

bw.mount('#app', ring(35));
// later, no rebuild:
var r = (48 - 6) / 2, circ = 2 * Math.PI * r;
bw.patch('ring_arc', { 'stroke-dashoffset': (circ * (1 - 70 / 100)).toFixed(1) });
```

### Gauge needle

```javascript
function gauge(value, { min = 0, max = 100 } = {}) {
  var t = (value - min) / (max - min), angle = -90 + t * 180;
  return { t: 'svg', a: { viewBox: '0 0 100 55', width: 200, role: 'img', 'aria-label': 'Gauge at ' + value },
    c: [
      { t: 'path', a: { d: 'M10 50 A40 40 0 0 1 90 50', fill: 'none', stroke: '#e5e7eb', 'stroke-width': 8 } },
      { t: 'line', a: { id: 'needle', x1: 50, y1: 50, x2: 50, y2: 16, stroke: 'currentColor', 'stroke-width': 3,
          'stroke-linecap': 'round', transform: 'rotate(' + angle.toFixed(1) + ' 50 50)' } }
    ]};
}
bw.mount('#app', gauge(42));
bw.patch('needle', { transform: 'rotate(30 50 50)' });     // move it later
```

### A clickable keyboard (state as a class)

The pattern worth copying: geometry from data, handlers in `a:`, and per-key
state driven by `bw.toggleClass` rather than a redraw.

```javascript
var BLACK = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };

function keyboard(lo, hi, onPress) {
  var whites = [], blacks = [], x = 0;
  for (var n = lo; n <= hi; n++) {
    var pc = n % 12;
    if (BLACK[pc]) {
      blacks.push({ t: 'rect', a: { x: x - 5, y: 0, width: 10, height: 36, class: 'key black',
        id: 'key_' + n, onpointerdown: onPress && function(e) { onPress(+e.target.id.slice(4)); } } });
    } else {
      whites.push({ t: 'rect', a: { x: x, y: 0, width: 15, height: 60, class: 'key white',
        id: 'key_' + n, onpointerdown: onPress && function(e) { onPress(+e.target.id.slice(4)); } } });
      x += 16;
    }
  }
  return { t: 'svg', a: { viewBox: '0 0 ' + x + ' 60', style: 'width:100%;height:auto' },
           c: whites.concat(blacks) };      // blacks last: they paint on top
}

bw.injectCSS(bw.css({
  '.key.white': { fill: '#fff', stroke: '#333' },
  '.key.black': { fill: '#222' },
  '.key.down':  { fill: '#ffd166' }
}), { id: 'kbd_css' });

bw.mount('#app', keyboard(60, 72, function(n) { bw.toggleClass('key_' + n, 'down'); }));

// driving it from elsewhere (MIDI, a sequencer, a test):
bw.toggleClass('#app .key', 'down', false);   // all off, one call
bw.toggleClass('key_64', 'down', true);       // light one up
```

### Annotated diagram

Lay out boxes from data, draw connectors between their known coordinates, and
keep labels non-interactive so clicks hit the boxes.

```javascript
function flow(steps) {
  var W = 60, GAP = 24, H = 28;
  return { t: 'svg', a: { viewBox: '0 0 ' + (steps.length * (W + GAP)) + ' 40', style: 'width:100%' },
    c: steps.flatMap(function(s, i) {
      var x = i * (W + GAP);
      var node = [
        { t: 'rect', a: { x: x, y: 6, width: W, height: H, rx: 4, class: 'node', id: 'step_' + i } },
        { t: 'text', a: { x: x + W / 2, y: 24, 'text-anchor': 'middle', class: 'label' }, c: s }
      ];
      if (i) node.unshift({ t: 'line', a: { x1: x - GAP, y1: 20, x2: x, y2: 20, class: 'axis',
                                            'marker-end': 'url(#arrow)' } });
      return node;
    })
  };
}

bw.mount('#app', flow(['parse', 'create', 'mount']));
bw.addClass('step_1', 'active');
```

## Server-driven SVG

Because an SVG tree is just data, a server can send one. bwserve pushes TACO
over SSE, so a Python or Go service can draw into a browser without a client
build step, and can update one attribute later rather than resending the
picture:

<!-- doc-test: skip (server-side snippet: `client` is a connected bwserve client) -->
```javascript
// server side (Node): push a chart, then move one bar
client.mount('#chart', { t: 'svg', a: { viewBox: '0 0 100 30' },
  c: [{ t: 'rect', a: { id: 'b1', width: 20, height: 30, fill: '#336699' } }] });
client.patch('b1', { height: 12, y: 18 });
```

The same applies to `bw.html()` on a server with no browser at all: render the
SVG to a string, inline it in a page or write it to a file.

## Saving and exporting

`bw.html()` gives you the markup, so exporting is a string away. Add `xmlns`
when the file must stand alone:

```javascript
var chart = barChart([3, 7, 5]);
chart.a.xmlns = 'http://www.w3.org/2000/svg';
var svgText = bw.html(chart);          // write to a file, email it, inline it
```

In a browser, `bw.saveClientFile('chart.svg', svgText)` offers it as a download; from the CLI,
`bwcli` can render a page containing it. For a raster copy of what a live page
looks like, `client.screenshot()` over bwserve goes through html2canvas, which
renders inline SVG.

## Gotchas

- **Attribute names are case-sensitive.** `viewBox` works; `viewbox` does not.
  This is the single most common SVG mistake, and it fails silently.
- **`stroke-width` is hyphenated in SVG attributes** but camelCase in a `style`
  object (`{ strokeWidth: 2 }`). Both are fine; do not mix them in one place.
- **Don't build SVG with `bw.raw()`.** A string can't carry handlers, state or
  lifecycle, and it can't be patched later. If you already have SVG markup from
  a designer, `bw.raw()` is a reasonable way to paste it once -- but convert it
  to TACO before you make it interactive.
- **`width`/`height` on `<svg>` are attributes, not CSS.** For responsive
  scaling, set `viewBox` plus `style: 'width:100%;height:auto'`.
- **Text does not wrap.** Use several `<text>` elements, `<tspan>`, or
  `foreignObject`.
- **`xlink:href` is obsolete**; use `href` on `<use>` and `<image>`.
- **Gradients and markers need ids**, and ids are global to the document. Prefix
  them (`chart_arrow`, not `arrow`) or generate them with `bw.uuid()` if the
  component can appear twice on a page.
- **Many nodes are fine; many *updates* are not.** Toggling a class on 500
  elements is cheap; rebuilding 500 elements per animation frame is not. Reach
  for `bw.toggleClass`, `bw.patch` and `bw.syncChildren` before a re-mount.

## See also

- [TACO Format: SVG](taco-format.md#svg) -- the short version
- [Core API Card](core-api.md) -- `patch`, `toggleClass`, `syncChildren`, `clear`
- [Theming](theming.md) -- palette values for `fill` and `stroke`
- [State Management](state-management.md) -- when to patch, sync, or re-render
- [Live SVG page](https://deftio.github.io/bitwrench/pages/18-svg.html) -- the same material, editable in the browser
