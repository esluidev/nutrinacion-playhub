# Studio (`apps/studio`)

Aplicación Nuxt 4 interna y host del runner StoryPlay.

## Estado vigente

- Gestión protegida con Supabase Auth y gate de superadmin.
- `/play/**` público para previews y futuro webview de Educators.
- Storyboards, escenas, sprites, primitivas y audio viven en el build de `content/`.
- Produce metadata copiable y consulta Supabase para mostrar si el build está registrado/al día.
- No escribe Supabase. Admin/Platform es la superficie editorial y de publicación.
- Vitest cubre metadata, drift remoto y frontera de rutas públicas.

## Superficies

- `app/pages/storyboards/`: catálogo build y detalle de solo lectura.
- `app/pages/play/`: runner público.
- `content/storyboards/`: contenido compilado por tipo/storyboard/escena.
- `app/primitives/`: mecánicas reutilizables.
- `app/sprites/`: arte reusable.
- `app/assets/css/storyplay.css`: design system de juegos.
- `app/assets/css/main.css`: chrome de gestión, separado del runner.

## Contrato build/editorial

Studio es dueño de clave, slug, idiomas, taxonomía, cantidad/orden/folder de escenas y contenido
ejecutable. Admin es dueño de estado editorial, descripción, objetivo, bibliografía, duración,
países/organización y guía. Títulos llegan como semilla y pueden corregirse en Admin.

## Reglas de contenido

Antes de tocar una escena:

1. leer [`../game-rules.md`](../game-rules.md) completo;
2. leer el contrato pedagógico del tipo en [`../storyboards.md`](../storyboards.md);
3. revisar primitivas/sprites existentes y [`../design.md`](../design.md);
4. mantener todo texto del juego localizado y audio alineado al texto runtime.

## Verificación

```bash
cd apps/studio
npm run typecheck
npm test
npm run build
```

Para contenido, añadir QA visual en `/play/<tipo>/<slug>` con idioma y escena relevantes.
