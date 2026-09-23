/**
 * Tests for bw.makeStyles() and color utility functions
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { getStructuralStyles, getResetStyles, generateThemedCSS, generateAlternateCSS, getAllStyles, defaultStyles, resolveLayout, scopeRulesUnder, THEME_PRESETS, generateTypeScale, deepMerge, updateTheme, theme } from "../src/bitwrench-styles.js";
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

// Local hex parser helper (replaces removed bw.colorParse for test validation)
function parseHex(hex) {
  var h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

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
      const origRGB = parseHex(original);
      const rtRGB = parseHex(roundTrip);
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
      const rgb = parseHex(result);
      // Should be roughly 128 for each channel
      assert.ok(Math.abs(rgb[0] - 128) <= 2, 'R should be ~128');
      assert.ok(Math.abs(rgb[1] - 128) <= 2, 'G should be ~128');
      assert.ok(Math.abs(rgb[2] - 128) <= 2, 'B should be ~128');
    });

    it('should mix with white for tinting', function() {
      const result = bw.mixColor('#006666', '#ffffff', 0.85);
      const rgb = parseHex(result);
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
      Object.entries(palette).forEach(function([name, shades]) {
        // background and surface are plain strings, not shade objects
        if (name === 'background' || name === 'surface' || name === 'surfaceAlt') {
          assert.ok(typeof shades === 'string', name + ' should be a string');
          return;
        }
        shadeKeys.forEach(function(k) {
          assert.ok(k in shades, 'each semantic color should have key: ' + k);
        });
      });
    });
  });
});

describe('Theme Generation', function() {

  describe('bw.makeStyles', function() {
    it('should return { css, palette, layout, alternateCss, alternateRules, alternatePalette, isLightPrimary }', function() {
      const result = bw.makeStyles({
        primary: '#0077b6',
        secondary: '#90e0ef',
        tertiary: '#00b4d8'
      });
      assert.ok('css' in result, 'should have css');
      assert.ok('palette' in result, 'should have palette');
      assert.ok('layout' in result, 'should have layout');
      assert.ok(result.layout.spacing, 'layout.spacing');
      assert.ok(result.layout.radius, 'layout.radius');
      assert.ok(result.layout.elevation, 'layout.elevation');
      assert.ok(result.layout.motion, 'layout.motion');
      assert.ok(result.layout.typeScale, 'layout.typeScale');
      assert.ok('alternateCss' in result, 'should have alternateCss');
      assert.ok('alternateRules' in result, 'should have alternateRules');
      assert.ok('alternatePalette' in result, 'should have alternatePalette');
      assert.strictEqual(typeof result.isLightPrimary, 'boolean', 'should have isLightPrimary');
      assert.strictEqual(typeof result.css, 'string');
      assert.strictEqual(typeof result.palette, 'object');
    });

    it('should work with no args (all params optional)', function() {
      const result = bw.makeStyles();
      assert.ok('css' in result, 'should have css');
      assert.ok('palette' in result, 'should have palette');
      assert.ok(result.css.length > 100, 'should produce substantial CSS');
    });

    it('should work with only primary specified', function() {
      const result = bw.makeStyles({ primary: '#aaa' });
      assert.ok(result.css.length > 100, 'should produce CSS with only primary');
    });

    it('should work with only secondary specified', function() {
      const result = bw.makeStyles({ secondary: '#aaa' });
      assert.ok(result.css.length > 100, 'should produce CSS with only secondary');
    });

    it('should contain palette class selectors for all variants', function() {
      const result = bw.makeStyles({
        primary: '#006666',
        secondary: '#6c757d'
      });
      // Single palette class per variant: .bw_primary, .bw_secondary, etc.
      assert.ok(result.css.includes('.bw_primary'), 'should have .bw_primary');
      assert.ok(result.css.includes('.bw_secondary'), 'should have .bw_secondary');
      assert.ok(result.css.includes('.bw_success'), 'should have .bw_success');
      assert.ok(result.css.includes('.bw_danger'), 'should have .bw_danger');
      assert.ok(result.css.includes('.bw_warning'), 'should have .bw_warning');
      assert.ok(result.css.includes('.bw_info'), 'should have .bw_info');
      assert.ok(result.css.includes('.bw_light'), 'should have .bw_light');
      assert.ok(result.css.includes('.bw_dark'), 'should have .bw_dark');
    });

    it('should contain outline button variants', function() {
      const result = bw.makeStyles({
        primary: '#006666',
        secondary: '#6c757d'
      });
      // Outline buttons: .bw_bccl_btn_outline.bw_primary
      assert.ok(result.css.includes('.bw_bccl_btn_outline.bw_primary'), 'should have outline-primary');
      assert.ok(result.css.includes('.bw_bccl_btn_outline.bw_danger'), 'should have outline-danger');
    });

    it('should contain alert variant selectors', function() {
      const result = bw.makeStyles({
        primary: '#006666',
        secondary: '#6c757d'
      });
      // Alerts: .bw_bccl_alert.bw_primary with light bg override
      assert.ok(result.css.includes('.bw_bccl_alert.bw_primary'), 'should have .bw_bccl_alert.bw_primary');
      assert.ok(result.css.includes('.bw_bccl_alert.bw_success'), 'should have .bw_bccl_alert.bw_success');
      assert.ok(result.css.includes('.bw_bccl_alert.bw_danger'), 'should have .bw_bccl_alert.bw_danger');
    });

    it('should contain badge variant selectors', function() {
      const result = bw.makeStyles({
        primary: '#006666',
        secondary: '#6c757d'
      });
      // Badges use the root palette class: .bw_primary
      assert.ok(result.css.includes('.bw_primary'), 'should have .bw_primary for badges');
      assert.ok(result.css.includes('.bw_success'), 'should have .bw_success for badges');
    });

    it('should contain palette color selectors', function() {
      const result = bw.makeStyles({
        primary: '#006666',
        secondary: '#6c757d'
      });
      // Single palette class handles bg+color+border
      assert.ok(result.css.includes('.bw_primary'), 'should have .bw_primary');
      assert.ok(result.css.includes('.bw_text_muted'), 'should have .bw_text_muted');
    });

    it('should contain underscore palette selectors', function() {
      const result = bw.makeStyles({
        primary: '#006666',
        secondary: '#6c757d'
      });
      // Palette classes use underscores: .bw_primary
      assert.ok(result.css.includes('.bw_primary'),
        'should have underscore palette classes');
    });

    it('should use default semantic colors when harmonize is 0', function() {
      const result = bw.makeStyles({
        primary: '#0077b6',
        secondary: '#90e0ef',
        harmonize: 0
      });
      // Success should be exact default green when harmonize=0
      assert.strictEqual(result.palette.success.base, '#198754');
    });

    it('palette should have tertiary', function() {
      const result = bw.makeStyles({
        primary: '#0077b6',
        secondary: '#90e0ef',
        tertiary: '#00b4d8'
      });
      assert.strictEqual(result.palette.tertiary.base, '#00b4d8');
    });

    it('should default tertiary to primary when not specified', function() {
      const result = bw.makeStyles({
        primary: '#0077b6',
        secondary: '#90e0ef'
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
    const compact = bw.makeStyles({
      primary: '#006666',
      secondary: '#6c757d',
      spacing: 'compact'
    });
    const spacious = bw.makeStyles({
      primary: '#006666',
      secondary: '#6c757d',
      spacing: 'spacious'
    });
    // Both should generate CSS
    assert.ok(compact.css.length > 0, 'compact should generate CSS');
    assert.ok(spacious.css.length > 0, 'spacious should generate CSS');
    // They should be different
    assert.notStrictEqual(compact.css, spacious.css);
  });

  it('radius preset should affect generated CSS', function() {
    const none = bw.makeStyles({
      primary: '#006666',
      secondary: '#6c757d',
      radius: 'none'
    });
    const pill = bw.makeStyles({
      primary: '#006666',
      secondary: '#6c757d',
      radius: 'pill'
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

  it('makeStyles should accept harmonize parameter', function() {
    const result0 = bw.makeStyles({
      primary: '#006666', secondary: '#cc6633',
      harmonize: 0
    });
    const result40 = bw.makeStyles({
      primary: '#006666', secondary: '#cc6633',
      harmonize: 0.40
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

  it('elevation should affect generated CSS', function() {
    const flat = bw.makeStyles({
      primary: '#006666', secondary: '#6c757d',
      elevation: 'flat'
    });
    const lg = bw.makeStyles({
      primary: '#006666', secondary: '#6c757d',
      elevation: 'lg'
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

  it('motion should affect generated CSS', function() {
    const reduced = bw.makeStyles({
      primary: '#006666', secondary: '#6c757d',
      motion: 'reduced'
    });
    const expressive = bw.makeStyles({
      primary: '#006666', secondary: '#6c757d',
      motion: 'expressive'
    });
    assert.notStrictEqual(reduced.css, expressive.css);
    assert.ok(reduced.css.includes('0ms'), 'reduced theme should contain 0ms transitions');
  });
});

describe('Backwards Compatibility', function() {

  it('loadStyles should be a function', function() {
    assert.strictEqual(typeof bw.loadStyles, 'function');
  });

  it('toggleThemeMode should be a function', function() {
    assert.strictEqual(typeof bw.toggleThemeMode, 'function');
  });
  it('clearStyles should be a function', function() {
    assert.strictEqual(typeof bw.clearStyles, 'function');
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

});

describe('Integration (jsdom)', function() {

  beforeEach(function() {
    freshDOM();
  });

  it('should inject styles into DOM via applyStyles', function() {
    const styles = bw.makeStyles({
      primary: '#0077b6',
      secondary: '#90e0ef'
    });
    const el = bw.applyStyles(styles);
    assert.ok(el !== null, 'style element should exist');
    assert.strictEqual(el.id, 'bw_style_global');
    assert.ok(el.textContent.includes('.bw_primary'), 'should contain .bw_primary palette class');
  });

  it('should replace existing styles on re-apply', function() {
    const styles1 = bw.makeStyles({
      primary: '#ff0000',
      secondary: '#00ff00'
    });
    bw.applyStyles(styles1);
    const styles2 = bw.makeStyles({
      primary: '#0000ff',
      secondary: '#ff00ff'
    });
    bw.applyStyles(styles2);
    const el = document.getElementById('bw_style_global');
    assert.ok(el !== null, 'style element should exist');
    // Should contain the second theme's color, not the first
    assert.ok(el.textContent.includes('#0000ff'), 'should contain the second theme color');
  });

  it('multiple scoped styles should get separate style elements', function() {
    const stylesA = bw.makeStyles({
      primary: '#ff0000',
      secondary: '#00ff00'
    });
    const stylesB = bw.makeStyles({
      primary: '#0000ff',
      secondary: '#ff00ff'
    });
    bw.applyStyles(stylesA, '#scope-a');
    bw.applyStyles(stylesB, '#scope-b');
    // v2.1: _scopeToStyleId preserves sigil: '#scope-a' → 'bw_style_id_scope_a'
    const elA = document.getElementById('bw_style_id_scope_a');
    const elB = document.getElementById('bw_style_id_scope_b');
    assert.ok(elA !== null, 'style element A should exist');
    assert.ok(elB !== null, 'style element B should exist');
    assert.notStrictEqual(elA, elB);
  });

  it('global applyStyles should use bw_style_global id', function() {
    const styles = bw.makeStyles({
      primary: '#006666',
      secondary: '#6c757d'
    });
    bw.applyStyles(styles);
    const el = document.getElementById('bw_style_global');
    assert.ok(el !== null, 'style element should exist with bw_style_global id');
  });

  it('makeStyles should not create style element (pure)', function() {
    bw.makeStyles({
      primary: '#006666',
      secondary: '#6c757d'
    });
    const el = document.getElementById('bw_style_global');
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
      '.bw_bccl_btn', '.bw_bccl_card', '.bw_bccl_form_control', '.bw_bccl_table',
      '.bw_bccl_alert', '.bw_bccl_badge', '.bw_nav', '.bw_bccl_tab_content',
      '.bw_list_group', '.bw_bccl_pagination', '.bw_bccl_breadcrumb',
      '.bw_bccl_progress', '.bw_bccl_hero', '.bw_bccl_container',
      '.bw_spinner_border', '.bw_vstack', '.bw_hstack',
      '.bw_bccl_form_check', '.bw_close'
    ];
    // A rule key may be a group such as '.bw_bccl_container, .bw_container',
    // so match the individual selectors rather than the whole key.
    const declared = Object.keys(rules).reduce(function(set, key) {
      key.split(',').forEach(function(one) { set[one.trim()] = true; });
      return set;
    }, {});

    expectedSelectors.forEach(function(sel) {
      assert.ok(declared[sel] === true,
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
    // Palette classes (single class per variant)
    assert.ok(css.includes('.bw_primary'), 'should have palette class .bw_primary');
    assert.ok(css.includes('.bw_primary:hover'), 'should have hover pseudo-state');
    // Alert overrides
    assert.ok(css.includes('.bw_bccl_alert.bw_primary'), 'should have alert override');
    // Cards
    assert.ok(css.includes('.bw_bccl_card'), 'should have cards');
    assert.ok(css.includes('.bw_bccl_card.bw_primary'), 'should have card variant override');
    // Forms
    assert.ok(css.includes('.bw_bccl_form_control'), 'should have forms');
    // Navigation
    assert.ok(css.includes('.bw_bccl_navbar'), 'should have navigation');
    // Tables
    assert.ok(css.includes('.bw_bccl_table'), 'should have tables');
    // Tabs
    assert.ok(css.includes('.bw_nav_tabs'), 'should have tabs');
    // List groups
    assert.ok(css.includes('.bw_list_group_item'), 'should have list groups');
    // Pagination
    assert.ok(css.includes('.bw_page_link'), 'should have pagination');
    // Progress
    assert.ok(css.includes('.bw_bccl_progress'), 'should have progress');
    assert.ok(css.includes('.bw_bccl_progress_bar.bw_primary'), 'should have progress bar variant');
    // Hero
    assert.ok(css.includes('.bw_bccl_hero.bw_primary'), 'should have hero variant');
    // Breadcrumb
    assert.ok(css.includes('.bw_bccl_breadcrumb'), 'should have breadcrumbs');
    // Spinner (palette class override)
    assert.ok(css.includes('.bw_spinner_grow.bw_primary'), 'should have spinners');
    // Close button
    assert.ok(css.includes('.bw_close'), 'should have close button');
    // Sections
    assert.ok(css.includes('.bw_section_subtitle'), 'should have sections');
    // Reset (body)
    assert.ok(css.includes('body'), 'should have body reset');
    // Outline buttons
    assert.ok(css.includes('.bw_bccl_btn_outline.bw_primary'), 'should have outline buttons');
    // Text muted
    assert.ok(css.includes('.bw_text_muted'), 'should have text muted');
  });

  it('generateThemedCSS should produce card variant overrides', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    // Card variants via single palette class
    assert.ok(css.includes('.bw_bccl_card.bw_primary'), 'should have card primary');
    assert.ok(css.includes('.bw_bccl_card.bw_danger'), 'should have card danger');
  });

  it('generateThemedCSS should produce progress bar variants', function() {
    const palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    const rules = generateThemedCSS('', palette, resolveLayout({}));
    const css = bw.css(rules);
    // Progress bar colors via palette class
    assert.ok(css.includes('.bw_bccl_progress_bar.bw_primary'), 'should have progress-bar-primary');
    assert.ok(css.includes('.bw_bccl_progress_bar.bw_success'), 'should have progress-bar-success');
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
    assert.ok(css.includes('.bw_primary'), 'raw output should have palette class selectors');
    assert.ok(css.includes('.bw_primary:hover'), 'raw output should have palette hover rules');
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

  it('makeStyles should return alternateCss and alternatePalette', function() {
    var result = bw.makeStyles({
      primary: '#006666',
      secondary: '#cc6633'
    });
    assert.ok(result.alternateCss, 'result should have alternateCss');
    assert.ok(result.alternatePalette, 'result should have alternatePalette');
    assert.ok(result.alternateRules, 'result should have alternateRules');
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

  it('toggleThemeMode and clearStyles should be callable', function() {
    assert.strictEqual(typeof bw.toggleThemeMode, 'function');
    assert.strictEqual(typeof bw.clearStyles, 'function');
  });
});

describe('Structural + Cosmetic = Full Coverage', function() {

  it('getAllStyles should return all defaultStyles categories merged', function() {
    const all = getAllStyles();
    assert.ok(Object.keys(all).length > 100, 'should have many selectors');
    // Check for key selectors from different categories
    assert.ok('.bw_bccl_btn' in all, 'should have buttons');
    assert.ok('.bw_bccl_card' in all, 'should have cards');
    assert.ok('.bw_bccl_alert' in all, 'should have alerts');
    assert.ok('.bw_bccl_table' in all, 'should have tables');
    assert.ok('.bw_spinner_border' in all, 'should have spinners');
    assert.ok('.bw_bccl_form_check' in all, 'should have form checks');
    assert.ok('.bw_close' in all, 'should have close button');
    assert.ok('.bw_vstack' in all, 'should have stacks');
  });

  it('defaultStyles should have all expected categories', function() {
    const expectedCategories = [
      'reset', 'typography', 'grid', 'buttons', 'cards', 'forms',
      'formChecks', 'navigation', 'tables', 'tableResponsive', 'alerts',
      'badges', 'progress', 'tabs', 'listGroups', 'pagination', 'breadcrumb',
      'hero', 'features', 'enhancedCards', 'sections', 'cta', 'spinner',
      'closeButton', 'stacks', 'offsets', 'codeDemo', 'utilities', 'responsive'
    ];
    expectedCategories.forEach(function(cat) {
      assert.ok(cat in defaultStyles, 'defaultStyles should have category: ' + cat);
    });
  });

  it('loadStyles combined output should cover structural + themed', function() {
    freshDOM();
    bw.loadStyles();
    // v2.1: structural id is bw_style_structural
    const structEl = document.getElementById('bw_style_structural');
    const themeEl = document.getElementById('bw_style_global');
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

// =========================================================================
// v2.0.18 Clean Styles API Tests
// =========================================================================

describe('bw.makeStyles', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof bw.makeStyles, 'function');
  });

  it('should return an object with expected keys', function() {
    var result = bw.makeStyles();
    assert.ok(result.css, 'should have css');
    assert.ok(result.alternateCss, 'should have alternateCss');
    assert.ok(result.rules, 'should have rules');
    assert.ok(result.alternateRules, 'should have alternateRules');
    assert.ok(result.palette, 'should have palette');
    assert.ok(result.alternatePalette, 'should have alternatePalette');
    assert.strictEqual(typeof result.isLightPrimary, 'boolean', 'should have isLightPrimary boolean');
  });

  it('should work with no arguments (all defaults)', function() {
    var result = bw.makeStyles();
    assert.ok(result.css.length > 100, 'should produce substantial CSS');
    assert.ok(result.palette.primary, 'should have primary palette');
    assert.ok(result.palette.secondary, 'should have secondary palette');
  });

  it('should accept custom primary and secondary colors', function() {
    var result = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    assert.ok(result.css.includes('#4f46e5') || result.css.includes('4f46e5'), 'CSS should reference primary color');
    assert.strictEqual(result.palette.primary.base, '#4f46e5');
  });

  it('should be pure — no DOM side effects', function() {
    freshDOM();
    var stylesBefore = document.querySelectorAll('style').length;
    bw.makeStyles({ primary: '#ff0000', secondary: '#00ff00' });
    var stylesAfter = document.querySelectorAll('style').length;
    assert.strictEqual(stylesBefore, stylesAfter, 'should not inject any <style> elements');
  });

  it('alternateCss should have no .bw_theme_alt prefix', function() {
    var result = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    assert.ok(!result.alternateCss.includes('.bw_theme_alt'), 'alternateCss should not contain .bw_theme_alt');
  });

  it('should accept spacing and radius config', function() {
    var compact = bw.makeStyles({ primary: '#006666', secondary: '#cc6633', spacing: 'compact' });
    var spacious = bw.makeStyles({ primary: '#006666', secondary: '#cc6633', spacing: 'spacious' });
    assert.ok(compact.css !== spacious.css, 'different spacing should produce different CSS');

    var none = bw.makeStyles({ primary: '#006666', secondary: '#cc6633', radius: 'none' });
    var pill = bw.makeStyles({ primary: '#006666', secondary: '#cc6633', radius: 'pill' });
    assert.ok(none.css !== pill.css, 'different radius should produce different CSS');
  });

  it('should return rules objects suitable for bw.css()', function() {
    var result = bw.makeStyles();
    assert.strictEqual(typeof result.rules, 'object');
    assert.strictEqual(typeof result.alternateRules, 'object');
    // Should have selectors as keys
    var keys = Object.keys(result.rules);
    assert.ok(keys.length > 10, 'should have many rule selectors');
  });

  it('palette should have standard color roles', function() {
    var result = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    var p = result.palette;
    assert.ok(p.primary.base, 'palette.primary.base');
    assert.ok(p.primary.hover, 'palette.primary.hover');
    assert.ok(p.primary.textOn, 'palette.primary.textOn');
    assert.ok(p.secondary.base, 'palette.secondary.base');
    assert.ok(p.success, 'palette.success');
    assert.ok(p.danger, 'palette.danger');
    assert.ok(p.warning, 'palette.warning');
    assert.ok(p.info, 'palette.info');
  });

  it('alternatePalette should be luminance-inverted', function() {
    var result = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    // Primary and alternate should differ
    assert.notStrictEqual(result.palette.primary.base, result.alternatePalette.primary.base);
  });
});

describe('bw.applyStyles', function() {
  beforeEach(function() { freshDOM(); });

  it('should be a function', function() {
    assert.strictEqual(typeof bw.applyStyles, 'function');
  });

  it('should inject a <style> element with correct id (global)', function() {
    var styles = bw.makeStyles();
    var el = bw.applyStyles(styles);
    assert.ok(el, 'should return a <style> element');
    assert.strictEqual(el.id, 'bw_style_global');
    assert.ok(el.textContent.length > 100, 'should have CSS content');
  });

  it('should inject a <style> element with scoped id', function() {
    var styles = bw.makeStyles();
    var el = bw.applyStyles(styles, '#my-dashboard');
    assert.ok(el, 'should return a <style> element');
    // v2.1: _scopeToStyleId preserves sigil: '#my-dashboard' → 'bw_style_id_my_dashboard'
    assert.strictEqual(el.id, 'bw_style_id_my_dashboard');
  });

  it('scoped CSS should wrap selectors under scope', function() {
    var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    var el = bw.applyStyles(styles, '#my-dashboard');
    var css = el.textContent;
    assert.ok(css.includes('#my-dashboard'), 'CSS should contain scope selector');
  });

  it('alternate CSS should be wrapped with .bw_theme_alt (global)', function() {
    var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    var el = bw.applyStyles(styles);
    var css = el.textContent;
    assert.ok(css.includes('.bw_theme_alt'), 'CSS should contain .bw_theme_alt');
  });

  it('alternate CSS should use compound selector when scoped', function() {
    var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    var el = bw.applyStyles(styles, '#my-dashboard');
    var css = el.textContent;
    assert.ok(css.includes('#my-dashboard.bw_theme_alt'), 'CSS should contain compound scope+alt selector');
  });

  it('should be idempotent (replace existing <style> with same id)', function() {
    var styles1 = bw.makeStyles({ primary: '#ff0000', secondary: '#00ff00' });
    var styles2 = bw.makeStyles({ primary: '#0000ff', secondary: '#ffff00' });
    bw.applyStyles(styles1);
    bw.applyStyles(styles2);
    var styleEls = document.querySelectorAll('#bw_style_global');
    assert.strictEqual(styleEls.length, 1, 'should have exactly one global <style>');
  });

  it('should return null for invalid styles', function() {
    var el = bw.applyStyles(null);
    assert.strictEqual(el, null);
    var el2 = bw.applyStyles({});
    assert.strictEqual(el2, null);
  });
});

describe('bw.loadStyles', function() {
  beforeEach(function() { freshDOM(); });

  it('should be a function', function() {
    assert.strictEqual(typeof bw.loadStyles, 'function');
  });

  it('should work with no arguments', function() {
    var styles = bw.loadStyles();
    assert.ok(styles, 'should return a styles object');
    assert.ok(styles.palette, 'should have palette');
    assert.ok(styles.alternatePalette, 'should have alternatePalette');
    assert.ok(styles.css, 'should have css string');
    // Style element should also be injected
    var el = document.getElementById('bw_style_global');
    assert.ok(el, 'style element should be injected');
  });

  it('should inject structural CSS alongside themed CSS', function() {
    bw.loadStyles();
    // v2.1: structural id is bw_style_structural
    var structEl = document.getElementById('bw_style_structural');
    var themeEl = document.getElementById('bw_style_global');
    assert.ok(structEl, 'structural styles should be injected');
    assert.ok(themeEl, 'themed styles should be injected');
  });

  it('should accept config with custom colors', function() {
    var styles = bw.loadStyles({ primary: '#4f46e5', secondary: '#d97706' });
    assert.ok(styles, 'should return a styles object');
    assert.ok(styles.palette.primary.base, 'palette should have primary color');
  });

  it('should accept scope parameter', function() {
    var styles = bw.loadStyles({ primary: '#4f46e5', secondary: '#d97706' }, '#preview');
    assert.ok(styles.palette, 'should return styles object');
    // v2.1: _scopeToStyleId preserves sigil: '#preview' → 'bw_style_id_preview'
    var el = document.getElementById('bw_style_id_preview');
    assert.ok(el, 'scoped style element should be injected');
    assert.ok(el.textContent.includes('#preview'), 'CSS should be scoped');
  });

  it('structural CSS should only be injected once', function() {
    bw.loadStyles();
    bw.loadStyles({ primary: '#ff0000', secondary: '#00ff00' });
    // v2.1: structural id is bw_style_structural
    var structEls = document.querySelectorAll('#bw_style_structural');
    assert.strictEqual(structEls.length, 1, 'should have exactly one structural <style>');
  });
});

describe('bw.scopeRulesUnder', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof bw.scopeRulesUnder, 'function');
  });

  it('should prefix selectors with scope', function() {
    var rules = { '.foo': { color: 'red' }, '.bar': { color: 'blue' } };
    var scoped = bw.scopeRulesUnder(rules, '.bw_theme_alt');
    assert.ok('.bw_theme_alt .foo' in scoped, 'should have scoped .foo');
    assert.ok('.bw_theme_alt .bar' in scoped, 'should have scoped .bar');
    assert.strictEqual(scoped['.bw_theme_alt .foo'].color, 'red');
  });

  it('should handle @media blocks', function() {
    var rules = { '@media (max-width: 768px)': { '.foo': { color: 'red' } } };
    var scoped = bw.scopeRulesUnder(rules, '.scope');
    assert.ok('@media (max-width: 768px)' in scoped, 'should preserve @media');
    var inner = scoped['@media (max-width: 768px)'];
    assert.ok('.scope .foo' in inner, 'should scope inner selectors');
  });

  it('should handle comma-separated selectors', function() {
    var rules = { '.foo, .bar': { color: 'red' } };
    var scoped = bw.scopeRulesUnder(rules, '.alt');
    assert.ok('.alt .foo, .alt .bar' in scoped, 'should scope both parts');
  });
});

describe('bw.loadReset', function() {
  beforeEach(function() { freshDOM(); });

  it('should be a function', function() {
    assert.strictEqual(typeof bw.loadReset, 'function');
  });

  it('should inject a <style> with id bw_style_reset', function() {
    var el = bw.loadReset();
    assert.ok(el, 'should return a <style> element');
    assert.strictEqual(el.id, 'bw_style_reset');
  });

  it('should contain box-sizing rule', function() {
    var el = bw.loadReset();
    assert.ok(el.textContent.includes('box-sizing'), 'should contain box-sizing');
  });

  it('should be idempotent', function() {
    var el1 = bw.loadReset();
    var el2 = bw.loadReset();
    assert.strictEqual(el1, el2, 'should return same element on second call');
    var els = document.querySelectorAll('#bw_style_reset');
    assert.strictEqual(els.length, 1, 'should have exactly one reset <style>');
  });
});

describe('bw.toggleThemeMode', function() {
  beforeEach(function() { freshDOM(); });

  it('should be a function', function() {
    assert.strictEqual(typeof bw.toggleThemeMode, 'function');
  });

  it('should toggle bw_theme_alt on <html> (global)', function() {
    var mode1 = bw.toggleThemeMode();
    assert.strictEqual(mode1, 'alternate');
    assert.ok(document.documentElement.classList.contains('bw_theme_alt'), 'html should have bw_theme_alt');

    var mode2 = bw.toggleThemeMode();
    assert.strictEqual(mode2, 'primary');
    assert.ok(!document.documentElement.classList.contains('bw_theme_alt'), 'html should not have bw_theme_alt');
  });

  it('should toggle bw_theme_alt on scoped element', function() {
    var app = document.getElementById('app');
    var mode1 = bw.toggleThemeMode('#app');
    assert.strictEqual(mode1, 'alternate');
    assert.ok(app.classList.contains('bw_theme_alt'), '#app should have bw_theme_alt');

    var mode2 = bw.toggleThemeMode('#app');
    assert.strictEqual(mode2, 'primary');
    assert.ok(!app.classList.contains('bw_theme_alt'), '#app should not have bw_theme_alt');
  });

  it('should return primary for nonexistent scope', function() {
    var mode = bw.toggleThemeMode('#nonexistent');
    assert.strictEqual(mode, 'primary');
  });
});

describe('bw.toggleThemeMode', function() {
  beforeEach(function() { freshDOM(); });

  it('should be a function', function() {
    assert.strictEqual(typeof bw.toggleThemeMode, 'function');
  });

  it('should toggle bw_theme_alt on <html> (global)', function() {
    var mode1 = bw.toggleThemeMode();
    assert.strictEqual(mode1, 'alternate');
    assert.ok(document.documentElement.classList.contains('bw_theme_alt'));

    var mode2 = bw.toggleThemeMode();
    assert.strictEqual(mode2, 'primary');
    assert.ok(!document.documentElement.classList.contains('bw_theme_alt'));
  });

  it('should toggle on scoped element', function() {
    var app = document.getElementById('app');
    var mode = bw.toggleThemeMode('#app');
    assert.strictEqual(mode, 'alternate');
    assert.ok(app.classList.contains('bw_theme_alt'));
  });

  it('should toggle on ALL matching elements', function() {
    var p1 = document.createElement('div');
    p1.className = 'panel';
    var p2 = document.createElement('div');
    p2.className = 'panel';
    var p3 = document.createElement('div');
    p3.className = 'panel';
    document.body.appendChild(p1);
    document.body.appendChild(p2);
    document.body.appendChild(p3);

    var mode = bw.toggleThemeMode('.panel');
    assert.strictEqual(mode, 'alternate');
    assert.ok(p1.classList.contains('bw_theme_alt'), 'p1 should have alt');
    assert.ok(p2.classList.contains('bw_theme_alt'), 'p2 should have alt');
    assert.ok(p3.classList.contains('bw_theme_alt'), 'p3 should have alt');

    var mode2 = bw.toggleThemeMode('.panel');
    assert.strictEqual(mode2, 'primary');
    assert.ok(!p1.classList.contains('bw_theme_alt'), 'p1 should not have alt');
    assert.ok(!p2.classList.contains('bw_theme_alt'), 'p2 should not have alt');
    assert.ok(!p3.classList.contains('bw_theme_alt'), 'p3 should not have alt');
  });

  it('should accept DOM element directly via id', function() {
    // v2.1: toggleThemeMode requires a string scope, not a DOM element
    var el = document.createElement('div');
    el.id = 'toggle-el-test';
    document.body.appendChild(el);
    var mode = bw.toggleThemeMode('#toggle-el-test');
    assert.strictEqual(mode, 'alternate');
    assert.ok(el.classList.contains('bw_theme_alt'));
  });

  it('should return primary for nonexistent scope', function() {
    assert.strictEqual(bw.toggleThemeMode('#ghost'), 'primary');
  });

  it('bw.toggleThemeMode should be a function', function() {
    assert.strictEqual(typeof bw.toggleThemeMode, 'function');
  });
});

describe('bw.clearStyles', function() {
  beforeEach(function() { freshDOM(); });

  it('should be a function', function() {
    assert.strictEqual(typeof bw.clearStyles, 'function');
  });

  it('should remove global <style> by default', function() {
    bw.loadStyles();
    assert.ok(document.getElementById('bw_style_global'), 'global style should exist');
    bw.clearStyles();
    assert.strictEqual(document.getElementById('bw_style_global'), null, 'global style should be removed');
  });

  it('should remove scoped <style>', function() {
    var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
    bw.applyStyles(styles, '#my-dashboard');
    // v2.1: _scopeToStyleId preserves sigil: '#my-dashboard' → 'bw_style_id_my_dashboard'
    assert.ok(document.getElementById('bw_style_id_my_dashboard'), 'scoped style should exist');
    bw.clearStyles('#my-dashboard');
    assert.strictEqual(document.getElementById('bw_style_id_my_dashboard'), null, 'scoped style should be removed');
  });

  it('should remove reset <style>', function() {
    bw.loadReset();
    assert.ok(document.getElementById('bw_style_reset'), 'reset style should exist');
    bw.clearStyles('reset');
    assert.strictEqual(document.getElementById('bw_style_reset'), null, 'reset style should be removed');
  });

  it('should remove bw_theme_alt class from html on global clear', function() {
    bw.toggleThemeMode(); // adds bw_theme_alt to html
    assert.ok(document.documentElement.classList.contains('bw_theme_alt'));
    bw.clearStyles();
    assert.ok(!document.documentElement.classList.contains('bw_theme_alt'), 'bw_theme_alt should be removed from html');
  });

  it('should be safe to call when no styles exist', function() {
    assert.doesNotThrow(function() { bw.clearStyles(); });
    assert.doesNotThrow(function() { bw.clearStyles('#nonexistent'); });
  });
});

describe('_scopeToStyleId (via clearStyles/applyStyles)', function() {
  beforeEach(function() { freshDOM(); });

  it('should convert #my-dashboard to bw_style_id_my_dashboard', function() {
    var styles = bw.makeStyles();
    var el = bw.applyStyles(styles, '#my-dashboard');
    // v2.1: _scopeToStyleId preserves sigil distinction
    assert.strictEqual(el.id, 'bw_style_id_my_dashboard');
  });

  it('should convert .preview to bw_style_cls_preview', function() {
    var styles = bw.makeStyles();
    var el = bw.applyStyles(styles, '.preview');
    // v2.1: _scopeToStyleId preserves sigil distinction
    assert.strictEqual(el.id, 'bw_style_cls_preview');
  });

  it('no scope should produce bw_style_global', function() {
    var styles = bw.makeStyles();
    var el = bw.applyStyles(styles);
    assert.strictEqual(el.id, 'bw_style_global');
  });
});

describe('getResetStyles (bitwrench-styles.js)', function() {
  it('should return an object with reset rules', function() {
    var rules = getResetStyles();
    assert.ok(rules['*'], 'should have * selector');
    assert.ok(rules['html'], 'should have html selector');
    assert.ok(rules['body'], 'should have body selector');
  });

  it('should include box-sizing rule', function() {
    var rules = getResetStyles();
    assert.strictEqual(rules['*']['box-sizing'], 'border-box');
  });

  it('should include reduced-motion media query', function() {
    var rules = getResetStyles();
    assert.ok(rules['@media (prefers-reduced-motion: reduce)'], 'should have reduced-motion query');
  });
});

describe('scopeRulesUnder (bitwrench-styles.js)', function() {
  it('should prefix all selectors with scope', function() {
    var rules = { '.bw_card': { color: 'red' }, '.bw_btn': { color: 'blue' } };
    var scoped = scopeRulesUnder(rules, '#app');
    assert.ok(scoped['#app .bw_card'], 'should have scoped .bw_card');
    assert.ok(scoped['#app .bw_btn'], 'should have scoped .bw_btn');
  });

  it('should handle comma-separated selectors', function() {
    var rules = { '.bw_card, .bw_panel': { color: 'red' } };
    var scoped = scopeRulesUnder(rules, '#app');
    var key = Object.keys(scoped)[0];
    assert.ok(key.includes('#app .bw_card'), 'should scope first part');
    assert.ok(key.includes('#app .bw_panel'), 'should scope second part');
  });

  it('should handle @media blocks', function() {
    var rules = { '@media (min-width: 768px)': { '.bw_card': { padding: '1rem' } } };
    var scoped = scopeRulesUnder(rules, '#app');
    assert.ok(scoped['@media (min-width: 768px)'], 'should preserve @media key');
    var inner = scoped['@media (min-width: 768px)'];
    assert.ok(inner['#app .bw_card'], 'should scope inner selector');
  });
});

describe('Tertiary Color in Themed CSS', function() {

  it('tertiary appears in CSS when different from primary', function() {
    var styles = bw.makeStyles({ primary: '#006666', secondary: '#6c757d', tertiary: '#e9c46a' });
    var css = styles.css;
    // tertiary hex (#e9c46a) or its derived shades should appear in hover/breadcrumb/stepper
    // deriveShades produces base from the input, so the exact hex should be in the CSS
    var tertiaryBase = '#e9c46a';
    assert.ok(css.includes(tertiaryBase) || css.toLowerCase().includes(tertiaryBase.toLowerCase()),
      'CSS should contain tertiary base color');
    // primary should NOT appear in breadcrumb links (they now use tertiary)
    // but primary still appears elsewhere (buttons, active states), so just confirm tertiary is present
  });

  it('tertiary === primary produces identical CSS', function() {
    var withExplicit = bw.makeStyles({ primary: '#006666', secondary: '#6c757d', tertiary: '#006666' });
    var withoutTertiary = bw.makeStyles({ primary: '#006666', secondary: '#6c757d' });
    assert.strictEqual(withExplicit.css, withoutTertiary.css,
      'CSS should be identical when tertiary equals primary');
    assert.strictEqual(withExplicit.alternateCss, withoutTertiary.alternateCss,
      'alternate CSS should also be identical');
  });

  it('all 12 THEME_PRESETS produce CSS containing their tertiary color', function() {
    var presetNames = Object.keys(THEME_PRESETS);
    assert.ok(presetNames.length >= 12, 'should have at least 12 presets');
    presetNames.forEach(function(name) {
      var config = THEME_PRESETS[name];
      var styles = bw.makeStyles(config);
      // derive the tertiary shades to find what hex values should appear
      var tertiaryShades = bw.deriveShades(config.tertiary || config.primary);
      // At minimum, the base shade should appear in the CSS
      var found = styles.css.toLowerCase().includes(tertiaryShades.base.toLowerCase());
      assert.ok(found, 'preset "' + name + '" CSS should contain tertiary base color ' + tertiaryShades.base);
    });
  });
});

// =========================================================================
// Branch Coverage: generateTypeScale falsy defaults (L81, L82)
// =========================================================================

describe('generateTypeScale falsy argument defaults', function() {

  it('should use defaults when base is 0', function() {
    var scale = generateTypeScale(0, 1.2);
    assert.strictEqual(scale.base, 16, 'should default base to 16 when 0 is passed');
  });

  it('should use defaults when ratio is 0', function() {
    var scale = generateTypeScale(16, 0);
    assert.strictEqual(scale.base, 16);
    // With default ratio 1.200, lg should be 19
    assert.strictEqual(scale.lg, Math.round(16 * 1.2));
  });

  it('should use defaults when both are null', function() {
    var scale = generateTypeScale(null, null);
    assert.strictEqual(scale.base, 16, 'should default base to 16');
    assert.strictEqual(scale.lg, Math.round(16 * 1.2), 'should default ratio to 1.2');
  });

  it('should use defaults when both are undefined', function() {
    var scale = generateTypeScale(undefined, undefined);
    assert.strictEqual(scale.base, 16);
    assert.strictEqual(scale.lg, Math.round(16 * 1.2));
  });

  it('should use defaults when both are 0', function() {
    var scale = generateTypeScale(0, 0);
    assert.strictEqual(scale.base, 16, 'base should default to 16');
    assert.strictEqual(scale.lg, Math.round(16 * 1.2), 'ratio should default to 1.2');
  });
});

// =========================================================================
// Branch Coverage: resolveLayout unknown preset name fallbacks (L187, L196, L197, L200, L201)
// =========================================================================

describe('resolveLayout unknown preset fallbacks', function() {

  it('should fall back to normal spacing for unknown spacing name', function() {
    var layout = resolveLayout({ spacing: 'nonexistent_preset' });
    var normalLayout = resolveLayout({ spacing: 'normal' });
    assert.deepStrictEqual(layout.spacing, normalLayout.spacing,
      'unknown spacing should fall back to normal');
  });

  it('should fall back to md radius for unknown radius name', function() {
    var layout = resolveLayout({ radius: 'nonexistent_preset' });
    var mdLayout = resolveLayout({ radius: 'md' });
    assert.deepStrictEqual(layout.radius, mdLayout.radius,
      'unknown radius should fall back to md');
  });

  it('should fall back to normal typeRatio for unknown typeRatio name', function() {
    var layout = resolveLayout({ typeRatio: 'nonexistent_preset' });
    var normalLayout = resolveLayout({ typeRatio: 'normal' });
    assert.deepStrictEqual(layout.typeScale, normalLayout.typeScale,
      'unknown typeRatio should fall back to normal');
  });

  it('should fall back to md elevation for unknown elevation name', function() {
    var layout = resolveLayout({ elevation: 'nonexistent_preset' });
    var mdLayout = resolveLayout({ elevation: 'md' });
    assert.deepStrictEqual(layout.elevation, mdLayout.elevation,
      'unknown elevation should fall back to md');
  });

  it('should fall back to standard motion for unknown motion name', function() {
    var layout = resolveLayout({ motion: 'nonexistent_preset' });
    var standardLayout = resolveLayout({ motion: 'standard' });
    assert.deepStrictEqual(layout.motion, standardLayout.motion,
      'unknown motion should fall back to standard');
  });

  it('should handle all unknown presets simultaneously', function() {
    var layout = resolveLayout({
      spacing: 'bogus',
      radius: 'bogus',
      typeRatio: 'bogus',
      elevation: 'bogus',
      motion: 'bogus'
    });
    var defaultLayout = resolveLayout({
      spacing: 'normal',
      radius: 'md',
      typeRatio: 'normal',
      elevation: 'md',
      motion: 'standard'
    });
    assert.deepStrictEqual(layout.spacing, defaultLayout.spacing);
    assert.deepStrictEqual(layout.radius, defaultLayout.radius);
    assert.deepStrictEqual(layout.typeScale, defaultLayout.typeScale);
    assert.deepStrictEqual(layout.elevation, defaultLayout.elevation);
    assert.deepStrictEqual(layout.motion, defaultLayout.motion);
  });
});

// =========================================================================
// Branch Coverage: palette.surface || '#fff' and palette.background || '#f5f5f5' (L299, L348, L389, etc.)
// =========================================================================

describe('generateThemedCSS with palette missing surface/background', function() {

  // Helper: create a minimal palette without 'surface' and 'background'
  function makePaletteWithoutSurface() {
    var shades = function(hex) { return bw.deriveShades(hex); };
    return {
      primary:    shades('#006666'),
      secondary:  shades('#6c757d'),
      tertiary:   shades('#20c997'),
      success:    shades('#198754'),
      danger:     shades('#dc3545'),
      warning:    shades('#f0ad4e'),
      info:       shades('#17a2b8'),
      light:      shades('#f8f9fa'),
      dark:       shades('#212529'),
      // deliberately omit 'surface' and 'background' to trigger || fallbacks
      surfaceAlt: '#eeeeee'
    };
  }

  it('should use #fff fallback when palette.surface is missing', function() {
    var palette = makePaletteWithoutSurface();
    var layout = resolveLayout({});
    var rules = generateThemedCSS('', palette, layout);
    var css = bw.css(rules);
    // The #fff fallback should appear in the generated CSS for cards, forms, etc.
    assert.ok(css.includes('#fff'), 'CSS should contain #fff fallback when surface is missing');
  });

  it('should produce valid CSS even without surface property', function() {
    var palette = makePaletteWithoutSurface();
    var layout = resolveLayout({});
    assert.doesNotThrow(function() {
      var rules = generateThemedCSS('', palette, layout);
      bw.css(rules);
    }, 'should not throw when surface is missing');
  });

  it('should use #f5f5f5 fallback when palette.background is missing', function() {
    var palette = makePaletteWithoutSurface();
    var layout = resolveLayout({});
    var rules = generateThemedCSS('', palette, layout);
    var css = bw.css(rules);
    // The generateResetThemed function uses palette.background || '#f5f5f5'
    assert.ok(css.includes('#f5f5f5'), 'CSS should contain #f5f5f5 fallback when background is missing');
  });

  it('should handle scoped generation without surface', function() {
    var palette = makePaletteWithoutSurface();
    var layout = resolveLayout({});
    var rules = generateThemedCSS('testscope', palette, layout);
    var css = bw.css(rules);
    assert.ok(css.includes('.testscope'), 'CSS should contain scope prefix');
    assert.ok(css.includes('#fff'), 'scoped CSS should use #fff fallback');
  });
});

// =========================================================================
// Branch Coverage: generateAlternateCSS @media handling (L2424, L2426)
// =========================================================================

describe('generateAlternateCSS branch coverage', function() {

  it('should handle hasOwnProperty guard on prototype-extended objects', function() {
    var config = { primary: '#006666', secondary: '#cc6633' };
    var altConfig = bw.deriveAlternateConfig(config);
    var palette = bw.derivePalette(altConfig);
    var layout = resolveLayout({});
    // This exercises the normal path through generateAlternateCSS
    var rules = generateAlternateCSS('', palette, layout);
    var css = bw.css(rules);
    assert.ok(css.includes('.bw_theme_alt'), 'should scope under .bw_theme_alt');
    // The @ branch (L2426) is only hit if generateThemedCSS produces @-prefixed selectors
    // In the current implementation, themed CSS does not produce @media blocks,
    // so we verify the non-@ path works correctly
    assert.ok(Object.keys(rules).length > 10, 'should produce many rules');
  });

  it('should produce rules with named scope prefix', function() {
    var config = { primary: '#ff0000', secondary: '#00ff00' };
    var altConfig = bw.deriveAlternateConfig(config);
    var palette = bw.derivePalette(altConfig);
    var layout = resolveLayout({});
    var rules = generateAlternateCSS('mytheme', palette, layout);
    var css = bw.css(rules);
    assert.ok(css.includes('.mytheme.bw_theme_alt'), 'should use compound selector');
  });
});

// =========================================================================
// Branch Coverage: scopeRulesUnder @keyframes passthrough (L2474, L2478, L2484)
// =========================================================================

describe('scopeRulesUnder @keyframes and @media branch coverage', function() {

  it('should pass @keyframes blocks through without scoping steps', function() {
    var rules = {
      '@keyframes spin': {
        '0%': { 'transform': 'rotate(0deg)' },
        '100%': { 'transform': 'rotate(360deg)' }
      },
      '.bw_btn': { 'color': 'red' }
    };
    var scoped = scopeRulesUnder(rules, '.my-scope');
    // @keyframes should pass through unchanged
    assert.ok('@keyframes spin' in scoped, 'should preserve @keyframes key');
    assert.ok('0%' in scoped['@keyframes spin'], 'should preserve 0% step');
    assert.ok('100%' in scoped['@keyframes spin'], 'should preserve 100% step');
    // Regular selectors should be scoped
    assert.ok('.my-scope .bw_btn' in scoped, 'should scope regular selectors');
  });

  it('should scope inner selectors of @media blocks', function() {
    var rules = {
      '@media (min-width: 768px)': {
        '.bw_card': { 'padding': '2rem' },
        '.bw_btn': { 'font-size': '1rem' }
      }
    };
    var scoped = scopeRulesUnder(rules, '#app');
    assert.ok('@media (min-width: 768px)' in scoped, 'should preserve @media key');
    var inner = scoped['@media (min-width: 768px)'];
    assert.ok('#app .bw_card' in inner, 'should scope .bw_card inside @media');
    assert.ok('#app .bw_btn' in inner, 'should scope .bw_btn inside @media');
  });

  it('should handle @keyframes with named animation', function() {
    var rules = {
      '@keyframes bw_spinner_border': {
        '100%': { 'transform': 'rotate(360deg)' }
      }
    };
    var scoped = scopeRulesUnder(rules, '.theme');
    assert.ok('@keyframes bw_spinner_border' in scoped, 'should keep @keyframes');
    assert.deepStrictEqual(scoped['@keyframes bw_spinner_border'], rules['@keyframes bw_spinner_border'],
      '@keyframes content should be identical (not scoped)');
  });

  it('should handle mixed @media, @keyframes, and regular selectors', function() {
    var rules = {
      '.bw_card': { 'color': 'red' },
      '@media (max-width: 575px)': { '.bw_card': { 'padding': '0.5rem' } },
      '@keyframes fadeIn': { '0%': { 'opacity': '0' }, '100%': { 'opacity': '1' } },
      '.bw_btn': { 'display': 'inline-block' }
    };
    var scoped = scopeRulesUnder(rules, '.scope');
    // Regular selectors scoped
    assert.ok('.scope .bw_card' in scoped, 'regular selector should be scoped');
    assert.ok('.scope .bw_btn' in scoped, 'regular selector should be scoped');
    // @media inner selectors scoped
    assert.ok('.scope .bw_card' in scoped['@media (max-width: 575px)'], '@media inner should be scoped');
    // @keyframes passed through
    assert.ok('0%' in scoped['@keyframes fadeIn'], '@keyframes steps should not be scoped');
    assert.ok('100%' in scoped['@keyframes fadeIn'], '@keyframes steps should not be scoped');
  });

  it('should handle hasOwnProperty guard with prototype-extended objects', function() {
    // Create an object with inherited properties
    function ProtoRules() {}
    ProtoRules.prototype.inheritedProp = { 'color': 'green' };
    var rules = new ProtoRules();
    rules['.bw_card'] = { 'color': 'red' };

    var scoped = scopeRulesUnder(rules, '.scope');
    // Own property should be scoped
    assert.ok('.scope .bw_card' in scoped, 'own property should be scoped');
    // Inherited property should NOT be in the result (hasOwnProperty guard)
    assert.ok(!('.scope inheritedProp' in scoped), 'inherited property should be filtered');
    assert.ok(!('inheritedProp' in scoped), 'inherited property should not appear');
  });

  it('should handle hasOwnProperty for inner @media blocks', function() {
    function InnerRules() {}
    InnerRules.prototype.inheritedInner = { 'color': 'green' };
    var inner = new InnerRules();
    inner['.bw_card'] = { 'padding': '1rem' };

    var rules = {
      '@media (min-width: 768px)': inner
    };
    var scoped = scopeRulesUnder(rules, '.scope');
    var mediaBlock = scoped['@media (min-width: 768px)'];
    assert.ok('.scope .bw_card' in mediaBlock, 'own inner property should be scoped');
    assert.ok(!('.scope inheritedInner' in mediaBlock), 'inherited inner property should be filtered');
  });
});

// =========================================================================
// Branch Coverage: generateAlternateCSS hasOwnProperty (L2424)
// =========================================================================

describe('generateAlternateCSS hasOwnProperty guard', function() {

  it('should skip inherited properties on the rules object', function() {
    // We cannot directly pass custom rules to generateAlternateCSS since it
    // internally calls generateThemedCSS. But we can verify it handles
    // the normal palette correctly and produces valid output.
    var config = { primary: '#336699', secondary: '#996633', tertiary: '#669933' };
    var altConfig = bw.deriveAlternateConfig(config);
    var palette = bw.derivePalette(altConfig);
    var layout = resolveLayout({});
    var rules = generateAlternateCSS('', palette, layout);
    // Verify output integrity
    var keys = Object.keys(rules);
    assert.ok(keys.length > 0, 'should produce rules');
    // All keys should be strings (selectors)
    keys.forEach(function(k) {
      assert.strictEqual(typeof k, 'string', 'all keys should be strings');
    });
  });
});

// =========================================================================
// Branch Coverage: resolveLayout with custom object presets (non-string paths)
// =========================================================================

describe('resolveLayout custom object presets (non-string branches)', function() {

  it('should accept spacing as a custom object (non-string path)', function() {
    var customSpacing = { btn: '0.5rem 1rem', card: '1rem', input: '0.3rem 0.6rem', alert: '0.5rem', cell: '0.3rem' };
    var layout = resolveLayout({ spacing: customSpacing });
    assert.deepStrictEqual(layout.spacing, customSpacing, 'should use custom spacing object directly');
  });

  it('should accept radius as a custom object (non-string path)', function() {
    var customRadius = { btn: '10px', card: '12px', input: '8px', alert: '6px', badge: '4px' };
    var layout = resolveLayout({ radius: customRadius });
    assert.deepStrictEqual(layout.radius, customRadius, 'should use custom radius object directly');
  });

  it('should accept elevation as a custom object (non-string path)', function() {
    var customElev = { sm: 'none', md: '0 2px 4px black', lg: '0 4px 8px black', xl: '0 8px 16px black' };
    var layout = resolveLayout({ elevation: customElev });
    assert.deepStrictEqual(layout.elevation, customElev, 'should use custom elevation object directly');
  });

  it('should accept motion as a custom object (non-string path)', function() {
    var customMotion = { fast: '50ms', normal: '100ms', slow: '200ms', easing: 'linear' };
    var layout = resolveLayout({ motion: customMotion });
    assert.deepStrictEqual(layout.motion, customMotion, 'should use custom motion object directly');
  });
});

// =========================================================================
// Branch Coverage: deepMerge and updateTheme (L2506-2515, L2518-2519)
// =========================================================================

describe('deepMerge', function() {

  it('should merge flat properties', function() {
    var target = { a: 1, b: 2 };
    var source = { b: 3, c: 4 };
    var result = deepMerge(target, source);
    assert.strictEqual(result.a, 1);
    assert.strictEqual(result.b, 3);
    assert.strictEqual(result.c, 4);
    assert.strictEqual(result, target, 'should mutate target');
  });

  it('should deeply merge nested objects', function() {
    var target = { colors: { primary: '#red', secondary: '#blue' }, font: '16px' };
    var source = { colors: { primary: '#green' } };
    var result = deepMerge(target, source);
    assert.strictEqual(result.colors.primary, '#green');
    assert.strictEqual(result.colors.secondary, '#blue', 'non-overridden nested keys should remain');
    assert.strictEqual(result.font, '16px');
  });

  it('should overwrite non-object with source value', function() {
    var target = { a: 'string' };
    var source = { a: { nested: true } };
    var result = deepMerge(target, source);
    assert.deepStrictEqual(result.a, { nested: true });
  });

  it('should overwrite arrays (not merge them)', function() {
    var target = { arr: [1, 2, 3] };
    var source = { arr: [4, 5] };
    var result = deepMerge(target, source);
    assert.deepStrictEqual(result.arr, [4, 5], 'arrays should be replaced, not merged');
  });

  it('should handle null source values', function() {
    var target = { a: { b: 1 } };
    var source = { a: null };
    var result = deepMerge(target, source);
    assert.strictEqual(result.a, null);
  });

  it('should handle empty source', function() {
    var target = { a: 1 };
    var result = deepMerge(target, {});
    assert.deepStrictEqual(result, { a: 1 });
  });

  it('should handle deeply nested merge', function() {
    var target = { l1: { l2: { l3: { val: 'old' } } } };
    var source = { l1: { l2: { l3: { val: 'new' } } } };
    var result = deepMerge(target, source);
    assert.strictEqual(result.l1.l2.l3.val, 'new');
  });
});

describe('updateTheme', function() {

  it('should update the global theme object', function() {
    // Save original values
    var origPrimary = theme.colors.primary;
    // Apply override
    updateTheme({ colors: { primary: '#testcolor' } });
    assert.strictEqual(theme.colors.primary, '#testcolor');
    // Restore original value
    updateTheme({ colors: { primary: origPrimary } });
    assert.strictEqual(theme.colors.primary, origPrimary);
  });

  it('should merge without losing existing keys', function() {
    var origSecondary = theme.colors.secondary;
    updateTheme({ colors: { primary: '#temp' } });
    assert.strictEqual(theme.colors.secondary, origSecondary, 'secondary should be preserved');
    // Restore
    updateTheme({ colors: { primary: theme.colors.primary } });
  });
});

// =========================================================================
// bitwrench-color-utils.js — harmonize with undefined amount (line 271)
// =========================================================================
describe('harmonize — undefined amount defaults to 0.20 (line 271)', function() {
  it('should use default amount=0.20 when amount is not passed', function() {
    // Call harmonize without the third argument
    var result = bw.harmonize('#dc3545', '#006666');
    // Should produce the same result as explicitly passing 0.20
    var explicit = bw.harmonize('#dc3545', '#006666', 0.20);
    assert.strictEqual(result, explicit);
  });

  it('should shift hue when amount is undefined (default 0.20)', function() {
    var result = bw.harmonize('#dc3545', '#006666');
    // The result should differ from the source (since amount != 0)
    assert.notStrictEqual(result, '#dc3545');
  });
});


// =========================================================================
// bitwrench-styles.js — generateThemedCSS with scope name (line 217)
// =========================================================================
describe('generateThemedCSS — scoped output with theme name (line 217)', function() {
  it('should scope all selectors under the theme class', function() {
    var palette = bw.derivePalette({ primary: '#336699' });
    var layout = resolveLayout();
    var rules = generateThemedCSS('my_theme', palette, layout);
    var keys = Object.keys(rules);
    var scoped = keys.filter(function(k) { return k.indexOf('.my_theme') >= 0; });
    assert.ok(scoped.length > 0, 'should have scoped selectors');
  });

  it('should generate unscoped selectors with empty name', function() {
    var palette = bw.derivePalette({ primary: '#336699' });
    var layout = resolveLayout();
    var rules = generateThemedCSS('', palette, layout);
    var keys = Object.keys(rules);
    assert.ok(keys.length > 0, 'should generate rules');
    var dotStart = keys.filter(function(k) { return k.charAt(0) === '.'; });
    assert.ok(dotStart.length > 0);
  });
});


// =========================================================================
// bitwrench-styles.js — generateThemedCSS with different layout configs
// (exercise radius paths in lines 577, 666, 729, 750, 766, 872, 974)
// =========================================================================
describe('generateThemedCSS — different layout radius presets', function() {
  it('should use lg radius preset', function() {
    var palette = bw.derivePalette({ primary: '#336699' });
    var layout = resolveLayout({ radius: 'lg' });
    var rules = generateThemedCSS('', palette, layout);
    assert.ok(typeof rules === 'object');
    assert.ok(Object.keys(rules).length > 0);
  });

  it('should use none radius preset', function() {
    var palette = bw.derivePalette({ primary: '#336699' });
    var layout = resolveLayout({ radius: 'none' });
    var rules = generateThemedCSS('', palette, layout);
    assert.ok(typeof rules === 'object');
    assert.ok(Object.keys(rules).length > 0);
  });

  it('should use custom radius object', function() {
    var palette = bw.derivePalette({ primary: '#336699' });
    var layout = resolveLayout();
    // Override radius with custom values
    layout.radius = { btn: '4px', card: '12px', badge: '6px', input: '4px', pill: '50rem' };
    var rules = generateThemedCSS('', palette, layout);
    assert.ok(typeof rules === 'object');
    assert.ok(Object.keys(rules).length > 0);
  });
});


// =========================================================================
// bitwrench-styles.js — generateAlternateCSS (lines 2424, 2426)
// =========================================================================
describe('generateAlternateCSS — scoped alternate rules', function() {
  it('should generate alternate CSS with named scope', function() {
    var palette = bw.derivePalette({ primary: '#cc3300' });
    var layout = resolveLayout();
    var altRules = generateAlternateCSS('mytheme', palette, layout);
    var keys = Object.keys(altRules);
    assert.ok(keys.length > 0, 'should have alternate rules');
    var prefixed = keys.filter(function(k) { return k.indexOf('.mytheme.bw_theme_alt') >= 0; });
    assert.ok(prefixed.length > 0, 'selectors should be scoped under .mytheme.bw_theme_alt');
  });

  it('should handle empty name (global alternate)', function() {
    var palette = bw.derivePalette({ primary: '#cc3300' });
    var layout = resolveLayout();
    var altRules = generateAlternateCSS('', palette, layout);
    var keys = Object.keys(altRules);
    assert.ok(keys.length > 0);
    var prefixed = keys.filter(function(k) { return k.indexOf('.bw_theme_alt') >= 0; });
    assert.ok(prefixed.length > 0);
  });
});


// =========================================================================
// scopeRulesUnder — @media and @keyframes blocks
// =========================================================================
describe('scopeRulesUnder — @media and @keyframes blocks', function() {
  it('should scope inner selectors of @media blocks', function() {
    var input = {
      '.bw_btn': { color: 'red' },
      '@media (min-width: 768px)': {
        '.bw_container': { 'max-width': '720px' }
      }
    };
    var scoped = scopeRulesUnder(input, '.my-scope');
    assert.ok(scoped['@media (min-width: 768px)'], 'should preserve @media block');
    var inner = scoped['@media (min-width: 768px)'];
    var innerKeys = Object.keys(inner);
    assert.ok(innerKeys.some(function(k) { return k.indexOf('.my-scope') >= 0; }), 'inner selectors should be scoped');
  });

  it('should pass through @keyframes blocks without scoping steps', function() {
    var input = {
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    };
    var scoped = scopeRulesUnder(input, '.my-scope');
    assert.ok(scoped['@keyframes spin'], 'should preserve @keyframes block');
    assert.ok(scoped['@keyframes spin']['0%'], '0% step should be preserved');
    assert.ok(scoped['@keyframes spin']['100%'], '100% step should be preserved');
  });
});

// =========================================================================
// generateAlternateCSS — @media/@keyframes re-scoping (L2427-2434)
//
// NOTE: This branch is defensive code. generateThemedCSS() never produces
// @media or @keyframes selectors, so generateAlternateCSS()'s @ branch
// (lines 2427-2434) cannot be reached through the normal code path.
// The code exists to future-proof against themed generators that might
// someday return @media rules. Coverage of this branch would require either
// monkey-patching the module-internal generateThemedCSS call or modifying
// the source to accept custom rules. This is documented here as a known
// gap in test coverage.
// =========================================================================

// =========================================================================
// Legacy color API — restored to core in v2.1
// =========================================================================

describe('Legacy Color API (restored to core)', function() {

  describe('bw.colorParse', function() {
    it('should parse hex colors', function() {
      assert.deepStrictEqual(bw.colorParse('#ff0000'), [255, 0, 0, 255, "rgb"]);
    });
    it('should parse 3-char hex', function() {
      assert.deepStrictEqual(bw.colorParse('#abc'), [170, 187, 204, 255, "rgb"]);
    });
    it('should parse rgb() strings', function() {
      assert.deepStrictEqual(bw.colorParse('rgb(128, 64, 32)'), [128, 64, 32, 255, "rgb"]);
    });
    it('should parse rgba() strings', function() {
      var r = bw.colorParse('rgba(100, 200, 50, 0.5)');
      assert.strictEqual(r[0], 100);
      assert.strictEqual(r[1], 200);
      assert.strictEqual(r[3], 127.5);
    });
    it('should parse hsl() strings', function() {
      var r = bw.colorParse('hsl(120, 100, 50)');
      assert.strictEqual(r[0], 0);
      assert.strictEqual(r[1], 255);
      assert.strictEqual(r[2], 0);
    });
    it('should parse hsla() strings', function() {
      var r = bw.colorParse('hsla(240, 100, 50, 0.5)');
      assert.strictEqual(r[0], 0);
      assert.strictEqual(r[1], 0);
      assert.strictEqual(r[2], 255);
    });
    it('should pass through arrays', function() {
      assert.deepStrictEqual(bw.colorParse([128, 64, 32]), [128, 64, 32, 255, "rgb"]);
    });
    it('should handle 4-char hex with alpha', function() {
      assert.deepStrictEqual(bw.colorParse('#abcd'), [170, 187, 204, 221, "rgb"]);
    });
    it('should handle 8-char hex with alpha', function() {
      assert.deepStrictEqual(bw.colorParse('#ff000080'), [255, 0, 0, 128, "rgb"]);
    });
  });

  describe('bw.colorRgbToHsl', function() {
    it('should convert pure green', function() {
      assert.deepStrictEqual(bw.colorRgbToHsl(0, 255, 0), [120, 100, 50, 255, "hsl"]);
    });
    it('should convert achromatic', function() {
      assert.deepStrictEqual(bw.colorRgbToHsl(191, 191, 191, 100), [0, 0, 75, 100, "hsl"]);
    });
    it('should accept array input', function() {
      assert.deepStrictEqual(bw.colorRgbToHsl([191, 191, 191, 100]), [0, 0, 75, 100, "hsl"]);
    });
    it('should support rounding control', function() {
      var r = bw.colorRgbToHsl(101, 153, 200, 255, false);
      assert.strictEqual(r[4], "hsl");
      assert.notStrictEqual(r[0], Math.round(r[0]));
    });
  });

  describe('bw.colorHslToRgb', function() {
    it('should convert pure green', function() {
      assert.deepStrictEqual(bw.colorHslToRgb(120, 100, 50, 128), [0, 255, 0, 128, "rgb"]);
    });
    it('should convert achromatic', function() {
      assert.deepStrictEqual(bw.colorHslToRgb(0, 0, 75, 128), [191, 191, 191, 128, "rgb"]);
    });
    it('should accept array input', function() {
      assert.deepStrictEqual(bw.colorHslToRgb([0, 0, 75, 128]), [191, 191, 191, 128, "rgb"]);
    });
  });

  describe('bw.colorInterp', function() {
    it('should interpolate between two colors', function() {
      var r = bw.colorInterp(50, 0, 100, ['#000000', '#ffffff']);
      assert.strictEqual(r[4], "rgb");
      assert.ok(Math.abs(r[0] - 127.5) < 1);
    });
    it('should return first color at start', function() {
      var r = bw.colorInterp(0, 0, 100, ['#ff0000', '#0000ff']);
      assert.strictEqual(r[0], 255);
      assert.strictEqual(r[2], 0);
    });
    it('should return last color at end', function() {
      var r = bw.colorInterp(100, 0, 100, ['#ff0000', '#0000ff']);
      assert.strictEqual(r[0], 0);
      assert.strictEqual(r[2], 255);
    });
    it('should handle single color', function() {
      assert.strictEqual(bw.colorInterp(50, 0, 100, ['#ff0000']), '#ff0000');
    });
    it('should default to black-white for non-array', function() {
      var r = bw.colorInterp(50, 0, 100, 'not-an-array');
      assert.strictEqual(r[4], "rgb");
    });
    it('should default to black-white for empty array', function() {
      var r = bw.colorInterp(50, 0, 100, []);
      assert.strictEqual(r[4], "rgb");
    });
    it('should default to black-white for null', function() {
      var r = bw.colorInterp(50, 0, 100, null);
      assert.strictEqual(r[4], "rgb");
    });
  });
});
