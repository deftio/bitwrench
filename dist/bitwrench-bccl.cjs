/*! bitwrench-bccl v2.1.14 | BSD-2-Clause | https://deftio.github.io/bitwrench/pages */
'use strict';

/**
 * bitwrench-bccl-styles.js -- the widget stylesheet.
 *
 * Every rule here styles something a BCCL factory emits (bw_bccl_btn,
 * bw_bccl_card, bw_bccl_modal, ...). A widget rule ships with its factory and
 * a factory ships with its rule, so this file is imported only by
 * bitwrench-bccl.js and is absent from the lean build, which has no factories
 * to use it. Core (bitwrench-styles.js) keeps the reset, typography, the role
 * colours and utilities, the grid, and the table and bar-chart rules.
 *
 * No imports, on purpose: the standalone BCCL bundle has no external for the
 * style engine, so an import of bitwrench-styles.js would copy the engine into
 * that artifact. Core hands the four selector helpers in at call time.
 *
 * Two exports, read by bw.loadStructural and bw.makeStyles through the list
 * bw._installStyleSheet() maintains:
 *   bcclStructural()                      -> { category: { selector: decls } }
 *   bcclThemed(scope, palette, layout, h) -> { selector: decls }
 *
 * @module bitwrench-bccl-styles
 * @license BSD-2-Clause
 */

// Selector helpers, assigned from the `h` argument of bcclThemed() before any
// generator runs. Same names as in bitwrench-styles.js so the generator
// bodies below are the ones that lived there through 2.1.13.
var _sx, _tr, _fr, _sf;

// =========================================================================
// Themed generators (colours, spacing, radius, shadow, motion from tokens)
// =========================================================================

function generateButtons(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  // Base button (only when scoped — unscoped uses defaultStyles)
  rules[_sx(scope, '.bw_bccl_btn')] = {
    'padding': sp.btn,
    'border-radius': rd.btn
  };
  rules[_sx(scope, '.bw_bccl_btn:focus-visible')] = {
    'outline': '2px solid currentColor',
    'outline-offset': '2px',
    'box-shadow': _fr(palette.primary.focus, '3px')
  };

  // Variant colors handled by palette class on component root

  // Pressed toggle button: text colour on page background, inverted, which
  // reads in both palettes (the accent fill with textOn was the low-contrast
  // case for the app that asked, #119).
  rules[_sx(scope, '.bw_bccl_btn_toggle[aria-pressed="true"]')] = {
    'background-color': palette.dark.base,
    'border-color': palette.dark.base,
    'color': palette.background
  };

  // Size variants (structural, reuse layout radius)
  rules[_sx(scope, '.bw_bccl_btn_lg')] = {
    'padding': '0.625rem 1.5rem',
    'font-size': '1rem',
    'border-radius': rd.btn === '50rem' ? '50rem' : (parseInt(rd.btn) + 2) + 'px'
  };
  rules[_sx(scope, '.bw_bccl_btn_sm')] = {
    'padding': '0.25rem 0.75rem',
    'font-size': '0.8125rem',
    'border-radius': rd.btn === '50rem' ? '50rem' : (Math.max(parseInt(rd.btn) - 1, 0)) + 'px'
  };

  return rules;
}

function generateAlerts(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[_sx(scope, '.bw_bccl_alert')] = {
    'padding': sp.alert,
    'border-radius': rd.alert
  };

  // Variant colors handled by palette class on component root

  return rules;
}

// generateBadges: removed — palette class on root handles variants

function generateCards(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  var elev = layout.elevation;
  var motion = layout.motion;
  rules[_sx(scope, '.bw_bccl_card')] = {
    'background-color': _sf(palette),
    'border': '1px solid ' + palette.light.border,
    'border-radius': rd.card,
    'box-shadow': elev.sm,
    'transition': _tr('box-shadow,transform', motion, 'normal')
  };
  rules[_sx(scope, '.bw_bccl_card:hover')] = {
    'box-shadow': elev.md
  };
  rules[_sx(scope, '.bw_bccl_card_hoverable')] = {
    'transition': _tr('box-shadow,transform', motion, 'slow')
  };
  rules[_sx(scope, '.bw_bccl_card_hoverable:hover')] = {
    'box-shadow': elev.lg
  };
  rules[_sx(scope, '.bw_bccl_card_body')] = {
    'padding': sp.card
  };
  rules[_sx(scope, '.bw_bccl_card_header')] = {
    'padding': sp.card.split(' ').map(function(v) { return (parseFloat(v) * 0.7).toFixed(3).replace(/\.?0+$/, '') + 'rem'; }).join(' '),
    'background-color': palette.surfaceAlt,
    'border-bottom': '1px solid ' + palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_card_footer')] = {
    'background-color': palette.surfaceAlt,
    'border-top': '1px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_card_title')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_card_subtitle')] = {
    'color': palette.secondary.base
  };

  // Card variant accent handled by palette class on component root

  return rules;
}

function generateForms(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[_sx(scope, '.bw_bccl_form_control')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': _sf(palette),
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_form_control:focus')] = {
    'border-color': palette.primary.border,
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '-1px',
    'box-shadow': _fr(palette.primary.focus)
  };
  rules[_sx(scope, '.bw_bccl_form_control::placeholder')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_form_label')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_form_text')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_form_check_input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_form_check_input:focus')] = {
    'box-shadow': _fr(palette.primary.focus)
  };
  // Validation states
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_valid')] = { 'border-color': palette.success.base };
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_valid:focus')] = {
    'border-color': palette.success.base,
    'box-shadow': _fr(palette.success.focus, '0.2rem')
  };
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_invalid')] = { 'border-color': palette.danger.base };
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_invalid:focus')] = {
    'border-color': palette.danger.base,
    'box-shadow': _fr(palette.danger.focus, '0.2rem')
  };
  // Form select
  rules[_sx(scope, '.bw_bccl_form_select')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': _sf(palette),
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_form_select:focus')] = {
    'border-color': palette.primary.border,
    'box-shadow': _fr(palette.primary.focus)
  };

  return rules;
}

function generateNavigation(scope, palette, layout) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_navbar')] = {
    'background-color': palette.surfaceAlt,
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_navbar_brand')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_navbar_nav .bw_nav_link')] = {
    'color': palette.secondary.base,
    'border-radius': layout.radius.btn,
    'transition': _tr('color,background-color', layout.motion)
  };
  rules[_sx(scope, '.bw_bccl_navbar_nav .bw_nav_link:hover')] = {
    'color': palette.tertiary.base,
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_navbar_nav .bw_nav_link.active')] = {
    'color': palette.primary.base,
    'background-color': palette.primary.focus,
    'font-weight': '600'
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark')] = {
    'background-color': palette.dark.base,
    'border-bottom-color': palette.dark.hover
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_bccl_navbar_brand')] = {
    'color': palette.light.base
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_nav_link')] = {
    'color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_nav_link:hover')] = {
    'color': palette.light.base
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_nav_link.active')] = {
    'color': palette.light.base,
    'font-weight': '600'
  };
  rules[_sx(scope, '.bw_nav_pills .bw_nav_link.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base
  };
  return rules;
}

function generateTabs(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_nav_tabs')] = {
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_nav_link')] = {
    'color': palette.secondary.base,
    'transition': _tr('color,border-color,background-color', mo)
  };
  rules[_sx(scope, '.bw_nav_tabs .bw_nav_link:hover')] = {
    'color': palette.tertiary.base,
    'background-color': palette.surfaceAlt,
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_nav_tabs .bw_nav_link.active')] = {
    'color': palette.primary.base,
    'background-color': palette.primary.focus,
    'border-bottom': '2px solid ' + palette.primary.base
  };
  return rules;
}

function generateListGroups(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var mo = layout.motion;

  rules[_sx(scope, '.bw_list_group_item')] = {
    'padding': sp.cell,
    'color': palette.dark.base,
    'background-color': _sf(palette),
    'border-color': palette.light.border,
    'transition': _tr('color,background-color', mo)
  };
  rules[_sx(scope, 'a.bw_list_group_item:hover')] = {
    'background-color': palette.surfaceAlt,
    'color': palette.tertiary.base
  };
  rules[_sx(scope, '.bw_list_group_item.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_list_group_item.disabled')] = {
    'color': palette.secondary.base,
    'background-color': _sf(palette)
  };

  return rules;
}

function generatePagination(scope, palette, layout) {
  var rules = {}, mo = layout.motion, rd = layout.radius;
  rules[_sx(scope, '.bw_page_item:first-child .bw_page_link')] = {
    'border-top-left-radius': rd.btn,
    'border-bottom-left-radius': rd.btn
  };
  rules[_sx(scope, '.bw_page_item:last-child .bw_page_link')] = {
    'border-top-right-radius': rd.btn,
    'border-bottom-right-radius': rd.btn
  };
  rules[_sx(scope, '.bw_page_link')] = {
    'color': palette.primary.base,
    'background-color': _sf(palette),
    'border-color': palette.light.border,
    'transition': _tr('color,background-color', mo)
  };
  rules[_sx(scope, '.bw_page_link:hover')] = {
    'color': palette.primary.hover,
    'background-color': palette.surfaceAlt,
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_page_link:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '-2px'
  };
  rules[_sx(scope, '.bw_page_item.bw_active .bw_page_link')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_page_item.bw_disabled .bw_page_link')] = {
    'color': palette.secondary.base,
    'background-color': _sf(palette),
    'border-color': palette.light.border
  };
  return rules;
}

function generateProgress(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_progress')] = {
    'background-color': palette.surfaceAlt,
    'border-radius': rd.badge,
    'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
  };
  rules[_sx(scope, '.bw_bccl_progress_bar')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-radius': 'inherit',
    'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)'
  };
  // Variant progress bar colors handled by palette class
  return rules;
}

// generateHero: removed — palette class with .bw_bccl_hero override handles variants

// generateUtilityColors: removed — palette classes replace utility colors

function generateBreadcrumbThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_bccl_breadcrumb')] = {
    'background-color': palette.surfaceAlt,
    'padding': '0.625rem 1rem',
    'border-radius': layout.radius.btn
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item + .bw_bccl_breadcrumb_item::before')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item a')] = {
    'color': palette.tertiary.base,
    'transition': _tr('color', mo)
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item a:hover')] = {
    'color': palette.tertiary.hover,
    'text-decoration': 'underline'
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item.active')] = {
    'color': palette.dark.base
  };
  return rules;
}

// generateSpinnerThemed: removed — palette class on root handles variants

function generateCloseButtonThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_close')] = {
    'color': palette.dark.base,
    'opacity': '0.5'
  };
  rules[_sx(scope, '.bw_close:focus')] = {
    'box-shadow': _fr(palette.primary.focus)
  };
  return rules;
}

function generateSectionsThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_section_subtitle')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_feature_description')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_cta_description')] = {
    'color': palette.secondary.base
  };
  return rules;
}

function generateAccordionThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_accordion_item')] = {
    'background-color': _sf(palette),
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_accordion_item:first-child')] = {
    'border-top-left-radius': rd.card,
    'border-top-right-radius': rd.card
  };
  rules[_sx(scope, '.bw_bccl_accordion_item:last-child')] = {
    'border-bottom-left-radius': rd.card,
    'border-bottom-right-radius': rd.card
  };
  rules[_sx(scope, '.bw_bccl_accordion_button')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:not(.bw_collapsed)')] = {
    'color': palette.primary.darkText,
    'background-color': palette.primary.light,
    'border-left': '3px solid ' + palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:hover')] = {
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:not(.bw_collapsed):hover')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:focus-visible')] = {
    'box-shadow': _fr(palette.primary.focus, '0.2rem')
  };
  rules[_sx(scope, '.bw_bccl_accordion_body')] = {
    'border-top': '1px solid ' + palette.light.border,
    'background-color': palette.surfaceAlt
  };
  return rules;
}

function generateCarouselThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_carousel')] = {
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_carousel_indicator.active')] = {
    'background-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_carousel_control')] = {
    'background-color': palette.dark.base,
    'color': palette.dark.textOn,
    'transition': 'background-color 0.15s ease-out'
  };
  rules[_sx(scope, '.bw_bccl_carousel_control:hover')] = {
    'background-color': palette.dark.hover
  };
  rules[_sx(scope, '.bw_bccl_carousel_caption')] = {
    'background': 'linear-gradient(transparent, ' + palette.dark.base + ')',
    'color': palette.dark.textOn
  };
  return rules;
}

function generateModalThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_modal_content')] = {
    'background-color': _sf(palette),
    'border-color': palette.light.border,
    'border-radius': rd.card,
    'box-shadow': layout.elevation.lg
  };
  rules[_sx(scope, '.bw_bccl_modal_header')] = {
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_modal_footer')] = {
    'border-top-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_modal_title')] = {
    'color': palette.dark.base
  };
  return rules;
}

function generateToastThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_toast')] = {
    'background-color': _sf(palette),
    'border-color': palette.light.border,
    'border-radius': rd.card,
    'box-shadow': layout.elevation.lg
  };
  rules[_sx(scope, '.bw_bccl_toast_header')] = {
    'border-bottom-color': palette.light.border
  };
  // Variant toast borders handled by palette class
  return rules;
}

function generateDropdownThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_dropdown_menu')] = {
    'background-color': _sf(palette),
    'border-color': palette.light.border,
    'border-radius': rd.card,
    'box-shadow': layout.elevation.md
  };
  rules[_sx(scope, '.bw_bccl_dropdown_item')] = {
    'color': palette.dark.base,
    'transition': _tr('background-color', layout.motion)
  };
  rules[_sx(scope, '.bw_bccl_dropdown_item:hover')] = {
    'color': palette.dark.hover,
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_dropdown_item.disabled')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_dropdown_divider')] = {
    'border-top-color': palette.light.border
  };
  return rules;
}

function generateSwitchThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input')] = {
    'background-color': palette.secondary.base,
    'border-color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input:focus')] = {
    'box-shadow': _fr(palette.primary.focus)
  };
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input:focus-visible')] = {
    'box-shadow': _fr(palette.primary.focus),
    'outline': 'none'
  };
  return rules;
}

function generateSkeletonThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_skeleton')] = {
    'background': 'linear-gradient(90deg, ' + palette.light.border + ' 25%, ' + palette.surfaceAlt + ' 37%, ' + palette.light.border + ' 63%)'
  };
  return rules;
}

// generateAvatarThemed: removed — palette class on root handles variants

function generateStatCardThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion, el = layout.elevation, rd = layout.radius;
  rules[_sx(scope, '.bw_stat_card')] = {
    'background-color': _sf(palette),
    'color': palette.dark.base,
    'border': '1px solid ' + palette.light.border,
    'border-radius': rd.card,
    'box-shadow': el.sm,
    'transition': _tr('box-shadow,transform', mo)
  };
  rules[_sx(scope, '.bw_stat_card:hover')] = { 'box-shadow': el.md };
  // Variant border colors handled by palette class
  rules[_sx(scope, '.bw_stat_change_up')] = { 'color': palette.success.base };
  rules[_sx(scope, '.bw_stat_change_down')] = { 'color': palette.danger.base };
  return rules;
}

function generateTimelineThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_timeline::before')] = { 'background-color': palette.light.border };
  // Variant marker colors handled by palette class
  rules[_sx(scope, '.bw_bccl_timeline_date')] = { 'color': palette.secondary.base };
  return rules;
}

function generateStepperThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_step_indicator')] = {
    'background-color': palette.surfaceAlt,
    'border': '2px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_step + .bw_step::before')] = { 'background-color': palette.light.border };
  rules[_sx(scope, '.bw_step_active .bw_step_indicator')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_step_active .bw_step_label')] = {
    'color': palette.dark.base,
    'font-weight': '600'
  };
  rules[_sx(scope, '.bw_step_completed .bw_step_indicator')] = {
    'background-color': palette.tertiary.base,
    'color': palette.tertiary.textOn
  };
  rules[_sx(scope, '.bw_step_completed .bw_step_label')] = { 'color': palette.tertiary.base };
  rules[_sx(scope, '.bw_step_completed + .bw_step::before')] = { 'background-color': palette.tertiary.base };
  return rules;
}

function generateChipInputThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_chip_input')] = {
    'border-color': palette.light.border,
    'background-color': _sf(palette),
    'color': palette.dark.base,
    'border-radius': rd.input
  };
  rules[_sx(scope, '.bw_chip_input:focus-within')] = {
    'border-color': palette.primary.base,
    'box-shadow': _fr(palette.primary.focus, '0.2rem')
  };
  rules[_sx(scope, '.bw_chip')] = {
    'background-color': palette.surfaceAlt,
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_chip_remove:hover')] = {
    'color': palette.danger.base,
    'background-color': palette.danger.light
  };
  return rules;
}

function generateFileUploadThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_file_upload')] = {
    'border-color': palette.light.border,
    'background-color': palette.surfaceAlt,
    'transition': _tr('border-color,background-color', mo)
  };
  rules[_sx(scope, '.bw_file_upload:hover')] = {
    'border-color': palette.primary.base,
    'background-color': palette.primary.light
  };
  rules[_sx(scope, '.bw_file_upload:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '2px'
  };
  rules[_sx(scope, '.bw_file_upload.bw_file_upload_active')] = {
    'border-color': palette.primary.base,
    'background-color': palette.primary.light,
    'border-style': 'solid'
  };
  return rules;
}

function generateRangeThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_range')] = { 'background-color': palette.light.border };
  rules[_sx(scope, '.bw_range::-webkit-slider-thumb')] = {
    'background-color': palette.primary.base,
    'border-color': _sf(palette),
    'box-shadow': '0 1px 3px rgba(0,0,0,0.2)',
    'transition': 'background-color 0.15s ease-out, transform 0.15s ease-out'
  };
  rules[_sx(scope, '.bw_range::-moz-range-thumb')] = {
    'background-color': palette.primary.base,
    'border-color': _sf(palette),
    'box-shadow': '0 1px 3px rgba(0,0,0,0.2)'
  };
  return rules;
}

function generateTooltipThemed(scope, palette, layout) {
  var rules = {}, sp = layout.spacing, rd = layout.radius, el = layout.elevation, mo = layout.motion;
  rules[_sx(scope, '.bw_bccl_tooltip')] = {
    'background-color': palette.dark.base, 'color': palette.dark.textOn,
    'padding': sp.input, 'border-radius': rd.badge, 'box-shadow': el.md,
    'transition': _tr('opacity,transform', mo)
  };
  return rules;
}

function generatePopoverThemed(scope, palette, layout) {
  var rules = {}, sp = layout.spacing, rd = layout.radius, el = layout.elevation, mo = layout.motion;
  rules[_sx(scope, '.bw_popover')] = {
    'background-color': _sf(palette), 'color': palette.dark.base,
    'border': '1px solid ' + palette.light.border, 'border-radius': rd.card, 'box-shadow': el.lg,
    'transition': _tr('opacity,transform', mo)
  };
  rules[_sx(scope, '.bw_popover_header')] = {
    'background-color': palette.surfaceAlt, 'border-bottom': '1px solid ' + palette.light.border,
    'padding': sp.input
  };
  rules[_sx(scope, '.bw_popover_body')] = { 'padding': sp.card };
  return rules;
}

function generateSearchThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_search_input')] = {
    'background-color': _sf(palette),
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_search_clear')] = {
    'transition': _tr('color,background-color', mo)
  };
  rules[_sx(scope, '.bw_search_clear:hover')] = { 'color': palette.dark.base };
  return rules;
}

function generateCodeDemoThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_code_demo')] = {
    'background-color': _sf(palette),
    'color': palette.dark.base,
    'border-radius': rd.card
  };
  rules[_sx(scope, '.bw_code_copy_btn_copied')] = {
    'background': palette.success.base,
    'color': palette.success.textOn,
    'border-color': palette.success.base
  };
  rules[_sx(scope, '.bw_copy_btn:hover')] = {
    'background': 'rgba(255,255,255,0.2)',
    'color': '#fff'
  };
  return rules;
}

function generateNavPillsThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_nav_pills .bw_nav_link')] = { 'border-radius': rd.btn };
  return rules;
}

// =========================================================================
// Palette classes — single-class theming for ALL components
// =========================================================================


