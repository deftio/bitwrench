#!/usr/bin/env node
/**
 * Build index.html using bitwrench server-side rendering
 * Demonstrates dog-fooding: the project website is built WITH bitwrench
 */

import bw from '../src/bitwrench_v2.js';
import { getAllStyles } from '../src/bitwrench-styles.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'index.html');

// Generate CSS string from default styles
const cssString = bw.css(getAllStyles(), { minify: true });

// Brand colors (teal from the original logo)
const teal = '#006666';
const tealDark = '#004d4d';
const tealLight = '#e0f2f1';
const dark = '#1a1a1a';

// ─── Navbar ──────────────────────────────────────────────────────────────────
const navbar = {
  t: 'nav', a: { class: 'site-nav' },
  c: {
    t: 'div', a: { class: 'nav-inner' },
    c: [
      {
        t: 'a', a: { href: '/', style: 'display:flex;align-items:center;text-decoration:none;gap:0.75rem' },
        c: [
          { t: 'img', a: { src: './images/bitwrench-logo-med.png', alt: 'bitwrench', style: 'height:32px' } },
        ]
      },
      {
        t: 'ul', a: { class: 'nav-links' },
        c: [
          { t: 'li', c: { t: 'a', a: { href: './examples_v2r2/index.html' }, c: 'Examples' } },
          { t: 'li', c: { t: 'a', a: { href: './examples_v2r2/00-taco-srmc-fundamentals.html' }, c: 'Docs' } },
          { t: 'li', c: { t: 'a', a: { href: 'https://github.com/deftio/bitwrench' }, c: 'GitHub' } },
          { t: 'li', c: { t: 'a', a: { href: 'https://www.npmjs.com/package/bitwrench' }, c: 'npm' } },
        ]
      }
    ]
  }
};

// ─── Intro ──────────────────────────────────────────────────────────────────
const intro = {
  t: 'section', a: { class: 'intro' },
  c: {
    t: 'div', a: { class: 'container' },
    c: [
      { t: 'h1', c: ['bitwrench.js ', { t: 'span', a: { style: 'font-weight:400;font-size:0.5em;color:#888' }, c: 'v' + bw.version }] },
      { t: 'p', a: { class: 'intro-text' },
        c: 'A lightweight JavaScript library for building web interfaces from plain JS objects. No compiler, no virtual DOM, no dependencies. Include one file and start building.' },
      { t: 'p', a: { class: 'intro-text' },
        c: 'bitwrench was designed for rapid prototyping in constrained environments \u2014 embedded system dashboards, internal tools, quick demos \u2014 where pulling in React or Vue is overkill. It also works great for full applications.' },
      {
        t: 'div', a: { class: 'intro-example' },
        c: [
          { t: 'pre', c: { t: 'code', c:
`// Describe your UI as a plain JavaScript object (TACO format)
const ui = {
  t: "div", a: { class: "card" },
  c: [
    { t: "h2", c: "Hello" },
    { t: "p", c: "Built with bitwrench." }
  ]
};

// Render to the page
bw.DOM("#app", ui);

// Or generate an HTML string (works in Node.js too)
const html = bw.html(ui);` } }
        ]
      },
      {
        t: 'div', a: { style: 'display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1.5rem' },
        c: [
          { t: 'a', a: { class: 'btn-primary', href: './examples_v2r2/index.html' }, c: 'View Examples' },
          { t: 'a', a: { class: 'btn-outline', href: '#getting-started' }, c: 'Get Started' },
          { t: 'span', a: { style: 'align-self:center;font-size:0.8rem;color:#888' }, c: 'BSD-2-Clause | npm install bitwrench' }
        ]
      }
    ]
  }
};

// ─── What you get ───────────────────────────────────────────────────────────
function featureItem(title, desc) {
  return {
    t: 'div', a: { class: 'feature-item' },
    c: [
      { t: 'h4', c: title },
      { t: 'p', c: desc }
    ]
  };
}

