/**
 * Page Loader - Shows loader overlay during page navigation
 * Prevents flash of old content by instantly showing loader on link clicks
 */

(function() {
  function showLoader() {
    // Guard against early calls before body exists
    if (!document.body) return;

    const loader = document.getElementById('page-loader');
    if (loader) {
      // If loader exists but was hidden, un-hide it for navigation
      loader.classList.remove('loaded');
      return;
    }

    // Fallback: create a minimal loader (no logo) if the static markup isn't present
    const fallback = document.createElement('div');
    fallback.id = 'page-loader';
    fallback.className = 'page-loader';
    fallback.innerHTML = '<div class="page-loader__content"><div class="page-loader__dots"><span class="page-loader__dot"></span><span class="page-loader__dot"></span><span class="page-loader__dot"></span></div></div>';
    document.body.insertAdjacentElement('afterbegin', fallback);
  }

  function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader && !loader.classList.contains('loaded')) {
      // Keep the element in the DOM so it can be re-used on subsequent navigation
      loader.classList.add('loaded');
    }
  }

  // Hide loader when page is ready - multiple fallbacks to ensure it always hides
  function initHideLoader() {
    // Immediate check
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      hideLoader();
    }

    // DOMContentLoaded fallback
    document.addEventListener('DOMContentLoaded', hideLoader);

    // Window load fallback (fires after all resources loaded)
    window.addEventListener('load', hideLoader);

    // Timeout fallback - hide after 500ms max
    setTimeout(hideLoader, 500);
  }

  initHideLoader();

  // Show loader on internal link navigation
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href]');
    const button = e.target.closest('button');

    // Skip if it's a button (not a link) - buttons are for AJAX operations
    if (button && !link) return;

    // Must be a link to continue
    if (!link) return;

    const href = link.getAttribute('href');

    // Skip if:
    // - Has target="_blank"
    // - Is anchor link (#)
    // - Is javascript: link
    // - Is external link
    // - Has download attribute
    // - Is inside predictive search or modal
    // - Has data-no-loader attribute
    if (
      link.target === '_blank' ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.hasAttribute('download') ||
      link.hasAttribute('data-no-loader') ||
      // Skip header cart icon(s) which open the cart drawer (they preventDefault and no navigation occurs)
      link.id === 'cart-icon-bubble' ||
      link.classList.contains('header__icon--cart') ||
      href === window.routes?.cart_url ||
      link.closest('.predictive-search, .modal:not(product-modal):not(modal-dialog), details[open]')
    ) {
      return;
    }

    // Check if external link
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      // Skip same-page hash navigation
      if (url.pathname === window.location.pathname && url.hash) return;
    } catch (err) {
      return;
    }

    showLoader();
  });

  // Show loader on form submissions that navigate
  document.addEventListener('submit', function(e) {
    const form = e.target;

    // Skip AJAX forms and add-to-cart forms
    if (
      form.hasAttribute('data-ajax') ||
      form.hasAttribute('data-no-loader') ||
      form.getAttribute('data-type') === 'add-to-cart-form' ||
      form.closest('.predictive-search')
    ) {
      return;
    }

    showLoader();
  });

  // Hide loader if user navigates back (bfcache)
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      hideLoader();
    }
  });

  // Expose globally for manual control
  window.PageLoader = { show: showLoader, hide: hideLoader };
})();
