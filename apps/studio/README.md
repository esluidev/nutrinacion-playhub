# StoryPlay Studio

Aplicación Nuxt 4 interna para diseñar y probar storyboards, primitivas y sprites. También sirve el
runner público consumido por Educators.

## Límites de responsabilidad

- El contenido ejecutable vive en `content/storyboards/` y se compila con Studio.
- Studio genera metadata y consulta Supabase para mostrar el estado remoto.
- Studio no escribe el catálogo: Admin/Platform registra, edita guías y publica.
- `/play/**` debe permanecer público; el resto requiere superadmin.

## Desarrollo

```bash
cp .env.example .env.local
npm install
npm run dev
```

URL local: `http://localhost:3001`.

## Verificación

```bash
npm run typecheck
npm test
npm run build
```

Antes de crear o modificar escenas, leer `../../docs/game-rules.md`, el contrato del tipo en
`../../docs/storyboards.md` y `../../docs/design.md`.

## Contexto para agentes

Leer [`AGENTS.md`](AGENTS.md) antes de tocar esta app.
