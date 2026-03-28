/**
 * MCP End-to-End Test Suite
 *
 * Spawns bwmcp as a child process with --no-browser, sends JSON-RPC
 * over stdio, validates responses. Tests the full protocol workflow.
 */

import assert from 'assert';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

var __dirname = dirname(fileURLToPath(import.meta.url));
var BWMCP_PATH = resolve(__dirname, '../bin/bwmcp.js');

describe('MCP E2E', function() {
  this.timeout(15000);

  var proc;
  var responses = {};
  var nextId = 1;
  var buf = '';

  function startServer() {
    return new Promise(function(resolve, reject) {
      proc = spawn('node', [BWMCP_PATH, '--no-browser'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      proc.stdout.setEncoding('utf8');
      proc.stdout.on('data', function(chunk) {
        buf += chunk;
        var lines = buf.split('\n');
        buf = lines.pop();
        lines.forEach(function(line) {
          if (!line.trim()) return;
          try {
            var msg = JSON.parse(line);
            if (msg.id !== undefined && responses[msg.id]) {
              responses[msg.id](msg);
              delete responses[msg.id];
            }
          } catch (e) {
            // ignore non-JSON output
          }
        });
      });

      // Wait for server ready message on stderr
      var stderrBuf = '';
      proc.stderr.setEncoding('utf8');
      proc.stderr.on('data', function(chunk) {
        stderrBuf += chunk;
        if (stderrBuf.indexOf('MCP server ready') >= 0) {
          resolve();
        }
      });

      // Timeout fallback
      setTimeout(function() {
        resolve(); // resolve anyway after 3s
      }, 3000);

      proc.on('error', reject);
    });
  }

  function send(method, params) {
    var id = nextId++;
    var msg = { jsonrpc: '2.0', id: id, method: method, params: params || {} };
    proc.stdin.write(JSON.stringify(msg) + '\n');
    return new Promise(function(resolve) {
      responses[id] = resolve;
      // Timeout safety
      setTimeout(function() {
        if (responses[id]) {
          responses[id]({ id: id, error: { code: -1, message: 'Test timeout' } });
          delete responses[id];
        }
      }, 8000);
    });
  }

  function sendNotification(method, params) {
    var msg = { jsonrpc: '2.0', method: method, params: params || {} };
    proc.stdin.write(JSON.stringify(msg) + '\n');
  }

  before(async function() {
    await startServer();
  });

  after(function() {
    if (proc) {
      proc.kill('SIGTERM');
    }
  });

  it('should handle initialize', async function() {
    var resp = await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    assert(resp.result, 'initialize should return result');
    assert(resp.result.capabilities);
    assert(resp.result.capabilities.tools);
    assert.equal(resp.result.serverInfo.name, 'bwmcp');
  });

  it('should handle notifications/initialized (no response)', function(done) {
    sendNotification('notifications/initialized');
    // Notifications don't get responses, just wait a bit
    setTimeout(done, 100);
  });

  it('should list tools', async function() {
    var resp = await send('tools/list');
    assert(resp.result);
    assert(Array.isArray(resp.result.tools));
    assert(resp.result.tools.length > 10, 'should have many tools');

    var names = resp.result.tools.map(function(t) { return t.name; });
    assert.equal(names[0], 'bitwrench_start_here', 'start_here should be first');
    assert(names.indexOf('make_card') >= 0);
    assert(names.indexOf('render_taco') >= 0);
    assert(names.indexOf('build_page') >= 0);
  });

  it('should call bitwrench_start_here', async function() {
    var resp = await send('tools/call', { name: 'bitwrench_start_here', arguments: {} });
    assert(resp.result);
    var text = resp.result.content[0].text;
    assert(text.indexOf('TACO') >= 0);
    assert(text.indexOf('bitwrench_guide') >= 0);
    assert(text.indexOf('bw_container') >= 0);
    assert(text.length < 2000);
  });

  it('should call bitwrench_guide', async function() {
    var resp = await send('tools/call', { name: 'bitwrench_guide', arguments: {} });
    assert(resp.result);
    assert(resp.result.content[0].text.length > 1000);
  });

  it('should call bitwrench_guide with section filter', async function() {
    var full = await send('tools/call', { name: 'bitwrench_guide', arguments: {} });
    var section = await send('tools/call', { name: 'bitwrench_guide', arguments: { section: 'taco' } });
    assert(section.result);
    assert(!section.result.isError);
    assert(section.result.content[0].text.length < full.result.content[0].text.length);
  });

  it('should call make_card and return TACO', async function() {
    var resp = await send('tools/call', {
      name: 'make_card',
      arguments: { title: 'Revenue', content: '$12,345' }
    });
    assert(resp.result);
    assert(!resp.result.isError);
    assert(resp.result.structuredContent);
    assert(resp.result.structuredContent.t);
  });

  it('should call render_taco with make_card output', async function() {
    var card = await send('tools/call', {
      name: 'make_card',
      arguments: { title: 'Test', content: 'Body' }
    });
    var html = await send('tools/call', {
      name: 'render_taco',
      arguments: { taco: card.result.structuredContent }
    });
    assert(html.result);
    assert(html.result.content[0].text.indexOf('<') >= 0);
  });

  it('should call build_page with composed TACO', async function() {
    var card = await send('tools/call', {
      name: 'make_card',
      arguments: { title: 'Dashboard', content: 'Content here' }
    });
    var page = await send('tools/call', {
      name: 'build_page',
      arguments: {
        title: 'Test Dashboard',
        theme: 'ocean',
        content: {
          t: 'div',
          a: { class: 'bw_container' },
          c: [card.result.structuredContent]
        }
      }
    });
    assert(page.result);
    assert(!page.result.isError);
    var html = page.result.content[0].text;
    assert(html.indexOf('<!DOCTYPE html>') >= 0 || html.indexOf('<!doctype html>') >= 0);
  });

  it('should return error for unknown tool', async function() {
    var resp = await send('tools/call', { name: 'nonexistent_tool', arguments: {} });
    assert(resp.error);
    assert.equal(resp.error.code, -32602);
  });

  it('should return error for unknown method', async function() {
    var resp = await send('unknown/method');
    assert(resp.error);
    assert.equal(resp.error.code, -32601);
  });
});
