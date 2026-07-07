(function () {
  try {
    var theme = localStorage.getItem('theme');
    if (!theme) theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#121212' : '#F9F6F0';
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
