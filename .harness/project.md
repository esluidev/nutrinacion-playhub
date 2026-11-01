# Contexto del proyecto

Estado del contexto: parcial
Origen de la plantilla: eslui-harness 0.1.0, copia local `/Users/luis/Eslui/_sistema/plantillas/eslui-harness` (sin Git, sin revisión identificable). Integrada el 2026-10-14 en la [tarea 001](../tasks/001-integrar-eslui-harness.md).

## Objetivo y alcance

PlayHub (marca Nutrinación) es educación nutricional y de cuidado de la salud para niños y adolescentes de 4 a 17 años. Su núcleo es el **taller**: 25 a 40 minutos, conducido por un educador y construido sobre juegos digitales. Un **storyboard** es la secuencia fija de escenas de un taller; cada escena es un juego.

Este repositorio (`playhub-applications/`, remoto `esluidev/nutrinacion-playhub`) contiene las aplicaciones. Vive dentro del proyecto PlayHub (`../`), que no es un repositorio Git y reúne producto, storyboards, assets, UI Kit y el player de referencia; su entrada es `../AGENTS.md`.

Objetivo actual: simplificar la plataforma alrededor de la organización como única unidad de operación ([decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md), tarea 011): sin comunidades, participantes ni hogar; las jornadas viven en el planificador. Después, el QA manual de Luis desde cero.

## Componentes y stack

| Componente | Ruta | Responsabilidad | Stack y fuente de la versión |
|---|---|---|---|
| UI Kit | `packages/ui` (`@playhub/ui`) | Tokens, componentes `Ui*`, iconos y laboratorio; capa de Nuxt que extienden las tres apps. Incluye `UiRunner` y el contrato del runner | Tailwind 4: `packages/ui/package.json` |
| Admin | `apps/admin` | Operación de la organización (educadores y grupos, colaboradores, talleres, jornadas, planificador, storyboards disponibles); consola Platform: organizaciones, licencias y la guía del catálogo | Nuxt 4 SPA, densidad compacta: `apps/admin/package.json` |
| Player | `apps/player` | La app de la administración de Nutrinación para construir, probar y registrar el contenido en el catálogo (solo superadmin, con Supabase Auth), y el runner público `/play/**` que incrustan las demás apps (sin sesión ni Supabase). No es la app del hogar | Nuxt 4 SPA: `apps/player/package.json` |
| Educators | `apps/educators` | El educador entra, prepara, juega el taller con el runner incrustado y hace el cierre. Supabase (funciones `educador_*`); sin variables, modo demo con `fixtures/` | Nuxt 4 SPA, densidad táctil: `apps/educators/package.json` |
| Backend | `supabase/` | Esquema, RLS, funciones del educador, Storage y Edge Functions compartidos | Base `0001`–`0011` (reescrita el 2026-10-28 sin comunidades ni hogar ([decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md); modelo de [005](../docs/decisions/005-base-nueva-y-acceso-educador.md), [006](../docs/decisions/006-modelo-y-catalogo-desde-player.md) y [007](../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)), seed y pruebas pgTAP autocontenidas; correo de invitaciones por Resend, [decisión 012](../docs/decisions/012-invitaciones-por-correo.md)) |

Las apps comparten el kit por npm workspaces (`npm install` en la raíz, un solo lockfile) y cada una se despliega por separado, en su subdominio de `nutrinacion.com` (`admin.`, `educator.`, `player.`). Su `AGENTS.md` (con `CLAUDE.md` como symlink) tiene sus reglas, estructura y comandos, y manda dentro de su carpeta. Topología y flujo: [docs/architecture.md](../docs/architecture.md).

## Reglas particulares

### Dirección vigente: PlayHub

Para juegos, escenas, runner y su UI manda la raíz de PlayHub (`../`):

| Qué | Dónde |
|---|---|
| Contexto general y estado del diseño | `../AGENTS.md` |
| Producto, ejes, escenas y verbos | `../product/` |
| Estructura de un storyboard en Player y su librería | `../skills/playhub-storyboard-games/references/estructura.md` |
| UI Kit y player de referencia, base del runner | `packages/ui/` de este repositorio (`PLAYER-DESIGN.md`, `TOKENS.md`, `lab/`) |
| Guías de los storyboards | `../storyboards/<eje>/<storyboard>/` |

### Dominio, datos y UI

1. **La organización es la unidad de operación** ([decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md)); no hay comunidades ni «workspaces». Vocabulario: [docs/glossary.md](../docs/glossary.md).
2. **Código en inglés; UI localizada.** Admin y Educators son multidioma; la UI de Player es español; el contenido de juegos es multidioma y nunca va en el código.
3. **Supabase es compartido.** RLS es la barrera, no los filtros de UI. Migraciones y código mandan sobre las descripciones. Antes de tocar datos, esquema o RLS lee [docs/backend.md](../docs/backend.md): flujo local primero, acceso del agente por MCP de solo lectura y qué requiere autorización.
4. **El runner de Player no usa Supabase ni sesión**; la gestión de Player sí, solo para que entre el superadmin ([decisión 005](../docs/decisions/005-base-nueva-y-acceso-educador.md)). La gestión de Player registra el catálogo desde el JSON de cada storyboard y lo publica (estado, países y organización); Admin/Platform escribe la guía (decisiones [006](../docs/decisions/006-modelo-y-catalogo-desde-player.md) y [007](../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)). El contenido del juego vive en los JSON, nunca en la base. **Las apps incrustan el runner en un iframe** con el contrato de [docs/runner.md](../docs/runner.md) ([decisión 004](../docs/decisions/004-runner-incrustado.md)): la URL dice qué cargar, la app le da la guía (`iniciar`) y el runner cuenta lo que pasa. Un cambio del contrato es aditivo.
5. **Sin enlaces de vuelta encima del título** («← Storyboards»): se vuelve con la navegación de la app o el botón atrás del sistema (`packages/ui/DESIGN.md`, «Navegación»). `check-ui.mjs` los rechaza.
6. **UI:** todo sale de `@playhub/ui` ([decisión 001](../docs/decisions/001-ui-kit-compartido.md)): lima como acción principal, una sola forma (rectángulos redondeados) y dos densidades que solo cambian medidas: `compact` para la gestión y `touch` para el runner y Educators. Ningún color suelto ni lenguaje visual nuevo sin decisión de producto.
7. Preserva cambios ajenos del worktree; no borres locks, datos o artefactos sin resolver su origen.

