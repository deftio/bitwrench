/**
 * Tests for bitwrench-util-color.js
 *
 * Covers colorParse, colorRgbToHsl, colorHslToRgb, colorInterp,
 * and the install() function.
 */

import assert from "assert";
import { colorParse, colorRgbToHsl, colorHslToRgb, colorInterp, install } from "../src/bitwrench-util-color.js";

describe('colorParse', function() {
  it('should parse 3-char hex', function() {
    var result = colorParse('#abc');
    assert.deepEqual(result, [170, 187, 204, 255, "rgb"]);
  });

  it('should parse 6-char hex', function() {
    var result = colorParse('#AABBCC');
    assert.deepEqual(result, [170, 187, 204, 255, "rgb"]);
  });

  it('should parse 4-char hex with alpha', function() {
    var result = colorParse('#abcd');
    assert.deepEqual(result, [170, 187, 204, 221, "rgb"]);
  });

  it('should parse 8-char hex with alpha', function() {
    var result = colorParse('#ff000080');
    assert.deepEqual(result, [255, 0, 0, 128, "rgb"]);
  });

  it('should parse rgb() string', function() {
    var result = colorParse('rgb(128, 64, 32)');
    assert.deepEqual(result, [128, 64, 32, 255, "rgb"]);
  });

  it('should parse rgba() string', function() {
    var result = colorParse('rgba(100, 200, 50, 0.5)');
    assert.equal(result[0], 100);
    assert.equal(result[1], 200);
    assert.equal(result[2], 50);
    assert.equal(result[3], 127.5);
    assert.equal(result[4], "rgb");
  });

  it('should parse hsl() string', function() {
    var result = colorParse('hsl(120, 100, 50)');
    assert.equal(result[0], 0);
    assert.equal(result[1], 255);
    assert.equal(result[2], 0);
    assert.equal(result[4], "rgb");
  });

  it('should parse hsla() string with alpha', function() {
    var result = colorParse('hsla(240, 100, 50, 0.5)');
    assert.equal(result[0], 0);
    assert.equal(result[1], 0);
    assert.equal(result[2], 255);
    assert.equal(result[4], "rgb");
  });

  it('should pass through arrays', function() {
    var result = colorParse([128, 64, 32]);
    assert.deepEqual(result, [128, 64, 32, 255, "rgb"]);
  });

  it('should pass through array with alpha', function() {
    var result = colorParse([128, 64, 32, 128]);
    assert.deepEqual(result, [128, 64, 32, 128, "rgb"]);
  });

  it('should pass through array with mode', function() {
    var result = colorParse([128, 64, 32, 255, "rgb"]);
    assert.deepEqual(result, [128, 64, 32, 255, "rgb"]);
  });

  it('should handle hsl with zero values', function() {
    var result = colorParse('hsl(0, 0, 0)');
    assert.equal(result[0], 0);
    assert.equal(result[1], 0);
    assert.equal(result[2], 0);
  });

  it('should use default alpha', function() {
    var result = colorParse('#ff0000');
    assert.equal(result[3], 255);
  });
});

describe('colorRgbToHsl', function() {
  it('should convert pure green', function() {
    var result = colorRgbToHsl(0, 255, 0);
    assert.deepEqual(result, [120, 100, 50, 255, "hsl"]);
  });

  it('should convert silver', function() {
    var result = colorRgbToHsl(191, 191, 191, 100);
    assert.deepEqual(result, [0, 0, 75, 100, "hsl"]);
  });

  it('should accept array input', function() {
    var result = colorRgbToHsl([191, 191, 191, 100]);
    assert.deepEqual(result, [0, 0, 75, 100, "hsl"]);
  });

  it('should handle array with alpha', function() {
    var result = colorRgbToHsl([0, 255, 0, 128]);
    assert.deepEqual(result, [120, 100, 50, 128, "hsl"]);
  });

  it('should support rounding control', function() {
    var result = colorRgbToHsl(101, 153, 200, 255, false);
    assert.equal(result[4], "hsl");
    assert.notEqual(result[0], Math.round(result[0]));
  });
});

