/**
 * bwcli attach — Interactive remote debugging for bitwrench pages.
 *
 * Starts a bwserve instance and waits for a browser page to connect
 * via the drop-in attach script. Once connected, provides a REPL
 * for evaluating JS, inspecting the DOM tree, taking screenshots,
 * and listening to events in real time.
 *
 * Usage:
 *   bwcli attach [options]
 *
 * This is bitwrench's answer to Playwright/Chrome DevTools — a
 * built-in inspector that speaks the bwserve protocol.
 *
 * @module cli/attach
 */

import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { VERSION } from '../version.js';

var ATTACH_USAGE = `
bwcli attach v${VERSION} — Remote debugging REPL for bitwrench pages

Usage:
  bwcli attach [options]

Description:
  Starts a bwserve instance and waits for a browser to connect via the
  drop-in attach script. Once connected, you get an interactive REPL
  where you can evaluate JS expressions, inspect the DOM, take
  screenshots, and listen to events — all from your terminal.

  To connect a page, either:
  1. Add <script src="http://localhost:<port>/bw/attach.js"></script>
  2. Paste the script URL into devtools console:
     var s=document.createElement('script');s.src='http://localhost:<port>/bw/attach.js';document.head.appendChild(s);

Options:
  -p, --port <number>        Server port (default: 7902)
      --allow-screenshot     Enable /screenshot command (loads html2canvas in browser)
  -v, --verbose              Verbose output (show protocol details)
  -h, --help                 Print this help

REPL Commands:
  <expression>               Evaluate JS in the connected browser (e.g., document.title)
  /help                      Show command reference
  /quit, /q                  Exit
  /tree [selector] [depth]   Show DOM tree summary (default: body, depth 3)
  /screenshot [sel] [file]   Capture screenshot (requires --allow-screenshot)
  /mount <sel> <comp> [json] Mount a BCCL component on the client
  /render <sel> <taco-json>  Render a TACO object at selector
  /patch <id> <content>      Patch an element's text content
  /listen <sel> <event>      Start listening for DOM events (e.g., /listen button click)
  /unlisten <sel> <event>    Stop listening for a previously added listener
  /clients                   List connected clients
  /exec <code>               Execute JS without capturing return value

Examples:
  bwcli attach                            Start on default port 7902
  bwcli attach --port 3000                Use custom port
  bwcli attach --allow-screenshot         Enable screenshot support
  bwcli attach -v                         Verbose mode (shows protocol)

  # In the REPL:
  bw> document.title
  bw> bw.$('.bw-card').length
  bw> /tree #app 2
  bw> /screenshot body page.png
  bw> /listen .bw-btn click
  bw> /mount #app card {"title":"Hello","content":"World"}

  Workflow — build a dashboard from your terminal:
  bw> /render #app {"t":"div","c":[{"t":"h2","c":"Dashboard"},{"t":"div","a":{"id":"stats"},"c":[{"t":"span","a":{"id":"users"},"c":"Users: 0"},{"t":"span","a":{"id":"orders"},"c":"Orders: 0"}]}]}
  bw> /patch users "Users: 342"
  bw> /patch orders "Orders: 28"
  bw> /mount #app card {"title":"Status","content":"All systems go"}
  bw> /tree #app 2
  bw> /listen .bw-btn click
`.trim();

/**
 * Wrap a JS expression for client.query().
 * Statements (var, let, const, if, for, etc.) are sent as-is.
 * Expressions are wrapped in return() so the result comes back.
 *
 * @param {string} code - User input
 * @returns {string} Code suitable for new Function()
 */
