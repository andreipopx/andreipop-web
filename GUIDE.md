# Cómo tocar la web · guía para Andrei

Todo lo que sigue lo puedes hacer desde `github.com/andreipopx/andreipop-web`
directamente en el navegador (**Add file → Create new file** o **Edit file**),
o clonando el repo en tu máquina.

**Cada `git push` a `main` dispara un build automático** (GitHub Actions +
self-hosted runner en pop). En 30-60s los cambios están vivos en
`andreipop.org`.

## Añadir una nota

Crea `src/content/notas/<slug>.mdx`:

```mdx
---
title: "Tres días en Oporto sin hacer nada"
date: 2026-09-01
kind: nota         # o "ensayo" | "paper"
tags: [viajes, oporto]
excerpt: "Una línea preview para la lista."
---

Aquí va el contenido en Markdown.

## Con headings, listas, links

Puedes meter [enlaces](https://ejemplo.com), *cursiva*, **negrita**,
listas, > citas, `código`, y ![imágenes](url-de-cloudinary).
```

Aparece en la app **Notas** ordenada por fecha. Al click, abre en ventana nueva.

## Añadir una foto/video a la Galería

1. Ve a [Cloudinary Media Library](https://cloudinary.com/console/media_library) → drag & drop tu foto/video
2. Click en el archivo → copia la **URL** (la que empieza con `https://res.cloudinary.com/up7czvhe/...`)
3. Edita `src/data/galeria.json` añadiendo una entrada:

```json
[
  {
    "url": "https://res.cloudinary.com/up7czvhe/image/upload/v.../foto.jpg",
    "caption": "Duero al atardecer",
    "location": "Oporto",
    "date": "2026-09-01",
    "type": "foto"
  }
]
```

Cloudinary optimiza tamaños automáticamente (WebP, responsive, lazy loading).

## Añadir un enlace / libro / película / música / quote

Igual que la galería, editando el JSON de esa categoría en `src/data/`:

- `src/data/enlaces.json` — enlaces interesantes
- `src/data/libros.json` — libros leyendo / leídos / quiero
- `src/data/musica.json` — álbumes, canciones, playlists
- `src/data/peliculas.json` — películas y series
- `src/data/quotes.json` — citas

Cada uno tiene ejemplos de formato en `src/data/README.md`.

## Añadir/editar un proyecto (Cosas)

`src/content/cosas/<slug>.mdx`:

```mdx
---
title: nombre-del-proyecto
tagline: "Descripción corta de una línea."
year: 2026
kind: proyecto     # o "paper" | "charla" | "otro"
accent: indigo     # indigo | orange | emerald | violet | amber
initial: n         # una letra (aparece en la card)
url: https://url-externa.com    # opcional, si tiene sitio propio
repo: https://github.com/...     # opcional, alternativa a url
order: 1                          # opcional, orden en la lista
---

Descripción larga del proyecto en Markdown.
```

## Actualizar la página Vida (now page)

Edita `src/content/vida/index.mdx`. Cambia el `updated:` en el frontmatter
cada vez que lo toques, se enseña en la web.

## Cambiar tu bio del hero

Edita `src/config/site.ts` → campo `bio`.

## Rutas del proyecto (para referencia)

```
src/
├── content/
│   ├── notas/          ← tus posts
│   ├── cosas/          ← tus proyectos
│   └── vida/           ← tu now page
├── data/               ← colecciones editables (JSON)
│   ├── galeria.json
│   ├── enlaces.json
│   ├── libros.json
│   ├── musica.json
│   ├── peliculas.json
│   └── quotes.json
├── config/site.ts      ← bio, apps del dock, endpoints
├── components/desktop/ ← componentes del escritorio (avanzado)
└── styles/global.css   ← colores del sistema (avanzado)
```

## Ver una nota antes de publicar (draft)

Añade `draft: true` en su frontmatter → no aparece pública.
Quita ese campo o pon `draft: false` cuando esté lista.

## Endpoints del backend (Cloudflare Worker)

- `GET  https://andreipop-api.mrandreipop.workers.dev/firmas` — lista firmas
- Los formularios de Firma en la web escriben aquí (con validación anti-bot)

## Si algo se rompe

Revisa el tab **Actions** del repo en GitHub — verás si el último build falló.
Si sí, click en el run rojo para ver el error. Suele ser un typo en frontmatter
o un JSON mal formateado.
