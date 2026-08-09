import { stripThinking } from './provider.js';

var VALID_KEYS = {
  file: 1,
  line: 1,
  endLine: 1,
  checkId: 1,
  severity: 1,
  evidence: 1,
  problem: 1,
  recommendation: 1,
  cite: 1
};

function extractJsonText(content) {
  var s = stripThinking(content || '');
  // Strip markdown fences if a model ignores instructions.
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  if (s.charAt(0) === '{' || s.charAt(0) === '[') return s;
  var a = s.indexOf('[');
  var o = s.indexOf('{');
  var start = -1;
  if (a === -1) start = o;
  else if (o === -1) start = a;
  else start = Math.min(a, o);
  if (start === -1) return s;
  return s.slice(start);
}

function normalizeFinding(raw, defaults) {
  if (!raw || typeof raw !== 'object') return null;
  var checkId = raw.checkId || raw.check_id || raw.id;
  if (!checkId) return null;
  var line = raw.line != null ? Number(raw.line) : 0;
  var endLine = raw.endLine != null ? Number(raw.endLine) : line;
  if (!Number.isFinite(line)) line = 0;
  if (!Number.isFinite(endLine)) endLine = line;
  var severity = String(raw.severity || defaults.severityFor(checkId) || 'medium').toLowerCase();
  if (['high', 'medium', 'low', 'info'].indexOf(severity) === -1) severity = 'medium';

  var f = {
    file: String(raw.file || defaults.relPath),
    line: line,
    endLine: endLine,
    checkId: String(checkId),
    severity: severity,
    evidence: String(raw.evidence || '').slice(0, 500),
    problem: String(raw.problem || raw.message || '').slice(0, 1000),
    recommendation: String(raw.recommendation || raw.fix || '').slice(0, 1000),
    cite: String(raw.cite || defaults.citeFor(checkId) || '')
  };
  // Drop unknown noise keys by returning only schema fields
  Object.keys(f).forEach(function (k) {
    if (!VALID_KEYS[k]) delete f[k];
  });
  if (!f.problem) return null;
  return f;
}

/**
 * Parse model content into finding objects. Returns { findings, error }.
 */
export function parseFindings(content, opts) {
  opts = opts || {};
  var checkIds = {};
  (opts.checks || []).forEach(function (c) {
    checkIds[c.id] = c;
  });
  var defaults = {
    relPath: opts.relPath || '',
    severityFor: function (id) {
      return checkIds[id] && checkIds[id].severity;
    },
    citeFor: function (id) {
      return checkIds[id] && checkIds[id].cite;
    }
  };

  var text = extractJsonText(content);
  var data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { findings: [], error: 'JSON parse failed: ' + e.message + ' :: ' + text.slice(0, 200) };
  }

  var list;
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.findings)) list = data.findings;
  else if (data && typeof data === 'object' && data.checkId) list = [data];
  else list = [];

  var findings = [];
  for (var i = 0; i < list.length; i++) {
    var f = normalizeFinding(list[i], defaults);
    if (!f) continue;
    if (opts.lineOffset && f.line > 0 && opts.adjustLines) {
      // Only adjust if model clearly used chunk-relative lines (small numbers).
      // Prefer trusting absolute lines; if line < startLine of chunk, bump.
    }
    if (checkIds[f.checkId] == null && opts.strictCheckIds) {
      continue;
    }
    findings.push(f);
  }

  if (opts.maxFindings != null && findings.length > opts.maxFindings) {
    var order = { high: 0, medium: 1, low: 2, info: 3 };
    findings.sort(function (a, b) {
      return (order[a.severity] || 9) - (order[b.severity] || 9);
    });
    findings = findings.slice(0, opts.maxFindings);
  }

  return { findings: findings, error: null };
}
