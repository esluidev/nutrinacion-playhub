---
id: 002
estado: revision
prioridad: alta
creada: 2026-10-14
---
# UI Kit compartido en `packages/ui`

## Objetivo

Llevar el PlayHub UI Kit al repositorio como fuente única de estilos y componentes de las apps web, según la [decisión 001](../docs/decisions/001-ui-kit-compartido.md).

## Alcance

- npm workspaces en la raíz (`apps/*`, `packages/*`) y `.npmrc`.
- `packages/ui` como capa de Nuxt:
  - tokens con sol como primario, lima para correcto y progreso, y densidades `compact` (por defecto) y `touch`;
  - CSS de componentes, fuente Nunito e iconos;
  - componentes Vue `Ui*`, compatibles con la API que ya usan Admin y Player.
- Laboratorio en `packages/ui/lab/` (lámina y player de prototipo), alimentado por los mismos tokens.
- Fuera: aplicar el kit a cada app (tareas 003, 004 y 005).

## Criterios de aceptación

- [x] `npm install` en la raíz instala las apps y el paquete.
- [x] Una app que extiende `@playhub/ui` compila, y su typecheck detecta un prop incorrecto en un `Ui*`.
- [x] Los tokens expresan los roles nuevos y las dos densidades; la lámina los muestra.
- [x] `TOKENS.md` y `DESIGN.md` del paquete describen roles, densidades y variantes.
- [x] `../references/demo` deja de ser la fuente y `../AGENTS.md` apunta al paquete.

## Plan

### Leer

`../references/demo/` (`src/tokens.css`, `src/styles.css`, `DESIGN.md`, `TOKENS.md`), los `Ui*` de `apps/admin` y `apps/player`, y la [decisión 001](../docs/decisions/001-ui-kit-compartido.md).

### Tocar

`package.json` y `.npmrc` de la raíz, `packages/ui/**`, `.gitignore`, `scripts/verify.sh` y la documentación de contexto.

### Verificar

- `npm install` en la raíz.
- Build y typecheck de una app que extiende la capa.
- Lámina del laboratorio en el navegador, en densidad compacta y táctil.

## Pasos

- [x] Prueba técnica: capa de Nuxt + Tailwind 4, con y sin workspaces.
- [x] Workspaces en la raíz.
- [x] Tokens, CSS y fuente en `packages/ui/css`.
- [x] Componentes `Ui*` e iconos.
- [x] Laboratorio en `packages/ui/lab`.
- [x] Documentación del paquete y punteros.

## Pendientes y siguiente paso

- Validar con Luis, a la vista, el relieve unificado, los roles de color y la escala compacta.

## Log

- 2026-10-14 — Prueba técnica en el scratchpad (Nuxt 4.4.8, Tailwind 4.3.3):
  - Sin workspaces, la capa compila, pero `vue-tsc` no tipa sus componentes (un `:size="123"` pasa sin error) y la capa no puede declarar dependencias.
  - Con npm workspaces: el build se aprueba, el typecheck detecta el prop incorrecto (exit 2) y desaparece el aviso `Load plugin failed: vue-router/volar/sfc-route-blocks`. Su causa era declarar `vue-router@4` en apps sobre Nuxt 4.4, que trae `vue-router` 5.
  - npm 10 falla con `Cannot read properties of null (reading 'edgesOut')` al resolver los peers de `@vitejs/devtools`; con `legacy-peer-deps` instala.
