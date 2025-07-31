# htmlTable Modernization Plan

## Current v1 htmlTable Features

### What Works Well
1. **Array-based data format** - Simple `[["header1", "header2"], [data1, data2]]`
2. **Built-in sorting** - Click headers to sort, with visual indicators
3. **Natural sort algorithm** - Handles alphanumeric sorting correctly ("file2" before "file10")
4. **Extensive customization** - Attributes for table, thead, tbody, tr, th, td
5. **Caption support** - Can add table captions
6. **Function registration** - Custom sort functions can be registered and called

### What Could Be Improved
1. **API inconsistency** - Mix of attribute objects and boolean flags
2. **DOM manipulation** - Uses innerHTML and direct DOM access (not TACO)
3. **Sort state management** - Relies on CSS classes for state
4. **Limited data formats** - Only accepts arrays, not objects
5. **No pagination** - No built-in support for large datasets
6. **No search/filter** - Basic tables only
7. **Accessibility** - Missing ARIA labels for sort buttons

## Modernization Strategy for v2

### Keep the Good Parts
- Natural sort algorithm (`bw.naturalCompare`)
- Sortable columns with visual feedback
- Extensive customization options
- Caption support

### Modernize the Implementation
1. **Use TACO format** throughout
2. **Support both array and object data**:
   ```javascript
   // Array format (v1 compatible)
   data: [["Name", "Age"], ["John", 30], ["Jane", 25]]
   
   // Object format (new)
   data: [
     {name: "John", age: 30},
     {name: "Jane", age: 25}
   ]
   ```

3. **Better API design**:
   ```javascript
   bw.htmlTable({
     data: myData,
     columns: [
       { key: 'name', label: 'Name', sortable: true },
       { key: 'age', label: 'Age', sortable: true, type: 'number' }
     ],
     features: {
       sort: true,
       search: true,
       pagination: { pageSize: 10 }
     },
     styling: {
       table: { class: 'table table-striped' },
       thead: { class: 'thead-dark' }
     }
   })
   ```

4. **Component-based with lifecycle**:
   ```javascript
   const tableRef = bw.render(container, bw.htmlTable({...}));
   
   // Later updates
   tableRef.update({ data: newData });
   tableRef.sort('name', 'asc');
   tableRef.filter(row => row.age > 25);
   ```

5. **Progressive enhancement** - Basic table works without JS, enhance with features

## Migration Path

1. **Phase 1**: Keep v1 htmlTable as-is
2. **Phase 2**: Create v2 table component that uses TACO
3. **Phase 3**: Add adapter to make v1 data work with v2 component
4. **Phase 4**: Deprecate v1 but keep for compatibility

## Example v2 Table Component

```javascript
bw.components.Table = function(config) {
  const {
    data,
    columns,
    caption,
    sortable = true,
    className = 'bw-table'
  } = config;
  
  // Detect data format
  const isArrayFormat = Array.isArray(data[0]);
  
  // Convert to normalized format
  const normalizedData = isArrayFormat ? 
    convertArrayToObjects(data) : data;
  
  return {
    t: 'table',
    a: { class: className },
    c: [
      caption && { t: 'caption', c: caption },
      // ... rest of TACO structure
    ],
    o: {
      mounted(el) {
        // Set up sort handlers
        if (sortable) {
          this._setupSorting(el);
        }
      },
      methods: {
        sort(column, direction) {
          // Modern sort implementation
        },
        update(newData) {
          // Update table data
        }
      }
    }
  };
};
```

## Notes

- Keep backward compatibility where possible
- Focus on making common cases easy
- Don't lose the features that made v1 useful
- Use modern patterns (TACO, components) without overengineering