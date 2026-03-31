# Using Bitwrench with TypeScript

Bitwrench ships TypeScript type definitions in `dist/bitwrench.d.ts`.
You get autocomplete, type checking, and documentation hover in VS Code,
WebStorm, and any TypeScript-aware editor -- no extra packages needed.

## Quick Start

### Install

```bash
npm install bitwrench
```

The `types` field in `package.json` points to `dist/bitwrench.d.ts`,
so TypeScript picks up the types automatically.

### Import Styles

**Default import (full library):**

```typescript
import bw from 'bitwrench';

const card = bw.makeCard({ title: 'Hello', content: 'World' });
bw.DOM('#app', card);
```

**Named imports (tree-shakeable):**

```typescript
import { makeCard, makeButton, makeNav } from 'bitwrench';

const card = makeCard({ title: 'Dashboard', content: 'Stats here' });
```

**CommonJS (Node.js):**

```typescript
const bw = require('bitwrench');

const html = bw.html({ t: 'h1', c: 'Server-rendered' });
```

**UMD (script tag -- no import needed):**

```html
<script src="https://unpkg.com/bitwrench/dist/bitwrench.umd.min.js"></script>
<script>
  // bw is a global. For TS, add a reference comment or declare it:
  bw.DOM('#app', { t: 'p', c: 'Hello from UMD' });
</script>
```

For UMD in a TypeScript file, add a triple-slash reference:

```typescript
/// <reference path="node_modules/bitwrench/dist/bitwrench.d.ts" />
declare var bw: import('bitwrench').Bitwrench;
```

## Core Types

### Taco

The fundamental UI primitive. Every bitwrench component is a `Taco` object.

```typescript
import type { Taco, TacoAttributes, TacoOptions, TacoContent } from 'bitwrench';

const myCard: Taco = {
  t: 'div',
  a: { class: 'bw_card', id: 'stats' },
  c: [
    { t: 'h3', c: 'Revenue' },
    { t: 'p', c: '$1,234' }
  ],
  o: {
    state: { value: 1234 },
    render: (el, state) => {
      el.querySelector('.value')!.textContent = '$' + state!.value;
    }
  }
};
```

**Field summary:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `t`   | `string` | Yes | HTML tag name |
| `a`   | `TacoAttributes` | No | HTML attributes, event handlers, class, style |
| `c`   | `TacoContent` | No | String, number, nested Taco, array, `bw.raw()`, or null |
| `o`   | `TacoOptions` | No | Lifecycle hooks, state, handle methods, slots |

### TacoContent

Content can be many types:

```typescript
// String
const text: Taco = { t: 'p', c: 'Hello' };

// Number (auto-stringified)
const num: Taco = { t: 'span', c: 42 };

// Nested TACO
const nested: Taco = { t: 'div', c: { t: 'em', c: 'italic' } };

// Array of mixed content
const list: Taco = {
  t: 'ul',
  c: [
    { t: 'li', c: 'one' },
    { t: 'li', c: 'two' },
    { t: 'li', c: 'three' }
  ]
};

// Raw HTML (skips escaping)
const raw: Taco = { t: 'div', c: bw.raw('<strong>Pre-escaped</strong>') };
```

### TacoAttributes

```typescript
const button: Taco = {
  t: 'button',
  a: {
    class: ['bw_btn', 'bw_primary'],     // string or string[]
    style: { padding: '8px', color: '#fff' }, // string or object
    disabled: false,                        // boolean attrs
    onclick: (e: Event) => handleClick(e),  // function or string
    'data-id': '123',                       // custom attributes
    'aria-label': 'Submit form'             // ARIA attributes
  },
  c: 'Submit'
};
```

### TacoOptions (Component Handles)

