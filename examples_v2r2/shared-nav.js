/**
 * Shared navigation component for bitwrench examples
 * Includes hamburger menu for mobile/tablet breakpoints
 */

(function() {
  'use strict';

  const navItems = [
    { text: 'Home', href: '../index.html' },
    { text: 'Quick Start', href: '../pages/00-quick-start.html' },
    { text: 'Styling', href: '../pages/03-styling.html' },
    { text: 'Components', href: '../pages/01-components.html' },
    { text: 'Tables & Data', href: '../pages/02-tables-forms.html' },
    { text: 'State', href: '../pages/05-state.html' },
    { text: 'Dashboard', href: '../pages/04-dashboard.html' },
    { text: 'Tic Tac Toe', href: '../pages/06-tic-tac-toe-tutorial.html' },
    { text: 'Comparison', href: '../pages/07-framework-comparison.html' },
    { text: 'API Reference', href: '../pages/08-api-reference.html' },
    { text: 'Builds', href: '../pages/09-builds.html' }
  ];

  function createExampleNav(currentPage) {
    const items = navItems.map(item => ({
      ...item,
      active: item.href === currentPage
    }));

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
                href: '../index.html',
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

  function mountExampleNav(selector, currentPage) {
    if (typeof window.bw !== 'undefined' && window.bw.DOM) {
      window.bw.DOM(selector, createExampleNav(currentPage || ''));
    }
  }

  window.createExampleNav = createExampleNav;
  window.mountExampleNav = mountExampleNav;
})();
