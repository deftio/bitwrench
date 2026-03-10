#!/usr/bin/env node
/**
 * analyze-bccl.js — Generate YAML analysis of all BCCL components
 *
 * For each make* function:
 *   1. Calls it with sample data to produce a TACO object
 *   2. Walks the TACO tree to extract DOM hierarchy + CSS classes
 *   3. Cross-references classes against structuralRules and generateThemedCSS()
 *   4. Outputs YAML with 3 blocks per component:
 *      - taco_hierarchy (DOM tree with classes at each node)
 *      - structural_css (static layout rules per class)
 *      - themed_css (palette/layout-dependent rules per class)
 *
 * Usage: node tools/analyze-bccl.js > dev/bccl-component-analysis.yml
 */

import * as bccl from '../src/bitwrench-bccl.js';
import {
  getStructuralStyles,
  generateThemedCSS,
  resolveLayout,
  DEFAULT_PALETTE_CONFIG
} from '../src/bitwrench-styles.js';
import { derivePalette } from '../src/bitwrench-color-utils.js';

// We need bw for makeTable, makeBarChart, etc.
// bw is a default export — import it
import bw from '../src/bitwrench.js';

// ─── Build CSS lookup tables ────────────────────────────────────────────

const structural = getStructuralStyles();
const palette = derivePalette(DEFAULT_PALETTE_CONFIG);
const layout = resolveLayout({});
const themed = generateThemedCSS('', palette, layout);

// Flatten themed into a simple selector → props map
function flattenThemed(obj) {
  var result = {};
  Object.keys(obj).forEach(function(key) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // key might be a selector or a category
      var val = obj[key];
      // If val has string values → it's a rule object
      var isRule = Object.values(val).some(function(v) { return typeof v === 'string'; });
      if (isRule) {
        result[key] = val;
      } else {
        // nested category → recurse
        Object.assign(result, flattenThemed(val));
      }
    }
  });
  return result;
}

const themedFlat = flattenThemed(themed);

// ─── TACO walker ────────────────────────────────────────────────────────

/**
 * Walk a TACO tree and produce a hierarchy object:
 * { tag, classes[], children[], attrs{} }
 */
function walkTaco(taco, depth) {
  if (depth === undefined) depth = 0;
  if (!taco || typeof taco !== 'object') return null;
  if (Array.isArray(taco)) {
    return taco.map(function(item) { return walkTaco(item, depth); }).filter(Boolean);
  }

  var tag = taco.t || 'div';
  var attrs = taco.a || {};
  var cls = (attrs.class || '').split(/\s+/).filter(Boolean);

  var node = { tag: tag };
  if (cls.length > 0) node.classes = cls;

  // Capture key non-class attributes
  var interesting = {};
  Object.keys(attrs).forEach(function(k) {
    if (k === 'class' || k === 'style') return;
    if (typeof attrs[k] === 'function') return;
    if (k === 'type' || k === 'role' || k === 'data-bs-toggle' ||
        k === 'aria-label' || k === 'tabindex') {
      interesting[k] = attrs[k];
    }
  });
  if (Object.keys(interesting).length > 0) node.attrs = interesting;

  // Inline styles (these are what we want to flag for tokenization)
  if (attrs.style) {
    if (typeof attrs.style === 'string') {
      node.inline_style = attrs.style;
    } else if (typeof attrs.style === 'object') {
      node.inline_style = Object.keys(attrs.style).map(function(k) {
        return k + ': ' + attrs.style[k];
      }).join('; ');
    }
  }

  // Process children
  var content = taco.c;
  if (content !== undefined && content !== null) {
    if (typeof content === 'string') {
      node.text = content.length > 50 ? content.substring(0, 47) + '...' : content;
    } else if (Array.isArray(content)) {
      var children = [];
      content.forEach(function(child) {
        if (typeof child === 'string') {
          if (child.trim()) children.push({ text: child.length > 50 ? child.substring(0, 47) + '...' : child });
        } else if (child && typeof child === 'object') {
          var walked = walkTaco(child, depth + 1);
          if (walked) {
            if (Array.isArray(walked)) {
              children = children.concat(walked);
            } else {
              children.push(walked);
            }
          }
        }
      });
      if (children.length > 0) node.children = children;
    } else if (typeof content === 'object') {
      var walked = walkTaco(content, depth + 1);
      if (walked) node.children = Array.isArray(walked) ? walked : [walked];
    }
  }

  return node;
}