export function wrapExpression(code) {
  code = code.trim();
  if (/^(var |let |const |if |for |while |function |try |switch |throw |class |\{)/.test(code)) {
    return code;
  }
  return 'return (' + code + ')';
}

/**
 * Run the attach subcommand.
 * @param {string[]} argv - arguments after "attach"
 * @param {object} [ioOpts] - optional input/output streams for testing
 */
export function runAttach(argv, ioOpts) {
  var values;

  try {
    var result = parseArgs({
      args: argv,
      strict: true,
      allowPositionals: false,
      options: {
        port:              { type: 'string', short: 'p' },
        'allow-screenshot': { type: 'boolean' },
        verbose:           { type: 'boolean', short: 'v' },
        help:              { type: 'boolean', short: 'h' }
      }
    });
    values = result.values;
  } catch (err) {
    console.error('Error: ' + err.message);
    console.error('Run "bwcli attach --help" for usage.');
    process.exit(1);
  }

  if (values.help) {
    console.log(ATTACH_USAGE);
    return;
  }

  var port = values.port ? parseInt(values.port, 10) : 7902;
  var allowScreenshot = !!values['allow-screenshot'];
  var verbose = !!values.verbose;

  if (isNaN(port) || port < 1 || port > 65535) {
    console.error('Error: --port must be a number between 1 and 65535.');
    process.exit(1);
  }

  // Dynamic import of bwserve
  var io = ioOpts || {};
  var importPath = io._importPath || '../bwserve/index.js';
  var importPromise = import(importPath).then(function(bwserve) {
    return startAttach(bwserve, { port: port, allowScreenshot: allowScreenshot, verbose: verbose, input: io.input, output: io.output });
  }).catch(function(err) {
    console.error('Failed to load bwserve: ' + err.message);
    process.exit(1);
  });

  return importPromise;
}

/**
 * Start the attach server and REPL.
 * @param {object} bwserve - The bwserve module (or mock)
 * @param {object} opts - { port, allowScreenshot, verbose, input }
 * @returns {{ rl: object, app: object }} readline interface and app for testing
 */
export function startAttach(bwserve, opts) {
  var app = bwserve.create({
    port: opts.port,
    title: 'bwcli attach',
    allowExec: true,
    allowScreenshot: opts.allowScreenshot
  });

  // Track the active client (most recent connection)
  var activeClient = null;
  var clients = new Map();

  // Register a catch-all page handler for attach connections.
  // Attach clients don't hit a registered page — they connect via SSE directly.
  // We need to handle SSE connections from attach clients by intercepting _handleSSE.
  // Since attach clients generate their own clientId (att_...), we store them when they connect.

  // Monkey-patch _handleSSE to accept attach clients (those without a pending page record)
  var origHandleSSE = app._handleSSE.bind(app);
  app._handleSSE = function(req, res, clientId) {
    // If no pending record exists, this is an attach client
    if (!app._clients.has(clientId)) {
      app._clients.set(clientId, { pagePath: '/_attach', client: null });
    }
    origHandleSSE(req, res, clientId);

    // After original handler runs, grab the client
    var record = app._clients.get(clientId);
    if (record && record.client) {
      var client = record.client;
      client._allowScreenshot = opts.allowScreenshot;
      clients.set(clientId, client);

      // Set as active client
      activeClient = client;

      // Print connection message
      process.stdout.write('\r\x1b[K');
      console.log('[connected] client ' + clientId);
      rl.prompt(true);

      // Listen for events from _bw_listen
      client.on('_bw_event', function(data) {
        process.stdout.write('\r\x1b[K');
        console.log('[event] ' + data.event + ' on ' + data.selector +
          ' \u2192 ' + data.tagName + (data.id ? '#' + data.id : '') +
          (data.text ? ' "' + data.text.slice(0, 50) + '"' : ''));
        rl.prompt(true);
      });

      // Handle disconnect
      req.on('close', function() {
        clients.delete(clientId);
        if (activeClient === client) {
          // Switch to another client or null
          activeClient = clients.size > 0 ? clients.values().next().value : null;
        }
        process.stdout.write('\r\x1b[K');
        console.log('[disconnected] client ' + clientId);
        if (activeClient) {
          console.log('[active] client ' + activeClient.id);
        } else {
          console.log('Waiting for connection...');
        }
        rl.prompt(true);
      });
    }
  };

  // Start the server
  app.listen(function() {
    var url = 'http://localhost:' + opts.port;
    console.log('bwcli attach v' + VERSION);
    console.log('  Server: ' + url);
    console.log('  Drop-in: <script src="' + url + '/bw/attach.js"></script>');
    if (opts.allowScreenshot) {
      console.log('  Screenshot: enabled');
    }
    console.log('');
    console.log('Waiting for connection...');
    console.log('Type /help for commands, /quit to exit.');
    console.log('');
    rl.prompt();
  });

  // Create readline REPL
  var rl = createInterface({
    input: opts.input || process.stdin,
    output: opts.output || process.stdout,
    prompt: 'bw> '
  });

  rl.on('line', function(line) {
    line = line.trim();
    if (!line) {
      rl.prompt();
      return;
    }

    // Slash commands
    if (line.charAt(0) === '/') {
      handleSlashCommand(line, activeClient, clients, opts, rl);
      return;
    }

    // JS expression — requires active client
    if (!activeClient) {
      console.log('No client connected. Add the attach script to a page first.');
      rl.prompt();
      return;
    }

    var code = wrapExpression(line);
    if (opts.verbose) {
      console.log('[query] ' + code);
    }

    activeClient.query(code, { timeout: 10000 }).then(function(result) {
      if (result !== undefined && result !== null) {
        try {
          console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        } catch (e) {
          console.log(String(result));
        }
      } else {
        console.log('undefined');
      }
      rl.prompt();
    }).catch(function(err) {
      console.error('[error] ' + err.message);
      rl.prompt();
    });
  });

  rl.on('close', function() {
    console.log('\nExiting.');
    app.close().then(function() {
      process.exit(0);
    });
  });

  return { rl: rl, app: app };
}

/**
 * Handle slash commands in the REPL.
 * @param {string} line - The full command line (e.g., "/tree #app 2")
 * @param {object|null} activeClient - The active BwServeClient, or null
 * @param {Map} clients - Map of clientId -> client
 * @param {object} opts - { allowScreenshot, verbose }
 * @param {object} rl - readline interface with prompt() method
 */
export function handleSlashCommand(line, activeClient, clients, opts, rl) {
  var parts = line.split(/\s+/);
  var cmd = parts[0].toLowerCase();

  switch (cmd) {
    case '/help':
    case '/h':
      printHelp();
      rl.prompt();
      break;

    case '/quit':
    case '/q':
      rl.close();
      break;

    case '/clients':
      if (clients.size === 0) {
        console.log('No clients connected.');
      } else {
        for (var [id, c] of clients) {
          var marker = c === activeClient ? ' (active)' : '';
          console.log('  ' + id + marker + (c._closed ? ' [closed]' : ''));
        }
      }
      rl.prompt();
      break;

    case '/tree':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      var treeSel = parts[1] || 'body';
      var treeDepth = parts[2] ? parseInt(parts[2], 10) : 3;
      var treePend = activeClient._pend(10000);
      activeClient.call('_bw_tree', {
        selector: treeSel,
        depth: treeDepth,
        requestId: treePend.requestId
      });
      treePend.promise.then(function(result) {
        if (!result) {
          console.log('(no element found for "' + treeSel + '")');
        } else {
          printTree(result, 0);
        }
        rl.prompt();
      }).catch(function(err) {
        console.error('[error] ' + err.message);
        rl.prompt();
      });
      break;

    case '/screenshot':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (!opts.allowScreenshot) {
        console.log('Screenshot not enabled. Restart with --allow-screenshot.');
        rl.prompt();
        break;
      }
      var ssSel = parts[1] || 'body';
      var ssFile = parts[2] || 'screenshot-' + Date.now() + '.png';
      console.log('Capturing ' + ssSel + ' ...');
      activeClient.screenshot(ssSel, { timeout: 15000 }).then(function(result) {
        writeFileSync(ssFile, result.data);
        console.log('Saved: ' + ssFile + ' (' + result.width + 'x' + result.height + ', ' + result.data.length + ' bytes)');
        rl.prompt();
      }).catch(function(err) {
        console.error('[error] ' + err.message);
        rl.prompt();
      });
      break;

    case '/mount':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (parts.length < 3) {
        console.log('Usage: /mount <selector> <component> [json-props]');
        rl.prompt();
        break;
      }
      var mountSel = parts[1];
      var mountComp = parts[2];
      var mountProps = {};
      if (parts[3]) {
        try {
          mountProps = JSON.parse(parts.slice(3).join(' '));
        } catch (e) {
          console.error('Invalid JSON props: ' + e.message);
          rl.prompt();
          break;
        }
      }
      activeClient.mount(mountSel, mountComp, mountProps, { timeout: 10000 }).then(function() {
        console.log('Mounted ' + mountComp + ' at ' + mountSel);
        rl.prompt();
      }).catch(function(err) {
        console.error('[error] ' + err.message);
        rl.prompt();
      });
      break;

    case '/render':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (parts.length < 3) {
        console.log('Usage: /render <selector> <taco-json>');
        rl.prompt();
        break;
      }
      var renderSel = parts[1];
      var renderTaco;
      try {
        renderTaco = JSON.parse(parts.slice(2).join(' '));
      } catch (e) {
        console.error('Invalid TACO JSON: ' + e.message);
        rl.prompt();
        break;
      }
      activeClient.render(renderSel, renderTaco);
      console.log('Rendered at ' + renderSel);
      rl.prompt();
      break;

    case '/patch':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (parts.length < 3) {
        console.log('Usage: /patch <id> <content>');
        rl.prompt();
        break;
      }
      var patchId = parts[1];
      var patchContent = parts.slice(2).join(' ');
      activeClient.patch(patchId, patchContent);
      console.log('Patched ' + patchId);
      rl.prompt();
      break;

    case '/listen':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (parts.length < 3) {
        console.log('Usage: /listen <selector> <event>');
        console.log('Examples: /listen button click, /listen .card mouseover');
        rl.prompt();
        break;
      }
      activeClient.call('_bw_listen', {
        selector: parts[1],
        event: parts[2]
      });
      console.log('Listening for ' + parts[2] + ' on ' + parts[1]);
      rl.prompt();
      break;

    case '/unlisten':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (parts.length < 3) {
        console.log('Usage: /unlisten <selector> <event>');
        rl.prompt();
        break;
      }
      activeClient.call('_bw_unlisten', {
        selector: parts[1],
        event: parts[2]
      });
      console.log('Stopped listening for ' + parts[2] + ' on ' + parts[1]);
      rl.prompt();
      break;

    case '/exec':
      if (!activeClient) {
        console.log('No client connected.');
        rl.prompt();
        break;
      }
      if (parts.length < 2) {
        console.log('Usage: /exec <code>');
        rl.prompt();
        break;
      }
      activeClient.exec(parts.slice(1).join(' '));
      console.log('Executed.');
      rl.prompt();
      break;

    default:
      console.log('Unknown command: ' + cmd + '. Type /help for available commands.');
      rl.prompt();
      break;
  }
}

/**
 * Pretty-print a DOM tree from _bw_tree.
 * @param {object} node - Tree node with tag, id, cls, children
 * @param {number} indent - Current indentation level
 */
export function printTree(node, indent) {
  if (!node) return;
  var prefix = '  '.repeat(indent);
  var label = node.tag || '?';
  if (node.id) label += '#' + node.id;
  if (node.cls) label += '.' + node.cls.split(' ').join('.');
  console.log(prefix + label);
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      printTree(node.children[i], indent + 1);
    }
  }
}

