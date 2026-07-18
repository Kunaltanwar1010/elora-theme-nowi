(function() {
  var hasUtm = /[?&]utm_/.test(window.location.search);
  if (hasUtm) {
    document.documentElement.classList.add('has-utm');
    try { sessionStorage.setItem('nowi-has-utm', '1'); } catch(e) {}
  } else {
    try {
      if (sessionStorage.getItem('nowi-has-utm') === '1') {
        document.documentElement.classList.add('has-utm');
      }
    } catch(e) {}
  }
})();
