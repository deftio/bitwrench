/**
 * Shared navigation component for bitwrench docs site.
 * Two-tier nav: primary bar (dark) + conditional secondary sub-nav.
 * Sub-nav only appears when viewing an example page.
 * Collapses to a single hamburger menu on mobile.
 * Supports dropdown menus for grouped items.
 *
 * @param {string} currentPage - filename of the current page for active highlighting
 * @param {string} [baseHref] - prefix for page links when loaded from a different directory
 *   e.g. 'pages/' when loaded from root index.html
 */

(function() {
  'use strict';

  // Primary nav items (main dark bar)
  // Items with `children` array render as hover-activated dropdowns.
  var primaryItems = [
    { text: 'Home', href: 'index.html' },
    { text: 'Quick Start', href: '00-quick-start.html' },
    { text: 'Components', href: '01-components.html' },
    { text: 'Styling', href: '03-styling.html' },
    { text: 'Themes', href: '10-themes.html' },
    { text: 'State', href: '05-state.html' },
    { text: 'Examples', href: '02-tables.html' },
    {
      text: 'Docs', href: '08-api-reference.html',
      children: [
        { text: 'API Reference', href: '08-api-reference.html' },
        { text: 'Builds', href: '09-builds.html' },
        { text: 'Debugging', href: '11-debugging.html' }
      ]
    }
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

  // Collect all child hrefs for dropdown active highlighting
  var dropdownChildHrefs = {};
  primaryItems.forEach(function(item) {
    if (item.children) {
      item.children.forEach(function(child) {
        dropdownChildHrefs[child.href] = item;
      });
    }
  });

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

  function isDropdownActive(item, currentPage, baseHref) {
    if (!item.children) return false;
    for (var i = 0; i < item.children.length; i++) {
      var rh = resolveHref(item.children[i].href, baseHref);
      if (isActive(item.children[i].href, currentPage, rh)) return true;
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
        active = onExamplePage;
      } else if (item.children) {
        active = isDropdownActive(item, currentPage, baseHref);
      } else {
        active = isActive(item.href, currentPage, rh);
      }

      // Dropdown item
      if (item.children) {
        var dropdownLinks = item.children.map(function(child) {
          var crh = resolveHref(child.href, baseHref);
          var childActive = isActive(child.href, currentPage, crh);
          return {
            t: 'a',
            a: {
              href: crh,
              class: 'bw_site_dropdown_link' + (childActive ? ' active' : '')
            },
            c: child.text
          };
        });

        return {
          t: 'li',
          a: { class: 'bw_site_nav_dropdown' },
          c: [
            {
              t: 'a',
              a: {
                href: rh,
                class: 'bw_site_nav_link' + (active ? ' active' : '')
              },
              c: item.text + ' \u25BE'
            },
            {
              t: 'div',
              a: { class: 'bw_site_dropdown_menu' },
              c: dropdownLinks
            }
          ]
        };
      }

      // Regular item
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

    // Build secondary link items
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

    // Build mobile menu (all items, flat — dropdowns expanded)
    var mobileItems = [];
    primaryItems.forEach(function(item) {
      if (item.children) {
        item.children.forEach(function(child) {
          mobileItems.push(child);
        });
      } else {
        mobileItems.push(item);
      }
    });
    secondaryItems.forEach(function(s) {
      // Skip duplicates — "Examples" in primary already links to first secondary
      var isDup = false;
      primaryItems.forEach(function(p) {
        if (p.text === 'Examples' && p.href === s.href) isDup = true;
      });
      if (!isDup) mobileItems.push(s);
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
                    src: '../images/bitwrench-thick-logo.svg',
                    alt: 'bitwrench',
                    class: 'bw_site_nav_logo'
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
                    class: 'bw_site_nav_hamburger',
                    title: 'Toggle menu',
                    'aria-label': 'Toggle navigation menu',
                    onclick: function() {
                      var el = document.getElementById('bw_site_nav_mobile_menu');
                      if (el) {
                        el.classList.toggle('open');
                        this.textContent = el.classList.contains('open') ? '\u2715' : '\u2630';
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

    // Only add sub-nav when on an example page
    if (onExamplePage) {
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
      var navEl = document.querySelector(selector);
      if (navEl && parts.belowNav.length) {
        var belowWrapper = bw.createDOM({
          t: 'div', a: { class: 'bw_site_nav_wrapper' }, c: parts.belowNav
        });
        navEl.parentNode.insertBefore(belowWrapper, navEl.nextSibling);
      }
    }
  }

  window.createExampleNav = createExampleNav;
  window.mountExampleNav = mountExampleNav;
})();
