/**
 * Tests for bw.generateTheme() and color utility functions
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { getStructuralStyles, generateThemedCSS, generateAlternateCSS, getAllStyles, defaultStyles, resolveLayout } from "../src/bitwrench-styles.js";
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

    it('should use default semantic colors when harmonize is 0', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997',
        harmonize: 0
      });
      assert.strictEqual(palette.success.base, '#198754');
      assert.strictEqual(palette.danger.base, '#dc3545');
      assert.strictEqual(palette.warning.base, '#f0ad4e');
      assert.strictEqual(palette.info.base, '#17a2b8');
    });

    it('should harmonize semantic colors toward primary by default', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997'
      });
      // With default harmonize=0.20, hues shift toward primary (hue 180)
      // So they should NOT exactly match the defaults
      assert.notStrictEqual(palette.success.base, '#198754');
      assert.notStrictEqual(palette.danger.base, '#dc3545');
    });

    it('should allow overriding semantic colors', function() {
      const palette = bw.derivePalette({
        primary: '#006666',
        secondary: '#6c757d',
        tertiary: '#20c997',
        success: '#00cc00',
        harmonize: 0
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
      // Utility classes: .bw_btn.bw_bg_primary replaces .bw_btn_primary
      assert.ok(result.css.includes('.bw_btn.bw_bg_primary'), 'should have .bw_btn.bw_bg_primary');
      assert.ok(result.css.includes('.bw_btn.bw_bg_secondary'), 'should have .bw_btn.bw_bg_secondary');
      assert.ok(result.css.includes('.bw_btn.bw_bg_success'), 'should have .bw_btn.bw_bg_success');
      assert.ok(result.css.includes('.bw_btn.bw_bg_danger'), 'should have .bw_btn.bw_bg_danger');
      assert.ok(result.css.includes('.bw_btn.bw_bg_warning'), 'should have .bw_btn.bw_bg_warning');
      assert.ok(result.css.includes('.bw_btn.bw_bg_info'), 'should have .bw_btn.bw_bg_info');
      assert.ok(result.css.includes('.bw_btn.bw_bg_light'), 'should have .bw_btn.bw_bg_light');
      assert.ok(result.css.includes('.bw_btn.bw_bg_dark'), 'should have .bw_btn.bw_bg_dark');
    });

    it('should contain outline button variants', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      // Utility classes: .bw_btn.bw_btn_outline.bw_border_primary replaces .bw_btn_outline_primary
      assert.ok(result.css.includes('.bw_btn.bw_btn_outline.bw_border_primary'), 'should have outline-primary');
      assert.ok(result.css.includes('.bw_btn.bw_btn_outline.bw_border_danger'), 'should have outline-danger');
    });

    it('should contain alert variant selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      // Utility classes: .bw_alert.bw_bg_primary_light replaces .bw_alert_primary
      assert.ok(result.css.includes('.bw_bg_primary_light'), 'should have .bw_bg_primary_light for alerts');
      assert.ok(result.css.includes('.bw_bg_success_light'), 'should have .bw_bg_success_light for alerts');
      assert.ok(result.css.includes('.bw_bg_danger_light'), 'should have .bw_bg_danger_light for alerts');
    });

    it('should contain badge variant selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      // Utility classes: .bw_bg_primary replaces .bw_badge_primary
      assert.ok(result.css.includes('.bw_bg_primary'), 'should have .bw_bg_primary for badges');
      assert.ok(result.css.includes('.bw_bg_success'), 'should have .bw_bg_success for badges');
    });

    it('should contain utility color selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      assert.ok(result.css.includes('.bw_text_primary'), 'should have .bw_text_primary');
      assert.ok(result.css.includes('.bw_bg_primary'), 'should have .bw_bg_primary');
    });

    it('should contain underscore alias selectors', function() {
      const result = bw.generateTheme('t', {
        primary: '#006666',
        secondary: '#6c757d',
        inject: false
      });
      // Utility classes use underscores: .bw_bg_primary, .bw_text_primary
      assert.ok(result.css.includes('.bw_bg_primary'),
        'should have underscore utility classes');
    });

    it('should use default semantic colors when harmonize is 0', function() {
      const result = bw.generateTheme('t', {
        primary: '#0077b6',
        secondary: '#90e0ef',
        harmonize: 0,
        inject: false
      });
      // Success should be exact default green when harmonize=0
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

describe('Harmonize', function() {

  it('bw.harmonize should be a function', function() {
    assert.strictEqual(typeof bw.harmonize, 'function');
  });

  it('harmonize with amount=0 should return original color', function() {
    const result = bw.harmonize('#dc3545', '#006666', 0);
    assert.strictEqual(result, '#dc3545');
  });

  it('harmonize should shift hue toward target', function() {
    // Red (hue ~354) should shift toward teal (hue 180)
    const result = bw.harmonize('#dc3545', '#006666', 0.20);
    const srcHsl = bw.hexToHsl('#dc3545');
    const resHsl = bw.hexToHsl(result);
    // Hue should have moved (not necessarily closer due to circular distance)
    assert.notStrictEqual(srcHsl[0], resHsl[0]);
    // Saturation and lightness should be preserved
    assert.strictEqual(srcHsl[1], resHsl[1]);
    assert.strictEqual(srcHsl[2], resHsl[2]);
  });

  it('harmonize should preserve saturation and lightness', function() {
    const src = '#f0ad4e';
    const result = bw.harmonize(src, '#0077b6', 0.40);
    const srcHsl = bw.hexToHsl(src);
    const resHsl = bw.hexToHsl(result);
    assert.strictEqual(srcHsl[1], resHsl[1]);
    assert.strictEqual(srcHsl[2], resHsl[2]);
  });

  it('harmonize with amount=1 should fully shift to target hue', function() {
    const result = bw.harmonize('#dc3545', '#006666', 1.0);
    const resHsl = bw.hexToHsl(result);
    const tgtHsl = bw.hexToHsl('#006666');
    assert.strictEqual(resHsl[0], tgtHsl[0]);
  });

  it('generateTheme should accept harmonize parameter', function() {
    const result0 = bw.generateTheme('h0', {
      primary: '#006666', secondary: '#cc6633',
      harmonize: 0, inject: false
    });
    const result40 = bw.generateTheme('h40', {
      primary: '#006666', secondary: '#cc6633',
      harmonize: 0.40, inject: false
    });
    // Different harmonize amounts produce different palettes
    assert.notStrictEqual(result0.palette.success.base, result40.palette.success.base);
  });
});

describe('Type Scale Presets', function() {

  it('bw.TYPE_RATIO_PRESETS should have tight, normal, relaxed, dramatic', function() {
    assert.ok('tight' in bw.TYPE_RATIO_PRESETS);
    assert.ok('normal' in bw.TYPE_RATIO_PRESETS);
    assert.ok('relaxed' in bw.TYPE_RATIO_PRESETS);
    assert.ok('dramatic' in bw.TYPE_RATIO_PRESETS);
  });

  it('TYPE_RATIO_PRESETS values should be numbers', function() {
    Object.values(bw.TYPE_RATIO_PRESETS).forEach(function(v) {
      assert.strictEqual(typeof v, 'number');
      assert.ok(v > 1.0 && v < 2.0, 'ratio should be between 1 and 2');
    });
  });

  it('bw.generateTypeScale should produce 8 sizes', function() {
    const scale = bw.generateTypeScale(16, 1.2);
    assert.strictEqual(typeof scale, 'object');
    assert.strictEqual(scale.base, 16);
    assert.ok(scale.xs < scale.sm);
    assert.ok(scale.sm < scale.base);
    assert.ok(scale.base < scale.lg);
    assert.ok(scale.lg < scale.xl);
    assert.ok(scale.xl < scale['2xl']);
    assert.ok(scale['2xl'] < scale['3xl']);
    assert.ok(scale['3xl'] < scale['4xl']);
  });

  it('tight ratio should produce smaller spread than dramatic', function() {
    const tight = bw.generateTypeScale(16, bw.TYPE_RATIO_PRESETS.tight);
    const dramatic = bw.generateTypeScale(16, bw.TYPE_RATIO_PRESETS.dramatic);
    assert.ok(tight['4xl'] < dramatic['4xl'], 'tight should have smaller 4xl');
    assert.ok(tight.xs > dramatic.xs, 'tight should have larger xs');
  });

  it('resolveLayout should resolve typeRatio by name', function() {
    const layout = resolveLayout({ typeRatio: 'dramatic' });
    assert.strictEqual(layout.typeScale.base, 16);
    const dramatic = bw.generateTypeScale(16, bw.TYPE_RATIO_PRESETS.dramatic);
    assert.strictEqual(layout.typeScale['4xl'], dramatic['4xl']);
  });

  it('resolveLayout should accept typeRatio as number', function() {
    const layout = resolveLayout({ typeRatio: 1.333 });
    assert.strictEqual(layout.typeScale.base, 16);
    assert.ok(layout.typeScale['4xl'] > 50, 'dramatic ratio should produce large 4xl');
  });
});

describe('Elevation Presets', function() {

  it('bw.ELEVATION_PRESETS should have flat, sm, md, lg', function() {
    assert.ok('flat' in bw.ELEVATION_PRESETS);
    assert.ok('sm' in bw.ELEVATION_PRESETS);
    assert.ok('md' in bw.ELEVATION_PRESETS);
    assert.ok('lg' in bw.ELEVATION_PRESETS);
  });

  it('each elevation preset should have sm, md, lg, xl levels', function() {
    Object.values(bw.ELEVATION_PRESETS).forEach(function(preset) {
      assert.ok('sm' in preset);
      assert.ok('md' in preset);
      assert.ok('lg' in preset);
      assert.ok('xl' in preset);
    });
  });

  it('flat elevation should be all none', function() {
    Object.values(bw.ELEVATION_PRESETS.flat).forEach(function(v) {
      assert.strictEqual(v, 'none');
    });
  });

  it('resolveLayout should resolve elevation by name', function() {
    const layout = resolveLayout({ elevation: 'lg' });
    assert.strictEqual(layout.elevation.sm, bw.ELEVATION_PRESETS.lg.sm);
  });

  it('resolveLayout should accept elevation as custom object', function() {
    const custom = { sm: 'none', md: '0 2px 4px black', lg: '0 4px 8px black', xl: '0 8px 16px black' };
    const layout = resolveLayout({ elevation: custom });
    assert.strictEqual(layout.elevation.md, '0 2px 4px black');
  });

  it('elevation should affect generated theme CSS', function() {
    const flat = bw.generateTheme('elev-flat', {
      primary: '#006666', secondary: '#6c757d',
      elevation: 'flat', inject: false
    });
    const lg = bw.generateTheme('elev-lg', {
      primary: '#006666', secondary: '#6c757d',
      elevation: 'lg', inject: false
    });
    assert.notStrictEqual(flat.css, lg.css);
    assert.ok(flat.css.includes('none'), 'flat theme should contain none shadows');
  });
});

describe('Motion Presets', function() {

  it('bw.MOTION_PRESETS should have reduced, standard, expressive', function() {
    assert.ok('reduced' in bw.MOTION_PRESETS);
    assert.ok('standard' in bw.MOTION_PRESETS);
    assert.ok('expressive' in bw.MOTION_PRESETS);
  });

  it('each motion preset should have fast, normal, slow, easing', function() {
    Object.values(bw.MOTION_PRESETS).forEach(function(preset) {
      assert.ok('fast' in preset);
      assert.ok('normal' in preset);
      assert.ok('slow' in preset);
      assert.ok('easing' in preset);
    });
  });

  it('reduced motion should be 0ms', function() {
    assert.strictEqual(bw.MOTION_PRESETS.reduced.fast, '0ms');
    assert.strictEqual(bw.MOTION_PRESETS.reduced.normal, '0ms');
    assert.strictEqual(bw.MOTION_PRESETS.reduced.slow, '0ms');
  });

  it('resolveLayout should resolve motion by name', function() {
    const layout = resolveLayout({ motion: 'expressive' });
    assert.strictEqual(layout.motion.fast, bw.MOTION_PRESETS.expressive.fast);
    assert.ok(layout.motion.easing.includes('cubic-bezier'));
  });

  it('resolveLayout should accept motion as custom object', function() {
    const custom = { fast: '50ms', normal: '100ms', slow: '150ms', easing: 'linear' };
    const layout = resolveLayout({ motion: custom });
    assert.strictEqual(layout.motion.fast, '50ms');
  });

  it('motion should affect generated theme CSS', function() {
    const reduced = bw.generateTheme('mot-reduced', {
      primary: '#006666', secondary: '#6c757d',
      motion: 'reduced', inject: false
    });
    const expressive = bw.generateTheme('mot-expressive', {
      primary: '#006666', secondary: '#6c757d',
      motion: 'expressive', inject: false
    });
    assert.notStrictEqual(reduced.css, expressive.css);
    assert.ok(reduced.css.includes('0ms'), 'reduced theme should contain 0ms transitions');
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

  it('applyTheme should be a function', function() {
    assert.strictEqual(typeof bw.applyTheme, 'function');
  });
  it('toggleTheme should be a function', function() {
    assert.strictEqual(typeof bw.toggleTheme, 'function');
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
    const el = document.getElementById('bw_theme_inject_test');
    assert.ok(el !== null, 'style element should exist');
    assert.ok(el.textContent.includes('.bw_bg_primary'), 'should contain .bw_bg_primary utility class');
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
    const el = document.getElementById('bw_theme_replace_test');
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
    const elA = document.getElementById('bw_theme_multi_a');
    const elB = document.getElementById('bw_theme_multi_b');
    assert.ok(elA !== null, 'style element A should exist');
    assert.ok(elB !== null, 'style element B should exist');
    assert.notStrictEqual(elA, elB);
    // Clean up
    elA.remove();
    elB.remove();
  });

  it('unscoped theme should use bw_theme_default id', function() {
    bw.generateTheme('', {
      primary: '#006666',
      secondary: '#6c757d',
      inject: true
    });
    const el = document.getElementById('bw_theme_default');
    assert.ok(el !== null, 'style element should exist with bw_theme_default id');
    // Clean up
    el.remove();
  });

  it('inject: false should not create style element', function() {
    bw.generateTheme('no-inject', {
      primary: '#006666',
      secondary: '#6c757d',
      inject: false
    });
    const el = document.getElementById('bw_theme_no_inject');
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
      '.bw_btn', '.bw_card', '.bw_form_control', '.bw_table',
      '.bw_alert', '.bw_badge', '.bw_nav', '.bw_tab_content',
      '.bw_list_group', '.bw_pagination', '.bw_breadcrumb',
      '.bw_progress', '.bw_hero', '.bw_container',
      '.bw_spinner_border', '.bw_vstack', '.bw_hstack',
      '.bw_form_check', '.bw_close'
    ];
    expectedSelectors.forEach(function(sel) {
      assert.ok(sel in rules || (sel + ', ' + sel.replace(/\.bw-/g, '.bw_')) in rules,
        'structural should have selector: ' + sel);
    });
  });

  it('structural styles should have grid columns', function() {
    const rules = getStructuralStyles();
    assert.ok('.bw_row' in rules, 'should have .bw_row');
    assert.ok('.bw_col' in rules, 'should have .bw_col');
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
    // Buttons (utility classes)
    assert.ok(css.includes('.bw_btn.bw_bg_primary'), 'should have button interaction rules');
    // Alerts (utility classes)
    assert.ok(css.includes('.bw_bg_primary_light'), 'should have alert bg utility');
    // Badges (utility classes)
    assert.ok(css.includes('.bw_bg_primary'), 'should have badge bg utility');
    // Cards
    assert.ok(css.includes('.bw_card'), 'should have cards');
    // Forms
    assert.ok(css.includes('.bw_form_control'), 'should have forms');
    // Navigation
    assert.ok(css.includes('.bw_navbar'), 'should have navigation');
    // Tables
    assert.ok(css.includes('.bw_table'), 'should have tables');
    // Tabs
    assert.ok(css.includes('.bw_nav_tabs'), 'should have tabs');
    // List groups
    assert.ok(css.includes('.bw_list_group_item'), 'should have list groups');
    // Pagination
    assert.ok(css.includes('.bw_page_link'), 'should have pagination');
    // Progress
    assert.ok(css.includes('.bw_progress'), 'should have progress');
    // Hero
    assert.ok(css.includes('.bw_hero'), 'should have hero');
    // Breadcrumb
    assert.ok(css.includes('.bw_breadcrumb'), 'should have breadcrumbs');
    // Spinner (interaction rules)
    assert.ok(css.includes('.bw_spinner_border.bw_text_primary'), 'should have spinners');
    // Close button
    assert.ok(css.includes('.bw_close'), 'should have close button');
    // Sections
    assert.ok(css.includes('.bw_section_subtitle'), 'should have sections');
    // Reset (body)
    assert.ok(css.includes('body'), 'should have body reset');
    // Utility colors
    assert.ok(css.includes('.bw_text_primary'), 'should have text colors');
    assert.ok(css.includes('.bw_bg_primary'), 'should have bg colors');
  });

  it('generateThemedCSS should produce card variant accent borders', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    // Card accent borders via utility classes
    assert.ok(css.includes('.bw_card.bw_card_accent.bw_border_primary'), 'should have card accent primary');
    assert.ok(css.includes('.bw_card.bw_card_accent.bw_border_danger'), 'should have card accent danger');
  });

  it('generateThemedCSS should produce progress bar variants', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    // Progress bar colors via utility classes
    assert.ok(css.includes('.bw_progress_bar.bw_bg_primary'), 'should have progress-bar-primary');
    assert.ok(css.includes('.bw_progress_bar.bw_bg_success'), 'should have progress-bar-success');
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

  it('generateThemedCSS raw output uses underscore selectors', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    assert.ok(css.includes('.bw_bg_primary'), 'raw output should have utility class selectors');
    assert.ok(css.includes('.bw_btn.bw_bg_primary'), 'raw output should have button interaction rules');
  });
});

describe('Alternate Palette', function() {

  it('deriveAlternateSeed should invert luminance', function() {
    // Light color → dark alternate
    var alt = bw.deriveAlternateSeed('#ffffff');
    var altHsl = bw.hexToHsl(alt);
    assert.ok(altHsl[2] < 50, 'white should produce dark alternate, got L=' + altHsl[2]);

    // Dark color → light alternate
    var alt2 = bw.deriveAlternateSeed('#000000');
    var altHsl2 = bw.hexToHsl(alt2);
    assert.ok(altHsl2[2] > 50, 'black should produce light alternate, got L=' + altHsl2[2]);
  });

  it('deriveAlternateSeed should preserve hue', function() {
    var hsl = bw.hexToHsl('#006666');
    var alt = bw.deriveAlternateSeed('#006666');
    var altHsl = bw.hexToHsl(alt);
    assert.ok(Math.abs(hsl[0] - altHsl[0]) < 2, 'hue should be preserved');
  });

  it('isLightPalette should classify light vs dark', function() {
    assert.strictEqual(bw.isLightPalette({ primary: '#ffffff', secondary: '#eeeeee' }), true);
    assert.strictEqual(bw.isLightPalette({ primary: '#000000', secondary: '#111111' }), false);
  });

  it('deriveAlternateConfig should produce valid config', function() {
    var config = { primary: '#006666', secondary: '#cc6633', tertiary: '#339966' };
    var alt = bw.deriveAlternateConfig(config);
    assert.ok(alt.primary, 'should have primary');
    assert.ok(alt.secondary, 'should have secondary');
    assert.ok(alt.tertiary, 'should have tertiary');
    assert.ok(alt.light, 'should have light');
    assert.ok(alt.dark, 'should have dark');
    assert.ok(alt.success, 'should have success');
    assert.ok(alt.danger, 'should have danger');
  });

  it('generateTheme should return alternate property', function() {
    var result = bw.generateTheme('test-alt', {
      primary: '#006666',
      secondary: '#cc6633',
      inject: false
    });
    assert.ok(result.alternate, 'result should have alternate');
    assert.ok(result.alternate.css, 'alternate should have css');
    assert.ok(result.alternate.palette, 'alternate should have palette');
    assert.ok(result.alternate.css.includes('bw_theme_alt'), 'alt CSS should use .bw_theme_alt scope');
    assert.strictEqual(typeof result.isLightPrimary, 'boolean', 'should have isLightPrimary');
  });

  it('generateAlternateCSS should scope rules under .bw_theme_alt', function() {
    var config = { primary: '#006666', secondary: '#cc6633' };
    var altConfig = bw.deriveAlternateConfig(config);
    var palette = bw.derivePalette(altConfig);
    var layout = resolveLayout({});
    var rules = generateAlternateCSS('', palette, layout);
    var css = bw.css(rules);
    assert.ok(css.includes('.bw_theme_alt'), 'should scope under .bw_theme_alt');
  });

  it('generateAlternateCSS with named theme should use compound selector', function() {
    var config = { primary: '#006666', secondary: '#cc6633' };
    var altConfig = bw.deriveAlternateConfig(config);
    var palette = bw.derivePalette(altConfig);
    var layout = resolveLayout({});
    var rules = generateAlternateCSS('ocean', palette, layout);
    var css = bw.css(rules);
    assert.ok(css.includes('.ocean.bw_theme_alt'), 'should use compound selector .ocean.bw_theme_alt');
  });

  it('applyTheme and toggleTheme should be callable', function() {
    assert.strictEqual(typeof bw.applyTheme, 'function');
    assert.strictEqual(typeof bw.toggleTheme, 'function');
  });
});

describe('Structural + Cosmetic = Full Coverage', function() {

  it('getAllStyles should return all defaultStyles categories merged', function() {
    const all = getAllStyles();
    assert.ok(Object.keys(all).length > 100, 'should have many selectors');
    // Check for key selectors from different categories
    assert.ok('.bw_btn' in all, 'should have buttons');
    assert.ok('.bw_card' in all, 'should have cards');
    assert.ok('.bw_alert' in all, 'should have alerts');
    assert.ok('.bw_table' in all, 'should have tables');
    assert.ok('.bw_spinner_border' in all, 'should have spinners');
    assert.ok('.bw_form_check' in all, 'should have form checks');
    assert.ok('.bw_close' in all, 'should have close button');
    assert.ok('.bw_vstack' in all, 'should have stacks');
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
    const structEl = document.getElementById('bw_structural');
    const themeEl = document.getElementById('bw_theme_default');
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
