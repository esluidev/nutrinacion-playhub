# Backend compartido — Supabase

Supabase da Auth, PostgreSQL, RLS, Realtime, Storage, pg_cron y Edge Functions a las apps. La definición ejecutable está en `supabase/migrations/`, `supabase/functions/` y `supabase/tests/`. Este documento es el mapa y las reglas de trabajo, no un volcado del esquema.

Base reescrita el 2026-10-28 para un proyecto de Supabase nuevo, con la organización como única unidad de operación ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)); la anterior, con comunidades y el modelo del hogar, queda en el historial de Git. El modelo viene de las decisiones [005](decisions/005-base-nueva-y-acceso-educador.md), [006](decisions/006-modelo-y-catalogo-desde-player.md) y [007](decisions/007-educador-hogar-y-ciclo-del-workshop.md), con el análisis en las tareas [006](../tasks/006-modelo-de-datos.md) y [011](../tasks/011-organizacion-sin-comunidades.md).

## Modelo

```text
configuraciones · paises · tipos_organizacion · plantillas_correo

organizaciones (países donde opera) ── organizacion_licencias · organizacion_administradores (titular)
  ├── organizacion_colaboradores · invitaciones
  ├── educadores (+ educador_sesiones) ── educador_grupos ── educador_grupo_miembros
  ├── programas · comunidades ── lugares · grupos_audiencia
  ├── jornadas (lugar, días y programa)
  └── workshops (lugar, grupo, programa, jornada) ── workshop_educadores (ejecución real) ── workshop_feedback
                                                  └── workshop_historial

storyboards (metadata del JSON + publicación) ── guias ── guia_escenas
```

### Nombres

- La tabla principal va en plural (`workshops`); sus hijas llevan delante la principal en singular (`workshop_educadores`, `guia_escenas`, `organizacion_colaboradores`).
- Las columnas también dicen de qué son: `grupo_audiencia_id`, `idioma_contenido`, `estado_publicacion`, `paises_disponibles`. Ninguna tabla se llama solo «grupos»: `educador_grupos` y `grupos_audiencia`.
- Los estados y valores fijos son **enums** (0001). `npm run db:types` los exporta a las apps en `Constants.public.Enums`: las listas no se repiten en el código. Añadir un valor es `alter type … add value` en una migración nueva.

### Qué hace cada tabla

