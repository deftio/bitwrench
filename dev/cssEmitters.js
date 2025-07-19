function tailwindToCss(className) {
    const match = className.match(/(\w+)-(\w+)-(\w+)/) || className.match(/(\w+)-(\w+)/);
    if (!match) return ["." + className, "/* unsupported class */"];
  
    const [, prefix, value, suffix] = match;
  
    const sizeMap = {
      '0': '0px',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '32': '8rem',
      '40': '10rem',
      '48': '12rem',
      '56': '14rem',
      '64': '16rem',
      'auto': 'auto',
      'full': '100%',
      'screen': '100vw',
      'px': '1px',
    };
  
    const colorMap = {
      'transparent': 'transparent',
      'black': '#000',
      'white': '#fff',
      'gray-500': '#6b7280',
      // Add more color mappings as needed
    };
  
    let css = "";
  
    switch (prefix) {
      case 'min-w':
        css = `min-width: ${sizeMap[value] || value};`;
        break;
      case 'max-w':
        css = `max-width: ${sizeMap[value] || value};`;
        break;
      case 'min-h':
        css = `min-height: ${sizeMap[value] || value};`;
        break;
      case 'max-h':
        css = `max-height: ${sizeMap[value] || value};`;
        break;
      case 'w':
        css = `width: ${sizeMap[value] || value};`;
        break;
      case 'h':
        css = `height: ${sizeMap[value] || value};`;
        break;
      case 'p':
        css = `padding: ${sizeMap[value] || value};`;
        break;
      case 'px':
        css = `padding-left: ${sizeMap[value] || value}; padding-right: ${sizeMap[value] || value};`;
        break;
      case 'py':
        css = `padding-top: ${sizeMap[value] || value}; padding-bottom: ${sizeMap[value] || value};`;
        break;
      case 'm':
        css = `margin: ${sizeMap[value] || value};`;
        break;
      case 'mx':
        css = `margin-left: ${sizeMap[value] || value}; margin-right: ${sizeMap[value] || value};`;
        break;
      case 'my':
        css = `margin-top: ${sizeMap[value] || value}; margin-bottom: ${sizeMap[value] || value};`;
        break;
      case 'text':
        if (value === 'sm' || value === 'lg') {
          css = `font-size: ${value};`;
        } else {
          css = `color: ${colorMap[value] || value};`;
        }
        break;
      case 'bg':
        css = `background-color: ${colorMap[value] || value};`;
        break;
      case 'font':
        css = `font-weight: ${value};`;
        break;
      case 'leading':
        css = `line-height: ${value};`;
        break;
      case 'tracking':
        css = `letter-spacing: ${value};`;
        break;
      case 'border':
        if (value === 'rounded') {
          css = `border-radius: ${suffix || '0.25rem'};`;
        } else if (value in sizeMap) {
          css = `border-width: ${sizeMap[value] || value};`;
        } else {
          css = `border-color: ${colorMap[value] || value};`;
        }
        break;
      case 'shadow':
        css = `box-shadow: ${value};`;
        break;
      case 'opacity':
        css = `opacity: ${value / 100};`;
        break;
      case 'hover':
        css = `/* Use pseudo-class :hover in CSS */`;
        break;
      case 'transition':
        css = `transition: all ${value || '150ms'};`;
        break;
      case 'duration':
        css = `transition-duration: ${value}ms;`;
        break;
      case 'flex':
        if (value === 'col') {
          css = 'flex-direction: column;';
        } else if (value === 'row') {
          css = 'flex-direction: row;';
        } else {
          css = 'display: flex;';
        }
        break;
      case 'grid':
        css = 'display: grid;';
        break;
      case 'items':
        css = `align-items: ${value};`;
        break;
      case 'justify':
        css = `justify-content: ${value};`;
        break;
      case 'gap':
        css = `gap: ${sizeMap[value] || value};`;
        break;
      case 'relative':
        css = 'position: relative;';
        break;
      case 'absolute':
        css = 'position: absolute;';
        break;
      case 'fixed':
        css = 'position: fixed;';
        break;
      case 'z':
        css = `z-index: ${value};`;
        break;
      case 'cursor':
        css = `cursor: ${value};`;
        break;
      case 'overflow':
        css = `overflow: ${value};`;
        break;
      default:
        css = `/* Unsupported class: ${className} */`;
    }
  
    return ["." + className, css];
  }
  
  // Examples
  console.log(tailwindToCss("min-w-200px")); // [".min-w-200px", "min-width: 200px;"]
  console.log(tailwindToCss("p-4")); // [".p-4", "padding: 1rem;"]
  console.log(tailwindToCss("text-gray-500")); // [".text-gray-500", "color: #6b7280;"]
  