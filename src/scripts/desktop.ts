/**
 * Desktop Manager — gestiona el escritorio del sitio andreipop.org
 *
 * Features:
 *  · Dock: click abre/cierra la ventana correspondiente
 *  · Ventanas draggable (por la title bar) + resize (por bordes/esquinas)
 *  · Traffic lights: cerrar / minimizar / maximizar (con iconos al hover)
 *  · z-index automático (click sube al frente)
 *  · Al reabrir una ventana cerrada → se centra en el viewport
 *  · Modo claro/oscuro (persistente en localStorage + cambia wallpaper)
 *  · Menu bar dropdowns (Home / Ver / Ayuda)
 *  · Deep-link por URL: /notas/ abre Notas al cargar
 *  · Móvil: sin drag/resize, ventanas fullscreen modal
 *  · Reloj en tiempo real
 *  · Atajos: ⌘/Ctrl+D toggle tema · ESC cierra dropdowns
 */

const IS_MOBILE = () => window.matchMedia('(max-width: 768px)').matches;

let zTop = 200;

// ─── helpers ────────────────────────────────────────────────

const allWindows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-window]'));
const win = (slug: string) =>
  document.querySelector<HTMLElement>(`[data-window="${slug}"]`);
const isOpen = (w: HTMLElement) => !w.hidden;

const bringToFront = (w: HTMLElement) => {
  zTop += 1;
  w.style.zIndex = String(zTop);
  syncDock();
};

const centerWindow = (w: HTMLElement) => {
  if (IS_MOBILE()) return;
  const width  = parseInt(w.dataset.defaultWidth  || String(w.offsetWidth  || 520), 10);
  const height = parseInt(w.dataset.defaultHeight || String(w.offsetHeight || 400), 10);
  w.style.width  = `${width}px`;
  w.style.height = `${height}px`;
  const left = Math.max(0, (window.innerWidth  - width)  / 2);
  const top  = Math.max(28, (window.innerHeight - height) / 2);
  w.style.left = `${left}px`;
  w.style.top  = `${top}px`;
  delete w.dataset.maximized;
};

const openWindow = (slug: string, opts: { center?: boolean } = {}) => {
  const w = win(slug);
  if (!w) return;
  const wasClosed = w.hidden;
  w.hidden = false;
  if (wasClosed && (opts.center ?? true) && slug !== 'welcome') {
    centerWindow(w);
  }
  w.classList.remove('opening', 'closing');
  void w.offsetWidth;
  w.classList.add('opening');
  bringToFront(w);
  syncDock();
  syncUrl(slug);
};

const closeWindow = (slug: string) => {
  const w = win(slug);
  if (!w || w.hidden) return;
  w.classList.add('closing');
  window.setTimeout(() => {
    w.hidden = true;
    w.classList.remove('closing');
    syncDock();
  }, 180);
  syncUrl(null);
};

const toggleWindow = (slug: string) => {
  const w = win(slug);
  if (!w) return;
  isOpen(w) ? closeWindow(slug) : openWindow(slug);
};

const syncDock = () => {
  document.querySelectorAll<HTMLElement>('.app-icon').forEach((btn) => {
    const slug = btn.getAttribute('data-app');
    const w = slug ? win(slug) : null;
    btn.classList.toggle('is-open', !!w && isOpen(w));
  });
};

const maximizeWindow = (w: HTMLElement) => {
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
    w.style.top    = `${28 + pad}px`;
    w.style.width  = `calc(100vw - ${pad * 2}px)`;
    w.style.height = `calc(100vh - ${28 + pad * 2 + 90}px)`;
    w.dataset.maximized = '1';
  }
};

// ─── URL sync ───────────────────────────────────────────────

const syncUrl = (slug: string | null) => {
  const path = slug && slug !== 'welcome' ? `/${slug}/` : '/';
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
  allWindows().forEach((w) => {
    if (w.getAttribute('data-window') === 'welcome') return;
    w.hidden = true;
  });
  if (slug) openWindow(slug);
  else syncDock();
});

// ─── dock ───────────────────────────────────────────────────

document.querySelectorAll<HTMLElement>('.app-icon').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slug = btn.getAttribute('data-app');
    if (slug) toggleWindow(slug);
  });
});

// ─── ventanas · traffic lights + drag + resize ─────────────

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const TOP_LIMIT = 28;

