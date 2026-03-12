/*! bitwrench v2.0.16 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
/**
 * bitwrench-code-edit.js - syntax-highlighted contenteditable code editor addon
 *
 * Provides bw.highlight() for tokenizing JS/CSS/HTML into TACO spans,
 * and bw.codeEditor() for a live editable code block with syntax coloring.
 *
 * Theme integration: The editor chrome (background, text color, font) reads
 * from CSS custom properties --bw_code_bg, --bw_code_text, --bw_font_mono,
 * falling back to built-in dark values when no theme is active. Syntax
 * highlighting colors are intentionally fixed (they are a code color scheme,
 * not brand colors). The bw_ce_light class is still supported for manual
 * light-mode override.
 *
 * Can be loaded standalone (browser script tag after bitwrench.umd.js),
 * or imported as an ES module / CJS module.
 *
 * @module bitwrench-code-edit
 * @license BSD-2-Clause
 */

// -- CSS (injected once) ----------------------------------------------
var _cssInjected = false;
var CSS_TEXT =
  '.bw_ce{background:var(--bw_code_bg,#1e293b);border-radius:6px;border:1px solid rgba(255,255,255,0.08);overflow:auto}' +
  '.bw_ce pre{margin:0;padding:0}' +
  '.bw_ce code{font-family:var(--bw_font_mono,"SF Mono",Monaco,"Cascadia Code",Consolas,monospace);font-size:0.875rem;line-height:1.6;color:var(--bw_code_text,#e2e8f0);outline:none;white-space:pre-wrap;display:block;padding:0.75rem 1rem}' +
  '.bw_ce code:empty::before{content:"\\200b"}' +
  '.bw_ce .bw_ce_keyword{color:#c792ea}' +
  '.bw_ce .bw_ce_string{color:#c3e88d}' +
  '.bw_ce .bw_ce_comment{color:#546e7a;font-style:italic}' +
  '.bw_ce .bw_ce_number{color:#f78c6c}' +
  '.bw_ce .bw_ce_operator{color:#89ddff}' +
  '.bw_ce .bw_ce_punctuation{color:#89ddff}' +
  '.bw_ce .bw_ce_property{color:#82aaff}' +
  '.bw_ce .bw_ce_function{color:#82aaff}' +
  '.bw_ce .bw_ce_tag{color:#f07178}' +
  '.bw_ce .bw_ce_attr_name{color:#ffcb6b}' +
  '.bw_ce .bw_ce_attr_value{color:#c3e88d}' +
  '.bw_ce .bw_ce_selector{color:#c792ea}' +
  '.bw_ce .bw_ce_css_prop{color:#82aaff}' +
  '.bw_ce .bw_ce_css_value{color:#f78c6c}' +
  '.bw_ce .bw_ce_at_rule{color:#c792ea;font-style:italic}' +
  '.bw_ce .bw_ce_color{color:#f78c6c}' +
  '.bw_ce .bw_ce_template_interp{color:#89ddff}' +
  // Light theme
  '.bw_ce_light.bw_ce{background:#fafafa;border-color:#d8d8d8}' +
  '.bw_ce_light.bw_ce code{color:#1a1a1a}' +
  '.bw_ce_light.bw_ce .bw_ce_keyword{color:#7c3aed}' +
  '.bw_ce_light.bw_ce .bw_ce_string{color:#16a34a}' +
  '.bw_ce_light.bw_ce .bw_ce_comment{color:#9ca3af;font-style:italic}' +
  '.bw_ce_light.bw_ce .bw_ce_number{color:#ea580c}' +
  '.bw_ce_light.bw_ce .bw_ce_operator{color:#0891b2}' +
  '.bw_ce_light.bw_ce .bw_ce_punctuation{color:#6b7280}' +
  '.bw_ce_light.bw_ce .bw_ce_property{color:#2563eb}' +
  '.bw_ce_light.bw_ce .bw_ce_function{color:#2563eb}' +
  '.bw_ce_light.bw_ce .bw_ce_tag{color:#dc2626}' +
  '.bw_ce_light.bw_ce .bw_ce_attr_name{color:#d97706}' +
  '.bw_ce_light.bw_ce .bw_ce_attr_value{color:#16a34a}' +
  '.bw_ce_light.bw_ce .bw_ce_selector{color:#7c3aed}' +
  '.bw_ce_light.bw_ce .bw_ce_css_prop{color:#2563eb}' +
  '.bw_ce_light.bw_ce .bw_ce_css_value{color:#ea580c}' +
  '.bw_ce_light.bw_ce .bw_ce_at_rule{color:#7c3aed}' +
  '.bw_ce_light.bw_ce .bw_ce_color{color:#ea580c}' +
  '.bw_ce_light.bw_ce .bw_ce_template_interp{color:#0891b2}' +
  // Line number gutter (opt-in via lineNumbers option)
  '.bw_ce_wrap{display:flex;flex-direction:row}' +
  '.bw_ce_gutter{flex:0 0 auto;padding:0.75rem 0;text-align:right;user-select:none;-webkit-user-select:none;color:#546e7a;font-family:var(--bw_font_mono,"SF Mono",Monaco,"Cascadia Code",Consolas,monospace);font-size:0.875rem;line-height:1.6;border-right:1px solid rgba(255,255,255,0.08);overflow:hidden}' +
  '.bw_ce_gutter span{display:block;padding:0 0.5rem 0 0.75rem}' +
  '.bw_ce_light .bw_ce_gutter{color:#9ca3af;border-right-color:#d8d8d8}';

