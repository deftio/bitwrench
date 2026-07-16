/**
 * BwServeClient — per-client connection for bwserve.
 *
 * Represents one browser tab connected via SSE. The server calls methods
 * on this object to push UI updates to the client.
 *
 * Protocol message types v2.1 (sent as SSE data, all stamped v:1):
 *   { v: 1, type: 'hello' }                                  — handshake
 *   { v: 1, type: 'mount',   ref: '#app', taco: {t,a,c,o} } — mount TACO
 *   { v: 1, type: 'append',  ref: '#list', taco: {t,a,c,o} }
 *   { v: 1, type: 'remove',  ref: '#item-3' }
 *   { v: 1, type: 'patch',   ref: '#id', text: '42' }       — discriminated patch
 *   { v: 1, type: 'batch',   ops: [ ...messages ] }
 *   { v: 1, type: 'call',    name: 'fn', args: [...] }
 *   { v: 1, type: 'listen',  topic: 'bw:lifecycle' }
 *
 * Removed in 2.1 (code-bearing): register, exec, query
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
        this._handlers = {};   // action name -> handler
        this._pending = {};    // requestId -> { resolve, timer }
        this._pendCounter = 0;
        this._closed = false;
    }

    /**
     * Mount a TACO at the given selector (2.1 verb: "mount").
     * Replaces the content of the target element.
     *
     * @param {string} selector - CSS selector or UUID (the "ref")
     * @param {Object} taco - TACO object to mount
     */
    mount(selector, taco) {
        this._send({ type: 'mount', ref: selector, taco: taco });
    }

    /**
     * Alias for mount() — backward compatibility with 2.0.x render().
     * @deprecated Use mount() instead.
     */
    render(selector, taco) {
        this.mount(selector, taco);
    }

    /**
     * Patch an element's content or attributes without rebuild.
     * 2.1 uses discriminated fields: the patch object's keys (text, attrs,
     * content, etc.) are spread directly into the message.
     *
     * @param {string} ref - CSS selector or element UUID
     * @param {Object} fields - Discriminated patch fields (e.g. {text:'hi'}, {attrs:{class:'x'}})
     */
    patch(ref, fields) {
        var msg = { type: 'patch', ref: ref };
        if (fields && typeof fields === 'object') {
            var keys = Object.keys(fields);
            for (var i = 0; i < keys.length; i++) {
                msg[keys[i]] = fields[keys[i]];
            }
        }
        this._send(msg);
    }

    /**
     * Append a TACO as a new child of the target element.
     *
     * @param {string} selector - CSS selector of parent
     * @param {Object} taco - TACO object to append
     */
    append(selector, taco) {
        this._send({ type: 'append', ref: selector, taco: taco });
    }

    /**
     * Remove an element from the DOM (with cleanup).
     *
     * @param {string} selector - CSS selector or UUID of element to remove
     */
    remove(selector) {
        this._send({ type: 'remove', ref: selector });
    }

    /**
     * Send multiple operations as a single batch.
     *
     * @param {Array} ops - Array of message objects
     */
    batch(ops) {
        this._send({ type: 'batch', ops: ops });
    }

    /**
     * Send a bw.message() dispatch to a tagged component on the client.
     *
     * @param {string} ref - Component userTag or UUID
     * @param {string} action - Method name to call
     * @param {*} data - Data to pass to the method
     */
    message(ref, action, data) {
        this._send({ type: 'message', ref: ref, action: action, data: data });
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
        this._send({ type: 'call', name: name, args: args });
    }

    /**
     * Subscribe to a client-side topic. The client will forward matching
     * events back through the return route.
     *
     * @param {string} topic - Topic name (e.g. 'bw:lifecycle')
     * @param {Function} handler - Called with (data) when topic events arrive
     * @returns {BwServeClient} this (for chaining)
     */
    listen(topic, handler) {
        this._handlers['_topic:' + topic] = handler;
        this._send({ type: 'listen', topic: topic });
        return this;
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
     * Run JavaScript on the client and return the result.
     *
     * @param {string} code - JavaScript expression to evaluate
     * @param {Object} [opts]
     * @param {number} [opts.timeout=10000] - Timeout in ms
     * @returns {Promise<*>} Resolved with the evaluation result
     */
    query(code, opts) {
        var o = opts || {};
        var pend = this._pend(o.timeout || 10000);
        this.call('_bw_query', { code: code, requestId: pend.requestId });
        return pend.promise;
    }

    /**
     * Create a pending request that resolves when the client responds.
     * @param {number} timeout - Timeout in ms
     * @returns {{ requestId: string, promise: Promise }}
     * @private
     */
    _pend(timeout) {
        var self = this;
        var requestId = 'req_' + (++this._pendCounter);
        var promise = new Promise(function(res, rej) {
            var timer = setTimeout(function() {
                delete self._pending[requestId];
                rej(new Error('Request ' + requestId + ' timed out after ' + timeout + 'ms'));
            }, timeout);
            self._pending[requestId] = { resolve: res, timer: timer };
        });
        return { requestId: requestId, promise: promise };
    }

    /**
     * Resolve a pending request by its requestId.
     * @param {string} requestId
     * @param {*} data - Response data from the client
     * @private
     */
    _resolvePending(requestId, data) {
        var entry = this._pending[requestId];
        if (entry) {
            clearTimeout(entry.timer);
            delete this._pending[requestId];
            entry.resolve(data);
        }
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
     * All messages are stamped with v: 1 (wire protocol version).
     * @private
     */
    _send(msg) {
        if (this._closed) return;
        // Stamp the wire protocol version
        msg.v = 1;
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
