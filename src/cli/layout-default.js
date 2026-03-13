/**
 * Bitwrench CLI - Default page layout
 * Wraps converted content in a complete HTML document.
 * Delegates to bw.htmlPage() for document structure.
 */

import bw from '../bitwrench.js';

/**
 * Base page CSS for the CLI-generated pages
 */
const BASE_PAGE_CSS = `
.bw_cli_page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
}
.bw_cli_page pre {
  overflow-x: auto;
  padding: 1em;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875em;
}
.bw_cli_page code {
  font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, Courier, monospace;
}
.bw_cli_page p code {
  background: #f0f0f0;
  padding: 0.15em 0.3em;
  border-radius: 3px;
  font-size: 0.875em;
}
.bw_cli_page table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  overflow-x: auto;
  display: block;
}
.bw_cli_page th, .bw_cli_page td {
  border: 1px solid #ddd;
  padding: 0.5em 0.75em;
  text-align: left;
}
.bw_cli_page th {
  background: #f5f5f5;
  font-weight: 600;
}
.bw_cli_page blockquote {
  border-left: 4px solid #ddd;
  margin-left: 0;
  padding-left: 1em;
  color: #666;
}
.bw_cli_page img {
  max-width: 100%;
  height: auto;
}
.bw_cli_page h1, .bw_cli_page h2, .bw_cli_page h3,
.bw_cli_page h4, .bw_cli_page h5, .bw_cli_page h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.25;
}
.bw_cli_page h1 { font-size: 2em; }
.bw_cli_page h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.bw_cli_page a { color: #0366d6; text-decoration: none; }
.bw_cli_page a:hover { text-decoration: underline; }
.bw_cli_page hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
@media (max-width: 600px) {
  .bw_cli_page { padding: 1rem; }
}
`;

/**
 * Build a complete HTML page from content and options.
 * Delegates to bw.htmlPage() for document structure, adding CLI-specific
 * concerns: .bw_cli_page wrapper, generator meta tag, highlight.js, and
 * pre-resolved injection strings from inject.js.
 *
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

    const version = bw.getVersion().version;

    // Build extra <head> elements: generator meta, injection script, highlight.js CSS
    const headElements = [];

    // Generator meta tag (CLI-specific)
    headElements.push({
        t: 'meta', a: { name: 'generator', content: 'bitwrench v' + version }
    });

    // Injection script from inject.js (already pre-built HTML string)
    if (headInjection) {
        headElements.push(bw.raw(headInjection));
    }

    // Highlight.js CSS
    if (highlight) {
        headElements.push({
            t: 'link', a: {
                rel: 'stylesheet',
                href: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github.min.css'
            }
        });
    }

    // Wrap body content in .bw_cli_page div (CLI-specific)
    const wrappedBody = '<div class="bw_cli_page">\n' + bodyHTML + '\n</div>';

    // Build body-end injection (highlight.js init)
    let fullBodyEnd = bodyEndInjection || '';
    if (highlight) {
        fullBodyEnd += '<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js"></script>\n<script>hljs.highlightAll();</script>';
    }

    // Combine all CSS
    const allCSS = BASE_PAGE_CSS + (css ? '\n' + css : '');

    // Use bw.htmlPage() with runtime:'none' since CLI handles injection itself
    var page = bw.htmlPage({
        title: title,
        body: wrappedBody + (fullBodyEnd ? '\n' + fullBodyEnd : ''),
        css: allCSS,
        head: headElements,
        favicon: favicon,
        runtime: 'none'
    });

    return page;
}

export { BASE_PAGE_CSS };
