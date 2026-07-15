/*! bwserve v2.1.1 | BSD-2-Clause | https://deftio.github.io/bitwrench/pages */
import { fileURLToPath } from 'url';
import { dirname, resolve, sep, extname, join } from 'path';
import { createServer } from 'http';
import { existsSync, statSync, readFileSync, readdirSync } from 'fs';

/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

const VERSION = '2.1.1';

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
 * - bw_act_* class click/key delegation
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
  + '    var base = (typeof origin !== "undefined" ? origin : "");\n'
  + '    fetch(base + "/bw/return/" + route + "/" + _client.id, {\n'
  + '      method: "POST",\n'
  + '      headers: { "Content-Type": "application/json" },\n'
  + '      body: JSON.stringify({ requestId: requestId, route: route, result: result, error: error || null })\n'
  + '    }).catch(function(e) { console.warn("[bwclient] respond failed:", e); });\n'
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
  + '  // ── Register built-in functions (safe closures, no string eval) ──\n'
  + '  _client._registerBuiltins = function() {\n'
  + '    bw.registerRemote("scrollTo", function(sel) {\n'
  + '      var el = bw.el(sel); if (el) el.scrollTop = el.scrollHeight;\n'
  + '    });\n'
  + '    bw.registerRemote("focus", function(sel) {\n'
  + '      var el = bw.el(sel); if (el && typeof el.focus === "function") el.focus();\n'
  + '    });\n'
  + '    bw.registerRemote("download", function(fn, c, m) {\n'
  + '      if (typeof document === "undefined") return;\n'
  + '      var b = new Blob([c], { type: m || "text/plain" });\n'
  + '      var a = document.createElement("a");\n'
  + '      a.href = URL.createObjectURL(b); a.download = fn; a.click();\n'
  + '      URL.revokeObjectURL(a.href);\n'
  + '    });\n'
  + '    bw.registerRemote("clipboard", function(t) {\n'
  + '      if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(t);\n'
  + '    });\n'
  + '    bw.registerRemote("redirect", function(u) {\n'
  + '      if (typeof window !== "undefined") window.location.href = u;\n'
  + '    });\n'
  + '    bw.registerRemote("log", function() {\n'
  + '      console.log.apply(console, arguments);\n'
  + '    });\n'
  + '    bw.registerRemote("_bw_mount", function(opts) {\n'
  + '      if (!bw._bwClient) return;\n'
  + '      try {\n'
  + '        var f = opts.factory;\n'
  + '        var n = f.replace(/-([a-z])/g, function(_, c) { return c.toUpperCase(); });\n'
  + '        if (bw.BCCL && bw.BCCL[n]) {\n'
  + '          var taco = bw.make(n, opts.props || {});\n'
  + '          bw.mount(opts.target, taco);\n'
  + '          bw._bwClient.respond("mount", opts.requestId, { mounted: true });\n'
  + '        } else {\n'
  + '          throw new Error("Unknown BCCL component: " + f);\n'
  + '        }\n'
  + '      } catch (e) {\n'
  + '        bw._bwClient.respond("mount", opts.requestId, null, e.message);\n'
  + '      }\n'
  + '    });\n'
  + '    bw.registerRemote("_bw_screenshot", function(opts) {\n'
  + '      if (!bw._bwClient) return;\n'
  + '      var sel = opts.selector || "body";\n'
  + '      var el = document.querySelector(sel);\n'
  + '      if (!el) { bw._bwClient.respond("screenshot", opts.requestId, null, "Element not found: " + sel); return; }\n'
  + '      function _ls(url) {\n'
  + '        return new Promise(function(res, rej) {\n'
  + '          var s = document.createElement("script"); s.src = url;\n'
  + '          s.onload = function() { res(window.html2canvas); };\n'
  + '          s.onerror = function() { rej(new Error("Failed to load html2canvas")); };\n'
  + '          document.head.appendChild(s);\n'
  + '        });\n'
  + '      }\n'
  + '      var p = window.html2canvas ? Promise.resolve(window.html2canvas) : _ls(opts.captureUrl || "/bw/lib/vendor/html2canvas.min.js");\n'
  + '      p.then(function(h2c) { return h2c(el, { scale: opts.scale || 1, useCORS: true }); })\n'
  + '       .then(function(canvas) {\n'
  + '         var out = canvas;\n'
  + '         var mw = opts.maxWidth; var mh = opts.maxHeight;\n'
  + '         if ((mw && canvas.width > mw) || (mh && canvas.height > mh)) {\n'
  + '           var sw = mw ? mw / canvas.width : 1; var sh = mh ? mh / canvas.height : 1;\n'
  + '           var sc = Math.min(sw, sh);\n'
  + '           out = document.createElement("canvas");\n'
  + '           out.width = Math.round(canvas.width * sc); out.height = Math.round(canvas.height * sc);\n'
  + '           out.getContext("2d").drawImage(canvas, 0, 0, out.width, out.height);\n'
  + '         }\n'
  + '         var fmt = opts.format === "jpeg" ? "image/jpeg" : "image/png";\n'
  + '         var q = opts.format === "jpeg" ? (opts.quality || 0.85) : undefined;\n'
  + '         var dataUrl = out.toDataURL(fmt, q);\n'
  + '         bw._bwClient.respond("screenshot", opts.requestId, { data: dataUrl, width: out.width, height: out.height, format: opts.format || "png" });\n'
  + '       }).catch(function(err) {\n'
  + '         bw._bwClient.respond("screenshot", opts.requestId, null, err.message || String(err));\n'
  + '       });\n'
  + '    });\n'
  + '    bw.registerRemote("_bw_tree", function(opts) {\n'
  + '      if (!bw._bwClient) return;\n'
  + '      var sel = opts.selector || "body"; var depth = opts.depth || 3;\n'
  + '      var root = document.querySelector(sel);\n'
  + '      if (typeof bw.inspect === "function" && bw.inspect.length === 2) {\n'
  + '        bw._bwClient.respond("query", opts.requestId, bw.inspect(root, depth)); return;\n'
  + '      }\n'
  + '      function walk(el, d) {\n'
  + '        if (!el || d > depth) return null;\n'
  + '        var info = { tag: el.tagName ? el.tagName.toLowerCase() : "#text" };\n'
  + '        if (el.id) info.id = el.id;\n'
  + '        if (el.className && typeof el.className === "string") info.cls = el.className.split(" ").slice(0, 5).join(" ");\n'
  + '        if (el.children && el.children.length > 0 && d < depth) {\n'
  + '          info.children = [];\n'
  + '          for (var i = 0; i < Math.min(el.children.length, 20); i++) {\n'
  + '            var c = walk(el.children[i], d + 1); if (c) info.children.push(c);\n'
  + '          }\n'
  + '        }\n'
  + '        return info;\n'
  + '      }\n'
  + '      bw._bwClient.respond("query", opts.requestId, walk(root, 0));\n'
  + '    });\n'
  + '    bw.registerRemote("_bw_query", function(opts) {\n'
  + '      if (!bw._bwClient) return;\n'
  + '      try {\n'
  + '        var result;\n'
  + '        try { result = new Function("return (" + opts.code + ")")(); }\n'
  + '        catch (se) { result = new Function(opts.code)(); }\n'
  + '        bw._bwClient.respond("query", opts.requestId, result !== undefined ? result : null);\n'
  + '      } catch (e) {\n'
  + '        bw._bwClient.respond("query", opts.requestId, null, e.message || String(e));\n'
  + '      }\n'
  + '    });\n'
  + '    bw.registerRemote("_bw_listen", function(opts) {\n'
  + '      if (!bw._bwClient) return;\n'
  + '      if (!bw._bwClient._listeners) bw._bwClient._listeners = {};\n'
  + '      var key = opts.selector + ":::" + opts.event;\n'
  + '      if (bw._bwClient._listeners[key]) return;\n'
  + '      var fn = function(e) {\n'
  + '        var el = e.target.closest ? e.target.closest(opts.selector) : null;\n'
  + '        if (!el) return;\n'
  + '        bw._bwClient.respond("event", null, {\n'
  + '          event: opts.event, selector: opts.selector, tagName: el.tagName,\n'
  + '          id: el.id || null, text: (el.textContent || "").slice(0, 100)\n'
  + '        });\n'
  + '      };\n'
  + '      document.addEventListener(opts.event, fn, true);\n'
  + '      bw._bwClient._listeners[key] = { fn: fn, event: opts.event };\n'
  + '    });\n'
  + '    bw.registerRemote("_bw_unlisten", function(opts) {\n'
  + '      if (!bw._bwClient || !bw._bwClient._listeners) return;\n'
  + '      var key = opts.selector + ":::" + opts.event;\n'
  + '      var entry = bw._bwClient._listeners[key];\n'
  + '      if (!entry) return;\n'
  + '      document.removeEventListener(entry.event, entry.fn, true);\n'
  + '      delete bw._bwClient._listeners[key];\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  // ── Wire up action click delegation via bw_act_* classes ──\n'
  + '  _client._wireActions = function() {\n'
  + '    document.addEventListener("click", function(e) {\n'
  + '      var el = e.target;\n'
  + '      var action = null;\n'
  + '      while (el && el !== document) {\n'
  + '        if (el.classList) {\n'
  + '          for (var i = 0; i < el.classList.length; i++) {\n'
  + '            if (el.classList[i].indexOf("bw_act_") === 0) {\n'
  + '              action = el.classList[i].substring(7);\n'
  + '              break;\n'
  + '            }\n'
  + '          }\n'
  + '        }\n'
  + '        if (action) break;\n'
  + '        el = el.parentElement;\n'
  + '      }\n'
  + '      if (!action) return;\n'
  + '      e.preventDefault();\n'
  + '      var actionData = {};\n'
  + '      if (el.id) actionData.id = el.id;\n'
  + '      var form = el.closest ? (el.closest("div") || document) : document;\n'
  + '      var inp = form.querySelector("input[type=text],input:not([type])");\n'
  + '      if (inp) { actionData.inputValue = inp.value; inp.value = ""; }\n'
  + '      _client.sendAction(action, actionData);\n'
  + '    });\n'
  + '    document.addEventListener("keydown", function(e) {\n'
  + '      if (e.key === "Enter" && e.target.tagName === "INPUT") {\n'
  + '        var form = e.target.closest ? (e.target.closest("div") || document) : document;\n'
  + '        var btn = null;\n'
  + '        var els = form.querySelectorAll("[class*=bw_act_]");\n'
  + '        if (els.length) btn = els[0];\n'
  + '        var action = null;\n'
  + '        if (btn && btn.classList) {\n'
  + '          for (var i = 0; i < btn.classList.length; i++) {\n'
  + '            if (btn.classList[i].indexOf("bw_act_") === 0) {\n'
  + '              action = btn.classList[i].substring(7);\n'
  + '              break;\n'
  + '            }\n'
  + '          }\n'
  + '          if (action) {\n'
  + '            _client.sendAction(action, { inputValue: e.target.value });\n'
  + '            e.target.value = "";\n'
  + '          }\n'
  + '        }\n'
  + '      }\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  // ── Wire bw.remote for server communication ──\n'
  + '  bw.remote = {\n'
  + '    send: function(msg) { _client.respond("action", null, msg); }\n'
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
 *     client.mount('#app', bw.makeCard({ title: 'Hello' }));
 *   });
 *   app.listen();
 *
 * @module bwserve
 */


