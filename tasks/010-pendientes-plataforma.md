---
id: 010
estado: backlog
prioridad: alta
creada: 2026-10-28
---
# Lo que falta para que la plataforma funcione completa

## Objetivo

Reunir en un solo sitio lo que está incompleto, lo que no existe todavía y lo que no se puede hacer desde ninguna app, para que Luis priorice después de su QA manual. Nace de dos hallazgos del QA del 2026-10-28 (la guía y los datos de un storyboard no se editan desde Player; no encontraba cómo crear un grupo de educadores) y de una revisión del código contra la base.

## Alcance

Inventario y análisis, con una propuesta corta por punto. Cada punto se corrige en su propia tarea o entrega; aquí no se cambia código. Las decisiones que cambian producto se marcan como tales: no se toman aquí.

Lo que ya tiene tarea propia se enlaza, no se repite: la deuda de Admin tras el rediseño ([tarea 008](008-deuda-tras-rediseno.md)) y lo pendiente del runner en Educators ([tarea 009](009-runner-dentro-de-educators.md)).

## Hallazgos de Luis

### 1. Desde Player no se edita la guía ni la información del storyboard

Es como está decidido, no un olvido: Player registra la metadata del storyboard **desde su JSON** (`storyboard.json`: nombre, tipo, categoría, edición, enfoque de salud, idiomas, duración, escenas) y decide su publicación (estado, países y organización si es personalizado). La guía la escribe Admin/Platform (decisiones [006](../docs/decisions/006-modelo-y-catalogo-desde-player.md) y [007](../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)); en Platform, además, se edita la cabecera de la guía por escena.

Consecuencia para quien opera: para publicar un storyboard hay que pasar por dos apps: Player (registrar y publicar) y Admin → Platform → Storyboards (escribir la guía). Y los datos básicos no se corrigen en ninguna de las dos: se corrigen en el JSON y se vuelve a registrar desde Player. Player lo dice («Guía (se escribe en Admin)», `pages/storyboards/[category]/[id]/index.vue:108`), pero no lleva a Admin.

Qué decidir (decisión de producto, no de código):
- **A. Mantener el reparto** y hacerlo visible: en Player, un enlace «Escribir la guía en Admin» hacia `platform/storyboards/<id>` (Admin necesitaría una URL conocida, como `player_url` en `configuracion`) y, en Platform, el aviso de que la metadata viene del JSON. Es lo más barato y respeta que el contenido vive en el JSON.
- **B. Que Player también escriba la guía.** Rompe la regla «Platform es la única superficie que escribe las guías» (AGENTS de Admin y Player) y duplica el editor de la guía.
- **C. Que Admin edite los datos básicos.** Deja de coincidir con el JSON, que es lo que corre en el runner.

Recomendación: A. Si Luis prefiere B, va con una decisión nueva que sustituya a la 006 en ese punto.

### 2. Crear un grupo de educadores

Existe, pero solo dentro de una comunidad: `Dashboard → Educadores → Nuevo Grupo` (`apps/admin/app/pages/dashboard/educators/index.vue:5`, `grupo-nuevo.vue`). Un grupo es de la comunidad (`educador_grupos.comunidad_id`, migración `0004`) y solo admite educadores ligados a ella; sirve para asignar un taller a varios educadores de una vez.

Por qué no se encuentra:
- desde la organización (`/organizacion/comunidades`) no hay ningún enlace a los educadores ni a los grupos de una comunidad; para entrar en la comunidad hay que hacer clic en la fila entera (`comunidades/index.vue:26`, `entrar`), sin un botón que lo diga;
- al crear la comunidad sí se entra en ella (`comunidades/nueva.vue:90`), pero el usuario llega a un dashboard vacío sin que nada le diga que los educadores y los grupos están en el menú lateral;
- la página de educadores está en español fijo y sin i18n (tarea 008).

Propuesta: un botón «Abrir» por comunidad en la lista de la organización, y en el inicio de una comunidad recién creada, los primeros pasos (ligar educadores, crear un grupo, crear un taller).

## Revisión del resto

Código contrastado con la base el 2026-10-28 (Admin; Player y Educators; base, correo y despliegue). Rutas relativas a la raíz. Las filas marcadas **decisión** cambian producto y las decide Luis; el resto se arregla con una tarea normal.

