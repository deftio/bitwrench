/**
 * MCP stdio transport -- newline-delimited JSON-RPC over stdin/stdout.
 *
 * stdout is reserved for MCP protocol messages only.
 * All logging goes to stderr.
 *
 * @module mcp/transport
 */

/**
 * Create a stdio transport that reads JSON-RPC messages from an input
 * stream and writes responses to an output stream.
 *
 * @param {Function} onMessage - Called with each parsed JSON-RPC message
 * @param {Object} [opts]
 * @param {NodeJS.ReadableStream} [opts.input=process.stdin]
 * @param {NodeJS.WritableStream} [opts.output=process.stdout]
 * @returns {{ send: Function, close: Function }}
 */
export function createStdioTransport(onMessage, opts) {
  opts = opts || {};
  var input  = opts.input  || process.stdin;
  var output = opts.output || process.stdout;
  var buffer = '';

  input.setEncoding('utf8');

  function onData(chunk) {
    buffer += chunk;
    var lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      try {
        var msg = JSON.parse(line);
        onMessage(msg);
      } catch (e) {
        process.stderr.write('[bwmcp] Invalid JSON: ' + e.message + '\n');
      }
    }
  }

  input.on('data', onData);

  function send(msg) {
    output.write(JSON.stringify(msg) + '\n');
  }

  function close() {
    input.removeListener('data', onData);
  }

  return { send: send, close: close };
}
