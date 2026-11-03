---
id: 011
estado: finalizada
prioridad: alta
creada: 2026-10-28
---
# La organización como única unidad de operación

## Objetivo

Quitar peso a la plataforma: desaparecen las comunidades y los participantes. Una organización tiene sus educadores (con sus grupos), sus colaboradores, sus talleres, los storyboards disponibles y el planificador, y nada más. Este archivo es el análisis que pidió Luis el 2026-10-28: cómo queda la base y qué cambia en Admin, Educators y Player. **No es una decisión tomada**: lo que hay que decidir está en «Decisiones» y se registra en una decisión 011 cuando Luis lo confirme.

## Qué hace hoy la comunidad, y a dónde va cada cosa

La comunidad es el tenancy operativo (decisiones [005](../docs/decisions/005-base-nueva-y-acceso-educador.md) y [007](../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)). Cada papel que cumple tiene un destino en el modelo simple:

| Hoy lo hace la comunidad | Queda así |
|---|---|
| Decide el **país**, y con él qué storyboards estándar se pueden usar | `organizaciones.pais`, obligatorio. Una organización opera en un país; la licencia deja de llevar `paises` |
| Es el **cupo** de la licencia | La licencia queda como contrato: vigencia, estado y notas. Sin cupos (la [decisión 010](../docs/decisions/010-licencia-solo-cupo-de-comunidades.md) ya dejó solo este) |
| Dónde se **ligan los educadores** (`comunidad_educadores`, activo por comunidad) | El educador es de la organización y ya tiene `activo` y `deleted_at`: sobran la tabla puente y el interruptor por comunidad |
| Dónde viven los **grupos de educadores** y los **talleres** | Pasan a la organización (`organizacion_id` en vez de `comunidad_id`) |
| El ámbito de los **colaboradores** | Colaborador de la organización: opera educadores, talleres y planificador; no toca licencia, administradores ni colaboradores |
| El **código de acceso** con que las familias se unen desde la app del hogar, y los **participantes** | Ver «Decisiones», punto 1 |

## Modelo propuesto

Hoy hay 31 tablas; quedan 21. Lo que no se nombra no cambia.

### Se queda igual

`configuracion`, `paises`, `tipos_organizacion`, `plantillas_correo`, `perfiles`, `organizacion_administradores`, `storyboards`, `guias`, `guia_escenas`, `educadores`, `jornadas`, `workshop_feedback`, `educador_sesiones`. Las funciones de Player (`sincronizar_storyboard`, `publicar_storyboard`), las de acceso del educador (entrar, activar, PIN, sesión, código) y `recuperacion_autorizar` (cambia solo la consulta de colaboradores).

### Cambia

| Tabla | Cambio |
|---|---|
| `organizaciones` | `pais` obligatorio (referencia a `paises`). Fuera `perfil_publico`, `descripcion_publica` y `logo` si sale el hogar |
| `organizacion_licencias` | Fuera `max_comunidades` y `paises`. Queda `estado`, `fecha_inicio`, `fecha_fin`, `notas` |
| `comunidad_colaboradores` → `organizacion_colaboradores` | `organizacion_id` en vez de `comunidad_id`; conserva `activo`. Único por organización y perfil |
| `invitaciones` | Fuera `comunidad_id` y el check de colaborador |
| `educador_grupos` | `organizacion_id` en vez de `comunidad_id` |
| `educador_grupo_miembros` | La regla «solo educadores de la misma organización» pasa a una FK compuesta a `educadores (id, organizacion_id)`; fuera el trigger que copiaba la comunidad |
| `workshops` | `organizacion_id` en vez de `comunidad_id`; `unique (id, organizacion_id)`. `grupo_asistente` (texto, «2.º B») se queda: dice quién asiste sin registrar a nadie |
| `workshop_educadores` | `organizacion_id` en vez de `comunidad_id`; FK compuesta a `educadores (id, organizacion_id)` (hoy a `comunidad_educadores`) |
| `educador_ficha` / `educador_sesion` | Devuelven las organizaciones sin la lista de comunidades |
| `educador_workshops` | Filtra por las organizaciones del educador |
| Disponibilidad del catálogo | Publicado y (estándar con `organizaciones.pais` en `paises_disponibles`, o personalizado de la organización). Misma regla de hoy con el país de la organización |
| `mis_comunidades()` → fuera; `organizaciones_visibles()` | Las que administro más las que opero como colaborador |
| `platform_uso` | Sin comunidades ni participantes: educadores, talleres, personalizados, jornadas, educadores sin acceso, próximos talleres y última actividad |
| `platform_eliminar_organizacion` | Más simple: ya no hay comunidades que recorrer |
| Edge Function `canjear-invitacion` | Colaborador → `organizacion_colaboradores` |

