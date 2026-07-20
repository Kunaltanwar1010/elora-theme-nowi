/**
 * Global copy-to-clipboard utility with toast feedback.
 *
 * Usage:
 *   window.copyToClipboard('COUPON10');
 *   window.copyToClipboard('COUPON10', 'Code copied!');
 */
(function () {
  var TOAST_DURATION = 1300;
  var FADE_MS = 200;
  var TOAST_ID = 'global-copy-toast';

  function showToast(message) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.textContent = message;
    toast.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
      'background:#111111;color:#fff;padding:8px 20px;border-radius:20px;' +
      'font-size:13px;font-weight:500;z-index:1000001;' +
      'opacity:0;transition:opacity ' + FADE_MS + 'ms ease;pointer-events:none;';
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = '1';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () {
        toast.remove();
      }, FADE_MS);
    }, TOAST_DURATION);
  }

  /**
   * Copy text to clipboard and show a toast.
   * @param {string} text - The text to copy.
   * @param {string} [message='Copied!'] - Toast message.
   * @returns {Promise<void>}
   */
  window.copyToClipboard = function (text, message) {
    return navigator.clipboard.writeText(text).then(function () {
      showToast(message || 'Copied!');
    });
  };
})();
