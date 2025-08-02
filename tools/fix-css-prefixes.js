#!/usr/bin/env node

// Script to fix CSS class prefixes in bitwrench-styles.js
// Adds bw- prefix to classes that don't have it

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stylesFile = path.join(__dirname, '../src/bitwrench-styles.js');

// Read the file
let content = fs.readFileSync(stylesFile, 'utf8');

// Classes that need bw- prefix
const classesToFix = [
  // Grid
  'container', 'container-fluid', 'row', 'col',
  'col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6',
  'col-7', 'col-8', 'col-9', 'col-10', 'col-11', 'col-12',
  'col-sm-1', 'col-sm-2', 'col-sm-3', 'col-sm-4', 'col-sm-5', 'col-sm-6',
  'col-sm-7', 'col-sm-8', 'col-sm-9', 'col-sm-10', 'col-sm-11', 'col-sm-12',
  'col-md-1', 'col-md-2', 'col-md-3', 'col-md-4', 'col-md-5', 'col-md-6',
  'col-md-7', 'col-md-8', 'col-md-9', 'col-md-10', 'col-md-11', 'col-md-12',
  'col-lg-1', 'col-lg-2', 'col-lg-3', 'col-lg-4', 'col-lg-5', 'col-lg-6',
  'col-lg-7', 'col-lg-8', 'col-lg-9', 'col-lg-10', 'col-lg-11', 'col-lg-12',
  'col-xl-1', 'col-xl-2', 'col-xl-3', 'col-xl-4', 'col-xl-5', 'col-xl-6',
  'col-xl-7', 'col-xl-8', 'col-xl-9', 'col-xl-10', 'col-xl-11', 'col-xl-12',
  // Cards
  'card', 'card-body', 'card-header', 'card-footer', 'card-title', 'card-text',
  'card-primary', 'card-secondary', 'card-success', 'card-danger', 'card-warning',
  'card-info', 'card-light', 'card-dark',
  // Alerts
  'alert', 'alert-primary', 'alert-secondary', 'alert-success', 'alert-danger',
  'alert-warning', 'alert-info', 'alert-light', 'alert-dark', 'alert-dismissible',
  // Badges
  'badge', 'badge-primary', 'badge-secondary', 'badge-success', 'badge-danger',
  'badge-warning', 'badge-info', 'badge-light', 'badge-dark', 'badge-pill',
  // Tables
  'table', 'table-striped', 'table-bordered', 'table-hover', 'table-sm',
  'table-responsive', 'table-dark', 'table-light',
  // Forms
  'form-control', 'form-label', 'form-text', 'form-group', 'form-check',
  'form-check-input', 'form-check-label', 'form-select', 'form-range',
  // Navigation
  'nav', 'nav-link', 'nav-item', 'nav-tabs', 'nav-pills', 'navbar',
  'navbar-brand', 'navbar-nav', 'navbar-toggler', 'navbar-collapse',
  'navbar-light', 'navbar-dark', 'navbar-expand', 'navbar-expand-sm',
  'navbar-expand-md', 'navbar-expand-lg',
  // List groups
  'list-group', 'list-group-item', 'list-group-item-action',
  'list-group-item-primary', 'list-group-item-secondary',
  'list-group-item-success', 'list-group-item-danger',
  'list-group-item-warning', 'list-group-item-info',
  'list-group-item-light', 'list-group-item-dark',
  // Progress
  'progress', 'progress-bar', 'progress-bar-striped', 'progress-bar-animated',
  // Utilities
  'd-none', 'd-inline', 'd-inline-block', 'd-block', 'd-table', 'd-flex',
  'd-inline-flex', 'text-center', 'text-left', 'text-right', 'text-justify',
  'text-primary', 'text-secondary', 'text-success', 'text-danger',
  'text-warning', 'text-info', 'text-light', 'text-dark', 'text-muted',
  'bg-primary', 'bg-secondary', 'bg-success', 'bg-danger', 'bg-warning',
  'bg-info', 'bg-light', 'bg-dark', 'bg-white', 'bg-transparent',
  'shadow', 'shadow-sm', 'shadow-lg', 'rounded', 'rounded-0', 'rounded-circle',
  'border', 'border-0', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5',
  'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5',
  'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5',
  'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5',
  'ms-0', 'ms-1', 'ms-2', 'ms-3', 'ms-4', 'ms-5',
  'me-0', 'me-1', 'me-2', 'me-3', 'me-4', 'me-5',
  'g-0', 'g-1', 'g-2', 'g-3', 'g-4', 'g-5'
];

// Fix each class
classesToFix.forEach(className => {
  // Match the class in CSS selectors
  const regex = new RegExp(`'\\.${className}([:\\s'"])`, 'g');
  content = content.replace(regex, `'.bw-${className}$1`);
});

// Write back
fs.writeFileSync(stylesFile, content, 'utf8');

console.log('Fixed CSS class prefixes in bitwrench-styles.js');