| Tabla | Qué guarda |
|---|---|
| `configuraciones` | Ajustes de la plataforma. Los lee cualquiera, también sin cuenta, y los escribe el superadmin: nunca un secreto. Ahí viven las direcciones de las apps, para que cada una conozca la suya y las de las demás sin nada fijo en el código; vienen con las de desarrollo (`localhost:3000`, `3001`, `3002`) y en producción solo se cambian aquí: `admin_url` (el enlace de las invitaciones; Player deja que Admin incruste el runner), `player_url` (Admin y Educators abren el runner con ella y es la del QR para unirse a un taller) y `educators_url` (el enlace de acceso del educador, 0013; Player deja que Educators incruste el runner). Las apps las leen con `urlsDeLasApps` del kit |
| `paises` | El catálogo de países (nombre por idioma y bandera). Player elige de aquí los de cada storyboard; la organización, los suyos |
| `tipos_organizacion`, `plantillas_correo` | Listas de referencia de Admin y la copy de los correos por idioma: las invitaciones (`enviar-invitacion`) y el enlace de acceso del educador (`enviar-acceso-educador`) |
| `organizaciones` | La unidad de operación: datos, tipo y **`paises`, los países donde opera** (uno o más, del catálogo). Un solo titular por organización (`organizacion_administradores.titular`, índice único) |
| `organizacion_licencias` | El contrato: `estado`, `fecha_inicio`, `fecha_fin` y notas. Sin cupos |
| `organizacion_administradores` | Quién administra cada organización (el titular y los demás) |
| `organizacion_colaboradores` | Quién opera la organización sin administrarla (`activo` para apartarlo sin perder el historial) |
| `perfiles` | Los usuarios de Admin (Supabase Auth): nombre, correo, idioma y sus teléfonos móvil y de oficina (0017); `superadmin` lo da solo la base |
| `invitaciones` | Las invitaciones a administrar o colaborar, hasta que se canjean; con el estado de su correo (`correo_enviado_en`, `correo_error`) |
| `storyboards` | El catálogo, como un artículo. La metadata del JSON para listar, filtrar y buscar (`clave`, `slug`, `titulo`, `categoria`, `subcategoria`, `edicion`, `enfoques_salud`, `idiomas`…) y lo que decide Player al publicar: `estado_publicacion`, `paises_disponibles` y, si es personalizado, `organizacion_id`; y si sale en la app del hogar, `publicado_hogar` (tarea 022: solo publicado y estándar; sin países propios, el perfil del niño da el país y la edad) |
| `unidades_estudio`, `unidad_estudio_storyboards` | Las unidades de estudio de la app del hogar (tarea 022): título y descripción por idioma, `publicada`, `orden`, y sus storyboards en orden. Opcionales: un storyboard del hogar sale también suelto. Solo admiten storyboards publicados en el hogar (trigger). Solo el superadmin, desde Player |
| `guias`, `guia_escenas` | La guía del educador: cabecera y una por escena (los 12 campos de la plantilla, por idioma). Se escribe en Admin |
| `educadores` | El educador de la organización: sus datos, `activo` (apartado: no recibe talleres ni entra en Educators), `deleted_at` (la baja, la única: no se borran por la API; la dan los administradores y lo saca de sus grupos, 0012) y su acceso (código de activación y PIN, cifrados; Admin solo ve `tiene_pin` y `activacion_pendiente`) |
| `educador_sesiones` | Los tokens de Educators: una fila por cada educador (organización) que cubre el token |
| `educador_grupos`, `educador_grupo_miembros` | Grupos de educadores de la organización para asignar un workshop a varios a la vez |
| `programas` | Para qué y cuándo (tarea 021): nombre, descripción y fechas. Junta talleres sueltos y jornadas, que caen en sus fechas. Opcional; con talleres no se borra |
| `comunidades` | El nombre que agrupa los lugares de un mismo territorio para el reporte por territorio. Se gestiona en la pestaña Comunidades de Lugares (o se elige o crea desde el lugar) y existe aunque no agrupe ninguno; al borrarla, sus lugares quedan sin comunidad. No reparte educadores, permisos ni cupos |
| `lugares` | Los sitios concretos donde se dan talleres (escuela, centro, plaza), con su comunidad si la tiene. `activo = false` lo retira de la lista; con talleres no se borra |
| `grupos_audiencia` | A quién se atiende («Parvulario 6», «Público general»), independiente del lugar. Solo el nombre es obligatorio (edades y descripción, opcionales; sin edición desde la tarea 023: repetía las edades). Sin número de niños: lo da el cierre. `abierto` (en pantalla, «Público general»: una feria, un evento abierto) cuenta asistencias y no alcance, y su cierre lleva solo el total; cada organización nace con la suya, «Público general» (`organizaciones_publico_general`, tarea 023), fija (`publico_general`): solo se le cambia el nombre; no se desactiva, no deja de ser abierta ni se elimina (`grupos_audiencia_protege_publico_general`; se va con su organización). `activo` desactiva las demás («Desactivar» en pantalla) |
| `jornadas` | Dónde y cuándo se va: nombre, lugar (`lugar_id`) y uno o varios días (`fecha_inicio`, `fecha_fin`), todos obligatorios; descripción y programa opcionales. Se crea o se elige al programar un taller |
| `workshops` | El workshop programado y su ciclo (`estado`, `publicado_en`, `finalizado_en`, `cancelado_en`, `motivo_cancelacion`, `reprogramaciones`); une un lugar y un grupo (`lugar_id`, `grupo_audiencia_id`, para publicar), `espacio` (lo de dentro del lugar: «Aula 3A») y, si los tiene, programa y jornada. Dentro de una jornada, su fecha cae en sus días y su lugar y su programa son los de ella |
| `workshop_historial` | Cada cancelación (con su motivo), reprogramación y cambio de fecha de uno publicado: la fecha anterior, la nueva, quién y cuándo. Lo escribe el trigger |
| `workshop_educadores` | Quién lo imparte (y de qué grupo vino) y la ejecución real (`iniciado_en`, `terminado_en` y `dispositivos_unidos`: los conectados al terminar, que cuenta `educador_terminar` de la conexión, o lo que anota el educador en el cierre) |
| `workshop_feedback` | Lo que cuenta el educador al terminar, del grupo: el total de asistentes y, en un grupo cerrado, si el educador lo sabe, cuántas niñas y cuántos niños (opcionales, los dos o ninguno, y suman el total; con uno, `educador_guardar_feedback` pone el otro como el resto). Nunca puntos ni datos de una persona |
| `workshop_conexiones` | La conexión que abre el taller cada vez que se da (tarea 013), para que otros dispositivos se unan con el QR o el código: `codigo` (6, sin letras que se confundan; único entre las abiertas), la huella de la llave de la pantalla del educador, `abierta_en` y `cerrada_en`. Una abierta por taller; se cierra al terminarlo o cuando deja de estar publicado |
| `workshop_conexion_participantes` | Quien se une a una conexión desde su dispositivo: un identificador al azar de ese dispositivo para esa conexión (no se le sigue de un taller a otro), su avatar y su apodo (hasta 20 letras; sin apodo, el nombre del avatar), su estado (esperando, aprobado, rechazado, quitado) y su tiempo conectado, que suma las reconexiones. Nunca quién es |

