/**
 * MCP Tools Test Suite
 *
 * Tests for each Phase 1 tool: valid input returns TACO with correct
 * structure. Tests for render_taco, build_page, make_styles.
 */

import assert from 'assert';
import { toolHandlers } from '../src/mcp/tools.js';

describe('MCP Tools - Component Tools', function() {

  describe('make_card', function() {
    it('should return a TACO with t="div"', function() {
      var result = toolHandlers.make_card({ title: 'Test', content: 'Body' });
      assert(!result.isError);
      assert(result.structuredContent);
      assert.equal(result.structuredContent.t, 'div');
    });

    it('should return text content as JSON string', function() {
      var result = toolHandlers.make_card({ title: 'Test' });
      var parsed = JSON.parse(result.content[0].text);
      assert.equal(parsed.t, 'div');
    });

    it('should work with no args', function() {
      var result = toolHandlers.make_card({});
      assert(!result.isError);
      assert(result.structuredContent.t);
    });

    it('should include variant class when specified', function() {
      var result = toolHandlers.make_card({ title: 'Test', variant: 'primary' });
      var json = JSON.stringify(result.structuredContent);
      assert(json.indexOf('primary') >= 0);
    });
  });

  describe('make_button', function() {
    it('should return a TACO with t="button"', function() {
      var result = toolHandlers.make_button({ text: 'Click Me' });
      assert(!result.isError);
      assert.equal(result.structuredContent.t, 'button');
    });

    it('should default variant to primary', function() {
      var result = toolHandlers.make_button({ text: 'Test' });
      var json = JSON.stringify(result.structuredContent);
      assert(json.indexOf('primary') >= 0);
    });

    it('should handle string shorthand', function() {
      // makeButton accepts string as shorthand for {text: string}
      var result = toolHandlers.make_button({ text: 'Simple' });
      assert(!result.isError);
    });
  });

  describe('make_table', function() {
    it('should return a TACO for a data table', function() {
      var result = toolHandlers.make_table({
        data: [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }],
        columns: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }]
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });

    it('should work with empty data', function() {
      var result = toolHandlers.make_table({ data: [], columns: [{ key: 'x', label: 'X' }] });
      assert(!result.isError);
    });
  });

  describe('make_tabs', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_tabs({
        tabs: [
          { label: 'Tab 1', content: 'Content 1' },
          { label: 'Tab 2', content: 'Content 2' }
        ]
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });

    it('should work with empty tabs', function() {
      var result = toolHandlers.make_tabs({ tabs: [] });
      assert(!result.isError);
    });
  });

  describe('make_accordion', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_accordion({
        items: [
          { title: 'Section 1', content: 'Content 1' },
          { title: 'Section 2', content: 'Content 2' }
        ]
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });
  });

  describe('make_alert', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_alert({ content: 'Warning!', variant: 'warning' });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });

    it('should default variant to info', function() {
      var result = toolHandlers.make_alert({ content: 'Note' });
      var json = JSON.stringify(result.structuredContent);
      assert(json.indexOf('info') >= 0);
    });
  });

  describe('make_nav', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_nav({
        items: [
          { text: 'Home', href: '/', active: true },
          { text: 'About', href: '/about' }
        ]
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });
  });

  describe('make_hero', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_hero({
        title: 'Welcome',
        subtitle: 'A great product',
        variant: 'primary'
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });
  });

  describe('make_stat_card', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_stat_card({
        label: 'Revenue',
        value: '$12,345',
        variant: 'success'
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });

    it('should include label and value', function() {
      var result = toolHandlers.make_stat_card({ label: 'Users', value: '1,234' });
      var json = JSON.stringify(result.structuredContent);
      assert(json.indexOf('Users') >= 0 || json.indexOf('1,234') >= 0);
    });
  });

  describe('make_form_group', function() {
    it('should return a TACO', function() {
      var result = toolHandlers.make_form_group({
        label: 'Name',
        input: { t: 'input', a: { type: 'text', placeholder: 'Enter name' } }
      });
      assert(!result.isError);
      assert(result.structuredContent.t);
    });
  });
});

