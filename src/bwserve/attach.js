/**
 * bwserve attach — self-contained drop-in script generator.
 *
 * Generates JS that loads bitwrench + bwclient and auto-connects
 * to a bwserve instance. When loaded in any browser page, it
 * establishes an SSE connection for remote debugging.
 *
 * Usage:
 *   <script src="http://localhost:7902/bw/attach.js"></script>
 *
 * @module bwserve/attach
 */

import { getBwClientSource } from './bwclient.js';
import { VERSION } from '../version.js';

/**
 * Generate the self-contained attach script.
 *
 * The returned JS string, when evaluated in a browser:
 * 1. Checks if bw is already loaded; if not, injects bitwrench UMD
 * 2. Evaluates bwclient source to set up bw._bwClient
 * 3. Calls bw._bwClient.attach() to connect via SSE
 *
 * @param {Object} [opts]
 * @param {string} [opts.origin=''] - Server origin (empty = same origin)
 * @returns {string} JavaScript source code
 */
export function generateAttachScript(opts) {
  opts = opts || {};
  var origin = opts.origin || '';

  var clientSource = getBwClientSource();

  return '(function() {\n'
    + '  "use strict";\n'
    + '  var origin = ' + JSON.stringify(origin) + ';\n'
    + '  function _go() {\n'
    + '    ' + clientSource + '\n'
    + '    bw._bwClient.attach(origin, {\n'
    + '      allowExec: true,\n'
    + '      onStatus: function(s) { console.log("[bw-attach] " + s); }\n'
    + '    });\n'
    + '    console.log("[bw-attach] v' + VERSION + ' connecting to " + (origin || location.origin));\n'
    + '  }\n'
    + '  if (window.bw) { _go(); return; }\n'
    + '  var s = document.createElement("script");\n'
    + '  s.src = (origin || "") + "/bw/lib/bitwrench.umd.js";\n'
    + '  s.onload = function() {\n'
    + '    if (typeof bw !== "undefined" && bw.loadStyles) bw.loadStyles();\n'
    + '    _go();\n'
    + '  };\n'
    + '  document.head.appendChild(s);\n'
    + '})();\n';
}

generateAttachScript.version = VERSION;
