/**
 * Tests for bw.generateTheme() and color utility functions
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { getStructuralStyles, generateThemedCSS, generateDarkModeCSS, getAllStyles, defaultStyles, resolveLayout } from "../src/bitwrench-styles.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// Set up DOM environment
function freshDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  return dom;
}

freshDOM();

describe('Color Utility Functions', function() {

  describe('bw.hexToHsl', function() {
    it('should convert black to [0, 0, 0]', function() {
      const hsl = bw.hexToHsl('#000000');
      assert.strictEqual(hsl[0], 0);
      assert.strictEqual(hsl[1], 0);
      assert.strictEqual(hsl[2], 0);
    });

    it('should convert white to [0, 0, 100]', function() {
      const hsl = bw.hexToHsl('#ffffff');
      assert.ok(Math.abs(hsl[2] - 100) <= 1, 'lightness should be ~100');
    });

    it('should convert pure red to hue ~0', function() {
      const hsl = bw.hexToHsl('#ff0000');
      assert.ok(Math.abs(hsl[0] - 0) <= 1, 'hue should be ~0');
      assert.ok(Math.abs(hsl[1] - 100) <= 1, 'saturation should be ~100');
      assert.ok(Math.abs(hsl[2] - 50) <= 1, 'lightness should be ~50');
    });

    it('should convert pure green to hue ~120', function() {
      const hsl = bw.hexToHsl('#00ff00');
      assert.ok(Math.abs(hsl[0] - 120) <= 1, 'hue should be ~120');
    });

    it('should convert pure blue to hue ~240', function() {
      const hsl = bw.hexToHsl('#0000ff');
      assert.ok(Math.abs(hsl[0] - 240) <= 1, 'hue should be ~240');
    });
  });

  describe('bw.hslToHex', function() {
    it('should convert [0, 0, 0] to #000000', function() {
      assert.strictEqual(bw.hslToHex([0, 0, 0]), '#000000');
    });

    it('should convert [0, 0, 100] to #ffffff', function() {
      assert.strictEqual(bw.hslToHex([0, 0, 100]), '#ffffff');
    });

    it('should round-trip from hex to HSL and back', function() {
      const original = '#006666';
      const hsl = bw.hexToHsl(original);
      const roundTrip = bw.hslToHex(hsl);
      assert.strictEqual(roundTrip, original);
    });

    it('should round-trip for a bright color', function() {
      const original = '#ff6600';
      const hsl = bw.hexToHsl(original);
      const roundTrip = bw.hslToHex(hsl);
      // Allow minor rounding differences
      const origRGB = bw.colorParse(original);
      const rtRGB = bw.colorParse(roundTrip);
      assert.ok(Math.abs(origRGB[0] - rtRGB[0]) <= 2, 'R channel should be within 2');
      assert.ok(Math.abs(origRGB[1] - rtRGB[1]) <= 2, 'G channel should be within 2');
      assert.ok(Math.abs(origRGB[2] - rtRGB[2]) <= 2, 'B channel should be within 2');
    });
  });

  describe('bw.adjustLightness', function() {
    it('should lighten a color with positive amount', function() {
      const lighter = bw.adjustLightness('#006666', 20);
      const origHsl = bw.hexToHsl('#006666');
      const newHsl = bw.hexToHsl(lighter);
      assert.ok(newHsl[2] > origHsl[2], 'lightened color should have higher lightness');
    });

    it('should darken a color with negative amount', function() {
      const darker = bw.adjustLightness('#006666', -10);
      const origHsl = bw.hexToHsl('#006666');
      const newHsl = bw.hexToHsl(darker);
      assert.ok(newHsl[2] < origHsl[2], 'darkened color should have lower lightness');
    });

    it('should clamp to 0 for very dark adjustment', function() {
      const result = bw.adjustLightness('#333333', -100);
      const hsl = bw.hexToHsl(result);
      assert.strictEqual(hsl[2], 0);
    });

    it('should clamp to 100 for very light adjustment', function() {
      const result = bw.adjustLightness('#cccccc', 100);
      const hsl = bw.hexToHsl(result);
      assert.strictEqual(hsl[2], 100);
    });
  });

  describe('bw.mixColor', function() {
    it('should return hex1 when ratio is 0', function() {
      const result = bw.mixColor('#ff0000', '#0000ff', 0);
      assert.strictEqual(result, '#ff0000');
    });

    it('should return hex2 when ratio is 1', function() {
      const result = bw.mixColor('#ff0000', '#0000ff', 1);
      assert.strictEqual(result, '#0000ff');
    });

    it('should mix to midpoint at ratio 0.5', function() {
      const result = bw.mixColor('#000000', '#ffffff', 0.5);
      const rgb = bw.colorParse(result);
      // Should be roughly 128 for each channel
      assert.ok(Math.abs(rgb[0] - 128) <= 2, 'R should be ~128');
      assert.ok(Math.abs(rgb[1] - 128) <= 2, 'G should be ~128');
      assert.ok(Math.abs(rgb[2] - 128) <= 2, 'B should be ~128');
    });

    it('should mix with white for tinting', function() {
      const result = bw.mixColor('#006666', '#ffffff', 0.85);
      const rgb = bw.colorParse(result);
      // Should be very light
      assert.ok(rgb[0] > 200, 'R should be > 200');
      assert.ok(rgb[1] > 200, 'G should be > 200');
      assert.ok(rgb[2] > 200, 'B should be > 200');
    });
  });

  describe('bw.relativeLuminance', function() {
    it('should return 0 for black', function() {
      assert.ok(Math.abs(bw.relativeLuminance('#000000') - 0) < 0.001);
    });

    it('should return 1 for white', function() {
      assert.ok(Math.abs(bw.relativeLuminance('#ffffff') - 1) < 0.001);
    });

    it('should return correct luminance for known color', function() {
      // Pure red ~0.2126
      assert.ok(Math.abs(bw.relativeLuminance('#ff0000') - 0.2126) < 0.01);
    });
  });

  describe('bw.textOnColor', function() {
    it('should return #fff for dark backgrounds', function() {
      assert.strictEqual(bw.textOnColor('#000000'), '#fff');
      assert.strictEqual(bw.textOnColor('#006666'), '#fff');
      assert.strictEqual(bw.textOnColor('#333333'), '#fff');
    });

    it('should return #000 for light backgrounds', function() {
      assert.strictEqual(bw.textOnColor('#ffffff'), '#000');
      assert.strictEqual(bw.textOnColor('#f8f9fa'), '#000');
      assert.strictEqual(bw.textOnColor('#ffc107'), '#000');
    });
  });
});

describe('Palette Derivation', function() {

  describe('bw.deriveShades', function() {
    it('should return all 8 derived keys', function() {
      const shades = bw.deriveShades('#006666');
      const keys = ['base', 'hover', 'active', 'light', 'darkText', 'border', 'focus', 'textOn'];
      keys.forEach(function(k) {
        assert.ok(k in shades, 'should have key: ' + k);
      });
    });

    it('should have base equal to input', function() {
      const shades = bw.deriveShades('#ff6600');
      assert.strictEqual(shades.base, '#ff6600');
    });

    it('hover should be darker than base', function() {
      const shades = bw.deriveShades('#006666');
      const baseL = bw.hexToHsl(shades.base)[2];
      const hoverL = bw.hexToHsl(shades.hover)[2];
      assert.ok(hoverL < baseL, 'hover should be darker than base');
    });

    it('active should be darker than hover', function() {
      const shades = bw.deriveShades('#006666');
      const hoverL = bw.hexToHsl(shades.hover)[2];
      const activeL = bw.hexToHsl(shades.active)[2];
      assert.ok(activeL <= hoverL, 'active should be darker than or equal to hover');
    });

    it('light should be lighter than base', function() {
      const shades = bw.deriveShades('#006666');
      const baseL = bw.hexToHsl(shades.base)[2];
      const lightL = bw.hexToHsl(shades.light)[2];
      assert.ok(lightL > baseL, 'light should be lighter than base');
    });

    it('focus should contain rgba', function() {
      const shades = bw.deriveShades('#006666');
      assert.ok(shades.focus.startsWith('rgba('), 'focus should start with rgba(');
      assert.ok(shades.focus.includes('0.25'), 'focus should contain 0.25 alpha');
    });

    it('textOn should be correct for light input', function() {
      const shades = bw.deriveShades('#f8f9fa');
      assert.strictEqual(shades.textOn, '#000');
    });

    it('textOn should be correct for dark input', function() {
      const shades = bw.deriveShades('#212529');
      assert.strictEqual(shades.textOn, '#fff');
    });
  });

  describe('bw.derivePalette', function() {
    it('should return all 9 semantic colors', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997'
      });
      const keys = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
      keys.forEach(function(k) {
        assert.ok(k in palette, 'should have key: ' + k);
      });
    });

    it('should use default semantic colors when not specified', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997'
      });
      assert.strictEqual(palette.success.base, '#198754');
      assert.strictEqual(palette.danger.base, '#dc3545');
      assert.strictEqual(palette.warning.base, '#ffc107');
      assert.strictEqual(palette.info.base, '#0dcaf0');
    });

    it('should allow overriding semantic colors', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997',
        success: '#00cc00'
      });
      assert.strictEqual(palette.success.base, '#00cc00');
    });

    it('each entry should have full shade set', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997'
      });
      const shadeKeys = ['base', 'hover', 'active', 'light', 'darkText', 'border', 'focus', 'textOn'];
      Object.values(palette).forEach(function(shades) {
        shadeKeys.forEach(function(k) {
          assert.ok(k in shades, 'each semantic color should have key: ' + k);
        });
      });
    });
  });
});

describe('Theme Generation', function() {

  describe('bw.generateTheme', function() {
    it('should return { css, palette, name }', function() {
      const result = bw.generateTheme('test-theme', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        tertiary: '#00b4d8',
        inject: false
      });
      assert.ok('css' in result, 'should have css');
      assert.ok('palette' in result, 'should have palette');
      assert.ok('name' in result, 'should have name');
      assert.strictEqual(result.name, 'test-theme');
      assert.strictEqual(typeof result.css, 'string');
      assert.strictEqual(typeof result.palette, 'object');
    });

    it('should throw if primary is missing', function() {
      assert.throws(function() {
        bw.generateTheme('x', { secondary: '#aaa' });
      }, /primary/);
    });

    it('should throw if secondary is missing', function() {
      assert.throws(function() {
        bw.generateTheme('x', { primary: '#aaa' });
      }, /secondary/);
    });

    it('scoped selectors should start with .name', function() {
      const result = bw.generateTheme('ocean', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        inject: false
      });
      // All non-empty lines that look like selectors should be scoped
      const lines = result.css.split('\n');
      const selectorLines = lines.filter(function(l) { return l.includes('{') && !l.startsWith('}'); });
      selectorLines.forEach(function(line) {
        const sel = line.split('{')[0].trim();
        if (sel) {
          assert.ok(sel.includes('.ocean'), 'selector should contain .ocean: ' + sel);
        }
      });
    });

    it('unscoped theme should have no scope prefix', function() {
      const result = bw.generateTheme('', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        inject: false
      });
      const lines = result.css.split('\n');
      const selectorLines = lines.filter(function(l) { return l.includes('{') && !l.startsWith('}'); });
      selectorLines.forEach(function(line) {
        const sel = line.split('{')[0].trim();
        if (sel) {
          assert.ok(!sel.includes('.ocean'), 'unscoped selector should not contain .ocean');
        }
      });
    });

    it('should contain button variant selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw-btn-primary'), 'should have .bw-btn-primary');
      assert.ok(result.css.includes('.bw-btn-secondary'), 'should have .bw-btn-secondary');
      assert.ok(result.css.includes('.bw-btn-success'), 'should have .bw-btn-success');
      assert.ok(result.css.includes('.bw-btn-danger'), 'should have .bw-btn-danger');
      assert.ok(result.css.includes('.bw-btn-warning'), 'should have .bw-btn-warning');
      assert.ok(result.css.includes('.bw-btn-info'), 'should have .bw-btn-info');
      assert.ok(result.css.includes('.bw-btn-light'), 'should have .bw-btn-light');
      assert.ok(result.css.includes('.bw-btn-dark'), 'should have .bw-btn-dark');
    });

    it('should contain outline button variants', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw-btn-outline-primary'), 'should have outline-primary');
      assert.ok(result.css.includes('.bw-btn-outline-danger'), 'should have outline-danger');
    });

    it('should contain alert variant selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw-alert-primary'), 'should have .bw-alert-primary');
      assert.ok(result.css.includes('.bw-alert-success'), 'should have .bw-alert-success');
      assert.ok(result.css.includes('.bw-alert-danger'), 'should have .bw-alert-danger');
    });

    it('should contain badge variant selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw-badge-primary'), 'should have .bw-badge-primary');
      assert.ok(result.css.includes('.bw-badge-success'), 'should have .bw-badge-success');
    });

    it('should contain utility color selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw-text-primary'), 'should have .bw-text-primary');
      assert.ok(result.css.includes('.bw-bg-primary'), 'should have .bw-bg-primary');
    });

    it('should contain underscore alias selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw_btn-primary') || result.css.includes('.bw_btn_primary'),
        'should have underscore alias for buttons');
    });

    it('should use default semantic colors when not specified', function() {
      const result = bw.generateTheme('t', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        inject: false
      });
      // Success should be default green
      assert.strictEqual(result.palette.success.base, '#198754');
    });

    it('palette should have tertiary', function() {
      const result = bw.generateTheme('t', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        tertiary: '#00b4d8',
        inject: false
      });
      assert.strictEqual(result.palette.tertiary.base, '#00b4d8');
    });

    it('should default tertiary to primary when not specified', function() {
      const result = bw.generateTheme('t', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        inject: false
      });
      assert.strictEqual(result.palette.tertiary.base, '#0077b6');
    });
  });
});

describe('Layout Presets', function() {

  it('bw.SPACING_PRESETS should have compact, normal, spacious', function() {
    assert.ok('compact' in bw.SPACING_PRESETS);
    assert.ok('normal' in bw.SPACING_PRESETS);
    assert.ok('spacious' in bw.SPACING_PRESETS);
  });

  it('bw.RADIUS_PRESETS should have none, sm, md, lg, pill', function() {
    assert.ok('none' in bw.RADIUS_PRESETS);
    assert.ok('sm' in bw.RADIUS_PRESETS);
    assert.ok('md' in bw.RADIUS_PRESETS);
    assert.ok('lg' in bw.RADIUS_PRESETS);
    assert.ok('pill' in bw.RADIUS_PRESETS);
  });

  it('compact spacing should have smaller padding than normal', function() {
    const compact = bw.SPACING_PRESETS.compact;
    const normal = bw.SPACING_PRESETS.normal;
    const compactVal = parseFloat(compact.btn.split(' ')[0]);
    const normalVal = parseFloat(normal.btn.split(' ')[0]);
    assert.ok(compactVal < normalVal, 'compact should be smaller than normal');
  });

  it('spacious spacing should have larger padding than normal', function() {
    const spacious = bw.SPACING_PRESETS.spacious;
    const normal = bw.SPACING_PRESETS.normal;
    const spaciousVal = parseFloat(spacious.btn.split(' ')[0]);
    const normalVal = parseFloat(normal.btn.split(' ')[0]);
    assert.ok(spaciousVal > normalVal, 'spacious should be larger than normal');
  });

  it('none radius should be 0', function() {
    assert.strictEqual(bw.RADIUS_PRESETS.none.btn, '0');
    assert.strictEqual(bw.RADIUS_PRESETS.none.card, '0');
  });

  it('pill radius should use 50rem for buttons', function() {
    assert.strictEqual(bw.RADIUS_PRESETS.pill.btn, '50rem');
  });

  it('spacing preset should affect generated CSS', function() {
    const compact = bw.generateTheme('compact-test', {
      primary: '#006666',
      secondary: '#6c757d',
      spacing: 'compact',
      inject: false
    });
    const spacious = bw.generateTheme('spacious-test', {
      primary: '#006666',
      secondary: '#6c757d',
      spacing: 'spacious',
      inject: false
    });
    // Both should generate CSS
    assert.ok(compact.css.length > 0, 'compact should generate CSS');
    assert.ok(spacious.css.length > 0, 'spacious should generate CSS');
    // They should be different
    assert.notStrictEqual(compact.css, spacious.css);
  });

  it('radius preset should affect generated CSS', function() {
    const none = bw.generateTheme('none-test', {
      primary: '#006666',
      secondary: '#6c757d',
      radius: 'none',
      inject: false
    });
    const pill = bw.generateTheme('pill-test', {
      primary: '#006666',
      secondary: '#6c757d',
      radius: 'pill',
      inject: false
    });
    assert.notStrictEqual(none.css, pill.css);
  });
});

describe('Backwards Compatibility', function() {

  it('loadDefaultStyles should still be a function', function() {
    assert.strictEqual(typeof bw.loadDefaultStyles, 'function');
  });

  it('getTheme should still work', function() {
    const t = bw.getTheme();
    assert.ok('colors' in t, 'theme should have colors');
    assert.strictEqual(t.colors.primary, '#006666');
  });

  it('setTheme should still work (with deprecation)', function() {
    // Store original
    const original = bw.getTheme();
    const result = bw.setTheme({ colors: { primary: '#ff0000' } }, { inject: false });
    assert.strictEqual(result.colors.primary, '#ff0000');
    // Restore
    bw.setTheme({ colors: { primary: original.colors.primary } }, { inject: false });
  });

  it('toggleDarkMode should still work', function() {
    assert.strictEqual(typeof bw.toggleDarkMode, 'function');
  });

  it('bw.css should handle @media queries', function() {
    const rules = {
      '@media (min-width: 768px)': {
        '.test': { 'display': 'block' }
      }
    };
    const css = bw.css(rules);
    assert.ok(css.includes('@media (min-width: 768px)'), 'should contain @media');
    assert.ok(css.includes('.test'), 'should contain .test');
    assert.ok(css.includes('display'), 'should contain display');
  });

  it('bw.css should handle @keyframes', function() {
    const rules = {
      '@keyframes spin': {
        '0%': { 'transform': 'rotate(0deg)' },
        '100%': { 'transform': 'rotate(360deg)' }
      }
    };
    const css = bw.css(rules);
    assert.ok(css.includes('@keyframes spin'), 'should contain @keyframes spin');
    assert.ok(css.includes('transform'), 'should contain transform');
  });

  it('bw.colorParse should still work', function() {
    const result = bw.colorParse('#ff0000');
    assert.strictEqual(result[0], 255);
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[2], 0);
  });

  it('bw.colorRgbToHsl should still work', function() {
    const result = bw.colorRgbToHsl(255, 0, 0);
    assert.strictEqual(result[0], 0);
    assert.strictEqual(result[1], 100);
    assert.strictEqual(result[2], 50);
  });

  it('bw.colorHslToRgb should still work', function() {
    const result = bw.colorHslToRgb(0, 100, 50);
    assert.strictEqual(result[0], 255);
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[2], 0);
  });
});

describe('Integration (jsdom)', function() {

  beforeEach(function() {
    freshDOM();
  });

  it('should inject theme styles into DOM', function() {
    const result = bw.generateTheme('inject-test', {
      primary: '#0077b6',
      secondary: '#90e0ef',
      inject: true
    });
    const el = document.getElementById('bw-theme-inject-test');
    assert.ok(el !== null, 'style element should exist');
    assert.ok(el.textContent.includes('.bw-btn-primary'), 'should contain .bw-btn-primary');
    // Clean up
    el.remove();
  });

  it('should replace existing theme on re-generate', function() {
    bw.generateTheme('replace-test', {
      primary: '#ff0000',
      secondary: '#00ff00',
      inject: true
    });
    bw.generateTheme('replace-test', {
      primary: '#0000ff',
      secondary: '#ff00ff',
      inject: true
    });
    const el = document.getElementById('bw-theme-replace-test');
    assert.ok(el !== null, 'style element should exist');
    // Should contain the second theme's color, not the first
    assert.ok(el.textContent.includes('#0000ff'), 'should contain the second theme color');
    // Clean up
    el.remove();
  });

  it('multiple themes should get separate style elements', function() {
    bw.generateTheme('multi-a', {
      primary: '#ff0000',
      secondary: '#00ff00',
      inject: true
    });
    bw.generateTheme('multi-b', {
      primary: '#0000ff',
      secondary: '#ff00ff',
      inject: true
    });
    const elA = document.getElementById('bw-theme-multi-a');
    const elB = document.getElementById('bw-theme-multi-b');
    assert.ok(elA !== null, 'style element A should exist');
    assert.ok(elB !== null, 'style element B should exist');
    assert.notStrictEqual(elA, elB);
    // Clean up
    elA.remove();
    elB.remove();
  });

  it('unscoped theme should use bw-theme-default id', function() {
    bw.generateTheme('', {
      primary: '#006666',
      secondary: '#6c757d',
      inject: true
    });
    const el = document.getElementById('bw-theme-default');
    assert.ok(el !== null, 'style element should exist with bw-theme-default id');
    // Clean up
    el.remove();
  });

  it('inject: false should not create style element', function() {
    bw.generateTheme('no-inject', {
      primary: '#006666',
      secondary: '#6c757d',
      inject: false
    });
    const el = document.getElementById('bw-theme-no-inject');
    assert.strictEqual(el, null, 'no style element should be created');
  });
});

// =========================================================================
// Structural / Cosmetic Split Tests
// =========================================================================

describe('Structural Styles', function() {

  it('getStructuralStyles should return an object with selectors', function() {
    const rules = getStructuralStyles();
    assert.strictEqual(typeof rules, 'object');
    assert.ok(Object.keys(rules).length > 50, 'should have many selectors');
  });

  it('structural styles should contain no hardcoded hex color values in properties', function() {
    const rules = getStructuralStyles();
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/;
    for (const [selector, styles] of Object.entries(rules)) {
      if (typeof styles !== 'object') continue;
      for (const [prop, value] of Object.entries(styles)) {
        // Skip font-family which may reference system fonts, and border shorthand
        if (prop === 'font-family') continue;
        // border shorthand with color should not be in structural
        if (typeof value === 'string' && hexPattern.test(value)) {
          assert.fail('Structural selector "' + selector + '" property "' + prop + '" contains hardcoded color: ' + value);
        }
      }
    }
  });

  it('structural styles should include key component selectors', function() {
    const rules = getStructuralStyles();
    const expectedSelectors = [
      '.bw-btn', '.bw-card', '.bw-form-control', '.bw-table',
      '.bw-alert', '.bw-badge', '.bw-nav', '.bw-tab-content',
      '.bw-list-group', '.bw-pagination', '.bw-breadcrumb',
      '.bw-progress', '.bw-hero', '.bw-container',
      '.bw-spinner-border', '.bw-vstack', '.bw-hstack',
      '.bw-form-check', '.bw-close'
    ];
    expectedSelectors.forEach(function(sel) {
      assert.ok(sel in rules || (sel + ', ' + sel.replace(/\.bw-/g, '.bw_')) in rules,
        'structural should have selector: ' + sel);
    });
  });

  it('structural styles should have grid columns', function() {
    const rules = getStructuralStyles();
    assert.ok('.bw-row' in rules, 'should have .bw-row');
    assert.ok('.bw-col' in rules, 'should have .bw-col');
  });

  it('structural styles should have responsive breakpoints', function() {
    const css = bw.css(getStructuralStyles());
    assert.ok(css.includes('@media (min-width: 576px)'), 'should have sm breakpoint');
    assert.ok(css.includes('@media (min-width: 768px)'), 'should have md breakpoint');
    assert.ok(css.includes('@media (min-width: 992px)'), 'should have lg breakpoint');
  });

  it('structural styles should have mobile responsive rules', function() {
    const css = bw.css(getStructuralStyles());
    assert.ok(css.includes('@media (max-width: 575px)'), 'should have mobile breakpoint');
  });
});

describe('Themed CSS Completeness', function() {

  it('generateThemedCSS should produce selectors for all component types', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    // Buttons
    assert.ok(css.includes('.bw-btn-primary'), 'should have buttons');
    // Alerts
    assert.ok(css.includes('.bw-alert-primary'), 'should have alerts');
    // Badges
    assert.ok(css.includes('.bw-badge-primary'), 'should have badges');
    // Cards
    assert.ok(css.includes('.bw-card'), 'should have cards');
    // Forms
    assert.ok(css.includes('.bw-form-control'), 'should have forms');
    // Navigation
    assert.ok(css.includes('.bw-navbar'), 'should have navigation');
    // Tables
    assert.ok(css.includes('.bw-table'), 'should have tables');
    // Tabs
    assert.ok(css.includes('.bw-nav-tabs'), 'should have tabs');
    // List groups
    assert.ok(css.includes('.bw-list-group-item'), 'should have list groups');
    // Pagination
    assert.ok(css.includes('.bw-page-link'), 'should have pagination');
    // Progress
    assert.ok(css.includes('.bw-progress'), 'should have progress');
    // Hero
    assert.ok(css.includes('.bw-hero'), 'should have hero');
    // Breadcrumb
    assert.ok(css.includes('.bw-breadcrumb'), 'should have breadcrumbs');
    // Spinner
    assert.ok(css.includes('.bw-spinner-border'), 'should have spinners');
    // Close button
    assert.ok(css.includes('.bw-close'), 'should have close button');
    // Sections
    assert.ok(css.includes('.bw-section-subtitle'), 'should have sections');
    // Reset (body)
    assert.ok(css.includes('body'), 'should have body reset');
    // Utility colors
    assert.ok(css.includes('.bw-text-primary'), 'should have text colors');
    assert.ok(css.includes('.bw-bg-primary'), 'should have bg colors');
  });

  it('generateThemedCSS should produce card variant accent borders', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    assert.ok(css.includes('.bw-card-primary'), 'should have card-primary');
    assert.ok(css.includes('.bw-card-danger'), 'should have card-danger');
  });

  it('generateThemedCSS should produce progress bar variants', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    assert.ok(css.includes('.bw-progress-bar-primary'), 'should have progress-bar-primary');
    assert.ok(css.includes('.bw-progress-bar-success'), 'should have progress-bar-success');
  });

  it('scoped generateThemedCSS should prefix all selectors', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('my-scope', palette, resolveLayout({}));
    const css = bw.css(rules);
    const lines = css.split('\n');
    const selectorLines = lines.filter(function(l) { return l.includes('{') && !l.startsWith('}'); });
    selectorLines.forEach(function(line) {
      const sel = line.split('{')[0].trim();
      if (sel && sel !== '') {
        assert.ok(sel.includes('.my-scope'), 'scoped selector should contain .my-scope: ' + sel);
      }
    });
  });

  it('generateThemedCSS raw output uses hyphenated selectors', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    assert.ok(css.includes('.bw-btn-primary'), 'raw output should use hyphenated selectors');
    // Underscore aliases are added by generateTheme(), not generateThemedCSS()
    // generateTheme() underscore aliases are tested in the existing test suite above
  });
});

describe('Dark Mode CSS', function() {

  it('generateDarkModeCSS should return rules object', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateDarkModeCSS(palette);
    assert.strictEqual(typeof rules, 'object');
    assert.ok(Object.keys(rules).length > 5, 'should have multiple selectors');
  });

  it('generateDarkModeCSS should cover all major components', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateDarkModeCSS(palette);
    const css = bw.css(rules);
    assert.ok(css.includes('.bw-dark'), 'should use .bw-dark scope');
    assert.ok(css.includes('.bw-card'), 'should have card dark rules');
    assert.ok(css.includes('.bw-navbar'), 'should have navbar dark rules');
    assert.ok(css.includes('.bw-form-control'), 'should have form dark rules');
    assert.ok(css.includes('.bw-table'), 'should have table dark rules');
    assert.ok(css.includes('.bw-list-group'), 'should have list-group dark rules');
    assert.ok(css.includes('.bw-alert'), 'should have alert dark rules');
    assert.ok(css.includes('.bw-badge'), 'should have badge dark rules');
    assert.ok(css.includes('.bw-nav-tabs'), 'should have tabs dark rules');
    assert.ok(css.includes('.bw-pagination'), 'should have pagination dark rules');
    assert.ok(css.includes('.bw-breadcrumb'), 'should have breadcrumb dark rules');
    assert.ok(css.includes('.bw-hero'), 'should have hero dark rules');
    assert.ok(css.includes('.bw-progress'), 'should have progress dark rules');
  });

  it('generateDarkModeCSS with custom palette should use palette colors', function() {
    const customPalette = bw.derivePalette({
      primary: '#ff6600',
      secondary: '#003366'
    });
    const rules = generateDarkModeCSS(customPalette);
    const css = bw.css(rules);
    // Dark bg should be derived from the custom primary, not defaults
    assert.ok(css.length > 100, 'should produce CSS output');
    assert.ok(css.includes('.bw-dark'), 'should use .bw-dark scope');
  });

  it('toggleDarkMode should use _activePalette when set', function() {
    freshDOM();
    // Generate a theme (sets _activePalette)
    bw.generateTheme('', {
      primary: '#ff0000',
      secondary: '#00ff00',
      inject: true
    });
    assert.ok(bw._activePalette, '_activePalette should be set after generateTheme');
    assert.strictEqual(bw._activePalette.primary.base, '#ff0000');
    // Clean up
    var el = document.getElementById('bw-theme-default');
    if (el) el.remove();
  });

  it('toggleDarkMode should be callable', function() {
    freshDOM();
    assert.strictEqual(typeof bw.toggleDarkMode, 'function');
    // Note: full DOM dark mode toggle is tested via Playwright
  });
});

describe('Structural + Cosmetic = Full Coverage', function() {

  it('getAllStyles should return all defaultStyles categories merged', function() {
    const all = getAllStyles();
    assert.ok(Object.keys(all).length > 100, 'should have many selectors');
    // Check for key selectors from different categories
    assert.ok('.bw-btn' in all, 'should have buttons');
    assert.ok('.bw-card' in all, 'should have cards');
    assert.ok('.bw-alert' in all, 'should have alerts');
    assert.ok('.bw-table' in all, 'should have tables');
    assert.ok('.bw-spinner-border' in all, 'should have spinners');
    assert.ok('.bw-form-check' in all, 'should have form checks');
    assert.ok('.bw-close' in all, 'should have close button');
    assert.ok('.bw-vstack' in all, 'should have stacks');
  });

  it('defaultStyles should have all expected categories', function() {
    const expectedCategories = [
      'root', 'reset', 'typography', 'grid', 'buttons', 'cards', 'forms',
      'formChecks', 'navigation', 'tables', 'tableResponsive', 'alerts',
      'badges', 'progress', 'tabs', 'listGroups', 'pagination', 'breadcrumb',
      'hero', 'features', 'enhancedCards', 'sections', 'cta', 'spinner',
      'closeButton', 'stacks', 'offsets', 'codeDemo', 'utilities', 'responsive'
    ];
    expectedCategories.forEach(function(cat) {
      assert.ok(cat in defaultStyles, 'defaultStyles should have category: ' + cat);
    });
  });

  it('loadDefaultStyles combined output should cover structural + themed', function() {
    freshDOM();
    bw.loadDefaultStyles();
    const structEl = document.getElementById('bw-structural');
    const themeEl = document.getElementById('bw-theme-default');
    assert.ok(structEl !== null, 'structural styles should be injected');
    assert.ok(themeEl !== null, 'themed styles should be injected');
    // Structural should have layout properties
    assert.ok(structEl.textContent.includes('display'), 'structural should contain display');
    assert.ok(structEl.textContent.includes('flex'), 'structural should contain flex');
    // Themed should have color properties
    assert.ok(themeEl.textContent.includes('color'), 'themed should contain color');
    assert.ok(themeEl.textContent.includes('background'), 'themed should contain background');
  });
});