### Lo que no está en la base

- **El contenido del juego:** escenas, narración, consignas, feedback de las escenas, datos, Rive, SVG y efectos viven en los JSON del storyboard, en el build de Player.
- **Las voces:** bucket `narracion`, de lectura pública, previsto (tarea 013); el runner todavía carga las del build.
- **Personas:** ni participantes ni familias ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)). Un taller dice a qué grupo de audiencia atiende y cuántos asistentes espera; su cierre, cuántos estuvieron (niñas y niños, como números del grupo).

### Reglas del modelo

- **Identidad del storyboard:** la `clave` UUID de su `storyboard.json`, la de todas sus URL (`/play/<clave>`, `/storyboards/<clave>`); el slug y la categoría solo localizan sus archivos en Player. `educador_workshops` y `participante_buscar` la dan en `storyboard.clave`.
- **Quién decide qué del storyboard:**
  - el JSON, que Player registra con `sincronizar_storyboard`: la metadata y las escenas;
  - Player al publicar (`publicar_storyboard`): estado, países (del catálogo `paises`) y organización;
  - Player al escribir la guía (`guias` y `guia_escenas`): la cabecera y cada escena, por idioma. Admin/Platform solo la muestra ([decisión 013](decisions/013-contenido-solo-desde-player.md)).
- **Taxonomía:** enums con las listas cerradas de `catalogo.md`. La subcategoría y los enfoques deben ser de la lista de su categoría (`subcategoria_de_categoria`, `enfoques_de_categoria`). Player lo valida antes de registrar.
- **Estados del storyboard:**
  - registrado (solo el equipo), en revisión (solo el equipo), publicado (exige al menos un país) y archivado;
  - volver atrás solo si nadie lo usa;
  - no se le quita un país ni un idioma que deje fuera a una organización con workshops publicados por venir.
- **Países y disponibilidad** (`disponible_para_organizacion`):
  - la organización declara en qué países opera (`organizaciones.paises`, códigos activos del catálogo);
  - un storyboard estándar está disponible para ella si está publicado en alguno de esos países; uno personalizado, si es suyo;
  - un workshop solo usa un storyboard disponible para su organización.
- **Idiomas:**
  - los del JSON (`es`, `en`);
  - el workshop va en uno de ellos;
  - la guía sin traducir llega en el idioma principal.
- **Programas, lugares y grupos** (tarea 021):
  - un taller de un programa cae en sus fechas; el programa no se acorta dejando talleres fuera; con talleres no se borra;
  - lugar y grupo se retiran con `activo = false`: no entran en talleres nuevos y los que ya los tenían no cambian; con talleres no se borran;
  - todo de la misma organización: FK compuestas `(id, organizacion_id)`;
  - la comunidad existe aunque no agrupe lugares; al borrarla, sus lugares quedan sin comunidad (`on delete set null`).
