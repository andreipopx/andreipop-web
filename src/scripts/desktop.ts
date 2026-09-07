/**
 * Desktop Manager · andreipop.org
 *
 * Round 2:
 *  · Wallpaper time-aware (sol/luna según hora local)
 *  · Wordmark del menu bar clickable → reabre Welcome
 *  · Ventanas constreñidas encima del dock y debajo del menu bar
 *  · Tooltip mejor al hover de las apps del dock
 *  · Cursor personalizado (CSS · siempre activo · toggle en Ver)
 *  · Menu bar mobile: iconos en vez de texto para Home/Ver/Ayuda
 *  · Minimize animation: escalado hacia el icono del dock
 *  · Battery API (graceful fallback si no está)
 *  · Dropdowns ampliados
 */

const IS_MOBILE = () => window.matchMedia('(max-width: 768px)').matches;
const MENU_BAR_H = 28;
const DOCK_H_RESERVED = 100; // dock + label + padding
const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;

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

const constrainWindow = (w: HTMLElement) => {
  if (IS_MOBILE()) return;
  const maxH = window.innerHeight - MENU_BAR_H - DOCK_H_RESERVED;
  const maxW = window.innerWidth - 40;
  const curW = Math.min(w.offsetWidth, maxW);
  const curH = Math.min(w.offsetHeight, maxH);
  w.style.width  = `${curW}px`;
  w.style.height = `${curH}px`;
  const maxLeft = window.innerWidth - curW - 20;
  const maxTop  = window.innerHeight - curH - DOCK_H_RESERVED;
  const l = Math.max(20, Math.min(maxLeft, w.offsetLeft));
  const t = Math.max(MENU_BAR_H + 10, Math.min(maxTop, w.offsetTop));
  w.style.left = `${l}px`;
  w.style.top  = `${t}px`;
};

const centerWindow = (w: HTMLElement) => {
  if (IS_MOBILE()) return;
  const width  = parseInt(w.dataset.defaultWidth  || String(w.offsetWidth  || 520), 10);
  const height = parseInt(w.dataset.defaultHeight || String(w.offsetHeight || 400), 10);
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - MENU_BAR_H - DOCK_H_RESERVED;
  const finalW = Math.min(width, maxW);
  const finalH = Math.min(height, maxH);
  w.style.width  = `${finalW}px`;
  w.style.height = `${finalH}px`;
  w.style.left = `${Math.max(20, (window.innerWidth  - finalW) / 2)}px`;
  w.style.top  = `${Math.max(MENU_BAR_H + 10, (window.innerHeight - finalH) / 2)}px`;
  delete w.dataset.maximized;
};

const dockRectFor = (slug: string): DOMRect | null => {
  const btn = document.querySelector<HTMLElement>(`.app-icon[data-app="${slug}"]`);
  return btn?.getBoundingClientRect() ?? null;
};

const openWindow = (slug: string, opts: { center?: boolean } = {}) => {
  const w = win(slug);
  if (!w) return;
  const wasClosed = w.hidden;
  w.hidden = false;
  if (wasClosed && (opts.center ?? true) && slug !== 'welcome') centerWindow(w);
  w.classList.remove('opening', 'closing', 'minimizing');
  void w.offsetWidth;
  w.classList.add('opening');
  bringToFront(w);
  syncDock();
  syncUrl(slug);
};

const closeWindow = (slug: string, mode: 'close' | 'minimize' = 'close') => {
  const w = win(slug);
  if (!w || w.hidden) return;
  if (mode === 'minimize' && !IS_MOBILE()) {
    // efecto tipo genie: escala hacia el icono del dock
    const wr = w.getBoundingClientRect();
    const dr = dockRectFor(slug);
    if (dr) {
      const dx = (dr.left + dr.width / 2) - (wr.left + wr.width / 2);
      const dy = (dr.top  + dr.height / 2) - (wr.top  + wr.height / 2);
      w.style.setProperty('--min-dx', `${dx}px`);
      w.style.setProperty('--min-dy', `${dy}px`);
      w.classList.add('minimizing');
      window.setTimeout(() => {
        w.hidden = true;
        w.classList.remove('minimizing');
        w.style.removeProperty('--min-dx');
        w.style.removeProperty('--min-dy');
        syncDock();
      }, 260);
      syncUrl(null);
      return;
    }
  }
  w.classList.add('closing');
  window.setTimeout(() => {
    w.hidden = true;
    w.classList.remove('closing');
    syncDock();
  }, 160);
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
    w.style.top    = `${MENU_BAR_H + pad}px`;
    w.style.width  = `${window.innerWidth - pad * 2}px`;
    w.style.height = `${window.innerHeight - MENU_BAR_H - DOCK_H_RESERVED - pad}px`;
    w.dataset.maximized = '1';
  }
};

