# Backend (Supabase)

> Estado: **conectado (Supabase cloud).** El esquema vive en **un solo archivo**:
> `supabase/migrations/0001_init.sql` (dropea y reconstruye todo; siembra solo catálogos y
> plantillas de correo — ningún dato de negocio). La app **admin** autentica y lee/escribe contra
> Supabase (auth por invitación + área Platform); Edge Functions `canjear-invitacion` y
> `enviar-invitacion` (correo por Resend vía Database Webhook) desplegadas.
> **Pendiente:** el flujo de **educadores** (JWT correo+código por Edge Function), el canje para un
> correo que **ya tiene cuenta** (hoy se rechaza; bloquea al colaborador multi-org) y la migración
> de los datos mock del dashboard de cliente (tarea 013).

## Principios

- **Supabase** — PostgreSQL + Auth + Storage + RLS. Backend compartido de las tres apps.
- **Tenancy = comunidad** — toda tabla operativa cuelga de `comunidad_id`. Nunca "workspace"
  (regla dura 1). *(El aislamiento por comunidad hoy NO lo aplica el RLS — ver la sección RLS.)*
- **Tres niveles** — `organizacion` (titular del contrato + licencia) → `comunidad` (tenancy
  operativo) → operación (miembros, educadores, talleres, feedback…).
- **IDs** — `bigint identity` para entidades de negocio; `uuid` para `auth.users`. `timestamptz`
  para fechas con hora; `date`/`time` cuando no se necesita zona.
- **i18n de contenido** — los textos de cara al niño (`titulo`, `descripcion` de storyboards y
  escenas) son `jsonb` `Localized` (`{ es, en, … }`). La UI de gestión es español.
- **Keys en español, MAYÚSCULAS** (`'PUBLICADO'`, `'GRATUITO'`, …) — la BD la leen devs hispanos,
  así que los keys (valores de enum y `codigo` de catálogo) van en español. Única excepción: `KIDS`.
  (Los labels que ve el usuario sí se traducen — ver el punto siguiente.)
- **Labels de cara al usuario = Localized (jsonb `{ es, en, … }`)**: `nombre`/`descripcion` de
  catálogos, `paises.nombre`, `titulo`/`descripcion` de storyboards y escenas, y la guía por escena.
  Los **nombres propios** (comunidad, persona, organización) son texto simple (no se traducen). El
  país lleva `codigo` ISO estable + `nombre` Localized.
- **Catálogo vs enum.** Las **taxonomías de cara al usuario** (tipos de organización, tipo y
  subcategoría de storyboard, edades de audiencia) son **tablas** de catálogo (`codigo` español +
  `nombre`/`descripcion` Localized + `orden` + `activo`): se renombran sin romper relaciones, crecen,
  y se cargan en los filtros de UI. Los **estados internos / discriminadores** que el código evalúa
  (estados de storyboard/taller/licencia/asignación/feedback de contenido, modalidad, nivel, rol) se
  quedan como **enums** (valores en español).
- **Acceso a datos** — abstraído detrás de una capa por app (no esparcir llamadas a Supabase).

## Modelo en tres niveles

```
organizaciones (UNICEF, una escuela, una empresa)      ← firma el contrato, tiene la licencia
  ├── organizacion_administradores (N:M perfil↔org)    ← quién la administra (uno es `titular`)
  └── comunidades (sede / programa)                    ← tenancy operativo
        ├── colaboradores (N:M perfil↔comunidad)
        ├── educadores (+ grupos)
        ├── talleres → taller_asignaciones_educadores → feedback_taller
        └── storyboards (catálogo) → storyboard_escenas · feedback_storyboard (→ Nutrinación)
```

Un cliente de una sola sede = una organización con una comunidad (mismo modelo, n=1). **Nutrinación**
es también una organización (la **operadora**): programa/ejecuta talleres, con una licencia de
números altos; sus perfiles llevan `superadmin = true`.

**Quién pertenece a qué** (las dos tablas de pertenencia son la clave del modelo):