const features = {
  t: 'section', a: { class: 'features' },
  c: {
    t: 'div', a: { class: 'container' },
    c: [
      { t: 'h2', c: 'What you get' },
      { t: 'div', a: { class: 'feature-grid' }, c: [
        featureItem('TACO Format', 'Define UI as {t, a, c, o} objects: Tag, Attributes, Content, Options. Pure JavaScript, no JSX, no templates.'),
        featureItem('Zero Dependencies', 'One file, no build step needed. Works in browsers (IE11+) and Node.js. Under 45KB gzipped.'),
        featureItem('Batteries Included', 'Grid, buttons, cards, forms, tables, alerts, badges, tabs, navbars \u2014 all out of the box.'),
        featureItem('Server & Client', 'Generate HTML strings with bw.html() or mount live DOM with bw.DOM(). Same API, both environments.'),
        featureItem('Dynamic CSS', 'Generate and inject CSS from JavaScript objects. Theme switching and dark mode built in.'),
        featureItem('Utilities', 'Color interpolation, RGB/HSL conversion, lorem ipsum, random data, cookie handling, URL parsing, and more.'),
      ]}
    ]
  }
};

// ─── Getting Started ─────────────────────────────────────────────────────────
const gettingStarted = {
  t: 'section', a: { id: 'getting-started', class: 'getting-started' },
  c: {
    t: 'div', a: { class: 'container' },
    c: [
      { t: 'h2', c: 'Getting started' },
      { t: 'div', a: { class: 'gs-grid' }, c: [
        { t: 'div', a: { class: 'gs-card' }, c: [
          { t: 'h4', c: 'Browser' },
          { t: 'pre', c: { t: 'code', c:
`<script src="bitwrench.umd.js"></script>
<script>
  bw.loadDefaultStyles();
  bw.DOM("#app", {
    t: "div", c: "Hello bitwrench!"
  });
</script>` } }
        ]},
        { t: 'div', a: { class: 'gs-card' }, c: [
          { t: 'h4', c: 'Node.js' },
          { t: 'pre', c: { t: 'code', c:
`npm install bitwrench

import bw from "bitwrench";
const html = bw.html({
  t: "div", c: "Hello from Node!"
});` } }
        ]}
      ]}
    ]
  }
};

// ─── API Reference ───────────────────────────────────────────────────────────
const apiRows = [
  ['bw.html(taco)', 'Convert TACO object to HTML string'],
  ['bw.createDOM(taco)', 'Create a live DOM element from TACO'],
  ['bw.DOM(sel, taco)', 'Mount TACO into a DOM target'],
  ['bw.css(rules)', 'Generate CSS from JS objects'],
  ['bw.loadDefaultStyles()', 'Inject full default stylesheet'],
  ['bw.setTheme(overrides)', 'Customize theme tokens'],
  ['bw.toggleDarkMode()', 'Switch light/dark themes'],
  ['bw.htmlTable(data, opts)', 'Sortable table from 2D array'],
  ['bw.colorInterp()', 'Interpolate between colors'],
  ['bw.loremIpsum(n)', 'Generate placeholder text'],
];

const apiSection = {
  t: 'section', a: { class: 'api-section' },
  c: {
    t: 'div', a: { class: 'container' },
    c: [
      { t: 'h2', c: 'Core API' },
      { t: 'div', a: { style: 'overflow-x:auto' }, c:
        { t: 'table', a: { class: 'api-table' }, c: [
          { t: 'thead', c: { t: 'tr', c: [
            { t: 'th', c: 'Function' },
            { t: 'th', c: 'Description' }
          ]}},
          { t: 'tbody', c: apiRows.map(([fn, desc]) => (
            { t: 'tr', c: [
              { t: 'td', c: { t: 'code', c: fn } },
              { t: 'td', c: desc }
            ]}
          ))}
        ]}
      }
    ]
  }
};

