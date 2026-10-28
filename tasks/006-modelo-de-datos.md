---
id: 006
estado: haciendo
prioridad: alta
creada: 2026-10-14
---
# Modelo de datos según la constitución de producto

## Objetivo

Adaptar el esquema de Supabase a la constitución (`../product/01 - Constitucion de producto.md`) y conectar Admin, Educators y el runner al modelo nuevo.

## Alcance

Propuesta; se acuerda con Luis antes de ejecutar.

- Brechas detectadas el 2026-10-14:
  - familia de contenido y registro de afirmaciones;
  - enfoque de salud y jornada;
  - materiales por storyboard;
  - modos y sesión del taller;
  - estructura de la guía de PlayHub;
  - cierre estructurado del facilitador;
  - `feedback_taller` guarda puntos y escenas completadas, cosa que la constitución prohíbe usar como evidencia ante una organización.
- Auth del educador con correo y código, sin Supabase Auth ([decisión 002](../docs/decisions/002-superficies-y-guia.md)).
- Supabase local (`config.toml`, seed determinista, matriz RLS) antes de cualquier migración en cloud; evaluar las ramas de Supabase.

## Criterios de aceptación

Por definir al preparar la tarea.

## Plan

Propuesta para acordar con Luis antes de ejecutar.

### Leer

- `../product/01 - Constitucion de producto.md`: facilitador, cierre, medición agregada y modos.
- `supabase/migrations/0001…0011` (esquema y RLS actuales).
- `docs/architecture.md`, «Cómo se conectan las apps» y «Pendiente para la conexión real».
- `docs/backend.md` y `docs/decisions/002-superficies-y-guia.md`.
- Los puntos de conexión en las apps:
  - Educators: `useTalleres` (también la guía que da al runner, contrato en `docs/runner.md`), `useSesion`, `utils/talleres.ts`;
  - Admin: `useWorkshops`, `usePlatformStoryboards`.

### Tocar

- `supabase/config.toml`: hoy no existe; se crea con `supabase init`.
- Seed determinista y migraciones nuevas.
- Composables de datos de Educators.
- La lectura de la guía en Educators (la pasa al runner con `iniciar`; Player no lee la base).
- Admin, donde cambie el modelo.

### Verificar

- `supabase start` y `supabase db reset` en local.
- Matriz de RLS por identidad: superadmin, administrador de organización, colaborador, educador con código y anónimo.
- `./scripts/verify.sh` y el flujo de punta a punta en el navegador: Admin programa, Educators inicia, el runner termina, feedback, Admin lo ve agregado.

## Propuesta de modelo (2026-10-15)

**Corrección (2026-10-15):** Luis no aprobó esta propuesta completa. Respondió dos preguntas ([decisión 005](../docs/decisions/005-base-nueva-y-acceso-educador.md)) y yo lo tomé como aprobación de todas las tablas. Luis cuestiona la mayoría: ver el log. Sus dos respuestas:
1. **La base actual es de prueba y se crea un proyecto nuevo:** base nueva, con los nombres alineados.
2. **Acceso del educador:** el correo que se le da de alta en Admin más un código que Admin genera, sin Supabase Auth y sin verificar roles y permisos por todos lados. Se implementó con un token de sesión y funciones `educador_*`, no con la sesión anónima de Auth que se había recomendado.

Lo que sigue es el análisis que llevó a la decisión.

Fuentes:
- la constitución 1.5;
- la especificación de storyboard;
- el skill `playhub-guides-design`: `catalogo.md` (taxonomía cerrada) y `plantilla.md` (campos de la guía);
- las decisiones 002 y 004;
- las migraciones `0001`–`0011`;
- el uso real de la base en Admin.

### Uso actual de la base (medido)

- Todo el acceso está en 13 composables de Admin y en las Edge Functions `canjear-invitacion` y `enviar-invitacion`. Educators y Player no tocan Supabase.
- **No hay tipos generados:** los composables usan sus propias interfaces con `as unknown as`. Renombrar una columna **no falla en typecheck**; falla en ejecución.
- Sin uso en código:
  - `feedback_taller`, `feedback_storyboard`, la vista `miembros_comunidad` y `educadores.codigo_acceso_hash`;
  - los valores `EN_CURSO` y `CANCELADO` de las asignaciones y `nivel_participacion`.

### Hueco de seguridad en la base actual (urgente si la nube tiene usuarios reales)

`0001` crea en cada tabla la política `for all to authenticated using (true) with check (true)`. Solo `0002`–`0011` la sustituyen en comunidades, invitaciones, storyboards y la operación.

Siguen abiertas a cualquier usuario con sesión: `perfiles`, `organizaciones`, `organizacion_administradores`, `licencias`, `configuracion`, los catálogos y `plantillas_correo`.

Consecuencias, con la anon key y su propia sesión, cualquier admin o colaborador puede:
- marcarse `superadmin = true` en su perfil;
- añadirse como administrador de otra organización;
- cambiar licencias y la URL de los correos.

Además, `storyboards_lectura` (`0009`) deja ver los personalizados de otras organizaciones; la constitución dice que solo los ve la suya.

La base nueva lo cierra. Para la nube, si tiene usuarios reales, conviene una migración correctiva antes; requiere la autorización de Luis.

### Lo que se mantiene

- Capa comercial y tenancy:
  - `organizaciones`, `licencias`, `organizacion_administradores`;
  - `comunidades`, `colaboradores`, `invitaciones`, `perfiles`;
  - `paises`, `tipos_organizacion`, `plantillas_correo`;
  - los triggers de `0007` y `0008`, las dos Edge Functions y la RLS de `0002`–`0011` como base.
- `educadores`, `grupos` (de educadores) y `grupos_educadores`.
- `storyboards` y `storyboard_escenas`, con la división build/catálogo y la `clave`.
- `feedback_storyboard`, sin cambios.

### Lo que cambia

| Hoy | Propuesta | Por qué |
|---|---|---|
| `categorias_storyboard` con PREVENCION, DIABETES, BIENESTAR | Las subcategorías reales por área: 25, de `catalogo.md` | Diabetes es un enfoque de salud, no una subcategoría |
| `edades_audiencia` con ADULTOS | Solo las tres ediciones | «El producto no educa a personas adultas» |
| `storyboards.bibliografia` | El registro de afirmaciones de la familia y `fuentes_apoyo` | Las fuentes van por afirmación |
| `storyboards` | Se añaden `familia_id`, `adaptado_a` (para quién es un personalizado) y `publico`, y los enfoques de salud | Taxonomía de la constitución y cabecera de la guía |
| `storyboard_escenas`: descripción, objetivo, pedagogía, psicología, científico, consejos, mecánica | Los campos de la guía: verbo, subtítulo, descripción, objetivo, pedagogía, preguntas, psicología, científico, `no_hace`, consejos, mecánica y material | Faltan verbo, subtítulo, preguntas, «lo que esta escena no hace» y material (la especificación pide el material por escena) |
| `talleres.modalidad`: PRESENCIAL / ASIGNADO («lo ejecuta por su cuenta») | PRESENCIAL / REMOTO / HIBRIDO. «Por su cuenta» sería un taller sin fecha fija | La constitución define presencial, remoto o híbrido |
| `talleres` | Se añaden `idioma` (del contenido), `grupo` (texto, p. ej. «2.º B») y `jornada_id` | Hoy el runner toma el idioma de la UI de Educators. El grupo es un dato de operación, sin registrar participantes |
| `taller_asignaciones_educadores` | Se añaden `iniciado_en` y `terminado_en`, desde `listo` y `terminado` del runner | «Taller programado y ejecución real» no se confunden; las ejecuciones son evidencia admitida |
| `feedback_taller` con puntos, escenas completadas y escenas totales | El cierre del facilitador: calificación, asistentes, participación (BAJA/MEDIA/ALTA), claridad (POCO_CLARA/CLARA/MUY_CLARA), lo que costó y el material que faltó. Sin puntos ni escenas | Los puntos nunca son evidencia ante una organización. Hoy no lo usa ningún código |
| `configuracion.studio_url` | `player_url` | Renombre pendiente |

### Lo nuevo

- **`familias`**: tema, área, intención educativa y límites. Agrupa las ediciones de un mismo tema.
- **`afirmaciones`**: el registro de la familia, con código, texto, fuente y «pendiente de fuente».
  - `escena_afirmaciones` dice qué escena introduce cada una. Sale de `scene.json` (`affirmations`) al sincronizar.
  - La validación se hace una vez por tema, como pide la constitución.
- **`enfoques_salud`**: las 13 etiquetas de `catalogo.md`.
  - `area_enfoques`: la lista cerrada de cada área.
  - `storyboard_enfoques`: los enfoques de cada storyboard.
- **`jornadas`**: comunidad, nombre, enfoque opcional y fechas, más `talleres.jornada_id`. La jornada es donde se materializa el enfoque.
- **Sesión del educador:** depende de la decisión 2.
- **Bucket `narracion`:** lectura pública; escriben solo el superadmin y el servicio.

### Fuera de esta entrega

- La sesión del taller con dispositivos (Realtime y código para unirse): entrega propia.
- Participantes, membresía y continuidad: la app del hogar, que se creará después.
- Materiales descargables (archivos): por ahora, el campo `material` de cada escena.

### Voces: sin base de datos (propuesta de Luis)

Luis propone una variable global con la URL del bucket y, en cada storyboard, el `audio.manifest.json` con el resto de la ruta de cada voz. Así no se lee la base para algo que pertenece al contenido.

Encaja con el runner actual, que ya busca cada voz por su texto en el manifiesto. Ajustes propuestos:
1. **Cada línea del manifiesto gana `file`:** una ruta relativa con un hash del contenido, `alimentacion/el-huevo/es/bienvenida-01.3f9a2c.mp3`.
   - Una voz regenerada cambia de nombre, así que ninguna caché ni CDN sirve la vieja.
   - Un build anterior de Player sigue encontrando la suya.
2. **Comprimidas** en MP3 o AAC, que reproducen todos los navegadores, incluido Safari en iPad. El WAV de VoiceBox queda como original de trabajo.
3. **Primero se suben las voces y después se despliega Player.**
   - La URL base va en Player (`NUXT_PUBLIC_NARRATION_URL`) y cambia por entorno: local en `127.0.0.1:54321`, la nube en producción.
   - Una voz que falte se dice con la voz del navegador, que es el respaldo que ya existe.

### Decisiones para Luis

1. **¿Base nueva o migraciones sobre la actual?** Depende de si los datos de la nube se conservan.
   - Si son de prueba: una base nueva, que reescribe `0001`–`0011` en un esquema limpio con la RLS cerrada. Aprovecha para alinear nombres (`areas`, `subcategorias`, `ediciones`) y generar tipos para Admin, de modo que un renombre falle en typecheck.
   - Si hay datos reales: migraciones `0012+` sobre lo actual, sin renombrar tablas.
2. **Sesión del educador (correo y código).**
   - **a) Sesión anónima de Supabase Auth, más una función que verifica el código y vincula esa sesión con el educador** (con caducidad).
     - A favor: renovación de token, Realtime y el cliente estándar sin código criptográfico propio.
     - En contra: crea usuarios anónimos que hay que limpiar; hay que activar el acceso anónimo, con captcha recomendado; ninguna política puede volver a ser «cualquier `authenticated`».
     - El educador sigue sin cuenta ni contraseña en Auth: sus credenciales siguen siendo su correo y su código. Hay que ajustar la redacción de la decisión 002.
   - **b) Token propio firmado por una Edge Function.**
     - A favor: no toca Auth.
     - En contra: hay que gestionar la clave de firma (Supabase migró a claves asimétricas) y no hay renovación.
   - Recomendación: **a**.

