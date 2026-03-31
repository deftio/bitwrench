/**
 * MCP Live Test Suite
 *
 * Tests for mcp/live.js: liveToolDefs, liveHandlers, startLive, stopLive, getApp.
 * Tests handler behavior both with and without a running bwserve instance.
 */

import assert from 'assert';
import http from 'http';
import { startLive, stopLive, getApp, liveHandlers, liveToolDefs } from '../src/mcp/live.js';

// Suppress stderr output from bwserve startup
var origStderrWrite = process.stderr.write;
function suppressStderr() {
  process.stderr.write = function() { return true; };
}
function restoreStderr() {
  process.stderr.write = origStderrWrite;
}

// ===================================================================================
// liveToolDefs
// ===================================================================================

describe('MCP Live - liveToolDefs', function() {
  it('should export 3 tool definitions', function() {
    assert.strictEqual(liveToolDefs.length, 3);
  });

  it('should include render_live, screenshot, query_dom', function() {
    var names = liveToolDefs.map(function(d) { return d.name; });
    assert.ok(names.indexOf('render_live') >= 0);
    assert.ok(names.indexOf('screenshot') >= 0);
    assert.ok(names.indexOf('query_dom') >= 0);
  });

  it('each tool should have name, description, inputSchema', function() {
    liveToolDefs.forEach(function(td) {
      assert.ok(td.name, 'missing name');
      assert.ok(td.description, td.name + ' missing description');
      assert.ok(td.inputSchema, td.name + ' missing inputSchema');
    });
  });
});

// ===================================================================================
// liveHandlers without bwserve started
// ===================================================================================

describe('MCP Live - handlers without bwserve', function() {
  before(function() {
    stopLive(); // ensure _app is null
  });

  it('getApp should return null', function() {
    assert.strictEqual(getApp(), null);
  });

  it('render_live should return error when bwserve not started', function() {
    var result = liveHandlers.render_live({ taco: { t: 'div', c: 'test' } });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.indexOf('not started') >= 0);
  });

  it('screenshot should return promise with error when no client', function() {
    return liveHandlers.screenshot({}).then(function(result) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.indexOf('no browser client') >= 0);
    });
  });

  it('query_dom should return promise with error when no client', function() {
    return liveHandlers.query_dom({ code: '1+1' }).then(function(result) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.indexOf('no browser client') >= 0);
    });
  });
});

// ===================================================================================
// startLive / stopLive / getApp
// ===================================================================================

describe('MCP Live - startLive/stopLive', function() {
  it('startLive should resolve with app instance', function() {
    this.timeout(5000);
    suppressStderr();
    return startLive({ port: 0 }).then(function(app) {
      restoreStderr();
      assert.ok(app, 'should return app');
      assert.ok(getApp(), 'getApp should return the running app');
      assert.strictEqual(getApp(), app);
    }).catch(function(e) {
      restoreStderr();
      throw e;
    });
  });

  it('stopLive should close and clear app', function() {
    stopLive();
    assert.strictEqual(getApp(), null);
  });

  it('stopLive is safe to call when already stopped', function() {
    stopLive();
    assert.strictEqual(getApp(), null);
  });
});

// ===================================================================================
// liveHandlers with bwserve started (no browser client connected)
// ===================================================================================

describe('MCP Live - handlers with bwserve (no client)', function() {
  before(function() {
    this.timeout(5000);
    suppressStderr();
    return startLive({ port: 0 }).then(function() {
      restoreStderr();
    }).catch(function(e) {
      restoreStderr();
      throw e;
    });
  });

  after(function() {
    return stopLive();
  });

  // -- render_live --

  it('render_live replace (default action) should broadcast', function() {
    var result = liveHandlers.render_live({ taco: { t: 'div', c: 'hello' } });
    assert.ok(!result.isError);
    assert.ok(result.content[0].text.indexOf('rendered') >= 0);
    assert.ok(result.structuredContent);
    assert.strictEqual(result.structuredContent.action, 'replace');
    assert.strictEqual(result.structuredContent.target, '#app');
  });

  it('render_live append should broadcast', function() {
    var result = liveHandlers.render_live({ taco: { t: 'p', c: 'appended' }, action: 'append' });
    assert.ok(!result.isError);
    assert.strictEqual(result.structuredContent.action, 'append');
  });

  it('render_live patch should broadcast', function() {
    var result = liveHandlers.render_live({ action: 'patch', content: 'patched', target: '#t' });
    assert.ok(!result.isError);
    assert.strictEqual(result.structuredContent.action, 'patch');
  });

  it('render_live remove should broadcast', function() {
    var result = liveHandlers.render_live({ action: 'remove', target: '#t' });
    assert.ok(!result.isError);
    assert.strictEqual(result.structuredContent.action, 'remove');
  });

  it('render_live invalid action should return error', function() {
    var result = liveHandlers.render_live({ action: 'bogus' });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.indexOf('invalid action') >= 0);
  });

  it('render_live replace without taco should return error', function() {
    var result = liveHandlers.render_live({ action: 'replace' });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.indexOf('invalid action') >= 0);
  });

  it('render_live with custom target', function() {
    var result = liveHandlers.render_live({ taco: { t: 'span' }, target: '#custom' });
    assert.strictEqual(result.structuredContent.target, '#custom');
  });

  // -- screenshot --

  it('screenshot should return error when no client connected', function() {
    return liveHandlers.screenshot({ selector: 'body' }).then(function(result) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.indexOf('no browser client') >= 0);
    });
  });

  it('screenshot with default selector', function() {
    return liveHandlers.screenshot({}).then(function(result) {
      assert.ok(result.isError);
    });
  });

  // -- query_dom --

  it('query_dom should return error when no client connected', function() {
    return liveHandlers.query_dom({ code: 'document.title' }).then(function(result) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.indexOf('no browser client') >= 0);
    });
  });
});

