# Nutrinación StoryPlay

Plataforma de talleres educativos con cuatro **tipos** de storyboard: alimentación,
cuidado personal, actividad física y salud emocional. Una startup la ofrece a
comunidades (centros educativos, empresas, fundaciones) cuyos educadores imparten los
talleres frente a su audiencia — cada storyboard declara la suya (KIDS,
PREADOLESCENTES, ADOLESCENTES, ADULTOS).

Tres apps, backend compartido en Supabase:

| App | Carpeta | Stack | Rol |
|-----|---------|-------|-----|
| Admin | `apps/admin` | Nuxt + Tailwind | Comunidades gestionan equipos y programan talleres |
| Educators (StoryPlay) | `apps/educators` | Flutter (PWA + tablets) | Educadores ejecutan talleres en el aula |
| Studio | `apps/studio` | Nuxt | Crear y servir los juegos HTML de las escenas |

## Vocabulario

- **Comunidad** — la organización que usa la plataforma. Es el tenancy.
- **Storyboard** — plantilla de contenido: una secuencia de escenas.
- **Escena** — unidad de un storyboard: parte de lectura + juego HTML + guía pedagógica.
- **Taller** — instancia programada de un storyboard (fecha, lugar, educador).
- **Juego** — el HTML interactivo de una escena. Se crea en Studio, se sirve a Educators por webview.


## Reglas duras

1. **Comunidad** es el concepto de tenancy de la plataforma, nunca "workspace" (`comunidades`, `comunidad_id`).
2. **Idiomas** — dos ejes distintos: la **UI de las apps** (admin/educators multi-idioma
   desde español; UI de studio solo español) y el **contenido de los juegos** de studio,
   que SÍ es multi-idioma (texto y voz dentro de las escenas y del runner). Nunca hardcodear
   texto de juego: patrón de traducción en `docs/storyboards.md` (Traducciones).
3. **Código en inglés, UI en español.** (Nombres de tabla: ver `docs/architecture.md`.)
4. **Supabase** — backend compartido; RLS aísla por comunidad; validar en boundaries.
5. **Juegos HTML** — Educators los consume por webview.

Reglas de juego/escenas de StoryPlay: `docs/game-rules.md`.

## Contexto Obsidian

La carpeta del proyecto en Obsidian se monta como `obsidian/` (symlink al vault del proyecto).
Úsala como la fuente de verdad del proyecto para contexto, progreso y soporte documental.

### Cómo usar cada ruta

1. `obsidian/Ficha.md` — visión general y reglas operativas.
   - Leer primero para entender qué es el proyecto, su alcance, stack y decisiones estables.
   - Actualizar cuando cambie la dirección, el alcance o los enlaces de referencia.

2. `obsidian/Actividad.md` — registro cronológico de actividad.
   - Leer para saber el estado reciente, las últimas decisiones y qué cambió.
   - Añadir entradas después de trabajo relevante, decisiones, migraciones o cambios de contexto.

3. `obsidian/Tareas/` — trabajo ejecutable. Vive dentro del vault del proyecto.
   - Cada tarea es un `.md` autocontenido, con el frontmatter del vault
     (`proyecto: nutrinacion`, `estado`, etc.) y el cuerpo en cuatro secciones
     (`## Spec`, `## Plan`, `## Tareas`, `## Log`).
   - Antes de arrancar o tomar notas: leer `Ficha.md`, escanear `Actividad.md`
     y revisar `Notas/` y `Docs/` para entender decisiones vigentes del proyecto.

4. `obsidian/Notas/` — notas de trabajo y contexto liviano.
   - Usarlo para investigación, hallazgos rápidos, recordatorios, edge cases o notas demasiado pequeñas para un documento completo.
   - Preferir notas cuando el contexto sirve pero todavía no merece entrar a `Ficha.md`.

5. `obsidian/Docs/` — documentos de soporte más largos.
   - Usarlo para specs, referencias, decisiones, manuales o contexto profundo que se lea solo cuando haga falta.
   - Preferir docs cuando el material es grande y conviene separarlo del log de actividad.

### Notas globales del Sistema de Trabajo

Usar la memoria/actividad global solo cuando el trabajo cruza varios proyectos o necesita estado transversal:

- `/Users/luis/Library/Mobile Documents/com~apple~CloudDocs/Obsidian/Eslui/Proyectos/Sistema de Trabajo/Memoria.md`
- `/Users/luis/Library/Mobile Documents/com~apple~CloudDocs/Obsidian/Eslui/Proyectos/Sistema de Trabajo/Actividad.md`

## Protocolo de inicio de sesión

Al iniciar cualquier sesión de Claude Code en este repo:

1. Confirmar la raíz del repo con `pwd`.
2. Correr `git status --short` y conservar el estado inicial en contexto.
3. Confirmar que `obsidian/` existe y apunta al vault del proyecto.
4. Leer `obsidian/Ficha.md` y `obsidian/Actividad.md` antes de implementar.
5. Si se trabaja sobre una tarea, leer el archivo correspondiente en `obsidian/Tareas/`.
6. Leer solo las notas/docs relevantes en `obsidian/Notas/`, `obsidian/Docs/` y `docs/` según el área tocada.
7. No iniciar implementación no trivial hasta que la tarea tenga `## Plan` con `Leer:` / `Tocar:` o una lista explícita equivalente de archivos a leer y tocar.

