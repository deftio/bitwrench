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

import { BwServeClient } from './client.js';

/**
 * Create a bwserve application.
 *
 * @param {Object} opts - Server options
 * @param {number} [opts.port=7902] - Port to listen on
 * @param {string} [opts.static] - Directory to serve static files from
 * @param {boolean} [opts.injectBitwrench=true] - Auto-inject bitwrench client JS
 * @returns {BwServeApp} Application instance
 */
export function create(opts = {}) {
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

export { BwServeApp, BwServeClient };

export default { create, BwServeApp, BwServeClient };
