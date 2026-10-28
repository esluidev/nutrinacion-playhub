# Backend compartido — Supabase

Supabase da Auth, PostgreSQL, RLS, Realtime, Storage, pg_cron y Edge Functions a las apps. La definición ejecutable está en `supabase/migrations/`, `supabase/functions/` y `supabase/tests/`. Este documento es el mapa y las reglas de trabajo, no un volcado del esquema.

Base nueva desde el 2026-10-15 para un proyecto de Supabase nuevo; la anterior (`0001`–`0011`) era de prueba y queda en el historial de Git. El modelo lo definen las decisiones [005](decisions/005-base-nueva-y-acceso-educador.md), [006](decisions/006-modelo-y-catalogo-desde-player.md) y [007](decisions/007-educador-hogar-y-ciclo-del-workshop.md); el análisis y las simulaciones están en la [tarea 006](../tasks/006-modelo-de-datos.md).

## Modelo

```text
configuracion · paises · tipos_organizacion · plantillas_correo

organizaciones ── organizacion_licencias · organizacion_administradores (titular) · jornadas
  │             ── educadores (+ educador_sesiones) · organizacion_publicaciones · temarios
  └── comunidades                         ← tenancy operativo; país y código para unirse
       ├── comunidad_colaboradores · invitaciones
       ├── comunidad_educadores ── educador_grupos ── educador_grupo_miembros
       ├── comunidad_participantes ←── hogar_perfiles ── hogares (+ hogar_sesiones) · hogar_perfil_avance
       └── workshops ── workshop_educadores (ejecución real) ── workshop_feedback

storyboards (metadata del JSON + publicación) ── guias ── guia_escenas
temarios ── temario_storyboards
```

### Nombres

- La tabla principal va en plural (`workshops`); sus hijas llevan delante la principal en singular (`workshop_educadores`, `guia_escenas`, `comunidad_participantes`).
- Las columnas también dicen de qué son: `grupo_asistente`, `idioma_contenido`, `estado_publicacion`, `codigo_acceso`.
- Los estados y valores fijos son **enums** (0001). `npm run db:types` los exporta a las apps en `Constants.public.Enums`: las listas no se repiten en el código. Añadir un valor es `alter type … add value` en una migración nueva.

### Qué hace cada tabla

| Tabla | Qué guarda |
|---|---|
| `configuracion` | `admin_url` (enlaces de los correos) y `player_url` («Probar» en Admin) |
| `paises` | El catálogo de países (nombre por idioma y bandera). Player elige de aquí los de cada storyboard |
| `tipos_organizacion`, `plantillas_correo` | Listas de referencia de Admin y los correos de invitación por idioma |
| `organizaciones` | La relación comercial. Su perfil público (`perfil_publico`, descripción, logo) la hace aparecer en «Unirme» de la app del hogar. Un solo titular por organización (`organizacion_administradores.titular`, índice único) |
| `organizacion_licencias` | Plan, vigencia, cupos y los países donde puede abrir comunidades |
| `organizacion_administradores` | Quién administra cada organización (el titular y los demás); todo en todos los niveles |
| `perfiles` | Los usuarios de Admin (Supabase Auth); `superadmin` lo da solo la base |
| `comunidades` | El tenancy operativo. Su `pais` (de la licencia) decide qué storyboards usa; su `codigo_acceso` lo reparte a las familias |
| `comunidad_colaboradores` | Quién opera cada comunidad sin administrar la organización |
| `invitaciones` | Las invitaciones a administrar o colaborar, hasta que se canjean |
| `storyboards` | El catálogo, como un artículo. La metadata del JSON para listar, filtrar y buscar (`clave`, `slug`, `titulo`, `categoria`, `subcategoria`, `edicion`, `enfoques_salud`, `idiomas`…) y lo que decide Player al publicar: `estado_publicacion`, `paises_disponibles` y, si es personalizado, `organizacion_id` |
| `guias`, `guia_escenas` | La guía del educador: cabecera y una por escena (los 12 campos de la plantilla, por idioma). Se escribe en Admin |
| `educadores` | El educador de una organización: sus datos y su acceso (código de activación y PIN, cifrados; Admin solo ve `tiene_pin` y `activacion_pendiente`) |
| `comunidad_educadores` | A qué comunidades está ligado cada educador (`activo` para desligar sin perder el historial) |
| `educador_sesiones` | Los tokens de Educators: una fila por cada educador (organización) que cubre el token |
| `educador_grupos`, `educador_grupo_miembros` | Grupos de educadores de una comunidad para asignar un workshop a varios a la vez |
| `jornadas` | Las crea la organización: reúnen workshops alrededor de un enfoque de salud |
| `workshops` | El workshop programado y su ciclo (`estado`, `publicado_en`, `finalizado_en`, `cancelado_en`, `motivo_cancelacion`, `reprogramaciones`) |
| `workshop_educadores` | Quién lo imparte y la ejecución real (`iniciado_en`, `terminado_en`, desde el runner) |
| `workshop_feedback` | Lo que cuenta el educador al terminar, del grupo. Nunca puntos ni datos de una persona |
| `temarios`, `temario_storyboards` | Un tema que agrupa storyboards en orden: de Nutrinación (público), de una organización o de una comunidad |
| `organizacion_publicaciones` | Lo que una organización ofrece a sus participantes (un storyboard o un temario), a todas sus comunidades o a una, desde una fecha |
| `hogares`, `hogar_sesiones` | La cuenta del adulto en la app del hogar (nombre, país, idioma, correo y PIN) y sus sesiones |
| `hogar_perfiles` | Los niños de la cuenta: nombre, género, año de nacimiento e intereses |
| `comunidad_participantes` | Los perfiles que se unieron a una comunidad con su código |
| `hogar_perfil_avance` | Qué storyboards terminó cada perfil (solo «terminado»). En la primera versión no lo ve nadie fuera de la familia |

