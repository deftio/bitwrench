/**
 * Bitwrench CLI - Single-file conversion pipeline
 * Read → detect type → process → wrap in layout → write
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, extname, basename, dirname } from 'node:path';
import quikdown from '../vendor/quikdown.js';
import bw from '../bitwrench.js';
import { getAllStyles, THEME_PRESETS } from '../bitwrench-styles.js';
import { getInjectionHead, getInjectionBodyEnd } from './inject.js';
import { makePageLayout } from './layout-default.js';

/**
 * Extract title from the first # heading in markdown
 * @param {string} md - Markdown source
 * @returns {string|null} Title text or null
 */
function extractMarkdownTitle(md) {
    const match = md.match(/^#\s+(.+?)(?:\s*#*)$/m);
    return match ? match[1].trim() : null;
}

/**
 * Extract <title> from an HTML document
 * @param {string} html - HTML source
 * @returns {string|null}
 */
function extractHtmlTitle(html) {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : null;
}

/**
 * Extract <body> content from a full HTML document
 * @param {string} html - HTML source
 * @returns {string} Body content
 */
function extractHtmlBody(html) {
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return match ? match[1].trim() : html;
}

/**
 * Check if HTML string is a full document (has doctype or html tag)
 * @param {string} html
 * @returns {boolean}
 */
function isFullHtmlDoc(html) {
    const trimmed = html.trimStart().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

/**
 * Resolve the injection mode from flags
 * @param {Object} flags
 * @returns {'standalone'|'cdn'|'none'}
 */
function resolveInjectionMode(flags) {
    if (flags.standalone) return 'standalone';
    if (flags.cdn) return 'cdn';
    if (flags.noBw) return 'none';
    // Default for single-file: none
    return 'none';
}

/**
 * Resolve theme config from --theme flag value
 * @param {string} themeValue - Preset name or hex colors ("primary,secondary" or "primary,secondary,tertiary")
 * @returns {Object} Config for bw.makeStyles
 */
function resolveTheme(themeValue) {
    if (!themeValue) return null;

    // Check preset names
    const preset = THEME_PRESETS[themeValue.toLowerCase()];
    if (preset) return preset;

    // Parse hex colors: "#336699,#cc6633" or "#336699,#cc6633,#993366"
    const parts = themeValue.split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0].startsWith('#') && parts[1].startsWith('#')) {
        const config = { primary: parts[0], secondary: parts[1] };
        if (parts[2] && parts[2].startsWith('#')) {
            config.tertiary = parts[2];
        }
        return config;
    }

    throw new Error(`Unknown theme: "${themeValue}". Use a preset name (${Object.keys(THEME_PRESETS).join(', ')}) or hex colors ("#primary,#secondary").`);
}

/**
 * Derive output path from input path (replace extension with .html)
 * @param {string} inputPath
 * @returns {string}
 */
function deriveOutputPath(inputPath) {
    const ext = extname(inputPath);
    return inputPath.slice(0, -ext.length) + '.html';
}

/**
 * Convert a single file to a styled HTML page
 * @param {string} inputPath - Path to input file
 * @param {Object} flags - CLI flags
 * @returns {string} Output file path
 */
export function convertFile(inputPath, flags = {}) {
    const absInput = resolve(inputPath);
    const raw = readFileSync(absInput, 'utf8');
    const ext = extname(absInput).toLowerCase();

    let bodyHTML = '';
    let autoTitle = null;

    // Process based on file extension
    switch (ext) {
        case '.md':
        case '.markdown': {
            autoTitle = extractMarkdownTitle(raw);
            bodyHTML = quikdown(raw, { inline_styles: false });
            break;
        }
        case '.html':
        case '.htm': {
            if (isFullHtmlDoc(raw)) {
                autoTitle = extractHtmlTitle(raw);
                bodyHTML = extractHtmlBody(raw);
            } else {
                bodyHTML = raw;
            }
            break;
        }
        case '.json': {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.t) {
                // TACO object
                bodyHTML = bw.html(parsed, { raw: true });
                autoTitle = parsed.t === 'html' ? 'TACO Page' : null;
            } else {
                // Plain JSON — pretty-print as code block
                bodyHTML = `<pre><code>${bw.escapeHTML(JSON.stringify(parsed, null, 2))}</code></pre>`;
            }
            break;
        }
        default:
            throw new Error(`Unsupported file type: ${ext}. Supported: .md, .html, .htm, .json`);
    }

    // Resolve title
    const title = flags.title || autoTitle || basename(absInput, ext);

    // Resolve injection mode
    const injectionMode = resolveInjectionMode(flags);

    // Assemble CSS
    let css = '';

    // 1. Quikdown styles (for markdown files)
    if (ext === '.md' || ext === '.markdown') {
        css += quikdown.emitStyles('quikdown-', 'light');
    }

    // 2. Theme CSS
    if (flags.theme) {
        const themeConfig = resolveTheme(flags.theme);
        if (themeConfig) {
            const result = bw.makeStyles(themeConfig);
            css += '\n' + result.css;
        }
    }

    // 3. User CSS file
    if (flags.css) {
        const cssPath = resolve(flags.css);
        css += '\n' + readFileSync(cssPath, 'utf8');
    }

    // Build the page
    const headInjection = getInjectionHead(injectionMode);
    const bodyEndInjection = getInjectionBodyEnd(injectionMode);

    const html = makePageLayout({
        title,
        bodyHTML,
        css,
        headInjection,
        bodyEndInjection,
        favicon: flags.favicon || '',
        highlight: !!flags.highlight
    });

    // Write output
    const outputPath = flags.output ? resolve(flags.output) : deriveOutputPath(absInput);
    const outputDir = dirname(outputPath);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, html, 'utf8');

    return outputPath;
}

export { THEME_PRESETS, resolveTheme, deriveOutputPath, extractMarkdownTitle, extractHtmlTitle };
