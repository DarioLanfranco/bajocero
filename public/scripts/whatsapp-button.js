(function () {
  var btn = document.querySelector('.whatsapp-btn');
  if (!btn) return;

  var VISIBLE_CLASS = 'whatsapp-btn--visible';
  var SCROLL_THRESHOLD = 300;
  var animating = false;

  function handleScroll() {
    var shouldShow = window.scrollY > SCROLL_THRESHOLD;
    var isVisible = btn.classList.contains(VISIBLE_CLASS);
    if (shouldShow === isVisible || animating) return;

    animating = true;
    btn.style.willChange = 'transform, opacity';
    btn.classList.toggle(VISIBLE_CLASS, shouldShow);

    var onEnd = function () {
      btn.style.willChange = '';
      animating = false;
      btn.removeEventListener('transitionend', onEnd);
    };
    btn.addEventListener('transitionend', onEnd, { once: true });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
})();
