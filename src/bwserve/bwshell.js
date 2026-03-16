/**
 * bwserve shell — generates the HTML page shell served to browsers.
 *
 * The shell is a minimal HTML doc that:
 * - Loads bitwrench UMD + CSS from /bw/lib/ routes
 * - Calls bw.loadStyles()
 * - Optionally applies a custom theme
 * - Creates a #app div
 * - Inlines bwclient.js for SSE, action delegation, and built-ins
 *
 * @module bwserve/bwshell
 */

import { getBwClientSource } from './bwclient.js';
import { VERSION } from '../version.js';

/**
 * Generate the shell HTML page for a bwserve app.
 *
 * @param {Object} opts
 * @param {string} opts.clientId - Unique client ID for this connection
 * @param {string} [opts.title='bwserve'] - Page title
 * @param {string} [opts.theme] - Theme preset name or config
 * @param {boolean} [opts.injectBitwrench=true] - Whether to inject bitwrench scripts
 * @param {boolean} [opts.allowExec=false] - Enable exec message type
 * @returns {string} Complete HTML document
 */
export function generateShell(opts) {
  opts = opts || {};
  var clientId = opts.clientId || 'default';
  var title = opts.title || 'bwserve';
  var inject = opts.injectBitwrench !== false;

  var head = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>' + title + '</title>',
    '<meta name="generator" content="bwserve ' + VERSION + '">'
  ];

  if (inject) {
    head.push('<script src="/bw/lib/bitwrench.umd.js"></script>');
    head.push('<link rel="stylesheet" href="/bw/lib/bitwrench.css">');
  }

  head.push('</head>');
  head.push('<body>');
  head.push('<div id="app"></div>');

  var script = [
    '<script>',
    '(function() {',
    '  "use strict";',
    '  bw.loadStyles();'
  ];

  if (opts.theme) {
    script.push('  bw.loadStyles(' + JSON.stringify(
      typeof opts.theme === 'string'
        ? { primary: '#006666', secondary: '#333333' }
        : opts.theme
    ) + ');');
  }

  script.push('})();');
  script.push('</script>');

  // Inline bwclient.js
  script.push('<script>');
  script.push(getBwClientSource());
  script.push('</script>');

  // Init script: wire up bwclient
  script.push('<script>');
  script.push('(function() {');
  script.push('  "use strict";');
  script.push('  var clientId = ' + JSON.stringify(clientId) + ';');
  if (opts.allowExec) {
    script.push('  bw._allowExec = true;');
  }
  script.push('  bw._bwClient.id = clientId;');
  script.push('  bw._bwClient._registerBuiltins();');
  script.push('  bw._bwClient._wireActions();');
  script.push('  bw._bwClient.connect("/bw/events/" + clientId, {');
  script.push('    onStatus: function(s) {');
  script.push('      if (typeof console !== "undefined") console.log("[bwserve] " + s);');
  script.push('    }');
  script.push('  });');
  script.push('})();');
  script.push('</script>');

  script.push('</body>');
  script.push('</html>');

  return head.concat(script).join('\n');
}

/** bwshell version (from package.json) */
generateShell.version = VERSION;
