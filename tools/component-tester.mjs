#!/usr/bin/env node
/**
 * component-tester.mjs — Live BCCL component gallery driven by bwserve.
 *
 * Demonstrates bwserve's server-driven UI: the server builds TACO objects,
 * pushes them over SSE, and the browser renders them. Theme switching,
 * dark mode, and screenshots are controlled via a simple HTTP API.
 *
 * Usage:
 *   node tools/component-tester.mjs [port]     Start on port (default: 9904)
 *   node tools/component-tester.mjs stop        Stop any running instance
 *
 * View:   http://localhost:9904
 *
 * Control API (drive from CLI, scripts, or Claude Code):
 *   GET /__ctl/status                    — connection status (JSON)
 *   GET /__ctl/theme/:name              — switch to a THEME_PRESETS entry
 *   GET /__ctl/dark                      — toggle alternate (dark) palette
 *   GET /__ctl/screenshot                — capture full page → PNG
 *   GET /__ctl/screenshot?selector=.foo  — capture specific element
 *   GET /__ctl/exec?code=...            — execute arbitrary JS on client
 *   GET /__ctl/refresh                   — re-render the gallery from server
 *   GET /__ctl/stop                      — gracefully shut down the server
 *
 * Architecture:
 *   Server (Node.js)         Browser (user watches)      CLI (developer drives)
 *   ┌──────────────┐         ┌──────────────────┐        ┌─────────────────┐
 *   │ bwserve app  │──SSE──→ │ component gallery│        │ curl /__ctl/... │
 *   │ buildGallery │         │ bw.apply()       │        │                 │
 *   │ /__ctl/ API  │←POST───│ data-bw-action   │        │                 │
 *   │              │←GET────│                  │        │ ──GET──→        │
 *   └──────────────┘         └──────────────────┘        └─────────────────┘
 *
 * The gallery renders every BCCL make*() component as TACO objects built
 * on the server side. Since TACO is plain JSON, it serializes cleanly
 * over SSE — no function serialization needed.
 *
 * Theme switching uses client.exec() to call bw.loadStyles() in the
 * browser. Screenshots use bwserve's html2canvas integration:
 *   server calls client.screenshot() → client renders to canvas →
 *   client POSTs image back → server saves to disk + returns PNG.
 */

import { create } from '../src/bwserve/index.js';
import bw from '../src/bitwrench.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

var __dirname = dirname(fileURLToPath(import.meta.url));
var PROJECT_ROOT = resolve(__dirname, '..');
var SCREENSHOT_DIR = resolve(PROJECT_ROOT, '.feedback', 'screenshots', 'live');

// Ensure screenshot directory exists
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Build gallery TACO on the server side
// ---------------------------------------------------------------------------
// Track the current theme config so re-renders use the right palette
var currentThemeConfig = bw.THEME_PRESETS.teal || { primary: '#006666', secondary: '#6c757d', tertiary: '#006666' };

