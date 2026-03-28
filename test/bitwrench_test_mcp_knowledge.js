/**
 * MCP Knowledge Tools Test Suite
 *
 * Tests for bitwrench_start_here, bitwrench_guide (with section filter),
 * bitwrench_components (with component filter), bitwrench_server_guide,
 * bitwrench_themes.
 */

import assert from 'assert';
import { knowledgeHandlers, extractSection, extractComponent, GUIDE_SECTIONS } from '../src/mcp/knowledge.js';

describe('MCP Knowledge Tools', function() {

  describe('bitwrench_start_here', function() {
    it('should return text content', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      assert(result.content);
      assert.equal(result.content[0].type, 'text');
      assert(result.content[0].text.length > 0);
    });

    it('should mention TACO', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      assert(result.content[0].text.indexOf('TACO') >= 0);
    });

    it('should mention bitwrench_guide', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      assert(result.content[0].text.indexOf('bitwrench_guide') >= 0);
    });

    it('should mention bw_container (grid hint)', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      assert(result.content[0].text.indexOf('bw_container') >= 0);
    });

    it('should mention build_page', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      assert(result.content[0].text.indexOf('build_page') >= 0);
    });

    it('should be under 2000 characters', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      assert(result.content[0].text.length < 2000, 'start_here should be concise');
    });

    it('should mention other knowledge tools', function() {
      var result = knowledgeHandlers.bitwrench_start_here({});
      var text = result.content[0].text;
      assert(text.indexOf('bitwrench_components') >= 0);
      assert(text.indexOf('bitwrench_server_guide') >= 0);
      assert(text.indexOf('bitwrench_themes') >= 0);
    });
  });

  describe('bitwrench_guide', function() {
    it('should return full guide content', function() {
      var result = knowledgeHandlers.bitwrench_guide({});
      assert(result.content[0].text.length > 1000);
      assert(result.content[0].text.indexOf('TACO') >= 0);
    });

    it('should return taco section when filtered', function() {
      var result = knowledgeHandlers.bitwrench_guide({ section: 'taco' });
      assert(!result.isError);
      assert(result.content[0].text.indexOf('TACO') >= 0 || result.content[0].text.indexOf('taco') >= 0);
    });

    it('section filter should return less content than full guide', function() {
      var full = knowledgeHandlers.bitwrench_guide({});
      var section = knowledgeHandlers.bitwrench_guide({ section: 'taco' });
      assert(section.content[0].text.length < full.content[0].text.length);
    });

    it('should return error for unknown section', function() {
      var result = knowledgeHandlers.bitwrench_guide({ section: 'nonexistent' });
      assert(result.isError);
    });

    it('should handle all valid section names', function() {
      Object.keys(GUIDE_SECTIONS).forEach(function(key) {
        var result = knowledgeHandlers.bitwrench_guide({ section: key });
        assert(!result.isError, 'Section failed: ' + key);
        assert(result.content[0].text.length > 0, 'Section empty: ' + key);
      });
    });

    it('should return non-empty content for each section', function() {
      var result = knowledgeHandlers.bitwrench_guide({ section: 'rules' });
      assert(result.content[0].text.length > 50);
    });
  });

  describe('bitwrench_components', function() {
    it('should return full component catalog', function() {
      var result = knowledgeHandlers.bitwrench_components({});
      assert(result.content[0].text.length > 1000);
    });

    it('should filter by component name', function() {
      var result = knowledgeHandlers.bitwrench_components({ component: 'makeCard' });
      assert(!result.isError);
      assert(result.content[0].text.indexOf('makeCard') >= 0);
    });

    it('component filter should return less than full catalog', function() {
      var full = knowledgeHandlers.bitwrench_components({});
      var single = knowledgeHandlers.bitwrench_components({ component: 'makeCard' });
      assert(single.content[0].text.length < full.content[0].text.length);
    });

    it('should return error for unknown component', function() {
      var result = knowledgeHandlers.bitwrench_components({ component: 'makeNonexistent' });
      assert(result.isError);
    });
  });

  describe('bitwrench_server_guide', function() {
    it('should return tutorial content', function() {
      var result = knowledgeHandlers.bitwrench_server_guide({});
      assert(result.content[0].text.length > 100);
    });

    it('should mention bwserve', function() {
      var result = knowledgeHandlers.bitwrench_server_guide({});
      assert(result.content[0].text.indexOf('bwserve') >= 0 ||
             result.content[0].text.indexOf('server') >= 0);
    });
  });

  describe('bitwrench_themes', function() {
    it('should return theming content', function() {
      var result = knowledgeHandlers.bitwrench_themes({});
      assert(result.content[0].text.length > 100);
    });

    it('should mention preset names', function() {
      var result = knowledgeHandlers.bitwrench_themes({});
      var text = result.content[0].text;
      // At least some preset names should appear
      assert(text.indexOf('ocean') >= 0 || text.indexOf('forest') >= 0 || text.indexOf('teal') >= 0);
    });
  });
});

describe('MCP Knowledge - Section Extraction Helpers', function() {
  var sampleMd = [
    '# Title',
    '',
    '## Section One',
    'Content of section one.',
    'More content.',
    '',
    '## Section Two',
    'Content of section two.',
    '',
    '## Section Three',
    'Content of section three.'
  ].join('\n');

  it('extractSection should return matching section', function() {
    var result = extractSection(sampleMd, 'Section One');
    assert(result);
    assert(result.indexOf('Content of section one') >= 0);
  });

  it('extractSection should not include next section', function() {
    var result = extractSection(sampleMd, 'Section One');
    assert(result.indexOf('Section Two') < 0);
  });

  it('extractSection should return null for non-matching heading', function() {
    var result = extractSection(sampleMd, 'Nonexistent');
    assert.equal(result, null);
  });

  it('extractSection should handle last section (no next heading)', function() {
    var result = extractSection(sampleMd, 'Section Three');
    assert(result);
    assert(result.indexOf('Content of section three') >= 0);
  });

  it('extractComponent should extract ### heading', function() {
    var compMd = [
      '## Components',
      '',
      '### makeCard',
      'Card docs here.',
      '',
      '### makeButton',
      'Button docs here.'
    ].join('\n');
    var result = extractComponent(compMd, 'makeCard');
    assert(result);
    assert(result.indexOf('Card docs') >= 0);
    assert(result.indexOf('makeButton') < 0);
  });

  it('extractComponent should return null for non-matching component', function() {
    var compMd = '### makeCard\nDocs.';
    var result = extractComponent(compMd, 'makeNonexistent');
    assert.equal(result, null);
  });
});