```typescript
const counter: Taco = {
  t: 'div',
  a: { class: 'counter' },
  c: [
    { t: 'span', a: { class: 'count' }, c: '0' },
    { t: 'button', a: { onclick: () => el.bw.increment() }, c: '+' }
  ],
  o: {
    state: { count: 0 },
    handle: {
      increment: (el: HTMLElement) => {
        el._bw_state.count++;
        bw.update(el);
      },
      reset: (el: HTMLElement) => {
        el._bw_state.count = 0;
        bw.update(el);
      }
    },
    slots: {
      count: '.count'   // auto-generates el.bw.setCount() / el.bw.getCount()
    },
    render: (el: HTMLElement, state: any) => {
      el.querySelector('.count')!.textContent = String(state.count);
    },
    mounted: (el: HTMLElement) => {
      console.log('Counter mounted');
    },
    unmount: (el: HTMLElement) => {
      console.log('Counter removed');
    }
  }
};

// Mount and interact through typed handle
const el = bw.mount('#app', counter);
(el as any).bw.increment();
(el as any).bw.setCount('99');
```

## BCCL Component Configs

The `make*()` factories have typed config objects for the most common
components. TypeScript will autocomplete property names and catch typos.

```typescript
import bw from 'bitwrench';
import type { CardConfig, ButtonConfig, TabsConfig, AccordionConfig } from 'bitwrench';

// Card -- typed config catches typos
const card = bw.makeCard({
  title: 'Dashboard',
  content: 'Welcome back',
  footer: 'Last updated: today',
  variant: 'primary',
  shadow: true
});
// bw.makeCard({ label: 'Oops' })  // TS error: 'label' not in CardConfig

// Button
const btn = bw.makeButton({
  text: 'Save',
  variant: 'success',
  size: 'lg',
  onclick: () => save()
});

// Tabs
const tabs = bw.makeTabs({
  tabs: [
    { text: 'Overview', content: 'Tab 1 content', active: true },
    { text: 'Details', content: { t: 'div', c: 'Tab 2 TACO content' } }
  ]
});

// Accordion -- note: uses title/content, NOT label/header/body
const acc = bw.makeAccordion({
  items: [
    { title: 'Section 1', content: 'Content 1' },
    { title: 'Section 2', content: 'Content 2' }
  ]
});
```

## Styles / Theming

```typescript
import bw from 'bitwrench';
import type { StyleConfig, StylesResult, Palette, ColorShades } from 'bitwrench';

// Generate theme from seed colors
const config: StyleConfig = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  background: '#ffffff',
  surface: '#f8fafc'
};

const styles: StylesResult = bw.makeStyles(config);
bw.applyStyles(styles);

// Access palette values
const p: Palette = styles.palette;
const primaryBase: string = p.primary.base;       // '#2563eb'
const primaryHover: string = p.primary.hover;     // derived shade
const bg: string = p.background;                  // plain string (NOT an object)

// Toggle dark/light
bw.toggleStyles();

// Shorthand: generate + apply in one call
bw.loadStyles({ primary: '#dc2626' });

// Structural CSS only (no colors)
bw.loadStyles();
```

**Palette gotcha**: `palette.background`, `palette.surface`, and
`palette.surfaceAlt` are plain strings. All other keys (`primary`,
`secondary`, etc.) are `ColorShades` objects with `.base`, `.hover`,
`.active`, `.light`, `.darkText`, `.border`, `.focus`, `.textOn`.

## Color Utilities

```typescript
const hsl = bw.hexToHsl('#2563eb');       // [221, 83, 53]
const hex = bw.hslToHex([221, 83, 53]);   // '#2563eb'

const lighter = bw.adjustLightness('#2563eb', 20);  // lighten by 20
const mixed = bw.mixColor('#ff0000', '#0000ff', 0.5); // purple
const lum = bw.relativeLuminance('#2563eb');  // 0.0-1.0
const textColor = bw.textOnColor('#2563eb');  // '#fff' or '#000'

const shades: ColorShades = bw.deriveShades('#2563eb');
// { base, hover, active, light, darkText, border, focus, textOn }
```

