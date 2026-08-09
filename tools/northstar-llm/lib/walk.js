import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative, resolve, sep } from 'path';
import { REPO_ROOT } from './config.js';

/**
 * Minimal glob → RegExp for our include/exclude patterns.
 * Supports **, *, ?, and {a,b} brace expansion once at the end segment.
 */
function expandBraces(pattern) {
  var m = pattern.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!m) return [pattern];
  return m[2].split(',').map(function (alt) {
    return m[1] + alt + m[3];
  });
}

function globToRegExp(glob) {
  var parts = expandBraces(glob);
  return parts.map(function (g) {
    var s = g.replace(/\\/g, '/');
    var re = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '*' && s[i + 1] === '*') {
        if (s[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else if (c === '*') {
        re += '[^/]*';
      } else if (c === '?') {
        re += '[^/]';
      } else if ('.+^$()[]{}|\\'.indexOf(c) !== -1) {
        re += '\\' + c;
      } else {
        re += c;
      }
    }
    return new RegExp('^' + re + '$');
  });
}

function matchesAny(relPath, patterns) {
  var norm = relPath.split(sep).join('/');
  for (var i = 0; i < patterns.length; i++) {
    var regs = globToRegExp(patterns[i]);
    for (var j = 0; j < regs.length; j++) {
      if (regs[j].test(norm)) return true;
    }
  }
  return false;
}

function walkDir(absDir, acc) {
  var entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var abs = join(absDir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
      walkDir(abs, acc);
    } else if (ent.isFile()) {
      acc.push(abs);
    }
  }
}

/**
 * Resolve scan.include / scan.exclude into absolute file paths (sorted).
 * --path override may be a file, directory, or glob relative to repo root.
 */
export function listScanFiles(cfg) {
  var include = (cfg.scan && cfg.scan.include) || [];
  var exclude = (cfg.scan && cfg.scan.exclude) || [];
  var all = [];

  // Fast path: single concrete file/dir from --path
  if (cfg.scan && cfg.scan._pathOverride && include.length === 1) {
    var one = resolve(REPO_ROOT, include[0]);
    if (existsSync(one)) {
      var st = statSync(one);
      if (st.isFile()) {
        all = [one];
      } else if (st.isDirectory()) {
        walkDir(one, all);
      }
    }
  }

  if (!all.length) {
    walkDir(REPO_ROOT, all);
  }

  var files = all.filter(function (abs) {
    var rel = relative(REPO_ROOT, abs);
    if (rel.startsWith('..')) return false;
    if (exclude.length && matchesAny(rel, exclude)) return false;
    if (cfg.scan && cfg.scan._pathOverride && include.length === 1) {
      var target = resolve(REPO_ROOT, include[0]);
      if (existsSync(target) && statSync(target).isDirectory()) {
        return abs === target || abs.startsWith(target + sep);
      }
      if (existsSync(target) && statSync(target).isFile()) {
        return abs === target;
      }
      return matchesAny(rel, include);
    }
    return matchesAny(rel, include);
  });

  files.sort();
  return files;
}

export function fileRole(relPath) {
  var n = relPath.split(sep).join('/');
  if (n.startsWith('docs/') || n.endsWith('.md') || n === 'llms.txt' || n === 'agents.md') return 'doc';
  if (n.startsWith('pages/')) return 'page';
  if (n.startsWith('examples/')) return 'example';
  return 'other';
}