// ─── URL sync ───────────────────────────────────────────────

const syncUrl = (slug: string | null) => {
  const path = slug && slug !== 'welcome' ? `/${slug}/` : '/';
  if (window.location.pathname !== path) window.history.pushState({ slug }, '', path);
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

// ─── dock click ─────────────────────────────────────────────

document.querySelectorAll<HTMLElement>('.app-icon').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slug = btn.getAttribute('data-app');
    if (slug) toggleWindow(slug);
    // Cierra el overflow menu al elegir una app
    const overflow = document.querySelector<HTMLElement>('[data-dock-overflow]');
    const moreBtn = document.querySelector<HTMLElement>('[data-dock-more]');
    overflow?.classList.remove('is-open');
    moreBtn?.classList.remove('is-open');
    moreBtn?.setAttribute('aria-expanded', 'false');
  });
});

// Dock "more" button (solo visible en mobile)
const moreBtn = document.querySelector<HTMLElement>('[data-dock-more]');
const overflow = document.querySelector<HTMLElement>('[data-dock-overflow]');
moreBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = overflow?.classList.toggle('is-open');
  moreBtn.classList.toggle('is-open', !!isOpen);
  moreBtn.setAttribute('aria-expanded', String(!!isOpen));
});
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-dock-more], [data-dock-overflow]')) {
    overflow?.classList.remove('is-open');
    moreBtn?.classList.remove('is-open');
    moreBtn?.setAttribute('aria-expanded', 'false');
  }
});

// ─── window · traffic + drag + resize + dblclick ────────────

