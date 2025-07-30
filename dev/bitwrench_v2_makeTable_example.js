/**
 * Bitwrench v2 makeTable - Returns TACO objects, not HTML strings
 * 
 * This example shows how v2 tables work with the TACO pattern
 */

// v2 makeTable returns a TACO object
bw.makeTable = function(config) {
  const {
    data,
    columns,
    caption,
    sortable = true,
    striped = true,
    hover = true,
    className = ''
  } = config;
  
  // Build classes
  const classes = ['bw-table'];
  if (striped) classes.push('bw-table-striped');
  if (hover) classes.push('bw-table-hover');
  if (className) classes.push(className);
  
  // Detect if data is array format (v1 style) or object format
  const isArrayFormat = Array.isArray(data) && Array.isArray(data[0]);
  
  let headers, rows;
  
  if (isArrayFormat) {
    // v1 compatibility: [["Name", "Age"], ["John", 30], ["Jane", 25]]
    headers = data[0];
    rows = data.slice(1);
  } else {
    // v2 object format: [{name: "John", age: 30}, {name: "Jane", age: 25}]
    headers = columns ? columns.map(c => c.label || c.key) : Object.keys(data[0]);
    rows = data;
  }
  
  // Return TACO object
  return {
    t: 'table',
    a: { 
      class: classes.join(' '),
      'data-sortable': sortable 
    },
    c: [
      // Caption
      caption && {
        t: 'caption',
        c: caption
      },
      
      // Header
      {
        t: 'thead',
        c: {
          t: 'tr',
          c: headers.map((header, idx) => ({
            t: 'th',
            a: sortable ? {
              class: 'bw-sortable',
              onclick: function(e) {
                // Sort handler that updates the table
                const table = e.target.closest('table');
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                // Determine sort direction
                const isAsc = e.target.classList.contains('bw-sort-asc');
                e.target.classList.toggle('bw-sort-asc', !isAsc);
                e.target.classList.toggle('bw-sort-desc', isAsc);
                
                // Sort rows
                rows.sort((a, b) => {
                  const aVal = a.children[idx].textContent;
                  const bVal = b.children[idx].textContent;
                  const result = bw.naturalCompare(aVal, bVal);
                  return isAsc ? -result : result;
                });
                
                // Re-append sorted rows
                rows.forEach(row => tbody.appendChild(row));
              }
            } : {},
            c: header
          }))
        }
      },
      
      // Body
      {
        t: 'tbody',
        c: rows.map(row => ({
          t: 'tr',
          c: isArrayFormat ? 
            // Array format: just map the values
            row.map(cell => ({ t: 'td', c: cell })) :
            // Object format: extract values in column order
            (columns || Object.keys(row)).map(col => ({
              t: 'td',
              c: typeof col === 'string' ? row[col] : row[col.key]
            }))
        }))
      }
    ].filter(Boolean) // Remove undefined caption
  };
};

// Example usage:
const tableData = [
  { name: "John Doe", age: 30, city: "New York" },
  { name: "Jane Smith", age: 25, city: "San Francisco" },
  { name: "Bob Johnson", age: 35, city: "Chicago" }
];

// Create TACO object
const tableTaco = bw.makeTable({
  data: tableData,
  columns: [
    { key: 'name', label: 'Full Name' },
    { key: 'age', label: 'Age' },
    { key: 'city', label: 'Location' }
  ],
  caption: 'Employee Directory',
  sortable: true,
  striped: true
});

// Now you can:
// 1. Convert to HTML string
const tableHTML = bw.html(tableTaco);

// 2. Render to DOM
const tableElement = bw.createDOM(tableTaco);

// 3. Mount to container with lifecycle
bw.DOM('#table-container', tableTaco);

// 4. Use in a larger TACO structure
const page = {
  t: 'div',
  c: [
    { t: 'h1', c: 'Data Report' },
    tableTaco,  // Just include the TACO
    { t: 'p', c: 'Last updated: ' + new Date() }
  ]
};

// The key insight: v2 returns TACO objects that can be:
// - Composed with other TACOs
// - Rendered when needed
// - Updated through the component lifecycle
// - Serialized/stored as JSON

// For backward compatibility, we could add an option:
bw.makeTable = function(config) {
  // ... same implementation ...
  
  const taco = { /* ... table TACO ... */ };
  
  // If legacy mode requested, return HTML string
  if (config.returnHTML === true) {
    return bw.html(taco);
  }
  
  // Default: return TACO
  return taco;
};