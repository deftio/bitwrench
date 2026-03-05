/**
 * Tests for bw.generateTheme() and color utility functions
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
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