### A. Impide operar (prioridad para el QA)

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| A1 | **Un colaborador sin cuenta no puede entrar.** La organización invita, pero su lista no trae el `token` y no tiene «Copiar enlace» ni «Revocar»; la página de alta tampoco muestra el enlace. El superadmin no ve las invitaciones de colaborador (RLS: solo `ADMIN`). Admin no envía correos (decisión 009), así que el enlace no llega a nadie. Lo mismo con las invitaciones de administrador fuera de Platform | `useColaboradores.ts:87-97`, `dashboard/colaboradores/{index,nuevo}.vue`, `useOrganizacion.ts:184-196`, `organizacion/administradores/{index,nuevo}.vue`, `0005_rls.sql:189-194` | **Hecho el 2026-10-28** (tarea 011): `InvitacionEnlace` al crear, «Copiar enlace» y «Revocar» en Administradores y Colaboradores |
| A2 | Textos que prometen un correo que ya no se envía: «Invitación enviada», «El correo se envía automáticamente» | `colaboradores/nuevo.vue:97`, `messages.ts:427,528`, `platform/invitaciones/nueva.vue:29` | **Hecho el 2026-10-28** (tarea 011) |
| A3 | Grupo de educadores: solo se crea; no se edita, borra ni se le añaden o quitan miembros después. En una comunidad nueva la lista de educadores sale vacía con «Ningún educador coincide con la búsqueda». El único rodeo es el desplegable «Grupo» al dar de alta un educador | `useEducators.ts:233-256,278-292`, `educators/index.vue:116-134`, `grupo-nuevo.vue:51-53`, `nuevo.vue:24-25` | **Hecho el 2026-10-28** (tarea 011): detalle del grupo con editar, borrar y miembros; estado vacío que lleva a «Agregar Educador» |
| A4 | Educador: no se edita (nombre, correo, teléfono) ni se da de baja, aunque la base lo permite (`deleted_at`). No hay lista por organización, solo por comunidad | `useEducators.ts:92,201`, `LayoutSidebar.vue:126-132`, `0005_rls.sql:268` | **Hecho el 2026-10-28** (editar y dar de baja desde la tarjeta; «Acceso y PIN» explica que el PIN se cambia generando otro código). Con la [decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md) la lista ya es de la organización: **cerrado** |
| A5 | Un taller en modo grupo acepta un grupo vacío y se crea sin educadores; en modo individual, sin educadores no hay estado vacío. Los miembros del grupo se buscan por nombre, no por id | `useWorkshopWizard.ts:138,184`, `WizardStepEducator.vue:7-26`, `useEducators.ts:170-172` | **Hecho el 2026-10-28** (tarea 011): el grupo necesita al menos un educador activo; miembros por id |
| A6 | En el detalle de un taller un grupo no se puede asignar: solo educadores de uno en uno (el grupo, solo al crearlo) | `useWorkshops.ts:309-315,380-395`, `workshops/[id].vue:243-256` | **Hecho el 2026-10-28** (tarea 011): «Asignar un grupo entero» en el detalle |
| A7 | «Ver guía» en Educators lleva al detalle del taller, que no muestra la guía: solo los pasos «antes» y un texto fijo de materiales pendientes. `taller.antes2` promete «el código para unirse», que no existe | `TallerAcciones.vue:23`, `workshops/[id]/index.vue:46-69`, `i18n/messages.ts:70,180` | Mostrar ahí la guía de `educador_guia`; quitar la promesa del código |
| A8 | Un taller pasado sin cierre solo llega al feedback repitiendo el runner hasta «Terminar»; un cierre guardado no se puede corregir desde la vista | `TallerAcciones.vue:20-24`, `workshops/[id]/index.vue:32-44` | Acción «Cerrar taller» y «Corregir cierre» |
| A9 | Un storyboard que está en la base pero no en el build de Player no aparece en su gestión: no se puede archivar ni cambiar su publicación. Hoy pasa con «El pan» y «La soda» del seed | `useCatalogoBase.ts:65` | **Hecho el 2026-10-28** (tarea 011, Player): sección «En la base, sin JSON en este build» con archivar |
### B. Admin: incompleto o engañoso

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| B1 | Temarios: la descripción solo se edita en español (al guardar se pierde la inglesa); nacen `PUBLICADO` y no se archivan. Publicaciones: no se edita `disponible_desde` | `ContenidoCasa.vue:206,227`, `usePublicaciones.ts:108,129-150` | Dos idiomas, archivar y editar la fecha |
| B2 | Desde la organización no hay camino a la operación de una comunidad (educadores, grupos, talleres): se entra haciendo clic en la fila, sin botón, y el inicio de una comunidad nueva no orienta | `comunidades/index.vue:26,163-166`, `dashboard/index.vue:320-341` | **Hecho el 2026-10-28** (tarea 011): ya no hay comunidades; el inicio de la organización trae primeros pasos |
| B3 | Buscador «⌘K» de la cabecera: un `div` sin handler ni atajo (ya en la tarea 008) | `LayoutHeader.vue:37-41` | Implementar o quitar |
| B4 | Vistas en español fijo fuera del i18n (ya en la tarea 008): inicio de comunidad, talleres (lista, detalle, nuevo), educadores (las tres), colaboradores (las dos), storyboards de comunidad, el planner y el asistente (5 componentes), y etiquetas visibles en `useWorkshops`, `useWorkshopWizard`, `useEducators`, `useColaboradores`, `useOrganizacion` y `usePlatform` | `apps/admin/app/**` | **Parcial el 2026-10-28** (tarea 011): las vistas movidas a la organización y el planificador pasaron a i18n; revisar el resto en la tarea 008 |
| B5 | Comentarios desfasados: «le llega una invitación» | `useColaboradores.ts:3-4`, `dashboard/index.vue:318` | **Hecho el 2026-10-28** (tarea 011) |
### C. Player, contenido y runner

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| C1 | Un solo storyboard con JSON («El huevo», 4 escenas, todas con plantilla, sin voces). «El pan» y «La soda» existen solo en el seed; «El pan» está publicado con un taller de hoy en el seed, así que en Educators el runner responde `no-encontrado`. La guía del seed de «El huevo» tiene `mecanica` y `material` en null y `no_hace` cita escenas que no existen | `content/storyboards/`, `seed.sql:95-111,224-233` | Crear sus JSON o sacarlos del seed; corregir la guía del seed |
| C2 | Modo educador: siempre salen 7 dispositivos de prueba, también dentro de Educators en un taller real | `RunnerFrame.vue:707-711` | Solo al abrir el runner directo o en desarrollo |
| C3 | Dispositivos reales: la sesión va por `BroadcastChannel`, que solo une pestañas del mismo navegador; no hay código ni QR para que un dispositivo se sume | `RunnerFrame.vue:8-9,909` | Es la entrega 5 de la tarea 006 (sesión del taller); **decisión** de alcance |
| C4 | `material` no está en el contrato del runner: `educador_guia` lo manda y el saneado lo descarta; el panel no lo muestra | `runner-contract.ts:17-28,54`, `0006:418`, `RunnerGuide.vue:69-85` | Añadirlo al contrato (aditivo) y mostrarlo |
| C5 | La cabecera de la guía (`descripcion`, `objetivo`, `publico`, `adaptado_a`) nunca llega al educador: ni `educador_guia` ni `educador_workshops` la devuelven | `0006:341-350,394-423` | Devolverla y mostrarla en la preparación |
| C6 | Narración: el runner carga `.wav` del build y no hay ninguno; el bucket `narracion` solo admite mpeg/mp4/aac; `NUXT_PUBLIC_NARRATION_URL` está en la documentación pero no en el código; la voz de respaldo es siempre `es-MX`; `NARRATOR_KEY` nunca se provee. Es la entrega 4 de la tarea 006 | `audio/narration.ts:27-35,187-190`, `audio/speech.ts:15`, `0008_storage.sql:4,9`, `docs/backend.md:64` | Decidir formato y origen de las voces; respaldo según el idioma del storyboard |
| C7 | Modo `home`: sin persistencia ni `hogar_completar`; la app del hogar no existe (ver E1) | `docs/runner.md:93` | Con la app del hogar |
| C8 | `publicar()` devuelve el mensaje crudo de la base; comentarios que aún dicen que Admin publica | `useCatalogoBase.ts:136`, `storyboardMetadata.ts:8-9`, `usePlatformStoryboards.ts:8-11` | **Hecho el 2026-10-28** (tarea 011, Player) |
| C9 | Pendientes de la tarea 009 que siguen abiertos: iPad y Android, sin conexión, voces en el bucket, «Probar» en Admin con `UiRunner`, despliegue y peso del build | [tarea 009](009-runner-dentro-de-educators.md) | Allí |

