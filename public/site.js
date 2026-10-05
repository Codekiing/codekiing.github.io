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
const cover = document.querySelector('.hero-section');
const experience = document.querySelector('#experience');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let turningPage = false;
let touchTurnActive = false;

function coverIsVisible() {
  return cover && experience && cover.getBoundingClientRect().bottom > (header?.offsetHeight || 0) + 80;
}

async function turnToExperience() {
  if (!coverIsVisible() || turningPage) return;
  turningPage = true;
  const headerHeight = header?.offsetHeight || 0;
  const destination = experience.getBoundingClientRect().top + scrollY - headerHeight;
  const animatePage = !motion.matches && typeof cover.animate === 'function';
  let overlay;

  if (animatePage) {
    overlay = cover.cloneNode(true);
    overlay.removeAttribute('id');
    overlay.classList.add('hero-turn-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
    document.body.append(overlay);
  }

  root.classList.add('page-turning');
  experience.classList.remove('reveal-pending');
  scrollTo(0, destination);

  if (overlay) {
    try {
      await overlay.animate([
        { transform: 'perspective(1400px) translateY(0) rotateX(0deg)' },
        { transform: 'perspective(1400px) translateY(-35%) rotateX(15deg)', offset: .55 },
        { transform: 'perspective(1400px) translateY(-110%) rotateX(20deg)' }
      ], { duration: 700, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' }).finished;
    } catch {}
    overlay.remove();
  }
  // Finish at the start of Experience even if a trackpad sends more events mid-turn.
  scrollTo(0, destination);
  root.classList.remove('page-turning');
  turningPage = false;
}

window.addEventListener('wheel', event => {
  if (turningPage) {
    event.preventDefault();
  } else if (event.deltaY > 3 && coverIsVisible()) {
    event.preventDefault();
    turnToExperience();
  }
}, { passive: false });

window.addEventListener('touchmove', event => {
  if (turningPage || touchTurnActive) event.preventDefault();
}, { passive: false });
window.addEventListener('touchend', () => { touchTurnActive = false; });
window.addEventListener('touchcancel', () => { touchTurnActive = false; });

let touchStartY = null;
cover?.addEventListener('touchstart', event => {
  touchStartY = event.touches[0]?.clientY ?? null;
}, { passive: true });
cover?.addEventListener('touchmove', event => {
  if (touchStartY === null || !coverIsVisible()) return;
  const distance = touchStartY - (event.touches[0]?.clientY ?? touchStartY);
  if (distance > 0) event.preventDefault();
  if (distance > 30) {
    touchStartY = null;
    touchTurnActive = true;
    turnToExperience();
  }
}, { passive: false });
cover?.addEventListener('touchend', () => { touchStartY = null; });

cover?.addEventListener('click', event => {
  if (event.target instanceof Element) {
    const link = event.target.closest('a, button');
    if (link && !link.matches('.hero-next')) return;
    if (link?.matches('.hero-next')) event.preventDefault();
  }
  if (getSelection()?.toString()) return;
  turnToExperience();
});
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
