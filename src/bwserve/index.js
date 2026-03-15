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

import { BwServeClient } from './client.js';
import { generateShell } from './shell.js';

// Resolve dist/ paths relative to the package root
import { fileURLToPath } from 'url';
import { dirname, resolve, join, extname } from 'path';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';

var __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve dist/ — try source layout (src/bwserve/), then npm install layout,
// then dist/ itself (when running from dist/bwserve.esm.js)
var DIST_DIR = resolve(__dirname, '..', '..', 'dist');
if (!existsSync(DIST_DIR)) {
  DIST_DIR = resolve(__dirname, '..', 'dist');
}
if (!existsSync(DIST_DIR)) {
  DIST_DIR = __dirname;
}

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
 * @param {boolean} [opts.allowScreenshot=false] - Enable client.screenshot() capability
 * @returns {BwServeApp} Application instance
 */
export function create(opts) {
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
    this.allowExec = opts.allowExec || false;
    this.allowScreenshot = opts.allowScreenshot || false;
    this.keepAliveInterval = opts.keepAliveInterval || 15000;
    this._pages = new Map();
    this._clients = new Map();
    this._clientCounter = 0;
    this._server = null;
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
      self._server = createServer(function(req, rawRes) {
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
    var path = url.split('?')[0];

    // /__bw/bitwrench.umd.js — serve bitwrench client library
    if (path === '/__bw/bitwrench.umd.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.js');
    }

    // /__bw/bitwrench.umd.min.js — serve minified
    if (path === '/__bw/bitwrench.umd.min.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.min.js');
    }

    // /__bw/bitwrench.css — serve bitwrench CSS
    if (path === '/__bw/bitwrench.css' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.css');
    }

    // /__bw/events/:clientId — SSE stream
    if (path.startsWith('/__bw/events/') && method === 'GET') {
      var clientId = path.slice('/__bw/events/'.length);
      return this._handleSSE(req, res, clientId);
    }

    // /__bw/action/:clientId — action POST
    if (path.startsWith('/__bw/action/') && method === 'POST') {
      var actionClientId = path.slice('/__bw/action/'.length);
      return this._handleAction(req, res, actionClientId);
    }

    // /__bw/screenshot/:clientId — screenshot POST-back
    if (path.startsWith('/__bw/screenshot/') && method === 'POST') {
      var ssClientId = path.slice('/__bw/screenshot/'.length);
      return this._handleScreenshot(req, res, ssClientId);
    }

    // /__bw/vendor/:filename — serve vendored libraries (allowlisted)
    if (path.startsWith('/__bw/vendor/') && method === 'GET') {
      var vendorFile = path.slice('/__bw/vendor/'.length);
      return this._serveVendorFile(res, vendorFile);
    }

    // Registered page routes — serve shell HTML
    if (method === 'GET' && this._pages.has(path)) {
      var clientId2 = 'c' + (++this._clientCounter);
      var shell = generateShell({
        clientId: clientId2,
        title: this.title,
        theme: this.theme,
        injectBitwrench: this.injectBitwrench,
        allowExec: this.allowExec
      });
      // Store the page path for this client so SSE knows which handler to call
      this._clients.set(clientId2, { pagePath: path, client: null });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(shell);
      return;
    }

    // Static file serving
    if (method === 'GET' && this.staticDir) {
      var filePath = join(this.staticDir, path);
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        var ext = extname(filePath);
        var mime = MIME_TYPES[ext] || 'application/octet-stream';
        var content = readFileSync(filePath);
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
    var filePath = join(DIST_DIR, filename);
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + filename);
      return;
    }
    var ext = extname(filename);
    var mime = MIME_TYPES[ext] || 'application/octet-stream';
    var content = readFileSync(filePath);
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
    client._allowScreenshot = this.allowScreenshot;

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

  /**
   * Handle a screenshot POST-back from a client.
   * @private
   */
  _handleScreenshot(req, res, clientId) {
    var record = this._clients.get(clientId);
    if (!record || !record.client) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown client' }));
      return;
    }

    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);
        record.client._resolveScreenshot(data.requestId, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }

  /**
   * Serve a vendored library file (allowlisted filenames only).
   * @private
   */
  _serveVendorFile(res, filename) {
    var allowed = ['html2canvas.min.js'];
    if (allowed.indexOf(filename) === -1) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    var vendorDir = resolve(__dirname, '..', 'vendor');
    var filePath = join(vendorDir, filename);
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Vendor file not found: ' + filename);
      return;
    }
    var content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(content);
  }
}

export { BwServeApp, BwServeClient };

export default { create, BwServeApp, BwServeClient };