### Hallazgos y cierre

- Un warning, una discrepancia o una prueba ausente fuera de alcance se registra con evidencia (en la tarea o en una de deuda), no se arregla en silencio. Un `verify.sh` verde con avisos relevantes se reporta como “verde con hallazgos”.
- Solo Luis marca una tarea como `finalizada`. Commits, push, deploys, migraciones y mutaciones cloud requieren su autorización explícita.

## Dónde encontrar contexto

- Documentación y mapa por área: [../docs/README.md](../docs/README.md).
- Skills y cuándo usarlas: [../skills/README.md](../skills/README.md).
- Tareas: [../tasks/README.md](../tasks/README.md). Decisiones: [../docs/decisions/README.md](../docs/decisions/README.md).

## Desarrollo y verificación

Entrada: `./scripts/verify.sh`, desde la raíz. Estado: configurada, con cobertura parcial.

| Comprobación | Cobertura |
|---|---|
| `node scripts/check-context.mjs` (dentro de `verify.sh`) | Archivos de contexto, symlinks `CLAUDE.md` y enlaces locales de Markdown |
| `node scripts/check-ui.mjs` (dentro de `verify.sh`) | Las vistas de las tres apps no escriben pasos de paleta, hex, sombras, anillos, tamaños sueltos, SVG en línea ni enlaces de vuelta (excepción: comentario `ui-allow` con motivo) |
| Admin, Player y Educators: `typecheck`, Vitest y build (dentro de `verify.sh`) | Tipos (incluye los `Ui*` del kit y, en Player, `content/`), tests y build de producción |
| Laboratorio del kit: `npm run lab:build --workspace @playhub/ui` (aparte) | Compila la lámina y el player de prototipo |
| Supabase local: `supabase test db` (dentro de `verify.sh` si Supabase local está levantado; si no, avisa «no ejecutado») | RLS por identidad, acceso de los educadores, registro del catálogo y jornadas (`supabase/tests/database/`) |
| `bash scripts/harness-check.sh` (aparte) | Estructura del arnés; no verifica software |

Requisitos: Node 22 y npm, dependencias instaladas con `npm install` en la raíz (`.npmrc` fija `legacy-peer-deps`) y un `.env.local` por app a partir de su `.env.example`. Los escenarios de navegador y datos se definen en cada tarea.

## Integración del agente

- **Claude Code** (app de escritorio): carga `CLAUDE.md`, symlink a `AGENTS.md`, en la raíz y en cada app, y también `../CLAUDE.md` de PlayHub. Comprobado el 2026-10-14.
- Otras herramientas, como Codex, leen `AGENTS.md` por convención; no se ha comprobado en este proyecto.

## Decisiones pendientes

- **Despliegue:** con workspaces, cada app debe instalarse desde la raíz del monorepo; revisar la configuración de la plataforma antes del próximo despliegue.

### Riesgos activos

Heredados o detectados; cada uno pasa a una tarea cuando se aborde.

- **Lo que falta para operar la plataforma completa** ([tarea 010](../tasks/010-pendientes-plataforma.md)): invitaciones de colaborador sin enlace que copiar, grupos de educadores sin gestión, la guía fuera del alcance del educador, la app del hogar por crear y el despliegue sin decidir, entre otros.
- **Catálogo sin QA de punta a punta:** registrar desde Player → escribir la guía en Admin → publicar → aparecer en los storyboards de la organización → crear un workshop desde el asistente. Probados por separado el registro, la edición y el wizard.
- **Base sin proyecto en la nube** (tarea 006): Admin, Player y Educators funcionan contra Supabase local. Al crear el proyecto hace falta pg_cron (`0009`). El proyecto anterior de la nube tiene tablas abiertas a cualquier sesión (marcarse superadmin): es de prueba y se abandona.
- **Decisiones de color por confirmar con Luis** (tarea 004): licencia suspendida neutra o coral, «titular» en cielo, «Sin administradores» en sol, cifras de Platform en neutro y «Usar en taller» neutro en el catálogo.
- **Deuda de producto en Admin** (tarea 008): textos fijos en español en vistas antiguas, el buscador ⌘K solo visual y el cierre del menú de usuario.
- **Runner incrustado sin probar en iPad ni Android** (tarea 009): audio sin toque extra, almacenamiento del iframe y sin conexión.
- **Cobertura:** RLS y funciones de la base con pgTAP en local (`supabase/tests/`); sin E2E: el runner, Educators y los flujos entre apps se verifican en el navegador.

## Mantenimiento del contexto

Estados admitidos: `pendiente`, `parcial`, `listo`. `Listo` significa suficiente para el alcance actual, no producto terminado. Distingue hechos observados, decisiones aceptadas y propuestas cuando puedan confundirse. El avance de tareas se mantiene en `tasks/`, no en este archivo.
