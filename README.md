# andreipop.org

Web personal de Andrei Pop. Astro + Tailwind + MDX, servida en un contenedor propio.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Estructura

- `src/pages/` — páginas Astro (una por ruta)
- `src/content/` — contenido en Markdown/MDX, organizado por sección:
  - `viajes/` · `reflexiones/` · `papers/` · `enlaces/` · `proyectos/`
- `src/layouts/Layout.astro` — layout base
- `src/components/` — componentes reutilizables
- `src/styles/global.css` — tokens del sistema de marca + Tailwind

## Añadir contenido

Cada post es un `.mdx` en su carpeta. Ejemplo:

```
src/content/viajes/oporto-2026/
├── index.mdx
├── foto1.jpg
└── foto2.jpg
```

Frontmatter mínimo:

```yaml
---
title: "Tres días en Oporto sin hacer nada"
date: 2026-09-01
excerpt: "Bajamos el fin de semana sin plan..."
---
```

## Deploy

Se construye con `pnpm build` (genera `dist/`) y se sirve desde un contenedor
nginx en `~/servicios/andreipop-web/` en pop, expuesto a `andreipop.org`
por Cloudflare Tunnel.
