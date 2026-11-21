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

import { mixColor } from './bitwrench-color-utils.js';

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
    borderRadius: rd.btn
  };
  rules[_sx(scope, '.bw_bccl_btn:focus-visible')] = {
    'outline': '2px solid currentColor',
    outlineOffset: '2px',
    boxShadow: _fr(palette.primary.focus, '3px')
  };

  // Variant colors handled by palette class on component root

  // Pressed toggle button: text colour on page background, inverted, which
  // reads in both palettes (the accent fill with textOn was the low-contrast
  // case for the app that asked, #119).
  rules[_sx(scope, '.bw_bccl_btn_toggle[aria-pressed="true"]')] = {
    backgroundColor: palette.dark.base,
    borderColor: palette.dark.base,
    'color': palette.background
  };

  // Size variants (structural, reuse layout radius)
  rules[_sx(scope, '.bw_bccl_btn_lg')] = {
    'padding': '0.625rem 1.5rem',
    fontSize: '1rem',
    borderRadius: rd.btn === '50rem' ? '50rem' : (parseInt(rd.btn) + 2) + 'px'
  };
  rules[_sx(scope, '.bw_bccl_btn_sm')] = {
    'padding': '0.25rem 0.75rem',
    fontSize: '0.8125rem',
    borderRadius: rd.btn === '50rem' ? '50rem' : (Math.max(parseInt(rd.btn) - 1, 0)) + 'px'
  };

  return rules;
}

function generateAlerts(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[_sx(scope, '.bw_bccl_alert')] = {
    'padding': sp.alert,
    borderRadius: rd.alert
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
    backgroundColor: _sf(palette),
    'border': '1px solid ' + palette.light.border,
    borderRadius: rd.card,
    boxShadow: elev.sm,
    'transition': _tr('box-shadow,transform', motion, 'normal')
  };
  rules[_sx(scope, '.bw_bccl_card:hover')] = {
    boxShadow: elev.md
  };
  rules[_sx(scope, '.bw_bccl_card_hoverable')] = {
    'transition': _tr('box-shadow,transform', motion, 'slow')
  };
  rules[_sx(scope, '.bw_bccl_card_hoverable:hover')] = {
    boxShadow: elev.lg
  };
  rules[_sx(scope, '.bw_bccl_card_body')] = {
    'padding': sp.card
  };
  rules[_sx(scope, '.bw_bccl_card_header')] = {
    'padding': sp.card.split(' ').map(function(v) { return (parseFloat(v) * 0.7).toFixed(3).replace(/\.?0+$/, '') + 'rem'; }).join(' '),
    backgroundColor: palette.surfaceAlt,
    borderBottom: '1px solid ' + palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_card_footer')] = {
    backgroundColor: palette.surfaceAlt,
    borderTop: '1px solid ' + palette.light.border,
    'color': palette.textMuted
  };
  rules[_sx(scope, '.bw_bccl_card_title')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_card_subtitle')] = {
    'color': palette.textMuted
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
    borderRadius: rd.input,
    'color': palette.dark.base,
    backgroundColor: _sf(palette),
    borderColor: palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_form_control:focus')] = {
    borderColor: palette.primary.border,
    'outline': '2px solid ' + palette.primary.base,
    outlineOffset: '-1px',
    boxShadow: _fr(palette.primary.focus)
  };
  rules[_sx(scope, '.bw_bccl_form_control::placeholder')] = {
    'color': palette.textMuted
  };
  rules[_sx(scope, '.bw_bccl_form_label')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_form_text')] = {
    'color': palette.textMuted
  };
  rules[_sx(scope, '.bw_bccl_form_check_input:checked')] = {
    backgroundColor: palette.primary.base,
    borderColor: palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_form_check_input:focus')] = {
    boxShadow: _fr(palette.primary.focus)
  };
  // Validation states
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_valid')] = { borderColor: palette.success.base };
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_valid:focus')] = {
    borderColor: palette.success.base,
    boxShadow: _fr(palette.success.focus, '0.2rem')
  };
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_invalid')] = { borderColor: palette.danger.base };
  rules[_sx(scope, '.bw_bccl_form_control.bw_is_invalid:focus')] = {
    borderColor: palette.danger.base,
    boxShadow: _fr(palette.danger.focus, '0.2rem')
  };
  // Form select
  rules[_sx(scope, '.bw_bccl_form_select')] = {
    'padding': sp.input,
    borderRadius: rd.input,
    'color': palette.dark.base,
    backgroundColor: _sf(palette),
    borderColor: palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_form_select:focus')] = {
    borderColor: palette.primary.border,
    boxShadow: _fr(palette.primary.focus)
  };

  return rules;
}

function generateNavigation(scope, palette, layout) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_navbar')] = {
    backgroundColor: palette.surfaceAlt,
    borderBottomColor: palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_navbar_brand')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_navbar_nav .bw_nav_link')] = {
    'color': palette.textMuted,
    borderRadius: layout.radius.btn,
    'transition': _tr('color,background-color', layout.motion)
  };
  rules[_sx(scope, '.bw_bccl_navbar_nav .bw_nav_link:hover')] = {
    'color': palette.tertiary.text,
    backgroundColor: palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_navbar_nav .bw_nav_link.active')] = {
    'color': palette.primary.base,
    backgroundColor: palette.primary.focus,
    fontWeight: '600'
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark')] = {
    backgroundColor: palette.dark.base,
    borderBottomColor: palette.dark.hover
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_bccl_navbar_brand')] = {
    'color': palette.light.base
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_nav_link')] = {
    'color': mixColor(palette.light.base, palette.dark.base, 0.3)
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_nav_link:hover')] = {
    'color': palette.light.base
  };
  rules[_sx(scope, '.bw_bccl_navbar_dark .bw_nav_link.active')] = {
    'color': palette.light.base,
    fontWeight: '600'
  };
  rules[_sx(scope, '.bw_nav_pills .bw_nav_link.active')] = {
    'color': palette.primary.textOn,
    backgroundColor: palette.primary.base
  };
  return rules;
}

function generateTabs(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_nav_tabs')] = {
    borderBottomColor: palette.light.border
  };
  rules[_sx(scope, '.bw_nav_link')] = {
    'color': palette.textMuted,
    'transition': _tr('color,border-color,background-color', mo)
  };
  rules[_sx(scope, '.bw_nav_tabs .bw_nav_link:hover')] = {
    'color': palette.tertiary.text,
    backgroundColor: palette.surfaceAlt,
    borderBottomColor: palette.light.border
  };
  rules[_sx(scope, '.bw_nav_tabs .bw_nav_link.active')] = {
    'color': palette.primary.base,
    backgroundColor: palette.primary.focus,
    borderBottom: '2px solid ' + palette.primary.base
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
    backgroundColor: _sf(palette),
    borderColor: palette.light.border,
    'transition': _tr('color,background-color', mo)
  };
  rules[_sx(scope, 'a.bw_list_group_item:hover')] = {
    backgroundColor: palette.surfaceAlt,
    'color': palette.tertiary.text
  };
  rules[_sx(scope, '.bw_list_group_item.active')] = {
    'color': palette.primary.textOn,
    backgroundColor: palette.primary.base,
    borderColor: palette.primary.base
  };
  rules[_sx(scope, '.bw_list_group_item.disabled')] = {
    'color': palette.textFaint,
    backgroundColor: _sf(palette)
  };

  return rules;
}

