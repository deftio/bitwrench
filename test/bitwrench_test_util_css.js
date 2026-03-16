/**
 * Tests for bitwrench-util-css.js
 *
 * Covers u(), u.css(), u.cls(), u.extend(), color rules,
 * parametric rules, static keywords, and edge cases.
 */

import assert from "assert";
import { utilCSS, install } from "../src/bitwrench-util-css.js";
import bw from "../src/bitwrench.js";

// Install the plugin on bw
install(bw);

// =========================================================================
// 1. u() — style object output
// =========================================================================

describe('utilCSS: u() style objects', function() {
  it('should return empty object for empty string', function() {
    var result = utilCSS('');
    assert.deepStrictEqual(result, {});
  });

  it('should return empty object for null/undefined', function() {
    assert.deepStrictEqual(utilCSS(null), {});
    assert.deepStrictEqual(utilCSS(undefined), {});
  });

  it('should parse "flex" to display:flex', function() {
    assert.deepStrictEqual(utilCSS('flex'), { display: 'flex' });
  });

  it('should parse "flexCol" to flex column', function() {
    assert.deepStrictEqual(utilCSS('flexCol'), { display: 'flex', flexDirection: 'column' });
  });

  it('should parse "flexRow" to flex row', function() {
    assert.deepStrictEqual(utilCSS('flexRow'), { display: 'flex', flexDirection: 'row' });
  });

  it('should parse "flexWrap" to flex wrap', function() {
    assert.deepStrictEqual(utilCSS('flexWrap'), { display: 'flex', flexWrap: 'wrap' });
  });

  it('should parse "block" to display:block', function() {
    assert.deepStrictEqual(utilCSS('block'), { display: 'block' });
  });

  it('should parse "inline" to display:inline', function() {
    assert.deepStrictEqual(utilCSS('inline'), { display: 'inline' });
  });

  it('should parse "hidden" to display:none', function() {
    assert.deepStrictEqual(utilCSS('hidden'), { display: 'none' });
  });

  it('should parse parametric padding "p4" to 1rem', function() {
    assert.deepStrictEqual(utilCSS('p4'), { padding: '1rem' });
  });

  it('should parse "p0" to 0rem', function() {
    assert.deepStrictEqual(utilCSS('p0'), { padding: '0rem' });
  });

  it('should parse "p2" to 0.5rem', function() {
    assert.deepStrictEqual(utilCSS('p2'), { padding: '0.5rem' });
  });

  it('should parse "m2" to 0.5rem', function() {
    assert.deepStrictEqual(utilCSS('m2'), { margin: '0.5rem' });
  });

  it('should parse multiple tokens "p4 m2" to merged object', function() {
    assert.deepStrictEqual(utilCSS('p4 m2'), { padding: '1rem', margin: '0.5rem' });
  });

  it('should parse "flex gap4 p4" to merged flex+gap+padding', function() {
    assert.deepStrictEqual(utilCSS('flex gap4 p4'), {
      display: 'flex', gap: '1rem', padding: '1rem'
    });
  });

  it('should parse directional padding: pt, pb, pl, pr', function() {
    assert.deepStrictEqual(utilCSS('pt2'), { paddingTop: '0.5rem' });
    assert.deepStrictEqual(utilCSS('pb4'), { paddingBottom: '1rem' });
    assert.deepStrictEqual(utilCSS('pl2'), { paddingLeft: '0.5rem' });
    assert.deepStrictEqual(utilCSS('pr2'), { paddingRight: '0.5rem' });
  });

  it('should parse axis padding: px, py', function() {
    assert.deepStrictEqual(utilCSS('px4'), { paddingLeft: '1rem', paddingRight: '1rem' });
    assert.deepStrictEqual(utilCSS('py2'), { paddingTop: '0.5rem', paddingBottom: '0.5rem' });
  });

  it('should parse directional margin: mt, mb, ml, mr', function() {
    assert.deepStrictEqual(utilCSS('mt2'), { marginTop: '0.5rem' });
    assert.deepStrictEqual(utilCSS('mb4'), { marginBottom: '1rem' });
    assert.deepStrictEqual(utilCSS('ml2'), { marginLeft: '0.5rem' });
    assert.deepStrictEqual(utilCSS('mr2'), { marginRight: '0.5rem' });
  });

  it('should parse axis margin: mx, my', function() {
    assert.deepStrictEqual(utilCSS('mx4'), { marginLeft: '1rem', marginRight: '1rem' });
    assert.deepStrictEqual(utilCSS('my2'), { marginTop: '0.5rem', marginBottom: '0.5rem' });
  });

  it('should parse gap values', function() {
    assert.deepStrictEqual(utilCSS('gap1'), { gap: '0.25rem' });
    assert.deepStrictEqual(utilCSS('gap2'), { gap: '0.5rem' });
    assert.deepStrictEqual(utilCSS('gap4'), { gap: '1rem' });
    assert.deepStrictEqual(utilCSS('gap8'), { gap: '2rem' });
  });

  it('should parse w and h sizing', function() {
    assert.deepStrictEqual(utilCSS('w4'), { width: '1rem' });
    assert.deepStrictEqual(utilCSS('h8'), { height: '2rem' });
  });

  it('should parse rounded with number', function() {
    assert.deepStrictEqual(utilCSS('rounded2'), { borderRadius: '0.5rem' });
  });

  it('should parse typography: bold, semibold, italic', function() {
    assert.deepStrictEqual(utilCSS('bold'), { fontWeight: '700' });
    assert.deepStrictEqual(utilCSS('semibold'), { fontWeight: '600' });
    assert.deepStrictEqual(utilCSS('italic'), { fontStyle: 'italic' });
  });

  it('should parse textCenter and textRight', function() {
    assert.deepStrictEqual(utilCSS('textCenter'), { textAlign: 'center' });
    assert.deepStrictEqual(utilCSS('textRight'), { textAlign: 'right' });
  });

  it('should parse text size tokens', function() {
    assert.deepStrictEqual(utilCSS('textSm'), { fontSize: '0.875rem' });
    assert.deepStrictEqual(utilCSS('textBase'), { fontSize: '1rem' });
    assert.deepStrictEqual(utilCSS('textLg'), { fontSize: '1.125rem' });
    assert.deepStrictEqual(utilCSS('textXl'), { fontSize: '1.25rem' });
    assert.deepStrictEqual(utilCSS('text2xl'), { fontSize: '1.5rem' });
    assert.deepStrictEqual(utilCSS('text3xl'), { fontSize: '1.875rem' });
  });

  it('should parse alignment keywords', function() {
    assert.deepStrictEqual(utilCSS('justifyCenter'), { justifyContent: 'center' });
    assert.deepStrictEqual(utilCSS('justifyBetween'), { justifyContent: 'space-between' });
    assert.deepStrictEqual(utilCSS('justifyEnd'), { justifyContent: 'flex-end' });
    assert.deepStrictEqual(utilCSS('alignCenter'), { alignItems: 'center' });
    assert.deepStrictEqual(utilCSS('alignStart'), { alignItems: 'flex-start' });
    assert.deepStrictEqual(utilCSS('alignEnd'), { alignItems: 'flex-end' });
  });

  it('should parse wFull and hFull', function() {
    assert.deepStrictEqual(utilCSS('wFull'), { width: '100%' });
    assert.deepStrictEqual(utilCSS('hFull'), { height: '100%' });
  });

  it('should parse transition', function() {
    assert.deepStrictEqual(utilCSS('transition'), { transition: 'all 0.2s ease' });
  });

  it('should silently ignore unknown tokens', function() {
    assert.deepStrictEqual(utilCSS('unknownThing'), {});
    assert.deepStrictEqual(utilCSS('flex unknownThing p4'), { display: 'flex', padding: '1rem' });
  });

  it('should handle extra whitespace', function() {
    assert.deepStrictEqual(utilCSS('  flex   p4  '), { display: 'flex', padding: '1rem' });
  });
});