function buildGallery() {
  function section(title, desc, content) {
    var heading = [{ t: 'h2', a: { style: 'margin-bottom:0.25rem;' }, c: title }];
    if (desc) heading.push({ t: 'p', a: { style: 'font-size:0.8125rem;opacity:0.7;margin-bottom:0.75rem;' }, c: desc });
    return {
      t: 'div', a: { style: 'margin-bottom:2rem;' },
      c: heading.concat(Array.isArray(content) ? content : [content])
    };
  }

  // Theme picker — uses data-bw-action for bwserve interactivity
  var presetNames = Object.keys(bw.THEME_PRESETS);
  var themeSwitcher = {
    t: 'div', a: { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;padding:0.75rem 0;margin-bottom:0.5rem;border-bottom:1px solid rgba(128,128,128,0.2);' },
    c: [
      { t: 'span', a: { style: 'font-weight:600;font-size:0.8125rem;margin-right:0.25rem;' }, c: 'Theme' }
    ].concat(presetNames.map(function(name) {
      var p = bw.THEME_PRESETS[name];
      return {
        t: 'button', a: {
          'data-bw-action': 'theme-' + name,
          title: name,
          style: 'width:1.5rem;height:1.5rem;border-radius:50%;border:2px solid rgba(128,128,128,0.3);cursor:pointer;background:' + p.primary + ';outline:none;padding:0;'
        }
      };
    })).concat([
      { t: 'span', a: { style: 'width:1px;height:1.25rem;background:rgba(128,128,128,0.3);margin:0 0.25rem;' } },
      { t: 'button', a: { 'data-bw-action': 'toggle-dark', style: 'font-size:0.75rem;padding:0.25rem 0.75rem;border-radius:0.25rem;border:1px solid rgba(128,128,128,0.3);cursor:pointer;background:rgba(0,0,0,0.8);color:#fff;' }, c: 'Toggle Dark' }
    ])
  };

  // ── Palette explainer ──
  // Shows: inputs → derivation → component mapping
  var currentPalette = bw.derivePalette(currentThemeConfig);

  // Shared style constants for swatch tables
  var swCell = 'width:2.5rem;height:1.5rem;border-radius:3px;border:1px solid rgba(0,0,0,0.15);';
  var swTd = 'padding:0.125rem 1px;';
  var labelTd = 'padding:0.125rem 0.5rem 0.125rem 0;font-weight:600;font-size:0.75rem;white-space:nowrap;';
  var roleTd = 'padding:0.125rem 0 0.125rem 0.5rem;font-size:0.6875rem;opacity:0.6;';
  var headerTd = 'padding:0.25rem 1px 0.375rem;text-align:center;font-size:0.625rem;opacity:0.5;';
  var shadeNames = ['base','hover','active','light','border','textOn'];

  // Inline swatch helper (small colored box for use in text)
  function inlineSwatch(color) {
    return { t: 'span', a: { style: 'display:inline-block;width:0.75rem;height:0.75rem;border-radius:2px;border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin:0 0.25rem;background:' + color + ';' } };
  }

  // Shade legend: explains what each derived shade is for
  var shadeLegend = {
    t: 'div', a: { style: 'font-size:0.6875rem;opacity:0.6;margin-bottom:0.75rem;line-height:1.5;' },
    c: [
      { t: 'div', c: [
        { t: 'strong', c: 'base' }, ' = the color itself. ',
        { t: 'strong', c: 'hover' }, ' = 10% darker for :hover. ',
        { t: 'strong', c: 'active' }, ' = 15% darker for :active/:pressed.'
      ]},
      { t: 'div', c: [
        { t: 'strong', c: 'light' }, ' = 85% mixed toward white (alert backgrounds, subtle fills). ',
        { t: 'strong', c: 'border' }, ' = visible edge color for that shade.'
      ]},
      { t: 'div', c: [
        { t: 'strong', c: 'textOn' }, ' = text color to print ON TOP of base (white or black, auto-picked for WCAG contrast).'
      ]}
    ]
  };

  function swatchRow(label, shades, role) {
    return { t: 'tr', c: [
      { t: 'td', a: { style: labelTd }, c: label }
    ].concat(shadeNames.map(function(name) {
      return { t: 'td', a: { style: swTd }, c: {
        t: 'div', a: {
          title: label + '.' + name + ' = ' + shades[name],
          style: swCell + 'background:' + shades[name] + ';'
        }
      }};
    })).concat([
      { t: 'td', a: { style: roleTd }, c: role }
    ])};
  }

  var shadeHeaderRow = { t: 'tr', c: [
    { t: 'td' }
  ].concat(shadeNames.map(function(n) {
    return { t: 'td', a: { style: headerTd }, c: n };
  })).concat([{ t: 'td' }])};

  // ── Section 1: Theme Inputs ──
  function seedSwatch(label, hex, desc) {
    return { t: 'div', a: { style: 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;' }, c: [
      { t: 'div', a: { style: 'width:2rem;height:2rem;border-radius:4px;border:1px solid rgba(0,0,0,0.15);background:' + hex + ';' } },
      { t: 'div', c: [
        { t: 'div', a: { style: 'font-weight:700;font-size:0.8125rem;' }, c: label },
        { t: 'div', a: { style: 'font-size:0.6875rem;opacity:0.5;' }, c: hex }
      ]},
      { t: 'div', a: { style: 'font-size:0.6875rem;opacity:0.6;margin-left:auto;max-width:14rem;' }, c: desc }
    ]};
  }

  var inputsSection = {
    t: 'div', a: { style: 'margin-bottom:1rem;' }, c: [
      { t: 'div', a: { style: 'font-weight:700;font-size:0.8125rem;margin-bottom:0.5rem;' }, c: 'Theme Inputs (You Provide)' },
      seedSwatch('primary', currentThemeConfig.primary || '#006666',
        'Main brand color. Used for buttons, links, nav active, accordion open, focus rings. Also tints background/surface hue.'),
      seedSwatch('secondary', currentThemeConfig.secondary || '#6c757d',
        'Supporting color. Used for secondary buttons, muted text, outlines.'),
      seedSwatch('tertiary', currentThemeConfig.tertiary || currentThemeConfig.primary || '#006666',
        'Third accent color. Gets full shade set + .bw_tertiary CSS class, but no component defaults to it yet. Use explicitly via variant="tertiary" on buttons, badges, cards, etc.'),
      { t: 'div', a: { style: 'font-size:0.6875rem;opacity:0.5;margin-top:0.25rem;font-style:italic;' },
        c: 'Optional config: spacing (compact/normal/spacious), radius (none/sm/md/lg/pill), fontSize, elevation, motion' }
    ]
  };

  // ── Section 2: Derived Shades ──
  var shadesTable = {
    t: 'table', a: { style: 'border-collapse:separate;border-spacing:0;' },
    c: { t: 'tbody', c: [
      shadeHeaderRow,
      swatchRow('primary', currentPalette.primary, 'Buttons, links, focus rings'),
      swatchRow('secondary', currentPalette.secondary, 'Subdued buttons, text'),
      swatchRow('tertiary', currentPalette.tertiary, 'Use via variant="tertiary"'),
      swatchRow('success', currentPalette.success, 'Auto-derived, harmonized to primary hue'),
      swatchRow('danger', currentPalette.danger, 'Auto-derived, harmonized to primary hue'),
      swatchRow('warning', currentPalette.warning, 'Auto-derived, harmonized to primary hue'),
      swatchRow('info', currentPalette.info, 'Auto-derived, harmonized to primary hue'),
      swatchRow('light', currentPalette.light, 'Derived from primary hue, S:8 L:97'),
      swatchRow('dark', currentPalette.dark, 'Derived from primary hue, S:10 L:13')
    ]}
  };

  // ── Section 3: Surface Tokens ──
  function surfaceRow(label, color, role) {
    return { t: 'tr', c: [
      { t: 'td', a: { style: labelTd }, c: label },
      { t: 'td', a: { style: 'padding:0.125rem 0;' }, c: {
        t: 'div', a: {
          title: label + ' = ' + color,
          style: 'width:12rem;height:1.5rem;border-radius:3px;border:1px solid rgba(0,0,0,0.15);background:' + color + ';'
        }
      }},
      { t: 'td', a: { style: roleTd }, c: role }
    ]};
  }

  var surfaceTable = {
    t: 'table', a: { style: 'border-collapse:separate;border-spacing:0;' },
    c: { t: 'tbody', c: [
      surfaceRow('background', currentPalette.background, 'Page body (primary hue, S:22, L:96)'),
      surfaceRow('surface', currentPalette.surface, 'Cards, panels (primary hue, S:25, L:94)'),
      surfaceRow('surfaceAlt', currentPalette.surfaceAlt, 'Striped rows, hover states, headers')
    ]}
  };

  // ── Section 4: Component Mapping (with inline swatches) ──
  var mapTdLeft = 'padding:0.2rem 0.5rem 0.2rem 0;font-weight:600;white-space:nowrap;border-bottom:1px solid rgba(128,128,128,0.1);';
  var mapTdRight = 'padding:0.2rem 0;border-bottom:1px solid rgba(128,128,128,0.1);';

  function mapRow(component, parts) {
    // parts is an array of strings and swatch objects
    return { t: 'tr', c: [
      { t: 'td', a: { style: mapTdLeft }, c: component },
      { t: 'td', a: { style: mapTdRight }, c: parts }
    ]};
  }

  var p = currentPalette;
  var componentMap = {
    t: 'table', a: { style: 'font-size:0.75rem;border-collapse:collapse;width:100%;' },
    c: { t: 'tbody', c: [
      mapRow('Button (primary)', [inlineSwatch(p.primary.base), ' base fill ', inlineSwatch(p.primary.hover), ' hover ', inlineSwatch(p.primary.textOn), ' text']),
      mapRow('Button (secondary)', [inlineSwatch(p.secondary.base), ' base fill ', inlineSwatch(p.secondary.textOn), ' text']),
      mapRow('Button (outline)', ['transparent bg, ', inlineSwatch(p.primary.base), ' border + text']),
      mapRow('Card', [inlineSwatch(p.surface), ' surface bg ', inlineSwatch(p.light.border), ' border']),
      mapRow('Card (variant)', [inlineSwatch(p.surface), ' bg + ', inlineSwatch(p.primary.base), ' top/left accent border']),
      mapRow('Alert', [inlineSwatch(p.primary.light), ' variant.light bg ', inlineSwatch(p.primary.border), ' border ', inlineSwatch(p.primary.darkText), ' text']),
      mapRow('Badge', [inlineSwatch(p.primary.base), ' variant.base fill ', inlineSwatch(p.primary.textOn), ' text']),
      mapRow('Table', [inlineSwatch(p.surface), ' surface bg ', inlineSwatch(p.surfaceAlt), ' surfaceAlt stripes']),
      mapRow('Nav active', [inlineSwatch(p.primary.base), ' primary.base bg ', inlineSwatch(p.primary.textOn), ' text']),
      mapRow('Pagination', [inlineSwatch(p.primary.base), ' active page ', inlineSwatch(p.light.border), ' borders']),
      mapRow('Stat card', [inlineSwatch(p.light.border), ' 1px border + ', inlineSwatch(p.primary.base), ' 4px left accent']),
      mapRow('Progress', [inlineSwatch(p.primary.base), ' variant.base fill on ', inlineSwatch(p.light.light), ' track']),
      mapRow('Accordion (open)', [inlineSwatch(p.primary.light), ' header bg ', inlineSwatch(p.primary.base), ' hover bg']),
      mapRow('Spinner', [inlineSwatch(p.primary.base), ' border-color (border-right: transparent = gap)']),
      mapRow('Focus ring', [inlineSwatch(p.primary.focus), ' variant.focus (25% opacity rgba)']),
      mapRow('Breadcrumb', [inlineSwatch(p.primary.base), ' active link color']),
      mapRow('Dropdown', [inlineSwatch(p.surface), ' bg ', inlineSwatch(p.primary.base), ' active item'])
    ]}
  };

  var paletteExplainer = {
    t: 'div', a: { style: 'margin-bottom:2rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.04);' },
    c: [
      { t: 'h2', a: { style: 'margin-bottom:0.25rem;font-size:1.125rem;' }, c: 'Color Palette — How Themes Work' },
      { t: 'p', a: { style: 'font-size:0.8125rem;opacity:0.7;margin-bottom:0.75rem;' },
        c: 'You provide 2-3 seed colors. derivePalette() generates 9 shade sets + 3 surface tokens. Each shade has 6 variants (base, hover, active, light, border, textOn). Semantic colors (success, danger, etc.) are auto-derived and harmonized toward the primary hue.' },

      // Row 1: Inputs
      inputsSection,

      // Row 2: Two-column layout — shades + surfaces/mapping
      { t: 'div', a: { style: 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;' }, c: [
        // Left: derived shades
        { t: 'div', c: [
          { t: 'div', a: { style: 'font-weight:700;font-size:0.8125rem;margin-bottom:0.5rem;' }, c: 'Derived Shade Sets (each seed + auto-derived colors)' },
          shadeLegend,
          shadesTable
        ]},
        // Right: surfaces + component mapping
        { t: 'div', c: [
          { t: 'div', a: { style: 'font-weight:700;font-size:0.8125rem;margin-bottom:0.5rem;' }, c: 'Surface Tokens (tinted from primary hue)' },
          surfaceTable,
          { t: 'div', a: { style: 'margin-top:1rem;font-weight:700;font-size:0.8125rem;margin-bottom:0.375rem;' }, c: 'How Colors Map to Components' },
          componentMap
        ]}
      ]}
    ]
  };

  return {
    t: 'div', a: { style: 'max-width:960px;margin:0 auto;padding:1.5rem;' }, c: [
      { t: 'h1', c: 'Component Gallery — Live Tester' },
      { t: 'p', a: { style: 'opacity:0.6;margin-bottom:0.5rem;' },
        c: 'Driven by bwserve. Use /__ctl/ API or click theme swatches below.' },
      themeSwitcher,
      paletteExplainer,

      // Buttons
      section('Buttons', null, [
        { t: 'div', a: { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;' },
          c: ['primary','secondary','success','danger','warning','info','dark','light'].map(function(v) {
            return bw.makeButton({ text: v, variant: v });
          })
        },
        { t: 'div', a: { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;' },
          c: ['primary','secondary','success','danger'].map(function(v) {
            return bw.makeButton({ text: 'outline-' + v, variant: 'outline_' + v });
          })
        },
        { t: 'div', a: { style: 'display:flex;gap:0.5rem;align-items:center;' },
          c: [
            bw.makeButton({ text: 'Small', variant: 'primary', size: 'sm' }),
            bw.makeButton({ text: 'Default', variant: 'primary' }),
            bw.makeButton({ text: 'Large', variant: 'primary', size: 'lg' }),
            bw.makeButton({ text: 'Disabled', variant: 'primary', disabled: true })
          ]
        }
      ]),

      // Cards
      section('Cards', null, [
        { t: 'div', a: { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;' },
          c: [
            bw.makeCard({ title: 'Basic Card', content: 'Simple card with title and content.' }),
            bw.makeCard({ title: 'With Header', header: 'Featured', content: 'Card with header and footer.', footer: 'Footer text' }),
            bw.makeCard({ title: 'Primary Accent', content: 'Variant accent border.', variant: 'primary' }),
            bw.makeCard({ title: 'Hoverable', content: 'Hover to see lift effect.', hoverable: true })
          ]
        }
      ]),

      // Alerts
      section('Alerts', null, [
        { t: 'div', a: { style: 'display:flex;flex-direction:column;gap:0.5rem;' },
          c: ['primary','success','danger','warning','info'].map(function(v) {
            return bw.makeAlert({ content: 'This is a ' + v + ' alert.', variant: v });
          })
        }
      ]),

      // Badges
      section('Badges', null, [
        { t: 'div', a: { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;' },
          c: ['primary','secondary','success','danger','warning','info','dark','light'].map(function(v) {
            return bw.makeBadge({ text: v, variant: v });
          })
        },
        { t: 'div', a: { style: 'display:flex;gap:0.5rem;' },
          c: ['primary','success','danger'].map(function(v) {
            return bw.makeBadge({ text: v + ' pill', variant: v, pill: true });
          })
        }
      ]),

      // Form Controls
      section('Form Controls', null, [
        { t: 'div', a: { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-bottom:1rem;' }, c: [
          bw.makeFormGroup({ label: 'Text Input', input: bw.makeInput({ placeholder: 'Enter text...', name: 'demo-text' }), help: 'Helper text.' }),
          bw.makeFormGroup({ label: 'Select', input: bw.makeSelect({ options: [{ value: '', label: 'Choose...' }, { value: '1', label: 'Option 1' }, { value: '2', label: 'Option 2' }], name: 'demo-select' }) })
        ]},
        bw.makeFormGroup({ label: 'Textarea', input: bw.makeTextarea({ placeholder: 'Write something...', name: 'demo-textarea', rows: 2 }) }),
        { t: 'div', a: { style: 'display:flex;gap:2rem;flex-wrap:wrap;' }, c: [
          { t: 'div', c: [
            { t: 'strong', a: { style: 'font-size:0.875rem;' }, c: 'Checkboxes' },
            bw.makeCheckbox({ label: 'Option A', name: 'chk-a', checked: true }),
            bw.makeCheckbox({ label: 'Option B', name: 'chk-b' })
          ]},
          { t: 'div', c: [
            { t: 'strong', a: { style: 'font-size:0.875rem;' }, c: 'Radio' },
            bw.makeRadio({ label: 'Choice 1', name: 'radio-demo', value: '1', checked: true }),
            bw.makeRadio({ label: 'Choice 2', name: 'radio-demo', value: '2' })
          ]},
          { t: 'div', c: [
            { t: 'strong', a: { style: 'font-size:0.875rem;' }, c: 'Switches' },
            bw.makeSwitch({ label: 'Dark mode', name: 'sw-1' }),
            bw.makeSwitch({ label: 'Notifications', name: 'sw-2', checked: true })
          ]}
        ]}
      ]),

      // Progress
      section('Progress', null, [
        { t: 'div', a: { style: 'display:flex;flex-direction:column;gap:0.75rem;' }, c: [
          bw.makeProgress({ value: 25, label: '25%' }),
          bw.makeProgress({ value: 50, variant: 'success', label: '50%' }),
          bw.makeProgress({ value: 75, variant: 'warning', striped: true, label: '75%' }),
          bw.makeProgress({ value: 90, variant: 'danger', striped: true, animated: true, label: '90%' })
        ]}
      ]),

      // Spinner
      section('Spinner', 'Animated loading indicators.', [
        { t: 'div', a: { style: 'display:flex;gap:1rem;align-items:center;' }, c: [
          bw.makeSpinner({ variant: 'primary' }),
          bw.makeSpinner({ variant: 'success' }),
          bw.makeSpinner({ variant: 'danger' }),
          bw.makeSpinner({ variant: 'warning' }),
          bw.makeSpinner({ type: 'grow', variant: 'info' })
        ]}
      ]),

      // Table
      section('Table', null, [
        bw.makeTableFromArray({
          data: [
            ['Name', 'Role', 'Status', 'Score'],
            ['Alice', 'Engineer', 'Active', '95'],
            ['Bob', 'Designer', 'Active', '88'],
            ['Charlie', 'Manager', 'Away', '72'],
            ['Diana', 'Analyst', 'Active', '91']
          ],
          striped: true, hover: true
        })
      ]),

      // List Group
      section('List Group', null, [
        { t: 'div', a: { style: 'max-width:400px;' }, c: [
          bw.makeListGroup({
            items: [
              { text: 'Inbox', badge: '14', active: true },
              { text: 'Drafts', badge: '3' },
              { text: 'Sent' },
              { text: 'Spam', disabled: true }
            ]
          })
        ]}
      ]),

      // Tabs (interactive via injected JS)
      section('Tabs', 'Interactive tabs.', [
        bw.makeTabs({
          tabs: [
            { label: 'Overview', active: true, content: [
              { t: 'h4', c: 'Dashboard Overview' },
              { t: 'p', c: 'Tabs switch content panels.' },
              bw.makeProgress({ value: 68, variant: 'primary', label: '68%' })
            ]},
            { label: 'Details', content: [
              { t: 'h4', c: 'Project Details' },
              bw.makeListGroup({ items: [
                { text: 'Framework: Bitwrench v2' },
                { text: 'Components: 40+ BCCL helpers' },
                { text: 'Bundle: 42KB gzipped' }
              ]})
            ]},
            { label: 'Settings', content: [
              { t: 'h4', c: 'Preferences' },
              bw.makeSwitch({ label: 'Enable notifications', name: 'tab-n', checked: true }),
              bw.makeSwitch({ label: 'Dark mode', name: 'tab-d' })
            ]}
          ]
        })
      ]),

      // Accordion (interactive via injected JS)
      section('Accordion', 'Collapsible panels.', [
        bw.makeAccordion({
          items: [
            { title: 'What is Bitwrench?', content: 'A lightweight JavaScript UI library using the TACO format. No build step required.', open: true },
            { title: 'How does theming work?', content: 'Call bw.loadStyles() with seed colors. The design system derives a complete palette.' },
            { title: 'What about dark mode?', content: 'Call bw.toggleStyles() to switch between primary and alternate palettes.' }
          ]
        })
      ]),

      // Nav
      section('Nav', null, [
        { t: 'div', a: { style: 'display:flex;gap:2rem;' }, c: [
          bw.makeNav({ items: [
            { text: 'Home', active: true },
            { text: 'Profile' },
            { text: 'Settings' }
          ]}),
          bw.makeNav({ items: [
            { text: 'Home', active: true },
            { text: 'Profile' },
            { text: 'Messages' }
          ], pills: true })
        ]}
      ]),

      // Breadcrumb
      section('Breadcrumb', null, [
        bw.makeBreadcrumb({ items: [
          { text: 'Home', href: '#' },
          { text: 'Library', href: '#' },
          { text: 'Data', active: true }
        ]})
      ]),

      // Pagination
      section('Pagination', null, [
        bw.makePagination({ currentPage: 3, pages: 10 })
      ]),

      // Dropdown
      section('Dropdown', null, [
        { t: 'div', a: { style: 'display:flex;gap:1rem;' }, c: [
          bw.makeDropdown({
            trigger: 'Actions', variant: 'primary',
            items: [{ text: 'Edit' }, { text: 'Duplicate' }, { divider: true }, { text: 'Delete' }]
          }),
          bw.makeDropdown({
            trigger: 'Filter', variant: 'outline_secondary',
            items: [{ text: 'All' }, { text: 'Active' }, { text: 'Archived' }]
          })
        ]}
      ]),

      // Timeline
      section('Timeline', null, [
        bw.makeTimeline({ items: [
          { date: 'Jan 2024', title: 'Project Started', text: 'Initial commit.', variant: 'primary' },
          { date: 'Mar 2024', title: 'Beta Release', text: 'First public beta.', variant: 'success' },
          { date: 'Jun 2024', title: 'v1.0 Launch', text: 'Production release.', variant: 'info' }
        ]})
      ]),

      // Stepper
      section('Stepper', null, [
        bw.makeStepper({
          steps: [
            { label: 'Account', description: 'Create account' },
            { label: 'Profile', description: 'Set up profile' },
            { label: 'Review', description: 'Review details' },
            { label: 'Done', description: 'All set' }
          ],
          currentStep: 1
        })
      ]),

      // Stat Cards
      section('Stat Cards', null, [
        { t: 'div', a: { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;' }, c: [
          bw.makeStatCard({ label: 'Revenue', value: 12450, format: 'currency', change: 12.5, variant: 'primary', icon: '$' }),
          bw.makeStatCard({ label: 'Users', value: 1284, format: 'number', change: 8.2, variant: 'success', icon: '#' }),
          bw.makeStatCard({ label: 'Bounce', value: 32.1, suffix: '%', change: -2.4, variant: 'warning', icon: '%' }),
          bw.makeStatCard({ label: 'Errors', value: 23, format: 'number', change: 5, variant: 'danger', icon: '!' })
        ]}
      ]),

      // Hero
      section('Hero', null, [
        bw.makeHero({
          title: 'Welcome to Bitwrench',
          subtitle: 'Build beautiful UIs with pure JavaScript.',
          variant: 'primary',
          actions: [
            bw.makeButton({ text: 'Get Started', variant: 'light', size: 'lg' }),
            bw.makeButton({ text: 'Learn More', variant: 'outline_light', size: 'lg' })
          ]
        })
      ]),

      // Feature Grid
      section('Feature Grid', null, [
        bw.makeFeatureGrid({ features: [
          { icon: '{}', title: 'TACO Format', description: 'Pure JS objects for UI.' },
          { icon: '#', title: 'CSS-in-JS', description: 'Styles from code.' },
          { icon: '~', title: 'Themes', description: 'Design system from seed colors.' },
          { icon: '>', title: 'No Build Step', description: 'Zero compilation required.' }
        ]})
      ]),

      // Skeleton
      section('Skeleton', 'Loading placeholders.', [
        { t: 'div', a: { style: 'display:flex;gap:1.5rem;' }, c: [
          bw.makeCard({ content: {
            t: 'div', a: { style: 'width:220px;' }, c: [
              bw.makeSkeleton({ variant: 'rect', width: '100%', height: '6rem' }),
              { t: 'div', a: { style: 'padding:0.75rem 0;' }, c: [
                bw.makeSkeleton({ variant: 'text', count: 2 }),
                { t: 'div', a: { style: 'margin-top:0.5rem;' }, c: bw.makeSkeleton({ variant: 'text', width: '60%' }) }
              ]}
            ]
          }}),
          bw.makeCard({ content: {
            t: 'div', a: { style: 'width:220px;display:flex;gap:0.75rem;align-items:flex-start;' }, c: [
              bw.makeSkeleton({ variant: 'circle', width: '2.5rem', height: '2.5rem' }),
              { t: 'div', a: { style: 'flex:1;' }, c: [
                bw.makeSkeleton({ variant: 'text', width: '80%' }),
                bw.makeSkeleton({ variant: 'text' }),
                bw.makeSkeleton({ variant: 'text', width: '40%' })
              ]}
            ]
          }})
        ]}
      ]),

      // Avatar
      section('Avatar', null, [
        { t: 'div', a: { style: 'display:flex;gap:0.75rem;align-items:center;' }, c: [
          bw.makeAvatar({ initials: 'AB', size: 'sm', variant: 'primary' }),
          bw.makeAvatar({ initials: 'CD', size: 'md', variant: 'success' }),
          bw.makeAvatar({ initials: 'EF', size: 'lg', variant: 'danger' }),
          bw.makeAvatar({ initials: 'GH', size: 'xl', variant: 'info' })
        ]}
      ]),

      // Search Input
      section('Search Input', null, [
        { t: 'div', a: { style: 'max-width:400px;' }, c: [
          bw.makeSearchInput({ placeholder: 'Search components...', name: 'search-demo' })
        ]}
      ]),

      // Chip Input
      section('Chip Input', null, [
        { t: 'div', a: { style: 'max-width:400px;' }, c: [
          bw.makeChipInput({ chips: ['JavaScript', 'CSS', 'HTML'], placeholder: 'Add a tag...' })
        ]}
      ]),

      // File Upload
      section('File Upload', null, [
        bw.makeFileUpload({ accept: '.jpg,.png,.pdf', multiple: true })
      ]),

      // Range
      section('Range', null, [
        { t: 'div', a: { style: 'max-width:400px;' }, c: [
          bw.makeRange({ label: 'Volume', min: 0, max: 100, value: 65, name: 'volume' }),
          bw.makeRange({ label: 'Brightness', min: 0, max: 100, value: 30, name: 'brightness' })
        ]}
      ]),

      // Code Demo
      section('Code Demo', null, [
        bw.makeCodeDemo({
          code: "bw.makeButton({ text: 'Click me', variant: 'primary' });",
          result: bw.makeButton({ text: 'Click me', variant: 'primary' }),
          language: 'javascript'
        })
      ]),

      // CTA
      section('CTA', null, [
        bw.makeCTA({
          title: 'Ready to get started?',
          description: 'Build UIs with pure JavaScript and zero build steps.',
          actions: [
            bw.makeButton({ text: 'Get Started', variant: 'primary', size: 'lg' }),
            bw.makeButton({ text: 'Learn More', variant: 'outline_primary' })
          ]
        })
      ])
    ]
  };
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------
var PORT = parseInt(process.argv[2] || '9904', 10);

var app = create({
  port: PORT,
  title: 'Component Tester',
  allowScreenshot: true,
  allowExec: true
});

// Track the active client (last connected browser tab)
var activeClient = null;

app.page('/', function(client) {
  activeClient = client;
  console.log('[tester] Client connected: ' + client.id);

  // Render the gallery
  client.render('#app', buildGallery());

  // Inject interactive behavior for components whose onclick handlers
  // can't serialize over SSE JSON. Uses event delegation on document.
  client.exec(`
    // --- Accordion toggle ---
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.bw_accordion_button');
      if (!btn) return;
      var item = btn.closest('.bw_accordion_item');
      if (!item) return;
      var collapse = item.querySelector('.bw_accordion_collapse');
      if (!collapse) return;
      var isOpen = collapse.classList.contains('bw_collapse_show');
      // Close all siblings first (single-open mode)
      var accordion = item.closest('.bw_accordion');
      if (accordion) {
        accordion.querySelectorAll('.bw_accordion_item').forEach(function(si) {
          if (si !== item) {
            si.querySelector('.bw_accordion_collapse').classList.remove('bw_collapse_show');
            var sb = si.querySelector('.bw_accordion_button');
            if (sb) { sb.classList.add('bw_collapsed'); sb.setAttribute('aria-expanded','false'); }
          }
        });
      }
      if (isOpen) {
        collapse.classList.remove('bw_collapse_show');
        btn.classList.add('bw_collapsed');
        btn.setAttribute('aria-expanded','false');
      } else {
        collapse.classList.add('bw_collapse_show');
        btn.classList.remove('bw_collapsed');
        btn.setAttribute('aria-expanded','true');
      }
    });

    // --- Tabs toggle ---
    document.addEventListener('click', function(e) {
      var link = e.target.closest('.bw_nav_link[data-tab-index]');
      if (!link) return;
      e.preventDefault();
      var tabs = link.closest('.bw_tabs');
      if (!tabs) return;
      var idx = parseInt(link.getAttribute('data-tab-index'), 10);
      tabs.querySelectorAll('.bw_nav_link').forEach(function(l) {
        l.classList.remove('active');
        l.setAttribute('aria-selected','false');
      });
      link.classList.add('active');
      link.setAttribute('aria-selected','true');
      var panes = tabs.querySelectorAll('.bw_tab_pane');
      panes.forEach(function(p, i) {
        p.classList.toggle('active', i === idx);
      });
    });

    // --- Dropdown toggle ---
    document.addEventListener('click', function(e) {
      var toggle = e.target.closest('.bw_dropdown_toggle');
      if (toggle) {
        var dd = toggle.closest('.bw_dropdown');
        if (dd) {
          var menu = dd.querySelector('.bw_dropdown_menu');
          if (menu) menu.classList.toggle('bw_dropdown_show');
        }
        return;
      }
      // Click on item closes dropdown
      var item = e.target.closest('.bw_dropdown_item');
      if (item) {
        var menu = item.closest('.bw_dropdown_menu');
        if (menu) menu.classList.remove('bw_dropdown_show');
        return;
      }
      // Click outside closes all dropdowns
      document.querySelectorAll('.bw_dropdown_menu.bw_dropdown_show').forEach(function(m) {
        m.classList.remove('bw_dropdown_show');
      });
    });
  `);

  // Theme swatch click handlers — update palette explainer + apply theme
  Object.keys(bw.THEME_PRESETS).forEach(function(name) {
    client.on('theme-' + name, function() {
      currentThemeConfig = bw.THEME_PRESETS[name];
      // Apply theme CSS on client, then re-render gallery with new palette swatches
      client.exec("bw.loadStyles(bw.THEME_PRESETS['" + name + "']);");
      client.render('#app', buildGallery());
      console.log('[tester] Theme switched to: ' + name);
    });
  });

  // Dark mode toggle
  client.on('toggle-dark', function() {
    client.exec('bw.toggleStyles();');
    console.log('[tester] Dark mode toggled');
  });

  // Listen for disconnect
  client.on('_disconnect', function() {
    if (activeClient === client) activeClient = null;
    console.log('[tester] Client disconnected: ' + client.id);
  });
});

// ---------------------------------------------------------------------------
// Control API — inject custom routes before the 404 handler
// ---------------------------------------------------------------------------
var origHandler = app._handleRequest.bind(app);

app._handleRequest = function(req, res) {
  var url = (req.url || '/').split('?');
  var path = url[0];
  var query = {};
  if (url[1]) {
    url[1].split('&').forEach(function(pair) {
      var kv = pair.split('=');
      query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
  }

  // /__ctl/ routes
  if (!path.startsWith('/__ctl/')) {
    return origHandler(req, res);
  }

  var ctl = path.slice('/__ctl/'.length);

  // Status
  if (ctl === 'status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connected: !!activeClient && !activeClient._closed,
      clientId: activeClient ? activeClient.id : null,
      port: PORT
    }));
    return;
  }

  // Theme switch: /__ctl/theme/indigo
  if (ctl.startsWith('theme/')) {
    var themeName = ctl.slice('theme/'.length);
    if (!activeClient || activeClient._closed) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No client connected' }));
      return;
    }
    currentThemeConfig = bw.THEME_PRESETS[themeName] || { primary: themeName, secondary: '#6c757d', tertiary: themeName };
    activeClient.exec(
      "bw.loadStyles(bw.THEME_PRESETS['" + themeName + "'] || {primary:'" + themeName + "'});"
    );
    activeClient.render('#app', buildGallery());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, theme: themeName }));
    return;
  }

  // Dark mode toggle: /__ctl/dark
  if (ctl === 'dark') {
    if (!activeClient || activeClient._closed) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No client connected' }));
      return;
    }
    activeClient.exec('bw.toggleStyles();');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, action: 'toggle-dark' }));
    return;
  }

  // Screenshot: /__ctl/screenshot?selector=body
  if (ctl === 'screenshot') {
    if (!activeClient || activeClient._closed) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No client connected' }));
      return;
    }
    var selector = query.selector || 'body';
    var format = query.format || 'png';
    activeClient.screenshot(selector, {
      format: format,
      quality: parseFloat(query.quality || '0.85'),
      timeout: 15000
    }).then(function(img) {
      var filename = 'tester-' + Date.now() + '.' + img.format;
      var filepath = resolve(SCREENSHOT_DIR, filename);
      writeFileSync(filepath, img.data);
      console.log('[tester] Screenshot saved: ' + filepath);

      // Return the image directly
      res.writeHead(200, {
        'Content-Type': 'image/' + img.format,
        'X-Screenshot-Path': filepath,
        'X-Screenshot-Size': img.width + 'x' + img.height
      });
      res.end(img.data);
    }).catch(function(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Exec: /__ctl/exec?code=...
  if (ctl === 'exec') {
    if (!activeClient || activeClient._closed) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No client connected' }));
      return;
    }
    var code = query.code || '';
    if (!code) {
      // Try reading from POST body
      var body = '';
      req.on('data', function(chunk) { body += chunk; });
      req.on('end', function() {
        activeClient.exec(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    activeClient.exec(code);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Re-render gallery: /__ctl/refresh
  if (ctl === 'refresh') {
    if (!activeClient || activeClient._closed) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No client connected' }));
      return;
    }
    activeClient.render('#app', buildGallery());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, action: 'refresh' }));
    return;
  }

  // Stop server: /__ctl/stop
  if (ctl === 'stop') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, action: 'stop' }));
    setTimeout(shutdown, 100);
    return;
  }

  // Unknown control route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unknown control: ' + ctl }));
};

