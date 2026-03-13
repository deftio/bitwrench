/*! bwserve v2.0.17 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var url = require('url');
var path = require('path');
var http = require('http');
var fs = require('fs');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * BwServeClient — per-client connection for bwserve.
 *
 * Represents one browser tab connected via SSE. The server calls methods
 * on this object to push UI updates to the client.
 *
 * Protocol message types (sent as SSE data):
 *   { type: 'replace',  target: '#app', node: {t,a,c,o} }
 *   { type: 'append',   target: '#list', node: {t,a,c,o} }
 *   { type: 'remove',   target: '#item-3' }
 *   { type: 'patch',    target: 'bw_counter_abc', content: '42', attr: null }
 *   { type: 'batch',    ops: [ ...messages ] }
 *   { type: 'register', name: 'fn', body: 'function(x) { ... }' }
 *   { type: 'call',     name: 'fn', args: [...] }
 *   { type: 'exec',     code: 'js code string' }
 *
 * @module bwserve/client
 */

/**
 * BwServeClient — one connected browser tab.
 */
class BwServeClient {
    constructor(id, res) {
        this.id = id;
        this._res = res;       // SSE response stream (null in stub)
        this._handlers = {};   // action name → handler
        this._closed = false;
    }

    /**
     * Replace the content of a DOM element with a TACO.
     *
     * @param {string} selector - CSS selector or UUID
     * @param {Object} taco - TACO object to render
     */
    render(selector, taco) {
        this._send({ type: 'replace', target: selector, node: taco });
    }

    /**
     * Patch an element's content or attributes without rebuild.
     *
     * @param {string} id - Element UUID (from bw.uuid())
     * @param {string} content - New text content
     * @param {Object} [attr] - Attributes to update
     */
    patch(id, content, attr) {
        this._send({ type: 'patch', target: id, content, attr: attr || null });
    }

    /**
     * Append a TACO as a new child of the target element.
     *
     * @param {string} selector - CSS selector of parent
     * @param {Object} taco - TACO object to append
     */
    append(selector, taco) {
        this._send({ type: 'append', target: selector, node: taco });
    }

    /**
     * Remove an element from the DOM (with cleanup).
     *
     * @param {string} selector - CSS selector or UUID of element to remove
     */
    remove(selector) {
        this._send({ type: 'remove', target: selector });
    }

    /**
     * Send multiple operations as a single batch.
     *
     * @param {Array} ops - Array of message objects (replace/append/remove/patch)
     */
    batch(ops) {
        this._send({ type: 'batch', ops });
    }

    /**
     * Send a bw.message() dispatch to a tagged component on the client.
     *
     * @param {string} target - Component userTag or UUID
     * @param {string} action - Method name to call
     * @param {*} data - Data to pass to the method
     */
    message(target, action, data) {
        this._send({ type: 'message', target, action, data });
    }

    /**
     * Register a named function on the client for later invocation via call().
     *
     * The function body is sent as a string and compiled on the client side.
     * Registered functions persist for the lifetime of the connection.
     *
     * @param {string} name - Function name (used as key for later call())
     * @param {string} body - Function source as string, e.g. "function(el) { el.scrollTop = el.scrollHeight; }"
     */
    register(name, body) {
        this._send({ type: 'register', name, body });
    }

    /**
     * Call a previously registered or built-in function on the client.
     *
     * Built-in functions (always available, no registration needed):
     *   scrollTo, focus, download, clipboard, redirect, log
     *
     * @param {string} name - Function name (registered or built-in)
     * @param {...*} args - Arguments to pass to the function
     */
    call(name, ...args) {
        this._send({ type: 'call', name, args });
    }

    /**
     * Execute arbitrary JavaScript code on the client.
     *
     * Requires the client connection to be created with { allowExec: true }.
     * Use call() as the safe alternative when possible.
     *
     * @param {string} code - JavaScript code string to execute
     */
    exec(code) {
        this._send({ type: 'exec', code });
    }

    /**
     * Register a handler for client actions (button clicks, form submits, etc.).
     *
     * @param {string} action - Action name (from o.events declarative handler)
     * @param {Function} handler - Called with (data, client)
     * @returns {BwServeClient} this (for chaining)
     */
    on(action, handler) {
        this._handlers[action] = handler;
        return this;
    }

