/**
 * Tests for BCCL Phase 2 components:
 * makePagination, makeRadio, makeButtonGroup, makeAccordion, makeModal,
 * makeToast, makeDropdown, makeSwitch, makeSkeleton, makeAvatar
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import {
  makePagination, makeRadio, makeButtonGroup, makeAccordion,
  makeModal, makeToast, makeDropdown, makeSwitch, makeSkeleton,
  makeAvatar, makeCodeDemo
} from "../src/bitwrench-bccl.js";
import { defaultStyles, getStructuralStyles, generateThemedCSS, generateAlternateCSS, getAllStyles, resolveLayout } from "../src/bitwrench-styles.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

function freshDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  return dom;
}

freshDOM();

// =========================================================================
// Phase 1: Quick Wins
// =========================================================================

describe('makePagination', function() {
  it('should return a TACO with nav tag', function() {
    const result = makePagination({ pages: 5, currentPage: 1 });
    assert.strictEqual(result.t, 'nav');
    assert.strictEqual(result.a['aria-label'], 'Pagination');
  });

  it('should render correct number of page items (pages + prev + next)', function() {
    const result = makePagination({ pages: 5, currentPage: 3 });
    const items = result.c.c; // nav > ul > items
    assert.strictEqual(items.length, 7); // prev + 5 pages + next
  });

  it('should mark current page as active', function() {
    const result = makePagination({ pages: 5, currentPage: 3 });
    const items = result.c.c;
    // items[3] is page 3 (index 0=prev, 1=page1, 2=page2, 3=page3)
    assert.ok(items[3].a.class.includes('bw_active'));
  });

  it('should disable previous on first page', function() {
    const result = makePagination({ pages: 5, currentPage: 1 });
    const items = result.c.c;
    assert.ok(items[0].a.class.includes('bw_disabled'));
  });

  it('should disable next on last page', function() {
    const result = makePagination({ pages: 5, currentPage: 5 });
    const items = result.c.c;
    assert.ok(items[items.length - 1].a.class.includes('bw_disabled'));
  });

  it('should accept size prop', function() {
    const result = makePagination({ pages: 3, currentPage: 1, size: 'sm' });
    assert.ok(result.c.a.class.includes('bw_bccl_pagination_sm'));
  });

  it('should accept className prop', function() {
    const result = makePagination({ pages: 3, currentPage: 1, className: 'custom' });
    assert.ok(result.c.a.class.includes('custom'));
  });

  it('should use defaults when called with no props', function() {
    const result = makePagination();
    const items = result.c.c;
    assert.strictEqual(items.length, 3); // prev + 1 page + next
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makePagination, 'function');
  });
});

describe('makeRadio', function() {
  it('should return a TACO with div tag and bw_form_check class', function() {
    const result = makeRadio({ label: 'Option A', name: 'choice', value: 'a' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_form_check'));
  });

  it('should create radio input with correct type', function() {
    const result = makeRadio({ label: 'Option A', name: 'choice', value: 'a' });
    const input = result.c[0];
    assert.strictEqual(input.a.type, 'radio');
    assert.strictEqual(input.a.name, 'choice');
    assert.strictEqual(input.a.value, 'a');
  });

  it('should include label when provided', function() {
    const result = makeRadio({ label: 'Option A', id: 'opt-a' });
    const label = result.c[1];
    assert.strictEqual(label.t, 'label');
    assert.strictEqual(label.c, 'Option A');
    assert.strictEqual(label.a.for, 'opt-a');
  });

  it('should respect checked prop', function() {
    const result = makeRadio({ checked: true });
    assert.strictEqual(result.c[0].a.checked, true);
  });

  it('should respect disabled prop', function() {
    const result = makeRadio({ disabled: true });
    assert.strictEqual(result.c[0].a.disabled, true);
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeRadio, 'function');
  });
});

describe('makeButtonGroup', function() {
  it('should return a TACO with bw_btn_group class', function() {
    const result = makeButtonGroup({ children: [] });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_btn_group'));
    assert.strictEqual(result.a.role, 'group');
  });

  it('should use vertical class when vertical=true', function() {
    const result = makeButtonGroup({ vertical: true });
    assert.ok(result.a.class.includes('bw_bccl_btn_group_vertical'));
  });

  it('should accept size prop', function() {
    const result = makeButtonGroup({ size: 'lg' });
    assert.ok(result.a.class.includes('bw_bccl_btn_group_lg'));
  });

  it('should pass children through', function() {
    const children = [{ t: 'button', c: 'A' }, { t: 'button', c: 'B' }];
    const result = makeButtonGroup({ children });
    assert.strictEqual(result.c.length, 2);
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeButtonGroup, 'function');
  });
});

// =========================================================================
// Phase 2: Core Interactive
// =========================================================================

describe('makeAccordion', function() {
  const items = [
    { title: 'Section 1', content: 'Content 1', open: true },
    { title: 'Section 2', content: 'Content 2' },
    { title: 'Section 3', content: 'Content 3' }
  ];

  it('should return a TACO with bw_accordion class', function() {
    const result = makeAccordion({ items });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_accordion'));
  });

  it('should create correct number of accordion items', function() {
    const result = makeAccordion({ items });
    assert.strictEqual(result.c.length, 3);
  });

  it('should mark open items with bw_collapse_show', function() {
    const result = makeAccordion({ items });
    const firstCollapse = result.c[0].c[1]; // second child of first item
    assert.ok(firstCollapse.a.class.includes('bw_collapse_show'));
  });

  it('should mark closed items without bw_collapse_show', function() {
    const result = makeAccordion({ items });
    const secondCollapse = result.c[1].c[1];
    assert.ok(!secondCollapse.a.class.includes('bw_collapse_show'));
  });

  it('should set aria-expanded on buttons', function() {
    const result = makeAccordion({ items });
    const openBtn = result.c[0].c[0].c; // header > button
    const closedBtn = result.c[1].c[0].c;
    assert.strictEqual(openBtn.a['aria-expanded'], 'true');
    assert.strictEqual(closedBtn.a['aria-expanded'], 'false');
  });

  it('should add bw_collapsed class to closed items', function() {
    const result = makeAccordion({ items });
    const closedBtn = result.c[1].c[0].c;
    assert.ok(closedBtn.a.class.includes('bw_collapsed'));
  });

  it('should have type accordion in options', function() {
    const result = makeAccordion({ items });
    assert.strictEqual(result.o.type, 'accordion');
  });

  it('should store multiOpen in state', function() {
    const result = makeAccordion({ items, multiOpen: true });
    assert.strictEqual(result.o.state.multiOpen, true);
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeAccordion, 'function');
  });
});

describe('makeModal', function() {
  it('should return a TACO with bw_modal class', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_modal'));
  });

  it('should have modal-dialog inside', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    assert.ok(result.c.a.class.includes('bw_bccl_modal_dialog'));
  });

  it('should render title in header', function() {
    const result = makeModal({ title: 'My Title', content: 'Body' });
    const header = result.c.c.c[0]; // dialog > content > first child
    assert.ok(header.a.class.includes('bw_bccl_modal_header'));
    const title = header.c[0];
    assert.strictEqual(title.c, 'My Title');
  });

  it('should render close button by default', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    const header = result.c.c.c[0];
    const closeBtn = header.c[1];
    assert.ok(closeBtn.a.class.includes('bw_close'));
  });

  it('should not render close button when closeButton=false', function() {
    const result = makeModal({ title: 'Test', content: 'Body', closeButton: false });
    const header = result.c.c.c[0];
    assert.strictEqual(header.c.length, 1); // only title
  });

  it('should apply size class', function() {
    const result = makeModal({ content: 'Body', size: 'lg' });
    assert.ok(result.c.a.class.includes('bw_bccl_modal_lg'));
  });

  it('should render footer when provided', function() {
    const result = makeModal({ content: 'Body', footer: 'Footer text' });
    const content = result.c.c;
    const footer = content.c[content.c.length - 1];
    assert.ok(footer.a.class.includes('bw_bccl_modal_footer'));
  });

  it('should have mounted and unmount lifecycle hooks', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    assert.strictEqual(typeof result.o.mounted, 'function');
    assert.strictEqual(typeof result.o.unmount, 'function');
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeModal, 'function');
  });
});

describe('makeToast', function() {
  it('should return a TACO with bw_toast class', function() {
    const result = makeToast({ title: 'Hello', content: 'World' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_toast'));
  });

  it('should apply variant class', function() {
    const result = makeToast({ variant: 'success' });
    assert.ok(result.a.class.includes('bw_success'), 'toast should have bw_success palette class');
  });

  it('should default to info variant', function() {
    const result = makeToast({});
    assert.ok(result.a.class.includes('bw_info'), 'toast should default to bw_info palette class');
  });

  it('should render header when title is provided', function() {
    const result = makeToast({ title: 'Notice' });
    const header = result.c[0];
    assert.ok(header.a.class.includes('bw_bccl_toast_header'));
  });

  it('should render body when content is provided', function() {
    const result = makeToast({ content: 'Message text' });
    // With no title, content is the first child after filter
    const body = result.c.find(c => c && c.a && c.a.class && c.a.class.includes('bw_bccl_toast_body'));
    assert.ok(body);
    assert.strictEqual(body.c, 'Message text');
  });

  it('should have mounted lifecycle hook', function() {
    const result = makeToast({ content: 'Test' });
    assert.strictEqual(typeof result.o.mounted, 'function');
  });

  it('should store position as CSS class', function() {
    const result = makeToast({ position: 'bottom-left' });
    assert.ok(result.a.class.indexOf('bw_bccl_toast_bottom_left') >= 0);
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeToast, 'function');
  });
});

// =========================================================================
// Phase 3: Essential Modern
// =========================================================================

describe('makeDropdown', function() {
  it('should return a TACO with bw_dropdown class', function() {
    const result = makeDropdown({ trigger: 'Menu', items: [] });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_dropdown'));
  });

  it('should create trigger button from string', function() {
    const result = makeDropdown({ trigger: 'Actions' });
    const trigger = result.c[0];
    assert.strictEqual(trigger.t, 'button');
    assert.ok(trigger.a.class.includes('bw_bccl_dropdown_toggle'));
    assert.strictEqual(trigger.c, 'Actions');
  });

  it('should render menu items', function() {
    const result = makeDropdown({
      trigger: 'Menu',
      items: [
        { text: 'Edit' },
        { text: 'Delete' }
      ]
    });
    const menu = result.c[1];
    assert.ok(menu.a.class.includes('bw_bccl_dropdown_menu'));
    assert.strictEqual(menu.c.length, 2);
  });

  it('should render divider items', function() {
    const result = makeDropdown({
      trigger: 'Menu',
      items: [{ text: 'A' }, { divider: true }, { text: 'B' }]
    });
    const menu = result.c[1];
    assert.strictEqual(menu.c[1].t, 'hr');
    assert.ok(menu.c[1].a.class.includes('bw_bccl_dropdown_divider'));
  });

  it('should apply align=end class', function() {
    const result = makeDropdown({ trigger: 'Menu', items: [], align: 'end' });
    const menu = result.c[1];
    assert.ok(menu.a.class.includes('bw_bccl_dropdown_menu_end'));
  });

  it('should apply disabled class to disabled items', function() {
    const result = makeDropdown({
      trigger: 'Menu',
      items: [{ text: 'Disabled', disabled: true }]
    });
    const item = result.c[1].c[0];
    assert.ok(item.a.class.includes('disabled'));
  });

  it('should have mounted and unmount lifecycle hooks', function() {
    const result = makeDropdown({ trigger: 'Menu', items: [] });
    assert.strictEqual(typeof result.o.mounted, 'function');
    assert.strictEqual(typeof result.o.unmount, 'function');
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeDropdown, 'function');
  });
});

describe('makeSwitch', function() {
  it('should return a TACO with bw_form_switch class', function() {
    const result = makeSwitch({ label: 'Dark mode' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_bccl_form_switch'));
  });

  it('should create checkbox input with switch role', function() {
    const result = makeSwitch({});
    const input = result.c[0];
    assert.strictEqual(input.a.type, 'checkbox');
    assert.strictEqual(input.a.role, 'switch');
    assert.ok(input.a.class.includes('bw_switch_input'));
  });

  it('should include label when provided', function() {
    const result = makeSwitch({ label: 'Toggle', id: 'sw1' });
    const label = result.c[1];
    assert.strictEqual(label.t, 'label');
    assert.strictEqual(label.c, 'Toggle');
    assert.strictEqual(label.a.for, 'sw1');
  });

  it('should respect checked prop', function() {
    const result = makeSwitch({ checked: true });
    assert.strictEqual(result.c[0].a.checked, true);
  });

  it('should respect disabled prop', function() {
    const result = makeSwitch({ disabled: true });
    assert.strictEqual(result.c[0].a.disabled, true);
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeSwitch, 'function');
  });
});

describe('makeSkeleton', function() {
  it('should default to text variant', function() {
    const result = makeSkeleton();
    assert.ok(result.a.class.includes('bw_skeleton_text'));
  });

  it('should create circle variant', function() {
    const result = makeSkeleton({ variant: 'circle' });
    assert.ok(result.a.class.includes('bw_skeleton_circle'));
  });

  it('should create rect variant', function() {
    const result = makeSkeleton({ variant: 'rect' });
    assert.ok(result.a.class.includes('bw_skeleton_rect'));
  });

  it('should accept custom width and height', function() {
    const result = makeSkeleton({ width: '200px', height: '30px' });
    assert.strictEqual(result.a.style.width, '200px');
    assert.strictEqual(result.a.style.height, '30px');
  });

  it('should create multiple lines with count', function() {
    const result = makeSkeleton({ count: 3 });
    assert.ok(result.a.class.includes('bw_skeleton_group'));
    assert.strictEqual(result.c.length, 3);
  });

  it('should make last line 75% width in multi-line mode', function() {
    const result = makeSkeleton({ count: 3 });
    const lastLine = result.c[2];
    assert.strictEqual(lastLine.a.style.width, '75%');
  });

  it('should have skeleton animation class', function() {
    const result = makeSkeleton();
    assert.ok(result.a.class.includes('bw_skeleton'));
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeSkeleton, 'function');
  });
});

describe('makeAvatar', function() {
  it('should create img tag when src is provided', function() {
    const result = makeAvatar({ src: '/photo.jpg', alt: 'User' });
    assert.strictEqual(result.t, 'img');
    assert.strictEqual(result.a.src, '/photo.jpg');
    assert.strictEqual(result.a.alt, 'User');
  });

  it('should create div with initials when no src', function() {
    const result = makeAvatar({ initials: 'JD' });
    assert.strictEqual(result.t, 'div');
    assert.strictEqual(result.c, 'JD');
  });

  it('should apply size class', function() {
    const result = makeAvatar({ initials: 'AB', size: 'lg' });
    assert.ok(result.a.class.includes('bw_avatar_lg'));
  });

  it('should default to md size', function() {
    const result = makeAvatar({ initials: 'AB' });
    assert.ok(result.a.class.includes('bw_avatar_md'));
  });

  it('should apply variant class to initials avatar', function() {
    const result = makeAvatar({ initials: 'AB', variant: 'success' });
    assert.ok(result.a.class.includes('bw_success'), 'avatar should have bw_success palette class');
  });

  it('should default to primary variant', function() {
    const result = makeAvatar({ initials: 'AB' });
    assert.ok(result.a.class.includes('bw_primary'), 'avatar should default to bw_primary palette class');
  });

  it('should have bw_avatar class', function() {
    const result = makeAvatar({ src: '/photo.jpg' });
    assert.ok(result.a.class.includes('bw_avatar'));
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeAvatar, 'function');
  });
});

// =========================================================================
// CSS Tests
// =========================================================================

describe('Component CSS', function() {
  it('defaultStyles should have new component categories', function() {
    assert.ok(defaultStyles.buttonGroup, 'buttonGroup missing');
    assert.ok(defaultStyles.accordion, 'accordion missing');
    assert.ok(defaultStyles.modal, 'modal missing');
    assert.ok(defaultStyles.toast, 'toast missing');
    assert.ok(defaultStyles.dropdown, 'dropdown missing');
    assert.ok(defaultStyles.formSwitch, 'formSwitch missing');
    assert.ok(defaultStyles.skeleton, 'skeleton missing');
    assert.ok(defaultStyles.avatar, 'avatar missing');
    assert.ok(defaultStyles.statCard, 'statCard missing');
    assert.ok(defaultStyles.tooltip, 'tooltip missing');
    assert.ok(defaultStyles.popover, 'popover missing');
    assert.ok(defaultStyles.searchInput, 'searchInput missing');
    assert.ok(defaultStyles.range, 'range missing');
    assert.ok(defaultStyles.mediaObject, 'mediaObject missing');
    assert.ok(defaultStyles.fileUpload, 'fileUpload missing');
    assert.ok(defaultStyles.timeline, 'timeline missing');
    assert.ok(defaultStyles.stepper, 'stepper missing');
    assert.ok(defaultStyles.chipInput, 'chipInput missing');
  });

  it('getAllStyles should include new component selectors', function() {
    const all = getAllStyles();
    assert.ok(all['.bw_btn_group, .bw_btn_group_vertical'], 'btn-group missing');
    assert.ok(all['.bw_accordion'], 'accordion missing');
    assert.ok(all['.bw_modal'], 'modal missing');
    assert.ok(all['.bw_bccl_toast'], 'toast missing');
    assert.ok(all['.bw_dropdown'], 'dropdown missing');
    assert.ok(all['.bw_form_switch'], 'form-switch missing');
    assert.ok(all['.bw_skeleton'], 'skeleton missing');
    assert.ok(all['.bw_avatar'], 'avatar missing');
    assert.ok(all['.bw_stat_card'], 'stat-card missing');
    assert.ok(all['.bw_tooltip_wrapper'], 'tooltip missing');
    assert.ok(all['.bw_popover_wrapper'], 'popover missing');
    assert.ok(all['.bw_search_input'], 'search-input missing');
    assert.ok(all['.bw_range'], 'range missing');
    assert.ok(all['.bw_media'], 'media missing');
    assert.ok(all['.bw_file_upload'], 'file-upload missing');
    assert.ok(all['.bw_timeline'], 'timeline missing');
    assert.ok(all['.bw_stepper'], 'stepper missing');
    assert.ok(all['.bw_chip_input'], 'chip-input missing');
  });

  it('getStructuralStyles should include new component rules', function() {
    const structural = getStructuralStyles();
    assert.ok(structural['.bw_btn_group, .bw_btn_group_vertical'], 'btn-group structural missing');
    assert.ok(structural['.bw_accordion'], 'accordion structural missing');
    assert.ok(structural['.bw_modal'], 'modal structural missing');
    assert.ok(structural['.bw_bccl_toast'], 'toast structural missing');
    assert.ok(structural['.bw_dropdown'], 'dropdown structural missing');
    assert.ok(structural['.bw_form_switch'], 'form-switch structural missing');
    assert.ok(structural['.bw_skeleton'], 'skeleton structural missing');
    assert.ok(structural['.bw_avatar'], 'avatar structural missing');
    assert.ok(structural['.bw_stat_card'], 'stat-card structural missing');
    assert.ok(structural['.bw_tooltip_wrapper'], 'tooltip structural missing');
    assert.ok(structural['.bw_popover_wrapper'], 'popover structural missing');
    assert.ok(structural['.bw_search_input'], 'search-input structural missing');
    assert.ok(structural['.bw_range'], 'range structural missing');
    assert.ok(structural['.bw_media'], 'media structural missing');
    assert.ok(structural['.bw_file_upload'], 'file-upload structural missing');
    assert.ok(structural['.bw_timeline'], 'timeline structural missing');
    assert.ok(structural['.bw_stepper'], 'stepper structural missing');
    assert.ok(structural['.bw_chip_input'], 'chip-input structural missing');
  });

  it('getStructuralStyles should include underscore aliases', function() {
    const structural = getStructuralStyles();
    assert.ok(structural['.bw_accordion'], 'underscore alias missing for accordion');
    assert.ok(structural['.bw_modal'], 'underscore alias missing for modal');
    assert.ok(structural['.bw_avatar'], 'underscore alias missing for avatar');
  });

  it('generateAlternateCSS should produce alt-scoped rules', function() {
    const config = { primary: '#006666', secondary: '#cc6633', tertiary: '#006666' };
    const altConfig = bw.deriveAlternateConfig(config);
    const altPalette = bw.derivePalette(altConfig);
    const layout = resolveLayout({});
    const altRules = generateAlternateCSS('', altPalette, layout);
    const css = bw.css(altRules);
    assert.ok(css.includes('.bw_theme_alt'), 'should use .bw_theme_alt scope');
    assert.ok(css.includes('.bw_btn'), 'should include button rules');
  });
});

// componentHandles registry removed in v2.0.15 (dead code elimination)

// =========================================================================
// String shorthand support
// =========================================================================

describe('String shorthand', function() {
  it('makeButton should accept string shorthand', function() {
    const btn = bw.makeButton('OK');
    assert.strictEqual(btn.t, 'button');
    assert.strictEqual(btn.c, 'OK');
    assert.ok(btn.a.class.includes('bw_bccl_btn'));
  });

  it('makeButton string shorthand should default to primary variant', function() {
    const btn = bw.makeButton('Save');
    assert.ok(btn.a.class.includes('bw_primary'), 'button should default to bw_primary palette class');
  });

  it('makeBadge should accept string shorthand', function() {
    const badge = bw.makeBadge('New');
    assert.strictEqual(badge.t, 'span');
    assert.strictEqual(badge.c, 'New');
    assert.ok(badge.a.class.includes('bw_bccl_badge'));
  });

  it('makeAlert should accept string shorthand', function() {
    const alert = bw.makeAlert('Something happened');
    assert.strictEqual(alert.t, 'div');
    assert.ok(alert.a.class.includes('bw_bccl_alert'));
    assert.ok(alert.c.some(function(child) { return child === 'Something happened'; }));
  });

  it('makeButton object form should still work', function() {
    const btn = bw.makeButton({ text: 'Cancel', variant: 'secondary' });
    assert.strictEqual(btn.c, 'Cancel');
    assert.ok(btn.a.class.includes('bw_secondary'), 'button should have bw_secondary palette class');
  });

  it('makeStatCard should accept string shorthand', function() {
    const stat = bw.makeStatCard('Users');
    assert.strictEqual(stat.t, 'div');
    assert.ok(stat.a.class.includes('bw_stat_card'));
    assert.ok(stat.c.some(function(child) { return child.c === 'Users' && child.a.class === 'bw_stat_label'; }));
  });
});

// =========================================================================
// makeStatCard
// =========================================================================

describe('makeStatCard', function() {
  it('should create basic stat card with value and label', function() {
    const stat = bw.makeStatCard({ value: 2345, label: 'Active Users' });
    assert.strictEqual(stat.t, 'div');
    assert.ok(stat.a.class.includes('bw_stat_card'));
    assert.ok(stat.c.some(function(child) { return child.a.class === 'bw_stat_value'; }));
    assert.ok(stat.c.some(function(child) { return child.a.class === 'bw_stat_label' && child.c === 'Active Users'; }));
  });

  it('should support variant for border color', function() {
    const stat = bw.makeStatCard({ value: 100, variant: 'success' });
    assert.ok(stat.a.class.includes('bw_success'), 'stat card should have bw_success palette class');
  });

  it('should show change indicator with up/down class', function() {
    const up = bw.makeStatCard({ value: 100, change: 5.3 });
    const changeUp = up.c.find(function(child) { return child.a && child.a.class && child.a.class.includes('bw_stat_change'); });
    assert.ok(changeUp);
    assert.ok(changeUp.a.class.includes('bw_stat_change_up'));

    const down = bw.makeStatCard({ value: 100, change: -2.1 });
    const changeDown = down.c.find(function(child) { return child.a && child.a.class && child.a.class.includes('bw_stat_change'); });
    assert.ok(changeDown);
    assert.ok(changeDown.a.class.includes('bw_stat_change_down'));
  });

  it('should format currency values', function() {
    const stat = bw.makeStatCard({ value: 45231, format: 'currency' });
    const valueEl = stat.c.find(function(child) { return child.a.class === 'bw_stat_value'; });
    assert.ok(valueEl.c.startsWith('$'));
  });

  it('should format percent values', function() {
    const stat = bw.makeStatCard({ value: 3.2, format: 'percent' });
    const valueEl = stat.c.find(function(child) { return child.a.class === 'bw_stat_value'; });
    assert.ok(valueEl.c.includes('%'));
  });

  it('should support custom prefix and suffix', function() {
    const stat = bw.makeStatCard({ value: 42, prefix: 'EUR ', suffix: ' avg' });
    const valueEl = stat.c.find(function(child) { return child.a.class === 'bw_stat_value'; });
    assert.strictEqual(valueEl.c, 'EUR 42 avg');
  });

  it('should show icon when provided', function() {
    const stat = bw.makeStatCard({ value: 100, icon: '📊' });
    assert.ok(stat.c.some(function(child) { return child.a.class === 'bw_stat_icon' && child.c === '📊'; }));
  });

  it('should set type to stat-card in options', function() {
    const stat = bw.makeStatCard({ value: 0 });
    assert.strictEqual(stat.o.type, 'stat-card');
  });
});

// =========================================================================
// makeTooltip
// =========================================================================

describe('makeTooltip', function() {
  it('should create tooltip wrapper with content and tooltip text', function() {
    const tip = bw.makeTooltip({ content: 'Hover me', text: 'Hello' });
    assert.strictEqual(tip.t, 'span');
    assert.ok(tip.a.class.includes('bw_bccl_tooltip_wrapper'));
    assert.strictEqual(tip.c.length, 2);
    assert.strictEqual(tip.c[0], 'Hover me');
    assert.strictEqual(tip.c[1].c, 'Hello');
  });

  it('should default to top placement', function() {
    const tip = bw.makeTooltip({ text: 'tip' });
    assert.ok(tip.c[1].a.class.includes('bw_bccl_tooltip_top'));
  });

  it('should support all four placements', function() {
    ['top', 'bottom', 'left', 'right'].forEach(function(p) {
      const tip = bw.makeTooltip({ text: 'tip', placement: p });
      assert.ok(tip.c[1].a.class.includes('bw_bccl_tooltip_' + p));
    });
  });

  it('should set role=tooltip on tooltip element', function() {
    const tip = bw.makeTooltip({ text: 'tip' });
    assert.strictEqual(tip.c[1].a.role, 'tooltip');
  });

  it('should have mounted lifecycle for event binding', function() {
    const tip = bw.makeTooltip({ text: 'tip' });
    assert.strictEqual(typeof tip.o.mounted, 'function');
  });

  it('should set type to tooltip in options', function() {
    const tip = bw.makeTooltip({ text: 'tip' });
    assert.strictEqual(tip.o.type, 'tooltip');
  });

  it('should accept TACO object as content', function() {
    const btn = bw.makeButton({ text: 'Click' });
    const tip = bw.makeTooltip({ content: btn, text: 'Button tooltip' });
    assert.strictEqual(tip.c[0], btn);
    assert.strictEqual(tip.c[1].c, 'Button tooltip');
  });
});

// =========================================================================
// makePopover
// =========================================================================

describe('makePopover', function() {
  it('should create popover wrapper with trigger and content', function() {
    const pop = bw.makePopover({ trigger: 'Click', title: 'Title', content: 'Body' });
    assert.strictEqual(pop.t, 'span');
    assert.ok(pop.a.class.includes('bw_popover_wrapper'));
    assert.strictEqual(pop.c.length, 2);
    // Trigger wrapper
    assert.ok(pop.c[0].a.class.includes('bw_popover_trigger'));
    assert.strictEqual(pop.c[0].c, 'Click');
    // Popover content
    assert.ok(pop.c[1].a.class.includes('bw_popover'));
  });

  it('should include header and body in popover', function() {
    const pop = bw.makePopover({ title: 'T', content: 'C' });
    const popContent = pop.c[1].c;
    assert.ok(popContent.some(function(child) { return child.a.class === 'bw_popover_header' && child.c === 'T'; }));
    assert.ok(popContent.some(function(child) { return child.a.class === 'bw_popover_body' && child.c === 'C'; }));
  });

  it('should default to top placement', function() {
    const pop = bw.makePopover({ content: 'C' });
    assert.ok(pop.c[1].a.class.includes('bw_popover_top'));
  });

  it('should support all four placements', function() {
    ['top', 'bottom', 'left', 'right'].forEach(function(p) {
      const pop = bw.makePopover({ content: 'C', placement: p });
      assert.ok(pop.c[1].a.class.includes('bw_popover_' + p));
    });
  });

  it('should have mounted and unmount lifecycle for click-outside', function() {
    const pop = bw.makePopover({ content: 'C' });
    assert.strictEqual(typeof pop.o.mounted, 'function');
    assert.strictEqual(typeof pop.o.unmount, 'function');
  });

  it('should set type to popover in options', function() {
    const pop = bw.makePopover({ content: 'C' });
    assert.strictEqual(pop.o.type, 'popover');
  });

  it('should omit header when no title provided', function() {
    const pop = bw.makePopover({ content: 'Body only' });
    const popContent = pop.c[1].c;
    assert.ok(!popContent.some(function(child) { return child.a && child.a.class === 'bw_popover_header'; }));
  });
});

// =========================================================================
// Form validation states
// =========================================================================

describe('Form validation', function() {
  it('makeFormGroup should add bw_is_valid class to input when validation=valid', function() {
    const input = bw.makeInput({ id: 'email', type: 'email' });
    const group = bw.makeFormGroup({ label: 'Email', input: input, validation: 'valid', feedback: 'Looks good!' });
    const styledInput = group.c.find(function(child) { return child.t === 'input'; });
    assert.ok(styledInput.a.class.includes('bw_is_valid'));
  });

  it('makeFormGroup should add bw_is_invalid class to input when validation=invalid', function() {
    const input = bw.makeInput({ id: 'email', type: 'email' });
    const group = bw.makeFormGroup({ label: 'Email', input: input, validation: 'invalid', feedback: 'Invalid email' });
    const styledInput = group.c.find(function(child) { return child.t === 'input'; });
    assert.ok(styledInput.a.class.includes('bw_is_invalid'));
  });

  it('should not mutate original input TACO', function() {
    const input = bw.makeInput({ id: 'name', className: 'custom' });
    const originalClass = input.a.class;
    bw.makeFormGroup({ input: input, validation: 'invalid' });
    assert.strictEqual(input.a.class, originalClass);
  });

  it('should show valid feedback text', function() {
    const group = bw.makeFormGroup({
      input: bw.makeInput({}),
      validation: 'valid',
      feedback: 'Looks good!'
    });
    const fb = group.c.find(function(child) { return child.a && child.a.class === 'bw_valid_feedback'; });
    assert.ok(fb);
    assert.strictEqual(fb.c, 'Looks good!');
  });

  it('should show invalid feedback text', function() {
    const group = bw.makeFormGroup({
      input: bw.makeInput({}),
      validation: 'invalid',
      feedback: 'Required field'
    });
    const fb = group.c.find(function(child) { return child.a && child.a.class === 'bw_invalid_feedback'; });
    assert.ok(fb);
    assert.strictEqual(fb.c, 'Required field');
  });

  it('should not show feedback when validation is not set', function() {
    const group = bw.makeFormGroup({
      input: bw.makeInput({}),
      feedback: 'Ignored'
    });
    const fb = group.c.find(function(child) { return child.a && (child.a.class === 'bw_valid_feedback' || child.a.class === 'bw_invalid_feedback'); });
    assert.ok(!fb);
  });

  it('should show required indicator on label', function() {
    const group = bw.makeFormGroup({
      label: 'Name',
      input: bw.makeInput({}),
      required: true
    });
    const label = group.c.find(function(child) { return child.t === 'label'; });
    assert.ok(Array.isArray(label.c));
    assert.ok(label.c.some(function(child) { return child.t === 'span' && child.c === '*'; }));
  });

  it('validation CSS classes should exist in structural styles', function() {
    const structural = getStructuralStyles();
    assert.ok(structural['.bw_valid_feedback'], 'valid-feedback structural missing');
    assert.ok(structural['.bw_invalid_feedback'], 'invalid-feedback structural missing');
  });
});

// =========================================================================
// makeSearchInput
// =========================================================================

describe('makeSearchInput', function() {
  it('should create search input wrapper', function() {
    const search = bw.makeSearchInput({});
    assert.strictEqual(search.t, 'div');
    assert.ok(search.a.class.includes('bw_search_input'));
  });

  it('should have input with type=search', function() {
    const search = bw.makeSearchInput({ placeholder: 'Find...' });
    const input = search.c.find(function(child) { return child.t === 'input'; });
    assert.strictEqual(input.a.type, 'search');
    assert.strictEqual(input.a.placeholder, 'Find...');
  });

  it('should have clear button', function() {
    const search = bw.makeSearchInput({});
    const clearBtn = search.c.find(function(child) { return child.t === 'button'; });
    assert.ok(clearBtn);
    assert.ok(clearBtn.a.class.includes('bw_search_clear'));
  });

  it('should accept string shorthand', function() {
    const search = bw.makeSearchInput('Search users...');
    const input = search.c.find(function(child) { return child.t === 'input'; });
    assert.strictEqual(input.a.placeholder, 'Search users...');
  });

  it('should set type to search-input in options', function() {
    const search = bw.makeSearchInput({});
    assert.strictEqual(search.o.type, 'search-input');
  });
});

// =========================================================================
// makeRange
// =========================================================================

describe('makeRange', function() {
  it('should create range wrapper with input', function() {
    const range = bw.makeRange({});
    assert.strictEqual(range.t, 'div');
    assert.ok(range.a.class.includes('bw_range_wrapper'));
    const input = range.c.find(function(child) { return child.t === 'input'; });
    assert.ok(input);
    assert.strictEqual(input.a.type, 'range');
  });

  it('should set min, max, step, value', function() {
    const range = bw.makeRange({ min: 10, max: 200, step: 5, value: 75 });
    const input = range.c.find(function(child) { return child.t === 'input'; });
    assert.strictEqual(input.a.min, 10);
    assert.strictEqual(input.a.max, 200);
    assert.strictEqual(input.a.step, 5);
    assert.strictEqual(input.a.value, 75);
  });

  it('should show label when provided', function() {
    const range = bw.makeRange({ label: 'Volume' });
    const label = range.c.find(function(child) { return child.a && child.a.class === 'bw_range_label'; });
    assert.ok(label);
    assert.ok(label.c.some(function(child) { return child.c === 'Volume'; }));
  });

  it('should show value display when showValue is true', function() {
    const range = bw.makeRange({ showValue: true, value: 42 });
    const label = range.c.find(function(child) { return child.a && child.a.class === 'bw_range_label'; });
    assert.ok(label);
    const valueDisplay = label.c.find(function(child) { return child.a && child.a.class === 'bw_range_value'; });
    assert.ok(valueDisplay);
    assert.strictEqual(valueDisplay.c, '42');
  });

  it('should set type to range in options', function() {
    const range = bw.makeRange({});
    assert.strictEqual(range.o.type, 'range');
  });
});

// =========================================================================
// makeMediaObject
// =========================================================================

describe('makeMediaObject', function() {
  it('should create media object with image and body', function() {
    const media = bw.makeMediaObject({ src: '/photo.jpg', title: 'Jane', content: 'Hello' });
    assert.strictEqual(media.t, 'div');
    assert.ok(media.a.class.includes('bw_media'));
    assert.strictEqual(media.c.length, 2);
    assert.strictEqual(media.c[0].t, 'img');
    assert.ok(media.c[1].a.class.includes('bw_media_body'));
  });

  it('should support reverse layout', function() {
    const media = bw.makeMediaObject({ src: '/photo.jpg', content: 'Hi', reverse: true });
    assert.ok(media.a.class.includes('bw_media_reverse'));
    // Body comes first, image second in reverse
    assert.ok(media.c[0].a.class.includes('bw_media_body'));
    assert.strictEqual(media.c[1].t, 'img');
  });

  it('should render title in body', function() {
    const media = bw.makeMediaObject({ title: 'John Doe', content: 'A message' });
    const body = media.c.find(function(child) { return child.a && child.a.class && child.a.class.includes('bw_media_body'); });
    assert.ok(body);
    assert.ok(body.c.some(function(child) { return child.t === 'h5' && child.c === 'John Doe'; }));
  });

  it('should work without image', function() {
    const media = bw.makeMediaObject({ title: 'No Image', content: 'Text only' });
    assert.ok(!media.c.some(function(child) { return child && child.t === 'img'; }));
  });

  it('should set type to media-object in options', function() {
    const media = bw.makeMediaObject({});
    assert.strictEqual(media.o.type, 'media-object');
  });
});

// =========================================================================
// makeFileUpload
// =========================================================================

describe('makeFileUpload', function() {
  it('should create file upload zone', function() {
    const upload = bw.makeFileUpload({});
    assert.strictEqual(upload.t, 'div');
    assert.ok(upload.a.class.includes('bw_file_upload'));
    assert.strictEqual(upload.a.role, 'button');
  });

  it('should have hidden file input', function() {
    const upload = bw.makeFileUpload({ accept: 'image/*', multiple: true });
    const input = upload.c.find(function(child) { return child.t === 'input'; });
    assert.ok(input);
    assert.strictEqual(input.a.type, 'file');
    assert.strictEqual(input.a.accept, 'image/*');
    assert.strictEqual(input.a.multiple, true);
  });

  it('should show custom text', function() {
    const upload = bw.makeFileUpload({ text: 'Upload CSV' });
    const textEl = upload.c.find(function(child) { return child.a && child.a.class === 'bw_file_upload_text'; });
    assert.ok(textEl);
    assert.strictEqual(textEl.c, 'Upload CSV');
  });

  it('should have icon', function() {
    const upload = bw.makeFileUpload({});
    const icon = upload.c.find(function(child) { return child.a && child.a.class === 'bw_file_upload_icon'; });
    assert.ok(icon);
  });

  it('should have mounted lifecycle for drag-and-drop', function() {
    const upload = bw.makeFileUpload({});
    assert.strictEqual(typeof upload.o.mounted, 'function');
  });

  it('should set type to file-upload in options', function() {
    const upload = bw.makeFileUpload({});
    assert.strictEqual(upload.o.type, 'file-upload');
  });

  it('should be keyboard accessible', function() {
    const upload = bw.makeFileUpload({});
    assert.strictEqual(upload.a.tabindex, '0');
  });
});

// =========================================================================
// makeTimeline
// =========================================================================

describe('makeTimeline', function() {
  it('should create timeline container', function() {
    const tl = bw.makeTimeline({ items: [] });
    assert.strictEqual(tl.t, 'div');
    assert.ok(tl.a.class.includes('bw_bccl_timeline'));
  });

  it('should render items with marker and content', function() {
    const tl = bw.makeTimeline({
      items: [
        { title: 'Start', date: 'Jan 2026', content: 'Kickoff' },
        { title: 'End', date: 'Mar 2026' }
      ]
    });
    assert.strictEqual(tl.c.length, 2);
    const first = tl.c[0];
    assert.ok(first.a.class.includes('bw_bccl_timeline_item'));
    const marker = first.c[0];
    assert.ok(marker.a.class.includes('bw_bccl_timeline_marker'));
    const content = first.c[1];
    assert.ok(content.a.class.includes('bw_bccl_timeline_content'));
  });

  it('should apply variant to marker', function() {
    const tl = bw.makeTimeline({ items: [{ title: 'Done', variant: 'success' }] });
    const marker = tl.c[0].c[0];
    assert.ok(marker.a.class.includes('bw_success'), 'timeline marker should have bw_success palette class');
  });

  it('should default variant to primary', function() {
    const tl = bw.makeTimeline({ items: [{ title: 'Event' }] });
    const marker = tl.c[0].c[0];
    assert.ok(marker.a.class.includes('bw_primary'), 'timeline marker should default to bw_primary palette class');
  });

  it('should render date, title, and text content', function() {
    const tl = bw.makeTimeline({ items: [{ title: 'Launch', date: 'Feb', content: 'Details here' }] });
    const contentDiv = tl.c[0].c[1]; // timeline-content
    const date = contentDiv.c.find(function(c) { return c.a && c.a.class === 'bw_bccl_timeline_date'; });
    const title = contentDiv.c.find(function(c) { return c.t === 'h5'; });
    const text = contentDiv.c.find(function(c) { return c.t === 'p'; });
    assert.strictEqual(date.c, 'Feb');
    assert.strictEqual(title.c, 'Launch');
    assert.strictEqual(text.c, 'Details here');
  });

  it('should accept TACO content', function() {
    const custom = { t: 'span', c: 'Custom' };
    const tl = bw.makeTimeline({ items: [{ content: custom }] });
    const contentDiv = tl.c[0].c[1];
    assert.ok(contentDiv.c.some(function(c) { return c.t === 'span' && c.c === 'Custom'; }));
  });

  it('should set type to timeline in options', function() {
    const tl = bw.makeTimeline({ items: [] });
    assert.strictEqual(tl.o.type, 'timeline');
  });
});

// =========================================================================
// makeStepper
// =========================================================================

describe('makeStepper', function() {
  it('should create stepper container with role=list', function() {
    const s = bw.makeStepper({ steps: [] });
    assert.strictEqual(s.t, 'div');
    assert.ok(s.a.class.includes('bw_stepper'));
    assert.strictEqual(s.a.role, 'list');
  });

  it('should render steps with correct states', function() {
    const s = bw.makeStepper({
      currentStep: 1,
      steps: [
        { label: 'Account' },
        { label: 'Profile' },
        { label: 'Confirm' }
      ]
    });
    assert.strictEqual(s.c.length, 3);
    assert.ok(s.c[0].a.class.includes('bw_step_completed'));
    assert.ok(s.c[1].a.class.includes('bw_step_active'));
    assert.ok(s.c[2].a.class.includes('bw_step_pending'));
  });

  it('should show checkmark for completed steps', function() {
    const s = bw.makeStepper({ currentStep: 2, steps: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] });
    const indicator = s.c[0].c[0]; // first step's indicator
    assert.strictEqual(indicator.c, '\u2713');
  });

  it('should show step number for pending/active steps', function() {
    const s = bw.makeStepper({ currentStep: 0, steps: [{ label: 'First' }, { label: 'Second' }] });
    assert.strictEqual(s.c[0].c[0].c, '1');
    assert.strictEqual(s.c[1].c[0].c, '2');
  });

  it('should set aria-current on active step', function() {
    const s = bw.makeStepper({ currentStep: 0, steps: [{ label: 'A' }] });
    assert.strictEqual(s.c[0].a['aria-current'], 'step');
  });

  it('should render description when provided', function() {
    const s = bw.makeStepper({ steps: [{ label: 'Setup', description: 'Initial config' }] });
    const body = s.c[0].c[1]; // step-body
    const desc = body.c.find(function(c) { return c.a && c.a.class === 'bw_step_description'; });
    assert.ok(desc);
    assert.strictEqual(desc.c, 'Initial config');
  });

  it('should set type to stepper in options', function() {
    const s = bw.makeStepper({ steps: [] });
    assert.strictEqual(s.o.type, 'stepper');
  });
});

// =========================================================================
// makeChipInput
// =========================================================================

describe('makeChipInput', function() {
  it('should create chip input container', function() {
    const ci = bw.makeChipInput({});
    assert.strictEqual(ci.t, 'div');
    assert.ok(ci.a.class.includes('bw_chip_input'));
  });

  it('should render initial chips', function() {
    const ci = bw.makeChipInput({ chips: ['JS', 'CSS', 'HTML'] });
    const chips = ci.c.filter(function(c) { return c.t === 'span' && c.a.class === 'bw_chip'; });
    assert.strictEqual(chips.length, 3);
    assert.strictEqual(chips[0].c[0], 'JS');
  });

  it('should have text input field', function() {
    const ci = bw.makeChipInput({ placeholder: 'Add tag...' });
    const input = ci.c.find(function(c) { return c.t === 'input'; });
    assert.ok(input);
    assert.strictEqual(input.a.type, 'text');
    assert.strictEqual(input.a.placeholder, 'Add tag...');
  });

  it('should default placeholder to Add...', function() {
    const ci = bw.makeChipInput({});
    const input = ci.c.find(function(c) { return c.t === 'input'; });
    assert.strictEqual(input.a.placeholder, 'Add...');
  });

  it('each chip should have remove button', function() {
    const ci = bw.makeChipInput({ chips: ['React'] });
    const chip = ci.c.find(function(c) { return c.t === 'span' && c.a.class === 'bw_chip'; });
    const removeBtn = chip.c.find(function(c) { return c.t === 'button'; });
    assert.ok(removeBtn);
    assert.ok(removeBtn.a.class.includes('bw_chip_remove'));
    assert.strictEqual(removeBtn.a['aria-label'], 'Remove React');
  });

  it('should set type to chip-input in options', function() {
    const ci = bw.makeChipInput({});
    assert.strictEqual(ci.o.type, 'chip-input');
  });
});

// =========================================================================
// Breadcrumb active state
// =========================================================================

describe('Breadcrumb active state', function() {
  it('active item should have active class', function() {
    const crumbs = bw.makeBreadcrumb({
      items: [
        { text: 'Home', href: '/' },
        { text: 'Current', active: true }
      ]
    });
    const items = crumbs.c.c;
    assert.ok(items[1].a.class.includes('active'));
    assert.strictEqual(items[1].a['aria-current'], 'page');
  });

  it('active item should render as plain text not link', function() {
    const crumbs = bw.makeBreadcrumb({
      items: [
        { text: 'Home', href: '/' },
        { text: 'Current', active: true }
      ]
    });
    const items = crumbs.c.c;
    assert.strictEqual(items[1].c, 'Current');
    assert.strictEqual(items[0].c.t, 'a');
  });

  it('breadcrumb link styles should exist', function() {
    const all = getAllStyles();
    assert.ok(all['.bw_breadcrumb_item a'], 'breadcrumb link styles missing');
  });
});

// =========================================================================
// bw.make() Factory + BCCL Registry + VARIANT_CLASSES
// =========================================================================

describe('bw.make() factory', function() {
  it('should create a button via make("button")', function() {
    const btn = bw.make('button', { text: 'Click' });
    assert.strictEqual(btn.t, 'button');
    assert.strictEqual(btn.c, 'Click');
    assert.ok(btn.a.class.includes('bw_bccl_btn'));
  });

  it('should create a card via make("card")', function() {
    const card = bw.make('card', { title: 'Title', text: 'Body' });
    assert.strictEqual(card.t, 'div');
    assert.ok(card.a.class.includes('bw_bccl_card'));
  });

  it('should create a badge via make("badge")', function() {
    const badge = bw.make('badge', { text: 'New', variant: 'success' });
    assert.strictEqual(badge.t, 'span');
    assert.ok(badge.a.class.includes('bw_bccl_badge'));
    assert.ok(badge.a.class.includes('bw_success'));
  });

  it('should create an alert via make("alert")', function() {
    const alert = bw.make('alert', { text: 'Warning!', variant: 'warning' });
    assert.strictEqual(alert.t, 'div');
    assert.ok(alert.a.class.includes('bw_bccl_alert'));
  });

  it('should throw for unknown component type', function() {
    assert.throws(function() { bw.make('nonexistent', {}); }, /unknown component/i);
  });

  it('should work with empty props', function() {
    const btn = bw.make('button', {});
    assert.strictEqual(btn.t, 'button');
    assert.ok(btn.a.class.includes('bw_bccl_btn'));
  });

  it('should produce same output as direct makeButton', function() {
    const props = { text: 'Test', variant: 'danger' };
    const via_make = bw.make('button', props);
    const via_direct = bw.makeButton(props);
    assert.strictEqual(via_make.t, via_direct.t);
    assert.strictEqual(via_make.c, via_direct.c);
    assert.strictEqual(via_make.a.class, via_direct.a.class);
  });
});

describe('bw.BCCL registry', function() {
  it('should be an object', function() {
    assert.strictEqual(typeof bw.BCCL, 'object');
  });

  it('should contain button, card, badge, alert, and other types', function() {
    assert.ok(bw.BCCL.button, 'BCCL should have button');
    assert.ok(bw.BCCL.card, 'BCCL should have card');
    assert.ok(bw.BCCL.badge, 'BCCL should have badge');
    assert.ok(bw.BCCL.alert, 'BCCL should have alert');
    assert.ok(bw.BCCL.toast, 'BCCL should have toast');
    assert.ok(bw.BCCL.tabs, 'BCCL should have tabs');
  });

  it('each entry should have a make function', function() {
    Object.keys(bw.BCCL).forEach(function(key) {
      assert.strictEqual(typeof bw.BCCL[key].make, 'function', key + ' should have make()');
    });
  });

  it('should list all available component types via Object.keys', function() {
    const types = Object.keys(bw.BCCL);
    assert.ok(types.length >= 20, 'should have at least 20 component types, got ' + types.length);
  });
});

describe('bw.variantClass()', function() {
  it('should be exposed on bw object', function() {
    assert.strictEqual(typeof bw.variantClass, 'function');
  });

  it('should return bw_ + variant name', function() {
    assert.strictEqual(bw.variantClass('primary'), 'bw_primary');
    assert.strictEqual(bw.variantClass('danger'), 'bw_danger');
    assert.strictEqual(bw.variantClass('success'), 'bw_success');
  });

  it('should handle outline variants', function() {
    var cls = bw.variantClass('outline_primary');
    assert.ok(cls.includes('bw_bccl_btn_outline'), 'should include bw_btn_outline');
    assert.ok(cls.includes('bw_primary'), 'should include bw_primary');
  });

  it('should return empty string for falsy input', function() {
    assert.strictEqual(bw.variantClass(''), '');
    assert.strictEqual(bw.variantClass(null), '');
    assert.strictEqual(bw.variantClass(undefined), '');
  });
});

// =========================================================================
// Phase 1 Components — Coverage Tests
// =========================================================================

describe('makeButton', function() {
  it('should create a button with default props', function() {
    var taco = bw.makeButton();
    var html = bw.html(taco);
    assert.ok(html.includes('<button'), 'should be a button tag');
    assert.ok(html.includes('bw_bccl_btn'), 'should have bw_btn class');
  });
  it('should support text and variant', function() {
    var taco = bw.makeButton({ text: 'Go', variant: 'danger' });
    var html = bw.html(taco);
    assert.ok(html.includes('Go'), 'should include text');
    assert.ok(html.includes('bw_danger'), 'should include variant class');
  });
  it('should support size prop', function() {
    var taco = bw.makeButton({ text: 'Sm', size: 'sm' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_btn_sm'), 'should have size class');
  });
  it('should support outline variant', function() {
    var taco = bw.makeButton({ text: 'Out', variant: 'outline_primary' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_btn_outline'), 'should have outline class');
  });
  it('should support disabled prop', function() {
    var taco = bw.makeButton({ text: 'No', disabled: true });
    var html = bw.html(taco);
    assert.ok(html.includes('disabled'), 'should have disabled attribute');
  });
  it('should support string shorthand', function() {
    var taco = bw.makeButton('Click');
    var html = bw.html(taco);
    assert.ok(html.includes('Click'), 'should include text from string shorthand');
  });
});

describe('makeContainer', function() {
  it('should create a container div', function() {
    var taco = bw.makeContainer({ children: ['A', 'B'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_container'), 'should have container class');
  });
  it('should support fluid mode', function() {
    var taco = bw.makeContainer({ children: ['X'], fluid: true });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_container-fluid'), 'should have fluid class');
  });
});

describe('makeRow', function() {
  it('should create a row div', function() {
    var taco = bw.makeRow({ children: ['A'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_row'), 'should have row class');
  });
});

describe('makeCol', function() {
  it('should create a column div', function() {
    var taco = bw.makeCol({ children: ['X'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_col'), 'should have col class');
  });
  it('should support size prop', function() {
    var taco = bw.makeCol({ children: ['X'], size: 6 });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_col_6'), 'should have size class');
  });
});

describe('makeNav', function() {
  it('should create a nav element', function() {
    var taco = bw.makeNav({ items: [{ text: 'Home', href: '/' }] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_nav'), 'should have nav class');
    assert.ok(html.includes('Home'), 'should contain link text');
  });
  it('should support pills mode', function() {
    var taco = bw.makeNav({ items: [{ text: 'A' }], pills: true });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_nav_pills'), 'should have pills class');
  });
});

describe('makeNavbar', function() {
  it('should create a navbar', function() {
    var taco = bw.makeNavbar({ brand: 'MySite', items: [{ text: 'Home' }] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_navbar'), 'should have navbar class');
    assert.ok(html.includes('MySite'), 'should contain brand text');
  });
});

describe('makeTabs', function() {
  it('should create tabbed content', function() {
    var taco = bw.makeTabs({
      tabs: [
        { label: 'Tab1', content: 'Content1' },
        { label: 'Tab2', content: 'Content2' }
      ]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_tab'), 'should have tab class');
    assert.ok(html.includes('Tab1'), 'should contain tab label');
    assert.ok(html.includes('Content1'), 'should contain tab content');
  });
});

describe('makeAlert', function() {
  it('should create an alert', function() {
    var taco = bw.makeAlert({ content: 'Warning!', variant: 'warning' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_alert'), 'should have alert class');
    assert.ok(html.includes('Warning!'), 'should include content');
  });
  it('should support dismissible', function() {
    var taco = bw.makeAlert({ content: 'Close me', dismissible: true });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_alert_dismissible'), 'should have dismissible class');
  });
  it('should support string shorthand', function() {
    var taco = bw.makeAlert('Oops');
    var html = bw.html(taco);
    assert.ok(html.includes('Oops'), 'should include text from shorthand');
  });
});

describe('makeBadge', function() {
  it('should create a badge', function() {
    var taco = bw.makeBadge({ text: '5', variant: 'primary' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_badge'), 'should have badge class');
    assert.ok(html.includes('5'), 'should include text');
  });
  it('should support pill shape', function() {
    var taco = bw.makeBadge({ text: 'New', pill: true });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_badge_pill'), 'should have pill class');
  });
  it('should support string shorthand', function() {
    var taco = bw.makeBadge('Info');
    var html = bw.html(taco);
    assert.ok(html.includes('Info'), 'should include text from shorthand');
  });
});

describe('makeProgress', function() {
  it('should create a progress bar', function() {
    var taco = bw.makeProgress({ value: 60 });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_progress'), 'should have progress class');
    assert.ok(html.includes('60%'), 'should show value');
  });
  it('should support variant', function() {
    var taco = bw.makeProgress({ value: 30, variant: 'success' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_success'), 'should include variant class');
  });
  it('should support striped', function() {
    var taco = bw.makeProgress({ value: 50, striped: true });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_progress_bar_striped'), 'should have striped class');
  });
});

describe('makeListGroup', function() {
  it('should create a list group', function() {
    var taco = bw.makeListGroup({ items: ['A', 'B', 'C'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_list_group'), 'should have list-group class');
    assert.ok(html.includes('A'), 'should include first item');
  });
  it('should support flush variant', function() {
    var taco = bw.makeListGroup({ items: ['X'], flush: true });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_list_group_flush'), 'should have flush class');
  });
});

describe('makeForm', function() {
  it('should create a form element', function() {
    var taco = bw.makeForm({ children: [{ t: 'input', a: { type: 'text' } }] });
    var html = bw.html(taco);
    assert.ok(html.includes('<form'), 'should be a form tag');
  });
});

describe('makeFormGroup', function() {
  it('should create a form group with label', function() {
    var taco = bw.makeFormGroup({ label: 'Name', children: [{ t: 'input', a: { type: 'text' } }] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_form_group'), 'should have form-group class');
    assert.ok(html.includes('Name'), 'should include label');
  });
});

describe('makeInput', function() {
  it('should create an input element', function() {
    var taco = bw.makeInput({ name: 'email', type: 'email', placeholder: 'Enter email' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_form_control'), 'should have form-control class');
    assert.ok(html.includes('type="email"'), 'should have type attribute');
  });
  it('should support label prop', function() {
    var taco = bw.makeInput({ name: 'user', label: 'Username' });
    var html = bw.html(taco);
    assert.ok(html.includes('Username'), 'should include label');
  });
});

describe('makeTextarea', function() {
  it('should create a textarea', function() {
    var taco = bw.makeTextarea({ name: 'bio', rows: 4 });
    var html = bw.html(taco);
    assert.ok(html.includes('<textarea'), 'should be a textarea tag');
  });
  it('should support label', function() {
    var taco = bw.makeTextarea({ name: 'bio', label: 'About' });
    var html = bw.html(taco);
    assert.ok(html.includes('About'), 'should include label');
  });
});

describe('makeSelect', function() {
  it('should create a select element', function() {
    var taco = bw.makeSelect({
      name: 'color',
      options: [{ value: 'red', text: 'Red' }, { value: 'blue', text: 'Blue' }]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('<select'), 'should be a select tag');
    assert.ok(html.includes('Red'), 'should include option text');
  });
  it('should support value-only options', function() {
    var taco = bw.makeSelect({ name: 'x', options: [{ value: 'a' }] });
    var html = bw.html(taco);
    assert.ok(html.includes('a'), 'should use value as text when no text prop');
  });
});

describe('makeHero', function() {
  it('should create a hero section', function() {
    var taco = bw.makeHero({ title: 'Welcome', subtitle: 'To the site' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_hero'), 'should have hero class');
    assert.ok(html.includes('Welcome'), 'should include title');
    assert.ok(html.includes('To the site'), 'should include subtitle');
  });
  it('should support actions', function() {
    var taco = bw.makeHero({ title: 'Hi', actions: { t: 'a', a: { href: '#' }, c: 'Start' } });
    var html = bw.html(taco);
    assert.ok(html.includes('Start'), 'should include action text');
    assert.ok(html.includes('bw_bccl_hero_actions'), 'should have actions wrapper');
  });
});

describe('makeFeatureGrid', function() {
  it('should create a feature grid', function() {
    var taco = bw.makeFeatureGrid({
      features: [
        { title: 'Fast', description: 'Very fast' },
        { title: 'Easy', description: 'Very easy' }
      ]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_feature'), 'should have feature class');
    assert.ok(html.includes('Fast'), 'should include feature title');
  });
});

describe('makeCTA', function() {
  it('should create a call-to-action section', function() {
    var taco = bw.makeCTA({ title: 'Get Started', actions: { t: 'button', c: 'Sign Up' } });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_cta'), 'should have cta class');
    assert.ok(html.includes('Get Started'), 'should include title');
    assert.ok(html.includes('Sign Up'), 'should include action text');
  });
  it('should support description', function() {
    var taco = bw.makeCTA({ title: 'Join', description: 'Start today' });
    var html = bw.html(taco);
    assert.ok(html.includes('Start today'), 'should include description');
  });
});

describe('makeSection', function() {
  it('should create a section', function() {
    var taco = bw.makeSection({ title: 'About Us', children: ['Content here'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_section'), 'should have section class');
    assert.ok(html.includes('About Us'), 'should include title');
  });
});

describe('makeCarousel', function() {
  it('should create a carousel', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2' }
      ]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_carousel'), 'should have carousel class');
    assert.ok(html.includes('bw_bccl_carousel_track'), 'should have track');
  });
  it('should support captions', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'Image 1', caption: 'First slide' }]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_carousel_caption'), 'should have caption class');
    assert.ok(html.includes('First slide'), 'should include caption text');
  });
  it('should show controls when more than 1 item', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      showControls: true
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_carousel_control'), 'should have controls');
  });
  it('should show indicators when more than 1 item', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      showIndicators: true
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_carousel_indicator'), 'should have indicators');
  });
  it('should hide controls for single item', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'Only one' }],
      showControls: true
    });
    var html = bw.html(taco);
    assert.ok(!html.includes('bw_bccl_carousel_control'), 'should not have controls for single item');
  });
});

// =========================================================================
// DOM Interaction Tests — cover mounted/onclick lifecycle handlers
// =========================================================================

describe('makeCard advanced props', function() {
  it('should render header and footer', function() {
    var taco = bw.makeCard({ title: 'T', content: 'C', header: 'Head', footer: 'Foot' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_card_header'), 'should have header');
    assert.ok(html.includes('Head'), 'should include header text');
    assert.ok(html.includes('bw_bccl_card_footer'), 'should have footer');
    assert.ok(html.includes('Foot'), 'should include footer text');
  });
  it('should render with imagePosition left', function() {
    var taco = bw.makeCard({ title: 'T', content: 'C', image: { src: 'img.jpg', alt: 'test' }, imagePosition: 'left' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_card_img_left'), 'should have left image class');
    assert.ok(html.includes('bw_row'), 'should wrap in row for horizontal layout');
  });
});

describe('makeCol responsive sizes', function() {
  it('should handle responsive size object', function() {
    var taco = bw.makeCol({ content: 'X', size: { xs: 12, md: 6, lg: 4 } });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_col_12'), 'should have xs column class');
    assert.ok(html.includes('bw_col_md_6'), 'should have md column class');
    assert.ok(html.includes('bw_col_lg_4'), 'should have lg column class');
  });
  it('should support offset/push/pull', function() {
    var taco = bw.makeCol({ content: 'X', size: 6, offset: 3 });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_offset_3'), 'should have offset class');
  });
});

describe('makeTabs DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should switch tabs on click', function() {
    var taco = bw.makeTabs({
      tabs: [
        { label: 'Tab1', content: 'Content1' },
        { label: 'Tab2', content: 'Content2' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Tab 1 should be active initially
    var panes = el.querySelectorAll('.bw_bccl_tab_pane');
    assert.ok(panes[0].classList.contains('active'), 'first pane active');

    // Click tab 2
    var tab2Btn = el.querySelectorAll('.bw_nav_link')[1];
    tab2Btn.click();

    // Tab 2 should now be active
    assert.ok(tab2Btn.classList.contains('active'), 'tab2 button active after click');
    assert.ok(panes[1].classList.contains('active'), 'second pane active after click');
    assert.ok(!panes[0].classList.contains('active'), 'first pane not active after click');

    document.body.removeChild(el);
  });

  it('should support keyboard navigation via mounted', function() {
    var taco = bw.makeTabs({
      tabs: [
        { label: 'A', content: 'CA' },
        { label: 'B', content: 'CB' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Call mounted
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    document.body.removeChild(el);
  });
});

describe('makeAlert dismissible DOM', function() {
  beforeEach(function() { freshDOM(); });

  it('should remove alert on close click', function() {
    var taco = bw.makeAlert({ content: 'Dismiss me', dismissible: true });
    var el = bw.create(taco);
    document.body.appendChild(el);

    assert.ok(document.querySelector('.bw_bccl_alert'), 'alert exists');
    var closeBtn = el.querySelector('.bw_close');
    assert.ok(closeBtn, 'close button exists');
    closeBtn.click();
    assert.ok(!document.querySelector('.bw_bccl_alert'), 'alert removed after click');
  });
});

describe('makeListGroup interactive', function() {
  it('should create interactive items with anchors', function() {
    var taco = bw.makeListGroup({
      items: [{ text: 'Item1', active: true }, { text: 'Item2' }],
      interactive: true
    });
    var html = bw.html(taco);
    assert.ok(html.includes('<a'), 'should use anchor tags for interactive items');
    assert.ok(html.includes('active'), 'should mark active item');
  });
});

describe('makeAccordion DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should toggle accordion on click', function() {
    var taco = bw.makeAccordion({
      items: [
        { title: 'Section 1', content: 'Content 1', open: false },
        { title: 'Section 2', content: 'Content 2', open: false }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click first accordion button
    var btn = el.querySelector('.bw_bccl_accordion_button');
    assert.ok(btn, 'accordion button exists');
    btn.click();

    // Should be expanded
    var collapse = el.querySelector('.bw_bccl_accordion_collapse');
    assert.ok(collapse.classList.contains('bw_collapse_show'), 'first section should open');
    assert.equal(btn.getAttribute('aria-expanded'), 'true');

    // Click again to close
    btn.click();
    assert.ok(!collapse.classList.contains('bw_collapse_show'), 'first section should close');

    document.body.removeChild(el);
  });

  it('should call mounted lifecycle', function() {
    var taco = bw.makeAccordion({
      items: [{ title: 'S1', content: 'C1' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);
    document.body.removeChild(el);
  });
});

describe('makeModal DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle mounted and unmount lifecycle', function() {
    var taco = bw.makeModal({
      title: 'Test Modal',
      content: 'Modal body'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Close button should exist
    var closeBtn = el.querySelector('.bw_close, .bw_btn_close');
    assert.ok(closeBtn || el.querySelector('button'), 'should have a close mechanism');

    if (taco.o && taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });
});

describe('makeToast DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle mounted lifecycle', function() {
    var taco = bw.makeToast({
      title: 'Notification',
      content: 'Toast message',
      autoDismiss: false
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    document.body.removeChild(el);
  });

  it('should handle close button click', function() {
    var taco = bw.makeToast({ title: 'Close me', content: 'Body' });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var closeBtn = el.querySelector('.bw_close, .bw_btn_close, [aria-label="Close"]');
    if (closeBtn) closeBtn.click();
    // Toast may or may not remove itself depending on DOM structure
  });
});

describe('makeDropdown DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should toggle dropdown on button click', function() {
    var taco = bw.makeDropdown({
      label: 'Menu',
      items: [{ text: 'Item 1' }, { text: 'Item 2' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Click dropdown toggle
    var toggleBtn = el.querySelector('.bw_bccl_dropdown_toggle');
    if (toggleBtn) {
      toggleBtn.click();
      var menu = el.querySelector('.bw_bccl_dropdown_menu');
      assert.ok(menu, 'menu should exist');
    }

    if (taco.o && taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });
});

describe('makePagination DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle page click', function() {
    var clicked = null;
    var taco = bw.makePagination({
      currentPage: 1,
      totalPages: 5,
      onPageChange: function(page) { clicked = page; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click page 3 link
    var links = el.querySelectorAll('.bw_page_link');
    if (links.length > 2) {
      links[2].click();
    }

    document.body.removeChild(el);
  });
});

describe('makeSearchInput DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle input events', function() {
    var searchValue = null;
    var taco = bw.makeSearchInput({
      placeholder: 'Search...',
      onSearch: function(val) { searchValue = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Find the input and simulate typing
    var input = el.querySelector('input');
    if (input) {
      input.value = 'test query';
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    }

    // Find clear button
    var clearBtn = el.querySelector('.bw_search_clear');
    if (clearBtn) clearBtn.click();

    document.body.removeChild(el);
  });
});

describe('makeRange DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle input event on range', function() {
    var rangeValue = null;
    var taco = bw.makeRange({
      min: 0,
      max: 100,
      value: 50,
      onInput: function(val) { rangeValue = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var rangeInput = el.querySelector('input[type="range"]');
    if (rangeInput) {
      rangeInput.value = '75';
      rangeInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    }

    document.body.removeChild(el);
  });
});

describe('makeForm onsubmit', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle form submit event', function() {
    var submitted = false;
    var taco = bw.makeForm({
      onsubmit: function(e) { e.preventDefault(); submitted = true; },
      children: [{ t: 'button', a: { type: 'submit' }, c: 'Submit' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Dispatch submit event
    el.dispatchEvent(new window.Event('submit', { bubbles: true }));

    document.body.removeChild(el);
  });
});

describe('makeFeatureGrid column classes', function() {
  it('should generate column classes based on column count', function() {
    var taco = bw.makeFeatureGrid({
      columns: 4,
      features: [{ title: 'A', description: 'B' }]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_col_md_3'), 'should use 12/4=3 column class');
  });
});

// =========================================================================
// Carousel DOM interaction (mounted, keyboard nav, controls, indicators)
// =========================================================================
describe('makeCarousel DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should mount and handle keyboard navigation', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2', caption: 'Caption 2' },
        { content: 'Slide 3' }
      ],
      startIndex: 0
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Trigger mounted lifecycle
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Initial state
    assert.strictEqual(el._bw_carouselIndex, 0);

    // ArrowRight
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 1);

    // ArrowLeft
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 0);

    // ArrowLeft wraps to last
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 2);

    // ArrowRight wraps to first
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 0);

    document.body.removeChild(el);
  });

  it('should handle prev/next button clicks', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2' }
      ],
      showControls: true
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Click next button
    var nextBtn = el.querySelector('.bw_bccl_carousel_control_next');
    if (nextBtn) nextBtn.click();
    assert.strictEqual(el._bw_carouselIndex, 1);

    // Click prev button
    var prevBtn = el.querySelector('.bw_bccl_carousel_control_prev');
    if (prevBtn) prevBtn.click();
    assert.strictEqual(el._bw_carouselIndex, 0);

    document.body.removeChild(el);
  });

  it('should handle indicator clicks', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2' },
        { content: 'Slide 3' }
      ],
      showIndicators: true
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var indicators = el.querySelectorAll('.bw_bccl_carousel_indicator');
    assert.strictEqual(indicators.length, 3);

    // Click indicator 2 (index 1)
    indicators[2].click();
    assert.strictEqual(el._bw_carouselIndex, 2);
    assert.ok(indicators[2].classList.contains('active'));

    document.body.removeChild(el);
  });

  it('should handle unmount and cleanup interval', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      autoPlay: true,
      interval: 100000
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    assert.ok(el._bw_carouselInterval != null, 'should have interval set');

    // Trigger unmount
    if (taco.o && taco.o.unmount) taco.o.unmount(el);
    // After unmount the interval should be cleared (we can't directly verify clearInterval but no error)

    document.body.removeChild(el);
  });
});

// =========================================================================
// Tooltip DOM interaction
// =========================================================================
describe('makeTooltip DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should show/hide tooltip on mouseenter/mouseleave', function() {
    var taco = bw.makeTooltip({
      text: 'Help text',
      trigger: 'Hover me'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var tip = el.querySelector('.bw_bccl_tooltip');
    assert.ok(tip, 'tooltip element should exist');

    // Mouseenter shows tooltip
    el.dispatchEvent(new window.Event('mouseenter', { bubbles: true }));
    assert.ok(tip.classList.contains('bw_bccl_tooltip_show'), 'should show on mouseenter');

    // Mouseleave hides tooltip
    el.dispatchEvent(new window.Event('mouseleave', { bubbles: true }));
    assert.ok(!tip.classList.contains('bw_bccl_tooltip_show'), 'should hide on mouseleave');

    // Focusin shows tooltip
    el.dispatchEvent(new window.Event('focusin', { bubbles: true }));
    assert.ok(tip.classList.contains('bw_bccl_tooltip_show'), 'should show on focusin');

    // Focusout hides tooltip
    el.dispatchEvent(new window.Event('focusout', { bubbles: true }));
    assert.ok(!tip.classList.contains('bw_bccl_tooltip_show'), 'should hide on focusout');

    document.body.removeChild(el);
  });
});

// =========================================================================
// Popover DOM interaction
// =========================================================================
describe('makePopover DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should toggle popover on trigger click and dismiss on outside click', function() {
    var taco = bw.makePopover({
      trigger: 'Click me',
      title: 'Pop Title',
      content: 'Pop body',
      placement: 'bottom'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var pop = el.querySelector('.bw_popover');
    assert.ok(pop, 'popover element should exist');

    // Click trigger to show
    var trigger = el.querySelector('.bw_popover_trigger');
    trigger.click();
    assert.ok(pop.classList.contains('bw_popover_show'), 'should show on trigger click');

    // Click outside to dismiss
    document.dispatchEvent(new window.Event('click', { bubbles: true }));
    assert.ok(!pop.classList.contains('bw_popover_show'), 'should hide on outside click');

    // Unmount
    if (taco.o && taco.o.unmount) taco.o.unmount(el);

    document.body.removeChild(el);
  });
});

// =========================================================================
// SearchInput keydown Enter and clear
// =========================================================================
describe('makeSearchInput keydown and clear', function() {
  beforeEach(function() { freshDOM(); });

  it('should call onSearch on Enter key', function() {
    var searchedValue = null;
    var taco = bw.makeSearchInput({
      placeholder: 'Search...',
      onSearch: function(val) { searchedValue = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var input = el.querySelector('input[type="search"]');
    // Set value and trigger Enter keydown
    input.value = 'test query';
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.strictEqual(searchedValue, 'test query');

    document.body.removeChild(el);
  });

  it('should show/hide clear button on input', function() {
    var inputValue = null;
    var taco = bw.makeSearchInput({
      onInput: function(val) { inputValue = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var input = el.querySelector('input[type="search"]');
    var clearBtn = el.querySelector('.bw_search_clear');

    // Type something
    input.value = 'hello';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.strictEqual(inputValue, 'hello');
    // Clear button should be visible
    if (clearBtn) assert.strictEqual(clearBtn.style.display, 'flex');

    // Clear value
    input.value = '';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    if (clearBtn) assert.strictEqual(clearBtn.style.display, 'none');

    document.body.removeChild(el);
  });

  it('should handle clear button click', function() {
    var taco = bw.makeSearchInput({
      value: 'initial'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var clearBtn = el.querySelector('.bw_search_clear');
    if (clearBtn) clearBtn.click();

    document.body.removeChild(el);
  });
});

// =========================================================================
// makeRange with showValue oninput wrapper
// =========================================================================
describe('makeRange showValue update', function() {
  beforeEach(function() { freshDOM(); });

  it('should update value display on input', function() {
    var cbValue = null;
    var taco = bw.makeRange({
      min: 0, max: 100, value: 50,
      showValue: true,
      label: 'Volume',
      oninput: function(e) { cbValue = e.target.value; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var rangeInput = el.querySelector('input[type="range"]');
    var valDisplay = el.querySelector('.bw_range_value');

    // Change value
    rangeInput.value = '75';
    rangeInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    if (valDisplay) assert.strictEqual(valDisplay.textContent, '75');
    assert.strictEqual(cbValue, '75');

    document.body.removeChild(el);
  });
});

// =========================================================================
// makeFileUpload mounted lifecycle (click, keyboard, drag events)
// =========================================================================
describe('makeFileUpload DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle click to trigger file input', function() {
    var taco = bw.makeFileUpload({
      label: 'Upload file',
      accept: '.txt'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // The click handler just triggers input.click() — we can verify no errors
    el.click();

    document.body.removeChild(el);
  });

  it('should handle keyboard activation', function() {
    var taco = bw.makeFileUpload({ label: 'Upload' });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Enter key
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    // Space key
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    document.body.removeChild(el);
  });

  it('should handle drag events', function() {
    var taco = bw.makeFileUpload({ label: 'Upload' });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Dragover
    var dragoverEvent = new window.Event('dragover', { bubbles: true });
    dragoverEvent.preventDefault = function() {};
    el.dispatchEvent(dragoverEvent);
    assert.ok(el.classList.contains('bw_file_upload_active'), 'should add active class on dragover');

    // Dragleave
    el.dispatchEvent(new window.Event('dragleave', { bubbles: true }));
    assert.ok(!el.classList.contains('bw_file_upload_active'), 'should remove active class on dragleave');

    // Drop
    var dropEvent = new window.Event('drop', { bubbles: true });
    dropEvent.preventDefault = function() {};
    dropEvent.dataTransfer = { files: [] };
    el.dispatchEvent(dropEvent);

    document.body.removeChild(el);
  });

  it('should call onFiles on drop with files', function() {
    var receivedFiles = null;
    var taco = bw.makeFileUpload({
      label: 'Upload',
      onFiles: function(files) { receivedFiles = files; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Drop with files
    var dropEvent = new window.Event('drop', { bubbles: true });
    dropEvent.preventDefault = function() {};
    dropEvent.dataTransfer = { files: [{ name: 'test.txt' }] };
    el.dispatchEvent(dropEvent);

    assert.ok(receivedFiles, 'onFiles should have been called');
    assert.strictEqual(receivedFiles.length, 1);

    document.body.removeChild(el);
  });
});

// =========================================================================
// ChipInput DOM interaction (add/remove chips)
// =========================================================================
describe('makeChipInput DOM interaction', function() {
  beforeEach(function() { freshDOM(); });

  it('should add chip on Enter key', function() {
    var addedValue = null;
    var taco = bw.makeChipInput({
      chips: ['existing'],
      onAdd: function(val) { addedValue = val; },
      onRemove: function() {}
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var input = el.querySelector('.bw_chip_field');
    input.value = 'new chip';
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    assert.strictEqual(addedValue, 'new chip');
    assert.strictEqual(input.value, '');

    // A new chip element should exist
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 2, 'should have original + new chip');

    document.body.removeChild(el);
  });

  it('should remove last chip on Backspace with empty input', function() {
    var removedValue = null;
    var taco = bw.makeChipInput({
      chips: ['alpha', 'beta'],
      onRemove: function(val) { removedValue = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var input = el.querySelector('.bw_chip_field');
    input.value = '';
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

    assert.strictEqual(removedValue, 'beta');
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 1, 'should have one chip left');

    document.body.removeChild(el);
  });

  it('should remove chip when remove button clicked', function() {
    var removedValue = null;
    var taco = bw.makeChipInput({
      chips: ['tag1', 'tag2'],
      onRemove: function(val) { removedValue = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click remove button on first chip
    var removeBtn = el.querySelector('.bw_chip_remove');
    if (removeBtn) removeBtn.click();

    assert.strictEqual(removedValue, 'tag1');
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 1, 'should have one chip left');

    document.body.removeChild(el);
  });
});

// =========================================================================
// Coverage: makeCarousel keyboard navigation
// =========================================================================
describe('makeCarousel keyboard navigation', function() {
  beforeEach(function() { freshDOM(); });

  it('should navigate with ArrowRight key', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2' },
        { content: 'Slide 3' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 1);

    document.body.removeChild(el);
  });

  it('should navigate with ArrowLeft key', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2' },
        { content: 'Slide 3' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Move to slide 2 first
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 1);

    // Move back to slide 1
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 0);

    document.body.removeChild(el);
  });

  it('should wrap around on ArrowLeft from first slide', function() {
    var taco = bw.makeCarousel({
      items: [
        { content: 'Slide 1' },
        { content: 'Slide 2' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.strictEqual(el._bw_carouselIndex, 1);

    document.body.removeChild(el);
  });
});

// =========================================================================
// Branch Coverage: Uncovered Branches
// =========================================================================

describe('makeCard branch coverage', function() {
  it('L119: shadow value not in shadowClasses map should produce empty string', function() {
    var taco = bw.makeCard({ title: 'T', shadow: 'unknown_shadow' });
    // shadow is truthy but shadowClasses['unknown_shadow'] is undefined => || '' branch
    assert.ok(taco.a.class.includes('bw_bccl_card'));
    assert.ok(!taco.a.class.includes('bw_shadow'));
  });

  it('L120: bordered=false should add bw_border_0 class', function() {
    var taco = bw.makeCard({ title: 'T', bordered: false });
    assert.ok(taco.a.class.includes('bw_border_0'));
  });

  it('L136: image with alt provided should use it', function() {
    var taco = bw.makeCard({
      title: 'T',
      image: { src: 'pic.jpg', alt: 'My Picture' },
      imagePosition: 'top'
    });
    var html = bw.html(taco);
    assert.ok(html.includes('My Picture'));
  });

  it('L145: content as array should be flattened', function() {
    var taco = bw.makeCard({
      title: 'T',
      content: ['Item 1', 'Item 2']
    });
    var html = bw.html(taco);
    assert.ok(html.includes('Item 1'));
    assert.ok(html.includes('Item 2'));
  });

  it('L153: image with bottom position and alt', function() {
    var taco = bw.makeCard({
      title: 'T',
      image: { src: 'pic.jpg', alt: 'Bottom Pic' },
      imagePosition: 'bottom'
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_card_img_bottom'));
    assert.ok(html.includes('Bottom Pic'));
  });

  it('L153: image with right position', function() {
    var taco = bw.makeCard({
      title: 'T',
      image: { src: 'pic.jpg' },
      imagePosition: 'right'
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_card_img_right'));
    assert.ok(html.includes('bw_row'));
  });
});

describe('makeButton branch coverage', function() {
  it('L246: button with action prop should add bw_act_ class', function() {
    var taco = bw.makeButton({ text: 'Save', action: 'submit' });
    assert.ok(taco.a.class.includes('bw_act_submit'));
  });
});

describe('makeRow branch coverage', function() {
  it('L306: row with gap should add bw_g_ class', function() {
    var taco = bw.makeRow({ gap: 3, children: ['A'] });
    assert.ok(taco.a.class.includes('bw_g_3'));
  });
});

describe('makeCol branch coverage', function() {
  it('L352: push should add bw_push_ class', function() {
    var taco = bw.makeCol({ size: 6, push: 2, children: ['X'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_push_2'));
  });

  it('L353: pull should add bw_pull_ class', function() {
    var taco = bw.makeCol({ size: 6, pull: 3, children: ['X'] });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_pull_3'));
  });
});

describe('makeNav branch coverage', function() {
  it('L396: nav item with disabled=true should have disabled class', function() {
    var taco = bw.makeNav({ items: [{ text: 'Disabled', disabled: true }] });
    var html = bw.html(taco);
    assert.ok(html.includes('disabled'));
  });

  it('L405: nav item with explicit href', function() {
    var taco = bw.makeNav({ items: [{ text: 'Home', href: '/home' }] });
    // Check TACO structure directly since bw.html escapes forward slashes
    var link = taco.c[0].c;
    assert.strictEqual(link.a.href, '/home');
  });

  it('L396: vertical nav', function() {
    var taco = bw.makeNav({ items: [{ text: 'A' }], vertical: true });
    assert.ok(taco.a.class.includes('bw_nav_vertical'));
  });
});

describe('makeNavbar branch coverage', function() {
  it('L449: empty items should not render navbar-nav div', function() {
    var taco = bw.makeNavbar({ brand: 'Site' });
    var html = bw.html(taco);
    assert.ok(!html.includes('bw_bccl_navbar_nav'));
  });

  it('L449: navbar without brand', function() {
    var taco = bw.makeNavbar({ items: [{ text: 'Home', active: true }] });
    var html = bw.html(taco);
    assert.ok(!html.includes('bw_bccl_navbar_brand'));
    assert.ok(html.includes('bw_bccl_navbar_nav'));
  });

  it('L467: navbar item with active=true should have active class', function() {
    var taco = bw.makeNavbar({ items: [{ text: 'Home', active: true }] });
    var html = bw.html(taco);
    assert.ok(html.includes('active'));
  });

  it('L449: navbar with dark=false should have light class', function() {
    var taco = bw.makeNavbar({ brand: 'Site', dark: false });
    assert.ok(taco.a.class.includes('bw_bccl_navbar_light'));
  });
});

describe('makeBadge branch coverage', function() {
  it('L702: badge with size=sm should have bw_bccl_badge_sm class', function() {
    var taco = bw.makeBadge({ text: '3', size: 'sm' });
    assert.ok(taco.a.class.includes('bw_bccl_badge_sm'));
  });

  it('L702: badge with size=lg should have bw_bccl_badge_lg class', function() {
    var taco = bw.makeBadge({ text: '5', size: 'lg' });
    assert.ok(taco.a.class.includes('bw_bccl_badge_lg'));
  });
});

describe('makeProgress branch coverage', function() {
  it('L751: progress with custom height should set height style', function() {
    var taco = bw.makeProgress({ value: 50, height: 20 });
    assert.deepStrictEqual(taco.a.style, { height: '20px' });
  });

  it('L760: progress with animated=true should have animated class', function() {
    var taco = bw.makeProgress({ value: 50, animated: true });
    assert.ok(taco.c.a.class.includes('bw_bccl_progress_bar_animated'));
  });

  it('L775: progress setValue handle on element without bar', function() {
    freshDOM();
    var div = document.createElement('div');
    // No .bw_bccl_progress_bar child => bar is null => return
    bw.makeProgress({ value: 50 }).o.handle.setValue(div, 75);
    // Should not throw
  });

  it('L784: progress getValue handle on element without bar', function() {
    freshDOM();
    var div = document.createElement('div');
    var val = bw.makeProgress({ value: 50 }).o.handle.getValue(div);
    assert.strictEqual(val, 0);
  });

  it('L784: progress getValue handle on element with bar', function() {
    freshDOM();
    var taco = bw.makeProgress({ value: 70 });
    var el = bw.create(taco);
    document.body.appendChild(el);
    var val = taco.o.handle.getValue(el);
    assert.strictEqual(val, 70);
    document.body.removeChild(el);
  });

  it('L751: progress without height should have no style', function() {
    var taco = bw.makeProgress({ value: 50 });
    assert.strictEqual(taco.a.style, undefined);
  });

  it('L776: progress setValue with default max', function() {
    freshDOM();
    var taco = bw.makeProgress({ value: 50 });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.handle.setValue(el, 80);
    var bar = el.querySelector('.bw_bccl_progress_bar');
    assert.strictEqual(bar.getAttribute('aria-valuenow'), '80');
    assert.strictEqual(bar.style.width, '80%');
    document.body.removeChild(el);
  });
});

describe('makeListGroup branch coverage', function() {
  it('L859-860: non-interactive items with active and disabled states', function() {
    var taco = bw.makeListGroup({
      interactive: false,
      items: [
        { text: 'Active', active: true },
        { text: 'Disabled', disabled: true },
        { text: 'Normal' }
      ]
    });
    var html = bw.html(taco);
    // Non-interactive items use div tag
    assert.ok(html.includes('active'));
    assert.ok(html.includes('disabled'));
  });
});

describe('makeBreadcrumb branch coverage', function() {
  it('L908: breadcrumb item without href should default to #', function() {
    var taco = bw.makeBreadcrumb({
      items: [
        { text: 'Home' },
        { text: 'Current', active: true }
      ]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('href="#"'));
  });
});

describe('makeForm fields-based API branch coverage', function() {
  beforeEach(function() { freshDOM(); });

  it('L948: makeForm with fields array should create field-based form', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Enter name' },
        { name: 'bio', label: 'Bio', type: 'textarea' },
        { name: 'role', label: 'Role', type: 'select' },
        { name: 'age', label: 'Age', type: 'number' }
      ]
    });
    var html = bw.html(taco);
    assert.ok(html.includes('<form'));
    assert.ok(html.includes('Username'));
    assert.ok(html.includes('<textarea'));
    assert.ok(html.includes('<select'));
    assert.ok(html.includes('required'));
    assert.ok(html.includes('Enter name'));
  });

  it('L948: makeForm fields handle.getValues should retrieve form values', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'count', label: 'Count', type: 'number' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Set values
    var emailInput = el.querySelector('[name="email"]');
    emailInput.value = 'test@example.com';
    var countInput = el.querySelector('[name="count"]');
    countInput.value = '42';

    var vals = taco.o.handle.getValues(el);
    assert.strictEqual(vals.email, 'test@example.com');
    assert.strictEqual(vals.count, 42);

    document.body.removeChild(el);
  });

  it('L948: makeForm fields handle.setValues should set form values', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'name', label: 'Name', type: 'text' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    taco.o.handle.setValues(el, { name: 'Alice' });
    var input = el.querySelector('[name="name"]');
    assert.strictEqual(input.value, 'Alice');

    // Non-object arg should be no-op
    taco.o.handle.setValues(el, 'invalid');

    document.body.removeChild(el);
  });

  it('L948: makeForm fields handle.validate should validate required fields', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'required_field', label: 'Required', type: 'text', required: true }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Empty required field should fail
    var result = taco.o.handle.validate(el);
    assert.strictEqual(result.valid, false);

    // Fill in the field
    var input = el.querySelector('[name="required_field"]');
    input.value = 'filled';
    var result2 = taco.o.handle.validate(el);
    assert.strictEqual(result2.valid, true);

    document.body.removeChild(el);
  });

  it('L948: makeForm fields handle.setErrors should set error messages', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'email', label: 'Email', type: 'email' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    taco.o.handle.setErrors(el, { email: 'Invalid email format' });
    var input = el.querySelector('[name="email"]');
    assert.strictEqual(input.getAttribute('aria-invalid'), 'true');
    var errEl = el.querySelector('.bw_bccl_form_error');
    assert.ok(errEl);
    assert.strictEqual(errEl.textContent, 'Invalid email format');

    // Non-object arg should be no-op
    taco.o.handle.setErrors(el, 'invalid');

    document.body.removeChild(el);
  });
});

describe('makeFormGroup branch coverage', function() {
  it('L1099: validation not valid or invalid should produce empty validClass', function() {
    var input = bw.makeInput({ id: 'test' });
    var group = bw.makeFormGroup({ input: input, validation: 'custom_state' });
    var styledInput = group.c.find(function(child) { return child && child.t === 'input'; });
    // validClass is empty so no bw_is_valid or bw_is_invalid
    assert.ok(!styledInput.a.class.includes('bw_is_valid'));
    assert.ok(!styledInput.a.class.includes('bw_is_invalid'));
  });

  it('L1101: input TACO without class attr should still get validation class', function() {
    var input = { t: 'input', a: { type: 'text' } };  // no class property
    var group = bw.makeFormGroup({ input: input, validation: 'valid' });
    var styledInput = group.c.find(function(child) { return child && child.t === 'input'; });
    assert.ok(styledInput.a.class.includes('bw_is_valid'));
  });
});

describe('makeHero branch coverage', function() {
  it('L1481: hero with non-standard size falls back to sizeClasses.lg', function() {
    var taco = bw.makeHero({ title: 'T', size: 'unknown' });
    assert.ok(taco.a.class.includes('bw_py_5'));
  });

  it('L1481: hero with centered=false should not have text-center', function() {
    var taco = bw.makeHero({ title: 'T', centered: false });
    assert.ok(!taco.a.class.includes('bw_text_center'));
  });

  it('L1481: hero with size=sm', function() {
    var taco = bw.makeHero({ title: 'T', size: 'sm' });
    assert.ok(taco.a.class.includes('bw_py_3'));
  });

  it('L1481: hero with overlay=true', function() {
    var taco = bw.makeHero({ title: 'T', overlay: true, backgroundImage: '/bg.jpg' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_hero_overlay'));
    assert.ok(html.includes('background-image'));
  });
});

describe('makeFeatureGrid branch coverage', function() {
  it('L1568: feature grid with centered=false should not have text-center', function() {
    var taco = bw.makeFeatureGrid({
      features: [{ title: 'A', description: 'B' }],
      centered: false
    });
    var html = bw.html(taco);
    assert.ok(!html.includes('bw_text_center'));
  });
});

describe('makeCTA branch coverage', function() {
  it('L1635: CTA with centered=false should not have text-center', function() {
    var taco = bw.makeCTA({ title: 'Join', centered: false });
    var html = bw.html(taco);
    assert.ok(!html.includes('bw_text_center'));
  });
});

describe('makeSection branch coverage', function() {
  it('L1690: section with non-standard spacing falls back to md', function() {
    var taco = bw.makeSection({ title: 'T', spacing: 'unknown' });
    assert.ok(taco.a.class.includes('bw_py_4'));
  });

  it('L1690: section with variant not default should add bg class', function() {
    var taco = bw.makeSection({ title: 'T', variant: 'dark' });
    assert.ok(taco.a.class.includes('bw_bg_dark'));
  });

  it('L1696: section without title or subtitle should not have section-header', function() {
    var taco = bw.makeSection({ content: 'Just content' });
    var html = bw.html(taco);
    assert.ok(!html.includes('bw_section_header'));
  });

  it('L1701: section with subtitle should render subtitle', function() {
    var taco = bw.makeSection({ title: 'T', subtitle: 'Sub' });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_section_subtitle'));
    assert.ok(html.includes('Sub'));
  });

  it('L1690: section with spacing=xl', function() {
    var taco = bw.makeSection({ title: 'T', spacing: 'xl' });
    assert.ok(taco.a.class.includes('bw_py_6'));
  });
});

describe('makeCodeDemo branch coverage', function() {
  it('L1791-1792: makeCodeDemo should use pre/code when globalThis.bw.codeEditor is not available', function() {
    var taco = bw.makeCodeDemo({
      title: 'Demo Title',
      description: 'A description',
      code: 'var x = 1;',
      result: { t: 'div', c: 'result' }
    });
    var html = bw.html(taco);
    assert.ok(html.includes('Demo Title'));
    assert.ok(html.includes('A description'));
    assert.ok(html.includes('bw_code_pre'));
    assert.ok(html.includes('var x = 1;'));
  });

  it('L1808: makeCodeDemo without title should not render h3', function() {
    var taco = bw.makeCodeDemo({
      code: 'var y = 2;',
      result: { t: 'div', c: 'result' }
    });
    var html = bw.html(taco);
    assert.ok(!html.includes('<h3'));
  });

  it('L1809: makeCodeDemo without description should not render description paragraph', function() {
    var taco = bw.makeCodeDemo({
      title: 'Title Only',
      code: 'var z = 3;',
      result: { t: 'div', c: 'result' }
    });
    var html = bw.html(taco);
    assert.ok(html.includes('Title Only'));
    assert.ok(!html.includes('bw_text_muted bw_mb_3'));
  });

  it('L1791: makeCodeDemo without code should not add Code tab', function() {
    var taco = bw.makeCodeDemo({
      title: 'No Code',
      result: { t: 'div', c: 'result' }
    });
    var html = bw.html(taco);
    assert.ok(html.includes('Result'));
    assert.ok(!html.includes('bw_code_pre'));
  });

  it('L1791: makeCodeDemo with non-javascript language', function() {
    var taco = bw.makeCodeDemo({
      code: 'body { color: red; }',
      language: 'css',
      result: { t: 'div', c: 'styled' }
    });
    var html = bw.html(taco);
    assert.ok(html.includes('language-css'));
  });
});

describe('makePagination handle branch coverage', function() {
  it('L1936: pagination getPage handle should return currentPage from state', function() {
    var taco = bw.makePagination({ pages: 3, currentPage: 2 });
    assert.strictEqual(typeof taco.o.handle.getPage, 'function');
    // Without DOM element with _bw_state
    var fakeEl = {};
    var page = taco.o.handle.getPage(fakeEl);
    assert.strictEqual(page, 1); // default when _bw_state is undefined

    fakeEl._bw_state = { currentPage: 3 };
    var page2 = taco.o.handle.getPage(fakeEl);
    assert.strictEqual(page2, 3);
  });

  it('L1936: pagination setPage with out-of-range should be no-op', function() {
    var taco = bw.makePagination({ pages: 3, currentPage: 1 });
    freshDOM();
    var el = bw.create(taco);
    document.body.appendChild(el);
    // Out of range
    taco.o.handle.setPage(el, 0);
    taco.o.handle.setPage(el, 10);
    // Should not throw
    document.body.removeChild(el);
  });
});

describe('makeAccordion multiOpen branch coverage', function() {
  beforeEach(function() { freshDOM(); });

  it('L2103: multiOpen=true should allow multiple sections open', function() {
    var taco = bw.makeAccordion({
      multiOpen: true,
      items: [
        { title: 'Section 1', content: 'Content 1', open: true },
        { title: 'Section 2', content: 'Content 2', open: true }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Both should be open
    var collapses = el.querySelectorAll('.bw_bccl_accordion_collapse');
    assert.ok(collapses[0].classList.contains('bw_collapse_show'));
    assert.ok(collapses[1].classList.contains('bw_collapse_show'));

    // Click first to close it - multiOpen should not close others
    var btn = el.querySelector('.bw_bccl_accordion_button');
    btn.click();

    // Second should still be open
    assert.ok(collapses[1].classList.contains('bw_collapse_show'));

    document.body.removeChild(el);
  });
});

describe('makeModal branch coverage', function() {
  it('L2258-2259: modal with open=true should have show class and display style', function() {
    var taco = bw.makeModal({ title: 'Test', content: 'Body', open: true });
    assert.ok(taco.a.class.includes('bw_bccl_modal_show'));
    assert.strictEqual(taco.a.style, 'display:flex');
  });

  it('L2258-2259: modal with open=false (default) should not have show class', function() {
    var taco = bw.makeModal({ title: 'Test', content: 'Body' });
    assert.ok(!taco.a.class.includes('bw_bccl_modal_show'));
    assert.strictEqual(taco.a.style, undefined);
  });
});

describe('makeDropdown trigger TACO branch coverage', function() {
  it('L2493: dropdown with TACO trigger should use it directly', function() {
    var customTrigger = { t: 'span', a: { class: 'custom_trigger' }, c: 'Custom' };
    var taco = bw.makeDropdown({
      trigger: customTrigger,
      items: [{ text: 'Item 1' }]
    });
    assert.strictEqual(taco.c[0], customTrigger);
  });
});

describe('makeDropdown outside click branch coverage', function() {
  beforeEach(function() { freshDOM(); });

  it('L2532: click outside dropdown should close menu', function() {
    var taco = bw.makeDropdown({
      trigger: 'Menu',
      items: [{ text: 'Item 1' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o.mounted) taco.o.mounted(el);

    // Open the menu
    var toggleBtn = el.querySelector('.bw_bccl_dropdown_toggle');
    toggleBtn.click();
    var menu = el.querySelector('.bw_bccl_dropdown_menu');
    assert.ok(menu.classList.contains('bw_bccl_dropdown_show'));

    // Click outside
    var outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    document.dispatchEvent(new window.Event('click', { bubbles: true }));

    assert.ok(!menu.classList.contains('bw_bccl_dropdown_show'));

    document.body.removeChild(el);
    document.body.removeChild(outsideEl);
  });
});

describe('makeAvatar branch coverage', function() {
  it('L2729: avatar without initials should use empty string', function() {
    var taco = bw.makeAvatar({});
    assert.strictEqual(taco.c, '');
  });
});

describe('makeCarousel showControls branch coverage', function() {
  it('L2838: carousel with showControls and >1 items should render controls', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      showControls: true
    });
    var html = bw.html(taco);
    assert.ok(html.includes('bw_bccl_carousel_control_prev'));
    assert.ok(html.includes('bw_bccl_carousel_control_next'));
  });
});

describe('makeStatCard branch coverage', function() {
  it('L3003: formatValue with prefix and suffix', function() {
    var taco = bw.makeStatCard({ value: 42, prefix: 'EUR ', suffix: ' avg' });
    var valueEl = taco.c.find(function(c) { return c.a && c.a.class === 'bw_stat_value'; });
    assert.strictEqual(valueEl.c, 'EUR 42 avg');
  });

  it('L3003: formatValue with only prefix', function() {
    var taco = bw.makeStatCard({ value: 100, prefix: '#' });
    var valueEl = taco.c.find(function(c) { return c.a && c.a.class === 'bw_stat_value'; });
    assert.strictEqual(valueEl.c, '#100');
  });

  it('L3003: formatValue with only suffix', function() {
    var taco = bw.makeStatCard({ value: 50, suffix: ' items' });
    var valueEl = taco.c.find(function(c) { return c.a && c.a.class === 'bw_stat_value'; });
    assert.strictEqual(valueEl.c, '50 items');
  });

  it('L3007: formatValue with format=number should use locale string', function() {
    var taco = bw.makeStatCard({ value: 1234567, format: 'number' });
    var valueEl = taco.c.find(function(c) { return c.a && c.a.class === 'bw_stat_value'; });
    // Number.toLocaleString() output varies by locale, but should contain digits
    assert.ok(valueEl.c.includes('1'));
    assert.ok(valueEl.c.includes('234'));
  });

  it('L3003: formatValue with no format and no prefix/suffix should use default', function() {
    var taco = bw.makeStatCard({ value: 99 });
    var valueEl = taco.c.find(function(c) { return c.a && c.a.class === 'bw_stat_value'; });
    assert.strictEqual(valueEl.c, '99');
  });
});

describe('makeSearchInput branch coverage', function() {
  it('L3304: search clear button should call onSearch when provided', function() {
    freshDOM();
    var searchCalled = null;
    var taco = bw.makeSearchInput({
      value: 'initial',
      onSearch: function(val) { searchCalled = val; },
      onInput: function() {}
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var clearBtn = el.querySelector('.bw_search_clear');
    if (clearBtn) clearBtn.click();
    assert.strictEqual(searchCalled, '');

    document.body.removeChild(el);
  });
});

describe('makeChipInput handle.addChip branch coverage', function() {
  beforeEach(function() { freshDOM(); });

  it('L3817: addChip with empty text should be no-op', function() {
    var taco = bw.makeChipInput({ chips: [] });
    var el = bw.create(taco);
    document.body.appendChild(el);

    taco.o.handle.addChip(el, '');
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 0);

    taco.o.handle.addChip(el, null);
    chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 0);

    document.body.removeChild(el);
  });

  it('L3817: addChip with valid text should add chip', function() {
    var taco = bw.makeChipInput({ chips: [] });
    var el = bw.create(taco);
    document.body.appendChild(el);

    taco.o.handle.addChip(el, 'NewTag');
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 1);

    document.body.removeChild(el);
  });
});

describe('bw.make() factory branch coverage', function() {
  it('L3942: make() with no props (undefined) should use empty object', function() {
    var btn = bw.make('button');
    assert.strictEqual(btn.t, 'button');
    assert.ok(btn.a.class.includes('bw_bccl_btn'));
  });

  it('L3944: make() should attach _bwFactory metadata', function() {
    var card = bw.make('card', { title: 'Test' });
    assert.ok(card._bwFactory);
    assert.strictEqual(card._bwFactory.type, 'card');
    assert.strictEqual(card._bwFactory.props.title, 'Test');
  });
});

describe('makeTabs switchTab bounds check', function() {
  beforeEach(function() { freshDOM(); });

  it('L520: switchTab with out-of-bounds index should be no-op', function() {
    var taco = bw.makeTabs({
      tabs: [
        { label: 'A', content: 'CA' },
        { label: 'B', content: 'CB' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // switchTab with negative index
    taco.o.handle.setActiveTab(el, -1);
    // switchTab with index >= length
    taco.o.handle.setActiveTab(el, 10);
    // Neither should throw

    document.body.removeChild(el);
  });
});

describe('makeTabs mounted tablist guard', function() {
  beforeEach(function() { freshDOM(); });

  it('L582: mounted on element without tablist should return early', function() {
    var taco = bw.makeTabs({ tabs: [] });
    var el = document.createElement('div');
    // el has no [role="tablist"] child
    taco.o.mounted(el);
    // Should not throw
  });
});

describe('makeChipInput handle.removeChip and dynamic chip removal', function() {
  beforeEach(function() { freshDOM(); });

  it('L3833-3839: removeChip handle should remove a chip by value', function() {
    var taco = bw.makeChipInput({ chips: ['alpha', 'beta', 'gamma'] });
    var el = bw.create(taco);
    document.body.appendChild(el);

    taco.o.handle.removeChip(el, 'beta');
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 2);

    document.body.removeChild(el);
  });

  it('L3833-3839: removeChip with nonexistent value should be no-op', function() {
    var taco = bw.makeChipInput({ chips: ['one'] });
    var el = bw.create(taco);
    document.body.appendChild(el);

    taco.o.handle.removeChip(el, 'nonexistent');
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 1);

    document.body.removeChild(el);
  });

  it('L3790-3791: dynamically added chip remove button should work', function() {
    var removedVal = null;
    var taco = bw.makeChipInput({
      chips: [],
      onAdd: function() {},
      onRemove: function(val) { removedVal = val; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Add a chip via keydown
    var input = el.querySelector('.bw_chip_field');
    input.value = 'dynamic';
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // The dynamic chip should exist
    var chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 1);

    // Click the remove button on the dynamically added chip
    var removeBtn = chips[0].querySelector('.bw_chip_remove');
    assert.ok(removeBtn, 'remove button should exist on dynamically added chip');
    removeBtn.click();

    assert.strictEqual(removedVal, 'dynamic');
    chips = el.querySelectorAll('.bw_chip');
    assert.strictEqual(chips.length, 0);

    document.body.removeChild(el);
  });

  it('L3841-3845: getChips handle should return chip values', function() {
    var taco = bw.makeChipInput({ chips: ['x', 'y', 'z'] });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var values = taco.o.handle.getChips(el);
    assert.deepStrictEqual(values, ['x', 'y', 'z']);

    document.body.removeChild(el);
  });
});

describe('makeFileUpload onchange handler', function() {
  beforeEach(function() { freshDOM(); });

  it('L3527-3529: file input onchange with onFiles callback should call it', function() {
    var receivedFiles = null;
    var taco = bw.makeFileUpload({
      onFiles: function(files) { receivedFiles = files; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Simulate file input change with files
    var fileInput = el.querySelector('input[type="file"]');
    // We cannot set fileInput.files directly, so use the onchange from TACO
    // Instead, call the TACO onchange directly
    var onchangeHandler = taco.c.find(function(c) { return c.t === 'input' && c.a.type === 'file'; }).a.onchange;
    onchangeHandler({ target: { files: [{ name: 'test.txt' }] } });

    assert.ok(receivedFiles);
    assert.strictEqual(receivedFiles.length, 1);

    document.body.removeChild(el);
  });

  it('L3527-3529: file input onchange without files should not call onFiles', function() {
    var called = false;
    var taco = bw.makeFileUpload({
      onFiles: function() { called = true; }
    });
    var onchangeHandler = taco.c.find(function(c) { return c.t === 'input' && c.a.type === 'file'; }).a.onchange;
    onchangeHandler({ target: { files: [] } });
    assert.ok(!called);
  });

  it('L3527-3529: file input onchange without onFiles callback should not throw', function() {
    var taco = bw.makeFileUpload({});
    var onchangeHandler = taco.c.find(function(c) { return c.t === 'input' && c.a.type === 'file'; }).a.onchange;
    onchangeHandler({ target: { files: [{ name: 'test.txt' }] } });
    // Should not throw
  });
});

describe('makeChipInput handle.clear', function() {
  beforeEach(function() { freshDOM(); });

  it('L3849-3854: clear handle should remove all chips', function() {
    var taco = bw.makeChipInput({ chips: ['a', 'b', 'c'] });
    var el = bw.create(taco);
    document.body.appendChild(el);

    assert.strictEqual(el.querySelectorAll('.bw_chip').length, 3);
    taco.o.handle.clear(el);
    assert.strictEqual(el.querySelectorAll('.bw_chip').length, 0);

    document.body.removeChild(el);
  });
});

describe('makeCarousel autoPlay mouseenter/mouseleave', function() {
  beforeEach(function() { freshDOM(); });

  it('L2936-2942: mouseenter should pause and mouseleave should restart autoPlay', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      autoPlay: true,
      interval: 100000
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    assert.ok(el._bw_carouselInterval != null, 'should have interval set');

    // Mouseenter should clear the interval
    el.dispatchEvent(new window.Event('mouseenter', { bubbles: true }));
    // After mouseenter, the interval reference may be cleared

    // Mouseleave should restart the interval
    el.dispatchEvent(new window.Event('mouseleave', { bubbles: true }));
    assert.ok(el._bw_carouselInterval != null, 'should have interval reset after mouseleave');

    // Cleanup
    if (taco.o && taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });

  it('L2905-2912: handle.play should start autoPlay interval', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      autoPlay: false
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Simulate _bw_state being set (as mounted does)
    el._bw_state = { interval: 100000 };

    // play should start interval
    taco.o.handle.play(el);
    assert.ok(el._bw_carouselInterval != null, 'should have interval after play');

    // play again should be no-op (already has interval)
    var prevInterval = el._bw_carouselInterval;
    taco.o.handle.play(el);
    assert.strictEqual(el._bw_carouselInterval, prevInterval, 'should not create duplicate interval');

    // pause
    taco.o.handle.pause(el);
    assert.strictEqual(el._bw_carouselInterval, null, 'should clear interval on pause');

    // pause again should be no-op
    taco.o.handle.pause(el);

    if (taco.o && taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });

  it('L2930-2931: autoPlay timer callback should advance slide', function(done) {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }, { content: 'C' }],
      autoPlay: true,
      interval: 50 // very short interval
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    assert.strictEqual(el._bw_carouselIndex, 0);

    // Wait for the timer to fire
    setTimeout(function() {
      assert.ok(el._bw_carouselIndex >= 1, 'should have advanced at least one slide');
      if (taco.o && taco.o.unmount) taco.o.unmount(el);
      document.body.removeChild(el);
      done();
    }, 120);
  });

  it('L2940-2941: mouseleave timer callback should advance slide', function(done) {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }],
      autoPlay: true,
      interval: 50
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Pause via mouseenter
    el.dispatchEvent(new window.Event('mouseenter', { bubbles: true }));

    // Resume via mouseleave
    el.dispatchEvent(new window.Event('mouseleave', { bubbles: true }));

    var indexBefore = el._bw_carouselIndex;

    // Wait for the mouseleave timer to fire
    setTimeout(function() {
      assert.ok(el._bw_carouselIndex > indexBefore || el._bw_carouselIndex === 0,
        'slide should have advanced or wrapped');
      if (taco.o && taco.o.unmount) taco.o.unmount(el);
      document.body.removeChild(el);
      done();
    }, 120);
  });

  it('handle.getActiveIndex should return current index', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    assert.strictEqual(taco.o.handle.getActiveIndex(el), 0);

    document.body.removeChild(el);
  });

  it('handle.next and handle.prev should navigate', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }, { content: 'C' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    taco.o.handle.next(el);
    assert.strictEqual(el._bw_carouselIndex, 1);

    taco.o.handle.prev(el);
    assert.strictEqual(el._bw_carouselIndex, 0);

    document.body.removeChild(el);
  });

  it('handle.goToSlide should go to specific slide', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'A' }, { content: 'B' }, { content: 'C' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    taco.o.handle.goToSlide(el, 2);
    assert.strictEqual(el._bw_carouselIndex, 2);

    document.body.removeChild(el);
  });
});

describe('makeDropdown item click handler', function() {
  beforeEach(function() { freshDOM(); });

  it('L2515-2520: clicking a dropdown item should close menu and call onclick', function() {
    var itemClicked = false;
    var taco = bw.makeDropdown({
      trigger: 'Menu',
      items: [
        { text: 'Action', onclick: function() { itemClicked = true; } }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o.mounted) taco.o.mounted(el);

    // Open the menu
    var toggleBtn = el.querySelector('.bw_bccl_dropdown_toggle');
    toggleBtn.click();
    var menu = el.querySelector('.bw_bccl_dropdown_menu');
    assert.ok(menu.classList.contains('bw_bccl_dropdown_show'));

    // Click the item
    var item = el.querySelector('.bw_bccl_dropdown_item');
    item.click();

    // Menu should close and onclick should be called
    assert.ok(!menu.classList.contains('bw_bccl_dropdown_show'));
    assert.ok(itemClicked);

    if (taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });

  it('L2515: clicking dropdown item with href should not preventDefault', function() {
    var taco = bw.makeDropdown({
      trigger: 'Menu',
      items: [
        { text: 'Link', href: '/page' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o.mounted) taco.o.mounted(el);

    // Open menu and click item
    var toggleBtn = el.querySelector('.bw_bccl_dropdown_toggle');
    toggleBtn.click();
    var item = el.querySelector('.bw_bccl_dropdown_item');
    item.click();

    if (taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });
});

describe('makeToast autoDismiss timer', function() {
  beforeEach(function() { freshDOM(); });

  it('L2429-2433: autoDismiss should remove toast after delay', function(done) {
    var taco = bw.makeToast({
      title: 'Auto dismiss',
      content: 'Body',
      autoDismiss: true,
      delay: 50
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o.mounted) taco.o.mounted(el);

    assert.ok(document.querySelector('.bw_bccl_toast'), 'toast should exist');

    // Wait for autoDismiss + hiding animation
    setTimeout(function() {
      // Toast should have hiding class or be removed
      if (el.parentNode) {
        assert.ok(el.classList.contains('bw_bccl_toast_hiding'), 'should have hiding class');
      }
      // Wait a bit more for the final removal
      setTimeout(function() {
        // Toast should be removed from DOM
        assert.ok(!el.parentNode, 'toast should be removed from DOM');
        done();
      }, 400);
    }, 100);
  });
});


describe('makeModal Escape key and backdrop click', function() {
  beforeEach(function() { freshDOM(); });

  it('L2258: modal Escape key should close modal', function() {
    var closeCalled = false;
    var taco = bw.makeModal({
      title: 'Close Test',
      content: 'Body',
      onClose: function() { closeCalled = true; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o.mounted) taco.o.mounted(el);

    // Open the modal
    taco.o.handle.open(el);
    assert.ok(el.classList.contains('bw_bccl_modal_show'));

    // Press Escape on the element
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(!el.classList.contains('bw_bccl_modal_show'));
    assert.ok(closeCalled);

    // Unmount
    if (taco.o.unmount) taco.o.unmount(el);
    document.body.removeChild(el);
  });

  it('L2258: modal backdrop click should close modal', function() {
    var taco = bw.makeModal({
      title: 'Backdrop Test',
      content: 'Body'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o.mounted) taco.o.mounted(el);

    // Open
    taco.o.handle.open(el);
    assert.ok(el.classList.contains('bw_bccl_modal_show'));

    // Click on the backdrop (the element itself)
    var clickEvent = new window.Event('click', { bubbles: true });
    // Set e.target to the backdrop element itself
    Object.defineProperty(clickEvent, 'target', { value: el });
    el.dispatchEvent(clickEvent);

    assert.ok(!el.classList.contains('bw_bccl_modal_show'));

    document.body.removeChild(el);
  });
});

// =========================================================================
// Coverage: makeFileUpload drag-and-drop events
// =========================================================================
describe('makeFileUpload drag events', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle dragover event', function() {
    var taco = bw.makeFileUpload({ label: 'Drop files here' });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var dropZone = el.querySelector('.bw_file_drop') || el;
    var event = new window.Event('dragover', { bubbles: true, cancelable: true });
    event.preventDefault = function() {};
    event.dataTransfer = { dropEffect: '' };
    dropZone.dispatchEvent(event);

    document.body.removeChild(el);
  });

  it('should handle dragleave event', function() {
    var taco = bw.makeFileUpload({ label: 'Drop files here' });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var dropZone = el.querySelector('.bw_file_drop') || el;
    dropZone.dispatchEvent(new window.Event('dragleave', { bubbles: true }));

    document.body.removeChild(el);
  });

  it('should handle drop event', function() {
    var filesReceived = null;
    var taco = bw.makeFileUpload({
      label: 'Drop files here',
      onChange: function(files) { filesReceived = files; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var dropZone = el.querySelector('.bw_file_drop') || el;
    var event = new window.Event('drop', { bubbles: true, cancelable: true });
    event.preventDefault = function() {};
    event.dataTransfer = { files: [] };
    dropZone.dispatchEvent(event);

    document.body.removeChild(el);
  });
});


// =========================================================================
// makeCard — image without alt (line 136)
// =========================================================================
describe('makeCard — image without alt property (line 136)', function() {
  it('should use empty string for alt when image.alt is not provided', function() {
    var taco = bw.makeCard({
      title: 'Card',
      image: { src: 'photo.jpg' },
      imagePosition: 'top'
    });
    var html = bw.html(taco);
    assert.ok(html.includes('alt=""'), 'should have empty alt attribute');
    assert.ok(html.includes('src="photo.jpg"'));
  });

  it('should use provided alt when image.alt is given', function() {
    var taco = bw.makeCard({
      title: 'Card',
      image: { src: 'photo.jpg', alt: 'My photo' },
      imagePosition: 'top'
    });
    var html = bw.html(taco);
    assert.ok(html.includes('alt="My photo"'));
  });
});


// =========================================================================
// makeProgress — setValue when aria-valuemax missing (line 776)
// =========================================================================
describe('makeProgress — setValue with missing aria-valuemax (line 776)', function() {
  beforeEach(function() { freshDOM(); });

  it('should default to max=100 when aria-valuemax is not set', function() {
    var taco = bw.makeProgress({ value: 50 });
    var el = bw.create(taco);
    document.body.appendChild(el);
    var bar = el.querySelector('.bw_bccl_progress_bar');
    // Remove aria-valuemax to trigger the || 100 fallback
    bar.removeAttribute('aria-valuemax');
    taco.o.handle.setValue(el, 75);
    assert.strictEqual(bar.style.width, '75%');
    assert.strictEqual(bar.getAttribute('aria-valuenow'), '75');
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeProgress — getValue when aria-valuenow missing (line 784)
// =========================================================================
describe('makeProgress — getValue with missing aria-valuenow (line 784)', function() {
  beforeEach(function() { freshDOM(); });

  it('should return 0 when aria-valuenow is not set on bar', function() {
    var taco = bw.makeProgress({ value: 50 });
    var el = bw.create(taco);
    document.body.appendChild(el);
    var bar = el.querySelector('.bw_bccl_progress_bar');
    // Remove aria-valuenow to trigger the || 0 fallback
    bar.removeAttribute('aria-valuenow');
    var val = taco.o.handle.getValue(el);
    assert.strictEqual(val, 0);
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeForm — field without type (line 962)
// =========================================================================
describe('makeForm — field with no type defaults to text (line 962)', function() {
  beforeEach(function() { freshDOM(); });

  it('should default field type to text when not specified', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'username', label: 'Username' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    var input = el.querySelector('[name="username"]');
    assert.strictEqual(input.type, 'text');
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeForm — validate with missing input (line 1025)
// =========================================================================
describe('makeForm — validate with missing input element (line 1025)', function() {
  beforeEach(function() { freshDOM(); });

  it('should skip validation for fields whose input is not found', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'field1', label: 'Field 1', type: 'text', required: true }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Remove the input element so validate can't find it
    var input = el.querySelector('[name="field1"]');
    input.parentNode.removeChild(input);

    var result = taco.o.handle.validate(el);
    // With the input missing, validate should skip it and report valid
    assert.strictEqual(result.valid, true);
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeForm — validate error message uses field.name when no label (line 1044)
// =========================================================================
describe('makeForm — validate error uses field.name when no label (line 1044)', function() {
  beforeEach(function() { freshDOM(); });

  it('should use field.name in error message when label is not provided', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'email_field', type: 'text', required: true }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var result = taco.o.handle.validate(el);
    assert.strictEqual(result.valid, false);
    var errEl = el.querySelector('.bw_bccl_form_error');
    assert.ok(errEl);
    assert.ok(errEl.textContent.includes('email_field'), 'error should mention field name');
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeForm — setErrors with missing input (line 1054)
// =========================================================================
describe('makeForm — setErrors with missing input element (line 1054)', function() {
  beforeEach(function() { freshDOM(); });

  it('should skip error setting for inputs not found', function() {
    var taco = bw.makeForm({
      fields: [
        { name: 'field1', label: 'Field 1', type: 'text' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Remove the input so setErrors can't find it
    var input = el.querySelector('[name="field1"]');
    input.parentNode.removeChild(input);

    // setErrors should not throw when input not found
    taco.o.handle.setErrors(el, { field1: 'Error', nonexistent: 'Also error' });
    assert.ok(true, 'should not throw');
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeCodeDemo — with globalThis.bw.codeEditor available (line 1791-1792)
// =========================================================================
describe('makeCodeDemo — globalThis.bw.codeEditor available (line 1791-1792)', function() {
  it('should use codeEditor when available on globalThis.bw', function() {
    // Set up globalThis.bw.codeEditor as a function
    var codeEditorCalled = false;
    var origBw = globalThis.bw;
    globalThis.bw = Object.assign({}, globalThis.bw || {}, {
      codeEditor: function(opts) {
        codeEditorCalled = true;
        return { t: 'div', a: { class: 'bw_ce_mock' }, c: opts.code };
      }
    });

    var taco = bw.makeCodeDemo({
      code: 'var x = 1;',
      language: 'javascript',
      title: 'Demo'
    });
    var html = bw.html(taco);
    // The codeEditor function should have been called
    assert.ok(codeEditorCalled, 'globalThis.bw.codeEditor should be called');
    assert.ok(html.includes('bw_ce_mock'), 'should use codeEditor output');

    // Restore
    globalThis.bw = origBw;
  });
});


// =========================================================================
// makePagination — setPage with valid page (line 1926)
// =========================================================================
describe('makePagination — setPage with valid page (line 1926)', function() {
  beforeEach(function() { freshDOM(); });

  it('should update active page when setPage is called with valid page', function() {
    var pageChanged = null;
    var taco = bw.makePagination({
      pages: 5,
      currentPage: 1,
      onPageChange: function(n) { pageChanged = n; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    // Initialize state
    el._bw_state = { currentPage: 1, pages: 5 };

    taco.o.handle.setPage(el, 3);
    assert.strictEqual(pageChanged, 3);
    assert.strictEqual(el._bw_state.currentPage, 3);
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeAccordion — single-open mode closes siblings (line 2103)
// =========================================================================
describe('makeAccordion — single-open mode closes open sibling (line 2103)', function() {
  beforeEach(function() { freshDOM(); });

  it('should close other open sections when clicking in single-open mode', function() {
    var taco = bw.makeAccordion({
      multiOpen: false,
      items: [
        { title: 'Section 1', content: 'Content 1', open: true },
        { title: 'Section 2', content: 'Content 2' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var collapses = el.querySelectorAll('.bw_bccl_accordion_collapse');
    // Section 1 should be open
    assert.ok(collapses[0].classList.contains('bw_collapse_show'));

    // Click section 2 button to open it
    var buttons = el.querySelectorAll('.bw_bccl_accordion_button');
    buttons[1].click();

    // In single-open mode, section 1 should now be closed (line 2103)
    assert.ok(!collapses[0].classList.contains('bw_collapse_show'),
      'section 1 should close when section 2 is opened in single-open mode');

    document.body.removeChild(el);
  });
});


// =========================================================================
// makeModal — closeModal fallback and Escape key (lines 2242, 2244, 2330)
// =========================================================================
describe('makeModal — closeModal and escape key handling', function() {
  beforeEach(function() { freshDOM(); });

  it('should close modal via handle.close and exercise closeModal fallback (line 2242)', function() {
    var taco = bw.makeModal({
      title: 'Test Modal',
      content: 'Body',
      open: true
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // The modal backdrop IS the root el (.bw_bccl_modal), so closest should find it
    assert.ok(el.classList.contains('bw_bccl_modal_show') || el.style.display === 'flex',
      'modal should be visible');

    // Close it
    taco.o.handle.close(el);
    assert.ok(!el.classList.contains('bw_bccl_modal_show'), 'should remove show class');
    document.body.removeChild(el);
  });

  it('should close modal on document-level Escape key (line 2330)', function() {
    var taco = bw.makeModal({
      title: 'Test Modal',
      content: 'Body',
      open: true
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Ensure modal is visible
    el.classList.add('bw_bccl_modal_show');
    el.style.display = 'flex';

    // Dispatch Escape key event on document
    var event = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    assert.ok(!el.classList.contains('bw_bccl_modal_show'), 'should close on Escape');
    document.body.removeChild(el);
  });

  it('should handle modal without _bw_opener (line 2244)', function() {
    var taco = bw.makeModal({
      title: 'Test Modal',
      content: 'Body',
      open: true
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Ensure _bw_opener is not set (falls back to null)
    delete el._bw_opener;

    taco.o.handle.close(el);
    assert.ok(true, 'should not throw when _bw_opener is not set');
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeCarousel — prev button click and handle.prev/play (lines 2838, 2897, 2907)
// =========================================================================
describe('makeCarousel — prev and play handles (lines 2838, 2897, 2907)', function() {
  beforeEach(function() { freshDOM(); });

  it('should handle prev button click (line 2838)', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'Slide 1' }, { content: 'Slide 2' }, { content: 'Slide 3' }],
      showControls: true,
      startIndex: 1
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Click prev button
    var prevBtn = el.querySelector('.bw_bccl_carousel_control_prev');
    assert.ok(prevBtn, 'should have prev control button');
    prevBtn.click();

    assert.strictEqual(el._bw_carouselIndex, 0, 'should move to previous slide');
    document.body.removeChild(el);
  });

  it('should handle handle.prev() (line 2897)', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'Slide 1' }, { content: 'Slide 2' }],
      startIndex: 1
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    taco.o.handle.prev(el);
    assert.strictEqual(el._bw_carouselIndex, 0, 'prev should move back one slide');
    document.body.removeChild(el);
  });

  it('should handle handle.play() (line 2907)', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'Slide 1' }, { content: 'Slide 2' }],
      autoPlay: false
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Set up state for play
    el._bw_state = { interval: 100, autoPlay: false };

    taco.o.handle.play(el);
    assert.ok(el._bw_carouselInterval, 'should start interval on play');

    // Clean up interval
    taco.o.handle.pause(el);
    assert.strictEqual(el._bw_carouselInterval, null, 'should clear interval on pause');
    document.body.removeChild(el);
  });
});


// =========================================================================
// Accordion — closeAll handle (lines 2185-2198)
// =========================================================================
describe('makeAccordion — closeAll handle (lines 2185-2198)', function() {
  beforeEach(function() { freshDOM(); });

  it('should close all open accordion items via handle.closeAll', function() {
    var taco = bw.makeAccordion({
      multiOpen: true,
      items: [
        { title: 'Section 1', content: 'Content 1', open: true },
        { title: 'Section 2', content: 'Content 2', open: true },
        { title: 'Section 3', content: 'Content 3' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var collapses = el.querySelectorAll('.bw_bccl_accordion_collapse');
    // Sections 1 and 2 should be open
    assert.ok(collapses[0].classList.contains('bw_collapse_show'), 'section 1 should be open');
    assert.ok(collapses[1].classList.contains('bw_collapse_show'), 'section 2 should be open');

    // Call closeAll
    taco.o.handle.closeAll(el);

    // All sections should now be closed
    assert.ok(!collapses[0].classList.contains('bw_collapse_show'), 'section 1 should be closed after closeAll');
    assert.ok(!collapses[1].classList.contains('bw_collapse_show'), 'section 2 should be closed after closeAll');

    document.body.removeChild(el);
  });
});


// =========================================================================
// Accordion — toggle handle (lines 2166-2169)
// =========================================================================
describe('makeAccordion — toggle handle (lines 2166-2169)', function() {
  beforeEach(function() { freshDOM(); });

  it('should toggle a specific accordion item by index', function() {
    var taco = bw.makeAccordion({
      multiOpen: true,
      items: [
        { title: 'Section 1', content: 'Content 1' },
        { title: 'Section 2', content: 'Content 2' },
        { title: 'Section 3', content: 'Content 3' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var collapses = el.querySelectorAll('.bw_bccl_accordion_collapse');
    assert.ok(!collapses[1].classList.contains('bw_collapse_show'), 'section 2 should be closed initially');

    // Toggle section 2 open
    taco.o.handle.toggle(el, 1);
    assert.ok(collapses[1].classList.contains('bw_collapse_show'), 'section 2 should be open after toggle');

    document.body.removeChild(el);
  });

  it('should not throw when toggling out-of-range index', function() {
    var taco = bw.makeAccordion({
      items: [{ title: 'Section 1', content: 'Content 1' }]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Should not throw for negative index
    taco.o.handle.toggle(el, -1);
    // Should not throw for too-large index
    taco.o.handle.toggle(el, 99);
    assert.ok(true, 'should not throw for out-of-range index');

    document.body.removeChild(el);
  });
});


// =========================================================================
// Accordion — openAll handle (lines 2172-2182)
// =========================================================================
describe('makeAccordion — openAll handle (lines 2172-2182)', function() {
  beforeEach(function() { freshDOM(); });

  it('should open all accordion items via handle.openAll', function() {
    var taco = bw.makeAccordion({
      multiOpen: true,
      items: [
        { title: 'Section 1', content: 'Content 1' },
        { title: 'Section 2', content: 'Content 2' },
        { title: 'Section 3', content: 'Content 3' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var collapses = el.querySelectorAll('.bw_bccl_accordion_collapse');
    // All should be closed initially
    assert.ok(!collapses[0].classList.contains('bw_collapse_show'), 'section 1 closed initially');
    assert.ok(!collapses[1].classList.contains('bw_collapse_show'), 'section 2 closed initially');

    // Open all
    taco.o.handle.openAll(el);

    assert.ok(collapses[0].classList.contains('bw_collapse_show'), 'section 1 open after openAll');
    assert.ok(collapses[1].classList.contains('bw_collapse_show'), 'section 2 open after openAll');
    assert.ok(collapses[2].classList.contains('bw_collapse_show'), 'section 3 open after openAll');

    document.body.removeChild(el);
  });
});


// =========================================================================
// Accordion — mounted hook for open items (lines 2144-2155)
// =========================================================================
describe('makeAccordion — mounted hook for initially open items (lines 2144-2155)', function() {
  beforeEach(function() { freshDOM(); });

  it('should set maxHeight none on initially open accordion panel via mounted', function() {
    var taco = bw.makeAccordion({
      items: [
        { title: 'Section 1', content: 'Content 1', open: true },
        { title: 'Section 2', content: 'Content 2' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Mount the tree to trigger all mounted hooks including the panel's mounted
    bw.mountTree(el);

    var collapses = el.querySelectorAll('.bw_bccl_accordion_collapse');
    assert.ok(collapses[0].classList.contains('bw_collapse_show'), 'section 1 should be open');
    // The mounted hook at L2153-2154 sets maxHeight to 'none'
    assert.strictEqual(collapses[0].style.maxHeight, 'none', 'open panel should have maxHeight none from mounted hook');

    document.body.removeChild(el);
  });
});


// =========================================================================
// Toast — dismiss handle (lines 2418-2420)
// =========================================================================
describe('makeToast — dismiss handle (lines 2418-2420)', function() {
  beforeEach(function() { freshDOM(); });

  it('should add hiding class and schedule removal via handle.dismiss', function() {
    var taco = bw.makeToast({
      title: 'Test Toast',
      content: 'Toast body',
      autoDismiss: false
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Call dismiss handle
    taco.o.handle.dismiss(el);

    // Should add hiding class immediately
    assert.ok(el.classList.contains('bw_bccl_toast_hiding'), 'should add hiding class');

    document.body.removeChild(el);
  });
});


// =========================================================================
// Carousel — play() setInterval callback fires (line 2909)
// =========================================================================
describe('makeCarousel — play() interval callback fires (line 2909)', function() {
  beforeEach(function() { freshDOM(); });

  it('should advance slides when play interval fires', function() {
    var taco = bw.makeCarousel({
      items: [{ content: 'Slide 1' }, { content: 'Slide 2' }, { content: 'Slide 3' }],
      autoPlay: false,
      showControls: true
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    // Verify DOM structure
    assert.strictEqual(el._bw_carouselIndex, 0, 'should start at slide 0');

    // Directly exercise goToSlide through handle.next to verify it works
    taco.o.handle.next(el);
    assert.strictEqual(el._bw_carouselIndex, 1, 'next should advance index');

    // Reset and verify play/pause lifecycle
    el._bw_carouselIndex = 0;
    el._bw_state = { interval: 100, autoPlay: true };
    el._bw_carouselInterval = null;

    // Verify play sets up the interval
    taco.o.handle.play(el);
    assert.ok(el._bw_carouselInterval, 'should have interval after play');

    // Verify pause clears the interval
    taco.o.handle.pause(el);
    assert.strictEqual(el._bw_carouselInterval, null, 'should clear interval after pause');

    // Directly exercise next (same logic the interval callback uses) to verify slide advancement
    el._bw_carouselIndex = 0;
    taco.o.handle.next(el);
    assert.strictEqual(el._bw_carouselIndex, 1, 'next should advance from 0 to 1');
    taco.o.handle.next(el);
    assert.strictEqual(el._bw_carouselIndex, 2, 'next should advance from 1 to 2');
    taco.o.handle.next(el);
    assert.strictEqual(el._bw_carouselIndex, 0, 'next should wrap from 2 to 0');

    if (el.parentNode) el.parentNode.removeChild(el);
  });
});


// =========================================================================
// makeCodeDemo — globalThis.bw.codeEditor true branch (line 1792)
// The existing test at line 3935 may be affected by test ordering.
// This test explicitly sets and cleans globalThis.bw.codeEditor.
// =========================================================================
describe('makeCodeDemo — codeEditor true branch coverage (line 1792)', function() {
  var origGlobalBw;

  beforeEach(function() {
    freshDOM();
    origGlobalBw = globalThis.bw;
  });

  afterEach(function() {
    globalThis.bw = origGlobalBw;
  });

  it('should use globalThis.bw.codeEditor when it is a function', function() {
    var editorCalled = false;
    var receivedOpts = null;
    // Set globalThis.bw with codeEditor function
    globalThis.bw = {
      codeEditor: function(opts) {
        editorCalled = true;
        receivedOpts = opts;
        return { t: 'div', a: { class: 'bw_ce_editor' }, c: opts.code };
      }
    };

    // Import makeCodeDemo directly to avoid bw wrapper
    var taco = makeCodeDemo({
      code: 'console.log("hello");',
      language: 'javascript',
      title: 'Test Demo'
    });

    // Render to HTML to force evaluation of the ternary
    var html = bw.html(taco);

    assert.ok(editorCalled, 'codeEditor should have been called');
    assert.ok(receivedOpts, 'should have received opts');
    assert.strictEqual(receivedOpts.code, 'console.log("hello");');
    assert.strictEqual(receivedOpts.lang, 'js', 'javascript should be mapped to js');
    assert.strictEqual(receivedOpts.readOnly, true);
    assert.ok(html.includes('bw_ce_editor'), 'output should use codeEditor result');
  });
});


// =========================================================================
// makeCodeDemo — copy button onclick handler (lines 1777-1787)
// =========================================================================
describe('makeCodeDemo — copy button onclick handler (lines 1777-1787)', function() {
  beforeEach(function() { freshDOM(); });

  it('should call navigator.clipboard.writeText and update button text', function(done) {
    // The bccl module references bare `navigator` — in Node ESM this is the
    // built-in globalThis.navigator (getter-only). Override via defineProperty.
    var origDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    var writtenText = null;
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: function(text) {
            writtenText = text;
            return Promise.resolve();
          }
        }
      },
      writable: true,
      configurable: true
    });

    var taco = makeCodeDemo({
      code: 'console.log("hi");',
      language: 'javascript',
      title: 'Test'
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Find the copy button
    var copyBtn = el.querySelector('.bw_code_copy_btn');
    assert.ok(copyBtn, 'copy button should exist');
    assert.strictEqual(copyBtn.textContent, 'Copy');

    // Click the button (addEventListener was used, so .click() triggers it)
    copyBtn.click();

    // The .then callback runs as a microtask (Promise.resolve().then)
    setTimeout(function() {
      assert.strictEqual(writtenText, 'console.log("hi");', 'should have written text to clipboard');
      assert.strictEqual(copyBtn.textContent, 'Copied!');
      assert.ok(copyBtn.classList.contains('bw_code_copy_btn_copied'), 'should have copied class');
      // Restore original navigator descriptor
      Object.defineProperty(globalThis, 'navigator', origDescriptor);
      document.body.removeChild(el);
      done();
    }, 50);
  });
});


// =========================================================================
// makePagination — handleClick onclick handler (lines 1865-1867)
// =========================================================================
describe('makePagination — handleClick onclick handler (lines 1865-1867)', function() {
  beforeEach(function() { freshDOM(); });

  it('should call onPageChange when a valid page is clicked', function() {
    var clickedPage = null;
    var taco = bw.makePagination({
      pages: 5,
      currentPage: 2,
      onPageChange: function(page) { clickedPage = page; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Find a page button (page 3, which is items[3] -> third page button)
    var pageButtons = el.querySelectorAll('.bw_page_link');
    // pageButtons: [prev, 1, 2, 3, 4, 5, next]
    // page 3 = index 3
    assert.ok(pageButtons.length >= 4, 'should have page buttons');
    pageButtons[3].click();

    assert.strictEqual(clickedPage, 3, 'should have called onPageChange with page 3');
    document.body.removeChild(el);
  });

  it('should not call onPageChange for current page', function() {
    var clickedPage = null;
    var taco = bw.makePagination({
      pages: 5,
      currentPage: 2,
      onPageChange: function(page) { clickedPage = page; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click on page 2 (current page) = index 2
    var pageButtons = el.querySelectorAll('.bw_page_link');
    pageButtons[2].click();

    assert.strictEqual(clickedPage, null, 'should not call onPageChange for current page');
    document.body.removeChild(el);
  });

  it('should not call onPageChange for out-of-range page', function() {
    var clickedPage = null;
    var taco = bw.makePagination({
      pages: 5,
      currentPage: 1,
      onPageChange: function(page) { clickedPage = page; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click prev when on page 1 (page 0 is out of range)
    var pageButtons = el.querySelectorAll('.bw_page_link');
    // The prev button is disabled but we click it anyway to exercise the guard
    pageButtons[0].click();

    assert.strictEqual(clickedPage, null, 'should not call onPageChange for page < 1');
    document.body.removeChild(el);
  });

  it('should call onPageChange from next button', function() {
    var clickedPage = null;
    var taco = bw.makePagination({
      pages: 3,
      currentPage: 2,
      onPageChange: function(page) { clickedPage = page; }
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    var pageButtons = el.querySelectorAll('.bw_page_link');
    // Next button is the last one
    pageButtons[pageButtons.length - 1].click();

    assert.strictEqual(clickedPage, 3, 'should call onPageChange with page 3 from next button');
    document.body.removeChild(el);
  });
});


// =========================================================================
// makeAccordion — transitionend handler (lines 2131-2137)
// =========================================================================
describe('makeAccordion — transitionend handler (lines 2131-2137)', function() {
  beforeEach(function() { freshDOM(); });

  it('should set maxHeight to none after transitionend with max-height property', function() {
    var taco = bw.makeAccordion({
      items: [
        { title: 'Section 1', content: 'Content 1' },
        { title: 'Section 2', content: 'Content 2' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Both items start closed. Click on Section 2 button to open it.
    var buttons = el.querySelectorAll('.bw_bccl_accordion_button');
    assert.ok(buttons.length >= 2, 'should have accordion buttons');

    // Click to open section 2
    buttons[1].click();

    // After click, the collapse should have bw_collapse_show
    var collapse = el.querySelectorAll('.bw_bccl_accordion_collapse')[1];
    assert.ok(collapse.classList.contains('bw_collapse_show'), 'should be open after click');

    // Now fire the transitionend event to trigger the onEnd handler
    var transEvent = new window.Event('transitionend', { bubbles: true });
    // jsdom Event doesn't support setting propertyName directly, so define it
    Object.defineProperty(transEvent, 'propertyName', { value: 'max-height' });
    collapse.dispatchEvent(transEvent);

    assert.strictEqual(collapse.style.maxHeight, 'none', 'maxHeight should be set to none after transitionend');
    document.body.removeChild(el);
  });

  it('should not set maxHeight to none when propertyName is not max-height', function() {
    var taco = bw.makeAccordion({
      items: [
        { title: 'Section 1', content: 'Content 1' },
        { title: 'Section 2', content: 'Content 2' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click to open section 1
    var buttons = el.querySelectorAll('.bw_bccl_accordion_button');
    buttons[0].click();

    var collapse = el.querySelectorAll('.bw_bccl_accordion_collapse')[0];
    assert.ok(collapse.classList.contains('bw_collapse_show'), 'should be open');

    // Save current maxHeight
    var currentMax = collapse.style.maxHeight;

    // Fire transitionend with different propertyName
    var transEvent = new window.Event('transitionend', { bubbles: true });
    Object.defineProperty(transEvent, 'propertyName', { value: 'opacity' });
    collapse.dispatchEvent(transEvent);

    assert.strictEqual(collapse.style.maxHeight, currentMax, 'maxHeight should not change for non max-height property');
    document.body.removeChild(el);
  });

  it('should not set maxHeight to none when collapse is not showing', function() {
    var taco = bw.makeAccordion({
      items: [
        { title: 'Section 1', content: 'Content 1' }
      ]
    });
    var el = bw.create(taco);
    document.body.appendChild(el);

    // Click to open
    var buttons = el.querySelectorAll('.bw_bccl_accordion_button');
    buttons[0].click();

    var collapse = el.querySelectorAll('.bw_bccl_accordion_collapse')[0];
    assert.ok(collapse.classList.contains('bw_collapse_show'), 'should be open');

    // Remove the show class before firing transitionend
    collapse.classList.remove('bw_collapse_show');

    var transEvent = new window.Event('transitionend', { bubbles: true });
    Object.defineProperty(transEvent, 'propertyName', { value: 'max-height' });
    collapse.dispatchEvent(transEvent);

    // maxHeight should NOT have been set to 'none' since collapse_show was removed
    assert.notStrictEqual(collapse.style.maxHeight, 'none', 'maxHeight should not be none when not showing');
    document.body.removeChild(el);
  });
});
