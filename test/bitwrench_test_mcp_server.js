/**
 * MCP Server Test Suite
 *
 * Tests for handleMessage: initialize, tools/list, tools/call,
 * error responses, serverInfo version.
 */

import assert from 'assert';
import { handleMessage } from '../src/mcp/server.js';
import { VERSION } from '../src/version.js';

describe('MCP Server - handleMessage', function() {

  describe('initialize', function() {
    it('should return capabilities and serverInfo', function() {
      var resp = handleMessage({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' }
        }
      });
      assert.equal(resp.jsonrpc, '2.0');
      assert.equal(resp.id, 1);
      assert(resp.result);
      assert(resp.result.capabilities);
      assert(resp.result.capabilities.tools);
      assert(resp.result.serverInfo);
      assert.equal(resp.result.serverInfo.name, 'bwmcp');
    });

    it('should include version from package', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
      assert.equal(resp.result.serverInfo.version, VERSION);
    });

    it('should include protocolVersion', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
      assert.equal(resp.result.protocolVersion, '2024-11-05');
    });

    it('should include description mentioning start_here', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
      assert(resp.result.serverInfo.description.indexOf('start_here') >= 0);
    });
  });

  describe('notifications/initialized', function() {
    it('should return null (no response for notifications)', function() {
      var resp = handleMessage({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      });
      assert.equal(resp, null);
    });
  });

  describe('tools/list', function() {
    it('should return an array of tools', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      assert(Array.isArray(resp.result.tools));
      assert(resp.result.tools.length > 0);
    });

    it('should have bitwrench_start_here as the first tool', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      assert.equal(resp.result.tools[0].name, 'bitwrench_start_here');
    });

    it('should list knowledge tools before component tools', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      var tools = resp.result.tools;
      var names = tools.map(function(t) { return t.name; });
      var guideIdx = names.indexOf('bitwrench_guide');
      var cardIdx = names.indexOf('make_card');
      assert(guideIdx < cardIdx, 'bitwrench_guide should come before make_card');
    });

    it('should include all Phase 1 component tools', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      var names = resp.result.tools.map(function(t) { return t.name; });
      var expected = ['make_card', 'make_button', 'make_table', 'make_tabs',
        'make_accordion', 'make_alert', 'make_nav', 'make_hero',
        'make_stat_card', 'make_form_group'];
      expected.forEach(function(name) {
        assert(names.indexOf(name) >= 0, 'missing tool: ' + name);
      });
    });

    it('should include core utility tools', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      var names = resp.result.tools.map(function(t) { return t.name; });
      assert(names.indexOf('render_taco') >= 0);
      assert(names.indexOf('build_page') >= 0);
      assert(names.indexOf('make_styles') >= 0);
    });

    it('should include live tools', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      var names = resp.result.tools.map(function(t) { return t.name; });
      assert(names.indexOf('render_live') >= 0);
      assert(names.indexOf('screenshot') >= 0);
      assert(names.indexOf('query_dom') >= 0);
    });

    it('each tool should have name, description, and inputSchema', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      resp.result.tools.forEach(function(tool) {
        assert(tool.name, 'tool missing name');
        assert(tool.description, 'tool ' + tool.name + ' missing description');
        assert(tool.inputSchema, 'tool ' + tool.name + ' missing inputSchema');
      });
    });
  });

  describe('tools/call', function() {
    it('should call bitwrench_start_here', function() {
      var resp = handleMessage({
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'bitwrench_start_here', arguments: {} }
      });
      assert(resp.result);
      assert(resp.result.content);
      assert(resp.result.content[0].type === 'text');
      assert(resp.result.content[0].text.indexOf('TACO') >= 0);
    });

    it('should call make_card and return TACO', function() {
      var resp = handleMessage({
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'make_card', arguments: { title: 'Test Card', content: 'Hello' } }
      });
      assert(resp.result);
      assert(!resp.result.isError);
      assert(resp.result.structuredContent);
      assert.equal(resp.result.structuredContent.t, 'div');
    });

    it('should call render_taco and return HTML', function() {
      var resp = handleMessage({
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'render_taco', arguments: { taco: { t: 'p', c: 'Hello' } } }
      });
      assert(resp.result);
      assert(resp.result.content[0].text.indexOf('<p>') >= 0);
    });

    it('should return error for unknown tool', function() {
      var resp = handleMessage({
        jsonrpc: '2.0', id: 6, method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} }
      });
      assert(resp.error);
      assert.equal(resp.error.code, -32602);
      assert(resp.error.message.indexOf('nonexistent_tool') >= 0);
    });

    it('should default arguments to empty object', function() {
      var resp = handleMessage({
        jsonrpc: '2.0', id: 7, method: 'tools/call',
        params: { name: 'make_card' }
      });
      assert(resp.result);
      assert(!resp.result.isError);
    });
  });

  describe('error handling', function() {
    it('should return Method not found for unknown methods', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 10, method: 'unknown/method', params: {} });
      assert(resp.error);
      assert.equal(resp.error.code, -32601);
    });

    it('should handle missing params gracefully', function() {
      var resp = handleMessage({ jsonrpc: '2.0', id: 11, method: 'initialize' });
      assert(resp.result);
      assert(resp.result.serverInfo);
    });

    it('should return null for any notification (no id)', function() {
      var resp = handleMessage({ jsonrpc: '2.0', method: 'some/notification' });
      assert.equal(resp, null);
    });
  });
});

