# Tutorial: Building a Website with Bitwrench

This tutorial walks through building a complete, styled website using bitwrench — from a blank HTML file to a multi-section landing page with theme, navigation, and responsive layout.

## What you'll build

A product landing page with:
- Navigation bar
- Hero section with call-to-action
- Feature grid
- Pricing cards
- Contact form with handle-based validation
- Footer

Total code: ~120 lines of JavaScript. No build step.

## Step 1: Start with a blank page

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Product</title>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    // We'll build everything here
    bw.loadStyles();
    bw.DOM('#app', { t: 'h1', c: 'Hello bitwrench!' });
  </script>
</body>
</html>
```

Open it in a browser. You should see styled "Hello bitwrench!" text.

## Step 2: Add a theme

Replace the script contents with:

```javascript
bw.loadStyles();
bw.loadStyles({
  primary: '#2563eb',
  secondary: '#7c3aed',
  spacing: 'normal',
  radius: 'md'
});

bw.DOM('#app', { t: 'h1', c: 'Themed heading' });
```

Every bitwrench component now uses your brand colors automatically.

## Step 3: Build the navigation

```javascript
var nav = bw.makeNavbar({
  brand: 'Acme',
  items: [
    { text: 'Features', href: '#features' },
    { text: 'Pricing', href: '#pricing' },
    { text: 'Contact', href: '#contact' }
  ]
});
```

`makeNavbar()` returns a TACO object — plain data, not DOM. Nothing is rendered yet.

## Step 4: Build the hero section

```javascript
var hero = bw.makeHero({
  title: 'Ship faster with Acme',
  subtitle: 'The developer toolkit that gets out of your way.',
  actions: [
    bw.makeButton({ text: 'Get Started', variant: 'primary', size: 'lg' }),
    bw.makeButton({ text: 'Learn More', variant: 'secondary', size: 'lg' })
  ]
});
```

## Step 5: Build the feature grid

```javascript
var features = bw.makeFeatureGrid({
  columns: 3,
  features: [
    { icon: 'bolt',   title: 'Fast',      desc: 'No build step, no virtual DOM. Just objects and functions.' },
    { icon: 'shield', title: 'Reliable',   desc: '100% test coverage. Works in IE11 through modern browsers.' },
    { icon: 'code',   title: 'Simple',     desc: 'One file, ~40KB gzipped. Zero dependencies. Learn in an afternoon.' }
  ]
});
```

## Step 6: Add pricing cards

```javascript
var pricing = {
  t: 'section', a: { id: 'pricing', style: 'padding: 3rem 1rem; text-align: center' },
  c: [
    { t: 'h2', c: 'Pricing' },
    {
      t: 'div', a: { style: 'display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem' },
      c: [
        bw.makeCard({ title: 'Free', content: '$0/mo -- For personal projects', footer: bw.makeButton({ text: 'Start Free', variant: 'secondary' }) }),
        bw.makeCard({ title: 'Pro',  content: '$29/mo -- For teams', footer: bw.makeButton({ text: 'Subscribe', variant: 'primary' }) }),
        bw.makeCard({ title: 'Enterprise', content: 'Custom -- Contact us', footer: bw.makeButton({ text: 'Contact Sales', variant: 'secondary' }) })
      ]
    }
  ]
};
```

This mixes `make*()` components with raw TACO for layout. Both work together — TACO objects nest freely.

## Step 7: Add a contact form

```javascript
var contact = {
  t: 'section', a: { id: 'contact', style: 'padding: 3rem 1rem; max-width: 600px; margin: 0 auto' },
  c: [
    { t: 'h2', c: 'Contact Us' },
    bw.makeForm({
      children: [
        bw.makeFormGroup({ label: 'Name',    input: bw.makeInput({ type: 'text',  placeholder: 'Jane Smith' }) }),
        bw.makeFormGroup({ label: 'Email',   input: bw.makeInput({ type: 'email', placeholder: 'jane@example.com' }) }),
        bw.makeFormGroup({ label: 'Message', input: bw.makeTextarea({ placeholder: 'How can we help?' }) }),
        bw.makeButton({ text: 'Send Message', type: 'submit', variant: 'primary' })
      ]
    })
  ]
};
```

## Step 7b: Add form validation with handles

The contact form above works, but there's no feedback when the user submits. Use `o.slots` for a status message and `o.handle` for show/clear methods -- no full re-render needed, so the form inputs keep their values and focus:

```javascript
var contactForm = {
  t: 'section', a: { id: 'contact', style: 'padding: 3rem 1rem; max-width: 600px; margin: 0 auto' },
  c: [
    { t: 'h2', c: 'Contact Us' },
    { t: 'div', a: { class: 'status', style: 'display:none' }, c: '' },
    bw.makeForm({
      children: [
        bw.makeFormGroup({ label: 'Name',    input: bw.makeInput({ type: 'text',  placeholder: 'Jane Smith' }) }),
        bw.makeFormGroup({ label: 'Email',   input: bw.makeInput({ type: 'email', placeholder: 'jane@example.com' }) }),
        bw.makeFormGroup({ label: 'Message', input: bw.makeTextarea({ placeholder: 'How can we help?' }) }),
        bw.makeButton({ text: 'Send Message', type: 'submit', variant: 'primary' })
      ],
      onsubmit: function(e) {
        e.preventDefault();
        // Access el.bw via the mounted element
        var el = e.target.closest('[class*="bw_uuid"]') || e.target.parentElement;
        if (el && el.bw) {
          el.bw.showStatus('Message sent! We will reply within 24 hours.');
        }
      }
    })
  ],
  o: {
    slots: { status: '.status' },
    handle: {
      showStatus: function(el, msg) {
        var s = el.querySelector('.status');
        s.style.display = 'block';
        s.textContent = msg;
        s.style.cssText = 'padding:0.75rem;border-radius:8px;background:#d4edda;color:#155724;margin-bottom:1rem';
      },
      clearStatus: function(el) {
        var s = el.querySelector('.status');
        s.style.display = 'none';
        s.textContent = '';
      }
    }
  }
};
var formEl = bw.mount('#contact-wrapper', contactForm);
// Can also call from outside: formEl.bw.showStatus('Saved!');
```

The key insight: `o.handle` methods update just the status div. The form inputs -- and any text the user has typed -- are untouched. This is why handles exist: targeted updates without re-render side effects.

## Step 8: Compose and render

Now combine everything into one `bw.DOM()` call:

```javascript
bw.DOM('#app', {
  t: 'div', a: { class: 'brand' },  // theme scope class
  c: [
    nav,
    hero,
    { t: 'section', a: { id: 'features', style: 'padding: 3rem 1rem' }, c: [
      { t: 'h2', a: { style: 'text-align: center' }, c: 'Features' },
      features
    ]},
    pricing,
    contact,
    { t: 'footer', a: { style: 'text-align: center; padding: 2rem; color: #666' },
      c: '2026 Acme Inc. Built with bitwrench.' }
  ]
});
```

One function call, one mount point, one render. The entire page is described as a tree of plain objects.

## Step 9: Add custom CSS

Use `bw.css()` for page-specific styles:

```javascript
bw.injectCSS(bw.css({
  '.brand .bw-hero': {
    'text-align': 'center',
    'background': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    'color': '#fff',
    'padding': '5rem 2rem'
  },
  '.brand footer': {
    'border-top': '1px solid #e5e7eb'
  }
}));
```

## The complete file

Putting it all together, the full `index.html` is about 120 lines of JavaScript. No npm, no build tool, no framework CLI. Just one HTML file and one `<script>` tag.

## Converting to a static site with bwcli

You can also write content in Markdown and convert it:

```bash
npm install -g bitwrench
bwcli README.md --theme ocean --standalone -o index.html
```

This produces a self-contained HTML file with the ocean theme baked in — works offline, no CDN needed.

## Next steps

- [Component Library](component-library.md) -- all 50+ `make*()` functions
- [Theming](theming.md) -- customize colors, spacing, and radius
- [State Management](state-management.md) -- add interactivity with `o.state` + `o.render`
- [Routing](routing.md) -- turn this into a multi-page SPA with `bw.router()`
- [bwserve](bwserve.md) -- server-driven dynamic pages