- **Jornadas:**
  - un taller con jornada cae entre sus fechas y toma su lugar y su programa; cambiar las fechas de la jornada dejando talleres fuera se rechaza (los archivados no cuentan);
  - si la jornada cambia de lugar o de programa, sus talleres la siguen; si ya se dio alguno, se rechaza;
  - existe aunque no tenga talleres (tarea 023: se crea en su sección y después se le agregan); quedarse sin ninguno no la borra;
  - borrarla a mano deja sus talleres sueltos.
- **Ciclo del workshop:**
  - borrador ⇄ en revisión → publicado (con fecha, hora, lugar, grupo y educador) → finalizado (pasó la fecha o todos dejaron el feedback);
  - cancelado si nadie lo empezó; archivado = descartado;
  - eliminado solo mientras no se ha dado: en borrador, en revisión o publicado sin empezar (`workshops_valida_borrado`, tarea 023); lo dado (finalizado, cancelado o archivado) se archiva y se queda para el reporte;
  - reprogramar = de finalizado o cancelado a publicado, si nadie lo empezó;
  - cancelar, reprogramar y mover la fecha de uno publicado quedan en `workshop_historial` (el workshop solo guarda su estado actual);
  - el cierre de un grupo cerrado lleva niñas y niños; el de uno abierto puede ir solo con el total;
  - lo que pasó (hoy, en curso, realizado, sin realizar) se deduce, no se guarda.
- **Educador:**
  - es de la organización; `activo` lo aparta y `deleted_at` lo da de baja;
  - solo se asigna si está activo y sin baja, y solo a talleres y grupos de su organización (FK compuestas `(id, organizacion_id)`);
  - dar de baja al único educador de un taller publicado falla: antes se reasigna.

## Auth y superficies

| Superficie | Acceso |
|---|---|
| Admin | Supabase Auth con correo y contraseña. Alta cerrada (registro desactivado): las cuentas las crea `canjear-invitacion`. La invitación sale por correo al crearla y su enlace se puede copiar ([decisión 012](decisions/012-invitaciones-por-correo.md)); si alguien olvida la contraseña, el titular o soporte le genera un enlace de recuperación sin correo (`enlace-recuperacion`, [decisión 009](decisions/009-acceso-admin-sin-correo.md)) |
| Educators | Correo y PIN de 6 dígitos que elige el educador con el enlace de acceso que le manda Admin (0013), la primera vez o cuando lo olvida, **sin Supabase Auth**. Usa la anon key y las funciones `educador_*` con un token. No lee tablas |
| Player, gestión | Supabase Auth con las cuentas de Admin, **solo superadmin**. Registra (`sincronizar_storyboard`) y publica (`publicar_storyboard`) el catálogo |
| Player, runner `/play/**` | Público, sin sesión ni Supabase. La guía se la pasa la app que lo incrusta ([runner.md](runner.md)) |

### RLS (`0005`)

| Quién | Qué |
|---|---|
| Superadmin | Administra organizaciones: organizaciones, licencias, administradores, invitaciones de administrador y el contenido (es el único que escribe catálogos, organizaciones, licencias y contenido). De la operación de cada una solo ve cifras (`platform_uso`); el detalle, solo si la administra o colabora, como cualquiera ([decisión 008](decisions/008-superadmin-administra-organizaciones.md)) |
| Admin de una organización | Su organización, su licencia, sus administradores, colaboradores e invitaciones, y toda su operación: educadores, grupos, programas, lugares, comunidades, grupos de audiencia, jornadas, talleres y su reporte |
| Colaborador | La operación de la organización: educadores, grupos, programas, lugares, comunidades, grupos de audiencia, jornadas, talleres, planificador y reporte. Lee la licencia; no gestiona administradores, colaboradores ni invitaciones |
| `anon` | Nada: no tiene ninguna política. Educators entra por las funciones |

