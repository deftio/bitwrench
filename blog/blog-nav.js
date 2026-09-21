/**
 * Blog site navigation.
 * Visual classes match pages/ (bw_site_nav_*); catalog is blog-local.
 * Requires: bitwrench, pages/site.js (applySiteChromeCSS), blog-posts.js
 */
(function() {
  'use strict';

  /**
   * @param {string} currentPage - filename of the current blog page
   * @param {string} [assetRoot='..'] - path to repo root (dist/, images/, pages/)
   */
  function initBlogPage(currentPage, assetRoot) {
    var root = assetRoot || '..';
    var styles = bw.loadStyles();
    window._bw_current_styles = styles;
    if (typeof applySiteChromeCSS === 'function') {
      applySiteChromeCSS(styles);
    }
    mountBlogNav('#example-nav', currentPage || '', root);
    return styles;
  }

  function mountBlogNav(selector, currentPage, root) {
    if (typeof bw === 'undefined' || !bw.DOM) return;

    var posts = window.BLOG_POSTS || [];
    var ver = (window.bw && window.bw.version) || '';
    var iconSrc = root + '/images/bitwrench-icon.svg';
    var docsHref = root + '/pages/index.html';
    var homeHref = 'index.html';

    var primaryLinks = [
      {
        t: 'li',
        c: {
          t: 'a',
          a: {
            href: homeHref,
            class: 'bw_site_nav_link' + (currentPage === 'index.html' || currentPage === '' ? ' active' : '')
          },
          c: 'Blog'
        }
      },
      {
        t: 'li',
        c: {
          t: 'a',
          a: { href: docsHref, class: 'bw_site_nav_link' },
          c: 'Docs'
        }
      },
      {
        t: 'li',
        c: {
          t: 'a',
          a: {
            href: 'https://github.com/deftio/bitwrench',
            class: 'bw_site_nav_link',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          c: 'GitHub'
        }
      }
    ];

    var postLinks = posts.map(function(post) {
      var active = currentPage === post.href;
      return {
        t: 'a',
        a: {
          href: post.href,
          class: 'bw_site_subnav_link' + (active ? ' active' : '')
        },
        c: post.title
      };
    });

    var mobileLinks = [
      {
        t: 'a',
        a: {
          href: homeHref,
          class: (currentPage === 'index.html' || currentPage === '' ? 'active' : '')
        },
        c: 'Blog home'
      },
      {
        t: 'a',
        a: { href: docsHref },
        c: 'Docs'
      }
    ].concat(posts.map(function(post) {
      return {
        t: 'a',
        a: {
          href: post.href,
          class: currentPage === post.href ? 'active' : ''
        },
        c: post.title
      };
    }));

    var primaryNav = {
      t: 'nav',
      a: { class: 'bw_site_nav' },
      c: {
        t: 'div',
        a: { class: 'bw_site_nav_inner' },
        c: [
          {
            t: 'a',
            a: { href: homeHref, class: 'bw_site_nav_brand' },
            c: [
              {
                t: 'img',
                a: { src: iconSrc, alt: 'bitwrench', class: 'bw_site_nav_icon' }
              },
              {
                t: 'span',
                a: { class: 'bw_site_nav_ver' },
                c: 'blog' + (ver ? ' · v' + ver : '')
              }
            ]
          },
          { t: 'ul', a: { class: 'bw_site_nav_links' }, c: primaryLinks },
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
                    var isAlt = document.documentElement.classList.contains('bw_theme_alt');
                    var currentStyles = window._bw_current_styles;
                    if (currentStyles) {
                      if (isAlt) {
                        bw.applyStyles(currentStyles);
                      } else if (currentStyles.alternateCss) {
                        bw.applyStyles({ css: currentStyles.alternateCss });
                      }
                    }
                    document.documentElement.classList.toggle('bw_theme_alt');
                    var mode = document.documentElement.classList.contains('bw_theme_alt')
                      ? 'alternate'
                      : 'primary';
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
    };

    var belowNav = [];
    if (postLinks.length) {
      belowNav.push({
        t: 'div',
        a: { class: 'bw_site_subnav' },
        c: {
          t: 'div',
          a: { class: 'bw_site_subnav_inner' },
          c: postLinks
        }
      });
    }
    belowNav.push({
      t: 'div',
      a: { class: 'bw_site_nav_mobile', id: 'bw_site_nav_mobile_menu' },
      c: mobileLinks
    });

    bw.DOM(selector, primaryNav);

    var navEls = bw.$(selector);
    var navEl = navEls.length ? navEls[0] : null;
    if (navEl && belowNav.length) {
      var belowWrapper = bw.create({
        t: 'div',
        a: { class: 'bw_site_nav_wrapper' },
        c: belowNav
      });
      navEl.parentNode.insertBefore(belowWrapper, navEl.nextSibling);
    }

    // Theme cookie restore (same behavior as pages nav)
    var savedMode = bw.getCookie('bw_theme_mode');
    if ((savedMode === 'alternate' || savedMode === 'primary') &&
        document.getElementById('bw_style_global')) {
      var cs = window._bw_current_styles;
      if (savedMode === 'alternate' && cs && cs.alternateCss) {
        bw.applyStyles({ css: cs.alternateCss });
        document.documentElement.classList.add('bw_theme_alt');
      }
      var btns = bw.$('#bw_theme_toggle_btn');
      if (btns.length) {
        btns[0].textContent = savedMode === 'alternate' ? '\u2600' : '\u263D';
      }
    }

    if (bw.$('body').length) {
      bw.append('body', {
        t: 'footer',
        a: { class: 'bw_site_pages_footer' },
        c: {
          t: 'p',
          a: { class: 'bw_site_pages_footer_text' },
          // Blog pages are counted too, so they carry the same Privacy link as
          // the rest of the site. They sit one level down from the root.
          c: [
            'bitwrench\u2122 blog \u00A9 deftio / M. Chatterjee \u00B7 BSD-2-Clause \u00B7 ',
            { t: 'a', a: { href: '../pages/privacy.html' }, c: 'Privacy' }
          ]
        }
      });
    }
  }

  window.initBlogPage = initBlogPage;
  window.mountBlogNav = mountBlogNav;
})();
