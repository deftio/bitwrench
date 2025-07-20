/**
 * Bitwrench v2 Default Styles
 * Beautiful, responsive CSS inspired by modern design systems
 * Zero dependencies, works everywhere
 */

export const defaultStyles = {
  // Custom properties (CSS variables)
  root: {
    ':root': {
      '--bw-blue': '#0d6efd',
      '--bw-indigo': '#6610f2',
      '--bw-purple': '#6f42c1',
      '--bw-pink': '#d63384',
      '--bw-red': '#dc3545',
      '--bw-orange': '#fd7e14',
      '--bw-yellow': '#ffc107',
      '--bw-green': '#198754',
      '--bw-teal': '#20c997',
      '--bw-cyan': '#0dcaf0',
      '--bw-black': '#000',
      '--bw-white': '#fff',
      '--bw-gray': '#6c757d',
      '--bw-gray-dark': '#343a40',
      '--bw-gray-100': '#f8f9fa',
      '--bw-gray-200': '#e9ecef',
      '--bw-gray-300': '#dee2e6',
      '--bw-gray-400': '#ced4da',
      '--bw-gray-500': '#adb5bd',
      '--bw-gray-600': '#6c757d',
      '--bw-gray-700': '#495057',
      '--bw-gray-800': '#343a40',
      '--bw-gray-900': '#212529',
      '--bw-primary': '#0d6efd',
      '--bw-secondary': '#6c757d',
      '--bw-success': '#198754',
      '--bw-info': '#0dcaf0',
      '--bw-warning': '#ffc107',
      '--bw-danger': '#dc3545',
      '--bw-light': '#f8f9fa',
      '--bw-dark': '#212529',
      '--bw-font-sans-serif': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      '--bw-font-monospace': 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      '--bw-body-font-family': 'var(--bw-font-sans-serif)',
      '--bw-body-font-size': '1rem',
      '--bw-body-font-weight': '400',
      '--bw-body-line-height': '1.5',
      '--bw-body-color': '#212529',
      '--bw-body-bg': '#fff',
      '--bw-border-width': '1px',
      '--bw-border-style': 'solid',
      '--bw-border-color': '#dee2e6',
      '--bw-border-radius': '.375rem',
      '--bw-border-radius-sm': '.25rem',
      '--bw-border-radius-lg': '.5rem',
      '--bw-border-radius-xl': '1rem',
      '--bw-border-radius-2xl': '2rem',
      '--bw-border-radius-pill': '50rem',
      '--bw-box-shadow': '0 .5rem 1rem rgba(0, 0, 0, .15)',
      '--bw-box-shadow-sm': '0 .125rem .25rem rgba(0, 0, 0, .075)',
      '--bw-box-shadow-lg': '0 1rem 3rem rgba(0, 0, 0, .175)',
      '--bw-box-shadow-inset': 'inset 0 1px 2px rgba(0, 0, 0, .075)'
    }
  },
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
      'font-size': '1rem',
      'font-weight': '400',
      'line-height': '1.5',
      'color': '#212529',
      'background-color': '#f8f9fa',
      'margin': '0',
      'padding': '0'
    },
    // Standard page layout
    '.bw-page': {
      'min-height': '100vh',
      'display': 'flex',
      'flex-direction': 'column'
    },
    '.bw-page-content': {
      'flex': '1',
      'padding': '2rem 0'
    },
    'main': {
      'display': 'block'
    },
    'hr': {
      'box-sizing': 'content-box',
      'height': '0',
      'overflow': 'visible',
      'margin': '1rem 0',
      'color': 'inherit',
      'background-color': 'currentColor',
      'border': '0',
      'opacity': '.25'
    },
    'hr:not([size])': {
      'height': '1px'
    }
  },

  // Typography
  typography: {
    'h1, h2, h3, h4, h5, h6': {
      'margin-top': '0',
      'margin-bottom': '.5rem',
      'font-weight': '500',
      'line-height': '1.2'
    },
    'h1': { 
      'font-size': 'calc(1.375rem + 1.5vw)'
    },
    '@media (min-width: 1200px)': {
      'h1': { 'font-size': '2.5rem' }
    },
    'h2': { 
      'font-size': 'calc(1.325rem + .9vw)'
    },
    '@media (min-width: 1200px)': {
      'h2': { 'font-size': '2rem' }
    },
    'h3': { 
      'font-size': 'calc(1.3rem + .6vw)'
    },
    '@media (min-width: 1200px)': {
      'h3': { 'font-size': '1.75rem' }
    },
    'h4': { 
      'font-size': 'calc(1.275rem + .3vw)'
    },
    '@media (min-width: 1200px)': {
      'h4': { 'font-size': '1.5rem' }
    },
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
      'padding-right': '0.75rem',
      'padding-left': '0.75rem',
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
      'margin-right': 'calc(var(--bw-gutter-x, 0.75rem) * -0.5)',
      'margin-left': 'calc(var(--bw-gutter-x, 0.75rem) * -0.5)'
    },
    
    // Column system
    '.col, [class*="col-"]': {
      'position': 'relative',
      'width': '100%',
      'padding-right': 'calc(var(--bw-gutter-x, 0.75rem) * 0.5)',
      'padding-left': 'calc(var(--bw-gutter-x, 0.75rem) * 0.5)'
    },
    '.col': {
      'flex': '1 0 0%'
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
      'color': '#212529',
      'text-align': 'center',
      'text-decoration': 'none',
      'vertical-align': 'middle',
      'cursor': 'pointer',
      'user-select': 'none',
      'background-color': 'transparent',
      'border': '1px solid transparent',
      'padding': '.5rem 1rem',
      'font-size': '1rem',
      'border-radius': '.375rem',
      'transition': 'all .15s ease-in-out',
      'box-shadow': '0 1px 2px rgba(0,0,0,.05)'
    },
    '.btn:hover': {
      'text-decoration': 'none',
      'transform': 'translateY(-1px)',
      'box-shadow': '0 3px 5px rgba(0,0,0,.1)'
    },
    '.btn:active': {
      'transform': 'translateY(0)',
      'box-shadow': '0 1px 2px rgba(0,0,0,.05)'
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
      'height': '100%',
      'word-wrap': 'break-word',
      'background-color': '#fff',
      'background-clip': 'border-box',
      'border': '1px solid rgba(0,0,0,.125)',
      'border-radius': '.5rem',
      'box-shadow': '0 0.125rem 0.25rem rgba(0,0,0,.075)',
      'transition': 'box-shadow .15s ease-in-out, transform .15s ease-in-out',
      'margin-bottom': '1.5rem'
    },
    '.card:hover': {
      'box-shadow': '0 0.5rem 1rem rgba(0,0,0,.15)',
      'transform': 'translateY(-2px)'
    },
    '.card-body': {
      'flex': '1 1 auto',
      'padding': '1.5rem'
    },
    '.card-body > *:last-child': {
      'margin-bottom': '0'
    },
    '.card-title': {
      'margin-bottom': '0.75rem',
      'font-size': '1.25rem',
      'font-weight': '500',
      'line-height': '1.2'
    },
    '.card-subtitle': {
      'margin-top': '-0.375rem',
      'margin-bottom': '0.5rem',
      'color': '#6c757d'
    },
    '.card-text': {
      'margin-bottom': '0'
    },
    '.card-header': {
      'padding': '0.75rem 1.25rem',
      'margin-bottom': '0',
      'background-color': 'rgba(0,0,0,.03)',
      'border-bottom': '1px solid rgba(0,0,0,.125)',
      'font-weight': '600'
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
      'padding-top': '.5rem',
      'padding-bottom': '.5rem',
      'background-color': '#f8f9fa'
    },
    '.navbar > .container': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'space-between'
    },
    '.navbar-dark': {
      'background-color': '#212529'
    },
    '.navbar-dark .navbar-brand': {
      'color': '#fff'
    },
    '.navbar-dark .nav-link': {
      'color': 'rgba(255,255,255,.55)'
    },
    '.navbar-dark .nav-link:hover': {
      'color': 'rgba(255,255,255,.75)'
    },
    '.navbar-dark .nav-link.active': {
      'color': '#fff'
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
    },
    
    '.table-bordered': {
      'border': '1px solid #dee2e6'
    },
    '.table-bordered > :not(caption) > * > *': {
      'border-width': '1px 0'
    },
    '.table-bordered > :not(caption) > * > *': {
      'border-width': '0 1px'
    }
  },
  
  // Alerts
  alerts: {
    '.alert': {
      'position': 'relative',
      'padding': '1rem 1rem',
      'margin-bottom': '1rem',
      'border': '1px solid transparent',
      'border-radius': '.375rem'
    },
    '.alert-heading': {
      'color': 'inherit'
    },
    '.alert-link': {
      'font-weight': '700'
    },
    '.alert-dismissible': {
      'padding-right': '3rem'
    },
    '.alert-dismissible .btn-close': {
      'position': 'absolute',
      'top': '0',
      'right': '0',
      'z-index': '2',
      'padding': '1.25rem 1rem'
    },
    '.alert-primary': {
      'color': '#084298',
      'background-color': '#cfe2ff',
      'border-color': '#b6d4fe'
    },
    '.alert-primary .alert-link': {
      'color': '#06357a'
    },
    '.alert-secondary': {
      'color': '#41464b',
      'background-color': '#e2e3e5',
      'border-color': '#d3d6d8'
    },
    '.alert-secondary .alert-link': {
      'color': '#34383c'
    },
    '.alert-success': {
      'color': '#0f5132',
      'background-color': '#d1e7dd',
      'border-color': '#badbcc'
    },
    '.alert-success .alert-link': {
      'color': '#0c4128'
    },
    '.alert-info': {
      'color': '#055160',
      'background-color': '#cff4fc',
      'border-color': '#b6effb'
    },
    '.alert-info .alert-link': {
      'color': '#04414d'
    },
    '.alert-warning': {
      'color': '#664d03',
      'background-color': '#fff3cd',
      'border-color': '#ffecb5'
    },
    '.alert-warning .alert-link': {
      'color': '#523e02'
    },
    '.alert-danger': {
      'color': '#842029',
      'background-color': '#f8d7da',
      'border-color': '#f5c2c7'
    },
    '.alert-danger .alert-link': {
      'color': '#6a1a21'
    },
    '.alert-light': {
      'color': '#636464',
      'background-color': '#fefefe',
      'border-color': '#fdfdfe'
    },
    '.alert-light .alert-link': {
      'color': '#4f5050'
    },
    '.alert-dark': {
      'color': '#141619',
      'background-color': '#d3d3d4',
      'border-color': '#bcbebf'
    },
    '.alert-dark .alert-link': {
      'color': '#101214'
    }
  },
  
  // Badges
  badges: {
    '.badge': {
      'display': 'inline-block',
      'padding': '.35em .65em',
      'font-size': '.75em',
      'font-weight': '700',
      'line-height': '1',
      'color': '#fff',
      'text-align': 'center',
      'white-space': 'nowrap',
      'vertical-align': 'baseline',
      'border-radius': '.375rem'
    },
    '.badge:empty': {
      'display': 'none'
    },
    '.btn .badge': {
      'position': 'relative',
      'top': '-1px'
    },
    '.badge-primary': {
      'color': '#fff',
      'background-color': '#0d6efd'
    },
    '.badge-secondary': {
      'color': '#fff',
      'background-color': '#6c757d'
    },
    '.badge-success': {
      'color': '#fff',
      'background-color': '#198754'
    },
    '.badge-info': {
      'color': '#000',
      'background-color': '#0dcaf0'
    },
    '.badge-warning': {
      'color': '#000',
      'background-color': '#ffc107'
    },
    '.badge-danger': {
      'color': '#fff',
      'background-color': '#dc3545'
    },
    '.badge-light': {
      'color': '#000',
      'background-color': '#f8f9fa'
    },
    '.badge-dark': {
      'color': '#fff',
      'background-color': '#212529'
    }
  },
  
  // Progress bars
  progress: {
    '.progress': {
      'display': 'flex',
      'height': '1.25rem',
      'overflow': 'hidden',
      'font-size': '.875rem',
      'background-color': '#e9ecef',
      'border-radius': '.5rem',
      'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
    },
    '.progress-bar': {
      'display': 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'overflow': 'hidden',
      'color': '#fff',
      'text-align': 'center',
      'white-space': 'nowrap',
      'background-color': '#0d6efd',
      'transition': 'width .6s ease',
      'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)',
      'font-weight': '600'
    },
    '.progress-bar-striped': {
      'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
      'background-size': '1rem 1rem'
    },
    '.progress-bar-animated': {
      'animation': 'progress-bar-stripes 1s linear infinite'
    },
    '@keyframes progress-bar-stripes': {
      '0%': { 'background-position-x': '1rem' }
    }
  },

  // Utilities
  utilities: {
    // Spacing
    '.m-0': { 'margin': '0 !important' },
    '.m-1': { 'margin': '.25rem !important' },
    '.m-2': { 'margin': '.5rem !important' },
    '.m-3': { 'margin': '1rem !important' },
    '.m-4': { 'margin': '1.5rem !important' },
    '.m-5': { 'margin': '3rem !important' },
    '.m-auto': { 'margin': 'auto !important' },
    
    '.mt-0': { 'margin-top': '0 !important' },
    '.mt-1': { 'margin-top': '.25rem !important' },
    '.mt-2': { 'margin-top': '.5rem !important' },
    '.mt-3': { 'margin-top': '1rem !important' },
    '.mt-4': { 'margin-top': '1.5rem !important' },
    '.mt-5': { 'margin-top': '3rem !important' },
    
    '.mb-0': { 'margin-bottom': '0 !important' },
    '.mb-1': { 'margin-bottom': '.25rem !important' },
    '.mb-2': { 'margin-bottom': '.5rem !important' },
    '.mb-3': { 'margin-bottom': '1rem !important' },
    '.mb-4': { 'margin-bottom': '1.5rem !important' },
    '.mb-5': { 'margin-bottom': '3rem !important' },
    
    '.ms-0': { 'margin-left': '0 !important' },
    '.ms-1': { 'margin-left': '.25rem !important' },
    '.ms-2': { 'margin-left': '.5rem !important' },
    '.ms-3': { 'margin-left': '1rem !important' },
    '.ms-4': { 'margin-left': '1.5rem !important' },
    '.ms-5': { 'margin-left': '3rem !important' },
    
    '.me-0': { 'margin-right': '0 !important' },
    '.me-1': { 'margin-right': '.25rem !important' },
    '.me-2': { 'margin-right': '.5rem !important' },
    '.me-3': { 'margin-right': '1rem !important' },
    '.me-4': { 'margin-right': '1.5rem !important' },
    '.me-5': { 'margin-right': '3rem !important' },
    
    '.p-0': { 'padding': '0 !important' },
    '.p-1': { 'padding': '.25rem !important' },
    '.p-2': { 'padding': '.5rem !important' },
    '.p-3': { 'padding': '1rem !important' },
    '.p-4': { 'padding': '1.5rem !important' },
    '.p-5': { 'padding': '3rem !important' },
    
    '.pt-0': { 'padding-top': '0 !important' },
    '.pt-1': { 'padding-top': '.25rem !important' },
    '.pt-2': { 'padding-top': '.5rem !important' },
    '.pt-3': { 'padding-top': '1rem !important' },
    '.pt-4': { 'padding-top': '1.5rem !important' },
    '.pt-5': { 'padding-top': '3rem !important' },
    
    '.pb-0': { 'padding-bottom': '0 !important' },
    '.pb-1': { 'padding-bottom': '.25rem !important' },
    '.pb-2': { 'padding-bottom': '.5rem !important' },
    '.pb-3': { 'padding-bottom': '1rem !important' },
    '.pb-4': { 'padding-bottom': '1.5rem !important' },
    '.pb-5': { 'padding-bottom': '3rem !important' },
    
    '.ps-0': { 'padding-left': '0 !important' },
    '.ps-1': { 'padding-left': '.25rem !important' },
    '.ps-2': { 'padding-left': '.5rem !important' },
    '.ps-3': { 'padding-left': '1rem !important' },
    '.ps-4': { 'padding-left': '1.5rem !important' },
    '.ps-5': { 'padding-left': '3rem !important' },
    
    '.pe-0': { 'padding-right': '0 !important' },
    '.pe-1': { 'padding-right': '.25rem !important' },
    '.pe-2': { 'padding-right': '.5rem !important' },
    '.pe-3': { 'padding-right': '1rem !important' },
    '.pe-4': { 'padding-right': '1.5rem !important' },
    '.pe-5': { 'padding-right': '3rem !important' },
    
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
    '.bg-dark': { 'background-color': '#212529' },
    
    // Borders
    '.border': { 'border': '1px solid #dee2e6 !important' },
    '.border-0': { 'border': '0 !important' },
    '.border-top-0': { 'border-top': '0 !important' },
    '.border-end-0': { 'border-right': '0 !important' },
    '.border-bottom-0': { 'border-bottom': '0 !important' },
    '.border-start-0': { 'border-left': '0 !important' },
    
    '.rounded': { 'border-radius': '.375rem !important' },
    '.rounded-0': { 'border-radius': '0 !important' },
    '.rounded-1': { 'border-radius': '.25rem !important' },
    '.rounded-2': { 'border-radius': '.375rem !important' },
    '.rounded-3': { 'border-radius': '.5rem !important' },
    '.rounded-circle': { 'border-radius': '50% !important' },
    '.rounded-pill': { 'border-radius': '50rem !important' },
    
    // Shadows
    '.shadow': { 'box-shadow': '0 .5rem 1rem rgba(0,0,0,.15) !important' },
    '.shadow-sm': { 'box-shadow': '0 .125rem .25rem rgba(0,0,0,.075) !important' },
    '.shadow-lg': { 'box-shadow': '0 1rem 3rem rgba(0,0,0,.175) !important' },
    '.shadow-none': { 'box-shadow': 'none !important' },
    
    // Width/Height
    '.w-25': { 'width': '25% !important' },
    '.w-50': { 'width': '50% !important' },
    '.w-75': { 'width': '75% !important' },
    '.w-100': { 'width': '100% !important' },
    '.w-auto': { 'width': 'auto !important' },
    
    '.h-25': { 'height': '25% !important' },
    '.h-50': { 'height': '50% !important' },
    '.h-75': { 'height': '75% !important' },
    '.h-100': { 'height': '100% !important' },
    '.h-auto': { 'height': 'auto !important' },
    
    '.mw-100': { 'max-width': '100% !important' },
    '.mh-100': { 'max-height': '100% !important' },
    
    // Positioning
    '.position-static': { 'position': 'static !important' },
    '.position-relative': { 'position': 'relative !important' },
    '.position-absolute': { 'position': 'absolute !important' },
    '.position-fixed': { 'position': 'fixed !important' },
    '.position-sticky': { 'position': 'sticky !important' },
    
    '.top-0': { 'top': '0 !important' },
    '.top-50': { 'top': '50% !important' },
    '.top-100': { 'top': '100% !important' },
    '.bottom-0': { 'bottom': '0 !important' },
    '.bottom-50': { 'bottom': '50% !important' },
    '.bottom-100': { 'bottom': '100% !important' },
    '.start-0': { 'left': '0 !important' },
    '.start-50': { 'left': '50% !important' },
    '.start-100': { 'left': '100% !important' },
    '.end-0': { 'right': '0 !important' },
    '.end-50': { 'right': '50% !important' },
    '.end-100': { 'right': '100% !important' },
    
    '.translate-middle': { 'transform': 'translate(-50%, -50%) !important' },
    
    // Overflow
    '.overflow-auto': { 'overflow': 'auto !important' },
    '.overflow-hidden': { 'overflow': 'hidden !important' },
    '.overflow-visible': { 'overflow': 'visible !important' },
    '.overflow-scroll': { 'overflow': 'scroll !important' },
    
    // Typography utilities
    '.fs-1': { 'font-size': 'calc(1.375rem + 1.5vw) !important' },
    '.fs-2': { 'font-size': 'calc(1.325rem + .9vw) !important' },
    '.fs-3': { 'font-size': 'calc(1.3rem + .6vw) !important' },
    '.fs-4': { 'font-size': 'calc(1.275rem + .3vw) !important' },
    '.fs-5': { 'font-size': '1.25rem !important' },
    '.fs-6': { 'font-size': '1rem !important' },
    
    '.fw-light': { 'font-weight': '300 !important' },
    '.fw-lighter': { 'font-weight': 'lighter !important' },
    '.fw-normal': { 'font-weight': '400 !important' },
    '.fw-bold': { 'font-weight': '700 !important' },
    '.fw-bolder': { 'font-weight': 'bolder !important' },
    
    '.fst-italic': { 'font-style': 'italic !important' },
    '.fst-normal': { 'font-style': 'normal !important' },
    
    '.text-decoration-none': { 'text-decoration': 'none !important' },
    '.text-decoration-underline': { 'text-decoration': 'underline !important' },
    '.text-decoration-line-through': { 'text-decoration': 'line-through !important' },
    
    '.text-lowercase': { 'text-transform': 'lowercase !important' },
    '.text-uppercase': { 'text-transform': 'uppercase !important' },
    '.text-capitalize': { 'text-transform': 'capitalize !important' },
    
    '.text-wrap': { 'white-space': 'normal !important' },
    '.text-nowrap': { 'white-space': 'nowrap !important' },
    
    // List utilities
    '.list-unstyled': {
      'padding-left': '0',
      'list-style': 'none'
    },
    
    '.list-inline': {
      'padding-left': '0',
      'list-style': 'none'
    },
    
    '.list-inline-item': {
      'display': 'inline-block'
    },
    
    '.list-inline-item:not(:last-child)': {
      'margin-right': '.5rem'
    },
    
    // Visibility
    '.visible': { 'visibility': 'visible !important' },
    '.invisible': { 'visibility': 'hidden !important' },
    
    // User select
    '.user-select-all': { 'user-select': 'all !important' },
    '.user-select-auto': { 'user-select': 'auto !important' },
    '.user-select-none': { 'user-select': 'none !important' },
    
    // Pointer events
    '.pe-none': { 'pointer-events': 'none !important' },
    '.pe-auto': { 'pointer-events': 'auto !important' },
    
    // Opacity
    '.opacity-0': { 'opacity': '0 !important' },
    '.opacity-25': { 'opacity': '.25 !important' },
    '.opacity-50': { 'opacity': '.5 !important' },
    '.opacity-75': { 'opacity': '.75 !important' },
    '.opacity-100': { 'opacity': '1 !important' }
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
    defaultStyles.root,
    defaultStyles.reset,
    defaultStyles.typography,
    defaultStyles.grid,
    defaultStyles.buttons,
    defaultStyles.cards,
    defaultStyles.forms,
    defaultStyles.navigation,
    defaultStyles.tables,
    defaultStyles.alerts,
    defaultStyles.badges,
    defaultStyles.progress,
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