// Role-colour overrides for widgets: .bw_bccl_alert.bw_primary and friends.
// The role classes themselves (.bw_primary, .bw_bg_*, .bw_text_*) stay in
// core's generatePaletteClasses.
function generateWidgetPaletteClasses(scope, palette) {
  var rules = {};
  Object.keys(palette).forEach(function(k) {
    if (typeof palette[k] !== 'object') return;
    var s = palette[k];

    // Alerts: light bg, dark text, subtle border
    rules[_sx(scope, '.bw_bccl_alert.bw_' + k)] = {
      'background-color': s.light,
      'color': s.darkText,
      'border-color': s.border
    };

    // Toast: inherit bg, left border accent
    rules[_sx(scope, '.bw_bccl_toast.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left': '4px solid ' + s.base
    };

    // Stat card: inherit bg, left border accent
    rules[_sx(scope, '.bw_stat_card.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left-color': s.base
    };

    // Card accent: left border accent, inherit bg
    rules[_sx(scope, '.bw_bccl_card.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left': '4px solid ' + s.base
    };

    // Timeline marker: colored dot
    rules[_sx(scope, '.bw_bccl_timeline_marker.bw_' + k)] = {
      'box-shadow': '0 0 0 2px ' + s.base
    };

    // Spinner: set color, re-apply border pattern so the root palette class
    // border-color doesn't fill in the transparent gap that makes it spin.
    // Also neutralize hover/active which would override border-right-color.
    rules[_sx(scope, '.bw_spinner_border.bw_' + k)] = {
      'background-color': 'transparent',
      'color': s.base,
      'border-color': s.base,
      'border-right-color': 'transparent'
    };
    rules[_sx(scope, '.bw_spinner_border.bw_' + k + ':hover')] = {
      'background-color': 'transparent',
      'border-color': s.base,
      'border-right-color': 'transparent'
    };
    rules[_sx(scope, '.bw_spinner_grow.bw_' + k)] = {
      'background-color': s.base,
      'color': s.base
    };

    // Outline button: transparent bg, colored border+text, solid on hover
    rules[_sx(scope, '.bw_bccl_btn_outline.bw_' + k)] = {
      'background-color': 'transparent',
      'color': s.base,
      'border-color': s.base
    };
    rules[_sx(scope, '.bw_bccl_btn_outline.bw_' + k + ':hover')] = {
      'background-color': s.base,
      'color': s.textOn
    };

    // Hero: gradient background
    rules[_sx(scope, '.bw_bccl_hero.bw_' + k)] = {
      'background': 'linear-gradient(135deg, ' + s.base + ' 0%, ' + s.hover + ' 100%)',
      'color': s.textOn
    };

    // Progress bar: contrasting text on colored bg
    rules[_sx(scope, '.bw_bccl_progress_bar.bw_' + k)] = {
      'color': s.textOn
    };

  });
  return rules;
}

/**
 * Themed widget rules for one palette.
 * @param {string} scope - CSS scope class ('' for global)
 * @param {Object} palette - From derivePalette()
 * @param {Object} layout - From resolveLayout()
 * @param {Object} h - Selector helpers from core: { sx, tr, fr, sf }
 * @returns {Object} CSS rules object
 */
function bcclThemed(scope, palette, layout, h) {
  _sx = h.sx; _tr = h.tr; _fr = h.fr; _sf = h.sf;
  return Object.assign({},
    generateButtons(scope, palette, layout),
    generateAlerts(scope, palette, layout),
    generateCards(scope, palette, layout),
    generateForms(scope, palette, layout),
    generateNavigation(scope, palette, layout),
    generateTabs(scope, palette, layout),
    generateListGroups(scope, palette, layout),
    generatePagination(scope, palette, layout),
    generateProgress(scope, palette, layout),
    generateBreadcrumbThemed(scope, palette, layout),
    generateCloseButtonThemed(scope, palette),
    generateSectionsThemed(scope, palette),
    generateAccordionThemed(scope, palette, layout),
    generateCarouselThemed(scope, palette),
    generateModalThemed(scope, palette, layout),
    generateToastThemed(scope, palette, layout),
    generateDropdownThemed(scope, palette, layout),
    generateSwitchThemed(scope, palette),
    generateSkeletonThemed(scope, palette),
    generateStatCardThemed(scope, palette, layout),
    generateTimelineThemed(scope, palette),
    generateStepperThemed(scope, palette),
    generateChipInputThemed(scope, palette, layout),
    generateFileUploadThemed(scope, palette, layout),
    generateRangeThemed(scope, palette),
    generateSearchThemed(scope, palette, layout),
    generateTooltipThemed(scope, palette, layout),
    generatePopoverThemed(scope, palette, layout),
    generateCodeDemoThemed(scope, palette, layout),
    generateNavPillsThemed(scope, palette, layout),
    generateWidgetPaletteClasses(scope, palette)
  );
}

// =========================================================================
// Structural rules (display, flex, position, ...) -- theme-independent
// =========================================================================

var widgetStructural = {
  // ---- Buttons ----
  buttons: {
    '.bw_bccl_btn': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'font-weight': '500', 'line-height': '1.5', 'text-align': 'center',
      'text-decoration': 'none', 'vertical-align': 'middle', 'cursor': 'pointer',
      'user-select': 'none', 'border': '1px solid transparent',
      'font-size': '0.875rem', 'font-family': 'inherit', 'gap': '0.5rem'
    },
    '.bw_bccl_btn:hover': { 'text-decoration': 'none', 'transform': 'translateY(-1px)' },
    '.bw_bccl_btn:active': { 'transform': 'translateY(0)' },
    '.bw_bccl_btn:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '2px' },
    '.bw_bccl_btn:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed', 'pointer-events': 'none' },
    '.bw_bccl_btn_block': { 'display': 'block', 'width': '100%' }
  },

  // ---- Cards ----
  cards: {
    '.bw_bccl_card': {
      'position': 'relative', 'display': 'flex', 'flex-direction': 'column',
      'min-width': '0', 'height': '100%', 'word-wrap': 'break-word',
      'background-clip': 'border-box', 'margin-bottom': '1.5rem', 'overflow': 'hidden'
    },
    '.bw_bccl_card_body': { 'flex': '1 1 auto' },
    '.bw_bccl_card_body > *:last-child': { 'margin-bottom': '0' },
    '.bw_bccl_card_title': { 'margin-bottom': '0.5rem', 'font-size': '1.125rem', 'font-weight': '600', 'line-height': '1.3' },
    '.bw_bccl_card_text': { 'margin-bottom': '0', 'font-size': '0.9375rem', 'line-height': '1.6' },
    '.bw_bccl_card_header': { 'margin-bottom': '0', 'font-weight': '600', 'font-size': '0.875rem' },
    '.bw_bccl_card_footer': { 'font-size': '0.875rem' },
    '.bw_bccl_card_hoverable': {},
    '.bw_bccl_card_hoverable:hover': { 'transform': 'translateY(-4px)' },
    '.bw_bccl_card_img_top': { 'width': '100%' },
    '.bw_bccl_card_img_bottom': { 'width': '100%' },
    '.bw_bccl_card_img_left': { 'width': '40%', 'object-fit': 'cover' },
    '.bw_bccl_card_img_right': { 'width': '40%', 'object-fit': 'cover' },
    '.bw_bccl_card_subtitle, .card-subtitle': { 'margin-top': '-0.25rem', 'margin-bottom': '0.5rem', 'font-size': '0.875rem' }
  },

  // ---- Forms ----
  forms: {
    '.bw_bccl_form_control': {
      'display': 'block', 'width': '100%',
      'font-size': '0.9375rem', 'font-weight': '400', 'line-height': '1.5',
      'background-clip': 'padding-box', 'appearance': 'none',
      'border': '1px solid transparent', 'font-family': 'inherit',
      'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out'
    },
    '.bw_bccl_form_control:focus': { 'outline': '2px solid currentColor', 'outline-offset': '-1px' },
    '.bw_bccl_form_control::placeholder': { 'opacity': '1' },
    '.bw_bccl_form_label': { 'display': 'block', 'margin-bottom': '0.375rem', 'font-size': '0.875rem', 'font-weight': '600' },
    '.bw_bccl_form_group': { 'margin-bottom': '1.25rem' },
    '.bw_bccl_form_text': { 'margin-top': '0.25rem', 'font-size': '0.8125rem' },
    'select.bw_bccl_form_control': {
      'padding-right': '2.25rem',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
      'background-repeat': 'no-repeat', 'background-position': 'right 0.75rem center',
      'background-size': '16px 12px'
    },
    'textarea.bw_bccl_form_control': { 'min-height': '5rem', 'resize': 'vertical' },
    '.bw_valid_feedback': { 'display': 'block', 'font-size': '0.875rem', 'margin-top': '0.25rem' },
    '.bw_invalid_feedback': { 'display': 'block', 'font-size': '0.875rem', 'margin-top': '0.25rem' }
  },

  // ---- Form checks ----
  formChecks: {
    '.bw_bccl_form_check': { 'display': 'flex', 'align-items': 'center', 'gap': '0.5rem', 'min-height': '1.5rem', 'margin-bottom': '0.25rem' },
    '.bw_bccl_form_check_input': { 'width': '1rem', 'height': '1rem', 'margin': '0', 'cursor': 'pointer', 'flex-shrink': '0', 'border-radius': '0.25rem', 'appearance': 'auto' },
    '.bw_bccl_form_check_input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' },
    '.bw_bccl_form_check_label': { 'cursor': 'pointer', 'user-select': 'none', 'font-size': '0.9375rem' }
  },

  // ---- Navigation ----
  navigation: {
    '.bw_bccl_navbar': {
      'position': 'relative', 'display': 'flex', 'flex-wrap': 'wrap',
      'align-items': 'center', 'justify-content': 'space-between', 'padding': '0.5rem 1.5rem'
    },
    '.bw_bccl_navbar > .bw_bccl_container, .bw_bccl_navbar > .bw_container': { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'space-between' },
    '.bw_bccl_navbar_brand': {
      'display': 'inline-flex', 'align-items': 'center', 'gap': '0.5rem',
      'padding-top': '0.25rem', 'padding-bottom': '0.25rem', 'margin-right': '1.5rem',
      'font-size': '1.125rem', 'font-weight': '600', 'line-height': 'inherit',
      'white-space': 'nowrap', 'text-decoration': 'none'
    },
    '.bw_bccl_navbar_nav': {
      'display': 'flex', 'flex-direction': 'row', 'padding-left': '0',
      'margin-bottom': '0', 'list-style': 'none', 'gap': '0.25rem'
    },
    '.bw_bccl_navbar_nav .bw_nav_link': {
      'display': 'block', 'text-decoration': 'none',
      'font-size': '0.875rem', 'font-weight': '500'
    }
  },

  // ---- Alerts ----
  alerts: {
    '.bw_bccl_alert': {
      'position': 'relative', 'margin-bottom': '1rem',
      'border': '1px solid transparent',
      'font-size': '0.9375rem', 'line-height': '1.6'
    },
    '.bw_bccl_alert_heading, .alert-heading': { 'color': 'inherit' },
    '.bw_bccl_alert_link, .alert-link': { 'font-weight': '700' },
    '.bw_bccl_alert_dismissible': { 'padding-right': '3rem' },
    '.bw_bccl_alert_dismissible .btn-close': { 'position': 'absolute', 'top': '0', 'right': '0', 'z-index': '2', 'padding': '1.25rem 1rem' }
  },

  // ---- Badges ----
  badges: {
    '.bw_bccl_badge': {
      'display': 'inline-block', 'font-size': '0.875rem',
      'font-weight': '600', 'line-height': '1.3', 'text-align': 'center',
      'white-space': 'nowrap', 'vertical-align': 'baseline',
      'padding': '0.35rem 0.65rem', 'border-radius': '0.25rem'
    },
    '.bw_bccl_badge:empty': { 'display': 'none' },
    '.bw_bccl_badge_sm': { 'font-size': '0.75rem', 'padding': '0.25rem 0.5rem' },
    '.bw_bccl_badge_lg': { 'font-size': '1rem', 'padding': '0.5rem 0.875rem' },
    '.bw_bccl_badge_pill': { 'border-radius': '50rem' },
    '.btn .badge': { 'position': 'relative', 'top': '-1px' }
  },

  // ---- Progress ----
  progress: {
    '.bw_bccl_progress': { 'display': 'flex', 'height': '1.25rem', 'overflow': 'hidden', 'font-size': '.875rem' },
    '.bw_bccl_progress_bar': {
      'display': 'flex', 'flex-direction': 'column', 'justify-content': 'center',
      'overflow': 'hidden', 'text-align': 'center', 'white-space': 'nowrap', 'font-weight': '600'
    },
    '.bw_bccl_progress_bar_striped': {
      'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
      'background-size': '1rem 1rem'
    },
    '.bw_bccl_progress_bar_animated': { 'animation': 'progress-bar-stripes 1s linear infinite' },
    '@keyframes progress-bar-stripes': { '0%': { 'background-position-x': '1rem' } }
  },

  // ---- Tabs ----
  tabs: {
    '.bw_nav': { 'display': 'flex', 'flex-wrap': 'wrap', 'padding-left': '0', 'margin-bottom': '0', 'list-style': 'none', 'gap': '0' },
    '.bw_nav_item': { 'display': 'block' },
    '.bw_nav_tabs .bw_nav_item': { 'margin-bottom': '-2px' },
    '.bw_nav_link': {
      'display': 'block', 'font-size': '0.875rem', 'font-weight': '500',
      'padding': '0.625rem 1rem',
      'text-decoration': 'none', 'cursor': 'pointer',
      'border': 'none', 'background': 'transparent', 'font-family': 'inherit'
    },
    '.bw_nav_link:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '-2px' },
    '.bw_nav_tabs .bw_nav_link': { 'border': 'none', 'border-bottom': '2px solid transparent', 'border-radius': '0', 'background-color': 'transparent' },
    '.bw_nav_vertical': { 'flex-direction': 'column' },
    '.bw_bccl_tab_content': { 'padding': '1.25rem 0' },
    '.bw_bccl_tab_pane': { 'display': 'none' },
    '.bw_bccl_tab_pane.active': { 'display': 'block' },
    '.bw_nav_scrollable': { 'flex-wrap': 'nowrap', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch', 'scrollbar-width': 'none' },
    '.bw_nav_scrollable::-webkit-scrollbar': { 'display': 'none' },
    '.bw_nav_scrollable .bw_nav_link': { 'white-space': 'nowrap' }
  },

  // ---- List groups ----
  listGroups: {
    '.bw_list_group': { 'display': 'flex', 'flex-direction': 'column', 'padding-left': '0', 'margin-bottom': '0' },
    '.bw_list_group_item': { 'position': 'relative', 'display': 'block', 'text-decoration': 'none', 'font-size': '0.9375rem' },
    '.bw_list_group_item:first-child': { 'border-top-left-radius': 'inherit', 'border-top-right-radius': 'inherit' },
    '.bw_list_group_item:last-child': { 'border-bottom-right-radius': 'inherit', 'border-bottom-left-radius': 'inherit' },
    '.bw_list_group_item + .bw_list_group_item': { 'border-top-width': '0' },
    '.bw_list_group_item.disabled': { 'pointer-events': 'none' },
    'a.bw_list_group_item': { 'cursor': 'pointer' },
    'a.bw_list_group_item:focus-visible, .bw_list_group_item:focus-visible': { 'z-index': '2', 'outline': '2px solid currentColor', 'outline-offset': '-2px' },
    '.bw_list_group_flush': { 'border-radius': '0' },
    '.bw_list_group_flush > .bw_list_group_item': { 'border-width': '0 0 1px', 'border-radius': '0' },
    '.bw_list_group_flush > .bw_list_group_item:last-child': { 'border-bottom-width': '0' }
  },

  // ---- Pagination ----
  pagination: {
    '.bw_bccl_pagination': { 'display': 'flex', 'padding-left': '0', 'list-style': 'none', 'margin-bottom': '0' },
    '.bw_page_item': { 'display': 'list-item', 'list-style': 'none' },
    '.bw_page_link': {
      'position': 'relative', 'display': 'block', 'padding': '0.375rem 0.75rem',
      'margin-left': '-1px', 'line-height': '1.25', 'text-decoration': 'none',
      'border': '1px solid transparent', 'cursor': 'pointer',
      'font-family': 'inherit', 'font-size': 'inherit', 'background': 'none'
    },
    '.bw_page_item:first-child .bw_page_link': { 'margin-left': '0' },
    // makePagination({ size }) -- same steps as the button sizes
    '.bw_bccl_pagination_sm .bw_page_link': { 'padding': '0.25rem 0.5rem', 'font-size': '0.8125rem' },
    '.bw_bccl_pagination_lg .bw_page_link': { 'padding': '0.625rem 1.25rem', 'font-size': '1.125rem' },
    '.bw_page_link:focus-visible': { 'z-index': '3', 'outline': '2px solid currentColor', 'outline-offset': '-2px' }
  },

  // ---- Breadcrumb ----
  breadcrumb: {
    '.bw_bccl_breadcrumb': { 'display': 'flex', 'flex-wrap': 'wrap', 'padding': '0 0', 'margin-bottom': '1rem', 'list-style': 'none' },
    // The <ol> inside the <nav>. Without this it renders as a numbered list,
    // because the flex/list-style rules above land on the wrapping <nav>.
    '.bw_bccl_breadcrumb_list': {
      'display': 'flex', 'flex-wrap': 'wrap', 'list-style': 'none',
      'margin': '0', 'padding': '0'
    },
    '.bw_bccl_breadcrumb_item': { 'display': 'flex' },
    '.bw_bccl_breadcrumb_item + .bw_bccl_breadcrumb_item': { 'padding-left': '0.5rem' },
    '.bw_bccl_breadcrumb_item + .bw_bccl_breadcrumb_item::before': { 'float': 'left', 'padding-right': '0.5rem', 'content': '"/"' },
    '.bw_bccl_breadcrumb_item a': { 'text-decoration': 'none' },
    '.bw_bccl_breadcrumb_item.active': { 'font-weight': '500' }
  },

  // ---- Hero ----
  hero: {
    '.bw_bccl_hero': { 'position': 'relative', 'overflow': 'hidden' },
    '.bw_bccl_hero_overlay': { 'position': 'absolute', 'top': '0', 'left': '0', 'right': '0', 'bottom': '0', 'z-index': '1' },
    '.bw_bccl_hero_content': { 'position': 'relative', 'z-index': '2' },
    '.bw_bccl_hero_title': { 'font-weight': '300', 'letter-spacing': '-0.05rem', 'color': 'inherit' },
    '.bw_bccl_hero_subtitle': { 'color': 'inherit' },
    '.bw_bccl_hero_actions': { 'display': 'flex', 'gap': '1rem', 'justify-content': 'center', 'flex-wrap': 'wrap' }
  },

  // ---- Features ----
  features: {
    '.bw_feature': { 'padding': '1rem' },
    '.bw_feature_icon': { 'display': 'inline-block', 'margin-bottom': '1rem' },
    '.bw_feature_title': { 'margin-bottom': '0.5rem' },
    '.bw_feature_grid': { 'width': '100%' }
  },

  // ---- Sections ----
  sections: {
    '.bw_section': { 'position': 'relative' },
    '.bw_section_header': { 'margin-bottom': '3rem' },
    '.bw_section_title': { 'margin-bottom': '1rem', 'font-weight': '300', 'font-size': 'calc(1.325rem + .9vw)' }
  },

  // ---- CTA ----
  cta: {
    '.bw_cta': { 'position': 'relative' },
    '.bw_cta_content': { 'max-width': '48rem', 'margin': '0 auto' },
    '.bw_cta_title': { 'font-weight': '300' },
    '.bw_cta_actions': { 'display': 'flex', 'gap': '1rem', 'justify-content': 'center', 'flex-wrap': 'wrap' }
  },

  // ---- Spinner ----
  spinner: {
    '.bw_spinner_border': {
      'display': 'inline-block', 'width': '2rem', 'height': '2rem',
      'vertical-align': '-0.125em', 'border': '0.25em solid currentcolor',
      'border-right-color': 'transparent', 'border-radius': '50%',
      'animation': 'bw_spinner_border 0.75s linear infinite'
    },
    '.bw_spinner_border_sm': { 'width': '1rem', 'height': '1rem', 'border-width': '0.2em' },
    '.bw_spinner_border_lg': { 'width': '3rem', 'height': '3rem', 'border-width': '0.3em' },
    '.bw_spinner_border_md': { 'width': '2rem', 'height': '2rem', 'border-width': '0.25em' },
    '.bw_spinner_grow': {
      'display': 'inline-block', 'width': '2rem', 'height': '2rem',
      'vertical-align': '-0.125em', 'border-radius': '50%', 'opacity': '0',
      'animation': 'bw_spinner_grow 0.75s linear infinite'
    },
    '.bw_spinner_grow_sm': { 'width': '1rem', 'height': '1rem' },
    '.bw_spinner_grow_lg': { 'width': '3rem', 'height': '3rem' },
    '.bw_spinner_grow_md': {},
    '@keyframes bw_spinner_border': { '100%': { 'transform': 'rotate(360deg)' } },
    '@keyframes bw_spinner_grow': { '0%': { 'transform': 'scale(0)' }, '50%': { 'opacity': '1', 'transform': 'none' } },
    '.bw_visually_hidden': {
      'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
      'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0, 0, 0, 0)',
      'white-space': 'nowrap', 'border': '0'
    }
  },

  // ---- Close button ----
  closeButton: {
    '.bw_close': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1.5rem', 'height': '1.5rem', 'padding': '0',
      'font-size': '1.25rem', 'font-weight': '700', 'line-height': '1',
      'background': 'transparent', 'border': '0', 'border-radius': '0.25rem', 'cursor': 'pointer',
      'transition': 'opacity 0.15s ease-out'
    },
    '.bw_close:hover': { 'opacity': '0.75' },
    '.bw_close:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '2px' }
  },

  // ---- Code demo ----
  codeDemo: {
    '.bw_code_demo': { 'margin-bottom': '2rem' },
    '.bw_code_pre': { 'margin': '0', 'border': 'none', 'overflow-x': 'auto', 'max-width': '100%' },
    '.bw_code_block': {
      'display': 'block', 'padding': '1.25rem',
      'font-family': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      'font-size': '0.8125rem', 'line-height': '1.6'
    },
    '.bw_code_copy_btn': {
      'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem',
      'padding': '0.25rem 0.625rem', 'font-size': '0.6875rem',
      'cursor': 'pointer', 'font-family': 'inherit'
    },
    '.bw_copy_btn': {
      'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem',
      'padding': '0.25rem 0.625rem', 'font-size': '0.6875rem',
      'cursor': 'pointer', 'font-family': 'inherit'
    }
  },

  // ---- Button group ----
  buttonGroup: {
    '.bw_bccl_btn_group, .bw_bccl_btn_group_vertical': { 'position': 'relative', 'display': 'inline-flex', 'vertical-align': 'middle' },
    '.bw_bccl_btn_group > .bw_bccl_btn, .bw_bccl_btn_group_vertical > .bw_bccl_btn': { 'position': 'relative', 'flex': '1 1 auto', 'border-radius': '0', 'margin-left': '-1px' },
    '.bw_bccl_btn_group > .bw_bccl_btn:first-child': { 'margin-left': '0' },
    '.bw_bccl_btn_group > .bw_bccl_btn:last-child': {},
    '.bw_bccl_btn_group_lg > .bw_bccl_btn': { 'padding': '0.625rem 1.5rem', 'font-size': '1rem' },
    '.bw_bccl_btn_group_sm > .bw_bccl_btn': { 'padding': '0.25rem 0.75rem', 'font-size': '0.8125rem' },
    '.bw_bccl_btn_group_vertical': { 'flex-direction': 'column', 'align-items': 'flex-start', 'justify-content': 'center' },
    '.bw_bccl_btn_group_vertical > .bw_bccl_btn': { 'width': '100%', 'margin-left': '0', 'margin-top': '-1px' },
    '.bw_bccl_btn_group_vertical > .bw_bccl_btn:first-child': { 'margin-top': '0' },
    '.bw_bccl_btn_group_vertical > .bw_bccl_btn:last-child': {}
  },

  // ---- Accordion ----
  accordion: {
    '.bw_bccl_accordion': { 'overflow': 'hidden' },
    '.bw_bccl_accordion_item': { 'border': '1px solid transparent' },
    '.bw_bccl_accordion_item + .bw_bccl_accordion_item': { 'border-top': '0' },
    '.bw_bccl_accordion_header': { 'margin': '0' },
    '.bw_bccl_accordion_button': {
      'position': 'relative', 'display': 'flex', 'align-items': 'center', 'width': '100%',
      'padding': '0.875rem 1.25rem',
      'font-size': '1rem', 'font-weight': '500', 'text-align': 'left',
      'background-color': 'transparent', 'border': '0', 'overflow-anchor': 'none', 'cursor': 'pointer',
      'font-family': 'inherit'
    },
    '.bw_bccl_accordion_button::after': {
      'flex-shrink': '0', 'width': '1.25rem', 'height': '1.25rem', 'margin-left': 'auto',
      'content': '""',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23212529'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e\")",
      'background-repeat': 'no-repeat', 'background-size': '1.25rem',
      'transition': 'transform 0.2s ease-out'
    },
    '.bw_bccl_accordion_button:not(.bw_collapsed)::after': { 'transform': 'rotate(-180deg)' },
    '.bw_bccl_accordion_body': { 'padding': '1rem 1.25rem' },
    '.bw_bccl_accordion_collapse': { 'max-height': '0', 'overflow': 'hidden', 'transition': 'max-height 0.3s ease' },
    '.bw_bccl_accordion_collapse.bw_collapse_show': { 'max-height': 'none' }
  },

  // ---- Carousel ----
  carousel: {
    '.bw_bccl_carousel': { 'position': 'relative', 'overflow': 'hidden' },
    '.bw_bccl_carousel_track': { 'display': 'flex', 'height': '100%' },
    '.bw_bccl_carousel_slide': {
      'min-width': '100%', 'flex-shrink': '0', 'overflow': 'hidden',
      'position': 'relative', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center'
    },
    '.bw_bccl_carousel_slide img': { 'width': '100%', 'height': '100%', 'object-fit': 'cover' },
    '.bw_bccl_carousel_caption': { 'position': 'absolute', 'bottom': '0', 'left': '0', 'right': '0', 'padding': '0.75rem 1rem', 'font-size': '0.875rem' },
    '.bw_bccl_carousel_control': {
      'position': 'absolute', 'top': '50%', 'transform': 'translateY(-50%)',
      'width': '40px', 'height': '40px', 'border': 'none', 'border-radius': '50%',
      'cursor': 'pointer', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'z-index': '2', 'padding': '0'
    },
    '.bw_bccl_carousel_control img': { 'width': '20px', 'height': '20px', 'pointer-events': 'none' },
    '.bw_bccl_carousel_control:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '2px' },
    '.bw_bccl_carousel_control_prev': { 'left': '10px' },
    '.bw_bccl_carousel_control_next': { 'right': '10px' },
    '.bw_bccl_carousel_indicators': {
      'position': 'absolute', 'bottom': '12px', 'left': '50%', 'transform': 'translateX(-50%)',
      'display': 'flex', 'gap': '6px', 'z-index': '2'
    },
    '.bw_bccl_carousel_indicator': {
      'width': '10px', 'height': '10px', 'border-radius': '50%', 'border': '2px solid transparent',
      'padding': '0', 'cursor': 'pointer'
    },
    '.bw_bccl_carousel_indicator:hover': { 'opacity': '0.8' }
  },

  // ---- Modal ----
  modal: {
    '.bw_bccl_modal': {
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%', 'height': '100%',
      'z-index': '1050', 'overflow-x': 'hidden', 'overflow-y': 'auto',
      'opacity': '0', 'visibility': 'hidden', 'pointer-events': 'none',
      'transition': 'opacity 0.2s ease-out, visibility 0.2s ease-out'
    },
    '.bw_bccl_modal.bw_bccl_modal_show': { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' },
    '.bw_bccl_modal_dialog': {
      'position': 'relative', 'width': 'calc(100% - 1rem)', 'max-width': '500px', 'margin': '1.75rem auto',
      'pointer-events': 'none', 'transform': 'translateY(-16px)',
      'transition': 'transform 0.2s ease-out'
    },
    '.bw_bccl_modal.bw_bccl_modal_show .bw_bccl_modal_dialog': { 'transform': 'translateY(0)' },
    '.bw_bccl_modal_sm': { 'max-width': '300px' },
    '.bw_bccl_modal_lg': { 'max-width': '800px' },
    '.bw_bccl_modal_xl': { 'max-width': '1140px' },
    '.bw_bccl_modal_content': {
      'position': 'relative', 'display': 'flex', 'flex-direction': 'column', 'pointer-events': 'auto',
      'background-clip': 'padding-box', 'border': '1px solid transparent', 'outline': '0'
    },
    '.bw_bccl_modal_header': { 'display': 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'padding': '1rem 1.25rem', 'border-bottom': '1px solid transparent' },
    '.bw_bccl_modal_title': { 'margin': '0', 'font-size': '1.25rem', 'font-weight': '600', 'line-height': '1.3' },
    '.bw_bccl_modal_body': { 'position': 'relative', 'flex': '1 1 auto', 'padding': '1rem 1.25rem' },
    '.bw_bccl_modal_footer': { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'flex-end', 'gap': '0.5rem', 'padding': '0.75rem 1.25rem', 'border-top': '1px solid transparent' }
  },

  // ---- Toast ----
  toast: {
    '.bw_bccl_toast_container': {
      'position': 'fixed', 'z-index': '1080', 'pointer-events': 'none',
      'display': 'flex', 'flex-direction': 'column', 'gap': '0.5rem', 'padding': '1rem'
    },
    '.bw_bccl_toast_container.bw_bccl_toast_top_right': { 'top': '0', 'right': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_top_left': { 'top': '0', 'left': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_bottom_right': { 'bottom': '0', 'right': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_bottom_left': { 'bottom': '0', 'left': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_top_center': { 'top': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw_bccl_toast_container.bw_bccl_toast_bottom_center': { 'bottom': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw_bccl_toast': {
      'pointer-events': 'auto', 'width': '350px', 'max-width': 'calc(100vw - 2rem)', 'background-clip': 'padding-box',
      'opacity': '0', 'transform': 'translateY(-8px)',
      'transition': 'opacity 0.2s ease-out, transform 0.2s ease-out'
    },
    '.bw_bccl_toast.bw_bccl_toast_show': { 'opacity': '1', 'transform': 'translateY(0)' },
    '.bw_bccl_toast.bw_bccl_toast_hiding': { 'opacity': '0', 'transform': 'translateY(-8px)' },
    '.bw_bccl_toast_header': { 'display': 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'padding': '0.5rem 0.75rem', 'font-size': '0.875rem', 'border-bottom': '1px solid transparent' },
    '.bw_bccl_toast_body': { 'padding': '0.5rem 0.75rem', 'font-size': '0.9375rem' }
  },

  // ---- Dropdown ----
  dropdown: {
    '.bw_bccl_dropdown': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_bccl_dropdown_toggle::after': {
      'display': 'inline-block', 'margin-left': '0.255em', 'vertical-align': '0.255em',
      'content': '""', 'border-top': '0.3em solid', 'border-right': '0.3em solid transparent',
      'border-bottom': '0', 'border-left': '0.3em solid transparent'
    },
    '.bw_bccl_dropdown_menu': {
      'position': 'absolute', 'top': '100%', 'left': '0', 'z-index': '1000', 'display': 'block',
      'min-width': '10rem', 'padding': '0.5rem 0', 'margin': '0.125rem 0 0',
      'background-clip': 'padding-box', 'border': '1px solid transparent',
      'opacity': '0', 'visibility': 'hidden', 'pointer-events': 'none',
      'transform': 'translateY(-4px)',
      'transition': 'opacity 0.15s ease-out, transform 0.15s ease-out, visibility 0.15s ease-out'
    },
    '.bw_bccl_dropdown_menu.bw_bccl_dropdown_show': { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto', 'transform': 'translateY(0)' },
    '.bw_bccl_dropdown_menu_end': { 'left': 'auto', 'right': '0' },
    '.bw_bccl_dropdown_item': {
      'display': 'block', 'width': '100%', 'padding': '0.4rem 1rem', 'clear': 'both',
      'font-weight': '400', 'text-align': 'inherit', 'text-decoration': 'none', 'white-space': 'nowrap',
      'background-color': 'transparent', 'border': '0', 'font-size': '0.9375rem', 'cursor': 'pointer'
    },
    '.bw_bccl_dropdown_item:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '-2px' },
    '.bw_bccl_dropdown_divider': { 'height': '0', 'margin': '0.5rem 0', 'overflow': 'hidden', 'opacity': '1' }
  },

  // ---- Form switch ----
  formSwitch: {
    '.bw_bccl_form_switch': { 'padding-left': '2.5em' },
    '.bw_bccl_form_switch .bw_switch_input': {
      'width': '2em', 'height': '1.125em', 'margin-left': '-2.5em', 'border-radius': '2em',
      'appearance': 'none',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba(255,255,255,1)'/%3e%3c/svg%3e\")",
      'background-position': 'left center', 'background-repeat': 'no-repeat',
      'background-size': 'contain', 'cursor': 'pointer',
      'transition': 'background-color 0.15s ease-out, background-position 0.15s ease-out, border-color 0.15s ease-out'
    },
    '.bw_bccl_form_switch .bw_switch_input:checked': { 'background-position': 'right center' },
    '.bw_bccl_form_switch .bw_switch_input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' }
  },

  // ---- Skeleton ----
  skeleton: {
    '.bw_skeleton': { 'background-size': '400% 100%', 'animation': 'bw_skeleton_shimmer 1.4s ease infinite' },
    '.bw_skeleton_text': { 'height': '1em', 'margin-bottom': '0.5rem' },
    '.bw_skeleton_circle': { 'border-radius': '50%' },
    '.bw_skeleton_rect': {},
    '.bw_skeleton_group': { 'display': 'flex', 'flex-direction': 'column' },
    '@keyframes bw_skeleton_shimmer': { '0%': { 'background-position': '100% 50%' }, '100%': { 'background-position': '0 50%' } }
  },

  // ---- Avatar ----
  avatar: {
    '.bw_avatar': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'border-radius': '50%', 'overflow': 'hidden', 'font-weight': '600',
      'text-transform': 'uppercase', 'vertical-align': 'middle', 'object-fit': 'cover'
    },
    '.bw_avatar_sm': { 'width': '2rem', 'height': '2rem', 'font-size': '0.75rem' },
    '.bw_avatar_md': { 'width': '3rem', 'height': '3rem', 'font-size': '1rem' },
    '.bw_avatar_lg': { 'width': '4rem', 'height': '4rem', 'font-size': '1.25rem' },
    '.bw_avatar_xl': { 'width': '5rem', 'height': '5rem', 'font-size': '1.5rem' }
  },

  // ---- Stat card ----
  statCard: {
    '.bw_stat_card': {
      'padding': '1.25rem',
      'border-left': '4px solid transparent',
      'background-color': 'inherit'
    },
    '.bw_stat_card:hover': { 'transform': 'translateY(-1px)' },
    '.bw_stat_icon': { 'font-size': '1.5rem', 'margin-bottom': '0.5rem' },
    '.bw_stat_value': { 'font-size': '2rem', 'font-weight': '700', 'line-height': '1.2' },
    '.bw_stat_label': { 'font-size': '0.875rem', 'margin-top': '0.25rem' },
    '.bw_stat_change': { 'font-size': '0.875rem', 'font-weight': '500', 'margin-top': '0.5rem' }
  },

  // ---- Tooltip ----
  tooltip: {
    '.bw_bccl_tooltip_wrapper': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_bccl_tooltip': {
      'position': 'absolute', 'z-index': '999',
      'font-size': '0.875rem', 'white-space': 'nowrap', 'max-width': 'min(300px, calc(100vw - 1rem))', 'pointer-events': 'none',
      'opacity': '0', 'visibility': 'hidden'
    },
    '.bw_bccl_tooltip.bw_bccl_tooltip_show': { 'opacity': '1', 'visibility': 'visible' },
    '.bw_bccl_tooltip_top': { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-4px)', 'margin-bottom': '4px' },
    '.bw_bccl_tooltip_top.bw_bccl_tooltip_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_bccl_tooltip_bottom': { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(4px)', 'margin-top': '4px' },
    '.bw_bccl_tooltip_bottom.bw_bccl_tooltip_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_bccl_tooltip_left': { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-4px)', 'margin-right': '4px' },
    '.bw_bccl_tooltip_left.bw_bccl_tooltip_show': { 'transform': 'translateY(-50%) translateX(0)' },
    '.bw_bccl_tooltip_right': { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(4px)', 'margin-left': '4px' },
    '.bw_bccl_tooltip_right.bw_bccl_tooltip_show': { 'transform': 'translateY(-50%) translateX(0)' }
  },

  // ---- Popover ----
  popover: {
    '.bw_popover_wrapper': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_popover_trigger': { 'cursor': 'pointer' },
    '.bw_popover': {
      'position': 'absolute', 'z-index': '1000',
      'min-width': '200px', 'max-width': 'min(320px, calc(100vw - 2rem))',
      'pointer-events': 'none', 'opacity': '0', 'visibility': 'hidden'
    },
    '.bw_popover.bw_popover_show': { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' },
    '.bw_popover_header': { 'font-weight': '600', 'font-size': '0.9375rem' },
    '.bw_popover_body': { 'font-size': '0.875rem', 'line-height': '1.5' },
    '.bw_popover_top': { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-8px)', 'margin-bottom': '8px' },
    '.bw_popover_top.bw_popover_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_popover_bottom': { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(8px)', 'margin-top': '8px' },
    '.bw_popover_bottom.bw_popover_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_popover_left': { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-8px)', 'margin-right': '8px' },
    '.bw_popover_left.bw_popover_show': { 'transform': 'translateY(-50%) translateX(0)' },
    '.bw_popover_right': { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(8px)', 'margin-left': '8px' },
    '.bw_popover_right.bw_popover_show': { 'transform': 'translateY(-50%) translateX(0)' }
  },

  // ---- Search input ----
  searchInput: {
    '.bw_search_input': { 'position': 'relative', 'display': 'flex', 'align-items': 'center' },
    '.bw_search_input .bw_search_field': { 'padding-right': '2.5rem' },
    '.bw_search_clear': {
      'position': 'absolute', 'right': '0.5rem',
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1.5rem', 'height': '1.5rem',
      'border': 'none', 'background': 'none',
      'font-size': '1.25rem', 'cursor': 'pointer', 'padding': '0', 'border-radius': '50%'
    },
    '.bw_search_clear:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '2px' }
  },

  // ---- Range ----
  range: {
    '.bw_range_wrapper': { 'margin-bottom': '1rem' },
    '.bw_range_label': { 'display': 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '0.5rem', 'font-size': '0.875rem', 'font-weight': '500' },
    '.bw_range_value': { 'font-weight': '600' },
    '.bw_range': { 'width': '100%', 'height': '0.5rem', 'padding': '0', 'appearance': 'none', 'border': 'none', 'border-radius': '0.25rem', 'cursor': 'pointer', 'outline': 'none' },
    '.bw_range:focus': { 'outline': 'none' },
    '.bw_range::-webkit-slider-thumb': {
      'appearance': 'none', 'width': '1.25rem', 'height': '1.25rem', 'border-radius': '50%',
      'border-width': '2px', 'border-style': 'solid', 'cursor': 'pointer'
    },
    '.bw_range::-moz-range-thumb': {
      'width': '1.25rem', 'height': '1.25rem', 'border-radius': '50%',
      'border-width': '2px', 'border-style': 'solid', 'cursor': 'pointer'
    },
    '.bw_range::-webkit-slider-thumb:hover': { 'transform': 'scale(1.15)' },
    '.bw_range:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' }
  },

  // ---- Media object ----
  mediaObject: {
    '.bw_media': { 'display': 'flex', 'align-items': 'flex-start', 'gap': '1rem' },
    '.bw_media_reverse': { 'flex-direction': 'row-reverse' },
    '.bw_media_img': { 'border-radius': '50%', 'object-fit': 'cover', 'flex-shrink': '0' },
    '.bw_media_body': { 'flex': '1', 'min-width': '0' },
    '.bw_media_title': { 'margin': '0 0 0.25rem 0', 'font-size': '1rem', 'font-weight': '600', 'line-height': '1.3' }
  },

  // ---- File upload ----
  fileUpload: {
    '.bw_file_upload': {
      'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
      'border': '2px dashed transparent', 'cursor': 'pointer', 'text-align': 'center', 'position': 'relative'
    },
    '.bw_file_upload_icon': { 'font-size': '2rem', 'margin-bottom': '0.5rem' },
    '.bw_file_upload_text': { 'font-size': '0.875rem' },
    '.bw_file_upload_input': {
      'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
      'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'border': '0'
    }
  },

  // ---- Timeline ----
  timeline: {
    '.bw_bccl_timeline': { 'position': 'relative', 'padding-left': '2rem' },
    '.bw_bccl_timeline::before': {
      'content': '""', 'position': 'absolute', 'left': '0.5rem', 'top': '0', 'bottom': '0',
      'width': '2px'
    },
    '.bw_bccl_timeline_item': { 'position': 'relative', 'padding-bottom': '1.5rem' },
    '.bw_bccl_timeline_item:last-child': { 'padding-bottom': '0' },
    '.bw_bccl_timeline_marker': { 'position': 'absolute', 'left': '-1.75rem', 'top': '0.25rem', 'width': '0.75rem', 'height': '0.75rem', 'border-radius': '50%' },
    '.bw_bccl_timeline_content': { 'padding-left': '0.5rem' },
    '.bw_bccl_timeline_date': { 'font-size': '0.75rem', 'margin-bottom': '0.25rem', 'font-weight': '500' },
    '.bw_bccl_timeline_title': { 'font-size': '1rem', 'font-weight': '600', 'margin': '0 0 0.25rem 0', 'line-height': '1.3' },
    '.bw_bccl_timeline_text': { 'font-size': '0.875rem', 'margin': '0', 'line-height': '1.5' }
  },

  // ---- Stepper ----
  stepper: {
    '.bw_stepper': { 'display': 'flex', 'gap': '0', 'counter-reset': 'step' },
    '.bw_step': { 'flex': '1', 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center', 'position': 'relative' },
    '.bw_step + .bw_step::before': { 'content': '""', 'position': 'absolute', 'top': '1rem', 'left': '-50%', 'right': '50%', 'height': '2px' },
    '.bw_step_indicator': {
      'width': '2rem', 'height': '2rem', 'border-radius': '50%',
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'font-size': '0.875rem', 'font-weight': '600', 'position': 'relative', 'z-index': '1'
    },
    '.bw_step_body': { 'margin-top': '0.5rem' },
    '.bw_step_label': { 'font-size': '0.875rem', 'font-weight': '500' },
    '.bw_step_description': { 'font-size': '0.75rem', 'margin-top': '0.125rem' }
  },

  // ---- Chip input ----
  chipInput: {
    '.bw_chip_input': {
      'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'gap': '0.375rem',
      'padding': '0.375rem 0.5rem', 'min-height': '2.5rem', 'cursor': 'text'
    },
    '.bw_chip': {
      'display': 'inline-flex', 'align-items': 'center', 'gap': '0.25rem',
      'padding': '0.125rem 0.5rem', 'border-radius': '1rem',
      'font-size': '0.8125rem', 'line-height': '1.5', 'white-space': 'nowrap'
    },
    '.bw_chip_remove': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1rem', 'height': '1rem', 'border': 'none', 'background': 'none',
      'font-size': '0.875rem', 'cursor': 'pointer', 'padding': '0', 'border-radius': '50%'
    },
    '.bw_chip_remove:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '1px' },
    '.bw_chip_field': { 'flex': '1', 'min-width': '80px', 'border': 'none', 'outline': 'none', 'font-size': '0.875rem', 'padding': '0.125rem 0', 'background': 'transparent' }
  },

  // ---- Small screens: widget lines from the responsive block ----
  responsive: {
    '@media (max-width: 575px)': {
      '.bw_bccl_card_img_left, .bw_bccl_card-img-left': { 'width': '100%' },
      '.bw_bccl_card_img_right, .bw_bccl_card-img-right': { 'width': '100%' },
      '.bw_bccl_hero, .bw_bccl_hero': { 'padding': '2rem 1rem' },
      '.bw_cta_actions, .bw_cta-actions': { 'flex-direction': 'column' },
      '.bw_bccl_modal_dialog': { 'margin': '0.5rem auto' },
      '.bw_bccl_modal_lg': { 'max-width': 'calc(100% - 1rem)' },
      '.bw_bccl_modal_xl': { 'max-width': 'calc(100% - 1rem)' },
      '.bw_bccl_navbar': { 'padding': '0.5rem 0.75rem' },
      '.bw_bccl_navbar_brand': { 'margin-right': '0.5rem', 'font-size': '1rem' },
      '.bw_bccl_navbar_nav': { 'flex-wrap': 'wrap' },
      '.bw_bccl_tooltip': { 'white-space': 'normal' },
    }
  }
};

/**
 * Structural widget rules, by category, in the same shape as core's
 * structuralRules. bw.loadStructural merges these after the core sheet.
 * @returns {Object} { category: { selector: declarations } }
 */
function bcclStructural() {
  return widgetStructural;
}

/**
 * Bitwrench v2 Components
 *
 * TACO-based UI component library providing Bootstrap-inspired components
 * as pure JavaScript objects. Every make* function returns a TACO object
 * ({t, a, c, o}) that can be rendered with bw.html() or bw.DOM().
 *
 * Components included: Card, Button, Container, Row, Col, Nav, Navbar,
 * Tabs, Alert, Badge, Progress, ListGroup, Breadcrumb, Form controls,
 * Stack, Spinner, Hero, FeatureGrid, CardV2, CTA, Section, CodeDemo.
 *
 * Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
 * provide imperative DOM manipulation for rendered components.
 *
 * @module bitwrench-bccl
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */


/**
 * The widget stylesheet: structural categories and themed generators for
 * every bw_bccl_* class the factories emit. bitwrench.js installs it at load
 * in the full build; registerBCCL installs it when the BCCL script is loaded
 * after lean. See src/bitwrench-bccl-styles.js.
 */
var bcclStyles = { structural: bcclStructural, themed: bcclThemed };

// =========================================================================
// Variant → Utility Class Mapping
//
// Components compose these shared utility classes instead of owning
// their own variant selectors. The CSS is generated once by
// generatePaletteUtilities() + generateInteractionRules().
// =========================================================================

/**
 * Maps component type to a function that returns utility classes for a variant.
 * Each function takes a variant name (e.g. 'primary') and returns a class string.
 * @type {Object.<string, function(string): string>}
 */
/**
 * Convert a variant name to a single palette class.
 * All BCCL components use this: variant='primary' → class includes 'bw_primary'.
 * The CSS palette class (.bw-primary) sets bg/color/border; component-specific
 * overrides in generatePaletteClasses() adjust per component type.
 *
 * @param {string} v - Variant name (e.g. 'primary', 'danger', 'outline_primary')
 * @returns {string} CSS class string
 */
function variantClass(v) {
  if (!v) return '';
  // Handle outline variants: 'outline_primary' or 'outline-primary'
  if (v.indexOf('outline') === 0) {
    var base = v.replace(/^outline[_-]/, '');
    return 'bw_bccl_btn_outline bw_' + base;
  }
  return 'bw_' + v;
}

/**
 * Create a card component with optional header, body, footer, and image support
 *
 * Supports images (top, bottom, left, right), shadow levels, subtitle,
 * hover animation, and custom section class overrides. For horizontal
 * image layouts (left/right), content is wrapped in a row grid.
 *
 * @param {Object} [props] - Card configuration
 * @param {string} [props.title] - Card title displayed in the body
 * @param {string} [props.subtitle] - Card subtitle (muted text below title)
 * @param {string|Object|Array} [props.content] - Card body content (string, TACO, or array)
 * @param {string|Object} [props.footer] - Card footer content
 * @param {string|Object} [props.header] - Card header content
 * @param {Object} [props.image] - Card image configuration
 * @param {string} props.image.src - Image source URL
 * @param {string} [props.image.alt] - Image alt text
 * @param {string} [props.imagePosition="top"] - Image position ("top", "bottom", "left", "right")
 * @param {string} [props.variant] - Color variant (e.g. "primary", "danger")
 * @param {boolean} [props.bordered=true] - Show card border
 * @param {string} [props.shadow] - Shadow level ("none", "sm", "md", "lg")
 * @param {boolean} [props.hoverable=false] - Enable hover lift animation
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @param {Object} [props.style] - Inline style object
 * @param {string} [props.headerClass] - Additional header CSS classes
 * @param {string} [props.bodyClass] - Additional body CSS classes
 * @param {string} [props.footerClass] - Additional footer CSS classes
 * @param {Object} [props.state] - Component state object
 * @returns {Object} TACO object representing a card component
 * @category Component Builders
 * @example
 * const card = bw.makeCard({
 *   title: "Status",
 *   content: "All systems operational",
 *   variant: "success"
 * });
 * bw.DOM("#app", card);
 */
function makeCard(props = {}) {
  const {
    id,
    title,
    subtitle,
    content,
    footer,
    header,
    image,
    imagePosition = 'top',
    variant,
    bordered = true,
    shadow,
    hoverable = false,
    className: _c = '', class: className = _c,
    style,
    headerClass = '',
    bodyClass = '',
    footerClass = ''
  } = props;

  const shadowClasses = {
    none: '',
    sm: 'bw_shadow_sm',
    md: 'bw_shadow',
    lg: 'bw_shadow_lg'
  };

  const cardClasses = [
    'bw_bccl_card',
    variantClass(variant),
    shadow ? (shadowClasses[shadow] || '') : '',
    !bordered ? 'bw_border_0' : '',
    hoverable ? 'bw_bccl_card_hoverable' : '',
    className
  ].filter(Boolean).join(' ').trim();

  const cardContent = [
    header && {
      t: 'div',
      a: { class: `bw_bccl_card_header ${headerClass}`.trim() },
      c: header
    },
    image && (imagePosition === 'top' || imagePosition === 'left') && {
      t: 'img',
      a: {
        class: `bw_bccl_card_img_${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    {
      t: 'div',
      a: { class: `bw_bccl_card_body ${bodyClass}`.trim() },
      c: [
        title && { t: 'h5', a: { class: 'bw_bccl_card_title' }, c: title },
        subtitle && { t: 'h6', a: { class: 'bw_bccl_card_subtitle bw_mb_2 bw_text_muted' }, c: subtitle },
        content && (Array.isArray(content) ? content : [content])
      ].flat().filter(Boolean)
    },
    image && (imagePosition === 'bottom' || imagePosition === 'right') && {
      t: 'img',
      a: {
        class: `bw_bccl_card_img_${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    footer && {
      t: 'div',
      a: { class: `bw_bccl_card_footer ${footerClass}`.trim() },
      c: footer
    }
  ].filter(Boolean);

  // Handle horizontal layout for left/right images
  if (image && (imagePosition === 'left' || imagePosition === 'right')) {
    return {
      t: 'div',
      a: { class: cardClasses, style },
      c: {
        t: 'div',
        a: { class: 'bw_row bw_g_0' },
        c: cardContent
      },
      o: {
        type: 'card',
        state: props.state || {},
        slots: {
          title: '.bw_bccl_card_title',
          content: '.bw_bccl_card_body',
          footer: '.bw_bccl_card_footer'
        }
      }
    };
  }

  return {
    t: 'div',
    a: { id, class: cardClasses, style },
    c: cardContent,
    o: {
      type: 'card',
      state: props.state || {},
      slots: {
        title: '.bw_bccl_card_title',
        content: '.bw_bccl_card_body',
        footer: '.bw_bccl_card_footer'
      }
    }
  };
}

/**
 * Create a button component
 *
 * @param {Object} [props] - Button configuration
 * @param {string} [props.text] - Button label text
 * @param {string} [props.variant="primary"] - Color variant (e.g. "primary", "secondary", "danger")
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {Function} [props.onclick] - Click event handler
 * @param {string} [props.type="button"] - HTML button type ("button", "submit", "reset")
 * @param {boolean} [props.toggle=false] - Press-to-toggle button: keeps aria-pressed state, styled when pressed
 * @param {boolean} [props.pressed=false] - Initial pressed state of a toggle button
 * @param {Function} [props.onToggle] - Called with (pressed, event) when a toggle button flips
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing a button element
 * @category Component Builders
 * @example
 * const btn = bw.makeButton({
 *   text: "Save",
 *   variant: "success",
 *   onclick: () => console.log("saved")
 * });
 * // String shorthand:
 * const ok = bw.makeButton("OK");
 */
function makeButton(props = {}) {
  if (typeof props === 'string') props = { text: props };
  const {
    id,
    text,
    variant = 'primary',
    size,
    disabled = false,
    onclick,
    action,
    type = 'button',
    toggle = false,
    pressed = false,
    onToggle,
    className: _c = '', class: className = _c,
    style
  } = props;

  // Toggle (press-to-stay-on) button: aria-pressed carries the state, the
  // palette styles [aria-pressed="true"], and el.bw.setPressed(on) lets code
  // that is not the click handler (a shortcut, a menu) drive it (#119).
  var click = onclick;
  if (toggle) {
    click = function(e) {
      var el = e.currentTarget || this;
      var on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(on));
      if (onToggle) onToggle(on, e);
      if (onclick) onclick.call(el, e);
    };
  }

  return {
    t: 'button',
    a: {
      id,
      type,
      class: [
        'bw_bccl_btn',
        variantClass(variant),
        size && `bw_bccl_btn_${size}`,
        action && ('bw_act_' + action),
        toggle && 'bw_bccl_btn_toggle',
        className
      ].filter(Boolean).join(' '),
      disabled,
      'aria-pressed': toggle ? String(!!pressed) : undefined,
      onclick: click,
      style
    },
    c: text,
    o: toggle ? {
      type: 'button',
      handle: {
        setPressed: function(el, on) { el.setAttribute('aria-pressed', String(!!on)); }
      }
    } : {
      type: 'button'
    }
  };
}

/**
 * Create a container component for centering and constraining content width
 *
 * @param {Object} [props] - Container configuration
 * @param {boolean} [props.fluid=false] - Use full-width fluid container
 * @param {Array|Object|string} [props.children] - Child content
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a container div
 * @category Component Builders
 * @example
 * const container = bw.makeContainer({
 *   fluid: true,
 *   children: [bw.makeRow({ children: [bw.makeCol({ size: 12, content: 'Hi' })] })]
 * });
 */
function makeContainer(props = {}) {
  const { id, fluid = false, children, className: _c = '', class: className = _c } = props;

  return {
    t: 'div',
    a: { id, class: `bw_bccl_container${fluid ? '_fluid' : ''} ${className}`.trim() },
    c: children
  };
}

/**
 * Create a flexbox row for the grid system
 *
 * @param {Object} [props] - Row configuration
 * @param {Array|Object|string} [props.children] - Child columns
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @param {number} [props.gap] - Gutter size 0-5 applied via bw_g_{gap} (0 = no gutter; omit for the default)
 * @returns {Object} TACO object representing a grid row
 * @category Component Builders
 * @example
 * const row = bw.makeRow({
 *   gap: 4,
 *   children: [bw.makeCol({ size: 6, content: "Left" }), bw.makeCol({ size: 6, content: "Right" })]
 * });
 */
function makeRow(props = {}) {
  const { id, children, className: _c = '', class: className = _c, gap } = props;

  return {
    t: 'div',
    a: {
      id,
      class: `bw_bccl_row bw_row ${gap != null ? `bw_g_${gap}` : ''} ${className}`.trim()
    },
    c: children
  };
}

/**
 * Create a grid column with responsive sizing
 *
 * Supports both fixed and responsive column sizes. Pass an object for
 * responsive breakpoints (e.g. {xs: 12, md: 6, lg: 4}).
 *
 * @param {Object} [props] - Column configuration
 * @param {number|Object} [props.size] - Column size (1-12) or responsive object {xs, sm, md, lg, xl}
 * @param {number} [props.offset] - Column offset (1-12)
 * @param {number} [props.push] - Column push (1-12)
 * @param {number} [props.pull] - Column pull (1-12)
 * @param {Array|Object|string} [props.content] - Column content (alias for children)
 * @param {Array|Object|string} [props.children] - Column content
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a grid column
 * @category Component Builders
 * @example
 * const col = bw.makeCol({ size: { xs: 12, md: 6 }, content: "Responsive column" });
 */
function makeCol(props = {}) {
  const { id, size, offset, push, pull, content, children, className: _c = '', class: className = _c } = props;

  const classes = [];

  if (typeof size === 'object') {
    // Responsive sizes
    Object.entries(size).forEach(([breakpoint, value]) => {
      if (breakpoint === 'xs') {
        classes.push(`bw_col_${value}`);
      } else {
        classes.push(`bw_col_${breakpoint}_${value}`);
      }
    });
  } else if (size) {
    classes.push(`bw_col_${size}`);
  } else {
    classes.push('bw_col');
  }

  if (offset) classes.push(`bw_offset_${offset}`);
  if (push) classes.push(`bw_push_${push}`);
  if (pull) classes.push(`bw_pull_${pull}`);

  return {
    t: 'div',
    a: { id, class: `bw_bccl_col ${classes.join(' ')} ${className}`.trim() },
    c: content || children
  };
}

/**
 * Create a navigation component with tabs or pills styling
 *
 * @param {Object} [props] - Nav configuration
 * @param {Array<Object>} [props.items=[]] - Navigation items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.items[].disabled] - Whether this item is disabled
 * @param {boolean} [props.pills=false] - Use pill styling instead of tabs
 * @param {boolean} [props.vertical=false] - Stack items vertically
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a nav element
 * @category Component Builders
 * @example
 * const nav = bw.makeNav({
 *   pills: true,
 *   items: [
 *     { text: "Home", href: "/", active: true },
 *     { text: "About", href: "/about" }
 *   ]
 * });
 */
function makeNav(props = {}) {
  const {
    id,
    items = [],
    pills = false,
    vertical = false,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'ul',
    a: {
      id,
      class: `bw_bccl_nav bw_nav ${pills ? 'bw_nav_pills' : 'bw_nav_tabs'} ${vertical ? 'bw_nav_vertical' : ''} ${className}`.trim()
    },
    c: items.map(item => ({
      t: 'li',
      a: { class: 'bw_nav_item' },
      c: {
        t: 'a',
        a: {
          href: item.href || '#',
          class: `bw_nav_link ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`.trim()
        },
        c: item.text
      }
    }))
  };
}

/**
 * Create a navbar component with brand and navigation links
 *
 * @param {Object} [props] - Navbar configuration
 * @param {string} [props.brand] - Brand name or logo text
 * @param {string} [props.brandHref="#"] - Brand link URL
 * @param {Array<Object>} [props.items=[]] - Navigation items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.dark=true] - Use dark theme styling
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a navbar element
 * @category Component Builders
 * @example
 * const navbar = bw.makeNavbar({
 *   brand: "MyApp",
 *   dark: true,
 *   items: [
 *     { text: "Home", href: "/", active: true },
 *     { text: "Docs", href: "/docs" }
 *   ]
 * });
 */
function makeNavbar(props = {}) {
  const {
    id,
    brand,
    brandHref = '#',
    items = [],
    dark = true,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'nav',
    a: {
      id,
      class: `bw_bccl_navbar ${dark ? 'bw_bccl_navbar_dark' : 'bw_bccl_navbar_light'} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: [
        brand && {
          t: 'a',
          a: { href: brandHref, class: 'bw_bccl_navbar_brand' },
          c: brand
        },
        items.length > 0 && {
          t: 'div',
          a: { class: 'bw_bccl_navbar_nav' },
          c: items.map(item => ({
            t: 'a',
            a: {
              href: item.href || '#',
              class: `bw_nav_link ${item.active ? 'active' : ''}`
            },
            c: item.text
          }))
        }
      ].filter(Boolean)
    },
    o: {
      type: 'navbar',
      state: { activeItem: items.findIndex(i => i.active) }
    }
  };
}

/**
 * Create a tabbed interface with accessible tab navigation
 *
 * Each tab is rendered as a button with ARIA attributes for accessibility.
 * Clicking a tab shows its content pane and hides others. The active tab
 * can be set via activeIndex or by setting active:true on a tab item.
 *
 * @param {Object} [props] - Tabs configuration
 * @param {Array<Object>} [props.tabs=[]] - Tab definitions
 * @param {string} props.tabs[].label - Tab button label
 * @param {string|Object|Array} props.tabs[].content - Tab pane content
 * @param {boolean} [props.tabs[].active] - Whether this tab is initially active
 * @param {number} [props.activeIndex=0] - Default active tab index (overridden by tab.active)
 * @param {Function} [props.onTabChange] - Called as (index, tab, el) when the active tab changes
 *   (click, keyboard, or el.bw.setActiveTab). `tab` is the tabs[index] config object.
 * @returns {Object} TACO object representing a tabbed interface
 * @category Component Builders
 * @example
 * const tabs = bw.makeTabs({
 *   tabs: [
 *     { label: "Overview", content: "Tab 1 content", active: true },
 *     { label: "Details", content: "Tab 2 content" }
 *   ]
 * });
 * bw.DOM("#app", tabs);
 */
function makeTabs(props = {}) {
  const { id, tabs = [], activeIndex = 0, onTabChange, className: _c = '', class: className = _c } = props;

  // Find the active tab index based on the active property or use activeIndex
  let actualActiveIndex = activeIndex;
  tabs.forEach((tab, index) => {
    if (tab.active) {
      actualActiveIndex = index;
    }
  });

  // Shared tab switching logic
  function switchTab(el, index) {
    var allTabs = el.querySelectorAll('.bw_nav_link');
    var allPanes = el.querySelectorAll('.bw_bccl_tab_pane');
    if (index < 0 || index >= allTabs.length) return;
    allTabs.forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    allPanes.forEach(function(p) { p.classList.remove('active'); });
    allTabs[index].classList.add('active');
    allTabs[index].setAttribute('aria-selected', 'true');
    allTabs[index].setAttribute('tabindex', '0');
    allPanes[index].classList.add('active');
    var prev = el._bw_state ? el._bw_state.activeIndex : -1;
    if (el._bw_state) el._bw_state.activeIndex = index;
    if (onTabChange && index !== prev) onTabChange(index, tabs[index], el);
  }

  return {
    t: 'div',
    a: { id, class: ('bw_bccl_tabs ' + className).trim() },
    c: [
      {
        t: 'ul',
        a: {
          class: 'bw_nav bw_nav_tabs', role: 'tablist',
          // Arrow/Home/End move between tabs. In a: like the click handler, so
          // keyboard and mouse take the same path (switchTab via click).
          onkeydown: function(e) {
            var tablist = e.currentTarget;
            var tabButtons = tablist.querySelectorAll('[role="tab"]');
            var currentIndex = -1;
            for (var i = 0; i < tabButtons.length; i++) {
              if (tabButtons[i] === e.target) { currentIndex = i; break; }
            }
            if (currentIndex === -1) return;

            var newIndex = -1;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
            } else if (e.key === 'Home') {
              e.preventDefault();
              newIndex = 0;
            } else if (e.key === 'End') {
              e.preventDefault();
              newIndex = tabButtons.length - 1;
            }

            if (newIndex >= 0) {
              tabButtons[newIndex].focus();
              tabButtons[newIndex].click();
            }
          }
        },
        c: tabs.map((tab, index) => ({
          t: 'li',
          a: { class: 'bw_nav_item', role: 'presentation' },
          c: {
            t: 'button',
            a: {
              class: `bw_nav_link ${index === actualActiveIndex ? 'active' : ''}`,
              type: 'button',
              role: 'tab',
              tabindex: index === actualActiveIndex ? '0' : '-1',
              'aria-selected': index === actualActiveIndex ? 'true' : 'false',
              onclick: (e) => {
                switchTab(e.target.closest('.bw_bccl_tabs'), index);
              }
            },
            c: tab.label
          }
        }))
      },
      {
        t: 'div',
        a: { class: 'bw_bccl_tab_content' },
        c: tabs.map((tab, index) => ({
          t: 'div',
          a: {
            class: `bw_bccl_tab_pane ${index === actualActiveIndex ? 'active' : ''}`,
            role: 'tabpanel'
          },
          c: tab.content
        }))
      }
    ],
    o: {
      type: 'tabs',
      state: { activeIndex: actualActiveIndex },
      handle: {
        setActiveTab: switchTab,
        getActiveTab: function(el) { return (el._bw_state && el._bw_state.activeIndex) || 0; }
      }
    }
  };
}

/**
 * Create an alert/notification component
 *
 * @param {Object} [props] - Alert configuration
 * @param {string|Object|Array} [props.content] - Alert message content
 * @param {string} [props.variant="info"] - Color variant ("primary", "secondary", "success", "danger", "warning", "info", "light", "dark")
 * @param {boolean} [props.dismissible=false] - Show a close button to dismiss the alert
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing an alert element
 * @category Component Builders
 * @example
 * const alert = bw.makeAlert({
 *   content: "Operation completed successfully!",
 *   variant: "success",
 *   dismissible: true
 * });
 * // String shorthand:
 * const msg = bw.makeAlert("Something happened");
 */
function makeAlert(props = {}) {
  if (typeof props === 'string') props = { content: props };
  const {
    id,
    content,
    variant = 'info',
    dismissible = false,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: {
      id,
      class: `bw_bccl_alert ${variantClass(variant)} ${dismissible ? 'bw_bccl_alert_dismissible' : ''} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      content,
      dismissible && {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw_close',
          'aria-label': 'Close',
          onclick: function(e) {
            var alert = e.target.closest('.bw_bccl_alert');
            if (alert) { alert.remove(); }
          }
        },
        c: '×'
      }
    ].filter(Boolean),
    o: {
      type: 'alert',
      handle: {
        dismiss: function(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
      }
    }
  };
}

/**
 * Create an inline badge/label component
 *
 * @param {Object} [props] - Badge configuration
 * @param {string} [props.text] - Badge display text
 * @param {string} [props.variant="primary"] - Color variant
 * @param {string} [props.size] - Size variant: 'sm' or 'lg' (default is medium)
 * @param {boolean} [props.pill=false] - Use pill (rounded) shape
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a badge span
 * @category Component Builders
 * @example
 * const badge = bw.makeBadge({ text: "New", variant: "danger", pill: true });
 * const small = bw.makeBadge({ text: "3", variant: "info", size: "sm" });
 * // String shorthand:
 * const tag = bw.makeBadge("New");
 */
function makeBadge(props = {}) {
  if (typeof props === 'string') props = { text: props };
  const {
    id,
    text,
    variant = 'primary',
    size,
    pill = false,
    className: _c = '', class: className = _c
  } = props;

  const sizeClass = size === 'sm' ? ' bw_bccl_badge_sm' : size === 'lg' ? ' bw_bccl_badge_lg' : '';

  return {
    t: 'span',
    a: {
      id,
      class: `bw_bccl_badge ${variantClass(variant)}${sizeClass} ${pill ? 'bw_bccl_badge_pill' : ''} ${className}`.trim()
    },
    c: text
  };
}

/**
 * Create a progress bar component with ARIA accessibility
 *
 * @param {Object} [props] - Progress bar configuration
 * @param {number} [props.value=0] - Current progress value
 * @param {number} [props.max=100] - Maximum value
 * @param {string} [props.variant="primary"] - Color variant
 * @param {boolean} [props.striped=false] - Use striped pattern
 * @param {boolean} [props.animated=false] - Animate the stripes
 * @param {string} [props.label] - Custom label text (defaults to percentage)
 * @param {number} [props.height] - Custom height in pixels
 * @returns {Object} TACO object representing a progress bar
 * @category Component Builders
 * @example
 * const progress = bw.makeProgress({
 *   value: 75,
 *   variant: "success",
 *   striped: true,
 *   animated: true
 * });
 */
function makeProgress(props = {}) {
  const {
    id,
    value = 0,
    max = 100,
    variant = 'primary',
    striped = false,
    animated = false,
    label,
    height,
    className: _c = '', class: className = _c
  } = props;

  const percentage = Math.round((value / max) * 100);

  return {
    t: 'div',
    a: {
      id,
      class: ('bw_bccl_progress ' + className).trim(),
      style: height ? { height: `${height}px` } : undefined
    },
    c: {
      t: 'div',
      a: {
        class: [
          'bw_bccl_progress_bar',
          variantClass(variant),
          striped && 'bw_bccl_progress_bar_striped',
          animated && 'bw_bccl_progress_bar_animated'
        ].filter(Boolean).join(' '),
        role: 'progressbar',
        style: { width: `${percentage}%` },
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': max
      },
      c: label || `${percentage}%`
    },
    o: {
      type: 'progress',
      handle: {
        setValue: function(el, n) {
          var bar = el.querySelector('.bw_bccl_progress_bar');
          if (!bar) return;
          var maxVal = parseInt(bar.getAttribute('aria-valuemax')) || 100;
          var pct = Math.round((n / maxVal) * 100);
          bar.style.width = pct + '%';
          bar.setAttribute('aria-valuenow', n);
          bar.textContent = pct + '%';
        },
        getValue: function(el) {
          var bar = el.querySelector('.bw_bccl_progress_bar');
          return bar ? parseInt(bar.getAttribute('aria-valuenow')) || 0 : 0;
        }
      }
    }
  };
}

/**
 * Create a list group component for displaying lists of items
 *
 * Items can be simple strings or objects with text, active, disabled,
 * href, and onclick properties. When interactive is true or items have
 * href/onclick, items render as anchor tags.
 *
 * @param {Object} [props] - List group configuration
 * @param {Array<string|Object>} [props.items=[]] - List items (strings or objects)
 * @param {string} props.items[].text - Item display text
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.items[].disabled] - Whether this item is disabled
 * @param {string} [props.items[].href] - Item link URL
 * @param {Function} [props.items[].onclick] - Item click handler
 * @param {boolean} [props.flush=false] - Remove borders for use inside cards
 * @param {boolean} [props.interactive=false] - Make all items interactive (anchor tags)
 * @returns {Object} TACO object representing a list group
 * @category Component Builders
 * @example
 * const list = bw.makeListGroup({
 *   interactive: true,
 *   items: [
 *     { text: "Active item", active: true },
 *     { text: "Regular item" },
 *     { text: "Disabled item", disabled: true }
 *   ]
 * });
 */
function makeListGroup(props = {}) {
  const { id, items = [], flush = false, interactive = false, className: _c = '', class: className = _c } = props;

  return {
    t: 'div',
    a: { id, class: `bw_bccl_listGroup bw_list_group ${flush ? 'bw_list_group_flush' : ''} ${className}`.trim() },
    c: items.map(item => {
      const isObject = typeof item === 'object';
      const text = isObject ? item.text : item;
      const active = isObject ? item.active : false;
      const disabled = isObject ? item.disabled : false;
      const href = isObject ? item.href : null;
      const onclick = isObject ? item.onclick : null;

      // For interactive items or items with href/onclick, use anchor tag
      if (interactive || href || onclick) {
        return {
          t: 'a',
          a: {
            class: [
              'bw_list_group_item',
              active && 'active',
              disabled && 'disabled'
            ].filter(Boolean).join(' '),
            href: href || '#',
            onclick: onclick || ((e) => {
              if (!href) e.preventDefault();
            }),
            style: disabled ? 'pointer-events: none; opacity: 0.65;' : ''
          },
          c: text
        };
      }

      // For non-interactive items, use div
      return {
        t: 'div',
        a: {
          class: [
            'bw_list_group_item',
            active && 'active',
            disabled && 'disabled'
          ].filter(Boolean).join(' ')
        },
        c: text
      };
    })
  };
}

/**
 * Create a breadcrumb navigation component
 *
 * The last item with active:true is rendered as plain text (no link).
 * All other items render as anchor tags.
 *
 * @param {Object} [props] - Breadcrumb configuration
 * @param {Array<Object>} [props.items=[]] - Breadcrumb items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this is the current page
 * @returns {Object} TACO object representing a breadcrumb nav
 * @category Component Builders
 * @example
 * const crumbs = bw.makeBreadcrumb({
 *   items: [
 *     { text: "Home", href: "/" },
 *     { text: "Products", href: "/products" },
 *     { text: "Widget", active: true }
 *   ]
 * });
 */
function makeBreadcrumb(props = {}) {
  const { id, items = [], className: _c = '', class: className = _c } = props;

  return {
    t: 'nav',
    a: { id, 'aria-label': 'breadcrumb', class: ('bw_bccl_breadcrumb ' + className).trim() },
    c: {
      t: 'ol',
      // These carried bw_breadcrumb / bw_breadcrumb_item, but the stylesheet
      // only ever defined .bw_bccl_breadcrumb_item -- so the separators and
      // link colours never applied, and the list kept its default numbering.
      a: { class: 'bw_bccl_breadcrumb_list' },
      c: items.map((item, _index) => ({
        t: 'li',
        a: {
          class: `bw_bccl_breadcrumb_item ${item.active ? 'active' : ''}`,
          'aria-current': item.active ? 'page' : undefined
        },
        c: item.active ? item.text : {
          t: 'a',
          a: { href: item.href || '#' },
          c: item.text
        }
      }))
    }
  };
}

/**
 * Create a form wrapper with default submit prevention
 *
 * @param {Object} [props] - Form configuration
 * @param {Array|Object|string} [props.children] - Form contents (form groups, inputs, buttons)
 * @param {Function} [props.onsubmit] - Submit handler (defaults to preventDefault)
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a form element
 * @category Component Builders
 * @example
 * const form = bw.makeForm({
 *   onsubmit: (e) => { e.preventDefault(); handleSubmit(); },
 *   children: [
 *     bw.makeFormGroup({ label: "Name", input: bw.makeInput({ placeholder: "Enter name" }) }),
 *     bw.makeButton({ text: "Submit", type: "submit" })
 *   ]
 * });
 */
function makeForm(props = {}) {
  const { id, children, fields, onsubmit, className: _c = '', class: className = _c } = props;

  // Legacy API: just wraps children
  if (!fields) {
    return {
      t: 'form',
      a: {
        id,
        class: `bw_bccl_form ${className}`.trim(),
        onsubmit: onsubmit || ((e) => e.preventDefault())
      },
      c: children
    };
  }

  // New fields-based API with label association, getValues/setValues/validate
  var fieldIds = {};
  var fieldItems = fields.map(function(field) {
    var fieldId = 'bw_field_' + Math.random().toString(36).substr(2, 9);
    fieldIds[field.name] = fieldId;

    var inputTag = field.type === 'textarea' ? 'textarea' : (field.type === 'select' ? 'select' : 'input');
    var inputAttrs = {
      id: fieldId,
      name: field.name,
      class: 'bw_bccl_form_control'
    };
    if (inputTag === 'input') {
      inputAttrs.type = field.type || 'text';
    }
    if (field.required) {
      inputAttrs.required = true;
    }
    if (field.placeholder) {
      inputAttrs.placeholder = field.placeholder;
    }

    return {
      t: 'div',
      a: { class: 'bw_bccl_form_group' },
      c: [
        field.label && {
          t: 'label',
          a: { for: fieldId, class: 'bw_bccl_form_label' },
          c: field.required ? [field.label, { t: 'span', a: { class: 'bw_text_danger bw_ms_1' }, c: '*' }] : field.label
        },
        {
          t: inputTag,
          a: inputAttrs
        }
      ].filter(Boolean)
    };
  });

  return {
    t: 'form',
    a: {
      id,
      class: `bw_bccl_form ${className}`.trim(),
      onsubmit: onsubmit || ((e) => e.preventDefault())
    },
    c: fieldItems,
    o: {
      type: 'form',
      handle: {
        getValues: function(el) {
          var values = {};
          fields.forEach(function(field) {
            var input = el.querySelector('[name="' + field.name + '"]');
            if (input) {
              var val = input.value;
              if (field.type === 'number' && val !== '' && val !== undefined) {
                val = Number(val);
              }
              values[field.name] = val;
            }
          });
          return values;
        },
        setValues: function(el, vals) {
          if (typeof vals !== 'object') return;
          Object.keys(vals).forEach(function(name) {
            var input = el.querySelector('[name="' + name + '"]');
            if (input) {
              input.value = vals[name];
            }
          });
        },
        validate: function(el) {
          var valid = true;
          fields.forEach(function(field) {
            var input = el.querySelector('[name="' + field.name + '"]');
            if (!input) return;
            // Clear previous error state
            input.removeAttribute('aria-invalid');
            input.removeAttribute('aria-describedby');
            var existingErr = input.parentNode.querySelector('.bw_bccl_form_error');
            if (existingErr) existingErr.parentNode.removeChild(existingErr);

            var isValid = true;
            if (field.required && (!input.value || input.value.trim() === '')) {
              isValid = false;
            }
            if (!isValid) {
              valid = false;
              input.setAttribute('aria-invalid', 'true');
              var errId = 'bw_err_' + field.name + '_' + Math.random().toString(36).substr(2, 6);
              input.setAttribute('aria-describedby', errId);
              var errEl = document.createElement('div');
              errEl.id = errId;
              errEl.className = 'bw_bccl_form_error bw_invalid_feedback';
              errEl.textContent = (field.label || field.name) + ' is required';
              input.parentNode.appendChild(errEl);
            }
          });
          return { valid: valid };
        },
        setErrors: function(el, errors) {
          if (typeof errors !== 'object') return;
          Object.keys(errors).forEach(function(name) {
            var input = el.querySelector('[name="' + name + '"]');
            if (!input) return;
            input.setAttribute('aria-invalid', 'true');
            var errId = 'bw_err_' + name + '_' + Math.random().toString(36).substr(2, 6);
            input.setAttribute('aria-describedby', errId);
            var errEl = document.createElement('div');
            errEl.id = errId;
            errEl.className = 'bw_bccl_form_error bw_invalid_feedback';
            errEl.textContent = errors[name];
            input.parentNode.appendChild(errEl);
          });
        }
      }
    }
  };
}

// The HTML labelable elements: the only tags a <label for> may point at.
var _LABELABLE = { input: 1, select: 1, textarea: 1, button: 1, meter: 1, output: 1, progress: 1 };

/**
 * Create a form group with label, input, optional help text and validation feedback
 *
 * @param {Object} [props] - Form group configuration
 * @param {string} [props.label] - Label text
 * @param {Object} [props.input] - Input TACO object (from makeInput, makeSelect, etc.)
 * @param {string} [props.help] - Help text displayed below the input
 * @param {string} [props.id] - Control id. The label's `for` points at it. When `input`
 *   is a labelable control (input, select, textarea, button, meter, output, progress)
 *   without an id of its own, the id is copied onto it; a wrapper TACO (a div holding
 *   the control) is never written to -- the caller owns its attributes (#127).
 * @param {string} [props.validation] - Validation state ("valid" or "invalid")
 * @param {string} [props.feedback] - Validation feedback text shown below input
 * @param {boolean} [props.required=false] - Show required indicator (*) on label
 * @returns {Object} TACO object representing a form group
 * @category Component Builders
 * @example
 * const group = bw.makeFormGroup({
 *   label: "Email",
 *   id: "email",
 *   input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }),
 *   validation: "invalid",
 *   feedback: "Please enter a valid email address."
 * });
 */
function makeFormGroup(props = {}) {
  var { label, input, help, id, validation, feedback, required, className: _c = '', class: className = _c } = props;

  // Shallow-clone input TACO to add the validation class and the group's id
  // without mutating the original. `id` names the control (the label's `for`
  // points at it), so it lands on the control and only on a control: a
  // wrapper div passed as `input` keeps the caller's attributes, else the
  // wrapper and the control inside it would share one id (#127).
  var styledInput = input;
  var wantsId = !!(id && input && _LABELABLE[input.t] && !(input.a && input.a.id));
  if (input && (validation || wantsId)) {
    styledInput = { t: input.t, a: Object.assign({}, input.a), c: input.c, o: input.o };
    if (wantsId) styledInput.a.id = id;
    var validClass = validation === 'valid' ? 'bw_is_valid' : validation === 'invalid' ? 'bw_is_invalid' : '';
    if (validClass) {
      styledInput.a.class = ((styledInput.a.class || '') + ' ' + validClass).trim();
    }
  }

  return {
    t: 'div',
    a: { class: ('bw_bccl_form_group ' + className).trim() },
    c: [
      label && {
        t: 'label',
        a: { for: id, class: 'bw_bccl_form_label' },
        c: required ? [label, { t: 'span', a: { class: 'bw_text_danger bw_ms_1' }, c: '*' }] : label
      },
      styledInput,
      feedback && validation && {
        t: 'div',
        a: { class: validation === 'valid' ? 'bw_valid_feedback' : 'bw_invalid_feedback' },
        c: feedback
      },
      help && {
        t: 'small',
        a: { class: 'bw_bccl_form_text bw_text_muted' },
        c: help
      }
    ].filter(Boolean)
  };
}

/**
 * Create an input element with form control styling
 *
 * Additional event handlers (oninput, onchange, etc.) can be passed
 * as extra properties and are spread onto the element attributes.
 *
 * @param {Object} [props] - Input configuration
 * @param {string} [props.type="text"] - Input type ("text", "email", "password", "number", etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Input value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {boolean} [props.readonly=false] - Whether the input is read-only
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing an input element
 * @category Component Builders
 * @example
 * const input = bw.makeInput({
 *   type: "email",
 *   placeholder: "you@example.com",
 *   required: true,
 *   oninput: (e) => validate(e.target.value)
 * });
 */
function makeInput(props = {}) {
  const {
    type = 'text',
    placeholder,
    value,
    id,
    name,
    disabled = false,
    readonly = false,
    required = false,
    className: _c = '', class: className = _c,
    style,
    ...eventHandlers
  } = props;

  return {
    t: 'input',
    a: {
      type,
      class: `bw_bccl_form_control ${className}`.trim(),
      placeholder,
      value,
      id,
      name,
      style,
      disabled,
      readonly,
      required,
      ...eventHandlers
    }
  };
}

/**
 * Create a textarea element with form control styling
 *
 * @param {Object} [props] - Textarea configuration
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Textarea content
 * @param {number} [props.rows=3] - Number of visible text rows
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Textarea name attribute
 * @param {boolean} [props.disabled=false] - Whether the textarea is disabled
 * @param {boolean} [props.readonly=false] - Whether the textarea is read-only
 * @param {boolean} [props.required=false] - Whether the textarea is required
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a textarea element
 * @category Component Builders
 * @example
 * const textarea = bw.makeTextarea({
 *   rows: 5,
 *   placeholder: "Enter your message...",
 *   required: true
 * });
 */
function makeTextarea(props = {}) {
  const {
    placeholder,
    value,
    rows = 3,
    id,
    name,
    disabled = false,
    readonly = false,
    required = false,
    className: _c = '', class: className = _c,
    ...eventHandlers
  } = props;

  return {
    t: 'textarea',
    a: {
      class: `bw_bccl_form_control ${className}`.trim(),
      placeholder,
      rows,
      id,
      name,
      disabled,
      readonly,
      required,
      ...eventHandlers
    },
    c: value
  };
}

/**
 * Create a select dropdown with options
 *
 * @param {Object} [props] - Select configuration
 * @param {Array<Object>} [props.options=[]] - Dropdown options
 * @param {string} props.options[].value - Option value
 * @param {string} [props.options[].text] - Option display text (`label` also accepted; defaults to value)
 * @param {string} [props.value] - Currently selected value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Select name attribute
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 * @param {boolean} [props.required=false] - Whether the select is required
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a select element
 * @category Component Builders
 * @example
 * const select = bw.makeSelect({
 *   value: "b",
 *   options: [
 *     { value: "a", text: "Option A" },
 *     { value: "b", text: "Option B" },
 *     { value: "c", text: "Option C" }
 *   ]
 * });
 */
function makeSelect(props = {}) {
  const {
    options = [],
    value,
    id,
    name,
    disabled = false,
    required = false,
    className: _c = '', class: className = _c,
    ...eventHandlers
  } = props;

  return {
    t: 'select',
    a: {
      class: `bw_bccl_form_control ${className}`.trim(),
      id,
      name,
      disabled,
      required,
      ...eventHandlers
    },
    c: options.map(opt => ({
      t: 'option',
      a: {
        value: opt.value,
        selected: opt.value === value
      },
      c: opt.text || opt.label || opt.value
    }))
  };
}

/**
 * Create a checkbox input with label
 *
 * @param {Object} [props] - Checkbox configuration
 * @param {string} [props.label] - Checkbox label text
 * @param {boolean} [props.checked=false] - Whether the checkbox is checked
 * @param {string} [props.id] - Element ID (links label to checkbox)
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the checkbox is disabled
 * @param {string} [props.value] - Checkbox value attribute
 * @returns {Object} TACO object representing a checkbox form group
 * @category Component Builders
 * @example
 * const checkbox = bw.makeCheckbox({
 *   label: "I agree to the terms",
 *   id: "agree",
 *   checked: false
 * });
 */
function makeCheckbox(props = {}) {
  const {
    label,
    checked = false,
    id,
    name,
    disabled = false,
    value,
    className: _c = '', class: className = _c,
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw_bccl_form_check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw_bccl_form_check_input',
          checked,
          id,
          name,
          disabled,
          value,
          ...eventHandlers
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw_bccl_form_check_label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

/**
 * Create a flexbox stack layout (vertical or horizontal)
 *
 * @param {Object} [props] - Stack configuration
 * @param {Array|Object|string} [props.children] - Stack children
 * @param {string} [props.direction="vertical"] - Stack direction ("vertical" or "horizontal")
 * @param {number} [props.gap=3] - Gap size (0-5)
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a stack layout
 * @category Component Builders
 * @example
 * const stack = bw.makeStack({
 *   direction: "horizontal",
 *   gap: 2,
 *   children: [
 *     bw.makeButton({ text: "Cancel", variant: "secondary" }),
 *     bw.makeButton({ text: "Save", variant: "primary" })
 *   ]
 * });
 */
function makeStack(props = {}) {
  const {
    id,
    children,
    direction = 'vertical',
    gap = 3,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: {
      id,
      class: `bw_bccl_stack bw_${direction === 'vertical' ? 'vstack' : 'hstack'} bw_gap_${gap} ${className}`.trim()
    },
    c: children
  };
}

/**
 * Create a loading spinner indicator
 *
 * @param {Object} [props] - Spinner configuration
 * @param {string} [props.variant="primary"] - Color variant
 * @param {string} [props.size="md"] - Spinner size ("sm", "md", "lg")
 * @param {string} [props.type="border"] - Spinner type ("border" or "grow")
 * @returns {Object} TACO object representing a spinner with screen-reader text
 * @category Component Builders
 * @example
 * const spinner = bw.makeSpinner({ variant: "info", size: "sm" });
 */
function makeSpinner(props = {}) {
  const {
    id,
    variant = 'primary',
    size = 'md',
    type = 'border',
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: {
      id,
      // Size suffix is underscore-separated like every other bw_ class. It was
      // `-${size}`, which never matched the generated .bw_spinner_border_md /
      // _sm / _lg rules, so the size prop had no effect.
      class: `bw_bccl_spinner bw_spinner_${type} bw_spinner_${type}_${size} ${variantClass(variant)} ${className}`.trim(),
      role: 'status'
    },
    c: {
      t: 'span',
      a: { class: 'bw_visually_hidden' },
      c: 'Loading...'
    }
  };
}

/**
 * Create a hero section for landing pages and headers
 *
 * Supports gradient backgrounds, background images with overlays,
 * and action buttons. Commonly used as the first visible section.
 *
 * @param {Object} [props] - Hero configuration
 * @param {string} [props.title] - Main headline text
 * @param {string} [props.subtitle] - Supporting description text
 * @param {string|Object|Array} [props.content] - Additional body content
 * @param {string} [props.variant="primary"] - Background variant ("primary", "secondary", "light", "dark")
 * @param {string} [props.size="lg"] - Vertical padding size ("sm", "md", "lg", "xl")
 * @param {boolean} [props.centered=true] - Center-align text
 * @param {boolean} [props.overlay=false] - Add dark overlay (for background images)
 * @param {string} [props.backgroundImage] - Background image URL
 * @param {Array|Object} [props.actions] - Call-to-action buttons
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a hero section
 * @category Component Builders
 * @example
 * const hero = bw.makeHero({
 *   title: "Welcome to Bitwrench",
 *   subtitle: "Build UIs with pure JavaScript",
 *   variant: "dark",
 *   actions: [
 *     bw.makeButton({ text: "Get Started", variant: "primary", size: "lg" }),
 *     bw.makeButton({ text: "Learn More", variant: "outline_light", size: "lg" })
 *   ]
 * });
 */
function makeHero(props = {}) {
  const {
    id,
    title,
    subtitle,
    content,
    variant = 'primary',
    size = 'lg',
    centered = true,
    overlay = false,
    backgroundImage,
    actions,
    className: _c = '', class: className = _c
  } = props;

  const sizeClasses = {
    sm: 'bw_py_3',
    md: 'bw_py_4',
    lg: 'bw_py_5',
    xl: 'bw_py_6'
  };

  return {
    t: 'section',
    a: {
      id,
      class: `bw_bccl_hero ${variantClass(variant)} ${sizeClasses[size] || sizeClasses.lg} ${centered ? 'bw_text_center' : ''} ${className}`.trim(),
      style: backgroundImage ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : undefined
    },
    c: [
      overlay && {
        t: 'div',
        a: { class: 'bw_bccl_hero_overlay' }
      },
      {
        t: 'div',
        a: { class: 'bw_container' },
        c: {
          t: 'div',
          a: { class: 'bw_bccl_hero_content' },
          c: [
            title && {
              t: 'h1',
              a: { class: 'bw_bccl_hero_title bw_display_4 bw_mb_3' },
              c: title
            },
            subtitle && {
              t: 'p',
              a: { class: 'bw_bccl_hero_subtitle bw_lead bw_mb_4' },
              c: subtitle
            },
            content,
            actions && {
              t: 'div',
              a: { class: 'bw_bccl_hero_actions bw_mt_4' },
              c: actions
            }
          ].filter(Boolean)
        }
      }
    ].filter(Boolean)
  };
}

/**
 * Create a responsive feature grid for showcasing capabilities
 *
 * Renders features in an equal-width column grid with optional icons,
 * titles, and descriptions.
 *
 * @param {Object} [props] - Feature grid configuration
 * @param {Array<Object>} [props.features=[]] - Feature items
 * @param {string} [props.features[].icon] - Icon content (emoji, HTML entity, or text)
 * @param {string} [props.features[].title] - Feature title
 * @param {string} [props.features[].description] - Feature description text
 * @param {number} [props.columns=3] - Items per row at md+ widths. Uses the 12-column grid,
 *   so use a divisor of 12 (1, 2, 3, 4, 6, 12); other counts round to the nearest
 *   span (5 -> 6 per row, 8 -> 6 per row). Stacks to one column below md.
 * @param {boolean} [props.centered=true] - Center-align feature text
 * @param {string} [props.iconSize="3rem"] - Icon font size
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a feature grid
 * @category Component Builders
 * @example
 * const features = bw.makeFeatureGrid({
 *   columns: 3,
 *   features: [
 *     { icon: "⚡", title: "Fast", description: "Zero build step" },
 *     { icon: "📦", title: "Small", description: "Under 45KB gzipped" },
 *     { icon: "🔧", title: "Flexible", description: "Pure JS objects" }
 *   ]
 * });
 */
function makeFeatureGrid(props = {}) {
  const {
    id,
    features = [],
    columns = 3,
    centered = true,
    iconSize = '3rem',
    className: _c = '', class: className = _c
  } = props;

  // Nearest whole grid span: 12/5 would emit bw_col_md_2.4, which no rule matches
  const colClass = `bw_col_md_${Math.min(12, Math.max(1, Math.round(12 / columns)))}`;

  return {
    t: 'div',
    a: { id, class: `bw_bccl_featureGrid bw_feature_grid ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw_row bw_g_4' },
      c: features.map(feature => ({
        t: 'div',
        a: { class: colClass },
        c: {
          t: 'div',
          a: { class: `bw_feature ${centered ? 'bw_text_center' : ''}` },
          c: [
            feature.icon && {
              t: 'div',
              a: {
                class: 'bw_feature_icon bw_mb_3 bw_text_primary',
                style: `font-size: ${iconSize};`
              },
              c: feature.icon
            },
            feature.title && {
              t: 'h3',
              a: { class: 'bw_feature_title bw_h5 bw_mb_2' },
              c: feature.title
            },
            feature.description && {
              t: 'p',
              a: { class: 'bw_feature_description bw_text_muted' },
              c: feature.description
            }
          ].filter(Boolean)
        }
      }))
    }
  };
}


/**
 * Create a call-to-action section with title, description, and action buttons
 *
 * @param {Object} [props] - CTA configuration
 * @param {string} [props.title] - CTA headline
 * @param {string} [props.description] - CTA description text
 * @param {Array|Object} [props.actions] - CTA buttons or content
 * @param {string} [props.variant="light"] - Background variant
 * @param {boolean} [props.centered=true] - Center-align content
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a CTA section
 * @category Component Builders
 * @example
 * const cta = bw.makeCTA({
 *   title: "Ready to get started?",
 *   description: "Join thousands of developers using Bitwrench.",
 *   actions: [
 *     bw.makeButton({ text: "Sign Up Free", variant: "primary", size: "lg" })
 *   ]
 * });
 */
function makeCTA(props = {}) {
  const {
    id,
    title,
    description,
    actions,
    variant = 'light',
    centered = true,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'section',
    a: { id, class: `bw_bccl_cta bw_cta bw_bg_${variant} bw_py_5 ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: {
        t: 'div',
        a: { class: `bw_cta_content ${centered ? 'bw_text_center' : ''}` },
        c: [
          title && { t: 'h2', a: { class: 'bw_cta_title bw_mb_3' }, c: title },
          description && { t: 'p', a: { class: 'bw_cta_description bw_lead bw_mb_4' }, c: description },
          actions && {
            t: 'div',
            a: { class: 'bw_cta_actions' },
            c: actions
          }
        ].filter(Boolean)
      }
    }
  };
}

/**
 * Create a page section with optional centered header and background
 *
 * @param {Object} [props] - Section configuration
 * @param {string} [props.title] - Section title
 * @param {string} [props.subtitle] - Section subtitle (muted)
 * @param {string|Object|Array} [props.content] - Section body content
 * @param {string} [props.variant="default"] - Background variant ("default" for none, or a color name)
 * @param {string} [props.spacing="md"] - Vertical padding ("sm", "md", "lg", "xl")
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a content section
 * @category Component Builders
 * @example
 * const section = bw.makeSection({
 *   title: "Features",
 *   subtitle: "Everything you need to build great UIs",
 *   spacing: "lg",
 *   content: bw.makeFeatureGrid({ features: [{ title: 'Fast', description: 'No build step' }] })
 * });
 */
function makeSection(props = {}) {
  const {
    id,
    title,
    subtitle,
    content,
    variant = 'default',
    spacing = 'md',
    className: _c = '', class: className = _c
  } = props;

  const spacingClasses = {
    sm: 'bw_py_3',
    md: 'bw_py_4',
    lg: 'bw_py_5',
    xl: 'bw_py_6'
  };

  return {
    t: 'section',
    a: {
      id,
      class: `bw_bccl_section bw_section ${spacingClasses[spacing] || spacingClasses.md} ${variant !== 'default' ? `bw_bg_${variant}` : ''} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: [
        (title || subtitle) && {
          t: 'div',
          a: { class: 'bw_section_header bw_text_center bw_mb_5' },
          c: [
            title && { t: 'h2', a: { class: 'bw_section_title' }, c: title },
            subtitle && { t: 'p', a: { class: 'bw_section_subtitle bw_text_muted' }, c: subtitle }
          ].filter(Boolean)
        },
        content
      ].filter(Boolean)
    }
  };
}

// =========================================================================
// Component Handle Classes
//
// Handle classes provide imperative DOM manipulation for rendered components.
// They cache child element references for efficient updates without
// full re-renders. Used by bw.createCard(), bw.createTable(), etc.
// =========================================================================

// Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
// removed in v2.0.15 — superseded by ComponentHandle.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

/**
 * Create a code demo component for documentation pages
 *
 * Displays a live result alongside source code in a tabbed interface.
 * Includes a copy-to-clipboard button on the code tab.
 *
 * @param {Object} [props] - Code demo configuration
 * @param {string} [props.title] - Demo title heading
 * @param {string} [props.description] - Demo description text
 * @param {string} [props.code] - Source code to display (adds a "Code" tab when present)
 * @param {string|Object|Array} [props.result] - Live result content for the "Result" tab
 * @param {string} [props.language="javascript"] - Code language for syntax class
 * @returns {Object} TACO object representing a code demo with tabbed Result/Code views
 * @category Component Builders
 * @example
 * const demo = bw.makeCodeDemo({
 *   title: "Button Example",
 *   description: "A simple primary button",
 *   code: 'bw.makeButton({ text: "Click me" })',
 *   result: bw.makeButton({ text: "Click me" })
 * });
 */
function makeCodeDemo(props = {}) {
  const {
    id,
    title,
    description,
    code,
    result,
    language = 'javascript',
    className: _c = '', class: className = _c
  } = props;

  // Generate unique ID for this demo
  const demoId = `demo-${Math.random().toString(36).substr(2, 9)}`;

  const tabs = [
    {
      label: 'Result',
      active: true,
      content: result
    }
  ];

  // Only add Code tab if code is provided
  if (code) {
    tabs.push({
      label: 'Code',
      content: {
        t: 'div',
        a: { style: 'position: relative;' },
        c: [
          {
            t: 'button',
            a: {
              class: 'bw_copy_btn bw_code_copy_btn',
              onclick: function(e) {
                navigator.clipboard.writeText(code).then(function() {
                  var btn = e.target;
                  var originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.classList.add('bw_code_copy_btn_copied');
                  setTimeout(function() {
                    btn.textContent = originalText;
                    btn.classList.remove('bw_code_copy_btn_copied');
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          },
          /* c8 ignore next 2 -- codeEditor ternary; requires globalThis.bw.codeEditor setup */
          (typeof globalThis !== 'undefined' && typeof globalThis.bw !== 'undefined' && typeof globalThis.bw.codeEditor === 'function')
            ? globalThis.bw.codeEditor({ code: code, lang: language === 'javascript' ? 'js' : language, readOnly: true, height: 'auto' })
            : {
                t: 'pre',
                a: { class: 'bw_code_pre' },
                c: {
                  t: 'code',
                  a: { class: `bw_code_block language-${language}` },
                  c: code
                }
              }
        ]
      }
    });
  }

  const content = [
    title && { t: 'h3', c: title },
    description && {
      t: 'p',
      a: { class: 'bw_text_muted bw_mb_3' },
      c: description
    },
    makeTabs({ tabs, id: demoId })
  ].filter(Boolean);

  return {
    t: 'div',
    a: { id, class: ('bw_bccl_codeDemo bw_code_demo ' + className).trim() },
    c: content
  };
}

/**
 * Registry mapping component type names to their handle classes
 *
 * Used by bw.createCard(), bw.createTable(), etc. to wrap rendered
 * DOM elements in the appropriate imperative handle.
 *
 * @type {Object.<string, Function>}
 */
// =========================================================================
// Phase 1: Quick Wins
// =========================================================================

/**
 * Create a pagination navigation component
 *
 * @param {Object} [props] - Pagination configuration
 * @param {number} [props.pages=1] - Total number of pages
 * @param {number} [props.currentPage=1] - Currently active page (1-based)
 * @param {Function} [props.onPageChange] - Callback when page changes, receives page number
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a pagination nav
 * @category Component Builders
 * @example
 * const pager = bw.makePagination({
 *   pages: 10,
 *   currentPage: 3,
 *   onPageChange: (page) => loadPage(page)
 * });
 */
function makePagination(props = {}) {
  const {
    id,
    pages = 1,
    currentPage = 1,
    onPageChange,
    size,
    className: _c = '', class: className = _c
  } = props;

  function handleClick(page) {
    return function(e) {
      e.preventDefault();
      if (page < 1 || page > pages || page === currentPage) return;
      if (onPageChange) onPageChange(page);
    };
  }

  const items = [];

  // Previous arrow
  items.push({
    t: 'li',
    a: { class: `bw_page_item ${currentPage <= 1 ? 'bw_disabled' : ''}`.trim() },
    c: {
      t: 'button',
      a: { class: 'bw_page_link', type: 'button', onclick: handleClick(currentPage - 1), 'aria-label': 'Previous', disabled: currentPage <= 1 ? true : undefined },
      c: '\u2039'
    }
  });

  // Page numbers
  for (var i = 1; i <= pages; i++) {
    (function(pageNum) {
      items.push({
        t: 'li',
        a: { class: `bw_page_item ${pageNum === currentPage ? 'bw_active' : ''}`.trim() },
        c: {
          t: 'button',
          a: { class: 'bw_page_link', type: 'button', onclick: handleClick(pageNum), 'aria-current': pageNum === currentPage ? 'page' : undefined },
          c: '' + pageNum
        }
      });
    })(i);
  }

  // Next arrow
  items.push({
    t: 'li',
    a: { class: `bw_page_item ${currentPage >= pages ? 'bw_disabled' : ''}`.trim() },
    c: {
      t: 'button',
      a: { class: 'bw_page_link', type: 'button', onclick: handleClick(currentPage + 1), 'aria-label': 'Next', disabled: currentPage >= pages ? true : undefined },
      c: '\u203A'
    }
  });

  return {
    t: 'nav',
    a: { id, 'aria-label': 'Pagination', class: className || undefined },
    c: {
      t: 'ul',
      a: {
        class: `bw_bccl_pagination ${size ? 'bw_bccl_pagination_' + size : ''}`.trim()
      },
      c: items
    },
    o: {
      type: 'pagination',
      state: { currentPage: currentPage, pages: pages },
      handle: {
        setPage: function(el, n) {
          if (n < 1 || n > pages) return;
          var allItems = el.querySelectorAll('.bw_page_item');
          for (var i = 0; i < allItems.length; i++) {
            allItems[i].classList.remove('bw_active');
          }
          // +1 offset: first item is prev arrow
          if (allItems[n]) allItems[n].classList.add('bw_active');
          if (el._bw_state) el._bw_state.currentPage = n;
          if (onPageChange) onPageChange(n);
        },
        getPage: function(el) {
          return (el._bw_state && el._bw_state.currentPage) || 1;
        }
      }
    }
  };
}

/**
 * Create a radio button input with label
 *
 * @param {Object} [props] - Radio configuration
 * @param {string} [props.label] - Radio label text
 * @param {string} [props.name] - Radio group name
 * @param {string} [props.value] - Radio value attribute
 * @param {boolean} [props.checked=false] - Whether the radio is selected
 * @param {string} [props.id] - Element ID (links label to radio)
 * @param {boolean} [props.disabled=false] - Whether the radio is disabled
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a radio form group
 * @category Component Builders
 * @example
 * const radio = bw.makeRadio({
 *   label: "Option A",
 *   name: "choice",
 *   value: "a",
 *   checked: true
 * });
 */
function makeRadio(props = {}) {
  const {
    label,
    name,
    value,
    checked = false,
    id,
    disabled = false,
    className: _c = '', class: className = _c,
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw_bccl_form_check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'radio',
          class: 'bw_bccl_form_check_input',
          name,
          value,
          checked,
          id,
          disabled,
          ...eventHandlers
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw_bccl_form_check_label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

/**
 * Create a button group wrapper
 *
 * @param {Object} [props] - Button group configuration
 * @param {Array} [props.children] - Button TACO objects to group
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {boolean} [props.vertical=false] - Stack buttons vertically
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a button group
 * @category Component Builders
 * @example
 * const group = bw.makeButtonGroup({
 *   children: [
 *     bw.makeButton({ text: "Left", variant: "primary" }),
 *     bw.makeButton({ text: "Middle", variant: "primary" }),
 *     bw.makeButton({ text: "Right", variant: "primary" })
 *   ]
 * });
 */
function makeButtonGroup(props = {}) {
  const {
    id,
    children,
    size,
    vertical = false,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: {
      id,
      class: `${vertical ? 'bw_bccl_btn_group_vertical' : 'bw_bccl_btn_group'} ${size ? 'bw_bccl_btn_group_' + size : ''} ${className}`.trim(),
      role: 'group'
    },
    c: children
  };
}

// =========================================================================
// Phase 2: Core Interactive
// =========================================================================

/**
 * Create an accordion component with collapsible items
 *
 * @param {Object} [props] - Accordion configuration
 * @param {Array<Object>} [props.items=[]] - Accordion items
 * @param {string} props.items[].title - Header text for the accordion item
 * @param {string|Object|Array} props.items[].content - Collapsible content
 * @param {boolean} [props.items[].open=false] - Whether the item is initially open
 * @param {boolean} [props.multiOpen=false] - Allow multiple items open simultaneously
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing an accordion
 * @category Component Builders
 * @example
 * const accordion = bw.makeAccordion({
 *   items: [
 *     { title: "Section 1", content: "Content 1", open: true },
 *     { title: "Section 2", content: "Content 2" }
 *   ]
 * });
 */
function makeAccordion(props = {}) {
  const {
    id,
    items = [],
    multiOpen = false,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: { id, class: `bw_bccl_accordion ${className}`.trim() },
    c: items.map(function(item, index) {
      var panelId = 'bw_acc_panel_' + Math.random().toString(36).substr(2, 9) + '_' + index;
      return {
        t: 'div',
        a: { class: 'bw_bccl_accordion_item' },
        c: [
          {
            t: 'h2',
            a: { class: 'bw_bccl_accordion_header' },
            c: {
              t: 'button',
              a: {
                class: `bw_bccl_accordion_button ${item.open ? '' : 'bw_collapsed'}`.trim(),
                type: 'button',
                'aria-expanded': item.open ? 'true' : 'false',
                'aria-controls': panelId,
                onclick: function(e) {
                  var btn = e.target.closest('.bw_bccl_accordion_button');
                  var accordionEl = btn.closest('.bw_bccl_accordion');
                  var accordionItem = btn.closest('.bw_bccl_accordion_item');
                  var collapse = accordionItem.querySelector('.bw_bccl_accordion_collapse');
                  var isOpen = collapse.classList.contains('bw_collapse_show');

                  if (!multiOpen) {
                    // Animate-close all other open siblings
                    var allItems = accordionEl.querySelectorAll('.bw_bccl_accordion_item');
                    for (var j = 0; j < allItems.length; j++) {
                      if (allItems[j] === accordionItem) continue;
                      var sibCollapse = allItems[j].querySelector('.bw_bccl_accordion_collapse');
                      var sibBtn = allItems[j].querySelector('.bw_bccl_accordion_button');
                      if (sibCollapse.classList.contains('bw_collapse_show')) {
                        sibCollapse.style.maxHeight = sibCollapse.scrollHeight + 'px';
                        sibCollapse.offsetHeight; // force reflow
                        sibCollapse.style.maxHeight = '0px';
                        sibCollapse.classList.remove('bw_collapse_show');
                        sibBtn.classList.add('bw_collapsed');
                        sibBtn.setAttribute('aria-expanded', 'false');
                      }
                    }
                  }

                  if (isOpen) {
                    // Animate close
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = '0px';
                    collapse.classList.remove('bw_collapse_show');
                    btn.classList.add('bw_collapsed');
                    btn.setAttribute('aria-expanded', 'false');
                  } else {
                    // Animate open
                    collapse.classList.add('bw_collapse_show');
                    collapse.style.maxHeight = '0px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    btn.classList.remove('bw_collapsed');
                    btn.setAttribute('aria-expanded', 'true');
                    // After transition, allow dynamic content sizing
                    var onEnd = function(ev) {
                      if (ev.propertyName === 'max-height' && collapse.classList.contains('bw_collapse_show')) {
                        collapse.style.maxHeight = 'none';
                      }
                      collapse.removeEventListener('transitionend', onEnd);
                    };
                    collapse.addEventListener('transitionend', onEnd);
                  }
                }
              },
              c: item.title
            }
          },
          {
            t: 'div',
            a: { id: panelId, class: `bw_bccl_accordion_collapse ${item.open ? 'bw_collapse_show' : ''}`.trim() },
            c: {
              t: 'div',
              a: { class: 'bw_bccl_accordion_body' },
              c: item.content
            },
            o: item.open ? {
              mounted: function(el) {
                el.style.maxHeight = 'none';
              }
            } : undefined
          }
        ]
      };
    }),
    o: {
      type: 'accordion',
      state: { multiOpen: multiOpen },
      handle: {
        toggle: function(el, index) {
          var items = el.querySelectorAll('.bw_bccl_accordion_item');
          if (index < 0 || index >= items.length) return;
          var btn = items[index].querySelector('.bw_bccl_accordion_button');
          if (btn) btn.click();
        },
        openAll: function(el) {
          var items = el.querySelectorAll('.bw_bccl_accordion_item');
          for (var i = 0; i < items.length; i++) {
            var collapse = items[i].querySelector('.bw_bccl_accordion_collapse');
            var btn = items[i].querySelector('.bw_bccl_accordion_button');
            if (!collapse.classList.contains('bw_collapse_show')) {
              collapse.classList.add('bw_collapse_show');
              collapse.style.maxHeight = 'none';
              btn.classList.remove('bw_collapsed');
              btn.setAttribute('aria-expanded', 'true');
            }
          }
        },
        closeAll: function(el) {
          var items = el.querySelectorAll('.bw_bccl_accordion_item');
          for (var i = 0; i < items.length; i++) {
            var collapse = items[i].querySelector('.bw_bccl_accordion_collapse');
            var btn = items[i].querySelector('.bw_bccl_accordion_button');
            if (collapse.classList.contains('bw_collapse_show')) {
              collapse.style.maxHeight = collapse.scrollHeight + 'px';
              collapse.offsetHeight;
              collapse.style.maxHeight = '0px';
              collapse.classList.remove('bw_collapse_show');
              btn.classList.add('bw_collapsed');
              btn.setAttribute('aria-expanded', 'false');
            }
          }
        }
      }
    }
  };
}

// ModalHandle removed in v2.0.15 — superseded by ComponentHandle.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

/**
 * Create a modal dialog overlay
 *
 * @param {Object} [props] - Modal configuration
 * @param {string} [props.title] - Modal title in header
 * @param {string|Object|Array} [props.content] - Modal body content
 * @param {string|Object|Array} [props.footer] - Modal footer content
 * @param {string} [props.size] - Modal size ("sm", "lg", "xl")
 * @param {boolean} [props.closeButton=true] - Show X close button in header
 * @param {Function} [props.onClose] - Callback when modal is closed
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a modal
 * @category Component Builders
 * @example
 * const modal = bw.makeModal({
 *   title: "Confirm",
 *   content: "Are you sure?",
 *   footer: bw.makeButton({ text: "OK", variant: "primary" })
 * });
 */
function makeModal(props = {}) {
  const {
    id,
    title,
    content,
    footer,
    size,
    closeButton = true,
    closeLabel = 'Close',
    onClose,
    open = false,
    className: _c = '', class: className = _c
  } = props;

  function closeModal(el) {
    var backdrop = el.closest('.bw_bccl_modal');
    /* c8 ignore next -- defensive; closeModal always called from within modal */
    if (!backdrop) backdrop = el;
    // Restore focus to the element that was focused when the modal opened
    var opener = backdrop._bw_opener || null;
    backdrop.classList.remove('bw_bccl_modal_show');
    backdrop.style.display = 'none';
    document.body.style.overflow = '';
    // Remove aria-modal when closed
    var dialog = backdrop.querySelector('[aria-modal]');
    if (dialog) dialog.removeAttribute('aria-modal');
    if (opener && typeof opener.focus === 'function') opener.focus();
    if (onClose) onClose();
  }

  return {
    t: 'div',
    a: {
      id,
      class: `bw_bccl_modal ${open ? 'bw_bccl_modal_show' : ''} ${className}`.trim(),
      style: open ? 'display:flex' : undefined
    },
    c: {
      t: 'div',
      a: {
        class: `bw_bccl_modal_dialog ${size ? 'bw_bccl_modal_' + size : ''}`.trim(),
        role: 'dialog',
        'aria-modal': 'true'
      },
      c: {
        t: 'div',
        a: { class: 'bw_bccl_modal_content' },
        c: [
          (title || closeButton) && {
            t: 'div',
            a: { class: 'bw_bccl_modal_header' },
            c: [
              title && { t: 'h5', a: { class: 'bw_bccl_modal_title' }, c: title },
              closeButton && {
                t: 'button',
                a: {
                  type: 'button',
                  class: 'bw_close',
                  'aria-label': closeLabel,
                  onclick: function(e) { closeModal(e.target); }
                },
                c: '\u00D7'
              }
            ].filter(Boolean)
          },
          content && {
            t: 'div',
            a: { class: 'bw_bccl_modal_body' },
            c: content
          },
          footer && {
            t: 'div',
            a: { class: 'bw_bccl_modal_footer' },
            c: footer
          }
        ].filter(Boolean)
      }
    },
    o: {
      type: 'modal',
      handle: {
        open: function(el) {
          el._bw_opener = document.activeElement;
          el.classList.add('bw_bccl_modal_show');
          el.style.display = 'flex';
          var dialog = el.querySelector('[role="dialog"]');
          if (dialog) dialog.setAttribute('aria-modal', 'true');
          document.body.style.overflow = 'hidden';
        },
        close: function(el) { closeModal(el); }
      },
      mounted: function(el) {
        // Record the opener (the element that had focus when modal was mounted)
        el._bw_opener = document.activeElement;
        // Click backdrop to close
        el.addEventListener('click', function(e) {
          if (e.target === el) closeModal(el);
        });
        // Escape key to close — listen on the element and on the document
        var escHandler = function(e) {
          if (e.key === 'Escape') {
            closeModal(el);
          }
        };
        el.addEventListener('keydown', escHandler);
        var docEscHandler = function(e) {
          if (e.key === 'Escape' && (el.classList.contains('bw_bccl_modal_show') || el.style.display === 'flex')) {
            closeModal(el);
          }
        };
        document.addEventListener('keydown', docEscHandler);
        el._bw_escHandler = docEscHandler;
      },
      unmount: function(el) {
        if (el._bw_escHandler) {
          document.removeEventListener('keydown', el._bw_escHandler);
        }
        document.body.style.overflow = '';
      }
    }
  };
}

/**
 * Create a toast notification popup
 *
 * @param {Object} [props] - Toast configuration
 * @param {string} [props.title] - Toast title
 * @param {string|Object|Array} [props.content] - Toast body content
 * @param {string} [props.variant="info"] - Color variant ("primary", "success", "danger", "warning", "info")
 * @param {boolean} [props.autoDismiss=true] - Auto-dismiss after delay
 * @param {number} [props.delay=5000] - Auto-dismiss delay in ms
 * @param {string} [props.position="top-right"] - Container position
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a toast
 * @category Component Builders
 * @example
 * const toast = bw.makeToast({
 *   title: "Success",
 *   content: "File saved!",
 *   variant: "success"
 * });
 */
function makeToast(props = {}) {
  const {
    id,
    title,
    content,
    variant = 'info',
    autoDismiss = true,
    delay = 5000,
    position = 'top-right',
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: {
      id,
      class: `bw_bccl_toast ${variantClass(variant)} bw_bccl_toast_${position.replace(/-/g, '_')} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      (title) && {
        t: 'div',
        a: { class: 'bw_bccl_toast_header' },
        c: [
          { t: 'strong', c: title },
          {
            t: 'button',
            a: {
              type: 'button',
              class: 'bw_close',
              'aria-label': 'Close',
              onclick: function(e) {
                var toast = e.target.closest('.bw_bccl_toast');
                if (toast) {
                  toast.classList.add('bw_bccl_toast_hiding');
                  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
                }
              }
            },
            c: '\u00D7'
          }
        ]
      },
      content && {
        t: 'div',
        a: { class: 'bw_bccl_toast_body' },
        c: content
      }
    ].filter(Boolean),
    o: {
      type: 'toast',
      handle: {
        dismiss: function(el) {
          el.classList.add('bw_bccl_toast_hiding');
          /* c8 ignore next -- setTimeout callback; requires real timer advancement */
          setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
        }
      },
      mounted: function(el) {
        // Trigger show animation
        requestAnimationFrame(function() {
          el.classList.add('bw_bccl_toast_show');
        });
        // Auto-dismiss
        if (autoDismiss) {
          setTimeout(function() {
            el.classList.add('bw_bccl_toast_hiding');
            setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
          }, delay);
        }
      }
    }
  };
}

// =========================================================================
// Phase 3: Essential Modern
// =========================================================================

/**
 * Create a dropdown menu triggered by a button
 *
 * @param {Object} [props] - Dropdown configuration
 * @param {string|Object} [props.trigger] - Button text or TACO for the trigger
 * @param {Array<Object>} [props.items=[]] - Menu items
 * @param {string} [props.items[].text] - Item display text
 * @param {string} [props.items[].href] - Item link URL
 * @param {Function} [props.items[].onclick] - Item click handler
 * @param {boolean} [props.items[].divider] - Render as a divider line
 * @param {boolean} [props.items[].disabled] - Whether the item is disabled
 * @param {string} [props.align="start"] - Menu alignment ("start" or "end")
 * @param {string} [props.variant="primary"] - Trigger button variant
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a dropdown
 * @category Component Builders
 * @example
 * const dropdown = bw.makeDropdown({
 *   trigger: "Actions",
 *   items: [
 *     { text: "Edit", onclick: () => edit() },
 *     { divider: true },
 *     { text: "Delete", onclick: () => del() }
 *   ]
 * });
 */
function makeDropdown(props = {}) {
  const {
    id,
    trigger,
    items = [],
    align = 'start',
    variant = 'primary',
    className: _c = '', class: className = _c
  } = props;

  var triggerTaco;
  if (typeof trigger === 'string' || trigger === undefined) {
    triggerTaco = {
      t: 'button',
      a: {
        class: `bw_bccl_btn ${variantClass(variant)} bw_bccl_dropdown_toggle`,
        type: 'button',
        onclick: function(e) {
          var dropdown = e.target.closest('.bw_bccl_dropdown');
          var menu = dropdown.querySelector('.bw_bccl_dropdown_menu');
          menu.classList.toggle('bw_bccl_dropdown_show');
        }
      },
      c: trigger || 'Dropdown'
    };
  } else {
    triggerTaco = trigger;
  }

  return {
    t: 'div',
    a: { id, class: `bw_bccl_dropdown ${className}`.trim() },
    c: [
      triggerTaco,
      {
        t: 'div',
        a: { class: `bw_bccl_dropdown_menu ${align === 'end' ? 'bw_bccl_dropdown_menu_end' : ''}`.trim() },
        c: items.map(function(item) {
          if (item.divider) {
            return { t: 'hr', a: { class: 'bw_bccl_dropdown_divider' } };
          }
          return {
            t: 'a',
            a: {
              class: `bw_bccl_dropdown_item ${item.disabled ? 'disabled' : ''}`.trim(),
              href: item.href || '#',
              onclick: item.disabled ? undefined : function(e) {
                if (!item.href) e.preventDefault();
                var dropdown = e.target.closest('.bw_bccl_dropdown');
                var menu = dropdown.querySelector('.bw_bccl_dropdown_menu');
                menu.classList.remove('bw_bccl_dropdown_show');
                if (item.onclick) item.onclick(e);
              }
            },
            c: item.text
          };
        })
      }
    ],
    o: {
      type: 'dropdown',
      mounted: function(el) {
        // Click outside to close
        var outsideHandler = function(e) {
          if (!el.contains(e.target)) {
            var menu = el.querySelector('.bw_bccl_dropdown_menu');
            if (menu) menu.classList.remove('bw_bccl_dropdown_show');
          }
        };
        document.addEventListener('click', outsideHandler);
        el._bw_outsideHandler = outsideHandler;
      },
      unmount: function(el) {
        if (el._bw_outsideHandler) {
          document.removeEventListener('click', el._bw_outsideHandler);
        }
      }
    }
  };
}

/**
 * Create a toggle switch (styled checkbox)
 *
 * @param {Object} [props] - Switch configuration
 * @param {string} [props.label] - Switch label text
 * @param {boolean} [props.checked=false] - Whether the switch is on
 * @param {string} [props.id] - Element ID (links label to switch)
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the switch is disabled
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a toggle switch
 * @category Component Builders
 * @example
 * const toggle = bw.makeSwitch({
 *   label: "Dark mode",
 *   checked: false,
 *   onchange: (e) => toggleDark(e.target.checked)
 * });
 */
function makeSwitch(props = {}) {
  const {
    label,
    checked = false,
    id,
    name,
    disabled = false,
    className: _c = '', class: className = _c,
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw_bccl_form_check bw_bccl_form_switch ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw_bccl_form_check_input bw_switch_input',
          role: 'switch',
          checked,
          id,
          name,
          disabled,
          ...eventHandlers
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw_bccl_form_check_label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

/**
 * Create a skeleton loading placeholder
 *
 * @param {Object} [props] - Skeleton configuration
 * @param {string} [props.variant="text"] - Shape variant ("text", "circle", "rect")
 * @param {string} [props.width] - Custom width (e.g. "200px", "100%")
 * @param {string} [props.height] - Custom height (e.g. "20px")
 * @param {number} [props.count=1] - Number of skeleton lines (for text variant)
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a skeleton placeholder
 * @category Component Builders
 * @example
 * const skeleton = bw.makeSkeleton({ variant: "text", count: 3, width: "100%" });
 */
function makeSkeleton(props = {}) {
  const {
    id,
    variant = 'text',
    width,
    height,
    count = 1,
    className: _c = '', class: className = _c
  } = props;

  if (variant === 'circle') {
    var circleSize = width || height || '3rem';
    return {
      t: 'div',
      a: {
        id,
        class: `bw_bccl_skeleton bw_skeleton bw_skeleton_circle ${className}`.trim(),
        style: { width: circleSize, height: circleSize }
      }
    };
  }

  if (variant === 'rect') {
    return {
      t: 'div',
      a: {
        id,
        class: `bw_bccl_skeleton bw_skeleton bw_skeleton_rect ${className}`.trim(),
        style: {
          width: width || '100%',
          height: height || '120px'
        }
      }
    };
  }

  // Text variant — multiple lines
  if (count === 1) {
    return {
      t: 'div',
      a: {
        id,
        class: `bw_bccl_skeleton bw_skeleton bw_skeleton_text ${className}`.trim(),
        style: {
          width: width || '100%',
          height: height || '1em'
        }
      }
    };
  }

  var lines = [];
  for (var i = 0; i < count; i++) {
    lines.push({
      t: 'div',
      a: {
        class: 'bw_skeleton bw_skeleton_text',
        style: {
          width: i === count - 1 ? '75%' : (width || '100%'),
          height: height || '1em'
        }
      }
    });
  }

  return {
    t: 'div',
    a: { id, class: `bw_bccl_skeleton bw_skeleton_group ${className}`.trim() },
    c: lines
  };
}

/**
 * Create a user avatar with image or initials fallback
 *
 * @param {Object} [props] - Avatar configuration
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt] - Image alt text
 * @param {string} [props.initials] - Fallback initials (e.g. "JD")
 * @param {string} [props.size="md"] - Size ("sm", "md", "lg", "xl")
 * @param {string} [props.variant="primary"] - Background color variant for initials
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing an avatar
 * @category Component Builders
 * @example
 * const avatar = bw.makeAvatar({ src: "/photo.jpg", alt: "Jane Doe", size: "lg" });
 * const avatarInitials = bw.makeAvatar({ initials: "JD", variant: "success" });
 */
function makeAvatar(props = {}) {
  const {
    id,
    src,
    alt = '',
    initials,
    size = 'md',
    variant = 'primary',
    className: _c = '', class: className = _c
  } = props;

  if (src) {
    return {
      t: 'img',
      a: {
        id,
        class: `bw_bccl_avatar bw_avatar bw_avatar_${size} ${className}`.trim(),
        src: src,
        alt: alt
      }
    };
  }

  return {
    t: 'div',
    a: {
      id,
      class: `bw_bccl_avatar bw_avatar bw_avatar_${size} ${variantClass(variant)} ${className}`.trim()
    },
    c: initials || ''
  };
}

/**
 * Create a carousel/slideshow component with slide transitions
 *
 * Supports image slides, TACO content slides, captions, prev/next controls,
 * dot indicators, and optional auto-play. Uses CSS translateX transitions.
 *
 * @param {Object} [props] - Carousel configuration
 * @param {Array<Object>} [props.items=[]] - Slide items
 * @param {string|Object} props.items[].content - Slide content (TACO, string, or img element)
 * @param {string} [props.items[].caption] - Caption text shown at bottom of slide
 * @param {boolean} [props.showControls=true] - Show prev/next arrow buttons
 * @param {boolean} [props.showIndicators=true] - Show dot navigation
 * @param {boolean} [props.autoPlay=false] - Auto-advance slides
 * @param {number} [props.interval=5000] - Auto-advance interval in ms
 * @param {string} [props.height='300px'] - Carousel height
 * @param {number} [props.startIndex=0] - Initial slide index
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a carousel
 * @category Component Builders
 * @example
 * const carousel = bw.makeCarousel({
 *   items: [
 *     { content: { t: 'img', a: { src: 'photo.jpg' } }, caption: 'Photo 1' },
 *     { content: { t: 'div', c: 'Text slide' } }
 *   ],
 *   autoPlay: true,
 *   interval: 3000
 * });
 */
function makeCarousel(props = {}) {
  const {
    id,
    items = [],
    showControls = true,
    showIndicators = true,
    autoPlay = false,
    interval = 5000,
    height = '300px',
    startIndex = 0,
    prevLabel = 'Previous slide',
    nextLabel = 'Next slide',
    className: _c = '', class: className = _c
  } = props;

  // Shared navigation logic
  function goToSlide(carouselEl, index) {
    var total = carouselEl.querySelectorAll('.bw_bccl_carousel_slide').length;
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    carouselEl._bw_carouselIndex = index;
    var track = carouselEl.querySelector('.bw_bccl_carousel_track');
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    // Update indicators
    var indicators = carouselEl.querySelectorAll('.bw_bccl_carousel_indicator');
    for (var i = 0; i < indicators.length; i++) {
      if (i === index) {
        indicators[i].classList.add('active');
      } else {
        indicators[i].classList.remove('active');
      }
    }
  }

  // Arrow SVGs (inline data URIs, same pattern as accordion chevrons)
  var prevArrow = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z'/%3e%3c/svg%3e";
  var nextArrow = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e";

  var slides = items.map(function(item) {
    var slideContent = [
      item.content,
      item.caption && {
        t: 'div',
        a: { class: 'bw_bccl_carousel_caption' },
        c: item.caption
      }
    ].filter(Boolean);

    return {
      t: 'div',
      a: { class: 'bw_bccl_carousel_slide' },
      c: slideContent.length === 1 ? slideContent[0] : slideContent
    };
  });

  var children = [
    // Track
    {
      t: 'div',
      a: {
        class: 'bw_bccl_carousel_track',
        style: 'transform: translateX(-' + (startIndex * 100) + '%)'
      },
      c: slides
    }
  ];

  // Prev/Next controls
  if (showControls && items.length > 1) {
    children.push({
      t: 'button',
      a: {
        class: 'bw_bccl_carousel_control bw_bccl_carousel_control_prev',
        type: 'button',
        'aria-label': prevLabel,
        onclick: function(e) {
          var carousel = e.target.closest('.bw_bccl_carousel');
          /* c8 ignore next -- carousel index fallback; default 0 */
          var idx = carousel._bw_carouselIndex || 0;
          goToSlide(carousel, idx - 1);
        }
      },
      c: [{ t: 'img', a: { src: prevArrow, alt: '', role: 'presentation' } }, { t: 'span', a: { class: 'bw_visually_hidden' }, c: prevLabel }]
    });
    children.push({
      t: 'button',
      a: {
        class: 'bw_bccl_carousel_control bw_bccl_carousel_control_next',
        type: 'button',
        'aria-label': nextLabel,
        onclick: function(e) {
          var carousel = e.target.closest('.bw_bccl_carousel');
          var idx = carousel._bw_carouselIndex || 0;
          goToSlide(carousel, idx + 1);
        }
      },
      c: [{ t: 'img', a: { src: nextArrow, alt: '', role: 'presentation' } }, { t: 'span', a: { class: 'bw_visually_hidden' }, c: nextLabel }]
    });
  }

  // Indicators
  if (showIndicators && items.length > 1) {
    children.push({
      t: 'div',
      a: { class: 'bw_bccl_carousel_indicators' },
      c: items.map(function(_, i) {
        return {
          t: 'button',
          a: {
            class: 'bw_bccl_carousel_indicator' + (i === startIndex ? ' active' : ''),
            type: 'button',
            'aria-label': 'Go to slide ' + (i + 1),
            onclick: function(e) {
              var carousel = e.target.closest('.bw_bccl_carousel');
              goToSlide(carousel, i);
            }
          }
        };
      })
    });
  }

  return {
    t: 'div',
    a: {
      id,
      class: ('bw_bccl_carousel ' + className).trim(),
      style: 'height: ' + height,
      tabindex: '0',
      'aria-roledescription': 'carousel'
    },
    c: children,
    o: {
      type: 'carousel',
      state: { activeIndex: startIndex, autoPlay: autoPlay, interval: interval },
      handle: {
        goToSlide: function(el, index) { goToSlide(el, index); },
        next: function(el) { goToSlide(el, (el._bw_carouselIndex || 0) + 1); },
        /* c8 ignore next -- carousel index fallback */
        prev: function(el) { goToSlide(el, (el._bw_carouselIndex || 0) - 1); },
        getActiveIndex: function(el) { return el._bw_carouselIndex || 0; },
        pause: function(el) {
          if (el._bw_carouselInterval) {
            clearInterval(el._bw_carouselInterval);
            el._bw_carouselInterval = null;
          }
        },
        play: function(el) {
          if (!el._bw_carouselInterval && el._bw_state) {
            /* c8 ignore next -- interval fallback to default 5000ms */
            var ms = el._bw_state.interval || 5000;
            el._bw_carouselInterval = setInterval(function() {
              goToSlide(el, (el._bw_carouselIndex || 0) + 1);
            }, ms);
          }
        }
      },
      mounted: function(el) {
        el._bw_carouselIndex = startIndex;
        // Keyboard navigation
        el.addEventListener('keydown', function(e) {
          var idx = el._bw_carouselIndex || 0;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSlide(el, idx - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goToSlide(el, idx + 1);
          }
        });
        // Auto-play
        if (autoPlay) {
          var intervalId = setInterval(function() {
            var idx = el._bw_carouselIndex || 0;
            goToSlide(el, idx + 1);
          }, interval);
          el._bw_carouselInterval = intervalId;
          // Pause on hover/focus for usability
          el.addEventListener('mouseenter', function() {
            if (el._bw_carouselInterval) clearInterval(el._bw_carouselInterval);
          });
          el.addEventListener('mouseleave', function() {
            el._bw_carouselInterval = setInterval(function() {
              var idx = el._bw_carouselIndex || 0;
              goToSlide(el, idx + 1);
            }, interval);
          });
        }
      },
      unmount: function(el) {
        if (el._bw_carouselInterval) {
          clearInterval(el._bw_carouselInterval);
        }
      }
    }
  };
}

// =========================================================================
// Phase 4: Dashboard & Data Display
// =========================================================================

/**
 * Create a stat card for dashboard metrics display
 *
 * Shows a large value with a label and optional change indicator.
 * Designed for dashboard grid layouts with left-border accent.
 *
 * @param {Object|string} [props] - Stat card configuration (string shorthand sets label)
 * @param {string|number} [props.value=0] - The main stat value to display
 * @param {string} [props.label] - Descriptive label below the value
 * @param {number} [props.change] - Percentage change indicator (positive = green arrow, negative = red)
 * @param {string} [props.format] - Value format ("number", "currency", "percent")
 * @param {string} [props.prefix] - Custom prefix (e.g. "$")
 * @param {string} [props.suffix] - Custom suffix (e.g. "%")
 * @param {string} [props.icon] - Icon content (emoji or text) shown above value
 * @param {string} [props.variant] - Left-border color variant ("primary", "success", "danger", etc.)
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing a stat card
 * @category Component Builders
 * @example
 * const stat = bw.makeStatCard({
 *   value: 2345,
 *   label: 'Active Users',
 *   change: 5.3,
 *   format: 'number',
 *   variant: 'primary'
 * });
 */
function makeStatCard(props = {}) {
  if (typeof props === 'string') props = { label: props };
  var {
    id,
    value = 0,
    label,
    change,
    format,
    prefix,
    suffix,
    icon,
    variant,
    className: _c = '', class: className = _c,
    style
  } = props;

  function formatValue(val, fmt) {
    if (prefix || suffix) return (prefix || '') + val + (suffix || '');
    switch (fmt) {
      case 'currency': return '$' + Number(val).toLocaleString();
      case 'percent': return val + '%';
      case 'number': return Number(val).toLocaleString();
      default: return '' + val;
    }
  }

  var classes = [
    'bw_bccl_statCard bw_stat_card',
    variantClass(variant),
    className
  ].filter(Boolean).join(' ').trim();

  var children = [];

  if (icon) {
    children.push({
      t: 'div',
      a: { class: 'bw_stat_icon' },
      c: icon
    });
  }

  children.push({
    t: 'div',
    a: { class: 'bw_stat_value' },
    c: formatValue(value, format)
  });

  if (label) {
    children.push({
      t: 'div',
      a: { class: 'bw_stat_label' },
      c: label
    });
  }

  if (change !== undefined && change !== null) {
    children.push({
      t: 'div',
      a: {
        class: 'bw_stat_change ' + (change >= 0 ? 'bw_stat_change_up' : 'bw_stat_change_down')
      },
      c: (change >= 0 ? '\u2191 +' : '\u2193 ') + change + '%'
    });
  }

  return {
    t: 'div',
    a: { id, class: classes, style: style },
    c: children,
    o: {
      type: 'stat-card',
      slots: {
        value: '.bw_stat_value',
        label: '.bw_stat_label'
      }
    }
  };
}

// =========================================================================
// Phase 5: Overlays & Popovers
// =========================================================================

/**
 * Create a tooltip wrapper around trigger content
 *
 * Wraps the trigger element in a container that shows tooltip text
 * on hover and focus. Pure CSS-driven show/hide with JS lifecycle
 * for event binding.
 *
 * @param {Object} [props] - Tooltip configuration
 * @param {string|Object|Array} [props.content] - Trigger content (what the user hovers/focuses)
 * @param {string} [props.text=""] - Tooltip text to display
 * @param {string} [props.placement="top"] - Tooltip placement ("top", "bottom", "left", "right")
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a tooltip wrapper
 * @category Component Builders
 * @example
 * const tip = bw.makeTooltip({
 *   content: bw.makeButton({ text: 'Hover me' }),
 *   text: 'This is a tooltip!',
 *   placement: 'top'
 * });
 */
function makeTooltip(props = {}) {
  var {
    id,
    content,
    text = '',
    placement = 'top',
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'span',
    a: { id, class: ('bw_bccl_tooltip_wrapper ' + className).trim() },
    c: [
      content,
      {
        t: 'span',
        a: {
          class: 'bw_bccl_tooltip bw_bccl_tooltip_' + placement,
          role: 'tooltip'
        },
        c: text
      }
    ],
    o: {
      type: 'tooltip',
      mounted: function(el) {
        var tip = el.querySelector('.bw_bccl_tooltip');
        el.addEventListener('mouseenter', function() {
          tip.classList.add('bw_bccl_tooltip_show');
        });
        el.addEventListener('mouseleave', function() {
          tip.classList.remove('bw_bccl_tooltip_show');
        });
        el.addEventListener('focusin', function() {
          tip.classList.add('bw_bccl_tooltip_show');
        });
        el.addEventListener('focusout', function() {
          tip.classList.remove('bw_bccl_tooltip_show');
        });
      }
    }
  };
}

/**
 * Create a popover wrapper around trigger content
 *
 * Like a tooltip but richer — supports title + body content and is
 * triggered by click rather than hover. Dismisses on click outside.
 *
 * @param {Object} [props] - Popover configuration
 * @param {string|Object|Array} [props.trigger] - Trigger content (what the user clicks)
 * @param {string} [props.title] - Popover header title
 * @param {string|Object|Array} [props.content] - Popover body content
 * @param {string} [props.placement="top"] - Placement ("top", "bottom", "left", "right")
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a popover wrapper
 * @category Component Builders
 * @example
 * const pop = bw.makePopover({
 *   trigger: bw.makeButton({ text: 'Click me' }),
 *   title: 'Popover Title',
 *   content: 'Some helpful information here.',
 *   placement: 'bottom'
 * });
 */
function makePopover(props = {}) {
  var {
    id,
    trigger,
    title,
    content,
    placement = 'top',
    className: _c = '', class: className = _c
  } = props;

  var popoverContent = [
    title && {
      t: 'div',
      a: { class: 'bw_popover_header' },
      c: title
    },
    content && {
      t: 'div',
      a: { class: 'bw_popover_body' },
      c: content
    }
  ].filter(Boolean);

  return {
    t: 'span',
    a: { id, class: ('bw_bccl_popover bw_popover_wrapper ' + className).trim() },
    c: [
      {
        t: 'span',
        a: {
          class: 'bw_popover_trigger',
          onclick: function(e) {
            var wrapper = e.target.closest('.bw_popover_wrapper');
            var pop = wrapper.querySelector('.bw_popover');
            pop.classList.toggle('bw_popover_show');
          }
        },
        c: trigger
      },
      {
        t: 'div',
        a: {
          class: 'bw_popover bw_popover_' + placement
        },
        c: popoverContent
      }
    ],
    o: {
      type: 'popover',
      mounted: function(el) {
        // Click outside to close
        var outsideHandler = function(e) {
          if (!el.contains(e.target)) {
            var pop = el.querySelector('.bw_popover');
            if (pop) pop.classList.remove('bw_popover_show');
          }
        };
        document.addEventListener('click', outsideHandler);
        el._bw_outsideHandler = outsideHandler;
      },
      unmount: function(el) {
        if (el._bw_outsideHandler) {
          document.removeEventListener('click', el._bw_outsideHandler);
        }
      }
    }
  };
}

// =========================================================================
// Phase 6: Form Enhancements & Layout
// =========================================================================

/**
 * Create a search input with clear button
 *
 * Wraps a text input with a clear (×) button that appears when
 * the field has content. Calls onSearch on Enter key.
 *
 * @param {Object} [props] - Search input configuration
 * @param {string} [props.placeholder="Search..."] - Placeholder text
 * @param {string} [props.value] - Initial value
 * @param {Function} [props.onSearch] - Callback when Enter is pressed, receives value
 * @param {Function} [props.onInput] - Callback on each keystroke, receives value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a search input
 * @category Component Builders
 * @example
 * const search = bw.makeSearchInput({
 *   placeholder: 'Search users...',
 *   onSearch: (val) => filterUsers(val)
 * });
 */
function makeSearchInput(props = {}) {
  if (typeof props === 'string') props = { placeholder: props };
  var {
    placeholder = 'Search...',
    value,
    onSearch,
    onInput,
    id,
    name,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_bccl_searchInput bw_search_input ' + className).trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'search',
          class: 'bw_bccl_form_control bw_search_field',
          placeholder: placeholder,
          value: value,
          id: id,
          name: name,
          onkeydown: function(e) {
            if (e.key === 'Enter' && onSearch) {
              e.preventDefault();
              onSearch(e.target.value);
            }
          },
          oninput: function(e) {
            var wrapper = e.target.closest('.bw_search_input');
            var clearBtn = wrapper.querySelector('.bw_search_clear');
            if (clearBtn) {
              clearBtn.style.display = e.target.value ? 'flex' : 'none';
            }
            if (onInput) onInput(e.target.value);
          }
        }
      },
      {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw_search_clear',
          'aria-label': 'Clear search',
          style: value ? undefined : 'display: none',
          onclick: function(e) {
            var wrapper = e.target.closest('.bw_search_input');
            var input = wrapper.querySelector('.bw_search_field');
            input.value = '';
            e.target.style.display = 'none';
            input.focus();
            if (onInput) onInput('');
            if (onSearch) onSearch('');
          }
        },
        c: '\u00D7'
      }
    ],
    o: { type: 'search-input' }
  };
}

/**
 * Create a styled range slider input
 *
 * @param {Object} [props] - Range configuration
 * @param {number} [props.min=0] - Minimum value
 * @param {number} [props.max=100] - Maximum value
 * @param {number} [props.step=1] - Step increment
 * @param {number} [props.value=50] - Current value
 * @param {string} [props.label] - Label text
 * @param {boolean} [props.showValue=false] - Show current value display
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the slider is disabled
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a range input
 * @category Component Builders
 * @example
 * const slider = bw.makeRange({
 *   min: 0, max: 100, value: 50,
 *   label: 'Volume',
 *   showValue: true,
 *   oninput: (e) => setVolume(e.target.value)
 * });
 */
function makeRange(props = {}) {
  var {
    min = 0,
    max = 100,
    step = 1,
    value = 50,
    label,
    showValue = false,
    id,
    name,
    disabled = false,
    className: _c = '', class: className = _c,
    ...eventHandlers
  } = props;

  var children = [];

  if (label || showValue) {
    var labelContent = [];
    if (label) {
      labelContent.push({
        t: 'span',
        c: label
      });
    }
    if (showValue) {
      labelContent.push({
        t: 'span',
        a: { class: 'bw_range_value' },
        c: '' + value
      });
    }
    children.push({
      t: 'div',
      a: { class: 'bw_range_label' },
      c: labelContent
    });
  }

  // Wrap oninput to update value display
  var userOnInput = eventHandlers.oninput;
  if (showValue) {
    eventHandlers.oninput = function(e) {
      var wrapper = e.target.closest('.bw_range_wrapper');
      var valDisplay = wrapper.querySelector('.bw_range_value');
      if (valDisplay) valDisplay.textContent = e.target.value;
      if (userOnInput) userOnInput(e);
    };
  }

  children.push({
    t: 'input',
    a: {
      type: 'range',
      class: 'bw_range',
      min: min,
      max: max,
      step: step,
      value: value,
      id: id,
      name: name,
      disabled: disabled,
      ...eventHandlers
    }
  });

  return {
    t: 'div',
    a: { class: ('bw_bccl_range bw_range_wrapper ' + className).trim() },
    c: children,
    o: { type: 'range' }
  };
}

/**
 * Create a media object layout (image + text side-by-side)
 *
 * Classic media object pattern: image/icon on one side, text content
 * on the other, using flexbox. Supports reversed layout.
 *
 * @param {Object} [props] - Media object configuration
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt=""] - Image alt text
 * @param {string} [props.title] - Title text
 * @param {string|Object|Array} [props.content] - Body content
 * @param {boolean} [props.reverse=false] - Put image on the right
 * @param {string} [props.imageSize="3rem"] - Image width/height
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a media object
 * @category Component Builders
 * @example
 * const media = bw.makeMediaObject({
 *   src: '/avatar.jpg',
 *   title: 'Jane Doe',
 *   content: 'Posted a comment 5 minutes ago.'
 * });
 */
function makeMediaObject(props = {}) {
  var {
    id,
    src,
    alt = '',
    title,
    content,
    reverse = false,
    imageSize = '3rem',
    className: _c = '', class: className = _c
  } = props;

  var imgEl = src ? {
    t: 'img',
    a: {
      class: 'bw_media_img',
      src: src,
      alt: alt,
      style: 'width:' + imageSize + ';height:' + imageSize
    }
  } : null;

  var bodyEl = {
    t: 'div',
    a: { class: 'bw_media_body' },
    c: [
      title && { t: 'h5', a: { class: 'bw_media_title' }, c: title },
      content
    ].filter(Boolean)
  };

  return {
    t: 'div',
    a: { id, class: ('bw_bccl_mediaObject bw_media ' + (reverse ? 'bw_media_reverse ' : '') + className).trim() },
    c: reverse
      ? [bodyEl, imgEl].filter(Boolean)
      : [imgEl, bodyEl].filter(Boolean),
    o: { type: 'media-object' }
  };
}

/**
 * Create a file upload zone with drag-and-drop support
 *
 * Styled drop zone with file input. Supports drag-and-drop visuals
 * and multiple file selection.
 *
 * @param {Object} [props] - File upload configuration
 * @param {string} [props.accept] - Accepted file types (e.g. "image/*", ".pdf,.doc")
 * @param {boolean} [props.multiple=false] - Allow multiple file selection
 * @param {Function} [props.onFiles] - Callback when files are selected, receives FileList
 * @param {string} [props.text="Drop files here or click to browse"] - Zone label text
 * @param {string} [props.id] - Element ID
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a file upload zone
 * @category Component Builders
 * @example
 * const upload = bw.makeFileUpload({
 *   accept: 'image/*',
 *   multiple: true,
 *   onFiles: (files) => uploadFiles(files)
 * });
 */
function makeFileUpload(props = {}) {
  var {
    accept,
    multiple = false,
    onFiles,
    text = 'Drop files here or click to browse',
    id,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: {
      class: ('bw_bccl_fileUpload bw_file_upload ' + className).trim(),
      tabindex: '0',
      role: 'button',
      'aria-label': text
    },
    c: [
      { t: 'div', a: { class: 'bw_file_upload_icon' }, c: '\uD83D\uDCC1' },
      { t: 'div', a: { class: 'bw_file_upload_text' }, c: text },
      {
        t: 'input',
        a: {
          type: 'file',
          class: 'bw_file_upload_input',
          accept: accept,
          multiple: multiple,
          id: id,
          onchange: function(e) {
            if (onFiles && e.target.files.length) onFiles(e.target.files);
          }
        }
      }
    ],
    o: {
      type: 'file-upload',
      mounted: function(el) {
        var input = el.querySelector('.bw_file_upload_input');

        // Click zone to trigger file input
        el.addEventListener('click', function(e) {
          if (e.target !== input) input.click();
        });

        // Keyboard activation
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.click();
          }
        });

        // Drag-and-drop visuals
        el.addEventListener('dragover', function(e) {
          e.preventDefault();
          el.classList.add('bw_file_upload_active');
        });
        el.addEventListener('dragleave', function() {
          el.classList.remove('bw_file_upload_active');
        });
        el.addEventListener('drop', function(e) {
          e.preventDefault();
          el.classList.remove('bw_file_upload_active');
          if (onFiles && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
        });
      }
    }
  };
}

// =========================================================================
// Phase 7: Data Display & Workflow
// =========================================================================

/**
 * Create a vertical timeline for chronological event display
 *
 * Renders events as a vertical line with markers and content cards.
 * Each item can have a colored variant marker.
 *
 * @param {Object} [props] - Timeline configuration
 * @param {Array<Object>} [props.items=[]] - Timeline events
 * @param {string} [props.items[].title] - Event title
 * @param {string|Object|Array} [props.items[].content] - Event description content
 * @param {string} [props.items[].date] - Date or time label
 * @param {string} [props.items[].variant="primary"] - Marker color variant
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a timeline
 * @category Component Builders
 * @example
 * const timeline = bw.makeTimeline({
 *   items: [
 *     { title: 'Project Started', date: 'Jan 2026', variant: 'primary' },
 *     { title: 'Beta Release', date: 'Mar 2026', content: 'v2.0 beta shipped' },
 *     { title: 'Stable Release', date: 'Jun 2026', variant: 'success' }
 *   ]
 * });
 */
function makeTimeline(props = {}) {
  var {
    id,
    items = [],
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: { id, class: ('bw_bccl_timeline ' + className).trim() },
    c: items.map(function(item) {
      return {
        t: 'div',
        a: { class: 'bw_bccl_timeline_item' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_bccl_timeline_marker ' + variantClass(item.variant || 'primary') }
          },
          {
            t: 'div',
            a: { class: 'bw_bccl_timeline_content' },
            c: [
              item.date && {
                t: 'div',
                a: { class: 'bw_bccl_timeline_date' },
                c: item.date
              },
              item.title && {
                t: 'h5',
                a: { class: 'bw_bccl_timeline_title' },
                c: item.title
              },
              item.content && (typeof item.content === 'string'
                ? { t: 'p', a: { class: 'bw_bccl_timeline_text' }, c: item.content }
                : item.content)
            ].filter(Boolean)
          }
        ]
      };
    }),
    o: { type: 'timeline' }
  };
}

/**
 * Create a multi-step wizard/progress indicator
 *
 * Displays numbered steps with active and completed states.
 * Steps before currentStep are marked completed, the currentStep
 * is active, and subsequent steps are pending.
 *
 * @param {Object} [props] - Stepper configuration
 * @param {Array<Object>} [props.steps=[]] - Step definitions
 * @param {string} [props.steps[].label] - Step label text
 * @param {string} [props.steps[].description] - Optional step description
 * @param {number} [props.currentStep=0] - Zero-based index of the active step
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a stepper
 * @category Component Builders
 * @example
 * const stepper = bw.makeStepper({
 *   currentStep: 1,
 *   steps: [
 *     { label: 'Account', description: 'Create account' },
 *     { label: 'Profile', description: 'Set up profile' },
 *     { label: 'Confirm', description: 'Review & submit' }
 *   ]
 * });
 */
function makeStepper(props = {}) {
  var {
    id,
    steps = [],
    currentStep = 0,
    className: _c = '', class: className = _c
  } = props;

  return {
    t: 'div',
    a: { id, class: ('bw_bccl_stepper bw_stepper ' + className).trim(), role: 'list' },
    c: steps.map(function(step, index) {
      var state = index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending';
      return {
        t: 'div',
        a: {
          class: 'bw_step bw_step_' + state,
          role: 'listitem',
          'aria-current': state === 'active' ? 'step' : undefined
        },
        c: [
          {
            t: 'div',
            a: { class: 'bw_step_indicator' },
            c: state === 'completed' ? '\u2713' : '' + (index + 1)
          },
          {
            t: 'div',
            a: { class: 'bw_step_body' },
            c: [
              { t: 'div', a: { class: 'bw_step_label' }, c: step.label },
              step.description && { t: 'div', a: { class: 'bw_step_description' }, c: step.description }
            ].filter(Boolean)
          }
        ]
      };
    }),
    o: { type: 'stepper' }
  };
}

/**
 * Create a chip/tag input for managing a list of items
 *
 * Displays existing chips with remove buttons and an input field
 * for adding new ones. Chips are added on Enter and removed on
 * clicking the × button.
 *
 * @param {Object} [props] - Chip input configuration
 * @param {Array<string>} [props.chips=[]] - Initial chip values
 * @param {string} [props.placeholder="Add..."] - Input placeholder text
 * @param {Function} [props.onAdd] - Callback when a chip is added, receives value
 * @param {Function} [props.onRemove] - Callback when a chip is removed, receives value
 * @param {string} [props.id] - id attribute for the root element
 * @param {string} [props.class] - Additional CSS classes, merged with the component's own (`className` is a deprecated alias)
 * @returns {Object} TACO object representing a chip input
 * @category Component Builders
 * @example
 * const tags = bw.makeChipInput({
 *   chips: ['JavaScript', 'CSS'],
 *   placeholder: 'Add tag...',
 *   onAdd: (val) => addTag(val),
 *   onRemove: (val) => removeTag(val)
 * });
 */
function makeChipInput(props = {}) {
  var {
    id,
    chips = [],
    placeholder = 'Add...',
    onAdd,
    onRemove,
    className: _c = '', class: className = _c
  } = props;

  function makeChipEl(text) {
    return {
      t: 'span',
      a: { class: 'bw_chip' },
      c: [
        text,
        {
          t: 'button',
          a: {
            type: 'button',
            class: 'bw_chip_remove',
            'aria-label': 'Remove ' + text,
            onclick: function(e) {
              var chip = e.target.closest('.bw_chip');
              chip.parentNode.removeChild(chip);
              if (onRemove) onRemove(text);
            }
          },
          c: '\u00D7'
        }
      ]
    };
  }

  return {
    t: 'div',
    a: { id, class: ('bw_bccl_chipInput bw_chip_input ' + className).trim() },
    c: [
      ...chips.map(makeChipEl),
      {
        t: 'input',
        a: {
          type: 'text',
          class: 'bw_chip_field',
          placeholder: placeholder,
          onkeydown: function(e) {
            if (e.key === 'Enter' && e.target.value.trim()) {
              e.preventDefault();
              var val = e.target.value.trim();
              var wrapper = e.target.closest('.bw_chip_input');
              // Insert chip before the input
              var chipEl = document.createElement('span');
              chipEl.className = 'bw_chip';
              chipEl._bw_chipValue = val;
              chipEl.innerHTML = '';
              chipEl.textContent = val;
              var removeBtn = document.createElement('button');
              removeBtn.type = 'button';
              removeBtn.className = 'bw_chip_remove';
              removeBtn.setAttribute('aria-label', 'Remove ' + val);
              removeBtn.textContent = '\u00D7';
              removeBtn.onclick = function() {
                chipEl.parentNode.removeChild(chipEl);
                if (onRemove) onRemove(val);
              };
              chipEl.appendChild(removeBtn);
              wrapper.insertBefore(chipEl, e.target);
              e.target.value = '';
              if (onAdd) onAdd(val);
            }
            // Backspace on empty input removes last chip
            if (e.key === 'Backspace' && !e.target.value) {
              var chipWrapper = e.target.closest('.bw_chip_input');
              var chipEls = chipWrapper.querySelectorAll('.bw_chip');
              if (chipEls.length) {
                var last = chipEls[chipEls.length - 1];
                var removedVal = last._bw_chipValue || last.firstChild.textContent;
                last.parentNode.removeChild(last);
                if (onRemove) onRemove(removedVal);
              }
            }
          }
        }
      }
    ],
    o: {
      type: 'chip-input',
      handle: {
        addChip: function(el, text) {
          if (!text) return;
          var input = el.querySelector('.bw_chip_field');
          var chipEl = document.createElement('span');
          chipEl.className = 'bw_chip';
          chipEl._bw_chipValue = text;
          chipEl.textContent = text;
          var removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'bw_chip_remove';
          removeBtn.setAttribute('aria-label', 'Remove ' + text);
          removeBtn.textContent = '\u00D7';
          removeBtn.onclick = function() { chipEl.parentNode.removeChild(chipEl); };
          chipEl.appendChild(removeBtn);
          el.insertBefore(chipEl, input);
        },
        removeChip: function(el, text) {
          var chips = el.querySelectorAll('.bw_chip');
          for (var i = 0; i < chips.length; i++) {
            if ((chips[i]._bw_chipValue || chips[i].firstChild.textContent) === text) {
              chips[i].parentNode.removeChild(chips[i]);
              return;
            }
          }
        },
        getChips: function(el) {
          var chips = el.querySelectorAll('.bw_chip');
          var values = [];
          for (var i = 0; i < chips.length; i++) {
            values.push(chips[i]._bw_chipValue || chips[i].firstChild.textContent);
          }
          return values;
        },
        clear: function(el) {
          var chips = el.querySelectorAll('.bw_chip');
          for (var i = chips.length - 1; i >= 0; i--) {
            chips[i].parentNode.removeChild(chips[i]);
          }
        }
      }
    }
  };
}

// componentHandles registry removed in v2.0.15.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

// =========================================================================
// BCCL Component Registry
//
// Single registry mapping type names to their factory functions.
// Enables bw.make('card', props) dispatch and introspection via
// Object.keys(BCCL).
// =========================================================================

/**
 * BCCL component registry — maps component type names to factory functions.
 * Each entry's `make` function is the corresponding exported makeXxx().
 *
 * @type {Object.<string, {make: Function}>}
 */
var BCCL = {
  card:          { make: makeCard },
  button:        { make: makeButton },
  container:     { make: makeContainer },
  row:           { make: makeRow },
  col:           { make: makeCol },
  nav:           { make: makeNav },
  navbar:        { make: makeNavbar },
  tabs:          { make: makeTabs },
  alert:         { make: makeAlert },
  badge:         { make: makeBadge },
  progress:      { make: makeProgress },
  listGroup:     { make: makeListGroup },
  breadcrumb:    { make: makeBreadcrumb },
  form:          { make: makeForm },
  formGroup:     { make: makeFormGroup },
  input:         { make: makeInput },
  textarea:      { make: makeTextarea },
  select:        { make: makeSelect },
  checkbox:      { make: makeCheckbox },
  stack:         { make: makeStack },
  spinner:       { make: makeSpinner },
  hero:          { make: makeHero },
  featureGrid:   { make: makeFeatureGrid },
  cta:           { make: makeCTA },
  section:       { make: makeSection },
  codeDemo:      { make: makeCodeDemo },
  pagination:    { make: makePagination },
  radio:         { make: makeRadio },
  buttonGroup:   { make: makeButtonGroup },
  accordion:     { make: makeAccordion },
  modal:         { make: makeModal },
  toast:         { make: makeToast },
  dropdown:      { make: makeDropdown },
  switch:        { make: makeSwitch },
  skeleton:      { make: makeSkeleton },
  avatar:        { make: makeAvatar },
  carousel:      { make: makeCarousel },
  statCard:      { make: makeStatCard },
  tooltip:       { make: makeTooltip },
  popover:       { make: makePopover },
  searchInput:   { make: makeSearchInput },
  range:         { make: makeRange },
  mediaObject:   { make: makeMediaObject },
  fileUpload:    { make: makeFileUpload },
  timeline:      { make: makeTimeline },
  stepper:       { make: makeStepper },
  chipInput:     { make: makeChipInput }
};

/**
 * Factory function — create any BCCL component by type name.
 *
 * @param {string} type - Component type (e.g. 'card', 'button', 'alert')
 * @param {Object} [props] - Component properties
 * @returns {Object} TACO object
 * @throws {Error} If type is not found in the registry
 * @example
 * var card = bw.make('card', { title: 'Hello', variant: 'primary' });
 * var btn = bw.make('button', { text: 'Click', variant: 'success' });
 * var types = Object.keys(bw.BCCL); // list all available types
 */
function make(type, props) {
  var def = BCCL[type];
  if (!def) throw new Error('bw.make: unknown component type "' + type + '". Available: ' + Object.keys(BCCL).join(', '));
  var taco = def.make(props || {});
  if (taco && typeof taco === 'object') {
    taco._bwFactory = { type: type, props: props || {} };
  }
  return taco;
}

var components = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BCCL: BCCL,
  bcclStyles: bcclStyles,
  make: make,
  makeAccordion: makeAccordion,
  makeAlert: makeAlert,
  makeAvatar: makeAvatar,
  makeBadge: makeBadge,
  makeBreadcrumb: makeBreadcrumb,
  makeButton: makeButton,
  makeButtonGroup: makeButtonGroup,
  makeCTA: makeCTA,
  makeCard: makeCard,
  makeCarousel: makeCarousel,
  makeCheckbox: makeCheckbox,
  makeChipInput: makeChipInput,
  makeCodeDemo: makeCodeDemo,
  makeCol: makeCol,
  makeContainer: makeContainer,
  makeDropdown: makeDropdown,
  makeFeatureGrid: makeFeatureGrid,
  makeFileUpload: makeFileUpload,
  makeForm: makeForm,
  makeFormGroup: makeFormGroup,
  makeHero: makeHero,
  makeInput: makeInput,
  makeListGroup: makeListGroup,
  makeMediaObject: makeMediaObject,
  makeModal: makeModal,
  makeNav: makeNav,
  makeNavbar: makeNavbar,
  makePagination: makePagination,
  makePopover: makePopover,
  makeProgress: makeProgress,
  makeRadio: makeRadio,
  makeRange: makeRange,
  makeRow: makeRow,
  makeSearchInput: makeSearchInput,
  makeSection: makeSection,
  makeSelect: makeSelect,
  makeSkeleton: makeSkeleton,
  makeSpinner: makeSpinner,
  makeStack: makeStack,
  makeStatCard: makeStatCard,
  makeStepper: makeStepper,
  makeSwitch: makeSwitch,
  makeTabs: makeTabs,
  makeTextarea: makeTextarea,
  makeTimeline: makeTimeline,
  makeToast: makeToast,
  makeTooltip: makeTooltip,
  variantClass: variantClass
});

/**
 * bitwrench-bccl-entry.js — Standalone entry point for BCCL component library.
 *
 * Use this alongside bitwrench-lean when you want the core library and
 * BCCL components as separate files. The UMD build auto-registers all
 * make*() functions onto the global `bw` object if present.
 *
 * Usage (browser) -- order matters, and bw.loadStyles() comes after both,
 * because this script also installs the widget stylesheet (2.1.14):
 *   <script src="bitwrench-lean.umd.min.js"></script>
 *   <script src="bitwrench-bccl.umd.min.js"></script>
 *   <script>bw.loadStyles({ primary: '#336699' });</script>
 *
 * Usage (ESM):
 *   import bw from 'bitwrench/lean';
 *   import { registerBCCL } from 'bitwrench/bccl';
 *   registerBCCL(bw);
 *
 * @module bitwrench-bccl
 * @license BSD-2-Clause
 */


/**
 * Register all BCCL components onto a bitwrench instance.
 * Called automatically in UMD builds when `bw` is a global.
 *
 * @param {Object} bw - The bitwrench instance to register on
 */
function registerBCCL(bw) {
  if (!bw) return;

  // Register all make* functions
  Object.entries(components).forEach(function(entry) {
    var name = entry[0], fn = entry[1];
    if (name.indexOf('make') === 0) {
      bw[name] = fn;
    }
  });

  // Factory dispatch: bw.make('card', props) → bw.makeCard(props)
  bw.make = make;

  // Component registry
  bw.BCCL = BCCL;

  // Variant class helper
  bw.variantClass = variantClass;
  // The widget stylesheet (2.1.14): lean's loadStyles() emits no widget CSS
  // until this runs, so load lean, then this script, then call loadStyles().
  if (typeof bw._installStyleSheet === 'function') bw._installStyleSheet(bcclStyles);

  // Create functions that return DOM elements
  if (typeof bw.create === 'function') {
    Object.entries(components).forEach(function(entry) {
      var name = entry[0], fn = entry[1];
      if (name.indexOf('make') === 0) {
        var createName = 'create' + name.substring(4);
        bw[createName] = function(props) {
          return bw.create(fn(props));
        };
      }
    });
  }
}

// UMD auto-registration: if `bw` exists as a global, register automatically
if (typeof window !== 'undefined' && typeof window.bw !== 'undefined') {
  registerBCCL(window.bw);
} else if (typeof globalThis !== 'undefined' && typeof globalThis.bw !== 'undefined') {
  registerBCCL(globalThis.bw);
}

exports.BCCL = BCCL;
exports.bcclStyles = bcclStyles;
exports.make = make;
exports.makeAccordion = makeAccordion;
exports.makeAlert = makeAlert;
exports.makeAvatar = makeAvatar;
exports.makeBadge = makeBadge;
exports.makeBreadcrumb = makeBreadcrumb;
exports.makeButton = makeButton;
exports.makeButtonGroup = makeButtonGroup;
exports.makeCTA = makeCTA;
exports.makeCard = makeCard;
exports.makeCarousel = makeCarousel;
exports.makeCheckbox = makeCheckbox;
exports.makeChipInput = makeChipInput;
exports.makeCodeDemo = makeCodeDemo;
exports.makeCol = makeCol;
exports.makeContainer = makeContainer;
exports.makeDropdown = makeDropdown;
exports.makeFeatureGrid = makeFeatureGrid;
exports.makeFileUpload = makeFileUpload;
exports.makeForm = makeForm;
exports.makeFormGroup = makeFormGroup;
exports.makeHero = makeHero;
exports.makeInput = makeInput;
exports.makeListGroup = makeListGroup;
exports.makeMediaObject = makeMediaObject;
exports.makeModal = makeModal;
exports.makeNav = makeNav;
exports.makeNavbar = makeNavbar;
exports.makePagination = makePagination;
exports.makePopover = makePopover;
exports.makeProgress = makeProgress;
exports.makeRadio = makeRadio;
exports.makeRange = makeRange;
exports.makeRow = makeRow;
exports.makeSearchInput = makeSearchInput;
exports.makeSection = makeSection;
exports.makeSelect = makeSelect;
exports.makeSkeleton = makeSkeleton;
exports.makeSpinner = makeSpinner;
exports.makeStack = makeStack;
exports.makeStatCard = makeStatCard;
exports.makeStepper = makeStepper;
exports.makeSwitch = makeSwitch;
exports.makeTabs = makeTabs;
exports.makeTextarea = makeTextarea;
exports.makeTimeline = makeTimeline;
exports.makeToast = makeToast;
exports.makeTooltip = makeTooltip;
exports.registerBCCL = registerBCCL;
exports.variantClass = variantClass;
//# sourceMappingURL=bitwrench-bccl.cjs.map