// ---------------------------------------------------------------------------
// Lifecycle: auto-kill existing process, graceful shutdown
// ---------------------------------------------------------------------------

// Handle "stop" command
if (process.argv[2] === 'stop') {
  try {
    var pids = execSync('lsof -ti:9904', { encoding: 'utf8' }).trim();
    if (pids) {
      execSync('kill -9 ' + pids.split('\n').join(' '));
      console.log('[tester] Stopped process on port 9904');
    } else {
      console.log('[tester] No process on port 9904');
    }
  } catch (e) {
    console.log('[tester] No process on port 9904');
  }
  process.exit(0);
}

// Kill any existing process on this port before starting
try {
  var existing = execSync('lsof -ti:' + PORT, { encoding: 'utf8' }).trim();
  if (existing) {
    execSync('kill -9 ' + existing.split('\n').join(' '));
    console.log('[tester] Killed existing process on port ' + PORT);
    // Brief pause for port release
    execSync('sleep 1');
  }
} catch (e) {
  // No existing process — good
}

// Graceful shutdown
function shutdown() {
  console.log('\n[tester] Shutting down...');
  app.close().then(function() { process.exit(0); });
  setTimeout(function() { process.exit(1); }, 3000);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(function() {
  console.log('');
  console.log('  Component Tester running on http://localhost:' + PORT);
  console.log('');
  console.log('  View in browser:  http://localhost:' + PORT);
  console.log('  Stop:             node tools/component-tester.mjs stop');
  console.log('');
  console.log('  Control API:');
  console.log('    curl localhost:' + PORT + '/__ctl/status');
  console.log('    curl localhost:' + PORT + '/__ctl/theme/indigo');
  console.log('    curl localhost:' + PORT + '/__ctl/dark');
  console.log('    curl localhost:' + PORT + '/__ctl/screenshot');
  console.log('    curl localhost:' + PORT + '/__ctl/refresh');
  console.log('    curl localhost:' + PORT + '/__ctl/stop');
  console.log('');
});
