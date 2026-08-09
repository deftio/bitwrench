import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

function escCell(s) {
  return String(s == null ? '' : s)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function loadJsonlFindings(jsonlPath) {
  if (!existsSync(jsonlPath)) return { findings: [], fileDone: [], errors: [] };
  var lines = readFileSync(jsonlPath, 'utf8').split(/\r?\n/).filter(Boolean);
  var findings = [];
  var fileDone = [];
  var errors = [];
  for (var i = 0; i < lines.length; i++) {
    var obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch (e) {
      continue;
    }
    if (obj.type === 'file_done') {
      fileDone.push(obj);
      continue;
    }
    if (obj.type === 'error') {
      errors.push(obj);
      continue;
    }
    if (obj.checkId) findings.push(obj);
  }
  return { findings: findings, fileDone: fileDone, errors: errors };
}

function countBy(arr, keyFn) {
  var m = {};
  arr.forEach(function (x) {
    var k = keyFn(x);
    m[k] = (m[k] || 0) + 1;
  });
  return m;
}

function tableFor(findings) {
  if (!findings.length) return '_None._\n';
  var rows = [
    '| File | Line | Check | Problem | Recommendation |',
    '|------|------|-------|---------|----------------|'
  ];
  findings.forEach(function (f) {
    rows.push(
      '| ' +
        escCell(f.file) +
        ' | ' +
        escCell(f.line) +
        ' | ' +
        escCell(f.checkId) +
        ' | ' +
        escCell(f.problem) +
        ' | ' +
        escCell(f.recommendation) +
        ' |'
    );
  });
  return rows.join('\n') + '\n';
}

/**
 * Mechanically render report.md from meta.json + findings.jsonl.
 */
export function writeReport(runDir) {
  var metaPath = join(runDir, 'meta.json');
  var jsonlPath = join(runDir, 'findings.jsonl');
  var meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};
  var parsed = loadJsonlFindings(jsonlPath);
  var findings = parsed.findings;

  var bySev = countBy(findings, function (f) {
    return f.severity || 'medium';
  });
  var byCheck = countBy(findings, function (f) {
    return f.checkId;
  });
  var topChecks = Object.keys(byCheck)
    .sort(function (a, b) {
      return byCheck[b] - byCheck[a];
    })
    .slice(0, 12)
    .map(function (k) {
      return '- `' + k + '`: ' + byCheck[k];
    })
    .join('\n');

  var filesScanned = meta.filesScanned != null ? meta.filesScanned : parsed.fileDone.length;
  var durationMs = null;
  if (meta.startedAt && meta.finishedAt) {
    durationMs = new Date(meta.finishedAt) - new Date(meta.startedAt);
  }

  var high = findings.filter(function (f) {
    return f.severity === 'high';
  });
  var medium = findings.filter(function (f) {
    return f.severity === 'medium';
  });
  var low = findings.filter(function (f) {
    return f.severity === 'low' || f.severity === 'info';
  });

  var md = [];
  md.push('# northstar-llm report');
  md.push('');
  md.push('## Summary');
  md.push('');
  md.push('| | |');
  md.push('|---|---|');
  md.push('| Provider | ' + escCell(meta.provider || '') + ' |');
  md.push('| Model | ' + escCell(meta.model || '') + ' |');
  md.push('| Base URL | ' + escCell(meta.baseUrl || '') + ' |');
  md.push('| Thinking | ' + escCell(String(meta.thinking)) + ' |');
  md.push('| numCtx | ' + escCell(meta.numCtx) + ' |');
  md.push('| Git HEAD | ' + escCell(meta.gitHead || '') + ' |');
  md.push('| Started | ' + escCell(meta.startedAt || '') + ' |');
  md.push('| Finished | ' + escCell(meta.finishedAt || '') + ' |');
  md.push('| Duration | ' + (durationMs != null ? Math.round(durationMs / 1000) + 's' : '') + ' |');
  md.push('| Files scanned | ' + filesScanned + ' |');
  md.push('| Findings | ' + findings.length + ' |');
  md.push('| High / Medium / Low | ' + (bySev.high || 0) + ' / ' + (bySev.medium || 0) + ' / ' + ((bySev.low || 0) + (bySev.info || 0)) + ' |');
  md.push('| Parse/provider errors | ' + parsed.errors.length + ' |');
  md.push('');
  md.push('### Top checkIds');
  md.push('');
  md.push(topChecks || '_None._');
  md.push('');
  md.push('## High');
  md.push('');
  md.push(tableFor(high));
  md.push('## Medium');
  md.push('');
  md.push(tableFor(medium));
  md.push('## Low');
  md.push('');
  md.push(tableFor(low));

  if (parsed.errors.length) {
    md.push('## Errors');
    md.push('');
    parsed.errors.forEach(function (e) {
      md.push('- `' + escCell(e.file) + '`: ' + escCell(e.message || e.error));
    });
    md.push('');
  }

  md.push('## Detail');
  md.push('');
  findings.forEach(function (f) {
    md.push('### `' + f.file + '`:' + f.line + ' — ' + f.checkId);
    md.push('');
    md.push('- **severity:** ' + f.severity);
    md.push('- **evidence:** ' + escCell(f.evidence));
    md.push('- **problem:** ' + escCell(f.problem));
    md.push('- **recommendation:** ' + escCell(f.recommendation));
    md.push('- **cite:** ' + escCell(f.cite));
    md.push('');
  });

  var outPath = join(runDir, 'report.md');
  writeFileSync(outPath, md.join('\n'), 'utf8');
  return outPath;
}

export { loadJsonlFindings };
