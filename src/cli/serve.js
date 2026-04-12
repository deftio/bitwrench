/**
 * bwcli serve — CLI subcommand for bwserve pipe server.
 *
 * Serves a directory of bitwrench pages and accepts protocol messages
 * via an input HTTP port or stdin. Broadcasts messages to all connected
 * browser tabs.
 *
 * The input HTTP port also supports interactive commands: POST a JSON
 * object with a `command` field and receive the result as the HTTP
 * response. This is the programmatic equivalent of bwcli attach's REPL.
 *
 * Usage:
 *   bwcli serve [dir] [--port N] [--listen N] [--stdin] [--theme name]
 */

import { parseArgs } from 'node:util';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { VERSION } from '../version.js';

var SERVE_USAGE = `
bwcli serve v${VERSION} — Pipe server for browser UI

Usage:
  bwcli serve [dir] [options]

Arguments:
  dir                        Directory to serve static files from (default: .)

Options:
  -p, --port <number>        Browser-facing web port (default: 8080)
  -l, --listen <number>      Input port for protocol messages (default: 9000)
  -b, --bind <address>       Host/address to bind to (default: 0.0.0.0)
      --stdin                Read protocol messages from stdin (newline-delimited JSON)
  -t, --theme <name>         Theme preset or hex colors ("#pri,#sec")
      --title <string>       Page title (default: "bwcli serve")
      --allow-exec           Enable exec messages (runs JS in browser, use for dev only)
      --no-dir-list          Disable directory listings
      --open                 Open browser on start
  -v, --verbose              Verbose output
  -h, --help                 Print this help

Examples:
  bwcli serve                             Serve . on :8080, listen on :9000
  bwcli serve ./public --port 3000        Serve ./public on :3000
  bwcli serve --stdin                     Read from pipe instead of input port
  sensor-reader | bwcli serve --stdin     Pipe sensor data to browser
  curl -X POST :9000 -d '{"type":"replace","target":"#app","node":{"t":"h1","c":"Hi"}}'
  curl -X POST :9000 -d '{"command":"query","code":"document.title"}'
  curl -X POST :9000 -d '{"command":"clients"}'
`.trim();

/**
 * Parse a message string — supports both strict JSON and r-prefixed relaxed JSON.
 * @param {string} str
 * @returns {Object|null} parsed message or null on error
 */
