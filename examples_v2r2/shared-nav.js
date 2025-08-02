/**
 * Shared navigation component for Bitwrench v2 examples
 * Uses bitwrench components to create a consistent navigation bar
 */

(function() {
  'use strict';

  // Define the navigation items
  const navItems = [
    { text: 'Home', href: 'index.html' },
    { text: 'Fundamentals', href: '00-taco-srmc-fundamentals.html' },
    { text: 'Basic', href: '01-basic-components.html' },
    { text: 'Tables & Forms', href: '02-interactive-tables-forms.html' },
    { text: 'Themes', href: '03-themes-styling.html' },
    { text: 'Dashboard', href: '04-dashboard-app.html' },
    { text: 'Advanced', href: '05-advanced-features.html' },
    { text: 'Tic Tac Toe', href: '06-tic-tac-toe-tutorial.html' }
  ];

  /**
   * Creates the example navigation bar
   * @param {string} currentPage - The current page filename to highlight active item
   * @returns {Object} TACO object for the navigation
   */
  function createExampleNav(currentPage) {
    // Mark the active item based on current page
    const items = navItems.map(item => ({
      ...item,
      active: item.href === currentPage
    }));

    return {
      t: 'nav',
      a: { 
        class: 'example-nav',
        style: 'background: #2c3e50; padding: 0; margin: 0 0 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'
      },
      c: {
        t: 'div',
        a: { 
          class: 'bw-container',
          style: 'max-width: 1400px; margin: 0 auto; padding: 0 1rem;'
        },
        c: [
          {
            t: 'div',
            a: { 
              style: 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0;'
            },
            c: [
              // Logo/Brand
              {
                t: 'div',
                a: { style: 'display: flex; align-items: center;' },
                c: [
                  {
                    t: 'span',
                    a: { 
                      style: 'color: white; font-size: 1.125rem; font-weight: bold; margin-right: 2rem;'
                    },
                    c: 'Bitwrench v2'
                  },
                  // Navigation items
                  {
                    t: 'ul',
                    a: { 
                      class: 'bw-nav example-nav-items',
                      style: 'display: flex; gap: 0.25rem; margin: 0; padding: 0; list-style: none;'
                    },
                    c: items.map(item => ({
                      t: 'li',
                      a: { class: 'bw-nav-item', style: 'margin: 0;' },
                      c: {
                        t: 'a',
                        a: { 
                          href: item.href,
                          class: `bw-nav-link ${item.active ? 'active' : ''}`,
                          style: `
                            color: #ecf0f1 !important;
                            background: ${item.active ? '#3498db' : 'transparent'};
                            border: none;
                            padding: 0.375rem 0.75rem;
                            text-decoration: none;
                            border-radius: 4px;
                            transition: all 0.2s ease;
                            display: block;
                          `
                        },
                        c: item.text
                      }
                    }))
                  }
                ]
              },
              // Version info
              {
                t: 'span',
                a: { 
                  style: 'color: #ecf0f1; font-size: 0.75rem;'
                },
                c: `v${window.bw && window.bw.version || '2.0.1-dev'}`
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Mounts the navigation to a specific element
   * @param {string} selector - The selector where to mount the nav
   * @param {string} currentPage - The current page filename
   */
  function mountExampleNav(selector, currentPage) {
    if (typeof window.bw !== 'undefined' && window.bw.DOM) {
      window.bw.DOM(selector, createExampleNav(currentPage || ''));
    }
  }

  // Export to window
  window.createExampleNav = createExampleNav;
  window.mountExampleNav = mountExampleNav;
})();