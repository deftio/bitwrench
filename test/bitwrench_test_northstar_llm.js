/**
 * northstar-llm — the audit-only north-star reviewer under tools/northstar-llm.
 *
 * The tool is not on any critical path (it never runs in CI or release), but
 * its pure functions are where a silent bug costs a 2-hour overnight run.
 * Every test here was written against a specific defect or a specific promise
 * in dev/northstar-llm.md.
 *
 * No test in this file makes a network call: the provider is injected.
 */

import assert from 'assert';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { rmSync } from 'fs';
import { fileURLToPath } from 'url';

import { chunkText, buildContextBlock, buildUserPrompt, buildSystemPrompt } from '../tools/northstar-llm/lib/prompt.js';
import { parseFindings } from '../tools/northstar-llm/lib/parse.js';
import { stripThinking, isRetryableStatus, chatCompletionRetrying, BACKOFF_MS } from '../tools/northstar-llm/lib/provider.js';
import { parseIgnorePragmas, filterFindingsByIgnore } from '../tools/northstar-llm/lib/ignore.js';
import { dedupeFindings } from '../tools/northstar-llm/lib/report.js';
import { parseDuration } from '../tools/northstar-llm/lib/config.js';
import { cmdRun } from '../tools/northstar-llm/lib/run.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const CHECKS = [
  { id: 'raw-dom', severity: 'high', cite: 'northstar#no-raw-dom', description: 'd', badHint: 'b', goodHint: 'g' },
  { id: 'palette-bypass', severity: 'medium', cite: 'northstar#tokens', description: 'd', badHint: 'b', goodHint: 'g' }
];

function findingJson(over) {
  return Object.assign(
    {
      file: 'pages/x.html',
      line: 10,
      endLine: 10,
      checkId: 'raw-dom',
      severity: 'high',
      evidence: 'innerHTML = ...',
      problem: 'uses innerHTML instead of TACO',
      recommendation: 'use bw.DOM',
      cite: 'northstar#no-raw-dom'
    },
    over || {}
  );
}

/** A provider stub. `replies` is consumed one call at a time. */
function fakeChat(replies, opts) {
  opts = opts || {};
  const calls = [];
  const fn = async function (provider, messages, runOpts) {
    calls.push({ messages, runOpts });
    const next = replies.shift();
    if (next === undefined) throw new Error('fakeChat: ran out of replies');
    if (typeof next === 'function') return next(messages, runOpts);
    if (next instanceof Error) throw next;
    return { content: next, raw: null, usage: null };
  };
  fn.calls = calls;
  return fn;
}

function retryableError(msg, status) {
  const e = new Error(msg || 'boom');
  e.retryable = true;
  if (status != null) e.status = status;
  return e;
}

function fatalError(msg, status) {
  const e = new Error(msg || 'bad request');
  e.retryable = false;
  e.status = status == null ? 400 : status;
  return e;
}

/**
 * A scratch corpus has to live INSIDE the repo: listScanFiles drops any path
 * whose repo-relative form starts with '..', so an os.tmpdir() corpus scans
 * zero files. dbg/ is the designated scratch area and is gitignored.
 */
const SCRATCH = join(REPO_ROOT, 'dbg', 'test-northstar');
const scratchDirs = [];

function makeScratch(prefix) {
  mkdirSync(SCRATCH, { recursive: true });
  const dir = mkdtempSync(join(SCRATCH, prefix));
  scratchDirs.push(dir);
  return dir;
}