// =========================================================================
// 2. Color rules
// =========================================================================

describe('utilCSS: color rules', function() {
  it('should parse bg-white to background:white', function() {
    assert.deepStrictEqual(utilCSS('bg-white'), { background: 'white' });
  });

  it('should parse bg-red to background:red', function() {
    assert.deepStrictEqual(utilCSS('bg-red'), { background: 'red' });
  });

  it('should parse text-blue to color:blue', function() {
    assert.deepStrictEqual(utilCSS('text-blue'), { color: 'blue' });
  });

  it('should parse bg-[#4f46e5] escape hatch', function() {
    assert.deepStrictEqual(utilCSS('bg-[#4f46e5]'), { background: '#4f46e5' });
  });

  it('should parse text-[#ff0000] escape hatch', function() {
    assert.deepStrictEqual(utilCSS('text-[#ff0000]'), { color: '#ff0000' });
  });

  it('should parse bg-[rgb(0,128,0)] escape hatch', function() {
    assert.deepStrictEqual(utilCSS('bg-[rgb(0,128,0)]'), { background: 'rgb(0,128,0)' });
  });
});

// =========================================================================
// 3. u.css() — CSS string output
// =========================================================================

describe('utilCSS: u.css()', function() {
  it('should return CSS string for "flex"', function() {
    assert.strictEqual(utilCSS.css('flex'), 'display:flex');
  });

  it('should return CSS string for "flex gap4"', function() {
    assert.strictEqual(utilCSS.css('flex gap4'), 'display:flex;gap:1rem');
  });

  it('should convert camelCase to kebab-case', function() {
    assert.strictEqual(utilCSS.css('flexCol'), 'display:flex;flex-direction:column');
  });

  it('should return empty string for empty input', function() {
    assert.strictEqual(utilCSS.css(''), '');
  });

  it('should handle multi-property tokens', function() {
    var result = utilCSS.css('px4');
    assert.ok(result.indexOf('padding-left:1rem') !== -1);
    assert.ok(result.indexOf('padding-right:1rem') !== -1);
  });
});

