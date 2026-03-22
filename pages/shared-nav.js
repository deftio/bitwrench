/**
 * Shared navigation component for bitwrench docs site.
 * Two-tier nav: primary bar (dark) + conditional secondary sub-nav.
 * Sub-nav appears when viewing a Learn, Examples, Server, or Docs page.
 * Collapses to a single hamburger menu on mobile.
 *
 * @param {string} currentPage - filename of the current page for active highlighting
 * @param {string} [baseHref] - prefix for page links when loaded from a different directory
 *   e.g. 'pages/' when loaded from root index.html
 */

(function() {
  'use strict';

  // Primary nav items (main dark bar) — 6 items
  var primaryItems = [
    { text: 'Home', href: 'index.html' },
    { text: 'Learn', href: '00-quick-start.html' },
    { text: 'Examples', href: '04-dashboard.html' },
    { text: 'Server', href: '12-bwserve-protocol.html' },
    { text: 'Downloads', href: '09-builds.html' },
    { text: 'Docs', href: '08-api-reference.html' }
  ];

  // Learn sub-nav (ordered reading path)
  var learnSecondaryItems = [
    { text: 'Quick Start', href: '00-quick-start.html' },
    { text: 'Thinking in BW', href: 'thinking-in-bitwrench.html' },
    { text: 'Components', href: '01-components.html' },
    { text: 'Styling', href: '03-styling.html' },
    { text: 'Themes', href: '10-themes.html' },
    { text: 'Utility CSS', href: '16-utility-css.html' },
    { text: 'Tables & Forms', href: '02-tables-forms.html' },
    { text: 'State', href: '05-state.html' },
    { text: 'HTML Gen', href: '15-html-generation.html' }
  ];

  // Examples sub-nav
  var secondaryItems = [
    { text: 'Dashboard', href: '04-dashboard.html' },
    { text: 'Digital Clock', href: '06-clock.html' },
    { text: 'Tic Tac Toe', href: '06-tic-tac-toe-tutorial.html' },
    { text: 'Comparison', href: '07-framework-comparison.html' },
    { text: 'Multi-Page', href: '15-multi-page-site.html' },
    { text: 'App Gallery', href: '../examples/' }
  ];

  // Docs sub-nav
  var docsSecondaryItems = [
    { text: 'API Reference', href: '08-api-reference.html' },
    { text: 'Debugging', href: '11-debugging.html' },
    { text: 'Code Editor', href: '13-code-editor.html' }
  ];

  // bwserve sub-nav (unchanged)
  var bwserveSecondaryItems = [
    { text: 'Protocol', href: '12-bwserve-protocol.html' },
    { text: 'CLI', href: '17-bwcli.html' },
    { text: 'Sandbox', href: '14-bwserve-sandbox.html' }
  ];

  // Set of hrefs for quick lookup
  var learnSecondaryHrefs = {};
  learnSecondaryItems.forEach(function(item) { learnSecondaryHrefs[item.href] = true; });

  var secondaryHrefs = {};
  secondaryItems.forEach(function(item) { secondaryHrefs[item.href] = true; });

  var docsSecondaryHrefs = {};
  docsSecondaryItems.forEach(function(item) { docsSecondaryHrefs[item.href] = true; });

  var bwserveSecondaryHrefs = {};
  bwserveSecondaryItems.forEach(function(item) { bwserveSecondaryHrefs[item.href] = true; });

  function resolveHref(href, baseHref) {
    if (!baseHref) return href;
    return href.startsWith('../') ? href.slice(3) : baseHref + href;
  }

  function isActive(itemHref, currentPage, resolvedHref) {
    return itemHref === currentPage || resolvedHref === currentPage;
  }

  function isLearnPage(currentPage) {
    for (var href in learnSecondaryHrefs) {
      if (currentPage === href) return true;
    }
    return false;
  }

  function isExamplePage(currentPage) {
    for (var href in secondaryHrefs) {
      if (currentPage === href) return true;
    }
    return false;
  }

  function isDocsPage(currentPage) {
    for (var href in docsSecondaryHrefs) {
      if (currentPage === href) return true;
    }
    return false;
  }

  function isBwservePage(currentPage) {
    for (var href in bwserveSecondaryHrefs) {
      if (currentPage === href) return true;
    }
    return false;
  }

  function createExampleNav(currentPage, baseHref) {
    var homeHref = resolveHref(primaryItems[0].href, baseHref);
    var ver = window.bw && window.bw.version || '2.0.4';
    var onLearnPage = isLearnPage(currentPage);
    var onExamplePage = isExamplePage(currentPage);
    var onDocsPage = isDocsPage(currentPage);
    var onBwservePage = isBwservePage(currentPage);

    // Build primary link items
    var primaryLinks = primaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active;
      if (item.text === 'Learn') {
        active = onLearnPage;
      } else if (item.text === 'Examples') {
        active = onExamplePage;
      } else if (item.text === 'Docs') {
        active = onDocsPage;
      } else if (item.text === 'Server') {
        active = onBwservePage;
      } else {
        active = isActive(item.href, currentPage, rh);
      }

      return {
        t: 'li',
        c: {
          t: 'a',
          a: {
            href: rh,
            class: 'bw_site_nav_link' + (active ? ' active' : '')
          },
          c: item.text
        }
      };
    });

    // Build learn secondary links
    var learnSecondaryLinks = learnSecondaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active = isActive(item.href, currentPage, rh);
      return {
        t: 'a',
        a: {
          href: rh,
          class: 'bw_site_subnav_link' + (active ? ' active' : '')
        },
        c: item.text
      };
    });

    // Build example secondary links
    var secondaryLinks = secondaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active = isActive(item.href, currentPage, rh);
      return {
        t: 'a',
        a: {
          href: rh,
          class: 'bw_site_subnav_link' + (active ? ' active' : '')
        },
        c: item.text
      };
    });

    // Build docs secondary links
    var docsSecondaryLinks = docsSecondaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active = isActive(item.href, currentPage, rh);
      return {
        t: 'a',
        a: {
          href: rh,
          class: 'bw_site_subnav_link' + (active ? ' active' : '')
        },
        c: item.text
      };
    });

    // Build bwserve secondary links
    var bwserveSecondaryLinks = bwserveSecondaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active = isActive(item.href, currentPage, rh);
      return {
        t: 'a',
        a: {
          href: rh,
          class: 'bw_site_subnav_link' + (active ? ' active' : '')
        },
        c: item.text
      };
    });

    // Build mobile menu (all items, flat — deduplicated)
    var mobileItems = [];
    var seen = {};
    primaryItems.forEach(function(item) {
      mobileItems.push(item);
      seen[item.href] = true;
    });
    // Add learn sub-items
    learnSecondaryItems.forEach(function(s) {
      if (!seen[s.href]) { mobileItems.push(s); seen[s.href] = true; }
    });
    // Add example sub-items
    secondaryItems.forEach(function(s) {
      if (!seen[s.href]) { mobileItems.push(s); seen[s.href] = true; }
    });
    // Add docs sub-items
    docsSecondaryItems.forEach(function(s) {
      if (!seen[s.href]) { mobileItems.push(s); seen[s.href] = true; }
    });
    // Add bwserve sub-items
    bwserveSecondaryItems.forEach(function(s) {
      if (!seen[s.href]) { mobileItems.push(s); seen[s.href] = true; }
    });

    var mobileLinks = mobileItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active = isActive(item.href, currentPage, rh);
      return {
        t: 'a',
        a: {
          href: rh,
          class: active ? 'active' : ''
        },
        c: item.text
      };
    });

    // Primary nav (dark bar) — mounted into #example-nav which is sticky
    var primaryNav = {
      t: 'nav',
      a: { class: 'bw_site_nav' },
      c: [
        {
          t: 'div',
          a: { class: 'bw_site_nav_inner' },
          c: [
            // Left: logo + version
            {
              t: 'a',
              a: {
                href: homeHref,
                class: 'bw_site_nav_brand'
              },
              c: [
                {
                  t: 'img',
                  a: {
                    src: '../images/bitwrench-icon.svg',
                    alt: 'bitwrench',
                    class: 'bw_site_nav_icon'
                  }
                },
                {
                  t: 'span',
                  a: { class: 'bw_site_nav_ver' },
                  c: 'v' + ver
                }
              ]
            },
            // Center: primary links (desktop)
            {
              t: 'ul',
              a: { class: 'bw_site_nav_links' },
              c: primaryLinks
            },
            // Right: controls
            {
              t: 'div',
              a: { class: 'bw_site_nav_controls' },
              c: [
                {
                  t: 'button',
                  a: {
                    class: 'bw_site_nav_toggle',
                    id: 'bw_theme_toggle_btn',
                    title: 'Toggle theme palette',
                    onclick: function() {
                      var mode = bw.toggleStyles();
                      this.textContent = mode === 'alternate' ? '\u2600' : '\u263D';
                      bw.setCookie('bw_theme_mode', mode, 365, { path: '/' });
                    }
                  },
                  c: '\u263D'
                },
                {
                  t: 'button',
                  a: {
                    class: 'bw_site_nav_hamburger',
                    title: 'Toggle menu',
                    'aria-label': 'Toggle navigation menu',
                    onclick: function() {
                      var els = bw.$('#bw_site_nav_mobile_menu');
                      if (els.length) {
                        els[0].classList.toggle('open');
                        this.textContent = els[0].classList.contains('open') ? '\u2715' : '\u2630';
                      }
                    }
                  },
                  c: '\u2630'
                }
              ]
            }
          ]
        }
      ]
    };

    // Secondary items: sub-nav + mobile menu (inserted after #example-nav)
    var belowNav = [];

    // Show sub-nav when on a learn, example, docs, or bwserve page
    if (onLearnPage) {
      belowNav.push({
        t: 'div',
        a: { class: 'bw_site_subnav' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_site_subnav_inner' },
            c: learnSecondaryLinks
          }
        ]
      });
    } else if (onExamplePage) {
      belowNav.push({
        t: 'div',
        a: { class: 'bw_site_subnav' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_site_subnav_inner' },
            c: secondaryLinks
          }
        ]
      });
    } else if (onDocsPage) {
      belowNav.push({
        t: 'div',
        a: { class: 'bw_site_subnav' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_site_subnav_inner' },
            c: docsSecondaryLinks
          }
        ]
      });
    } else if (onBwservePage) {
      belowNav.push({
        t: 'div',
        a: { class: 'bw_site_subnav' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_site_subnav_inner' },
            c: bwserveSecondaryLinks
          }
        ]
      });
    }

    // Mobile menu (always present, toggled by hamburger)
    belowNav.push({
      t: 'div',
      a: { class: 'bw_site_nav_mobile', id: 'bw_site_nav_mobile_menu' },
      c: mobileLinks
    });

    return { primaryNav: primaryNav, belowNav: belowNav };
  }

  function mountExampleNav(selector, currentPage, baseHref) {
    if (typeof window.bw !== 'undefined' && window.bw.DOM) {
      var parts = createExampleNav(currentPage || '', baseHref);

      // Mount primary nav into the selector element (sticky)
      bw.DOM(selector, parts.primaryNav);

      // Insert sub-nav + mobile menu as siblings after the nav container
      var navEls = bw.$(selector);
      var navEl = navEls.length ? navEls[0] : null;
      if (navEl && parts.belowNav.length) {
        var belowWrapper = bw.createDOM({
          t: 'div', a: { class: 'bw_site_nav_wrapper' }, c: parts.belowNav
        });
        navEl.parentNode.insertBefore(belowWrapper, navEl.nextSibling);
      }

      // Restore saved theme preference from cookie — only if styles
      // were generated on this page (bw_style_global injected by applyStyles).
      // Otherwise ensure clean state: remove stale alt class and cookie.
      var savedMode = bw.getCookie('bw_theme_mode');
      if ((savedMode === 'alternate' || savedMode === 'primary') && document.getElementById('bw_style_global')) {
        bw.toggleStyles();
        var btns = bw.$('#bw_theme_toggle_btn');
        if (btns.length) {
          btns[0].textContent = savedMode === 'alternate' ? '\u2600' : '\u263D';
        }
      } else {
        // No active theme — force clean state
        document.documentElement.classList.remove('bw_theme_alt');
        if (savedMode) {
          // Clear stale cookie (try all likely paths)
          bw.setCookie('bw_theme_mode', '', -1);
          bw.setCookie('bw_theme_mode', '', -1, { path: '/' });
          bw.setCookie('bw_theme_mode', '', -1, { path: '/pages/' });
          bw.setCookie('bw_theme_mode', '', -1, { path: '/pages' });
        }
      }

      // Append shared site footer via bw.DOM on body
      var footerTaco = {
        t: 'footer', a: { class: 'bw_site_footer_shared' },
        c: { t: 'p', c: 'bitwrench\u2122 \u00A9 deftio / M. Chatterjee \u00B7 BSD-2-Clause' }
      };
      var body = bw.$('body');
      if (body.length) {
        body[0].appendChild(bw.createDOM(footerTaco));
      }
    }
  }

  window.createExampleNav = createExampleNav;
  window.mountExampleNav = mountExampleNav;
})();