### Se va

- `comunidades`, `comunidad_educadores`; triggers `comunidades_valida_cupo`, `comunidades_valida_pais`, `comunidad_educadores_valida`, `fija_comunidad_del_grupo`, `fija_comunidad_del_workshop`; `platform_comunidades`.
- **Si sale el hogar (recomendado, ver «Decisiones»):** `temarios`, `temario_storyboards`, `organizacion_publicaciones`, `hogares`, `hogar_sesiones`, `hogar_perfiles`, `comunidad_participantes`, `hogar_perfil_avance`, las 20 funciones `hogar_*`, `comunidad_generar_codigo_acceso`, `organizacion_actualizar_perfil_publico`, `edicion_de_edad`, `licencia_vigente` y `puedo_editar_temario`; `codigo_acceso` de la comunidad desaparece con ella.

### Cómo se aplica

Dos caminos:

- **A. Reescribir la base** (recomendado): un juego nuevo de migraciones, más corto, que es el que irá al proyecto de la nube. No hay proyecto en la nube todavía y la base local de QA tiene dos usuarios, una organización y un educador: se recrean en minutos con los pasos del [README de Supabase](../supabase/README.md). Es el mismo camino que tomó la decisión 005.
- **B. Migración `0013`** con los `drop`, `rename` y `alter`: conserva el historial local, pero deja un esquema con cicatrices y trece archivos que explicar en un proyecto nuevo.

Con A, seed y pruebas pgTAP se reescriben a la vez (hoy 939 líneas en 6 archivos; `05_hogar` desaparece y el resto se acorta).

## Qué cambia en las apps

### Admin (la que más cambia)

Hoy tiene tres contextos excluyentes (Platform, organización y comunidad) y 92 archivos, 51 de ellos con comunidad. Queda con **dos contextos**: Platform y organización. El selector elige solo la organización; el colaborador entra en la suya con la navegación recortada.

| Qué | Hoy | Queda |
|---|---|---|
| Navegación de la organización | Inicio, Comunidades, Administradores, Jornadas, Para casa | Inicio, Talleres, Planificador, Educadores, Colaboradores, Storyboards, Jornadas, Administradores, Licencia |
| Páginas que desaparecen | `organizacion/comunidades/*` (3), `dashboard/participantes`, `dashboard/casa`, `organizacion/casa`, `dashboard/configuracion` (era de la comunidad: código de acceso y datos), `dashboard/index` (su contenido pasa al inicio de la organización) | — |
| Páginas que se mueven a `/organizacion` | `dashboard/educators/*` (4), `dashboard/colaboradores/*` (2), `dashboard/workshops/*` (3), `dashboard/planner`, `dashboard/storyboards/*` (2), `dashboard/perfil` | Mismas vistas, con la organización como ámbito |
| Platform | El detalle de la organización pierde el panel de comunidades y sus cifras; la licencia pierde cupo y países; el alta de organización pide el país | |
| Composables que se van | `useComunidades`, `usePublicaciones` | |
| Composables que cambian | `useContexto` (el mayor: 61 menciones), `useEducators` (sin tabla puente ni «activo en esta comunidad»), `useWorkshops`, `useWorkshopWizard`, `usePlanner`, `useColaboradores`, `useOrganizacion`, `usePlatform`, `useStoryboards` (disponibilidad por el país de la organización), `useAuth` (árbol de acceso), `useSidebar` | |
| Componentes | Fuera `ContenidoCasa`; `LayoutSidebar`, `LayoutHeader` y el selector con una sola navegación operativa | |
| Textos | `messages.ts`: fuera los bloques de comunidades, participantes y «Para casa» (48 menciones) | |