### Lo que no está en la base

- **El contenido del juego:** escenas, narración, consignas, feedback de las escenas, datos, Rive, SVG y efectos viven en los JSON del storyboard, en el build de Player.
- **Las voces:** bucket `narracion`, de lectura pública. El runner las carga con `NUXT_PUBLIC_NARRATION_URL` más la ruta del `audio.manifest.json`.

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
  - no se le quita un país ni un idioma con workshops publicados por venir.
- **Países:**
  - un storyboard está disponible solo en los países que tiene;
  - una comunidad está en un país de su licencia;
  - un workshop solo usa un storyboard disponible en el país de su comunidad.
- **Idiomas:**
  - los del JSON (`es`, `en`);
  - el workshop va en uno de ellos;
  - la guía sin traducir llega en el idioma principal.
- **Ciclo del workshop:**
  - borrador ⇄ en revisión → publicado (con fecha, hora y educador) → finalizado (pasó la fecha o todos dejaron el feedback);
  - cancelado si nadie lo empezó; archivado = descartado;
  - reprogramar = de finalizado o cancelado a publicado, si nadie lo empezó;
  - lo que pasó (hoy, en curso, realizado, sin realizar) se deduce, no se guarda.
- **Educador:**
  - es de la organización y se liga a comunidades;
  - solo se asigna en una comunidad donde está activo (FK compuestas a `comunidad_educadores`, además de las directas que usa la API para embeber).
- **App del hogar:**
  - lo de Nutrinación se filtra por el país de la cuenta;
  - lo de una organización, por el país de la comunidad y con su licencia vigente;
  - siempre por el idioma de la cuenta y la edición del perfil.

## Auth y superficies

| Superficie | Acceso |
|---|---|
| Admin | Supabase Auth con correo y contraseña. Alta cerrada (registro desactivado): las cuentas las crea `canjear-invitacion`. **Sin correos** ([decisión 009](decisions/009-acceso-admin-sin-correo.md)): la invitación se comparte con su enlace y, si alguien olvida la contraseña, el titular o soporte le genera un enlace de recuperación (`enlace-recuperacion`) |
| Educators | Correo y PIN de 6 dígitos que elige el educador la primera vez, con el código de activación que genera Admin, **sin Supabase Auth**. Usa la anon key y las funciones `educador_*` con un token. No lee tablas |
| App del hogar (por crear) | Cuenta del adulto con correo y PIN propio, **sin Supabase Auth**. Usa la anon key y las funciones `hogar_*`. Sin cuenta funciona, pero no guarda nada |
| Player, gestión | Supabase Auth con las cuentas de Admin, **solo superadmin**. Registra (`sincronizar_storyboard`) y publica (`publicar_storyboard`) el catálogo |
| Player, runner `/play/**` | Público, sin sesión ni Supabase. La guía se la pasa la app que lo incrusta ([runner.md](runner.md)). Las voces, del bucket público |

