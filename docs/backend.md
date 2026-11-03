# Backend compartido — Supabase

Supabase da Auth, PostgreSQL, RLS, Realtime, Storage, pg_cron y Edge Functions a las apps. La definición ejecutable está en `supabase/migrations/`, `supabase/functions/` y `supabase/tests/`. Este documento es el mapa y las reglas de trabajo, no un volcado del esquema.

Base reescrita el 2026-10-28 para un proyecto de Supabase nuevo, con la organización como única unidad de operación ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)); la anterior, con comunidades y el modelo del hogar, queda en el historial de Git. El modelo viene de las decisiones [005](decisions/005-base-nueva-y-acceso-educador.md), [006](decisions/006-modelo-y-catalogo-desde-player.md) y [007](decisions/007-educador-hogar-y-ciclo-del-workshop.md), con el análisis en las tareas [006](../tasks/006-modelo-de-datos.md) y [011](../tasks/011-organizacion-sin-comunidades.md).

## Modelo

```text
configuracion · paises · tipos_organizacion · plantillas_correo

organizaciones (países donde opera) ── organizacion_licencias · organizacion_administradores (titular)
  ├── organizacion_colaboradores · invitaciones
  ├── educadores (+ educador_sesiones) ── educador_grupos ── educador_grupo_miembros
  ├── jornadas (días y horario)
  └── workshops ── workshop_educadores (ejecución real) ── workshop_feedback

storyboards (metadata del JSON + publicación) ── guias ── guia_escenas
```

### Nombres

- La tabla principal va en plural (`workshops`); sus hijas llevan delante la principal en singular (`workshop_educadores`, `guia_escenas`, `organizacion_colaboradores`).
- Las columnas también dicen de qué son: `grupo_asistente`, `idioma_contenido`, `estado_publicacion`, `paises_disponibles`.
- Los estados y valores fijos son **enums** (0001). `npm run db:types` los exporta a las apps en `Constants.public.Enums`: las listas no se repiten en el código. Añadir un valor es `alter type … add value` en una migración nueva.

### Qué hace cada tabla

| Tabla | Qué guarda |
|---|---|
| `configuracion` | `admin_url` (el enlace de los correos de invitación y de la guía desde Player), `player_url` («Probar» en Admin) y `educators_url` (el enlace de acceso del educador, 0013) |
| `paises` | El catálogo de países (nombre por idioma y bandera). Player elige de aquí los de cada storyboard; la organización, los suyos |
| `tipos_organizacion`, `plantillas_correo` | Listas de referencia de Admin y la copy de los correos por idioma: las invitaciones (`enviar-invitacion`) y el enlace de acceso del educador (`enviar-acceso-educador`) |
| `organizaciones` | La unidad de operación: datos, tipo y **`paises`, los países donde opera** (uno o más, del catálogo). Un solo titular por organización (`organizacion_administradores.titular`, índice único) |
| `organizacion_licencias` | El contrato: `estado`, `fecha_inicio`, `fecha_fin` y notas. Sin cupos |
| `organizacion_administradores` | Quién administra cada organización (el titular y los demás) |
| `organizacion_colaboradores` | Quién opera la organización sin administrarla (`activo` para apartarlo sin perder el historial) |
| `perfiles` | Los usuarios de Admin (Supabase Auth); `superadmin` lo da solo la base |
| `invitaciones` | Las invitaciones a administrar o colaborar, hasta que se canjean; con el estado de su correo (`correo_enviado_en`, `correo_error`) |
| `storyboards` | El catálogo, como un artículo. La metadata del JSON para listar, filtrar y buscar (`clave`, `slug`, `titulo`, `categoria`, `subcategoria`, `edicion`, `enfoques_salud`, `idiomas`…) y lo que decide Player al publicar: `estado_publicacion`, `paises_disponibles` y, si es personalizado, `organizacion_id` |
| `guias`, `guia_escenas` | La guía del educador: cabecera y una por escena (los 12 campos de la plantilla, por idioma). Se escribe en Admin |
| `educadores` | El educador de la organización: sus datos, `activo` (apartado: no recibe talleres ni entra en Educators), `deleted_at` (la baja, la única: no se borran por la API; la dan los administradores y lo saca de sus grupos, 0012) y su acceso (código de activación y PIN, cifrados; Admin solo ve `tiene_pin` y `activacion_pendiente`) |
| `educador_sesiones` | Los tokens de Educators: una fila por cada educador (organización) que cubre el token |
| `educador_grupos`, `educador_grupo_miembros` | Grupos de educadores de la organización para asignar un workshop a varios a la vez |
| `jornadas` | Dónde y cuándo se va: nombre, `ubicacion` y uno o varios días (`fecha_inicio`, `fecha_fin`), todos obligatorios, y descripción opcional. Se crea o se elige al programar un taller |
| `workshops` | El workshop programado y su ciclo (`estado`, `publicado_en`, `finalizado_en`, `cancelado_en`, `motivo_cancelacion`, `reprogramaciones`); si tiene jornada, su fecha cae en sus días y su `ubicacion` es el detalle del lugar de la jornada |
| `workshop_educadores` | Quién lo imparte (y de qué grupo vino) y la ejecución real (`iniciado_en`, `terminado_en`, desde el runner) |
| `workshop_feedback` | Lo que cuenta el educador al terminar, del grupo. Nunca puntos ni datos de una persona |

