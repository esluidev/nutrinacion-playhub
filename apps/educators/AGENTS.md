# Educators

SPA Nuxt 4 (capa `@playhub/ui`, densidad `touch`) para el educador: entra con su correo y su PIN, ve sus talleres de todas sus organizaciones, los prepara, los juega con el runner de Player incrustado (modo educador, con la guía que le da Educators) y hace el cierre del facilitador. Se usa sobre todo en **móviles y tabletas** ([decisión 002](../../docs/decisions/002-superficies-y-guia.md)). Sustituye al prototipo Flutter.

## Conexión con Supabase

Educators usa la base compartida **sin Supabase Auth** (decisiones [005](../../docs/decisions/005-base-nueva-y-acceso-educador.md), [007](../../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md) y [011](../../docs/decisions/011-organizacion-como-unidad-de-operacion.md), contrato en `supabase/migrations/0006`): `app/utils/supabase.ts` crea el cliente con la anon key (`NUXT_PUBLIC_SUPABASE_URL` y `NUXT_PUBLIC_SUPABASE_ANON_KEY`), sin sesión de Auth que guardar ni renovar, y todo pasa por las funciones `educador_*` con el token del educador. No lee tablas.

- **Entrar y el PIN.** Correo y PIN de 6 dígitos (`educador_entrar`). La primera vez, o después de que Admin genere un código nuevo, esos 6 dígitos son el código de activación: la base responde `definir_pin` y `entrar` pide elegir el PIN dos veces (`educador_activar`; el correo y el código quedan solo en memoria). Cinco fallos bloquean 15 minutos. El token se guarda en el dispositivo (`playhub-educadores-token`, dura 30 días) y la ficha (`educador_sesion`: nombre y organizaciones), solo en memoria. El middleware comprueba el token al cargar; si cualquier llamada responde `28000`, la sesión se olvida y se vuelve a `/entrar`. En `cuenta` se cambia el PIN (`educador_cambiar_pin`).
- **Talleres.** `educador_workshops` trae los publicados, finalizados y cancelados de todas sus organizaciones, cada uno con su organización y, si forma parte de una, su jornada (`{ id, nombre, ubicacion, fecha_inicio, fecha_fin }`), y `tallerDesdeBase` los pasa a `Taller`. La jornada es un lugar y unos días: sus talleres heredan su lugar y el `lugar` del taller es el detalle, así que `Taller.lugar` ya llega compuesto («Sede central · Aula 3A», `lugarDelTaller`). La jornada solo se muestra (nombre y días, en la tarjeta y en la cabecera del taller): el educador no la gestiona. Un cancelado se ve en su día, en coral y con el motivo; no se inicia ni recibe feedback. La guía (`educador_guia`, en el idioma del workshop) se pide al abrir el runner y se guarda por workshop. El runner se abre en el idioma del workshop, no en el de la interfaz; con `listo` se llama a `educador_iniciar` (solo si está publicado) y con `terminado`, a `educador_terminar` antes del feedback (`educador_guardar_feedback`, que se puede corregir).
- **Modo demo.** Sin esas dos variables, la app funciona con `app/fixtures/talleres.json` (con la forma de `educador_sesion` y `educador_workshops` y los días relativos a hoy, también los de la jornada; `tallerDesdeFixture` los convierte) y `app/fixtures/guia-<slug>.json`: cualquier correo con 6 dígitos entra y los cierres se guardan en el dispositivo. `scripts/generar-seed.py` lee el mismo fixture para el seed local: no cambies los talleres publicados o finalizados (día, horas, lugar, grupo) sin regenerar el seed y pasar `supabase test db`.

## Estructura

- Layout de la app Flutter original, mejorado: cabecera con el saludo y el menú de la cuenta (`layouts/default.vue`); barra de fechas y calendario de semana o mes (`components/CalendarioBarra`, `VistaSemana`, `VistaMes`, `SelectorFecha`, `TallerTarjeta`).
- `app/pages/`: `entrar` (correo + PIN; la primera vez, elegir el PIN), `index` (barra de fechas, calendario de semana o mes y la ventana del taller), `workshops/[id]` (preparación y abrir el taller), `workshops/[id]/jugar` (el runner a pantalla completa con `UiRunner`), `workshops/[id]/cierre` (el feedback del taller, como en el original: calificación, asistentes, participación, claridad y comentarios; se llega al terminar el taller en el runner) y `cuenta` (sus organizaciones, idioma y cambiar el PIN).
- `app/composables/`: `useSesion` (token, ficha, entrar, activar, salir y cambiar el PIN) y `useTalleres` (talleres, guía, inicio, fin y feedback), los únicos que hablan con Supabase o con los datos del modo demo; y `useT` (español e inglés, `app/i18n/messages.ts`).
- `app/utils/talleres.ts`, `app/utils/sesion.ts` y `app/utils/calendario.ts`: lógica pura (de la base y del fixture a `Taller`, estados con cancelado, agrupación, cierre, URL del runner; la ficha del educador; semanas, mes, rango y los días de la jornada), con tests. `app/utils/supabase.ts`: el cliente.

## Reglas

- **Táctil primero:** objetivos de al menos 40 (48 los principales), sin zoom por doble toque, zonas seguras del notch y la barra de inicio, vertical y horizontal. Los controles no seleccionan texto (lo hace el kit en `touch`).
- Los juegos pertenecen al runner de Player: Educators lo incrusta con `UiRunner` (`NUXT_PUBLIC_PLAYER_URL`, contrato en [`docs/runner.md`](../../docs/runner.md)) y no reimplementa mecánicas. Le da la guía; con `terminado` lleva al feedback del taller y con `salir` vuelve a donde estaba.
- Un taller se abre desde su tarjeta en una ventana con siempre los mismos dos botones: «Iniciar taller» y «Ver guía». El feedback no es un botón: es el paso final del taller.
- El cierre del facilitador es de grupo: asistentes, participación observada, claridad y lo que costó o faltó. Nunca respuestas, puntos ni datos de una persona (constitución, «Medición agregada admitida»).
- Todo texto visible pasa por `useT` en los dos idiomas.
- Diseño: el UI Kit manda (`packages/ui/DESIGN.md`, «Profundidad» y «Roles de color»); el mismo estado se ve igual en Admin, Player y Educators. Sin pasos de paleta, hex, sombras ni tamaños sueltos en las vistas: roles, `data-tone` y los `Ui*`. La semana usa las mismas piezas que el planner de Admin (bandejas, hoy en sol suave).

## Desarrollo y verificación

```bash
cp .env.example .env.local   # Player y Supabase local (con las de Supabase vacías, modo demo)
npm install                  # desde la raíz del monorepo
npm run dev                  # http://localhost:3002 (cuentas de prueba en supabase/seed.sql)
npm run typecheck && npm test && npm run build
```

Para cambios de interfaz, revisa en el navegador a 375 × 812, 768 × 1024 y 1024 × 768.
