(function () {
  if (!('serviceWorker' in navigator)) return;
  var swPath = document.currentScript && document.currentScript.getAttribute('data-sw-path');
  if (!swPath) return;

  var registerSW = function () {
    navigator.serviceWorker
      .register(swPath)
      .then(function (reg) {
        reg.onupdatefound = function () {};
      })
      .catch(function () {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(registerSW);
  } else {
    window.addEventListener('load', registerSW);
  }
})();