function generatePagination(scope, palette, layout) {
  var rules = {}, mo = layout.motion, rd = layout.radius;
  rules[_sx(scope, '.bw_page_item:first-child .bw_page_link')] = {
    borderTopLeftRadius: rd.btn,
    borderBottomLeftRadius: rd.btn
  };
  rules[_sx(scope, '.bw_page_item:last-child .bw_page_link')] = {
    borderTopRightRadius: rd.btn,
    borderBottomRightRadius: rd.btn
  };
  rules[_sx(scope, '.bw_page_link')] = {
    'color': palette.primary.text,
    backgroundColor: _sf(palette),
    borderColor: palette.light.border,
    'transition': _tr('color,background-color', mo)
  };
  rules[_sx(scope, '.bw_page_link:hover')] = {
    'color': palette.primary.text,
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.light.border
  };
  rules[_sx(scope, '.bw_page_link:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    outlineOffset: '-2px'
  };
  rules[_sx(scope, '.bw_page_item.bw_active .bw_page_link')] = {
    'color': palette.primary.textOn,
    backgroundColor: palette.primary.base,
    borderColor: palette.primary.base
  };
  rules[_sx(scope, '.bw_page_item.bw_disabled .bw_page_link')] = {
    'color': palette.textFaint,
    backgroundColor: _sf(palette),
    borderColor: palette.light.border
  };
  return rules;
}

function generateProgress(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_progress')] = {
    backgroundColor: palette.surfaceAlt,
    borderRadius: rd.badge,
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,.1)'
  };
  rules[_sx(scope, '.bw_bccl_progress_bar')] = {
    'color': palette.primary.textOn,
    backgroundColor: palette.primary.base,
    borderRadius: 'inherit',
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.15)'
  };
  // Variant progress bar colors handled by palette class
  return rules;
}

// generateHero: removed — palette class with .bw_bccl_hero override handles variants

// generateUtilityColors: removed — palette classes replace utility colors

function generateBreadcrumbThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_bccl_breadcrumb')] = {
    backgroundColor: palette.surfaceAlt,
    'padding': '0.625rem 1rem',
    borderRadius: layout.radius.btn
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item + .bw_bccl_breadcrumb_item::before')] = {
    'color': palette.textFaint
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item a')] = {
    'color': palette.tertiary.text,
    'transition': _tr('color', mo)
  };
  rules[_sx(scope, '.bw_bccl_breadcrumb_item a:hover')] = {
    'color': palette.tertiary.text,
    textDecoration: 'underline'
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
    boxShadow: _fr(palette.primary.focus)
  };
  return rules;
}

function generateSectionsThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_section_subtitle')] = {
    'color': palette.textMuted
  };
  rules[_sx(scope, '.bw_feature_description')] = {
    'color': palette.textMuted
  };
  rules[_sx(scope, '.bw_cta_description')] = {
    'color': palette.textMuted
  };
  return rules;
}

function generateAccordionThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_accordion_item')] = {
    backgroundColor: _sf(palette),
    borderColor: palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_accordion_item:first-child')] = {
    borderTopLeftRadius: rd.card,
    borderTopRightRadius: rd.card
  };
  rules[_sx(scope, '.bw_bccl_accordion_item:last-child')] = {
    borderBottomLeftRadius: rd.card,
    borderBottomRightRadius: rd.card
  };
  rules[_sx(scope, '.bw_bccl_accordion_button')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:not(.bw_collapsed)')] = {
    'color': palette.primary.darkText,
    backgroundColor: palette.primary.light,
    borderLeft: '3px solid ' + palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:hover')] = {
    backgroundColor: palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:not(.bw_collapsed):hover')] = {
    backgroundColor: palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_bccl_accordion_button:focus-visible')] = {
    boxShadow: _fr(palette.primary.focus, '0.2rem')
  };
  rules[_sx(scope, '.bw_bccl_accordion_body')] = {
    borderTop: '1px solid ' + palette.light.border,
    backgroundColor: palette.surfaceAlt
  };
  return rules;
}

function generateCarouselThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_carousel')] = {
    backgroundColor: palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_carousel_indicator.active')] = {
    backgroundColor: palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_carousel_control')] = {
    backgroundColor: palette.dark.base,
    'color': palette.dark.textOn,
    'transition': 'background-color 0.15s ease-out'
  };
  rules[_sx(scope, '.bw_bccl_carousel_control:hover')] = {
    backgroundColor: palette.dark.hover
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
    backgroundColor: _sf(palette),
    borderColor: palette.light.border,
    borderRadius: rd.card,
    boxShadow: layout.elevation.lg
  };
  rules[_sx(scope, '.bw_bccl_modal_header')] = {
    borderBottomColor: palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_modal_footer')] = {
    borderTopColor: palette.light.border
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
    backgroundColor: _sf(palette),
    borderColor: palette.light.border,
    borderRadius: rd.card,
    boxShadow: layout.elevation.lg
  };
  rules[_sx(scope, '.bw_bccl_toast_header')] = {
    borderBottomColor: palette.light.border
  };
  // Variant toast borders handled by palette class
  return rules;
}

function generateDropdownThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_bccl_dropdown_menu')] = {
    backgroundColor: _sf(palette),
    borderColor: palette.light.border,
    borderRadius: rd.card,
    boxShadow: layout.elevation.md
  };
  rules[_sx(scope, '.bw_bccl_dropdown_item')] = {
    'color': palette.dark.base,
    'transition': _tr('background-color', layout.motion)
  };
  rules[_sx(scope, '.bw_bccl_dropdown_item:hover')] = {
    'color': palette.dark.hover,
    backgroundColor: palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_dropdown_item.disabled')] = {
    'color': palette.textFaint
  };
  rules[_sx(scope, '.bw_bccl_dropdown_divider')] = {
    borderTopColor: palette.light.border
  };
  return rules;
}

function generateSwitchThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input')] = {
    backgroundColor: palette.secondary.base,
    borderColor: palette.secondary.base
  };
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input:checked')] = {
    backgroundColor: palette.primary.base,
    borderColor: palette.primary.base
  };
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input:focus')] = {
    boxShadow: _fr(palette.primary.focus)
  };
  rules[_sx(scope, '.bw_bccl_form_switch .bw_switch_input:focus-visible')] = {
    boxShadow: _fr(palette.primary.focus),
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
    backgroundColor: _sf(palette),
    'color': palette.dark.base,
    'border': '1px solid ' + palette.light.border,
    borderRadius: rd.card,
    boxShadow: el.sm,
    'transition': _tr('box-shadow,transform', mo)
  };
  rules[_sx(scope, '.bw_stat_card:hover')] = { boxShadow: el.md };
  // Variant border colors handled by palette class
  rules[_sx(scope, '.bw_stat_change_up')] = { 'color': palette.success.text };
  rules[_sx(scope, '.bw_stat_change_down')] = { 'color': palette.danger.text };
  return rules;
}

function generateTimelineThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_bccl_timeline::before')] = { backgroundColor: palette.light.border };
  // Variant marker colors handled by palette class
  rules[_sx(scope, '.bw_bccl_timeline_date')] = { 'color': palette.textMuted };
  return rules;
}

function generateStepperThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_step_indicator')] = {
    backgroundColor: palette.surfaceAlt,
    'border': '2px solid ' + palette.light.border,
    'color': palette.textMuted
  };
  rules[_sx(scope, '.bw_step + .bw_step::before')] = { backgroundColor: palette.light.border };
  rules[_sx(scope, '.bw_step_active .bw_step_indicator')] = {
    backgroundColor: palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_step_active .bw_step_label')] = {
    'color': palette.dark.base,
    fontWeight: '600'
  };
  rules[_sx(scope, '.bw_step_completed .bw_step_indicator')] = {
    backgroundColor: palette.tertiary.base,
    'color': palette.tertiary.textOn
  };
  rules[_sx(scope, '.bw_step_completed .bw_step_label')] = { 'color': palette.tertiary.text };
  rules[_sx(scope, '.bw_step_completed + .bw_step::before')] = { backgroundColor: palette.tertiary.base };
  return rules;
}

function generateChipInputThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_chip_input')] = {
    borderColor: palette.light.border,
    backgroundColor: _sf(palette),
    'color': palette.dark.base,
    borderRadius: rd.input
  };
  rules[_sx(scope, '.bw_chip_input:focus-within')] = {
    borderColor: palette.primary.base,
    boxShadow: _fr(palette.primary.focus, '0.2rem')
  };
  rules[_sx(scope, '.bw_chip')] = {
    backgroundColor: palette.surfaceAlt,
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_chip_remove:hover')] = {
    'color': palette.danger.darkText,
    backgroundColor: palette.danger.light
  };
  return rules;
}

function generateFileUploadThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_file_upload')] = {
    borderColor: palette.light.border,
    backgroundColor: palette.surfaceAlt,
    'transition': _tr('border-color,background-color', mo)
  };
  rules[_sx(scope, '.bw_file_upload:hover')] = {
    borderColor: palette.primary.base,
    backgroundColor: palette.primary.light
  };
  rules[_sx(scope, '.bw_file_upload:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    outlineOffset: '2px'
  };
  rules[_sx(scope, '.bw_file_upload.bw_file_upload_active')] = {
    borderColor: palette.primary.base,
    backgroundColor: palette.primary.light,
    borderStyle: 'solid'
  };
  return rules;
}

function generateRangeThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_range')] = { backgroundColor: palette.light.border };
  rules[_sx(scope, '.bw_range::-webkit-slider-thumb')] = {
    backgroundColor: palette.primary.base,
    borderColor: _sf(palette),
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    'transition': 'background-color 0.15s ease-out, transform 0.15s ease-out'
  };
  rules[_sx(scope, '.bw_range::-moz-range-thumb')] = {
    backgroundColor: palette.primary.base,
    borderColor: _sf(palette),
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  };
  return rules;
}

function generateTooltipThemed(scope, palette, layout) {
  var rules = {}, sp = layout.spacing, rd = layout.radius, el = layout.elevation, mo = layout.motion;
  rules[_sx(scope, '.bw_bccl_tooltip')] = {
    backgroundColor: palette.dark.base, 'color': palette.dark.textOn,
    'padding': sp.input, borderRadius: rd.badge, boxShadow: el.md,
    'transition': _tr('opacity,transform', mo)
  };
  return rules;
}

function generatePopoverThemed(scope, palette, layout) {
  var rules = {}, sp = layout.spacing, rd = layout.radius, el = layout.elevation, mo = layout.motion;
  rules[_sx(scope, '.bw_popover')] = {
    backgroundColor: _sf(palette), 'color': palette.dark.base,
    'border': '1px solid ' + palette.light.border, borderRadius: rd.card, boxShadow: el.lg,
    'transition': _tr('opacity,transform', mo)
  };
  rules[_sx(scope, '.bw_popover_header')] = {
    backgroundColor: palette.surfaceAlt, borderBottom: '1px solid ' + palette.light.border,
    'padding': sp.input
  };
  rules[_sx(scope, '.bw_popover_body')] = { 'padding': sp.card };
  return rules;
}

function generateSearchThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_search_input')] = {
    backgroundColor: _sf(palette),
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
    backgroundColor: _sf(palette),
    'color': palette.dark.base,
    borderRadius: rd.card
  };
  rules[_sx(scope, '.bw_code_copy_btn_copied')] = {
    'background': palette.success.base,
    'color': palette.success.textOn,
    borderColor: palette.success.base
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
  rules[_sx(scope, '.bw_nav_pills .bw_nav_link')] = { borderRadius: rd.btn };
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
      backgroundColor: s.light,
      'color': s.darkText,
      borderColor: s.border
    };

    // Toast: inherit bg, left border accent
    rules[_sx(scope, '.bw_bccl_toast.bw_' + k)] = {
      backgroundColor: 'inherit',
      'color': 'inherit',
      borderLeft: '4px solid ' + s.base
    };

    // Stat card: inherit bg, left border accent
    rules[_sx(scope, '.bw_stat_card.bw_' + k)] = {
      backgroundColor: 'inherit',
      'color': 'inherit',
      borderLeftColor: s.base
    };

    // Card accent: left border accent, inherit bg
    rules[_sx(scope, '.bw_bccl_card.bw_' + k)] = {
      backgroundColor: 'inherit',
      'color': 'inherit',
      borderLeft: '4px solid ' + s.base
    };

    // Timeline marker: colored dot
    rules[_sx(scope, '.bw_bccl_timeline_marker.bw_' + k)] = {
      boxShadow: '0 0 0 2px ' + s.base
    };

    // Spinner: set color, re-apply border pattern so the root palette class
    // border-color doesn't fill in the transparent gap that makes it spin.
    // Also neutralize hover/active which would override border-right-color.
    rules[_sx(scope, '.bw_spinner_border.bw_' + k)] = {
      backgroundColor: 'transparent',
      'color': s.base,
      borderColor: s.base,
      borderRightColor: 'transparent'
    };
    rules[_sx(scope, '.bw_spinner_border.bw_' + k + ':hover')] = {
      backgroundColor: 'transparent',
      borderColor: s.base,
      borderRightColor: 'transparent'
    };
    rules[_sx(scope, '.bw_spinner_grow.bw_' + k)] = {
      backgroundColor: s.base,
      'color': s.base
    };

    // Outline button: transparent bg, colored border+text, solid on hover
    rules[_sx(scope, '.bw_bccl_btn_outline.bw_' + k)] = {
      backgroundColor: 'transparent',
      'color': s.base,
      borderColor: s.base
    };
    rules[_sx(scope, '.bw_bccl_btn_outline.bw_' + k + ':hover')] = {
      backgroundColor: s.base,
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
export function bcclThemed(scope, palette, layout, h) {
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
      'display': 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '500', lineHeight: '1.5', textAlign: 'center',
      textDecoration: 'none', verticalAlign: 'middle', 'cursor': 'pointer',
      userSelect: 'none', 'border': '1px solid transparent',
      fontSize: '0.875rem', fontFamily: 'inherit', 'gap': '0.5rem'
    },
    '.bw_bccl_btn:hover': { textDecoration: 'none', 'transform': 'translateY(-1px)' },
    '.bw_bccl_btn:active': { 'transform': 'translateY(0)' },
    '.bw_bccl_btn:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '2px' },
    '.bw_bccl_btn:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed', pointerEvents: 'none' },
    '.bw_bccl_btn_block': { 'display': 'block', 'width': '100%' }
  },

  // ---- Cards ----
  cards: {
    '.bw_bccl_card': {
      'position': 'relative', 'display': 'flex', flexDirection: 'column',
      minWidth: '0', 'height': '100%', wordWrap: 'break-word',
      backgroundClip: 'border-box', marginBottom: '1.5rem', 'overflow': 'hidden'
    },
    '.bw_bccl_card_body': { 'flex': '1 1 auto' },
    '.bw_bccl_card_body > *:last-child': { marginBottom: '0' },
    '.bw_bccl_card_title': { marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '600', lineHeight: '1.3' },
    '.bw_bccl_card_text': { marginBottom: '0', fontSize: '0.9375rem', lineHeight: '1.6' },
    '.bw_bccl_card_header': { marginBottom: '0', fontWeight: '600', fontSize: '0.875rem' },
    '.bw_bccl_card_footer': { fontSize: '0.875rem' },
    '.bw_bccl_card_hoverable': {},
    '.bw_bccl_card_hoverable:hover': { 'transform': 'translateY(-4px)' },
    '.bw_bccl_card_img_top': { 'width': '100%' },
    '.bw_bccl_card_img_bottom': { 'width': '100%' },
    '.bw_bccl_card_img_left': { 'width': '40%', objectFit: 'cover' },
    '.bw_bccl_card_img_right': { 'width': '40%', objectFit: 'cover' },
    '.bw_bccl_card_subtitle, .card-subtitle': { marginTop: '-0.25rem', marginBottom: '0.5rem', fontSize: '0.875rem' }
  },

  // ---- Forms ----
  forms: {
    '.bw_bccl_form_control': {
      'display': 'block', 'width': '100%',
      fontSize: '0.9375rem', fontWeight: '400', lineHeight: '1.5',
      backgroundClip: 'padding-box', 'appearance': 'none',
      'border': '1px solid transparent', fontFamily: 'inherit',
      'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out'
    },
    '.bw_bccl_form_control:focus': { 'outline': '2px solid currentColor', outlineOffset: '-1px' },
    '.bw_bccl_form_control::placeholder': { 'opacity': '1' },
    '.bw_bccl_form_label': { 'display': 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: '600' },
    '.bw_bccl_form_group': { marginBottom: '1.25rem' },
    '.bw_bccl_form_text': { marginTop: '0.25rem', fontSize: '0.8125rem' },
    'select.bw_bccl_form_control': {
      paddingRight: '2.25rem',
      backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center',
      backgroundSize: '16px 12px'
    },
    'textarea.bw_bccl_form_control': { minHeight: '5rem', 'resize': 'vertical' },
    '.bw_valid_feedback': { 'display': 'block', fontSize: '0.875rem', marginTop: '0.25rem' },
    '.bw_invalid_feedback': { 'display': 'block', fontSize: '0.875rem', marginTop: '0.25rem' }
  },

  // ---- Form checks ----
  formChecks: {
    '.bw_bccl_form_check': { 'display': 'flex', alignItems: 'center', 'gap': '0.5rem', minHeight: '1.5rem', marginBottom: '0.25rem' },
    '.bw_bccl_form_check_input': { 'width': '1rem', 'height': '1rem', 'margin': '0', 'cursor': 'pointer', flexShrink: '0', borderRadius: '0.25rem', 'appearance': 'auto' },
    '.bw_bccl_form_check_input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' },
    '.bw_bccl_form_check_label': { 'cursor': 'pointer', userSelect: 'none', fontSize: '0.9375rem' }
  },

  // ---- Navigation ----
  navigation: {
    '.bw_bccl_navbar': {
      'position': 'relative', 'display': 'flex', flexWrap: 'wrap',
      alignItems: 'center', justifyContent: 'space-between', 'padding': '0.5rem 1.5rem'
    },
    '.bw_bccl_navbar > .bw_bccl_container, .bw_bccl_navbar > .bw_container': { 'display': 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
    '.bw_bccl_navbar_brand': {
      'display': 'inline-flex', alignItems: 'center', 'gap': '0.5rem',
      paddingTop: '0.25rem', paddingBottom: '0.25rem', marginRight: '1.5rem',
      fontSize: '1.125rem', fontWeight: '600', lineHeight: 'inherit',
      whiteSpace: 'nowrap', textDecoration: 'none'
    },
    '.bw_bccl_navbar_nav': {
      'display': 'flex', flexDirection: 'row', paddingLeft: '0',
      marginBottom: '0', listStyle: 'none', 'gap': '0.25rem'
    },
    '.bw_bccl_navbar_nav .bw_nav_link': {
      'display': 'block', textDecoration: 'none',
      fontSize: '0.875rem', fontWeight: '500'
    }
  },

  // ---- Alerts ----
  alerts: {
    '.bw_bccl_alert': {
      'position': 'relative', marginBottom: '1rem',
      'border': '1px solid transparent',
      fontSize: '0.9375rem', lineHeight: '1.6'
    },
    '.bw_bccl_alert_heading, .alert-heading': { 'color': 'inherit' },
    '.bw_bccl_alert_link, .alert-link': { fontWeight: '700' },
    '.bw_bccl_alert_dismissible': { paddingRight: '3rem' },
    '.bw_bccl_alert_dismissible .btn-close': { 'position': 'absolute', 'top': '0', 'right': '0', zIndex: '2', 'padding': '1.25rem 1rem' }
  },

  // ---- Badges ----
  badges: {
    '.bw_bccl_badge': {
      'display': 'inline-block', fontSize: '0.875rem',
      fontWeight: '600', lineHeight: '1.3', textAlign: 'center',
      whiteSpace: 'nowrap', verticalAlign: 'baseline',
      'padding': '0.35rem 0.65rem', borderRadius: '0.25rem'
    },
    '.bw_bccl_badge:empty': { 'display': 'none' },
    '.bw_bccl_badge_sm': { fontSize: '0.75rem', 'padding': '0.25rem 0.5rem' },
    '.bw_bccl_badge_lg': { fontSize: '1rem', 'padding': '0.5rem 0.875rem' },
    '.bw_bccl_badge_pill': { borderRadius: '50rem' },
    '.btn .badge': { 'position': 'relative', 'top': '-1px' }
  },

  // ---- Progress ----
  progress: {
    '.bw_bccl_progress': { 'display': 'flex', 'height': '1.25rem', 'overflow': 'hidden', fontSize: '.875rem' },
    '.bw_bccl_progress_bar': {
      'display': 'flex', flexDirection: 'column', justifyContent: 'center',
      'overflow': 'hidden', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600'
    },
    '.bw_bccl_progress_bar_striped': {
      backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
      backgroundSize: '1rem 1rem'
    },
    '.bw_bccl_progress_bar_animated': { 'animation': 'progress-bar-stripes 1s linear infinite' },
    '@keyframes progress-bar-stripes': { '0%': { backgroundPositionX: '1rem' } }
  },

  // ---- Tabs ----
  tabs: {
    '.bw_nav': { 'display': 'flex', flexWrap: 'wrap', paddingLeft: '0', marginBottom: '0', listStyle: 'none', 'gap': '0' },
    '.bw_nav_item': { 'display': 'block' },
    '.bw_nav_tabs .bw_nav_item': { marginBottom: '-2px' },
    '.bw_nav_link': {
      'display': 'block', fontSize: '0.875rem', fontWeight: '500',
      'padding': '0.625rem 1rem',
      textDecoration: 'none', 'cursor': 'pointer',
      'border': 'none', 'background': 'transparent', fontFamily: 'inherit'
    },
    '.bw_nav_link:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '-2px' },
    '.bw_nav_tabs .bw_nav_link': { 'border': 'none', borderBottom: '2px solid transparent', borderRadius: '0', backgroundColor: 'transparent' },
    '.bw_nav_vertical': { flexDirection: 'column' },
    '.bw_bccl_tab_content': { 'padding': '1.25rem 0' },
    '.bw_bccl_tab_pane': { 'display': 'none' },
    '.bw_bccl_tab_pane.active': { 'display': 'block' },
    '.bw_nav_scrollable': { flexWrap: 'nowrap', overflowX: 'auto', '-webkit-overflow-scrolling': 'touch', scrollbarWidth: 'none' },
    '.bw_nav_scrollable::-webkit-scrollbar': { 'display': 'none' },
    '.bw_nav_scrollable .bw_nav_link': { whiteSpace: 'nowrap' }
  },

  // ---- List groups ----
  listGroups: {
    '.bw_list_group': { 'display': 'flex', flexDirection: 'column', paddingLeft: '0', marginBottom: '0' },
    '.bw_list_group_item': { 'position': 'relative', 'display': 'block', textDecoration: 'none', fontSize: '0.9375rem' },
    '.bw_list_group_item:first-child': { borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' },
    '.bw_list_group_item:last-child': { borderBottomRightRadius: 'inherit', borderBottomLeftRadius: 'inherit' },
    '.bw_list_group_item + .bw_list_group_item': { borderTopWidth: '0' },
    '.bw_list_group_item.disabled': { pointerEvents: 'none' },
    'a.bw_list_group_item': { 'cursor': 'pointer' },
    'a.bw_list_group_item:focus-visible, .bw_list_group_item:focus-visible': { zIndex: '2', 'outline': '2px solid currentColor', outlineOffset: '-2px' },
    '.bw_list_group_flush': { borderRadius: '0' },
    '.bw_list_group_flush > .bw_list_group_item': { borderWidth: '0 0 1px', borderRadius: '0' },
    '.bw_list_group_flush > .bw_list_group_item:last-child': { borderBottomWidth: '0' }
  },

  // ---- Pagination ----
  pagination: {
    '.bw_bccl_pagination': { 'display': 'flex', paddingLeft: '0', listStyle: 'none', marginBottom: '0' },
    '.bw_page_item': { 'display': 'list-item', listStyle: 'none' },
    '.bw_page_link': {
      'position': 'relative', 'display': 'block', 'padding': '0.375rem 0.75rem',
      marginLeft: '-1px', lineHeight: '1.25', textDecoration: 'none',
      'border': '1px solid transparent', 'cursor': 'pointer',
      fontFamily: 'inherit', fontSize: 'inherit', 'background': 'none'
    },
    '.bw_page_item:first-child .bw_page_link': { marginLeft: '0' },
    // makePagination({ size }) -- same steps as the button sizes
    '.bw_bccl_pagination_sm .bw_page_link': { 'padding': '0.25rem 0.5rem', fontSize: '0.8125rem' },
    '.bw_bccl_pagination_lg .bw_page_link': { 'padding': '0.625rem 1.25rem', fontSize: '1.125rem' },
    '.bw_page_link:focus-visible': { zIndex: '3', 'outline': '2px solid currentColor', outlineOffset: '-2px' }
  },

  // ---- Breadcrumb ----
  breadcrumb: {
    '.bw_bccl_breadcrumb': { 'display': 'flex', flexWrap: 'wrap', 'padding': '0 0', marginBottom: '1rem', listStyle: 'none' },
    // The <ol> inside the <nav>. Without this it renders as a numbered list,
    // because the flex/list-style rules above land on the wrapping <nav>.
    '.bw_bccl_breadcrumb_list': {
      'display': 'flex', flexWrap: 'wrap', listStyle: 'none',
      'margin': '0', 'padding': '0'
    },
    '.bw_bccl_breadcrumb_item': { 'display': 'flex' },
    '.bw_bccl_breadcrumb_item + .bw_bccl_breadcrumb_item': { paddingLeft: '0.5rem' },
    '.bw_bccl_breadcrumb_item + .bw_bccl_breadcrumb_item::before': { 'float': 'left', paddingRight: '0.5rem', 'content': '"/"' },
    '.bw_bccl_breadcrumb_item a': { textDecoration: 'none' },
    '.bw_bccl_breadcrumb_item.active': { fontWeight: '500' }
  },

  // ---- Hero ----
  hero: {
    '.bw_bccl_hero': { 'position': 'relative', 'overflow': 'hidden' },
    '.bw_bccl_hero_overlay': { 'position': 'absolute', 'top': '0', 'left': '0', 'right': '0', 'bottom': '0', zIndex: '1' },
    '.bw_bccl_hero_content': { 'position': 'relative', zIndex: '2' },
    '.bw_bccl_hero_title': { fontWeight: '300', letterSpacing: '-0.05rem', 'color': 'inherit' },
    '.bw_bccl_hero_subtitle': { 'color': 'inherit' },
    '.bw_bccl_hero_actions': { 'display': 'flex', 'gap': '1rem', justifyContent: 'center', flexWrap: 'wrap' }
  },

  // ---- Features ----
  features: {
    '.bw_feature': { 'padding': '1rem' },
    '.bw_feature_icon': { 'display': 'inline-block', marginBottom: '1rem' },
    '.bw_feature_title': { marginBottom: '0.5rem' },
    '.bw_feature_grid': { 'width': '100%' }
  },

  // ---- Sections ----
  sections: {
    '.bw_section': { 'position': 'relative' },
    '.bw_section_header': { marginBottom: '3rem' },
    '.bw_section_title': { marginBottom: '1rem', fontWeight: '300', fontSize: 'calc(1.325rem + .9vw)' }
  },

  // ---- CTA ----
  cta: {
    '.bw_cta': { 'position': 'relative' },
    '.bw_cta_content': { maxWidth: '48rem', 'margin': '0 auto' },
    '.bw_cta_title': { fontWeight: '300' },
    '.bw_cta_actions': { 'display': 'flex', 'gap': '1rem', justifyContent: 'center', flexWrap: 'wrap' }
  },

  // ---- Spinner ----
  spinner: {
    '.bw_spinner_border': {
      'display': 'inline-block', 'width': '2rem', 'height': '2rem',
      verticalAlign: '-0.125em', 'border': '0.25em solid currentcolor',
      borderRightColor: 'transparent', borderRadius: '50%',
      'animation': 'bw_spinner_border 0.75s linear infinite'
    },
    '.bw_spinner_border_sm': { 'width': '1rem', 'height': '1rem', borderWidth: '0.2em' },
    '.bw_spinner_border_lg': { 'width': '3rem', 'height': '3rem', borderWidth: '0.3em' },
    '.bw_spinner_border_md': { 'width': '2rem', 'height': '2rem', borderWidth: '0.25em' },
    '.bw_spinner_grow': {
      'display': 'inline-block', 'width': '2rem', 'height': '2rem',
      verticalAlign: '-0.125em', borderRadius: '50%', 'opacity': '0',
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
      whiteSpace: 'nowrap', 'border': '0'
    }
  },

  // ---- Close button ----
  closeButton: {
    '.bw_close': {
      'display': 'inline-flex', alignItems: 'center', justifyContent: 'center',
      'width': '1.5rem', 'height': '1.5rem', 'padding': '0',
      fontSize: '1.25rem', fontWeight: '700', lineHeight: '1',
      'background': 'transparent', 'border': '0', borderRadius: '0.25rem', 'cursor': 'pointer',
      'transition': 'opacity 0.15s ease-out'
    },
    '.bw_close:hover': { 'opacity': '0.75' },
    '.bw_close:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '2px' }
  },

  // ---- Code demo ----
  codeDemo: {
    '.bw_code_demo': { marginBottom: '2rem' },
    '.bw_code_pre': { 'margin': '0', 'border': 'none', overflowX: 'auto', maxWidth: '100%' },
    '.bw_code_block': {
      'display': 'block', 'padding': '1.25rem',
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      fontSize: '0.8125rem', lineHeight: '1.6'
    },
    '.bw_code_copy_btn': {
      'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem',
      'padding': '0.25rem 0.625rem', fontSize: '0.6875rem',
      'cursor': 'pointer', fontFamily: 'inherit'
    },
    '.bw_copy_btn': {
      'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem',
      'padding': '0.25rem 0.625rem', fontSize: '0.6875rem',
      'cursor': 'pointer', fontFamily: 'inherit'
    }
  },

  // ---- Button group ----
  buttonGroup: {
    '.bw_bccl_btn_group, .bw_bccl_btn_group_vertical': { 'position': 'relative', 'display': 'inline-flex', verticalAlign: 'middle' },
    '.bw_bccl_btn_group > .bw_bccl_btn, .bw_bccl_btn_group_vertical > .bw_bccl_btn': { 'position': 'relative', 'flex': '1 1 auto', borderRadius: '0', marginLeft: '-1px' },
    '.bw_bccl_btn_group > .bw_bccl_btn:first-child': { marginLeft: '0' },
    '.bw_bccl_btn_group > .bw_bccl_btn:last-child': {},
    '.bw_bccl_btn_group_lg > .bw_bccl_btn': { 'padding': '0.625rem 1.5rem', fontSize: '1rem' },
    '.bw_bccl_btn_group_sm > .bw_bccl_btn': { 'padding': '0.25rem 0.75rem', fontSize: '0.8125rem' },
    '.bw_bccl_btn_group_vertical': { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' },
    '.bw_bccl_btn_group_vertical > .bw_bccl_btn': { 'width': '100%', marginLeft: '0', marginTop: '-1px' },
    '.bw_bccl_btn_group_vertical > .bw_bccl_btn:first-child': { marginTop: '0' },
    '.bw_bccl_btn_group_vertical > .bw_bccl_btn:last-child': {}
  },

  // ---- Accordion ----
  accordion: {
    '.bw_bccl_accordion': { 'overflow': 'hidden' },
    '.bw_bccl_accordion_item': { 'border': '1px solid transparent' },
    '.bw_bccl_accordion_item + .bw_bccl_accordion_item': { borderTop: '0' },
    '.bw_bccl_accordion_header': { 'margin': '0' },
    '.bw_bccl_accordion_button': {
      'position': 'relative', 'display': 'flex', alignItems: 'center', 'width': '100%',
      'padding': '0.875rem 1.25rem',
      fontSize: '1rem', fontWeight: '500', textAlign: 'left',
      backgroundColor: 'transparent', 'border': '0', overflowAnchor: 'none', 'cursor': 'pointer',
      fontFamily: 'inherit'
    },
    '.bw_bccl_accordion_button::after': {
      flexShrink: '0', 'width': '1.25rem', 'height': '1.25rem', marginLeft: 'auto',
      'content': '""',
      backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23212529'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e\")",
      backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem',
      'transition': 'transform 0.2s ease-out'
    },
    '.bw_bccl_accordion_button:not(.bw_collapsed)::after': { 'transform': 'rotate(-180deg)' },
    '.bw_bccl_accordion_body': { 'padding': '1rem 1.25rem' },
    '.bw_bccl_accordion_collapse': { maxHeight: '0', 'overflow': 'hidden', 'transition': 'max-height 0.3s ease' },
    '.bw_bccl_accordion_collapse.bw_collapse_show': { maxHeight: 'none' }
  },

  // ---- Carousel ----
  carousel: {
    '.bw_bccl_carousel': { 'position': 'relative', 'overflow': 'hidden' },
    '.bw_bccl_carousel_track': { 'display': 'flex', 'height': '100%' },
    '.bw_bccl_carousel_slide': {
      minWidth: '100%', flexShrink: '0', 'overflow': 'hidden',
      'position': 'relative', 'display': 'flex', alignItems: 'center', justifyContent: 'center'
    },
    '.bw_bccl_carousel_slide img': { 'width': '100%', 'height': '100%', objectFit: 'cover' },
    '.bw_bccl_carousel_caption': { 'position': 'absolute', 'bottom': '0', 'left': '0', 'right': '0', 'padding': '0.75rem 1rem', fontSize: '0.875rem' },
    '.bw_bccl_carousel_control': {
      'position': 'absolute', 'top': '50%', 'transform': 'translateY(-50%)',
      'width': '40px', 'height': '40px', 'border': 'none', borderRadius: '50%',
      'cursor': 'pointer', 'display': 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '2', 'padding': '0'
    },
    '.bw_bccl_carousel_control img': { 'width': '20px', 'height': '20px', pointerEvents: 'none' },
    '.bw_bccl_carousel_control:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '2px' },
    '.bw_bccl_carousel_control_prev': { 'left': '10px' },
    '.bw_bccl_carousel_control_next': { 'right': '10px' },
    '.bw_bccl_carousel_indicators': {
      'position': 'absolute', 'bottom': '12px', 'left': '50%', 'transform': 'translateX(-50%)',
      'display': 'flex', 'gap': '6px', zIndex: '2'
    },
    '.bw_bccl_carousel_indicator': {
      'width': '10px', 'height': '10px', borderRadius: '50%', 'border': '2px solid transparent',
      'padding': '0', 'cursor': 'pointer'
    },
    '.bw_bccl_carousel_indicator:hover': { 'opacity': '0.8' }
  },

  // ---- Modal ----
  modal: {
    '.bw_bccl_modal': {
      'display': 'flex', alignItems: 'center', justifyContent: 'center',
      'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%', 'height': '100%',
      zIndex: '1050', overflowX: 'hidden', overflowY: 'auto',
      'opacity': '0', 'visibility': 'hidden', pointerEvents: 'none',
      'transition': 'opacity 0.2s ease-out, visibility 0.2s ease-out'
    },
    '.bw_bccl_modal.bw_bccl_modal_show': { 'opacity': '1', 'visibility': 'visible', pointerEvents: 'auto' },
    '.bw_bccl_modal_dialog': {
      'position': 'relative', 'width': 'calc(100% - 1rem)', maxWidth: '500px', 'margin': '1.75rem auto',
      pointerEvents: 'none', 'transform': 'translateY(-16px)',
      'transition': 'transform 0.2s ease-out'
    },
    '.bw_bccl_modal.bw_bccl_modal_show .bw_bccl_modal_dialog': { 'transform': 'translateY(0)' },
    '.bw_bccl_modal_sm': { maxWidth: '300px' },
    '.bw_bccl_modal_lg': { maxWidth: '800px' },
    '.bw_bccl_modal_xl': { maxWidth: '1140px' },
    '.bw_bccl_modal_content': {
      'position': 'relative', 'display': 'flex', flexDirection: 'column', pointerEvents: 'auto',
      backgroundClip: 'padding-box', 'border': '1px solid transparent', 'outline': '0'
    },
    '.bw_bccl_modal_header': { 'display': 'flex', alignItems: 'center', justifyContent: 'space-between', 'padding': '1rem 1.25rem', borderBottom: '1px solid transparent' },
    '.bw_bccl_modal_title': { 'margin': '0', fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.3' },
    '.bw_bccl_modal_body': { 'position': 'relative', 'flex': '1 1 auto', 'padding': '1rem 1.25rem' },
    '.bw_bccl_modal_footer': { 'display': 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', 'gap': '0.5rem', 'padding': '0.75rem 1.25rem', borderTop: '1px solid transparent' }
  },

  // ---- Toast ----
  toast: {
    '.bw_bccl_toast_container': {
      'position': 'fixed', zIndex: '1080', pointerEvents: 'none',
      'display': 'flex', flexDirection: 'column', 'gap': '0.5rem', 'padding': '1rem'
    },
    '.bw_bccl_toast_container.bw_bccl_toast_top_right': { 'top': '0', 'right': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_top_left': { 'top': '0', 'left': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_bottom_right': { 'bottom': '0', 'right': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_bottom_left': { 'bottom': '0', 'left': '0' },
    '.bw_bccl_toast_container.bw_bccl_toast_top_center': { 'top': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw_bccl_toast_container.bw_bccl_toast_bottom_center': { 'bottom': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw_bccl_toast': {
      pointerEvents: 'auto', 'width': '350px', maxWidth: 'calc(100vw - 2rem)', backgroundClip: 'padding-box',
      'opacity': '0', 'transform': 'translateY(-8px)',
      'transition': 'opacity 0.2s ease-out, transform 0.2s ease-out'
    },
    '.bw_bccl_toast.bw_bccl_toast_show': { 'opacity': '1', 'transform': 'translateY(0)' },
    '.bw_bccl_toast.bw_bccl_toast_hiding': { 'opacity': '0', 'transform': 'translateY(-8px)' },
    '.bw_bccl_toast_header': { 'display': 'flex', alignItems: 'center', justifyContent: 'space-between', 'padding': '0.5rem 0.75rem', fontSize: '0.875rem', borderBottom: '1px solid transparent' },
    '.bw_bccl_toast_body': { 'padding': '0.5rem 0.75rem', fontSize: '0.9375rem' }
  },

  // ---- Dropdown ----
  dropdown: {
    '.bw_bccl_dropdown': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_bccl_dropdown_toggle::after': {
      'display': 'inline-block', marginLeft: '0.255em', verticalAlign: '0.255em',
      'content': '""', borderTop: '0.3em solid', borderRight: '0.3em solid transparent',
      borderBottom: '0', borderLeft: '0.3em solid transparent'
    },
    '.bw_bccl_dropdown_menu': {
      'position': 'absolute', 'top': '100%', 'left': '0', zIndex: '1000', 'display': 'block',
      minWidth: '10rem', 'padding': '0.5rem 0', 'margin': '0.125rem 0 0',
      backgroundClip: 'padding-box', 'border': '1px solid transparent',
      'opacity': '0', 'visibility': 'hidden', pointerEvents: 'none',
      'transform': 'translateY(-4px)',
      'transition': 'opacity 0.15s ease-out, transform 0.15s ease-out, visibility 0.15s ease-out'
    },
    '.bw_bccl_dropdown_menu.bw_bccl_dropdown_show': { 'opacity': '1', 'visibility': 'visible', pointerEvents: 'auto', 'transform': 'translateY(0)' },
    '.bw_bccl_dropdown_menu_end': { 'left': 'auto', 'right': '0' },
    '.bw_bccl_dropdown_item': {
      'display': 'block', 'width': '100%', 'padding': '0.4rem 1rem', 'clear': 'both',
      fontWeight: '400', textAlign: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap',
      backgroundColor: 'transparent', 'border': '0', fontSize: '0.9375rem', 'cursor': 'pointer'
    },
    '.bw_bccl_dropdown_item:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '-2px' },
    '.bw_bccl_dropdown_divider': { 'height': '0', 'margin': '0.5rem 0', 'overflow': 'hidden', 'opacity': '1' }
  },

  // ---- Form switch ----
  formSwitch: {
    '.bw_bccl_form_switch': { paddingLeft: '2.5em' },
    '.bw_bccl_form_switch .bw_switch_input': {
      'width': '2em', 'height': '1.125em', marginLeft: '-2.5em', borderRadius: '2em',
      'appearance': 'none',
      backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba(255,255,255,1)'/%3e%3c/svg%3e\")",
      backgroundPosition: 'left center', backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain', 'cursor': 'pointer',
      'transition': 'background-color 0.15s ease-out, background-position 0.15s ease-out, border-color 0.15s ease-out'
    },
    '.bw_bccl_form_switch .bw_switch_input:checked': { backgroundPosition: 'right center' },
    '.bw_bccl_form_switch .bw_switch_input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' }
  },

  // ---- Skeleton ----
  skeleton: {
    '.bw_skeleton': { backgroundSize: '400% 100%', 'animation': 'bw_skeleton_shimmer 1.4s ease infinite' },
    '.bw_skeleton_text': { 'height': '1em', marginBottom: '0.5rem' },
    '.bw_skeleton_circle': { borderRadius: '50%' },
    '.bw_skeleton_rect': {},
    '.bw_skeleton_group': { 'display': 'flex', flexDirection: 'column' },
    '@keyframes bw_skeleton_shimmer': { '0%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0 50%' } }
  },

  // ---- Avatar ----
  avatar: {
    '.bw_avatar': {
      'display': 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '50%', 'overflow': 'hidden', fontWeight: '600',
      textTransform: 'uppercase', verticalAlign: 'middle', objectFit: 'cover'
    },
    '.bw_avatar_sm': { 'width': '2rem', 'height': '2rem', fontSize: '0.75rem' },
    '.bw_avatar_md': { 'width': '3rem', 'height': '3rem', fontSize: '1rem' },
    '.bw_avatar_lg': { 'width': '4rem', 'height': '4rem', fontSize: '1.25rem' },
    '.bw_avatar_xl': { 'width': '5rem', 'height': '5rem', fontSize: '1.5rem' }
  },

  // ---- Stat card ----
  statCard: {
    '.bw_stat_card': {
      'padding': '1.25rem',
      borderLeft: '4px solid transparent',
      backgroundColor: 'inherit'
    },
    '.bw_stat_card:hover': { 'transform': 'translateY(-1px)' },
    '.bw_stat_icon': { fontSize: '1.5rem', marginBottom: '0.5rem' },
    '.bw_stat_value': { fontSize: '2rem', fontWeight: '700', lineHeight: '1.2' },
    '.bw_stat_label': { fontSize: '0.875rem', marginTop: '0.25rem' },
    '.bw_stat_change': { fontSize: '0.875rem', fontWeight: '500', marginTop: '0.5rem' }
  },

  // ---- Tooltip ----
  tooltip: {
    '.bw_bccl_tooltip_wrapper': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_bccl_tooltip': {
      'position': 'absolute', zIndex: '999',
      fontSize: '0.875rem', whiteSpace: 'nowrap', maxWidth: 'min(300px, calc(100vw - 1rem))', pointerEvents: 'none',
      'opacity': '0', 'visibility': 'hidden'
    },
    '.bw_bccl_tooltip.bw_bccl_tooltip_show': { 'opacity': '1', 'visibility': 'visible' },
    '.bw_bccl_tooltip_top': { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-4px)', marginBottom: '4px' },
    '.bw_bccl_tooltip_top.bw_bccl_tooltip_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_bccl_tooltip_bottom': { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(4px)', marginTop: '4px' },
    '.bw_bccl_tooltip_bottom.bw_bccl_tooltip_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_bccl_tooltip_left': { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-4px)', marginRight: '4px' },
    '.bw_bccl_tooltip_left.bw_bccl_tooltip_show': { 'transform': 'translateY(-50%) translateX(0)' },
    '.bw_bccl_tooltip_right': { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(4px)', marginLeft: '4px' },
    '.bw_bccl_tooltip_right.bw_bccl_tooltip_show': { 'transform': 'translateY(-50%) translateX(0)' }
  },

  // ---- Popover ----
  popover: {
    '.bw_popover_wrapper': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_popover_trigger': { 'cursor': 'pointer' },
    '.bw_popover': {
      'position': 'absolute', zIndex: '1000',
      minWidth: '200px', maxWidth: 'min(320px, calc(100vw - 2rem))',
      pointerEvents: 'none', 'opacity': '0', 'visibility': 'hidden'
    },
    '.bw_popover.bw_popover_show': { 'opacity': '1', 'visibility': 'visible', pointerEvents: 'auto' },
    '.bw_popover_header': { fontWeight: '600', fontSize: '0.9375rem' },
    '.bw_popover_body': { fontSize: '0.875rem', lineHeight: '1.5' },
    '.bw_popover_top': { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-8px)', marginBottom: '8px' },
    '.bw_popover_top.bw_popover_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_popover_bottom': { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(8px)', marginTop: '8px' },
    '.bw_popover_bottom.bw_popover_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_popover_left': { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-8px)', marginRight: '8px' },
    '.bw_popover_left.bw_popover_show': { 'transform': 'translateY(-50%) translateX(0)' },
    '.bw_popover_right': { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(8px)', marginLeft: '8px' },
    '.bw_popover_right.bw_popover_show': { 'transform': 'translateY(-50%) translateX(0)' }
  },

  // ---- Search input ----
  searchInput: {
    '.bw_search_input': { 'position': 'relative', 'display': 'flex', alignItems: 'center' },
    '.bw_search_input .bw_search_field': { paddingRight: '2.5rem' },
    '.bw_search_clear': {
      'position': 'absolute', 'right': '0.5rem',
      'display': 'flex', alignItems: 'center', justifyContent: 'center',
      'width': '1.5rem', 'height': '1.5rem',
      'border': 'none', 'background': 'none',
      fontSize: '1.25rem', 'cursor': 'pointer', 'padding': '0', borderRadius: '50%'
    },
    '.bw_search_clear:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '2px' }
  },

  // ---- Range ----
  range: {
    '.bw_range_wrapper': { marginBottom: '1rem' },
    '.bw_range_label': { 'display': 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' },
    '.bw_range_value': { fontWeight: '600' },
    '.bw_range': { 'width': '100%', 'height': '0.5rem', 'padding': '0', 'appearance': 'none', 'border': 'none', borderRadius: '0.25rem', 'cursor': 'pointer', 'outline': 'none' },
    '.bw_range:focus': { 'outline': 'none' },
    '.bw_range::-webkit-slider-thumb': {
      'appearance': 'none', 'width': '1.25rem', 'height': '1.25rem', borderRadius: '50%',
      borderWidth: '2px', borderStyle: 'solid', 'cursor': 'pointer'
    },
    '.bw_range::-moz-range-thumb': {
      'width': '1.25rem', 'height': '1.25rem', borderRadius: '50%',
      borderWidth: '2px', borderStyle: 'solid', 'cursor': 'pointer'
    },
    '.bw_range::-webkit-slider-thumb:hover': { 'transform': 'scale(1.15)' },
    '.bw_range:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' }
  },

  // ---- Media object ----
  mediaObject: {
    '.bw_media': { 'display': 'flex', alignItems: 'flex-start', 'gap': '1rem' },
    '.bw_media_reverse': { flexDirection: 'row-reverse' },
    '.bw_media_img': { borderRadius: '50%', objectFit: 'cover', flexShrink: '0' },
    '.bw_media_body': { 'flex': '1', minWidth: '0' },
    '.bw_media_title': { 'margin': '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', lineHeight: '1.3' }
  },

  // ---- File upload ----
  fileUpload: {
    '.bw_file_upload': {
      'display': 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      'border': '2px dashed transparent', 'cursor': 'pointer', textAlign: 'center', 'position': 'relative'
    },
    '.bw_file_upload_icon': { fontSize: '2rem', marginBottom: '0.5rem' },
    '.bw_file_upload_text': { fontSize: '0.875rem' },
    '.bw_file_upload_input': {
      'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
      'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'border': '0'
    }
  },

  // ---- Timeline ----
  timeline: {
    '.bw_bccl_timeline': { 'position': 'relative', paddingLeft: '2rem' },
    '.bw_bccl_timeline::before': {
      'content': '""', 'position': 'absolute', 'left': '0.5rem', 'top': '0', 'bottom': '0',
      'width': '2px'
    },
    '.bw_bccl_timeline_item': { 'position': 'relative', paddingBottom: '1.5rem' },
    '.bw_bccl_timeline_item:last-child': { paddingBottom: '0' },
    '.bw_bccl_timeline_marker': { 'position': 'absolute', 'left': '-1.75rem', 'top': '0.25rem', 'width': '0.75rem', 'height': '0.75rem', borderRadius: '50%' },
    '.bw_bccl_timeline_content': { paddingLeft: '0.5rem' },
    '.bw_bccl_timeline_date': { fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: '500' },
    '.bw_bccl_timeline_title': { fontSize: '1rem', fontWeight: '600', 'margin': '0 0 0.25rem 0', lineHeight: '1.3' },
    '.bw_bccl_timeline_text': { fontSize: '0.875rem', 'margin': '0', lineHeight: '1.5' }
  },

  // ---- Stepper ----
  stepper: {
    '.bw_stepper': { 'display': 'flex', 'gap': '0', counterReset: 'step' },
    '.bw_step': { 'flex': '1', 'display': 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 'position': 'relative' },
    '.bw_step + .bw_step::before': { 'content': '""', 'position': 'absolute', 'top': '1rem', 'left': '-50%', 'right': '50%', 'height': '2px' },
    '.bw_step_indicator': {
      'width': '2rem', 'height': '2rem', borderRadius: '50%',
      'display': 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.875rem', fontWeight: '600', 'position': 'relative', zIndex: '1'
    },
    '.bw_step_body': { marginTop: '0.5rem' },
    '.bw_step_label': { fontSize: '0.875rem', fontWeight: '500' },
    '.bw_step_description': { fontSize: '0.75rem', marginTop: '0.125rem' }
  },

  // ---- Chip input ----
  chipInput: {
    '.bw_chip_input': {
      'display': 'flex', flexWrap: 'wrap', alignItems: 'center', 'gap': '0.375rem',
      'padding': '0.375rem 0.5rem', minHeight: '2.5rem', 'cursor': 'text'
    },
    '.bw_chip': {
      'display': 'inline-flex', alignItems: 'center', 'gap': '0.25rem',
      'padding': '0.125rem 0.5rem', borderRadius: '1rem',
      fontSize: '0.8125rem', lineHeight: '1.5', whiteSpace: 'nowrap'
    },
    '.bw_chip_remove': {
      'display': 'inline-flex', alignItems: 'center', justifyContent: 'center',
      'width': '1rem', 'height': '1rem', 'border': 'none', 'background': 'none',
      fontSize: '0.875rem', 'cursor': 'pointer', 'padding': '0', borderRadius: '50%'
    },
    '.bw_chip_remove:focus-visible': { 'outline': '2px solid currentColor', outlineOffset: '1px' },
    '.bw_chip_field': { 'flex': '1', minWidth: '80px', 'border': 'none', 'outline': 'none', fontSize: '0.875rem', 'padding': '0.125rem 0', 'background': 'transparent' }
  },

  // ---- Small screens: widget lines from the responsive block ----
  responsive: {
    '@media (max-width: 575px)': {
      '.bw_bccl_card_img_left, .bw_bccl_card-img-left': { 'width': '100%' },
      '.bw_bccl_card_img_right, .bw_bccl_card-img-right': { 'width': '100%' },
      '.bw_bccl_hero, .bw_bccl_hero': { 'padding': '2rem 1rem' },
      '.bw_cta_actions, .bw_cta-actions': { flexDirection: 'column' },
      '.bw_bccl_modal_dialog': { 'margin': '0.5rem auto' },
      '.bw_bccl_modal_lg': { maxWidth: 'calc(100% - 1rem)' },
      '.bw_bccl_modal_xl': { maxWidth: 'calc(100% - 1rem)' },
      '.bw_bccl_navbar': { 'padding': '0.5rem 0.75rem' },
      '.bw_bccl_navbar_brand': { marginRight: '0.5rem', fontSize: '1rem' },
      '.bw_bccl_navbar_nav': { flexWrap: 'wrap' },
      '.bw_bccl_tooltip': { whiteSpace: 'normal' },
    }
  }
};

/**
 * Structural widget rules, by category, in the same shape as core's
 * structuralRules. bw.loadStructural merges these after the core sheet.
 * @returns {Object} { category: { selector: declarations } }
 */
export function bcclStructural() {
  return widgetStructural;
}