- **Admin de organización** = fila en `organizacion_administradores`. Alcance: su org + **todas** sus
  comunidades. Varios admins por org, todos con los mismos permisos; `titular` marca al firmante del
  contrato (billing/legal) y **se designa a mano desde el UI**.
- **Colaborador** = fila(s) en `colaboradores`, ligadas a una **comunidad** concreta. Como las
  comunidades cuelgan de orgs distintas, un perfil puede colaborar en **varias organizaciones** sin
  ningún concepto extra. No hace falta un "admin de comunidad": el colaborador ya es el operador de
  la comunidad (si algún día hacen falta permisos finos → columna `rol`/`permisos` en `colaboradores`).
- **Educador** = `educadores.comunidad_id` (1:N). No es usuario de Auth. Si una persona da clases en
  dos comunidades → dos registros.

Corolario: **ser admin o colaborador NO es una propiedad de la persona**, es una propiedad de la
relación. Por eso `perfiles` solo guarda `superadmin` (ver abajo).

## Auth y onboarding (registro cerrado, "organización primero")

No hay registro abierto — es por contrato. **Flujo:**

1. El **super-admin** (Nutrinación; se crea a mano — perfil con `superadmin = true`) crea la
   **organización** + su **licencia** (según el contrato firmado).
2. Emite un **token de administrador** (`invitaciones`, role ADMIN) ligado a esa org.
3. La persona **canjea** el token (código + correo + su contraseña) → se crea su `perfil` y se
   registra en `organizacion_administradores` (con `titular = false`).
4. El super-admin **designa el titular** a mano desde el UI (detalle de la org → Administradores).
5. El admin crea **comunidades**, emite **tokens de colaborador** (role COLABORADOR, ligados a una
   comunidad) y registra **educadores** (correo + código).

El token **nunca crea** una org: solo **enlaza** a una persona con una org/comunidad ya existente.
`invitaciones.role` no es el "rol de la persona": es la **instrucción de qué enlazar** (ADMIN → la
org; COLABORADOR → la comunidad, por eso `comunidad_id` solo se llena en ese caso).

- **admin / colaborador** — usuarios de **Supabase Auth** (email + contraseña); perfil en `perfiles`.
  Qué org/comunidad: `organizacion_administradores` / `colaboradores`.
- **educadores** — **no** son usuarios de Supabase Auth; entran con **correo + código** (contraseña
  simple del admin, hasheada). Auth vía Edge Function → JWT corto.
- **studio** — interno.

**Dos caminos, según si el correo ya tiene cuenta:**

- **Sin cuenta** → el correo trae un link a `/invitacion/[token]` → formulario → se crea la cuenta y
  el trigger enlaza.
- **Con cuenta** → no hay nada que crear: la persona **ya está autenticada dentro de la app**, así que
  la invitación aparece en su **bandeja** (`/invitaciones` + indicador en el header) y la acepta o
  rechaza ahí. Esto además **elimina** la pregunta de seguridad: si ya estás autenticado, no hay
  identidad que probar. `enviar-invitacion` detecta el caso (consultando `perfiles.email`) y manda la
  plantilla `*_existente`, con el CTA apuntando a la bandeja en vez de al token.

`canjear-invitacion` expone `validar` (devuelve `cuentaExiste`), `canjear` (crear cuenta),
y **`aceptar`/`rechazar`** (requieren JWT de usuario: verifican que el correo de la invitación
coincida con el del que responde, y **enlazan a mano** — el trigger solo dispara al CREAR un usuario).

**`configuracion`** — ajustes **generales de la plataforma** (no por organización), clave-valor
(`id` · `clave` unique · `valor` text · `descripcion` · `updated_at`). Ej.: `studio_url` (URL base que
Educators carga y le agrega el slug del juego + parámetros) · `admin_url` (URL base de la app de
administración; la usa el correo de invitación para armar el link). El esquema siembra las dos claves
con `valor` vacío: **hay que setearlas** o el correo de invitación arma un link roto.