// ===================================================================================
// Async tool handling (lines 84-93 of server.js)
// ===================================================================================

describe('MCP Server - async tool handling', function() {
  it('should handle tool that returns a Promise (screenshot)', function() {
    var resp = handleMessage({
      jsonrpc: '2.0', id: 20, method: 'tools/call',
      params: { name: 'screenshot', arguments: {} }
    });
    // screenshot handler returns a Promise
    assert.ok(resp && typeof resp.then === 'function', 'should return a Promise');
    return resp.then(function(r) {
      assert.equal(r.jsonrpc, '2.0');
      assert.equal(r.id, 20);
      assert.ok(r.result);
    });
  });

  it('should handle tool that returns a Promise (query_dom)', function() {
    var resp = handleMessage({
      jsonrpc: '2.0', id: 21, method: 'tools/call',
      params: { name: 'query_dom', arguments: { code: '1+1' } }
    });
    assert.ok(resp && typeof resp.then === 'function', 'should return a Promise');
    return resp.then(function(r) {
      assert.equal(r.jsonrpc, '2.0');
      assert.equal(r.id, 21);
      assert.ok(r.result);
    });
  });
});

// ===================================================================================
// createMcpServer (lines 124-156 of server.js)
// ===================================================================================

import { createMcpServer } from '../src/mcp/server.js';

describe('MCP Server - createMcpServer', function() {
  it('should return object with listen and close methods', function() {
    var server = createMcpServer({ noBrowser: true });
    assert.ok(server);
    assert.strictEqual(typeof server.listen, 'function');
    assert.strictEqual(typeof server.close, 'function');
  });

  it('close should be safe before listen', function() {
    var server = createMcpServer({ noBrowser: true });
    server.close(); // should not throw
  });

  it('should accept port and theme options', function() {
    var server = createMcpServer({ noBrowser: true, port: 19999, theme: 'ocean' });
    assert.ok(server);
    server.close();
  });

  it('listen() with noBrowser should start stdio transport', function(done) {
    var origStdin = process.stdin;
    var origStderrWrite = process.stderr.write;
    var stderrOutput = '';

    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });
    process.stderr.write = function(s) { stderrOutput += s; return true; };

    var server = createMcpServer({ noBrowser: true });
    server.listen();

    setTimeout(function() {
      assert.ok(stderrOutput.indexOf('MCP server ready') >= 0);
      server.close();
      fakeStdin.end();
      Object.defineProperty(process, 'stdin', { value: origStdin, writable: true, configurable: true });
      process.stderr.write = origStderrWrite;
      done();
    }, 50);
  });
});

// ===================================================================================
// run() -- CLI entry point (lines 164-216 of server.js)
// ===================================================================================

import { run } from '../src/mcp/server.js';

describe('MCP Server - run()', function() {
  var origExit, origStderrWrite;
  var exitCode, stderrOutput;

  beforeEach(function() {
    exitCode = null;
    stderrOutput = '';
    origExit = process.exit;
    origStderrWrite = process.stderr.write;
  });

  afterEach(function() {
    process.exit = origExit;
    process.stderr.write = origStderrWrite;
  });

  it('should show help and exit for --help', function() {
    process.stderr.write = function(s) { stderrOutput += s; return true; };
    process.exit = function(code) { exitCode = code; throw new Error('EXIT'); };

    try {
      run(['--help']);
    } catch (e) {
      if (e.message !== 'EXIT') throw e;
    }

    assert.ok(stderrOutput.indexOf('Usage: bwmcp') >= 0);
    assert.strictEqual(exitCode, 0);
  });

  it('should show help for -h flag', function() {
    process.stderr.write = function(s) { stderrOutput += s; return true; };
    process.exit = function(code) { exitCode = code; throw new Error('EXIT'); };

    try {
      run(['-h']);
    } catch (e) {
      if (e.message !== 'EXIT') throw e;
    }

    assert.ok(stderrOutput.indexOf('--port') >= 0);
    assert.ok(stderrOutput.indexOf('--theme') >= 0);
    assert.ok(stderrOutput.indexOf('--no-browser') >= 0);
    assert.strictEqual(exitCode, 0);
  });
});

