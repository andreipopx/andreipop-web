/**
 * andreipop-api · Cloudflare Worker
 *
 * Endpoints:
 *   GET  /firmas                → lista firmas del guestbook (100 últimas)
 *   POST /firmas                → añade una firma (valida Turnstile + rate limit)
 *   GET  /reacciones/:slug      → cuentas de reacciones para un post
 *   POST /reacciones/:slug      → incrementa un emoji (con rate limit por IP+slug+emoji)
 *   GET  /comentarios/:slug     → hilo de comentarios para un post
 *   POST /comentarios/:slug     → añade comentario (valida Turnstile + rate limit)
 *
 * Rate limits:
 *   - Firmas / comentarios: 1 por IP cada 5 min
 *   - Reacciones: 1 por IP + slug + emoji cada 24h (un like por persona por post por día)
 *
 * Turnstile: validación server-side de todo POST con contenido de usuario.
 */

interface Env {
  DATA: KVNamespace;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  ALLOWED_ORIGIN: string;
}

interface Firma {
  id: string;
  nombre: string;
  mensaje: string;
  date: string; // ISO
}

interface Comentario {
  id: string;
  nombre: string;
  mensaje: string;
  date: string;
}

// ─── helpers ────────────────────────────────────────────────

const cors = (env: Env, extra: Record<string, string> = {}) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  ...extra,
});

const json = (env: Env, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });

const err = (env: Env, message: string, status = 400) =>
  json(env, { error: message }, status);

const nowISO = () => new Date().toISOString();
const uid = () => crypto.randomUUID().slice(0, 12);

const clientIp = (req: Request) =>
  req.headers.get('CF-Connecting-IP') || 'unknown';

const sanitize = (s: unknown, max: number): string => {
  const raw = typeof s === 'string' ? s.trim() : '';
  return raw.slice(0, max);
};

// ─── Turnstile ──────────────────────────────────────────────

async function verifyTurnstile(env: Env, token: string, ip: string): Promise<boolean> {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY);
  form.append('response', token);
  form.append('remoteip', ip);
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await resp.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// ─── Rate limiting con KV ──────────────────────────────────

async function rateLimited(
  env: Env,
  key: string,
  windowSeconds: number,
): Promise<boolean> {
  const rlKey = `rl:${key}`;
  const existing = await env.DATA.get(rlKey);
  if (existing) return true;
  await env.DATA.put(rlKey, '1', { expirationTtl: windowSeconds });
  return false;
}

// ─── Endpoints: Firmas ─────────────────────────────────────

async function listFirmas(env: Env): Promise<Response> {
  const raw = await env.DATA.get('firmas');
  const firmas: Firma[] = raw ? JSON.parse(raw) : [];
  return json(env, { firmas: firmas.slice(0, 100) });
}

async function addFirma(env: Env, req: Request): Promise<Response> {
  const ip = clientIp(req);

  const body = await req.json().catch(() => null) as {
    nombre?: string; mensaje?: string; token?: string;
  } | null;
  if (!body) return err(env, 'JSON inválido');

  const nombre  = sanitize(body.nombre, 60);
  const mensaje = sanitize(body.mensaje, 500);
  if (!nombre)  return err(env, 'Nombre requerido');
  if (!mensaje) return err(env, 'Mensaje requerido');

  if (!(await verifyTurnstile(env, body.token || '', ip))) {
    return err(env, 'Verificación anti-bot fallida', 403);
  }
  if (await rateLimited(env, `firma:${ip}`, 300)) {
    return err(env, 'Espera unos minutos antes de firmar de nuevo', 429);
  }

  const nueva: Firma = { id: uid(), nombre, mensaje, date: nowISO() };
  const raw = await env.DATA.get('firmas');
  const firmas: Firma[] = raw ? JSON.parse(raw) : [];
  firmas.unshift(nueva);
  await env.DATA.put('firmas', JSON.stringify(firmas.slice(0, 500)));
  return json(env, { firma: nueva });
}

// ─── Endpoints: Reacciones ─────────────────────────────────

