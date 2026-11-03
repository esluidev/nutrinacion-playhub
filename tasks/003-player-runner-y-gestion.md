---
id: 003
estado: finalizada
prioridad: alta
creada: 2026-10-14
---
# Player: runner nuevo y gestión con el UI Kit

## Objetivo

Reconstruir el runner de Player sobre el player de referencia y llevar su gestión al UI Kit, según la [decisión 003](../docs/decisions/003-runner-playhub.md).

## Alcance

- Player pasa a Tailwind 4 y extiende `@playhub/ui`. La gestión usa densidad `compact` y el runner, `touch`.
- Runner:
  - el marco del player de referencia: barra, consigna, escenario, pie con feedback, paneles, ventanas, modos y ediciones;
  - las plantillas Anuncio, Destapar y Colocar;
  - el huevo de la demo como primer storyboard con la estructura de `estructura.md`;
  - Rive (aves) en `content/library/`.
- Se retiran los storyboards viejos y su código, y se conservan los motores (decisión 003).
- La guía del modo educador usa datos de prueba hasta la tarea 006.
- Fuera: servicio de sesión real y audio grabado.

## Criterios de aceptación

- [ ] `/play/alimentacion/el-huevo` recorre las escenas con la estructura nueva en los modos educador, dispositivo y casa.
- [ ] `/play/**` sigue fuera del guard de autenticación, con test.
- [ ] La gestión (login, catálogo, detalle, «Copiar metadata») funciona con el kit.
- [ ] No queda código del enfoque anterior sin uso.
- [ ] `typecheck`, tests y build aprobados; revisión visual a tamaño de teléfono, tableta y escritorio.

## Plan

### Leer

`packages/ui/lab/` (`PLAYER-DESIGN.md`, `player.js`, `plantillas.js`, `datos-huevo.js`), `../skills/playhub-storyboard-games/references/estructura.md` y `apps/player/AGENTS.md`.

### Tocar

`apps/player/**`.

### Verificar

`npm run typecheck && npm test && npm run build` en `apps/player`, y el navegador en `/play/...` con cada modo.

## Pasos

- [x] Copia de seguridad de `apps/player` (no está versionado).
- [x] Migrar a Tailwind 4 y a la capa.
- [x] Retirar lo viejo.
- [x] Marco del runner y plantillas.
- [x] Contenido del huevo.
- [x] Gestión con el kit.

## Pendientes y siguiente paso

Finalizada el 2026-11-03 por Luis. El QA del modo casa queda fuera del alcance (decisión 011: no hay app del hogar). La prueba a tamaño de tableta y en dispositivos pasa a la [tarea 013](013-runner-en-el-aula.md).

## Log
- 2026-10-14 — Player reconstruido:
  - Copia de seguridad de `apps/player` en el scratchpad de la sesión (`backup/player-2026-10-14.tgz`).
  - Retirado: los 6 storyboards anteriores y `content/runner`; primitivas (de dibujo y de interacción), sprites, demos, `storyplay.css`, Pinia, el runner viejo, el tablero de inicio con datos inventados (`MOCK_STATS`), la barra lateral, `useT`, `tailwind.config.ts` y los `Ui*` locales.
  - Conservado: la narración (por texto, con la voz del navegador como respaldo), metadata, estado del registro, rutas públicas y sus tests, y `generate_audio.py`.
  - Nuevo: `app/runner/` con el marco portado de `player.js`, las plantillas Anuncio, Destapar y Colocar, Rive con el wasm servido por la app y la guía desde `fixtures/` (decisión 002).
  - El huevo: 4 escenas con la estructura de `estructura.md` (misma clave que el storyboard anterior; categoría `NUTRIENTES`). Sus aves y dibujos están en `content/library/`.
  - Gestión: barra superior, catálogo y detalle con el kit en densidad compacta.
- 2026-10-14 — Verificación en `apps/player`:
  - `npm run typecheck` aprobado (0 errores). Comprobé que detecta `tone="morado"` en un `Ui*` (exit 2).
  - `npm test` aprobado (3 archivos, 33 tests). `npm run build` aprobado.
  - Navegador a 1280×800, modo educador: Bienvenida idéntica a la referencia. En Descubrimiento, las tres aves de Rive aparecen al destapar, el feedback se ve en lima, suma +10 y el aro marca el avance. En Origen, el orden equivocado da la pista en uva y vuelve las fichas; el correcto da «Un recorrido posible», +10 y 20 puntos.
  - También aprobados: guía (4 pestañas, el tiempo se detiene), pausa con P, riel de ajustes, panel de dispositivos con los 7 de prueba y teclas G y ←.
  - Modo dispositivo en otra pestaña a 375×812: sigue la escena del educador y recibe los puntos del grupo; el educador lo ve primero en su lista.
  - Gestión, con un usuario simulado en el estado del cliente (sin credenciales reales): catálogo y detalle se ven y funcionan. El aviso de registro aparece porque no hay sesión real de Supabase.
- 2026-10-14 — Gestión de Player: recuperado el armazón original (barra lateral colapsable con isotipo, cabecera con título de página y menú de usuario, `useSidebar`), ahora con `ui-nav-item`, `UiAvatar` y cerrar sesión en coral. Se retiró `PlayerHeader.vue`. Estado de publicación con los tonos compartidos del kit (en revisión pasa de cielo a sol, igual que en Admin). Typecheck, 33 tests y build aprobados. Sin revisión en el navegador: la gestión necesita una sesión de Supabase, inaccesible desde este entorno.
- 2026-10-14 — Runner con la forma única del kit: el HUD, el participante y el riel pasan de cápsulas a rectángulos redondeados. «Siguiente» pasa de sol a lima (la acción principal, como en Admin y Educators); reiniciar sigue en sol. Revisado en el navegador en modo educador. Pasa a `revision`.
- 2026-10-14 — Player sin sesión ni Supabase (Luis: «quita la sesión de supabase para el player»):
  - Se retiraron el login, el guard, `useAuth`, la lectura del registro (`useRegistroRemoto`, `registroEstado`, `RegistroBadge`), `rutasPublicas`, el cliente y la dependencia `@supabase/supabase-js`, y las variables de entorno. Copia en el scratchpad (`backup/player-sesion-supabase-2026-10-14.tgz`).
  - Consecuencia: Player ya no muestra si un build está registrado ni su estado de publicación. La RLS de `storyboards` solo deja leer a usuarios autenticados, así que mostrarlo sin sesión exigiría una política anónima (migración, tarea 006). Admin/Platform compara la metadata al sincronizar.
  - La gestión queda pública: catálogo del build, detalle, probar el runner y «Copiar metadata». El armazón restaurado ya se ve en el navegador sin sesión: catálogo y detalle sin errores ni peticiones a Supabase.
  - Tests: 14 aprobados; los 19 retirados cubrían los módulos de sesión y registro.
  - Fuera el enlace «← Storyboards» del detalle (ver tarea 002, «Navegación»).
- 2026-10-14 — Fin del taller hacia el feedback de Educators:
  - `?taller=<id>` en el runner. Al terminar en modo educador se va a `NUXT_PUBLIC_EDUCATORS_URL/talleres/<id>/cierre`.
  - El id se valida (`utils/alTerminar.ts`, 3 tests) para no abrir una redirección arbitraria desde una ruta pública.
  - «Salir» conserva su comportamiento (vuelve atrás).
- 2026-11-03 15:06 — Luis: «finaliza todo y quita cosas del backlog, ordena las tareas». Finalizada; lo que quedaba abierto pasa a las tareas 012–015 (ver «Pendientes y siguiente paso»).