// =========================================================================
// 4. u.cls() — class name output
// =========================================================================

describe('utilCSS: u.cls()', function() {
  it('should return bw_ prefixed class for "flex"', function() {
    assert.strictEqual(utilCSS.cls('flex'), 'bw_flex');
  });

  it('should return multiple classes for "flex p4"', function() {
    var result = utilCSS.cls('flex p4');
    assert.ok(result.indexOf('bw_flex') !== -1);
    assert.ok(result.indexOf('bw_p_4') !== -1);
  });

  it('should return empty string for empty input', function() {
    assert.strictEqual(utilCSS.cls(''), '');
  });

  it('should return empty string for null', function() {
    assert.strictEqual(utilCSS.cls(null), '');
  });

  it('should skip unknown tokens', function() {
    assert.strictEqual(utilCSS.cls('unknownThing'), '');
  });

  it('should handle camelCase tokens', function() {
    var result = utilCSS.cls('flexCol');
    assert.ok(result.indexOf('bw_flex_col') !== -1);
  });
});

// =========================================================================
// 5. u.extend() — custom rules
// =========================================================================

describe('utilCSS: u.extend()', function() {
  it('should add a custom static rule', function() {
    utilCSS.extend({ card: { padding: '1rem', borderRadius: '8px' } });
    assert.deepStrictEqual(utilCSS('card'), { padding: '1rem', borderRadius: '8px' });
  });

  it('should add a custom function rule', function() {
    utilCSS.extend({ myPad: function() { return { padding: '2rem' }; } });
    assert.deepStrictEqual(utilCSS('myPad'), { padding: '2rem' });
  });

  it('should ignore null/non-object argument', function() {
    utilCSS.extend(null);
    utilCSS.extend(42);
    // Should not throw
    assert.ok(true);
  });

  it('custom rules override built-ins', function() {
    utilCSS.extend({ bold: { fontWeight: '900' } });
    assert.deepStrictEqual(utilCSS('bold'), { fontWeight: '900' });
    // Restore original by deleting custom override
    utilCSS.extend({ bold: null });
  });
});

// =========================================================================
// 6. Plugin installation on bw
// =========================================================================

describe('utilCSS: plugin install', function() {
  it('should install as bw.utilCSS', function() {
    assert.strictEqual(typeof bw.utilCSS, 'function');
  });

  it('should install as bw.u alias', function() {
    assert.strictEqual(typeof bw.u, 'function');
    assert.strictEqual(bw.u, bw.utilCSS);
  });

  it('bw.u("flex") should work', function() {
    assert.deepStrictEqual(bw.u('flex'), { display: 'flex' });
  });

  it('bw.u.css("p4") should work', function() {
    assert.strictEqual(bw.u.css('p4'), 'padding:1rem');
  });

  it('bw.u.cls("bold") should work', function() {
    assert.ok(bw.u.cls('bold').indexOf('bw_bold') !== -1);
  });
});
