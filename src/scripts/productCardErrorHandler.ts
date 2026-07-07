document.addEventListener('error', function (e) {
  if (!(e.target instanceof HTMLImageElement)) return;
  var img = e.target;
  if (!img.classList.contains('product-card__image')) return;
  if (img.dataset.fallback) return;
  img.dataset.fallback = 'true';
  img.style.display = 'none';
  var wrap = img.parentElement;
  if (!wrap) return;
  var placeholder = document.createElement('div');
  placeholder.className = 'product-card__image-fallback';
  placeholder.textContent = 'Fotografía en Producción';
  wrap.appendChild(placeholder);
}, true);