function parseMessage(str) {
    str = str.trim();
    if (!str) return null;
    try {
        if (str.charAt(0) === 'r') {
            return parseRelaxedJSON(str.slice(1));
        }
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

/**
 * Parse relaxed JSON (single-quoted strings, trailing commas).
 * State machine — walks char by char.
 */
function parseRelaxedJSON(str) {
    var out = [];
    var i = 0;
    var len = str.length;

    while (i < len) {
        var ch = str[i];

        if (ch === "'") {
            out.push('"');
            i++;
            while (i < len) {
                var c = str[i];
                if (c === '\\' && i + 1 < len) {
                    var next = str[i + 1];
                    if (next === "'") {
                        out.push("'");
                    } else {
                        out.push('\\');
                        out.push(next);
                    }
                    i += 2;
                } else if (c === '"') {
                    out.push('\\"');
                    i++;
                } else if (c === "'") {
                    break;
                } else {
                    out.push(c);
                    i++;
                }
            }
            out.push('"');
            i++;
        } else if (ch === '"') {
            out.push(ch);
            i++;
            while (i < len) {
                var c2 = str[i];
                if (c2 === '\\' && i + 1 < len) {
                    out.push(c2);
                    out.push(str[i + 1]);
                    i += 2;
                } else {
                    out.push(c2);
                    i++;
                    if (c2 === '"') break;
                }
            }
        } else if (ch === ',') {
            var j = i + 1;
            while (j < len && (str[j] === ' ' || str[j] === '\t' || str[j] === '\n' || str[j] === '\r')) j++;
            if (j < len && (str[j] === '}' || str[j] === ']')) {
                i++;
            } else {
                out.push(ch);
                i++;
            }
        } else {
            out.push(ch);
            i++;
        }
    }

    return JSON.parse(out.join(''));
}

// Required fields per command (async commands also listed)
var _COMMAND_REQUIRED = {
    query:    ['code'],
    screenshot: [],
    tree:     [],
    mount:    ['selector', 'factory'],
    exec:     ['code'],
    render:   ['selector', 'taco'],
    patch:    ['id'],
    listen:   ['selector', 'event'],
    unlisten: ['selector', 'event'],
    clients:  []
};

// Commands that return a result via promise
var _ASYNC_COMMANDS = { query: 1, screenshot: 1, tree: 1, mount: 1 };

/**
 * Handle an interactive command from the listen port.
 *
 * @param {Object} msg - Parsed message with `command` field
 * @param {Object} app - BwServeApp instance (has _clients Map)
 * @param {boolean} verbose - Log details to stderr
 * @returns {Promise<Object>} Response object ({ok, result, clientId} or {error})
 */
function handleCommand(msg, app, verbose) {
    var cmd = msg.command;

    // clients: no client needed
    if (cmd === 'clients') {
        var ids = [];
        for (var entry of app._clients) {
            if (entry[1] && entry[1].client) ids.push(entry[0]);
        }
        return Promise.resolve({ ok: true, clients: ids });
    }

    // Validate command name
    if (!_COMMAND_REQUIRED.hasOwnProperty(cmd)) {
        return Promise.resolve({ error: 'Unknown command: ' + cmd });
    }

    // Validate required fields
    var required = _COMMAND_REQUIRED[cmd];
    for (var k = 0; k < required.length; k++) {
        if (msg[required[k]] === undefined) {
            return Promise.resolve({ error: 'Missing required field: ' + required[k] });
        }
    }

    // Select client
    var client = null;
    var clientId = null;

    if (msg.clientId) {
        var record = app._clients.get(msg.clientId);
        if (record && record.client) {
            client = record.client;
            clientId = msg.clientId;
        } else {
            return Promise.resolve({ error: 'Client not found: ' + msg.clientId });
        }
    } else {
        // Pick first connected client
        for (var pair of app._clients) {
            if (pair[1] && pair[1].client && !pair[1].client._closed) {
                client = pair[1].client;
                clientId = pair[0];
                break;
            }
        }
    }

    if (!client) {
        return Promise.resolve({ error: 'No clients connected' });
    }

    var timeout = msg.timeout;

    if (verbose) {
        console.error('[command] ' + cmd + ' -> client ' + clientId);
    }

    // Dispatch
    try {
        switch (cmd) {
            case 'query':
                return client.query(msg.code, { timeout: timeout || 5000 }).then(function(result) {
                    return { ok: true, result: result, clientId: clientId };
                });

            case 'screenshot':
                return client.screenshot(msg.selector || 'body', { timeout: timeout || 10000 }).then(function(result) {
                    // Convert Buffer to base64 for JSON response
                    var data = result && result.data ? result.data.toString('base64') : null;
                    return { ok: true, result: { data: data, width: result.width, height: result.height, format: result.format }, clientId: clientId };
                });

            case 'tree':
                var pend = client._pend(timeout || 10000);
                client.call('_bw_tree', {
                    selector: msg.selector || 'body',
                    depth: msg.depth || 3,
                    requestId: pend.requestId
                });
                return pend.promise.then(function(result) {
                    return { ok: true, result: result, clientId: clientId };
                });

            case 'mount':
                return client.mount(msg.selector, msg.factory, msg.props || {}, { timeout: timeout || 10000 }).then(function(result) {
                    return { ok: true, result: result, clientId: clientId };
                });

            case 'exec':
                client.exec(msg.code);
                return Promise.resolve({ ok: true, clientId: clientId });

            case 'render':
                client.render(msg.selector, msg.taco);
                return Promise.resolve({ ok: true, clientId: clientId });

            case 'patch':
                client.patch(msg.id, msg.content, msg.attr);
                return Promise.resolve({ ok: true, clientId: clientId });

            case 'listen':
                client.call('_bw_listen', { selector: msg.selector, event: msg.event });
                return Promise.resolve({ ok: true, clientId: clientId });

            case 'unlisten':
                client.call('_bw_unlisten', { selector: msg.selector, event: msg.event });
                return Promise.resolve({ ok: true, clientId: clientId });
        }
    } catch (err) {
        return Promise.resolve({ error: err.message });
    }
}

/**
 * Run the serve subcommand.
 * @param {string[]} argv - arguments after "serve"
 * @param {object} [ioOpts] - optional overrides for testing
 */
export function runServe(argv, ioOpts) {
    var values, positionals;

    try {
        var result = parseArgs({
            args: argv,
            strict: true,
            allowPositionals: true,
            options: {
                port:    { type: 'string', short: 'p' },
                listen:  { type: 'string', short: 'l' },
                bind:    { type: 'string', short: 'b' },
                stdin:   { type: 'boolean' },
                theme:   { type: 'string', short: 't' },
                title:   { type: 'string' },
                'allow-exec': { type: 'boolean' },
                'no-dir-list': { type: 'boolean' },
                open:    { type: 'boolean' },
                verbose: { type: 'boolean', short: 'v' },
                help:    { type: 'boolean', short: 'h' }
            }
        });
        values = result.values;
        positionals = result.positionals;
    } catch (err) {
        console.error('Error: ' + err.message);
        console.error('Run "bwcli serve --help" for usage.');
        process.exit(1);
    }

    if (values.help) {
        console.log(SERVE_USAGE);
        return;
    }

    var dir = positionals[0] || '.';
    var webPort = values.port ? parseInt(values.port, 10) : 8080;
    var listenPort = values.listen ? parseInt(values.listen, 10) : 9000;
    var bindAddr = values.bind || '0.0.0.0';
    var useStdin = !!values.stdin;
    var theme = values.theme || null;
    var title = values.title || 'bwcli serve';
    var dirList = !values['no-dir-list'];
    var verbose = !!values.verbose;

    if (isNaN(webPort) || webPort < 1 || webPort > 65535) {
        console.error('Error: --port must be a number between 1 and 65535.');
        process.exit(1);
    }
    if (!useStdin && (isNaN(listenPort) || listenPort < 1 || listenPort > 65535)) {
        console.error('Error: --listen must be a number between 1 and 65535.');
        process.exit(1);
    }

    // Dynamic import of bwserve to avoid loading it at parse time
    var io = ioOpts || {};
    var importPath = io._importPath || '../../src/bwserve/index.js';
    var importPromise = import(importPath).then(function(bwserve) {
        startServer(bwserve, {
            dir: dir,
            webPort: webPort,
            listenPort: listenPort,
            bind: bindAddr,
            useStdin: useStdin,
            theme: theme,
            title: title,
            dirList: dirList,
            verbose: verbose,
            open: !!values.open,
            allowExec: !!values['allow-exec']
        });
    }).catch(function(err) {
        console.error('Failed to load bwserve: ' + err.message);
        process.exit(1);
    });

    return importPromise;
}

/**
 * Start the bwserve pipe server.
 */
function startServer(bwserve, opts) {
    var app = bwserve.create({
        port: opts.webPort,
        host: opts.bind,
        title: opts.title,
        static: opts.dir,
        theme: opts.theme,
        dirList: opts.dirList,
        allowExec: opts.allowExec
    });

    // Register a passthrough page handler — just keeps clients alive
    app.page('/', function(client) {
        if (opts.verbose) {
            console.error('[bwcli serve] Client connected: ' + client.id);
        }
        client.on('_disconnect', function() {
            if (opts.verbose) {
                console.error('[bwcli serve] Client disconnected: ' + client.id);
            }
        });
    });

    // Start web server
    app.listen(function() {
        console.error('bwcli serve v' + VERSION);
        console.error('  Web server:  http://' + (opts.bind === '0.0.0.0' ? 'localhost' : opts.bind) + ':' + opts.webPort);
        console.error('  Bind:        ' + opts.bind);
        console.error('  Static dir:  ' + opts.dir);
        if (opts.theme) console.error('  Theme:       ' + opts.theme);
        if (opts.dirList === false) console.error('  Dir listing: disabled');

        if (opts.useStdin) {
            console.error('  Input:       stdin (newline-delimited JSON)');
            startStdinReader(app, opts.verbose);
            console.error('');
            console.error('Ready. Send protocol messages to push UI to browsers.');
        } else {
            startInputServer(app, opts.listenPort, opts.verbose).then(function() {
                console.error('');
                console.error('Ready. Send protocol messages to push UI to browsers.');
            });
        }

        if (opts.open) {
            import('node:child_process').then(function(cp) {
                var url = 'http://localhost:' + opts.webPort;
                var cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
                cp.exec(cmd + ' ' + url);
            });
        }
    });
}

/**
 * Start the input HTTP server for receiving protocol messages and interactive commands.
 *
 * Messages with a `command` field are treated as interactive commands --
 * routed to a specific client and the result returned in the HTTP response.
 * Messages with a `type` field (no `command`) are broadcast to all clients.
 */
function startInputServer(app, listenPort, verbose) {
    var inputServer = _createInputServer(app, verbose);

    return new Promise(function(resolve) {
        inputServer.on('error', function(err) {
            if (err.code === 'EADDRINUSE') {
                console.error('  Warning: Input port ' + listenPort + ' in use, picking a free port...');
                var retry = _createInputServer(app, verbose);
                retry.on('error', function(err2) {
                    console.error('  Warning: Could not bind input server (' + err2.message + '). Continuing without input port.');
                    resolve(null);
                });
                retry.listen(0, function() {
                    var actualPort = retry.address().port;
                    console.error('  Input port:  http://localhost:' + actualPort + ' (fallback)');
                    resolve(retry);
                });
            } else {
                console.error('  Warning: Input server error (' + err.message + '). Continuing without input port.');
                resolve(null);
            }
        });
        inputServer.listen(listenPort, function() {
            console.error('  Input port:  http://localhost:' + listenPort);
            resolve(inputServer);
        });
    });
}

/**
 * Create the input HTTP server (without binding).
 * @private
 */
function _createInputServer(app, verbose) {
    return createServer(function(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Use POST' }));
            return;
        }

        var body = '';
        req.on('data', function(chunk) { body += chunk; });
        req.on('end', function() {
            var msg = parseMessage(body);
            if (!msg) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid message' }));
                return;
            }

            // Interactive command path
            if (msg.command) {
                handleCommand(msg, app, verbose).then(function(result) {
                    var status = result.error ? 400 : 200;
                    // Unknown command and client-not-found get 400; timeout also 400
                    res.writeHead(status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }).catch(function(err) {
                    var errMsg = err && err.message ? err.message : String(err);
                    if (verbose) {
                        console.error('[command] error: ' + errMsg);
                    }
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: errMsg }));
                });
                return;
            }

            // Broadcast path (existing behavior)
            var count = app.broadcast(msg);
            if (verbose) {
                console.error('[input] ' + msg.type + ' -> ' + count + ' client(s)');
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, clients: count }));
        });
    });
}

/**
 * Read protocol messages from stdin (newline-delimited).
 */
function startStdinReader(app, verbose) {
    var buffer = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function(chunk) {
        buffer += chunk;
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            var msg = parseMessage(line);
            if (!msg) {
                if (verbose) console.error('[stdin] Parse error: ' + line.slice(0, 80));
                continue;
            }

            var count = app.broadcast(msg);
            if (verbose) {
                console.error('[stdin] ' + msg.type + ' -> ' + count + ' client(s)');
            }
        }
    });

    process.stdin.on('end', function() {
        // Flush remaining buffer
        if (buffer.trim()) {
            var msg = parseMessage(buffer.trim());
            if (msg) app.broadcast(msg);
        }
        if (verbose) console.error('[stdin] Input stream closed. Server stays running.');
    });
}

// Export private functions for testability
export { parseMessage, parseRelaxedJSON, startServer, startInputServer, startStdinReader, handleCommand };