Tamaño: se borran unos 10 archivos de páginas, 2 composables y 1 componente (unas 2.500 líneas de 15.000) y se tocan unos 25 archivos más. Es la oportunidad de pasar a i18n las vistas que siguen en español fijo (tarea 008), porque se reescriben de todos modos.

### Educators (cambio pequeño)

9 de 31 archivos nombran la comunidad, siempre como dato que se muestra: la ficha de la sesión (`utils/sesion.ts`), «dónde trabaja» en `cuenta.vue`, la comunidad en `TallerTarjeta`, `TallerAcciones` y el detalle del taller, el mapeo en `useTalleres` y `utils/talleres.ts`, y los textos. En todos, la comunidad pasa a ser la organización. Entrar, activar, el PIN, el runner incrustado, el cierre y el feedback no cambian.

### Player (sin cambios de código)

Ningún archivo de Player nombra la comunidad. El runner no usa la base; `sincronizar_storyboard` y `publicar_storyboard` siguen igual (países y organización del personalizado). El modo `home` del runner se queda como modo (no toca la base). Solo cambia documentación (`docs/backend.md`, `docs/runner.md`).

### Kit

`UiUserMenu` nombra la comunidad en un texto: se ajusta.

### Documentación y decisiones

- Decisión 011 nueva, que sustituye en parte a la 005 (comunidad como tenancy), la 007 (modelo del hogar) y la 008 (`platform_comunidades`).
- Constitución (`../product/01 - Constitucion de producto.md`): habla de comunidades en «organiza comunidades, personas, fechas y alcance» (:383), «operación de una organización o comunidad» (:388), «programa talleres para comunidades o grupos cuando existen» (:415), «nivel de grupo, comunidad o jornada» (:436) y la señal de continuidad «por comunidad» (:447); la licencia «fija cuántas comunidades puede abrir» (:215). Los papeles «Participante» y «Familia o cuidador» (:397–410) siguen siendo producto, aunque la base no los registre: «No exige registrar participantes» (:480) ya lo decía.
- `docs/backend.md`, `docs/architecture.md`, `supabase/README.md`, los `AGENTS.md` de Admin y Educators y `.harness/project.md`.

## Ajustes de Luis (2026-10-28)

- **La organización opera en varios países**, no es «de» un país: `organizaciones.paises text[]` (uno o más). Un storyboard estándar está disponible si está publicado en alguno de ellos; uno personalizado, si es de la organización. Sustituye al punto 3 de «Decisiones».
- **Fuera el hogar entero**, también «Para casa» en Admin. Punto 1 aceptado.
- **Las jornadas se quedan, pero no como módulo:** una jornada es agrupar los talleres que se quieren en un día o varios y en un horario. Análisis abajo.
- Player: además de quitar la comunidad, revisar cómo se registra un storyboard en la base y rehacer la presentación del detalle.

## Jornadas: qué son hoy y dónde deberían vivir

