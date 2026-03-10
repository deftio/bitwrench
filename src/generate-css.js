/**
 * Generate bitwrench.css from the styles object
 * Creates class-based CSS to prevent collisions with other frameworks
 */

import { getAllStyles, getStructuralStyles, generateThemedCSS,
         resolveLayout, DEFAULT_PALETTE_CONFIG } from './bitwrench-styles.js';
import { derivePalette } from './bitwrench-color-utils.js';
import fs from 'fs';
import path from 'path';

// Convert styles object to CSS string
function stylesToCSS(styles) {
  let css = `/**
 * Bitwrench v2 CSS
 * Class-based styles to prevent framework collisions
 * Generated from bitwrench-styles.js
 */

/* Base styles with .bw namespace */
`;

  // Process each style rule
  for (const [selector, rules] of Object.entries(styles)) {
    if (typeof rules !== 'object') continue;
    
    // Handle media queries
    if (selector.startsWith('@media')) {
      css += `\n${selector} {\n`;
      for (const [innerSelector, innerRules] of Object.entries(rules)) {
        css += `  ${processSelector(innerSelector)} {\n`;
        css += processRules(innerRules, '    ');
        css += `  }\n`;
      }
      css += `}\n`;
    } 
    // Handle keyframes
    else if (selector.startsWith('@keyframes')) {
      css += `\n${selector} {\n`;
      for (const [frame, frameRules] of Object.entries(rules)) {
        css += `  ${frame} {\n`;
        css += processRules(frameRules, '    ');
        css += `  }\n`;
      }
      css += `}\n`;
    }
    // Regular selectors
    else {
      const processedSelector = processSelector(selector);
      css += `\n${processedSelector} {\n`;
      css += processRules(rules, '  ');
      css += `}\n`;
    }
  }
  
  return css;
}

// Process selector to add .bw prefix where needed
function processSelector(selector) {
  // Don't modify :root, html, body, or already namespaced selectors
  if (selector === ':root' || selector === 'html' || selector === 'body' || selector.includes('.bw_')) {
    return selector;
  }
  
  // For element selectors, keep them as is (they'll be scoped by parent)
  if (/^[a-z]+$/i.test(selector) || selector === '*') {
    return selector;
  }
  
  // For class selectors, add .bw- prefix if not present
  if (selector.startsWith('.')) {
    const className = selector.substring(1);
    // Skip Bootstrap-like classes that we're overriding
    const bootstrapClasses = ['container', 'row', 'col', 'btn', 'card', 'alert', 'badge', 'table', 'form-control', 'navbar'];
    if (bootstrapClasses.some(cls => className.startsWith(cls))) {
      return selector;
    }
    return `.bw_${className}`;
  }
  
  return selector;
}

// Process CSS rules
function processRules(rules, indent = '') {
  let css = '';
  for (const [property, value] of Object.entries(rules)) {
    if (value != null && typeof value !== 'object') {
      const kebabProperty = property.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      css += `${indent}${kebabProperty}: ${value};\n`;
    }
  }
  return css;
}

// Deep-merge themed + structural: structural properties override themed
// per-property within the same selector (not overwriting entire selectors)
function deepMergeStyles(base, overrides) {
  const merged = Object.assign({}, base);
  for (const [selector, rules] of Object.entries(overrides)) {
    if (merged[selector] && typeof merged[selector] === 'object' && typeof rules === 'object') {
      merged[selector] = Object.assign({}, merged[selector], rules);
    } else {
      merged[selector] = rules;
    }
  }
  return merged;
}

// Generate the CSS — merge structural + themed (default palette) styles
const structural = getStructuralStyles();
const palette = derivePalette(DEFAULT_PALETTE_CONFIG);
const layout = resolveLayout({});
const themed = generateThemedCSS('', palette, layout);
// Themed properties layer on top of structural (colors, padding, borders)
const styles = deepMergeStyles(structural, themed);
const css = stylesToCSS(styles);