### RLS (`0005`, `0009`)

| Quién | Qué |
|---|---|
| Superadmin | Administra organizaciones: organizaciones, licencias, administradores, invitaciones de administrador y el contenido (es el único que escribe catálogos, organizaciones, licencias y contenido). De la operación de cada una solo ve cifras y el nombre y país de sus comunidades (`platform_*`); el detalle, solo si la administra o colabora, como cualquiera ([decisión 008](decisions/008-superadmin-administra-organizaciones.md)) |
| Admin de una organización | Su organización, su licencia, sus jornadas, sus educadores, sus temarios y publicaciones y todas sus comunidades (con su operación y sus participantes) |
| Colaborador | La operación de las comunidades donde colabora: educadores ligados, workshops, su código, sus participantes y los temarios y publicaciones de su comunidad |
| `anon` | Nada: no tiene ninguna política. Educators y la app del hogar entran por las funciones |

- Un storyboard publicado o archivado lo ve cualquier usuario de Admin de las organizaciones que tocan; un personalizado, solo su organización; registrado o en revisión, solo el superadmin.
- `perfiles`: nadie puede escribir `superadmin`, `email` ni `usuario_id` desde la API (permisos por columna).
- `educadores`: el código de activación y el PIN no se leen ni se escriben por la API, ni siquiera el superadmin.
- `hogar_perfiles`: quien opera una comunidad ve nombre, género y año de nacimiento de sus participantes; nunca intereses, cuenta ni avance. `hogares`, `hogar_sesiones` y `hogar_perfil_avance` no se leen por la API.
- `workshop_feedback`: Admin solo lo lee; lo escribe el educador con `educador_guardar_feedback`.
- El trigger de alta lee el rol de `raw_app_meta_data`, nunca de `raw_user_meta_data`.

Una invitación lleva a quién se invita (`nombre`, `apellido`) y, si es de administrador, si será el titular (`titular`): solo el superadmin invita titulares, y quien la canjea o la acepta pasa a serlo (el anterior sigue como administrador). La Edge Function `canjear-invitacion` es la frontera de las invitaciones; `enviar-invitacion` (correo por Resend) se conserva sin desplegar ni disparar ([decisión 009](decisions/009-acceso-admin-sin-correo.md)). Al canjear, `canjear-invitacion` enlaza la cuenta explícitamente: Auth guarda el `app_metadata` después de insertar al usuario, así que el trigger de alta solo crea el perfil. Un cambio en ellas revisa a la vez la función, las políticas y el trigger.

## Funciones