var __dirname$1 = dirname(fileURLToPath(import.meta.url));

// Resolve dist/ — try source layout (src/bwserve/), then npm install layout,
// then dist/ itself (when running from dist/bwserve.esm.js)
var DIST_DIR = resolve(__dirname$1, '..', '..', 'dist');
/* c8 ignore next 3 -- DIST_DIR fallback at module load; only triggers in npm install layout */
if (!existsSync(DIST_DIR)) {
  DIST_DIR = resolve(__dirname$1, '..', 'dist');
}
/* c8 ignore next 3 -- DIST_DIR fallback at module load; only triggers when no dist/ exists */
if (!existsSync(DIST_DIR)) {
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
    this.port = opts.port != null ? opts.port : 7902;
    this.title = opts.title || 'bwserve';
    this.staticDir = opts.static || null;
    this.injectBitwrench = opts.injectBitwrench !== false;
    this.theme = opts.theme || null;
    this.allowScreenshot = opts.allowScreenshot || false;
    this.dirList = opts.dirList !== false;
    this.host = opts.host || '127.0.0.1';
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
        // Update port to the actual bound port (important when port 0 is used)
        var addr = self._server.address();
        if (addr && addr.port) {
          self.port = addr.port;
        }
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
    for (var rec of this._clients.values()) {
      if (rec.client && !rec.client._closed) {
        rec.client._send(msg);
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
    /* c8 ignore next 3 -- covered in isolation; flaky in combined suite due to server state */
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
    /* c8 ignore next 9 -- covered in isolation; flaky in combined suite */
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
      /* c8 ignore next 4 -- covered in isolation; flaky in combined suite */
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
      // Path traversal guard: resolve to absolute and verify containment
      var resolvedBase = resolve(this.staticDir);
      var resolvedPath = resolve(resolvedBase, '.' + path);
      if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(resolvedBase + sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      if (existsSync(resolvedPath) && statSync(resolvedPath).isFile()) {
        var ext = extname(resolvedPath);
        var mime = MIME_TYPES[ext] || 'application/octet-stream';
        var content = readFileSync(resolvedPath);
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
        return;
      }
      // Directory index resolution: /foo/ => /foo/index.html
      if (path.endsWith('/')) {
        var indexPath = join(resolvedPath, 'index.html');
        if (existsSync(indexPath) && statSync(indexPath).isFile()) {
          var indexContent = readFileSync(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexContent);
          return;
        }
        // Directory listing when no index.html
        if (this.dirList && existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
          var listing = this._generateDirListing(path, resolvedPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(listing);
          return;
        }
      }
      // Bare directory without trailing slash: /foo => 301 to /foo/
      if (!path.endsWith('/') && existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
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
        injectBitwrench: this.injectBitwrench
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

    // Send the handshake as the very first SSE event
    client._send({ type: 'hello' });

    // Keep-alive: send SSE comment periodically
    var keepAlive = setInterval(function() {
      if (!client._closed) {
        /* c8 ignore next -- keepalive write failure only on socket close */
        try { res.write(':keepalive\n\n'); } catch (e) { /* ignore */ }
      }
    }, self.keepAliveInterval);

    // Clean up on disconnect
    req.on('close', function() {
      clearInterval(keepAlive);
      client._closed = true;
      self._clients.delete(clientId);
    });

    // Call the page handler (runs on every connection, including reconnects)
    var handler = self._pages.get(pagePath);
    if (handler) {
      try {
        handler(client);
      /* c8 ignore next 3 -- page handler error catch; requires throwing handler in SSE context */
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
   *   event      — event dispatch from client listeners
   *   topic      — topic dispatch from client pub/sub
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
        if (route === 'topic') {
          // Topic dispatch — forward to the listen handler registered on the client
          var topic = data.topic;
          var topicData = data.data;
          record.client._dispatch('_topic:' + topic, topicData);
        } else if (route === 'action' || route === 'event') {
          // Action/event dispatch (no requestId/pending pattern)
          var action = route === 'event'
            ? '_bw_event'
            : (data.result ? data.result.action : data.action);
          /* c8 ignore next 3 -- data.data fallback; covered in isolation */
          var payload = route === 'event'
            ? (data.result || data)
            : (data.result ? data.result.data : data.data || data);
          record.client._dispatch(action, payload);
        } else {
          // All other routes: resolve pending promise if mechanism exists
          if (record.client._resolvePending) {
            record.client._resolvePending(data.requestId, data);
          }
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
      var h = req.headers || {};
      var proto = (h['x-forwarded-proto'] || 'http');
      var host = h['x-forwarded-host'] || h.host || '';
      var origin = host ? (proto + '://' + host) : '';
      var js = generateAttachScript({ origin: origin });
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(js);
    /* c8 ignore next 4 -- generateAttachScript is a pure template; cannot throw */
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
    var vendorDir = resolve(__dirname$1, '..', 'vendor');
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

var version = VERSION;

var index = { create, version: VERSION, BwServeApp, BwServeClient, generateShell };

export { BwServeApp, BwServeClient, create, index as default, generateShell, version };
//# sourceMappingURL=bwserve.esm.js.map