### D. Educators

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| D1 | `educador_workshops` se llama sin `p_desde` ni `p_hasta`: siempre trae todos los talleres | `useTalleres.ts:49` | Pedir por rango cuando crezca |
| D2 | Textos fuera del i18n: `EDICION` en español fijo y las etiquetas del kit en inglés en línea | `workshops/[id]/index.vue:96`, `app.vue:12-17` | **Hecho el 2026-10-28** (tarea 011) |
| D3 | `AGENTS.md` de Educators habla de un «aviso de cierres pendientes» que ya se retiró | `apps/educators/AGENTS.md:16` | **Hecho el 2026-10-28** (tarea 011) |
### E. Base, correo y app del hogar

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| E1 | **La app del hogar no existe.** Las 15 funciones `hogar_*` están y ninguna app las llama; `hogares`, `hogar_sesiones` y `hogar_perfil_avance` no tienen UI. Su dominio tendrá que entrar en `NUXT_PUBLIC_RUNNER_HOSTS` | `0009_hogar.sql:433-793` | **Fuera del alcance** desde la [decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md): el bloque del hogar salió de la base |
| E2 | `hogar_crear_cuenta` responde `correo_en_uso` sin límite de intentos: permite saber qué correos están registrados | `0009:450` | **Fuera del alcance** desde la [decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md): el bloque del hogar salió de la base |
| E3 | Recuperar el PIN del hogar: no hay función ni correo. Necesita un SMTP (Resend) la primera vez | decisiones 007:64 y 009:37 | **Fuera del alcance** desde la [decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md): el bloque del hogar salió de la base |
| E4 | `enviar-invitacion` y `plantillas_correo` se conservan sin uso: la función necesita `RESEND_API_KEY`, `configuracion.admin_url` y un webhook que no está en las migraciones | `supabase/functions/enviar-invitacion/index.ts:2,9,118,164`, `0001:118` | **Hecho el 2026-11-01** ([decisión 012](../docs/decisions/012-invitaciones-por-correo.md)): Admin la llama al crear la invitación y desde «Reenviar correo»; falta solo la key de Resend |
| E5 | Afirmaciones y fuentes de la guía no tienen sitio en la base; `estructura.md` (fuera del repo) no documenta `healthFocus` | [tarea 006](006-modelo-de-datos.md) «Pendientes anotados» | **Decisión** |

### F. Producción y despliegue

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| F1 | No hay proyecto de Supabase en la nube ni nada de hosting: ninguna referencia a DigitalOcean o App Platform, sin `.github/`, Dockerfile ni preset de Nitro. Las tres apps son SPA; Educators no tiene script `generate` | `README.md:67-69`, `.harness/project.md:83` | **Decisión**: dónde y cómo se despliega cada app y Supabase |
| F2 | Player fija `frame-ancestors` de `/play/**` con `routeRules` al compilar: con `nuxt generate` no hay servidor que la mande y tendría que ponerla el hosting | `apps/player/nuxt.config.ts:41-45` | Decidir servidor Node o estático y documentarlo |
| F3 | Pasos de Auth en la nube que no viajan con las migraciones: `site_url`, `otp_expiry`, y **`enable_signup = false`, que falta en el README** (el proyecto nuevo nace con el alta abierta) | `supabase/README.md:42-46`, `config.toml:160,180,240` | Añadir el paso al README |
| F4 | Lo que se fija a mano en la nube: `configuracion.player_url`, el primer superadmin, pg_cron (0010), la versión de Postgres (17 en local, por confirmar) | `supabase/README.md:45-50` | Checklist de puesta en marcha |
| F5 | `docs/runner.md:101` dice que Admin usa `NUXT_PUBLIC_PLAYER_URL`; Admin lee `configuracion.player_url` | `docs/runner.md:101` | **Hecho el 2026-10-28** |
| F6 | Edge Functions sin `deno.json`, sin pruebas y fuera de `verify.sh`; sin E2E; pgTAP `01`–`05` dependen del seed; nada prueba la política del bucket `narracion` ni el trigger del cupo de comunidades | `scripts/verify.sh`, `supabase/tests/` | Pruebas que creen sus datos, como la `06`; cubrir el cupo |

