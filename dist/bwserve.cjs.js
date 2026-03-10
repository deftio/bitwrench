/*! bwserve v2.0.16 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * BwServeClient — per-client connection for bwserve.
 *
 * Represents one browser tab connected via SSE. The server calls methods
 * on this object to push UI updates to the client.
 *
 * Protocol message types (sent as SSE data):
 *   { type: 'replace', target: '#app', node: {t,a,c,o} }
 *   { type: 'append',  target: '#list', node: {t,a,c,o} }
 *   { type: 'remove',  target: '#item-3' }
 *   { type: 'patch',   target: 'bw_counter_abc', content: '42', attr: null }
 *   { type: 'batch',   ops: [ ...messages ] }
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
        // TODO: close SSE response stream
        if (this._res && typeof this._res.end === 'function') {
            this._res.end();
        }
    }

    /**
     * Send a protocol message to the client via SSE.
     * @private
     */
    _send(msg) {
        if (this._closed) return;
        // TODO: write SSE frame: `data: ${JSON.stringify(msg)}\n\n`
        // Stub: store for testing
        if (!this._sent) this._sent = [];
        this._sent.push(msg);
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
 * bwserve — Server-driven UI library for bitwrench
 *
 * Programmatic API for building server-push UIs (Streamlit-style).
 * Uses SSE (Server-Sent Events) by default, with WebSocket opt-in.
 *
 * Usage:
 *   import bwserve from 'bitwrench/bwserve';
 *   const app = bwserve.create({ port: 7902 });
 *   app.page('/', (client) => {
 *     client.render('#app', bw.makeCard({ title: 'Hello' }));
 *   });
 *   app.listen();
 *
 * Design docs:
 *   dev/bw-client-server.md
 *   dev/bw-stream-agent-protocol-draft-2026-03-06.md
 *
 * @module bwserve
 */


/**
 * Create a bwserve application.
 *
 * @param {Object} opts - Server options
 * @param {number} [opts.port=7902] - Port to listen on
 * @param {string} [opts.static] - Directory to serve static files from
 * @param {boolean} [opts.injectBitwrench=true] - Auto-inject bitwrench client JS
 * @returns {BwServeApp} Application instance
 */
function create(opts = {}) {
    return new BwServeApp(opts);
}

/**
 * BwServeApp — the server application object.
 *
 * Manages pages, client connections, and the HTTP/SSE server.
 */
class BwServeApp {
    constructor(opts = {}) {
        this.port = opts.port || 7902;
        this.staticDir = opts.static || null;
        this.injectBitwrench = opts.injectBitwrench !== false;
        this._pages = new Map();
        this._clients = new Map();
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
    async listen(callback) {
        // TODO: implement HTTP server with SSE support
        // - Serve static files from this.staticDir
        // - Serve bitwrench client JS at /__bw/bitwrench.umd.min.js
        // - Serve SSE endpoint at /__bw/events/:clientId
        // - Serve action POST endpoint at /__bw/action/:clientId
        // - Generate page shell HTML for registered paths
        // - Create BwServeClient for each SSE connection
        // - Call page handler with client instance
        const msg = `bwserve stub: would listen on port ${this.port}`;
        if (callback) callback();
        console.log(msg);
        return msg;
    }

    /**
     * Stop the server and close all client connections.
     */
    async close() {
        // TODO: close all SSE streams, stop HTTP server
        if (this._server) {
            this._server.close();
            this._server = null;
        }
        for (const client of this._clients.values()) {
            client.close();
        }
        this._clients.clear();
    }

    /**
     * Get count of active client connections.
     * @returns {number}
     */
    get clientCount() {
        return this._clients.size;
    }
}

var index = { create, BwServeApp, BwServeClient };

exports.BwServeApp = BwServeApp;
exports.BwServeClient = BwServeClient;
exports.create = create;
exports.default = index;
//# sourceMappingURL=bwserve.cjs.js.map