function ensureCSS(bw) {
  if (_cssInjected) return;
  _cssInjected = true;
  if (bw && bw.injectCSS) {
    bw.injectCSS(CSS_TEXT, { id: 'bw_code_edit_styles' });
  }
}

// -- JS keywords ------------------------------------------------------
var JS_KEYWORDS = {};
'var,const,let,function,return,if,else,for,while,do,switch,case,break,continue,new,typeof,instanceof,this,class,extends,import,export,default,from,true,false,null,undefined,try,catch,throw,finally,async,await,yield,of,in,delete,void,with,super,static,get,set,debugger'.split(',').forEach(function(k) { JS_KEYWORDS[k] = true; });

// -- JS Tokenizer -----------------------------------------------------
function tokenizeJS(code) {
  var tokens = [];
  var i = 0, len = code.length;
  var buf = '';

  function flush(type) {
    if (buf.length) { tokens.push({ type: type, text: buf }); buf = ''; }
  }

  while (i < len) {
    var ch = code[i];
    var next = code[i + 1];

    // Line comment
    if (ch === '/' && next === '/') {
      flush('plain');
      var end = code.indexOf('\n', i);
      if (end === -1) end = len;
      tokens.push({ type: 'comment', text: code.substring(i, end) });
      i = end;
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      flush('plain');
      var end2 = code.indexOf('*/', i + 2);
      if (end2 === -1) end2 = len - 2;
      tokens.push({ type: 'comment', text: code.substring(i, end2 + 2) });
      i = end2 + 2;
      continue;
    }

    // Regex (simple heuristic: / after operator or start-of-line)
    if (ch === '/' && next !== '/' && next !== '*') {
      var prevToken = tokens.length ? tokens[tokens.length - 1] : null;
      var prevBuf = buf.trim();
      var isRegex = false;
      if (!prevBuf.length) {
        if (!prevToken) isRegex = true;
        else if (prevToken.type === 'operator' || prevToken.type === 'punctuation' || prevToken.type === 'keyword') isRegex = true;
      }
      if (isRegex) {
        flush('plain');
        var rBuf = '/';
        var ri = i + 1;
        var escaped = false;
        var inCharClass = false;
        while (ri < len) {
          var rc = code[ri];
          if (escaped) { rBuf += rc; escaped = false; ri++; continue; }
          if (rc === '\\') { escaped = true; rBuf += rc; ri++; continue; }
          if (rc === '[') { inCharClass = true; rBuf += rc; ri++; continue; }
          if (rc === ']') { inCharClass = false; rBuf += rc; ri++; continue; }
          if (rc === '/' && !inCharClass) { rBuf += rc; ri++; break; }
          if (rc === '\n') break;
          rBuf += rc; ri++;
        }
        // Flags
        while (ri < len && /[gimsuvy]/.test(code[ri])) { rBuf += code[ri]; ri++; }
        tokens.push({ type: 'string', text: rBuf });
        i = ri;
        continue;
      }
    }

    // Strings
    if (ch === '"' || ch === "'" || ch === '`') {
      flush('plain');
      var quote = ch;
      var sBuf = ch;
      var si = i + 1;
      if (quote === '`') {
        // Template literal
        while (si < len) {
          var sc = code[si];
          if (sc === '\\') { sBuf += sc + (code[si + 1] || ''); si += 2; continue; }
          if (sc === '$' && code[si + 1] === '{') {
            // Flush string part so far
            if (sBuf.length) tokens.push({ type: 'string', text: sBuf }); sBuf = '';
            // Find matching brace (simple: count braces)
            tokens.push({ type: 'template-interp', text: '${' });
            si += 2;
            var depth = 1;
            var interpBuf = '';
            while (si < len && depth > 0) {
              if (code[si] === '{') depth++;
              else if (code[si] === '}') { depth--; if (depth === 0) break; }
              interpBuf += code[si]; si++;
            }
            // Tokenize the interpolation content recursively
            var interpTokens = tokenizeJS(interpBuf);
            tokens = tokens.concat(interpTokens);
            tokens.push({ type: 'template-interp', text: '}' });
            si++; // skip closing }
            continue;
          }
          if (sc === '`') { sBuf += sc; si++; break; }
          sBuf += sc; si++;
        }
        if (sBuf.length) tokens.push({ type: 'string', text: sBuf });
      } else {
        while (si < len) {
          var sc2 = code[si];
          if (sc2 === '\\') { sBuf += sc2 + (code[si + 1] || ''); si += 2; continue; }
          if (sc2 === quote) { sBuf += sc2; si++; break; }
          if (sc2 === '\n') break;
          sBuf += sc2; si++;
        }
        tokens.push({ type: 'string', text: sBuf });
      }
      i = si;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '.' && next && /[0-9]/.test(next))) {
      flush('plain');
      var nBuf = '';
      if (ch === '0' && next && /[xXbBoO]/.test(next)) {
        nBuf = ch + next; i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(code[i])) { nBuf += code[i]; i++; }
      } else {
        while (i < len && /[0-9._eE]/.test(code[i])) {
          if ((code[i] === 'e' || code[i] === 'E') && code[i + 1] && /[+\-0-9]/.test(code[i + 1])) {
            nBuf += code[i] + code[i + 1]; i += 2; continue;
          }
          nBuf += code[i]; i++;
        }
      }
      tokens.push({ type: 'number', text: nBuf });
      continue;
    }

    // Identifiers / keywords
    if (/[a-zA-Z_$]/.test(ch)) {
      flush('plain');
      var wBuf = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) { wBuf += code[i]; i++; }
      // Look-ahead: is it a function call?
      var la = i;
      while (la < len && (code[la] === ' ' || code[la] === '\t')) la++;
      // Look-back: is it a property (after dot)?
      var prevTok = tokens.length ? tokens[tokens.length - 1] : null;
      var isDot = prevTok && prevTok.type === 'punctuation' && prevTok.text === '.';

      if (JS_KEYWORDS[wBuf]) {
        tokens.push({ type: 'keyword', text: wBuf });
      } else if (isDot) {
        if (la < len && code[la] === '(') {
          tokens.push({ type: 'function', text: wBuf });
        } else {
          tokens.push({ type: 'property', text: wBuf });
        }
      } else if (la < len && code[la] === '(') {
        tokens.push({ type: 'function', text: wBuf });
      } else {
        tokens.push({ type: 'plain', text: wBuf });
      }
      continue;
    }

    // Operators
    if ('=+-*/%!<>&|^~?:'.indexOf(ch) !== -1) {
      flush('plain');
      // Consume multi-char operators
      var opBuf = ch;
      i++;
      if (i < len && '=+-*/%!<>&|^~?:'.indexOf(code[i]) !== -1) {
        opBuf += code[i]; i++;
        if (i < len && '=>&|'.indexOf(code[i]) !== -1) { opBuf += code[i]; i++; }
      }
      tokens.push({ type: 'operator', text: opBuf });
      continue;
    }

    // Punctuation
    if ('(){}[];,.'.indexOf(ch) !== -1) {
      flush('plain');
      tokens.push({ type: 'punctuation', text: ch });
      i++;
      continue;
    }

    // Plain (whitespace + anything else)
    buf += ch;
    i++;
  }
  flush('plain');
  return tokens;
}

