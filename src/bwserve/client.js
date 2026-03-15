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
export class BwServeClient {
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
        var requestId = 'ss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        var timeout = opts.timeout || 10000;

        if (!self._allowScreenshot) {
            return Promise.reject(new Error('Screenshot not enabled. Set allowScreenshot: true in server options.'));
        }

        return new Promise(function(resolve, reject) {
            var timer = setTimeout(function() {
                delete self._pendingScreenshots[requestId];
                reject(new Error('Screenshot timeout after ' + timeout + 'ms'));
            }, timeout);

            if (!self._pendingScreenshots) self._pendingScreenshots = {};
            self._pendingScreenshots[requestId] = { resolve: resolve, reject: reject, timer: timer };

            // Register capture function on first call
            if (!self._screenshotRegistered) {
                self.register('_bw_screenshot', CAPTURE_FN_SOURCE);
                self._screenshotRegistered = true;
            }

            // Call the capture function
            self.call('_bw_screenshot', {
                clientId: self.id,
                requestId: requestId,
                selector: selector || 'body',
                format: opts.format || 'png',
                quality: opts.quality || 0.85,
                maxWidth: opts.maxWidth || null,
                maxHeight: opts.maxHeight || null,
                scale: opts.scale || 1,
                captureUrl: '/__bw/vendor/html2canvas.min.js'
            });
        });
    }

    /**
     * Resolve a pending screenshot request (called by server route handler).
     * @private
     */
    _resolveScreenshot(requestId, result) {
        if (!this._pendingScreenshots) return false;
        var pending = this._pendingScreenshots[requestId];
        if (!pending) return false;

        clearTimeout(pending.timer);
        delete this._pendingScreenshots[requestId];

        if (result.error) {
            pending.reject(new Error(result.error));
        } else {
            // Convert data URL to Buffer
            var base64 = result.data.split(',')[1];
            pending.resolve({
                data: Buffer.from(base64, 'base64'),
                width: result.width,
                height: result.height,
                format: result.format
            });
        }
        return true;
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
 * Client-side capture function source.
 * Registered via client.register('_bw_screenshot', ...) on first screenshot call.
 * @private
 */
var CAPTURE_FN_SOURCE = 'function(opts) {'
    + 'var sel = opts.selector || "body";'
    + 'var el = document.querySelector(sel);'
    + 'if (!el) {'
    + '  return fetch("/__bw/screenshot/" + opts.clientId, {'
    + '    method: "POST",'
    + '    headers: { "Content-Type": "application/json" },'
    + '    body: JSON.stringify({ requestId: opts.requestId, error: "Element not found: " + sel })'
    + '  });'
    + '}'
    + 'function _loadScript(url) {'
    + '  return new Promise(function(resolve, reject) {'
    + '    var s = document.createElement("script");'
    + '    s.src = url;'
    + '    s.onload = function() { resolve(window.html2canvas); };'
    + '    s.onerror = function() { reject(new Error("Failed to load html2canvas")); };'
    + '    document.head.appendChild(s);'
    + '  });'
    + '}'
    + 'var p = window.html2canvas'
    + '  ? Promise.resolve(window.html2canvas)'
    + '  : _loadScript(opts.captureUrl);'
    + 'p.then(function(html2canvas) {'
    + '  return html2canvas(el, { scale: opts.scale || 1, useCORS: true });'
    + '}).then(function(canvas) {'
    + '  var out = canvas;'
    + '  var mw = opts.maxWidth;'
    + '  var mh = opts.maxHeight;'
    + '  if ((mw && canvas.width > mw) || (mh && canvas.height > mh)) {'
    + '    var sw = mw ? mw / canvas.width : 1;'
    + '    var sh = mh ? mh / canvas.height : 1;'
    + '    var scale = Math.min(sw, sh);'
    + '    out = document.createElement("canvas");'
    + '    out.width = Math.round(canvas.width * scale);'
    + '    out.height = Math.round(canvas.height * scale);'
    + '    out.getContext("2d").drawImage(canvas, 0, 0, out.width, out.height);'
    + '  }'
    + '  var fmt = opts.format === "jpeg" ? "image/jpeg" : "image/png";'
    + '  var quality = opts.format === "jpeg" ? (opts.quality || 0.85) : undefined;'
    + '  var dataUrl = out.toDataURL(fmt, quality);'
    + '  return fetch("/__bw/screenshot/" + opts.clientId, {'
    + '    method: "POST",'
    + '    headers: { "Content-Type": "application/json" },'
    + '    body: JSON.stringify({'
    + '      requestId: opts.requestId,'
    + '      data: dataUrl,'
    + '      width: out.width,'
    + '      height: out.height,'
    + '      format: opts.format || "png"'
    + '    })'
    + '  });'
    + '}).catch(function(err) {'
    + '  fetch("/__bw/screenshot/" + opts.clientId, {'
    + '    method: "POST",'
    + '    headers: { "Content-Type": "application/json" },'
    + '    body: JSON.stringify({ requestId: opts.requestId, error: err.message || String(err) })'
    + '  });'
    + '});'
    + '}';
