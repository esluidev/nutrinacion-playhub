---
id: 002
estado: finalizada
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

Finalizada el 2026-11-03 por Luis. La revisión visual del relieve y de los roles de color queda aceptada al finalizar.

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
- 2026-10-28 — Luis pide la misma entrada en las tres apps, que diga en cuál entras y con menos texto. Toma como modelo la de Educators.
  - El kit suma `UiAuthShell`: logo con el nombre de la app y una tarjeta. Queda en `DESIGN.md` como familia «Entrada».
  - Las tres apps:
    - título «Entra con tu correo», una línea con lo propio de cada app, los campos sin marcadores ni asteriscos y «Entrar»;
    - pestaña «Entrar · Admin|Player|Educadores»; las demás páginas de Educators terminan en «· Educadores».
  - Se quitan la cabecera «PlayHub» y las notas al pie de Admin y Player, y la ayuda repetida bajo el PIN.
  - Admin dice en español «El correo o la contraseña no son correctos» (antes, el mensaje de Supabase en inglés).
  - Verificación:
    - typecheck de las tres apps; tests: Admin 52, Player 32 y Educators 26; check-ui y check-context: **aprobado**;
    - navegador: las tres entradas a escritorio y a 375 × 812, y en Admin los avisos con campos vacíos y con datos incorrectos.
- 2026-10-28 — Luis nota que los campos de Educators son más grandes que los de Admin y Player.
  - Medido: Admin y Player, campo de 40 y botón de 48 (`compact`, tamaño normal). Educators, 56 y 56 (`touch` y `size="lg"`).
  - Luis elige que `UiAuthShell` vaya siempre en densidad `touch`, con campos y botón en `lg`, en las tres apps. También aplica a restablecer e invitación de Admin. Anotado en `DESIGN.md`.
- 2026-10-28 — Luis: en `lg` los campos quedan grandes para sus etiquetas. La entrada sigue en `touch`, pero con campos y botón del tamaño normal (48) en las tres apps, incluidas restablecer e invitación de Admin.
- 2026-11-02 — Luis: la base inferior («efecto Duolingo») no es coherente. Unos elementos la llevan y otros no: el carril de pestañas con base se ve raro, y en la barra del planner «Ver: Todos» va plano junto a «Hoy» con base. Pide definir qué la lleva.
  - Inventario medido con las sombras calculadas en 11 páginas de Admin. Llevaban base piezas que no se pulsan: paneles, cifras, tablas, bandejas, carril de pestañas, día de hoy y página actual. Iban planos los desplegables de barra, que sí se pulsan.
  - Regla aplicada, la de Duolingo: **la base significa «esto se pulsa»**. Teclas con base: botones, filtros, desplegables de barra, grupos, tarjetas clicables y seleccionables, y los botones del HUD. Planos: paneles, tablas, cifras, bandejas, carril de pestañas, campos, desplegables de formulario, lo actual de un conjunto, la estructura de la app y las ventanas (solo sombra difusa). Escrita en `DESIGN.md` («Profundidad»), `TOKENS.md` y `PLAYER-DESIGN.md`.
  - Kit: sin `--shadow-panel`. `ui-panel-interactive` y `select-card` llevan base y bajan al pulsar; la tarjeta no baja si se pulsa un botón suyo. `UiSelect` `toolbar` pasa a ser un filtro con base, con el valor en tinta. Sin base: `ui-tabs`, `ui-tray`, `ui-day` de hoy, `ui-page` actual, `counter`, segmentos de progreso y `ui-feedback-symbol`. `--shadow-dialog` pierde la base de 8 px. Player: la escena y el participante del HUD quedan planos, con el contorno completo; Tiempo y Puntos conservan su base.
  - Comprobado con datos temporales, ya borrados: una organización, un superadmin, un storyboard, dos educadores y dos talleres. Recorrido de las mismas 11 páginas con las sombras calculadas: todas las teclas con base y todo lo demás plano. Revisados también a la vista el planner, Educadores, Inicio y el diálogo «Acceso y PIN» de Admin, la semana de Educators y el HUD del runner (`/play/alimentacion/el-huevo`).
  - `./scripts/verify.sh` **aprobado**: Admin 73, Player 50 y Educators 33 tests; typecheck y build de las tres; pgTAP PASS. La lámina compila (`tailwindcss`). **Pendiente:** la revisión visual de Luis.
