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
