/**
 * Blog post catalog — single source for index + nav.
 * Add new posts here; do not register them in pages/shared-nav.js.
 */
(function() {
  'use strict';

  window.BLOG_POSTS = [
    {
      id: 'esp32-self-hosted-ui',
      href: 'esp32-self-hosted-ui.html',
      title: 'Self-hosted live UI on ESP32',
      dek: 'The device serves JSON; the browser renders the dashboard. No cloud, no HTML from the chip.',
      audience: 'embedded',
      date: '2026-07',
      status: 'draft' // draft | published
    }
  ];
})();