| Función | Quién | Qué hace |
|---|---|---|
| `sincronizar_storyboard(metadata)` | Superadmin (Player) | Registra o actualiza un storyboard por su `clave` y las escenas de su guía. No toca estado, países ni organización. `SECURITY INVOKER` |
| `publicar_storyboard(clave, estado, países, organización)` | Superadmin (Player) | El estado del artículo, sus países y si es personalizado |
| `educador_generar_codigo` | Admin o colaborador de su comunidad | Código de activación de 6 dígitos (se ve una vez); borra el PIN y cierra sus sesiones |
| `educador_entrar`, `educador_activar`, `educador_cambiar_pin`, `educador_sesion`, `educador_salir` | Educators (anon) | Entrar con correo y PIN; la primera vez, elegir el PIN con el código. 5 fallos bloquean 15 minutos |
| `educador_workshops`, `educador_guia`, `educador_iniciar`, `educador_terminar`, `educador_guardar_feedback` | Educators (anon) | Sus workshops de todas sus comunidades, la guía en el idioma del workshop, la ejecución y el feedback |
| `comunidad_generar_codigo_acceso` | Quien opera la comunidad | El código de acceso para unirse (único en la plataforma); el anterior deja de admitir altas |
| `platform_uso`, `platform_comunidades`, `platform_administradores` | Superadmin | Cifras por organización (uso de la licencia, lo que se perdería al darla de baja y, para el soporte, educadores sin acceso, talleres próximos y última actividad), sus comunidades con sus cifras y sus administradores con su último acceso; nunca el detalle de la operación |
| `platform_eliminar_organizacion` | Superadmin | La baja entera: sus comunidades con su operación y lo demás en cascada. La impiden sus storyboards personalizados |
| `recuperacion_autorizar(email)` | Superadmin o titular (Edge Function `enlace-recuperacion`) | Si quien lo pide puede generar el enlace de recuperación de esa cuenta; devuelve su correo. El superadmin, para cualquiera; el titular, solo para cuentas que no llegan a otra organización (ni por invitación pendiente); nadie, para la suya |
| `organizacion_actualizar_perfil_publico` | Admin de la organización | Mostrarla o no en «Unirme», con su descripción y su logo (no se tocan otras columnas de la organización) |
| `hogar_crear_cuenta`, `hogar_entrar`, `hogar_sesion`, `hogar_salir`, `hogar_actualizar_cuenta`, `hogar_cambiar_pin`, `hogar_borrar_cuenta` | App del hogar (anon) | La cuenta del adulto; el correo no puede estar en uso; el PIN lo elige él |
| `hogar_guardar_perfil`, `hogar_borrar_perfil`, `hogar_unirse`, `hogar_salir_de_comunidad` | App del hogar (anon) | Perfiles (nombre, género, edad e intereses) y unirse con el código; 5 códigos equivocados bloquean 15 minutos |
| `hogar_organizaciones`, `hogar_catalogo_publico`, `hogar_catalogo`, `hogar_completar` | App del hogar (anon) | La lista de «Unirme», lo público sin cuenta, lo que ve un perfil y marcar terminado |
| `finalizar_workshops_vencidos` | pg_cron, cada hora | Finaliza lo publicado cuya fecha ya pasó |

Las `educador_*` y `hogar_*` reciben el token, son `SECURITY DEFINER` y devuelven solo lo suyo. Las que validan una sesión la renuevan (escriben): tienen que ser `VOLATILE`, porque PostgREST corre en solo lectura las `STABLE` (lo comprueba `05_hogar`). Las internas no tienen permiso de ejecución para nadie.

## Migraciones

| Migración | Responsabilidad |
|---|---|
| `0001_catalogos` | Enums, configuración, países, tipos de organización y plantillas de correo |
| `0002_organizaciones` | Organizaciones (con perfil público), licencias, perfiles, administradores, comunidades (país y código), colaboradores e invitaciones. Triggers de alta, cupo y país de la comunidad |
| `0003_contenido` | `storyboards`, `guias` y `guia_escenas`; listas por categoría y reglas de la publicación |
| `0004_operacion` | Educadores de la organización y sus comunidades, grupos, jornadas, workshops (con su ciclo; uno publicado conserva fecha, hora y al menos un educador), asignaciones y feedback |
| `0005_rls` | Funciones auxiliares, políticas y las funciones `platform_*` del superadmin |
| `0006_acceso_educadores` | Sesiones y las funciones `educador_*` (activación y PIN) |
| `0007_catalogo_desde_player` | `sincronizar_storyboard` y `publicar_storyboard` |
| `0008_storage` | Bucket `narracion` |
| `0009_hogar` | Temarios, publicaciones, cuenta del hogar, perfiles, participantes y avance, con su RLS y las funciones `hogar_*` |
| `0010_tareas` | pg_cron: finalizar workshops cada hora |
| `0011_recuperacion` | `recuperacion_autorizar`: quién genera el enlace para recuperar el acceso a Admin |

Qué se ejecuta en producción (y qué no), los pasos posteriores y la tabla de usuarios de prueba: [supabase/README.md](../supabase/README.md).

`supabase/seed.sql` tiene datos de prueba deterministas, solo para local, generados por `scripts/generar-seed.py`:
- dos organizaciones; Fundación Centro con dos comunidades y perfil público;
- usuarios de Admin de cada tipo;
- tres storyboards (publicado en GT, personalizado y registrado) y la guía del huevo;
- educadores con PIN (María, en dos comunidades) y con la activación pendiente;
- workshops en todos los estados;
- temarios, una publicación y una cuenta del hogar con dos perfiles, uno participante.

Las credenciales de prueba están en [supabase/README.md](../supabase/README.md) y en la cabecera del seed. Las fechas son relativas al día del reset.

## Trabajo local

