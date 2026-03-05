/**
 * Shared navigation component for bitwrench examples
 * Includes hamburger menu for mobile/tablet breakpoints
 *
 * @param {string} currentPage - filename of the current page for active highlighting
 * @param {string} [baseHref] - prefix for page links when loaded from a different directory
 *   e.g. 'pages/' when loaded from root index.html
 */

(function() {
  'use strict';

  const navItems = [
    { text: 'Home', href: '../index.html' },
    { text: 'Quick Start', href: '00-quick-start.html' },
    { text: 'Styling', href: '03-styling.html' },
    { text: 'Components', href: '01-components.html' },
    { text: 'Tables & Data', href: '02-tables-forms.html' },
    { text: 'State', href: '05-state.html' },
    { text: 'Dashboard', href: '04-dashboard.html' },
    { text: 'Themes', href: '10-themes.html' },
    { text: 'Tic Tac Toe', href: '06-tic-tac-toe-tutorial.html' },
    { text: 'Comparison', href: '07-framework-comparison.html' },
    { text: 'API Reference', href: '08-api-reference.html' },
    { text: 'Builds', href: '09-builds.html' }
  ];

  function createExampleNav(currentPage, baseHref) {
    const items = navItems.map(item => {
      let href = item.href;
      if (baseHref) {
        // When loaded from a different directory (e.g. root), rewrite paths:
        // '../index.html' → 'index.html', '00-quick-start.html' → 'pages/00-quick-start.html'
        href = item.href.startsWith('../') ? item.href.slice(3) : baseHref + item.href;
      }
      return { ...item, href: href, active: item.href === currentPage || href === currentPage };
    });

    // Home link for brand (first navItem)
    const homeHref = items[0].href;

    const ver = window.bw && window.bw.version || '2.0.3';

    return {
      t: 'nav',
      a: {
        class: 'bw-site-nav',
      },
      c: [
        {
          t: 'div',
          a: { class: 'bw-site-nav-inner' },
          c: [
            // Left: logo image + version
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
                    src: '/images/bitwrench-thick-logo.svg',
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
            // Center: nav links (desktop)
            {
              t: 'ul',
              a: { class: 'bw-site-nav-links' },
              c: items.map(item => ({
                t: 'li',
                c: {
                  t: 'a',
                  a: {
                    href: item.href,
                    class: 'bw-site-nav-link' + (item.active ? ' active' : '')
                  },
                  c: item.text
                }
              }))
            },
            // Right: controls group
            {
              t: 'div',
              a: { class: 'bw-site-nav-controls' },
              c: [
                // Dark mode toggle
                {
                  t: 'button',
                  a: {
                    class: 'bw-site-nav-toggle',
                    title: 'Toggle dark mode',
                    onclick: function() {
                      var html = document.documentElement;
                      var isDark = html.getAttribute('data-theme') === 'dark';
                      html.setAttribute('data-theme', isDark ? '' : 'dark');
                      this.textContent = isDark ? '\u263D' : '\u2600';
                    }
                  },
                  c: '\u263D'
                },
                // Hamburger button (visible on mobile/tablet)
                {
                  t: 'button',
                  a: {
                    class: 'bw-site-nav-hamburger',
                    title: 'Toggle menu',
                    'aria-label': 'Toggle navigation menu',
                    onclick: function() {
                      var mobile = this.closest('.bw-site-nav').querySelector('.bw-site-nav-mobile');
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
        },
        // Mobile menu (hidden by default, toggled by hamburger)
        {
          t: 'div',
          a: { class: 'bw-site-nav-mobile' },
          c: items.map(item => ({
            t: 'a',
            a: {
              href: item.href,
              class: item.active ? 'active' : ''
            },
            c: item.text
          }))
        }
      ]
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