// ===================================================================================
// createMcpServer.listen with noBrowser (covers lines 127-148)
// ===================================================================================

import { PassThrough } from 'node:stream';
import { startLive, stopLive, getApp } from '../src/mcp/live.js';

describe('MCP Server - createMcpServer.listen()', function() {
  var origStdin, origStderrWrite;

  beforeEach(function() {
    origStdin = process.stdin;
    origStderrWrite = process.stderr.write;
  });

  afterEach(function() {
    Object.defineProperty(process, 'stdin', { value: origStdin, writable: true, configurable: true });
    process.stderr.write = origStderrWrite;
    return stopLive();
  });

  it('should start with noBrowser and print ready message', function(done) {
    var stderrOutput = '';
    process.stderr.write = function(s) { stderrOutput += s; return true; };

    // Replace stdin with a fake stream so readline doesn't hang
    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });

    var server = createMcpServer({ noBrowser: true });
    server.listen();

    setTimeout(function() {
      assert.ok(stderrOutput.indexOf('MCP server ready') >= 0);
      server.close();
      fakeStdin.end();
      done();
    }, 50);
  });
});

// ===================================================================================
// run() arg parsing branches (covers lines 175-185)
// ===================================================================================

describe('MCP Server - run() arg parsing', function() {
  var origStdin, origStderrWrite, origExit;
  var stderrOutput;
  var runServer; // server returned by run()

  beforeEach(function() {
    origStdin = process.stdin;
    origStderrWrite = process.stderr.write;
    origExit = process.exit;
    stderrOutput = '';
    runServer = null;
  });

  afterEach(function() {
    if (runServer) runServer.close();
    Object.defineProperty(process, 'stdin', { value: origStdin, writable: true, configurable: true });
    process.stderr.write = origStderrWrite;
    process.exit = origExit;
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    return stopLive();
  });

  it('should parse --port, --theme, --no-browser', function(done) {
    process.stderr.write = function(s) { stderrOutput += s; return true; };

    // Replace stdin with fake stream
    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });

    // Wrap process.exit to prevent actual exit (for signal handlers)
    process.exit = function() {};

    // Call run with all arg types. --no-browser prevents bwserve startup.
    runServer = run(['--port', '19123', '--theme', 'ocean', '--no-browser']);

    setTimeout(function() {
      assert.ok(stderrOutput.indexOf('MCP server ready') >= 0);
      fakeStdin.end();
      done();
    }, 100);
  });

  it('should parse --open flag', function(done) {
    process.stderr.write = function(s) { stderrOutput += s; return true; };
    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });
    process.exit = function() {};

    // --open + --no-browser: open flag is parsed but no bwserve means no actual open
    runServer = run(['--open', '--no-browser']);

    setTimeout(function() {
      assert.ok(stderrOutput.indexOf('MCP server ready') >= 0);
      fakeStdin.end();
      done();
    }, 100);
  });

  it('should handle SIGINT for clean shutdown', function(done) {
    process.stderr.write = function(s) { stderrOutput += s; return true; };
    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });

    var exitCalled = false;
    process.exit = function(code) {
      exitCalled = true;
      assert.strictEqual(code, 0);
    };

    runServer = run(['--no-browser']);

    setTimeout(function() {
      // Emit SIGINT to trigger the handler registered by run()
      process.emit('SIGINT');
      setTimeout(function() {
        assert.ok(exitCalled, 'process.exit should have been called');
        fakeStdin.end();
        done();
      }, 50);
    }, 100);
  });

  it('should handle SIGTERM for clean shutdown', function(done) {
    process.stderr.write = function(s) { stderrOutput += s; return true; };
    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });

    var exitCalled = false;
    process.exit = function(code) {
      exitCalled = true;
      assert.strictEqual(code, 0);
    };

    runServer = run(['--no-browser']);

    setTimeout(function() {
      process.emit('SIGTERM');
      setTimeout(function() {
        assert.ok(exitCalled, 'process.exit should have been called');
        fakeStdin.end();
        done();
      }, 50);
    }, 100);
  });
});