// -- CSS Tokenizer ----------------------------------------------------
function tokenizeCSS(code) {
  var tokens = [];
  var i = 0, len = code.length;
  var state = 'selector'; // selector | prop | value
  var buf = '';

  function flush(type) {
    if (buf.length) { tokens.push({ type: type || 'plain', text: buf }); buf = ''; }
  }

  while (i < len) {
    var ch = code[i];
    var next = code[i + 1];

    // Block comment
    if (ch === '/' && next === '*') {
      flush(state === 'selector' ? 'selector' : state === 'prop' ? 'css-prop' : 'css-value');
      var end = code.indexOf('*/', i + 2);
      if (end === -1) end = len - 2;
      tokens.push({ type: 'comment', text: code.substring(i, end + 2) });
      i = end + 2;
      continue;
    }

    // Strings in values
    if ((ch === '"' || ch === "'") && (state === 'value' || state === 'selector')) {
      flush(state === 'selector' ? 'selector' : 'css-value');
      var quote = ch;
      var sBuf = ch;
      i++;
      while (i < len) {
        if (code[i] === '\\') { sBuf += code[i] + (code[i + 1] || ''); i += 2; continue; }
        if (code[i] === quote) { sBuf += code[i]; i++; break; }
        sBuf += code[i]; i++;
      }
      tokens.push({ type: 'string', text: sBuf });
      continue;
    }

    // At-rules
    if (ch === '@' && state === 'selector') {
      flush('selector');
      var aBuf = '@';
      i++;
      while (i < len && /[a-zA-Z\-]/.test(code[i])) { aBuf += code[i]; i++; }
      tokens.push({ type: 'at-rule', text: aBuf });
      continue;
    }

    // Hex colors in values
    if (ch === '#' && state === 'value') {
      flush('css-value');
      var hBuf = '#';
      i++;
      while (i < len && /[0-9a-fA-F]/.test(code[i])) { hBuf += code[i]; i++; }
      tokens.push({ type: 'color', text: hBuf });
      continue;
    }

    // Numbers in values
    if (state === 'value' && /[0-9]/.test(ch)) {
      flush('css-value');
      var nBuf2 = '';
      while (i < len && /[0-9.]/.test(code[i])) { nBuf2 += code[i]; i++; }
      // Unit
      var uBuf = '';
      while (i < len && /[a-zA-Z%]/.test(code[i])) { uBuf += code[i]; i++; }
      tokens.push({ type: 'number', text: nBuf2 + uBuf });
      continue;
    }

    // Punctuation and state transitions
    if (ch === '{') {
      flush(state === 'selector' ? 'selector' : 'plain');
      tokens.push({ type: 'punctuation', text: ch });
      state = 'prop';
      i++; continue;
    }
    if (ch === '}') {
      flush(state === 'prop' ? 'css-prop' : state === 'value' ? 'css-value' : 'plain');
      tokens.push({ type: 'punctuation', text: ch });
      state = 'selector';
      i++; continue;
    }
    if (ch === ':' && state === 'prop') {
      flush('css-prop');
      tokens.push({ type: 'punctuation', text: ch });
      state = 'value';
      i++; continue;
    }
    if (ch === ';') {
      flush(state === 'value' ? 'css-value' : 'plain');
      tokens.push({ type: 'punctuation', text: ch });
      state = 'prop';
      i++; continue;
    }
    if (ch === ',') {
      flush(state === 'selector' ? 'selector' : state === 'value' ? 'css-value' : 'plain');
      tokens.push({ type: 'punctuation', text: ch });
      i++; continue;
    }

    // Accumulate into buffer
    buf += ch;
    i++;
  }
  flush(state === 'selector' ? 'selector' : state === 'prop' ? 'css-prop' : 'css-value');
  return tokens;
}