allWindows().forEach((w) => {
  const slug = w.getAttribute('data-window')!;
  w.addEventListener('mousedown', () => bringToFront(w), true);

  // Traffic lights
  w.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (action === 'close') closeWindow(slug);
      if (action === 'min')   closeWindow(slug);
      if (action === 'max')   maximizeWindow(w);
    });
  });

  // Drag
  const handle = w.querySelector<HTMLElement>('[data-drag-handle]');
  if (handle) {
    handle.addEventListener('mousedown', (e) => {
      if (IS_MOBILE()) return;
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
        w.style.top  = `${Math.max(TOP_LIMIT, Math.min(maxY, ny))}px`;
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
  }

  // Resize
  w.querySelectorAll<HTMLElement>('[data-resize]').forEach((h) => {
    h.addEventListener('mousedown', (e) => {
      if (IS_MOBILE()) return;
      if (w.dataset.maximized === '1') return;
      const dir = h.getAttribute('data-resize')!;
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft   = w.offsetLeft;
      const startTop    = w.offsetTop;
      const startWidth  = w.offsetWidth;
      const startHeight = w.offsetHeight;
      bringToFront(w);
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let nx = startLeft, ny = startTop, nw = startWidth, nh = startHeight;
        if (dir.includes('e')) nw = Math.max(MIN_WIDTH,  startWidth  + dx);
        if (dir.includes('s')) nh = Math.max(MIN_HEIGHT, startHeight + dy);
        if (dir.includes('w')) {
          nw = Math.max(MIN_WIDTH, startWidth - dx);
          nx = startLeft + (startWidth - nw);
        }
        if (dir.includes('n')) {
          nh = Math.max(MIN_HEIGHT, startHeight - dy);
          ny = Math.max(TOP_LIMIT, startTop + (startHeight - nh));
        }
        w.style.left = `${nx}px`;
        w.style.top  = `${ny}px`;
        w.style.width  = `${nw}px`;
        w.style.height = `${nh}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
      e.stopPropagation();
    });
  });
});

// ─── modo claro/oscuro ─────────────────────────────────────

const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | null);
const initialTheme = storedTheme
  || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = initialTheme;
updateThemeUI(initialTheme);

function updateThemeUI(theme: 'light' | 'dark') {
  const lightIcon = document.querySelector<HTMLElement>('[data-theme-icon="light"]');
  const darkIcon  = document.querySelector<HTMLElement>('[data-theme-icon="dark"]');
  if (lightIcon) lightIcon.hidden = theme === 'dark';
  if (darkIcon)  darkIcon.hidden  = theme === 'light';
  const wpLight = document.querySelector<HTMLElement>('[data-wallpaper="light"]');
  const wpDark  = document.querySelector<HTMLElement>('[data-wallpaper="dark"]');
  if (wpLight) wpLight.style.opacity = theme === 'dark' ? '0' : '1';
  if (wpDark)  wpDark.style.opacity  = theme === 'dark' ? '1' : '0';
}

const toggleTheme = () => {
  const current = document.documentElement.dataset.theme as 'light' | 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  updateThemeUI(next);
};

// ─── menu bar dropdowns ────────────────────────────────────

const menuButtons = document.querySelectorAll<HTMLButtonElement>('[data-menu]');
const menuPanels  = document.querySelectorAll<HTMLElement>('[data-menu-panel]');

const closeAllMenus = () => {
  menuButtons.forEach((b) => b.setAttribute('aria-expanded', 'false'));
  menuPanels.forEach((p) => (p.hidden = true));
};

menuButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = btn.getAttribute('data-menu');
    const panel = document.querySelector<HTMLElement>(`[data-menu-panel="${menu}"]`);
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    closeAllMenus();
    if (!isOpen && panel) {
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    }
  });
});

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-menu], [data-menu-panel]')) closeAllMenus();
});

document.querySelectorAll<HTMLElement>('[data-menu-action]').forEach((el) => {
  el.addEventListener('click', () => {
    const action = el.getAttribute('data-menu-action');
    closeAllMenus();
    switch (action) {
      case 'toggle-theme':
        toggleTheme();
        break;
      case 'reset':
      case 'close-all':
        allWindows().forEach((w) => {
          const s = w.getAttribute('data-window')!;
          if (s !== 'welcome' || action === 'close-all') w.hidden = true;
        });
        if (action === 'reset') openWindow('welcome', { center: false });
        syncDock();
        syncUrl(null);
        break;
      case 'center-all':
        allWindows().forEach((w) => { if (!w.hidden) centerWindow(w); });
        break;
      case 'open-welcome':
        openWindow('welcome', { center: true });
        break;
      case 'show-shortcuts':
        alert('Atajos:\n\n⌘/Ctrl + D — Cambiar modo claro/oscuro\nESC — Cerrar menús\nClick en app del dock — Abrir / cerrar ventana\nArrastra title bar — Mover ventana\nArrastra bordes/esquinas — Redimensionar\nDoble-click title bar — Maximizar');
        break;
    }
  });
});

// ─── keyboard shortcuts ────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    toggleTheme();
  }
  if (e.key === 'Escape') closeAllMenus();
});

// ─── reloj menu bar ────────────────────────────────────────

const clockEl = document.querySelector<HTMLElement>('[data-clock]');
if (clockEl) {
  const dias  = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const tick = () => {
    const n = new Date();
    const d  = dias[n.getDay()];
    const dd = String(n.getDate()).padStart(2, '0');
    const mm = meses[n.getMonth()];
    const hh = String(n.getHours()).padStart(2, '0');
    const mn = String(n.getMinutes()).padStart(2, '0');
    // En mobile mostramos solo la hora para no romper la barra
    clockEl.textContent = IS_MOBILE() ? `${hh}:${mn}` : `${d} ${dd} ${mm} · ${hh}:${mn}`;
  };
  tick();
  setInterval(tick, 15000);
  window.addEventListener('resize', tick);
}

// ─── double-click title bar → maximize ─────────────────────

allWindows().forEach((w) => {
  const bar = w.querySelector<HTMLElement>('[data-drag-handle]');
  bar?.addEventListener('dblclick', (e) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    maximizeWindow(w);
  });
});

// ─── init ──────────────────────────────────────────────────

syncDock();
openFromUrl();
