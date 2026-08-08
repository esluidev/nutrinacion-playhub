# Admin (`apps/admin`)

SPA Nuxt 4 para operación de clientes y consola interna. Usa Tailwind, componentes `Ui*`, Reka UI
headless, i18n propio y Supabase.

## Estado vigente

- Auth por invitación y bandeja aceptar/rechazar: conectadas.
- Tres contextos excluyentes por ruta: Platform, Organización y Comunidad.
- Organizaciones, licencias, invitaciones, comunidades y administradores: datos reales.
- Operación de comunidad (talleres, planner, educadores, colaboradores y catálogo): conectada con
  adaptadores/composables; algunos flujos y UI todavía tienen deuda de QA/i18n.
- Platform administra el catálogo de storyboards, datos editoriales y guía por escena.

El alcance exacto en curso vive en la tarea activa de Obsidian, no en este documento.

## Arquitectura de UI

- `app/pages/platform/`: operación del superadmin.
- `app/pages/organizacion/`: nivel comercial/administrativo.
- `app/pages/dashboard/`: contexto de comunidad.
- `app/composables/`: acceso y reglas de aplicación sobre Supabase.
- `app/components/ui/`: sistema visual reusable.
- `app/i18n/messages.ts`: español/inglés.

La ruta manda el contexto. El sidebar, switcher, breadcrumb y guards deben reflejar el mismo tipo.

## Reglas de implementación

- Usar `Ui*` y patrones actuales para tablas, confirmaciones, iconos, toasts y formularios.
- Reka UI aporta accesibilidad/comportamiento, no estilos alternativos.
- Strings visibles en ambos diccionarios; evitar español hardcodeado.
- Consultas y mutaciones detrás de composables.
- Toda regla sensible también en RLS/trigger.
- Storyboards: metadata build-owned es de solo lectura; datos editoriales se escriben aquí.

## Diseño

Fuentes de verdad:

- [`../design.md`](../design.md): tokens/patrones vigentes;
- [`../Admin Rediseño.html`](../Admin%20Redise%C3%B1o.html): referencia visual histórica;
- código `tailwind.config.ts`, `main.css` y componentes `Ui*`: implementación actual.

## Verificación

```bash
cd apps/admin
npm run typecheck
npm test
npm run build
```

Auth, permisos, RLS, invitaciones, catálogo y talleres requieren además QA autenticado y snapshots
Supabase antes/después.
