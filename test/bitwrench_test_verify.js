/**
 * bitwrench-verify -- the fixture corpus and tier 1.
 *
 * Written before the checker, deliberately. Every ACCEPT case below was run
 * against 2.1.12 and renders today, so this file pins real behaviour rather
 * than the grammar someone assumed. Several of them contradict a first guess:
 *
 *   - `c` may be a number, a boolean or null (coerced or skipped, not errors)
 *   - `class` may be an array of strings
 *   - `style` may be an object
 *   - an attribute value may be a boolean (true renders bare, false omits)
 *   - `onClick` WORKS -- the renderer lowercases the sliced event name
 *   - unknown attributes are forwarded on purpose (viewBox, aria-*, data-*)
 *
 * The last ACCEPT case, `{ t:'div', a:{ class:'my-card' } }`, is the
 * regression guard against an over-broad class check. It is here before the
 * class check exists, which is the point.
 *
 * See dev/bw-verify-design.md section 7 (the nine-step walk) and section 11a.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { verify } from "../src/bitwrench-verify.js";
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── The corpus ──────────────────────────────────────────────────────────
// Shared by the tier 1 tests, the schema agreement test (B9) and the CLI
// tests (B3b), so all three check the same grammar.

export const ACCEPT = [
  { why: 'element with string content', taco: { t: 'h1', c: 'hi' } },
  { why: 'number and boolean content coerce', taco: { t: 'p', c: ['n=', 7, true] } },
  { why: 'null content is skipped, not an error', taco: { t: 'div', c: null } },
  { why: 'nested element content', taco: { t: 'div', c: { t: 'span', c: 'x' } } },
  { why: 'deeply nested arrays', taco: { t: 'ul', c: [[{ t: 'li', c: 'a' }], [{ t: 'li', c: 'b' }]] } },
  { why: 'top-level array (bw.mount accepts one)', taco: [{ t: 'p', c: 'a' }, { t: 'p', c: 'b' }] },
  { why: 'bare string is content', taco: 'just text' },
  { why: 'class as an array of strings', taco: { t: 'div', a: { class: ['card', 'bw_bccl_card'] } } },
  { why: 'style as an object', taco: { t: 'p', a: { style: { color: 'red' } } } },
  { why: 'boolean attribute', taco: { t: 'input', a: { disabled: true } } },
  { why: 'numeric attribute', taco: { t: 'p', a: { tabindex: 3 } } },
  { why: 'null attribute is omitted, not an error', taco: { t: 'p', a: { title: null } } },
  // Every BCCL factory writes `style: props.style`, so an undefined style is
  // the commonest attribute value in the library. Found by dogfooding tier 1
  // over 10 real factories, which reported four false errors.
  { why: 'undefined style (what every factory emits)', taco: { t: 'p', a: { style: undefined } } },
  { why: 'undefined class', taco: { t: 'p', a: { class: undefined } } },
  { why: 'null style', taco: { t: 'p', a: { style: null } } },
  { why: 'SVG attributes are forwarded verbatim', taco: { t: 'svg', a: { viewBox: '0 0 10 10' }, c: { t: 'rect', a: { 'stroke-width': 1 } } } },
  { why: 'aria-* and data-* are forwarded', taco: { t: 'span', a: { 'aria-label': 'temp', 'data-reading': '1' } } },
  { why: 'raw node from bw.raw()', taco: { __bw_raw: true, v: '<b>x</b>' } },
  { why: 'raw node as content', taco: { t: 'p', c: { __bw_raw: true, v: '<b>x</b>' } } },
  { why: 'wire-legal options', taco: { t: 'div', o: { type: 'card', state: { n: 0 }, slots: { body: '.b' } } } },
  { why: 'an application class must never be flagged', taco: { t: 'div', a: { class: 'my-card' } } }
];

export const ACCEPT_AUTHORED_ONLY = [
  { why: 'function handler', taco: { t: 'button', a: { onclick: function() {} }, c: 'Go' } },
  { why: 'onClick works -- normalised to click', taco: { t: 'button', a: { onClick: function() {} }, c: 'Go' } },
  { why: 'lifecycle hooks are functions', taco: { t: 'div', o: { mounted: function() {}, render: function() {} } } },
  { why: 'handle is an object of functions', taco: { t: 'div', o: { handle: { setTo: function() {} } } } }
];

export const REJECT = [
  { why: 'missing t renders [object Object]', code: 'not-an-element', hint: 't', taco: { tag: 'h1', c: 'hi' } },
  { why: 'no t and no __bw_raw', code: 'not-an-element', taco: { a: { class: 'x' } } },
  { why: 'unknown top-level key', code: 'unknown-key', hint: 'c', taco: { t: 'h1', cc: 'hi' } },
  { why: 'children is not a TACO key', code: 'unknown-key', hint: 'c', taco: { t: 'div', children: [] } },
  { why: 'attrs is not a TACO key', code: 'unknown-key', hint: 'a', taco: { t: 'div', attrs: {} } },
  { why: 't must be a string', code: 't-not-string', taco: { t: 42, c: 'x' } },
  { why: 'raw without v', code: 'bad-raw', taco: { __bw_raw: true } },
  { why: 'raw with extra keys', code: 'bad-raw', taco: { __bw_raw: true, v: 'x', t: 'p' } },
  { why: 'a must be an object', code: 'attrs-not-object', taco: { t: 'p', a: 'class' } },
  { why: 'class must be string or string[]', code: 'bad-class', taco: { t: 'p', a: { class: 7 } } },
  { why: 'class array of non-strings', code: 'bad-class', taco: { t: 'p', a: { class: ['a', 7] } } },
  { why: 'o must be an object', code: 'opts-not-object', taco: { t: 'p', o: 'mounted' } },
  { why: 'style must be a string or an object', code: 'bad-style', taco: { t: 'p', a: { style: 7 } } },
  { why: 'a function on a non-handler attribute is stringified, not called', code: 'function-not-handler', taco: { t: 'p', a: { title: function() {} } } },
  { why: 'a lifecycle hook that is not a function never runs', code: 'opt-not-function', hint: null, taco: { t: 'div', o: { mounted: 'notAFunction' } } },
  { why: 'a function cannot be content', code: 'function-as-content', taco: { t: 'p', c: function() {} } }
];

export const WARN = [
  { why: 'attribute one edit from class', code: 'attr-typo', hint: 'class', taco: { t: 'h1', a: { clas: 'x' } } },
  { why: 'attribute one edit from style', code: 'attr-typo', hint: 'style', taco: { t: 'h1', a: { styl: 'x' } } },
  { why: 'string handler: right for bw.html, dead on a frame', code: 'handler-string', taco: { t: 'button', a: { onclick: 'save()' }, c: 'Go' } },
  { why: 'raw content that executes', code: 'raw-unsafe', taco: { __bw_raw: true, v: '<img src=x onerror="steal()">' } },
  { why: 'raw with a javascript: URL', code: 'raw-unsafe', taco: { __bw_raw: true, v: '<a href="javascript:x()">x</a>' } },
  { why: 'raw with a script tag', code: 'raw-unsafe', taco: { __bw_raw: true, v: '<script>steal()</script>' } },
  { why: 'raw with an iframe srcdoc', code: 'raw-unsafe', taco: { __bw_raw: true, v: '<iframe srcdoc="<script>x()</script>">' } },
  { why: 'raw we cannot judge', code: 'raw-unchecked', taco: { __bw_raw: true, v: '<b>plain</b>' } },
  // Tier 1 does not own the option-key list -- the generated manifest does, so
  // an unrecognised key is a hint here and becomes an error in tier 2.
  { why: 'an option key the renderer may not read', code: 'unknown-opt-maybe', taco: { t: 'div', o: { nope: 1 } } }
];

export const REJECT_WIRE_ONLY = [
  { why: 'a function cannot cross JSON', code: 'function-in-wire', taco: { t: 'button', a: { onclick: function() {} } } },
  { why: 'a lifecycle hook cannot cross JSON', code: 'function-in-wire', taco: { t: 'div', o: { mounted: function() {} } } },
  { why: 'handle cannot cross JSON', code: 'function-in-wire', taco: { t: 'div', o: { handle: { x: function() {} } } } }
];

function codesOf(findings) {
  return findings.map(function(f) { return f.code; });
}

// ── Tier 1 ──────────────────────────────────────────────────────────────

describe('verify: tier 1 accepts what bitwrench renders', function() {
  ACCEPT.forEach(function(c) {
    it('accepts: ' + c.why, function() {
      const findings = verify(c.taco);
      const errors = findings.filter(function(f) { return f.severity === 'error'; });
      assert.deepStrictEqual(errors, [],
        'unexpected errors: ' + JSON.stringify(codesOf(errors)));
    });
  });

  ACCEPT_AUTHORED_ONLY.forEach(function(c) {
    it('accepts in authored mode: ' + c.why, function() {
      const errors = verify(c.taco).filter(function(f) { return f.severity === 'error'; });
      assert.deepStrictEqual(errors, [], JSON.stringify(codesOf(errors)));
    });
  });

  it('every ACCEPT case really does render (the corpus is not aspirational)', function() {
    document.body.innerHTML = '<div id="probe"></div>';
    ACCEPT.forEach(function(c) {
      assert.doesNotThrow(function() { bw.html(c.taco); }, c.why + ' failed bw.html');
    });
  });
});

describe('verify: tier 1 rejects what bitwrench ignores', function() {
  REJECT.forEach(function(c) {
    it('rejects: ' + c.why + ' (' + c.code + ')', function() {
      const findings = verify(c.taco);
      const codes = codesOf(findings);
      assert.ok(codes.indexOf(c.code) !== -1,
        'expected ' + c.code + ', got ' + JSON.stringify(codes));
      const hit = findings.filter(function(f) { return f.code === c.code; })[0];
      assert.strictEqual(hit.severity, 'error', c.code + ' should be an error');
      if (c.hint) assert.strictEqual(hit.hint, c.hint, 'hint should be ' + c.hint);
    });
  });
});

describe('verify: tier 1 warns on legal-but-ambiguous', function() {
  WARN.forEach(function(c) {
    it('warns: ' + c.why + ' (' + c.code + ')', function() {
      const findings = verify(c.taco);
      const codes = codesOf(findings);
      assert.ok(codes.indexOf(c.code) !== -1,
        'expected ' + c.code + ', got ' + JSON.stringify(codes));
      const hit = findings.filter(function(f) { return f.code === c.code; })[0];
      assert.strictEqual(hit.severity, 'warn', c.code + ' should be a warning');
      if (c.hint) assert.strictEqual(hit.hint, c.hint);
    });
  });

  it('a warning is never an error, so a default run does not fail on one', function() {
    WARN.forEach(function(c) {
      const errors = verify(c.taco).filter(function(f) { return f.severity === 'error'; });
      assert.deepStrictEqual(errors, [], c.why + ' produced an error');
    });
  });
});

describe('verify: wire mode', function() {
  REJECT_WIRE_ONLY.forEach(function(c) {
    it('wire rejects: ' + c.why, function() {
      const codes = codesOf(verify(c.taco, { mode: 'wire' }));
      assert.ok(codes.indexOf(c.code) !== -1,
        'expected ' + c.code + ', got ' + JSON.stringify(codes));
    });

    it('authored allows: ' + c.why, function() {
      const errors = verify(c.taco).filter(function(f) { return f.severity === 'error'; });
      assert.deepStrictEqual(errors, [], 'authored mode should allow functions');
    });
  });

  it('a string handler is an ERROR in wire mode, a warning in authored', function() {
    const taco = { t: 'button', a: { onclick: 'save()' }, c: 'Go' };
    const wire = verify(taco, { mode: 'wire' }).filter(function(f) { return f.code === 'handler-string'; })[0];
    const authored = verify(taco).filter(function(f) { return f.code === 'handler-string'; })[0];
    assert.strictEqual(wire.severity, 'error', 'stripped in transit -> a dead control');
    assert.strictEqual(authored.severity, 'warn', 'correct for bw.html / runtime:shim');
  });

  it('wire mode still accepts the data-only options', function() {
    const errors = verify({ t: 'div', o: { type: 'card', state: { n: 1 }, slots: { b: '.b' } } },
      { mode: 'wire' }).filter(function(f) { return f.severity === 'error'; });
    assert.deepStrictEqual(errors, []);
  });
});

describe('verify: findings carry a usable location', function() {
  it('path points at the offending node', function() {
    const findings = verify({ t: 'div', c: [{ t: 'p', c: 'ok' }, { tag: 'h1' }] });
    const hit = findings.filter(function(f) { return f.code === 'not-an-element'; })[0];
    assert.ok(hit, 'should find the bad child');
    assert.strictEqual(hit.path, 'c[1]');
  });

  it('path reaches into attributes and options', function() {
    const a = verify({ t: 'p', a: { clas: 'x' } })[0];
    assert.strictEqual(a.path, 'a.clas');
    const o = verify({ t: 'p', o: 'nope' })[0];
    assert.strictEqual(o.path, 'o');
  });

  it('root findings have an empty path', function() {
    assert.strictEqual(verify({ tag: 'h1' })[0].path, '');
  });

  it('a clean tree returns an empty array', function() {
    assert.deepStrictEqual(verify({ t: 'div', c: [{ t: 'p', c: 'a' }] }), []);
  });

  it('reports every problem in one pass, not just the first', function() {
    const codes = codesOf(verify({ t: 'div', cc: 1, c: [{ tag: 'x' }, { t: 'p', a: 'bad' }] }));
    assert.ok(codes.indexOf('unknown-key') !== -1);
    assert.ok(codes.indexOf('not-an-element') !== -1);
    assert.ok(codes.indexOf('attrs-not-object') !== -1);
  });
});

describe('verify: suppression', function() {
  it('ignore silences a code and nothing else', function() {
    const taco = { t: 'h1', a: { clas: 'x' }, cc: 1 };
    const all = codesOf(verify(taco));
    assert.ok(all.indexOf('attr-typo') !== -1 && all.indexOf('unknown-key') !== -1);
    const kept = codesOf(verify(taco, { ignore: ['attr-typo'] }));
    assert.strictEqual(kept.indexOf('attr-typo'), -1, 'attr-typo should be gone');
    assert.ok(kept.indexOf('unknown-key') !== -1, 'unknown-key must survive');
  });

  it('suppressed findings are reported, not hidden', function() {
    const out = verify({ t: 'h1', a: { clas: 'x' } }, { ignore: ['attr-typo'] });
    assert.strictEqual(out.suppressed, 1, 'should count what it silenced');
    assert.deepStrictEqual(out.suppressedCodes, ['attr-typo']);
  });

  it('there is no way to ignore everything', function() {
    const codes = codesOf(verify({ tag: 'h1' }, { ignore: ['all'] }));
    assert.ok(codes.indexOf('not-an-element') !== -1,
      "'all' must not be a mute button");
  });
});

describe('verify: assert and strict', function() {
  it('assert throws on an error, naming the code', function() {
    assert.throws(function() { verify.assert({ tag: 'h1' }); }, /not-an-element/);
  });

  it('assert does not throw on a warning by default', function() {
    assert.doesNotThrow(function() { verify.assert({ t: 'h1', a: { clas: 'x' } }); });
  });

  it('assert throws on a warning when strict', function() {
    assert.throws(function() {
      verify.assert({ t: 'h1', a: { clas: 'x' } }, { strict: true });
    }, /attr-typo/);
  });

  it('assert is silent on a clean tree', function() {
    assert.doesNotThrow(function() { verify.assert({ t: 'div', c: 'ok' }); });
  });
});

describe('verify: it never mutates or throws on hostile input', function() {
  it('leaves the input untouched', function() {
    const taco = { t: 'div', a: { class: 'x' }, c: [{ t: 'p', c: 'a' }] };
    const before = JSON.stringify(taco);
    verify(taco);
    assert.strictEqual(JSON.stringify(taco), before);
  });

  it('survives undefined, null and primitives', function() {
    [undefined, null, 0, '', false, NaN].forEach(function(v) {
      assert.doesNotThrow(function() { verify(v); }, String(v));
    });
  });

  it('survives a cycle instead of blowing the stack', function() {
    const a = { t: 'div' };
    a.c = a;
    assert.doesNotThrow(function() {
      const codes = codesOf(verify(a));
      assert.ok(codes.indexOf('cycle') !== -1, 'should report a cycle: ' + codes);
    });
  });

  it('survives a deep but legal tree', function() {
    let node = { t: 'span', c: 'leaf' };
    for (let i = 0; i < 200; i++) node = { t: 'div', c: node };
    assert.deepStrictEqual(verify(node), [], 'a 200-deep tree is legal');
  });

  it('reports too-deep instead of overflowing the stack', function() {
    let node = { t: 'span', c: 'leaf' };
    for (let i = 0; i < 700; i++) node = { t: 'div', c: node };
    const codes = codesOf(verify(node));
    assert.ok(codes.indexOf('too-deep') !== -1, 'expected too-deep, got ' + codes.slice(0, 3));
  });

  it('reports verify-failed rather than throwing, if the walk itself breaks', function() {
    // A checker that throws is worse than one that misses something, so the
    // walk is wrapped. An object whose keys cannot be read exercises that.
    const hostile = new Proxy({ t: 'div' }, {
      ownKeys() { throw new Error('no keys for you'); }
    });
    let out;
    assert.doesNotThrow(function() { out = verify(hostile); });
    assert.ok(codesOf(out).indexOf('verify-failed') !== -1,
      'expected verify-failed, got ' + JSON.stringify(codesOf(out)));
  });

  it('a Date as content warns -- it renders, but locale-dependently', function() {
    const f = verify({ t: 'p', c: new Date(0) });
    assert.deepStrictEqual(f.filter(function(x) { return x.severity === 'error'; }), [],
      'it does render, so it is not an error');
    assert.strictEqual(f[0].code, 'object-as-content');
    assert.strictEqual(f[0].severity, 'warn');
  });

  it('a Map as content warns the same way', function() {
    assert.strictEqual(verify({ t: 'p', c: new Map([[1, 2]]) })[0].code, 'object-as-content');
  });

  it('a class instance carrying a t is an ERROR -- it looks like a TACO and is not', function() {
    // Measured: bw.html(new Widget()) where Widget has t='b' renders
    // "[object Object]", because bw.typeOf() returns 'Widget' so the element
    // path is never taken. This is the mistake worth being loudest about.
    function Widget() { this.t = 'b'; this.c = 'bold'; }
    const f = verify(new Widget());
    assert.strictEqual(f[0].code, 'not-an-element');
    assert.strictEqual(f[0].severity, 'error');
    assert.match(f[0].hint, /plain object/);
  });

  it('Object.create(null) is still a usable TACO', function() {
    const taco = Object.create(null);
    taco.t = 'p';
    taco.c = 'x';
    assert.deepStrictEqual(verify(taco), []);
  });
});

// =========================================================================
// Remaining shapes the walk has to survive
//
// These are the branches a hand-written corpus misses: exotic primitives the
// renderer stringifies, an empty object, an explicitly null `o`, and a key
// too far from any TACO key to suggest a fix.
// =========================================================================

describe('verify: odd but harmless values', function() {
  it('passes a boolean as content', function() {
    // bw.html({t:'p', c:true}) renders "<p>true</p>" -- odd, not wrong.
    assert.deepStrictEqual(verify({ t: 'p', c: true }), []);
  });

  it('passes a number as content', function() {
    assert.strictEqual(bw.html({ t: 'p', c: 42 }), '<p>42</p>');
    assert.deepStrictEqual(verify({ t: 'p', c: 42 }), []);
  });

  it('passes a bigint as content, which renders as its digits', function() {
    assert.strictEqual(bw.html({ t: 'p', c: 10n }), '<p>10</p>');
    assert.deepStrictEqual(verify({ t: 'p', c: 10n }), []);
  });

  it('passes a symbol as content, which renders as its description', function() {
    assert.strictEqual(bw.html({ t: 'p', c: Symbol('x') }), '<p>Symbol(x)</p>');
    assert.deepStrictEqual(verify({ t: 'p', c: Symbol('x') }), []);
  });

  it('accepts an explicitly null o, as the renderer does', function() {
    assert.strictEqual(bw.html({ t: 'p', c: 'x', o: null }), '<p>x</p>');
    assert.deepStrictEqual(verify({ t: 'p', c: 'x', o: null }), []);
  });

  it('accepts an explicitly undefined o', function() {
    // Factories that spread an options argument emit `o: undefined` routinely.
    assert.strictEqual(bw.html({ t: 'p', c: 'x', o: undefined }), '<p>x</p>');
    assert.deepStrictEqual(verify({ t: 'p', c: 'x', o: undefined }), []);
  });
});

describe('verify: reporting when there is nothing to suggest', function() {
  it('reports an empty object as not-an-element with no offending key', function() {
    const f = verify({});
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'not-an-element');
    assert.strictEqual(f[0].key, undefined, 'an empty object has no key to blame');
  });

  it('offers no hint for a key that resembles nothing', function() {
    const f = verify({ t: 'p', zzzqqq: 1 });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'unknown-key');
    assert.strictEqual(f[0].key, 'zzzqqq');
    // ctx.add omits a falsy hint rather than storing null, so the key is absent.
    assert.strictEqual('hint' in f[0], false, 'no near TACO key, so no guess');
  });

  it('still names the mistake when an object with children-like keys has no t', function() {
    const f = verify({ tagName: 'div', children: [] });
    assert.strictEqual(f[0].code, 'not-an-element');
    assert.strictEqual(f[0].hint, 't', 'tagName is one rename away from t');
  });
});

describe('verify.assert: message shapes', function() {
  it('includes the key and the suggestion when it has both', function() {
    assert.throws(
      function() { verify.assert({ t: 'h1', cc: 'hi' }); },
      function(err) {
        assert.match(err.message, /^bitwrench-verify: /);
        assert.match(err.message, /unknown-key/);
        assert.match(err.message, /\(cc -- did you mean c\?\)/);
        return true;
      }
    );
  });

  it('omits the parenthetical when the finding has no key', function() {
    assert.throws(
      function() { verify.assert({ t: 'p', c: function() {} }); },
      function(err) {
        assert.match(err.message, /function-as-content at 'c'/);
        assert.strictEqual(err.message.indexOf('('), -1,
          'nothing to put in parentheses: ' + err.message);
        return true;
      }
    );
  });

  it('names the key but no suggestion when there is nothing to suggest', function() {
    assert.throws(
      function() { verify.assert({ t: 'p', zzzqqq: 1 }, { strict: true }); },
      function(err) {
        assert.match(err.message, /\(zzzqqq\)/);
        assert.strictEqual(err.message.indexOf('did you mean'), -1,
          'no guess should be offered: ' + err.message);
        return true;
      }
    );
  });

  it('reports every fatal finding in one message', function() {
    assert.throws(
      function() { verify.assert({ t: 'h1', cc: 'x', dd: 'y' }); },
      function(err) {
        assert.strictEqual(err.message.split('; ').length, 2,
          'both keys should be listed: ' + err.message);
        return true;
      }
    );
  });

  it('returns true when there is nothing fatal', function() {
    assert.strictEqual(verify.assert({ t: 'p', c: 'x' }), true);
  });
});

// =========================================================================
// The code list is public API, so the count is pinned
//
// docs/verify.md, llms.txt and agents.md all state how many codes there are
// and tabulate them. A grep of the source undercounted twice while writing
// those docs -- `function-as-content` is emitted through a ternary
// (`mode === 'wire' ? 'function-in-wire' : 'function-as-content'`), so a
// regex over `ctx.add('error', '...')` never sees it. Exercising the tool is
// the only honest way to enumerate them.
//
// If you add a code: update this list, docs/verify.md's two tables, and the
// counts in llms.txt. Renaming one is a breaking change -- people filter on
// them.
// =========================================================================

describe('verify: the finding-code list is pinned', function() {
  const ERRORS = [
    'attrs-not-object', 'bad-class', 'bad-raw', 'bad-style', 'cycle',
    'function-as-content', 'function-in-wire', 'function-not-handler',
    'not-an-element', 'opt-not-function', 'opt-not-object', 'opts-not-object',
    't-not-string', 'too-deep', 'unknown-key', 'verify-failed'
  ];
  const WARNS = [
    'attr-typo', 'handler-string', 'object-as-content', 'raw-unchecked',
    'raw-unsafe', 'unknown-opt-maybe'
  ];

  // One input per code, so every entry above is proven reachable.
  function emit() {
    const seen = new Map();
    const note = (f) => { if (!seen.has(f.code)) seen.set(f.code, f.severity); };
    const cases = [
      [{ tag: 'h1' }, {}],
      [{ t: 'h1', cc: 'x' }, {}],
      [{ t: 42 }, {}],
      [{ __bw_raw: true }, {}],
      [{ t: 'p', a: 'class' }, {}],
      [{ t: 'p', a: { class: 7 } }, {}],
      [{ t: 'p', a: { style: 7 } }, {}],
      [{ t: 'p', o: 'x' }, {}],
      [{ t: 'p', a: { title: function() {} } }, {}],
      [{ t: 'p', c: function() {} }, {}],
      [{ t: 'div', o: { mounted: 'x' } }, {}],
      [{ t: 'div', o: { handle: 'x' } }, {}],
      [{ t: 'div', o: { nope: 1 } }, {}],
      [{ t: 'h1', a: { clas: 'x' } }, {}],
      [{ t: 'button', a: { onclick: 'save()' } }, {}],
      [{ __bw_raw: true, v: '<img src=x onerror=f()>' }, {}],
      [{ __bw_raw: true, v: '<b>x</b>' }, {}],
      [{ t: 'p', c: new Map() }, {}],
      [{ t: 'b', a: { onclick: function() {} } }, { mode: 'wire' }]
    ];
    cases.forEach(function(pair) { verify(pair[0], pair[1]).forEach(note); });

    // cycle
    var cyc = { t: 'div' }; cyc.c = cyc;
    verify(cyc).forEach(note);

    // too-deep
    var deep = { t: 'div' }, cur = deep;
    for (var i = 0; i < 700; i++) { cur.c = { t: 'div' }; cur = cur.c; }
    verify(deep).forEach(note);

    // verify-failed: a Proxy whose ownKeys throws
    var hostile = new Proxy({ t: 'div' }, { ownKeys: function() { throw new Error('boom'); } });
    verify(hostile).forEach(note);

    return seen;
  }

  it('emits exactly the documented codes, and no others', function() {
    const seen = emit();
    const got = Array.from(seen.keys()).sort();
    const expected = ERRORS.concat(WARNS).sort();
    assert.deepStrictEqual(got, expected,
      'the emitted code set drifted from the documented one');
  });

  it('every code has the documented severity', function() {
    const seen = emit();
    ERRORS.forEach(function(c) {
      assert.strictEqual(seen.get(c), 'error', c + ' should be an error');
    });
    WARNS.forEach(function(c) {
      assert.strictEqual(seen.get(c), 'warn', c + ' should be a warning');
    });
  });

  it('handler-string escalates to an error in wire mode', function() {
    // The one code whose severity depends on the mode, and the reason the
    // mode exists: a string on* handler is correct for bw.html() and
    // definitively dead on a frame, because bw.apply() strips it.
    const taco = { t: 'button', a: { onclick: 'save()' }, c: 'Go' };
    assert.strictEqual(verify(taco)[0].severity, 'warn', 'authored: legal');
    assert.strictEqual(verify(taco, { mode: 'wire' })[0].severity, 'error',
      'wire: the control cannot work');
    assert.strictEqual(verify(taco)[0].code, 'handler-string');
    assert.strictEqual(verify(taco, { mode: 'wire' })[0].code, 'handler-string',
      'the code is the same; only the severity moves');
  });

  it('docs/verify.md documents the mode-dependent severity', function() {
    const guide = readFileSync(resolve(root, 'docs/verify.md'), 'utf8');
    assert.ok(/error.{0,40}wire mode/i.test(guide) || /wire.{0,80}error/i.test(guide),
      'the guide must say handler-string escalates in wire mode');
  });

  it('the counts match what docs/verify.md and llms.txt state', function() {
    assert.strictEqual(ERRORS.length, 16, 'docs say 16 errors');
    assert.strictEqual(WARNS.length, 6, 'docs say 6 warnings');
    assert.strictEqual(ERRORS.length + WARNS.length, 22, 'docs say 22 codes');
  });

  it('docs/verify.md tabulates every code', function() {
    const guide = readFileSync(resolve(root, 'docs/verify.md'), 'utf8');
    const missing = ERRORS.concat(WARNS).filter(function(c) {
      return guide.indexOf('`' + c + '`') === -1;
    });
    assert.deepStrictEqual(missing, [],
      'codes emitted by the tool but absent from the guide');
  });

  it('llms.txt states the right counts', function() {
    const llms = readFileSync(resolve(root, 'llms.txt'), 'utf8');
    assert.ok(/22 codes: 16 errors, 6 warnings/.test(llms),
      'llms.txt must state 22 codes: 16 errors, 6 warnings');
  });

  it('pages/11-debugging.html states the same counts', function() {
    // The page said "19 codes -- 14 errors and 5 warnings" through two codes
    // being added and llms.txt being corrected, because only llms.txt had a
    // check. Same convention as llms.txt: handler-string counts once per
    // severity, so 22 = 16 + 6.
    const page = readFileSync(resolve(root, 'pages/11-debugging.html'), 'utf8');
    assert.ok(/22 codes -- 16 errors and 6 warnings/.test(page),
      'pages/11-debugging.html must state 22 codes -- 16 errors and 6 warnings');
  });
});

// =========================================================================
// The last two reachable branches
//
// Both are mode/position variants that the corpus happened not to hit: a
// function as CONTENT in wire mode (the other wire case is an attribute), and
// an `o` on a NESTED element (the other cases put it on the root).
// =========================================================================

describe('verify: mode and position variants', function() {
  it('a function as content is function-in-wire under wire mode', function() {
    const f = verify({ t: 'p', c: function() {} }, { mode: 'wire' });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'function-in-wire',
      'wire mode names the JSON problem, not the stringify problem');
    assert.strictEqual(f[0].path, 'c');
  });

  it('a function as content is function-as-content under authored mode', function() {
    const f = verify({ t: 'p', c: function() {} });
    assert.strictEqual(f[0].code, 'function-as-content',
      'authored mode names what actually renders');
  });

  it('reports an option problem on a nested element with its full path', function() {
    const f = verify({ t: 'div', c: { t: 'p', o: { nope: 1 } } });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'unknown-opt-maybe');
    assert.strictEqual(f[0].path, 'c.o.nope',
      'the path names the element, the o, and the offending option key');
  });

  it('reports an option problem on the root without an element prefix', function() {
    const f = verify({ t: 'div', o: { nope: 1 } });
    assert.strictEqual(f[0].path, 'o.nope');
  });
});

// =========================================================================
// Dogfood: every BCCL factory emits TACO that verify accepts
//
// The point of a checker is that the library passes it. 51 factories, each
// called with realistic props, checked in authored mode and again after a
// JSON round-trip in wire mode -- the second is what bwserve does, so a
// factory whose output cannot cross the wire fails here.
//
// The prop table is also a pinned record of the real prop names. Writing it
// the first time, the library's own warnUnknownProps caught ELEVEN wrong
// names in it (makeAvatar wants `initials` not `text`, makeCarousel `items`
// not `slides`, makePagination `currentPage` not `current`, ...). So this
// asserts no unknown-prop warning fires either: a factory renaming a prop, or
// this table drifting, fails the test.
// =========================================================================

describe('verify: every BCCL factory emits valid TACO', function() {
  const P = {
    makeCard:      { title: 'T', subtitle: 'S', content: 'C', footer: 'F', variant: 'primary', shadow: 'md' },
    makeButton:    { text: 'Go', variant: 'primary', size: 'sm', onclick: function () {} },
    makeAlert:     { content: 'Heads up', variant: 'warning', dismissible: true },
    makeBadge:     { text: '7', variant: 'danger' },
    makeTabs:      { tabs: [{ label: 'One', content: 'a' }, { label: 'Two', content: 'b' }] },
    makeAccordion: { items: [{ title: 'A', content: 'x' }], multiOpen: true },
    makeModal:     { title: 'Confirm', content: 'Sure?', footer: 'ok' },
    makeToast:     { content: 'Saved', variant: 'success' },
    makeNav:       { items: [{ text: 'Home', href: '#' }], pills: true },
    makeNavbar:    { brand: 'Acme', items: [{ text: 'Home', href: '#' }] },
    makeBreadcrumb:{ items: [{ text: 'Home', href: '#' }, { text: 'Here' }] },
    makeProgress:  { value: 42, variant: 'info' },
    makeSpinner:   { variant: 'primary', size: 'sm' },
    makeListGroup: { items: ['a', 'b'] },
    makePagination:{ pages: 5, currentPage: 2 },
    makeInput:     { label: 'Email', type: 'email', placeholder: 'you@x.com' },
    makeTextarea:  { label: 'Bio', rows: 3 },
    makeSelect:    { label: 'Pick', options: [{ value: '1', label: 'One' }] },
    makeCheckbox:  { label: 'Agree' },
    makeRadio:     { label: 'Yes', name: 'g' },
    makeSwitch:    { label: 'On' },
    makeRange:     { label: 'Vol', min: 0, max: 10, value: 5 },
    makeForm:      { fields: [{ type: 'text', name: 'n', label: 'Name' }] },
    makeFormGroup: { label: 'Name', input: { t: 'input' } },
    makeStepper:   { steps: [{ label: 'One', description: 'first' }] },
    makeTimeline:  { items: [{ title: 'T', content: 'c' }] },
    makeStatCard:  { label: 'Users', value: '1,024' },
    makeAvatar:    { initials: 'MC' },
    makeSkeleton:  { count: 3 },
    makeDropdown:  { trigger: 'More', items: [{ text: 'A', href: '#' }] },
    makeCarousel:  { items: ['one', 'two'] },
    makeTooltip:   { text: 'hover me', content: 'hi' },
    makePopover:   { trigger: 'click me', title: 'T', content: 'body' },
    makeChipInput: { label: 'Tags', values: ['a'] },
    makeSearchInput:{ placeholder: 'Search' },
    makeFileUpload:{ text: 'Upload' },
    makeMediaObject:{ title: 'T', content: 'c' },
    makeHero:      { title: 'Big', subtitle: 'small' },
    makeFeatureGrid:{ features: [{ title: 'Fast', description: 'yes' }] },
    makeCTA:       { title: 'Act', description: 'now', actions: [bw.makeButton({ text: 'Go' })] },
    makeSection:   { title: 'S', content: 'c' },
    makeContainer: { children: ['x'] },
    makeRow:       { children: [{ t: 'div', c: 'x' }] },
    makeCol:       { size: 6, content: 'x' },
    makeStack:     { children: ['a', 'b'] },
    makeButtonGroup:{ children: [bw.makeButton({ text: 'A' }), bw.makeButton({ text: 'B' })] },
    makeCodeDemo:  { title: 'Demo', code: 'var x = 1;', language: 'js' },
    makeTable:     { data: [{ a: 1 }], columns: [{ key: 'a', label: 'A' }], striped: true, sortable: true },
    makeTableFromArray: { data: [['A'], ['1']] },
    makeDataTable: { data: [{ a: 1 }], columns: [{ key: 'a', label: 'A' }] },
    makeBarChart:  { data: [{ label: 'x', value: 3 }] },
  };

  var factories = Object.keys(bw)
    .filter(function(k) {
      return /^make[A-Z]/.test(k) && k !== 'makeStyles' && typeof bw[k] === 'function';
    })
    .sort();

  it('covers every make* factory on bw', function() {
    assert.ok(factories.length >= 50, 'expected 50+ factories, found ' + factories.length);
    var missing = factories.filter(function(n) { return !(n in P); });
    assert.deepStrictEqual(missing, [],
      'add realistic props for these before they can be checked');
  });

  factories.forEach(function(name) {
    it(name + ' emits TACO verify accepts', function() {
      if (!(name in P)) return this.skip();
      var taco = bw[name](P[name]);
      assert.deepStrictEqual(verify(taco), [],
        name + ' emitted TACO with findings');
    });
  });

  it('every factory survives a JSON round-trip in wire mode', function() {
    // What bwserve does to a factory's output. Functions are dropped by
    // JSON.stringify, which is the point: what is left must still be valid.
    var bad = [];
    factories.forEach(function(name) {
      if (!(name in P)) return;
      var wire;
      try {
        wire = JSON.parse(JSON.stringify(bw[name](P[name])));
      } catch (e) {
        bad.push(name + ': not serialisable -- ' + e.message);
        return;
      }
      var f = verify(wire, { mode: 'wire' });
      if (f.length) bad.push(name + ': ' + JSON.stringify(f));
    });
    assert.deepStrictEqual(bad, []);
  });

  it('the prop table uses names the factories actually read', function() {
    // warnUnknownProps is the library's own check. If it fires, either a
    // factory renamed a prop or this table is wrong -- both worth failing on.
    var warnings = [];
    var origWarn = console.warn;
    bw._propWarnReset && bw._propWarnReset();
    console.warn = function() {
      var msg = Array.prototype.join.call(arguments, ' ');
      if (/unknown option/.test(msg)) warnings.push(msg);
    };
    try {
      factories.forEach(function(name) {
        if (name in P) bw[name](P[name]);
      });
    } finally {
      console.warn = origWarn;
    }
    assert.deepStrictEqual(warnings, [],
      'the props in this test are not the props the factories read');
  });
});

// =========================================================================
// Four false verdicts, from the 2026-10-11 review
//
// Each of these was a case where verify disagreed with the renderer. A
// checker that cries wolf gets switched off, and one that stays quiet about a
// crash is worse than none -- so all four are pinned here against the
// renderer's actual behaviour, not against a reading of it.
// =========================================================================

describe('verify: agreement with the renderer', function() {
  function errs(taco, opts) {
    return verify(taco, opts).filter(function(f) { return f.severity === 'error'; });
  }

  // 1. A real attribute is not a typo, however close it looks.
  it('does not call real HTML attributes typos', function() {
    // `form` is one insert from `for`; `is` one substitution from `id`. Both
    // are valid HTML and both rendered fine, so both failed --strict for no
    // reason.
    assert.deepStrictEqual(verify({ t: 'input', a: { form: 'f' } }), []);
    assert.deepStrictEqual(verify({ t: 'div', a: { is: 'x-foo' } }), []);
    assert.ok(/form="f"/.test(bw.html({ t: 'input', a: { form: 'f' } })),
      'precondition: the renderer forwards it');
  });

  it('still catches an actual typo', function() {
    var f = verify({ t: 'div', a: { clas: 'x' } });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'attr-typo');
    assert.strictEqual(f[0].hint, 'class');
  });

  // 2. The conditional class array is idiomatic and renders correctly.
  it('accepts a class array with falsy entries, as the renderer does', function() {
    var isOn = false;
    var taco = { t: 'div', a: { class: [isOn && 'bw_active', 'bw_btn'] }, c: 'x' };
    assert.deepStrictEqual(verify(taco), [],
      'filter(Boolean) drops it, so this is not an error');
    assert.strictEqual(bw.html(taco), '<div class="bw_btn">x</div>',
      'and the renderer agrees');
  });

  it('still rejects a truthy non-string in a class array', function() {
    // A truthy non-string survives filter(Boolean) and joins in as whatever
    // String() makes of it, which nobody meant.
    assert.strictEqual(errs({ t: 'div', a: { class: [7, 'bw_btn'] } })[0].code, 'bad-class');
  });

  // 3. Hook type checks must not depend on the mode.
  it('reports a non-function hook in wire mode too', function() {
    // Wire is the CLI default, so this was silent in exactly the place you
    // can least see it.
    var taco = { t: 'div', o: { mounted: 'init' } };
    assert.strictEqual(errs(taco)[0].code, 'opt-not-function');
    assert.strictEqual(errs(taco, { mode: 'wire' })[0].code, 'opt-not-function',
      'a string mounted cannot run in either mode');
  });

  it('reports a string handle, which crashes hydration', function() {
    var taco = { t: 'div', o: { handle: 'go' } };
    assert.strictEqual(errs(taco)[0].code, 'opt-not-object');
    assert.strictEqual(errs(taco, { mode: 'wire' })[0].code, 'opt-not-object');
    // The crash this prevents: the renderer iterates the value's keys and
    // calls .bind on each character. bw.create is enough to trigger it --
    // hydration happens there, no document needed.
    assert.throws(function() { bw.create(taco); }, /bind is not a function/,
      'precondition: a string handle really does crash hydration');
  });

  it('reports a string slots', function() {
    var taco = { t: 'div', o: { slots: 'body' } };
    assert.strictEqual(errs(taco)[0].code, 'opt-not-object');
  });

  it('still accepts a proper handle and slots', function() {
    assert.deepStrictEqual(verify({ t: 'div', o: { handle: { go: function() {} } } }), []);
    assert.deepStrictEqual(verify({ t: 'div', o: { slots: { title: '.t' } } }), []);
  });

  // 4. Wire mode must find a function wherever JSON would drop it.
  it('finds a function nested in o.state under wire mode', function() {
    var f = errs({ t: 'div', o: { state: { f: function() {} } } }, { mode: 'wire' });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'function-in-wire');
    assert.strictEqual(f[0].path, 'o.state.f', 'the path names where it hides');
  });

  it('finds one nested several levels down, with an array in the way', function() {
    var f = errs({ t: 'div', o: { state: { a: { b: [1, function() {}] } } } }, { mode: 'wire' });
    assert.strictEqual(f[0].path, 'o.state.a.b[1]');
  });

  it('finds a function inside an object attribute value', function() {
    var f = errs({ t: 'div', a: { style: { color: function() {} } } }, { mode: 'wire' });
    assert.strictEqual(f[0].code, 'function-in-wire');
    assert.strictEqual(f[0].path, 'a.style.color');
  });

  it('leaves nested functions alone in authored mode', function() {
    assert.deepStrictEqual(verify({ t: 'div', o: { state: { f: function() {} } } }), [],
      'authored state is JavaScript; a function in it is legal');
  });

  it('does not hang on cyclic state', function() {
    var cyc = {};
    cyc.self = cyc;
    assert.deepStrictEqual(verify({ t: 'div', o: { state: cyc } }, { mode: 'wire' }), [],
      'state is the caller data and may be cyclic');
  });

  it('does not flag clean data in wire mode', function() {
    assert.deepStrictEqual(
      verify({ t: 'div', a: { style: { color: 'red' } }, o: { state: { n: 1, s: 'x' } } }, { mode: 'wire' }),
      []);
  });
});

// ---------------------------------------------------------------------------
// SVG attributes are real attributes (#126). `d` is one deletion from `id`, so
// through 2.1.13 every <path> drew an attr-typo warning: 83 of 83 findings on
// one 5,000-line app were this one. The real-attribute list now carries the
// short SVG names that can collide, and the check below sweeps the whole
// surface rather than the one case, so a longer name never needs listing.
// ---------------------------------------------------------------------------

describe('attr-typo and SVG attributes (#126)', function() {
  it('a path d is not a typo of id', function() {
    assert.deepStrictEqual(verify({ t: 'svg', c: [{ t: 'path', a: { d: 'M0 0h10v10z' } }] }), []);
  });

  it('the SVG attribute surface is silent, including the four within one edit of a special name', function() {
    var names = ['d', 'r', 'x', 'y', 'cx', 'cy', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'dx', 'dy', 'fx', 'fy', 'fr',
      'in', 'in2', 'k1', 'k2', 'k3', 'k4', 'z', 'by', 'to', 'from', 'values', 'keyTimes', 'dur', 'begin', 'end',
      'repeatCount', 'attributeName', 'points', 'pathLength', 'viewBox', 'preserveAspectRatio', 'transform',
      'fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-dasharray', 'opacity',
      'clip-path', 'mask', 'filter', 'result', 'mode', 'stdDeviation', 'offset', 'stop-color', 'gradientUnits',
      'spreadMethod', 'markerWidth', 'refX', 'refY', 'orient', 'text-anchor', 'dominant-baseline', 'font-size',
      'xmlns', 'xlink:href', 'vector-effect'];
    var fired = names.filter(function(n) {
      var a = {}; a[n] = '1';
      return verify({ t: 'svg', c: [{ t: 'g', a: a }] }).some(function(f) { return f.code === 'attr-typo'; });
    });
    assert.deepStrictEqual(fired, []);
  });

  it('a real typo inside an svg still fires', function() {
    var f = verify({ t: 'svg', c: [{ t: 'rect', a: { clas: 'x' } }] });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].code, 'attr-typo');
    assert.strictEqual(f[0].hint, 'class');
  });
});
