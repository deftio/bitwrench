/**
 * Bitwrench v2 Component System
 * Object-oriented components with state management, getters/setters, and lifecycle
 */

/**
 * Base Component class - all components inherit from this
 */
export class Component {
  constructor(props = {}) {
    // Unique ID for this component instance
    this._id = props.id || `bw-${Math.random().toString(36).substring(2, 11)}`;
    
    // Component state
    this._props = { ...props };
    this._state = {};
    this._children = [];
    this._parent = null;
    this._domElement = null;
    this._mounted = false;
    
    // Event handlers
    this._eventHandlers = new Map();
    
    // Initialize component
    this.initialize();
  }
  
  /**
   * Initialize component - override in subclasses
   */
  initialize() {
    // Override in subclasses
  }
  
  /**
   * Get component ID
   */
  get id() {
    return this._id;
  }
  
  /**
   * Get/set component properties
   */
  get props() {
    return { ...this._props };
  }
  
  setProp(key, value) {
    const oldValue = this._props[key];
    this._props[key] = value;
    this.onPropChange(key, value, oldValue);
    if (this._mounted) {
      this.update();
    }
    return this;
  }
  
  /**
   * Get/set component state
   */
  get state() {
    return { ...this._state };
  }
  
  setState(updates) {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this.onStateChange(this._state, oldState);
    if (this._mounted) {
      this.update();
    }
    return this;
  }
  
  /**
   * Get DOM element reference
   */
  get domElement() {
    return this._domElement;
  }
  
  /**
   * Get parent component
   */
  get parent() {
    return this._parent;
  }
  
  /**
   * Get children components
   */
  get children() {
    return [...this._children];
  }
  
  /**
   * Add child component
   */
  addChild(child) {
    if (child instanceof Component) {
      child._parent = this;
      this._children.push(child);
      if (this._mounted) {
        this.update();
      }
    }
    return this;
  }
  
  /**
   * Remove child component
   */
  removeChild(child) {
    const index = this._children.indexOf(child);
    if (index > -1) {
      this._children.splice(index, 1);
      child._parent = null;
      if (this._mounted) {
        this.update();
      }
    }
    return this;
  }
  
  /**
   * Find child by ID
   */
  findChild(id) {
    for (const child of this._children) {
      if (child.id === id) return child;
      const found = child.findChild(id);
      if (found) return found;
    }
    return null;
  }
  
