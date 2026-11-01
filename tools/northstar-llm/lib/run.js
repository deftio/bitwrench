import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
  existsSync,
  symlinkSync,
  unlinkSync,
  readdirSync
} from 'fs';
import { join, relative, resolve } from 'path';
import { execSync } from 'child_process';
import {
  REPO_ROOT,
  loadConfig,
  applyCliOverrides,
  resolveProvider,
  loadChecks,
  loadRubricExcerpts
} from './config.js';
import { listScanFiles, fileRole } from './walk.js';
import { parseIgnorePragmas, filterFindingsByIgnore } from './ignore.js';
import { chatCompletionRetrying, pingProvider } from './provider.js';
import { buildSystemPrompt, buildUserPrompt, chunkText } from './prompt.js';
import { parseFindings, severityOrder } from './parse.js';
import { writeReport, loadJsonlFindings } from './report.js';

function gitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
}

function stampDirName(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

function ensureRunDir(outDirRel, resumeDir) {
  var base = resolve(REPO_ROOT, outDirRel);
  mkdirSync(base, { recursive: true });
  if (resumeDir) {
    var abs = resolve(REPO_ROOT, resumeDir);
    if (!existsSync(abs)) throw new Error('--resume dir not found: ' + abs);
    return abs;
  }
  var name = stampDirName(new Date());
  var runDir = join(base, name);
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

function linkLatest(outDirRel, runDir) {
  var base = resolve(REPO_ROOT, outDirRel);
  var latest = join(base, 'latest');
  try {
    if (existsSync(latest)) unlinkSync(latest);
  } catch (e) {
    /* ignore */
  }
  try {
    symlinkSync(runDir, latest, 'dir');
  } catch (e) {
    // Windows / restricted FS — ignore symlink failure
  }
}

/**
 * Files a previous run finished. A file_done marked `incomplete` is NOT
 * counted: a chunk failed after retries, so the file was only partly audited
 * and a resume should do it again. report.js dedupes the overlap.
 */
function doneFilesFromJsonl(jsonlPath) {
  var parsed = loadJsonlFindings(jsonlPath);
  var set = new Set();
  parsed.fileDone.forEach(function (x) {
    if (x.file && x.incomplete !== true) set.add(x.file);
  });
  return set;
}

/** Filesystem-safe name for a reject dump. */
function rejectName(rel, chunkIndex) {
  return rel.replace(/[^a-zA-Z0-9._-]+/g, '_') + '.' + chunkIndex + '.txt';
}

function fmtDuration(ms) {
  if (ms == null) return 'n/a';
  var s = Math.round(ms / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  if (h) return h + 'h' + String(m).padStart(2, '0') + 'm';
  if (m) return m + 'm' + String(s % 60).padStart(2, '0') + 's';
  return s + 's';
}

var REASK_MESSAGE = [
  'Your previous reply was not valid JSON and could not be parsed.',
  'Reply again with ONLY a JSON array of finding objects -- or [] if the file',
  'is clean for the rubric. No prose, no markdown fences, no explanation.'
].join(' ');

function appendJsonl(path, obj) {
  appendFileSync(path, JSON.stringify(obj) + '\n', 'utf8');
}

async function mapPool(items, concurrency, fn) {
  var i = 0;
  var workers = [];
  async function worker() {
    while (i < items.length) {
      var idx = i++;
      await fn(items[idx], idx);
    }
  }
  var n = Math.max(1, concurrency || 1);
  for (var w = 0; w < n; w++) workers.push(worker());
  await Promise.all(workers);
}

export async function cmdDryRun(flags) {
  var cfg = applyCliOverrides(loadConfig({ configPath: flags.config }), flags);
  var files = listScanFiles(cfg);
  console.log('Would scan ' + files.length + ' file(s):');
  files.forEach(function (abs) {
    console.log('  ' + relative(REPO_ROOT, abs));
  });
  return 0;
}

export async function cmdFinalize(flags) {
  var dir = flags.runDir || flags._[0];
  if (!dir) {
    var cfg = loadConfig({ configPath: flags.config });
    var latest = resolve(REPO_ROOT, cfg.run.outDir, 'latest');
    if (existsSync(latest)) dir = latest;
  }
  if (!dir) throw new Error('finalize requires a run directory (or dbg/northstar-llm/latest)');
  var out = writeReport(resolve(dir));
  console.log('Wrote ' + out);
  return 0;
}

export async function cmdSelftest(flags) {
  var fixtureDir = join(REPO_ROOT, 'tools/northstar-llm/fixtures');
  if (!existsSync(fixtureDir)) {
    console.error('No fixtures dir: ' + fixtureDir);
    return 1;
  }
  var fixtures = readdirSync(fixtureDir).filter(function (f) {
    return /\.(html|js|md)$/.test(f);
  });
  if (!fixtures.length) {
    console.error('No fixtures in ' + fixtureDir);
    return 1;
  }
  console.log('Selftest: ' + fixtures.length + ' fixture(s) under tools/northstar-llm/fixtures');
  return cmdRun(Object.assign({}, flags, { path: 'tools/northstar-llm/fixtures' }));
}

export async function cmdRun(flags) {
  var cfg = flags._cfg || applyCliOverrides(loadConfig({ configPath: flags.config }), flags);
  var provider = flags._provider || resolveProvider(
    cfg,
    flags.provider || cfg.providers.default,
    flags.model || cfg._cliModel
  );
  var checks = loadChecks(cfg);
  var rubric = loadRubricExcerpts(cfg);
  var system = buildSystemPrompt(checks, rubric, cfg.run.maxFindingsPerFile || 12);
  var files = listScanFiles(cfg);

  if (!files.length) {
    console.error('No files matched scan include/exclude.');
    return 1;
  }

  var runDir = ensureRunDir(cfg.run.outDir, flags.resume ? flags.resumeDir || flags.resume : null);
  var jsonlPath = join(runDir, 'findings.jsonl');
  var metaPath = join(runDir, 'meta.json');

  var already = new Set();
  if (flags.resume && existsSync(jsonlPath)) {
    already = doneFilesFromJsonl(jsonlPath);
    console.log('Resume: skipping ' + already.size + ' completed file(s)');
  }

  var startedAtMs = Date.now();
  var budgetMs = cfg.run.budgetMs != null ? cfg.run.budgetMs : null;

  var meta = {
    provider: provider.id,
    model: provider.model,
    baseUrl: provider.baseUrl,
    thinking: provider.thinking === true,
    numCtx: provider.numCtx,
    gitHead: gitHead(),
    startedAt: new Date(startedAtMs).toISOString(),
    finishedAt: null,
    filesTotal: files.length,
    filesScanned: 0,
    // Timing and reliability live here rather than in the prompt: the model's
    // verdict on a file must not depend on what time it is.
    budgetMs: budgetMs,
    elapsedMs: null,
    stoppedOnBudget: false,
    filesSkippedForBudget: 0,
    filesIncomplete: 0,
    callRetries: 0,
    reasks: 0,
    maxRetries: cfg.run.maxRetries != null ? cfg.run.maxRetries : 3,
    configPath: cfg._loadedConfigPath || join('tools/northstar-llm', 'config.default.json'),
    tool: 'northstar-llm',
    auditOnly: true
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  linkLatest(cfg.run.outDir, runDir);

  console.log(
    'northstar-llm run → ' +
      relative(REPO_ROOT, runDir) +
      '\n  provider=' +
      provider.id +
      ' model=' +
      provider.model +
      ' thinking=' +
      meta.thinking +
      ' numCtx=' +
      meta.numCtx +
      '\n  files=' +
      files.length +
      ' budget=' +
      (budgetMs ? fmtDuration(budgetMs) : 'none') +
      ' maxRetries=' +
      meta.maxRetries
  );

  if (!flags._chat) {
    try {
      await pingProvider(provider);
    } catch (e) {
      console.warn('Warning: /models ping failed (' + e.message + '); continuing.');
    }
  }

  var scanned = already.size;
  var maxBytes = cfg.run.maxFileBytes || 200000;
  var maxChunk = cfg.run.maxChunkChars || 60000;
  var maxFindings = cfg.run.maxFindingsPerFile || 12;

  // Always the retrying wrapper; `_chat` replaces only the single HTTP call,
  // so the backoff ladder is the same code in tests and in production.
  var chat = chatCompletionRetrying;
  var chatOpts = {
    temperature: cfg.run.temperature,
    timeoutMs: cfg.run.timeoutMs,
    maxRetries: meta.maxRetries,
    sleep: flags._sleep,
    chat: flags._chat
  };

  await mapPool(files, cfg.run.concurrency || 1, async function (abs, fileIdx) {
    var rel = relative(REPO_ROOT, abs).split('\\').join('/');
    if (already.has(rel)) return;

    // Budget stop: finish the file in flight, start no new ones. The report is
    // still written and --resume picks up exactly here.
    if (budgetMs != null && Date.now() - startedAtMs >= budgetMs) {
      if (!meta.stoppedOnBudget) {
        meta.stoppedOnBudget = true;
        console.log(
          'Budget of ' + fmtDuration(budgetMs) + ' reached -- stopping cleanly. ' +
            'Resume with: --resume ' + relative(REPO_ROOT, runDir)
        );
      }
      meta.filesSkippedForBudget++;
      return;
    }

    var text;
    try {
      text = readFileSync(abs, 'utf8');
    } catch (e) {
      appendJsonl(jsonlPath, { type: 'error', file: rel, message: 'read failed: ' + e.message });
      return;
    }
    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      text = text.slice(0, maxBytes) + '\n\n…[truncated for maxFileBytes]';
    }

    var ign = parseIgnorePragmas(text);
    var role = fileRole(rel);
    var chunks = chunkText(text, maxChunk);
    var fileFindings = [];
    var incomplete = false;

    for (var ci = 0; ci < chunks.length; ci++) {
      var ch = chunks[ci];
      var user = buildUserPrompt({
        relPath: rel,
        role: role,
        fileIndex: fileIdx,
        fileCount: files.length,
        chunkIndex: ci,
        chunkCount: chunks.length,
        lineOffset: ch.lineOffset,
        ignoredLineCount: ign.ignoredLines.size,
        text: ch.text
      });
      var messages = [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ];
      var onRetry = (function (chunkIndex) {
        return function (info) {
          meta.callRetries++;
          console.warn(
            'RETRY ' + rel + ' chunk ' + (chunkIndex + 1) + ' attempt ' + info.attempt +
              '/' + info.maxRetries + ' in ' + Math.round(info.waitMs / 1000) + 's: ' + info.message
          );
        };
      })(ci);

      var content;
      try {
        var resp = await chat(provider, messages, Object.assign({}, chatOpts, { onRetry: onRetry }));
        content = resp.content;
      } catch (e) {
        // Retries are exhausted or the error was not retryable. Stop this file
        // but KEEP what earlier chunks found -- this used to `return`, which
        // discarded every finding already collected and wrote no file_done.
        appendJsonl(jsonlPath, {
          type: 'error',
          file: rel,
          message: e.message,
          status: e.status == null ? null : e.status,
          attempts: e.attempts == null ? 1 : e.attempts,
          chunk: ci,
          chunksTotal: chunks.length,
          partialFindings: fileFindings.length
        });
        console.error('ERROR ' + rel + ' chunk ' + (ci + 1) + '/' + chunks.length + ': ' + e.message);
        incomplete = true;
        break;
      }

      var parseOpts = {
        checks: checks,
        relPath: rel,
        maxFindings: maxFindings,
        strictCheckIds: false
      };
      var parsed = parseFindings(content, parseOpts);

      if (parsed.error) {
        // One corrective re-ask. Local models answer in prose often enough
        // that losing a whole chunk to it is the common failure, not the rare
        // one. Exactly one: a model that ignores "JSON only" twice will not
        // comply on the third ask, and this is a multi-hour run.
        console.warn('PARSE ' + rel + ' chunk ' + (ci + 1) + ': ' + parsed.error);
        var reasked;
        try {
          meta.reasks++;
          reasked = await chat(
            provider,
            messages.concat([
              { role: 'assistant', content: String(content || '').slice(0, 4000) },
              { role: 'user', content: REASK_MESSAGE }
            ]),
            Object.assign({}, chatOpts, { onRetry: onRetry })
          );
        } catch (e2) {
          appendJsonl(jsonlPath, {
            type: 'error',
            file: rel,
            message: 're-ask failed: ' + e2.message,
            chunk: ci,
            partialFindings: fileFindings.length
          });
          incomplete = true;
          break;
        }

        var parsed2 = parseFindings(reasked.content, parseOpts);
        if (parsed2.error) {
          // Save the full reply, not a 200-char slice -- an unparseable answer
          // is only actionable if you can read what the model actually said.
          var rejDir = join(runDir, 'rejects');
          mkdirSync(rejDir, { recursive: true });
          var rejPath = join(rejDir, rejectName(rel, ci));
          writeFileSync(
            rejPath,
            '# first reply\n\n' + String(content || '') +
              '\n\n# after re-ask\n\n' + String(reasked.content || '') + '\n',
            'utf8'
          );
          appendJsonl(jsonlPath, {
            type: 'error',
            file: rel,
            message: 'unparseable after re-ask: ' + parsed2.error,
            chunk: ci,
            reject: relative(runDir, rejPath)
          });
          console.warn('REJECT ' + rel + ' chunk ' + (ci + 1) + ' -> ' + relative(REPO_ROOT, rejPath));
          incomplete = true;
          continue;
        }
        parsed = parsed2;
        console.log('RECOVERED ' + rel + ' chunk ' + (ci + 1) + ' after re-ask');
      }

      fileFindings = fileFindings.concat(parsed.findings);
    }

    fileFindings = filterFindingsByIgnore(fileFindings, ign.ignoredLines);
    // Cap after merge
    if (fileFindings.length > maxFindings) {
      // Same comparator as parse.js -- see severityOrder for why this is not
      // an inline `order[sev] || 9`.
      fileFindings.sort(severityOrder);
      fileFindings = fileFindings.slice(0, maxFindings);
    }

    fileFindings.forEach(function (f) {
      f.file = rel;
      appendJsonl(jsonlPath, f);
    });
    appendJsonl(jsonlPath, {
      type: 'file_done',
      file: rel,
      findingCount: fileFindings.length,
      incomplete: incomplete,
      at: new Date().toISOString()
    });
    if (incomplete) meta.filesIncomplete++;
    scanned++;
    var elapsed = Date.now() - startedAtMs;
    console.log(
      '[' + scanned + '/' + files.length + '] ' + rel + ' → ' + fileFindings.length +
        ' finding(s)' + (incomplete ? ' (INCOMPLETE)' : '') +
        '  [' + fmtDuration(elapsed) +
        (budgetMs != null ? ' of ' + fmtDuration(budgetMs) : '') + ']'
    );
  });

  meta.finishedAt = new Date().toISOString();
  meta.elapsedMs = Date.now() - startedAtMs;
  meta.filesScanned = scanned;
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');

  var reportPath = writeReport(runDir);
  console.log(
    'Done in ' + fmtDuration(meta.elapsedMs) + '. ' +
      scanned + '/' + files.length + ' file(s)' +
      (meta.filesIncomplete ? ', ' + meta.filesIncomplete + ' incomplete' : '') +
      (meta.callRetries ? ', ' + meta.callRetries + ' retry/retries' : '') +
      (meta.reasks ? ', ' + meta.reasks + ' re-ask(s)' : '')
  );
  if (meta.stoppedOnBudget) {
    console.log(
      'Stopped on budget with ' + meta.filesSkippedForBudget + ' file(s) not started. ' +
        'Finish with: npm run review:northstar -- run --resume ' + relative(REPO_ROOT, runDir)
    );
  }
  console.log('Report: ' + relative(REPO_ROOT, reportPath));
  return 0;
}