```bash
supabase start          # desde la raíz del repositorio; Docker en marcha
supabase db reset       # aplica migraciones y seed (cierra las sesiones abiertas)
supabase test db        # pruebas pgTAP de supabase/tests (también las corre verify.sh si está levantado)
npm run db:types        # regenera supabase/database.types.ts, que tipan Admin y Player
python3 scripts/generar-seed.py   # regenera supabase/seed.sql; después, supabase db reset
```

Con Supabase local levantado: API en `http://127.0.0.1:54321`, Studio en `http://127.0.0.1:54323` y correos de prueba en `http://127.0.0.1:54324` (Admin no envía correos: la recuperación va por un enlace que se comparte a mano). La URL y la anon key para el `.env.local` de cada app salen de `supabase status`. Las pruebas cuentan con el seed tal cual: después de probar a mano, `supabase db reset`. Para el QA de punta a punta, la base local va sin seed, como el proyecto nuevo: `supabase db reset --no-seed` y los pasos de [supabase/README.md](../supabase/README.md#base-local-como-en-producción-sin-seed).

Pruebas en `supabase/tests/database/`:
- `01_rls.test.sql`: lo que ve y escribe cada identidad (superadmin, admin, colaborador, organización ajena y anon), también en las tablas del hogar; las funciones `platform_*` y la baja de una organización.
- `02_acceso_educadores.test.sql`: activación, PIN, bloqueo, varias comunidades y organizaciones, workshops, guía, ejecución y feedback.
- `03_catalogo_y_jornadas.test.sql`: registrar y publicar desde Player, taxonomía, países e idiomas en uso, jornadas.
- `04_workshops.test.sql`: el ciclo del workshop, editar uno publicado (no se queda sin fecha, hora ni educador), cambiar de educador, reprogramar, la tarea horaria y qué se programa por país e idioma.
- `05_hogar.test.sql`: cuenta, perfiles, unirse con código, lo que ve cada perfil, licencia vencida, borrar la cuenta, el perfil público y que las funciones con sesión no sean `STABLE`.
- `06_recuperacion.test.sql`: quién genera el enlace de recuperación. No usa el seed (crea sus datos): también corre contra la base sin seed.

## Cambiar esquema, triggers o RLS

1. Inspecciona las políticas y triggers vigentes del dominio.
2. Añade o ajusta la prueba pgTAP de la identidad afectada y comprueba en local con `supabase db reset` y `supabase test db`.
3. Regenera los tipos (`npm run db:types`) y corre el typecheck de Admin y Player. Revisa a mano los `select` con embebidos: el typecheck no los ve (una FK que cambia rompe el embebido en ejecución).
4. Prevé la corrección incremental o el rollback: una vez en la nube, la base solo cambia con migraciones nuevas.
5. Pide autorización antes de aplicar en la nube, por un canal temporal; nunca dejes un acceso con escritura siempre activo.
6. Verifica después con consultas de solo lectura.

Una migración en Git no demuestra que esté aplicada. El proyecto nuevo de la nube todavía no existe; al crearlo, `0010` necesita pg_cron activo.

## Acceso del agente

Canal preferido: MCP oficial de Supabase, limitado al proyecto (`project_ref`), con `read_only=true` y `features=database`, autenticado por OAuth y sin tokens en el repositorio. Activarlo requiere la aprobación de Luis.

- No se asume instalado: compruébalo en la sesión. Sin MCP, trabaja con las migraciones y Supabase local, y declara el hueco si el criterio exigía observar la nube.
- Read-only no valida escrituras ni la matriz de roles: no sustituye las pruebas locales ni autoriza una migración.
- Registra en la tarea si el MCP estaba disponible, el entorno consultado y las invariantes comprobadas, sin credenciales, datos personales ni volcados.

## Seguridad

- La anon key es pública por diseño: protegen la RLS y las funciones. Filtrar por `comunidad_id` en un composable no es aislamiento.
- `service_role` nunca llega a apps cliente ni a pruebas de navegador.
- Las funciones `SECURITY DEFINER` (auxiliares de RLS, triggers, `educador_*` y `hogar_*`) fijan `search_path` y validan su entrada. Las internas no tienen permiso de ejecución para nadie.
- Los triggers aplican sus reglas también fuera de la UI. Player y Admin entran con la misma cuenta de superadmin: que Admin no publique es una regla de las apps, no de la base.
