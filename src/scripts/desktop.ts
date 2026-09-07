/**
 * Desktop Manager — gestiona ventanas, dock y drag.
 *
 * Responsabilidades:
 *  · abrir/cerrar ventanas al hacer click en el dock (toggle)
 *  · traer una ventana al frente cuando se hace click sobre ella
 *  · arrastrar ventanas por la title bar (solo desktop, no móvil)
 *  · cerrar / minimizar / maximizar con los traffic lights
 *  · sync con URL: /notas/ → abre ventana notas al cargar; toggle escribe la URL
 *  · deep link individual: /notas/oporto/ pendiente (v2)
 */

type Win = HTMLElement;

const IS_MOBILE = () => window.matchMedia('(max-width: 768px)').matches;

const desktop = document.body;
let zTop = 200;

// ─────────────────────────────────────────────────────────────
// state helpers
// ─────────────────────────────────────────────────────────────

const allWindows = (): Win[] =>
  Array.from(document.querySelectorAll<Win>('[data-window]'));

const win = (slug: string): Win | null =>
  document.querySelector<Win>(`[data-window="${slug}"]`);

const isOpen = (w: Win) => !w.hidden;

const bringToFront = (w: Win) => {
  zTop += 1;
  w.style.zIndex = String(zTop);
  syncDock();
};

const openWindow = (slug: string) => {
  const w = win(slug);
  if (!w) return;
  w.hidden = false;
  w.classList.remove('opening');
  // force reflow so re-add animates
  void w.offsetWidth;
  w.classList.add('opening');
  bringToFront(w);
  syncDock();
  syncUrl(slug);
};

const closeWindow = (slug: string) => {
  const w = win(slug);
  if (!w) return;
  w.hidden = true;
  syncDock();
  syncUrl(null);
};

const toggleWindow = (slug: string) => {
  const w = win(slug);
  if (!w) return;
  if (isOpen(w)) closeWindow(slug);
  else openWindow(slug);
};

const syncDock = () => {
  document.querySelectorAll<HTMLElement>('.app-icon').forEach((btn) => {
    const slug = btn.getAttribute('data-app');
    const w = slug ? win(slug) : null;
    btn.classList.toggle('is-open', !!w && isOpen(w));
  });
};

// ─────────────────────────────────────────────────────────────
// URL sync (simple; deep-link per-post viene después)
// ─────────────────────────────────────────────────────────────

const syncUrl = (slug: string | null) => {
  const path = slug ? `/${slug}/` : '/';
  if (window.location.pathname !== path) {
    window.history.pushState({ slug }, '', path);
  }
};

const openFromUrl = () => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  if (path && win(path)) openWindow(path);
};

window.addEventListener('popstate', (e) => {
  const slug = (e.state && (e.state as any).slug) as string | undefined;
  // close all, open matching if any
  allWindows().forEach((w) => {
    const s = w.getAttribute('data-window')!;
    if (s === 'welcome') return; // welcome siempre visible por defecto
    w.hidden = true;
  });
  if (slug) openWindow(slug);
  else if (window.location.pathname === '/') syncDock();
});

// ─────────────────────────────────────────────────────────────
// dock click
// ─────────────────────────────────────────────────────────────

document.querySelectorAll<HTMLElement>('.app-icon').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slug = btn.getAttribute('data-app');
    if (slug) toggleWindow(slug);
  });
});

// ─────────────────────────────────────────────────────────────
// window · traffic lights
// ─────────────────────────────────────────────────────────────

allWindows().forEach((w) => {
  const slug = w.getAttribute('data-window')!;
  w.addEventListener('mousedown', () => bringToFront(w), true);

  w.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (action === 'close') closeWindow(slug);
      if (action === 'min')   closeWindow(slug); // minimizar de momento = ocultar
      if (action === 'max')   maximizeWindow(w);
    });
  });
});

const maximizeWindow = (w: Win) => {
  if (IS_MOBILE()) return;
  const isMax = w.dataset.maximized === '1';
  if (isMax) {
    w.style.left   = w.dataset.prevLeft   || '80px';
    w.style.top    = w.dataset.prevTop    || '80px';
    w.style.width  = w.dataset.prevWidth  || '520px';
    w.style.height = w.dataset.prevHeight || '420px';
    delete w.dataset.maximized;
  } else {
    w.dataset.prevLeft   = w.style.left;
    w.dataset.prevTop    = w.style.top;
    w.dataset.prevWidth  = w.style.width;
    w.dataset.prevHeight = w.style.height;
    const pad = 20;
    w.style.left   = `${pad}px`;
    w.style.top    = `${28 + pad}px`; // debajo del menu bar
    w.style.width  = `calc(100vw - ${pad * 2}px)`;
    w.style.height = `calc(100vh - ${28 + pad * 2 + 90}px)`; // encima del dock
    w.dataset.maximized = '1';
  }
};

// ─────────────────────────────────────────────────────────────
// drag (solo desktop)
// ─────────────────────────────────────────────────────────────

allWindows().forEach((w) => {
  const handle = w.querySelector<HTMLElement>('[data-drag-handle]');
  if (!handle) return;

  handle.addEventListener('mousedown', (e) => {
    if (IS_MOBILE()) return;
    // no drag si click en un traffic light
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    if (w.dataset.maximized === '1') return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = w.offsetLeft;
    const startTop  = w.offsetTop;
    bringToFront(w);
    handle.style.cursor = 'grabbing';

    const onMove = (ev: MouseEvent) => {
      const nx = startLeft + (ev.clientX - startX);
      const ny = startTop  + (ev.clientY - startY);
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 40;
      w.style.left = `${Math.max(-w.offsetWidth + 100, Math.min(maxX, nx))}px`;
      w.style.top  = `${Math.max(28, Math.min(maxY, ny))}px`;
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      handle.style.cursor = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
});

// ─────────────────────────────────────────────────────────────
// init
// ─────────────────────────────────────────────────────────────

syncDock();
openFromUrl();