**Hoy.** `jornadas` tiene nombre, descripción, enfoque de salud, fecha de inicio y fin (`0004:81-92`); un taller apunta a una jornada opcional (`workshops.jornada_id`, `set null` al borrarla) y la base solo comprueba que sea de la misma organización. En Admin es un **módulo aparte**: la entrada «Jornadas» del menú de la organización abre una tabla con alta, edición y borrado en un diálogo (`organizacion/jornadas.vue`, 29 menciones). Desde la operación solo aparece como un desplegable «Jornada (opcional)» en el paso de programación del asistente y en el detalle del taller. **El planificador no sabe que existen** (`usePlanner` y `Planner*.vue`: 0 menciones), la lista de talleres no agrupa por jornada y **el educador no la ve** (`educador_workshops` no la devuelve). Resultado: hay que crear la jornada en un sitio, y luego acordarse de asignarla taller por taller en otro, sin ver nunca el conjunto.

**Propuesta: la jornada vive en el planificador y en los talleres.**

| Dónde | Qué |
|---|---|
| Base | `jornadas` conserva nombre, descripción, enfoque (opcional) y fechas; **fechas obligatorias** (puede ser un solo día) y se añaden `hora_inicio` y `hora_fin` opcionales y `ubicacion`. Un taller dentro de una jornada **tiene que caer en sus días** (trigger); si la jornada cambia de fechas y deja talleres fuera, la base lo rechaza. Gestionan las jornadas quienes operan la organización (admins y colaboradores), no solo los admins |
| Planificador | Es su casa. En la vista de semana, una **banda** bajo las fechas por cada jornada de esa semana, que abarca sus días; en la de mes, la marca en sus días. Junto a «Nuevo taller», **«Nueva jornada»**: nombre y días. Al pulsar la banda se abre el panel de la jornada: datos, sus talleres y «Agregar taller», que abre el asistente con la jornada y la fecha ya puestas. El desplegable «Ver» gana «Por jornada» |
| Talleres | La lista agrupa por jornada cuando la hay (cabecera con nombre y días); el detalle muestra «Jornada «X» · 12–13 nov» y permite cambiarla |
| Asistente | En «Programación», al elegir una fecha que cae dentro de una jornada, se propone esa jornada; si se entra desde la jornada, la fecha se limita a sus días |
| Menú | Desaparece la entrada «Jornadas» y su página |
| Educators | El taller muestra el nombre de su jornada (tarjeta y detalle); `educador_workshops` la devuelve |
| Player | Nada |

Lo que se gana: la jornada se crea donde se programan los talleres, se ve como conjunto y el educador sabe que ese taller es parte de una jornada. Lo que cuesta: la banda en el planificador (vista de semana y de mes) es la pieza nueva; el resto es mover lo que ya existe.

## Decisiones

Lo que tiene que decidir Luis; cada punto lleva mi recomendación.

1. **El bloque del hogar sale con las comunidades.** Los participantes son el puente entre una familia de la app del hogar y una comunidad (código de acceso, perfiles, avance, temarios y publicaciones «Para casa»). Sin comunidades ni participantes, ese bloque no tiene a qué engancharse y es la mitad del peso de la base (8 tablas, 20 funciones) y de la operación de la comunidad en Admin («Para casa», participantes, código). **Recomiendo quitarlo entero ahora** y, cuando la app del hogar toque, diseñarla sobre el modelo simple (por ejemplo, unirse a una organización con un código de la organización). La alternativa, dejarlo dormido enganchado a la organización, obliga a reescribirlo igual y lo arrastra por todo el QA.
2. **Reescribir la base** (camino A) en vez de una migración `0013`.
3. **Una organización, un país.** Es lo que vuelve simple la disponibilidad del catálogo. Si algún día una organización opera en dos países, el país puede bajar al taller; hoy no hace falta.
4. **Las jornadas se quedan.** Ya son de la organización, no pesan y son donde la constitución dice que se materializa el enfoque de salud. Si no se usan en el QA, se quitan después sin tocar nada más.

## Camino propuesto

