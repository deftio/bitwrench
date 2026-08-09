/**
 * northstar-llm ignore pragmas (any comment style):
 *   northstar-llm:ignore-next-line: reason
 *   northstar-llm:ignore-start: reason
 *   ...
 *   northstar-llm:ignore-end
 */

var RE_NEXT = /northstar-llm:ignore-next-line\b/;
var RE_START = /northstar-llm:ignore-start\b/;
var RE_END = /northstar-llm:ignore-end\b/;

/**
 * @returns {{ ignoredLines: Set<number>, ranges: Array<{start:number,end:number,reason:string}> }}
 * Line numbers are 1-based.
 */
export function parseIgnorePragmas(text) {
  var lines = text.split(/\r?\n/);
  var ignored = new Set();
  var ranges = [];
  var blockStart = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var lineNo = i + 1;
    if (RE_START.test(line)) {
      blockStart = lineNo;
      continue;
    }
    if (RE_END.test(line)) {
      if (blockStart != null) {
        ranges.push({ start: blockStart, end: lineNo });
        for (var j = blockStart; j <= lineNo; j++) ignored.add(j);
        blockStart = null;
      }
      continue;
    }
    if (RE_NEXT.test(line) && i + 1 < lines.length) {
      ignored.add(lineNo + 1);
    }
  }
  if (blockStart != null) {
    ranges.push({ start: blockStart, end: lines.length });
    for (var k = blockStart; k <= lines.length; k++) ignored.add(k);
  }
  return { ignoredLines: ignored, ranges: ranges };
}

export function filterFindingsByIgnore(findings, ignoredLines) {
  if (!findings || !findings.length) return findings || [];
  return findings.filter(function (f) {
    var line = f.line;
    if (line == null || line === 0) return true;
    return !ignoredLines.has(Number(line));
  });
}