// ===================================================================================
// Transport message dispatch (covers lines 129-135 of server.js)
// ===================================================================================

describe('MCP Server - transport message dispatch', function() {
  var origStdin, origStdoutWrite, origStderrWrite;
  var fakeStdin, stdoutData;

  beforeEach(function() {
    origStdin = process.stdin;
    origStdoutWrite = process.stdout.write;
    origStderrWrite = process.stderr.write;
    fakeStdin = new PassThrough();
    stdoutData = '';
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });
    process.stdout.write = function(chunk) { stdoutData += chunk.toString(); return true; };
    process.stderr.write = function() { return true; };
  });

  afterEach(function() {
    Object.defineProperty(process, 'stdin', { value: origStdin, writable: true, configurable: true });
    process.stdout.write = origStdoutWrite;
    process.stderr.write = origStderrWrite;
    stopLive();
  });

  it('should dispatch sync message and write response to stdout', function(done) {
    var server = createMcpServer({ noBrowser: true });
    server.listen();

    // Send initialize (sync handler) -- covers line 133-134
    fakeStdin.write('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\n');

    setTimeout(function() {
      assert.ok(stdoutData.indexOf('"bwmcp"') >= 0, 'response should contain server name');
      server.close();
      fakeStdin.end();
      done();
    }, 100);
  });

  it('should dispatch async message and write response to stdout', function(done) {
    var server = createMcpServer({ noBrowser: true });
    server.listen();

    // screenshot returns a Promise -- covers lines 131-132
    fakeStdin.write('{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"screenshot","arguments":{}}}\n');

    setTimeout(function() {
      assert.ok(stdoutData.indexOf('"id":2') >= 0, 'response should contain id 2');
      server.close();
      fakeStdin.end();
      done();
    }, 300);
  });

  it('should skip response for notifications (null return)', function(done) {
    var server = createMcpServer({ noBrowser: true });
    server.listen();

    // Notification (no id) -- covers line 130
    fakeStdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');

    setTimeout(function() {
      assert.strictEqual(stdoutData, '', 'should not write to stdout for notifications');
      server.close();
      fakeStdin.end();
      done();
    }, 100);
  });
});

// ===================================================================================
// Sync handler error path (covers lines 96-101 of server.js)
// ===================================================================================

describe('MCP Server - sync handler error path', function() {
  before(function() {
    this.timeout(5000);
    var origStderrWrite = process.stderr.write;
    process.stderr.write = function() { return true; };
    return startLive({ port: 0 }).then(function() {
      process.stderr.write = origStderrWrite;
    }).catch(function(e) {
      process.stderr.write = origStderrWrite;
      throw e;
    });
  });

  after(function() {
    stopLive();
  });

  it('should catch sync error when handler throws', function() {
    // Make getClient() throw by replacing _clients with a non-iterable value.
    // render_live calls getClient() BEFORE its own try/catch, so the error
    // propagates to handleMessage's catch block (lines 95-101).
    var app = getApp();
    var origClients = app._clients;
    app._clients = 42; // not iterable

    var resp = handleMessage({
      jsonrpc: '2.0', id: 99, method: 'tools/call',
      params: { name: 'render_live', arguments: { taco: { t: 'div', c: 'x' } } }
    });

    app._clients = origClients;

    assert.ok(resp.result);
    assert.ok(resp.result.isError);
    assert.ok(resp.result.content[0].text.indexOf('Error:') >= 0);
  });
});

// ===================================================================================
// createMcpServer with bwserve (covers lines 140-145 of server.js)
// ===================================================================================

describe('MCP Server - createMcpServer with bwserve', function() {
  it('should start bwserve when noBrowser is false', function(done) {
    this.timeout(5000);
    var origStdin = process.stdin;
    var origStdoutWrite = process.stdout.write;
    var origStderrWrite = process.stderr.write;

    var fakeStdin = new PassThrough();
    Object.defineProperty(process, 'stdin', { value: fakeStdin, writable: true, configurable: true });
    process.stdout.write = function() { return true; };
    process.stderr.write = function() { return true; };

    var server = createMcpServer({ noBrowser: false, port: 19456 });
    server.listen();

    // Wait for bwserve to start
    setTimeout(function() {
      var app = getApp();
      assert.ok(app, 'bwserve should be running');

      server.close();
      fakeStdin.end();
      Object.defineProperty(process, 'stdin', { value: origStdin, writable: true, configurable: true });
      process.stdout.write = origStdoutWrite;
      process.stderr.write = origStderrWrite;
      done();
    }, 1000);
  });
});