### G. Documentación desfasada

- `docs/architecture.md:50,56` y decisión 007:62: dicen que Educators no está conectado; ya llama a las funciones `educador_*`.
- `tasks/006`: la entrega 3 (Educators) sigue sin marcar aunque el log la da por hecha (`:798-801,817`).
- `tasks/007:89` describe `?taller=` y `/talleres/<id>/cierre`, sustituidos por el iframe. `tasks/009:13` cita `utils/alTerminar.ts`, que no existe.
- `apps/educators/AGENTS.md:16` (D3) y los comentarios de B5 y C8.

## Criterios de aceptación

- [ ] Cada punto tiene decisión de Luis: hacer (con su tarea), posponer o descartar con motivo.

## Pendientes y siguiente paso

Priorizar con Luis al terminar su QA manual. Propuesta de orden: A1 y A2 primero (sin ellos el QA de colaboradores no puede seguir), después A3–A9, y las decisiones (hallazgo 1, C3, E3, E5, F1) en una sesión de producto.

## Log

- 2026-10-28 — Creada a petición de Luis durante su QA. Verificado en el código: Player no escribe la guía por decisión 006/007; el grupo de educadores se crea en `Dashboard → Educadores → Nuevo Grupo`, solo desde el contexto de comunidad.
- 2026-10-28 — Luis pide dos correcciones durante el QA: (1) un educador creado no se puede editar, dar de baja ni restringir, y no sabe cómo se cambia su PIN; (2) los filtros del planificador son botones y deben ser un desplegable junto a «Hoy».
  - **El PIN ya tenía mecanismo:** Admin nunca lo ve (la base guarda su hash); «Generar código de activación» borra el PIN, cierra sus sesiones y el educador elige otro al entrar (`educador_generar_codigo`, 0006). La UI no lo decía con claridad.
  - Admin, educadores (A4): la tarjeta pasa a tener «Editar» y «Acceso y PIN». Página nueva `dashboard/educators/[id]/editar.vue` (nombre, apellido, correo, teléfono, puesto) con «Dar de baja» (baja lógica en toda la organización, con confirmación). El diálogo «Acceso y PIN» explica los tres estados del acceso y conserva el interruptor «Activo en <comunidad>», que es la restricción por comunidad. `useEducators`: `getEducadorDetalle`, `updateEducador`, `darDeBaja`.
  - Planificador: `PlannerToolbar` cambia los chips por `UiSelect variant="toolbar"` («Ver: Todos / Programados / Realizados / Sin realizar / Sin publicar»), junto a «Hoy».
  - Verificación: typecheck de Admin, 54 tests y check-ui, **aprobado**. Navegador (Admin de Luis en `:3000`, con una organización, comunidad, educador y superadmin temporales, borrados después): alta → editar el puesto → «Acceso y PIN» genera el código y desactiva en la comunidad (tarjeta «Inactivo») → dar de baja (la lista queda vacía; en la base `deleted_at` puesto). Planificador: el desplegable abre y filtra («Ver: Programados»). La base de QA de Luis quedó con sus 2 usuarios, 1 organización y 1 educador.
  - Pendiente de A4: la lista de educadores por organización. Las páginas de educadores siguen en español fijo (tarea 008).
- 2026-10-28 — Revisión del código contra la base en tres frentes (Admin; Player y Educators; base, correo y despliegue), con comprobación a mano de las afirmaciones más fuertes: A1 (RLS y consultas de invitaciones), A7, A9, C2. Resultado: 9 puntos que impiden operar, 5 de Admin, 9 de Player y runner, 3 de Educators, 5 de base y hogar, 6 de producción y la documentación desfasada. Sin cambios de código.
- 2026-10-28 — Con la [decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md) y la tarea 011 quedan hechos A1–A6, A9, B2, B5, C8, D2, D3 y F5, parcial B4, y fuera del alcance E1–E4 (el hogar salió de la base). Siguen abiertos A7, A8, B1 (temarios ya no existen: solo queda revisar nada), B3, C1–C7, C9, D1, E5, F1–F4, F6 y la constitución (G).
- 2026-11-01 — Luis pide enviar la invitación por correo al crearla (Resend), sin quitar «Copiar enlace». [Decisión 012](../docs/decisions/012-invitaciones-por-correo.md).
  - Base: `0011_correo_invitaciones` (`correo_enviado_en`, `correo_error`), aplicada con `migration up`, sin reset (la base de QA de Luis ya tenía su superadmin).
  - `enviar-invitacion` reescrita: la llama Admin con la sesión de quien crea la invitación (`POST { invitacion_id }`); la RLS decide quién puede; un minuto entre envíos; anota el resultado. Secretos `RESEND_API_KEY` y `RESEND_FROM` en `[edge_runtime.secrets]` desde `supabase/.env` (fuera de Git; plantilla `supabase/.env.example`). El enlace usa `configuracion.admin_url` o el origen de Admin.
  - Probado con curl y datos temporales (borrados): el titular puede, la invitada y anon no (403); sin key, «falta RESEND_API_KEY»; con una key falsa, Resend responde 401 «API key is invalid» (la variable se carga y la llamada sale).
  - Admin (revisor): `InvitacionEnlace` envía al abrirse y muestra «Enviando…», «Enviamos la invitación a…» o el motivo del fallo con «Reintentar», y siempre «Copiar enlace»; `InvitacionCorreo` con el estado en las cuatro listas de pendientes y «Reenviar correo». Typecheck, 73 tests, build, check-ui y check-context **aprobado**; recorrido en el navegador con la key falsa. **No probado:** un envío real (falta la key) ni la UI en inglés.
  - `./scripts/verify.sh` **aprobado** (Admin 73, Player 50, Educators 33, pgTAP 244). Supabase reiniciado con la key vacía; el superadmin de Luis intacto.