- Un storyboard publicado lo ve cualquier usuario de Admin de una organización que opere en alguno de sus países; un personalizado, solo su organización; registrado o en revisión, solo el superadmin.
- `perfiles`: nadie puede escribir `superadmin`, `email` ni `usuario_id` desde la API (permisos por columna). Cada quien edita su perfil; el de otro administrador lo edita el titular de su organización o el superadmin (`perfiles_editables`, 0017).
- `educadores`: el PIN no se lee ni se escribe por la API, ni siquiera el superadmin. El enlace de acceso pendiente (`acceso_token`) sí lo ve quien opera la organización, para copiarlo. Nadie los borra directamente por la API (0012). Quien no ha dado ningún taller lo elimina un administrador con `educador_eliminar` (0014); quien ya dio talleres se da de baja (`deleted_at`), también solo un administrador de la organización, y queda como historial.
- `workshop_feedback`: Admin solo lo lee; lo escribe el educador con `educador_guardar_feedback`.
- `workshop_historial`: quien opera la organización lo lee; lo escribe solo el trigger de `workshops`.
- El trigger de alta lee el rol de `raw_app_meta_data`, nunca de `raw_user_meta_data`.

Una invitación lleva a quién se invita (`nombre`, `apellido`) y, si es de administrador, si será el titular (`titular`): solo el superadmin invita titulares, y quien la canjea o la acepta pasa a serlo (el anterior sigue como administrador). La Edge Function `canjear-invitacion` es la frontera de las invitaciones. `enviar-invitacion` las manda por correo con Resend: Admin la llama al crear la invitación y desde «Reenviar correo»; la RLS decide quién puede (los que pueden crearla o revocarla) y la invitación guarda `correo_enviado_en` o `correo_error` ([decisión 012](decisions/012-invitaciones-por-correo.md)). Al canjear, `canjear-invitacion` enlaza la cuenta explícitamente: Auth guarda el `app_metadata` después de insertar al usuario, así que el trigger de alta solo crea el perfil. Un cambio en ellas revisa a la vez la función, las políticas y el trigger.

## Funciones

