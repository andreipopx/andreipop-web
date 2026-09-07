# Colecciones editables · data/

Cada fichero JSON aquí es una lista editable manualmente. Añades una entrada nueva
y aparece en la app **Intereses** del escritorio en el próximo build.

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

### `libros.json`
```json
[
  {
    "title": "Servant Economy",
    "author": "Jathan Sadowski",
    "status": "leyendo",    // "leyendo" | "leido" | "quiero"
    "rating": null,          // 1-5 o null si no aplica
    "date": "2026-08",       // fecha aproximada
    "note": "sobre economía política de la IA"
  }
]
```

### `musica.json`
```json
[
  {
    "title": "Poems",
    "artist": "Guilty Ghosts",
    "kind": "album",          // "album" | "cancion" | "playlist"
    "year": 2024,
    "url": "https://open.spotify.com/album/...",
    "note": "para trabajar"
  }
]
```

### `peliculas.json`
```json
[
  {
    "title": "Twin Peaks",
    "director": "David Lynch",
    "kind": "serie",          // "pelicula" | "serie" | "documental"
    "year": 1990,
    "status": "viendo",       // "viendo" | "vista" | "quiero"
    "rating": null,
    "note": ""
  }
]
```

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

## Cómo añadir

1. Abre el fichero JSON.
2. Añade una entrada nueva al array (recuerda la coma entre entradas).
3. Commit + push. La web se rebuild y aparece.

Los campos opcionales se pueden omitir. Si algo falla, mira el schema en
`src/lib/collections.ts` (aún no existe — se creará cuando el intereses cargue
estos JSON con validación).