allWindows().forEach((w) => {
  const slug = w.getAttribute('data-window')!;
  w.addEventListener('mousedown', () => bringToFront(w), true);

  w.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (action === 'close') closeWindow(slug, 'close');
      if (action === 'min')   closeWindow(slug, 'minimize');
      if (action === 'max')   maximizeWindow(w);
    });
  });

  const handle = w.querySelector<HTMLElement>('[data-drag-handle]');
  handle?.addEventListener('mousedown', (e) => {
    if (IS_MOBILE()) return;
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    if (w.dataset.maximized === '1') return;
    const startX = e.clientX, startY = e.clientY;
    const startLeft = w.offsetLeft, startTop = w.offsetTop;
    bringToFront(w);
    handle.style.cursor = 'grabbing';
    const onMove = (ev: MouseEvent) => {
      const nx = startLeft + (ev.clientX - startX);
      const ny = startTop  + (ev.clientY - startY);
      // Los bounds ahora son laxos: sólo garantizamos que la title bar
      // siga siendo agarrable (no fuera del viewport), y que la ventana
      // no se meta bajo el dock. Puede pasar por detrás del menu bar.
      const maxX = window.innerWidth - 60;
      const minX = -w.offsetWidth + 100;
      const maxY = window.innerHeight - DOCK_H_RESERVED - 10;
      w.style.left = `${Math.max(minX, Math.min(maxX, nx))}px`;
      w.style.top  = `${Math.max(0, Math.min(maxY, ny))}px`;
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

  handle?.addEventListener('dblclick', (e) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    maximizeWindow(w);
  });

  w.querySelectorAll<HTMLElement>('[data-resize]').forEach((h) => {
    h.addEventListener('mousedown', (e) => {
      if (IS_MOBILE()) return;
      if (w.dataset.maximized === '1') return;
      const dir = h.getAttribute('data-resize')!;
      const startX = e.clientX, startY = e.clientY;
      const startLeft = w.offsetLeft, startTop = w.offsetTop;
      const startWidth = w.offsetWidth, startHeight = w.offsetHeight;
      bringToFront(w);
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        let nx = startLeft, ny = startTop, nw = startWidth, nh = startHeight;
        const maxW = window.innerWidth - 40;
        const maxH = window.innerHeight - MENU_BAR_H - DOCK_H_RESERVED;
        if (dir.includes('e')) nw = Math.max(MIN_WIDTH,  Math.min(maxW, startWidth  + dx));
        if (dir.includes('s')) nh = Math.max(MIN_HEIGHT, Math.min(maxH, startHeight + dy));
        if (dir.includes('w')) { nw = Math.max(MIN_WIDTH, startWidth - dx); nx = startLeft + (startWidth - nw); }
        if (dir.includes('n')) { nh = Math.max(MIN_HEIGHT, startHeight - dy); ny = Math.max(MENU_BAR_H + 10, startTop + (startHeight - nh)); }
        w.style.left = `${nx}px`; w.style.top = `${ny}px`;
        w.style.width = `${nw}px`; w.style.height = `${nh}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault(); e.stopPropagation();
    });
  });
});

// ─── theme (light/dark chrome) ──────────────────────────────

const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | null);
const initialTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = initialTheme;
updateThemeUI(initialTheme);

function updateThemeUI(theme: 'light' | 'dark') {
  const l = document.querySelector<HTMLElement>('[data-theme-icon="light"]');
  const d = document.querySelector<HTMLElement>('[data-theme-icon="dark"]');
  if (l) l.hidden = theme === 'dark';
  if (d) d.hidden = theme === 'light';
}

const toggleTheme = () => {
  const current = document.documentElement.dataset.theme as 'light' | 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  updateThemeUI(next);
  applyPhase(); // wallpaper también responde al toggle
};

// ─── cursor personalizado toggle ────────────────────────────

const storedCursor = localStorage.getItem('cursor') !== 'off';
document.documentElement.dataset.cursor = storedCursor ? 'custom' : 'system';
const toggleCursor = () => {
  const on = document.documentElement.dataset.cursor === 'custom';
  document.documentElement.dataset.cursor = on ? 'system' : 'custom';
  localStorage.setItem('cursor', on ? 'off' : 'on');
};

// ─── wallpaper time-aware ───────────────────────────────────

interface PhaseColors {
  top: string; mid1: string; mid2: string; bottom: string;
  astro: string; astroX: number; astroY: number;
  glow: number; stars: number; craters: boolean;
  mtnBack: number; mtnMid: number; mtnFront: number;
}

const phaseAt = (hour: number): PhaseColors => {
  // 0-5: night, 5-7: dawn, 7-11: morning, 11-16: noon, 16-19: sunset, 19-22: dusk, 22-24: night
  const arc = (h: number) => {
    // hour 6 → x=0, hour 18 → x=1600, hour 12 → mid
    const t = Math.max(0, Math.min(1, (h - 6) / 12));
    const x = 100 + t * 1400;
    const y = 700 - Math.sin(t * Math.PI) * 500;
    return { x, y };
  };
  const arcMoon = (h: number) => {
    const nh = (h + 12) % 24;
    return arc(nh);
  };

  if (hour >= 22 || hour < 5) {
    // Fase noche en LIGHT MODE: violetas con brillo (no negro total).
    // El tintDark aplicará el negro real cuando el user esté en dark mode.
    const m = arcMoon(hour);
    return {
      top: '#312e81', mid1: '#4338ca', mid2: '#7c3aed', bottom: '#a78bfa',
      astro: '#f1f5f9', astroX: m.x, astroY: m.y,
      glow: 0.35, stars: 0.55, craters: true,
      mtnBack: 0.4, mtnMid: 0.65, mtnFront: 0.85,
    };
  }
  if (hour < 7) {
    const a = arc(hour);
    return {
      top: '#312e81', mid1: '#7c3aed', mid2: '#f472b6', bottom: '#fdba74',
      astro: '#fbbf24', astroX: a.x, astroY: a.y,
      glow: 0.5, stars: 0.3, craters: false,
      mtnBack: 0.4, mtnMid: 0.65, mtnFront: 0.85,
    };
  }
  if (hour < 11) {
    const a = arc(hour);
    return {
      top: '#93c5fd', mid1: '#dbeafe', mid2: '#fef3c7', bottom: '#fed7aa',
      astro: '#fef08a', astroX: a.x, astroY: a.y,
      glow: 0.4, stars: 0, craters: false,
      mtnBack: 0.25, mtnMid: 0.4, mtnFront: 0.7,
    };
  }
  if (hour < 16) {
    const a = arc(hour);
    return {
      top: '#60a5fa', mid1: '#93c5fd', mid2: '#dbeafe', bottom: '#e0e7ff',
      astro: '#fef08a', astroX: a.x, astroY: a.y,
      glow: 0.3, stars: 0, craters: false,
      mtnBack: 0.25, mtnMid: 0.4, mtnFront: 0.7,
    };
  }
  if (hour < 19) {
    const a = arc(hour);
    return {
      top: '#a5b4fc', mid1: '#fbcfe8', mid2: '#fed7aa', bottom: '#fdba74',
      astro: '#fbbf24', astroX: a.x, astroY: a.y,
      glow: 0.7, stars: 0, craters: false,
      mtnBack: 0.3, mtnMid: 0.5, mtnFront: 0.75,
    };
  }
  // 19-22
  const a = arc(hour);
  return {
    top: '#4c1d95', mid1: '#7c3aed', mid2: '#db2777', bottom: '#f97316',
    astro: '#fb923c', astroX: a.x, astroY: Math.max(a.y, 550),
    glow: 0.5, stars: 0.5, craters: false,
    mtnBack: 0.5, mtnMid: 0.75, mtnFront: 0.9,
  };
};

const tintDark = (p: PhaseColors) => {
  // DARK MODE: fuerza noche profunda independiente de la hora.
  // Mantiene posición del astro (viene de real hour); cambia paleta a night deep.
  p.top    = '#020617';
  p.mid1   = '#0c1a3e';
  p.mid2   = '#1e1b4b';
  p.bottom = '#312e81';
  p.stars  = 1;
  p.glow   = 0.1;
  p.mtnBack  = 0.75;
  p.mtnMid   = 0.9;
  p.mtnFront = 1;
  p.astro    = '#f1f5f9';
  p.craters  = true;
};

const applyPhase = () => {
  // Posición del sol/luna = hora real del visitante.
  // El toggle claro/oscuro solo tinta la paleta.
  const hour = new Date().getHours();
  const theme = document.documentElement.dataset.theme as 'light' | 'dark';
  const p = phaseAt(hour);
  if (theme === 'dark') tintDark(p);
  const wp = document.querySelector('[data-wallpaper]');
  if (!wp) return;
  const setStop = (name: string, color: string) => {
    wp.querySelector<SVGStopElement>(`[data-sky-stop="${name}"]`)?.setAttribute('stop-color', color);
  };
  setStop('top', p.top); setStop('mid1', p.mid1); setStop('mid2', p.mid2); setStop('bottom', p.bottom);
  const astro = wp.querySelector<SVGCircleElement>('[data-astro]');
  const astroOuter = wp.querySelector<SVGCircleElement>('[data-astro-outer]');
  const craters = wp.querySelector<SVGGElement>('[data-moon-craters]');
  const stars = wp.querySelector<SVGGElement>('[data-stars]');
  const glow = wp.querySelector<SVGRectElement>('[data-glow]');
  if (astro) { astro.setAttribute('cx', String(p.astroX)); astro.setAttribute('cy', String(p.astroY)); astro.setAttribute('fill', p.astro); }
  if (astroOuter) { astroOuter.setAttribute('cx', String(p.astroX)); astroOuter.setAttribute('cy', String(p.astroY)); astroOuter.setAttribute('fill', p.astro); }
  if (craters) {
    craters.setAttribute('opacity', p.craters ? '0.5' : '0');
    if (p.craters) {
      craters.querySelector<SVGCircleElement>('[data-crater-1]')?.setAttribute('cx', String(p.astroX + 15));
      craters.querySelector<SVGCircleElement>('[data-crater-1]')?.setAttribute('cy', String(p.astroY - 12));
      craters.querySelector<SVGCircleElement>('[data-crater-2]')?.setAttribute('cx', String(p.astroX - 15));
      craters.querySelector<SVGCircleElement>('[data-crater-2]')?.setAttribute('cy', String(p.astroY + 16));
      craters.querySelector<SVGCircleElement>('[data-crater-3]')?.setAttribute('cx', String(p.astroX + 20));
      craters.querySelector<SVGCircleElement>('[data-crater-3]')?.setAttribute('cy', String(p.astroY + 20));
    }
  }
  if (stars) stars.setAttribute('opacity', String(p.stars));
  if (glow) glow.setAttribute('opacity', String(p.glow));
  // Waves (Big Sur) mantienen su color pero se les ajusta la opacidad como
  // si fueran capas de "montaña" (más opacas en modos oscuros).
  wp.querySelector<SVGPathElement>('[data-wave-back]')?.setAttribute('opacity', String(0.5 + p.mtnBack * 0.4));
  wp.querySelector<SVGPathElement>('[data-wave-mid]')?.setAttribute('opacity', String(0.65 + p.mtnMid * 0.3));
  wp.querySelector<SVGPathElement>('[data-wave-front]')?.setAttribute('opacity', String(0.8 + p.mtnFront * 0.2));
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
    const wasOpen = btn.getAttribute('aria-expanded') === 'true';
    closeAllMenus();
    if (!wasOpen && panel) {
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
      case 'toggle-theme':  toggleTheme(); break;
      case 'toggle-cursor': toggleCursor(); break;
      case 'reset':
      case 'close-all':
        allWindows().forEach((w) => {
          const s = w.getAttribute('data-window')!;
          if (s !== 'welcome' || action === 'close-all') w.hidden = true;
        });
        if (action === 'reset') openWindow('welcome', { center: false });
        syncDock(); syncUrl(null); break;
      case 'center-all':
        allWindows().forEach((w) => { if (!w.hidden) centerWindow(w); }); break;
      case 'tile':
        tileWindows(); break;
      case 'open-welcome': openWindow('welcome', { center: true }); break;
      case 'show-shortcuts':
        alert(
          'Atajos:\n\n' +
          '⌘/Ctrl + D — Cambiar modo claro/oscuro\n' +
          'ESC — Cerrar menús\n' +
          'Click en app del dock — Abrir / cerrar\n' +
          'Arrastra title bar — Mover ventana\n' +
          'Arrastra bordes/esquinas — Redimensionar\n' +
          'Doble-click title bar — Maximizar'
        );
        break;
    }
  });
});

const tileWindows = () => {
  const open = allWindows().filter((w) => !w.hidden);
  if (open.length === 0) return;
  const cols = Math.ceil(Math.sqrt(open.length));
  const rows = Math.ceil(open.length / cols);
  const pad = 12;
  const w = (window.innerWidth - pad * (cols + 1)) / cols;
  const h = (window.innerHeight - MENU_BAR_H - DOCK_H_RESERVED - pad * (rows + 1)) / rows;
  open.forEach((win, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    win.style.left   = `${pad + c * (w + pad)}px`;
    win.style.top    = `${MENU_BAR_H + pad + r * (h + pad)}px`;
    win.style.width  = `${w}px`;
    win.style.height = `${h}px`;
    delete win.dataset.maximized;
  });
};

// ─── keyboard shortcuts ────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault(); toggleTheme();
  }
  if (e.key === 'Escape') closeAllMenus();
});

// ─── mobile menu: iconos en vez de texto ───────────────────

const applyMobileMenuLabels = () => {
  const mobile = IS_MOBILE();
  document.querySelectorAll<HTMLElement>('[data-full]').forEach((el) => { el.hidden = mobile; });
  document.querySelectorAll<HTMLElement>('[data-short]').forEach((el) => { el.hidden = !mobile; });
  const bf = document.querySelector<HTMLElement>('[data-brand-full]');
  const bs = document.querySelector<HTMLElement>('[data-brand-short]');
  if (bf) bf.hidden = mobile;
  if (bs) bs.hidden = !mobile;
};

// ─── reloj ─────────────────────────────────────────────────

const clockEl = document.querySelector<HTMLElement>('[data-clock]');
const tickClock = () => {
  if (!clockEl) return;
  const dias  = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const n = new Date();
  const d = dias[n.getDay()];
  const dd = String(n.getDate()).padStart(2, '0');
  const mm = meses[n.getMonth()];
  const hh = String(n.getHours()).padStart(2, '0');
  const mn = String(n.getMinutes()).padStart(2, '0');
  clockEl.textContent = IS_MOBILE() ? `${hh}:${mn}` : `${d} ${dd} ${mm} · ${hh}:${mn}`;
};

// ─── battery API (opcional, graceful fallback) ─────────────

const setupBattery = async () => {
  const el = document.querySelector<HTMLElement>('[data-battery]');
  const fill = document.querySelector<SVGRectElement>('[data-battery-fill]');
  const pct  = document.querySelector<HTMLElement>('[data-battery-pct]');
  if (!el || !fill || !pct) return;
  const nav = navigator as any;
  if (!nav.getBattery) return;
  try {
    const battery = await nav.getBattery();
    const update = () => {
      const level = Math.round(battery.level * 100);
      el.hidden = false;
      fill.setAttribute('width', String(0.5 + (level / 100) * 12.5));
      pct.textContent = `${level}%`;
    };
    update();
    battery.addEventListener('levelchange', update);
    battery.addEventListener('chargingchange', update);
  } catch { /* silent */ }
};

// ─── window resize handler ─────────────────────────────────

window.addEventListener('resize', () => {
  tickClock();
  applyMobileMenuLabels();
  allWindows().forEach((w) => { if (!w.hidden && !IS_MOBILE()) constrainWindow(w); });
});

// ─── init ──────────────────────────────────────────────────

applyPhase();
setInterval(applyPhase, 5 * 60 * 1000); // repinta cada 5 min
tickClock();
setInterval(tickClock, 15000);
applyMobileMenuLabels();
setupBattery();
syncDock();
openFromUrl();