// ─── Collect all unique CSS classes from a hierarchy node ────────────────

function collectClasses(node, set) {
  if (!set) set = new Set();
  if (!node) return set;
  if (Array.isArray(node)) {
    node.forEach(function(n) { collectClasses(n, set); });
    return set;
  }
  if (node.classes) node.classes.forEach(function(c) { set.add(c); });
  if (node.children) collectClasses(node.children, set);
  return set;
}

// ─── Find CSS rules that match a class ──────────────────────────────────

function findRulesForClass(cls, ruleMap) {
  var dotCls = '.' + cls;
  var matches = {};
  Object.keys(ruleMap).forEach(function(selector) {
    // Check if this selector targets our class
    if (selector === dotCls ||
        selector.startsWith(dotCls + ' ') ||
        selector.startsWith(dotCls + ':') ||
        selector.startsWith(dotCls + '.') ||
        selector.startsWith(dotCls + ',') ||
        selector.startsWith(dotCls + '>') ||
        selector.indexOf(' ' + dotCls) !== -1 ||
        selector.indexOf(',' + dotCls) !== -1) {
      matches[selector] = ruleMap[selector];
    }
  });
  return matches;
}

// ─── Format CSS rules as compact YAML ───────────────────────────────────

function formatRules(rules, indent) {
  var lines = [];
  Object.keys(rules).forEach(function(selector) {
    lines.push(indent + selector + ':');
    var props = rules[selector];
    if (typeof props === 'object' && props !== null) {
      Object.keys(props).forEach(function(prop) {
        var val = props[prop];
        // Quote values that contain special chars
        if (typeof val === 'string' && (val.indexOf(':') !== -1 || val.indexOf('#') !== -1 ||
            val.indexOf(',') !== -1 || val.indexOf('{') !== -1)) {
          val = '"' + val.replace(/"/g, '\\"') + '"';
        }
        lines.push(indent + '  ' + prop + ': ' + val);
      });
    }
  });
  return lines;
}

// ─── Format hierarchy as YAML ───────────────────────────────────────────

function formatHierarchy(node, indent) {
  if (!indent) indent = '      ';
  var lines = [];

  if (!node) return lines;

  if (node.text && !node.tag) {
    lines.push(indent + '- "(text)"');
    return lines;
  }

  var desc = node.tag || '?';
  if (node.classes && node.classes.length) {
    desc += '  .' + node.classes.join(' .');
  }
  if (node.attrs) {
    Object.keys(node.attrs).forEach(function(k) {
      desc += '  [' + k + '=' + node.attrs[k] + ']';
    });
  }
  lines.push(indent + '- ' + desc);

  if (node.inline_style) {
    lines.push(indent + '  # INLINE: ' + node.inline_style);
  }
  if (node.text) {
    lines.push(indent + '  # text: ' + JSON.stringify(node.text));
  }
  if (node.children) {
    node.children.forEach(function(child) {
      var childLines = formatHierarchy(child, indent + '  ');
      lines = lines.concat(childLines);
    });
  }

  return lines;
}

// ─── Component sample data definitions ──────────────────────────────────

var components = [
  // --- BCCL components ---
  { name: 'makeCard', fn: bccl.makeCard, args: { title: 'Title', subtitle: 'Subtitle', content: 'Body text', footer: 'Footer', variant: 'primary', shadow: 'md', hoverable: true } },
  { name: 'makeButton', fn: bccl.makeButton, args: { text: 'Click Me', variant: 'primary' } },
  { name: 'makeContainer', fn: bccl.makeContainer, args: { children: 'Content' } },
  { name: 'makeRow', fn: bccl.makeRow, args: { gap: 3, children: ['Col 1', 'Col 2'] } },
  { name: 'makeCol', fn: bccl.makeCol, args: { size: 6, content: 'Column' } },
  { name: 'makeNav', fn: bccl.makeNav, args: { items: [{ text: 'Home', href: '#', active: true }, { text: 'About', href: '#' }, { text: 'Disabled', disabled: true }] } },
  { name: 'makeNavbar', fn: bccl.makeNavbar, args: { brand: 'MyApp', items: [{ text: 'Home', href: '#', active: true }, { text: 'About', href: '#' }], dark: true } },
  { name: 'makeTabs', fn: bccl.makeTabs, args: { tabs: [{ label: 'Tab 1', content: 'Content 1', active: true }, { label: 'Tab 2', content: 'Content 2' }] } },
  { name: 'makeAlert', fn: bccl.makeAlert, args: { content: 'Alert message', variant: 'warning', dismissible: true } },
  { name: 'makeBadge', fn: bccl.makeBadge, args: { text: 'New', variant: 'danger', pill: true } },
  { name: 'makeProgress', fn: bccl.makeProgress, args: { value: 75, variant: 'success', striped: true, animated: true, label: '75%' } },
  { name: 'makeListGroup', fn: bccl.makeListGroup, args: { interactive: true, items: [{ text: 'Active', active: true }, { text: 'Normal' }, { text: 'Disabled', disabled: true }] } },
  { name: 'makeBreadcrumb', fn: bccl.makeBreadcrumb, args: { items: [{ text: 'Home', href: '#' }, { text: 'Products', href: '#' }, { text: 'Current', active: true }] } },
  { name: 'makeForm', fn: bccl.makeForm, args: { children: [bccl.makeFormGroup({ label: 'Email', input: bccl.makeInput({ type: 'email', placeholder: 'you@example.com' }) })] } },
  { name: 'makeFormGroup', fn: bccl.makeFormGroup, args: { label: 'Name', input: bccl.makeInput({ placeholder: 'Enter name' }), help: 'Help text', required: true, validation: 'valid', feedback: 'Looks good!' } },
  { name: 'makeInput', fn: bccl.makeInput, args: { type: 'text', placeholder: 'Enter text' } },
  { name: 'makeTextarea', fn: bccl.makeTextarea, args: { placeholder: 'Message', rows: 4 } },
  { name: 'makeSelect', fn: bccl.makeSelect, args: { options: [{ value: 'a', text: 'Option A' }, { value: 'b', text: 'Option B' }] } },
  { name: 'makeCheckbox', fn: bccl.makeCheckbox, args: { label: 'Check me', checked: true } },
  { name: 'makeRadio', fn: bccl.makeRadio, args: { label: 'Option A', name: 'choice', value: 'a', checked: true } },
  { name: 'makeStack', fn: bccl.makeStack, args: { direction: 'horizontal', gap: 2, children: [bccl.makeButton({ text: 'A' }), bccl.makeButton({ text: 'B' })] } },
  { name: 'makeSpinner', fn: bccl.makeSpinner, args: { variant: 'primary', size: 'md', type: 'border' } },
  { name: 'makeHero', fn: bccl.makeHero, args: { title: 'Welcome', subtitle: 'Hero subtitle', variant: 'primary', actions: [bccl.makeButton({ text: 'Get Started' })] } },
  { name: 'makeFeatureGrid', fn: bccl.makeFeatureGrid, args: { columns: 3, features: [{ icon: 'F', title: 'Fast', description: 'Zero build step' }, { icon: 'S', title: 'Small', description: 'Under 45KB' }] } },
  { name: 'makeCTA', fn: bccl.makeCTA, args: { title: 'Ready?', description: 'Get started now', actions: [bccl.makeButton({ text: 'Sign Up' })] } },
  { name: 'makeSection', fn: bccl.makeSection, args: { title: 'Section', subtitle: 'Sub', content: 'Body', spacing: 'lg' } },
  { name: 'makeCodeDemo', fn: bccl.makeCodeDemo, args: { title: 'Example', code: 'bw.makeButton({text:"OK"})', result: bccl.makeButton({ text: 'OK' }) } },
  { name: 'makePagination', fn: bccl.makePagination, args: { pages: 5, currentPage: 3 } },
  { name: 'makeButtonGroup', fn: bccl.makeButtonGroup, args: { children: [bccl.makeButton({ text: 'A' }), bccl.makeButton({ text: 'B' })] } },
  { name: 'makeAccordion', fn: bccl.makeAccordion, args: { items: [{ title: 'Section 1', content: 'Content 1', open: true }, { title: 'Section 2', content: 'Content 2' }] } },
  { name: 'makeModal', fn: bccl.makeModal, args: { title: 'Dialog', content: 'Are you sure?', footer: bccl.makeButton({ text: 'OK' }) } },
  { name: 'makeToast', fn: bccl.makeToast, args: { title: 'Notice', content: 'Saved!', variant: 'success' } },
  { name: 'makeDropdown', fn: bccl.makeDropdown, args: { trigger: 'Menu', items: [{ text: 'Edit' }, { divider: true }, { text: 'Delete' }], variant: 'primary' } },
  { name: 'makeSwitch', fn: bccl.makeSwitch, args: { label: 'Dark mode', checked: false } },
  { name: 'makeSkeleton', fn: bccl.makeSkeleton, args: { variant: 'text', count: 3 } },
  { name: 'makeAvatar', fn: bccl.makeAvatar, args: { initials: 'JD', variant: 'primary', size: 'lg' } },
  { name: 'makeCarousel', fn: bccl.makeCarousel, args: { items: [{ content: { t: 'div', c: 'Slide 1' }, caption: 'First' }, { content: { t: 'div', c: 'Slide 2' }, caption: 'Second' }], showControls: true, showIndicators: true } },
  { name: 'makeStatCard', fn: bccl.makeStatCard, args: { value: 2345, label: 'Users', change: 5.3, variant: 'primary', icon: 'U' } },
  { name: 'makeTooltip', fn: bccl.makeTooltip, args: { content: bccl.makeButton({ text: 'Hover' }), text: 'Tooltip text', placement: 'top' } },
  { name: 'makePopover', fn: bccl.makePopover, args: { trigger: bccl.makeButton({ text: 'Click' }), title: 'Title', content: 'Popover body', placement: 'bottom' } },
  { name: 'makeSearchInput', fn: bccl.makeSearchInput, args: { placeholder: 'Search...' } },
  { name: 'makeRange', fn: bccl.makeRange, args: { min: 0, max: 100, value: 50, label: 'Volume', showValue: true } },
  { name: 'makeMediaObject', fn: bccl.makeMediaObject, args: { title: 'Title', content: 'Body', src: '/img.jpg' } },
  { name: 'makeFileUpload', fn: bccl.makeFileUpload, args: { accept: 'image/*', multiple: true, text: 'Drop files here' } },
  { name: 'makeTimeline', fn: bccl.makeTimeline, args: { items: [{ title: 'Step 1', content: 'Done', date: '2026-01', variant: 'success' }, { title: 'Step 2', content: 'In progress', date: '2026-02' }] } },
  { name: 'makeStepper', fn: bccl.makeStepper, args: { currentStep: 1, steps: [{ label: 'Account' }, { label: 'Profile' }, { label: 'Confirm' }] } },
  { name: 'makeChipInput', fn: bccl.makeChipInput, args: { chips: ['JavaScript', 'CSS'], placeholder: 'Add tag...' } },

  // --- bitwrench.js components ---
  { name: 'makeTable', fn: function(args) { return bw.makeTable(args); }, args: { data: [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }], columns: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }], striped: true, hover: true } },
  { name: 'makeTableFromArray', fn: function(args) { return bw.makeTableFromArray(args); }, args: { data: [['Name', 'Age'], ['Alice', 30], ['Bob', 25]], striped: true } },
  { name: 'makeBarChart', fn: function(args) { return bw.makeBarChart(args); }, args: { data: [{ label: 'Jan', value: 100 }, { label: 'Feb', value: 150 }], title: 'Revenue' } },
  { name: 'makeDataTable', fn: function(args) { return bw.makeDataTable(args); }, args: { title: 'Users', data: [{ name: 'Alice', role: 'Admin' }], columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }] } },
];