- 2026-11-02 — Luis: la escena del HUD del runner («2/4») se rompió al quedar plana. Pregunta cómo se decide qué tarjetas llevan base, si los juegos usan tarjetas con base.
  - Corregido: `runner.css` vuelve a como estaba. La escena y el participante llevan su base, igual que el resto de la barra. La regla gana una condición: una pieza blanca del tamaño de un control, en una fila de teclas, lleva base aunque solo informe. Lo que va plano en una barra es gris (hundido), como el carril de pestañas. Escrita en `DESIGN.md` y `PLAYER-DESIGN.md`.
  - Cómo se decide: por el papel de la pieza, que es su clase. `ui-panel` es plano. `ui-panel-interactive` y `select-card` son teclas. En el juego, `tb-ficha` y `tb-carta` llevan base y `tb-ranura` y `tb-tapa` son huecos planos. `check-ui` impide que una vista ponga sombras propias. Hueco: nada comprueba que una tarjeta clicable use `ui-panel-interactive`.
  - El aviso «Cannot apply unknown utility class `shadow-panel`» que veía Luis en Player era residual. Nuxt lo guarda hasta recompilar el archivo que falló, `apps/player/app/assets/css/main.css`. Ocurrió entre dos ediciones del kit. Se borró actualizando la fecha de ese archivo. Admin y Educators estaban limpios.
  - En análisis, nada decidido: el buscador sigue blanco y plano junto a teclas blancas. Simulado en Admin con datos temporales, ya borrados: buscador blanco y plano, hundido en gris o blanco con base. La propuesta es campos hundidos en todo el kit. Capturas en el scratchpad de la sesión.
- 2026-11-02 — Luis: las pestañas no son consistentes con los otros controles. El margen de 4 px dentro del carril las hace más pequeñas y más redondeadas. Pide que no haya espacio entre el contenedor y ellas.
  - Probé un grupo blanco con base y la activa en noche. Luis lo rechazó: «se ven horribles». Pidió la activa en blanco y las inactivas del tono del contenedor.
  - Aplicado en `ui-tabs`: carril gris del alto y radio de un control, sin margen interior. Las pestañas llenan el carril con altura de control, radio 12 y letra 14. La activa va en blanco con el contorno de 1 px; las inactivas, en el gris del carril. Los filtros y el desplegable de barra pasan también a letra 14, la de los controles; `filter-sm` sigue en 12.
  - Medido en el planner: paso de fechas, «Hoy», «Ver: Todos», pestañas y «Nuevo Taller» empiezan en el mismo píxel, miden 40 y tienen radio 12. Revisado a la vista en el planner y Educadores de Admin, la semana de Educators y la guía del runner. Datos temporales borrados.
- 2026-11-02 — Luis: «elementos con borde inferior y otros no». En Educadores, las pestañas y el buscador iban planos junto a «Estado: Todos» y los botones con base. Pregunta si los cambios se hacen por app.
  - Todos los cambios están en `packages/ui`. Ningún archivo de una app quedó modificado; el del HUD de Player se devolvió a su estado anterior. El desorden lo causó la regla «la base solo en lo que se pulsa», que dejaba planos campos y pestañas.
  - Regla vigente, la que pidió Luis desde el principio: **todo control lleva base**, y lo que contiene va plano. Llevan base botones, filtros, desplegables, campos, área de texto, buscador, grupos, pestañas y tarjetas que se pulsan o se eligen, con el mismo contorno de 1 px y la misma base. Van planos paneles, tablas, tarjetas informativas y bandejas. La cabecera y la barra lateral siguen planas. La excepción es el hueco discontinuo «Agregar». `DESIGN.md` «Profundidad» quedó reescrita; `TOKENS.md`, `tokens.css` y los comentarios del kit van alineados.
  - Kit: `.field` y `.search-box` pasan del borde de 2 px plano al contorno de 1 px con base. Al enfocarlos, contorno y base toman el tono, con su halo. `ui-tabs` lleva la base de todo control. En la cabecera, campos, buscador y pestañas siguen planos.
  - Recorrido automático con datos temporales, ya borrados. En cada página se marcan las piezas del alto de un control sin base y las superficies con base. Admin: 31 rutas de organización y Platform; Player: catálogo y detalle; Educators: semana, cuenta, detalle y cierre de un taller. Resultado: sin hallazgos, salvo el hueco «Agregar». Las áreas de texto llevan base como los demás campos. Capturas en el scratchpad de la sesión.