  /**
   * Add event listener
   */
  on(event, handler) {
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, []);
    }
    this._eventHandlers.get(event).push(handler);
    
    // If already mounted, attach to DOM
    if (this._mounted && this._domElement) {
      this._domElement.addEventListener(event, handler);
    }
    
    return this;
  }
  
  /**
   * Remove event listener
   */
  off(event, handler) {
    if (this._eventHandlers.has(event)) {
      const handlers = this._eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        if (this._mounted && this._domElement) {
          this._domElement.removeEventListener(event, handler);
        }
      }
    }
    return this;
  }
  
  /**
   * Emit event
   */
  emit(event, data) {
    if (this._eventHandlers.has(event)) {
      const handlers = this._eventHandlers.get(event);
      handlers.forEach(handler => handler.call(this, data));
    }
    
    // Bubble up to parent
    if (this._parent) {
      this._parent.emit(`child:${event}`, { child: this, data });
    }
    
    return this;
  }
  
  /**
   * Render component to TACO format
   * Override this in subclasses
   */
  render() {
    return {
      t: 'div',
      a: { id: this._id, class: this.getClassName() },
      c: this._children.map(child => child.render())
    };
  }
  
  /**
   * Get component class name
   */
  getClassName() {
    return this._props.className || this._props.class || '';
  }
  
  /**
   * Mount component to DOM
   */
  mount(target) {
    // Get target element
    const targetEl = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
      
    if (!targetEl) {
      throw new Error(`Cannot mount to target: ${target}`);
    }
    
    // Render and create DOM
    const taco = this.render();
    this._domElement = window.bw.createDOM(taco);
    
    // Mount children first
    this._mountChildren();
    
    // Attach event handlers
    this._attachEventHandlers();
    
    // Append to target
    targetEl.appendChild(this._domElement);
    
    // Mark as mounted
    this._mounted = true;
    
    // Call lifecycle method
    this.onMount();
    
    return this;
  }
  
  /**
   * Update component in DOM
   */
  update() {
    if (!this._mounted || !this._domElement) return this;
    
    // Store current DOM element and parent
    const oldElement = this._domElement;
    const parentElement = oldElement.parentNode;
    
    // Render new TACO
    const taco = this.render();
    const newElement = window.bw.createDOM(taco);
    
    // Replace in DOM
    parentElement.replaceChild(newElement, oldElement);
    this._domElement = newElement;
    
    // Remount children
    this._mountChildren();
    
    // Reattach event handlers
    this._attachEventHandlers();
    
    // Call lifecycle method
    this.onUpdate();
    
    return this;
  }
  
  /**
   * Unmount component from DOM
   */
  unmount() {
    if (!this._mounted) return this;
    
    // Call lifecycle method
    this.onBeforeUnmount();
    
    // Unmount children
    this._children.forEach(child => child.unmount());
    
    // Remove from DOM
    if (this._domElement && this._domElement.parentNode) {
      this._domElement.parentNode.removeChild(this._domElement);
    }
    
    // Clean up
    this._domElement = null;
    this._mounted = false;
    
    // Call lifecycle method
    this.onUnmount();
    
    return this;
  }
  
  /**
   * Mount children components
   * @private
   */
  _mountChildren() {
    // Children should already be rendered in the TACO
    // Just need to update their references
    this._children.forEach((child, index) => {
      const childEl = this._domElement.children[index];
      if (childEl) {
        child._domElement = childEl;
        child._mounted = true;
        child._mountChildren();
        child._attachEventHandlers();
        child.onMount();
      }
    });
  }
  
  /**
   * Attach event handlers to DOM
   * @private
   */
  _attachEventHandlers() {
    if (!this._domElement) return;
    
    this._eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this._domElement.addEventListener(event, handler);
      });
    });
  }
  
  /**
   * Lifecycle methods - override in subclasses
   */
  onPropChange(key, newValue, oldValue) {}
  onStateChange(newState, oldState) {}
  onMount() {}
  onUpdate() {}
  onBeforeUnmount() {}
  onUnmount() {}
  
  /**
   * Utility methods
   */
  show() {
    if (this._domElement) {
      this._domElement.style.display = '';
    }
    return this;
  }
  
  hide() {
    if (this._domElement) {
      this._domElement.style.display = 'none';
    }
    return this;
  }
  
  enable() {
    if (this._domElement) {
      this._domElement.disabled = false;
    }
    return this;
  }
  
  disable() {
    if (this._domElement) {
      this._domElement.disabled = true;
    }
    return this;
  }
  
  focus() {
    if (this._domElement && this._domElement.focus) {
      this._domElement.focus();
    }
    return this;
  }
  
  addClass(className) {
    if (this._domElement) {
      this._domElement.classList.add(className);
    }
    return this;
  }
  
  removeClass(className) {
    if (this._domElement) {
      this._domElement.classList.remove(className);
    }
    return this;
  }
  
  toggleClass(className) {
    if (this._domElement) {
      this._domElement.classList.toggle(className);
    }
    return this;
  }
  
  hasClass(className) {
    return this._domElement ? this._domElement.classList.contains(className) : false;
  }
  
  css(property, value) {
    if (this._domElement) {
      if (typeof property === 'object') {
        Object.assign(this._domElement.style, property);
      } else if (value !== undefined) {
        this._domElement.style[property] = value;
      } else {
        return this._domElement.style[property];
      }
    }
    return this;
  }
}

/**
 * Button Component
 */
export class Button extends Component {
  initialize() {
    // Default props
    this._props = {
      text: 'Button',
      variant: 'primary',
      size: 'normal',
      disabled: false,
      ...this._props
    };
  }
  
  render() {
    const sizeClass = this._props.size === 'lg' ? 'btn-lg' : 
                     this._props.size === 'sm' ? 'btn-sm' : '';
                     
    return {
      t: 'button',
      a: {
        id: this._id,
        class: `btn btn-${this._props.variant} ${sizeClass} ${this.getClassName()}`.trim(),
        disabled: this._props.disabled
      },
      c: this._props.text
    };
  }
  
  // Button-specific methods
  get text() {
    return this._props.text;
  }
  
  set text(value) {
    this.setProp('text', value);
  }
  
  get variant() {
    return this._props.variant;
  }
  
  set variant(value) {
    this.setProp('variant', value);
  }
  
  click() {
    if (this._domElement && !this._props.disabled) {
      this._domElement.click();
    }
    return this;
  }
}

/**
 * Input Component
 */
export class Input extends Component {
  initialize() {
    this._props = {
      type: 'text',
      value: '',
      placeholder: '',
      disabled: false,
      readonly: false,
      ...this._props
    };
    
    // Track internal value
    this._value = this._props.value;
  }
  