    /**
     * Close the SSE connection to this client.
     */
    close() {
        this._closed = true;
        if (this._res && typeof this._res.end === 'function') {
            try { this._res.end(); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Send a protocol message to the client via SSE.
     * @private
     */
    _send(msg) {
        if (this._closed) return;
        // Always store for testing / inspection
        if (!this._sent) this._sent = [];
        this._sent.push(msg);
        // Write SSE frame if we have a live response stream
        if (this._res && typeof this._res.write === 'function') {
            try {
                this._res.write('data: ' + JSON.stringify(msg) + '\n\n');
            } catch (e) {
                // Stream may have been closed — ignore write errors
            }
        }
    }

    /**
     * Dispatch an incoming action from the client.
     * @private
     */
    _dispatch(action, data) {
        const handler = this._handlers[action];
        if (handler) {
            handler(data, this);
            return true;
        }
        return false;
    }
}

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
function generateShell(opts) {
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

/**
 * bwserve — Server-driven UI library for bitwrench
 *
 * Programmatic API for building server-push UIs (Streamlit-style).
 * Uses SSE (Server-Sent Events) by default, with WebSocket opt-in.
 * Zero runtime dependencies — only Node.js stdlib (http, fs, path).
 *
 * Usage:
 *   import bwserve from 'bitwrench/bwserve';
 *   const app = bwserve.create({ port: 7902 });
 *   app.page('/', (client) => {
 *     client.render('#app', bw.makeCard({ title: 'Hello' }));
 *   });
 *   app.listen();
 *
 * @module bwserve
 */


var __dirname$1 = path.dirname(url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('bwserve.cjs.js', document.baseURI).href))));
var DIST_DIR = path.resolve(__dirname$1, '..', '..', 'dist');

// MIME type lookup for static file serving
var MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json'
};

/**
 * Create a bwserve application.
 *
 * @param {Object} opts - Server options
 * @param {number} [opts.port=7902] - Port to listen on
 * @param {string} [opts.title='bwserve'] - Page title
 * @param {string} [opts.static] - Directory to serve static files from
 * @param {boolean} [opts.injectBitwrench=true] - Auto-inject bitwrench client JS
 * @param {string|Object} [opts.theme] - Theme preset name or config object
 * @returns {BwServeApp} Application instance
 */
function create(opts) {
  return new BwServeApp(opts || {});
}

/**
 * BwServeApp — the server application object.
 *
 * Manages pages, client connections, and the HTTP/SSE server.
 */
class BwServeApp {
  constructor(opts) {
    this.port = opts.port || 7902;
    this.title = opts.title || 'bwserve';
    this.staticDir = opts.static || null;
    this.injectBitwrench = opts.injectBitwrench !== false;
    this.theme = opts.theme || null;
    this.keepAliveInterval = opts.keepAliveInterval || 15000;
    this._pages = new Map();
    this._clients = new Map();
    this._server = null;
    this._clientCounter = 0;
  }

  /**
   * Register a page handler.
   *
   * @param {string} path - URL path (e.g., '/', '/dashboard')
   * @param {Function} handler - Called with (client: BwServeClient) on connection
   * @returns {BwServeApp} this (for chaining)
   */
  page(path, handler) {
    this._pages.set(path, handler);
    return this;
  }

  /**
   * Start the HTTP server and begin accepting SSE connections.
   *
   * @param {Function} [callback] - Called when server is listening
   * @returns {Promise<void>}
   */
  listen(callback) {
    var self = this;

    return new Promise(function(res) {
      self._server = http.createServer(function(req, rawRes) {
        self._handleRequest(req, rawRes);
      });

      self._server.listen(self.port, function() {
        if (callback) callback();
        res();
      });
    });
  }

  /**
   * Stop the server and close all client connections.
   */
  close() {
    var self = this;
    return new Promise(function(res) {
      // Close all SSE streams
      for (var record of self._clients.values()) {
        if (record.client && typeof record.client.close === 'function') {
          record.client.close();
        }
      }
      self._clients.clear();

      if (self._server) {
        self._server.close(function() {
          self._server = null;
          res();
        });
      } else {
        res();
      }
    });
  }

  /**
   * Get count of active client connections.
   * @returns {number}
   */
  get clientCount() {
    return this._clients.size;
  }

