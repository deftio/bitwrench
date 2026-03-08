/**
 * Shared navigation component for bitwrench docs site.
 * Two-tier nav: primary bar (dark) + conditional secondary sub-nav.
 * Sub-nav only appears when viewing an example page.
 * Collapses to a single hamburger menu on mobile.
 *
 * @param {string} currentPage - filename of the current page for active highlighting
 * @param {string} [baseHref] - prefix for page links when loaded from a different directory
 *   e.g. 'pages/' when loaded from root index.html
 */

(function() {
  'use strict';

  // Primary nav items (main dark bar)
  var primaryItems = [
    { text: 'Home', href: 'index.html' },
    { text: 'Quick Start', href: '00-quick-start.html' },
    { text: 'Components', href: '01-components.html' },
    { text: 'Styling', href: '03-styling.html' },
    { text: 'Themes', href: '10-themes.html' },
    { text: 'State', href: '05-state.html' },
    { text: 'Examples', href: '02-tables.html' },
    { text: 'API Reference', href: '08-api-reference.html' },
    { text: 'Builds', href: '09-builds.html' }
  ];

  // Secondary nav items (sub-nav bar, shown only on example pages)
  var secondaryItems = [
    { text: 'Tables', href: '02-tables.html' },
    { text: 'Forms', href: '02-forms.html' },
    { text: 'Dashboard', href: '04-dashboard.html' },
    { text: 'Code Editor', href: '11-code-editor.html' },
    { text: 'Digital Clock', href: '06-clock.html' },
    { text: 'Tic Tac Toe', href: '06-tic-tac-toe-tutorial.html' },
    { text: 'Comparison', href: '07-framework-comparison.html' }
  ];

  // Set of secondary hrefs for quick lookup
  var secondaryHrefs = {};
  secondaryItems.forEach(function(item) { secondaryHrefs[item.href] = true; });

  function resolveHref(href, baseHref) {
    if (!baseHref) return href;
    return href.startsWith('../') ? href.slice(3) : baseHref + href;
  }

  function isActive(itemHref, currentPage, resolvedHref) {
    return itemHref === currentPage || resolvedHref === currentPage;
  }

  function isExamplePage(currentPage) {
    for (var href in secondaryHrefs) {
      if (currentPage === href) return true;
    }
    return false;
  }

  function createExampleNav(currentPage, baseHref) {
    var homeHref = resolveHref(primaryItems[0].href, baseHref);
    var ver = window.bw && window.bw.version || '2.0.4';
    var onExamplePage = isExamplePage(currentPage);

    // Build primary link items
    var primaryLinks = primaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active;
      if (item.text === 'Examples') {
        // "Examples" highlights when any secondary page is active
        active = onExamplePage;
      } else {
        active = isActive(item.href, currentPage, rh);
      }
      return {
        t: 'li',
        c: {
          t: 'a',
          a: {
            href: rh,
            class: 'bw-site-nav-link' + (active ? ' active' : '')
          },
          c: item.text
        }
      };
    });

    // Build secondary link items
    var secondaryLinks = secondaryItems.map(function(item) {
      var rh = resolveHref(item.href, baseHref);
      var active = isActive(item.href, currentPage, rh);
      return {
        t: 'a',
        a: {
          href: rh,
          class: 'bw-site-subnav-link' + (active ? ' active' : '')
        },
        c: item.text
      };
    });

    // Build mobile menu (all items, flat)
    var allItems = primaryItems.concat(secondaryItems.filter(function(s) {
      // Skip duplicates — "Examples" in primary already links to first secondary
      return s.href !== primaryItems.filter(function(p) { return p.text === 'Examples'; })[0].href;
    }));
    var mobileLinks = allItems.map(function(item) {
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

    // Wrapper children: primary nav + mobile menu, conditionally + subnav
    var wrapperChildren = [
      // Primary nav (dark bar)
      {
        t: 'nav',
        a: { class: 'bw-site-nav' },
        c: [
          {
            t: 'div',
            a: { class: 'bw-site-nav-inner' },
            c: [
              // Left: logo + version
              {
                t: 'a',
                a: {
                  href: homeHref,
                  class: 'bw-site-nav-brand'
                },
                c: [
                  {
                    t: 'img',
                    a: {
                      src: '../images/bitwrench-thick-logo.svg',
                      alt: 'bitwrench',
                      class: 'bw-site-nav-logo'
                    }
                  },
                  {
                    t: 'span',
                    a: { class: 'bw-site-nav-ver' },
                    c: 'v' + ver
                  }
                ]
              },
              // Center: primary links (desktop)
              {
                t: 'ul',
                a: { class: 'bw-site-nav-links' },
                c: primaryLinks
              },
              // Right: controls
              {
                t: 'div',
                a: { class: 'bw-site-nav-controls' },
                c: [
                  {
                    t: 'button',
                    a: {
                      class: 'bw-site-nav-toggle',
                      title: 'Toggle theme palette',
                      onclick: function() {
                        var mode = bw.toggleTheme();
                        this.textContent = mode === 'alternate' ? '\u2600' : '\u263D';
                      }
                    },
                    c: '\u263D'
                  },
                  {
                    t: 'button',
                    a: {
                      class: 'bw-site-nav-hamburger',
                      title: 'Toggle menu',
                      'aria-label': 'Toggle navigation menu',
                      onclick: function() {
                        var wrapper = this.closest('.bw-site-nav-wrapper');
                        var mobile = wrapper && wrapper.querySelector('.bw-site-nav-mobile');
                        if (mobile) {
                          mobile.classList.toggle('open');
                          this.textContent = mobile.classList.contains('open') ? '\u2715' : '\u2630';
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
      }
    ];

    // Only add sub-nav when on an example page
    if (onExamplePage) {
      wrapperChildren.push({
        t: 'div',
        a: { class: 'bw-site-subnav' },
        c: [
          {
            t: 'div',
            a: { class: 'bw-site-subnav-inner' },
            c: secondaryLinks
          }
        ]
      });
    }

    // Mobile menu (always present, toggled by hamburger)
    wrapperChildren.push({
      t: 'div',
      a: { class: 'bw-site-nav-mobile' },
      c: mobileLinks
    });

    return {
      t: 'div',
      a: { class: 'bw-site-nav-wrapper' },
      c: wrapperChildren
    };
  }

  function mountExampleNav(selector, currentPage, baseHref) {
    if (typeof window.bw !== 'undefined' && window.bw.DOM) {
      window.bw.DOM(selector, createExampleNav(currentPage || '', baseHref));
    }
  }

  window.createExampleNav = createExampleNav;
  window.mountExampleNav = mountExampleNav;
})();