### Lo que no está en la base

- **El contenido del juego:** escenas, narración, consignas, feedback de las escenas, datos, Rive, SVG y efectos viven en los JSON del storyboard, en el build de Player.
- **Las voces:** bucket `narracion`, de lectura pública, previsto (tarea 013); el runner todavía carga las del build.
- **Personas:** ni participantes ni familias ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)). Un taller dice a qué grupo atiende (`grupo_asistente`, texto) y cuántos asistentes espera.

### Reglas del modelo

- **Identidad del storyboard:** la `clave` UUID de su `storyboard.json`; el slug solo localiza (`/play/<categoria>/<slug>`).
- **Quién decide qué del storyboard:**
  - el JSON, que Player registra con `sincronizar_storyboard`: la metadata y las escenas;
  - Player al publicar (`publicar_storyboard`): estado, países (del catálogo `paises`) y organización;
  - Admin/Platform: la guía.
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
- **Jornadas:**
  - un taller con jornada cae entre sus fechas y hereda su lugar; cambiar las fechas de la jornada dejando talleres fuera se rechaza (los archivados no cuentan);
  - existe mientras tiene talleres: cuando el último se borra o sale de ella, se borra sola (`jornadas_borra_vacia`);
  - borrarla a mano deja sus talleres sueltos.
- **Ciclo del workshop:**
  - borrador ⇄ en revisión → publicado (con fecha, hora y educador) → finalizado (pasó la fecha o todos dejaron el feedback);
  - cancelado si nadie lo empezó; archivado = descartado;
  - reprogramar = de finalizado o cancelado a publicado, si nadie lo empezó;
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
| Admin de una organización | Su organización, su licencia, sus administradores, colaboradores e invitaciones, y toda su operación: educadores, grupos, jornadas y talleres |
| Colaborador | La operación de la organización: educadores, grupos, jornadas, talleres y planificador. Lee la licencia; no gestiona administradores, colaboradores ni invitaciones |
| `anon` | Nada: no tiene ninguna política. Educators entra por las funciones |

- Un storyboard publicado lo ve cualquier usuario de Admin de una organización que opere en alguno de sus países; un personalizado, solo su organización; registrado o en revisión, solo el superadmin.
- `perfiles`: nadie puede escribir `superadmin`, `email` ni `usuario_id` desde la API (permisos por columna).
- `educadores`: el PIN no se lee ni se escribe por la API, ni siquiera el superadmin. El enlace de acceso pendiente (`acceso_token`) sí lo ve quien opera la organización, para copiarlo. Nadie los borra directamente por la API (0012). Quien no ha dado ningún taller lo elimina un administrador con `educador_eliminar` (0014); quien ya dio talleres se da de baja (`deleted_at`), también solo un administrador de la organización, y queda como historial.
- `workshop_feedback`: Admin solo lo lee; lo escribe el educador con `educador_guardar_feedback`.
- El trigger de alta lee el rol de `raw_app_meta_data`, nunca de `raw_user_meta_data`.

Una invitación lleva a quién se invita (`nombre`, `apellido`) y, si es de administrador, si será el titular (`titular`): solo el superadmin invita titulares, y quien la canjea o la acepta pasa a serlo (el anterior sigue como administrador). La Edge Function `canjear-invitacion` es la frontera de las invitaciones. `enviar-invitacion` las manda por correo con Resend: Admin la llama al crear la invitación y desde «Reenviar correo»; la RLS decide quién puede (los que pueden crearla o revocarla) y la invitación guarda `correo_enviado_en` o `correo_error` ([decisión 012](decisions/012-invitaciones-por-correo.md)). Al canjear, `canjear-invitacion` enlaza la cuenta explícitamente: Auth guarda el `app_metadata` después de insertar al usuario, así que el trigger de alta solo crea el perfil. Un cambio en ellas revisa a la vez la función, las políticas y el trigger.