// ─── Generate YAML output ───────────────────────────────────────────────

var output = [];
output.push('# BCCL Component Analysis');
output.push('# Generated by tools/analyze-bccl.js');
output.push('# Date: ' + new Date().toISOString().split('T')[0]);
output.push('#');
output.push('# For each component: taco_hierarchy, structural_css, themed_css');
output.push('# Inline styles flagged with "# INLINE:" comments');
output.push('');
output.push('components:');

var allClassesUsed = new Set();
var classesWithNoStructural = [];
var classesWithNoThemed = [];
var inlineStyleCount = 0;

components.forEach(function(comp) {
  var taco;
  try {
    taco = comp.fn(comp.args);
  } catch (e) {
    output.push('  ' + comp.name + ':');
    output.push('    error: "' + e.message.replace(/"/g, '\\"') + '"');
    output.push('');
    return;
  }

  var hierarchy = walkTaco(taco);
  var classes = collectClasses(hierarchy);
  classes.forEach(function(c) { allClassesUsed.add(c); });

  // Count inline styles
  function countInline(node) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(countInline); return; }
    if (node.inline_style) inlineStyleCount++;
    if (node.children) countInline(node.children);
  }
  countInline(hierarchy);

  // Find structural and themed CSS for each class
  var structRules = {};
  var themeRules = {};
  classes.forEach(function(cls) {
    var sr = findRulesForClass(cls, structural);
    if (Object.keys(sr).length > 0) structRules = Object.assign(structRules, sr);
    else classesWithNoStructural.push(cls);

    var tr = findRulesForClass(cls, themedFlat);
    if (Object.keys(tr).length > 0) themeRules = Object.assign(themeRules, tr);
    else classesWithNoThemed.push(cls);
  });

  output.push('');
  output.push('  ' + comp.name + ':');
  output.push('    classes_used:');
  Array.from(classes).sort().forEach(function(c) {
    output.push('      - ' + c);
  });

  output.push('    taco_hierarchy:');
  var hierLines = formatHierarchy(hierarchy, '      ');
  hierLines.forEach(function(line) { output.push(line); });

  if (Object.keys(structRules).length > 0) {
    output.push('    structural_css:');
    var sLines = formatRules(structRules, '      ');
    sLines.forEach(function(line) { output.push(line); });
  } else {
    output.push('    structural_css: {}');
  }

  if (Object.keys(themeRules).length > 0) {
    output.push('    themed_css:');
    var tLines = formatRules(themeRules, '      ');
    tLines.forEach(function(line) { output.push(line); });
  } else {
    output.push('    themed_css: {}');
  }
});

