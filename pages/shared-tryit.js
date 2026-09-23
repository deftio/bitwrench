/**
 * Shared try-it infrastructure for bitwrench examples
 * Provides editable code editors, pipeline demos, and style-origin callouts.
 */

(function() {
  'use strict';

  /**
   * makeTryIt(opts) — editable code + live output side-by-side
   *
   * A component, not a DOM script: el.bw.run() re-runs the code, the Run
   * button's onclick calls it, and o.mounted calls it once for the first paint.
   *
   * @param {Object} opts
   * @param {string} opts.code - Initial code to display
   * @param {string} [opts.height] - Height of textarea (default '180px')
   * @param {string} [opts.label] - Label above editor (default 'Edit & Run')
   * @param {string} [opts.lang='js'] - 'js' runs the code with `bw` and `target`
   *   in scope; 'html' renders the code as a whole page in a sandboxed iframe
   * @param {string} [opts.outputId] - id for the output panel, so demo code can
   *   target it by selector (e.g. bw.DOM('#demo', ...)) instead of using `target`
   * @param {boolean} [opts.lineNumbers] - show the editor's line-number gutter
   * @param {string} [opts.className] - extra class on the container, for page-level styling
   * @returns {Object} TACO object
   */
  function makeTryIt(opts) {
    var id = bw.uuid('tryit');
    var code = opts.code || '';
    var height = opts.height || '180px';
    var label = opts.label || 'Edit & Run';
    var lang = opts.lang || 'js';
    var isPage = lang === 'html';

    var outputTACO = isPage
      ? { t: 'iframe', a: { class: 'tryit-output tryit-output-page', sandbox: 'allow-scripts', style: 'min-height:' + height } }
      : { t: 'div', a: opts.outputId ? { class: 'tryit-output', id: opts.outputId } : { class: 'tryit-output' }, c: '' };

    // Use syntax-highlighted editor if bw.codeEditor is available, else fallback to textarea
    var editorTACO = typeof bw.codeEditor === 'function'
      ? bw.codeEditor({ code: code, lang: lang, height: height, lineNumbers: !!opts.lineNumbers })
      : { t: 'textarea', a: { class: 'tryit-textarea', spellcheck: 'false', style: 'height:' + height }, c: code };

    // Read the editor's current text: code editor, or textarea fallback
    function getCode(el) {
      var ceEl = el.querySelector('.bw_ce');
      if (ceEl && ceEl._bwCodeEdit) return ceEl._bwCodeEdit.getValue();
      if (ceEl) {
        // The first run fires from this container's mounted hook, which runs
        // before the nested editor's own mounted hook attaches _bwCodeEdit.
        // The highlighted source is already in the DOM by then.
        var codeEl = ceEl.querySelector('.bw_ce_code');
        if (codeEl) return codeEl.textContent || '';
      }
      var textarea = el.querySelector('.tryit-textarea');
      return textarea ? textarea.value : '';
    }

    return {
      t: 'div',
      a: { class: 'tryit-container' + (opts.className ? ' ' + opts.className : ''), id: id },
      o: {
        handle: {
          run: function(el) {
            var output = el.querySelector('.tryit-output');
            var errorEl = el.querySelector('.tryit-error');
            bw.patch(errorEl, '');
            errorEl.style.display = 'none';
            if (isPage) { output.srcdoc = getCode(el); return; }
            bw.patch(output, '');
            try {
              new Function('bw', 'target', getCode(el))(bw, output);
            } catch (e) {
              bw.patch(errorEl, e.message);
              errorEl.style.display = 'block';
            }
          }
        },
        mounted: function(el) { el.bw.run(); }   // first paint
      },
      c: [
        {
          t: 'div',
          a: { class: 'tryit-grid' },
          c: [
            {
              t: 'div',
              a: { class: 'tryit-editor-col' },
              c: [
                { t: 'div', a: { class: 'tryit-label' }, c: label },
                editorTACO,
                {
                  t: 'div',
                  a: { class: 'tryit-controls' },
                  c: [
                    bw.makeButton({ text: 'Run', variant: 'primary', size: 'sm', className: 'tryit-run',
                      onclick: function() { bw.el(id).bw.run(); } })
                  ]
                },
                { t: 'div', a: { class: 'tryit-error' }, c: '' }
              ]
            },
            {
              t: 'div',
              a: { class: 'tryit-output-col' },
              c: [
                { t: 'div', a: { class: 'tryit-label tryit-label-result' }, c: isPage ? 'Preview' : 'Result' },
                outputTACO
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * showPipeline(opts) — 3-column: helper call | TACO returned | rendered result
   * @param {Object} opts
   * @param {string} opts.helperCode - Code string of the helper call
   * @param {Object} opts.taco - The TACO object returned by the helper
   * @param {string} [opts.label] - Label for the demo
   * @returns {Object} TACO object
   */
  function showPipeline(opts) {
    var tacoStr;
    try {
      tacoStr = JSON.stringify(opts.taco, function(key, value) {
        if (typeof value === 'function') return '[Function]';
        return value;
      }, 2);
    } catch (e) {
      tacoStr = '{ ... }';
    }

    // Truncate if too long
    if (tacoStr.length > 400) {
      tacoStr = tacoStr.substring(0, 400) + '\n  ...';
    }

    // Use bw.codeEditor if available (syntax-highlighted), otherwise fall back to plain pre/code
    var useCE = typeof bw !== 'undefined' && typeof bw.codeEditor === 'function';

    function codeBlock(code, lang) {
      if (useCE) {
        return bw.codeEditor({ code: code, lang: lang || 'js', readOnly: true, height: 'auto' });
      }
      return { t: 'div', a: { class: 'bw_site_pages_code' }, c: { t: 'pre', c: { t: 'code', c: code } } };
    }

    return {
      t: 'div',
      a: { class: 'pipeline-demo' },
      c: [
        opts.label ? { t: 'div', a: { class: 'pipeline-label' }, c: opts.label } : '',
        {
          t: 'div',
          a: { class: 'pipeline-grid' },
          c: [
            {
              t: 'div',
              a: { class: 'pipeline-col' },
              c: [
                { t: 'div', a: { class: 'pipeline-col-label' }, c: 'Helper Call' },
                codeBlock(opts.helperCode, 'js')
              ]
            },
            { t: 'div', a: { class: 'pipeline-arrow' }, c: '\u2192' },
            {
              t: 'div',
              a: { class: 'pipeline-col' },
              c: [
                { t: 'div', a: { class: 'pipeline-col-label' }, c: 'Returns This Object' },
                codeBlock(tacoStr, 'js')
              ]
            },
            { t: 'div', a: { class: 'pipeline-arrow' }, c: '\u2192' },
            {
              t: 'div',
              a: { class: 'pipeline-col' },
              c: [
                { t: 'div', a: { class: 'pipeline-col-label' }, c: 'Renders As' },
                { t: 'div', a: { class: 'bw_site_pages_result' }, c: opts.taco }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * makeStyleOrigin() — collapsible callout explaining where bw_* classes come from
   * @returns {Object} TACO object
   */
  function makeStyleOrigin() {
    var bodyId = bw.uuid('style-origin');
    return {
      t: 'div',
      a: { class: 'bw_site_pages_callout bw_site_pages_callout_concept' },
      c: [
        {
          t: 'h4',
          a: {
            class: 'bw_site_pages_callout_title',
            style: 'cursor: pointer; user-select: none;',
            onclick: function() {
              var content = bw.el(bodyId);
              if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
          },
          c: 'How are these styled?'
        },
        {
          t: 'div',
          a: { class: 'style-origin-content', id: bodyId, style: 'display: none;' },
          c: [
            {
              t: 'p',
              c: [
                'Bitwrench doesn\'t care where your CSS comes from. The ', { t: 'code', c: 'bw_*' },
                ' classes on this page come from ', { t: 'code', c: 'bw.loadStyles()' },
                ' (a convenience starter kit), but you can use any CSS you want:'
              ]
            },
            {
              t: 'ul',
              c: [
                { t: 'li', c: [{ t: 'strong', c: 'Inline styles' }, ' \u2014 JS objects via ', { t: 'code', c: 'bw.s()' }, ', no CSS file needed'] },
                { t: 'li', c: [{ t: 'strong', c: 'Your own CSS' }, ' \u2014 any classes (Bootstrap, Tailwind, hand-written)'] },
                { t: 'li', c: [{ t: 'strong', c: 'Generated classes' }, ' \u2014 ', { t: 'code', c: 'bw.css()' }, ' + ', { t: 'code', c: 'bw.injectCSS()' }, ' for :hover, media queries'] },
                { t: 'li', c: [{ t: 'strong', c: 'bitwrench.css' }, ' \u2014 built-in starter kit (or ', { t: 'code', c: 'bw.loadStyles()' }, ' to generate at runtime)'] }
              ]
            },
            {
              t: 'p',
              c: [
                'See the ', { t: 'a', a: { href: '03-styling.html' }, c: 'Styling' },
                ' page for the full story.'
              ]
            }
          ]
        }
      ]
    };
  }

  // Export to window
  window.makeTryIt = makeTryIt;
  window.showPipeline = showPipeline;
  window.makeStyleOrigin = makeStyleOrigin;
})();
