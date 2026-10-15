/**
 * Turnstile bajo demanda + fetch con reintentos · Firma y Comentarios
 *
 * Antes el widget se pintaba al cargar la página, dentro de ventanas
 * ocultas. Si Cloudflare pedía reto, nadie lo veía y el formulario se
 * quedaba en «Verificando…»; si daba error, sólo decía «refresca».
 *
 * Ahora:
 *  · el widget se pinta cuando el usuario toca el formulario (ya visible)
 *  · al enviar se espera al token en vez de bloquear el botón
 *  · los errores se reintentan solos y, si no, se explica el motivo
 */

declare global {
  interface Window { turnstile?: any }
}

export class VerifError extends Error {
  constructor(public code: string) { super(code); }
}

const waitForApi = (timeoutMs = 10000): Promise<any> =>
  new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      if (window.turnstile) { clearInterval(iv); resolve(window.turnstile); }
      else if (Date.now() - t0 > timeoutMs) { clearInterval(iv); reject(new VerifError('no-carga')); }
    }, 150);
  });

export function createVerifier(
  container: HTMLElement,
  siteKey: string,
  hooks: {
    /** Cloudflare pide marcar la casilla: avisamos al usuario. */
    onInteractive?: () => void;
    /** Ya hay token (para limpiar el aviso). */
    onToken?: () => void;
  } = {},
) {
  let widgetId: string | null = null;
  let rendering: Promise<void> | null = null;
  let token: string | null = null;
  let failure: VerifError | null = null;
  let retries = 0;
  let waiters: Array<{ resolve: (t: string) => void; reject: (e: VerifError) => void }> = [];

  const settle = (t: string | null, e?: VerifError) => {
    const w = waiters;
    waiters = [];
    w.forEach((x) => (t ? x.resolve(t) : x.reject(e!)));
  };

  const render = () => {
    rendering ??= waitForApi().then((ts) => {
      container.innerHTML = '';
      widgetId = ts.render(container, {
        sitekey: siteKey,
        theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
        appearance: 'interaction-only',
        callback: (t: string) => { token = t; failure = null; retries = 0; hooks.onToken?.(); settle(t); },
        'expired-callback': () => { token = null; },
        'timeout-callback': () => { token = null; ts.reset(widgetId); },
        'error-callback': (code: string) => {
          token = null;
          console.warn('[turnstile] error', code);
          if (retries++ < 2) {
            window.setTimeout(() => ts.reset(widgetId), 800);
          } else {
            failure = new VerifError(String(code));
            settle(null, failure);
          }
          return true;
        },
        'before-interactive-callback': () => hooks.onInteractive?.(),
        'unsupported-callback': () => {
          failure = new VerifError('unsupported');
          settle(null, failure);
        },
      });
    });
    return rendering;
  };

  return {
    /** Arranca la verificación en segundo plano (al tocar el formulario). */
    warm() { render().catch(() => {}); },

    /** Devuelve un token válido, esperando a Turnstile si hace falta. */
    async getToken(timeoutMs = 90000): Promise<string> {
      if (token) return token;
      await render();
      if (token) return token;
      if (failure) {
        // El usuario vuelve a intentarlo: damos otra ronda de reintentos
        if (failure.code === 'unsupported') throw failure;
        failure = null;
        retries = 0;
        window.turnstile.reset(widgetId);
      }
      return new Promise((resolve, reject) => {
        waiters.push({ resolve, reject });
        window.setTimeout(() => reject(new VerifError('timeout')), timeoutMs);
      });
    },

    /** Los tokens son de un solo uso: tras cada envío, pedimos otro. */
    consume() {
      token = null;
      if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
    },
  };
}

export function verifMessage(err: unknown): string {
  const code = err instanceof VerifError ? err.code : 'desconocido';
  if (code === 'unsupported') return 'Este navegador no es compatible con la verificación anti-bot. Prueba desde Chrome, Firefox o Safari.';
  if (code === 'no-carga') return 'No ha cargado la verificación anti-bot (¿algún bloqueador?). Prueba a desactivarlo o usa otro navegador.';
  if (code === 'timeout') return 'La verificación está tardando demasiado. Dale otra vez.';
  return `No hemos podido verificar que eres humano (código ${code}). Dale otra vez o prueba con otro navegador.`;
}

/** GET JSON con un par de reintentos. El error dice el motivo (HTTP o red). */
export async function getJson<T>(url: string, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 600 * i));
    try {
      const r = await fetch(url, { cache: 'no-store' }).catch(() => {
        throw new Error('sin conexión con la API');
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json().catch(() => {
        throw new Error('respuesta no válida');
      })) as T;
    } catch (err) {
      last = err;
      console.warn(`[api] GET ${url} intento ${i + 1}:`, err);
    }
  }
  throw last;
}