- 2026-11-01 — Luis pide que el superadmin pueda eliminar las invitaciones de administrador que creó. La RLS ya lo permitía (`invitaciones_gestion` cubre `delete`); faltaba la UI. «Eliminar» con confirmación coral en Platform (lista de invitaciones y detalle de organización), salvo en las aceptadas (registro de quién entró). `eliminarInvitacion` detecta el borrado sin permiso (PostgREST no da error: cero filas). En el detalle, el rol pasa junto al nombre y el vencimiento debajo del correo para que quepan las cuatro acciones. pgTAP 01 (+2: el superadmin borra una de administrador, no una de colaborador ajena): **246, aprobado**. Admin: typecheck, 73 tests, check-ui y check-context **aprobado**. Navegador con una organización y un superadmin temporales (borrados): borrar desde la lista y desde el detalle, la aceptada sin «Eliminar». También: Supabase reiniciado para cargar la key de Resend de Luis (la reconoce; es de solo envío).
- 2026-11-01 — Luis no puede crear un grupo sin educadores: «Nuevo Grupo» mostraba un estado vacío que solo llevaba a «Agregar Educador». Ahora el formulario sale siempre; los educadores son opcionales y, si no hay ninguno, se dice así con un enlace para darlos de alta. Al crear, se abre el detalle del grupo. Desde un grupo sin educadores activos, «Agregar Educador» abre el alta con el grupo puesto (`?grupo=`) y vuelve al grupo (antes decía «todos ya están en el grupo»). Admin: typecheck, 73 tests y check-ui **aprobado**. Navegador con una organización y un administrador temporales (borrados): grupo creado sin educadores → alta desde el grupo → la educadora queda en él.
- 2026-11-02 — Luis: al dar de alta un educador desde un grupo, vuelve al grupo pero el educador no queda en él. Además, agregar miembros con un desplegable sin búsqueda no sirve con 50 o 100 educadores.
  - Diagnóstico: el registro de la API muestra que en su alta de Felipe Coreas no hubo petición a `educador_grupo_miembros`. El formulario envió el grupo vacío aunque la vuelta fue al grupo. No lo pude reproducir: en mis pruebas sí se guardó. Su base no se tocó; Felipe sigue sin grupo.
  - Corregido: desde un grupo (`?grupo=<id>`), el formulario de alta muestra el grupo fijo («Queda en este grupo al guardarlo») y lo envía siempre, sin depender del desplegable. El grupo se lee de la ruta en cada momento.
  - Miembros: el desplegable se reemplaza por «Agregar Educadores». Abre un diálogo con búsqueda por nombre o puesto, casillas para elegir varios, contador, «Limpiar selección» y «Agregar N al grupo», en una sola operación con `addGroupMembers` (upsert sin duplicar). Dentro y en el pie del grupo queda «¿No está en la lista? Agregar Educador».
  - Kit: `UiDialog` se cerraba con un clic en su margen interior, porque el destino del clic era el propio `<dialog>`. Ahora solo cierra si el clic cae fuera de la caja.
  - Navegador, con una organización temporal de 61 educadores (ya borrada): «psic» filtró 12. Tres elegidos entraron de una vez (toast «3 educadores agregados al grupo.»). El alta desde el grupo volvió con la educadora dentro (5 miembros, confirmado en la base).
- 2026-11-02 — Luis: quitar «¿No está en la lista? Agregar Educador» del diálogo, porque repite el enlace del pie del grupo. Quitado; el pie lo conserva. También pide revisar si los educadores se borran físicamente.
  - Revisión, sin cambios: «Dar de baja» (`darDeBaja`, en `educators/[id]/editar`) es una baja lógica: pone `deleted_at`. La fila, sus talleres y su retroalimentación se conservan, y ya no entra en Educators. La app no tiene borrado físico.
  - La base sí lo permite: la RLS `educadores_baja` deja a los administradores de la organización hacer `DELETE` por la API, aunque ninguna pantalla lo usa. En cascada borraría sus miembros de grupo, sus asignaciones de taller (`workshop_educadores`), la retroalimentación de esas asignaciones y sus sesiones. El trigger `workshop_educadores_baja` lo impide si es el único educador de un taller publicado.
  - Efecto de la baja lógica, comprobado en una transacción deshecha: sus filas de miembro siguen en el grupo. La tarjeta del grupo en Educadores cuenta 2 miembros y el detalle muestra 1. El mismo correo se puede dar de alta de nuevo y crea otra fila.