1. Decisión 011 y la constitución.
2. Base: migraciones nuevas, seed, pgTAP, tipos, Edge Functions.
3. Admin: contexto a dos niveles, mover la operación a la organización, borrar lo que sobra, i18n de paso.
4. Educators: la organización en lugar de la comunidad.
5. Documentación, `verify.sh` y el QA de Luis desde cero (`db reset --no-seed` y los pasos del README).

Cada paso es una entrega con su verificación; Admin y Educators pueden ir en paralelo cuando la base esté.

## Criterios de aceptación

- [ ] Luis decide los cuatro puntos de «Decisiones».
- [ ] La base no tiene comunidades ni participantes y pasa pgTAP sin seed (pruebas que crean sus datos).
- [ ] Admin opera una organización completa sin ningún concepto de comunidad; el colaborador ve solo la operación.
- [ ] Educators muestra la organización donde mostraba la comunidad y el runner incrustado sigue igual.
- [ ] Player compila y publica sin cambios; `verify.sh` en verde.

## Plan

### Leer

`supabase/migrations/0001`–`0012`, `0005_rls.sql` (helpers y políticas), `0006` (ficha y workshops del educador), `apps/admin/app/composables/useContexto.ts`, `useEducators.ts`, `useWorkshops.ts`, decisiones 005, 007 y 008.

### Tocar

Lo listado en «Modelo propuesto» y «Qué cambia en las apps».

### Verificar

`supabase db reset --no-seed` y `supabase test db` (pruebas nuevas), `./scripts/verify.sh`, y en el navegador: alta de organización con país → licencia → invitar administrador y colaborador (enlace copiado) → educadores y grupo → taller con grupo → planificador → Educators entra, ve la organización y abre el runner.

## Pendientes y siguiente paso

Finalizada el 2026-11-03 por Luis. El borrado no atómico de una jornada pasa a la [tarea 015](015-pendientes-de-admin-y-educators.md) (punto 4).

## Log