// ─── Examples ────────────────────────────────────────────────────────────────
const examples = [
  { num: '00', title: 'Fundamentals', href: '00-taco-srmc-fundamentals.html' },
  { num: '01', title: 'Component Library', href: '01-basic-components.html' },
  { num: '02', title: 'Tables & Forms', href: '02-interactive-tables-forms.html' },
  { num: '03', title: 'Themes & Styling', href: '03-themes-styling.html' },
  { num: '04', title: 'Dashboard App', href: '04-dashboard-app.html' },
  { num: '05', title: 'Advanced Features', href: '05-advanced-features.html' },
  { num: '06', title: 'Tic Tac Toe Tutorial', href: '06-tic-tac-toe-tutorial.html' },
];

const examplesSection = {
  t: 'section', a: { class: 'examples-section' },
  c: {
    t: 'div', a: { class: 'container' },
    c: [
      { t: 'h2', c: 'Examples' },
      { t: 'div', a: { class: 'example-grid' }, c: examples.map(ex => (
        { t: 'a', a: { href: `./examples_v2r2/${ex.href}`, class: 'example-link' }, c: [
          { t: 'span', a: { class: 'example-num' }, c: ex.num },
          { t: 'span', c: ex.title }
        ]}
      ))}
    ]
  }
};

// ─── Footer ──────────────────────────────────────────────────────────────────
const footer = {
  t: 'footer', a: { class: 'site-footer' },
  c: {
    t: 'div', a: { class: 'container' },
    c: [
      { t: 'div', a: { class: 'footer-inner' }, c: [
        { t: 'div', c: [
          { t: 'img', a: { src: './images/bitwrench-logo-med.png', alt: 'bitwrench', style: 'height:24px;margin-bottom:0.5rem;filter:brightness(0) invert(1)' } },
          { t: 'p', a: { style: 'margin:0;font-size:0.8rem;color:#888' }, c: 'BSD-2-Clause License. Created by Manu Chatterjee.' }
        ]},
        { t: 'div', a: { class: 'footer-links' }, c: [
          { t: 'a', a: { href: './examples_v2r2/index.html' }, c: 'Examples' },
          { t: 'a', a: { href: 'https://github.com/deftio/bitwrench' }, c: 'GitHub' },
          { t: 'a', a: { href: 'https://www.npmjs.com/package/bitwrench' }, c: 'npm' },
        ]}
      ]},
      { t: 'p', a: { style: 'margin:1rem 0 0;font-size:0.75rem;color:#666;border-top:1px solid #333;padding-top:1rem' },
        c: 'bitwrench v' + bw.version + ' \u2014 this page generated with bitwrench server-side rendering' }
    ]
  }
};

// ─── Assemble ────────────────────────────────────────────────────────────────
const page = {
  t: 'div',
  c: [ navbar, intro, features, gettingStarted, apiSection, examplesSection, footer ]
};

const bodyContent = bw.html(page, { raw: true });

