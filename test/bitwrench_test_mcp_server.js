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
