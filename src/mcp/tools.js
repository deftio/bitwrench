/**
 * MCP tool definitions and handlers for bitwrench BCCL components
 * and core utilities.
 *
 * Each tool accepts JSON args matching its inputSchema, calls the
 * corresponding bw.make*() or bw.*() function, and returns an MCP
 * result object.
 *
 * @module mcp/tools
 */

import bw from '../bitwrench.js';

// -- JSON Schema helpers --

var STR = { type: 'string' };
var BOOL = { type: 'boolean' };
var OBJ = { type: 'object' };
var NUM = { type: 'number' };
var STR_OR_OBJ = { oneOf: [{ type: 'string' }, { type: 'object' }] };
var STR_OR_ARRAY = { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'object' } }] };
var VARIANT_ENUM = {
  type: 'string',
  enum: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
  description: 'Color variant'
};
var SIZE_ENUM = {
  type: 'string',
  enum: ['sm', 'md', 'lg'],
  description: 'Size variant'
};

// -- Component tool definitions (Phase 1: 10 most-used BCCL components) --

export var componentToolDefs = [
  {
    name: 'make_card',
    title: 'Create Card Component',
    description: 'Create a bitwrench card component. Returns a TACO object (JSON) that can be rendered to HTML using render_taco, or composed into larger layouts.',
    inputSchema: {
      type: 'object',
      properties: {
        title:     { ...STR, description: 'Card title text' },
        subtitle:  { ...STR, description: 'Card subtitle text' },
        content:   { ...STR_OR_OBJ, description: 'Card body content. String or TACO object.' },
        footer:    { ...STR_OR_OBJ, description: 'Card footer content. String or TACO object.' },
        header:    { ...STR_OR_OBJ, description: 'Custom card header content' },
        image:     { ...STR, description: 'URL for card header image' },
        imagePosition: { type: 'string', enum: ['top', 'bottom', 'left', 'right'], description: 'Image position (default: top)' },
        variant:   VARIANT_ENUM,
        bordered:  { ...BOOL, description: 'Show border (default: true)' },
        shadow:    { ...BOOL, description: 'Show shadow' },
        hoverable: { ...BOOL, description: 'Hover effect (default: false)' },
        className: { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_button',
    title: 'Create Button Component',
    description: 'Create a bitwrench button. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        text:     { ...STR, description: 'Button text' },
        variant:  { ...VARIANT_ENUM, description: 'Color variant (default: primary)' },
        size:     SIZE_ENUM,
        disabled: { ...BOOL, description: 'Disabled state' },
        type:     { type: 'string', enum: ['button', 'submit', 'reset'], description: 'Button type (default: button)' },
        className: { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_table',
    title: 'Create Data Table',
    description: 'Create a sortable data table. Pass data as array of objects and columns config. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        data:      { type: 'array', items: OBJ, description: 'Array of row objects' },
        columns:   { type: 'array', items: OBJ, description: 'Column config: [{key, label, sortable}]' },
        striped:   { ...BOOL, description: 'Striped rows (default: false)' },
        hover:     { ...BOOL, description: 'Hover highlight (default: false)' },
        sortable:  { ...BOOL, description: 'Enable sorting (default: true)' },
        className: { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_tabs',
    title: 'Create Tabs Component',
    description: 'Create a tabbed interface. Each tab has a label and content. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        tabs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { ...STR, description: 'Tab label' },
              content: { ...STR_OR_OBJ, description: 'Tab content (string or TACO)' }
            }
          },
          description: 'Array of {label, content} tab objects'
        },
        activeIndex: { ...NUM, description: 'Initially active tab index (default: 0)' }
      }
    }
  },
  {
    name: 'make_accordion',
    title: 'Create Accordion Component',
    description: 'Create collapsible sections. Each item has a title and content. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { ...STR, description: 'Section title' },
              content: { ...STR_OR_OBJ, description: 'Section content (string or TACO)' }
            }
          },
          description: 'Array of {title, content} items'
        },
        multiOpen:  { ...BOOL, description: 'Allow multiple sections open (default: false)' },
        className:  { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_alert',
    title: 'Create Alert Component',
    description: 'Create an alert/notification box. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        content:     { ...STR_OR_OBJ, description: 'Alert message (string or TACO)' },
        variant:     { ...VARIANT_ENUM, description: 'Color variant (default: info)' },
        dismissible: { ...BOOL, description: 'Show dismiss button (default: false)' },
        className:   { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_nav',
    title: 'Create Navigation Component',
    description: 'Create horizontal or vertical navigation. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { ...STR, description: 'Nav item text' },
              href: { ...STR, description: 'Link URL' },
              active: { ...BOOL, description: 'Active state' }
            }
          },
          description: 'Array of {text, href, active} nav items'
        },
        pills:    { ...BOOL, description: 'Pill style (default: false)' },
        vertical: { ...BOOL, description: 'Vertical layout (default: false)' },
        className: { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_hero',
    title: 'Create Hero Section',
    description: 'Create a full-width hero section with title, subtitle, and optional call-to-action. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        title:      { ...STR, description: 'Hero title' },
        subtitle:   { ...STR, description: 'Hero subtitle' },
        content:    { ...STR_OR_OBJ, description: 'Additional content below subtitle' },
        variant:    { ...VARIANT_ENUM, description: 'Color variant (default: primary)' },
        size:       { type: 'string', enum: ['sm', 'md', 'lg', 'xl'], description: 'Size (default: lg)' },
        centered:   { ...BOOL, description: 'Center text (default: true)' },
        overlay:    { ...BOOL, description: 'Dark overlay for readability' },
        backgroundImage: { ...STR, description: 'Background image URL' },
        actions:    { oneOf: [OBJ, { type: 'array', items: OBJ }], description: 'CTA buttons (TACO or array of TACOs)' },
        className:  { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_stat_card',
    title: 'Create Stat Card',
    description: 'Create a statistic display card (KPI). Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        label:   { ...STR, description: 'Stat label (e.g. "Revenue")' },
        value:   { ...STR_OR_OBJ, description: 'Stat value (e.g. "$12,345" or 12345)' },
        change:  { ...STR, description: 'Change indicator (e.g. "+5.2%")' },
        prefix:  { ...STR, description: 'Value prefix (e.g. "$")' },
        suffix:  { ...STR, description: 'Value suffix (e.g. "%")' },
        icon:    { ...STR, description: 'Icon text or emoji' },
        variant: VARIANT_ENUM,
        className: { ...STR, description: 'Additional CSS class' }
      }
    }
  },
  {
    name: 'make_form_group',
    title: 'Create Form Group',
    description: 'Create a label + input wrapper for forms. Returns a TACO object.',
    inputSchema: {
      type: 'object',
      properties: {
        label:      { ...STR, description: 'Field label text' },
        input:      { ...OBJ, description: 'Input TACO (e.g. from make_input)' },
        help:       { ...STR, description: 'Help text below input' },
        id:         { ...STR, description: 'Input id attribute' },
        required:   { ...BOOL, description: 'Mark as required' },
        validation: { ...STR, description: 'Validation state: valid, invalid' },
        feedback:   { ...STR, description: 'Validation feedback message' }
      }
    }
  }
];