// ─── Page CSS ────────────────────────────────────────────────────────────────
const pageCss = `
*,*::before,*::after{box-sizing:border-box}
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0; padding: 0; color: ${dark}; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  background: #f5f5f5;
}
.container { max-width: 960px; margin: 0 auto; padding: 0 1.5rem; }
h2 { font-size: 1.35rem; font-weight: 700; margin: 0 0 1.25rem; }
a { color: ${teal}; }

/* Nav */
.site-nav { background: ${dark}; position: sticky; top: 0; z-index: 100; }
.nav-inner {
  max-width: 960px; margin: 0 auto; padding: 0.6rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-links { display: flex; gap: 0.25rem; list-style: none; margin: 0; padding: 0; }
.nav-links a {
  color: rgba(255,255,255,0.7); text-decoration: none; padding: 0.35rem 0.6rem;
  border-radius: 4px; font-size: 0.8125rem; transition: all 0.15s;
}
.nav-links a:hover { color: #fff; background: rgba(255,255,255,0.08); }

/* Intro */
.intro { background: #fff; border-bottom: 1px solid #ddd; padding: 2.5rem 0 2rem; }
.intro h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.75rem; color: ${dark}; }
.intro-text { font-size: 1rem; color: #444; margin: 0 0 0.75rem; max-width: 640px; }
.intro-example {
  margin: 1.5rem 0 0; max-width: 540px;
}
.intro-example pre {
  background: ${dark}; color: #e0e0e0; padding: 1.25rem;
  border-radius: 6px; font-size: 0.8125rem; line-height: 1.6; overflow-x: auto; margin: 0;
  font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
}
.btn-primary {
  display: inline-block; background: ${teal}; color: #fff !important; text-decoration: none;
  padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 600; font-size: 0.875rem;
  transition: background 0.15s;
}
.btn-primary:hover { background: ${tealDark}; }
.btn-outline {
  display: inline-block; color: ${teal} !important; text-decoration: none;
  border: 1.5px solid ${teal}; padding: 0.45rem 1.25rem; border-radius: 6px;
  font-weight: 600; font-size: 0.875rem; transition: all 0.15s;
}
.btn-outline:hover { background: ${tealLight}; }

/* Features */
.features { padding: 2.5rem 0; background: ${tealLight}; }
.feature-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;
}
.feature-item h4 { font-size: 0.95rem; font-weight: 600; margin: 0 0 0.25rem; color: ${dark}; }
.feature-item p { font-size: 0.875rem; color: #555; margin: 0; line-height: 1.5; }

/* Getting Started */
.getting-started { padding: 2.5rem 0; background: #fff; }
.gs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.gs-card { background: #fafafa; border: 1px solid #ddd; border-radius: 6px; padding: 1.25rem; }
.gs-card h4 { margin: 0 0 0.75rem; font-size: 0.95rem; color: ${dark}; }
.gs-card pre {
  background: ${dark}; color: #e0e0e0; padding: 1rem; border-radius: 4px;
  font-size: 0.8125rem; line-height: 1.5; overflow-x: auto; margin: 0;
  font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
}

/* API */
.api-section { padding: 2.5rem 0; background: #f5f5f5; }
.api-table {
  width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 6px;
  font-size: 0.875rem;
}
.api-table th { text-align: left; padding: 0.6rem 1rem; background: #fafafa; border-bottom: 2px solid #ddd; font-weight: 600; }
.api-table td { padding: 0.5rem 1rem; border-bottom: 1px solid #eee; }
.api-table code {
  background: #f0f0f0; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.85em; white-space: nowrap;
  font-family: "SF Mono", Monaco, Consolas, monospace;
}

/* Examples */
.examples-section { padding: 2.5rem 0; background: #fff; }
.example-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem;
}
.example-link {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; background: #fafafa; border: 1px solid #ddd;
  border-radius: 6px; text-decoration: none; color: ${dark};
  font-weight: 500; font-size: 0.9rem; transition: border-color 0.15s;
}
.example-link:hover { border-color: ${teal}; }
.example-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  background: ${tealLight}; color: ${teal}; font-size: 0.75rem; font-weight: 700;
  flex-shrink: 0;
}

/* Footer */
.site-footer { background: ${dark}; color: #aaa; padding: 2rem 0 1.25rem; }
.footer-inner { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; flex-wrap: wrap; }
.footer-links { display: flex; gap: 1.5rem; }
.footer-links a { color: #aaa; text-decoration: none; font-size: 0.8rem; transition: color 0.15s; }
.footer-links a:hover { color: #fff; }

/* Responsive */
@media (max-width: 640px) {
  .container { padding: 0 1rem; }
  .intro h1 { font-size: 1.5rem; }
  .gs-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .feature-grid { grid-template-columns: 1fr; }
}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>bitwrench.js - Lightweight JavaScript UI Library</title>
<meta name="description" content="A lightweight JavaScript library for building web interfaces from plain JS objects. No compiler, no virtual DOM, no dependencies.">
<link rel="icon" type="image/x-icon" href="./images/favicon.ico">
<style>
${pageCss}
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;

writeFileSync(outputPath, html, 'utf8');
console.log('Generated index.html (' + html.length + ' bytes)');
