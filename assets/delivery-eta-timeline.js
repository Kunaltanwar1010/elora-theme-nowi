/**
 * Delivery ETA Timeline
 * Reads TAT-based delivery data from data attributes and populates
 * date labels + triggers animations.
 *
 * Two states:
 *  1. Approximate — shows on page load with muted bar, hint to enter pincode
 *  2. Confirmed  — after delivery:pincode-checked event, re-animates with full opacity
 */
(function () {
  'use strict';

  // Prevent multiple script executions
  if (window.__etaTimelineLoaded) return;
  window.__etaTimelineLoaded = true;

  function formatDate(date) {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function populateDates(container, minDays, maxDays, readyDays) {
    var today = new Date();
    var readyDate = addDays(today, readyDays);
    var deliverMinDate = addDays(today, minDays);
    var deliverMaxDate = addDays(today, maxDays);

    var placedEl = container.querySelector('[data-eta-date="placed"]');
    var readyEl = container.querySelector('[data-eta-date="ready"]');
    var deliveredEl = container.querySelector('[data-eta-date="delivered"]');
    var titleEl = container.querySelector('[data-eta-title-dates]');

    if (placedEl) placedEl.textContent = formatDate(today);
    if (readyEl) readyEl.textContent = formatDate(readyDate);
    if (deliveredEl) deliveredEl.textContent = formatDate(deliverMinDate) + ' - ' + formatDate(deliverMaxDate);
    if (titleEl) titleEl.textContent = formatDate(deliverMinDate) + ' to ' + formatDate(deliverMaxDate);
  }

  function initTimeline(container) {
    // Skip if already initialized
    if (container.dataset.etaInitialized) return;
    container.dataset.etaInitialized = 'true';

    var minDays = parseInt(container.dataset.minDays, 10) || 5;
    var maxDays = parseInt(container.dataset.maxDays, 10) || 7;
    var readyDays = parseInt(container.dataset.orderReadyDays, 10) || 1;

    // Populate approximate dates on load
    populateDates(container, minDays, maxDays, readyDays);
    container.classList.add('eta-wrapper--animated');

    // Listen for pincode confirmation from delivery-info
    document.addEventListener('delivery:pincode-checked', function (e) {
      var detail = e.detail || {};
      var confirmedMin = detail.minDays || minDays;
      var confirmedMax = detail.maxDays || maxDays;

      // Update dates with confirmed values
      populateDates(container, confirmedMin, confirmedMax, readyDays);

      // Transition to confirmed state
      container.classList.add('eta-wrapper--confirmed');

      // Update hint text
      var hintEl = container.querySelector('[data-eta-hint]');
      if (hintEl) {
        hintEl.textContent = '\u2713 Delivery available for your pincode';
      }

      // Re-trigger animations by removing and re-adding the class
      container.classList.remove('eta-wrapper--animated');
      void container.offsetWidth; // force reflow
      container.classList.add('eta-wrapper--animated');
    });
  }

  function init() {
    document.querySelectorAll('.eta-wrapper').forEach(initTimeline);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
