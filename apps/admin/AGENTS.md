# Admin — instrucciones para agentes

Ámbito: `apps/admin`. Hereda las reglas del `AGENTS.md` raíz.

## Lectura mínima

1. README de esta app.
2. Tarea activa y sus rutas `Leer`/`Tocar`.
3. `docs/apps/admin.md`.
4. Según el cambio: `docs/backend.md`, `docs/design.md` y migraciones concretas.

## Reglas

- Nuxt 4 SPA, TypeScript estricto y Tailwind.
- La UI usa el sistema `Ui*`; Reka UI aporta comportamiento headless, no una segunda estética.
- Strings visibles pasan por `app/i18n/messages.ts` en español e inglés. Evitar texto suelto.
- El acceso a datos vive en composables; componentes/páginas no dispersan consultas Supabase.
- Los contextos `platform`, `organizacion` y `comunidad` son excluyentes y la ruta manda.
- Toda restricción sensible se aplica también en RLS/trigger. Un gate de UI no reemplaza seguridad.
- Platform es la única superficie que escribe el catálogo de storyboards y sus guías.
- Reutiliza confirm dialogs, tablas, iconos, toolbars y estados existentes antes de crear variantes.

## Verificación

```bash
npm run typecheck
npm test
npm run build
```

Para cambios de auth, RLS, invitaciones, catálogo o talleres, añade evidencia de Supabase y escenario
de navegador. No pruebes mutaciones contra cloud sin autorización.