// ─── Summary statistics ─────────────────────────────────────────────────

output.push('');
output.push('# ═══════════════════════════════════════════════════════');
output.push('# SUMMARY');
output.push('# ═══════════════════════════════════════════════════════');
output.push('');
output.push('summary:');
output.push('  total_components: ' + components.length);
output.push('  total_unique_classes: ' + allClassesUsed.size);
output.push('  inline_style_instances: ' + inlineStyleCount);

// Classes that have structural but no themed, and vice versa
var structOnly = [];
var themedOnly = [];
var neither = [];
allClassesUsed.forEach(function(cls) {
  var hasStruct = Object.keys(findRulesForClass(cls, structural)).length > 0;
  var hasThemed = Object.keys(findRulesForClass(cls, themedFlat)).length > 0;
  if (hasStruct && !hasThemed) structOnly.push(cls);
  if (!hasStruct && hasThemed) themedOnly.push(cls);
  if (!hasStruct && !hasThemed) neither.push(cls);
});

output.push('  structural_only_classes:');
structOnly.sort().forEach(function(c) { output.push('    - ' + c); });
output.push('  themed_only_classes:');
themedOnly.sort().forEach(function(c) { output.push('    - ' + c); });
output.push('  no_css_classes:');
neither.sort().forEach(function(c) { output.push('    - ' + c); });

// All unique classes sorted
output.push('  all_classes:');
Array.from(allClassesUsed).sort().forEach(function(c) { output.push('    - ' + c); });

console.log(output.join('\n'));
