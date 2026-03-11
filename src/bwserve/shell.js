/**
 * bwserve shell — generates the HTML page shell served to browsers.
 *
 * The shell is a minimal HTML doc that:
 * - Loads bitwrench UMD + CSS from /__bw/ routes
 * - Calls bw.loadDefaultStyles()
 * - Optionally applies a theme
 * - Creates a #app div
 * - Opens an SSE connection via bw.clientConnect()
 * - Delegates data-bw-action clicks to the server via POST
 *
 * @module bwserve/shell
 */

/**
 * Generate the shell HTML page for a bwserve app.
 *
 * @param {Object} opts
 * @param {string} opts.clientId - Unique client ID for this connection
 * @param {string} [opts.title='bwserve'] - Page title
 * @param {string} [opts.theme] - Theme preset name or config
 * @param {boolean} [opts.injectBitwrench=true] - Whether to inject bitwrench scripts
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
    '<title>' + title + '</title>'
  ];

  if (inject) {
    head.push('<script src="/__bw/bitwrench.umd.js"></script>');
    head.push('<link rel="stylesheet" href="/__bw/bitwrench.css">');
  }

  head.push('</head>');
  head.push('<body>');
  head.push('<div id="app"></div>');

  var script = [
    '<script>',
    '(function() {',
    '  "use strict";',
    '  bw.loadDefaultStyles();'
  ];

  if (opts.theme) {
    script.push('  bw.generateTheme("bwserve", ' + JSON.stringify(
      typeof opts.theme === 'string'
        ? { primary: '#006666', secondary: '#333333' }
        : opts.theme
    ) + ');');
  }

  script.push('  var clientId = ' + JSON.stringify(clientId) + ';');
  script.push('  var conn = bw.clientConnect("/__bw/events/" + clientId, {');
  script.push('    actionUrl: "/__bw/action/" + clientId,');
  script.push('    onStatus: function(s) {');
  script.push('      if (typeof console !== "undefined") console.log("[bwserve] " + s);');
  script.push('    }');
  script.push('  });');

  // data-bw-action click delegation
  script.push('  document.addEventListener("click", function(e) {');
  script.push('    var el = e.target.closest ? e.target.closest("[data-bw-action]") : null;');
  script.push('    if (!el) return;');
  script.push('    e.preventDefault();');
  script.push('    var actionData = {};');
  script.push('    if (el.getAttribute("data-bw-id")) actionData.bwId = el.getAttribute("data-bw-id");');
  script.push('    var form = el.closest("div") || document;');
  script.push('    var inp = form.querySelector("input[type=text],input:not([type])");');
  script.push('    if (inp) { actionData.inputValue = inp.value; inp.value = ""; }');
  script.push('    conn.sendAction(el.getAttribute("data-bw-action"), actionData);');
  script.push('  });');

  // Enter key on inputs
  script.push('  document.addEventListener("keydown", function(e) {');
  script.push('    if (e.key === "Enter" && e.target.tagName === "INPUT") {');
  script.push('      var form = e.target.closest("div") || document;');
  script.push('      var btn = form.querySelector("[data-bw-action]");');
  script.push('      if (btn) {');
  script.push('        conn.sendAction(btn.getAttribute("data-bw-action"), { inputValue: e.target.value });');
  script.push('        e.target.value = "";');
  script.push('      }');
  script.push('    }');
  script.push('  });');

  script.push('})();');
  script.push('</script>');
  script.push('</body>');
  script.push('</html>');

  return head.concat(script).join('\n');
}
