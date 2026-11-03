# Arquitectura

## Topología

```text
                 @playhub/ui  (UI Kit: capa de Nuxt que heredan las tres apps; UiRunner y el contrato del runner)
         ┌─────────────────────┼──────────────────────┐
       Admin                 Player                Educators
  admin.nutrinacion.com  player.nutrinacion.com  educator.nutrinacion.com
         │          runner /play/** (público)    web táctil, datos de
         │          + gestión (superadmin)       prueba hasta la 006
         ▼                   │ registra el catálogo
     Supabase  ◀─────────────┘
     (Auth de Admin y Player, PostgreSQL, RLS, Storage; Educators entra con correo + código por funciones, tarea 006)

Educators /workshops/<id>/jugar ── iframe ──▶ runner de Player
          ◀── listo · escena · terminado · salir ──   ── iniciar (guía) ──▶
```

Cada app vive en su subdominio y se despliega por separado. Para el navegador, los subdominios de `nutrinacion.com` son el mismo sitio: el iframe de Player dentro de Educators comparte almacenamiento y service worker con Player abierto directamente ([decisión 004](decisions/004-runner-incrustado.md)).

| App | Responsable de | No es responsable de |
|---|---|---|
| Admin | Organizaciones (con sus países, licencia, administradores y colaboradores), educadores y sus grupos, jornadas, workshops (su ciclo) y el planificador; la guía de los storyboards (Platform) | Construir juegos, registrarlos ni publicarlos; registrar personas (participantes) |
| Player | La app de la administración de Nutrinación para construir, probar, registrar y publicar el contenido (estado, países y organización; solo superadmin, con Supabase Auth), y el runner público que incrustan las demás apps ([contrato](runner.md)), sin sesión ni Supabase | La guía (en Admin/Platform); ser la app del hogar, que no se construye ahora ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)) |
| Educators | Experiencia del educador: entrar, ver sus talleres (semana y mes), abrir el taller con el runner incrustado (y darle la guía) y dar el feedback al terminar | Implementar juegos |

## Cómo se conectan las apps (hoy)

Las apps no comparten estado. El runner se incrusta con el contrato de [runner.md](runner.md); el resto se conecta por URL.

| De → a | Cómo | Qué viaja |
|---|---|---|
| Educators → Player | «Iniciar taller» abre `/workshops/<id>/jugar`, que incrusta `NUXT_PUBLIC_PLAYER_URL/play/<eje>/<slug>?mode=educator&lang=<idioma>` con `UiRunner` | Por URL, el storyboard y el idioma. Por mensaje (`iniciar`), la guía. Ningún dato personal ni sesión |
| Player → Educators | El runner manda `escena`, `terminado` y `salir`. Con `terminado`, Educators pasa al feedback del taller; con `salir`, vuelve a donde estaba. Solo responde a los orígenes de `NUXT_PUBLIC_RUNNER_HOSTS` | Índice y carpeta de la escena. Nunca puntos ni respuestas |
| Runner educador ↔ dispositivos | Simulado entre pestañas del mismo navegador (`BroadcastChannel`). El educador manda escena, pausa, reinicios y puntos; del dispositivo solo vuelve su presencia. El código para unirse («PH · 4821») es de prueba | Sin servicio de sesión real todavía |
| App → runner: guía | La app que incrusta el runner se la pasa con `iniciar`. Educators la toma de `app/fixtures/guia-<slug>.json` (datos de prueba) hasta la tarea 006 | Texto de la guía por escena, saneado al llegar |
| Admin → Player | «Probar» abre el runner en otra pestaña con la URL de `configuracion` (clave `player_url`). Pasará a `UiRunner` (tarea 009) | Storyboard y escena |
| Player → Supabase → Admin | «Registrar/Actualizar en la base» (`sincronizar_storyboard`) y «Publicación» (`publicar_storyboard`) en la gestión de Player (decisiones [006](decisions/006-modelo-y-catalogo-desde-player.md) y [007](decisions/007-educador-hogar-y-ciclo-del-workshop.md)); Admin lo lee de la base | La metadata del JSON y las escenas; el estado, los países y la organización |

## Flujo de punta a punta

1. El equipo construye un storyboard y sus escenas en Player.
2. Un superadmin lo registra en la base desde Player: la metadata de su JSON (`clave`, slug, categoría, edición, enfoques, idiomas…) y sus escenas. Player avisa cuando el build cambia y hay que actualizarlo.
3. En Admin/Platform se escribe la guía; desde Player se publica en sus países (Player muestra cuánta guía hay en cada idioma).
4. Una organización programa un taller con un storyboard publicado en alguno de sus países (o personalizado para ella), suelto o dentro de una jornada.
5. Educators muestra el taller en Mis talleres del educador; desde su ventana, «Iniciar taller» abre el runner incrustado en modo educador (Educators le da la guía) y «Ver guía» su preparación.
6. Al terminar el taller en el runner, Educators lleva al educador al feedback del taller (calificación, asistentes, participación, claridad y comentarios; solo del grupo). Al finalizarlo, el taller queda completado.

Los seis pasos funcionan con Supabase local.

## Pendiente

- **App del hogar**: fuera del alcance actual ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)); cuando toque, se diseña sobre el modelo de organización.

- **Sesión del educador**: en marcha (decisiones [005](decisions/005-base-nueva-y-acceso-educador.md) y [007](decisions/007-educador-hogar-y-ciclo-del-workshop.md)): correo y PIN que elige con el código de activación de Admin, token de sesión y funciones `educador_*`; ve sus workshops de todas sus organizaciones.
- **Guía en la base**: Educators la lee con `educador_guia` (ya con las claves del runner) y se la pasa al runner con `iniciar` ([decisión 004](decisions/004-runner-incrustado.md)); Player no necesita leer nada. Los modos dispositivo y casa nunca la reciben.
- **Sesión del taller con dispositivos**: un servicio real que sustituya al `BroadcastChannel` (unirse con código, escena, pausa y presencia).

## Límites de datos

- `organizacion`: la unidad de operación ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)): países donde opera, licencia, administradores, colaboradores, educadores, jornadas y talleres.
- Build de Player: la verdad del juego, en sus JSON (`clave`, slug, título, taxonomía y enfoques, idiomas, escenas, narración, consignas, contenido ejecutable, efectos, Rive y SVG).
- Bucket de Supabase (previsto, tarea 009): las voces de narración, que es lo que pesa.
- Supabase: la copia de la metadata del JSON para filtrar y buscar y la publicación (las registra Player), la guía, la operación y las relaciones. Nada del contenido del juego ni de personas (participantes).
- La `clave` UUID une build y catálogo.