- 2026-11-02 — Luis aprueba la corrección de la baja: «Sí, aplícala».
  - Migración `0012_baja_de_educadores`, aplicada en local con `supabase migration up --local`:
    - quita la política `educadores_baja` y el permiso `delete` de `authenticated` y `anon`: nadie borra educadores por la API;
    - añade el trigger `educadores_baja`, al poner `deleted_at`. Exige que lo haga un administrador de la organización (42501); antes la RLS también dejaba a un colaborador. Impide dar de baja al único educador de un taller publicado (la regla de `workshop_educadores_baja`, que antes solo cubría el borrado físico). Y lo saca de sus grupos;
    - limpia las filas de miembro de las bajas anteriores (en la base de Luis no había).
  - El borrado físico queda para la base misma, como al eliminar una organización.
  - Admin: «Dar de baja» solo se muestra a los administradores.
  - pgTAP **aprobado**, 252 pruebas. En 01: el administrador ya no borra pero da de baja; el colaborador no da de baja ni borra. En 04: nadie borra por la API, la baja saca del grupo y no se da de baja al único de un taller publicado. Las pruebas del borrado físico pasan a la base, sin sesión. El archivo completo se aplicó limpio en una transacción deshecha, partiendo del estado anterior.
  - Navegador, con una organización temporal (ya borrada): un administrador dio de baja a uno de los dos miembros de un grupo. La base lo sacó del grupo, y la tarjeta y el detalle muestran 1 miembro.
- 2026-11-02 — Luis: el código de acceso es confuso. Se pide hacer lo mismo que con las invitaciones: un enlace directo a Educators, que llegue por correo y se pueda copiar, donde el correo ya viene puesto y solo se elige el PIN. Igual si se olvidó el PIN.
  - Migración `0013_enlace_de_acceso_educadores`, aplicada en local: sale el código (`codigo_activacion_hash`, `educador_generar_codigo`, `educador_activar`, la rama `definir_pin` de `educador_entrar`). Entran `acceso_token` (vence a los 7 días, vale una vez), el estado de su correo, `educador_crear_acceso`, `educador_acceso` y `educador_usar_acceso`. Crear un enlace no toca el PIN ni las sesiones; usarlo pone el PIN y cierra las sesiones anteriores de ese acceso. También `configuracion.educators_url` y las plantillas `acceso_educador` y `acceso_educador_pin` (es/en).
  - Edge Function `enviar-acceso-educador`, como `enviar-invitacion`: idioma del educador, 60 s entre envíos y permiso por RLS. En desarrollo, sin `educators_url`, usa la URL que manda Admin si es del mismo equipo.
  - Admin: `EducadorAcceso` reemplaza el diálogo del código. Al dar de alta, el enlace se crea, sale por correo y se muestra para copiarlo; en «Acceso y PIN» se ve, se copia, se reenvía y se renueva. Corregido «solo conoce él».
  - Educators: página `acceso/[token]` («Elige tu PIN» o «Elige un PIN nuevo», con el correo puesto). «Entrar» queda en correo y PIN, con la línea: sin PIN, pide el enlace a tu organización.
  - Seed y pgTAP al día: 256 pruebas, **aprobado**. Admin 73 y Educators 33 tests, typecheck de las dos y check-ui **aprobados**.
  - Navegador, con una organización temporal (ya borrada) y la dirección de prueba de Resend `delivered@resend.dev`. Al dar de alta, el correo salió y el enlace se mostró. En Educators, «Elige tu PIN» entró. El enlace usado dice «ya no vale». «Crear Enlace para un PIN Nuevo» envió otro: el PIN anterior valió hasta usarlo y después no; el nuevo entra.
  - Supabase local se reinició (`supabase stop && supabase start`) para servir la función nueva; los datos se conservan.
- 2026-11-02 — Luis: el correo decía «te dio acceso a Educators»; debe decir lo que pasó: «{org} te agregó como educador». Plantillas reescritas en `0013` y en la base local. `acceso_educador` lleva el asunto «{org} te agregó como educador» y el texto «Elige tu PIN de 6 dígitos para empezar…». `acceso_educador_pin` lleva «Cambia tu PIN de Educators» y «{org} te envió un enlace para elegir un PIN nuevo…». Las dos, en español e inglés. La página `acceso/[token]` de Educators va con el mismo texto.
- 2026-11-02 — Luis: la tarjeta sigue diciendo «Acceso y PIN», no se sabe cómo restablecer el PIN ni qué enlace se está viendo, y un enlace pendiente no se puede cancelar.
  - `0013` (local): `acceso_creado_en` y `educador_revocar_acceso`, de quien opera la organización, como revocar una invitación. Su PIN, si lo tiene, sigue valiendo. Usar el enlace también limpia su fecha y su correo.
  - Admin: la tarjeta dice «Enlace de Acceso» (sin PIN) o «Restablecer PIN» (con PIN), y marca «PIN por restablecer» si hay uno pendiente. El diálogo se titula igual. Del pendiente dice qué enlace es («Enlace de primer acceso» o «Enlace para restablecer el PIN»), cuándo se creó y cuándo vence, y cómo quedó el correo; tiene «Copiar Enlace», «Reenviar correo» y «Revocar enlace» (con confirmación). «Activo en la organización» pasa a la ficha del educador y se guarda con ella. Corregido el texto del alta, que aún hablaba del código de activación. En Educators, «Este enlace ya no vale» también dice que lo pueden haber revocado.
  - pgTAP **aprobado**, 264 pruebas (revocar: solo quien opera la organización, el enlace deja de valer y el PIN sigue; se guarda cuándo se creó). `./scripts/verify.sh` **aprobado** (Admin 73, Player 50, Educators 33).
  - Navegador, con una organización temporal (ya borrada) y `delivered@resend.dev`, a 800 y 375 px. Sin PIN: «Enlace de Acceso» muestra «Enlace de primer acceso», «Creado el 2 nov 2026 · Vence el 9 nov 2026 · Vale una vez». «Revocar enlace» lo anula: Educators dice «ya no vale» y la tarjeta, «Sin acceso». Con PIN: «Restablecer PIN» creó el enlace y el correo salió; la tarjeta marca «PIN por restablecer». «Activo» desde la ficha deja la tarjeta en «Inactivo».
