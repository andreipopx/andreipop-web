# Colecciones editables · data/

Cada fichero JSON aquí es una lista editable manualmente. Añades una entrada
y aparece en la app correspondiente en el próximo build (auto-deploy vía
GitHub Actions ~30-60s tras el push).

**JSON no admite comentarios.** Los `//` en los ejemplos de abajo son solo
para explicar las opciones — no los pegues en tu fichero real.

## Apps que leen estos ficheros

- `enlaces.json`, `libros.json`, `musica.json`, `peliculas.json`, `quotes.json`
  → app **Intereses** (5 pestañas)
- `galeria.json` → app **Galería**

## Estructura de cada colección

### `enlaces.json`
```json
[
  {
    "title": "Napkin math",
    "url": "https://every.to/napkin-math",
    "source": "Dwarkesh Patel",
    "date": "2026-07-10",
    "note": "curso corto en estimación rápida",
    "tags": ["ai", "productividad"]
  }
]
```
Campos: `title` y `url` obligatorios. `source`, `date`, `note`, `tags` opcionales.

### `libros.json`
```json
[
  {
    "status": "leyendo",
    "title": "Servant Economy",
    "author": "Jathan Sadowski",
    "date": "2026-08",
    "rating": null,
    "note": "sobre economía política de la IA"
  }
]
```
Campos: `title`, `author`, `status` obligatorios (`status` es una de `"leyendo"`, `"leido"`, `"quiero"`). `date`, `rating` (1-5 o `null`), `note` opcionales.

### `musica.json`
```json
[
  {
    "title": "Poems",
    "artist": "Guilty Ghosts",
    "year": 2024,
    "kind": "album",
    "url": "https://open.spotify.com/album/...",
    "note": "para trabajar"
  }
]
```
Campos: `title`, `artist`, `year` obligatorios. `kind` (`"album"`, `"cancion"`, `"playlist"`), `url`, `note` opcionales.

### `peliculas.json`
```json
[
  {
    "title": "Twin Peaks",
    "director": "David Lynch",
    "year": 1990,
    "kind": "serie",
    "status": "viendo",
    "rating": null,
    "note": ""
  }
]
```
Campos: `title`, `director`, `year` obligatorios. `kind` (`"pelicula"`, `"serie"`, `"documental"`), `status` (`"viendo"`, `"vista"`, `"quiero"`), `rating`, `note` opcionales.

### `quotes.json`
```json
[
  {
    "text": "El texto exacto de la cita.",
    "author": "Autor",
    "source": "Libro / artículo / conversación",
    "date": "2026-09-01",
    "tags": []
  }
]
```
Campos: `text` y `author` obligatorios. `source`, `date`, `tags` opcionales.

### `galeria.json`
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
Campos: `url` obligatorio (URL completa de Cloudinary). `caption`, `location`, `date`, `type` (`"foto"` o `"video"`) opcionales.

Cloudinary optimiza tamaños automáticamente (WebP + lazy load). Solo tienes
que copiar la URL desde su [dashboard](https://cloudinary.com/console/media_library).

## Cómo añadir una entrada

1. Abre el fichero JSON (en GitHub web con el botón lápiz, o local en tu editor).
2. Añade una entrada nueva al array. **No olvides la coma** entre entradas.
3. Commit + push a `main`. GitHub Actions rebuild ~30-60s. La entrada aparece viva.

Si el build falla (ej: JSON mal formateado, coma que sobra), lo ves en el tab
**Actions** del repo. El deploy anterior sigue vivo mientras arreglas.

## Ver otras cosas editables

Notas, proyectos ("cosas") y la página "Vida" viven en `src/content/` — mira
[GUIDE.md](../../GUIDE.md) en la raíz del repo para el workflow completo.