describe('colorHslToRgb', function() {
  it('should convert pure green', function() {
    var result = colorHslToRgb(120, 100, 50, 128);
    assert.deepEqual(result, [0, 255, 0, 128, "rgb"]);
  });

  it('should convert silver', function() {
    var result = colorHslToRgb(0, 0, 75, 128);
    assert.deepEqual(result, [191, 191, 191, 128, "rgb"]);
  });

  it('should accept array input', function() {
    var result = colorHslToRgb([0, 0, 75, 128]);
    assert.deepEqual(result, [191, 191, 191, 128, "rgb"]);
  });

  it('should handle array with alpha', function() {
    var result = colorHslToRgb([120, 100, 50, 64]);
    assert.deepEqual(result, [0, 255, 0, 64, "rgb"]);
  });
});

describe('colorInterp', function() {
  it('should interpolate between two hex colors', function() {
    var result = colorInterp(50, 0, 100, ['#000000', '#ffffff']);
    assert.equal(result[4], "rgb");
    assert.ok(Math.abs(result[0] - 127.5) < 1);
    assert.ok(Math.abs(result[1] - 127.5) < 1);
    assert.ok(Math.abs(result[2] - 127.5) < 1);
  });

  it('should return first color at start of range', function() {
    var result = colorInterp(0, 0, 100, ['#ff0000', '#0000ff']);
    assert.equal(result[0], 255);
    assert.equal(result[2], 0);
  });

  it('should return last color at end of range', function() {
    var result = colorInterp(100, 0, 100, ['#ff0000', '#0000ff']);
    assert.equal(result[0], 0);
    assert.equal(result[2], 255);
  });

  it('should handle single color', function() {
    var result = colorInterp(50, 0, 100, ['#ff0000']);
    assert.equal(result, '#ff0000');
  });

  it('should default to black-white for non-array', function() {
    var result = colorInterp(50, 0, 100, 'not-an-array');
    assert.equal(result[4], "rgb");
  });

  it('should default to black-white for empty array', function() {
    var result = colorInterp(50, 0, 100, []);
    assert.equal(result[4], "rgb");
  });

  it('should default to black-white for null', function() {
    var result = colorInterp(50, 0, 100, null);
    assert.equal(result[4], "rgb");
  });
});

describe('install()', function() {
  it('should attach functions to bw object', function() {
    var fakeBw = {};
    install(fakeBw);
    assert.equal(typeof fakeBw.colorParse, 'function');
    assert.equal(typeof fakeBw.colorRgbToHsl, 'function');
    assert.equal(typeof fakeBw.colorHslToRgb, 'function');
    assert.equal(typeof fakeBw.colorInterp, 'function');
  });

  it('should handle null bw gracefully', function() {
    install(null);
    install(undefined);
  });

  it('installed colorParse should work', function() {
    var fakeBw = {};
    install(fakeBw);
    var result = fakeBw.colorParse('#ff0000');
    assert.deepEqual(result, [255, 0, 0, 255, "rgb"]);
  });
});

// =========================================================================
// Array-form input
//
// Both converters accept their channels either positionally or as one array,
// so the array form has to honour the same alpha default.
// =========================================================================

describe('array-form arguments', function() {
  it('colorHslToRgb should accept [h, s, l] and default alpha to 255', function() {
    assert.deepEqual(colorHslToRgb([0, 100, 50]), colorHslToRgb(0, 100, 50));
    assert.strictEqual(colorHslToRgb([0, 100, 50])[3], 255);
  });

  it('colorHslToRgb should accept an explicit alpha in the array', function() {
    assert.strictEqual(colorHslToRgb([0, 100, 50, 128])[3], 128);
  });

  it('colorRgbToHsl should accept [r, g, b] and default alpha to 255', function() {
    assert.deepEqual(colorRgbToHsl([255, 0, 0]), colorRgbToHsl(255, 0, 0));
    assert.strictEqual(colorRgbToHsl([255, 0, 0])[3], 255);
  });

  it('colorRgbToHsl should accept an explicit alpha in the array', function() {
    assert.strictEqual(colorRgbToHsl([255, 0, 0, 64])[3], 64);
  });
});

// =========================================================================
// Hue coverage
//
// hue2rgb wraps t into [0,1) and has four segments; colorRgbToHsl picks the
// hue branch from whichever channel is the max. Walking the whole wheel
// exercises every segment and both sides of the lightness split.
// =========================================================================

