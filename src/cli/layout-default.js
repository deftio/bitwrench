/**
 * Bitwrench CLI - Default page layout
 * Wraps converted content in a complete HTML document
 */

import bw from '../bitwrench.js';

/**
 * Base page CSS for the CLI-generated pages
 */
const BASE_PAGE_CSS = `
.bw-cli-page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
}
.bw-cli-page pre {
  overflow-x: auto;
  padding: 1em;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875em;
}
.bw-cli-page code {
  font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, Courier, monospace;
}
.bw-cli-page p code {
  background: #f0f0f0;
  padding: 0.15em 0.3em;
  border-radius: 3px;
  font-size: 0.875em;
}
.bw-cli-page table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  overflow-x: auto;
  display: block;
}
.bw-cli-page th, .bw-cli-page td {
  border: 1px solid #ddd;
  padding: 0.5em 0.75em;
  text-align: left;
}
.bw-cli-page th {
  background: #f5f5f5;
  font-weight: 600;
}
.bw-cli-page blockquote {
  border-left: 4px solid #ddd;
  margin-left: 0;
  padding-left: 1em;
  color: #666;
}
.bw-cli-page img {
  max-width: 100%;
  height: auto;
}
.bw-cli-page h1, .bw-cli-page h2, .bw-cli-page h3,
.bw-cli-page h4, .bw-cli-page h5, .bw-cli-page h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.25;
}
.bw-cli-page h1 { font-size: 2em; }
.bw-cli-page h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.bw-cli-page a { color: #0366d6; text-decoration: none; }
.bw-cli-page a:hover { text-decoration: underline; }
.bw-cli-page hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
@media (max-width: 600px) {
  .bw-cli-page { padding: 1rem; }
}
`;

/**
 * Build a complete HTML page from content and options
 * @param {Object} opts
 * @param {string} opts.title - Page title
 * @param {string} opts.bodyHTML - Rendered HTML content for the body
 * @param {string} [opts.css=''] - Additional CSS to include
 * @param {string} [opts.headInjection=''] - HTML to inject into <head> (bitwrench script)
 * @param {string} [opts.bodyEndInjection=''] - HTML to inject before </body>
 * @param {string} [opts.favicon=''] - Favicon path or URL
 * @param {boolean} [opts.highlight=false] - Include highlight.js CDN
 * @returns {string} Complete HTML document
 */
export function makePageLayout(opts) {
    const {
        title = 'Untitled',
        bodyHTML = '',
        css = '',
        headInjection = '',
        bodyEndInjection = '',
        favicon = '',
        highlight = false
    } = opts;

    const safeTitle = bw.escapeHTML(title);
    const version = bw.version;

    let faviconTag = '';
    if (favicon) {
        // Only escape quotes and angle brackets for attribute safety, not slashes
        const safeFavicon = favicon.replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
        faviconTag = `<link rel="icon" href="${safeFavicon}">`;
    }

    let highlightHead = '';
    let highlightBodyEnd = '';
    if (highlight) {
        highlightHead = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github.min.css">';
        highlightBodyEnd = '<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js"></script>\n<script>hljs.highlightAll();</script>';
    }

    const allCSS = BASE_PAGE_CSS + (css ? '\n' + css : '');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="bitwrench v${version}">
<title>${safeTitle}</title>
${faviconTag}${headInjection}${highlightHead}
<style>${allCSS}</style>
</head>
<body>
<div class="bw-cli-page">
${bodyHTML}
</div>
${bodyEndInjection}${highlightBodyEnd}
</body>
</html>`;
}

export { BASE_PAGE_CSS };
