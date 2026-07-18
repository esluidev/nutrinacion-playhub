# nutrinacion-storyplay

Plataforma de talleres educativos para niños de 4-8 años sobre nutrición, cuidado personal, actividad física y salud emocional.

## Apps

- **`apps/admin`** — Nuxt + Tailwind. Comunidades gestionan equipos y talleres.
- **`apps/educators`** — Flutter/PWA/tablets. Educadores ejecutan talleres.
- **`apps/studio`** — Nuxt. Crear y servir juegos HTML de escenas.

## Backend

- **Supabase** compartido entre las 3 apps. Ver `supabase/` para migraciones SQL, edge functions y configuración de RLS.

## Documentación

- `docs/` — specs, arquitectura, glosario, storyboards, reglas de juego, backend, diseño.
- `obsidian/` — vault del proyecto (símismo no se trackea en git; solo local).

## Verificación

```bash
./scripts/verify.sh
```

Para este proyecto corre `typecheck` + `build` por cada app Nuxt habilitada y `flutter analyze` + `flutter test` para `educators` cuando esté activo.

## Convención de commits

Conventional Commits sin scope obligatorio (los paths en el mensaje dan el contexto):

```
feat(admin): agregar switcher de contexto
fix(studio): reconciliar drift build vs snapshot
docs(backend): documentar RLS de invitaciones
```