export function buildSystemPrompt(checks, rubricExcerpts, maxFindings) {
  var checkLines = checks.map(function (c) {
    return [
      '- id: ' + c.id,
      '  severity: ' + c.severity,
      '  cite: ' + c.cite,
      '  description: ' + c.description,
      '  badHint: ' + c.badHint,
      '  goodHint: ' + c.goodHint
    ].join('\n');
  }).join('\n');

  return [
    'You are northstar-llm, an AUDITOR for the bitwrench UI library.',
    'You do NOT write code, patches, refactors, or full rewrites.',
    'You only find violations of the supplied rubric checks.',
    '',
    'bitwrench is TACO-first ({t,a,c,o}), palette/layout token CSS, BCCL components,',
    'events in attributes (not addEventListener in o.mounted), explicit handles/state.',
    'Prefer findings that would be "correct" in React/jQuery/vanilla but violate bitwrench.',
    '',
    'Ignore intentional wrong/comparison demos when the file or nearby comments say so.',
    'Honor northstar-llm:ignore-* pragmas described in the user message.',
    '',
    'Output rules:',
    '1. Respond with JSON ONLY — either a JSON array of finding objects, or {"findings":[...]}',
    '2. No markdown fences. No prose outside JSON.',
    '3. At most ' + maxFindings + ' findings for this file. Prefer highest severity.',
    '4. If the file is clean for the rubric, return [].',
    '5. Each finding object MUST use these keys:',
    '   file, line, endLine, checkId, severity, evidence, problem, recommendation, cite',
    '6. line/endLine are 1-based integers (endLine may equal line). evidence is a short quote.',
    '7. checkId MUST be one of the rubric ids below. severity should match the check default unless clearly worse/milder.',
    '8. recommendation is a short guidance sentence — NOT a code patch.',
    '',
    '## Rubric checks',
    checkLines,
    '',
    '## North-star excerpts (reference)',
    rubricExcerpts || '(none loaded)'
  ].join('\n');
}

/**
 * A few lines of orientation at the very top of every call: which job this is,
 * which file of how many, which chunk.
 *
 * Deliberately no wall-clock, elapsed or remaining time. Two reasons. The
 * model's verdict on a file must not depend on what time it is -- a finding
 * that appears only at 3am is a bug, not a feature. And the system prompt is
 * byte-identical across every call in a run, which is the only thing a
 * provider can prompt-cache; a changing clock anywhere in the request defeats
 * that. Timing lives in meta.json and the console, where it is actually read.
 */
export function buildContextBlock(opts) {
  var lines = ['job: northstar-llm audit (audit only -- findings, never patches)'];
  if (opts.fileIndex != null && opts.fileCount != null) {
    lines.push('file: ' + (opts.fileIndex + 1) + '/' + opts.fileCount + '  ' + opts.relPath);
  } else {
    lines.push('file: ' + opts.relPath);
  }
  lines.push('role: ' + opts.role);
  lines.push('chunk: ' + (opts.chunkIndex + 1) + '/' + opts.chunkCount + '  lineOffset ' + opts.lineOffset);
  return lines.join('\n');
}

export function buildUserPrompt(opts) {
  var ignoreNote = opts.ignoredLineCount
    ? ('Ignore pragmas cover ' + opts.ignoredLineCount + ' line(s); do not flag those lines.')
    : 'No ignore pragmas detected.';

  return [
    buildContextBlock(opts),
    '',
    'Audit this single file against the rubric.',
    '',
    'lineOffset ' + opts.lineOffset + ': add it to any line number you report that is relative to the chunk; prefer absolute file line numbers.',
    ignoreNote,
    '',
    '----- BEGIN FILE -----',
    opts.text,
    '----- END FILE -----'
  ].join('\n');
}

/**
 * Split large files into overlapping line chunks under maxChunkChars.
 */
export function chunkText(text, maxChunkChars) {
  maxChunkChars = maxChunkChars || 60000;
  if (!text || text.length <= maxChunkChars) {
    return [{ text: text, lineOffset: 0, startLine: 1 }];
  }
  var lines = text.split(/\r?\n/);
  var chunks = [];
  var buf = [];
  var bufLen = 0;
  var startLine = 1;

  function flush() {
    if (!buf.length) return;
    chunks.push({
      text: buf.join('\n'),
      lineOffset: startLine - 1,
      startLine: startLine
    });
    // overlap last 20 lines into next chunk for boundary context
    var overlap = buf.slice(Math.max(0, buf.length - 20));
    var nextStart = startLine + buf.length - overlap.length;
    buf = overlap.slice();
    bufLen = buf.join('\n').length;
    startLine = nextStart;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var add = line.length + 1;
    if (buf.length && bufLen + add > maxChunkChars) {
      flush();
    }
    if (!buf.length) startLine = i + 1;
    buf.push(line);
    bufLen += add;
  }
  if (buf.length) {
    chunks.push({
      text: buf.join('\n'),
      lineOffset: startLine - 1,
      startLine: startLine
    });
  }
  return chunks;
}
