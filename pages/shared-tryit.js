/**
 * Shared try-it infrastructure for bitwrench examples
 * Provides editable code editors, pipeline demos, and style-origin callouts.
 */

(function() {
  'use strict';

  /**
   * makeTryIt(opts) — editable code + live output side-by-side
   * @param {Object} opts
   * @param {string} opts.code - Initial code to display
   * @param {string} [opts.height] - Height of textarea (default '180px')
   * @param {string} [opts.label] - Label above editor (default 'Edit & Run')
   * @returns {Object} TACO object
   */
  function makeTryIt(opts) {
    var id = 'tryit-' + (bw._idCounter++);
    var code = opts.code || '';
    var height = opts.height || '180px';
    var label = opts.label || 'Edit & Run';
    var lang = opts.lang || 'js';

    // Use syntax-highlighted editor if bw.codeEditor is available, else fallback to textarea
    var useCE = typeof bw.codeEditor === 'function';

    var editorTACO = useCE
      ? bw.codeEditor({ code: code, lang: lang, height: height })
      : {
          t: 'textarea',
          a: {
            class: 'tryit-textarea',
            spellcheck: 'false',
            style: 'height:' + height
          },
          c: code
        };

    return {
      t: 'div',
      a: { class: 'tryit-container', id: id },
      o: {
        mounted: function(el) {
          var output = el.querySelector('.tryit-output');
          var errorEl = el.querySelector('.tryit-error');
          var runBtn = el.querySelector('.tryit-run');

          // Get code from either code editor or textarea
          var ceEl = el.querySelector('.bw_ce');
          var textarea = el.querySelector('.tryit-textarea');

          function getCode() {
            if (ceEl && ceEl._bwCodeEdit) return ceEl._bwCodeEdit.getValue();
            if (textarea) return textarea.value;
            return '';
          }

          function runCode() {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
            output.innerHTML = '';
            try {
              var fn = new Function('bw', 'target', getCode());
              fn(bw, output);
            } catch (e) {
              errorEl.textContent = e.message;
              errorEl.style.display = 'block';
            }
          }

          runBtn.addEventListener('click', runCode);
          // Auto-run on mount
          runCode();
        }
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
                    bw.makeButton({ text: 'Run', variant: 'primary', size: 'sm', className: 'tryit-run' })
                  ]
                },
                { t: 'div', a: { class: 'tryit-error' }, c: '' }
              ]
            },
            {
              t: 'div',
              a: { class: 'tryit-output-col' },
              c: [
                { t: 'div', a: { class: 'tryit-label tryit-label-result' }, c: 'Result' },
                { t: 'div', a: { class: 'tryit-output' }, c: '' }
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
      return { t: 'div', a: { class: 'bw_code_block' }, c: { t: 'pre', c: { t: 'code', c: code } } };
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
                { t: 'div', a: { class: 'bw_demo_result' }, c: opts.taco }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * makeStyleOrigin() — collapsible callout explaining where bw-* classes come from
   * @returns {Object} TACO object
   */
  function makeStyleOrigin() {
    var id = 'style-origin-' + (bw._idCounter++);
    return {
      t: 'div',
      a: { class: 'callout callout-concept', id: id },
      c: [
        {
          t: 'h4',
          a: {
            style: 'cursor: pointer; user-select: none;',
            onclick: function() {
              var content = document.getElementById(id).querySelector('.style-origin-content');
              if (content) {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
              }
            }
          },
          c: 'How are these styled?'
        },
        {
          t: 'div',
          a: { class: 'style-origin-content', style: 'display: none;' },
          c: [
            {
              t: 'p',
              c: [
                'Bitwrench doesn\'t care where your CSS comes from. The ', { t: 'code', c: 'bw-*' },
                ' classes on this page come from ', { t: 'code', c: 'bitwrench.css' },
                ' (a convenience starter kit), but you can use any CSS you want:'
              ]
            },
            {
              t: 'ul',
              c: [
                { t: 'li', c: [{ t: 'strong', c: 'Inline styles' }, ' \u2014 JS objects via ', { t: 'code', c: 'bw.s()' }, ', no CSS file needed'] },
                { t: 'li', c: [{ t: 'strong', c: 'Your own CSS' }, ' \u2014 any classes (Bootstrap, Tailwind, hand-written)'] },
                { t: 'li', c: [{ t: 'strong', c: 'Generated classes' }, ' \u2014 ', { t: 'code', c: 'bw.css()' }, ' + ', { t: 'code', c: 'bw.injectCSS()' }, ' for :hover, media queries'] },
                { t: 'li', c: [{ t: 'strong', c: 'bitwrench.css' }, ' \u2014 built-in starter kit (or ', { t: 'code', c: 'bw.loadDefaultStyles()' }, ' to generate at runtime)'] }
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