// -- HTML Tokenizer ---------------------------------------------------
function tokenizeHTML(code) {
  var tokens = [];
  var i = 0, len = code.length;
  var buf = '';

  function flush(type) {
    if (buf.length) { tokens.push({ type: type, text: buf }); buf = ''; }
  }

  while (i < len) {
    var ch = code[i];

    // Comment
    if (ch === '<' && code.substring(i, i + 4) === '<!--') {
      flush('plain');
      var end = code.indexOf('-->', i + 4);
      if (end === -1) end = len - 3;
      tokens.push({ type: 'comment', text: code.substring(i, end + 3) });
      i = end + 3;
      continue;
    }

    // Tag
    if (ch === '<') {
      flush('plain');
      // Consume < and optional /
      var tBuf = '<';
      i++;
      if (i < len && code[i] === '/') { tBuf += '/'; i++; }
      // Tag name
      while (i < len && /[a-zA-Z0-9\-]/.test(code[i])) { tBuf += code[i]; i++; }
      tokens.push({ type: 'tag', text: tBuf });

      // Attributes
      while (i < len && code[i] !== '>' && !(code[i] === '/' && code[i + 1] === '>')) {
        // Whitespace
        if (/\s/.test(code[i])) {
          var wBuf = '';
          while (i < len && /\s/.test(code[i])) { wBuf += code[i]; i++; }
          tokens.push({ type: 'plain', text: wBuf });
          continue;
        }
        // Attribute name
        if (/[a-zA-Z_\-@:]/.test(code[i])) {
          var aBuf = '';
          while (i < len && /[a-zA-Z0-9_\-@:]/.test(code[i])) { aBuf += code[i]; i++; }
          tokens.push({ type: 'attr-name', text: aBuf });
          // = sign
          if (i < len && code[i] === '=') {
            tokens.push({ type: 'punctuation', text: '=' });
            i++;
            // Attribute value
            if (i < len && (code[i] === '"' || code[i] === "'")) {
              var q = code[i];
              var vBuf = q;
              i++;
              while (i < len && code[i] !== q) { vBuf += code[i]; i++; }
              if (i < len) { vBuf += code[i]; i++; }
              tokens.push({ type: 'attr-value', text: vBuf });
            } else {
              // Unquoted value
              var uBuf2 = '';
              while (i < len && !/[\s>]/.test(code[i])) { uBuf2 += code[i]; i++; }
              tokens.push({ type: 'attr-value', text: uBuf2 });
            }
          }
          continue;
        }
        // Anything else in tag
        buf += code[i]; i++;
        flush('plain');
      }

      // Close of tag
      var closeBuf = '';
      if (i < len && code[i] === '/') { closeBuf += '/'; i++; }
      if (i < len && code[i] === '>') { closeBuf += '>'; i++; }
      if (closeBuf) tokens.push({ type: 'tag', text: closeBuf });
      continue;
    }

    // Entity
    if (ch === '&') {
      flush('plain');
      var eBuf = '&';
      i++;
      while (i < len && code[i] !== ';' && /[a-zA-Z0-9#]/.test(code[i])) { eBuf += code[i]; i++; }
      if (i < len && code[i] === ';') { eBuf += ';'; i++; }
      tokens.push({ type: 'string', text: eBuf });
      continue;
    }

    // Plain text
    buf += ch;
    i++;
  }
  flush('plain');
  return tokens;
}

// -- Token to TACO conversion -----------------------------------------
var TOKENIZERS = { js: tokenizeJS, javascript: tokenizeJS, css: tokenizeCSS, html: tokenizeHTML };

function tokensToTACO(tokArr) {
  var result = [];
  for (var i = 0; i < tokArr.length; i++) {
    var tok = tokArr[i];
    if (tok.type === 'plain') {
      result.push(tok.text);
    } else {
      result.push({ t: 'span', a: { class: 'bw_ce_' + tok.type }, c: tok.text });
    }
  }
  return result;
}

// -- Public: highlight ------------------------------------------------
function highlight(code, lang) {
  var tokenizer = TOKENIZERS[lang] || tokenizeJS;
  var tokens = tokenizer(code);
  return tokensToTACO(tokens);
}

// -- Caret save/restore -----------------------------------------------
function getCaretOffset(el) {
  var sel = window.getSelection();
  if (!sel.rangeCount) return 0;
  var range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
  return range.toString().length;
}

function setCaretOffset(el, offset) {
  var sel = window.getSelection();
  var range = document.createRange();
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  var pos = 0;
  var node;
  while ((node = walker.nextNode())) {
    var nodeLen = node.textContent.length;
    if (pos + nodeLen >= offset) {
      range.setStart(node, offset - pos);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    pos += nodeLen;
  }
  // If offset exceeds content, place at end
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// -- Public: codeEditor -----------------------------------------------
function codeEditor(opts) {
  opts = opts || {};
  var code = opts.code || '';
  var lang = opts.lang || 'js';
  var height = opts.height || '180px';
  var readOnly = !!opts.readOnly;
  var showLineNumbers = !!opts.lineNumbers;
  var className = 'bw_ce' + (opts.className ? ' ' + opts.className : '');

  var highlighted = highlight(code, lang);

  var codeAttrs = {
    spellcheck: 'false',
    class: 'bw_ce_code'
  };
  if (!readOnly) {
    codeAttrs.contenteditable = 'true';
  }

  // Build line number gutter TACO if requested
  var gutterTaco = null;
  if (showLineNumbers) {
    var lineCount = (code.match(/\n/g) || []).length + 1;
    var gutterLines = [];
    for (var li = 1; li <= lineCount; li++) {
      gutterLines.push({ t: 'span', c: String(li) });
    }
    gutterTaco = { t: 'div', a: { class: 'bw_ce_gutter' }, c: gutterLines };
  }

  var preBlock = { t: 'pre', a: { style: 'flex:1;min-width:0;margin:0' }, c: { t: 'code', a: codeAttrs, c: highlighted } };
  var innerContent = showLineNumbers
    ? { t: 'div', a: { class: 'bw_ce_wrap' }, c: [gutterTaco, preBlock] }
    : preBlock;

  return {
    t: 'div',
    a: { class: className, style: 'max-height:' + height + ';overflow:auto' },
    c: [innerContent],
    o: {
      mounted: function(el) {
        var codeEl = el.querySelector('.bw_ce_code');
        if (!codeEl) return;

        var currentCode = code;
        var debounceTimer = null;
        var gutterEl = showLineNumbers ? el.querySelector('.bw_ce_gutter') : null;

        // Resolve bw from global or import context
        var bw = (typeof window !== 'undefined' && window.bw) || {};

        function getValue() { return codeEl.textContent || ''; }

        function updateGutter(text) {
          if (!gutterEl) return;
          var count = (text.match(/\n/g) || []).length + 1;
          var html = '';
          for (var i = 1; i <= count; i++) html += '<span>' + i + '</span>';
          gutterEl.innerHTML = html;
        }

        function setValue(newCode) {
          currentCode = newCode;
          var tacos = highlight(newCode, lang);
          if (bw.html) codeEl.innerHTML = bw.html({ t: 'span', c: tacos });
          updateGutter(newCode);
        }

        // Expose API on the element
        el._bwCodeEdit = { getValue: getValue, setValue: setValue };

        // Scroll sync: keep gutter aligned with code
        if (gutterEl) {
          var scrollParent = codeEl.closest('.bw_ce') || el;
          scrollParent.addEventListener('scroll', function() {
            gutterEl.style.transform = 'translateY(' + (-scrollParent.scrollTop) + 'px)';
          });
          // If the outer .bw_ce has overflow, sync from there
          el.addEventListener('scroll', function() {
            gutterEl.style.transform = 'translateY(' + (-el.scrollTop) + 'px)';
          });
        }

        if (readOnly) return;

        function rehighlight() {
          var newCode = getValue();
          if (newCode === currentCode) return;
          currentCode = newCode;
          var offset = getCaretOffset(codeEl);
          var tacos = highlight(newCode, lang);
          if (bw.html) codeEl.innerHTML = bw.html({ t: 'span', c: tacos });
          setCaretOffset(codeEl, offset);
          updateGutter(newCode);
          if (opts.onChange) opts.onChange(newCode);
        }

        codeEl.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(rehighlight, 50);
        });

        // Tab key: insert 2 spaces
        codeEl.addEventListener('keydown', function(e) {
          if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '  ');
          }
        });
      }
    }
  };
}

// -- Auto-attach to bw when loaded as script tag ----------------------
function install(bw) {
  if (!bw) return;
  bw.highlight = highlight;
  bw.codeEditor = function(opts) {
    ensureCSS(bw);
    return codeEditor(opts);
  };
}

// Auto-install if bw is on window (script tag usage)
if (typeof window !== 'undefined' && window.bw) {
  install(window.bw);
}
var bitwrenchCodeEdit = { highlight, codeEditor, install, CSS_TEXT };

export { CSS_TEXT, codeEditor, bitwrenchCodeEdit as default, highlight, install, tokenizeCSS, tokenizeHTML, tokenizeJS };
//# sourceMappingURL=bitwrench-code-edit.esm.js.map