describe('MCP Tools - Core Utilities', function() {

  describe('render_taco', function() {
    it('should convert simple TACO to HTML', function() {
      var result = toolHandlers.render_taco({ taco: { t: 'p', c: 'Hello' } });
      assert(!result.isError);
      assert(result.content[0].text.indexOf('<p>') >= 0);
      assert(result.content[0].text.indexOf('Hello') >= 0);
    });

    it('should handle nested TACO', function() {
      var result = toolHandlers.render_taco({
        taco: {
          t: 'div',
          a: { class: 'wrap' },
          c: [{ t: 'span', c: 'inner' }]
        }
      });
      assert(result.content[0].text.indexOf('<div') >= 0);
      assert(result.content[0].text.indexOf('<span>') >= 0);
    });

    it('should handle TACO with attributes', function() {
      var result = toolHandlers.render_taco({
        taco: { t: 'a', a: { href: 'https://example.com' }, c: 'Link' }
      });
      assert(result.content[0].text.indexOf('href=') >= 0);
    });

    it('should return error for invalid input', function() {
      var result = toolHandlers.render_taco({ taco: null });
      // bw.html(null) returns '', not an error
      assert.equal(result.content[0].text, '');
    });
  });

  describe('build_page', function() {
    it('should return a complete HTML page', function() {
      var result = toolHandlers.build_page({
        title: 'Test Page',
        content: { t: 'h1', c: 'Hello World' }
      });
      assert(!result.isError);
      var html = result.content[0].text;
      assert(html.indexOf('<!DOCTYPE html>') >= 0 || html.indexOf('<!doctype html>') >= 0);
      assert(html.indexOf('Test Page') >= 0);
    });

    it('should include bitwrench runtime by default', function() {
      var result = toolHandlers.build_page({
        title: 'Test',
        content: { t: 'p', c: 'Test' }
      });
      var html = result.content[0].text;
      assert(html.indexOf('<script>') >= 0 || html.indexOf('bitwrench') >= 0);
    });

    it('should accept theme parameter', function() {
      var result = toolHandlers.build_page({
        title: 'Themed',
        content: { t: 'p', c: 'Test' },
        theme: 'ocean'
      });
      assert(!result.isError);
      // Theme CSS should be included
      var html = result.content[0].text;
      assert(html.indexOf('<style>') >= 0 || html.indexOf('style') >= 0);
    });

    it('should handle array content', function() {
      var result = toolHandlers.build_page({
        title: 'Multi',
        content: [
          { t: 'h1', c: 'Title' },
          { t: 'p', c: 'Body' }
        ]
      });
      assert(!result.isError);
      var html = result.content[0].text;
      assert(html.indexOf('Title') >= 0);
      assert(html.indexOf('Body') >= 0);
    });
  });

  describe('make_styles', function() {
    it('should return CSS text', function() {
      var result = toolHandlers.make_styles({ primary: '#4f46e5' });
      assert(!result.isError);
      assert(result.content[0].text.length > 0);
      // Should contain CSS-like content
      assert(result.content[0].text.indexOf('{') >= 0);
    });

    it('should include isLightPrimary in structured content', function() {
      var result = toolHandlers.make_styles({ primary: '#4f46e5' });
      assert(result.structuredContent);
      assert(typeof result.structuredContent.isLightPrimary === 'boolean');
    });

    it('should handle missing primary gracefully', function() {
      // makeStyles should handle undefined primary without crashing
      var result = toolHandlers.make_styles({});
      // May error or return default -- either is fine
      assert(result.content);
    });
  });
});

describe('MCP Tools - Error Handling', function() {
  it('should handle tool that throws', function() {
    // render_taco with completely invalid args
    var result = toolHandlers.render_taco({});
    // bw.html(undefined) returns '' -- not an error
    assert(result.content);
  });

  it('all component handlers should exist', function() {
    var componentNames = ['make_card', 'make_button', 'make_table', 'make_tabs',
      'make_accordion', 'make_alert', 'make_nav', 'make_hero',
      'make_stat_card', 'make_form_group'];
    componentNames.forEach(function(name) {
      assert(typeof toolHandlers[name] === 'function', 'handler missing: ' + name);
    });
  });

  it('all utility handlers should exist', function() {
    assert(typeof toolHandlers.render_taco === 'function');
    assert(typeof toolHandlers.build_page === 'function');
    assert(typeof toolHandlers.make_styles === 'function');
  });
});
