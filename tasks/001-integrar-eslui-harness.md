---
id: 001
estado: revision
prioridad: alta
creada: 2026-10-14
---
# Integrar eslui-harness y ordenar la base del repositorio

## Objetivo

Sustituir el arnés anterior, basado en un vault de Obsidian (Ficha, Tareas, Actividad), por eslui-harness dentro del repositorio, de modo que el contexto, las tareas y las decisiones vivan en el proyecto y versionados en Git. Aprovechar para retirar lo que no está conectado y no tiene riesgo.

## Alcance

Acordado con Luis el 2026-10-14:

- El arnés va en la raíz de este repositorio (`playhub-applications/`). La raíz de PlayHub (`../`) conserva su propio `AGENTS.md`.
- La numeración de tareas empieza de nuevo en `001`. Las tareas del vault no se migran; sus riesgos abiertos quedan resumidos en `.harness/project.md` (Riesgos activos) hasta convertirse en tareas.
- Se quita el symlink `obsidian`; el vault queda intacto fuera del repositorio, sin referencias desde aquí.
- `tasks/` deja de estar ignorado y se versiona.
- Sin commits ni operaciones de Git: muchas cosas van a cambiar todavía.
- El renombre Studio → Player y el destino de los storyboards antiguos quedan fuera; se revisan después.
- Reducir la documentación a lo que el arnés no cubre: `docs/` describe el sistema, `.harness/` cómo se trabaja y `tasks/` lo que se hace. Cada app queda con un solo `AGENTS.md`; se retiran los documentos del enfoque anterior, `docs/apps/`, los README por app y la maqueta `Admin Rediseño.html` (habrá una referencia visual nueva).

## Criterios de aceptación

- [x] Estructura de eslui-harness 0.1.0 presente y `bash scripts/harness-check.sh` sin errores.
- [x] `AGENTS.md` con un único bloque `eslui-harness:start/end`; sus reglas particulares conservadas en `.harness/project.md`.
- [x] Sin referencias a Obsidian, Ficha o Actividad en el repositorio.
- [x] `.gitignore` sin `obsidian` ni `tasks`.
- [x] `verify.sh` real conservado y su cobertura descrita en `project.md`.
- [x] Archivos sin referencias eliminados sin romper typecheck, tests ni build.
- [x] `docs/` reducido a arquitectura, glosario y backend, sin datos duplicados con `.harness/` ni con las apps.
- [x] Un solo archivo de contexto por app (`AGENTS.md` con `CLAUDE.md` como symlink).
- [x] Contexto revisado con Luis en conversación.

## Plan

### Leer

- Plantilla: `/Users/luis/Eslui/_sistema/plantillas/eslui-harness` (README, CHANGELOG, `.harness/`).
- Arnés anterior: `AGENTS.md`, `README.md`, `docs/README.md`, `scripts/verify.sh`, `scripts/check-context.mjs` y el vault (Ficha y tareas abiertas 030, 032, 033).

### Tocar

- Nuevos: `.harness/` (`core.md`, `project.md`, `VERSION`, `workflows/`, `templates/`), `docs/decisions/README.md`, `skills/README.md`, `tasks/README.md`, `scripts/harness-check.sh` y esta tarea.
- Reescritos: `AGENTS.md`, `README.md`, `docs/README.md`, `docs/architecture.md`, `docs/backend.md`, `docs/glossary.md`, `apps/*/AGENTS.md` y `apps/player/scripts/README.md`.
- Ajustados: `.gitignore`, `scripts/check-context.mjs` y `scripts/verify.sh` (comentarios).
- Eliminados: el symlink `obsidian`, los archivos sin uso y la documentación sustituida, listados en el Log.

### Verificar

- `bash -n scripts/harness-check.sh scripts/verify.sh` y `bash scripts/harness-check.sh`, en la raíz.
- `./scripts/verify.sh`, en la raíz (contexto, Admin y Player).

## Pasos

- [x] Analizar el repositorio y la plantilla.
- [x] Eliminar archivos sin referencias y artefactos sin uso.
- [x] Copiar los archivos compartidos del arnés.
- [x] Escribir `project.md` con el contexto vigente y los riesgos heredados.
- [x] Integrar el bloque en `AGENTS.md` y adaptar los índices (`docs/`, `skills/`, `tasks/`).
- [x] Quitar Obsidian: symlink, `.gitignore` y referencias.
- [x] Registrar la versión y ejecutar las comprobaciones.
- [x] Reducir `docs/` y unificar el contexto de cada app.
- [x] Revisar el contexto con Luis y pulirlo.

## Pendientes y siguiente paso

