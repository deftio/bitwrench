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
import { chatCompletion, pingProvider } from './provider.js';
import { buildSystemPrompt, buildUserPrompt, chunkText } from './prompt.js';
import { parseFindings } from './parse.js';
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

function doneFilesFromJsonl(jsonlPath) {
  var parsed = loadJsonlFindings(jsonlPath);
  var set = new Set();
  parsed.fileDone.forEach(function (x) {
    if (x.file) set.add(x.file);
  });
  return set;
}

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

  var meta = {
    provider: provider.id,
    model: provider.model,
    baseUrl: provider.baseUrl,
    thinking: provider.thinking === true,
    numCtx: provider.numCtx,
    gitHead: gitHead(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    filesTotal: files.length,
    filesScanned: 0,
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
      files.length
  );

  try {
    await pingProvider(provider);
  } catch (e) {
    console.warn('Warning: /models ping failed (' + e.message + '); continuing.');
  }

  var scanned = already.size;
  var maxBytes = cfg.run.maxFileBytes || 200000;
  var maxChunk = cfg.run.maxChunkChars || 60000;
  var maxFindings = cfg.run.maxFindingsPerFile || 12;

  await mapPool(files, cfg.run.concurrency || 1, async function (abs) {
    var rel = relative(REPO_ROOT, abs).split('\\').join('/');
    if (already.has(rel)) return;

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

    for (var ci = 0; ci < chunks.length; ci++) {
      var ch = chunks[ci];
      var user = buildUserPrompt({
        relPath: rel,
        role: role,
        chunkIndex: ci,
        chunkCount: chunks.length,
        lineOffset: ch.lineOffset,
        ignoredLineCount: ign.ignoredLines.size,
        text: ch.text
      });

      var content;
      try {
        var resp = await chatCompletion(
          provider,
          [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          {
            temperature: cfg.run.temperature,
            timeoutMs: cfg.run.timeoutMs
          }
        );
        content = resp.content;
      } catch (e) {
        appendJsonl(jsonlPath, { type: 'error', file: rel, message: e.message, chunk: ci });
        console.error('ERROR ' + rel + ': ' + e.message);
        return;
      }

      var parsed = parseFindings(content, {
        checks: checks,
        relPath: rel,
        maxFindings: maxFindings,
        strictCheckIds: false
      });
      if (parsed.error) {
        appendJsonl(jsonlPath, {
          type: 'error',
          file: rel,
          message: parsed.error,
          chunk: ci
        });
        console.warn('PARSE ' + rel + ': ' + parsed.error);
      }
      fileFindings = fileFindings.concat(parsed.findings);
    }

    fileFindings = filterFindingsByIgnore(fileFindings, ign.ignoredLines);
    // Cap after merge
    if (fileFindings.length > maxFindings) {
      var order = { high: 0, medium: 1, low: 2, info: 3 };
      fileFindings.sort(function (a, b) {
        return (order[a.severity] || 9) - (order[b.severity] || 9);
      });
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
      at: new Date().toISOString()
    });
    scanned++;
    console.log(
      '[' + scanned + '/' + files.length + '] ' + rel + ' → ' + fileFindings.length + ' finding(s)'
    );
  });

  meta.finishedAt = new Date().toISOString();
  meta.filesScanned = scanned;
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');

  var reportPath = writeReport(runDir);
  console.log('Done. Report: ' + relative(REPO_ROOT, reportPath));
  return 0;
}
