/**
 * Bitwrench CLI - Injection modes
 * Handles embedding bitwrench into generated HTML pages
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, '../../dist');

/**
 * Get HTML to inject into <head> for the given injection mode
 * @param {'standalone'|'cdn'|'none'} mode
 * @returns {string} HTML string for <head>
 */
export function getInjectionHead(mode) {
    if (mode === 'standalone') {
        const umdPath = resolve(distDir, 'bitwrench.umd.min.js');
        const umdSource = readFileSync(umdPath, 'utf8');
        return `<script>${umdSource}</script>`;
    }

    if (mode === 'cdn') {
        let integrity = '';
        try {
            const sriPath = resolve(distDir, 'sri.json');
            const sri = JSON.parse(readFileSync(sriPath, 'utf8'));
            integrity = sri.files['bitwrench.umd.min.js'] || '';
        } catch {
            // SRI file not available — proceed without integrity
        }
        const integrityAttr = integrity ? ` integrity="${integrity}" crossorigin="anonymous"` : '';
        return `<script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"${integrityAttr}></script>`;
    }

    // mode === 'none'
    return '';
}

/**
 * Get HTML to inject before </body> for the given injection mode
 * @param {'standalone'|'cdn'|'none'} mode
 * @returns {string} HTML string before </body>
 */
export function getInjectionBodyEnd(mode) {
    if (mode === 'standalone' || mode === 'cdn') {
        return `<script>if(typeof bw!=='undefined'){bw.loadStyles();}</script>`;
    }
    // mode === 'none'
    return '';
}
