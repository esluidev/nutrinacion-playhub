# Nutrinación Admin

Aplicación Nuxt 4 para la operación de organizaciones y comunidades, más la consola interna
Platform. Es una SPA conectada al Supabase compartido.

## Contextos

- `platform`: superadmin; organizaciones, licencias, invitaciones y catálogo de storyboards.
- `organizacion`: administradores, licencia y comunidades de una organización.
- `comunidad`: talleres, planner, educadores, colaboradores y catálogo disponible.

La ruta determina el contexto activo. Ver [`../../docs/apps/admin.md`](../../docs/apps/admin.md).

## Desarrollo

```bash
cp .env.example .env.local
npm install
npm run dev
```

Entornos locales:

- aplicación real: `http://localhost:3000`;
- demo sin Supabase para UI compatible: `npm run dev:demo` en `http://localhost:3100`.

## Verificación

```bash
npm run typecheck
npm test
npm run build
```

El QA autenticado y las mutaciones Supabase se ejecutan con escenarios de `../../qa/scenarios/`
y autorización explícita cuando afecten datos reales.

## Contexto para agentes

Leer [`AGENTS.md`](AGENTS.md) antes de tocar esta app.