### Plan por entregas

1. **Estructura:**
   - migraciones;
   - `seed.sql` determinista: catálogos, más una organización, comunidad, educador con código, talleres y la guía del huevo como los datos de prueba de Educators;
   - RLS con pruebas pgTAP por identidad (superadmin, admin, colaborador, educador, ajeno y anónimo) en `supabase/tests`.
   - Verificación: `supabase db reset` y `supabase test db`.
2. **Admin adaptado:** tipos generados, guía con los campos nuevos, taller con idioma, grupo y jornada, y el cierre.
3. **Sesión del educador y Educators conectado:** talleres, guía y cierre.
4. **Voces en el bucket:** script de publicación y runner por URL.
5. **Sesión del taller con dispositivos.**

Nada se aplica en la nube sin autorización.

## Esquema revisado con Luis (2026-10-15)

Registrado como [decisión 006](../docs/decisions/006-modelo-y-catalogo-desde-player.md).

**Aprobado por Luis:**
- Nombres con contexto, también en las columnas (`grupo_asistente`). Regla: la tabla principal en plural; sus hijas llevan delante el nombre de la principal en singular.
- `guias` y `guia_escenas`.
- `workshops`, `workshop_educadores` y `workshop_feedback`.
- `educador_grupos`, `educador_grupo_miembros` y `educador_sesiones`.
- `organizacion_licencias` y `comunidad_colaboradores`.
- El resto se queda como en la base vieja.
- **De las tablas que propuse, solo se queda `jornadas`:** una organización puede crear jornadas desde el principio; es parte del núcleo.
- Fuera: `areas`, `subcategorias`, `ediciones`, `enfoques_salud`, `area_enfoques`, `storyboard_enfoques`, `familias`, `afirmaciones` y `escena_afirmaciones`.
- **Los enfoques de salud (etiquetas) van en el JSON de estructura del storyboard**, como la categoría.
- **`storyboards` copia buena parte de la metadata del JSON** para filtros y búsquedas, sin tablas aparte.
- **Player registra el catálogo:** crea los registros de cada storyboard en Supabase y comprueba si lo local está al día con la base.

Por confirmar: si la guía guarda el registro de afirmaciones y sus fuentes. Hoy no hay dónde.

### En análisis: participantes (Luis, 2026-10-15)

Luis plantea una tabla de participantes desde el principio, de uso opcional.

Límites de la constitución:
- **Identidad y membresía son opcionales** (principio 12); el aprendizaje no exige registrar a nadie.
- **Nunca un expediente individual:** ni respuestas, ni puntos, ni resultados por persona; la medición es de grupo.
- **Son menores de 4 a 17 años:** lo mínimo posible y con consentimiento de sus tutores.

Opciones planteadas: (a) sin registro, como hoy; (b) registro opcional de participantes con lo mínimo; (c) membresía sin datos personales, con códigos de la comunidad que la familia usa en la app del hogar.

**Luis prefiere la (c):** el código relaciona con la comunidad y, con ella, con la organización. Caso de uso: un colegio programa en la comunidad «Primera Infancia» los talleres semanales y quiere que sus participantes sigan viendo, fuera del horario de clase, más contenido que la comunidad programa.

Cómo funcionaría (propuesta, sin decidir):
- La comunidad genera en Admin un código corto, con su QR, y lo reparte a las familias.
- En la app del hogar, la familia lo introduce y el perfil queda como miembro de la comunidad. No se pide ningún dato personal.
- Ser miembro da acceso a lo que la comunidad marca para sus miembros. También permite la señal agregada de continuidad: cuántos miembros jugaron algo esta semana, nunca quién.

Por decidir:
1. **¿Un código por comunidad o por grupo de participantes?**
   - Por comunidad: lo más simple. Pero no distingue 1.º A de 2.º B y, si el código se filtra, hay que cambiarlo para todos.
   - Por grupo («2.º B»): la comunidad puede programar contenido para un grupo, y la señal de continuidad sale por grupo, que es como mide la constitución. Pide una tabla de grupos de participantes (`participante_grupos`); `workshops.grupo_asistente`, hoy texto libre, podría pasar a apuntar a ella.
   - Por participante: lo descartaría; equivale a una lista nominal de menores.
2. **¿Caduca la membresía?** Un colegio cambia de alumnos cada curso. Con un código con vigencia y membresías que caducan con él, un exalumno no sigue viendo el contenido de la comunidad.
3. **¿Dónde vive la membresía?** Depende de los perfiles (abajo).
   - En el servidor: cambiar el código solo impide altas nuevas; los miembros siguen.
   - Solo en el dispositivo (el código guardado): cambiar el código echa a todos.

Tablas que harían falta (borrador):
- `comunidad_codigos`: código, grupo opcional, vigencia y activo; lo gestiona la comunidad en Admin.
- `participante_grupos`: si los códigos van por grupo.
- La membresía, según cómo se guarden los perfiles (`hogar_membresias`).

### En análisis: la app del hogar (Luis, 2026-10-15)

**Colecciones de talleres.** Las crean las organizaciones y también Nutrinación: `colecciones` (de Nutrinación, de una organización o de una comunidad) y `coleccion_storyboards` (ordenados), cada una pública o solo para miembros.

**Unirse a una organización.** Conviene separar dos cosas:
- **Seguir** una organización: sin código, ve lo que hace público.
- **Ser miembro** de una comunidad: con su código, ve además lo de la comunidad.

**Perfiles sin Supabase Auth y qué pasa al cambiar de dispositivo** (la pregunta 2 de Luis). Qué se pierde con cada opción:

| Opción | Cambia de dispositivo | Pierde el dispositivo | Varios dispositivos | Qué guarda el servidor |
|---|---|---|---|---|
| A. Solo en el dispositivo | Todo: códigos, ruta y preferencias. Puede volver a meter los códigos si aún los tiene | Todo | No | Nada |
| B. Hogar en el servidor, con token propio (como el educador) y código de recuperación | Nada: vincula el nuevo desde el viejo o con el código de recuperación | Nada si guardó el código de recuperación; todo si no | Sí | Alias, edición, membresías y ruta de cada perfil |
| C. Hogar con el correo de un adulto | Nada: entra con el correo | Nada | Sí | Lo de B más el correo del adulto |
| D. Mixta: empieza como A y pasa a B cuando la familia se une a una comunidad o pide guardar | Como A hasta pasar a B; después, como B | Igual | Sí, después de pasar a B | Solo de quien pasa a B |

