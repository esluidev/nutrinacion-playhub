---
id: 004
estado: finalizada
prioridad: alta
creada: 2026-10-14
---
# Admin con el UI Kit

## Objetivo

Llevar Admin a Tailwind 4 y al UI Kit compartido, en densidad `compact`, sin perder funcionalidad.

## Alcance

- Extender `@playhub/ui`; sus `Ui*` sustituyen a los locales con la misma API.
- Migración por fases: alias temporales de los colores de Tailwind 3 hacia tokens del kit (1.365 usos al empezar) y limpieza por página.
- Fuera: adaptar Admin al modelo de datos nuevo (tarea 006).

## Criterios de aceptación

- [x] Admin compila, pasa typecheck y sus tests con el kit.
- [ ] Login, Platform, Organización y Comunidad se ven con el kit y funcionan como antes.
- [x] Inventario de clases heredadas pendiente de limpiar, registrado.

## Plan

### Leer

`apps/admin/AGENTS.md`, `apps/admin/app/assets/css/main.css`, `tailwind.config.ts` y los `Ui*`.

### Tocar

`apps/admin/**`.

### Verificar

`npm run typecheck && npm test && npm run build` en `apps/admin`, y `admin-demo` en el navegador.

## Pasos

- [x] Tailwind 4 y la capa.
- [x] Alias de compatibilidad.
- [x] `Ui*` compartidos.
- [x] Limpieza por vista de los alias del puente.
- [x] Fase B: cada vista con los roles de color y la profundidad del kit, igual que Educators.
- [ ] Revisión visual con sesión real (Supabase) y aceptación de Luis.

## Pendientes y siguiente paso

Finalizada el 2026-11-03 por Luis. Los colores sin decidir pasan a la [tarea 015](015-pendientes-de-admin-y-educators.md) (punto 3). El QA con sesión real de Supabase se hizo en local durante el QA de Luis.

## Log
- 2026-10-14 — Fase A:
  - Admin extiende `@playhub/ui`. Se retiraron `@nuxtjs/tailwindcss`, `tailwind.config.ts`, los 14 `Ui*` locales, `utils/icons.ts` y `useToast` local; la API de los compartidos es compatible y ninguna vista cambió de import.
  - Se añadieron `@nuxt/kit` (lo pide `reka-ui/nuxt` y dejó de estar en la raíz), `vue-tsc` (cierra TOOL-002) y `@types/node`.
  - `main.css` importa el kit y define el puente: gris → night, marca primaria → sol, secundaria → cielo, púrpura → uva, rojo → danger, ámbar → sol, verde → lima. También aloja las clases propias que quedan (`card`, `chip`, `section-title`…).
  - Correcciones: `btn` → `ui-button`/`ui-quiet`; `input` → `field`; texto blanco sobre fondos de marca → la tinta legible de su tono, en 26 archivos.
  - `provideUiLabels` conecta los textos del kit con el i18n de Admin (clave nueva `common.notifications`).
  - `PAGE_SIZE` queda en `utils/paginacion.ts` (cierra AUTO-001) y el mensaje de entorno pide `.env.local` (cierra ENV-001).
- 2026-10-14 — Verificación en `apps/admin`:
  - `npm run typecheck` aprobado (0 errores), `npm test` aprobado (46 tests) y `npm run build` aprobado sin avisos.
  - Navegador (`admin-demo`, sin Supabase): dashboard de comunidad, catálogo de Platform y login se ven con el kit (sol, Nunito, neutros night, paneles con base).
- 2026-10-14 — Fase B, por indicación de Luis («en admin todo gira alrededor del verde»; relieve inconsistente; columna de hoy y «Agregar» del planner):
  - Mecánico, con scripts:
    - 357 `text-[Npx]` y 196 tamaños con nombre de Tailwind pasaron a la escala del kit;
    - 134 radios a `rounded-chip|control-sm|control|card|panel`;
    - 36 `bg-white` a `bg-surface`;
    - 105 SVG en línea a `UiIcon`, con 10 iconos nuevos de Lucide en el kit.
  - Composables: `useWorkshops` entrega `tone` (estado de la sesión, `sessionTone`) en lugar de `avatarBg`, `thumbBg` y `accentColor`. `useEducators` y `useColaboradores` dejan de llevar colores; las personas usan `UiAvatar`. `useStoryboards` entrega `area` (desde `tipos_storyboard.codigo`) en lugar de `coverBg`.
  - Planner reescrito como referencia: `ui-group`, `UiTabs fit`, filtros con base, bandejas por día (hoy en sol suave), `ui-slot` gris discontinuo y tarjetas con el tono de su sesión.
  - Las 56 vistas restantes, en paralelo, por seis agentes con un brief común:
    - lima solo para la acción principal y lo completado;
    - sol para hoy y lo pendiente; cielo para lo próximo; coral para lo que falta o se cancela; uva para invitaciones;
    - navegación con `ui-nav-item`;
    - superficies `ui-panel`; acciones de fila neutras.
  - Integración:
    - tonos de licencia, invitación y vencimiento en `utils/tonos.ts` (con tests);
    - estado de publicación compartido con Player (`UI_PUBLICATION_TONES`: en revisión en sol);
    - `main.css` de Admin sin clases propias (solo `scrollbar-thin`);
    - «Cancelar taller» pasa a secundario.
  - Verificación:
    - `./scripts/verify.sh` aprobado sin avisos: check-ui 0 hallazgos; Admin 51 tests; Player 33; Educators 7; los tres builds.
    - Navegador (`admin-demo`, 1280 px): planner, inicio de comunidad, talleres, detalle de taller, educadores, catálogo, inicio de Platform y licencias.
  - Pendiente de Luis: las decisiones de color abiertas y la revisión con sesión real.
- 2026-10-14 — Revisión de Luis y cierre técnico:
  - Formularios: campos, desplegables y buscador miden exactamente 40 px, como los botones (medían 49–59). Tablas y tarjetas con radio 16 (antes 24).
  - Selector de contexto con `ui-picker` (48 px; símbolo alineado con los iconos del menú).
  - Nombres antiguos fuera: `getStudioUrl` → `getPlayerUrl` (la clave `studio_url` de la base se renombra en la 006), paquete `nutrinacion-workshops` → `playhub-admin` (lockfile actualizado) y marca visible «Nutrinación Workshops» → «PlayHub» (es/en).
  - Typecheck aprobado. Pasa a `revision`.
- 2026-11-03 15:06 — Luis: «finaliza todo y quita cosas del backlog, ordena las tareas». Finalizada; lo que quedaba abierto pasa a las tareas 012–015 (ver «Pendientes y siguiente paso»).