**`invitaciones`** — código de un solo uso para crear cuenta y enlazarla a una org/comunidad ya
existente. `id` · `token` (uuid, unique, `gen_random_uuid()`) · `role` (ADMIN|COLABORADOR) · `email?` · `estado`
(PENDIENTE|USADA|EXPIRADA|REVOCADA) · `expira_en` · *FK* `organizacion_id`, `comunidad_id`
(si colaborador), `usada_por` (perfil) · `created_at`.

## Tablas

### Catálogos de tipos

Taxonomías como **tablas** (no enums): `codigo` estable + `nombre`/`descripcion` editables, `orden`
y `activo`; se cargan para los filtros de UI y crecen sin tocar código.

Todas con `codigo` (español, key estable; excepción `KIDS`) + `nombre`/`descripcion` **jsonb
Localized** (es/en) + `orden` + `activo`. Con seeds iniciales de referencia.

**`tipos_organizacion`** — Semilla: CENTRO_EDUCATIVO, EMPRESA, ONG, FUNDACION, GUBERNAMENTAL, OTRO.

**`tipos_storyboard`** — los 4 tipos de storyboard de la plataforma. Semilla: ALIMENTACION,
ACTIVIDAD_FISICA, CUIDADO_PERSONAL, SALUD_EMOCIONAL. ("Nutrición" es el concepto global del
producto, **no** un valor de taxonomía.)

**`categorias_storyboard`** — categoría bajo cada tipo (`tipo_id`). **2 niveles: tipo → categoría.**
El `codigo` es único **por tipo** (`unique(tipo_id, codigo)`, no global): PREVENCION existe bajo
ALIMENTACION y bajo ACTIVIDAD_FISICA como filas distintas. Semilla (las que ya usan los storyboards
compilados): ALIMENTACION → PREVENCION · ACTIVIDAD_FISICA → PREVENCION · CUIDADO_PERSONAL → DIABETES
· SALUD_EMOCIONAL → BIENESTAR. (Mapea directo al doc del educador: "Tipo: Alimentación",
"Categoría: Prevención".)

**`edades_audiencia`** — público objetivo, **preparado para futuro**. `id` · `codigo` · `nombre` ·
`edad_min` · `edad_max` · `orden` · `activo`. Semilla: KIDS (4-8), PREADOLESCENTES (9-12),
ADOLESCENTES (13-17), ADULTOS (18+).

### Capa comercial

**`organizaciones`** — titular del contrato. `id` · `nombre` · `correo` · `telefono` · `website` ·
`tipo_id` (→ `tipos_organizacion`) · `created_at`. La **propiedad vive en
`organizacion_administradores`** (una org puede tener varios admins), no en la comunidad.

**`organizacion_administradores`** — quién administra una organización (N:M perfil↔org). `id` ·
`organizacion_id` · `perfil_id` · `titular` (firmante del contrato; el resto son co-admins con los
mismos permisos de org) · `created_at`. `unique(organizacion_id, perfil_id)`. Lo siembra el trigger
al canjear un token ADMIN, siempre con `titular = false`: **el titular se designa a mano** desde el
detalle de la organización (UI). Nada lo asigna automáticamente.

**`licencias`** — capacidad + alcance de una organización, con **números concretos** (nadie es
"ilimitado"; Nutrinación usa números altos que se suben a mano). `id` · `max_comunidades` ·
`max_educadores` (total) · `max_personalizados` · `fecha_inicio` · `fecha_fin` · `estado`
(ACTIVA|VENCIDA|SUSPENDIDA|**TRIAL**) · `notas` · *array* `paises` (códigos ISO donde puede operar;
vacío = sin restricción) · *FK* `organizacion_id` · `created_at`. **Trial** = `estado = TRIAL` +
`fecha_fin` corta. **Contenido**: la org accede al **catálogo estándar completo** (storyboards sin
dueño) + sus **propios personalizados** (hasta `max_personalizados`); no hay tiers gratis/premium.
Gestión interna de Nutrinación (tarea 016).

### Identidad y tenancy

