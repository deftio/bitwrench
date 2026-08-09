#!/usr/bin/env node
/**
 * northstar-llm — audit-only north-star corpus reviewer.
 *
 * With no arguments: print help and exit 0 (never starts a long run).
 *
 * Does not edit the corpus. Not wired into CI or release.
 */

import { cmdRun, cmdDryRun, cmdFinalize, cmdSelftest } from './lib/run.js';

var HELP = [
  'northstar-llm — audit-only reviewer for bitwrench north-star drift',
  '',
  'Reads docs/, pages/, and examples/ against a fixed rubric (TACO-first,',
  'palette/layout tokens, BCCL before reinvention, no var(--bw_*) theming',
  'path, etc.). Emits structured findings. Does NOT edit code, open PRs,',
  'or drive a coding agent.',
  '',
  'IMPORTANT: With no arguments this tool prints help and exits.',
  'You must name a command (e.g. run) to do any work.',
  '',
  'Usage:',
  '  node tools/northstar-llm/cli.js <command> [options]',
  '  npm run review:northstar -- <command> [options]',
  '',
  'Commands:',
  '  help                 Show this help (same as -h / --help / no args)',
  '  run                  Call the LLM on each scanned file; write findings',
  '  dry-run              List files that would be scanned; no LLM calls',
  '  finalize [runDir]    Rebuild report.md from findings.jsonl (no LLM)',
  '  selftest             Audit planted fixtures under fixtures/ (needs LLM)',
  '',
  'Options (run / dry-run / selftest):',
  '  --provider <id>      Inference backend: ollama | lmstudio | openrouter',
  '                       (default: providers.default in config, usually ollama)',
  '  --model <id>         Model tag, e.g. gemma4:31b-mxfp8',
  '  --path <glob|dir|file>',
  '                       Restrict the corpus (repo-relative). Examples:',
  '                         --path examples/todo-app',
  '                         --path "pages/**/*.html"',
  '  --concurrency <n>    Parallel file audits (default: 1 for large local models)',
  '  --out-dir <dir>      Output root (default: dbg/northstar-llm)',
  '  --resume [runDir]    Continue a previous run; skip files already in',
  '                       that run\'s findings.jsonl. If runDir omitted,',
  '                       uses <out-dir>/latest',
  '  --config <path>      Merge an alternate override JSON (still on top of',
  '                       config.default.json). Default override path:',
  '                       tools/northstar-llm/northstar.config.json',
  '  -h, --help           Show this help',
  '',
  'Config (all under tools/northstar-llm/):',
  '  config.default.json       Shipped defaults (providers, scan, run)',
  '  northstar.config.json     Optional local overrides (gitignored if you',
  '                            put secrets there; prefer env for API keys)',
  '  rules/checks.json         Rubric check ids / severity / hints',
  '',
  'Each provider entry includes:',
  '  baseUrl     OpenAI-compatible root ending in /v1',
  '              (POST {baseUrl}/chat/completions)',
  '  model       Model id/tag served by that backend',
  '  thinking    false recommended — this is not a deep-reasoning task',
  '  numCtx      Context window hint (default 100000)',
  '  apiKeyEnv   Env var name for Authorization (e.g. OPENROUTER_API_KEY)',
  '',
  'Default provider: ollama @ http://127.0.0.1:11434/v1',
  'Default model:    gemma4:31b-mxfp8',
  '',
  'Outputs (gitignored):',
  '  dbg/northstar-llm/<timestamp>/',
  '    meta.json         provider, model, git HEAD, timing',
  '    findings.jsonl    streamed as each file finishes (crash-safe)',
  '    report.md         mechanical markdown tables (regenerable)',
  '  dbg/northstar-llm/latest -> most recent run dir',
  '',
  'Ignore pragmas (any comment style):',
  '  northstar-llm:ignore-next-line: reason',
  '  northstar-llm:ignore-start: reason',
  '  northstar-llm:ignore-end',
  '',
  'Examples:',
  '  npm run review:northstar -- help',
  '  npm run review:northstar -- dry-run',
  '  npm run review:northstar -- dry-run --path examples/todo-app',
  '  npm run review:northstar -- selftest',
  '  npm run review:northstar -- run',
  '  npm run review:northstar -- run --model qwen3.6:27b-mxfp8',
  '  npm run review:northstar -- run --path pages --resume',
  '  npm run review:northstar -- finalize',
  '  npm run review:northstar -- finalize dbg/northstar-llm/2026-08-08T22-15-03Z',
  '',
  'Exit codes:',
  '  0   Help printed, dry-run listed files, finalize wrote report, or',
  '      audit/selftest completed (findings are data — not a failure)',
  '  1   Bad usage, config/provider error, or aborted run',
  '',
  'Not wired into npm test, postbuild, or tools/release.js.',
  'Spec: dev/northstar-llm.md'
].join('\n');