- Aceptación de Luis.

## Log

- 2026-10-14 — Análisis inicial. Arnés anterior: vault de Obsidian enlazado por symlink, con una Ficha desactualizada (StoryPlay, Studio, ruta `workshops-applications`). Worktree de partida con el renombre Studio → Player sin commit (376 borrados en `apps/studio` más `apps/player/` sin seguimiento), que se preserva tal cual.
- 2026-10-14 — Eliminados por no tener referencias en código, tests, configuración ni documentación: `apps/player/_wtest` (vacío), `apps/player/app/components/ui/{UiDropdown,UiMultiSelect,UiPageToolbar}.vue` y `apps/player/app/composables/{useOrganizaciones,usePaises}.ts` (datos de prueba de cuando Studio editaba el catálogo). También 16 `.DS_Store` y `apps/player/.output` (build antiguo de "StoryPlay Studio", ignorado por Git). Verificación en `apps/player`: `npm run typecheck` aprobado (exit 0, 0 errores, con el aviso conocido `Load plugin failed: vue-router/volar/sfc-route-blocks`), `npm test` aprobado (3 archivos, 33 tests) y `npm run build` aprobado. Resultado: verde con hallazgos.
- 2026-10-14 — Integración de eslui-harness 0.1.0 desde la copia local de la plantilla. Se quitó el symlink `obsidian`; el vault sigue en iCloud sin cambios. `check-context.mjs` revisa ahora también los enlaces de `.harness/`, `tasks/` y `skills/README.md`.
- 2026-10-14 — Comprobaciones en la raíz:
  - `bash -n` de ambos scripts: aprobado.
  - `bash scripts/harness-check.sh`: 0 errores y 1 aviso esperado (contexto parcial).
  - `./scripts/verify.sh`: exit 0. Contexto aprobado; Admin con typecheck, 46 tests y build aprobados; Player con typecheck, 33 tests y build aprobados.
  - Resultado: verde con hallazgos ya registrados en Riesgos activos: el plugin de vue-tsc en Player, la descarga de `vue-tsc@3.3.13` en Admin y el `PAGE_SIZE` duplicado. El aviso de Browserslist desactualizado es ruido conocido.
- 2026-10-14 — Reducción de la documentación, acordada con Luis.
  - Eliminados, todos recuperables desde Git:
    - documentos del enfoque anterior: `docs/storyboards.md`, `game-rules.md`, `games.md`, `design.md` y `potito.md`;
    - `docs/Admin Rediseño.html` (ya no se usa), `docs/archive/backend-design-2026-07.md`, `docs/testing/strategy.md`, `docs/operations/` y `docs/apps/`;
    - los README de Admin y Educators. El de Player no estaba versionado: su contenido pasó a su `AGENTS.md`.
  - Lo vigente se fusionó en `docs/backend.md`: entornos, matriz de roles para RLS, QA de datos en cloud y acceso del agente por MCP. También en `docs/architecture.md` (límites build/editorial) y en cada `apps/<app>/AGENTS.md` (estructura, diseño de Admin, flujo previsto de Educators y comandos).
  - Las reglas genéricas de pruebas y evidencia ya las cubre `.harness/core.md`. `glossary.md` queda como tabla BD ↔ UI, sin términos del enfoque anterior.
  - `docs/`, los `AGENTS.md`, los README y `project.md` pasan de unas 2.700 líneas a 455.
  - Comprobaciones: `node scripts/check-context.mjs` aprobado, `bash scripts/harness-check.sh` con 0 errores y 1 aviso esperado, `bash -n scripts/verify.sh` aprobado. No se volvió a ejecutar `verify.sh` completo porque no cambió código.
  - Quedan referencias a `game-rules.md` en comentarios de las escenas `bienvenida` de los storyboards antiguos; desaparecen con ellos.
- 2026-10-14 — Luis eliminó `apps/admin/false/` y da por lista la integración. Tarea en `revision`, pendiente de su aceptación. Fuera del alcance, se añadió la configuración `ui-kit` a `.claude/launch.json` para previsualizar `../references/demo`.
- 2026-10-14 — Limpieza del repositorio:
  - Se retiraron carpetas vacías y generadas: `.data/kv` de Nitro y `server/` en las tres apps, y `apps/admin/public`.
  - `.data/` entra en `.gitignore`: es el almacén local de Nitro, que reaparece con `nuxt dev`.
  - `../AGENTS.md` ya nombra `playhub-applications/` (cierra el pendiente) y apunta a la tarea 006 como siguiente paso.
  - Typecheck de las tres apps aprobado tras la limpieza.