**`paises`** — `id` · **`codigo` unique** (ISO alpha-2, ej. MX/SV): el país se referencia **por
código** en todo (arrays y FKs). `nombre` (jsonb Localized es/en) · `bandera` (emoji) ·
`extension` (código tel) · `region` (texto simple, ej. "Centroamérica"; agrupación para filtros,
sin tabla aparte) · `activo`. Semilla: Centroamérica + México + Estados Unidos.

**`perfiles`** — usuario administrativo. `id` · `nombre` · `apellido` · `email` · `avatar` · `idioma`
(ISO 639-1, def `es`) · **`superadmin`** (bool, def false) · *FK* `usuario_id` (uuid → `auth.users`) ·
`created_at`.

`superadmin` es lo **único** que define el tipo de usuario a nivel global: abre `/platform`. No hay
columna de "rol" porque **admin** y **colaborador** no son propiedades de la persona sino de la
relación, y ya viven en `organizacion_administradores` / `colaboradores` — un escalar no podría
expresar que alguien sea admin de una org **y** colaborador en la comunidad de otra. `superadmin`
nunca se otorga por invitación (el trigger lo deja en false): se da a mano.

**`comunidades`** — unidad operativa (tenancy). Siempre está en **un país** (`pais`, código ISO; su
región se deriva). `id` · `nombre` · `descripcion` · `correo` · `telefono` · `logo` · *FK*
`organizacion_id`, `pais` · `created_at`. No tiene `tipo` ni dueño propio (viven en la
**organización**).

**`colaboradores`** — perfiles (cuenta dura) que operan **una comunidad**. `id` · `comunidad_id` ·
`perfil_id` · `activo` · `created_at`. `unique(comunidad_id, perfil_id)`. Los admins de la org **no**
necesitan fila aquí (ya administran todas sus comunidades vía `organizacion_administradores`). Un
perfil puede colaborar en varias comunidades — **incluso de organizaciones distintas**: de ahí sale
el multi-org sin ningún concepto extra. No existe "admin de comunidad": el colaborador ya lo es; si
hicieran falta permisos finos → columna `rol`/`permisos` aquí (futuro, cuando alguien lo pida).

**Vista `miembros_comunidad`** — "todos los miembros de una comunidad con su rol". Une las tres
fuentes según su forma de acceso: `organizacion_administradores` (ADMIN — cada admin aparece en cada
comunidad de su org), `colaboradores` (COLABORADOR) y `educadores` (EDUCADOR), etiquetando cada fila
con el enum `role`. Columnas: `comunidad_id` · `role` · `origen` (perfil|educador) · `ref_id` ·
`nombre` · `contacto`. Es **solo lectura**; resuelve la idea de "todos son miembros" sin una
mega-tabla.

### Equipo

**`educadores`** — imparten talleres. **No** son usuarios de Supabase Auth: entran con **correo +
código** (contraseña simple que setea el admin, guardada **hasheada** en `codigo_acceso_hash`; el
admin la resetea, nunca se lee). `id` · `nombre` · `apellido` · `correo` · `telefono` · `profesion`
· `biografia` · `avatar` · `codigo_acceso_hash` · `idioma` (ISO 639-1, def `es`) · `activo` (toggle
rápido del admin) · `deleted_at` (soft delete: null = visible; con fecha = eliminado/oculto) · *FK*
`comunidad_id`, `pais` · `created_at`. **Login válido** = `activo AND deleted_at IS NULL`. Auth:
Edge Function valida correo+código → emite JWT corto con claims (`educador_id`, `comunidad_id`);
refresh automático re-usando la credencial guardada; rate-limit en la function (tarea 006).

**`grupos`** — grupos de educadores. `id` · `comunidad_id` · `nombre` · `descripcion` · `activo` ·
`created_at`.

**`grupos_educadores`** — unión m:n. `id` · `grupo_id` · `educador_id` · `unique(grupo_id, educador_id)`.

### Contenido