const REACCIONES_VALIDAS = new Set(['❤️','🔥','👏','🤔','😂','🎉']);

async function getReacciones(env: Env, slug: string): Promise<Response> {
  const raw = await env.DATA.get(`reacciones:${slug}`);
  const cuentas: Record<string, number> = raw ? JSON.parse(raw) : {};
  return json(env, { cuentas });
}

async function addReaccion(env: Env, req: Request, slug: string): Promise<Response> {
  const ip = clientIp(req);
  const body = await req.json().catch(() => null) as { emoji?: string } | null;
  if (!body || !body.emoji) return err(env, 'Emoji requerido');
  if (!REACCIONES_VALIDAS.has(body.emoji)) return err(env, 'Emoji no permitido');

  if (await rateLimited(env, `react:${ip}:${slug}:${body.emoji}`, 86400)) {
    return err(env, 'Ya reaccionaste con este emoji recientemente', 429);
  }

  const key = `reacciones:${slug}`;
  const raw = await env.DATA.get(key);
  const cuentas: Record<string, number> = raw ? JSON.parse(raw) : {};
  cuentas[body.emoji] = (cuentas[body.emoji] || 0) + 1;
  await env.DATA.put(key, JSON.stringify(cuentas));
  return json(env, { cuentas });
}

// ─── Endpoints: Comentarios ────────────────────────────────

async function listComentarios(env: Env, slug: string): Promise<Response> {
  const raw = await env.DATA.get(`comentarios:${slug}`);
  const comentarios: Comentario[] = raw ? JSON.parse(raw) : [];
  return json(env, { comentarios: comentarios.slice(0, 200) });
}

async function addComentario(env: Env, req: Request, slug: string): Promise<Response> {
  const ip = clientIp(req);
  const body = await req.json().catch(() => null) as {
    nombre?: string; mensaje?: string; token?: string;
  } | null;
  if (!body) return err(env, 'JSON inválido');

  const nombre  = sanitize(body.nombre, 60);
  const mensaje = sanitize(body.mensaje, 800);
  if (!nombre)  return err(env, 'Nombre requerido');
  if (!mensaje) return err(env, 'Mensaje requerido');

  if (!(await verifyTurnstile(env, body.token || '', ip))) {
    return err(env, 'Verificación anti-bot fallida', 403);
  }
  if (await rateLimited(env, `comm:${ip}:${slug}`, 300)) {
    return err(env, 'Espera unos minutos antes de comentar de nuevo', 429);
  }

  const nuevo: Comentario = { id: uid(), nombre, mensaje, date: nowISO() };
  const key = `comentarios:${slug}`;
  const raw = await env.DATA.get(key);
  const comentarios: Comentario[] = raw ? JSON.parse(raw) : [];
  comentarios.push(nuevo);
  await env.DATA.put(key, JSON.stringify(comentarios.slice(-500)));
  return json(env, { comentario: nuevo });
}

// ─── Router ────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(env) });

    const url = new URL(req.url);
    // Quita el prefijo /api (viene del route pattern andreipop.org/api/*)
    const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '');
    const method = req.method;

    try {
      if (path === '/firmas' && method === 'GET')  return await listFirmas(env);
      if (path === '/firmas' && method === 'POST') return await addFirma(env, req);

      const reacMatch = path.match(/^\/reacciones\/([\w-]+)$/);
      if (reacMatch) {
        const slug = reacMatch[1];
        if (method === 'GET')  return await getReacciones(env, slug);
        if (method === 'POST') return await addReaccion(env, req, slug);
      }

      const commMatch = path.match(/^\/comentarios\/([\w-]+)$/);
      if (commMatch) {
        const slug = commMatch[1];
        if (method === 'GET')  return await listComentarios(env, slug);
        if (method === 'POST') return await addComentario(env, req, slug);
      }

      if (path === '' || path === '/') {
        return json(env, {
          name: 'andreipop-api',
          endpoints: ['/firmas', '/reacciones/:slug', '/comentarios/:slug'],
        });
      }

      return err(env, 'Not found', 404);
    } catch (e) {
      return err(env, 'Internal error', 500);
    }
  },
};