  /**
   * Broadcast a protocol message to all connected clients.
   *
   * If msg has a clientId field, send only to that client.
   * Otherwise, broadcast to all.
   *
   * @param {Object} msg - Protocol message (replace, patch, append, remove, batch)
   * @returns {number} Number of clients that received the message
   */
  broadcast(msg) {
    if (msg.clientId) {
      var record = this._clients.get(msg.clientId);
      if (record && record.client) {
        record.client._send(msg);
        return 1;
      }
      return 0;
    }
    var count = 0;
    for (var record of this._clients.values()) {
      if (record.client && !record.client._closed) {
        record.client._send(msg);
        count++;
      }
    }
    return count;
  }

  /**
   * Internal: route incoming HTTP requests.
   * @private
   */
  _handleRequest(req, res) {
    var url = req.url || '/';
    var method = req.method || 'GET';

    // Parse URL path (strip query string)
    var path$1 = url.split('?')[0];

    // /__bw/bitwrench.umd.js — serve bitwrench client library
    if (path$1 === '/__bw/bitwrench.umd.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.js');
    }

    // /__bw/bitwrench.umd.min.js — serve minified
    if (path$1 === '/__bw/bitwrench.umd.min.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.min.js');
    }

    // /__bw/bitwrench.css — serve bitwrench CSS
    if (path$1 === '/__bw/bitwrench.css' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.css');
    }

    // /__bw/events/:clientId — SSE stream
    if (path$1.startsWith('/__bw/events/') && method === 'GET') {
      var clientId = path$1.slice('/__bw/events/'.length);
      return this._handleSSE(req, res, clientId);
    }

    // /__bw/action/:clientId — action POST
    if (path$1.startsWith('/__bw/action/') && method === 'POST') {
      var actionClientId = path$1.slice('/__bw/action/'.length);
      return this._handleAction(req, res, actionClientId);
    }

    // Registered page routes — serve shell HTML
    if (method === 'GET' && this._pages.has(path$1)) {
      var clientId2 = 'c' + (++this._clientCounter);
      var shell = generateShell({
        clientId: clientId2,
        title: this.title,
        theme: this.theme,
        injectBitwrench: this.injectBitwrench
      });
      // Store the page path for this client so SSE knows which handler to call
      this._clients.set(clientId2, { pagePath: path$1, client: null });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(shell);
      return;
    }

    // Static file serving
    if (method === 'GET' && this.staticDir) {
      var filePath = path.join(this.staticDir, path$1);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        var ext = path.extname(filePath);
        var mime = MIME_TYPES[ext] || 'application/octet-stream';
        var content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
        return;
      }
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  /**
   * Serve a file from the dist/ directory.
   * @private
   */
  _serveDistFile(res, filename) {
    var filePath = path.join(DIST_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + filename);
      return;
    }
    var ext = path.extname(filename);
    var mime = MIME_TYPES[ext] || 'application/octet-stream';
    var content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(content);
  }

  /**
   * Handle an SSE connection.
   * @private
   */
  _handleSSE(req, res, clientId) {
    var self = this;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Create client instance
    var client = new BwServeClient(clientId, res);

    // Look up the pending client record (set during page serve)
    var pending = self._clients.get(clientId);
    var pagePath = pending ? pending.pagePath : '/';
    self._clients.set(clientId, { pagePath: pagePath, client: client });

    // Keep-alive: send SSE comment periodically
    var keepAlive = setInterval(function() {
      if (!client._closed) {
        try { res.write(':keepalive\n\n'); } catch (e) { /* ignore */ }
      }
    }, self.keepAliveInterval);

    // Clean up on disconnect
    req.on('close', function() {
      clearInterval(keepAlive);
      client._closed = true;
      self._clients.delete(clientId);
    });

    // Call the page handler
    var handler = self._pages.get(pagePath);
    if (handler) {
      try {
        handler(client);
      } catch (e) {
        console.error('[bwserve] Page handler error:', e);
      }
    }
  }

  /**
   * Handle an action POST from a client.
   * @private
   */
  _handleAction(req, res, clientId) {
    var record = this._clients.get(clientId);
    if (!record || !record.client) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown client' }));
      return;
    }

    var body = '';
    req.on('data', function(chunk) {
      body += chunk;
    });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);
        var action = data.action;
        var payload = data.data || data;
        record.client._dispatch(action, payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
}

var index = { create, BwServeApp, BwServeClient };

exports.BwServeApp = BwServeApp;
exports.BwServeClient = BwServeClient;
exports.create = create;
exports.default = index;
//# sourceMappingURL=bwserve.cjs.js.map