## Funciones

| Función | Quién | Qué hace |
|---|---|---|
| `sincronizar_storyboard(metadata)` | Superadmin (Player) | Registra o actualiza un storyboard por su `clave` y las escenas de su guía. No toca estado, países ni organización. `SECURITY INVOKER` |
| `publicar_storyboard(clave, estado, países, organización)` | Superadmin (Player) | El estado del artículo, sus países y si es personalizado |
| `disponible_para_organizacion(storyboard, organización)` | Cualquier sesión de Admin | Si un storyboard está disponible para una organización (publicado en alguno de sus países, o personalizado suyo). La usan el trigger de los workshops y las apps |
| `educador_crear_acceso`, `educador_revocar_acceso` | Quien opera la organización | El enlace de acceso a Educators (`/acceso/<token>`, 0013): vale una vez y vence a los 7 días; crear otro reemplaza al anterior y revocarlo lo anula, como una invitación. Se guarda cuándo se creó. No toca su PIN ni sus sesiones. La Edge Function `enviar-acceso-educador` lo manda por correo, en el idioma del educador |
| `educador_tiene_historial`, `educador_eliminar` | Quien opera la organización; eliminar, solo un administrador | Si el educador ya dio algún taller (lo inició, lo terminó, dejó feedback o el taller quedó finalizado) y, si no, eliminarlo de verdad con sus asignaciones a talleres que no dio, sus grupos y sus sesiones (0014). Con historial, se da de baja. Un taller publicado conserva al menos un educador |
| `educador_acceso`, `educador_usar_acceso` | Educators (anon) | De quién es el enlace (correo, nombre, organización y si es su primer PIN) y elegir el PIN con él: entra y se cierran las sesiones anteriores de ese acceso |
| `educador_entrar`, `educador_verificar_pin`, `educador_cambiar_pin`, `educador_sesion`, `educador_salir` | Educators (anon) | Entrar con correo y PIN. 5 fallos bloquean 15 minutos. Cambiar el PIN es en dos pasos (0013): confirmar el actual y elegir el nuevo, que lo vuelve a comprobar. Un PIN actual equivocado cuenta como fallo |
| `educador_workshops`, `educador_guia`, `educador_iniciar`, `educador_terminar`, `educador_guardar_feedback` | Educators (anon) | Sus workshops de todas sus organizaciones (con su título, 0016; su organización y su jornada, con su lugar), la guía en el idioma del workshop (con el orden y el título de cada escena, 0015), la ejecución y el feedback |
| `platform_uso`, `platform_administradores` | Superadmin | Cifras por organización (educadores, personalizados, talleres, jornadas y, para el soporte, educadores sin acceso, talleres próximos y última actividad) y sus administradores con su último acceso; nunca el detalle de la operación |
| `platform_eliminar_organizacion` | Superadmin | La baja entera: sus talleres y lo demás en cascada. La impiden sus storyboards personalizados |
| `recuperacion_autorizar(email)` | Superadmin o titular (Edge Function `enlace-recuperacion`) | Si quien lo pide puede generar el enlace de recuperación de esa cuenta; devuelve su correo. El superadmin, para cualquiera; el titular, solo para cuentas que no llegan a otra organización (ni por invitación pendiente); nadie, para la suya |
| `finalizar_workshops_vencidos` | pg_cron, cada hora | Finaliza lo publicado cuya fecha ya pasó |

Las `educador_*` reciben el token, son `SECURITY DEFINER` y devuelven solo lo suyo. Las que validan una sesión la renuevan (escriben): tienen que ser `VOLATILE`, porque PostgREST corre en solo lectura las `STABLE`. Las internas no tienen permiso de ejecución para nadie. La forma JSON de `educador_sesion` y de cada fila de `educador_workshops` está en la cabecera de `0006`.

## Migraciones