// ===================================================================================
// liveHandlers with injected fake client (covers screenshot/query_dom success paths)
// ===================================================================================

describe('MCP Live - handlers with fake client', function() {
  before(function() {
    this.timeout(5000);
    suppressStderr();
    return startLive({ port: 0 }).then(function() {
      restoreStderr();
      // Inject a fake client into the app's _clients Map
      var app = getApp();
      app._clients.set('fake1', {
        pagePath: '/',
        client: {
          id: 'fake1',
          _closed: false,
          screenshot: function(selector, opts) {
            return Promise.resolve({
              data: 'data:image/png;base64,' + Buffer.from('fake-png').toString('base64'),
              width: 800,
              height: 600,
              format: 'png'
            });
          },
          query: function(code, opts) {
            return Promise.resolve('42');
          }
        }
      });
    }).catch(function(e) {
      restoreStderr();
      throw e;
    });
  });

  after(function() {
    return stopLive();
  });

  it('screenshot should return image when client is connected', function() {
    return liveHandlers.screenshot({ selector: '#app' }).then(function(result) {
      assert.ok(!result.isError, 'should not be an error');
      assert.strictEqual(result.content[0].type, 'image');
      assert.strictEqual(result.content[0].mimeType, 'image/png');
      assert.ok(result.content[0].data.length > 0);
    });
  });

  it('query_dom should return result when client is connected', function() {
    return liveHandlers.query_dom({ code: '1+1' }).then(function(result) {
      assert.ok(!result.isError, 'should not be an error');
      assert.strictEqual(result.content[0].type, 'text');
      assert.strictEqual(result.content[0].text, '42');
    });
  });

  it('query_dom should JSON.stringify non-string results', function() {
    // Replace the query function to return an object
    var app = getApp();
    var record = app._clients.get('fake1');
    var origQuery = record.client.query;
    record.client.query = function() { return Promise.resolve({ count: 5 }); };

    return liveHandlers.query_dom({ code: 'x' }).then(function(result) {
      assert.ok(!result.isError);
      assert.strictEqual(result.content[0].text, '{"count":5}');
      record.client.query = origQuery;
    });
  });
});

// ===================================================================================
// liveHandlers error paths from client methods
// ===================================================================================

describe('MCP Live - handler error paths', function() {
  before(function() {
    this.timeout(5000);
    suppressStderr();
    return startLive({ port: 0 }).then(function() {
      restoreStderr();
      var app = getApp();
      app._clients.set('err1', {
        pagePath: '/',
        client: {
          id: 'err1',
          _closed: false,
          screenshot: function() {
            return Promise.reject(new Error('capture failed'));
          },
          query: function() {
            return Promise.reject(new Error('eval failed'));
          }
        }
      });
    }).catch(function(e) {
      restoreStderr();
      throw e;
    });
  });

  after(function() {
    return stopLive();
  });

  it('screenshot should return error on client rejection', function() {
    return liveHandlers.screenshot({ selector: 'body' }).then(function(result) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.indexOf('capture failed') >= 0);
    });
  });

  it('query_dom should return error on client rejection', function() {
    return liveHandlers.query_dom({ code: 'bad()' }).then(function(result) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.indexOf('eval failed') >= 0);
    });
  });
});

// ===================================================================================
// render_live catch block (lines 172-173)
// ===================================================================================

describe('MCP Live - render_live broadcast error', function() {
  before(function() {
    this.timeout(5000);
    suppressStderr();
    return startLive({ port: 0 }).then(function() {
      restoreStderr();
    }).catch(function(e) {
      restoreStderr();
      throw e;
    });
  });

  after(function() {
    return stopLive();
  });

  it('should catch and return error when broadcast throws', function() {
    var app = getApp();
    var origBroadcast = app.broadcast.bind(app);
    app.broadcast = function() { throw new Error('broadcast-fail'); };
    var result = liveHandlers.render_live({ taco: { t: 'div', c: 'test' } });
    app.broadcast = origBroadcast;
    assert.ok(result.isError);
    assert.ok(result.content[0].text.indexOf('broadcast-fail') >= 0);
  });
});

// ===================================================================================
// Page handler via SSE client connection (covers lines 36-41 of live.js)
// ===================================================================================

describe('MCP Live - page handler via SSE client', function() {
  var port = 17910;

  before(function() {
    this.timeout(5000);
    suppressStderr();
    return startLive({ port: port }).then(function() {
      restoreStderr();
    }).catch(function(e) {
      restoreStderr();
      throw e;
    });
  });

  after(function() {
    return stopLive();
  });

  it('should call page handler when SSE client connects', function(done) {
    this.timeout(5000);

    // Connect as SSE client to trigger the page handler (lines 36-41)
    var req = http.get('http://localhost:' + port + '/bw/events/test-sse-1', function(res) {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-type'].indexOf('text/event-stream') >= 0);

      // Give the handler time to execute
      setTimeout(function() {
        // Verify client was registered
        var app = getApp();
        var record = app._clients.get('test-sse-1');
        assert.ok(record, 'client should be in _clients map');
        assert.ok(record.client, 'client object should be set');

        // Clean up the SSE connection
        req.destroy();
        done();
      }, 200);
    });

    req.on('error', function(e) {
      done(e);
    });
  });
});
