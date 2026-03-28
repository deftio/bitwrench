/**
 * MCP Transport Test Suite
 *
 * Tests for createStdioTransport: message framing, partial chunks,
 * multiple messages per chunk, send() writes newline-delimited JSON.
 */

import assert from 'assert';
import { PassThrough } from 'stream';
import { createStdioTransport } from '../src/mcp/transport.js';

describe('MCP Transport', function() {
  var input, output, transport, received;

  beforeEach(function() {
    input = new PassThrough();
    output = new PassThrough();
    received = [];
    transport = createStdioTransport(function(msg) {
      received.push(msg);
    }, { input: input, output: output });
  });

  afterEach(function() {
    transport.close();
  });

  it('should parse a complete JSON-RPC message', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'initialize' };
    input.write(JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      assert.equal(received[0].method, 'initialize');
      assert.equal(received[0].id, 1);
      done();
    }, 10);
  });

  it('should handle multiple messages in one chunk', function(done) {
    var msg1 = { jsonrpc: '2.0', id: 1, method: 'a' };
    var msg2 = { jsonrpc: '2.0', id: 2, method: 'b' };
    input.write(JSON.stringify(msg1) + '\n' + JSON.stringify(msg2) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 2);
      assert.equal(received[0].method, 'a');
      assert.equal(received[1].method, 'b');
      done();
    }, 10);
  });

  it('should handle partial chunks (message split across writes)', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'test' };
    var json = JSON.stringify(msg);
    var half = Math.floor(json.length / 2);
    input.write(json.substring(0, half));
    setTimeout(function() {
      assert.equal(received.length, 0); // not yet complete
      input.write(json.substring(half) + '\n');
      setTimeout(function() {
        assert.equal(received.length, 1);
        assert.equal(received[0].method, 'test');
        done();
      }, 10);
    }, 10);
  });

  it('should skip empty lines', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'test' };
    input.write('\n\n' + JSON.stringify(msg) + '\n\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      done();
    }, 10);
  });

  it('should handle invalid JSON gracefully', function(done) {
    // Invalid JSON should not crash; it should be skipped
    input.write('not valid json\n');
    setTimeout(function() {
      assert.equal(received.length, 0);
      done();
    }, 10);
  });

  it('should continue after invalid JSON', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'ok' };
    input.write('bad json\n' + JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      assert.equal(received[0].method, 'ok');
      done();
    }, 10);
  });

  it('send() should write newline-delimited JSON to output', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, result: { ok: true } };
    var chunks = [];
    output.on('data', function(chunk) { chunks.push(chunk.toString()); });
    transport.send(msg);
    setTimeout(function() {
      var data = chunks.join('');
      assert(data.endsWith('\n'), 'should end with newline');
      var parsed = JSON.parse(data.trim());
      assert.equal(parsed.id, 1);
      assert.equal(parsed.result.ok, true);
      done();
    }, 10);
  });

  it('send() should handle multiple sends', function(done) {
    var chunks = [];
    output.on('data', function(chunk) { chunks.push(chunk.toString()); });
    transport.send({ jsonrpc: '2.0', id: 1, result: 'a' });
    transport.send({ jsonrpc: '2.0', id: 2, result: 'b' });
    setTimeout(function() {
      var data = chunks.join('');
      var lines = data.split('\n').filter(function(l) { return l.trim(); });
      assert.equal(lines.length, 2);
      assert.equal(JSON.parse(lines[0]).id, 1);
      assert.equal(JSON.parse(lines[1]).id, 2);
      done();
    }, 10);
  });

  it('close() should stop receiving messages', function(done) {
    transport.close();
    var msg = { jsonrpc: '2.0', id: 1, method: 'test' };
    input.write(JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 0);
      done();
    }, 10);
  });

  it('should handle messages with params', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'make_card', arguments: { title: 'Test' } } };
    input.write(JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      assert.equal(received[0].params.name, 'make_card');
      assert.equal(received[0].params.arguments.title, 'Test');
      done();
    }, 10);
  });

  it('should handle notification (no id)', function(done) {
    var msg = { jsonrpc: '2.0', method: 'notifications/initialized' };
    input.write(JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      assert.equal(received[0].method, 'notifications/initialized');
      assert.equal(received[0].id, undefined);
      done();
    }, 10);
  });

  it('should handle whitespace-only lines', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'test' };
    input.write('   \n  \t  \n' + JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      done();
    }, 10);
  });

  it('should handle message with unicode content', function(done) {
    var msg = { jsonrpc: '2.0', id: 1, method: 'test', params: { text: 'Hello \u2603 world' } };
    input.write(JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      assert.equal(received[0].params.text, 'Hello \u2603 world');
      done();
    }, 10);
  });

  it('should handle large messages', function(done) {
    var bigData = 'x'.repeat(100000);
    var msg = { jsonrpc: '2.0', id: 1, method: 'test', params: { data: bigData } };
    input.write(JSON.stringify(msg) + '\n');
    setTimeout(function() {
      assert.equal(received.length, 1);
      assert.equal(received[0].params.data.length, 100000);
      done();
    }, 50);
  });
});