**`storyboards`** — plantilla, **build + catálogo** (ver tarea 003). `id` · `clave` (uuid unique,
join key del build) · *build-owned* `slug`, `tipo_id` (→ `tipos_storyboard`), `categoria_id`
(→ `categorias_storyboard`), `idiomas[]`, `audiencia_id` (→ `edades_audiencia`), `numero_escenas` ·
*valor en Supabase* `titulo`/`descripcion` (`jsonb` Localized) · *guía (catálogo-owned)* `objetivo`,
`bibliografia` (Localized) · *catálogo-owned* `estado` (BORRADOR|EN_REVISION|PUBLICADO|ARCHIVADO),
`duracion_min`, `portada` · *array* `paises` (códigos; vacío = global) · *FK* `organizacion_id`
(**dueño si personalizado**; null = estándar/compartido) · `created_at`. **Sin enum de acceso**:
estándar = sin dueño; personalizado = con `organizacion_id`.

**`storyboard_escenas`** — escenas ordenadas. *Build-owned (sync)*: `id` · `storyboard_id` ·
`orden` · `folder` (referencia al juego = la carpeta con `scene.vue`) · `titulo` (Localized).
*Guía pedagógica (catálogo-owned, autorada en Studio → Supabase; 1:1 con el doc del educador; cada
campo es jsonb Localized cuyo valor es **texto enriquecido** con las preguntas/viñetas embebidas en
su sección)*: `descripcion` · `objetivo` · `pedagogia` · `psicologia` · `cientifico` · `consejos` ·
`mecanica` (se completa cuando el juego esté listo). `unique(storyboard_id, orden)`.

**Disponibilidad de un storyboard** — un array `paises text[]` (códigos ISO) en `storyboards`.
**Vacío = GLOBAL** (todas las orgs/comunidades lo ven); con valores = solo esos países. La región
se deriva del país, no se declara. Filtro = `:pais = ANY(paises)` (GIN). Una comunidad ve: los
**globales** + los de **su país**. La **tropicalización** = otro storyboard con su propio targeting.

### Operación

**`talleres`** — lo que el admin **programa una vez** (fecha/hora/lugar). `id` · `titulo` ·
`descripcion` · `fecha` · `hora_inicio` · `hora_fin` · `ubicacion` · `estado`
(BORRADOR|PROGRAMADO|CANCELADO — **solo programación**; "completado" NO es un estado del taller, se
**deriva** de las asignaciones) · `modalidad` (PRESENCIAL|ASIGNADO)
· `notas` · *FK* `comunidad_id`, `storyboard_id` · `created_at`. El taller **cuelga de la comunidad**,
nunca de la organización. **Quiénes lo imparten NO van aquí** (son N) →
`taller_asignaciones_educadores`. La **ejecución** (y su completitud) vive en la asignación, no en el
taller.

**`taller_asignaciones_educadores`** — cada **educador** asignado a impartir un taller = una fila.
**Aquí vive el estado por docente y su estimación.** `id` · `estado` (PENDIENTE|EN_CURSO|COMPLETADO|CANCELADO) ·
`asistentes_estimados` (estimación del admin para ese educador/grupo) · *FK* `taller_id`,
`educador_id`, `grupo_id` (nullable: si se asignó vía un grupo, para reportar) · `created_at` ·
`unique(taller_id, educador_id)`. Asignar un grupo = una fila por cada educador del grupo. "Quiénes
completaron / quiénes no" = query sobre `estado`.

**`feedback_taller`** — encuesta del educador sobre la **ejecución** de un taller, **una por
asignación** (`unique(asignacion_id)`). Al insertarla, la asignación pasa a COMPLETADO (vía
**trigger**, ver abajo). `id` · `calificacion` (1-5) · `asistentes` (nº **real**, lo da el educador)
· `nivel_participacion` (BAJO|MEDIO|ALTO) · `comentarios` (notas del desarrollo del taller) · *datos
del juego (del runner)* `escenas_completadas`, `escenas_total`, `puntos`, `duracion_segundos` · *FK*
`asignacion_id` · `created_at`. (¿Se completó del todo? = `escenas_completadas >= escenas_total`; no
hace falta un booleano aparte.)