/**
 * Print the REPL help reference.
 */
export function printHelp() {
  console.log([
    '',
    'bwcli attach — REPL Commands',
    '',
    '  <expression>               Evaluate JS in the browser and print result',
    '                             Examples: document.title, bw.$(".card").length',
    '',
    '  /help, /h                  Show this help',
    '  /quit, /q                  Exit',
    '',
    '  /tree [sel] [depth]        Show DOM tree (default: body, depth 3)',
    '  /screenshot [sel] [file]   Capture screenshot to PNG file',
    '                             Requires --allow-screenshot flag',
    '  /mount <sel> <comp> [json] Mount a BCCL component',
    '                             Example: /mount #app card {"title":"Hello"}',
    '  /render <sel> <taco>       Render TACO JSON at selector',
    '                             Example: /render #app {"t":"h1","c":"Hi"}',
    '  /patch <id> <content>      Update element text content',
    '                             Example: /patch counter 42',
    '  /listen <sel> <event>      Listen for DOM events (prints inline)',
    '                             Example: /listen button click',
    '  /unlisten <sel> <event>    Remove a listener',
    '  /exec <code>               Execute JS without capturing return value',
    '  /clients                   List connected clients',
    '',
    '  Workflow — build and push a component:',
    '    /render #app {"t":"div","c":[{"t":"h2","c":"Hello"},{"t":"span","a":{"id":"msg"},"c":"..."}]}',
    '    /patch msg "Component pushed!"',
    '    /mount #app card {"title":"Status","content":"OK"}',
    ''
  ].join('\n'));
}
