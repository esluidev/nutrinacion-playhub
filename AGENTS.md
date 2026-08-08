# Nutrinación StoryPlay — instrucciones para agentes

Monorepo con tres aplicaciones independientes y un backend Supabase compartido. La prioridad es
leer contexto de forma progresiva: tarea y app primero; historia y código global solo si hacen falta.

## Autoridad por tipo de información

| Información | Fuente |
|---|---|
| Orientación del repositorio | `README.md` |
| Reglas de una app | `apps/<app>/AGENTS.md` |
| Arquitectura y dominio estables | `docs/` |
| Esquema y RLS ejecutables | `supabase/migrations/` |
| Estado vigente | `obsidian/Ficha.md` |
| Alcance, plan y evidencia | tarea en `obsidian/Tareas/` |
| Historia | `obsidian/Actividad.md` |

Si dos documentos discrepan, código/migraciones mandan sobre descripciones técnicas; la Ficha y
la tarea activa mandan sobre resúmenes de estado. Documenta el drift, no lo resuelvas por intuición.

## Entrada con una tarea concreta

1. Confirma raíz con `pwd` y conserva `git status --short` inicial.
2. Confirma que `obsidian/` apunta al vault de Nutrinación.
3. Lee `obsidian/Ficha.md`, el encabezado reciente de `obsidian/Actividad.md` y la tarea.
4. Identifica las apps/dominios declarados en la tarea y lee sus `AGENTS.md`.
5. Lee solo las rutas de `Plan > Leer`; completa ese manifiesto antes de implementar si falta.
6. Revisa código y tests únicamente del dominio acotado.

## Entrada para análisis general

1. Lee `README.md`, `obsidian/Ficha.md` y `docs/README.md`.
2. Identifica una o dos apps candidatas y lee sus README/AGENTS.
3. Usa búsqueda focal (`rg`, rutas, imports, migraciones) para acotar el problema.
4. Crea o actualiza una tarea antes de una implementación no trivial.

No cargues de entrada todos los storyboards, la bitácora archivada, todas las migraciones ni las
tres aplicaciones.

## Reglas duras transversales

1. **Comunidad es el tenancy**, nunca “workspace” (`comunidades`, `comunidad_id`).
2. **Código en inglés; UI localizada.** Admin y Educators son multidioma. Studio UI es español;
   el contenido de juegos es multidioma. No hardcodear texto de juego.
3. **Supabase es compartido.** Toda lectura/escritura de cliente debe respetar boundaries y RLS.
   Filtrar en UI no es seguridad. No aplicar migraciones ni mutar cloud sin autorización explícita.
4. **Studio no administra Supabase.** Lee estado y produce metadata; Admin/Platform escribe el
   catálogo. `/play/**` es público y no puede quedar detrás del login.
5. **Juegos/escenas:** antes de crearlos o modificarlos, leer `docs/game-rules.md`, el contrato del
   tipo en `docs/storyboards.md` y las reglas de diseño de juegos en `docs/design.md`.
6. **UI:** reutilizar `Ui*`, tokens y patrones existentes. No introducir otro lenguaje visual sin
   una decisión de producto.
7. Preservar cambios ajenos del worktree. No borrar locks, archivos, datos o artefactos sin resolver
   primero su origen y alcance.

## Acceso vivo a Supabase

Al iniciar una tarea que toque esquema, migraciones, RLS, Auth, persistencia o QA de datos, revisa
las herramientas disponibles. Si existe el MCP `supabase-workshops` —o una capacidad Supabase
equivalente configurada para este proyecto— úsalo para introspección y verificación remota focal.

- El perfil normal debe ser project-scoped, `read_only=true` y limitado a `features=database`.
- No cargues el esquema completo: consulta solo las tablas, políticas, funciones y filas del dominio.
- Las migraciones versionadas son la definición deseada; MCP confirma el estado realmente aplicado.
- Registra en el Log si MCP estaba disponible, proyecto/branch/entorno consultado e invariantes
  comprobadas. No registres tokens, connection strings, PII ni volcados de filas.
- Si MCP no está disponible, no bloquees una tarea que pueda validarse con migraciones y Supabase
  local. Declara el hueco si era necesaria una comprobación remota.
- MCP read-only nunca autoriza una migración ni una mutación cloud. Esas acciones siguen requiriendo
  aprobación explícita.

Flujo y fallback detallados: `docs/operations/database-access.md`.

## Hallazgos adyacentes

Durante análisis, implementación y verificación, no ignores warnings, drift, archivos extraños,
dependencias implícitas ni pruebas ausentes aunque no bloqueen la tarea actual.

- Si bloquea o invalida el resultado, incorpóralo a la tarea activa y resuélvelo antes del handoff.
- Si está fuera de alcance, no lo arregles silenciosamente: regístralo en una tarea de deuda con
  evidencia, impacto, causa probable y validación propuesta.
- Un `verify.sh` verde con warnings relevantes se reporta como “verde con hallazgos”, no “limpio”.
- Evita listas eternas: cierra el hallazgo cuando se corrige o descártalo con una razón verificable.
- Ficha muestra solo riesgos activos prioritarios; el detalle vive en la tarea correspondiente.

## Aplicaciones

| App | Instrucciones | Verificación focal |
|---|---|---|
| Admin | `apps/admin/AGENTS.md` | `npm run typecheck && npm test && npm run build` |
| Studio | `apps/studio/AGENTS.md` | `npm run typecheck && npm test && npm run build` |
| Educators | `apps/educators/AGENTS.md` | `flutter analyze && flutter test` |

## Tareas y cierre

Estados: `backlog → pendiente → haciendo → revision → finalizada`. Solo Luis marca
`finalizada` tras QA.

Antes de presentar trabajo como listo:

1. Ejecuta pruebas focales y `./scripts/verify.sh` cuando corresponda.
2. Revisa `git status --short`, el diff y que no se mezclen cambios ajenos.
3. Resume la salida real en el Log de la tarea; no pegues TestDox masivo si un resumen exacto basta.
4. Un commit, push, deploy, migración o mutación cloud requiere autorización explícita.
5. Sin commit autorizado, la tarea permanece `haciendo`; no inventes un handoff terminado.

## Obsidian

- Ficha: tablero compacto del presente.
- Tarea: spec, plan, checklist y evidencia.
- Actividad: bitácora cronológica, no dashboard.
- Notas: hallazgos de trabajo.
- Docs del vault: soporte largo no duplicado en el repo.

La memoria global solo guarda punteros y decisiones transversales.