- 2026-10-28 — Luis acepta quitar comunidades, participantes y el hogar entero, con dos ajustes: la organización declara en qué **países opera** (varios) y las jornadas dejan de ser un módulo para ser la forma de **agrupar talleres en días y horario**, dentro del planificador. Pide además revisar en Player el registro del storyboard y el detalle. Autoriza reescribir la base y borrar los datos locales. Análisis de jornadas añadido; pendiente de su visto bueno antes de tocar la base.
- 2026-10-28 — Análisis a petición de Luis durante su QA: quitar comunidades y participantes y dejar la operación en la organización. Medido en el código: 31 tablas (quedan 21), Admin 51 de 92 archivos con comunidad, Educators 9 de 31 (solo como dato mostrado), Player 0. Recomendaciones: sale también el bloque del hogar, se reescribe la base, una organización tiene un país, las jornadas se quedan.
- 2026-10-28 — Luis da el visto bueno a las jornadas en el planificador: arranca la reestructuración. [Decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md) registrada.
  - **Base** (revisor): migraciones `0001`–`0010` reescritas (fuera `0009_hogar`, `0011` y `0012`, fundidas); `organizaciones.paises` (≥1, códigos activos), licencia sin cupos ni países, `organizacion_colaboradores`, educadores con FK compuestas `(id, organizacion_id)`, jornadas con fechas obligatorias, horario y ubicación, talleres por organización que caen en los días de su jornada (`workshops_valida`, `jornadas_valida_fechas`), `disponible_para_organizacion`, `organizaciones_opero`, `paises_opero`, `platform_uso` sin comunidades, `educador_workshops` con `organizacion` y `jornada`. Seed y fixture de Educators adaptados; pgTAP autocontenidas: 01 (77), 02 (48), 03 (50), 04 (43), 05 (22) = **240, aprobado** con y sin seed. Tipos regenerados sin `comunidad`, `hogar`, `temario`, `participante`. Reglas decididas por el revisor: los archivados no bloquean las fechas de la jornada; reducir `organizaciones.paises` no se bloquea aunque deje talleres publicados sin storyboard disponible (pendiente de decidir).
  - **Player** (revisor): lista como tabla (estado frente a la base, publicación, guía por idioma, registrar/actualizar en la fila, «Registrar N pendientes»), sección «En la base, sin JSON en este build» con archivar, detalle rehecho (cabecera con estados y «qué toca ahora», una acción en lima, «Lo que viene del JSON» con diferencias campo por campo, «Publicación», «Guía» con «Abrir en Admin» si `configuracion.admin_url` se lee), errores de la base traducidos. `utils/catalogoResumen.ts` nuevo con tests. Typecheck, 50 tests, build y check-ui: **aprobado**. Visto en el navegador con el seed (lista y detalle de «El huevo», «La soda» sin JSON).
  - **Documentación:** `docs/backend.md` reescrito al modelo nuevo; `docs/architecture.md`, `docs/glossary.md`, `docs/runner.md`, `.harness/project.md`, `README.md` y `apps/player/AGENTS.md` al día.
  - En marcha: Admin (dos contextos, operación en la organización, jornadas en el planificador, invitaciones con enlace) y Educators (organización y jornada), en paralelo contra la base con seed.
  - **Educators** (revisor): `Taller.organizacion` y `Taller.jornada` (`tallerDesdeBase` y, en demo, `tallerDesdeFixture` con días relativos), `rangoDeDias` («25 oct – 13 nov»), la línea de la jornada en la tarjeta y la cabecera del taller, la organización en la ventana, el layout y la cuenta; `EDICION` y las etiquetas del kit a i18n; `taller.antes2` ya no promete un código. Typecheck, 32 tests, build y check-ui: **aprobado**; navegador a 1024×768 y 375×812 con el seed (semana con la jornada, detalle con y sin jornada, cuenta), también en inglés.
  - **Admin** (revisor): dos contextos (`useContexto`, `useAuth`, `useSidebar`); `/dashboard/*` movido a `/organizacion/*` (con `git mv`, sin commit); borradas comunidades, participantes, «Para casa», configuración y el módulo de jornadas; inicio de la organización con licencia, países, cifras, próximos talleres y primeros pasos; educadores sin tabla puente, grupos con detalle (`educators/grupos/[id]`: editar, borrar, miembros); planificador con `JornadaDialog`, `JornadaPanel`, bandas por semana, marcas por mes, «Nueva jornada» y «Por jornada»; asistente que propone la jornada por fecha y exige grupo con educadores; lista de talleres agrupada por jornada; detalle con cambiar jornada y asignar grupo; invitaciones con `InvitacionEnlace`, «Copiar enlace» y «Revocar» (A1 y A2 de la tarea 010); Platform con `PaisesSelector` y licencia sin cupos; `utils/jornadas.ts` con tests; todo lo tocado en i18n. Resuelto el embed ambiguo de PostgREST (FK directa y compuesta a `educadores`) nombrando la FK. Typecheck, 61 tests, build, check-ui y check-context: **aprobado**; navegador como superadmin, admin y colaborador con el seed (datos «QA …» borrados después).
  - **Verificación final:** `./scripts/verify.sh` **aprobado** (contexto, kit, typecheck + tests + build de las tres apps, pgTAP 240 en 5 archivos). Pasada propia en el navegador: Player (lista y detalle), Admin (Platform con países, inicio de la organización, planificador con la banda y el panel de la jornada, educadores, colaboradores). Base dejada **sin seed**: 10 migraciones, 21 tablas, 0 organizaciones, 0 usuarios, 9 países.
  - **Pendiente de Luis:** el QA manual desde cero (pasos en `supabase/README.md`), la constitución de producto (frases que nombran comunidades: tarea 010, sección «Documentación»), y decidir si reducir `organizaciones.paises` debe bloquearse cuando deja talleres publicados sin storyboard disponible. Sin commits.
