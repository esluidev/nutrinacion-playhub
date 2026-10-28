---
id: 005
estado: revision
prioridad: alta
creada: 2026-10-14
---
# Educators en web, para móviles y tabletas

## Objetivo

Sustituir el prototipo Flutter por una app web con el UI Kit, pensada para usarse sobre todo en móviles y tabletas, según la [decisión 002](../docs/decisions/002-superficies-y-guia.md).

## Alcance

- App Nuxt en `apps/educators`, con densidad `touch` y control táctil cuidado:
  - áreas de toque de al menos 44 px;
  - sin zoom accidental ni selección de texto en controles;
  - vertical y horizontal.
- Pantallas, con datos de prueba:
  - entrada con correo y código;
  - mis talleres;
  - preparación del taller (guía y materiales);
  - conducir, que abre el runner de Player en modo educador;
  - cierre del facilitador.
- Se retira la app Flutter.
- Fuera: datos y auth reales (tarea 006), PWA y modo sin conexión.

## Criterios de aceptación

- [x] Las pantallas funcionan con datos de prueba a 375 px, 768 px y 1024 px, en vertical y horizontal.
- [x] `typecheck`, tests y build aprobados y dentro de `verify.sh`.
- [x] No queda código Flutter.

## Plan

### Leer

`../product/01 - Constitucion de producto.md` (facilitador, cierre, medición agregada), `packages/ui/lab/PLAYER-DESIGN.md` y `apps/educators` actual (flujo y pantallas).

### Tocar

`apps/educators/**`, `scripts/verify.sh` y `.claude/launch.json`.

### Verificar

`npm run typecheck && npm test && npm run build` en `apps/educators` y revisión en el navegador a los tres tamaños.

## Pasos

- [x] Inventario del flujo de la app Flutter.
- [x] App Nuxt con la capa.
- [x] Pantallas con datos de prueba.
- [x] Retirar Flutter.

## Pendientes y siguiente paso

Pendiente de la aceptación de Luis. El regreso al layout original (semana, mes y navegación por fechas) está en la tarea 007; datos y auth reales, en la 006; PWA y modo sin conexión, aparte.

## Log
- 2026-10-14 — Inventario Flutter: login, inicio (semana y mes), ejecución (lienzo, HUD, guía, recompensas, Nutribot), resumen y feedback. En la web, la ejecución es el runner de Player en modo educador (guía, dispositivos, puntos y pausa ya están ahí); Educators conserva entrar, ver talleres, preparar, abrir y el cierre. Nutribot no tiene respaldo en la constitución y no se porta.
- 2026-10-14 — Retirada la app Flutter: los archivos versionados se recuperan desde Git; `build/` y `.dart_tool/` (unos 555 MB) eran regenerables. Nueva app Nuxt en `apps/educators`, en el workspace:
  - densidad `touch`; sin zoom por doble toque (`touch-action: manipulation`), zonas seguras (`viewport-fit=cover`), navegación inferior de 56 en el teléfono y pestañas arriba desde `md`;
  - pantallas: entrar (correo + código de 6 dígitos, de prueba), mis talleres (hoy, falta el cierre, próximos y cerrados), preparación con «Abrir el taller» hacia `/play/<eje>/<slug>?mode=educator`, cierre del facilitador (asistentes, participación, claridad, qué costó y qué faltó, sin datos de personas) y cuenta (idioma español/inglés, salir);
  - datos en `app/fixtures/talleres.json` con fechas relativas a hoy; cierres y sesión en el dispositivo.
- 2026-10-14 — Verificación:
  - `npm run typecheck` aprobado, `npm test` aprobado (7 tests de `utils/talleres.ts`), `npm run build` aprobado. Educators entra en `verify.sh`.
  - Navegador a 375×812: entrada con los datos de prueba del proyecto, lista de hoy con «Abrir el taller» y «Cerrar el taller», y cierre guardado (aviso «Cierre guardado» y estado en el dispositivo). Corregido: la marca de selección tapaba el texto de las opciones estrechas.
  - Navegador a 1024×768: preparación a dos columnas; el enlace lleva a `http://localhost:3001/play/alimentacion/el-huevo?mode=educator&lang=es`. Corregido en el kit: el icono de `ui-symbol-sm` no se reducía.
  - Navegador a 768×1024 (tableta en vertical): pestañas arriba, una columna, y el taller cerrado en la prueba anterior aparece en «Cerrados».
- 2026-10-14 — Coherencia con el kit: la navegación actual (pestañas y barra inferior) usa `--nav-current`, como Admin y Player; la cuenta muestra `UiAvatar`; `UiSymbol` ya no necesita `!m-0`. Revisado a 375 px.
- 2026-10-14 — Forma única del kit: botones, pestañas y barra inferior como rectángulos redondeados (medido: 48 px, radio 12; tarjetas radio 16), igual que Admin.