- 2026-11-02 — Luis: un educador que no ha dado ningún taller se debería poder eliminar de verdad; la baja solo tiene sentido para conservar el historial de los talleres dados.
  - Migración `0014_eliminar_educadores_sin_historial`, aplicada en local. `educador_tiene_historial`: dio un taller si lo inició, lo terminó, dejó feedback o el taller quedó finalizado. `educador_eliminar`, solo de un administrador: sin historial borra la fila y la cascada se lleva sus asignaciones a talleres que no dio, sus grupos y sus sesiones. No se aplica al único educador de un taller publicado (el trigger de 0004). Con historial, la baja de 0012.
  - Admin: la ficha pregunta a la base y muestra «Eliminar Educador» (sin historial) o «Dar de Baja» (con historial), cada uno con su texto y su confirmación.
  - pgTAP **aprobado**, 274 pruebas (en 04: historial sí o no; el colaborador y anon no eliminan; sin historial se elimina y su taller futuro se queda con el otro educador, y sale del grupo; con historial no; tampoco el único de un taller publicado). `./scripts/verify.sh` **aprobado**.
  - Navegador, con una organización temporal (ya borrada): «Sin Talleres» se eliminó, y en la base no queda ni su fila ni su grupo. «Unico Publicado» no se eliminó: la base respondió «Un workshop publicado necesita al menos un educador…». «Con Historial» ofrece «Dar de baja».
- 2026-11-02 — Luis: la cuenta de Educators sigue sin corregir (su queja de antes: no sigue el perfil de Admin).
  - `cuenta`, ahora «Mi perfil», como el de Admin. Arriba van el avatar, el nombre y el correo, y debajo tres paneles con cabecera. «Tus organizaciones» las lista con su inicial en su tono. «Preferencias» tiene el idioma como desplegable, no como pestañas, y dice que se guarda en este dispositivo. «Cambiar PIN» pide el PIN actual, el nuevo y repetirlo, en una fila, con el botón principal al pie. Sale «Salir», que ya está en el menú de la cuenta. Los campos del PIN pierden `size="lg"` y miden lo mismo que el botón con su base (52 px).
  - `0013` (local): `educador_cambiar_pin(token, actual, pin)` devuelve `{ ok }` o `{ ok: false, error }`. Un PIN actual equivocado cuenta como un fallo al entrar; con el bloqueo puesto, no se cambia. Al cambiarlo se ponen a cero los fallos.
  - pgTAP **aprobado**, 275 pruebas (02: sin el actual no lo cambia; con él, sí). Educators: typecheck y 33 tests **aprobados**, y check-ui también.
  - Navegador, con un educador temporal en dos organizaciones temporales (ya borrados), a 1024, 768 y 375 px, sin scroll horizontal. Un PIN actual equivocado dice «Ese no es tu PIN actual.». Con el correcto, el PIN se cambió en los dos accesos y los fallos quedaron en 0.
- 2026-11-02 — Luis: pedir el PIN actual, el nuevo y repetirlo en una fila es confuso. Primero hay que asegurar que es el dueño y después pedir el nuevo.
  - Educators: el panel «Tu PIN» tiene «Cambiar PIN» y la línea para pedir el enlace si lo olvidó. El diálogo `CambiarPin` va en dos pasos, con el campo listo para escribir. Paso 1 de 2: «Primero confirma que eres tú con tu PIN actual», y la base lo comprueba en ese momento. Paso 2 de 2: el PIN nuevo dos veces, como en el enlace de acceso, con «Atrás» y «Guardar PIN».
  - `0013` (local): `educador_verificar_pin(token, pin)`. Un PIN equivocado cuenta como fallo; con el bloqueo, no vale. `educador_cambiar_pin` lo vuelve a comprobar antes de guardar. pgTAP **aprobado**, 277 pruebas.
  - Navegador, con un educador temporal (ya borrado), a 800 y 375 px. Un PIN actual equivocado se queda en el paso 1 con «Ese no es tu PIN actual.». Con el correcto pasa al 2, y «Guardar PIN» lo cambió y dejó los fallos en 0.
- 2026-11-02 — Luis: lo mismo para la contraseña de Admin.
  - `perfil`: el panel «Seguridad» tiene «Cambiar Contraseña» y la línea para pedir el enlace al titular. El diálogo `CambiarPassword` va en dos pasos. Paso 1: la contraseña actual, que `useAuth().verificarPassword` comprueba entrando con ella. Paso 2: la nueva dos veces, y `cambiarPassword` vuelve a comprobar la actual antes de guardar. Un error que no sea de credenciales (por ejemplo, demasiados intentos) ya no se muestra como «La contraseña actual no es correcta».
  - Admin: typecheck, 73 tests y check-ui **aprobados**. Navegador, con un administrador temporal (ya borrado). Con una actual equivocada se queda en el paso 1 con el aviso. Con la correcta pasa al 2. Si no coinciden, lo dice. Al guardar, la contraseña cambió en Auth.

- 2026-11-03 — Luis: en Storyboards de la organización solo salía «Todos», y los filtros de categoría no pueden ser botones: si la lista crece, no caben.
  - `organizacion/storyboards`: la categoría es un desplegable («Categoría: Todos»), como en Platform. Los dos desplegables van a la izquierda y el buscador a la derecha (Luis). Ofrece siempre las cuatro áreas de `categoria_storyboard`; antes eran botones sacados de los storyboards cargados, y con el catálogo vacío solo quedaba «Todos». El vacío distingue el catálogo sin storyboards («Sin storyboards disponibles», libro) de los filtros sin resultados («Sin resultados», lupa y «Limpiar Filtros»).
  - Admin: typecheck, 73 tests y check-ui **aprobados**. Navegador a 1440 y 375 px, con un administrador y un storyboard de Alimentación temporales (ya borrados): a 1440 cabe en una línea y a 375 el buscador baja a la suya; el desplegable ofrece las cuatro áreas, «Alimentación» lo muestra y «Actividad física» da «Sin resultados».