function printHelp() {
  console.log(HELP);
}

function parseArgs(argv) {
  var args = argv.slice(2);
  var flags = {
    _: [],
    command: null,
    noArgs: args.length === 0
  };

  for (var i = 0; i < args.length; i++) {
    var a = args[i];
    if (a === '--help' || a === '-h') {
      flags.help = true;
    } else if (a === '--provider') {
      flags.provider = requireValue(args, ++i, '--provider');
    } else if (a === '--model') {
      flags.model = requireValue(args, ++i, '--model');
    } else if (a === '--path') {
      flags.path = requireValue(args, ++i, '--path');
    } else if (a === '--concurrency') {
      flags.concurrency = Number(requireValue(args, ++i, '--concurrency'));
      if (!Number.isFinite(flags.concurrency) || flags.concurrency < 1) {
        throw new Error('--concurrency must be a positive number');
      }
    } else if (a === '--out-dir') {
      flags.outDir = requireValue(args, ++i, '--out-dir');
    } else if (a === '--config') {
      flags.config = requireValue(args, ++i, '--config');
    } else if (a === '--resume') {
      flags.resume = true;
      var next = args[i + 1];
      if (next && next.charAt(0) !== '-') {
        flags.resumeDir = args[++i];
      } else {
        flags.resumeDir = null;
      }
    } else if (a === '--dry-run') {
      // legacy flag form
      flags.command = 'dry-run';
    } else if (a === '--selftest') {
      flags.command = 'selftest';
    } else if (a.charAt(0) === '-') {
      throw new Error('Unknown option: ' + a + '\nRun with --help for usage.');
    } else if (!flags.command) {
      flags.command = a;
    } else {
      flags._.push(a);
    }
  }

  if (flags.resume && !flags.resumeDir) {
    flags.resumeDir = 'dbg/northstar-llm/latest';
  }

  return flags;
}

function requireValue(args, index, flag) {
  if (index >= args.length || String(args[index]).charAt(0) === '-') {
    throw new Error(flag + ' requires a value');
  }
  return args[index];
}

async function main() {
  var flags;
  try {
    flags = parseArgs(process.argv);
  } catch (err) {
    console.error(err.message || err);
    console.error('');
    printHelp();
    process.exit(1);
    return;
  }

  // No args, help command, or -h/--help → help only (never start a long run).
  if (
    flags.noArgs ||
    flags.help ||
    flags.command === 'help' ||
    flags.command === null
  ) {
    printHelp();
    process.exit(0);
    return;
  }

  var code = 0;
  try {
    if (flags.command === 'dry-run') code = await cmdDryRun(flags);
    else if (flags.command === 'finalize') code = await cmdFinalize(flags);
    else if (flags.command === 'selftest') code = await cmdSelftest(flags);
    else if (flags.command === 'run') code = await cmdRun(flags);
    else {
      console.error('Unknown command: ' + flags.command);
      console.error('');
      printHelp();
      code = 1;
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    code = 1;
  }
  process.exit(code || 0);
}

main();
