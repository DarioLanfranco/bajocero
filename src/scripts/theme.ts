const THEME_ATTR = 'data-theme';
const STORAGE_KEY = 'theme';

function getThemeMeta(): HTMLMetaElement | null {
  return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
}

function applyTheme(theme: string): void {
  document.documentElement.setAttribute(THEME_ATTR, theme);
  localStorage.setItem(STORAGE_KEY, theme);
  const meta = getThemeMeta();
  if (meta) meta.content = theme === 'dark' ? '#121212' : '#F9F6F0';
}

export function getCurrentTheme(): string {
  return document.documentElement.getAttribute(THEME_ATTR) || 'dark';
}

export function setTheme(theme: string): void {
  if (theme === getCurrentTheme()) return;
  document.documentElement.classList.add('theme-transitioning');
  applyTheme(theme);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-transitioning');
    });
  });
}

export function toggleTheme(): void {
  setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
}

export function listenSystemThemeChanges(): void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const stored = localStorage.getItem('theme');
    if (!stored) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}
