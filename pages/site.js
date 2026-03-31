/**
 * Bitwrench Docs Site - Palette-Driven Site Chrome
 * Replaces shared-theme.js: all site CSS is generated from palette objects
 * via bw.css() + bw.scopeRulesUnder(). No CSS custom properties.
 *
 * CSS Architecture:
 *   SITE_STRUCTURAL -- layout-only rules (zero colors). A selector here
 *   NEVER appears in any themed function.
 *   Per-component themed functions -- return palette-dependent rules.
 *   A selector here NEVER appears in SITE_STRUCTURAL.
 *   This eliminates the merge bug entirely: Object.assign unions disjoint keys.
 *
 * Usage:
 *   var styles = initBitwrenchPage('page.html');
 *   var p = styles.palette;
 *
 * Exposes: site.makePageHeader, site.makeCallout, site.makeDemoSection,
 *          site.makeCodeBlock, site.createTabbedDemo, site.makeSiteFooter,
 *          applySiteChromeCSS, initBitwrenchPage
 */

(function() {
  'use strict';

  // =========================================================================
  // Site constants -- never change with theme
  // =========================================================================
  var SITE = {
    codeBg:    '#1e293b',
    codeText:  '#e2e8f0',
    navBg:     '#1a1a1a',
    navBorder: '#333',
    subnavBg:  '#2a2a2a',
    radius:    '8px',
    maxWidth:  '1200px',
    wideWidth: '1280px',
    fontMono:  '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    shadowSm:  '0 1px 3px rgba(0,0,0,0.08)',
    space: {
      xs: '0.25rem', sm: '0.5rem', md: '1rem',
      lg: '1.5rem',  xl: '2rem',  xxl: '3rem'
    }
  };

  // =========================================================================
  // Structural CSS -- layout only, zero colors.
  // RULE: if a selector appears here it MUST NOT appear in any themed function.
  // =========================================================================
  var SITE_STRUCTURAL = {
    '#example-nav': {
      position: 'sticky', top: '0', 'z-index': '1000'
    },

    // ---- Nav bar (structural-only selectors) ----
    '.bw_site_nav_inner': {
      'max-width': SITE.wideWidth, margin: '0 auto', padding: '0 3rem',
      display: 'flex', 'align-items': 'center', gap: '1.5rem', height: '64px'
    },
    '.bw_site_nav_brand': {
      display: 'flex', 'align-items': 'center', gap: '0.5rem',
      'text-decoration': 'none', 'flex-shrink': '0'
    },
    '.bw_site_nav_logo': { height: '42px', filter: 'brightness(0) invert(1)' },
    '.bw_site_nav_icon': { height: '28px', filter: 'brightness(0) invert(1)' },
    '.bw_site_nav_links': {
      display: 'flex', 'align-items': 'center', gap: '4px',
      'list-style': 'none', margin: '0', padding: '0', 'flex-wrap': 'nowrap'
    },
    '.bw_site_nav_dropdown': { position: 'relative', 'list-style': 'none' },
    '.bw_site_nav_dropdown:hover .bw_site_dropdown_menu': { display: 'block' },
    '.bw_site_nav_wrapper': { position: 'relative' },

    // ---- Sub-nav (structural-only) ----
    '.bw_site_subnav_inner': {
      'max-width': SITE.wideWidth, margin: '0 auto', padding: '0 3rem',
      display: 'flex', 'align-items': 'center', gap: '0.25rem', height: '36px'
    },

    // ---- Nav controls (structural-only) ----
    '.bw_site_nav_controls': {
      'margin-left': 'auto', display: 'flex', 'align-items': 'center',
      gap: '0.5rem', 'flex-shrink': '0'
    },
    '.bw_site_nav_mobile.open': { display: 'block' },

    // ---- Page header (structural-only) ----
    '.bw_site_pages_header_title': {
      margin: '0 0 0.35rem', 'font-size': '1.85rem', 'font-weight': '700',
      'letter-spacing': '-0.4px', color: 'inherit'
    },
    '.bw_site_pages_header_subtitle': {
      opacity: '0.85', 'font-size': '1.1rem', margin: '0', 'line-height': '1.5'
    },

    // ---- Content container ----
    '.content-container': {
      'max-width': SITE.maxWidth, margin: '0 auto', padding: '1.25rem 2.5rem 2.5rem'
    },
    '.content-container.wide': {
      'max-width': SITE.wideWidth, 'padding-left': '3rem', 'padding-right': '3rem'
    },
    '.content-container > *': { 'max-width': '100%', 'overflow-wrap': 'break-word' },

    // ---- Demo section (structural-only selectors) ----
    '.bw_site_pages_demo > p, .bw_site_pages_demo > div:not(.bw_site_pages_demo_body):not(.demo-tabs), .bw_site_pages_demo > ul, .bw_site_pages_demo > ol': {
      'padding-left': '1.5rem', 'padding-right': '1.5rem'
    },
    '.bw_site_pages_demo > p:first-of-type': { 'padding-top': '1rem' },
    '.bw_site_pages_demo > p:last-child, .bw_site_pages_demo > div:last-child': { 'padding-bottom': '1rem' },
    '.bw_site_pages_demo_title h2': {
      'font-size': 'inherit', 'font-weight': 'inherit', color: 'inherit',
      margin: '0', padding: '0', background: 'none', border: 'none'
    },
    // ---- Demo tabs (structural-only) ----
    '.demo-tab-panel.active': { display: 'block' },
    '.demo-tab-panel.code-panel': { padding: '0', position: 'relative' },

    // ---- Tab overrides (structural-only) ----
    '.bw_tab_content': { padding: '1.25rem' },

    // ---- Tables mobile ----
    '.content-container table, .bw_site_pages_demo_body table': {
      'max-width': '100%'
    },

    // ---- Callout (structural-only) ----
    '.bw_site_pages_callout': {
      padding: '1rem 1.25rem', 'border-radius': SITE.radius, margin: '1rem 0',
      'font-size': '0.9rem'
    },
    '.bw_site_pages_callout_title': { margin: '0 0 0.4rem', 'font-size': '0.95rem' },
    '.bw_site_pages_callout p': { margin: '0.25rem 0' },
    '.bw_site_pages_callout ul, .bw_site_pages_callout ol': { margin: '0.5rem 0 0', 'padding-left': '1.25rem' },
    '.bw_site_pages_callout li': { margin: '0.25rem 0' },

    // ---- Grids ----
    '.bw_grid_2col': { display: 'grid', 'grid-template-columns': '1fr 1fr', gap: SITE.space.md },
    '.bw_grid_3col': { display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: SITE.space.md },
    '.bw_grid_auto': {
      display: 'grid', 'grid-template-columns': 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
      gap: SITE.space.md
    },

    // ---- Demo section body ----
    '.bw_site_pages_demo_body': { padding: SITE.space.lg },
    '.bw_site_pages_demo_body h3': { 'font-size': '1rem', 'font-weight': '600', margin: '0 0 0.5rem' },
    '.bw_site_pages_demo_body h4': { 'font-size': '0.95rem', 'font-weight': '600', margin: '0 0 0.4rem' },

    // ---- Code block (structural-only) ----
    '.bw_site_pages_code pre': { margin: '0', background: 'transparent', border: 'none', 'border-radius': '0' },
    '.bw_code_label': {
      'font-size': '0.6875rem', 'text-transform': 'uppercase', 'letter-spacing': '0.06em',
      opacity: '0.5', 'font-weight': '600', 'margin-bottom': SITE.space.sm
    },

    // ---- Result container (structural-only) ----
    '.bw_site_pages_result_label': {
      'font-size': '0.6875rem', 'text-transform': 'uppercase', 'letter-spacing': '0.06em',
      'font-weight': '600', 'margin-bottom': SITE.space.sm
    },

    // ---- Feature card (structural-only) ----
    '.bw_feature_grid': {
      display: 'grid', 'grid-template-columns': 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
      gap: SITE.space.md
    },
    '.bw_site_pages_feature_title': { margin: '0 0 0.35rem', 'font-size': '1rem', 'font-weight': '600' },
    '.bw_site_pages_feature:hover': { transform: 'translateY(-2px)' },

    // ---- Margin/padding utilities ----
    '.bw_mt_0': { 'margin-top': '0' },
    '.bw_mt_xs': { 'margin-top': SITE.space.xs }, '.bw_mt_sm': { 'margin-top': SITE.space.sm },
    '.bw_mt_md': { 'margin-top': SITE.space.md }, '.bw_mt_lg': { 'margin-top': SITE.space.lg },
    '.bw_mt_xl': { 'margin-top': SITE.space.xl },
    '.bw_mb_0': { 'margin-bottom': '0' },
    '.bw_mb_xs': { 'margin-bottom': SITE.space.xs }, '.bw_mb_sm': { 'margin-bottom': SITE.space.sm },
    '.bw_mb_md': { 'margin-bottom': SITE.space.md }, '.bw_mb_lg': { 'margin-bottom': SITE.space.lg },
    '.bw_mb_xl': { 'margin-bottom': SITE.space.xl },
    '.bw_py_sm': { 'padding-top': SITE.space.sm, 'padding-bottom': SITE.space.sm },
    '.bw_py_md': { 'padding-top': SITE.space.md, 'padding-bottom': SITE.space.md },
    '.bw_py_lg': { 'padding-top': SITE.space.lg, 'padding-bottom': SITE.space.lg },
    '.bw_py_xl': { 'padding-top': SITE.space.xl, 'padding-bottom': SITE.space.xl },

    // ---- Step / tutorial (structural-only) ----
    '.bw_step_body': { padding: SITE.space.lg },

    // ---- Try-It editor (structural-only) ----
    '.tryit-container': { margin: '1rem 0' },
    '.tryit-grid': { display: 'grid', 'grid-template-columns': '1fr 1fr', gap: SITE.space.md },
    '.tryit-controls': { display: 'flex', gap: '0.5rem', 'margin-top': SITE.space.xs },

    // ---- Pipeline demo (structural-only) ----
    '.pipeline-demo': { margin: '1rem 0' },
    '.pipeline-grid': {
      display: 'grid', 'grid-template-columns': '1fr auto 1fr auto 1fr',
      gap: SITE.space.sm, 'align-items': 'flex-start'
    },
    '.pipeline-col .bw_site_pages_code pre': { 'font-size': '0.75rem', 'line-height': '1.5' },

    // ---- Footer (structural-only) ----
    '.bw_site_pages_footer_text': { margin: '0', 'line-height': '1.8' },
    '.bw_site_footer_tm': { 'font-size': '0.6875rem', opacity: '0.7' },

    // ---- Shared page patterns (structural-only) ----
    '.intro-text:last-child': { 'margin-bottom': '0' },
    '.todo-input-row': { display: 'flex', gap: '0.5rem', 'margin-bottom': '0.75rem' },
    '.todo-item:last-child': { 'border-bottom': 'none' },
    '.todo-item span': { flex: '1' },
    '.bw_site_pages_tablecard .bw_table': { 'margin-bottom': '0' },

    // ---- Snippet (structural-only) ----
    '.bw_site_pages_snippet': { 'margin-bottom': '1.25rem' },
    '.bw_site_pages_snippet_title': { margin: '0 0 0.5rem', 'font-size': '0.95rem' },
    '.bw_site_pages_snippet_wrap': { position: 'relative' },

    // ---- Log / event panel (structural-only) ----
    '.bw_site_pages_log .log-entry': { margin: '0' },

    // ---- Doc card (structural-only) ----
    '.bw_site_pages_doc_title': { margin: '0 0 0.35rem', 'font-size': '1rem', 'font-weight': '600' },
    '.bw_site_pages_doc:hover': { transform: 'translateY(-2px)' },

    // ---- Data table (structural-only) ----
    '.bw_site_pages_datatable': {
      width: '100%', 'border-collapse': 'collapse', margin: '1rem 0', 'font-size': '0.875rem'
    },

  };

  // =========================================================================
  // Responsive overrides -- appended AFTER all themed CSS so media queries
  // win over base styles regardless of which section defines the base.
  // =========================================================================
  var SITE_RESPONSIVE = {
    '@media (max-width: 1024px)': {
      '.bw_site_nav_inner': { padding: '0 1rem' },
      '.bw_site_subnav_inner': { padding: '0 1rem' },
      '.bw_grid_3col': { 'grid-template-columns': 'repeat(2, 1fr)' }
    },

    '@media (max-width: 900px)': {
      '.bw_site_nav_links': { display: 'none' },
      '.bw_site_subnav': { display: 'none' },
      '.bw_site_nav_hamburger': { display: 'flex' },
      '.pipeline-grid': { 'grid-template-columns': '1fr' },
      '.pipeline-arrow': { 'text-align': 'center', transform: 'rotate(90deg)', padding: '0.25rem 0' }
    },

    '@media (max-width: 768px)': {
      '.bw_site_pages_header': { padding: '1.5rem 0' },
      '.bw_site_pages_header_title': { 'font-size': '1.35rem' },
      '.content-container': { padding: '1rem 1rem 2rem' },
      '.content-container.wide': { 'padding-left': '1rem', 'padding-right': '1rem' },
      '.bw_site_pages_demo_body': { padding: '1rem' },
      '.demo-tab-panel': { padding: '1rem' },
      '.bw_tab_content': { padding: '1rem' },
      '.bw_site_pages_demo > p, .bw_site_pages_demo > div:not(.bw_site_pages_demo_body):not(.demo-tabs), .bw_site_pages_demo > ul, .bw_site_pages_demo > ol': {
        'padding-left': '1rem', 'padding-right': '1rem'
      },
      '.bw_site_pages_demo_title': { padding: '0.75rem 1rem' },
      '.bw_site_pages_demo > h3, .bw_site_pages_demo > h4': { padding: '0.75rem 1rem 0.5rem' },
      '.bw_step_header': { padding: '1rem' },
      '.bw_step_body': { padding: '1rem' },
      '.bw_grid_3col': { 'grid-template-columns': '1fr' },
      '.tryit-grid': { 'grid-template-columns': '1fr' }
    },

    '@media (max-width: 576px)': {
      '.bw_grid_2col': { 'grid-template-columns': '1fr' }
    },
    '@media (max-width: 575px)': {
      '.content-container table, .bw_site_pages_demo_body table': {
        display: 'block', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch'
      }
    },

    '@media (max-width: 480px)': {
      '.bw_site_nav_inner': { padding: '0 0.75rem', gap: '0.75rem' },
      '.bw_site_subnav_inner': { padding: '0 0.75rem' },
      '.bw_site_nav_logo': { height: '26px' },
      '.bw_site_nav_icon': { height: '22px' },
      '.content-container': { padding: '0.75rem 0.75rem 1.5rem' },
      '.content-container.wide': { 'padding-left': '0.75rem', 'padding-right': '0.75rem' },
      '.bw_site_pages_demo_title': {
        padding: '0.75rem 0.75rem', 'font-size': '1rem'
      },
      '.bw_site_pages_demo_body': { padding: '0.75rem' },
      '.bw_site_pages_demo > p, .bw_site_pages_demo > div:not(.bw_site_pages_demo_body):not(.demo-tabs), .bw_site_pages_demo > ul, .bw_site_pages_demo > ol': {
        'padding-left': '0.75rem', 'padding-right': '0.75rem'
      },
      '.bw_step_header': { padding: '0.75rem', gap: '0.5rem' },
      '.bw_step_body': { padding: '0.75rem' },
      '.bw_site_pages_header_title': { 'font-size': '1.2rem' },
      '.bw_site_pages_header_subtitle': { 'font-size': '0.95rem' },
      '.tryit-textarea': { 'font-size': '0.75rem', padding: '0.75rem' }
    }
  };

  // =========================================================================
  // Per-component themed rule functions.
  // RULE: if a selector appears here it MUST NOT appear in SITE_STRUCTURAL.
  // Each function merges structural + themed properties for its selectors.
  // =========================================================================

  /**
   * Compute light/dark overlay helpers from a palette.
   * Checks p.background luminance to decide overlay direction.
   */
  function overlays(p) {
    var bgLum = (typeof bw.relativeLuminance === 'function')
      ? bw.relativeLuminance(p.background)
      : 0.9; // fallback: assume light
    var isLight = bgLum > 0.179;
    return {
      subtle:  isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
      stripe:  isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.035)',
      shadow:  isLight ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.4)',
      shadowSm: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.3)',
      preBorder: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)'
    };
  }

  /** Body + content layout colors */
  function siteLayoutRules(p) {
    return {
      'body': { background: p.background, color: p.dark.base },
      '.intro-text': {
        'font-size': '0.9375rem', 'line-height': '1.7', margin: '0 0 1rem',
        'max-width': '720px', color: p.dark.base
      }
    };
  }

  /** Nav, subnav, mobile menu, dropdown */
  function siteNavRules(p) {
    return {
      // ---- Primary nav ----
      '.bw_site_nav': { background: SITE.navBg, 'border-bottom': '1px solid ' + SITE.navBorder },
      '.bw_site_nav_ver': {
        'font-size': '0.875rem', 'align-self': 'flex-end', 'margin-bottom': '3px',
        color: 'rgba(255,255,255,0.85)'
      },
      '.bw_site_nav .bw_site_nav_link': {
        'text-decoration': 'none', padding: '0.5rem 0.625rem',
        'border-radius': '5px', 'font-size': '0.9375rem', 'font-weight': '500',
        'white-space': 'nowrap', transition: 'color 0.12s, background 0.12s',
        color: 'rgba(255,255,255,0.7)'
      },
      '.bw_site_nav .bw_site_nav_link:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' },
      '.bw_site_nav .bw_site_nav_link.active': { color: '#fff', background: p.primary.base },
      '.bw_site_dropdown_menu': {
        display: 'none', position: 'absolute', top: '100%', left: '0',
        'border-radius': '5px', padding: '0.25rem 0', 'min-width': '160px',
        'z-index': '1001',
        background: SITE.navBg, border: '1px solid ' + SITE.navBorder,
        'box-shadow': '0 4px 12px rgba(0,0,0,0.3)'
      },
      '.bw_site_dropdown_link': {
        display: 'block', padding: '0.5rem 1rem', 'text-decoration': 'none',
        'font-size': '0.875rem', 'font-weight': '500', 'white-space': 'nowrap',
        transition: 'color 0.12s, background 0.12s',
        color: 'rgba(255,255,255,0.7)'
      },
      '.bw_site_dropdown_link:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' },
      '.bw_site_dropdown_link.active': { color: '#fff', background: p.primary.base },

      // ---- Sub-nav ----
      '.bw_site_subnav': { background: SITE.subnavBg, 'border-bottom': '1px solid #3a3a3a' },
      '.bw_site_subnav_label': {
        'font-size': '0.6875rem', 'font-weight': '600', 'text-transform': 'uppercase',
        'letter-spacing': '0.05em', 'margin-right': '0.25rem', 'white-space': 'nowrap',
        color: 'rgba(255,255,255,0.4)'
      },
      '.bw_site_subnav_sep': { width: '1px', height: '16px', margin: '0 0.375rem', background: '#444' },
      '.bw_site_subnav .bw_site_subnav_link': {
        'text-decoration': 'none', padding: '0.375rem 0.75rem', 'border-radius': '4px',
        'font-size': '0.9375rem', 'font-weight': '500', 'white-space': 'nowrap',
        transition: 'color 0.12s, background 0.12s',
        color: 'rgba(255,255,255,0.6)'
      },
      '.bw_site_subnav .bw_site_subnav_link:hover': { color: '#fff', background: 'rgba(255,255,255,0.08)' },
      '.bw_site_subnav .bw_site_subnav_link.active': { color: '#fff', background: p.primary.base },

      // ---- Nav controls ----
      '.bw_site_nav_toggle': {
        background: 'transparent', width: '32px', height: '32px', 'border-radius': '5px',
        cursor: 'pointer', 'font-size': '1rem', display: 'flex', 'align-items': 'center',
        'justify-content': 'center', 'flex-shrink': '0', transition: 'all 0.12s',
        border: '1px solid #444', color: 'rgba(255,255,255,0.5)'
      },
      '.bw_site_nav_toggle:hover': { 'border-color': '#666', color: '#fff' },
      '.bw_site_nav_hamburger': {
        display: 'none', background: 'transparent', width: '36px', height: '36px',
        'border-radius': '5px', cursor: 'pointer', 'font-size': '1.25rem',
        'align-items': 'center', 'justify-content': 'center', 'flex-shrink': '0',
        transition: 'all 0.12s',
        border: '1px solid #444', color: 'rgba(255,255,255,0.7)'
      },
      '.bw_site_nav_hamburger:hover': { 'border-color': '#666', color: '#fff' },

      // ---- Mobile menu ----
      '.bw_site_nav_mobile': {
        display: 'none', position: 'absolute', top: '100%', left: '0', right: '0',
        padding: '0.5rem 0', 'z-index': '999',
        background: SITE.navBg, 'border-bottom': '1px solid ' + SITE.navBorder
      },
      '.bw_site_nav_mobile a': {
        display: 'block', padding: '0.6rem 1.5rem', 'text-decoration': 'none',
        'font-size': '0.9375rem', transition: 'background 0.12s, color 0.12s',
        color: 'rgba(255,255,255,0.7)'
      },
      '.bw_site_nav_mobile a:hover': { background: 'rgba(255,255,255,0.08)', color: '#fff' },
      '.bw_site_nav_mobile a.active': { color: '#fff', background: p.primary.base }
    };
  }

  /** Page header, demo section, demo tabs, demo content */
  function siteDemoRules(p) {
    var o = overlays(p);
    return {
      // ---- Page header ----
      '.bw_site_pages_header': {
        padding: '2.25rem 0 2rem',
        background: 'linear-gradient(135deg, ' + p.primary.base + ' 0%, ' + p.primary.active + ' 100%)',
        color: p.primary.textOn
      },

      // ---- Demo section ----
      '.bw_site_pages_demo': {
        'margin-bottom': '1.5rem', overflow: 'hidden',
        background: p.surface, border: '1px solid ' + p.light.border,
        'border-radius': SITE.radius, 'box-shadow': o.shadowSm
      },
      '.bw_site_pages_demo_title': {
        'font-size': '1.15rem', 'font-weight': '600', margin: '0', padding: '1rem 1.5rem',
        color: p.dark.base, background: p.surfaceAlt,
        'border-bottom': '1px solid ' + p.light.border,
        'border-left': '4px solid ' + p.primary.base
      },
      '.bw_site_pages_demo > h3, .bw_site_pages_demo > h4': {
        'font-size': '1rem', 'font-weight': '600', margin: '0', padding: '0.75rem 1.5rem 0.5rem',
        color: p.dark.base
      },
      '.bw_site_pages_demo_desc': {
        'font-size': '0.9rem', margin: '0 0 1.25rem', 'line-height': '1.6',
        color: p.dark.hover
      },

      // ---- Demo tabs ----
      '.demo-tabs': {
        overflow: 'hidden', margin: '1rem 0',
        border: '1px solid ' + p.light.border, 'border-radius': SITE.radius
      },
      '.demo-tab-bar': {
        display: 'flex',
        background: p.background, 'border-bottom': '1px solid ' + p.light.border
      },
      '.demo-tab-btn': {
        padding: '0.6rem 1.25rem', border: 'none', background: 'transparent',
        'font-family': 'inherit', 'font-size': '0.8125rem', 'font-weight': '600',
        cursor: 'pointer', 'border-bottom': '2px solid transparent', transition: 'all 0.15s',
        color: p.dark.hover
      },
      '.demo-tab-btn:hover': { color: p.dark.base, background: o.subtle },
      '.demo-tab-btn.active': { color: p.primary.base, 'border-bottom-color': p.primary.base, background: p.surface },
      '.demo-tab-panel': {
        display: 'none', padding: '1.5rem',
        background: p.surface
      },
      '.demo-tab-panel.code-panel pre': {
        margin: '0', padding: '1.25rem', 'overflow-x': 'auto',
        'font-size': '0.8125rem', 'line-height': '1.6',
        background: SITE.codeBg, color: SITE.codeText, 'font-family': SITE.fontMono
      },
      '.copy-btn': {
        position: 'absolute', top: '0.5rem', right: '0.5rem',
        padding: '0.3rem 0.7rem', 'font-size': '0.7rem',
        'border-radius': '4px', cursor: 'pointer', 'z-index': '2',
        'font-family': 'inherit', transition: 'all 0.15s',
        background: 'rgba(255,255,255,0.18)', color: '#ccc',
        border: '1px solid rgba(255,255,255,0.2)'
      },
      '.copy-btn:hover': { background: 'rgba(255,255,255,0.3)', color: '#fff' },
      '.copy-btn.copied': { background: 'rgba(40,167,69,0.3)', color: '#6fdc8c' },

      // ---- Tab overrides ----
      '.bw_nav_tabs': {
        padding: '0',
        'border-bottom': '2px solid ' + p.light.border, background: p.background
      },
      '.bw_nav_tabs .bw_nav_link': {
        padding: '0.6rem 1rem', 'font-size': '0.8125rem', 'font-weight': '600',
        border: 'none', 'border-radius': '0', background: 'transparent', cursor: 'pointer',
        color: p.dark.hover
      },
      '.bw_nav_tabs .bw_nav_link:hover': { color: p.dark.base },
      '.bw_nav_tabs .bw_nav_link.active': {
        color: p.primary.base, border: 'none',
        'border-bottom': '2px solid ' + p.primary.base, 'margin-bottom': '-2px', background: 'transparent'
      },

      // ---- Result container ----
      '.bw_site_pages_result': {
        'border-radius': SITE.radius, padding: SITE.space.lg,
        border: '2px dashed ' + p.light.border
      },
      '.bw_site_pages_result_label': { color: p.secondary.base }
    };
  }

  /** Callout variant colors */
  function siteCalloutRules(p) {
    return {
      '.bw_site_pages_callout_concept': { background: p.primary.light, 'border-left': '4px solid ' + p.primary.base },
      '.bw_site_pages_callout_concept .bw_site_pages_callout_title': { color: p.primary.darkText },
      '.bw_site_pages_callout_tip': { background: p.warning.light, 'border-left': '4px solid ' + p.warning.border },
      '.bw_site_pages_callout_tip .bw_site_pages_callout_title': { color: p.warning.darkText },
      '.bw_site_pages_callout_warning': { background: p.danger.light, 'border-left': '4px solid ' + p.danger.border },
      '.bw_site_pages_callout_warning .bw_site_pages_callout_title': { color: p.danger.darkText }
    };
  }

  /** Code block, snippet, console, inline code */
  function siteCodeRules(p) {
    var o = overlays(p);
    return {
      // ---- Generic pre/code ----
      'pre': {
        margin: '0', 'border-radius': '6px', position: 'relative',
        'max-width': '100%', 'overflow-x': 'auto',
        background: SITE.codeBg, border: o.preBorder
      },
      'pre code': {
        display: 'block', padding: '1rem', 'overflow-x': 'auto',
        'font-size': '0.8125rem', 'line-height': '1.6', background: 'transparent', border: 'none',
        'font-family': SITE.fontMono, color: SITE.codeText
      },
      'code:not(pre code)': {
        padding: '0.15em 0.4em', 'border-radius': '3px', 'font-size': '0.85em',
        background: p.primary.light, color: p.primary.darkText, 'font-family': SITE.fontMono
      },

      // ---- Code block pattern ----
      '.bw_site_pages_code': {
        'border-radius': '6px', padding: SITE.space.md + ' 1.25rem', position: 'relative',
        background: SITE.codeBg
      },
      '.bw_site_pages_code code': {
        'font-size': '0.8125rem', 'line-height': '1.7',
        color: SITE.codeText
      },

      // ---- Snippet with copy ----
      '.bw_site_pages_snippet_copy': {
        position: 'absolute', top: '0.375rem', right: '0.5rem', 'z-index': '2',
        display: 'inline-block', padding: '0.2rem 0.5rem', 'font-size': '0.75rem',
        cursor: 'pointer', border: 'none', 'border-radius': '3px', transition: 'background 0.15s',
        background: p.primary.base, color: '#fff'
      },
      '.bw_site_pages_snippet_copy:hover': { background: p.primary.darkText },
      '.bw_site_pages_snippet_copy.copied': { background: '#28a745' },

      // ---- Console / terminal ----
      '.bw_site_pages_console': {
        'font-family': SITE.fontMono, 'font-size': '0.8125rem', 'line-height': '1.6',
        padding: '1rem 1.25rem', 'border-radius': SITE.radius, 'overflow-x': 'auto',
        margin: '0.75rem 0', 'white-space': 'pre',
        background: '#1e1e1e', color: '#d4d4d4'
      },
      '.console-prompt': { color: '#569cd6' },
      '.console-output': { color: '#9cdcfe' },
      '.console-comment': { color: '#6a9955' },
      '.console-string': { color: '#ce9178' },
      '.console-group-header': { color: '#dcdcaa', 'font-weight': '600' }
    };
  }

  /** Feature card, doc card, table card */
  function siteCardRules(p) {
    var o = overlays(p);
    return {
      // ---- Feature card ----
      '.bw_site_pages_feature': {
        'border-radius': SITE.radius, padding: '1.25rem',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        background: p.surfaceAlt, border: '1px solid ' + p.light.border
      },
      '.bw_site_pages_feature_desc': {
        margin: '0', 'font-size': '0.875rem', 'line-height': '1.55',
        color: p.dark.hover
      },
      '.bw_site_pages_feature:hover': { 'box-shadow': o.shadow },

      // ---- Doc card ----
      '.bw_site_pages_doc': {
        'border-radius': SITE.radius, padding: '1.25rem',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        background: p.surfaceAlt, border: '1px solid ' + p.light.border
      },
      '.bw_site_pages_doc_desc': {
        margin: '0', 'font-size': '0.875rem', 'line-height': '1.55',
        color: p.dark.hover
      },
      '.bw_site_pages_doc:hover': { 'box-shadow': o.shadow },

      // ---- Table card ----
      '.bw_site_pages_tablecard': {
        overflow: 'hidden', 'overflow-x': 'auto',
        background: p.surface, border: '1px solid ' + p.light.border,
        'border-radius': SITE.radius, 'box-shadow': o.shadowSm
      },
      '.bw_site_pages_tablecard .bw_table > thead > tr > *': {
        background: p.primary.darkText, color: p.primary.textOn, 'border-bottom-color': p.primary.base
      },
      '.bw_site_pages_tablecard .bw_table > tbody > tr:nth-of-type(odd) > *': {
        'background-color': o.stripe
      },

      // ---- Data table ----
      '.bw_site_pages_datatable th, .bw_site_pages_datatable td': {
        padding: '0.65rem 1rem', 'text-align': 'left',
        'border-bottom': '1px solid ' + p.light.border
      },
      '.bw_site_pages_datatable th': {
        'font-weight': '600', 'font-size': '0.75rem',
        'text-transform': 'uppercase', 'letter-spacing': '0.04em',
        background: p.surfaceAlt, color: p.dark.hover
      },
      '.bw_site_pages_datatable tr:hover': { background: p.surfaceAlt },

      // ---- Preview container ----
      '.bw_site_pages_preview': {
        'border-radius': SITE.radius, overflow: 'hidden', margin: '1rem 0',
        border: '2px solid ' + p.primary.base, background: p.surface
      }
    };
  }

  /** Footer, step, todo, log, toc, pipeline, tryit, utility colors */
  function siteMiscRules(p) {
    var o = overlays(p);
    return {
      // ---- Step / tutorial ----
      '.bw_step': {
        'margin-bottom': SITE.space.lg, overflow: 'hidden',
        background: p.surface, border: '1px solid ' + p.light.border,
        'border-radius': SITE.radius, 'box-shadow': o.shadowSm
      },
      '.bw_step_header': {
        display: 'flex', 'align-items': 'center', gap: '0.75rem', padding: '1.25rem 1.5rem',
        'border-bottom': '1px solid ' + p.light.border, background: p.surfaceAlt
      },
      '.bw_step_num': {
        width: '36px', height: '36px', 'border-radius': '50%', color: p.primary.textOn,
        'font-weight': '700', 'font-size': '1rem', display: 'flex',
        'align-items': 'center', 'justify-content': 'center', 'flex-shrink': '0',
        background: p.primary.base
      },
      '.bw_step_header h2': {
        margin: '0', 'font-size': '1.15rem', 'font-weight': '600',
        color: p.dark.base
      },

      // ---- Try-It editor ----
      '.tryit-label': {
        'font-size': '0.6875rem', 'text-transform': 'uppercase', 'letter-spacing': '0.06em',
        'font-weight': '600', 'margin-bottom': SITE.space.xs,
        color: p.dark.hover
      },
      '.tryit-label-result': { color: p.primary.base },
      '.tryit-textarea': {
        width: '100%', 'font-size': '0.8125rem', 'line-height': '1.6',
        'border-radius': '6px', padding: '1rem', resize: 'vertical', 'tab-size': '2',
        'font-family': SITE.fontMono, background: SITE.codeBg, color: SITE.codeText,
        border: '1px solid rgba(255,255,255,0.08)'
      },
      '.tryit-textarea:focus': { outline: '2px solid ' + p.primary.base, 'outline-offset': '-1px' },
      '.tryit-error': {
        display: 'none', 'font-size': '0.8125rem', color: '#ef4444',
        background: '#1e0000', padding: '0.5rem 0.75rem', 'border-radius': '4px',
        'margin-top': SITE.space.xs,
        'font-family': SITE.fontMono
      },
      '.tryit-output': {
        'border-radius': SITE.radius, padding: SITE.space.md, 'min-height': '60px',
        border: '2px dashed ' + p.light.border
      },

      // ---- Pipeline ----
      '.pipeline-label': {
        'font-size': '0.8125rem', 'font-weight': '600', 'margin-bottom': SITE.space.sm,
        color: p.dark.hover
      },
      '.pipeline-col-label': {
        'font-size': '0.6875rem', 'text-transform': 'uppercase', 'letter-spacing': '0.06em',
        'font-weight': '600', 'margin-bottom': SITE.space.xs,
        color: p.dark.hover
      },
      '.pipeline-arrow': {
        'font-size': '1.5rem', 'align-self': 'center', 'padding-top': '1rem',
        color: p.primary.base
      },

      // ---- Footer ----
      '.bw_site_pages_footer': {
        'text-align': 'center', padding: '2rem 1rem 1.25rem',
        'font-size': '0.75rem', 'margin-top': '2rem',
        color: p.secondary.hover, 'border-top': '1px solid ' + p.light.border
      },
      '.bw_site_pages_footer a': {
        'text-decoration': 'none',
        color: p.dark.hover
      },
      '.bw_site_pages_footer a:hover': { color: p.primary.base },

      // ---- Todo ----
      '.todo-input-row input': {
        flex: '1', padding: '0.4rem 0.75rem', 'border-radius': SITE.radius, 'font-size': '0.875rem',
        border: '1px solid ' + p.light.border
      },
      '.todo-item': {
        display: 'flex', 'align-items': 'center', gap: '0.5rem',
        padding: '0.5rem 0', 'font-size': '0.875rem',
        'border-bottom': '1px solid ' + p.light.border
      },
      '.todo-item.done span': { 'text-decoration': 'line-through', color: p.dark.hover },

      // ---- TOC pills ----
      '.bw_site_pages_toc': {
        display: 'flex', 'flex-wrap': 'wrap', gap: '0.5rem', margin: '1rem 0 0'
      },
      '.bw_site_pages_toc a': {
        display: 'inline-block', padding: '0.3rem 0.75rem', 'font-size': '0.8rem',
        'font-weight': '500', 'border-radius': '4px', 'text-decoration': 'none', transition: 'background 0.12s',
        background: p.primary.light, color: p.primary.darkText
      },
      '.bw_site_pages_toc a:hover': { background: p.primary.base, color: '#fff' },

      // ---- Log / event panel ----
      '.bw_site_pages_log': {
        'font-family': SITE.fontMono, 'font-size': '0.8125rem', 'line-height': '1.6',
        padding: '0.75rem 1rem', 'border-radius': SITE.radius, 'max-height': '200px',
        'overflow-y': 'auto', 'white-space': 'pre-wrap',
        background: p.surfaceAlt, border: '1px solid ' + p.light.border
      },
      '.bw_site_pages_log .log-ts': { color: p.secondary.base }
    };
  }

  // =========================================================================
  // siteAllThemedRules(p) -- unions all per-component themed rules
  // =========================================================================
  function siteAllThemedRules(p) {
    return Object.assign({},
      siteLayoutRules(p),
      siteNavRules(p),
      siteDemoRules(p),
      siteCalloutRules(p),
      siteCodeRules(p),
      siteCardRules(p),
      siteMiscRules(p)
    );
  }

  // =========================================================================
  // applySiteChromeCSS(styles) -- inject site CSS from palette
  // No merge needed: SITE_STRUCTURAL and themed rules have disjoint selectors.
  // =========================================================================
  function applySiteChromeCSS(styles) {
    var structural = bw.css(SITE_STRUCTURAL);
    var primary = bw.css(siteAllThemedRules(styles.palette));
    var alt = bw.css(bw.scopeRulesUnder(
      siteAllThemedRules(styles.alternatePalette), '.bw_theme_alt'
    ));
    var responsive = bw.css(SITE_RESPONSIVE);
    bw.injectCSS(structural + '\n' + primary + '\n' + alt + '\n' + responsive,
      { id: 'bw_site_chrome', append: false });
  }

  // =========================================================================
  // TACO factory functions
  // =========================================================================
  var site = {};

  /**
   * Page header with gradient background.
   * @param {string} title - Main heading
   * @param {string} [subtitle] - Optional subtitle
   * @returns {Object} TACO
   */
  site.makePageHeader = function(title, subtitle) {
    var inner = [{ t: 'h1', a: { class: 'bw_site_pages_header_title' }, c: title }];
    if (subtitle) {
      inner.push({ t: 'p', a: { class: 'bw_site_pages_header_subtitle' }, c: subtitle });
    }
    return {
      t: 'div', a: { class: 'bw_site_pages_header' },
      c: {
        t: 'div', a: { class: 'content-container wide', style: 'padding-top: 0; padding-bottom: 0;' },
        c: inner
      }
    };
  };

  /**
   * Callout box.
   * @param {string} type - 'concept', 'tip', or 'warning'
   * @param {string|Object} titleOrContent - If 3 args: title string. If 2 args: content.
   * @param {string|Object} [content] - Content (string or TACO). Omit for 2-arg form.
   * @returns {Object} TACO
   */
  site.makeCallout = function(type, titleOrContent, content) {
    var cls = 'bw_site_pages_callout bw_site_pages_callout_' + type;
    if (content !== undefined) {
      // 3-arg: type, title, content
      return {
        t: 'div', a: { class: cls },
        c: [
          { t: 'h4', a: { class: 'bw_site_pages_callout_title' }, c: titleOrContent },
          typeof content === 'string' ? { t: 'p', c: content } : content
        ]
      };
    }
    // 2-arg: type, content (no title)
    return { t: 'div', a: { class: cls }, c: titleOrContent };
  };

  /**
   * Demo section with title, description, and content.
   * @param {string} id - Section id for anchor links
   * @param {string} title - Section title
   * @param {string} description - Description text
   * @param {Object|Array} content - TACO content
   * @returns {Object} TACO
   */
  site.makeDemoSection = function(id, title, description, content) {
    return {
      t: 'div', a: { class: 'bw_site_pages_demo', id: id },
      c: [
        { t: 'h2', a: { class: 'bw_site_pages_demo_title' }, c: { t: 'a', a: { href: '#' + id }, c: title } },
        { t: 'div', a: { class: 'bw_site_pages_demo_body' }, c: [
          { t: 'p', a: { class: 'bw_site_pages_demo_desc' }, c: description },
          content
        ]}
      ]
    };
  };

  /**
   * Code block using bw.codeEditor if available, else plain pre/code.
   * @param {string} code - Code text
   * @param {string} [lang] - Language ('js' default)
   * @returns {Object} TACO
   */
  site.makeCodeBlock = function(code, lang) {
    if (typeof bw.codeEditor === 'function') {
      return bw.codeEditor({ code: code, lang: lang || 'js', readOnly: true, height: 'auto' });
    }
    return { t: 'div', a: { class: 'bw_site_pages_code' }, c: { t: 'pre', a: { class: 'bw_site_pages_code_pre' }, c: { t: 'code', a: { class: 'bw_site_pages_code_text' }, c: code } } };
  };

  /**
   * Tabbed demo: Result tab + Code tab with copy button.
   * @param {Object} resultContent - TACO for the result tab
   * @param {string} codeContent - Code string for the code tab
   * @returns {Object} TACO
   */
  site.createTabbedDemo = function(resultContent, codeContent) {
    var codeDisplay = (typeof bw.codeEditor === 'function')
      ? bw.codeEditor({ code: codeContent, lang: 'js', readOnly: true, height: 'auto' })
      : { t: 'pre', c: { t: 'code', c: codeContent } };

    return bw.makeTabs({
      tabs: [
        { label: 'Result', active: true, content: resultContent },
        {
          label: 'Code',
          content: {
            t: 'div', a: { style: 'position: relative;' },
            c: [
              {
                t: 'button',
                a: {
                  class: 'copy-btn',
                  onclick: function(e) {
                    navigator.clipboard.writeText(codeContent).then(function() {
                      e.target.textContent = 'Copied!';
                      e.target.classList.add('copied');
                      setTimeout(function() {
                        e.target.textContent = 'Copy';
                        e.target.classList.remove('copied');
                      }, 2000);
                    });
                  }
                },
                c: 'Copy'
              },
              codeDisplay
            ]
          }
        }
      ]
    });
  };

  /**
   * Code snippet with copy button (for install/usage examples).
   * @param {string} code - Code text
   * @param {string} [title] - Optional section title
   * @returns {Object} TACO
   */
  site.makeSnippet = function(code, title) {
    var content = [
      {
        t: 'div', a: { class: 'bw_site_pages_snippet_wrap' },
        c: [
          {
            t: 'button',
            a: {
              class: 'bw_site_pages_snippet_copy',
              onclick: function(e) {
                navigator.clipboard.writeText(code).then(function() {
                  e.target.textContent = 'Copied!';
                  e.target.classList.add('copied');
                  setTimeout(function() {
                    e.target.textContent = 'Copy';
                    e.target.classList.remove('copied');
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          },
          { t: 'pre', c: { t: 'code', c: code } }
        ]
      }
    ];
    if (title) content.unshift({ t: 'h4', a: { class: 'bw_site_pages_snippet_title' }, c: title });
    return { t: 'div', a: { class: 'bw_site_pages_snippet' }, c: content };
  };

  /**
   * Console/terminal output block.
   * @param {string|Array} lines - Pre-formatted HTML lines (use bw.raw() for spans)
   * @returns {Object} TACO
   */
  site.makeConsoleBlock = function(lines) {
    var content = Array.isArray(lines) ? lines.join('\n') : lines;
    return { t: 'div', a: { class: 'bw_site_pages_console' }, c: bw.raw(content) };
  };

  /**
   * Site footer TACO.
   * @returns {Object} TACO
   */
  site.makeSiteFooter = function() {
    return {
      t: 'footer', a: { class: 'bw_site_pages_footer' },
      c: { t: 'p', a: { class: 'bw_site_pages_footer_text' }, c: 'bitwrench\u2122 \u00A9 deftio / M. Chatterjee \u00B7 BSD-2-Clause' }
    };
  };

  // =========================================================================
  // initBitwrenchPage -- replaces the one in shared-nav.js
  // =========================================================================
  function initBitwrenchPage(currentPage, baseHref) {
    var styles = bw.loadStyles();
    applySiteChromeCSS(styles);
    mountExampleNav('#example-nav', currentPage, baseHref);
    return styles;
  }

  // =========================================================================
  // Exports
  // =========================================================================
  window.applySiteChromeCSS = applySiteChromeCSS;
  window.initBitwrenchPage = initBitwrenchPage;
  window.site = site;
  window.SITE = SITE;

})();
