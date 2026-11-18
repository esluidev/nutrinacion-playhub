---
id: 019
estado: haciendo
prioridad: alta
creada: 2026-11-17
---
# Todo el contenido, solo desde Player

## Objetivo

Que el contenido se gestione en un solo lugar. Hoy un storyboard se registra y se publica en Player, pero su guía se copia a mano en Admin › Platform, escena por escena y en cada idioma. Luis quiere que el registro, la corrección y la publicación estén solo en Player y que un modelo pueda hacer ese mismo proceso ([decisión 013](../docs/decisions/013-contenido-solo-desde-player.md)).

## Alcance

Decisiones de Luis (2026-11-17):

- Player registra, publica, actualiza y cambia los datos, también la guía. Admin solo muestra la lista de storyboards y sus detalles.
- La guía no es un archivo del storyboard: se escribe fuera, se pule y pasa a la base; desde ahí se corrige en Player.
- Un modelo también podrá hacerlo. El medio (un MCP u otro) está por decidir.

Fuera: la estructura de los textos y la narración del JSON de cada escena (lo siguiente que pidió Luis) y la escena de Despedida del huevo, que falta en el storyboard.

## Criterios de aceptación

- [x] En Player se escribe la cabecera de la guía y la guía de cada escena, en cada idioma.
- [x] Player elimina un storyboard de la base (lo que está sin JSON en este build); la base lo frena si ya hay workshops. Sin probar en el navegador: no hay ninguno así en la base local.
- [x] Platform solo muestra: sin «Editar», sin editar la guía y sin «Eliminar»; «Editar en Player» lleva al mismo storyboard o a la misma escena en Player.
- [x] Probado en el navegador con la cuenta de superadmin: guardar la cabecera y una escena en Player y verlas en Platform. La guía de Educators no se probó: lee la base con `educador_guia`, que no cambió.
- [ ] Un modelo puede registrar, escribir la guía y publicar un storyboard sin pasar por la interfaz.

## Plan

### Tocar

- Player: `composables/useCatalogoBase.ts`, `utils/catalogoResumen.ts`, `pages/storyboards/` (la lista, el detalle y `[id]/guia/`).
- Admin: `composables/usePlatformStoryboards.ts`, `pages/platform/storyboards/`, `i18n/messages.ts`.
- Documentación: decisiones 006, 007 y 013, `AGENTS.md` de Player y Admin, `docs/architecture.md`, `docs/backend.md`, `docs/glossary.md`, `.harness/project.md`.

### Verificar

`npm run typecheck && npm test && npm run build` en `apps/player` y `apps/admin`; desde la raíz, `node scripts/check-ui.mjs` y `node scripts/check-context.mjs`. QA en el navegador con el superadmin (Player en 3001, Admin en 3000; las levanta Luis).

## Pasos

- [x] La guía y el borrado, en Player.
- [x] Platform, solo para ver.
- [x] Decisión 013 y documentación.
- [x] QA en el navegador.
- [ ] Acceso de un modelo al proceso.

## Pendientes y siguiente paso

- Elegir con Luis cómo entra un modelo: qué herramientas (estado, registrar o actualizar, escribir la guía, publicar) y con qué sesión.
- Eliminar un storyboard que sí está en el build (uno registrado por error) no tiene botón: hoy solo se archiva. Añadirlo si hace falta.

## Log

- 2026-11-17 · La edición de la guía pasa de Platform a Player tal como era: la cabecera (`[id]/guia`) y las doce secciones de cada escena (`[id]/guia/[carpeta]`), con pestañas por idioma y anterior/siguiente. «Eliminar» pasa a la sección «En la base, sin JSON en este build». Platform queda solo para ver: la página de editar desaparece, la de la escena pasa a lectura y el detalle y la escena llevan «Editar en Player». Player deja de leer `configuracion.admin_url`. Se quitan los textos de Admin que ya no usa nada.
- 2026-11-17 · `apps/player`: `npm run typecheck` aprobado; `npm test` aprobado (12 archivos, 195 pruebas, con las nuevas de `textoPorIdioma` y del borrado frenado por workshops). `apps/admin`: `npm run typecheck` aprobado; `npm test` aprobado (7 archivos, 77 pruebas). Raíz: `check-ui` y `check-context` aprobados.
- 2026-11-17 · QA en el navegador, con la base local y la cuenta de superadmin de Luis (Player en 3001, Admin en 3000). Player: la cabecera guarda y vuelve al detalle; la guía de Origen guarda y sigue en el campo; con anterior/siguiente cada escena carga la suya (Origen la guardada, Bienvenida «Situar», Descubrimiento vacía); el lápiz sale solo en las 4 escenas que están en la base (el huevo sigue desactualizado allí: 4 escenas en la base, 8 en el JSON; no se actualizó). Platform: la lista sin editar ni eliminar; el detalle con la marca de prueba en Público y «Editar en Player» al detalle en Player; la escena en lectura, sin campos ni «Guardar», con «Editar en Player» a `/guia/origen`. La base local confirmó los dos guardados con `psql`. Las marcas se quitaron después desde Player: Público vuelve a «Niños» y el verbo de Origen queda en null, como antes (un campo en blanco borra). Aprobado. No probado: la guía en Educators y «Eliminar» (no hay storyboards en la base sin JSON en este build).
- 2026-11-18 · Luis: la lista de Player estaba sobrecargada; todo lo de un storyboard se hace en su detalle. La lista queda con el buscador, los filtros «Categoría» y «Estado» como desplegables (los chips y el contador se van) y la tabla Storyboard · Categoría (antes «Eje») · Edición · Estado · Países · Guía. Se quitan «Releer la base» (la página lee la base al entrar; si falla, el aviso trae «Volver a leer»), «Registrar el pendiente», y «Actualizar» y «Probar» de cada fila. El kit: el menú de un filtro de barra (`UiSelect` `toolbar`) lleva arriba la leyenda de lo que filtra, en las tres apps. `apps/player`: `npm run typecheck` aprobado; `npm test` aprobado (12 archivos, 198 pruebas, con las de `pasaFiltroEstado`).
- 2026-11-18 · QA de la lista en el navegador (Player en 3001, base local). En el panel estrecho «Desactualizado» se montaba sobre las banderas: la tabla del kit reparte el ancho a partes iguales, así que cada columna lleva un ancho fijo según lo que muestra; por debajo de unos 960 px la tabla se desplaza de lado en vez de aplastar el título. A 1280 × 800 cabe todo. Los dos filtros abren su menú con la leyenda arriba («Estado», «Categoría»); «Sin registrar» deja la tabla vacía con su aviso y «Publicado» devuelve El huevo; la fila abre el detalle, que dice «Categoría» en vez de «Eje». Sin errores en la consola. Aprobado. No probado: la leyenda en los filtros de Admin (mismo componente).