- 2026-10-14 — Paquete `@playhub/ui` construido:
  - npm workspaces en la raíz (`apps/admin`, `apps/player`, `packages/ui`) con `.npmrc` (`legacy-peer-deps`). Se retiraron los lockfiles y `node_modules` por app. Nuxt resolvió a 4.6.1.
  - Admin sigue con Tailwind 3 hasta la tarea 004: necesita `tailwindcss@^3` propio, porque su PostCSS encontraba el Tailwind 4 de la raíz. Con eso, build, typecheck (0 errores; ya no descarga `vue-tsc`) y 46 tests aprobados.
  - Tokens: sol por defecto; lima para correcto y progreso; uva para el reintento; densidades `compact` (40/32/48, relieve 3) y `touch` (48/40/56, relieve 4).
  - CSS base y de componentes, con piezas nuevas para las apps: tabla, listbox, paginación, panel, pila de avisos, campos sm/lg y enlace.
  - 25 componentes `Ui*` compatibles con la API de Admin, con `useUiLabels`, `useToast` y `icons.json` (76 iconos).
  - Laboratorio en `packages/ui/lab`, generado desde el paquete: lámina con interruptor de densidad y player de prototipo alineado con los roles nuevos.
  - Revisado en el navegador: botones a 40 px en compacta y 48 en táctil; Nunito cargada; sol como primario.
  - Se actualizaron `TOKENS.md`, `DESIGN.md`, `PLAYER-DESIGN.md`, `../AGENTS.md`, `estructura.md` de la skill (campo `template`, campos de ítem y plantillas) y el aviso de copia antigua en `../references/demo/README.md`. Las copias de seguridad de los dos archivos externos están en el scratchpad de la sesión.
- 2026-10-14 — Lenguaje común, por la revisión de Luis:
  - Lima vuelve a ser el primario: sol llenaba Admin de amarillo.
  - Forma por densidad: `--ph-radius`, rectángulo de 12 en compacta y cápsula en táctil.
  - Isotipo de Nutrinación en el kit (barra lateral colapsada y favicon).
- 2026-10-14 — Profundidad y roles de color:
  - Una sola base (`--ph-depth`) para controles y superficies. `--shadow-panel`/`--shadow-raised` se recalculan por densidad.
  - Filtros elevados y a altura de control; pestañas en raíl hundido a altura de control; página actual con base.
  - Piezas nuevas: `ui-group`, `ui-tray` (hoy, tinte suave), `ui-slot`, `ui-day`, `ui-time`, `ui-nav-item`, `ui-avatar`/`UiAvatar`, `ui-stat`, `ui-cover`, `ui-symbol-md`, `ui-listbox-floating`, `filter-sm` y `UiTabs fit`.
  - La barra de progreso va por densidad (`--ph-progress`: 10 en compacta, 16 en táctil). Escala de texto con `subtitle` (16).
  - Mapas compartidos en `ui-tones.ts`: `UI_SESSION_TONES`, `UI_PUBLICATION_TONES`, `UI_AREA_TONES`, `uiAreaOf`/`uiAreaAttrs` y `uiToneFor` (sin lima ni sol).
  - Navegación actual con `--nav-current`: tinte lima entre 100 y 200 con icono lima. Luis pidió más vida que lime-50.
  - `DESIGN.md`: secciones «Profundidad» y «Roles de color».
  - Laboratorio con la lámina «Para organizar el trabajo».
  - `check-ui.mjs` entra en `verify.sh`.
  - `vue-router@5.4.0` en la raíz: desaparece el aviso `sfc-route-blocks` de los tres typecheck (Nuxt lo dejaba anidado).
- 2026-10-14 — Forma única y alturas exactas (revisión de Luis: «los botones en Educators son redondos y en Admin esquinas redondeadas»; desplegables más altos que los campos; tarjetas demasiado redondeadas):
  - La densidad ya no cambia la forma: `--ph-radius` es 12 en las dos. Las superficies tienen una sola escala (control 14, card 16, panel 16, dialog 20). `pill` queda para lo redondo por naturaleza: puntos, interruptores, progreso y burbujas de contador.
  - Se retiraron las cápsulas de `ui-navbar`, `counter-compact`, `mini-action`, el avatar táctil, la navegación de Educators y el HUD, el participante y el riel del runner y del prototipo.
  - `.field`, `.search-box` y `UiSelect` miden exactamente `--ph-control`: medían 49–59 px contra 40. Los botones no superan su alto por padding.
  - «Siguiente» del runner pasa de sol a lima (la acción principal); el reinicio sigue en sol (reintento amable).
  - Medido en el navegador: Admin a 40 px (campos, desplegables, buscador, botones; radio 12; tabla 16); Educators a 48 px (botones y pestañas; radio 12; tarjetas 16); el runner con la misma forma.