| Migración | Responsabilidad |
|---|---|
| `0001_catalogos` | Enums, configuración, países, tipos de organización y plantillas de correo |
| `0002_organizaciones` | Organizaciones (con sus países), licencias, perfiles, administradores, colaboradores e invitaciones. Trigger de alta y validación de los países |
| `0003_contenido` | `storyboards`, `guias` y `guia_escenas`; listas por categoría, disponibilidad por organización y reglas de la publicación |
| `0004_operacion` | Educadores, grupos, jornadas (lugar y días; se borran al quedarse vacías), workshops (con su ciclo; uno publicado conserva fecha, hora y al menos un educador; con jornada, cae en sus días), asignaciones y feedback |
| `0005_rls` | Funciones auxiliares, políticas y las funciones `platform_*` del superadmin |
| `0006_acceso_educadores` | Sesiones y las funciones `educador_*` (activación y PIN) |
| `0007_catalogo_desde_player` | `sincronizar_storyboard` y `publicar_storyboard` |
| `0008_storage` | Bucket `narracion` |
| `0009_tareas` | pg_cron: finalizar workshops cada hora |
| `0010_recuperacion` | `recuperacion_autorizar`: quién genera el enlace para recuperar el acceso a Admin |
| `0011_correo_invitaciones` | El estado del correo de cada invitación (`correo_enviado_en`, `correo_error`) |
| `0012_baja_de_educadores` | La baja de un educador es lógica (`deleted_at`) y de los administradores: sin `delete` por la API, lo saca de sus grupos y no se da al único educador de un taller publicado |
| `0013_enlace_de_acceso_educadores` | El acceso del educador es un enlace (`educador_crear_acceso`, `educador_revocar_acceso`, `educador_acceso`, `educador_usar_acceso`), como las invitaciones; sin código de activación. `configuracion.educators_url` y las plantillas `acceso_educador` y `acceso_educador_pin` |
| `0014_eliminar_educadores_sin_historial` | Eliminar de verdad al educador que no ha dado ningún taller (`educador_tiene_historial`, `educador_eliminar`); con historial, la baja lógica de 0012 |
| `0015_guia_con_orden_y_titulo` | `educador_guia` trae también el orden y el título de cada escena, para la ficha del taller en Educators; el runner descarta esas claves |

Qué se ejecuta en producción (y qué no), los pasos posteriores y la tabla de usuarios de prueba: [supabase/README.md](../supabase/README.md).

`supabase/seed.sql` tiene datos de prueba deterministas, solo para local, generados por `scripts/generar-seed.py`:
- dos organizaciones (Fundación Centro en GT y SV; Colegio Norte en GT), con su licencia;
- usuarios de Admin de cada tipo (superadmin, titulares, colaborador);
- «El huevo» publicado en GT con su guía; «La soda» registrado;
- educadores con PIN y con la activación pendiente, un grupo y la jornada «Semana de la nutrición» en «Sede central»;
- workshops en todos los estados, la mayoría dentro de la jornada.

Las credenciales de prueba están en [supabase/README.md](../supabase/README.md) y en la cabecera del seed. Las fechas son relativas al día del reset.

## Trabajo local

```bash
supabase start          # desde la raíz del repositorio; Docker en marcha
supabase db reset       # aplica migraciones y seed (cierra las sesiones abiertas)
supabase test db        # pruebas pgTAP de supabase/tests; corren con y sin seed
npm run db:types        # regenera supabase/database.types.ts, que tipan Admin y Player
python3 scripts/generar-seed.py   # regenera supabase/seed.sql; después, supabase db reset
```

Con Supabase local levantado: API en `http://127.0.0.1:54321`, Studio en `http://127.0.0.1:54323` y correos de prueba en `http://127.0.0.1:54324` (Admin no usa el correo de Auth: las invitaciones salen por Resend y la recuperación es un enlace que se comparte a mano). La URL y la anon key para el `.env.local` de cada app salen de `supabase status`. Para el QA de punta a punta, la base local va sin seed, como el proyecto nuevo: `supabase db reset --no-seed` y los pasos de [supabase/README.md](../supabase/README.md#base-local-como-en-producción-sin-seed).

Pruebas en `supabase/tests/database/`, **autocontenidas** (cada una crea sus datos en una transacción que se deshace, así que corren con o sin seed):
- `01_rls.test.sql`: lo que ve y escribe cada identidad (superadmin, admin, colaborador, organización ajena y anon); las funciones `platform_*` y la baja de una organización.
- `02_acceso_educadores.test.sql`: activación, PIN, bloqueo, varias organizaciones, workshops, guía, ejecución y feedback.
- `03_catalogo_y_jornadas.test.sql`: registrar y publicar desde Player, taxonomía, disponibilidad por los países de la organización, países e idiomas en uso, jornadas (lugar, días, sus talleres dentro, borrado al quedarse vacías).
- `04_workshops.test.sql`: el ciclo del workshop, editar uno publicado (no se queda sin fecha, hora ni educador), cambiar de educador, reprogramar y la tarea horaria.
- `05_recuperacion.test.sql`: quién genera el enlace de recuperación.

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
