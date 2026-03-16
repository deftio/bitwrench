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

import { VERSION } from '../version.js';

/**
 * BwServeClient — one connected browser tab.
 */
export class BwServeClient {
    /** bwserve version (from package.json) */
    static version = VERSION;
    constructor(id, res) {
        this.id = id;
        this._res = res;       // SSE response stream (null in stub)
        this._handlers = {};   // action name → handler
        this._closed = false;
        this._pending = {};    // requestId → { resolve, reject, timer }
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
     * Built-in functions (registered by bwclient on connection):
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

    // ── Pending promise mechanism ──

    /**
     * Create a pending promise with a unique requestId and timeout.
     *
     * @param {number} [timeout=10000] - Timeout in ms
     * @returns {{ requestId: string, promise: Promise }}
     * @private
     */
    _pend(timeout) {
        var self = this;
        timeout = timeout || 10000;
        var requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

        var promise = new Promise(function(resolve, reject) {
            var timer = setTimeout(function() {
                delete self._pending[requestId];
                reject(new Error('Request timeout after ' + timeout + 'ms'));
            }, timeout);

            self._pending[requestId] = { resolve: resolve, reject: reject, timer: timer };
        });

        return { requestId: requestId, promise: promise };
    }

    /**
     * Resolve a pending promise by requestId.
     * Called by the server route handler when a POST-back arrives.
     *
     * @param {string} requestId
     * @param {Object} data - Response data (may contain .error)
     * @returns {boolean} true if a pending request was found and resolved
     * @private
     */
    _resolvePending(requestId, data) {
        var pending = this._pending[requestId];
        if (!pending) return false;

        clearTimeout(pending.timer);
        delete this._pending[requestId];

        if (data.error) {
            pending.reject(new Error(data.error));
        } else {
            pending.resolve(data.result !== undefined ? data.result : data);
        }
        return true;
    }

    // ── Query ──

    /**
     * Execute code on the client and get the result back.
     *
     * @param {string} code - JavaScript code to evaluate (return value is sent back)
     * @param {Object} [options]
     * @param {number} [options.timeout=5000] - Timeout in ms
     * @returns {Promise<*>} The result of evaluating the code
     */
    query(code, options) {
        var opts = options || {};
        var pend = this._pend(opts.timeout || 5000);
        this.call('_bw_query', { code: code, requestId: pend.requestId });
        return pend.promise;
    }

    // ── Mount ──

    /**
     * Mount a BCCL component or factory function on the client.
     *
     * @param {string} selector - CSS selector of target element
     * @param {string} factory - BCCL component name (e.g. 'accordion') or JS factory code
     * @param {Object} [props] - Props to pass to the component/factory
     * @param {Object} [options]
     * @param {number} [options.timeout=10000] - Timeout in ms
     * @returns {Promise<Object>} Resolves with { mounted: true } on success
     */
    mount(selector, factory, props, options) {
        var opts = options || {};
        var pend = this._pend(opts.timeout || 10000);
        this.call('_bw_mount', {
            target: selector,
            factory: factory,
            props: props || {},
            requestId: pend.requestId
        });
        return pend.promise;
    }

    // ── Screenshot ──

    /**
     * Capture a screenshot of the client's page or a specific element.
     *
     * Requires the server to be created with `{ allowScreenshot: true }`.
     * Uses html2canvas on the client side (lazy-loaded on first call).
     *
     * @param {string} [selector='body'] - CSS selector of element to capture
     * @param {Object} [options]
     * @param {string} [options.format='png'] - 'png' or 'jpeg'
     * @param {number} [options.quality=0.85] - JPEG quality 0-1 (ignored for PNG)
     * @param {number} [options.maxWidth] - Resize if wider (preserves aspect ratio)
     * @param {number} [options.maxHeight] - Resize if taller (preserves aspect ratio)
     * @param {number} [options.scale=1] - Device pixel ratio override
     * @param {number} [options.timeout=10000] - Reject after ms
     * @returns {Promise<Object>} { data: Buffer, width, height, format }
     */
    screenshot(selector, options) {
        var self = this;
        var opts = options || {};
        var timeout = opts.timeout || 10000;

        if (!self._allowScreenshot) {
            return Promise.reject(new Error('Screenshot not enabled. Set allowScreenshot: true in server options.'));
        }

        var pend = self._pend(timeout);

        // Call the bwclient-registered capture function
        self.call('_bw_screenshot', {
            requestId: pend.requestId,
            selector: selector || 'body',
            format: opts.format || 'png',
            quality: opts.quality || 0.85,
            maxWidth: opts.maxWidth || null,
            maxHeight: opts.maxHeight || null,
            scale: opts.scale || 1,
            captureUrl: '/bw/lib/vendor/html2canvas.min.js'
        });

        // Transform the raw response into { data: Buffer, width, height, format }
        return pend.promise.then(function(result) {
            if (!result || !result.data) return result;
            var base64 = result.data.split(',')[1];
            return {
                data: Buffer.from(base64, 'base64'),
                width: result.width,
                height: result.height,
                format: result.format
            };
        });
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