**`feedback_storyboard`** — opinión sobre el **contenido** de un storyboard, dirigida a **Nutrinación**
(operador) como canal de mejora. Distinto de `feedback_taller` (ejecución). `id` · `texto` ·
`calificacion` (opcional 1-5) · `estado` (`estado_feedback_contenido`: PENDIENTE|REVISADO|APLICADO|
DESCARTADO, triage de Nutrinación) · *FK* `storyboard_id`, `perfil_id` (autor = admin/colaborador),
`comunidad_id` (contexto) · `created_at`. Autor **solo perfil** (no polimórfico); el educador
transmite lo suyo vía el admin.

> Se descartó una tabla `comentarios` **genérica** (autor/objetivo polimórficos, sin consumidor): el
> único uso con valor —feedback de contenido a Nutrinación— quedó como `feedback_storyboard`, con FK
> reales y bien tipada.

**Trigger `trg_feedback_completa_asignacion`** — `after insert on feedback_taller`: pone la
asignación (`taller_asignaciones_educadores`) en COMPLETADO. Solo en INSERT (editar desde el
historial no re-dispara).

**Trigger `on_auth_user_created` → `handle_new_user()`** — `after insert on auth.users`
(`security definer`): crea el `perfil` con los datos que vienen en `raw_user_meta_data` (los pone
`canjear-invitacion`) y lo **enlaza** según `role`: ADMIN → `organizacion_administradores`,
COLABORADOR → `colaboradores`. Corre en la misma transacción del insert → atómico. No otorga
`superadmin` ni `titular`: ambos quedan en false y se dan a mano.

### Participantes (fuera por ahora)

El andamiaje de niños trazables (`participantes`, `grupos_participantes`,
`taller_asignaciones_participantes`) **se eliminó del esquema**: eran tres tablas para una función
que no existe y que las apps ignoraban. Vuelve cuando la **tarea 015** sea real, y conviene
rediseñarlo entonces en vez de arrastrar el diseño viejo. Se conservan el valor `PARTICIPANTE` del
enum `role` y `talleres.modalidad` (PRESENCIAL|ASIGNADO) para no cerrarse la puerta.

## RLS

**Simple por defecto, apretado donde importa.** El default de `0001` es una política por tabla
(`<tabla>_authenticated`): `for all to authenticated using (true) with check (true)`.

- **`anon`** (sin sesión) → sin acceso a nada. La página pública de invitación no lee tablas: pasa
  por la Edge Function.
- **`service_role`** (Edge Functions, sync de Studio) → bypasea RLS siempre (comportamiento Supabase).

**Tablas que YA filtran de verdad** (se van apretando de a una, según necesidad):

| Tabla | Lectura | Escritura |
|---|---|---|
| `comunidades` (`0002`) | superadmin · admin: las de sus orgs · colaborador: las suyas | superadmin · admin de la org dueña (`with check` impide crearlas en org ajena) |
| `invitaciones` (`0005`) | superadmin · las dirigidas a MI correo · las de mis orgs | superadmin · admin: solo tokens COLABORADOR de sus orgs |

**Patrón:** subconsultas **inline**, sin funciones `rls_*()`. No recursan porque las tablas que
consultan (`perfiles`, `organizacion_administradores`, `colaboradores`) siguen en `using (true)` y no
referencian de vuelta. **Validar ejecutando**, no parseando: con usuarios simulados (`set role
authenticated` + stub de `auth.uid()`) se comprueba qué ve cada quién.

**Lo que sigue sin filtrar:** el resto de tablas. Cualquier usuario logueado las lee/escribe. El gate
de `/platform` **no** vive aquí: lo aplica el middleware de la app (`perfiles.superadmin`).

**Por qué así:** el modelo granular anterior (11 helpers `rls_*()` `SECURITY DEFINER` + ~55 políticas
por comunidad/rol) era imposible de mantener y depurar para el tamaño real del proyecto, que además
no maneja información crítica. Se cambió por esto a conciencia, con el plan de **afinar tabla por
tabla según la necesidad** — no de reconstruir todo el andamiaje de golpe.

