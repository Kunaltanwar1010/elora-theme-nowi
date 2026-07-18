(function() {
  var hash = (window.location.hash || '').replace('#', '').toLowerCase();
  var stored = null;
  try { stored = localStorage.getItem('nowi-homepage-category'); } catch(e) {}
  var category = (hash === 'women' || hash === 'men') ? hash :
                 (stored === 'women' || stored === 'men') ? stored : 'men';
  document.documentElement.setAttribute('data-active-category', category);
})();
