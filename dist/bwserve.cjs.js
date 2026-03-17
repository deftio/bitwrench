/*! bwserve v2.0.18 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var url = require('url');
var path = require('path');
var http = require('http');
var fs = require('fs');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

const VERSION = '2.0.18';

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

/**
 * bwclient.js — Browser-side protocol client for bwserve.
 *
 * Injected inline by bwshell. Requires window.bw (bitwrench loaded first).
 * NOT bundled into bitwrench dist — this is a bwserve runtime asset.
 *
 * Responsibilities:
 * - SSE connection lifecycle (connect, reconnect, status)
 * - Unified POST-back via /bw/return/<route>/<clientId>
 * - Register built-in client functions (scrollTo, focus, etc.)
 * - data-bw-action click/key delegation
 * - Attach mode for remote-controlling any bitwrench page
 *
 * @module bwserve/bwclient
 */


/**
 * Return the bwclient source as a string for inline injection into the shell.
 * The version is embedded at serve-time from package.json via version.js.
 * @returns {string} JavaScript source code
 */
function getBwClientSource() {
  return BWCLIENT_SOURCE.replace('__BW_VERSION__', VERSION);
}

var BWCLIENT_SOURCE = '(function(bw) {\n'
  + '  "use strict";\n'
  + '  if (!bw) return;\n'
  + '\n'
  + '  var _client = {\n'
  + '    id: null,\n'
  + '    version: "__BW_VERSION__",\n'
  + '    status: "idle",\n'
  + '    _es: null\n'
  + '  };\n'
  + '\n'
  + '  // ── Unified POST-back ──\n'
  + '  _client.respond = function(route, requestId, result, error) {\n'
  + '    fetch("/bw/return/" + route + "/" + _client.id, {\n'
  + '      method: "POST",\n'
  + '      headers: { "Content-Type": "application/json" },\n'
  + '      body: JSON.stringify({ requestId: requestId, route: route, result: result, error: error || null })\n'
  + '    }).catch(function() {});\n'
  + '  };\n'
  + '\n'
  + '  // ── SSE connect ──\n'
  + '  _client.connect = function(url, opts) {\n'
  + '    opts = opts || {};\n'
  + '    var onStatus = opts.onStatus || function() {};\n'
  + '    function setStatus(s) { _client.status = s; onStatus(s); }\n'
  + '    setStatus("connecting");\n'
  + '    if (typeof EventSource === "undefined") return;\n'
  + '    var es = new EventSource(url);\n'
  + '    _client._es = es;\n'
  + '    es.onopen = function() { setStatus("connected"); };\n'
  + '    es.onmessage = function(e) {\n'
  + '      try {\n'
  + '        var msg = typeof e.data === "string" ? bw.parseJSONFlex(e.data) : e.data;\n'
  + '        bw.apply(msg);\n'
  + '      } catch (err) {\n'
  + '        if (typeof console !== "undefined") console.error("[bwclient]", err);\n'
  + '      }\n'
  + '    };\n'
  + '    es.onerror = function() {\n'
  + '      if (_client.status === "connected") setStatus("disconnected");\n'
  + '    };\n'
  + '  };\n'
  + '\n'
  + '  // ── Attach mode ──\n'
  + '  _client.attach = function(url, opts) {\n'
  + '    opts = opts || {};\n'
  + '    _client.id = opts.clientId || "att_" + Math.random().toString(36).slice(2, 10);\n'
  + '    if (opts.allowExec) bw._allowExec = true;\n'
  + '    _client._registerBuiltins();\n'
  + '    _client._wireActions();\n'
  + '    _client.connect(url + "/bw/events/" + _client.id, opts);\n'
  + '  };\n'
  + '\n'
  + '  // ── Send action to server ──\n'
  + '  _client.sendAction = function(action, data) {\n'
  + '    _client.respond("action", null, { action: action, data: data || {} });\n'
  + '  };\n'
  + '\n'
  + '  // ── Register built-in functions ──\n'
  + '  _client._registerBuiltins = function() {\n'
  + '    var builtins = {\n'
  + '      scrollTo: "function(sel){var el=bw._el(sel);if(el)el.scrollTop=el.scrollHeight;}",\n'
  + '      focus: "function(sel){var el=bw._el(sel);if(el&&typeof el.focus===\\"function\\")el.focus();}",\n'
  + '      download: "function(fn,c,m){if(typeof document===\\"undefined\\")return;var b=new Blob([c],{type:m||\\"text/plain\\"});var a=document.createElement(\\"a\\");a.href=URL.createObjectURL(b);a.download=fn;a.click();URL.revokeObjectURL(a.href);}",\n'
  + '      clipboard: "function(t){if(typeof navigator!==\\"undefined\\"&&navigator.clipboard)navigator.clipboard.writeText(t);}",\n'
  + '      redirect: "function(u){if(typeof window!==\\"undefined\\")window.location.href=u;}",\n'
  + '      log: "function(){console.log.apply(console,arguments);}",\n'
  + '      _bw_query: "function(opts){if(!bw._bwClient)return;try{var r=new Function(opts.code)();if(r&&typeof r.then===\\"function\\"){r.then(function(v){bw._bwClient.respond(\\"query\\",opts.requestId,v);}).catch(function(e){bw._bwClient.respond(\\"query\\",opts.requestId,null,e.message);});}else{bw._bwClient.respond(\\"query\\",opts.requestId,r);}}catch(e){bw._bwClient.respond(\\"query\\",opts.requestId,null,e.message);}}",\n'
  + '      _bw_mount: "function(opts){if(!bw._bwClient)return;try{var taco;var f=opts.factory;var n=f.replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});if(bw.BCCL&&bw.BCCL[n]){taco=bw.make(n,opts.props||{});}else if(bw._allowExec){taco=new Function(\\"props\\",f)(opts.props||{});}else{throw new Error(\\"Unknown component and allowExec disabled\\");}bw.DOM(opts.target,taco);bw._bwClient.respond(\\"mount\\",opts.requestId,{mounted:true});}catch(e){bw._bwClient.respond(\\"mount\\",opts.requestId,null,e.message);}}",\n'
  + '      _bw_screenshot: "function(opts){if(!bw._bwClient)return;var sel=opts.selector||\\"body\\";var el=document.querySelector(sel);if(!el){bw._bwClient.respond(\\"screenshot\\",opts.requestId,null,\\"Element not found: \\"+sel);return;}function _ls(url){return new Promise(function(res,rej){var s=document.createElement(\\"script\\");s.src=url;s.onload=function(){res(window.html2canvas);};s.onerror=function(){rej(new Error(\\"Failed to load html2canvas\\"));};document.head.appendChild(s);});}var p=window.html2canvas?Promise.resolve(window.html2canvas):_ls(opts.captureUrl||\\"/bw/lib/vendor/html2canvas.min.js\\");p.then(function(h2c){return h2c(el,{scale:opts.scale||1,useCORS:true});}).then(function(canvas){var out=canvas;var mw=opts.maxWidth;var mh=opts.maxHeight;if((mw&&canvas.width>mw)||(mh&&canvas.height>mh)){var sw=mw?mw/canvas.width:1;var sh=mh?mh/canvas.height:1;var sc=Math.min(sw,sh);out=document.createElement(\\"canvas\\");out.width=Math.round(canvas.width*sc);out.height=Math.round(canvas.height*sc);out.getContext(\\"2d\\").drawImage(canvas,0,0,out.width,out.height);}var fmt=opts.format===\\"jpeg\\"?\\"image/jpeg\\":\\"image/png\\";var q=opts.format===\\"jpeg\\"?(opts.quality||0.85):undefined;var dataUrl=out.toDataURL(fmt,q);bw._bwClient.respond(\\"screenshot\\",opts.requestId,{data:dataUrl,width:out.width,height:out.height,format:opts.format||\\"png\\"});}).catch(function(err){bw._bwClient.respond(\\"screenshot\\",opts.requestId,null,err.message||String(err));});}",\n'
  + '      _bw_tree: "function(opts){if(!bw._bwClient)return;var sel=opts.selector||\\"body\\";var depth=opts.depth||3;function walk(el,d){if(!el||d>depth)return null;var info={tag:el.tagName?el.tagName.toLowerCase():\\"#text\\"};if(el.id)info.id=el.id;if(el.className&&typeof el.className===\\"string\\")info.cls=el.className.split(\\" \\").slice(0,5).join(\\" \\");if(el.children&&el.children.length>0&&d<depth){info.children=[];for(var i=0;i<Math.min(el.children.length,20);i++){var c=walk(el.children[i],d+1);if(c)info.children.push(c);}}return info;}var root=document.querySelector(sel);bw._bwClient.respond(\\"query\\",opts.requestId,walk(root,0));}",\n'
  + '      _bw_listen: "function(opts){if(!bw._bwClient)return;if(!bw._bwClient._listeners)bw._bwClient._listeners={};var key=opts.selector+\\":::\\"+opts.event;if(bw._bwClient._listeners[key])return;var fn=function(e){var el=e.target.closest?e.target.closest(opts.selector):null;if(!el)return;bw._bwClient.respond(\\"event\\",null,{event:opts.event,selector:opts.selector,tagName:el.tagName,id:el.id||null,text:(el.textContent||\\"\\").slice(0,100)});};document.addEventListener(opts.event,fn,true);bw._bwClient._listeners[key]={fn:fn,event:opts.event};}",\n'
  + '      _bw_unlisten: "function(opts){if(!bw._bwClient||!bw._bwClient._listeners)return;var key=opts.selector+\\":::\\"+opts.event;var entry=bw._bwClient._listeners[key];if(!entry)return;document.removeEventListener(entry.event,entry.fn,true);delete bw._bwClient._listeners[key];}"\n'
  + '    };\n'
  + '    Object.keys(builtins).forEach(function(name) {\n'
  + '      bw.apply({ type: "register", name: name, body: builtins[name] });\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  // ── Wire up data-bw-action click delegation ──\n'
  + '  _client._wireActions = function() {\n'
  + '    document.addEventListener("click", function(e) {\n'
  + '      var el = e.target.closest ? e.target.closest("[data-bw-action]") : null;\n'
  + '      if (!el) return;\n'
  + '      e.preventDefault();\n'
  + '      var actionData = {};\n'
  + '      if (el.getAttribute("data-bw-id")) actionData.bwId = el.getAttribute("data-bw-id");\n'
  + '      var form = el.closest("div") || document;\n'
  + '      var inp = form.querySelector("input[type=text],input:not([type])");\n'
  + '      if (inp) { actionData.inputValue = inp.value; inp.value = ""; }\n'
  + '      _client.sendAction(el.getAttribute("data-bw-action"), actionData);\n'
  + '    });\n'
  + '    document.addEventListener("keydown", function(e) {\n'
  + '      if (e.key === "Enter" && e.target.tagName === "INPUT") {\n'
  + '        var form = e.target.closest("div") || document;\n'
  + '        var btn = form.querySelector("[data-bw-action]");\n'
  + '        if (btn) {\n'
  + '          _client.sendAction(btn.getAttribute("data-bw-action"), { inputValue: e.target.value });\n'
  + '          e.target.value = "";\n'
  + '        }\n'
  + '      }\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  // ── Event delegation helper ──\n'
  + '  _client.listen = function(selector, event, action) {\n'
  + '    document.addEventListener(event, function(e) {\n'
  + '      var el = e.target.closest ? e.target.closest(selector) : null;\n'
  + '      if (el) _client.sendAction(action, { selector: selector, event: event });\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  bw._bwClient = _client;\n'
  + '})(window.bw);\n';

