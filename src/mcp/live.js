/**
 * MCP live rendering -- bwserve integration for render_live, screenshot, inspect_dom.
 *
 * Starts a bwserve instance that serves a shell page. The MCP agent pushes
 * TACO to the browser via SSE, captures screenshots, and queries DOM state.
 *
 * @module mcp/live
 */

import bwserve from '../bwserve/index.js';

var _app = null;

/**
 * Start the bwserve live rendering server.
 *
 * @param {Object} opts
 * @param {number} [opts.port=7910]
 * @param {string} [opts.theme]
 * @param {boolean} [opts.open=false]
 * @returns {Promise<Object>} The bwserve app instance
 */
export function startLive(opts) {
  opts = opts || {};
  var port = opts.port || 7910;

  _app = bwserve.create({
    port: port,
    title: 'bwmcp',
    allowScreenshot: true,
    theme: opts.theme || null
  });

  // Register the default page handler
  _app.page('/', function(client) {
    // Render an initial placeholder
    client.mount('#app', {
      t: 'div',
      a: { class: 'bw_container', style: 'padding: 2rem; text-align: center; color: #888;' },
      c: { t: 'p', c: 'bwmcp ready -- waiting for agent to render UI...' }
    });
  });

  return new Promise(function(resolve, reject) {
    try {
      _app.listen(function() {
        process.stderr.write('[bwmcp] bwserve listening on http://localhost:' + port + '\n');

        // Open browser if requested
        if (opts.open) {
          import('child_process').then(function(cp) {
            var url = 'http://localhost:' + port;
            /* c8 ignore next 2 -- platform-dependent; only darwin in CI */
            var cmd = process.platform === 'darwin' ? 'open'
              : process.platform === 'win32' ? 'start' : 'xdg-open';
            cp.exec(cmd + ' ' + url);
          }).catch(function() { /* ignore open failures */ });
        }

        resolve(_app);
      });
    /* c8 ignore next 3 -- defensive catch for synchronous listen errors */
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Get the current bwserve app instance (for testing).
 */
export function getApp() {
  return _app;
}

/**
 * Stop the live server.
 */
export function stopLive() {
  if (_app) {
    var p = _app.close();
    _app = null;
    return p;
  }
  return Promise.resolve();
}

/**
 * Get the first connected client, or null.
 */
function getClient() {
  if (!_app) return null;
  var clients = _app._clients;
  if (!clients) return null;
  // _clients is a Map in bwserve
  for (var [, record] of clients) {
    if (record && record.client && !record.client._closed) {
      return record.client;
    }
  }
  return null;
}

// -- Live tool definitions --

export var liveToolDefs = [
  {
    name: 'render_live',
    title: 'Render TACO Live in Browser',
    description: 'Push a TACO to the connected browser window via bwserve SSE. The UI appears immediately. Use action "replace" (default), "append", "patch", or "remove".',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'CSS selector of target element (default: "#app")' },
        taco:   { type: 'object', description: 'TACO object to render' },
        action: { type: 'string', enum: ['replace', 'append', 'patch', 'remove'], description: 'Render action (default: replace)' },
        content: { type: 'string', description: 'For patch action: new text content' },
        attr:   { type: 'object', description: 'For patch action: attributes to update' }
      }
    }
  },
  {
    name: 'screenshot',
    title: 'Capture Browser Screenshot',
    description: 'Capture a screenshot of the live browser window. Returns a base64 PNG image. Useful for iterating on UI -- render, screenshot, evaluate, adjust.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to capture (default: "body")' }
      }
    }
  },
  {
    name: 'inspect_dom',
    title: 'Inspect DOM Tree',
    description: 'Inspect the DOM tree in the connected browser. Returns a structured tree with tag names, IDs, classes, and children.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of root element to inspect (default: "body")' },
        depth: { type: 'number', description: 'Maximum depth to traverse (default: 3)' }
      }
    }
  }
];

// -- Live tool handlers --

export var liveHandlers = {
  render_live: function(args) {
    if (!_app) {
      return { content: [{ type: 'text', text: 'Error: bwserve not started. Live rendering not available.' }], isError: true };
    }
    var client = getClient();
    var target = args.target || '#app';
    var action = args.action || 'replace';

    try {
      if (action === 'replace' && args.taco) {
        _app.broadcast({ type: 'replace', target: target, node: args.taco });
      } else if (action === 'append' && args.taco) {
        _app.broadcast({ type: 'append', target: target, node: args.taco });
      } else if (action === 'patch') {
        _app.broadcast({ type: 'patch', target: target, content: args.content || '', attr: args.attr || null });
      } else if (action === 'remove') {
        _app.broadcast({ type: 'remove', target: target });
      } else {
        return { content: [{ type: 'text', text: 'Error: invalid action or missing taco' }], isError: true };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ status: 'rendered', action: action, target: target, clientCount: _app.clientCount || 0 }) }],
        structuredContent: { status: 'rendered', action: action, target: target, clientCount: _app.clientCount || 0 }
      };
    } catch (e) {
      return { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true };
    }
  },

  screenshot: function(args) {
    var client = getClient();
    if (!client) {
      return Promise.resolve({
        content: [{ type: 'text', text: 'Error: no browser client connected. Open http://localhost:' + (_app ? _app._port : 7910) + ' in a browser.' }],
        isError: true
      });
    }

    var selector = (args && args.selector) || 'body';
    return client.screenshot(selector, { timeout: 10000 })
      .then(function(result) {
        var base64 = result.data.toString('base64');
        return {
          content: [{
            type: 'image',
            data: base64,
            mimeType: 'image/png'
          }]
        };
      })
      .catch(function(e) {
        return {
          content: [{ type: 'text', text: 'Screenshot error: ' + e.message }],
          isError: true
        };
      });
  },

  inspect_dom: function(args) {
    var client = getClient();
    if (!client) {
      return Promise.resolve({
        content: [{ type: 'text', text: 'Error: no browser client connected.' }],
        isError: true
      });
    }

    var pend = client._pend(5000);
    client.call('_bw_tree', {
      selector: args.selector || 'body',
      depth: args.depth || 3,
      requestId: pend.requestId
    });
    return pend.promise
      .then(function(result) {
        var text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        return { content: [{ type: 'text', text: text }] };
      })
      .catch(function(e) {
        return {
          content: [{ type: 'text', text: 'Inspect error: ' + e.message }],
          isError: true
        };
      });
  }
};
