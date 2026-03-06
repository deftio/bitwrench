#!/usr/bin/env node
/**
 * Build readme.html from README.md using the pages/ site styling.
 *
 * Usage: node tools/build-readme.js
 *
 * Converts README.md to HTML via quikdown, then wraps it in the
 * pages/ layout (shared-theme.css, shared-nav.js, page-header).
 * The result looks like a page in the docs site, not a bare CLI output.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import quikdown from '../src/vendor/quikdown.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read README.md
const readme = readFileSync(join(root, 'README.md'), 'utf8');

// Convert to HTML
const bodyHTML = quikdown(readme, { inline_styles: false });
const quikdownCSS = quikdown.emitStyles('quikdown-', 'light');

// Read package version
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Build the page using pages/ shared assets
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="bitwrench v${pkg.version}">
  <title>bitwrench.js - README</title>
  <link rel="icon" type="image/x-icon" href="images/favicon.ico">
  <script src="dist/bitwrench.umd.js"><\/script>
  <link rel="stylesheet" href="dist/bitwrench.css">
  <link rel="stylesheet" href="pages/shared-theme.css">
  <script src="pages/shared-nav.js"><\/script>
  <style>
${quikdownCSS}
/* README-specific overrides to match pages/ look */
.readme-body {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0;
  line-height: 1.6;
}
.readme-body img { max-width: 100%; height: auto; }
.readme-body table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.readme-body th, .readme-body td { border: 1px solid var(--bw-card-border); padding: 0.5em 0.75em; text-align: left; }
.readme-body th { background: var(--bw-teal-bg); font-weight: 600; }
.readme-body h2 { border-bottom: 1px solid var(--bw-card-border); padding-bottom: 0.3em; }
.readme-body a { color: var(--bw-teal); }
.readme-body a:hover { color: var(--bw-teal-dark); }
.readme-body pre { background: var(--bw-code-bg); border-radius: 6px; overflow-x: auto; border: 1px solid rgba(0,0,0,0.1); }
.readme-body pre code { display: block; padding: 1rem; color: var(--bw-code-text); font-family: var(--bw-font-mono); font-size: 0.8125rem; line-height: 1.6; background: transparent; border: none; }
.readme-body code:not(pre code) { background: var(--bw-teal-light); color: var(--bw-teal-dark); padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.85em; font-family: var(--bw-font-mono); }
.readme-body blockquote { border-left: 4px solid var(--bw-teal); margin-left: 0; padding-left: 1em; color: var(--bw-text-secondary); }
  </style>
</head>
<body>
  <div id="example-nav"></div>

  <div class="page-header">
    <div class="content-container wide" style="padding-top: 0; padding-bottom: 0;">
      <h1>README</h1>
      <p class="subtitle">The project README rendered with bitwrench site styling.</p>
    </div>
  </div>

  <div class="content-container">
    <div class="demo-section">
      <div class="demo-content">
        <div class="readme-body">
${bodyHTML}
        </div>
      </div>
    </div>
  </div>

  <script>
    mountExampleNav('#example-nav', '', 'pages/');
  <\/script>
</body>
</html>`;

const outputPath = join(root, 'readme.html');
writeFileSync(outputPath, html, 'utf8');
console.log(`Generated ${outputPath} (${html.length} bytes)`);