/**
 * bwserve shell — generates the HTML page shell served to browsers.
 *
 * The shell is a minimal HTML doc that:
 * - Loads bitwrench UMD + CSS from /bw/lib/ routes
 * - Calls bw.loadStyles()
 * - Optionally applies a custom theme
 * - Creates a #app div
 * - Inlines bwclient.js for SSE, action delegation, and built-ins
 *
 * @module bwserve/bwshell
 */


/**
 * Generate the shell HTML page for a bwserve app.
 *
 * @param {Object} opts
 * @param {string} opts.clientId - Unique client ID for this connection
 * @param {string} [opts.title='bwserve'] - Page title
 * @param {string} [opts.theme] - Theme preset name or config
 * @param {boolean} [opts.injectBitwrench=true] - Whether to inject bitwrench scripts
 * @param {boolean} [opts.allowExec=false] - Enable exec message type
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
    '<title>' + title + '</title>',
    '<meta name="generator" content="bwserve ' + VERSION + '">'
  ];

  if (inject) {
    head.push('<script src="/bw/lib/bitwrench.umd.js"></script>');
    head.push('<link rel="stylesheet" href="/bw/lib/bitwrench.css">');
  }

  head.push('</head>');
  head.push('<body>');
  head.push('<div id="app"></div>');

  var script = [
    '<script>',
    '(function() {',
    '  "use strict";',
    '  bw.loadStyles();'
  ];

  if (opts.theme) {
    script.push('  bw.loadStyles(' + JSON.stringify(
      typeof opts.theme === 'string'
        ? { primary: '#006666', secondary: '#333333' }
        : opts.theme
    ) + ');');
  }

  script.push('})();');
  script.push('</script>');

  // Inline bwclient.js
  script.push('<script>');
  script.push(getBwClientSource());
  script.push('</script>');

  // Init script: wire up bwclient
  script.push('<script>');
  script.push('(function() {');
  script.push('  "use strict";');
  script.push('  var clientId = ' + JSON.stringify(clientId) + ';');
  if (opts.allowExec) {
    script.push('  bw._allowExec = true;');
  }
  script.push('  bw._bwClient.id = clientId;');
  script.push('  bw._bwClient._registerBuiltins();');
  script.push('  bw._bwClient._wireActions();');
  script.push('  bw._bwClient.connect("/bw/events/" + clientId, {');
  script.push('    onStatus: function(s) {');
  script.push('      if (typeof console !== "undefined") console.log("[bwserve] " + s);');
  script.push('    }');
  script.push('  });');
  script.push('})();');
  script.push('</script>');

  script.push('</body>');
  script.push('</html>');

  return head.concat(script).join('\n');
}

/** bwshell version (from package.json) */
generateShell.version = VERSION;

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
function generateAttachScript(opts) {
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

// Resolve dist/ — try source layout (src/bwserve/), then npm install layout,
// then dist/ itself (when running from dist/bwserve.esm.js)
var DIST_DIR = path.resolve(__dirname$1, '..', '..', 'dist');
if (!fs.existsSync(DIST_DIR)) {
  DIST_DIR = path.resolve(__dirname$1, '..', 'dist');
}
if (!fs.existsSync(DIST_DIR)) {
  DIST_DIR = __dirname$1;
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

    // /bw/attach.js — self-contained attach script for remote debugging
    if (path$1 === '/bw/attach.js' && method === 'GET') {
      return this._serveAttachScript(req, res);
    }

    // /bw/lib/bitwrench.umd.js — serve bitwrench client library
    if (path$1 === '/bw/lib/bitwrench.umd.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.js');
    }

    // /bw/lib/bitwrench.umd.min.js — serve minified
    if (path$1 === '/bw/lib/bitwrench.umd.min.js' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.umd.min.js');
    }

    // /bw/lib/bitwrench.css — serve bitwrench CSS
    if (path$1 === '/bw/lib/bitwrench.css' && method === 'GET') {
      return this._serveDistFile(res, 'bitwrench.css');
    }

    // /bw/events/:clientId — SSE stream
    if (path$1.startsWith('/bw/events/') && method === 'GET') {
      var clientId = path$1.slice('/bw/events/'.length);
      return this._handleSSE(req, res, clientId);
    }

    // CORS preflight for /bw/return/ (needed for cross-origin attach)
    if (method === 'OPTIONS' && path$1.startsWith('/bw/return/')) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    // /bw/return/<route>/<clientId> — unified return channel
    if (method === 'POST' && path$1.startsWith('/bw/return/')) {
      var rest = path$1.slice('/bw/return/'.length);
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
    if (path$1.startsWith('/bw/lib/vendor/') && method === 'GET') {
      var vendorFile = path$1.slice('/bw/lib/vendor/'.length);
      return this._serveVendorFile(res, vendorFile);
    }

    // Registered page routes — serve shell HTML
    if (method === 'GET' && this._pages.has(path$1)) {
      var clientId2 = 'c' + (++this._clientCounter);
      var shell = generateShell({
        clientId: clientId2,
        title: this.title,
        theme: this.theme,
        injectBitwrench: this.injectBitwrench,
        allowExec: this.allowExec
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
    var vendorDir = path.resolve(__dirname$1, '..', 'vendor');
    var filePath = path.join(vendorDir, filename);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Vendor file not found: ' + filename);
      return;
    }
    var content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(content);
  }
}

var version = VERSION;

var index = { create, version: VERSION, BwServeApp, BwServeClient, generateShell };

exports.BwServeApp = BwServeApp;
exports.BwServeClient = BwServeClient;
exports.create = create;
exports.default = index;
exports.generateShell = generateShell;
exports.version = version;
//# sourceMappingURL=bwserve.cjs.js.map
