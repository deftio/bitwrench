import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

var __dirname = dirname(fileURLToPath(import.meta.url));
// …/tools/northstar-llm/lib → …/tools/northstar-llm → …/bitwrench
export var TOOL_ROOT = resolve(__dirname, '..');
export var REPO_ROOT = resolve(__dirname, '../../..');

function deepMerge(base, over) {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over === undefined ? base : over;
  var out = Object.assign({}, base);
  Object.keys(over).forEach(function (k) {
    if (
      base &&
      typeof base[k] === 'object' &&
      base[k] !== null &&
      !Array.isArray(base[k]) &&
      typeof over[k] === 'object' &&
      over[k] !== null &&
      !Array.isArray(over[k])
    ) {
      out[k] = deepMerge(base[k], over[k]);
    } else {
      out[k] = over[k];
    }
  });
  return out;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Load defaults + optional tool-local northstar.config.json.
 * Config lives under tools/northstar-llm/ only (not repo root).
 * CLI overrides applied by caller via applyCliOverrides.
 */
export function loadConfig(opts) {
  opts = opts || {};
  var defaultsPath = join(TOOL_ROOT, 'config.default.json');
  var cfg = readJson(defaultsPath);

  var overridePath = opts.configPath
    ? resolve(opts.configPath)
    : join(TOOL_ROOT, 'northstar.config.json');

  if (existsSync(overridePath)) {
    cfg = deepMerge(cfg, readJson(overridePath));
    cfg._loadedConfigPath = overridePath;
  }

  return cfg;
}

export function resolveProvider(cfg, providerId, modelOverride) {
  var id = providerId || cfg.providers.default || 'ollama';
  var p = cfg.providers[id];
  if (!p || typeof p !== 'object') {
    throw new Error('Unknown provider "' + id + '". Known: ' + Object.keys(cfg.providers).filter(function (k) {
      return k !== 'default';
    }).join(', '));
  }
  var out = Object.assign({ id: id }, p);
  if (modelOverride) out.model = modelOverride;
  if (typeof out.thinking !== 'boolean') out.thinking = false;
  if (typeof out.numCtx !== 'number') out.numCtx = 100000;
  if (!out.baseUrl) {
    throw new Error('Provider "' + id + '" missing baseUrl (OpenAI-compatible .../v1)');
  }
  if (!out.model) {
    throw new Error('Provider "' + id + '" missing model');
  }
  return out;
}

export function applyCliOverrides(cfg, flags) {
  var out = deepMerge(cfg, {});
  if (flags.provider) out.providers.default = flags.provider;
  if (flags.concurrency != null) out.run.concurrency = flags.concurrency;
  if (flags.outDir) out.run.outDir = flags.outDir;
  if (flags.path) {
    out.scan = Object.assign({}, out.scan, { include: [flags.path], _pathOverride: true });
  }
  if (flags.model) out._cliModel = flags.model;
  return out;
}

export function loadChecks(cfg) {
  var checksPath = cfg.rubric && cfg.rubric.checksPath
    ? resolve(REPO_ROOT, cfg.rubric.checksPath)
    : join(TOOL_ROOT, 'rules');
  var file = join(checksPath, 'checks.json');
  if (!existsSync(file)) {
    throw new Error('Checks file not found: ' + file);
  }
  var checks = readJson(file);
  if (!Array.isArray(checks) || !checks.length) {
    throw new Error('checks.json must be a non-empty array');
  }
  return checks;
}

export function loadRubricExcerpts(cfg) {
  var docs = (cfg.rubric && cfg.rubric.sourceDocs) || [];
  var parts = [];
  docs.forEach(function (rel) {
    var p = resolve(REPO_ROOT, rel);
    if (!existsSync(p)) return;
    var text = readFileSync(p, 'utf8');
    // Cap each source so the system prompt stays manageable at 100k ctx with the file.
    if (text.length > 12000) text = text.slice(0, 12000) + '\n\n…[truncated]';
    parts.push('### ' + rel + '\n\n' + text);
  });
  return parts.join('\n\n');
}
