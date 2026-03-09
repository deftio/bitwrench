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
  makeAvatar
} from "../src/bitwrench-components-v2.js";
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
    assert.ok(items[3].a.class.includes('bw-active'));
  });

  it('should disable previous on first page', function() {
    const result = makePagination({ pages: 5, currentPage: 1 });
    const items = result.c.c;
    assert.ok(items[0].a.class.includes('bw-disabled'));
  });

  it('should disable next on last page', function() {
    const result = makePagination({ pages: 5, currentPage: 5 });
    const items = result.c.c;
    assert.ok(items[items.length - 1].a.class.includes('bw-disabled'));
  });

  it('should accept size prop', function() {
    const result = makePagination({ pages: 3, currentPage: 1, size: 'sm' });
    assert.ok(result.c.a.class.includes('bw-pagination-sm'));
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
  it('should return a TACO with div tag and bw-form-check class', function() {
    const result = makeRadio({ label: 'Option A', name: 'choice', value: 'a' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-form-check'));
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
  it('should return a TACO with bw-btn-group class', function() {
    const result = makeButtonGroup({ children: [] });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-btn-group'));
    assert.strictEqual(result.a.role, 'group');
  });

  it('should use vertical class when vertical=true', function() {
    const result = makeButtonGroup({ vertical: true });
    assert.ok(result.a.class.includes('bw-btn-group-vertical'));
  });

  it('should accept size prop', function() {
    const result = makeButtonGroup({ size: 'lg' });
    assert.ok(result.a.class.includes('bw-btn-group-lg'));
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

  it('should return a TACO with bw-accordion class', function() {
    const result = makeAccordion({ items });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-accordion'));
  });

  it('should create correct number of accordion items', function() {
    const result = makeAccordion({ items });
    assert.strictEqual(result.c.length, 3);
  });

  it('should mark open items with bw-collapse-show', function() {
    const result = makeAccordion({ items });
    const firstCollapse = result.c[0].c[1]; // second child of first item
    assert.ok(firstCollapse.a.class.includes('bw-collapse-show'));
  });

  it('should mark closed items without bw-collapse-show', function() {
    const result = makeAccordion({ items });
    const secondCollapse = result.c[1].c[1];
    assert.ok(!secondCollapse.a.class.includes('bw-collapse-show'));
  });

  it('should set aria-expanded on buttons', function() {
    const result = makeAccordion({ items });
    const openBtn = result.c[0].c[0].c; // header > button
    const closedBtn = result.c[1].c[0].c;
    assert.strictEqual(openBtn.a['aria-expanded'], 'true');
    assert.strictEqual(closedBtn.a['aria-expanded'], 'false');
  });

  it('should add bw-collapsed class to closed items', function() {
    const result = makeAccordion({ items });
    const closedBtn = result.c[1].c[0].c;
    assert.ok(closedBtn.a.class.includes('bw-collapsed'));
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
  it('should return a TACO with bw-modal class', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-modal'));
  });

  it('should have modal-dialog inside', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    assert.ok(result.c.a.class.includes('bw-modal-dialog'));
  });

  it('should render title in header', function() {
    const result = makeModal({ title: 'My Title', content: 'Body' });
    const header = result.c.c.c[0]; // dialog > content > first child
    assert.ok(header.a.class.includes('bw-modal-header'));
    const title = header.c[0];
    assert.strictEqual(title.c, 'My Title');
  });

  it('should render close button by default', function() {
    const result = makeModal({ title: 'Test', content: 'Body' });
    const header = result.c.c.c[0];
    const closeBtn = header.c[1];
    assert.ok(closeBtn.a.class.includes('bw-close'));
  });

  it('should not render close button when closeButton=false', function() {
    const result = makeModal({ title: 'Test', content: 'Body', closeButton: false });
    const header = result.c.c.c[0];
    assert.strictEqual(header.c.length, 1); // only title
  });

  it('should apply size class', function() {
    const result = makeModal({ content: 'Body', size: 'lg' });
    assert.ok(result.c.a.class.includes('bw-modal-lg'));
  });

  it('should render footer when provided', function() {
    const result = makeModal({ content: 'Body', footer: 'Footer text' });
    const content = result.c.c;
    const footer = content.c[content.c.length - 1];
    assert.ok(footer.a.class.includes('bw-modal-footer'));
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
  it('should return a TACO with bw-toast class', function() {
    const result = makeToast({ title: 'Hello', content: 'World' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-toast'));
  });

  it('should apply variant class', function() {
    const result = makeToast({ variant: 'success' });
    assert.ok(result.a.class.includes('bw-toast-success'));
  });

  it('should default to info variant', function() {
    const result = makeToast({});
    assert.ok(result.a.class.includes('bw-toast-info'));
  });

  it('should render header when title is provided', function() {
    const result = makeToast({ title: 'Notice' });
    const header = result.c[0];
    assert.ok(header.a.class.includes('bw-toast-header'));
  });

  it('should render body when content is provided', function() {
    const result = makeToast({ content: 'Message text' });
    // With no title, content is the first child after filter
    const body = result.c.find(c => c && c.a && c.a.class && c.a.class.includes('bw-toast-body'));
    assert.ok(body);
    assert.strictEqual(body.c, 'Message text');
  });

  it('should have mounted lifecycle hook', function() {
    const result = makeToast({ content: 'Test' });
    assert.strictEqual(typeof result.o.mounted, 'function');
  });

  it('should store data-position attribute', function() {
    const result = makeToast({ position: 'bottom-left' });
    assert.strictEqual(result.a['data-position'], 'bottom-left');
  });

  it('should be available on bw object', function() {
    assert.strictEqual(typeof bw.makeToast, 'function');
  });
});

// =========================================================================
// Phase 3: Essential Modern
// =========================================================================

describe('makeDropdown', function() {
  it('should return a TACO with bw-dropdown class', function() {
    const result = makeDropdown({ trigger: 'Menu', items: [] });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-dropdown'));
  });

  it('should create trigger button from string', function() {
    const result = makeDropdown({ trigger: 'Actions' });
    const trigger = result.c[0];
    assert.strictEqual(trigger.t, 'button');
    assert.ok(trigger.a.class.includes('bw-dropdown-toggle'));
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
    assert.ok(menu.a.class.includes('bw-dropdown-menu'));
    assert.strictEqual(menu.c.length, 2);
  });

  it('should render divider items', function() {
    const result = makeDropdown({
      trigger: 'Menu',
      items: [{ text: 'A' }, { divider: true }, { text: 'B' }]
    });
    const menu = result.c[1];
    assert.strictEqual(menu.c[1].t, 'hr');
    assert.ok(menu.c[1].a.class.includes('bw-dropdown-divider'));
  });

  it('should apply align=end class', function() {
    const result = makeDropdown({ trigger: 'Menu', items: [], align: 'end' });
    const menu = result.c[1];
    assert.ok(menu.a.class.includes('bw-dropdown-menu-end'));
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
  it('should return a TACO with bw-form-switch class', function() {
    const result = makeSwitch({ label: 'Dark mode' });
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw-form-switch'));
  });

  it('should create checkbox input with switch role', function() {
    const result = makeSwitch({});
    const input = result.c[0];
    assert.strictEqual(input.a.type, 'checkbox');
    assert.strictEqual(input.a.role, 'switch');
    assert.ok(input.a.class.includes('bw-switch-input'));
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
    assert.ok(result.a.class.includes('bw-skeleton-text'));
  });

  it('should create circle variant', function() {
    const result = makeSkeleton({ variant: 'circle' });
    assert.ok(result.a.class.includes('bw-skeleton-circle'));
  });

  it('should create rect variant', function() {
    const result = makeSkeleton({ variant: 'rect' });
    assert.ok(result.a.class.includes('bw-skeleton-rect'));
  });

  it('should accept custom width and height', function() {
    const result = makeSkeleton({ width: '200px', height: '30px' });
    assert.strictEqual(result.a.style.width, '200px');
    assert.strictEqual(result.a.style.height, '30px');
  });

  it('should create multiple lines with count', function() {
    const result = makeSkeleton({ count: 3 });
    assert.ok(result.a.class.includes('bw-skeleton-group'));
    assert.strictEqual(result.c.length, 3);
  });

  it('should make last line 75% width in multi-line mode', function() {
    const result = makeSkeleton({ count: 3 });
    const lastLine = result.c[2];
    assert.strictEqual(lastLine.a.style.width, '75%');
  });

  it('should have skeleton animation class', function() {
    const result = makeSkeleton();
    assert.ok(result.a.class.includes('bw-skeleton'));
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
    assert.ok(result.a.class.includes('bw-avatar-lg'));
  });

  it('should default to md size', function() {
    const result = makeAvatar({ initials: 'AB' });
    assert.ok(result.a.class.includes('bw-avatar-md'));
  });

  it('should apply variant class to initials avatar', function() {
    const result = makeAvatar({ initials: 'AB', variant: 'success' });
    assert.ok(result.a.class.includes('bw-avatar-success'));
  });

  it('should default to primary variant', function() {
    const result = makeAvatar({ initials: 'AB' });
    assert.ok(result.a.class.includes('bw-avatar-primary'));
  });

  it('should have bw-avatar class', function() {
    const result = makeAvatar({ src: '/photo.jpg' });
    assert.ok(result.a.class.includes('bw-avatar'));
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
    assert.ok(all['.bw-btn-group, .bw-btn-group-vertical'], 'btn-group missing');
    assert.ok(all['.bw-accordion'], 'accordion missing');
    assert.ok(all['.bw-modal'], 'modal missing');
    assert.ok(all['.bw-toast'], 'toast missing');
    assert.ok(all['.bw-dropdown'], 'dropdown missing');
    assert.ok(all['.bw-form-switch'], 'form-switch missing');
    assert.ok(all['.bw-skeleton'], 'skeleton missing');
    assert.ok(all['.bw-avatar'], 'avatar missing');
    assert.ok(all['.bw-stat-card'], 'stat-card missing');
    assert.ok(all['.bw-tooltip-wrapper'], 'tooltip missing');
    assert.ok(all['.bw-popover-wrapper'], 'popover missing');
    assert.ok(all['.bw-search-input'], 'search-input missing');
    assert.ok(all['.bw-range'], 'range missing');
    assert.ok(all['.bw-media'], 'media missing');
    assert.ok(all['.bw-file-upload'], 'file-upload missing');
    assert.ok(all['.bw-timeline'], 'timeline missing');
    assert.ok(all['.bw-stepper'], 'stepper missing');
    assert.ok(all['.bw-chip-input'], 'chip-input missing');
  });

  it('getStructuralStyles should include new component rules', function() {
    const structural = getStructuralStyles();
    assert.ok(structural['.bw-btn-group, .bw-btn-group-vertical'], 'btn-group structural missing');
    assert.ok(structural['.bw-accordion'], 'accordion structural missing');
    assert.ok(structural['.bw-modal'], 'modal structural missing');
    assert.ok(structural['.bw-toast'], 'toast structural missing');
    assert.ok(structural['.bw-dropdown'], 'dropdown structural missing');
    assert.ok(structural['.bw-form-switch'], 'form-switch structural missing');
    assert.ok(structural['.bw-skeleton'], 'skeleton structural missing');
    assert.ok(structural['.bw-avatar'], 'avatar structural missing');
    assert.ok(structural['.bw-stat-card'], 'stat-card structural missing');
    assert.ok(structural['.bw-tooltip-wrapper'], 'tooltip structural missing');
    assert.ok(structural['.bw-popover-wrapper'], 'popover structural missing');
    assert.ok(structural['.bw-search-input'], 'search-input structural missing');
    assert.ok(structural['.bw-range'], 'range structural missing');
    assert.ok(structural['.bw-media'], 'media structural missing');
    assert.ok(structural['.bw-file-upload'], 'file-upload structural missing');
    assert.ok(structural['.bw-timeline'], 'timeline structural missing');
    assert.ok(structural['.bw-stepper'], 'stepper structural missing');
    assert.ok(structural['.bw-chip-input'], 'chip-input structural missing');
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
    assert.ok(css.includes('.bw-theme-alt'), 'should use .bw-theme-alt scope');
    assert.ok(css.includes('.bw-btn'), 'should include button rules');
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
    assert.ok(btn.a.class.includes('bw-btn'));
  });

  it('makeButton string shorthand should default to primary variant', function() {
    const btn = bw.makeButton('Save');
    assert.ok(btn.a.class.includes('bw-btn-primary'));
  });

  it('makeBadge should accept string shorthand', function() {
    const badge = bw.makeBadge('New');
    assert.strictEqual(badge.t, 'span');
    assert.strictEqual(badge.c, 'New');
    assert.ok(badge.a.class.includes('bw-badge'));
  });

  it('makeAlert should accept string shorthand', function() {
    const alert = bw.makeAlert('Something happened');
    assert.strictEqual(alert.t, 'div');
    assert.ok(alert.a.class.includes('bw-alert'));
    assert.ok(alert.c.some(function(child) { return child === 'Something happened'; }));
  });

  it('makeButton object form should still work', function() {
    const btn = bw.makeButton({ text: 'Cancel', variant: 'secondary' });
    assert.strictEqual(btn.c, 'Cancel');
    assert.ok(btn.a.class.includes('bw-btn-secondary'));
  });

  it('makeStatCard should accept string shorthand', function() {
    const stat = bw.makeStatCard('Users');
    assert.strictEqual(stat.t, 'div');
    assert.ok(stat.a.class.includes('bw-stat-card'));
    assert.ok(stat.c.some(function(child) { return child.c === 'Users' && child.a.class === 'bw-stat-label'; }));
  });
});

// =========================================================================
// makeStatCard
// =========================================================================

describe('makeStatCard', function() {
  it('should create basic stat card with value and label', function() {
    const stat = bw.makeStatCard({ value: 2345, label: 'Active Users' });
    assert.strictEqual(stat.t, 'div');
    assert.ok(stat.a.class.includes('bw-stat-card'));
    assert.ok(stat.c.some(function(child) { return child.a.class === 'bw-stat-value'; }));
    assert.ok(stat.c.some(function(child) { return child.a.class === 'bw-stat-label' && child.c === 'Active Users'; }));
  });

  it('should support variant for border color', function() {
    const stat = bw.makeStatCard({ value: 100, variant: 'success' });
    assert.ok(stat.a.class.includes('bw-stat-card-success'));
  });

  it('should show change indicator with up/down class', function() {
    const up = bw.makeStatCard({ value: 100, change: 5.3 });
    const changeUp = up.c.find(function(child) { return child.a && child.a.class && child.a.class.includes('bw-stat-change'); });
    assert.ok(changeUp);
    assert.ok(changeUp.a.class.includes('bw-stat-change-up'));

    const down = bw.makeStatCard({ value: 100, change: -2.1 });
    const changeDown = down.c.find(function(child) { return child.a && child.a.class && child.a.class.includes('bw-stat-change'); });
    assert.ok(changeDown);
    assert.ok(changeDown.a.class.includes('bw-stat-change-down'));
  });

  it('should format currency values', function() {
    const stat = bw.makeStatCard({ value: 45231, format: 'currency' });
    const valueEl = stat.c.find(function(child) { return child.a.class === 'bw-stat-value'; });
    assert.ok(valueEl.c.startsWith('$'));
  });

  it('should format percent values', function() {
    const stat = bw.makeStatCard({ value: 3.2, format: 'percent' });
    const valueEl = stat.c.find(function(child) { return child.a.class === 'bw-stat-value'; });
    assert.ok(valueEl.c.includes('%'));
  });

  it('should support custom prefix and suffix', function() {
    const stat = bw.makeStatCard({ value: 42, prefix: 'EUR ', suffix: ' avg' });
    const valueEl = stat.c.find(function(child) { return child.a.class === 'bw-stat-value'; });
    assert.strictEqual(valueEl.c, 'EUR 42 avg');
  });

  it('should show icon when provided', function() {
    const stat = bw.makeStatCard({ value: 100, icon: '📊' });
    assert.ok(stat.c.some(function(child) { return child.a.class === 'bw-stat-icon' && child.c === '📊'; }));
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
    assert.ok(tip.a.class.includes('bw-tooltip-wrapper'));
    assert.strictEqual(tip.c.length, 2);
    assert.strictEqual(tip.c[0], 'Hover me');
    assert.strictEqual(tip.c[1].c, 'Hello');
  });

  it('should default to top placement', function() {
    const tip = bw.makeTooltip({ text: 'tip' });
    assert.ok(tip.c[1].a.class.includes('bw-tooltip-top'));
  });

  it('should support all four placements', function() {
    ['top', 'bottom', 'left', 'right'].forEach(function(p) {
      const tip = bw.makeTooltip({ text: 'tip', placement: p });
      assert.ok(tip.c[1].a.class.includes('bw-tooltip-' + p));
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
    assert.ok(pop.a.class.includes('bw-popover-wrapper'));
    assert.strictEqual(pop.c.length, 2);
    // Trigger wrapper
    assert.ok(pop.c[0].a.class.includes('bw-popover-trigger'));
    assert.strictEqual(pop.c[0].c, 'Click');
    // Popover content
    assert.ok(pop.c[1].a.class.includes('bw-popover'));
  });

  it('should include header and body in popover', function() {
    const pop = bw.makePopover({ title: 'T', content: 'C' });
    const popContent = pop.c[1].c;
    assert.ok(popContent.some(function(child) { return child.a.class === 'bw-popover-header' && child.c === 'T'; }));
    assert.ok(popContent.some(function(child) { return child.a.class === 'bw-popover-body' && child.c === 'C'; }));
  });

  it('should default to top placement', function() {
    const pop = bw.makePopover({ content: 'C' });
    assert.ok(pop.c[1].a.class.includes('bw-popover-top'));
  });

  it('should support all four placements', function() {
    ['top', 'bottom', 'left', 'right'].forEach(function(p) {
      const pop = bw.makePopover({ content: 'C', placement: p });
      assert.ok(pop.c[1].a.class.includes('bw-popover-' + p));
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
    assert.ok(!popContent.some(function(child) { return child.a && child.a.class === 'bw-popover-header'; }));
  });
});

// =========================================================================
// Form validation states
// =========================================================================

describe('Form validation', function() {
  it('makeFormGroup should add bw-is-valid class to input when validation=valid', function() {
    const input = bw.makeInput({ id: 'email', type: 'email' });
    const group = bw.makeFormGroup({ label: 'Email', input: input, validation: 'valid', feedback: 'Looks good!' });
    const styledInput = group.c.find(function(child) { return child.t === 'input'; });
    assert.ok(styledInput.a.class.includes('bw-is-valid'));
  });

  it('makeFormGroup should add bw-is-invalid class to input when validation=invalid', function() {
    const input = bw.makeInput({ id: 'email', type: 'email' });
    const group = bw.makeFormGroup({ label: 'Email', input: input, validation: 'invalid', feedback: 'Invalid email' });
    const styledInput = group.c.find(function(child) { return child.t === 'input'; });
    assert.ok(styledInput.a.class.includes('bw-is-invalid'));
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
    const fb = group.c.find(function(child) { return child.a && child.a.class === 'bw-valid-feedback'; });
    assert.ok(fb);
    assert.strictEqual(fb.c, 'Looks good!');
  });

  it('should show invalid feedback text', function() {
    const group = bw.makeFormGroup({
      input: bw.makeInput({}),
      validation: 'invalid',
      feedback: 'Required field'
    });
    const fb = group.c.find(function(child) { return child.a && child.a.class === 'bw-invalid-feedback'; });
    assert.ok(fb);
    assert.strictEqual(fb.c, 'Required field');
  });

  it('should not show feedback when validation is not set', function() {
    const group = bw.makeFormGroup({
      input: bw.makeInput({}),
      feedback: 'Ignored'
    });
    const fb = group.c.find(function(child) { return child.a && (child.a.class === 'bw-valid-feedback' || child.a.class === 'bw-invalid-feedback'); });
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
    assert.ok(structural['.bw-valid-feedback'], 'valid-feedback structural missing');
    assert.ok(structural['.bw-invalid-feedback'], 'invalid-feedback structural missing');
  });
});

// =========================================================================
// makeSearchInput
// =========================================================================

describe('makeSearchInput', function() {
  it('should create search input wrapper', function() {
    const search = bw.makeSearchInput({});
    assert.strictEqual(search.t, 'div');
    assert.ok(search.a.class.includes('bw-search-input'));
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
    assert.ok(clearBtn.a.class.includes('bw-search-clear'));
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
    assert.ok(range.a.class.includes('bw-range-wrapper'));
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
    const label = range.c.find(function(child) { return child.a && child.a.class === 'bw-range-label'; });
    assert.ok(label);
    assert.ok(label.c.some(function(child) { return child.c === 'Volume'; }));
  });

  it('should show value display when showValue is true', function() {
    const range = bw.makeRange({ showValue: true, value: 42 });
    const label = range.c.find(function(child) { return child.a && child.a.class === 'bw-range-label'; });
    assert.ok(label);
    const valueDisplay = label.c.find(function(child) { return child.a && child.a.class === 'bw-range-value'; });
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
    assert.ok(media.a.class.includes('bw-media'));
    assert.strictEqual(media.c.length, 2);
    assert.strictEqual(media.c[0].t, 'img');
    assert.ok(media.c[1].a.class.includes('bw-media-body'));
  });

  it('should support reverse layout', function() {
    const media = bw.makeMediaObject({ src: '/photo.jpg', content: 'Hi', reverse: true });
    assert.ok(media.a.class.includes('bw-media-reverse'));
    // Body comes first, image second in reverse
    assert.ok(media.c[0].a.class.includes('bw-media-body'));
    assert.strictEqual(media.c[1].t, 'img');
  });

  it('should render title in body', function() {
    const media = bw.makeMediaObject({ title: 'John Doe', content: 'A message' });
    const body = media.c.find(function(child) { return child.a && child.a.class && child.a.class.includes('bw-media-body'); });
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
    assert.ok(upload.a.class.includes('bw-file-upload'));
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
    const textEl = upload.c.find(function(child) { return child.a && child.a.class === 'bw-file-upload-text'; });
    assert.ok(textEl);
    assert.strictEqual(textEl.c, 'Upload CSV');
  });

  it('should have icon', function() {
    const upload = bw.makeFileUpload({});
    const icon = upload.c.find(function(child) { return child.a && child.a.class === 'bw-file-upload-icon'; });
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
    assert.ok(tl.a.class.includes('bw-timeline'));
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
    assert.ok(first.a.class.includes('bw-timeline-item'));
    const marker = first.c[0];
    assert.ok(marker.a.class.includes('bw-timeline-marker'));
    const content = first.c[1];
    assert.ok(content.a.class.includes('bw-timeline-content'));
  });

  it('should apply variant to marker', function() {
    const tl = bw.makeTimeline({ items: [{ title: 'Done', variant: 'success' }] });
    const marker = tl.c[0].c[0];
    assert.ok(marker.a.class.includes('bw-timeline-marker-success'));
  });

  it('should default variant to primary', function() {
    const tl = bw.makeTimeline({ items: [{ title: 'Event' }] });
    const marker = tl.c[0].c[0];
    assert.ok(marker.a.class.includes('bw-timeline-marker-primary'));
  });

  it('should render date, title, and text content', function() {
    const tl = bw.makeTimeline({ items: [{ title: 'Launch', date: 'Feb', content: 'Details here' }] });
    const contentDiv = tl.c[0].c[1]; // timeline-content
    const date = contentDiv.c.find(function(c) { return c.a && c.a.class === 'bw-timeline-date'; });
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
    assert.ok(s.a.class.includes('bw-stepper'));
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
    assert.ok(s.c[0].a.class.includes('bw-step-completed'));
    assert.ok(s.c[1].a.class.includes('bw-step-active'));
    assert.ok(s.c[2].a.class.includes('bw-step-pending'));
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
    const desc = body.c.find(function(c) { return c.a && c.a.class === 'bw-step-description'; });
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
    assert.ok(ci.a.class.includes('bw-chip-input'));
  });

  it('should render initial chips', function() {
    const ci = bw.makeChipInput({ chips: ['JS', 'CSS', 'HTML'] });
    const chips = ci.c.filter(function(c) { return c.t === 'span' && c.a.class === 'bw-chip'; });
    assert.strictEqual(chips.length, 3);
    assert.strictEqual(chips[0].a['data-chip-value'], 'JS');
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
    const chip = ci.c.find(function(c) { return c.t === 'span' && c.a.class === 'bw-chip'; });
    const removeBtn = chip.c.find(function(c) { return c.t === 'button'; });
    assert.ok(removeBtn);
    assert.ok(removeBtn.a.class.includes('bw-chip-remove'));
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
    assert.ok(all['.bw-breadcrumb-item a'], 'breadcrumb link styles missing');
  });
});
