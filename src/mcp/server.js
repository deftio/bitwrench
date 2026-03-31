/**
 * bwmcp -- MCP server for bitwrench.
 *
 * JSON-RPC 2.0 dispatch: initialize, notifications/initialized,
 * tools/list, tools/call. Wires knowledge tools, component tools,
 * utility tools, and live rendering tools together.
 *
 * @module mcp/server
 */

import { VERSION } from '../version.js';
import { createStdioTransport } from './transport.js';
import { knowledgeToolDefs, knowledgeHandlers } from './knowledge.js';
import { componentToolDefs, utilityToolDefs, toolHandlers } from './tools.js';
import { liveToolDefs, liveHandlers, startLive, stopLive } from './live.js';

var PROTOCOL_VERSION = '2024-11-05';

// Ordered tool list: knowledge first (start_here at 0), then components, then utilities, then live
var allToolDefs = [].concat(knowledgeToolDefs, componentToolDefs, utilityToolDefs, liveToolDefs);

// Merge all handlers
var allHandlers = Object.assign({}, knowledgeHandlers, toolHandlers, liveHandlers);

/**
 * Handle a single JSON-RPC 2.0 message. Returns a response object,
 * or null for notifications (no id).
 *
 * @param {Object} msg - JSON-RPC message
 * @returns {Object|Promise<Object>|null} Response or null for notifications
 */
export function handleMessage(msg) {
  var id = msg.id;
  var method = msg.method;
  var params = msg.params || {};

  // Notification (no id) -- no response expected
  if (id === undefined || id === null) {
    return null;
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false }
          },
          serverInfo: {
            name: 'bwmcp',
            version: VERSION,
            description: 'Bitwrench MCP server with live browser UI. Call bitwrench_start_here first.'
          }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: id,
        result: {
          tools: allToolDefs
        }
      };

    case 'tools/call': {
      var toolName = params.name;
      var toolArgs = params.arguments || {};
      var handler = allHandlers[toolName];
      if (!handler) {
        return {
          jsonrpc: '2.0',
          id: id,
          error: { code: -32602, message: 'Unknown tool: ' + toolName }
        };
      }
      try {
        var result = handler(toolArgs);
        // Handle async tool results (screenshot, query_dom)
        if (result && typeof result.then === 'function') {
          return result.then(function(r) {
            return { jsonrpc: '2.0', id: id, result: r };
          }).catch(function(e) {
            return {
              jsonrpc: '2.0',
              id: id,
              result: { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true }
            };
          });
        }
        return { jsonrpc: '2.0', id: id, result: result };
      } catch (e) {
        return {
          jsonrpc: '2.0',
          id: id,
          result: { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true }
        };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id: id,
        error: { code: -32601, message: 'Method not found: ' + method }
      };
  }
}

/**
 * Create an MCP server with the given options.
 *
 * @param {Object} [opts]
 * @param {number} [opts.port=7910] - bwserve port
 * @param {string} [opts.theme] - Default theme
 * @param {boolean} [opts.open=false] - Open browser on start
 * @param {boolean} [opts.noBrowser=false] - Skip starting bwserve
 * @returns {{ listen: Function, close: Function }}
 */
export function createMcpServer(opts) {
  opts = opts || {};
  var transport = null;

  function listen() {
    transport = createStdioTransport(function(msg) {
      var response = handleMessage(msg);
      if (response === null) return; // notification, no response
      if (response && typeof response.then === 'function') {
        response.then(function(r) { transport.send(r); });
      } else {
        transport.send(response);
      }
    });

    // Start bwserve unless disabled
    if (!opts.noBrowser) {
      startLive({
        port: opts.port || 7910,
        theme: opts.theme,
        open: opts.open || false
      });
    }

    process.stderr.write('[bwmcp] MCP server ready (stdio)\n');
  }

  function close() {
    if (transport) transport.close();
    stopLive();
  }

  return { listen: listen, close: close };
}

/**
 * CLI entry point. Parse args and start the server.
 *
 * @param {string[]} argv - Command-line arguments (after node and script)
 */
export function run(argv) {
  argv = argv || [];
  var opts = {
    port: 7910,
    theme: null,
    open: false,
    noBrowser: false
  };

  for (var i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--port':
        opts.port = parseInt(argv[++i], 10) || 7910;
        break;
      case '--theme':
        opts.theme = argv[++i];
        break;
      case '--open':
        opts.open = true;
        break;
      case '--no-browser':
        opts.noBrowser = true;
        break;
      case '--help':
      case '-h':
        process.stderr.write([
          'Usage: bwmcp [options]',
          '',
          'Options:',
          '  --port <n>      bwserve port (default: 7910)',
          '  --theme <name>  Default theme preset',
          '  --open          Open browser on start',
          '  --no-browser    Skip starting bwserve (testing mode)',
          '  --help, -h      Show this help',
          ''
        ].join('\n'));
        process.exit(0);
        break;
    }
  }

  var server = createMcpServer(opts);
  server.listen();

  // Clean shutdown (once -- don't accumulate listeners across calls)
  function onSignal() {
    server.close();
    process.exit(0);
  }
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  return server;
}