- 2026-10-14 — Selector con símbolo (`ui-picker`) para el contexto de Admin:
  - 48 px (`--ph-control-lg`) en lugar de los 40 de un campo, con dos líneas;
  - 10 px alrededor del símbolo, alineado con la columna de iconos de `ui-nav-item` (medido: 26 px y 26 px).
- 2026-10-14 — Limpieza («quita todo lo anterior», Luis):
  - Se retiraron las API heredadas sin uso: alias de iconos de Admin (`UI_ICON_ALIASES`), `variant` de color en `UiBadge` (solo `tone`) y las variantes `secondary`/`danger` de `UiButton` (`variant` = principal, contorno o discreto; el color va en `tone`).
  - `lab:build` rehace `lab/assets` entero; ya no quedan copias viejas, como un `favicon.svg`.
  - `../references/demo` borrado: su contenido vive actualizado en `packages/ui`. Copia en el scratchpad de la sesión (`backup/references-demo-2026-10-14.tgz`, sin `node_modules`). Se actualizaron `../AGENTS.md`, `project.md` y la decisión 001.
  - `UiSwitch` se queda: no lo usa ninguna app todavía, pero es parte del kit.
  - Typecheck de las tres apps aprobado.
- 2026-10-14 — Alineación exacta en las barras (revisión de Luis en Educators):
  - El raíl de pestañas ocupa lo mismo que un botón con su base: caja de `--ph-control` que se prolonga `--ph-depth` hacia abajo, con las pestañas de alto fijo.
  - Los botones pierden la línea de sombra suave de 2 px bajo la base. Era la única pieza con dos bases.
  - Medido en el planner de Admin a 1440 px: grupo, «Hoy», filtros, raíl y «Nuevo taller» de 92 a 135 px exactos.
- 2026-10-14 — Revisión de Luis:
  - `UiUserMenu`: el menú de la cuenta de Admin pasa al kit; Admin, Player y Educators lo usan, y ya no hay tres versiones.
  - El raíl de pestañas se distinguía poco del fondo de la página (`night-50` sobre `night-25`). Pasa a `night-150`, y la base de la pestaña elegida a `night-200`.
  - `UiAlert` admite cualquier tono (coral para lo que falta). La ranura de acción que se probó se retiró junto con el aviso de Educators.
- 2026-10-14 — Bases y pestañas (revisión de Luis):
  - La base y el contorno de toda pieza blanca elevada (botón neutro, filtro, grupo, pestañas, bandeja, HUD del runner) usan el color de las tarjetas (`--color-depth`, `night-100`). Antes usaban `night-200`, que no casaba con las tarjetas.
  - Pestañas: el raíl vuelve a `sunken` y lleva la ceja, como un botón; las pestañas son planas y la elegida es la cara blanca.
  - Medido en Educators (1024 px): grupo, «Hoy», raíl y tarjetas con la base `rgb(232, 235, 242)`; la barra sigue alineada de 89 a 141 px.
- 2026-10-14 — Navegación sin enlaces de vuelta («← Storyboards», «es horrible», Luis):
  - Retirados de Player (detalle) y Educators (cuenta, detalle del taller, cierre).
  - Regla nueva en `DESIGN.md` («Navegación») y en `.harness/project.md`.
  - `check-ui.mjs` rechaza un icono `arrow-left` en un enlace o en algo con destino. Probado con un archivo temporal: detecta las dos formas y deja pasar el «Anterior» del runner.
  - Los «Volver a…» dentro de un estado vacío (página no encontrada) se quedan: son la salida de un error.
- 2026-10-14 — `ui-appbar`: en la cabecera principal de cada app (una banda plana con borde inferior), los controles van sin ceja ni desplazamiento al pulsar; los neutros conservan su contorno.
  - Aplicado en Admin, Player y Educators.
  - Medido en Admin: los cuatro botones de la cabecera tienen la base a 0 px.