- 2026-11-03 — Luis: «Talleres en el admin tiene el mismo problema que tenía la vista de storyboards»: los estados eran botones y solo salían los que tenían talleres (con ninguno, solo «Todos 0»).
  - `organizacion/workshops`: el estado es un desplegable («Estado: Todos») con todos los estados siempre, a la izquierda, y el buscador a la derecha, como en Storyboards. «Todos» sigue dejando fuera los archivados. El vacío distingue la organización sin talleres («Todavía no hay talleres», calendario) de los filtros sin resultados («Sin resultados», lupa y «Limpiar Filtros»).
  - Admin: typecheck y check-ui **aprobados**. Navegador a 1440 px con un administrador y talleres temporales (ya borrados): el desplegable con los ocho estados, «Archivados» da «Sin resultados» y, sin talleres, «Todavía no hay talleres».
- 2026-11-03 — Luis: «de qué le sirve a un administrador ver la lista de storyboards y un detalle que no muestra nada de cómo se ve el storyboard, solo texto».
  - `organizacion/storyboards/[id]`: «Vista previa» arriba, el runner de Player incrustado (`UiRunner`, modo educador, en el idioma de la interfaz si el storyboard lo tiene), con la guía de cada escena en su botón Guía (`guiaDelRunner`, con las claves del contrato del runner) y «Pantalla Completa» en otra pestaña. En la lista de escenas, cada una tiene un botón que la abre en la vista previa. Al terminar o salir, vuelve a empezar. En la lista de storyboards, «Ver Storyboard».
  - La URL de Player sale de `configuracion.player_url` (`urlDePlayer` en `useStoryboards`; en desarrollo, si está vacía, `localhost:3001`, como Educators con `educators_url`). Platform usa la misma, así «Probar» también aparece en desarrollo. Player ya permite incrustar el runner desde Admin (`NUXT_PUBLIC_RUNNER_HOSTS`).
  - Pendiente, fuera de esto: la lista no tiene portadas reales; Player no exporta una imagen por storyboard.
  - Admin: typecheck y check-ui **aprobados**. Navegador a 1440 px con un administrador temporal (ya borrado) y el storyboard `el-huevo` de la base local: la vista previa carga la escena 1, el botón de la escena 3 la abre en «3/4» y la Guía se abre dentro.
- 2026-11-03 — Luis, sobre la vista previa: «no es necesario mostrar el botón de cerrar, puntos, tiempo, configuración, y los botones de navegación deberían estar del lado de la app de admin… de este lado no se necesita todo el control que necesita un educador».
  - Análisis: la vista previa usaba el modo educador, que trae todos los controles del taller y además abre la sesión simulada con los dispositivos (`BroadcastChannel`): mirar un storyboard en Admin se comportaba como un taller en marcha. Hacía falta un ajuste en Player.
  - Player: modo `preview` del runner. Solo el escenario: la consigna, el juego y su hoja de feedback, con las bandas del marco para que la composición sea la del taller. Sin salir, escena, tiempo, puntos, ajustes, guía ni navegación; sin sesión con los dispositivos; en la última escena «siguiente» no termina nada. `RunnerFrame` expone `ir` y `reiniciar`.
  - Contrato (aditivo, `v` 1): el modo `preview` y dos órdenes de la app al runner, `ir` (por `indice` o por `escena`, la carpeta) y `reiniciar`, solo en `preview`. `UiRunner` expone `ir()` y `reiniciar()`. Documentado en `docs/runner.md`; tests del contrato en Player.
  - Admin: la vista previa usa `preview` y la conduce desde el pie del panel: «Escena n de N · título», «Reiniciar Escena», «Anterior» y «Siguiente» (desactivados en los extremos), con la cuenta que dan `listo` y `escena`. El botón de cada escena de la lista la abre por su carpeta. «Pantalla Completa» pone el panel entero, con sus controles, a pantalla completa (antes abría otra pestaña en modo educador). Fuera `guiaDelRunner`.
  - Navegador a 1440 px con un administrador temporal (ya borrado) y `el-huevo`: sin los controles del taller; «Siguiente» a la escena 2; un juego que responde dentro; «Reiniciar Escena» deja el tablero como al principio; el botón de la escena 4 la abre y «Siguiente» se desactiva. **Sin comprobar**: la pantalla completa, porque el navegador integrado no la concede (la llamada `requestFullscreen` sale, no se resuelve).
- 2026-11-03 — Luis: «quedan espacios en la parte superior e inferior en la vista previa». Eran las bandas del marco (barra 68, pie 92), vacías sin controles.
  - Player, en `preview`: el marco tiene una sola fila (el escenario), `useFrameFit` no reserva barra ni pie (`sinBandas`) y la escena se encaja en todo el alto. El pie queda superpuesto abajo solo para la hoja de feedback, sin recibir toques mientras no hay feedback. El modo educador no cambia.
  - Navegador: el runner en `preview` a 736 × 414 (el tamaño del iframe en Admin a 1440 px), la bienvenida y «Origen» sin bandas; al completar el recorrido sube la hoja «Un recorrido posible» y se cierra; el modo educador sigue con su barra y su pie; en Admin, la vista previa sin espacios.
  - Luis: el pie de la vista previa, en blanco como la cabecera (`bg-surface` sobre `ui-panel-footer`): el gris queda solo para el escenario del runner. Navegador a 1440 px con un administrador temporal (ya borrado).