**Qué falta apretar:** `organizaciones`/`licencias` (escritura solo-superadmin) y las tablas
operativas (`educadores`, `grupos`, `talleres`, `feedback_*`) con el filtro por comunidad — eso urge
cuando el dashboard de cliente se conecte a datos reales y existan usuarios no-superadmin de verdad.

**Pendiente**: el flujo de claims del educador (JWT correo+código por Edge Function) y **revocar el
select de `educadores.codigo_acceso_hash`** para clientes (RLS filtra filas, no columnas — hace falta
un column grant o una vista).

## Storage

Bucket `uploads` (o el que se defina). Rutas (a definir): `comunidades/{comunidad_id}/logo.*` ·
`avatares/{perfil_id}/*` · `storyboards/{storyboard_id}/*` · `juegos/{juego_id}/*`.

## Decisiones clave (recap)

- **Comunidad = tenancy operativo**; organización = capa comercial encima (regla dura preservada).
- **Feedback de taller** = una fila por taller; repetir un taller (otro turno/grupo) = otro taller
  = otra fila. El runner emite los datos del juego por el bridge; **Educators los escribe** (no el
  runner).
- **Niños** = audiencia: hoy solo un conteo (`feedback_taller.asistentes`). Como entidad trazable
  quedan para la tarea 015; **nunca son miembros**.
- **Licencia** vive en la organización y define a qué contenido/funciones tiene derecho.
- **Storyboards: Studio = fuente de verdad del contenido; Supabase = catálogo/índice operativo.**
  Lo pesado (juegos HTML) se queda en el build y se referencia por `clave`; lo que las apps muestran
  (identidad, título/descripción, **guía**, catálogo) se **sincroniza/autora desde Studio** (el
  formulario del detalle, tarea 003/009) hacia Supabase. **No** hay registro manual ni API runtime
  de Studio (sirve por compilación). El `storyboard.json` (artefacto de código) usa **nombres de
  campo en inglés** (`key`, `slug`, `type`, `category`, `audience`, …); el sync los mapea a las
  columnas en español de la BD (`clave`, `slug`, `tipo_id`, `categoria_id`, `audiencia_id`).
- **Identidad de storyboard = `clave` (uuid), no el slug.** La `clave` es única, estable ante
  renombres y es el join key build↔Supabase; **todo lo que relaciona** (taller→storyboard, sync)
  la usa. El **slug** (nombre de carpeta, ej. `el-huevo`) es solo un **localizador** de contenido/URL — se
  declara como `slug` en el `storyboard.json` (auto-descriptivo y validable contra la carpeta), pero
  no es identidad (se quitó el `id` ambiguo; usar el uuid en URLs/carpetas sería mala DX). Internamente la BD mantiene un PK serial para FKs
  uniformes, pero la **identidad lógica es la clave**.
- **Guía pedagógica** = catálogo-owned: se autora y traduce en la UI de Studio y se guarda en
  Supabase (Localized), para que Educators la lea directo. No se compila en `scene.config.ts` (eso
  es para strings/audio del juego en runtime). Estructura rica por escena según el doc del educador.

## Drift a corregir

- `apps/admin/app/utils/types.ts` usa **`workspace`/`workspace_id`** y `Workspace`: renombrar a
  `comunidad`/`comunidad_id` al migrar admin (tarea 013). Viola la regla dura 1.
- `storyboards.acceso`/`plan`: admin usa `free/premium/custom`; el esquema unifica a
  `gratuito/premium/personalizado` (como los tipos de Studio).
- el tipo en Studio usa guion (`actividad-fisica`); el enum SQL usa `actividad_fisica` — mapear en
  la capa de acceso.

## A definir

- Políticas RLS concretas y resolución RLS del flujo de educadores (correo + código).
- Asociación y **versionado juego↔escena** (hoy `folder`; `juego_bundle_url` reservado).
- Contenido futuro para **adolescentes/adultos**: el esquema ya lo soporta (`edades_audiencia`); falta
  el análisis de estructura de storyboards y UI en Studio cuando llegue.
- Visibilidad cross-comunidad para un admin a nivel organización (futuro).
- `duracion`: hoy `int` minutos; confirmar si se prefiere texto libre.
