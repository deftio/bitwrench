/**
 * MCP knowledge tools -- serve documentation as tool results.
 *
 * Knowledge tools read .md files from docs/ at call time (no caching,
 * always fresh). Section/component filtering uses simple heading parsing.
 *
 * @module mcp/knowledge
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

var __dirname = dirname(fileURLToPath(import.meta.url));
var DOCS_DIR = resolve(__dirname, '../../docs');

// Section name -> heading prefix mapping for bitwrench_guide
var GUIDE_SECTIONS = {
  'taco':           'Step 2: Understand TACO',
  'levels':         'Step 3: Three Levels',
  'events':         'Step 4: Events',
  'css':            'Step 5: CSS and Theming',
  'components':     'Step 6: BCCL Components',
  'bwserve':        'Step 8: bwserve',
  'routing':        'Step 9: Client-Side Routing',
  'api-reference':  'Core API Quick Reference',
  'rules':          'Key Rules Summary'
};

/**
 * Extract a section from markdown content by ## heading.
 * Returns text from the matching ## heading to the next ## heading (or EOF).
 */
function extractSection(content, heading) {
  var lines = content.split('\n');
  var start = -1;
  var end = lines.length;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (start === -1) {
      if (line.startsWith('## ') && line.indexOf(heading) >= 0) {
        start = i;
      }
    } else if (line.startsWith('## ')) {
      end = i;
      break;
    }
  }
  if (start === -1) return null;
  return lines.slice(start, end).join('\n').trim();
}

/**
 * Extract a component section from component-library.md by ### heading.
 */
function extractComponent(content, name) {
  var lines = content.split('\n');
  var start = -1;
  var end = lines.length;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (start === -1) {
      if (line.startsWith('### ') && line.indexOf(name) >= 0) {
        start = i;
      }
    } else if (line.startsWith('### ') || line.startsWith('## ')) {
      end = i;
      break;
    }
  }
  if (start === -1) return null;
  return lines.slice(start, end).join('\n').trim();
}

/**
 * Read a doc file. Returns content string or error message.
 */
function readDoc(filename) {
  try {
    return readFileSync(resolve(DOCS_DIR, filename), 'utf8');
  } catch (e) {
    return 'Error: could not read ' + filename + ' (' + e.code + ')';
  }
}

// -- Tool definitions --

export var knowledgeToolDefs = [
  {
    name: 'bitwrench_start_here',
    title: 'Start Here -- Bitwrench Quick Orientation',
    description: 'IMPORTANT: Call this tool FIRST before using any other bitwrench tools. Returns a quick orientation: what bitwrench is, the TACO format, your workflow for building UI, and which other tools to call for deeper knowledge.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'bitwrench_guide',
    title: 'Bitwrench Developer Guide',
    description: 'Complete bitwrench developer guide covering TACO format, component composition, layout patterns, theming, and workflow. Call this to learn how to use bitwrench effectively. Read this guide, then use the component and utility tools.',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Optional: return only a specific section. Omit for full guide.',
          enum: ['taco', 'levels', 'events', 'css', 'components', 'bwserve', 'routing', 'api-reference', 'rules']
        }
      }
    }
  },
  {
    name: 'bitwrench_components',
    title: 'Component Library Reference',
    description: 'Complete reference for all bitwrench make*() components. Call this when you need to know the exact props, variants, and options for a specific component. Returns the full component catalog with examples.',
    inputSchema: {
      type: 'object',
      properties: {
        component: {
          type: 'string',
          description: "Optional: return docs for a specific component only (e.g. 'makeCard', 'makeTable', 'makeAccordion'). Omit for complete catalog."
        }
      }
    }
  },
  {
    name: 'bitwrench_server_guide',
    title: 'Server-Driven UI Guide',
    description: 'Tutorial for building server-driven UI with bwserve. Covers: SSE streaming, replace/patch/append protocol, data-bw-action buttons, live metrics, screenshots. Call this when building real-time or server-pushed interfaces.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'bitwrench_themes',
    title: 'Theme and Color Reference',
    description: 'Reference for bitwrench theming: 12 built-in presets (teal, ocean, sunset, forest, slate, rose, indigo, amber, emerald, nord, coral, midnight), custom palette configuration, color utilities.',
    inputSchema: { type: 'object', properties: {} }
  }
];

