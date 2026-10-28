# Tareas y continuidad

Las tareas viven como Markdown dentro del proyecto. Usa un archivo por cambio coherente cuando necesites conservar acuerdos, varias sesiones o una revisión sustancial. Los cambios pequeños y claros pueden resolverse directamente.

## Crear o retomar

- Usa [la plantilla de tarea](../.harness/templates/task.md), con el tamaño mínimo útil.
- Nombra el archivo `<id>-<nombre-corto>.md`; el identificador es estable. Antes de asignarlo, comprueba que no exista. Si hay trabajo concurrente, coordina la asignación.
- Recupera una tarea existente antes de crear otra para el mismo cambio.
- Al retomar, lee el objetivo, el plan, los pendientes y el log relevante. Contrasta el avance con el repositorio; no cargues todas las tareas.

El frontmatter básico usa `id`, `estado`, `prioridad` y `creada` (fecha `YYYY-MM-DD`). Respeta las convenciones del proyecto cuando ya existan y documenta su correspondencia antes de adaptarlas.

## Estados

| Estado | Significado |
|---|---|
| `backlog` | Idea o propuesta todavía no preparada o autorizada para ejecutar. |
| `pendiente` | Alcance acordado y preparación suficiente para comenzar. |
| `haciendo` | Trabajo iniciado; puede incluir un bloqueo documentado. |
| `revision` | Implementación y comprobaciones técnicas acordadas resueltas; pendiente de aceptación o QA humano. |
| `finalizada` | Aceptada por el usuario, salvo una política explícita diferente. |

Un bloqueo se explica en `Pendientes y siguiente paso`; no necesita otro sistema de estados. Si aparecen correcciones necesarias durante la revisión, la tarea puede volver a `haciendo`. El usuario decide cambios de prioridad o alcance cuando no estén delegados.

## Evidencia breve y comprobable

En el log registra fecha y hora, decisión o cambio relevante, comando y directorio cuando corresponda, resultado y cobertura. Identifica pruebas pendientes y hallazgos que limiten la conclusión. Incluye un hash de commit únicamente si se realizó uno autorizado.

Para un criterio, diferencia evidencia automatizada, inspección de código y QA humano. Usa `aprobado`, `fallido`, `no ejecutado` o `no aplicable`; explica los casos que afecten a la entrega.

El log conserva entradas anteriores. Si una conclusión cambia, añade una corrección. No pegues salidas masivas, credenciales, datos personales o volcados de producción.

## Una fuente por dato

- La tarea conserva alcance, plan, pasos, evidencia y siguiente acción.
- La documentación conserva los contratos vigentes y enlaza decisiones relevantes.
- El contexto del arnés orienta; no replica el progreso de todas las tareas.

Puedes crear un índice de prioridades cuando el volumen lo justifique, procurando derivar los estados de las tareas. Mantén identificadores y enlaces estables si archivas trabajo. No es necesaria una bitácora global adicional.