## Routing

```typescript
import bw from 'bitwrench';
import type { RouterConfig, RouterHandle } from 'bitwrench';

const config: RouterConfig = {
  routes: {
    '/': () => ({ t: 'h1', c: 'Home' }),
    '/user/:id': (params) => ({
      t: 'div',
      c: 'User ' + params.id
    }),
    '*': () => ({ t: 'p', c: '404 Not Found' })
  },
  target: '#app',
  mode: 'hash'
};

const router: RouterHandle = bw.router(config);
router.navigate('/user/42');
console.log(router.current());  // '/user/42'
router.destroy();
```

## Server-Side Rendering

bitwrench works in Node.js. `bw.html()` renders TACO to HTML strings
with no DOM dependency.

```typescript
import bw from 'bitwrench';

// Render TACO to HTML string (Node.js or browser)
const html: string = bw.html({
  t: 'div',
  a: { class: 'card' },
  c: [
    { t: 'h2', c: 'Server Rendered' },
    { t: 'p', c: 'No DOM needed' }
  ]
});

// Generate complete HTML page
const page: string = bw.htmlPage({
  title: 'My App',
  content: { t: 'h1', c: 'Hello' }
});
```

## Extending Types

### Custom component config

```typescript
import type { Taco, ComponentConfig } from 'bitwrench';

interface MyWidgetConfig extends ComponentConfig {
  label: string;
  value: number;
  onChange?: (newValue: number) => void;
}

function makeMyWidget(config: MyWidgetConfig): Taco {
  return {
    t: 'div',
    a: { class: 'my-widget' },
    c: [
      { t: 'label', c: config.label },
      {
        t: 'input',
        a: {
          type: 'number',
          value: String(config.value),
          oninput: (e: Event) => {
            const v = Number((e.target as HTMLInputElement).value);
            if (config.onChange) config.onChange(v);
          }
        }
      }
    ]
  };
}
```

### Adding el.bw types for specific components

The `el.bw` namespace is dynamically populated from `o.handle` and
`o.slots`. TypeScript doesn't know the specific methods at compile time.
You can augment with a cast:

```typescript
interface CardHandle {
  setTitle(v: string): void;
  getTitle(): string;
  setContent(v: string | Taco): void;
  getContent(): string;
}

const el = bw.mount('#app', bw.makeCard({ title: 'Hello' }));
const handle = (el as any).bw as CardHandle;
handle.setTitle('Updated');
```

## tsconfig.json Tips

bitwrench works with any `moduleResolution` setting. Recommended:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

For Node.js (CommonJS):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## What's Not Typed

bitwrench is a JavaScript-first library. Some patterns are inherently
dynamic and don't have specific types:

- **`el.bw.*` methods** -- populated at runtime from `o.handle`/`o.slots`.
  Cast `el.bw` to a custom interface for your components.
- **`bw.apply()` wire protocol messages** -- typed as `Record<string, any>`.
  The bwserve protocol is documented in `dev/bw-client-server.md`.
- **Less common `make*()` configs** -- typed as `ComponentConfig` (open
  object). The most-used components (Card, Button, Tabs, Accordion, Modal,
  Alert, Nav, Input, Carousel, Table) have specific config types.

## FAQ

**Q: Do I need to install `@types/bitwrench`?**
No. Types ship with the package. There is no separate `@types` package.

**Q: Can I use bitwrench without TypeScript?**
Yes. bitwrench is a JavaScript library. TypeScript support is optional.
The `.d.ts` file provides editor autocomplete even in plain `.js` files
if your editor supports it (VS Code does by default).

**Q: Why not write bitwrench in TypeScript?**
bitwrench is designed for zero-toolchain development. You can load it via
`<script>` tag and start building UI -- no compiler, no bundler, no
`tsconfig.json`. TypeScript types are provided for developers who choose
to use TS, without imposing it on everyone.