// -- Core utility tool definitions --

export var utilityToolDefs = [
  {
    name: 'render_taco',
    title: 'Render TACO to HTML',
    description: 'Convert a TACO object to an HTML string. Use this to preview or save the output of any TACO-producing tool.',
    inputSchema: {
      type: 'object',
      properties: {
        taco: {
          type: 'object',
          description: 'TACO object with fields: t (tag), a (attributes), c (content), o (options).',
          properties: {
            t: { ...STR, description: 'HTML tag name (div, p, h1, etc.)' },
            a: { ...OBJ, description: 'HTML attributes (class, id, style, etc.)' },
            c: { description: 'Content: string, TACO, or array of strings/TACOs' }
          },
          required: ['t']
        },
        indent: { ...BOOL, description: 'Pretty-print with indentation (default: false)' }
      },
      required: ['taco']
    }
  },
  {
    name: 'build_page',
    title: 'Build Complete HTML Page',
    description: 'Generate a complete, standalone HTML page with bitwrench styles and scripts inlined. The output is a single .html file that works offline. Use this as the final step after composing your TACO layout.',
    inputSchema: {
      type: 'object',
      properties: {
        title:   { ...STR, description: 'Page title (shown in browser tab)' },
        content: {
          description: 'Page body content as TACO object or array of TACOs',
          oneOf: [OBJ, { type: 'array', items: OBJ }]
        },
        theme: { ...STR, description: 'Theme preset name (ocean, forest, sunset, midnight, slate, rose, indigo, amber, emerald, nord, coral, teal) or hex color for primary seed' },
        description: { ...STR, description: 'Meta description for SEO' },
        runtime: { type: 'string', enum: ['inline', 'cdn', 'shim', 'none'], description: 'How to include bitwrench runtime (default: inline for standalone pages)' }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'make_styles',
    title: 'Generate CSS from Theme Config',
    description: 'Generate CSS stylesheet from seed colors. Returns CSS text that can be included in pages. Use this for custom theming beyond the built-in presets.',
    inputSchema: {
      type: 'object',
      properties: {
        primary:   { ...STR, description: 'Primary color hex (e.g. "#4f46e5")' },
        secondary: { ...STR, description: 'Secondary color hex' },
        background: { ...STR, description: 'Background color hex' },
        surface:   { ...STR, description: 'Surface color hex' }
      },
      required: ['primary']
    }
  }
];

// -- Tool handlers --

/**
 * Call a BCCL make*() function. Maps tool name (snake_case) to bw method (camelCase).
 */
function callBCCL(toolName, args) {
  // make_card -> makeCard, make_stat_card -> makeStatCard
  var methodName = toolName.replace(/_([a-z])/g, function(_, c) { return c.toUpperCase(); });
  var fn = bw[methodName];
  if (typeof fn !== 'function') {
    return { content: [{ type: 'text', text: 'Internal error: bw.' + methodName + ' not found' }], isError: true };
  }
  try {
    var taco = fn(args || {});
    return {
      content: [{ type: 'text', text: JSON.stringify(taco) }],
      structuredContent: taco
    };
  } catch (e) {
    return { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true };
  }
}

export var toolHandlers = {
  // Component tools
  make_card:       function(args) { return callBCCL('make_card', args); },
  make_button:     function(args) { return callBCCL('make_button', args); },
  make_table:      function(args) { return callBCCL('make_table', args); },
  make_tabs:       function(args) { return callBCCL('make_tabs', args); },
  make_accordion:  function(args) { return callBCCL('make_accordion', args); },
  make_alert:      function(args) { return callBCCL('make_alert', args); },
  make_nav:        function(args) { return callBCCL('make_nav', args); },
  make_hero:       function(args) { return callBCCL('make_hero', args); },
  make_stat_card:  function(args) { return callBCCL('make_stat_card', args); },
  make_form_group: function(args) { return callBCCL('make_form_group', args); },

  // Core utilities
  render_taco: function(args) {
    try {
      var opts = {};
      if (args.indent) opts.indent = true;
      var html = bw.html(args.taco, opts);
      return { content: [{ type: 'text', text: html }] };
    } catch (e) {
      return { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true };
    }
  },

  build_page: function(args) {
    try {
      var html = bw.htmlPage({
        title: args.title,
        body: args.content,
        theme: args.theme || null,
        runtime: args.runtime || 'inline',
        description: args.description || ''
      });
      return { content: [{ type: 'text', text: html }] };
    } catch (e) {
      return { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true };
    }
  },

  make_styles: function(args) {
    try {
      var styles = bw.makeStyles(args);
      return {
        content: [{ type: 'text', text: styles.css }],
        structuredContent: {
          css: styles.css,
          isLightPrimary: styles.isLightPrimary
        }
      };
    } catch (e) {
      return { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true };
    }
  }
};