- 2026-11-01 — Antes de los commits, Luis cuestiona la jornada: si cada taller ya tiene día y hora, ¿qué aporta? Análisis por escenarios: no aporta nada para ejecutar (el educador va por día y hora); su valor es planificar un evento en un lugar y unos días. Luis decide: **la jornada es nombre, lugar y días; no tiene área propia, se crea o se elige al programar un taller**, y sus talleres heredan su lugar.
  - Base: `jornadas` sin `hora_inicio`, `hora_fin` ni `enfoque_salud`; `ubicacion` obligatoria; `workshops.ubicacion` es el detalle dentro de una jornada; trigger `jornadas_borra_vacia` (se borra sola al quedarse sin talleres). Encontrado y corregido un fallo que ya existía: borrar una jornada con un taller archivado fallaba porque el `set null` tocaba el archivado (`workshops_valida_estado` ahora lo permite solo para soltarlo de la jornada). `educador_workshops` manda el lugar de la jornada. Seed, fixture y pgTAP (03: lugar obligatorio, borrado al quedarse vacía, borrar a mano): **244, aprobado** con y sin seed. Tipos regenerados.
  - Educators: `Jornada.ubicacion` y `lugarDelTaller` («Sede central · Aula 3A») en `Taller.lugar`; 33 tests y typecheck **aprobado**.
  - Admin (revisor, en marcha): selector «¿Es parte de una jornada?» en el asistente y en el detalle del taller, «Crear y agregar otro a esta jornada», ampliar la jornada si la fecha cae fuera, sin propuesta automática por fecha; fuera «Nueva jornada» del planificador y del inicio y el filtro «Por jornada».
  - **Admin** (revisor): `JornadaSelector` («¿Es parte de una jornada?»: suelto, en curso o nueva, con `JornadaCampos`) en el asistente y en «Cambiar jornada» del detalle; «Crear y agregar otro a esta jornada»; ampliar la jornada si la fecha cae fuera (confirmación); sin propuesta automática por fecha; el lugar efectivo en listas, revisión y planificador; fuera «Nueva jornada» del planificador y del inicio y el filtro «Por jornada»; `JornadaDialog` solo edita. `utils/jornadas.ts`: `jornadasEnCurso`, `lugarDelTaller`, `ampliarJornada`, `rangoJornada`. Typecheck, 66 tests, build, check-ui y check-context: **aprobado**; recorrido en el navegador (suelto, nueva, crear otro, banda y panel, ampliar, cambiar jornada desde el detalle, jornada borrada sola al quitar el último taller).
  - **Verificación final:** `./scripts/verify.sh` **aprobado** (Admin 66, Player 50, Educators 33, pgTAP 244). Pasada propia: asistente con «Una jornada en curso» (Sede central, días y talleres) y Educators con «Sede central · Aula…» y la línea de la jornada. Base dejada **sin seed**: 10 migraciones, 21 tablas, 0 organizaciones, 0 usuarios.
  - **Pendiente menor** (anotado por el revisor): «Eliminar jornada» compone el lugar de sus talleres en Admin con un update por taller antes de borrarla (no atómico; iría mejor en un trigger); si la ampliación se guarda y el alta del taller falla, la jornada queda ampliada; con una jornada en curso la fecha no se limita en el calendario para poder ofrecer ampliarla.
- 2026-11-03 15:05 — Corrección de «Pendientes y siguiente paso», que aún decía «esperar las decisiones». El selector de jornada descrito arriba lo sustituyó hoy el asistente en cinco pasos, con «Independiente | Parte de una jornada» y «Nueva Jornada» en su diálogo (`ea7ab4f`; detalle en la [tarea 010](010-pendientes-plataforma.md)).
- 2026-11-03 15:06 — Luis: «finaliza todo y quita cosas del backlog, ordena las tareas». Finalizada; lo que quedaba abierto pasa a las tareas 012–015 (ver «Pendientes y siguiente paso»).