Datos que pesan:
- **En la web, el dispositivo no es un sitio estable.** Safari borra el almacenamiento de un sitio (localStorage, IndexedDB) tras 7 días de uso de Safari sin interacción con ese sitio. Las apps añadidas a la pantalla de inicio llevan su propio contador, pero hay reportes de que también se borran ([WebKit, bug 237350](https://bugs.webkit.org/show_bug.cgi?id=237350)). Las fuentes son de 2020: hay que comprobarlo en los iPad y teléfonos reales. Con A, una familia que no abre la app una semana puede perderlo todo en Safari.
- **La membresía en el servidor la piden dos cosas:** cambiar un código sin echar a todos y la señal agregada de continuidad, que la constitución solo admite con membresía registrada.
- **El patrón de B ya existe y está probado:** es el del educador (`educador_sesiones` y funciones para `anon`). Serían `hogares`, `hogar_sesiones`, `hogar_perfiles` y `hogar_membresias`. `perfiles` ya es la tabla de usuarios de Admin, así que los del hogar necesitan su contexto.
- **Lo que se pierde en B o D sin el código de recuperación** es lo mismo que en A. La pérdida baja si vincular otro dispositivo es fácil: un código que dura minutos, mostrado en el dispositivo viejo.
- **C es la recuperación más conocida, pero:**
  - pide el correo de un adulto;
  - añade fricción;
  - con Supabase Auth contradice el objetivo de Luis; sin Supabase Auth, hay que enviar y validar correos por cuenta propia.

**Mi recomendación:** D, con código de recuperación y vincular otro dispositivo, sin correo de entrada.
- Empieza sin nada, como pide el principio 12.
- Pasa al servidor justo cuando aparece lo que no se debe perder: la membresía de una comunidad.
- No usa Supabase Auth.
- En contra: dos modos que mantener y el paso del dispositivo al servidor.

**Ruta por interés (diabetes, obesidad…).** Sale de las etiquetas del JSON (`healthFocus`). La constitución lo permite si propone y no obliga.
- Tensión: «diabetes» ligado al perfil de un niño en el servidor es casi un dato de salud de un menor.
- Opciones: que el interés viva solo en el dispositivo, o que el servidor guarde la ruta (los storyboards elegidos) sin la etiqueta.
- El avance de la ruta por perfil no debe llegar nunca a una organización: sería un expediente individual.

Preguntas para Luis:
1. ¿Código por comunidad o por grupo de participantes?
2. ¿Seguir una organización sin código y ser miembro de una comunidad con código, o solo lo segundo?
3. Perfiles: ¿A, B, C o D?
4. El interés de salud: ¿en el servidor o solo en el dispositivo?
5. ¿La membresía caduca con el curso?

Nada de esto estaba decidido el 2026-10-15. Las respuestas de Luis van abajo.

### Respuestas de Luis (2026-10-16)

1. **Una comunidad ya es el grupo.** No hay grupos dentro de una comunidad: «Primera Infancia» es el grupo concreto dentro de la organización. El código es de la comunidad.
2. **«Unirme».**
   - En la app del hogar, el adulto ve las organizaciones con perfil público y lo que publican.
   - Una organización publica un storyboard suelto («El huevo», para niños) o un **temario**: varios storyboards bajo un tema, por ejemplo «Reduciendo la grasa visceral».
   - El adulto entra en su organización (el colegio) y pulsa «Unirme». Se le pide el código que la organización ya le dio, o lo solicita. Desde ese momento ve el contenido de la organización y puede retirarse cuando quiera.
3. **Opción D, con una cuenta del adulto.**
   - La app se usa sin cuenta; solo que no guarda nada (preferencias, lo que hace).
   - Con cuenta se guardan las cosas y se crean los perfiles de los niños: un nombre cualquiera y la edad, nada más. Solo con cuenta se pueden tener varios perfiles.
   - La cuenta va en la base con un token propio, sin Supabase Auth.
   - La entrada: correo y un código que llega al correo (como Claude), o correo y PIN. Por decidir.
4. **Intereses y lo útil se guardan en la cuenta.**
5. **No hay cursos ni caducidad.** No es aprendizaje académico ni se evalúa a nadie: la organización publica y retira contenido, y el miembro se da de baja cuando quiere.

Corrección de Luis: un interés por contenido sobre diabetes no es un dato de salud. No dice que el niño la tenga, y el perfil no pide datos médicos. Retiro el riesgo que había planteado.

### Propuesta con esas respuestas (en análisis)

Tablas, con la convención de nombres (borrador):
- `organizaciones`: el perfil público (si sale en la app, descripción, logo y un contacto).
- `comunidades`: su código para unirse, que la comunidad puede cambiar. Cambiarlo solo impide altas nuevas.
- `temarios` y `temario_storyboards` (ordenados): un tema que agrupa storyboards.
- `organizacion_publicaciones`: qué publica la organización, un storyboard o un temario, para todos o solo para sus miembros, y opcionalmente solo para una comunidad. Nutrinación publicaría como una organización más.
- `hogares`: la cuenta del adulto, con su correo y el código de entrada cifrado, con intentos y bloqueo como el del educador.
- `hogar_sesiones`, `hogar_perfiles` (nombre, año de nacimiento, intereses), `hogar_membresias` (comunidad y fecha) y, si se aprueba, `hogar_perfil_avance`.
- `hogar_` porque `perfiles` ya es la tabla de usuarios de Admin y «Home» es un nombre temporal.

Puntos de opinión para Luis:
- **Sin Supabase Auth también para la entrada con código.** Supabase Auth trae el envío del código hecho, pero aquí tiene dos costes:
  - pide abrir el registro, que hoy está cerrado, y el trigger de alta crearía un perfil de Admin por cada cuenta del hogar;
  - todas las políticas `to authenticated` (catálogos, storyboards, invitaciones por correo) alcanzarían a las cuentas del hogar, y habría que distinguir tipos de usuario por todos lados.

  La alternativa es el patrón del educador: funciones para `anon` y un token propio. El correo lo enviaría una Edge Function, igual que las invitaciones. En los dos casos hace falta un proveedor de correo propio: el de Supabase solo sirve para pruebas.
- **Correo y código antes que PIN.** Un PIN se olvida y su recuperación vuelve a pasar por el correo, así que serían dos mecanismos. Además, un PIN de 4 a 6 dígitos necesita bloqueo por intentos. Un PIN sí serviría después como candado del adulto en el dispositivo, para que el niño no salga de una organización ni borre perfiles.
- **Año de nacimiento en lugar de edad.** Es el mismo dato, pero «5 años» caduca. Con el año, la edad y la edición (infantil, preadolescencia, adolescencia) salen solas y el contenido se filtra por perfil.
- **«Solicitar un código»:** para empezar, el contacto del perfil público de la organización. Una solicitud dentro de la app obliga a mostrarle a la organización quién la pide (el correo de la cuenta) y a tener en Admin una bandeja para atenderla.
- **«Tengo un código»** como segunda entrada, para organizaciones que no quieren salir en la lista, como un colegio.
- **Sin cuenta se ve lo público, pero no se une a nadie.** La membresía necesita dónde guardarse.
- **La organización ve cuántos miembros tiene y qué se usa, nunca quiénes son.**
- **La ruta por interés necesita saber qué terminó cada perfil.** Se guardaría solo «terminado» por storyboard, sin respuestas ni puntos, y solo lo vería la cuenta. Hay que confirmar que encaja con «nunca un expediente individual».

Preguntas para Luis:
1. ¿Entrada con código por correo, sin Supabase Auth?
2. Lo publicado: ¿para todos o solo para miembros, y por organización o por comunidad?
3. ¿«Solicitar código» empieza como el contacto de la organización?
4. ¿Se guarda qué terminó cada perfil, solo para la familia?
5. ¿Nombre para la app y para las tablas (`hogar_`)?

### Respuestas de Luis, segunda ronda (2026-10-16)

- **PIN elegido por el adulto, no un código generado.** Los dos tienen 6 dígitos, pero uno propio se recuerda mejor; y mucha gente olvida hasta las credenciales de su correo. La entrada diaria no puede depender del correo.
- **Lo que publica una organización es solo para sus miembros**: diez organizaciones publicando para todos sería un caos. Se publica un storyboard o un temario, también para una comunidad concreta.
- **La organización conoce los perfiles que se unen** («Pepito · 5 años») para saber cuántos miembros tiene cada comunidad: colaboradores, educadores y participantes. Unirse es opcional.
- **El código lo da la organización**; no hay solicitudes. Cuando la comunidad lo cambia, el anterior ya no admite altas nuevas y los miembros siguen.
- **Solo se marca qué storyboards terminó cada perfil**: nada de respuestas, cómo lo hizo ni puntos.
- **Prefijo `hogar_`.**

### Flujo completo y escenarios simulados (2026-10-16)

Simulación en SQL sobre Supabase local con el seed: las tablas nuevas en borrador y 12 escenarios, en una transacción que termina en `rollback`. Lo que ya existía tiene además sus 68 pruebas pgTAP (catálogo desde Player, RLS, acceso del educador, jornadas).

El flujo, de punta a punta:
1. **Contenido:** Player registra el storyboard (`storyboards`, `guia_escenas`); Admin escribe la guía y lo publica.
2. **Organización:** el superadmin la crea con su licencia e invita a su administrador; este crea comunidades, invita colaboradores, da de alta educadores y crea jornadas.
3. **Clase:** la comunidad programa workshops; el educador entra en Educators, juega el runner con la guía y deja el feedback (`workshops`, `workshop_educadores`, `workshop_feedback`).
4. **Casa:**
   - la organización arma temarios y publica para sus miembros (`temarios`, `temario_storyboards`, `organizacion_publicaciones`);
   - la comunidad reparte su código (`comunidades.codigo_acceso`);
   - el adulto crea su cuenta con correo y PIN (`hogares`, `hogar_sesiones`) y los perfiles de los niños (`hogar_perfiles`);
   - cada perfil se une con el código (`hogar_membresias`), juega en modo casa y queda marcado lo que termina (`hogar_perfil_avance`).
5. **Lo que ve la organización:** sus miembros (nombre y edad), cuántos hay de cada tipo y la continuidad agregada entre la clase y la casa.

| Escenario | Resultado |
|---|---|
| E1. Sin cuenta, un niño de 6 años | Ve solo el temario público de Nutrinación |
| E2. Cuenta con correo y PIN propio; Pepito (6) y Ana (10) | La edición sale del año de nacimiento: infantil y preadolescencia. El PIN se comprueba con bcrypt |
| E3. Pepito se une a Comunidad Centro y Ana a Comunidad Norte, cada uno con su código | Funciona; un código equivocado no encuentra comunidad. Dos hermanos pueden estar en organizaciones distintas |
| E4. Centro arma «Reduciendo la grasa visceral» y lo publica para Comunidad Centro | Funciona. Meter el personalizado de Colegio Norte se rechaza |
| E5. Qué ve cada perfil | Pepito: el temario de Centro y el de Nutrinación. Ana: nada, porque no hay contenido de preadolescencia (falta contenido, no tablas). Lo programado para mañana no aparece hasta mañana |
| E6. Pepito termina el huevo | Queda terminado una vez, aunque el huevo esté en dos temarios; la ruta lo cruza con su interés |
| E7. La organización en Admin | Ve miembros (nombre y edad) y cuántos colaboradores, educadores y participantes tiene cada comunidad. Ve la continuidad: workshops de un storyboard en clase frente a miembros que lo terminaron en casa |
| E8. Centro cambia su código | El viejo deja de servir; Pepito sigue siendo miembro |
| E9. Vence la licencia de Centro | Pepito deja de ver lo de Centro y sigue viendo lo de Nutrinación; la membresía se conserva |
| E10. Pepito sale de Centro; la familia borra la cuenta | Su avance se queda en la familia. Al borrar la cuenta se van perfiles, membresías y avance |
| E11. Borrar un storyboard en uso | Lo impiden las FK |
| E12. Tablas actuales: una educadora en dos comunidades | Dos filas en `educadores`, dos códigos y dos sesiones separadas: no ve todos sus workshops juntos |

**Lo que hay que ajustar** (propuesta):
1. **El educador en varias comunidades** (tablas actuales).
   - El código vive en cada fila de `educadores`, así que una persona tiene un código por comunidad.
   - Propuesta: aplicar el mismo razonamiento que al hogar. El código que genera Admin sirve para la primera entrada (o para restablecer el acceso), y el educador elige su PIN.
   - El PIN va por persona (correo), en una tabla de acceso (`educador_accesos`) a la que se ligan las sesiones. Con una entrada ve los workshops de todas sus comunidades.
   - En contra: cambia la decisión 005 y el acceso de Educators, que aún no está conectado.
2. **Continuidad solo después de la clase:** contar lo terminado en casa después de la fecha del workshop; hoy la consulta contaría también lo de antes.
3. **Grupos pequeños:** «1 de 1 lo terminó» identifica a Pepito, ahora que la organización ve los nombres. Mostrar la continuidad solo desde 5 miembros.
4. **País del hogar:** `storyboards.paises_disponibles` y `organizacion_licencias.paises` no llegan a la app del hogar. Hace falta `hogares.pais` para no ofrecer lo que no está disponible en su país.

**Reglas que salen de los escenarios** (propuesta):
- **PIN:**
  - ~~rechazar los obvios~~: retirado por Luis, el PIN es libre;
  - 5 intentos fallidos bloquean 15 minutos, como el educador;
  - el correo no se verifica al crear la cuenta: solo identifica y sirve para recuperar el PIN con un código;
  - sin acceso al correo, la familia crea otra cuenta y vuelve a unirse con los códigos vigentes.
- **Unirse:** el código es único en toda la plataforma, para que «Tengo un código» funcione sin buscar la organización. Varios intentos fallidos bloquean, para que nadie adivine códigos.
- **Quién gestiona:**
  - los administradores de la organización: temarios y publicaciones para toda la organización;
  - quien opera una comunidad (administrador o colaborador): su código, sus miembros y lo publicado solo para ella.
  
  Es la misma RLS que los workshops (`mis_comunidades`).
- **Lo que ve la organización:**
  - nombre y edad de sus miembros, y puede quitar a alguien (después cambia el código);
  - nunca el correo de la cuenta ni lo que terminó cada perfil, solo totales.
- **Público:** solo lo de Nutrinación (sus temarios publicados). Las organizaciones salen en la lista para «Unirme», pero su contenido es para miembros.

El SQL de la simulación (borrador de tablas y escenarios) está en el scratchpad de la sesión: `simulacion/simulacion_hogar.sql`. Pasa a migración cuando Luis apruebe las tablas.

### Tercera ronda de Luis y modelo corregido (2026-10-16)

Sustituye lo anterior donde no coincida.

Luis:
- **El PIN es libre:** cada quien pone el que quiera. Solo se valida que el correo no esté en uso.
- **El perfil lleva género:** «Pepito · niño · 6». Ayuda sin ser invasivo.
- **El educador pertenece a la organización** y se liga a una o varias comunidades. Su acceso queda separado de la comunidad, y en Educators ve lo asignado en cada comunidad.
- **El seguimiento no se muestra en la primera versión** (no es curricular), pero las tablas lo guardan por si se necesita.
- **La cuenta del hogar:** nombre del adulto, país, correo y PIN.
- **Roles:**
  - los colaboradores también publican temarios y storyboards en su comunidad;
  - los administradores de la organización (el titular y los demás) tienen acceso a todo en todos los niveles;
  - el superadmin administra la plataforma.

En consecuencia:
- se retiran el rechazo de PIN obvios y el umbral de 5 miembros;
- la continuidad no se muestra en la primera versión;
- el bloqueo por intentos fallidos se mantiene: no limita qué PIN se elige.

**Modelo corregido** (propuesta):

| Tabla | Cambio | Qué guarda |
|---|---|---|
| `educadores` | Cambia | El educador de una organización (`organizacion_id` en lugar de `comunidad_id`), con su correo único en ella. El acceso es un código de primera entrada que da Admin y un PIN que elige el educador |
| `educador_comunidades` | Nueva | A qué comunidades está ligado, con `activo`: no se desliga a quien tiene workshops, se marca inactivo |
| `workshop_educadores`, `educador_grupo_miembros` | Cambian | Apuntan a `educador_comunidades`: solo se asigna a quien está ligado a esa comunidad |
| `organizaciones` | Cambia | Perfil público para salir en la lista de «Unirme»: si sale, descripción y logo |
| `comunidades` | Cambia | Su código para unirse (6 dígitos, único en la plataforma) y desde cuándo vale |
| `temarios`, `temario_storyboards` | Nuevas | Un tema con sus storyboards en orden: de Nutrinación (público), de la organización o de una comunidad |
| `organizacion_publicaciones` | Nueva | Qué se ofrece a los miembros (un storyboard o un temario), a toda la organización o a una comunidad, desde una fecha |
| `hogares` | Nueva | La cuenta del adulto: nombre, país, correo único y PIN |
| `hogar_sesiones` | Nueva | Las sesiones de la app del hogar |
| `hogar_perfiles` | Nueva | Nombre, género, año de nacimiento e intereses |
| `hogar_perfil_comunidades` | Nueva | Las comunidades de cada perfil: lo que antes llamé «membresía» |
| `hogar_perfil_avance` | Nueva | Qué storyboards terminó cada perfil. Se guarda; en la primera versión no lo ve nadie fuera de la familia |

**Simulación v2** (SQL sobre Supabase local con el seed, con `rollback`). Todo salió como se esperaba:
- **Educadores:**
  - María, de Fundación Centro, ligada a Comunidad Centro y a una nueva Comunidad Sur, ve con una sola cuenta sus workshops de las dos (11 y 1);
  - asignar a Pedro, de Colegio Norte, a un workshop de Centro se rechaza;
  - desligar a María de Sur con un workshop ahí se rechaza; marcarla inactiva, no;
  - el PIN 000000 se acepta.
- **Hogar:** una segunda cuenta con el mismo correo en otras mayúsculas se rechaza. La cuenta guarda nombre y país; los perfiles, género y edad.
- **Colaborador de Comunidad Centro:**
  - crea un temario de su comunidad y lo publica para ella;
  - no puede publicar para toda la organización, ni crear un temario de toda la organización, ni publicar en Comunidad Sur;
  - ve a los miembros de su comunidad con nombre, género y edad;
  - no ve cuentas, avance ni intereses.
- **Admin de Centro:** publica para toda la organización.
- **Admin de Colegio Norte:** no ve temarios, publicaciones ni miembros de Centro, y no puede publicar en Centro.
- **Superadmin:** lo ve todo.
- **Conteo por comunidad:** colaboradores, educadores ligados activos y participantes.

Pendiente de la simulación: en la migración, quitar a `authenticated` el permiso de lectura sobre `hogares`, `hogar_sesiones` y `hogar_perfil_avance`, además de la RLS sin políticas. La consulta hoy corre y devuelve 0 filas.

Para aplicarlo:
- **Migraciones:** los cambios de `0002`, `0004`, `0005` y `0006` van en la base (la nube aún no existe); el hogar y las publicaciones, en una migración nueva.
- **Funciones:** del educador, con PIN, primera entrada y varias comunidades; nuevas `hogar_*` para la app del hogar.
- **Seed y pruebas pgTAP:** actualizar el seed y añadir las pruebas de estos escenarios.
- **Tipos y Admin:** regenerar los tipos y adaptar Admin (educadores de la organización ligados a comunidades, código de primera entrada, miembros, temarios y publicaciones).
- **Documentación:** decisiones 005 y 006, y `backend.md`.

SQL de las simulaciones en el scratchpad de la sesión: `simulacion/simulacion_hogar.sql` y `simulacion/simulacion_v2.sql`.

### Idiomas, países y nombres (2026-10-16, cuarta ronda)

Luis:
- `hogar_perfil_comunidades` se entiende mal.
- Faltan los idiomas y los países de los storyboards. Las apps son multidioma (ES y EN), y la base debe guardar los idiomas disponibles y permitir buscar y filtrar por ellos.

**Nombres** (propuesta): una comunidad tiene colaboradores, educadores y participantes.
- `comunidad_participantes` sustituye a `hogar_perfil_comunidades`.
- `comunidad_educadores` sustituye a `educador_comunidades`.

Quedan en paralelo con `comunidad_colaboradores`.

**Cómo está hoy:**
- **Idiomas:** el JSON los declara (`languages`, `defaultLanguage`) y Player los registra en `storyboards.idiomas` y `idioma_principal`.
  - El título y los títulos de escena se guardan por idioma, y la guía también.
  - Un workshop solo puede ir en uno de los idiomas del storyboard (trigger).
  - Faltan un índice para filtrar por idioma y, en Admin, buscar por título (hoy solo por slug).
- **Países:** no están en el JSON. Admin/Platform los decide en `paises_disponibles` (vacío = todos).
  - La comunidad tiene `pais` y la licencia, `paises`.
  - La regla de país solo la aplica la pantalla del catálogo de Admin: ni la base ni los workshops la comprueban, y la licencia no limita en qué país se abre una comunidad.
- **Catálogos y textos de las organizaciones:** países, tipos de organización y plantillas ya guardan su texto por idioma (`jsonb`). Los temarios y el perfil público, igual.

**Países: mantenerlos en Admin y no en el JSON** (propuesta):
- dónde se ofrece un storyboard es una decisión de publicación, no de contenido;
- se cambia sin compilar ni desplegar Player.

Un contenido adaptado a un país (comida local) sigue siendo un storyboard con su país en Admin.

**Reglas nuevas** (propuesta):
1. Índice GIN en `storyboards.idiomas`, como en enfoques y países.
2. Admin busca por slug y por el título en cada idioma de la app, y filtra por idioma. Es un cambio de Admin; la base ya tiene los datos.
3. **Guía por idioma:**
   - Admin muestra cuántas escenas tienen guía en cada idioma;
   - sin traducción, Educators recibe la del idioma principal (hoy el respaldo está fijo a `es`; pasa a `idioma_principal`).
4. **La comunidad está en un país de su licencia**, si la licencia limita países.
5. **Un workshop usa un storyboard disponible en el país de su comunidad** (en la base, no solo en la pantalla).
6. **No se quita un idioma del JSON con workshops programados en él:** Player avisa y hay que reprogramarlos antes.
7. **App del hogar:**
   - el contenido de Nutrinación se filtra por el país de la familia;
   - el de una organización, por el país de la comunidad, porque la organización ya lo tiene ahí;
   - siempre por el idioma de la cuenta y la edición del perfil;
   - los textos sin traducir llegan en el idioma en que se escribieron.

**Simulación v3** (SQL sobre Supabase local con el seed, con `rollback`). Todo salió como se esperaba:
- **A1.** El JSON del huevo añade inglés y Player sincroniza: idiomas `{es,en}`, título y escenas en los dos; publicación y guía intactas.
- **A2.** Filtrar por inglés y buscar «egg» encuentran el huevo.
- **A3.** La guía en inglés está en 0 de 4 escenas, y un workshop en inglés recibe la guía en español.
- **A4.** El huevo queda solo para GT, y «la leche» es solo en español y sin límite de país.
- **B1.** Fundación Centro (licencia GT): abrir una comunidad en MX se rechaza; en GT, no.
- **B2.** Colegio Norte amplía la licencia a GT y MX y abre Comunidad Monterrey.
  - El huevo (solo GT) en Monterrey: rechazado.
  - El pan (suyo y sin límite): permitido.
  - El pan en inglés: rechazado, porque solo tiene español.
- **B3.** Workshop del huevo en inglés en Comunidad Centro con María, cuya app está en español: permitido. El idioma del contenido es del workshop; el de la app, del educador.
- **B4.** Quitar el inglés del JSON con ese workshop programado: rechazado, «hay 1 workshop programado».
- **C1.** Temario público «Comer bien en casa» (huevo GT es/en y leche es):
  - Pepito (GT, español) ve los dos;
  - Tom (MX, inglés) no ve ninguno.
- **C2.** La familia de Tom pasa la app a español: ve la leche.
- **C3–C4.** El colaborador de Centro publica para su comunidad un temario escrito solo en español, y Pepito y Tom se unen a Comunidad Centro (GT).
  - Tom, desde MX y en inglés, ve el huevo de su comunidad, porque está disponible en GT y ya tiene inglés.
  - El título del temario le llega en español.
- **C5.** El colaborador ve a Pepito (niño, 6) y a Tom (niño, 7). El conteo por comunidad incluye colaboradores, educadores y participantes.

SQL: `simulacion/simulacion_v3.sql` y `esquema_v3.sql` en el scratchpad de la sesión.

### Player publica y los países van en el JSON (2026-10-16, quinta ronda)

> Sustituida en parte por la sexta ronda: los países no van en el JSON.

Luis:
- `comunidad_participantes` es «mucho mejor».
- **Los storyboards se publican desde Player, no desde Admin.**
- **Un storyboard puede estar disponible en un solo país por tropicalización.**

Retiro mi recomendación de dejar los países en Admin: si dependen de la tropicalización, son contenido.

**Quién decide qué del storyboard** (propuesta; sustituye lo dicho en la decisión 006 sobre publicación y países):

| Qué | Dónde se decide | Cómo llega a la base |
|---|---|---|
| Metadata: clave, slug, versión, título, categoría, subcategoría, edición, enfoques, idiomas, **países** y escenas | El JSON del storyboard. Los países, en un campo nuevo `countries` (ISO; vacío o ausente = todos) | Player, «Registrar/Actualizar en la base» (`sincronizar_storyboard`) |
| **Publicación** (borrador, publicado, archivado) y, si es personalizado, **para qué organización** | Player | Player, con una función nueva `publicar_storyboard`, solo para el superadmin |
| Guía (cabecera y escenas) | Admin/Platform (decisión 002) | Admin. Player muestra cuánto tiene escrito en cada idioma antes de publicar |

**Simulación v4** (sobre el esquema y las reglas de v3, con `rollback`). Todo salió como se esperaba:
- **P1.** Player registra «El atol», tropicalizado para GT: `paises_disponibles = {GT}` sale del JSON. Nace en borrador y el admin de Norte no lo ve.
- **P2.** Publicar:
  - el admin de Norte no puede: «solo el superadmin publica»;
  - el superadmin, desde Player, sí: antes ve la guía en español (0 de 3) y después Norte ya lo ve.
- **P3.** Colegio Norte (licencia GT y MX) lo programa en Comunidad Norte (GT): permitido. En Monterrey (MX): rechazado, «no está disponible en MX».
- **P4.** El JSON lo amplía a GT y MX y Player sincroniza: sigue publicado y Monterrey ya puede programarlo.
- **P5.** El JSON vuelve a dejarlo solo en GT con el workshop de Monterrey programado: rechazado, como con los idiomas.
- **P6.** Player lo archiva: los 2 workshops programados se conservan y ya no se puede programar uno nuevo.
- **P7.** Player publica «El pan» como personalizado de Colegio Norte: Norte lo ve y Fundación Centro no.

**Al aplicarlo cambia:**
- **Player:**
  - `countries` en el tipo del storyboard, en la metadata y en la comparación con la base;
  - un panel «Publicación» con el estado, la organización (si es personalizado) y el estado de la guía por idioma.
- **Admin:**
  - la edición de Platform pierde la tarjeta «Publicación» (estado, países y organización), que pasa a solo lectura;
  - se queda con la guía.
- **La regla de Player** («lo editorial es de Admin, nunca lo escribas desde Player») y la **decisión 006** se corrigen.
- **`estructura.md`** (skill de storyboards, fuera del repositorio) documenta `countries` y `healthFocus`.

Límite: Player y Admin entran con la misma cuenta de superadmin, así que la base no puede impedir que Admin publique. Es una regla de las apps: Admin no ofrece la acción.

SQL: `simulacion/simulacion_v4.sql` y `reglas_v3.sql` en el scratchpad de la sesión.

### Países desde Player, estados como un artículo y enums (2026-10-16, sexta ronda)

Sustituye lo de la quinta ronda sobre los países.

Luis:
- **Los países no van en el JSON.** Player permite elegirlos del catálogo `paises` de Supabase y asignarlos al storyboard al registrarlo o publicarlo.
- **El storyboard tiene estados en la base como un artículo**: registrado, publicado y otros.
- **`EN_REVISION` vale** como estado del storyboard.
- **Usar enums para los estados y los demás valores fijos.**

**Quién decide qué del storyboard** (propuesta):

| Qué | Dónde | Cómo llega a la base |
|---|---|---|
| Metadata: clave, slug, versión, título, categoría, subcategoría, edición, enfoques, idiomas y escenas | El JSON | `sincronizar_storyboard`: trae solo esto y conserva el estado y los países |
| Estado, países (del catálogo `paises`) y, si es personalizado, la organización | Player | `publicar_storyboard(clave, estado, países, organización)`, solo el superadmin |
| Guía | Admin (decisión 002) | Admin |

**Estados del storyboard** (`estado_publicacion`):

| Estado | Qué significa |
|---|---|
| `REGISTRADO` | Al registrarlo desde Player. Solo lo ve el equipo |
| `EN_REVISION` | El equipo revisa el contenido y la guía antes de publicar. Solo lo ve el equipo |
| `PUBLICADO` | Lo ven las organizaciones. Exige al menos un país |
| `ARCHIVADO` | No se programa más; lo ya programado se conserva |

Volver a registrado o a revisión solo se puede si nadie lo usa; si no, se archiva.

**Países:**
- un storyboard está disponible solo en los países que tiene;
- se acabó «vacío = todos»: publicar exige elegir;
- los códigos se validan contra `paises`.

**Enums** (propuesta). Se suman a los que ya existen: `estado_licencia`, `rol_invitacion`, `estado_invitacion`, `estado_workshop`, `modalidad_workshop`, `estado_asignacion`, `participacion_grupo` y `claridad_contenido`.

| Enum | Valores | Columnas |
|---|---|---|
| `estado_publicacion` | REGISTRADO · EN_REVISION · PUBLICADO · ARCHIVADO | `storyboards`, `temarios` |
| `categoria_storyboard` | Las 4 categorías | `storyboards.categoria` |
| `subcategoria_storyboard` | Las 18 de `catalogo.md` | `storyboards.subcategoria` |
| `edicion_storyboard` | KIDS · PREADOLESCENTES · ADOLESCENTES | `storyboards.edicion` |
| `enfoque_salud` | Los 13 de `catalogo.md` | `storyboards.enfoques_salud`, `jornadas.enfoque_salud`, `hogar_perfiles.intereses` |
| `idioma` | es · en | `storyboards.idiomas` e `idioma_principal`, `workshops.idioma_contenido`, y el idioma de `perfiles`, `educadores` y `hogares` |
| `genero_perfil` | NINO · NINA | `hogar_perfiles.genero` |

Los países siguen en su tabla (`paises`): Player los lista y cada uno tiene nombre y bandera.

**Listas por categoría:** la subcategoría y los enfoques deben estar en la lista de su categoría, según `catalogo.md`. Son dos `check` con funciones, sin tablas. Esto cierra el pendiente «subcategoría y enfoques sin comprobar».

**Una sola fuente:** `npm run db:types` exporta la lista de cada enum (`Constants.public.Enums`).
- Player valida el JSON con ella antes de registrar y muestra un mensaje claro.
- Admin la usa en sus filtros.

Los errores de la base («invalid input value for enum») quedan como última barrera.

**Simulaciones v5 y v6** (SQL sobre Supabase local con el seed, con `rollback`). Todo salió como se esperaba:
- **v5:**
  - registrar «El atol» deja REGISTRADO, sin países e invisible para las organizaciones;
  - publicar sin países o con un país fuera del catálogo se rechaza; con GT, se publica;
  - el admin de una organización no puede publicar (su intento de editar países no cambia ninguna fila);
  - programar por país, añadir MX y quitar MX con un workshop ahí se comporta como en v4;
  - volver a sincronizar el JSON conserva el estado y los países;
  - despublicar con uso se rechaza, archivar no; despublicar algo sin uso se permite;
  - un personalizado no cambia de organización si tiene workshops;
  - en el hogar, una familia de GT ve el huevo y una de MX no.
- **v6:**
  - el JSON bien se registra; una subcategoría mal escrita, una de otra categoría, un enfoque de otra categoría, el idioma `fr` o una categoría inexistente se rechazan;
  - el ciclo registrado → en revisión (invisible) → publicado (exige país) funciona;
  - un workshop en `fr` y una jornada con «DIABETIS» se rechazan;
  - el filtro de la jornada por enfoque usa el índice;
  - en los perfiles se rechazan el género «OTRO», el interés mal escrito y la cuenta en `pt`.

**Al aplicarlo, además:**
- `localizado` y las funciones del educador reciben el idioma como enum;
- Admin y el kit cambian `BORRADOR` por `REGISTRADO` en los estados del storyboard (los workshops conservan su `BORRADOR`);
- la edición de Platform queda sin «Publicación».

SQL: `simulacion/simulacion_v5.sql`, `simulacion_v6.sql` y `reglas_v6.sql` en el scratchpad de la sesión.

### Estados del workshop (2026-10-16, séptima ronda)

> Sustituida por la octava ronda: se añade `FINALIZADO` y `ARCHIVADO` pasa a ser descartado.

Luis: los talleres también deben tener estados como `EN_REVISION`, `PUBLICADO`, `CANCELADO` y `ARCHIVADO`; me pide elegir cuáles aplican.

**Propuesta: estados guardados** (`estado_workshop`; hoy es borrador, programado, cancelado):

| Estado | Qué significa | Quién lo ve |
|---|---|---|
| `BORRADOR` | Se está armando | Quienes gestionan la comunidad |
| `EN_REVISION` | Listo para que otro lo revise antes de publicarlo: un colaborador lo prepara y un administrador o coordinador lo confirma. Es opcional: quien gestiona la comunidad también puede publicar directo | Quienes gestionan la comunidad y la organización |
| `PUBLICADO` | Agendado: los educadores asignados lo ven en Educators. Sustituye a `PROGRAMADO` | Además, sus educadores |
| `CANCELADO` | No se va a dar, con motivo opcional. Si ya se había publicado, el educador lo ve cancelado | Igual que antes de cancelarse |
| `ARCHIVADO` | Cerrado: ya pasó o se canceló. Sale de las listas activas; conserva la ejecución y el feedback. Solo lectura | Igual, en el historial |

**Lo que se deduce y no se guarda** (Admin lo muestra; la constitución distingue el taller programado de su ejecución real):
- **Programado:** publicado y por venir.
- **Hoy.**
- **En curso:** algún educador lo empezó.
- **Realizado:** todos sus educadores lo terminaron y dejaron el feedback.
- **Falta el feedback:** pasó y se empezó, pero falta el feedback.
- **Sin realizar:** pasó y nadie lo empezó.

Con varios educadores por workshop, cada uno tiene su ejecución (`workshop_educadores`), así que «realizado» no puede ser un estado del workshop.

**Reglas:**
- nace en borrador o en revisión;
- publicar exige fecha, hora y al menos un educador;
- publicado no vuelve a borrador ni a revisión: se cancela;
- no se cancela si algún educador ya lo empezó;
- se archiva solo lo que ya pasó o se canceló, y un archivado no se modifica;
- el educador solo empieza un workshop publicado;
- el educador ve lo que alguna vez se le publicó (`publicado_en`), también si luego se canceló o archivó.

Columnas nuevas: `publicado_en`, `cancelado_en` y `motivo_cancelacion`. Los `PROGRAMADO` del seed pasan a `PUBLICADO`.

**Simulación v7** (sobre el seed, con `rollback`). Todo salió como se esperaba:
- **W0.** Los 12 workshops del seed: 1 borrador, 1 hoy, 4 programados, 2 realizados y 4 sin realizar.
- **W1.** Crear un workshop ya publicado se rechaza; nace en borrador.
- **W2.** Publicar sin educador se rechaza. Con María asignada y el workshop en revisión, María aún no lo ve.
- **W3.** El admin de Centro lo publica y María ya lo ve.
- **W4.** Volver a borrador una vez publicado se rechaza («cancélalo»).
- **W5.** María lo empieza; cancelarlo después se rechaza.
- **W6.** Uno publicado se cancela con motivo y María lo ve cancelado; un borrador cancelado nunca lo vio. Empezar el cancelado se rechaza.
- **W7.** Archivar uno futuro se rechaza; uno pasado y uno cancelado, no. Cambiar la fecha de un archivado se rechaza.

**Al aplicarlo:**
- Admin cambia el asistente (borrador, en revisión, publicar), la lista y el detalle (estado guardado más el deducido), y la acción de cancelar (con confirmación y motivo, tarea 008);
- Educators y `educador_workshops` usan `PUBLICADO` y `publicado_en`.

SQL: `simulacion/simulacion_v7.sql` en el scratchpad de la sesión.

### FINALIZADO y ARCHIVADO como descartado (2026-10-16, octava ronda)

Sustituye la tabla de estados de la séptima ronda.

Luis:
- Añadir `FINALIZADO`: la fecha programada ya pasó y, si hace falta, el workshop se reprograma y se vuelve a publicar.
- `ARCHIVADO` es como borrado o descartado.

**Estados guardados del workshop** (propuesta):

| Estado | Qué significa | Pasa a |
|---|---|---|
| `BORRADOR` | Se está armando | En revisión, publicado, archivado |
| `EN_REVISION` | Listo para que otro lo confirme (opcional) | Borrador, publicado, archivado |
| `PUBLICADO` | Agendado; lo ven sus educadores | Finalizado, cancelado |
| `FINALIZADO` | Pasó su fecha, o todos sus educadores lo terminaron y dejaron el feedback | Publicado (reprogramar), archivado |
| `CANCELADO` | No se dará, con motivo opcional | Publicado (reprogramar), archivado |
| `ARCHIVADO` | Descartado: no se modifica ni lo ven los educadores; se conserva para el historial en lugar de borrarlo | — |

**Cómo llega a FINALIZADO:**
- en cuanto todos sus educadores lo terminan y dejan el feedback (trigger);
- si no, con una tarea de `pg_cron` cada hora, que finaliza lo publicado cuya fecha ya pasó. Usa un margen de 12 h sobre UTC: un workshop del día D se finaliza a las 12:00 UTC de D+1 (06:00 en Guatemala), cuando ese día ya terminó en todo el continente;
- `pg_cron` está disponible en Supabase local (1.6.4); hay que activarlo en el proyecto nuevo.

**Reprogramar:**
- solo lo que nadie empezó, con fecha desde hoy, desde finalizado o cancelado; vuelve a publicado;
- `reprogramaciones` cuenta cuántas veces se movió;
- lo que ya se dio no se reprograma: se repite creando uno nuevo, porque la ejecución y el feedback de cada educador son de ese workshop.

**Lo que muestra Admin** (deducido):
- dentro de publicado: programado, hoy, en curso;
- dentro de finalizado: realizado, falta el feedback, sin realizar.

**Otras reglas:**
- el educador solo empieza lo publicado y puede dejar el feedback también si ya está finalizado;
- no se cancela lo empezado;
- columnas nuevas: `publicado_en`, `finalizado_en`, `cancelado_en`, `motivo_cancelacion` y `reprogramaciones`.

**Simulación v8** (sobre el seed, con `rollback`). Todo salió como se esperaba:
- **F0–F1.** La tarea horaria finaliza los 6 workshops del seed que ya pasaron: 2 realizados y 4 sin realizar. La tarea queda registrada en `cron.job`.
- **F2.** Uno de hoy: María lo empieza («en curso») y deja el feedback; pasa a finalizado («realizado») en ese momento.
- **F3.** Reprogramar uno sin realizar:
  - a una fecha pasada, se rechaza;
  - a 5 días, se publica de nuevo con `reprogramaciones = 1` y María lo vuelve a ver;
  - reprogramar uno realizado se rechaza («crea uno nuevo»).
- **F4.** Uno publicado se cancela por lluvia y se reprograma a 10 días.
  - Archivar un borrador o un finalizado se permite; archivar uno publicado, no.
  - Recuperar un archivado se rechaza, y María no ve el finalizado archivado.
- **F5.** Empezar uno finalizado se rechaza: hay que reprogramarlo.

SQL: `simulacion/simulacion_v8.sql` en el scratchpad de la sesión.

## Pasos

- [ ] Acordar alcance y criterios con Luis.
- [x] `supabase init` (2026-10-15): `supabase/config.toml` y `supabase/.gitignore`. El proyecto no está enlazado a la nube; Postgres 17 por defecto (confirmar la versión del proyecto nuevo antes de aplicar).
- [x] Supabase local en marcha (2026-10-15, con permiso de Luis para levantarlo y reiniciarlo) con las migraciones y el seed.
- [x] Inventario del esquema actual frente a la constitución, con las brechas de arriba («Propuesta de modelo»).
- [x] Decisión con Luis: [decisión 005](../docs/decisions/005-base-nueva-y-acceso-educador.md).
- [x] Entregas 1 y 2 con el primer esquema (2026-10-15): migraciones, seed, pgTAP, Admin adaptado y Player con sesión de superadmin. El esquema lo sustituyó el revisado; el detalle está en el log.
- [x] **Esquema revisado con Luis, aplicado** (2026-10-15, [decisión 006](../docs/decisions/006-modelo-y-catalogo-desde-player.md)):
  - migraciones `0001_catalogos`–`0008_storage`: sin tablas de taxonomía, familias, afirmaciones ni enfoques; `storyboards` con la metadata del JSON; `guias` y `guia_escenas`; `workshops`, `workshop_educadores` y `workshop_feedback`; `educador_grupos` y `educador_grupo_miembros`; `organizacion_licencias` y `comunidad_colaboradores`; `jornadas`;
  - `sincronizar_storyboard` (`0007_catalogo_desde_player`) para que Player registre el catálogo;
  - `healthFocus` en el JSON del huevo y en el tipo del storyboard de Player;
  - seed regenerado y pgTAP: 68 pruebas (`03_catalogo_y_jornadas.test.sql` nueva);
  - Player: estado frente a la base y «Registrar/Actualizar en la base»; fuera «Copiar metadata»;
  - Admin: composables y páginas con los nombres nuevos; Platform edita la publicación y la cabecera de la guía; fuera el registro por pegado;
  - documentación: `backend.md`, glosario, arquitectura, decisiones 003, 005 y 006, contexto del proyecto y los `AGENTS.md` de Admin y Player.
- [ ] Pendiente de la entrega 2:
  - la UI de jornadas en Admin (la tabla y la RLS existen);
  - el webhook de `enviar-invitacion` (Database Webhook al insertar en `invitaciones`), que no está en migraciones;
  - probar las Edge Functions con `supabase functions serve`.
- [x] **Modelo completo aplicado como migración** (2026-10-16, [decisión 007](../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)). Es lo que se correrá en producción si las pruebas locales están bien.
  - Migraciones `0001`–`0010`, reescritas en la base: la nube aún no existe.
    - Enums de estados y taxonomía, con las listas por categoría.
    - Storyboard como un artículo, publicado desde Player con sus países.
    - Educador de la organización ligado a comunidades, con PIN.
    - Ciclo del workshop con finalizado y archivado, y la tarea horaria con pg_cron.
    - App del hogar: temarios, publicaciones, cuentas, perfiles, participantes y avance, con funciones `hogar_*`.
  - Datos de prueba regenerados (María en dos comunidades, una educadora sin activar, workshops en todos los estados, una cuenta del hogar). 177 pruebas pgTAP en 5 archivos.
  - Admin:
    - educadores de la organización, con su acceso;
    - el ciclo del workshop en la lista, el detalle, el asistente y el planner;
    - la página «Participantes» con el código;
    - las cifras por comunidad;
    - Platform con la publicación de solo lectura, búsqueda por título y filtro por idioma.
  - Player: la tarjeta «Publicación» (estado, países y organización, con la guía por idioma) y la validación del JSON contra los enums.
  - Documentación: `backend.md`, decisiones 005–007, glosario, arquitectura, contexto del proyecto y los `AGENTS.md`.
- [ ] Entrega 3: Educators conectado: `useSesion` y `useTalleres` con las funciones `educador_*`; la guía, desde `educador_guia`; `iniciar` y `terminar` desde los eventos del runner.
- [ ] Entrega 4: voces en el bucket (tarea 009).
- [ ] Entrega 5: sesión del taller con dispositivos.
- [ ] Revisión de Luis antes de cualquier migración en cloud (o rama de Supabase).

## Pendientes y siguiente paso

**Es el siguiente paso.** Las tareas 002–005 y 007 están en `revision`.

Siguiente paso: QA manual de Luis, feature por feature, con Supabase local (Admin, Player y Educators conectados). La app del hogar es una app nueva sobre las funciones `hogar_*`.

Pendientes anotados:
- **`estructura.md`** (skill `playhub-storyboard-games`, fuera de este repositorio) no documenta `healthFocus`.
- **Recuperar el PIN de una cuenta del hogar:** por correo, con una Edge Function que envíe el código. Necesita un SMTP; Admin no envía correos ([decisión 009](../docs/decisions/009-acceso-admin-sin-correo.md)), así que es ahí donde se configura por primera vez.
- **Afirmaciones y fuentes:** sin sitio en la base; por confirmar si van en la guía.
- **Cupo de educadores:** `organizacion_licencias.max_educadores` no se hace cumplir (sí el de comunidades).
- **Personalizados por licencia:** tampoco se hace cumplir `max_personalizados`.
- **Material en el runner:** el contrato no tiene `material`. `educador_guia` ya lo manda y el runner lo ignora hasta añadirlo (cambio aditivo).
- **Versión de Postgres:** `config.toml` usa la 17; hay que confirmar la del proyecto nuevo.

Resuelto desde el 2026-10-14:
- **Temarios, publicaciones y perfil público en Admin** («Para casa»), **jornadas** y **Educators conectado** (con `definir_pin` → `educador_activar`): 2026-10-16.
- **La guía en el runner:** la pasa Educators con `iniciar` ([decisión 004](../docs/decisions/004-runner-incrustado.md)).
- **Las columnas del feedback:** salen de la constitución y de `Cierre` en Educators (ver la propuesta).
- **Admin «Probar» de una escena:** manda `?escena=` (tarea 009).

Contexto ya decidido en tareas anteriores:
- Estados de sesión y de publicación con tonos compartidos en el kit (`UI_SESSION_TONES`, `UI_PUBLICATION_TONES`).
- Categoría desde `storyboards.categoria` (`uiAreaOf`).
- El feedback es el paso final del taller: con `terminado` del runner incrustado, Educators lleva a `/workshops/<id>/cierre` ([docs/runner.md](../docs/runner.md)).

## Log
- 2026-10-14 — Preparada para empezar: contexto de conexión entre apps en `docs/architecture.md`, plan propuesto y decisiones abiertas. Docker y la CLI comprobados; falta `supabase init`.
- 2026-10-15 — Luis pide preparar la base. Se hizo `supabase init`, solo archivos.
  - Se leyeron la constitución, la especificación, el catálogo y la plantilla de la guía, las migraciones y el uso real en Admin (mapeado por un agente de exploración).
  - Se escribió la «Propuesta de modelo», en análisis.
  - Hallazgo: `0001` deja `perfiles`, `organizaciones`, `licencias` y otras tablas abiertas a cualquier `authenticated`, lo que permite marcarse superadmin. Se informa a Luis; no se tocó la nube.
- 2026-10-15 — Luis decide: base de prueba, proyecto nuevo; el educador entra con su correo y un código de Admin, sin Supabase Auth ni roles por todos lados; las voces, fuera de la base. Registrado como [decisión 005](../docs/decisions/005-base-nueva-y-acceso-educador.md).
  - Entrega 1 escrita: 7 migraciones nuevas (se retiraron `0001`–`0011`), seed y 55 pruebas pgTAP.
  - `config.toml` con el registro cerrado.
  - `canjear-invitacion` con `app_metadata`. El trigger de alta ya no confía en `user_metadata`: antes, quien se registrara podía declararse admin de cualquier organización.
  - **No ejecutado:** Supabase local no está levantado.
  - Documentación: `docs/backend.md` reescrito, decisión 002 precisada, arquitectura, mapa y contexto del proyecto.
- 2026-10-15 — Revisión del SQL sin ejecutarlo:
  - En el seed, los `INSERT … SELECT … UNION ALL` necesitaban conversiones explícitas (`::jsonb`, `::text[]`): los literales sin tipo se resuelven como `text`.
  - Las ayudas de las pruebas pasaron a un esquema `pruebas`.
  - `./scripts/verify.sh` (raíz): **aprobado**. Contexto y UI; Admin 51, Player 23 y Educators 13 tests; typecheck y build.
  - **Pruebas de base de datos: no ejecutadas** (Supabase local sin levantar).
- 2026-10-15 — Luis da permiso para levantar Supabase local y pide adaptar Admin y proteger Player (solo superadmin).
  - `supabase start` (raíz): migraciones y seed aplicados. `supabase test db`: **55/55 aprobado** a la primera.
  - Tipos generados en `supabase/database.types.ts`. Admin y Player usan el cliente tipado; el typecheck señaló 24 sitios y se corrigieron. Los `select` se revisaron a mano.
  - `.env.local` de Admin y Player apuntan a Supabase local; los valores del proyecto anterior quedan comentados.
  - **Navegador, Player:**
    - sin sesión, la gestión lleva a `/entrar`;
    - el admin de Centro queda fuera («solo superadmin»);
    - el superadmin entra;
    - al cerrar sesión vuelve a `/entrar`;
    - el runner carga sin sesión y sin claves de Supabase en el almacenamiento.
  - **Navegador, Admin como admin de Centro:**
    - lista de talleres (11, como el seed);
    - detalle con grupo, modalidad, idioma, ejecución y cierre;
    - código de acceso generado;
    - asistente: solo ve «El huevo» (la RLS oculta el personalizado ajeno y el borrador), tres modalidades, grupo; crea un taller híbrido guardado con grupo, idioma y asignación en su comunidad (comprobado en la base).
  - **Navegador, Admin como superadmin:**
    - catálogo con área y filtro por área;
    - edición con enfoques de salud (guardado y comprobado en la base);
    - detalle con 12 secciones de guía;
    - «Probar» con `?escena=origen`.
  - Corrección: FK directa de `storyboard_enfoques` a `enfoques_salud` (la API no podía embeberla) y horas del seed en la zona de Guatemala. `supabase db reset`: 55/55 de nuevo.
  - `./scripts/verify.sh`: **aprobado**, ahora con las pruebas de la base (Admin 51, Player 23 y Educators 13 tests, typecheck, build y 55 pgTAP).
- 2026-10-15 — Corrección: había registrado el modelo como «aprobado por Luis» cuando solo respondió dos preguntas. Luis cuestiona las tablas `afirmaciones`, `escena_afirmaciones`, `areas` (debería ser «categorías»), `area_enfoques`, `storyboard_enfoques`, `enfoques_salud`, `subcategorias` y `cierres`: la taxonomía ya está en el JSON del storyboard. Se rectifica el registro; el modelo queda en revisión.
- 2026-10-15 — Luis aprueba los nombres con contexto y deja `jornadas`; las etiquetas pasan al JSON del storyboard. Plantea dos temas que quedan en análisis: participantes (opcionales) y la app del hogar (colecciones, perfiles sin Auth, ruta por interés, unirse a una organización). La base local y Admin siguen con el esquema anterior hasta aplicar lo aprobado.
- 2026-10-15 — Esquema revisado aplicado ([decisión 006](../docs/decisions/006-modelo-y-catalogo-desde-player.md)).
  - Base: 8 migraciones nuevas con los nombres aprobados; fuera la taxonomía en tablas, familias, afirmaciones y enfoques; `storyboards` con la metadata del JSON; `jornadas`; `sincronizar_storyboard` (solo superadmin, `SECURITY INVOKER`). Seed regenerado.
  - Player registra el catálogo: compara el JSON con la base (sin registrar, desactualizado con qué cambió, al día) y lo registra o actualiza. `healthFocus` en el JSON del huevo.
  - Admin: los composables y las páginas con los nombres nuevos; Platform edita la publicación y la cabecera de la guía. Se quitaron 29 textos por idioma que solo usaban el registro por pegado y la sincronización.
  - Corregido: el comentario de `storyboards.titulo` decía que Admin lo corrige (lo pone el JSON en cada sincronización) y la migración decía que Player valida la subcategoría y los enfoques (no lo hace; queda pendiente).
  - **Navegador:** Player, «Desactualizado: enfoques de salud» → «Actualizar en la base» → «Al día», con la publicación, la versión de la guía y lo escrito conservados (comprobado en la base). Admin como superadmin: lista de Platform con categoría, detalle y edición (países y versión de la guía guardados y comprobados en la base). Admin como admin de Centro: workshops (11, 2 completados) y el detalle con «Ejecución y feedback».
  - `./scripts/verify.sh`: **aprobado**, con 68 pruebas pgTAP. Después, `supabase db reset` para dejar el seed (las pruebas del navegador habían cambiado datos). Admin: typecheck y 35 tests tras quitar los textos.
  - Análisis de participantes (Luis prefiere la opción c, códigos de la comunidad) y de los perfiles del hogar, con recomendación y preguntas para Luis. Nada decidido.
- 2026-10-16 — Luis responde sobre participantes y la app del hogar (registrado arriba): la comunidad es el grupo; «Unirme» con el código de la comunidad; temarios; cuenta del adulto con perfiles (nombre y edad) e intereses; sin caducidad. Corrige el riesgo que planteé sobre el interés «diabetes». Propuesta de tablas y 5 preguntas, en análisis.
  - Error en Player («Cannot read properties of null (reading 'parentNode')»): el panel de errores del servidor de desarrollo mostraba un error de una recarga en caliente del 2026-10-15 (21:55 UTC), mientras yo editaba Player. Su aviso tapa «Siguiente» en el runner. No es un fallo del runner: con el panel oculto se recorren las 4 escenas y el runner no llama a Supabase. Se quita reiniciando el servidor de desarrollo de Player.
- 2026-10-16 — Segunda ronda de Luis: PIN propio, publicaciones solo para miembros (también por comunidad), la organización ve los perfiles miembros, el código lo da la organización, solo «terminado», prefijo `hogar_`. Simulé el flujo completo en SQL sobre Supabase local (borrador de tablas y 12 escenarios, con `rollback`): las tablas nuevas encajan con las actuales. Hallazgos: el educador en varias comunidades tiene un código por comunidad; la continuidad debe contar después de la clase; los grupos pequeños identifican; falta el país del hogar. Todo en propuesta.
- 2026-10-16 — Tercera ronda de Luis:
  - PIN libre, con el correo único;
  - perfil con género;
  - educador de la organización ligado a comunidades;
  - seguimiento guardado pero sin mostrarse en la primera versión;
  - cuenta con nombre y país;
  - los colaboradores publican en su comunidad.
  
  Modelo corregido y simulación v2 con permisos por rol: todo como se esperaba. «Membresía» pasa a `hogar_perfil_comunidades`.
- 2026-10-16 — Cuarta ronda: idiomas y países de los storyboards, y nombres (`comunidad_participantes`, `comunidad_educadores`). Simulación v3 con 13 escenarios de contenido, organización y app del hogar: todos como se esperaba. Hallazgo: la regla de país solo la aplica la pantalla de Admin (ni workshops ni licencia la comprueban) y quitar un idioma del JSON puede dejar workshops sin idioma. Reglas nuevas en propuesta.
- 2026-10-16 — Quinta ronda: Luis aprueba `comunidad_participantes`. Los storyboards se publican desde Player y los países van en el JSON por tropicalización. Simulación v4 con 7 escenarios (registrar tropicalizado, publicar, programar por país, ampliar y restringir países, archivar, personalizado): todos como se esperaba. Propuesta de quién decide cada dato del storyboard.
- 2026-10-16 — Sexta ronda:
  - los países no van en el JSON: Player los elige del catálogo `paises` al registrar o publicar;
  - estados como un artículo, con `EN_REVISION` (REGISTRADO, EN_REVISION, PUBLICADO, ARCHIVADO);
  - enums para estados y valores fijos.
  
  Simulaciones v5 (11 escenarios) y v6 (enums, listas por categoría y ciclo): todos como se esperaba.
- 2026-10-16 — Séptima ronda: Luis pide estados de artículo también para los talleres y que yo elija cuáles aplican. Propuesta: BORRADOR, EN_REVISION, PUBLICADO, CANCELADO y ARCHIVADO guardados; programado, hoy, en curso, realizado, falta el feedback y sin realizar, deducidos de la fecha y la ejecución. Simulación v7 con 8 escenarios: todos como se esperaba.
- 2026-10-16 — Octava ronda: Luis añade `FINALIZADO` (pasó la fecha; se puede reprogramar y publicar) y define `ARCHIVADO` como descartado. Ciclo rehecho con finalización por feedback completo y por tarea horaria (`pg_cron`) y con reprogramación. Simulación v8 con 6 escenarios: todos como se esperaba.
- 2026-10-16 — Luis: «estamos listos para probar»; el SQL deja de ser simulación y pasa a ser la migración de producción. Aplicado el modelo completo (decisión 007).
  - Base: reescritas `0001`–`0007`, más `0009_hogar` y `0010_tareas` (pg_cron).
  - Pruebas: 177 pgTAP. Hallazgo al probar en el navegador: con la FK compuesta a `comunidad_educadores`, la API ya no podía embeber `educadores` desde `workshop_educadores` ni desde `educador_grupo_miembros` (PGRST200). Se añadieron las FK directas además de las compuestas.
  - Admin: educadores de la organización, ciclo del workshop, «Participantes», cifras por comunidad y Platform de solo lectura en la publicación. Corregidos los textos «app de StoryPlay» del asistente y del alta de educadores; los de la página de perfil quedan en la tarea 008.
  - Player: «Publicación» y validación del JSON.
  - **Navegador** (Supabase local, servidores de Luis):
    - Player: catálogo con «Al día» y «Publicado»; añadir México y guardar (comprobado en la base, `{GT,MX}`); pasar a registrado rechazado con el mensaje de la base; guía «ES 4 de 4».
    - Admin como admin de Centro: talleres (Todos 12, Programados 7, Realizados 2, Sin realizar 1, Borrador 1, Cancelados 1); reprogramar el cancelado (Programado, «Reprogramado una vez»); «Participantes» con Pepito y el código 482913; educadores con Lucía «Sin activar».
    - Admin: dar de alta a Lucía en Comunidad Sur la liga sin duplicarla (comprobado en la base); comunidades con educadores, colaboradores y participantes; el asistente crea un taller publicado (comprobado en la base); planner e inicio sin errores.
  - `./scripts/verify.sh`: **aprobado** (Admin 35, Player 32, Educators 13 y 177 pgTAP, sin avisos), tras `supabase db reset` para dejar el seed.
- 2026-10-16 — Luis: migrar la versión local y dejar cada feature de las apps funcionando con la base, para su QA manual.
  - **Cambio de nombre** (pedido de Luis): `comunidades.codigo_union` → `codigo_acceso` (y `codigo_acceso_desde`, `comunidad_generar_codigo_acceso`); en `hogares`, `codigo_intentos_fallidos` y `codigo_bloqueado_hasta`. Editado en las migraciones, que aún no corren en la nube.
  - **Base:**
    - un taller publicado no se queda sin fecha ni hora al editarlo, ni sin educador (`workshop_educadores_baja`);
    - `organizacion_actualizar_perfil_publico`;
    - `hogar_catalogo` era `STABLE` y renueva la sesión: PostgREST la corría en solo lectura y fallaba desde la API (`25006`), aunque pgTAP pasaba. Ahora es volátil, con una prueba que revisa todas las funciones con sesión.
    - Pruebas: 185.
  - **Admin:**
    - jornadas (organización) y su selector en el asistente y en el taller;
    - «Para casa» en organización y comunidad (temarios, publicaciones y perfil público);
    - edición del taller (datos y educadores);
    - activo o inactivo del educador en la comunidad;
    - configuración de la comunidad (solo lectura para colaboradores, borrado con resumen que incluye participantes);
    - perfil (nombre, apellido, idioma y contraseña);
    - «¿La olvidaste?» → `/restablecer`;
    - cifras del inicio por mes y semana;
    - participantes en i18n.
    - En `config.toml`, `/restablecer` en las URLs de redirección locales.
  - **Educators** (agente): sesión con PIN y activación, talleres y guía por `educador_*`, iniciar y terminar desde el runner, feedback en la base, cancelado con su motivo y modo demo con `fixtures/`. El seed salta el taller cancelado del modo demo.
  - **Navegador** (Admin, Supabase local, servidores de Luis):
    - recuperar contraseña por Mailpit hasta `/restablecer` (rechaza repetir la anterior, en español);
    - perfil guardado y contraseña cambiada (rechaza una actual equivocada);
    - configuración en solo lectura para el colaborador y editada por la admin;
    - temario creado y publicado por el colaborador (le llega a Pepito por `hogar_catalogo` desde la API);
    - jornada creada (valida fechas);
    - perfil público apagado (sale de `hogar_organizaciones`);
    - taller publicado editado y con el educador cambiado;
    - taller nuevo del asistente con jornada;
    - Lucía desactivada en la comunidad.
    - Todo comprobado en la base.
  - **Correcciones vistas en la QA:** etiqueta «Comunidad Comunidad Centro», dos botones lima en «Para casa», horas cortadas en la edición, grupo «—» de los educadores, y el grupo del educador en vez del de la asignación en el detalle del taller.
  - **Sin probar en el navegador:** Educators conectado. El servidor de Luis arrancó antes de su `.env.local` y sigue en modo demo; falta reiniciarlo.
- 2026-10-16 — Luis: la página «¿Dónde quieres entrar?» sobra; manda el selector de contexto.
  - El selector recuerda también el tipo (Platform, organización o comunidad).
  - Al entrar se vuelve ahí; sin nada recordado, por rol: superadmin → Platform, admin → su organización, colaborador → su comunidad.
  - `/inicio` eliminada; los enlaces viejos aterrizan igual.
  - Pruebas de `useContexto`: 40.
  - **Navegador:** el superadmin entra a Platform, elige Comunidad Norte, cierra sesión y al volver entra directo a Comunidad Norte.
- 2026-10-18 — Luis: el dashboard del superadmin debe tratar de la administración de las organizaciones, no de su operación. Debajo de Platform, solo lo suyo: organizaciones que administra y comunidades donde colabora.
  - Dashboard de Platform rehecho:
    - cifras: organizaciones (y nuevas en 30 días), operando, en alta, sin licencia vigente;
    - se quedan licencias, atención (el cupo lleno, como señal de venta) e invitaciones de administrador;
    - actividad: altas, licencias emitidas o renovadas y administradores incorporados.
  - Fuera: comunidades, educadores y talleres.
  - El selector ya no lista al superadmin las comunidades de otras organizaciones.
  - Acceso del superadmin a la operación de todas las organizaciones: se analizaron tres opciones (dejarlo así, mínimo privilegio, acceso de soporte temporal). Luis elige mínimo privilegio el mismo día (decisión 008).
- 2026-10-18 — Luis aprueba la opción 2: el superadmin administra organizaciones, no su operación ([decisión 008](../docs/decisions/008-superadmin-administra-organizaciones.md)).
  - **Base:**
    - `mis_organizaciones()` ya no incluye todas las organizaciones para el superadmin;
    - perfiles, solo de administradores; invitaciones, solo de administrador; temarios, solo los de Nutrinación;
    - funciones `platform_uso`, `platform_comunidades` y `platform_eliminar_organizacion`.
  - **Fallo encontrado:** borrar una comunidad con talleres fallaba (también desde Admin) por la clave `restrict` de las asignaciones. Ahora es diferida. Pruebas: 207.
  - **Admin:** Platform usa esas funciones; el detalle de organización muestra el uso de la licencia (comunidades, educadores, personalizados); la baja se lleva la organización entera.
  - **Navegador:** lista con las cifras, detalle con el uso y las comunidades, y la baja de Fundación Centro con su resumen (2 comunidades, 13 talleres, 1 participante…). Comprobado en la base, después `supabase db reset`.
- 2026-10-18 — Luis pide más control sobre una organización para dar soporte. Implementado dentro de la decisión 008 (sin ver la operación):
  - panel «Estado» en el detalle: licencia, cupo, acceso de administradores, educadores sin acceso, talleres próximos, última actividad y perfil público;
  - cifras por comunidad;
  - por administrador: último acceso, enviar enlace para restablecer la contraseña y quitarlo.
  - Base: `platform_uso` con cifras de soporte, `platform_comunidades` con cifras y `platform_administradores`. Pruebas: 210.
  - **Navegador:** estado con «Ninguno ha entrado aún» que pasa a «Último: 18 oct 2026» tras entrar la admin; enlace recibido en Mailpit; quitar a la titular la deja «Sin administradores» y «Sin titular». Después `supabase db reset`.
  - **Propuesta, sin decidir:** acceso de soporte temporal que concede cada organización (la opción 3 de la decisión 008). Detalle en la conversación.
- 2026-10-19 — Luis: al invitar a un administrador o titular solo se ve el correo, y como superadmin no puede hacerse administrador o titular desde Platform.
  - **Invitaciones:**
    - llevan nombre y apellido (los tres formularios) y, las de administrador, «será el titular»;
    - solo el superadmin emite las de titular (RLS), y al canjearla o aceptarla la titularidad pasa a esa persona;
    - un titular por organización (índice único);
    - las listas muestran a quién se invitó y la marca «Titular»;
    - el registro se rellena con el nombre.
  - **Superadmin:** «Unirme como administrador» (opcionalmente titular) y «Ir a la organización» en Platform. Es una precisión de Luis a la decisión 008.
  - **Fallo encontrado:** canjear cualquier invitación creaba la cuenta sin enlazarla, porque Auth guarda el `app_metadata` después de insertar y el trigger no lo ve. `canjear-invitacion` enlaza ahora explícitamente. El contenedor de Edge Functions local estaba caído; se levantó.
  - **Pruebas:** 216.
  - **Navegador:** invitación de titular a Colegio Norte con nombre (aviso de traspaso), superadmin unido como administrador y dentro de la organización, registro con el nombre puesto. Canje por la función: la nueva titular queda enlazada y Nora Norte sigue como administradora. Después `supabase db reset`.
- 2026-10-26 — Luis no puede compartir las apps por Tailscale. Causas:
  - Vite respondía 403 a los nombres `*.ts.net`;
  - las apps llamaban a Supabase en `127.0.0.1`, que en otro equipo es ese equipo;
  - Educators y Admin abrían Player en `localhost`, y Player solo aceptaba que lo incrustaran desde `localhost` (mensajes y CSP);
  - Auth local solo volvía a `localhost`;
  - en http no hay `navigator.clipboard`.
  - **Arreglado solo en desarrollo:**
    - `allowedHosts` `.ts.net` en la capa `@playhub/ui`;
    - `urlEnEsteEquipo` para Supabase y Player;
    - Player acepta los orígenes de la tailnet;
    - `config.toml` admite `**.ts.net:3000`;
    - `copiarTexto` con método alternativo.
  - **Comprobado con curl por el nombre de Tailscale:** apps, archivos, login contra Supabase y CORS.
  - El navegador integrado de la app bloquea los recursos de ese host (`ERR_BLOCKED_BY_CLIENT`), así que falta probarlo desde otro equipo.
  - `verify.sh`: apps en verde. La base falla por datos (la organización «Nutrinacion» creada a mano y el seed de hace una semana); no se reinició para no borrarla.

- 2026-10-28 — Luis pide limpiar la base para empezar su QA manual. `supabase db reset` en local: migraciones `0001`–`0010` y seed, fechas desde hoy. Se borró la organización «Nutrinacion» creada a mano (sin licencia ni comunidades).
  - `./scripts/verify.sh`: **aprobado**, sin avisos. Admin 52, Player 32 y Educators 26 tests; typecheck y build de las tres; pgTAP 216 pruebas en 5 archivos. La base queda como el seed: 2 organizaciones, 4 usuarios, 14 workshops.
  - Para el QA: solo «El huevo» tiene contenido en Player; «El pan» y «La soda» son filas del seed sin JSON. En local las invitaciones no mandan correo (sin webhook ni Resend): se usa «Copiar enlace».
- 2026-10-28 — Luis hará el QA como en producción, sin seed, y autoriza los commits.
  - Comprobado que migraciones y base coinciden: `npm run db:types` contra la base recién reseteada genera el mismo `database.types.ts`.
  - Base local con `supabase db reset --no-seed`: 10 migraciones, catálogos de referencia, `configuracion` vacía, sin usuarios y con la tarea de pg_cron. Los pasos locales (configuración y primer superadmin) están en `supabase/README.md`; los hace Luis.
  - Mientras dure el QA, las pruebas pgTAP no aplican: necesitan el seed.
  - Resend: `enviar-invitacion` necesita `RESEND_API_KEY` y el dominio `nutrinacion.com` verificado. Nada la dispara todavía: falta el webhook al insertar en `invitaciones`.
  - Commits por área, sin push: repo, UI Kit, Supabase, Player, Admin, Educators y documentación.
- 2026-10-28 — Análisis con Luis: ¿hace falta Resend? Las invitaciones no lo necesitan (el enlace se copia). Un código por correo para Admin haría el SMTP obligatorio en cada entrada desde un dispositivo nuevo. En la nube, el correo de Supabase solo manda a su equipo, así que «¿La olvidaste?» no habría funcionado en producción. Luis elige contraseña y recuperación por soporte: [decisión 009](../docs/decisions/009-acceso-admin-sin-correo.md).
  - `0011_recuperacion`: `recuperacion_autorizar(email)` decide quién genera el enlace. El superadmin, para cualquiera; el titular, para cuentas que solo llegan a organizaciones suyas (ni por una invitación pendiente de otra); nadie, para la suya. Aplicada en local con `supabase migration up`, sin reset.
  - Edge Function `enlace-recuperacion`: consulta la regla con la sesión de quien lo pide y, con service role, `generateLink` de tipo `recovery`, que no envía correo. `config.toml`: `otp_expiry` de 24 h.
  - Admin:
    - `EnlaceRecuperacion` en Platform (por correo, para soporte), Administradores y Colaboradores; sustituye el «enviar enlace» de Platform;
    - el login dice a quién pedir el enlace;
    - `/restablecer` canjea `token_hash` con `verifyOtp` al guardar, no al abrir.
  - Verificación:
    - pgTAP `06_recuperacion`: 22 pruebas, **aprobado**. Crea sus propios datos, así que corre contra la base sin seed sin tocarla.
    - Typecheck de Admin y Player, 52 tests de Admin, check-ui y check-context: **aprobado**.
    - Edge Function con curl, con datos temporales: genera para el titular; rechaza su propia cuenta, una inexistente, a la colaboradora y a anon. El token sirve una vez y uno nuevo anula el anterior.
    - Navegador (Admin de Luis en :3000):
      - el login sin formulario de correo;
      - `/restablecer` con el token → contraseña nueva → entra a su comunidad; la anterior ya no vale;
      - el titular genera el enlace desde Colaboradores;
      - soporte, desde Platform: «No hay ninguna cuenta de Admin con ese correo» y el enlace.
    - Datos temporales borrados: la base volvió a quedar vacía.
    - Build de Admin: **aprobado**.
    - **No ejecutado:** `verify.sh` completo: su pgTAP `01`–`05` necesita el seed.

