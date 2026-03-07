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
  makeAvatar, ModalHandle
} from "../src/bitwrench-components-v2.js";
import { defaultStyles, getStructuralStyles, generateThemedCSS, generateDarkModeCSS, getAllStyles } from "../src/bitwrench-styles.js";
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

describe('ModalHandle', function() {
  it('should have show, hide, toggle, destroy methods', function() {
    const dom = freshDOM();
    const el = document.createElement('div');
    el.classList.add('bw-modal');
    const handle = new ModalHandle(el, {});
    assert.strictEqual(typeof handle.show, 'function');
    assert.strictEqual(typeof handle.hide, 'function');
    assert.strictEqual(typeof handle.toggle, 'function');
    assert.strictEqual(typeof handle.destroy, 'function');
  });

  it('should toggle bw-modal-show class', function() {
    const dom = freshDOM();
    const el = document.createElement('div');
    el.classList.add('bw-modal');
    document.body.appendChild(el);
    const handle = new ModalHandle(el, {});

    handle.show();
    assert.ok(el.classList.contains('bw-modal-show'));
    handle.hide();
    assert.ok(!el.classList.contains('bw-modal-show'));
    handle.toggle();
    assert.ok(el.classList.contains('bw-modal-show'));
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
  });

  it('getStructuralStyles should include underscore aliases', function() {
    const structural = getStructuralStyles();
    assert.ok(structural['.bw_accordion'], 'underscore alias missing for accordion');
    assert.ok(structural['.bw_modal'], 'underscore alias missing for modal');
    assert.ok(structural['.bw_avatar'], 'underscore alias missing for avatar');
  });

  it('generateDarkModeCSS should produce dark rules for new components', function() {
    const palette = bw.derivePalette({ primary: '#006666', secondary: '#6c757d' });
    const darkCSS = generateDarkModeCSS(palette);
    assert.ok(darkCSS['.bw-dark .bw-accordion-item'], 'dark accordion missing');
    assert.ok(darkCSS['.bw-dark .bw-modal-content'], 'dark modal missing');
    assert.ok(darkCSS['.bw-dark .bw-toast'], 'dark toast missing');
    assert.ok(darkCSS['.bw-dark .bw-dropdown-menu'], 'dark dropdown missing');
    assert.ok(darkCSS['.bw-dark .bw-skeleton'], 'dark skeleton missing');
  });
});

// =========================================================================
// componentHandles registry
// =========================================================================

describe('componentHandles', function() {
  it('should include modal handle', function() {
    assert.ok(bw._componentHandles.modal, 'modal handle missing from registry');
  });
});
