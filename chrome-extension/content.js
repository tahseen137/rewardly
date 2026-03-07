/**
 * Rewardly Chrome Extension — Content Script
 * Runs on every page. Lightweight — only sends URL to background.
 */

// Content script intentionally minimal.
// All merchant detection logic lives in background.js and popup.js.
// This file exists as a placeholder for future page-level features
// (e.g., inline cashback badges on product pages).

(function () {
  // Detect if we're on a product page (future feature)
  // const isProductPage = document.querySelector('[itemtype*="Product"]') !== null;
  // if (isProductPage) { ... inject inline badge ... }
})();
