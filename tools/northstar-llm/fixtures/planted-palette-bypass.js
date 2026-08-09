// Planted anti-pattern for selftest: theme-role hex instead of styles.palette
function stylePage(bw) {
  bw.injectCSS('.sidebar { background: #f5f5f5; border-right: 1px solid #ddd; }');
  bw.injectCSS('.header { color: #333; font-size: 1.25rem; }');
  // Also teach the wrong theming path:
  bw.injectCSS('.card { background: var(--bw_surface); }');
}
