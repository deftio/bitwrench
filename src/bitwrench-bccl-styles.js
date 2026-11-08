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
export function bcclStructural() {
  return widgetStructural;
}