  render() {
    return {
      t: 'input',
      a: {
        id: this._id,
        type: this._props.type,
        class: `form-control ${this.getClassName()}`.trim(),
        value: this._value,
        placeholder: this._props.placeholder,
        disabled: this._props.disabled,
        readonly: this._props.readonly
      }
    };
  }
  
  onMount() {
    // Sync value on input
    this.on('input', (e) => {
      this._value = e.target.value;
      this.emit('change', this._value);
    });
  }
  
  // Input-specific methods
  get value() {
    return this._domElement ? this._domElement.value : this._value;
  }
  
  set value(val) {
    this._value = val;
    if (this._domElement) {
      this._domElement.value = val;
    }
  }
  
  clear() {
    this.value = '';
    return this;
  }
  
  select() {
    if (this._domElement && this._domElement.select) {
      this._domElement.select();
    }
    return this;
  }
}

/**
 * Card Component
 */
export class Card extends Component {
  initialize() {
    this._props = {
      title: '',
      text: '',
      footer: '',
      ...this._props
    };
  }
  
  render() {
    const children = [];
    
    if (this._props.title) {
      children.push({
        t: 'h5',
        a: { class: 'card-title' },
        c: this._props.title
      });
    }
    
    if (this._props.text) {
      children.push({
        t: 'p',
        a: { class: 'card-text' },
        c: this._props.text
      });
    }
    
    // Add child components
    children.push(...this._children.map(child => child.render()));
    
    const cardBody = {
      t: 'div',
      a: { class: 'card-body' },
      c: children
    };
    
    const cardChildren = [cardBody];
    
    if (this._props.footer) {
      cardChildren.push({
        t: 'div',
        a: { class: 'card-footer' },
        c: this._props.footer
      });
    }
    
    return {
      t: 'div',
      a: {
        id: this._id,
        class: `card ${this.getClassName()}`.trim()
      },
      c: cardChildren
    };
  }
  
  // Card-specific methods
  get title() {
    return this._props.title;
  }
  
  set title(value) {
    this.setProp('title', value);
  }
  
  get text() {
    return this._props.text;
  }
  
  set text(value) {
    this.setProp('text', value);
  }
}

/**
 * Container Component
 */
export class Container extends Component {
  initialize() {
    this._props = {
      fluid: false,
      ...this._props
    };
  }
  
  render() {
    const containerClass = this._props.fluid ? 'container-fluid' : 'container';
    
    return {
      t: 'div',
      a: {
        id: this._id,
        class: `${containerClass} ${this.getClassName()}`.trim()
      },
      c: this._children.map(child => child.render())
    };
  }
}

/**
 * Progress Bar Component
 */
export class ProgressBar extends Component {
  initialize() {
    this._props = {
      value: 0,
      max: 100,
      variant: 'primary',
      striped: false,
      animated: false,
      showLabel: false,
      ...this._props
    };
  }
  
  render() {
    const percentage = (this._props.value / this._props.max) * 100;
    const barClasses = [
      'progress-bar',
      `bg-${this._props.variant}`,
      this._props.striped && 'progress-bar-striped',
      this._props.animated && 'progress-bar-animated'
    ].filter(Boolean).join(' ');
    
    return {
      t: 'div',
      a: {
        id: this._id,
        class: `progress ${this.getClassName()}`.trim()
      },
      c: {
        t: 'div',
        a: {
          class: barClasses,
          role: 'progressbar',
          style: `width: ${percentage}%`,
          'aria-valuenow': this._props.value,
          'aria-valuemin': 0,
          'aria-valuemax': this._props.max
        },
        c: this._props.showLabel ? `${Math.round(percentage)}%` : ''
      }
    };
  }
  
  // Progress-specific methods
  get value() {
    return this._props.value;
  }
  
  set value(val) {
    this.setProp('value', Math.max(0, Math.min(val, this._props.max)));
  }
  
  get percentage() {
    return (this._props.value / this._props.max) * 100;
  }
  
  increment(amount = 1) {
    this.value = this._props.value + amount;
    return this;
  }
  
  decrement(amount = 1) {
    this.value = this._props.value - amount;
    return this;
  }
  
  reset() {
    this.value = 0;
    return this;
  }
  
  complete() {
    this.value = this._props.max;
    return this;
  }
}

/**
 * Export to global bw namespace
 */
if (typeof window !== 'undefined' && window.bw) {
  window.bw.Component = Component;
  window.bw.Button = Button;
  window.bw.Input = Input;
  window.bw.Card = Card;
  window.bw.Container = Container;
  window.bw.ProgressBar = ProgressBar;
}