// -- Tool handlers --

var START_HERE_TEXT = [
  'BITWRENCH QUICK ORIENTATION',
  '============================',
  '',
  'Bitwrench is a zero-dependency JS UI library (~40KB gzipped). You',
  'generate UI by composing TACO objects -- plain JSON:',
  '',
  "  {t: 'div', a: {class: 'bw_card'}, c: 'Hello'}",
  '   ^tag       ^attributes             ^content (string, TACO, or array)',
  '',
  'YOUR WORKFLOW:',
  '1. Call bitwrench_guide to learn TACO format, layout, and composition',
  '2. Call bitwrench_components to look up props for specific components',
  '3. Call make_card, make_table, make_hero, etc. to build TACO components',
  '4. Nest TACOs into a layout using the grid: bw_container > bw_row > bw_col',
  '5. Call build_page with a theme to produce a complete standalone .html file',
  '',
  'KEY RULES:',
  '- Every make*() tool returns a TACO object, NOT HTML',
  "- Compose by nesting TACOs in the 'c' field: {t:'div', c: [taco1, taco2]}",
  '- Grid layout:',
  "    {t:'div', a:{class:'bw_container'}, c:[",
  "      {t:'div', a:{class:'bw_row'}, c:[",
  "        {t:'div', a:{class:'bw_col'}, c:[ <your content> ]}",
  '      ]}',
  '    ]}',
  "- Themes: pass theme:'ocean' to build_page (also: forest, sunset,",
  '  midnight, slate, rose, indigo, amber, emerald, nord, coral, teal)',
  '- Call render_taco to convert any TACO to an HTML string',
  '- Call build_page to get a complete standalone .html file (works offline)',
  '',
  'OTHER KNOWLEDGE TOOLS (call as needed):',
  '- bitwrench_guide: Full tutorial (TACO format, 3 levels, events, CSS,',
  '  components, bwserve, routing, API reference)',
  '- bitwrench_components: Props reference for all 47+ make*() components',
  '- bitwrench_server_guide: bwserve tutorial (SSE streaming, live UI)',
  '- bitwrench_themes: Theme presets, custom palettes, color utilities'
].join('\n');

export var knowledgeHandlers = {
  bitwrench_start_here: function() {
    return { content: [{ type: 'text', text: START_HERE_TEXT }] };
  },

  bitwrench_guide: function(args) {
    var content = readDoc('llm-bitwrench-guide.md');
    if (args && args.section) {
      var heading = GUIDE_SECTIONS[args.section];
      if (!heading) {
        return {
          content: [{ type: 'text', text: 'Unknown section: ' + args.section + '. Valid: ' + Object.keys(GUIDE_SECTIONS).join(', ') }],
          isError: true
        };
      }
      var section = extractSection(content, heading);
      if (!section) {
        return {
          content: [{ type: 'text', text: 'Section not found in guide: ' + heading }],
          isError: true
        };
      }
      content = section;
    }
    return { content: [{ type: 'text', text: content }] };
  },

  bitwrench_components: function(args) {
    var content = readDoc('component-library.md');
    if (args && args.component) {
      var section = extractComponent(content, args.component);
      if (!section) {
        return {
          content: [{ type: 'text', text: 'Component not found: ' + args.component }],
          isError: true
        };
      }
      content = section;
    }
    return { content: [{ type: 'text', text: content }] };
  },

  bitwrench_server_guide: function() {
    return { content: [{ type: 'text', text: readDoc('tutorial-bwserve.md') }] };
  },

  bitwrench_themes: function() {
    return { content: [{ type: 'text', text: readDoc('theming.md') }] };
  }
};

// Exported for testing
export { extractSection, extractComponent, readDoc, GUIDE_SECTIONS, DOCS_DIR };