## Documentación (leer solo lo que toques)

- Arquitectura y convenciones: `docs/architecture.md` · Glosario: `docs/glossary.md`
- App: `docs/apps/<app>.md`
- Storyboards/escenas: `docs/storyboards.md` · Juegos: `docs/games.md` · Reglas de juego: `docs/game-rules.md`
- Backend/datos: `docs/backend.md` · Diseño: `docs/design.md`

## Tareas

Las tareas viven dentro del vault del proyecto, en `obsidian/Tareas/`
(el symlink `obsidian/` apunta a `Eslui/Proyectos/Nutrinacion Workshops`).
Un `.md` por tarea. Frontmatter: `proyecto: nutrinacion` + `estado:`.
Nombre: `NNN-<app>-<slug>` — número de secuencia de **3 dígitos** (`001`…)
primero, para orden global de progreso, luego prefijo de app (`admin-`,
`educators-`, `studio-`, `shared-`). El número se asigna al crear (siguiente
correlativo), es estable y no se reordena ni reutiliza. Ej.:
`003-studio-storyboard-detalle-editable.md`.

El agente **vive dentro del vault del proyecto**: antes de crear, arrancar o
cerrar una tarea, leer `obsidian/Ficha.md` y `obsidian/Actividad.md`, y
revisar lo relevante en `obsidian/Notas/` y `obsidian/Docs/`.

Cuatro secciones en el cuerpo:

- `## Spec` — qué y por qué + criterios de aceptación verificables. Estable, chico.
- `## Plan` — cómo + manifiesto (`Leer:` rutas a entender / `Tocar:` rutas a crear o modificar).
  Acá pasa el descubrimiento de archivos, una sola vez.
- `## Tareas` — pasos atómicos y ordenados, cada uno con su condición de listo.
- `## Log` — append-only con timestamp, capado a las últimas ~3 entradas.

Ciclo:

1. **Crear** — conversar, escribir `## Spec`; con luz verde, `## Plan` + `## Tareas`; estado `pendiente`.
2. **Arrancar** — estado `haciendo`. Trivial (typo, rename) → hacerlo directo. Tarea real
   → implementar el `## Plan` en la sesión actual, sin re-explorar el código (el manifiesto
   ya lista qué leer y qué tocar). Tareas grandes o riesgosas se pueden partir en pasos
   discretos verificables.
3. **Cerrar** — pegar la salida real de `verify.sh` en `## Log`, estado `revision`, avisar
   al usuario que está lista para QA manual.

Estados: `backlog` → `pendiente` → `haciendo` → `revision` → `finalizada`.
`finalizada` la marca solo el usuario, nunca el agente.

## Handoff Git — obligatorio

Antes de decir que una tarea está lista para revisión:

1. Correr `./scripts/verify.sh` desde la raíz del repo.
2. Correr `git status --short` y revisar el diff.
3. Commitear todos los cambios relevantes de código/docs usando la convención de commits del proyecto.
4. Agregar al `## Log` de la tarea:
   - timestamp
   - salida real de `verify.sh`
   - `git status --short` final
   - hash del commit
5. Pasar la tarea a `revision` solo después de registrar la verificación y el commit.
6. Nunca marcar `finalizada`; eso lo hace únicamente el usuario tras QA manual.
7. Si no se puede commitear, no decir que está lista. Dejar la tarea en `haciendo` o claramente bloqueada y documentar el motivo en `## Log`.

## Verificación y tests — obligatorio antes de cerrar

**Toda implementación debe correr `./scripts/verify.sh` y pegar la salida real en
`## Log` antes de pasar la tarea a `revision`.** Si el script falla, la tarea NO está
terminada: arreglar y volver a correr.

Reglas duras:

- **No se termina una tarea sin `verify.sh` verde.** Esto incluye cambios de cualquier
  tamaño: fix, refactor, feature, ajuste de UI. Sin excepción.
- **Tests para lógica nueva.** Cuando la tarea introduce lógica de negocio nueva
  (servicio, modelo, cálculo, validación, endpoint sensible, primitive de juego) agregar
  el test correspondiente en la app afectada (vitest para `admin`/`studio`, flutter test
  para `educators`). Una prueba focal del caso feliz + los casos borde obvios alcanza;
  el objetivo es regresión, no cobertura total.
- **Antes de marcar `revision`:** correr `./scripts/verify.sh` desde la raíz, copiar la
  **salida completa** (incluso si es verde corta) en `## Log` con timestamp, y avisar al
  usuario que está lista para QA manual.
- **El agente nunca marca `finalizada`.** Solo el usuario, tras revisar y probar en vivo.
- **Si `verify.sh` falla:** arreglar y reintentar. Si tras varios reintentos el problema
  es de entorno (no del cambio), documentar la salida del fallo en `## Log` y avisar
  al usuario.

Para este proyecto `./scripts/verify.sh` corre `typecheck` + `build` por cada app
Nuxt habilitada y `flutter analyze` + `flutter test` para `educators` cuando esté
activo. Asegurarse de que el cambio no rompe ningún test existente antes de pegar la
salida.
