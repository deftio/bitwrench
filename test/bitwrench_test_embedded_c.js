/**
 * The C/C++ embedded headers are shipped API too, and nothing was compiling
 * them. This suite builds a small program against `embedded_c/` with the
 * system compiler and checks what it prints -- so a typo in a macro, a C99
 * violation, or a bad PROGMEM header fails here rather than in someone's
 * Arduino IDE.
 *
 * Covers:
 *   - bitwrench.h / bwserve.h compile as C99 with -Wall -Werror
 *   - the protocol macros produce the wire format bw.apply() accepts
 *   - bw_parse_action / bw_action_field read a real post-back body
 *   - the client registry adds, drops and fans out
 *   - the generated bitwrench_embedded.h compiles and carries this version
 *   - the same headers compile as C++ (the namespace half)
 *   - BW_NEST / bw::nest compose a tree that stays parseable
 *   - the POSIX C++ demo, compiled and driven over a real socket, with its
 *     frames rendered into jsdom: the one end-to-end device-to-DOM check
 *   - both desktop demos teach the pattern (no raw DOM in what they serve)
 *
 * Skipped with a message when no compiler is present, so `npm test` still
 * works on a machine without build tools.
 *
 * WARNING -- clang and gcc are not interchangeable here, and CI uses gcc.
 * Two failures shipped to main in v2.1.11 because these tests were only ever
 * run against macOS clang:
 *
 *   1. gcc implements -Wformat-truncation (clang does not). Nesting a
 *      same-sized buffer is a hard error under -Wall -Werror, correctly: it
 *      can truncate. Every nesting level must be LARGER than its source.
 *   2. Argument evaluation order is unspecified in C. Several side-effecting
 *      calls in one printf() gave different results under the two compilers.
 *      One call per statement.
 *
 * Before trusting a change here, run it against gcc:
 *
 *   docker run --rm -v "$PWD":/w -w /w node:24-bookworm sh -c \
 *     'apt-get update -qq && apt-get install -y -qq build-essential && \
 *      npx mocha test/bitwrench_test_embedded_c.js -r jsdom-global/register --exit'
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { execFileSync, spawnSync, spawn } from 'child_process';
import http from 'http';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inc = join(root, 'embedded_c');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

function compiler(lang) {
  for (const cc of lang === 'c++' ? ['c++', 'g++', 'clang++'] : ['cc', 'gcc', 'clang']) {
    const probe = spawnSync(cc, ['--version'], { encoding: 'utf8' });
    if (!probe.error && probe.status === 0) return cc;
  }
  return null;
}

// Try to compile and report success, instead of throwing. Used by the
// strictness tests below, where a FAILED compile is the expected result.
function tryBuild(lang, source, extraFlags = []) {
  const cc = compiler(lang);
  if (!cc) return null;
  const dir = mkdtempSync(join(tmpdir(), 'bw-strict-'));
  const src = join(dir, lang === 'c++' ? 'probe.cpp' : 'probe.c');
  writeFileSync(src, source);
  const r = spawnSync(cc, [
    src, '-I', inc, '-o', join(dir, 'probe'),
    lang === 'c++' ? '-std=c++11' : '-std=c99',
    '-Wall', '-Wextra', '-Werror', ...extraFlags
  ], { encoding: 'utf8' });
  return { ok: r.status === 0, stderr: r.stderr || '' };
}

// gcc implements -Wformat-truncation; clang does not. Several checks below only
// mean something under gcc, so they are skipped elsewhere rather than asserted
// falsely. `npm run test:gcc` runs this suite under gcc in Docker.
function hasFormatTruncation() {
  const probe = tryBuild('c', [
    '#include <stdio.h>',
    'int main(void) {',
    '  char small[8]; char big[64];',
    '  snprintf(big, sizeof big, "x");',
    '  snprintf(small, sizeof small, "%s", big);',
    '  return 0;',
    '}'
  ].join('\n'));
  return probe === null ? null : !probe.ok;
}

function buildAndRun(lang, source, extraFlags = []) {
  const cc = compiler(lang);
  if (!cc) return null;
  const dir = mkdtempSync(join(tmpdir(), 'bw-embedded-'));
  const src = join(dir, lang === 'c++' ? 'probe.cpp' : 'probe.c');
  const bin = join(dir, 'probe');
  writeFileSync(src, source);
  execFileSync(cc, [
    src, '-I', inc, '-o', bin,
    lang === 'c++' ? '-std=c++11' : '-std=c99',
    '-Wall', '-Werror', ...extraFlags
  ], { encoding: 'utf8' });
  return execFileSync(bin, { encoding: 'utf8' });
}

describe('Embedded C headers compile and behave', function() {
  this.timeout(60000);

  it('protocol macros produce messages bw.parseJSONFlex() accepts', function() {
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bwserve.h"
int main(void) {
  char taco[BW_TACO_BUF_SIZE];
  char buf[BW_BUF_SIZE];
  BW_TACO(taco, "h1", "ESP32 is alive");
  BW_MOUNT(buf, "#app", taco);
  printf("%s\\n", buf);
  BW_TACO_CLS(taco, "div", "bw_bccl_card", "Sensors");
  BW_APPEND(buf, "#log", taco);
  printf("%s\\n", buf);
  BW_PATCH(buf, "temp", "21.5C");
  printf("%s\\n", buf);
  BW_PATCH_NUM(buf, "count", 42);
  printf("%s\\n", buf);
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    lines.forEach(function(l) {
      assert.match(l, /^r\{'v':1,'type':'(mount|append|patch)'/, l);
      // the contract that matters: the browser half must be able to read it
      var parsed = bw.parseJSONFlex(l);
      assert.ok(parsed && parsed.type, 'bw.parseJSONFlex rejected: ' + l);
    });
    assert.strictEqual(bw.parseJSONFlex(lines[0]).taco.t, 'h1');
    assert.strictEqual(bw.parseJSONFlex(lines[1]).taco.a.class, 'bw_bccl_card');
    assert.match(lines[2], /21\.5C/);
    assert.match(lines[3], /42/);
  });

  it('a nested TACO keeps no r-prefix (it would not parse)', function() {
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bwserve.h"
int main(void) {
  char taco[BW_TACO_BUF_SIZE], buf[BW_BUF_SIZE];
  BW_TACO(taco, "p", "x");
  BW_MOUNT(buf, "#app", taco);
  printf("%s\\n", buf);
  /* batching strips it too */
  bw_batch_t b;
  bw_batch_begin(&b);
  bw_batch_add(&b, buf);
  BW_PATCH(buf, "n", "1");
  bw_batch_add(&b, buf);
  bw_batch_end(buf, sizeof buf, &b);
  printf("%s\\n", buf);
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    lines.forEach(function(l) {
      assert.ok(l.indexOf(':r{') < 0, 'nested r-prefix in: ' + l);
      assert.ok(bw.parseJSONFlex(l), 'did not parse: ' + l);
    });
  });

  it('bw_parse_action and bw_action_field read a real post-back body', function() {
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bwserve.h"
int main(void) {
  /* what the thin client actually posts to /bw/return/action/<id> */
  const char *body =
    "{\\"requestId\\":null,\\"route\\":\\"action\\","
    "\\"result\\":{\\"action\\":\\"gpio-toggle\\",\\"data\\":{\\"pin\\":17,\\"label\\":\\"relay 1\\"}}}";
  bw_action_t act;
  char pin[8], label[32];
  printf("found=%d name=%s\\n", bw_parse_action(body, &act), act.action);
  bw_action_field(&act, "pin", pin, sizeof pin);
  bw_action_field(&act, "label", label, sizeof label);
  printf("pin=%s label=%s\\n", pin, label);

  /* the relaxed single-quoted form, and a message with no data */
  const char *relaxed = "r{'result':{'action':'save','data':{'id':'7'}}}";
  bw_action_t act2;
  char id[8];
  bw_parse_action(relaxed, &act2);
  bw_action_field(&act2, "id", id, sizeof id);
  printf("relaxed=%s id=%s\\n", act2.action, id);

  bw_action_t act3;
  printf("none=%d name=[%s]\\n", bw_parse_action("{\\"route\\":\\"event\\"}", &act3), act3.action);
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    assert.strictEqual(lines[0], 'found=1 name=gpio-toggle');
    assert.strictEqual(lines[1], 'pin=17 label=relay 1');
    assert.strictEqual(lines[2], 'relaxed=save id=7');
    assert.strictEqual(lines[3], 'none=0 name=[]');
  });

  it('the client registry adds, de-duplicates, drops and fans out', function() {
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bwserve.h"
static int sent_to[8];
static int sent_n = 0;
static int fake_send(int handle, const char *frame, void *user) {
  (void)frame; (void)user;
  sent_to[sent_n++] = handle;
  return handle == 9 ? 0 : 1;      /* client 9 is dead */
}
int main(void) {
  bw_clients_t c;
  bw_clients_init(&c);
  /* One call per statement. Argument evaluation order is UNSPECIFIED in C, so
     several side-effecting calls in one printf() gave different results under
     clang and gcc -- which is how this test passed locally and failed in CI. */
  int a1 = bw_clients_add(&c, 3);
  int a2 = bw_clients_add(&c, 5);
  int a3 = bw_clients_add(&c, 9);
  int dup = bw_clients_add(&c, 3);
  printf("add=%d%d%d dup=%d count=%d\\n", a1, a2, a3, dup, c.count);

  int sent = bw_clients_each(&c, fake_send, "data: x\\n\\n", 0);
  printf("sent=%d count=%d\\n", sent, c.count);
  int again = bw_clients_each(&c, fake_send, "data: y\\n\\n", 0);
  printf("again=%d\\n", again);

  int rm = bw_clients_remove(&c, 3);
  int missing = bw_clients_remove(&c, 77);
  printf("remove=%d missing=%d count=%d\\n", rm, missing, c.count);
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    assert.strictEqual(lines[0], 'add=111 dup=1 count=3', 'adds three, ignores the duplicate');
    assert.strictEqual(lines[1], 'sent=2 count=2', 'the dead client is dropped during the fan-out');
    assert.strictEqual(lines[2], 'again=2', 'and stays dropped');
    assert.strictEqual(lines[3], 'remove=1 missing=0 count=1');
  });

  it('nesting macros strip the child r-prefix, so a tree stays parseable', function() {
    // The r-prefix is a message marker. A nested one makes the whole frame
    // unparseable, and bw.connect() swallows the error -- so the symptom is a
    // UI that silently never appears. Every composition path must strip it.
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bwserve.h"
int main(void) {
  /* Each level up needs MORE room than its source: nesting grows the string.
     GCC's -Wformat-truncation enforces this and is right to -- a same-sized
     destination can silently truncate. */
  char a[BW_TACO_BUF_SIZE], b[BW_TACO_BUF_SIZE];
  char kids[BW_BUF_SIZE];
  char tree[BW_BUF_SIZE * 2];
  char msg[BW_BUF_SIZE * 4];

  BW_TACO_ID(a, "span", "temp", "22.4 C");
  BW_TACO_CLS(b, "span", "bw_text_muted", "Temperature");
  BW_ARRAY_START(kids);
  BW_ARRAY_ITEM(kids, b);
  BW_ARRAY_ITEM(kids, a);
  BW_ARRAY_END(kids);

  BW_NEST_CLS(tree, "div", "bw_bccl_card", kids);
  BW_MOUNT(msg, "#app", tree);
  printf("%s\\n", msg);

  /* Three levels, and the attribute form. Each level needs its own buffer --
     snprintf() into the buffer it is reading from is undefined -- and each
     must be larger than the level below it. */
  char mid[BW_BUF_SIZE * 2];
  char outer[BW_BUF_SIZE * 4];
  char msg2[BW_BUF_SIZE * 8];
  BW_NEST_ATTR(mid, "section", "'id':'readings'", kids);
  BW_NEST(outer, "div", mid);
  BW_MOUNT(msg2, "#app", outer);
  printf("%s\\n", msg2);
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    lines.forEach(function(l) {
      assert.ok(l.indexOf(':r{') < 0 && l.indexOf('[r{') < 0 && l.indexOf(',r{') < 0,
        'nested r-prefix survived: ' + l);
      assert.ok(bw.parseJSONFlex(l), 'frame did not parse: ' + l);
    });

    const card = bw.parseJSONFlex(lines[0]).taco;
    assert.strictEqual(card.a.class, 'bw_bccl_card');
    assert.strictEqual(card.c.length, 2, 'array children survived as an array');
    assert.strictEqual(card.c[1].a.id, 'temp');

    const deep = bw.parseJSONFlex(lines[1]).taco;
    assert.strictEqual(deep.c.a.id, 'readings');
    assert.strictEqual(deep.c.c[0].c, 'Temperature', 'three levels deep');
  });

  it('bw_action_field falls back to top-level fields (bw.actions shape)', function() {
    // bitwrench core's bw.actions.enable() posts {v,type,action,value,name},
    // with no `data` object. Firmware should not need a second code path.
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bwserve.h"
int main(void) {
  const char *body =
    "{\\"v\\":1,\\"type\\":\\"event\\",\\"action\\":\\"set_mode\\","
    "\\"value\\":\\"eco\\",\\"name\\":\\"mode\\",\\"ref\\":\\"bw_uuid_7\\"}";
  bw_action_t act;
  char value[16], name[16], missing[8];
  printf("found=%d action=%s\\n", bw_parse_action(body, &act), act.action);
  printf("data=%d\\n", act.data == 0);
  bw_action_field(&act, "value", value, sizeof value);
  bw_action_field(&act, "name", name, sizeof name);
  printf("value=%s name=%s\\n", value, name);
  printf("missing=%d [%s]\\n", bw_action_field(&act, "nope", missing, sizeof missing), missing);
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    assert.strictEqual(lines[0], 'found=1 action=set_mode');
    assert.strictEqual(lines[1], 'data=1', 'this shape carries no data object');
    assert.strictEqual(lines[2], 'value=eco name=mode');
    assert.strictEqual(lines[3], 'missing=0 []');
  });

  it('the C++ composition helpers build a tree bw.apply() can render', function() {
    const out = buildAndRun('c++', `
#include <cstdio>
#include <vector>
#include "bwserve.h"
int main() {
  std::vector<std::string> rows;
  for (int i = 1; i <= 3; i++) {
    char n[8];
    std::snprintf(n, sizeof n, "ch %d", i);
    rows.push_back(bw::taco("li", n));
  }
  std::string page = bw::nest("div", "bw_bccl_card", bw::array({
    bw::taco_attr("h2", "'id':'title','class':'bw_mb_1'", "Readings"),
    bw::nest("ul", bw::array(rows))
  }));
  std::printf("%s\\n", bwserve::mount("#app", page).c_str());

  std::vector<std::string> ops;
  ops.push_back(bwserve::patch("title", "Live"));
  ops.push_back(bwserve::patch_num("count", 3));
  std::printf("%s\\n", bwserve::batch(ops).c_str());
  return 0;
}
`);
    if (out === null) return this.skip();
    const lines = out.trim().split('\n');
    lines.forEach(function(l) {
      assert.ok(l.indexOf(':r{') < 0 && l.indexOf('[r{') < 0 && l.indexOf(',r{') < 0,
        'nested r-prefix survived: ' + l);
    });

    // Render it, rather than only parsing it: the contract is that a device
    // string becomes real DOM without the firmware author writing any JS.
    document.body.innerHTML = '<div id="bw_cpp_probe"></div>';
    const msg = bw.parseJSONFlex(lines[0]);
    msg.ref = '#bw_cpp_probe';
    assert.strictEqual(bw.apply(msg), true, 'mount was rejected');
    assert.strictEqual(bw.$('#bw_cpp_probe li').length, 3, 'vector children rendered');
    assert.strictEqual(bw.el('title').textContent, 'Readings');

    const b = bw.parseJSONFlex(lines[1]);
    assert.strictEqual(b.ops.length, 2, 'vector batch carried both ops');
    assert.strictEqual(bw.apply(b.ops[0]), true);
    assert.strictEqual(bw.el('title').textContent, 'Live');
  });

  it('the generated embedded header compiles and carries this version', function() {
    const header = join(inc, 'bitwrench_embedded.h');
    if (!existsSync(header)) return this.skip();   // build:generated has not run
    const out = buildAndRun('c', `
#include <stdio.h>
#include "bitwrench_embedded.h"
int main(void) {
  printf("version=%s len=%u first=%02x%02x\\n",
    BITWRENCH_EMBEDDED_VERSION, bitwrench_js_gz_len,
    bitwrench_js_gz[0], bitwrench_js_gz[1]);
  return 0;
}
`);
    if (out === null) return this.skip();
    assert.match(out, new RegExp('version=' + version.replace(/\./g, '\\.')),
      'header is stale: re-run npm run build:generated');
    // gzip magic number, so the payload really is the compressed bundle
    assert.match(out, /first=1f8b/);
    const len = Number(/len=(\d+)/.exec(out)[1]);
    assert.ok(len > 20000 && len < 80000, 'payload length looks wrong: ' + len);
  });

  it('every header resolves on the Arduino include path (src/ only)', function() {
    // Arduino's recursive layout puts ONLY src/ on the include path, which is
    // why src/*.h are forwarding shims. The flash-array headers had no shim,
    // so `#include <bitwrench_embedded.h>` -- the thing the generated header's
    // own docs tell you to write -- did not compile in the Arduino IDE.
    const cc = compiler('c');
    if (!cc || !existsSync(join(inc, 'bitwrench_embedded.h'))) return this.skip();
    const shims = join(root, 'src');
    ['bitwrench.h', 'bwserve.h', 'bitwrench_embedded.h', 'bitwrench_embedded_lean.h']
      .forEach(function(h) {
        assert.ok(existsSync(join(shims, h)), 'missing Arduino shim: src/' + h);
      });

    const dir = mkdtempSync(join(tmpdir(), 'bw-arduino-'));
    const src = join(dir, 'probe.c');
    const bin = join(dir, 'probe');
    writeFileSync(src, [
      '#include <bitwrench.h>',
      '#include <bwserve.h>',
      '#include <bitwrench_embedded.h>',
      '#include <stdio.h>',
      'int main(void) {',
      '  char t[BW_TACO_BUF_SIZE], m[BW_BUF_SIZE];',
      '  BW_TACO(t, "h1", "hi");',
      '  BW_MOUNT(m, "#app", t);',
      '  printf("%s|%s|%u", m, BITWRENCH_EMBEDDED_VERSION, bitwrench_js_gz_len);',
      '  return 0;',
      '}'
    ].join('\n'));
    // -I src ONLY: exactly what the Arduino toolchain gives a sketch.
    execFileSync(cc, [src, '-I', shims, '-o', bin, '-std=c99', '-Wall', '-Werror'],
      { encoding: 'utf8' });
    const out = execFileSync(bin, { encoding: 'utf8' }).trim().split('|');
    assert.ok(bw.parseJSONFlex(out[0]), 'macro output via the shim path did not parse');
    assert.strictEqual(out[1], version, 'shim resolved a stale embedded header');
    assert.ok(Number(out[2]) > 20000);
  });

  it('compiles as C++ too, including the bwserve namespace', function() {
    const out = buildAndRun('c++', `
#include <cstdio>
#include "bwserve.h"
int main() {
  std::string m = bwserve::mount("#app", bw::taco("p", "hi"));
  std::printf("%s\\n", m.c_str());
  std::printf("%s", bwserve::sse_frame("x").c_str());
  bw_action_t act;
  bw_parse_action("{'result':{'action':'ping'}}", &act);
  std::printf("cpp-action=%s\\n", act.action);
  return 0;
}
`);
    if (out === null) return this.skip();
    assert.match(out, /^r\{'v':1,'type':'mount'/);
    assert.match(out, /data: x\n\n/);
    assert.match(out, /cpp-action=ping/);
  });
});

/**
 * The POSIX C++ demo is the one place where both halves of bitwrench run at
 * once: a C++ process serves the bundle out of flash and pushes protocol
 * frames, and the browser half renders them. This suite compiles it, runs it,
 * talks to it over a real socket, and applies what comes back into jsdom.
 *
 * It is the end-to-end test for the embedded story -- if a header change
 * breaks the device-to-DOM path, it fails here.
 */
/**
 * The rules that only a strict Linux toolchain enforces.
 *
 * v2.1.11 shipped to main with three failures of exactly this kind, because
 * the suite had only ever run against macOS clang. These tests encode the
 * rules so the knowledge lives in the suite rather than in a commit message.
 */
describe('The headers survive a strict compiler', function() {
  this.timeout(60000);

  const NEST_SAME_SIZE = [
    '#include <stdio.h>',
    '#include "bitwrench.h"',
    'int main(void) {',
    '  char leaf[BW_TACO_BUF_SIZE];',
    '  char kids[BW_BUF_SIZE];',
    '  char same[BW_BUF_SIZE];        /* deliberately NOT larger than kids */',
    '  BW_TACO_CLS(leaf, "div", "x", "y");',
    '  BW_ARRAY_START(kids); BW_ARRAY_ITEM(kids, leaf); BW_ARRAY_END(kids);',
    '  BW_NEST(same, "div", kids);',
    '  printf("%s", same);',
    '  return 0;',
    '}'
  ].join('\n');

  const NEST_ESCALATING = NEST_SAME_SIZE
    .replace('char same[BW_BUF_SIZE];        /* deliberately NOT larger than kids */',
             'char same[BW_BUF_SIZE * 2];');

  it('the headers compile clean on their own, with no nested comments', function() {
    // A `/*` inside a doc block ends the comment early and the rest of the
    // header becomes code. It broke bitwrench.h once, found only by gcc.
    const out = tryBuild('c', [
      '#include "bitwrench.h"',
      '#include "bwserve.h"',
      'int main(void) { return 0; }'
    ].join('\n'));
    if (out === null) return this.skip();
    assert.ok(out.ok, 'the headers do not compile standalone:\n' + out.stderr);
    assert.ok(!/within comment/.test(out.stderr), 'nested comment in a header');
  });

  it('a nesting destination must be larger than its source', function() {
    const strict = hasFormatTruncation();
    if (strict === null) return this.skip();
    if (!strict) {
      // clang: the rule still holds, it just is not enforced here.
      return this.skip();
    }
    const same = tryBuild('c', NEST_SAME_SIZE);
    assert.ok(!same.ok,
      'a same-sized nest compiled clean -- the truncation rule is no longer enforced, ' +
      'so this test can no longer protect the documented examples');
    assert.match(same.stderr, /truncat/i);

    const bigger = tryBuild('c', NEST_ESCALATING);
    assert.ok(bigger.ok, 'escalating buffers should compile clean:\n' + bigger.stderr);
  });

  it('every documented buffer example compiles under -Wall -Wextra -Werror', function() {
    // The examples in embedded_c/README.md and the BW_NEST docblock are what
    // people copy. Before 2.1.11 they used same-sized buffers and could not
    // be built by anyone using -Werror, which is normal in firmware.
    const docExample = [
      '#include <stdio.h>',
      '#include "bwserve.h"',
      'int main(void) {',
      '  char label[256], value[256];',
      '  char kids[512];',
      '  char card[1024];',
      '  char msg[2048];',
      '  BW_TACO_CLS(label, "div", "bw_text_muted", "Temperature");',
      '  BW_TACO_ID(value, "div", "val-temp", "22.4 C");',
      '  BW_ARRAY_START(kids);',
      '  BW_ARRAY_ITEM(kids, label);',
      '  BW_ARRAY_ITEM(kids, value);',
      '  BW_ARRAY_END(kids);',
      '  BW_NEST_CLS(card, "div", "bw_bccl_card bw_p_3", kids);',
      '  BW_MOUNT(msg, "#app", card);',
      '  printf("%s", msg);',
      '  return 0;',
      '}'
    ].join('\n');
    const out = tryBuild('c', docExample);
    if (out === null) return this.skip();
    assert.ok(out.ok, 'the documented example does not compile:\n' + out.stderr);
  });

  it('the registry test does not depend on argument evaluation order', function() {
    // Unspecified in C. Four side-effecting calls in one printf() gave
    // different answers under clang and gcc, which is how a green local run
    // became a red CI run.
    const src = readFileSync(join(root, 'test', 'bitwrench_test_embedded_c.js'), 'utf8');
    // Only the C probe inside the registry test, not this file's own prose --
    // an earlier version of this check matched its own regex literal.
    const probe = /bw_clients_init\(&c\);([\s\S]*?)return 0;/.exec(src);
    assert.ok(probe, 'could not find the registry probe');
    // Strip C comments first: the prose in this very probe mentions printf()
    // and would otherwise match across the comment into the next statement.
    const body = probe[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const calls = (body.match(/bw_clients_(add|remove|each)\(/g) || []).length;
    const printfArgs = (body.match(/printf\([^;]*bw_clients_/g) || []).length;
    assert.ok(calls > 0, 'no registry calls found');
    assert.strictEqual(printfArgs, 0,
      'a bw_clients_* call is still inside a printf() argument list; assign it ' +
      'to a variable first so the order is specified');
  });
});

describe('The POSIX C++ demo serves a real bitwrench app', function() {
  this.timeout(120000);

  const demo = join(root, 'examples', 'embedded', 'posix-cpp', 'main.cpp');
  let proc = null;
  let port = 0;
  let frames = [];

  function get(path, opts) {
    return new Promise(function(resolve, reject) {
      const req = http.request({ host: '127.0.0.1', port: port, path: path,
        method: (opts && opts.method) || 'GET' }, function(res) {
        const chunks = [];
        res.on('data', function(c) { chunks.push(c); });
        res.on('end', function() {
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) });
        });
      });
      req.on('error', reject);
      if (opts && opts.body) req.write(opts.body);
      req.end();
    });
  }

  before(async function() {
    const cc = compiler('c++');
    if (!cc || !existsSync(join(inc, 'bitwrench_embedded.h'))) return this.skip();

    const dir = mkdtempSync(join(tmpdir(), 'bw-posix-cpp-'));
    const bin = join(dir, 'bwserve_cpp');
    // -Werror: the demo is the template people copy, so it has to be clean.
    execFileSync(cc, [demo, '-I', inc, '-o', bin, '-std=c++11', '-Wall', '-Wextra', '-Werror'],
      { encoding: 'utf8' });

    port = 20000 + Math.floor(Math.random() * 20000);
    proc = spawn(bin, [String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Wait for the banner rather than sleeping: a port clash should fail
    // loudly here instead of as a confusing timeout later.
    await new Promise(function(resolve, reject) {
      let out = '';
      const timer = setTimeout(function() { reject(new Error('server did not start: ' + out)); }, 10000);
      proc.stdout.on('data', function(d) {
        out += d.toString();
        if (out.indexOf('serving /bitwrench.js') !== -1) { clearTimeout(timer); resolve(); }
      });
      proc.on('exit', function(code) { clearTimeout(timer); reject(new Error('exited ' + code + ': ' + out)); });
    });

    // One SSE connection, held open across the action post so the pushes it
    // triggers land in the same stream.
    frames = await new Promise(function(resolve) {
      const collected = [];
      const req = http.get({ host: '127.0.0.1', port: port, path: '/bw/events' }, function(res) {
        let buf = '';
        res.on('data', function(c) {
          buf += c.toString();
          let i;
          while ((i = buf.indexOf('\n\n')) !== -1) {
            const frame = buf.slice(0, i).replace(/^data: /, '');
            buf = buf.slice(i + 2);
            if (frame) collected.push(frame);
          }
        });
      });
      // Act the way bw.actions does: a button click, then a typed value and a
      // select change. The label deliberately contains an apostrophe and a
      // tag -- the apostrophe would break the relaxed-JSON frame if the device
      // did not escape it, and the tag would be markup if bitwrench did not.
      setTimeout(function() {
        get('/bw/events', { method: 'POST',
          body: '{"v":1,"type":"event","action":"led_toggle","value":null,"name":null}' });
        get('/bw/events', { method: 'POST',
          body: JSON.stringify({ v: 1, type: 'event', action: 'set_label',
            value: "Barry's <b>rig</b>", name: 'label' }) });
      }, 600);
      // Later, so the 1-second reading batches land first: raising the
      // interval to 5s would otherwise stop the ticks inside this window.
      setTimeout(function() {
        get('/bw/events', { method: 'POST',
          body: '{"v":1,"type":"event","action":"set_rate","value":"5","name":"rate"}' });
      }, 2200);
      setTimeout(function() { req.destroy(); resolve(collected); }, 3000);
    });
  });

  after(function() { if (proc) proc.kill('SIGKILL'); });

  it('serves the gzipped bundle out of the flash array, not a CDN', async function() {
    const res = await get('/bitwrench.js');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-encoding'], 'gzip');
    assert.match(res.headers['content-type'], /javascript/);
    assert.strictEqual(res.body[0], 0x1f, 'not gzip');
    assert.strictEqual(res.body[1], 0x8b);
    assert.strictEqual(res.body.length, Number(res.headers['content-length']));
  });

  it('serves a bootstrap page that contains no UI and no DOM code', async function() {
    const html = (await get('/')).body.toString();
    assert.match(html, /<script src="\/bitwrench\.js"><\/script>/);
    assert.match(html, /bw\.connect\('\/bw\/events'\)/);
    assert.match(html, /bw\.actions\.enable\(\)/);
    // The whole point: the page ships no markup and touches no DOM API.
    assert.ok(!/document\.|innerHTML|getElementById/.test(html),
      'bootstrap page reached for the DOM directly');
  });

  it('pushes frames the browser half parses and renders', function() {
    if (!frames.length) return this.skip();
    frames.forEach(function(f) {
      assert.ok(bw.parseJSONFlex(f), 'frame did not parse: ' + f.slice(0, 120));
    });

    document.body.innerHTML = '<div id="app"></div>';
    let applied = 0;
    frames.forEach(function(f) { if (bw.apply(bw.parseJSONFlex(f))) applied++; });
    assert.strictEqual(applied, frames.length, 'some frames were rejected by bw.apply');

    // The mount built four cards in C++; the patches filled them in.
    assert.strictEqual(bw.$('#app .bw_bccl_card').length, 4);
    assert.match(bw.el('temp').textContent, /^\d+\.\d+ C$/);
    assert.match(bw.el('uptime').textContent, /^\d+s$/);
  });

  // Every op the device sent, with batches flattened.
  function ops() {
    const out = [];
    frames.map(function(f) { return bw.parseJSONFlex(f); }).forEach(function(m) {
      if (m.type === 'batch') out.push.apply(out, m.ops);
      else out.push(m);
    });
    return out;
  }

  it('carries a typed value to the device and back, escaped (bw_action_field)', function() {
    if (!frames.length) return this.skip();
    document.body.innerHTML = '<div id="app"></div>';
    frames.forEach(function(f) { bw.apply(bw.parseJSONFlex(f)); });

    // The device echoed the label into the title. The apostrophe survived the
    // wire (bw::escape on the way out) and the tag is text, not markup
    // (bitwrench escapes content by default).
    const title = bw.el('title');
    assert.match(title.textContent, /Barry's <b>rig<\/b>/,
      'the typed value did not come back: ' + title.textContent);
    assert.strictEqual(title.children.length, 0, 'the typed tag became real markup');

    // The form is seeded from device state, so a reconnecting browser sees
    // what the device believes -- not an empty box.
    const input = bw.$('#app input')[0];
    assert.ok(input, 'no input in the mounted UI');
    assert.strictEqual(input.value, 'Bench unit 1');
    assert.strictEqual(input.getAttribute('name'), 'label');
    assert.match(input.className, /bw_act_set_label/, 'no bw_act_* class: the value cannot post back');

    const opts = bw.$('#app option');
    assert.strictEqual(opts.length, 3, 'the select was not built from the rate options');
    assert.ok(opts.some(function(o) { return o.selected; }), 'no option marked selected');
  });

  it('notifies the page over bw:message, which the page routes itself', function() {
    if (!frames.length) return this.skip();
    document.body.innerHTML = '<div id="app"></div>';
    // What the bootstrap page does, in one line and with no DOM access.
    const un = bw.sub('bw:message', function(m) { bw.patch('status', m.text); });
    frames.forEach(function(f) { bw.apply(bw.parseJSONFlex(f)); });
    assert.strictEqual(bw.el('status').textContent, 'pushing every 5s',
      'the device notification never reached the page');
    if (typeof un === 'function') un();
  });

  it('composes a frame larger than BW_BUF_SIZE without truncating', function() {
    if (!frames.length) return this.skip();
    // The C++ helpers build with std::string; the protocol wrappers used to
    // copy through a 512-byte buffer and cut the frame in half, silently.
    const mount = frames.map(function(f) { return f; })
      .filter(function(f) { return f.indexOf("'type':'mount'") !== -1; })[0];
    assert.ok(mount, 'no mount frame');
    assert.ok(mount.length > 2048, 'mount frame is too small to prove this: ' + mount.length);
    assert.ok(bw.parseJSONFlex(mount), 'the mount frame was truncated');
  });

  it('acts on a post-back: the click reached the device and came back', function() {
    if (!frames.length) return this.skip();
    const all = ops();
    const led = all.filter(function(m) { return m.type === 'patch' && m.ref === 'led'; });
    assert.ok(led.length, 'no led patch -- the action did not reach handle_action()');
    assert.match(led[0].text, /LED is ON/);
    // Styling follows the value, in the same op (patch_attr).
    assert.ok(led[0].attrs && /bw_bccl_alert_success/.test(led[0].attrs.class),
      'the alert colour did not come with the text');
    // The button label is the other thing that changed, and nothing else was
    // sent: a click costs two patches, not a re-mount.
    const btn = all.filter(function(m) { return m.type === 'patch' && m.ref === 'led_btn'; });
    assert.ok(btn.length && btn[0].text === 'LED off', 'button label did not follow state');
    assert.strictEqual(all.filter(function(m) { return m.type === 'mount'; }).length, 1,
      'the device re-mounted the page instead of patching what changed');

    const clicks = all.filter(function(m) { return m.type === 'patch' && m.ref === 'clicks'; });
    assert.ok(clicks.length && clicks[0].text === '1', 'click counter did not advance');
  });

  it('batches the per-tick patches into one frame', function() {
    if (!frames.length) return this.skip();
    const batches = frames.map(function(f) { return bw.parseJSONFlex(f); })
      .filter(function(m) { return m.type === 'batch'; });
    assert.ok(batches.length, 'no batch frame seen');
    const tick = batches.filter(function(b) {
      return b.ops.some(function(o) { return o.ref === 'temp'; });
    });
    assert.ok(tick.length, 'no reading batch seen');
    assert.strictEqual(tick[0].ops.length, 3, 'three readings, one frame');
    tick[0].ops.forEach(function(op) { assert.strictEqual(op.type, 'patch'); });
  });
});

/**
 * Both desktop demos are the files people copy when starting a device project,
 * so they have to compile clean and they have to teach the right pattern. The
 * C demo had drifted into serving a hand-written SSE client built on
 * document.getElementById and innerHTML -- which is the one thing the north
 * star forbids, and nothing was checking.
 */
describe('The desktop demos compile and teach the bitwrench pattern', function() {
  this.timeout(120000);

  const demos = [
    { name: 'cmake-demo (C99)', file: join(root, 'examples/embedded/cmake-demo/main.c'),
      lang: 'c', flags: ['-lpthread'] },
    { name: 'posix-cpp (C++11)', file: join(root, 'examples/embedded/posix-cpp/main.cpp'),
      lang: 'c++', flags: [] }
  ];

  demos.forEach(function(d) {
    it(d.name + ' compiles with -Wall -Wextra -Werror', function() {
      const cc = compiler(d.lang);
      if (!cc || !existsSync(join(inc, 'bitwrench_embedded.h'))) return this.skip();
      const dir = mkdtempSync(join(tmpdir(), 'bw-demo-'));
      execFileSync(cc, [d.file, '-I', inc, '-o', join(dir, 'demo'),
        d.lang === 'c++' ? '-std=c++11' : '-std=c99',
        '-Wall', '-Wextra', '-Werror', ...d.flags], { encoding: 'utf8' });
    });

    it(d.name + ' serves a page with no DOM code and no markup', function() {
      const src = readFileSync(d.file, 'utf8');
      // The served page: load bitwrench, style it, enable actions, connect.
      assert.match(src, /<script src=\\"\/bitwrench\.js\\"><\/script>/,
        'does not serve the bundle it embeds');
      assert.match(src, /bw\.connect\(/);
      assert.match(src, /bw\.actions\.enable\(\)/);
      assert.match(src, /bw\.loadStyles\(/, 'page has no theme, so it must be hand-styled');

      // The violation that actually happened, in the strings this file serves.
      ['document.getElementById', 'document.querySelector', 'innerHTML', 'onclick='].forEach(
        function(bad) {
          assert.ok(src.indexOf(bad) === -1,
            'the demo page reaches for the DOM directly: ' + bad);
        });
    });

    it(d.name + ' builds its UI from TACO, not HTML strings', function() {
      const src = readFileSync(d.file, 'utf8');
      assert.ok(/BW_NEST|bw::nest/.test(src), 'no composition: the UI cannot be a tree');
      assert.ok(/bw_act_/.test(src), 'no bw_act_* class: clicks cannot come back');
      assert.ok(/bw_clients_(init|add|each)/.test(src), 'not using the client registry');
      // A device sends component descriptions. A <div> in the device source
      // (outside the one bootstrap page) means someone went back to markup.
      const afterBootstrap = src.replace(/static const char BOOTSTRAP[\s\S]*?;\n/, '');
      assert.ok(!/<div|<span|<button/.test(afterBootstrap),
        'markup outside the bootstrap page');
    });
  });
});