// Add additional bitwrench-specific styles
const additionalCSS = `
/* Bitwrench Page Layout */
.bw_page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.bw_page_content {
  flex: 1;
  padding: 2rem 0;
}

/* Responsive body margins */
@media (min-width: 576px) {
  .bw_page_content {
    padding: 3rem 0;
  }
}

@media (min-width: 768px) {
  .bw_page_content {
    padding: 4rem 0;
  }
}

/* Theme variations */
.bw_theme_dark,
.bw_theme_dark body {
  background-color: #212529;
  color: #fff;
}

.bw_theme_dark h1,
.bw_theme_dark h2,
.bw_theme_dark h3,
.bw_theme_dark h4,
.bw_theme_dark h5,
.bw_theme_dark h6 {
  color: #fff;
}

.bw_theme_dark .text-muted {
  color: #adb5bd !important;
}

.bw_theme_dark .lead {
  color: #e9ecef;
}

.bw_theme_dark .card {
  background-color: #343a40;
  border-color: #495057;
  color: #fff;
}

.bw_theme_dark .btn-light {
  background-color: #495057;
  border-color: #495057;
  color: #fff;
}

.bw_theme_dark .btn-light:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.bw_theme_dark .navbar-light {
  background-color: #343a40 !important;
}

.bw_theme_dark .navbar-light .navbar-brand,
.bw_theme_dark .navbar-light .nav-link {
  color: rgba(255,255,255,.8);
}

.bw_theme_dark .navbar-light .nav-link:hover {
  color: rgba(255,255,255,.9);
}

.bw_theme_dark .navbar-light .nav-link.active {
  color: #fff;
}

.bw_theme_dark .bg-light {
  background-color: #495057 !important;
  color: #fff;
}

.bw_theme_dark .text-muted {
  color: #adb5bd !important;
}

.bw_theme_dark .table {
  color: #fff;
  border-color: #495057;
}

.bw_theme_dark .table-striped > tbody > tr:nth-of-type(odd) > * {
  background-color: rgba(255, 255, 255, 0.05);
}

.bw_theme_dark .table-hover > tbody > tr:hover > * {
  background-color: rgba(255, 255, 255, 0.075);
  color: #fff;
}

.bw_theme_dark .form-control {
  background-color: #495057;
  border-color: #495057;
  color: #fff;
}

.bw_theme_dark .form-control:focus {
  background-color: #495057;
  border-color: #80bdff;
  color: #fff;
}

.bw_theme_dark .form-control::placeholder {
  color: #adb5bd;
}

.bw_theme_dark .form-select {
  background-color: #495057;
  border-color: #495057;
  color: #fff;
}

.bw_theme_dark pre {
  background-color: #343a40;
  color: #f8f9fa;
}

.bw_theme_dark code {
  color: #e83e8c;
}

/* Form switch in dark mode */
.bw_theme_dark .form-check-input:checked {
  background-color: #0dcaf0;
  border-color: #0dcaf0;
}

.bw_theme_dark .form-switch .form-check-input {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%28255, 255, 255, 0.85%29'/%3e%3c/svg%3e");
}

.bw_theme_dark .form-switch .form-check-input:checked {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.85%29'/%3e%3c/svg%3e");
}

.bw_theme_dark .form-check-label {
  color: #fff;
}

/* Ensure proper spacing for example pages */
.bw_example_page {
  padding: 0;
  margin: 0;
}

.bw_example_page .container {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

/* Make cards equal height in grid */
.row > [class*="col-"] > .card {
  height: 100%;
}

/* Improve table styling */
.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.bw_theme_dark .table th {
  background-color: #343a40;
  border-bottom-color: #495057;
}

/* Better spacing for buttons */
.btn + .btn {
  margin-left: 0.5rem;
}

/* Card improvements */
.card {
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
}

.card-title {
  font-weight: 600;
}

/* Navbar improvements */
.navbar {
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
}

.navbar-brand {
  font-weight: 600;
}

/* Form improvements */
.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Code block improvements */
pre {
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
}

.bw_theme_dark pre {
  border-color: #495057;
}

/* Alert improvements */
.alert {
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}

/* Progress bar improvements */
.progress {
  box-shadow: none;
  border: 1px solid rgba(0,0,0,.1);
}

/* Badge improvements */
.badge {
  font-weight: 500;
  padding: 0.375em 0.75em;
}

/* Responsive utilities */
@media (max-width: 575.98px) {
  .display-1 { font-size: 3rem; }
  .display-2 { font-size: 2.5rem; }
  .display-3 { font-size: 2rem; }
  .display-4 { font-size: 1.75rem; }
}

/* Print styles */
@media print {
  .navbar,
  .btn,
  .bw_no_print {
    display: none !important;
  }
  
  .bw_page {
    min-height: auto;
  }
  
  .card {
    border: 1px solid #000 !important;
    page-break-inside: avoid;
  }
}
`;

// Write to file
const outputPath = path.join(process.cwd(), 'dist', 'bitwrench.css');
fs.writeFileSync(outputPath, css + additionalCSS);

console.log(`Generated bitwrench.css at ${outputPath}`);