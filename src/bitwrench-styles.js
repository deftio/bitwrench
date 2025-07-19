/**
 * Bitwrench v2 Default Styles
 * Beautiful, responsive CSS inspired by modern design systems
 * Zero dependencies, works everywhere
 */

export const defaultStyles = {
  // CSS Reset and Base
  reset: {
    '*': {
      'box-sizing': 'border-box',
      'margin': '0',
      'padding': '0'
    },
    'html': {
      'font-size': '16px',
      'line-height': '1.5',
      '-webkit-text-size-adjust': '100%',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    },
    'body': {
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'color': '#212529',
      'background-color': '#fff',
      'margin': '0',
      'padding': '0'
    }
  },

  // Typography
  typography: {
    'h1, h2, h3, h4, h5, h6': {
      'margin-top': '0',
      'margin-bottom': '0.5rem',
      'font-weight': '500',
      'line-height': '1.2',
      'color': 'inherit'
    },
    'h1': { 'font-size': '2.5rem' },
    'h2': { 'font-size': '2rem' },
    'h3': { 'font-size': '1.75rem' },
    'h4': { 'font-size': '1.5rem' },
    'h5': { 'font-size': '1.25rem' },
    'h6': { 'font-size': '1rem' },
    
    'p': {
      'margin-top': '0',
      'margin-bottom': '1rem'
    },
    
    'small': {
      'font-size': '0.875rem'
    },
    
    'a': {
      'color': '#0d6efd',
      'text-decoration': 'underline'
    },
    'a:hover': {
      'color': '#0a58ca'
    }
  },

  // Grid System
  grid: {
    '.container': {
      'width': '100%',
      'padding-right': '15px',
      'padding-left': '15px',
      'margin-right': 'auto',
      'margin-left': 'auto'
    },
    '@media (min-width: 576px)': {
      '.container': { 'max-width': '540px' }
    },
    '@media (min-width: 768px)': {
      '.container': { 'max-width': '720px' }
    },
    '@media (min-width: 992px)': {
      '.container': { 'max-width': '960px' }
    },
    '@media (min-width: 1200px)': {
      '.container': { 'max-width': '1140px' }
    },
    '.container-fluid': {
      'width': '100%',
      'padding-right': '15px',
      'padding-left': '15px',
      'margin-right': 'auto',
      'margin-left': 'auto'
    },
    
    '.row': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'margin-right': '-15px',
      'margin-left': '-15px'
    },
    
    // Column system
    '[class*="col-"]': {
      'position': 'relative',
      'width': '100%',
      'padding-right': '15px',
      'padding-left': '15px'
    },
    '.col': {
      'flex-basis': '0',
      'flex-grow': '1',
      'max-width': '100%'
    }
  },

  // Buttons
  buttons: {
    '.btn': {
      'display': 'inline-block',
      'font-weight': '400',
      'line-height': '1.5',
      'text-align': 'center',
      'text-decoration': 'none',
      'vertical-align': 'middle',
      'cursor': 'pointer',
      'user-select': 'none',
      'background-color': 'transparent',
      'border': '1px solid transparent',
      'padding': '0.375rem 0.75rem',
      'font-size': '1rem',
      'border-radius': '0.25rem',
      'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    },
    '.btn:hover': {
      'text-decoration': 'none'
    },
    '.btn:focus': {
      'outline': '0',
      'box-shadow': '0 0 0 0.25rem rgba(13, 110, 253, 0.25)'
    },
    '.btn:disabled': {
      'opacity': '0.65',
      'cursor': 'not-allowed'
    },
    
    // Button variants
    '.btn-primary': {
      'color': '#fff',
      'background-color': '#0d6efd',
      'border-color': '#0d6efd'
    },
    '.btn-primary:hover': {
      'color': '#fff',
      'background-color': '#0b5ed7',
      'border-color': '#0a58ca'
    },
    
    '.btn-secondary': {
      'color': '#fff',
      'background-color': '#6c757d',
      'border-color': '#6c757d'
    },
    '.btn-secondary:hover': {
      'color': '#fff',
      'background-color': '#5c636a',
      'border-color': '#565e64'
    },
    
    '.btn-success': {
      'color': '#fff',
      'background-color': '#198754',
      'border-color': '#198754'
    },
    '.btn-success:hover': {
      'color': '#fff',
      'background-color': '#157347',
      'border-color': '#146c43'
    },
    
    '.btn-danger': {
      'color': '#fff',
      'background-color': '#dc3545',
      'border-color': '#dc3545'
    },
    '.btn-danger:hover': {
      'color': '#fff',
      'background-color': '#bb2d3b',
      'border-color': '#b02a37'
    },
    
    // Button sizes
    '.btn-lg': {
      'padding': '0.5rem 1rem',
      'font-size': '1.25rem',
      'border-radius': '0.3rem'
    },
    '.btn-sm': {
      'padding': '0.25rem 0.5rem',
      'font-size': '0.875rem',
      'border-radius': '0.2rem'
    }
  },

  // Cards
  cards: {
    '.card': {
      'position': 'relative',
      'display': 'flex',
      'flex-direction': 'column',
      'min-width': '0',
      'word-wrap': 'break-word',
      'background-color': '#fff',
      'background-clip': 'border-box',
      'border': '1px solid rgba(0,0,0,.125)',
      'border-radius': '0.25rem'
    },
    '.card-body': {
      'flex': '1 1 auto',
      'padding': '1rem'
    },
    '.card-title': {
      'margin-bottom': '0.5rem',
      'font-size': '1.25rem',
      'font-weight': '500'
    },
    '.card-text': {
      'margin-bottom': '0'
    },
    '.card-header': {
      'padding': '0.5rem 1rem',
      'margin-bottom': '0',
      'background-color': 'rgba(0,0,0,.03)',
      'border-bottom': '1px solid rgba(0,0,0,.125)'
    },
    '.card-footer': {
      'padding': '0.5rem 1rem',
      'background-color': 'rgba(0,0,0,.03)',
      'border-top': '1px solid rgba(0,0,0,.125)'
    },
    '.card-img-top': {
      'width': '100%',
      'border-top-left-radius': 'calc(0.25rem - 1px)',
      'border-top-right-radius': 'calc(0.25rem - 1px)'
    }
  },

  // Forms
  forms: {
    '.form-control': {
      'display': 'block',
      'width': '100%',
      'padding': '0.375rem 0.75rem',
      'font-size': '1rem',
      'font-weight': '400',
      'line-height': '1.5',
      'color': '#212529',
      'background-color': '#fff',
      'background-clip': 'padding-box',
      'border': '1px solid #ced4da',
      'appearance': 'none',
      'border-radius': '0.25rem',
      'transition': 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    },
    '.form-control:focus': {
      'color': '#212529',
      'background-color': '#fff',
      'border-color': '#86b7fe',
      'outline': '0',
      'box-shadow': '0 0 0 0.25rem rgba(13, 110, 253, 0.25)'
    },
    '.form-label': {
      'margin-bottom': '0.5rem',
      'font-weight': '500'
    },
    '.form-group': {
      'margin-bottom': '1rem'
    }
  },

  // Navigation
  navigation: {
    '.navbar': {
      'position': 'relative',
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '0.5rem 1rem',
      'background-color': '#f8f9fa'
    },
    '.navbar-brand': {
      'display': 'inline-block',
      'padding-top': '0.3125rem',
      'padding-bottom': '0.3125rem',
      'margin-right': '1rem',
      'font-size': '1.25rem',
      'line-height': 'inherit',
      'white-space': 'nowrap'
    },
    '.navbar-nav': {
      'display': 'flex',
      'flex-direction': 'row',
      'padding-left': '0',
      'margin-bottom': '0',
      'list-style': 'none'
    },
    '.nav-link': {
      'display': 'block',
      'padding': '0.5rem 1rem',
      'color': '#0d6efd',
      'text-decoration': 'none',
      'transition': 'color 0.15s ease-in-out'
    },
    '.nav-link:hover': {
      'color': '#0a58ca'
    },
    '.nav-link.active': {
      'color': '#495057',
      'font-weight': '500'
    }
  },

  // Tables
  tables: {
    '.table': {
      'width': '100%',
      'margin-bottom': '1rem',
      'color': '#212529',
      'vertical-align': 'top',
      'border-color': '#dee2e6'
    },
    '.table > :not(caption) > * > *': {
      'padding': '0.5rem 0.5rem',
      'background-color': 'transparent',
      'border-bottom-width': '1px',
      'box-shadow': 'inset 0 0 0 9999px transparent'
    },
    '.table > tbody': {
      'vertical-align': 'inherit'
    },
    '.table > thead': {
      'vertical-align': 'bottom'
    },
    '.table-striped > tbody > tr:nth-of-type(odd) > *': {
      'background-color': 'rgba(0, 0, 0, 0.05)'
    },
    '.table-hover > tbody > tr:hover > *': {
      'background-color': 'rgba(0, 0, 0, 0.075)'
    }
  },

  // Utilities
  utilities: {
    // Spacing
    '.m-0': { 'margin': '0' },
    '.m-1': { 'margin': '0.25rem' },
    '.m-2': { 'margin': '0.5rem' },
    '.m-3': { 'margin': '1rem' },
    '.m-4': { 'margin': '1.5rem' },
    '.m-5': { 'margin': '3rem' },
    
    '.p-0': { 'padding': '0' },
    '.p-1': { 'padding': '0.25rem' },
    '.p-2': { 'padding': '0.5rem' },
    '.p-3': { 'padding': '1rem' },
    '.p-4': { 'padding': '1.5rem' },
    '.p-5': { 'padding': '3rem' },
    
    // Text alignment
    '.text-left': { 'text-align': 'left' },
    '.text-right': { 'text-align': 'right' },
    '.text-center': { 'text-align': 'center' },
    
    // Display
    '.d-none': { 'display': 'none' },
    '.d-block': { 'display': 'block' },
    '.d-inline': { 'display': 'inline' },
    '.d-inline-block': { 'display': 'inline-block' },
    '.d-flex': { 'display': 'flex' },
    
    // Flexbox
    '.justify-content-start': { 'justify-content': 'flex-start' },
    '.justify-content-end': { 'justify-content': 'flex-end' },
    '.justify-content-center': { 'justify-content': 'center' },
    '.justify-content-between': { 'justify-content': 'space-between' },
    '.justify-content-around': { 'justify-content': 'space-around' },
    
    '.align-items-start': { 'align-items': 'flex-start' },
    '.align-items-end': { 'align-items': 'flex-end' },
    '.align-items-center': { 'align-items': 'center' },
    
    // Colors
    '.text-primary': { 'color': '#0d6efd' },
    '.text-secondary': { 'color': '#6c757d' },
    '.text-success': { 'color': '#198754' },
    '.text-danger': { 'color': '#dc3545' },
    '.text-warning': { 'color': '#ffc107' },
    '.text-info': { 'color': '#0dcaf0' },
    '.text-light': { 'color': '#f8f9fa' },
    '.text-dark': { 'color': '#212529' },
    '.text-muted': { 'color': '#6c757d' },
    
    '.bg-primary': { 'background-color': '#0d6efd' },
    '.bg-secondary': { 'background-color': '#6c757d' },
    '.bg-success': { 'background-color': '#198754' },
    '.bg-danger': { 'background-color': '#dc3545' },
    '.bg-warning': { 'background-color': '#ffc107' },
    '.bg-info': { 'background-color': '#0dcaf0' },
    '.bg-light': { 'background-color': '#f8f9fa' },
    '.bg-dark': { 'background-color': '#212529' }
  },

  // Responsive utilities
  responsive: {
    '@media (min-width: 576px)': {
      '.col-sm-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.col-sm-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.col-sm-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.col-sm-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.col-sm-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.col-sm-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.col-sm-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.col-sm-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.col-sm-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.col-sm-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.col-sm-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.col-sm-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 768px)': {
      '.col-md-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.col-md-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.col-md-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.col-md-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.col-md-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.col-md-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.col-md-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.col-md-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.col-md-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.col-md-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.col-md-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.col-md-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 992px)': {
      '.col-lg-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.col-lg-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.col-lg-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.col-lg-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.col-lg-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.col-lg-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.col-lg-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.col-lg-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.col-lg-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.col-lg-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.col-lg-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.col-lg-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    }
  }
};

/**
 * Get all default styles as a single object
 */
export function getAllStyles() {
  return Object.assign({},
    defaultStyles.reset,
    defaultStyles.typography,
    defaultStyles.grid,
    defaultStyles.buttons,
    defaultStyles.cards,
    defaultStyles.forms,
    defaultStyles.navigation,
    defaultStyles.tables,
    defaultStyles.utilities,
    defaultStyles.responsive
  );
}

/**
 * Get default theme configuration
 */
export const theme = {
  colors: {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    light: '#f8f9fa',
    dark: '#212529',
    white: '#fff',
    black: '#000'
  },
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '1rem',
    4: '1.5rem',
    5: '3rem'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    }
  }
};