| Función | Quién | Qué hace |
|---|---|---|
| `sincronizar_storyboard(metadata)` | Superadmin (Player) | Registra o actualiza un storyboard por su `clave` y las escenas de su guía. No toca estado, países ni organización. `SECURITY INVOKER` |
| `publicar_storyboard(clave, estado, países, organización)` | Superadmin (Player) | El estado del artículo, sus países y si es personalizado |
| `publicar_storyboard_hogar(clave, sí/no)`, `guardar_unidad_estudio(unidad)` | Superadmin (Player) | Si sale en la app del hogar (la base solo lo deja en un publicado estándar y lo quita sola si se archiva o pasa a personalizado) y una unidad de estudio con su lista de storyboards en orden (tarea 022) |
| `hogar_catalogo(país)` | La app del hogar (anon) | Lo que ve una familia de ese país, sin cuenta: los storyboards del hogar disponibles ahí y las unidades publicadas con los suyos, por clave. La edad la filtra la app con el perfil |
| `disponible_para_organizacion(storyboard, organización)` | Cualquier sesión de Admin | Si un storyboard está disponible para una organización (publicado en alguno de sus países, o personalizado suyo). La usan el trigger de los workshops y las apps |
| `educador_crear_acceso`, `educador_revocar_acceso` | Quien opera la organización | El enlace de acceso a Educators (`/acceso/<token>`, 0013): vale una vez y vence a los 7 días; crear otro reemplaza al anterior y revocarlo lo anula, como una invitación. Se guarda cuándo se creó. No toca su PIN ni sus sesiones. La Edge Function `enviar-acceso-educador` lo manda por correo, en el idioma del educador |
| `educador_tiene_historial`, `educador_eliminar` | Quien opera la organización; eliminar, solo un administrador | Si el educador ya dio algún taller (lo inició, lo terminó, dejó feedback o el taller quedó finalizado) y, si no, eliminarlo de verdad con sus asignaciones a talleres que no dio, sus grupos y sus sesiones (0014). Con historial, se da de baja. Un taller publicado conserva al menos un educador |
| `educador_acceso`, `educador_usar_acceso` | Educators (anon) | De quién es el enlace (correo, nombre, organización y si es su primer PIN) y elegir el PIN con él: entra y se cierran las sesiones anteriores de ese acceso |
| `educador_entrar`, `educador_verificar_pin`, `educador_cambiar_pin`, `educador_sesion`, `educador_salir` | Educators (anon) | Entrar con correo y PIN. 5 fallos bloquean 15 minutos. Cambiar el PIN es en dos pasos (0013): confirmar el actual y elegir el nuevo, que lo vuelve a comprobar. Un PIN actual equivocado cuenta como fallo |
| `educador_workshops`, `educador_guia`, `educador_iniciar`, `educador_terminar`, `educador_guardar_feedback` | Educators (anon) | Sus workshops de todas sus organizaciones (con su título, 0016; su organización, su jornada con su lugar, el lugar y el espacio, el grupo y si es abierto), la guía en el idioma del workshop (con el orden y el título de cada escena, 0015), la ejecución y el feedback (con niñas y niños y, si los hubo, cuántos dispositivos se unieron) |
| `conexion_participantes`, `conexion_aprobar`, `conexion_rechazar`, `conexion_presencia` | La pantalla del educador (anon, con el código y la llave) | La conexión del taller (tarea 013): ver quién pide entrar o está, aprobar a uno, a varios o a todos los que esperan, rechazar o quitar, y anotar quién entra y sale para su tiempo conectado. `educador_iniciar` abre la conexión y devuelve el código y la llave (si ya estaba abierta, el mismo código con otra llave); `educador_terminar` la cierra y deja en el cierre cuántos se unieron |
| `participante_buscar`, `participante_entrar`, `participante_estado`, `participante_retirar` | El dispositivo que se une (anon, con el código) | El taller en curso de ese código (título, storyboard e idioma), pedir entrar con avatar y apodo (mientras espera puede cambiarlos; hasta 1,000 por conexión) y en qué estado está. Mientras espera, `participante_estado` es su señal (`ultima_senal_en`): sin ella en 45 s, la solicitud no se ve en `conexion_participantes` ni la aprueba `conexion_aprobar` sin lista; `participante_retirar` borra la suya si aún espera |
| `reporte_talleres(organización, desde, hasta, programa?, comunidad?, lugar?, grupo?)` | Quien opera la organización | El reporte de la tarea 021: resumen (previstos, realizados, cancelados, sin realizar, asistencias, minutos, dispositivos y su tiempo conectado), alcance por par grupo-lugar, pares con su dosis, una fila por workshop y el historial. `SECURITY INVOKER`: la RLS deja solo lo suyo |
| `platform_uso`, `platform_administradores` | Superadmin | Cifras por organización (educadores, personalizados, talleres, jornadas y, para el soporte, educadores sin acceso, talleres próximos y última actividad) y sus administradores con sus teléfonos y su último acceso; nunca el detalle de la operación |
| `platform_eliminar_organizacion` | Superadmin | La baja entera: sus talleres (también los ya dados, que no se eliminan uno a uno) y lo demás en cascada. La impiden sus storyboards personalizados |
| `recuperacion_autorizar(email)` | Superadmin o titular (Edge Function `enlace-recuperacion`) | Si quien lo pide puede generar el enlace de recuperación de esa cuenta; devuelve su correo. El superadmin, para cualquiera; el titular, solo para cuentas que no llegan a otra organización (ni por invitación pendiente); nadie, para la suya |
| `finalizar_workshops_vencidos` | pg_cron, cada hora | Finaliza lo publicado cuya fecha ya pasó |

Las `educador_*` reciben el token, son `SECURITY DEFINER` y devuelven solo lo suyo. Las que validan una sesión la renuevan (escriben): tienen que ser `VOLATILE`, porque PostgREST corre en solo lectura las `STABLE`. Las internas no tienen permiso de ejecución para nadie. La forma JSON de `educador_sesion` y de cada fila de `educador_workshops` está en la cabecera de `0006`.

## Migraciones

