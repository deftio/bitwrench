/**
 * Shared Navigation Component for All Examples
 * This provides consistent navigation across all example pages
 */

// Define the shared navbar component
window.ExampleNavbar = function() {
  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Define all example pages
  const examples = [
    { text: 'Home', href: 'index.html' },
    { text: 'Basic', href: '01-basic-example.html' },
    { text: 'Forms', href: '02-forms.html' },
    { text: 'Kitchen Sink', href: '03-kitchen-sink.html' },
    { text: 'Helpers', href: '04-helper-functions.html' },
    { text: 'Dashboard', href: '05-dashboard.html' },
    { text: 'Interactive', href: '06-interactive.html' },
    { text: 'Render API', href: '07-render-api.html' },
    { text: 'Theme', href: '08-theme-switcher.html' }
  ];
  
  // Mark current page as active
  const navItems = examples.map(item => ({
    ...item,
    active: item.href === currentPage
  }));
  
  // Use the Navbar component from bitwrench-components-inline.js
  return bw.components.Navbar({
    brand: 'Bitwrench v2 Examples',
    brandHref: 'index.html',
    dark: true,
    items: navItems
  });
};

// Shared page layout wrapper
window.ExamplePage = function(config) {
  const { title, content } = config;
  
  // Set page title
  document.title = `${title} - Bitwrench v2 Examples`;
  
  return {
    t: 'div',
    a: { class: 'bw-page' },
    c: [
      // Shared navigation
      ExampleNavbar(),
      
      // Main content area with consistent styling
      {
        t: 'main',
        a: { class: 'bw-page-content' },
        c: {
          t: 'div',
          a: { class: 'container' },
          c: content
        }
      }
    ]
  };
};