- 2026-11-02 — Luis: con base, los campos «parecen cards». Deben ser solo borde, como antes. El problema era que, junto a botones con base, los botones se ven más altos.
  - Corregido en el kit. Los campos (`.field`, `.search-box`, desplegables de formulario y de barra) vuelven a blanco con borde de 2 px y sin sombra. Ahora miden `--ph-control` más la base (43 en compacta, 52 en táctil). Un margen negativo deja su caja en `--ph-control`, como la del botón, cuya base cuelga fuera. `UiSelect` vuelve a su versión anterior. Las áreas de texto no cambian. En la cabecera, los campos miden `--ph-control`, como sus botones planos. El icono de `field-with-icon` se recentra. El autocompletado del navegador pasa de `apps/admin/app/assets/css/main.css` al kit, para las tres apps. Descartadas tras simularlas: campos grises y campos con sombra interior.
  - Medido en Admin, con el borde de arriba y el de abajo de cada control y la base incluida. Planner: paso de fechas, «Hoy», «Ver: Todos», pestañas y «Nuevo Taller» de 92,0 a 135,0. Educadores: pestañas, buscador y «Estado: Todos» de 178,8 a 221,8. En la fila «Agregar miembro» de un grupo, alineada abajo, desplegable y botón van de 777,5 a 820,5. `DESIGN.md`, `TOKENS.md` y `tokens.css` quedan con esta regla.
- 2026-11-02 — Luis: los desplegables, junto a la orilla de la pantalla, se salen y abren el desplazamiento horizontal. Ejemplo: «Estado: Todos» en Educadores.
  - Kit, `UiSelect`: antes de pintarse, el menú mide si cabe. Se alinea a la derecha del botón si a la derecha se saldría, y se abre hacia arriba si abajo no cabe y arriba hay más sitio. Si no cabe en ninguno de los dos, ajusta su alto. Al enfocarse no desplaza la página, y si la ventana cambia se vuelve a colocar. `.ui-listbox` nunca supera el ancho de la ventana. Los menús de Reka ya evitaban la orilla y el menú de cuenta ya se abría a la derecha.
  - En la misma revisión: a 375 px, Educadores y Storyboards de Admin se desbordaban por la fila del buscador y el filtro, con el menú cerrado. Esa fila ahora baja a su propia línea y el buscador cede el ancho.
  - Comprobado con datos temporales, ya borrados. A 1280 px, el menú de «Estado: Todos» termina en el borde derecho del botón, sin desplazamiento. Con 270 px de alto, se abre hacia arriba con 6 px de separación. A 375 px, recorrí 25 rutas de organización y Platform abriendo cada desplegable: ninguna página se desborda y ningún menú sale de la pantalla.
- 2026-11-02 — Luis: el arreglo para teléfono lo empeoró en escritorio; el control entero se salía de la pantalla. El buscador había quedado fijo en 320 px y empujaba al filtro (a 1000 px: 86 px fuera). No lo había medido en escritorio después del cambio.
  - Corregido en Educadores y Storyboards de Admin. El grupo del buscador y el filtro ocupa lo que queda de la línea, a la derecha, y solo baja a la suya si no le quedan 320 px. El buscador se encoge hasta 320 y el filtro conserva su ancho.
  - Medido con datos temporales, ya borrados, en 10 rutas con barras de organización y Platform. Anchos: 375, 640 y 768; 1000 con la barra lateral abierta; 1100, 1280 y 1440 con la barra cerrada. Ninguna página se desborda y ningún control sale de la pantalla. A 1100 px, el filtro termina en el borde del contenido y su menú se abre alineado con él.
- 2026-11-03 15:05 — Corrección del pendiente: la regla de relieve del 2026-11-02 no está sin commit, quedó en `3a11bdd`. Cambios de hoy al kit, autorizados y subidos: `4b224fd` (las pestañas `fit` no pasan del ancho de su contenedor; en el teléfono se estrechan y, si no caben, el texto va en dos líneas) y `08c7d85` (el pie de panel en blanco; regla en `DESIGN.md` «Roles de color»: una franja de lado a lado de un panel no va en el color de la página). `verify.sh` **aprobado** en los dos.
- 2026-11-03 15:06 — Luis: «finaliza todo y quita cosas del backlog, ordena las tareas». Finalizada; lo que quedaba abierto pasa a las tareas 012–015 (ver «Pendientes y siguiente paso»).
