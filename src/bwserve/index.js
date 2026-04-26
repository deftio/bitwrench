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
import { generateShell } from './bwshell.js';
import { generateAttachScript } from './attach.js';
import { VERSION } from '../version.js';

// Resolve dist/ paths relative to the package root
import { fileURLToPath } from 'url';
import { dirname, resolve, join, extname } from 'path';
import { createServer } from 'http';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';

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
  '.map':  'application/json',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.pdf':  'application/pdf',
  '.zip':  'application/zip',
  '.gz':   'application/gzip',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.wasm': 'application/wasm',
  '.csv':  'text/csv; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8'
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
 * @param {boolean} [opts.dirList=true] - Enable directory listings when no index.html
 * @param {string} [opts.host='0.0.0.0'] - Host/address to bind to
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
    this.dirList = opts.dirList !== false;
    this.host = opts.host || '0.0.0.0';
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

      self._server.listen(self.port, self.host, function() {
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

    // /bw/attach.js — self-contained attach script for remote debugging
    if (path === '/bw/attach.js' && method === 'GET') {
      return this._serveAttachScript(req, res);
    }

    // /bw/lib/bitwrench.umd.js — serve bitwrench client library
    if (path === '/bw/lib/bitwrench.umd.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.js');
    }

    // /bw/lib/bitwrench.umd.min.js — serve minified
    if (path === '/bw/lib/bitwrench.umd.min.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.min.js');
    }

    // /bw/lib/bitwrench.css — serve bitwrench CSS
    if (path === '/bw/lib/bitwrench.css' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.css');
    }

    // /bw/events/:clientId — SSE stream
    if (path.startsWith('/bw/events/') && method === 'GET') {
      var clientId = path.slice('/bw/events/'.length);
      return this._handleSSE(req, res, clientId);
    }

    // CORS preflight for /bw/return/ (needed for cross-origin attach)
    if (method === 'OPTIONS' && path.startsWith('/bw/return/')) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    // /bw/return/<route>/<clientId> — unified return channel
    if (method === 'POST' && path.startsWith('/bw/return/')) {
      var rest = path.slice('/bw/return/'.length);
      var slash = rest.indexOf('/');
      if (slash === -1) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid return path' }));
        return;
      }
      var route = rest.slice(0, slash);
      var returnClientId = rest.slice(slash + 1);
      return this._handleReturn(req, res, route, returnClientId);
    }

    // /bw/lib/vendor/:filename — serve vendored libraries (allowlisted)
    if (path.startsWith('/bw/lib/vendor/') && method === 'GET') {
      var vendorFile = path.slice('/bw/lib/vendor/'.length);
      return this._serveVendorFile(res, vendorFile);
    }

    // Static file serving — takes priority over registered page handlers
    // so that bwserve works as a drop-in static server (like python -m
    // http.server or npx serve) with opt-in bwserve superpowers.
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
      // Directory index resolution: /foo/ => /foo/index.html
      if (path.endsWith('/')) {
        var indexPath = join(this.staticDir, path, 'index.html');
        if (existsSync(indexPath) && statSync(indexPath).isFile()) {
          var indexContent = readFileSync(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexContent);
          return;
        }
        // Directory listing when no index.html
        var dirPath = join(this.staticDir, path);
        if (this.dirList && existsSync(dirPath) && statSync(dirPath).isDirectory()) {
          var listing = this._generateDirListing(path, dirPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(listing);
          return;
        }
      }
      // Bare directory without trailing slash: /foo => 301 to /foo/
      if (!path.endsWith('/') && existsSync(filePath) && statSync(filePath).isDirectory()) {
        var qs = url.split('?')[1];
        var location = path + '/' + (qs ? '?' + qs : '');
        res.writeHead(301, { 'Location': location });
        res.end();
        return;
      }
    }

    // Registered page routes — serve bwserve shell HTML (fallback when no
    // static file matched, e.g. pipe/SSE driven pages)
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
   * Unified return channel handler.
   * Handles all client-to-server POST-backs via /bw/return/<route>/<clientId>.
   *
   * Routes:
   *   action     — fire-and-forget action dispatch (no requestId)
   *   query      — resolve pending query promise
   *   mount      — resolve pending mount promise
   *   screenshot — resolve pending screenshot promise
   *
   * @private
   */
  _handleReturn(req, res, route, clientId) {
    var record = this._clients.get(clientId);
    if (!record || !record.client) {
      res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Unknown client' }));
      return;
    }

    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);
        if (route === 'action' || route === 'event') {
          // Action/event dispatch (no requestId/pending pattern)
          var action = route === 'event'
            ? '_bw_event'
            : (data.result ? data.result.action : data.action);
          var payload = route === 'event'
            ? (data.result || data)
            : (data.result ? data.result.data : data.data || data);
          record.client._dispatch(action, payload);
        } else {
          // All other routes: resolve pending promise
          record.client._resolvePending(data.requestId, data);
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }

  /**
   * Serve the self-contained attach script at /bw/attach.js.
   * Loads bitwrench + bwclient and auto-connects via SSE.
   * @private
   */
  _serveAttachScript(req, res) {
    try {
      var js = generateAttachScript({ origin: '' });
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(js);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error generating attach script: ' + err.message);
    }
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

  /**
   * Generate an HTML directory listing page.
   * @private
   * @param {string} urlPath - URL path (with trailing slash)
   * @param {string} dirPath - Filesystem path to the directory
   * @returns {string} HTML page
   */
  _generateDirListing(urlPath, dirPath) {
    var entries = readdirSync(dirPath);
    var dirs = [];
    var files = [];

    for (var i = 0; i < entries.length; i++) {
      var name = entries[i];
      var fullPath = join(dirPath, name);
      try {
        var st = statSync(fullPath);
        if (st.isDirectory()) {
          dirs.push({ name: name + '/', size: '-' });
        } else {
          files.push({ name: name, size: _formatSize(st.size) });
        }
      } catch (e) {
        // Skip entries we cannot stat
      }
    }

    // Sort alphabetically
    dirs.sort(function(a, b) { return a.name.localeCompare(b.name); });
    files.sort(function(a, b) { return a.name.localeCompare(b.name); });

    var all = dirs.concat(files);

    var rows = '';
    // Parent directory link (unless at root)
    if (urlPath !== '/') {
      rows += '<tr><td><a href="../">..</a></td><td>-</td></tr>\n';
    }
    for (var j = 0; j < all.length; j++) {
      var entry = all[j];
      var escaped = entry.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      rows += '<tr><td><a href="' + encodeURIComponent(entry.name.replace(/\/$/, '')) + (entry.size === '-' ? '/' : '') + '">' + escaped + '</a></td><td>' + entry.size + '</td></tr>\n';
    }

    var escapedPath = urlPath.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>Index of ' + escapedPath + '</title>' +
      '<style>body{font-family:monospace;margin:2em}table{border-collapse:collapse}td,th{text-align:left;padding:4px 16px}a{text-decoration:none}a:hover{text-decoration:underline}</style>' +
      '</head><body><h1>Index of ' + escapedPath + '</h1><table><tr><th>Name</th><th>Size</th></tr>\n' +
      rows + '</table></body></html>';
  }
}

/**
 * Format a byte size as a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function _formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export var version = VERSION;

export { BwServeApp, BwServeClient, generateShell };

export default { create, version: VERSION, BwServeApp, BwServeClient, generateShell };