| Migración | Responsabilidad |
|---|---|
| `0001_catalogos` | Enums (también `tipo_cambio_workshop`, el del historial), configuración, países, tipos de organización y plantillas de correo |
| `0002_organizaciones` | Organizaciones (con sus países), licencias, perfiles, administradores, colaboradores e invitaciones. Trigger de alta y validación de los países |
| `0003_contenido` | `storyboards`, `guias` y `guia_escenas`; listas por categoría, disponibilidad por organización y reglas de la publicación |
| `0004_operacion` | Educadores, grupos, programas, comunidades, lugares, grupos de audiencia, jornadas (lugar, días y programa; se borran al quedarse vacías), workshops (con su ciclo; uno publicado conserva fecha, hora, lugar, grupo y al menos un educador; con jornada, cae en sus días y toma su lugar y su programa), historial, asignaciones y feedback (con niñas y niños) |
| `0005_rls` | Funciones auxiliares, políticas, las funciones `platform_*` del superadmin y `reporte_talleres` |
| `0006_acceso_educadores` | Sesiones y las funciones `educador_*` (activación y PIN) |
| `0007_catalogo_desde_player` | `sincronizar_storyboard`, `publicar_storyboard` y el catálogo del hogar (`publicar_storyboard_hogar`, `guardar_unidad_estudio`, `hogar_catalogo`) |
| `0008_storage` | Bucket `narracion` |
| `0009_tareas` | pg_cron: finalizar workshops cada hora |
| `0010_recuperacion` | `recuperacion_autorizar`: quién genera el enlace para recuperar el acceso a Admin |
| `0011_correo_invitaciones` | El estado del correo de cada invitación (`correo_enviado_en`, `correo_error`) |
| `0012_baja_de_educadores` | La baja de un educador es lógica (`deleted_at`) y de los administradores: sin `delete` por la API, lo saca de sus grupos y no se da al único educador de un taller publicado |
| `0013_enlace_de_acceso_educadores` | El acceso del educador es un enlace (`educador_crear_acceso`, `educador_revocar_acceso`, `educador_acceso`, `educador_usar_acceso`), como las invitaciones; sin código de activación. `configuraciones.educators_url` y las plantillas `acceso_educador` y `acceso_educador_pin` |
| `0014_eliminar_educadores_sin_historial` | Eliminar de verdad al educador que no ha dado ningún taller (`educador_tiene_historial`, `educador_eliminar`); con historial, la baja lógica de 0012 |
| `0015_guia_con_orden_y_titulo` | `educador_guia` trae también el orden y el título de cada escena, para la ficha del taller en Educators; el runner descarta esas claves |
| `0016_titulo_del_taller_para_el_educador` | `educador_workshops` trae el título del taller que escribió la organización, además del del storyboard |
| `0017_telefonos_del_administrador` | `perfiles.telefono_movil` y `telefono_oficina`; el titular (y el superadmin) edita los perfiles de los administradores (`perfiles_editables`); `platform_administradores` los devuelve |

Qué se ejecuta en producción (y qué no), los pasos posteriores y la tabla de usuarios de prueba: [supabase/README.md](../supabase/README.md).

`supabase/seed.sql` tiene datos de prueba deterministas, solo para local, generados por `scripts/generar-seed.py`:
- dos organizaciones (Fundación Centro en GT y SV; Colegio Norte en GT), con su licencia;
- usuarios de Admin de cada tipo (superadmin, titulares, colaborador);
- «El huevo» publicado en GT con su guía; «La soda» registrado;
- educadores con PIN y con la activación pendiente y un grupo de educadores;
- el programa «Crecer sano» con la jornada «Semana de la nutrición» en «Sede central», la comunidad «Zona centro», los grupos de audiencia de los talleres y «Público general» (abierto);
- workshops en todos los estados, la mayoría dentro de la jornada, cada uno con su lugar y su grupo.

Las credenciales de prueba están en [supabase/README.md](../supabase/README.md) y en la cabecera del seed. Las fechas son relativas al día del reset.

## Trabajo local

```bash
supabase start          # desde la raíz del repositorio; Docker en marcha
supabase db reset       # aplica migraciones y seed (cierra las sesiones abiertas)
supabase test db        # pruebas pgTAP de supabase/tests; corren con y sin seed
npm run db:types        # regenera supabase/database.types.ts, que tipan Admin y Player
python3 scripts/generar-seed.py   # regenera supabase/seed.sql; después, supabase db reset
```

