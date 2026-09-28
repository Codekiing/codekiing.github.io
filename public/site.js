const root = document.documentElement;
// Keep anchor destinations clear of both navigation rows, including text zoom.
const header = document.querySelector('.site-header');
const trail = document.querySelector('.page-trail');
function updateNavigationHeight() {
  root.style.setProperty('--header-height', `${header?.offsetHeight || 0}px`);
  root.style.setProperty('--trail-height', `${trail?.offsetHeight || 0}px`);
}
updateNavigationHeight();
if ('ResizeObserver' in window) {
  const resize = new ResizeObserver(updateNavigationHeight);
  if (header) resize.observe(header);
  if (trail) resize.observe(trail);
}
const themeButton = document.querySelector('.theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let explicitTheme = false;
try { explicitTheme = ['light', 'dark'].includes(localStorage.getItem('ck-theme')); } catch {}
function syncThemeControl() {
  const dark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
if (themeButton) {
  themeButton.hidden = false;
  syncThemeControl();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    explicitTheme = true;
    try { localStorage.setItem('ck-theme', root.dataset.theme); } catch {}
    syncThemeControl();
  });
  systemTheme.addEventListener('change', event => {
    if (!explicitTheme) {
      root.dataset.theme = event.matches ? 'dark' : 'light';
      syncThemeControl();
    }
  });
}
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    // Content already visible stays visible, including anchor destinations.
    if (element.getBoundingClientRect().top >= innerHeight) element.classList.add('reveal-pending');
    observer.observe(element);
  });
  motion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
    }
  });
}