describe('hue round-trip across the whole wheel', function() {
  it('should round-trip every 30 degrees of hue', function() {
    for (var h = 0; h < 360; h += 30) {
      var rgb = colorHslToRgb(h, 100, 50);
      var hsl = colorRgbToHsl(rgb[0], rgb[1], rgb[2]);
      assert.strictEqual(hsl[0], h, 'hue ' + h + ' should survive the round trip');
      assert.strictEqual(hsl[1], 100, 'saturation should stay 100 at hue ' + h);
      assert.strictEqual(hsl[2], 50, 'lightness should stay 50 at hue ' + h);
    }
  });

  it('should pick the red branch when red is max and blue exceeds green', function() {
    // Magenta-ish: max is red, g < b, so the hue needs the +6 wrap.
    var hsl = colorRgbToHsl(255, 0, 128);
    assert.ok(hsl[0] > 300 && hsl[0] < 360, 'expected a hue near 330, got ' + hsl[0]);
  });

  it('should handle lightness above and below the 0.5 split', function() {
    var dark = colorHslToRgb(210, 50, 25);
    var light = colorHslToRgb(210, 50, 75);
    assert.ok(dark[0] < light[0] && dark[1] < light[1] && dark[2] < light[2],
      'the lighter colour should be brighter on every channel');
    assert.strictEqual(colorRgbToHsl(dark[0], dark[1], dark[2])[2], 25);
    assert.strictEqual(colorRgbToHsl(light[0], light[1], light[2])[2], 75);
  });

  it('should treat hue 360 the same as hue 0', function() {
    assert.deepEqual(colorHslToRgb(360, 100, 50), colorHslToRgb(0, 100, 50));
  });
});

// =========================================================================
// Zero channels in functional notation
//
// The parser defaults missing channels with `|| 0`, which also swallows a
// genuine 0. Black and a zeroed hsl() must still parse exactly.
// =========================================================================

describe('functional notation with zero channels', function() {
  it('should parse rgb(0, 0, 0) as opaque black', function() {
    assert.deepEqual(colorParse('rgb(0, 0, 0)'), [0, 0, 0, 255, "rgb"]);
  });

  it('should parse hsl(0, 0%, 0%) as opaque black', function() {
    var result = colorParse('hsl(0, 0%, 0%)');
    assert.deepEqual([result[0], result[1], result[2]], [0, 0, 0]);
  });

  it('should keep a zero alpha distinct from a missing one', function() {
    assert.strictEqual(colorParse('rgba(0, 0, 0, 0)')[3], 0);
    assert.strictEqual(colorParse('rgb(0, 0, 0)')[3], 255);
  });
});

// =========================================================================
// colorInterp option handling
// =========================================================================

describe('colorInterp scaling options', function() {
  it('should interpolate linearly by default', function() {
    var mid = colorInterp(50, 0, 100, ['#000000', '#ffffff']);
    assert.strictEqual(Math.round(mid[0]), 128);
  });

  it('should bend the ramp when stretch is given', function() {
    var linear = colorInterp(50, 0, 100, ['#000000', '#ffffff']);
    var curved = colorInterp(50, 0, 100, ['#000000', '#ffffff'], 2);
    assert.ok(curved[0] < linear[0],
      'an expScale above 1 should darken the midpoint: ' + curved[0] + ' vs ' + linear[0]);
  });

  it('should clip values outside the input range', function() {
    assert.deepEqual(colorInterp(-50, 0, 100, ['#000000', '#ffffff']).slice(0, 3), [0, 0, 0]);
    assert.deepEqual(colorInterp(150, 0, 100, ['#000000', '#ffffff']).slice(0, 3), [255, 255, 255]);
  });
});

// =========================================================================
// Auto-install on import
//
// Loaded from a script tag onto a page that already has bitwrench, the
// module grafts itself onto the existing bw rather than waiting for an
// explicit install() call. A query string gives us a fresh module instance.
// =========================================================================

describe('auto-install when window.bw already exists', function() {
  it('should install onto an existing window.bw at import time', async function() {
    var hadWindow = 'window' in global;
    var origWindow = global.window;
    global.window = { bw: {} };
    try {
      await import('../src/bitwrench-util-color.js?autoinstall=1');
      assert.strictEqual(typeof global.window.bw.colorParse, 'function',
        'importing with a live window.bw should install the colour helpers');
      assert.deepEqual(global.window.bw.colorParse('#ff0000'), [255, 0, 0, 255, "rgb"]);
    } finally {
      if (hadWindow) global.window = origWindow;
      else delete global.window;
    }
  });

  it('should not throw when window exists without bw', async function() {
    var hadWindow = 'window' in global;
    var origWindow = global.window;
    global.window = {};
    try {
      await import('../src/bitwrench-util-color.js?autoinstall=2');
    } finally {
      if (hadWindow) global.window = origWindow;
      else delete global.window;
    }
  });
});