/** Run cmdRun against a throwaway corpus + out dir, with an injected provider. */
async function runWith(files, replies, extraFlags) {
  const dir = makeScratch('run-');
  const corpus = join(dir, 'corpus');
  const out = join(dir, 'out');
  mkdirSync(corpus, { recursive: true });
  Object.keys(files).forEach((name) => writeFileSync(join(corpus, name), files[name], 'utf8'));

  const chat = fakeChat(replies.slice());
  const flags = Object.assign(
    {
      _: [],
      path: corpus,
      outDir: out,
      _chat: chat,
      _sleep: async () => {}
    },
    extraFlags || {}
  );
  const code = await cmdRun(flags);

  // The run dir is the single timestamped child of out/ (ignore the symlink).
  const kids = readdirSync(out).filter((n) => n !== 'latest');
  const runDir = join(out, kids[0]);
  const jsonl = existsSync(join(runDir, 'findings.jsonl'))
    ? readFileSync(join(runDir, 'findings.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
    : [];
  const meta = JSON.parse(readFileSync(join(runDir, 'meta.json'), 'utf8'));
  return { code, runDir, jsonl, meta, chat, out };
}

describe('northstar-llm', function () {

  after(function () {
    scratchDirs.forEach(function (d) {
      try { rmSync(d, { recursive: true, force: true }); } catch (e) { /* best effort */ }
    });
    // And the parent, so repeated runs leave nothing behind under dbg/.
    try { rmSync(SCRATCH, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  });

  // ---------------------------------------------------------------- chunking

  describe('chunkText', function () {
    it('leaves a small file as one chunk at offset 0', function () {
      const out = chunkText('a\nb\nc', 60000);
      assert.strictEqual(out.length, 1);
      assert.strictEqual(out[0].lineOffset, 0);
      assert.strictEqual(out[0].startLine, 1);
    });

    it('splits a long file and overlaps for boundary context', function () {
      const lines = [];
      for (let i = 1; i <= 400; i++) lines.push('line ' + i + ' ' + 'x'.repeat(40));
      const text = lines.join('\n');
      const out = chunkText(text, 4000);
      assert.ok(out.length > 1, 'expected multiple chunks');
      // Each chunk's lineOffset must point at its own first line.
      out.forEach(function (c) {
        const first = c.text.split('\n')[0];
        assert.strictEqual(first, lines[c.lineOffset], 'lineOffset must address the chunk start');
      });
      // Overlap is the documented reason report.js has to dedupe.
      const firstOfSecond = out[1].text.split('\n')[0];
      assert.ok(out[0].text.includes(firstOfSecond), 'chunks should overlap');
    });

    it('never loses a line across the split', function () {
      const lines = [];
      for (let i = 1; i <= 300; i++) lines.push('L' + i + ' ' + 'y'.repeat(50));
      const out = chunkText(lines.join('\n'), 3000);
      const seen = new Set();
      out.forEach((c) => c.text.split('\n').forEach((l) => seen.add(l)));
      lines.forEach((l) => assert.ok(seen.has(l), 'missing line: ' + l.slice(0, 12)));
    });
  });

  // ------------------------------------------------------------ context block

  describe('context block', function () {
    const base = {
      relPath: 'pages/04-dashboard.html',
      role: 'page',
      fileIndex: 33,
      fileCount: 89,
      chunkIndex: 1,
      chunkCount: 3,
      lineOffset: 1200,
      ignoredLineCount: 0,
      text: '<div></div>'
    };

    it('names the job, the file position and the chunk', function () {
      const block = buildContextBlock(base);
      assert.ok(/^job: northstar-llm audit/.test(block), 'job line first:\n' + block);
      assert.ok(block.includes('file: 34/89  pages/04-dashboard.html'), block);
      assert.ok(block.includes('chunk: 2/3'), block);
      assert.ok(block.includes('role: page'), block);
    });

    it('sits at the very top of the user message', function () {
      const user = buildUserPrompt(base);
      assert.ok(user.startsWith('job: northstar-llm audit'), user.slice(0, 120));
    });

    it('carries no clock, so the same file yields the same prompt', function () {
      // A finding that depends on the time of day is a bug. This also keeps
      // the request cacheable and run-to-run diffable.
      const a = buildUserPrompt(base);
      const b = buildUserPrompt(base);
      assert.strictEqual(a, b);
      assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(a), 'no ISO timestamp belongs in the prompt');
      assert.ok(!/elapsed|remaining|budget/i.test(a), 'no timing belongs in the prompt');
    });

    it('degrades gracefully when the file position is unknown', function () {
      const block = buildContextBlock(Object.assign({}, base, { fileIndex: null, fileCount: null }));
      assert.ok(block.includes('file: pages/04-dashboard.html'), block);
    });

    it('keeps the system prompt free of per-file data', function () {
      // The system prompt is the only cacheable part of the request.
      const sys = buildSystemPrompt(CHECKS, '(excerpts)', 12);
      assert.ok(!sys.includes('pages/04-dashboard.html'));
      assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(sys));
    });
  });

  // ------------------------------------------------------------------ parsing

  describe('parseFindings', function () {
    const opts = { checks: CHECKS, relPath: 'pages/x.html', maxFindings: 12 };

    it('accepts a bare array', function () {
      const r = parseFindings(JSON.stringify([findingJson()]), opts);
      assert.strictEqual(r.error, null);
      assert.strictEqual(r.findings.length, 1);
    });

    it('accepts {findings:[...]}', function () {
      const r = parseFindings(JSON.stringify({ findings: [findingJson()] }), opts);
      assert.strictEqual(r.findings.length, 1);
    });

    it('strips markdown fences a model adds anyway', function () {
      const r = parseFindings('```json\n' + JSON.stringify([findingJson()]) + '\n```', opts);
      assert.strictEqual(r.error, null);
      assert.strictEqual(r.findings.length, 1);
    });

    it('recovers JSON that follows a sentence of prose', function () {
      const r = parseFindings('Sure! Here are the findings:\n' + JSON.stringify([findingJson()]), opts);
      assert.strictEqual(r.error, null);
      assert.strictEqual(r.findings.length, 1);
    });

    it('reports an error for prose with no JSON at all', function () {
      const r = parseFindings('I could not find any problems in this file.', opts);
      assert.ok(r.error, 'expected a parse error');
      assert.deepStrictEqual(r.findings, []);
    });

    it('treats [] as clean, not as an error', function () {
      const r = parseFindings('[]', opts);
      assert.strictEqual(r.error, null);
      assert.deepStrictEqual(r.findings, []);
    });

    it('fills severity and cite from the rubric when the model omits them', function () {
      const r = parseFindings(
        JSON.stringify([{ checkId: 'palette-bypass', line: 4, problem: 'hex colour' }]),
        opts
      );
      assert.strictEqual(r.findings[0].severity, 'medium');
      assert.strictEqual(r.findings[0].cite, 'northstar#tokens');
    });

    it('drops a finding with no problem text', function () {
      const r = parseFindings(JSON.stringify([{ checkId: 'raw-dom', line: 2 }]), opts);
      assert.deepStrictEqual(r.findings, []);
    });

    it('caps at maxFindings, keeping the most severe', function () {
      const many = [];
      for (let i = 0; i < 10; i++) many.push(findingJson({ line: i, severity: 'low' }));
      many.push(findingJson({ line: 99, severity: 'high' }));
      const r = parseFindings(JSON.stringify(many), Object.assign({}, opts, { maxFindings: 3 }));
      assert.strictEqual(r.findings.length, 3);
      assert.strictEqual(r.findings[0].severity, 'high');
    });
  });

  describe('stripThinking', function () {
    it('removes <think> and <thinking> wrappers', function () {
      assert.strictEqual(stripThinking('<think>hmm</think>[]'), '[]');
      assert.strictEqual(stripThinking('<thinking>hmm</thinking>\n[]'), '[]');
    });

    it('is safe on empty input', function () {
      assert.strictEqual(stripThinking(''), '');
      assert.strictEqual(stripThinking(null), '');
    });
  });

  // ------------------------------------------------------------------ ignores

  describe('ignore pragmas', function () {
    it('ignores the line after ignore-next-line', function () {
      const t = ['ok', '// northstar-llm:ignore-next-line: demo', 'bad', 'ok'].join('\n');
      const ign = parseIgnorePragmas(t);
      assert.ok(ign.ignoredLines.has(3));
      assert.ok(!ign.ignoredLines.has(4));
    });

    it('ignores a start/end block inclusive', function () {
      const t = ['a', '// northstar-llm:ignore-start: wrong on purpose', 'b', 'c', '// northstar-llm:ignore-end', 'd'].join('\n');
      const ign = parseIgnorePragmas(t);
      [2, 3, 4, 5].forEach((n) => assert.ok(ign.ignoredLines.has(n), 'line ' + n));
      assert.ok(!ign.ignoredLines.has(6));
    });

    it('treats an unterminated block as running to end of file', function () {
      const t = ['a', '// northstar-llm:ignore-start: oops', 'b', 'c'].join('\n');
      const ign = parseIgnorePragmas(t);
      assert.ok(ign.ignoredLines.has(4));
    });

    it('filters findings on ignored lines but keeps line 0', function () {
      const ignored = new Set([3]);
      const kept = filterFindingsByIgnore(
        [findingJson({ line: 3 }), findingJson({ line: 4 }), findingJson({ line: 0 })],
        ignored
      );
      assert.deepStrictEqual(kept.map((f) => f.line), [4, 0]);
    });
  });

  // ------------------------------------------------------------------- dedupe

  describe('dedupeFindings', function () {
    it('collapses the same check on the same line of the same file', function () {
      const out = dedupeFindings([
        findingJson({ line: 10 }),
        findingJson({ line: 10 }),
        findingJson({ line: 11 })
      ]);
      assert.strictEqual(out.length, 2);
    });

    it('keeps different checks on one line', function () {
      const out = dedupeFindings([
        findingJson({ line: 10, checkId: 'raw-dom' }),
        findingJson({ line: 10, checkId: 'palette-bypass' })
      ]);
      assert.strictEqual(out.length, 2);
    });

    it('keeps the same check in different files', function () {
      const out = dedupeFindings([
        findingJson({ file: 'a.html' }),
        findingJson({ file: 'b.html' })
      ]);
      assert.strictEqual(out.length, 2);
    });
  });

  // ----------------------------------------------------------------- duration

  describe('parseDuration', function () {
    it('reads h / m / s / ms and bare ms', function () {
      assert.strictEqual(parseDuration('6h'), 21600000);
      assert.strictEqual(parseDuration('90m'), 5400000);
      assert.strictEqual(parseDuration('30s'), 30000);
      assert.strictEqual(parseDuration('250ms'), 250);
      assert.strictEqual(parseDuration(1500), 1500);
    });

    it('returns null for empty input', function () {
      assert.strictEqual(parseDuration(null), null);
      assert.strictEqual(parseDuration(''), null);
    });

    it('throws on nonsense rather than running forever', function () {
      assert.throws(() => parseDuration('soon'), /Cannot parse duration/);
      assert.throws(() => parseDuration('0'), /positive/);
      assert.throws(() => parseDuration('-5m'), /Cannot parse duration/);
    });
  });

  // -------------------------------------------------------------- retry ladder

  describe('retry ladder', function () {
    it('classifies 429 and 5xx as retryable, other 4xx as not', function () {
      assert.strictEqual(isRetryableStatus(429), true);
      assert.strictEqual(isRetryableStatus(500), true);
      assert.strictEqual(isRetryableStatus(503), true);
      assert.strictEqual(isRetryableStatus(400), false);
      assert.strictEqual(isRetryableStatus(404), false);
      assert.strictEqual(isRetryableStatus(401), false);
    });

    it('documents three waits', function () {
      assert.deepStrictEqual(BACKOFF_MS, [2000, 8000, 30000]);
    });
  });

  // --------------------------------------------------------- the run, end to end

  describe('cmdRun', function () {
    const CLEAN = JSON.stringify([]);
    const ONE = JSON.stringify([findingJson()]);

    it('writes findings, file_done and meta for a clean pass', async function () {
      const r = await runWith({ 'a.html': '<p>hi</p>' }, [ONE]);
      assert.strictEqual(r.code, 0);
      const done = r.jsonl.filter((o) => o.type === 'file_done');
      assert.strictEqual(done.length, 1);
      assert.strictEqual(done[0].incomplete, false);
      assert.strictEqual(r.jsonl.filter((o) => o.checkId).length, 1);
      assert.strictEqual(r.meta.filesScanned, 1);
      assert.strictEqual(r.meta.filesIncomplete, 0);
    });

    it('records timing in meta, where the clock belongs', async function () {
      const r = await runWith({ 'a.html': '<p>hi</p>' }, [ONE]);
      assert.ok(r.meta.startedAt, 'startedAt');
      assert.ok(r.meta.finishedAt, 'finishedAt');
      assert.strictEqual(typeof r.meta.elapsedMs, 'number');
      assert.strictEqual(r.meta.stoppedOnBudget, false);
    });

    // THE BUG. A file that fails on a later chunk used to `return`, throwing
    // away every finding its earlier chunks had produced and writing no
    // file_done at all.
    it('keeps earlier chunks findings when a later chunk fails', async function () {
      // Must exceed run.maxChunkChars (60000) to actually split into chunks.
      const big = [];
      for (let i = 0; i < 1600; i++) big.push('<p>line ' + i + ' ' + 'z'.repeat(60) + '</p>');
      const r = await runWith(
        { 'big.html': big.join('\n') },
        [ONE, retryableError('provider died', 503), retryableError('provider died', 503),
         retryableError('provider died', 503), retryableError('provider died', 503)],
        { maxRetries: 3 }
      );
      const kept = r.jsonl.filter((o) => o.checkId);
      assert.strictEqual(kept.length, 1, 'the first chunk\'s finding must survive');
      const done = r.jsonl.filter((o) => o.type === 'file_done');
      assert.strictEqual(done.length, 1, 'file_done must still be written');
      assert.strictEqual(done[0].incomplete, true, 'and must be marked incomplete');
      assert.strictEqual(r.meta.filesIncomplete, 1);
      const errs = r.jsonl.filter((o) => o.type === 'error');
      assert.strictEqual(errs[0].partialFindings, 1);
    });

    it('retries a 5xx and succeeds without marking the file incomplete', async function () {
      const r = await runWith({ 'a.html': '<p>hi</p>' }, [retryableError('503', 503), ONE]);
      assert.strictEqual(r.jsonl.filter((o) => o.checkId).length, 1);
      assert.strictEqual(r.jsonl.filter((o) => o.type === 'file_done')[0].incomplete, false);
      assert.ok(r.meta.callRetries >= 1, 'the retry should be counted in meta');
    });

    it('does not retry a 400 -- the same body fails the same way', async function () {
      const r = await runWith({ 'a.html': '<p>hi</p>' }, [fatalError('bad request', 400)]);
      assert.strictEqual(r.chat.calls.length, 1, 'exactly one attempt');
      const errs = r.jsonl.filter((o) => o.type === 'error');
      assert.strictEqual(errs[0].status, 400);
      assert.strictEqual(r.meta.callRetries, 0);
    });

    it('re-asks once when the model answers in prose, and recovers', async function () {
      const r = await runWith({ 'a.html': '<p>hi</p>' }, ['I found no problems.', ONE]);
      assert.strictEqual(r.chat.calls.length, 2, 'one re-ask');
      assert.strictEqual(r.jsonl.filter((o) => o.checkId).length, 1, 'the recovered finding');
      assert.strictEqual(r.meta.reasks, 1);
      // The re-ask must carry the bad reply and a corrective instruction.
      const second = r.chat.calls[1].messages;
      assert.strictEqual(second[second.length - 2].role, 'assistant');
      assert.ok(/not valid JSON/i.test(second[second.length - 1].content));
    });

    it('re-asks exactly once, then saves the raw reply to rejects/', async function () {
      const r = await runWith({ 'a.html': '<p>hi</p>' }, ['still prose', 'prose again']);
      assert.strictEqual(r.chat.calls.length, 2, 'never a third ask');
      const errs = r.jsonl.filter((o) => o.type === 'error');
      assert.ok(/unparseable after re-ask/.test(errs[0].message), errs[0].message);
      assert.ok(errs[0].reject, 'the error must point at the saved reply');
      const saved = readFileSync(join(r.runDir, errs[0].reject), 'utf8');
      assert.ok(saved.includes('still prose'), 'first reply saved in full');
      assert.ok(saved.includes('prose again'), 'second reply saved in full');
    });

    it('stops on budget, writes the report, and exits 0', async function () {
      const r = await runWith(
        { 'a.html': '<p>a</p>', 'b.html': '<p>b</p>', 'c.html': '<p>c</p>' },
        [ONE, ONE, ONE],
        { budget: '1ms' }
      );
      assert.strictEqual(r.code, 0, 'a budget stop is not a failure');
      assert.strictEqual(r.meta.stoppedOnBudget, true);
      assert.ok(r.meta.filesSkippedForBudget >= 1, 'some files were not started');
      assert.ok(existsSync(join(r.runDir, 'report.md')), 'the report is still written');
    });

    it('resume skips completed files but redoes incomplete ones', async function () {
      // First pass: one clean file, one that fails its only chunk.
      const dir = makeScratch('resume-');
      const corpus = join(dir, 'corpus');
      mkdirSync(corpus, { recursive: true });
      writeFileSync(join(corpus, 'a.html'), '<p>a</p>', 'utf8');
      writeFileSync(join(corpus, 'b.html'), '<p>b</p>', 'utf8');
      const out = join(dir, 'out');

      const first = fakeChat([ONE, fatalError('nope', 400)]);
      await cmdRun({ _: [], path: corpus, outDir: out, _chat: first, _sleep: async () => {} });
      const runDir = join(out, readdirSync(out).filter((n) => n !== 'latest')[0]);

      // Second pass resumes: a.html is done, b.html is incomplete -> redone.
      const second = fakeChat([ONE]);
      await cmdRun({
        _: [], path: corpus, outDir: out, _chat: second, _sleep: async () => {},
        resume: true, resumeDir: runDir
      });
      assert.strictEqual(second.calls.length, 1, 'only the incomplete file is re-audited');
      const askedFor = second.calls[0].messages[1].content;
      assert.ok(askedFor.includes('b.html'), 'and it is the incomplete one');
    });

    it('tells the model which file of how many it is on', async function () {
      const r = await runWith({ 'a.html': '<p>a</p>', 'b.html': '<p>b</p>' }, [CLEAN, CLEAN]);
      const userMsgs = r.chat.calls.map((c) => c.messages[1].content);
      assert.ok(userMsgs.some((m) => m.includes('file: 1/2')), 'first file position');
      assert.ok(userMsgs.some((m) => m.includes('file: 2/2')), 'second file position');
    });

    it('never writes outside the out dir', async function () {
      const r = await runWith({ 'a.html': '<p>a</p>' }, [ONE]);
      // The spec's acceptance criterion 4: audit only, never touches the corpus.
      assert.ok(r.runDir.startsWith(r.out), 'run dir inside out dir');
      assert.ok(existsSync(join(r.runDir, 'report.md')));
    });
  });
});