Con Supabase local levantado: API en `http://127.0.0.1:54331` (no en el 54321 por defecto: lo ocupa el monitor de salud de CleanMyMac), Studio en `http://127.0.0.1:54323` y correos de prueba en `http://127.0.0.1:54324` (Admin no usa el correo de Auth: las invitaciones salen por Resend y la recuperación es un enlace que se comparte a mano). La URL y la anon key para el `.env.local` de cada app salen de `supabase status`. Para el QA de punta a punta, la base local va sin seed, como el proyecto nuevo: `supabase db reset --no-seed` y los pasos de [supabase/README.md](../supabase/README.md#base-local-como-en-producción-sin-seed).

Pruebas en `supabase/tests/database/`, **autocontenidas** (cada una crea sus datos en una transacción que se deshace, así que corren con o sin seed):
- `01_rls.test.sql`: lo que ve y escribe cada identidad (superadmin, admin, colaborador, organización ajena y anon); las funciones `platform_*` y la baja de una organización.
- `02_acceso_educadores.test.sql`: activación, PIN, bloqueo, varias organizaciones, workshops, guía, ejecución y feedback.
- `03_catalogo_y_jornadas.test.sql`: registrar y publicar desde Player, taxonomía, disponibilidad por los países de la organización, países e idiomas en uso, jornadas (lugar, días, sus talleres dentro, borrado al quedarse vacías).
- `04_workshops.test.sql`: el ciclo del workshop, editar uno publicado (no se queda sin fecha, hora ni educador), cambiar de educador, reprogramar y la tarea horaria.
- `05_recuperacion.test.sql`: quién genera el enlace de recuperación.
- `06_programas_y_reportes.test.sql`: programas, lugares, comunidades y grupos de audiencia (quién los ve y escribe, otra organización, retirar, borrar), la jornada que da lugar y programa, fechas del programa, el cierre con niñas y niños, el historial y el reporte (alcance por par, grupo abierto, dos cierres, dosis, dispositivos, filtros y RLS).

## Cambiar esquema, triggers o RLS

1. Inspecciona las políticas y triggers vigentes del dominio.
2. Añade o ajusta la prueba pgTAP de la identidad afectada y comprueba en local con `supabase db reset` y `supabase test db`.
3. Regenera los tipos (`npm run db:types`) y corre el typecheck de Admin y Player. Revisa a mano los `select` con embebidos: el typecheck no los ve (una FK que cambia rompe el embebido en ejecución).
4. Prevé la corrección incremental o el rollback: una vez en la nube, la base solo cambia con migraciones nuevas.
5. Pide autorización antes de aplicar en la nube, por un canal temporal; nunca dejes un acceso con escritura siempre activo.
6. Verifica después con consultas de solo lectura.

Una migración en Git no demuestra que esté aplicada. El proyecto nuevo de la nube todavía no existe; al crearlo, `0009` necesita pg_cron activo.

## Acceso del agente

Canal preferido: MCP oficial de Supabase, limitado al proyecto (`project_ref`), con `read_only=true` y `features=database`, autenticado por OAuth y sin tokens en el repositorio. Activarlo requiere la aprobación de Luis.

- No se asume instalado: compruébalo en la sesión. Sin MCP, trabaja con las migraciones y Supabase local, y declara el hueco si el criterio exigía observar la nube.
- Read-only no valida escrituras ni la matriz de roles: no sustituye las pruebas locales ni autoriza una migración.
- Registra en la tarea si el MCP estaba disponible, el entorno consultado y las invariantes comprobadas, sin credenciales, datos personales ni volcados.

## Seguridad

- La anon key es pública por diseño: protegen la RLS y las funciones. Filtrar por `organizacion_id` en un composable no es aislamiento.
- `service_role` nunca llega a apps cliente ni a pruebas de navegador.
- Las funciones `SECURITY DEFINER` (auxiliares de RLS, triggers y `educador_*`) fijan `search_path` y validan su entrada. Las internas no tienen permiso de ejecución para nadie.
- Los triggers aplican sus reglas también fuera de la UI. Player y Admin entran con la misma cuenta de superadmin: que Admin no publique es una regla de las apps, no de la base.
