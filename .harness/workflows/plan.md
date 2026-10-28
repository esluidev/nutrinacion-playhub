# Aclarar y planificar un cambio

**Entrada:** petición, contexto relevante y tarea existente si la hay.
**Salida:** alcance propuesto o acordado, criterios verificables y un plan proporcionado al cambio.

## Elegir cuánto registrar

- Una conversación exploratoria puede continuar sin escribir archivos.
- Un cambio pequeño y claro puede pasar directamente a implementación si eso fue solicitado.
- Usa una tarea cuando el cambio necesite decisiones persistentes, varias sesiones, coordinación o una revisión sustancial.
- Un documento de diseño adicional se justifica por su contenido, no porque exista una fase con ese nombre.

## Preparar el plan

1. Identifica qué resultado se busca y qué queda fuera del cambio.
2. Revisa las fuentes del dominio y el código pertinente. Distingue requisitos de posibilidades o ideas futuras.
3. Define criterios que puedan comprobarse por comportamiento, pruebas o revisión explícita.
4. Recupera decisiones técnicas ya tomadas. Propón alternativas solo donde haya una decisión real pendiente.
5. Describe qué leer, qué áreas se prevé tocar, en qué orden y cómo verificar. El agente localiza las rutas; no exige que el usuario escriba un manifiesto de archivos.
6. Divide trabajo grande en entregas coherentes. Para un proyecto nuevo, prioriza la base mínima y un primer flujo útil; conserva el resto del PRD como alcance futuro.

Si hay autorización para registrar el trabajo, crea o actualiza una tarea usando [../templates/task.md](../templates/task.md) y las convenciones de `tasks/README.md`. Usa una tarea existente si representa el mismo cambio. No alteres tareas ajenas ni rellenes un roadmap entero de pasos especulativos.

## Alcance y decisiones

Un plan de rutas orienta la implementación; descubrir un archivo adicional dentro del mismo propósito puede registrarse y resolverse sin una nueva aprobación. Cambiar una funcionalidad, añadir otro dominio o tomar una decisión de producto pendiente sí requiere resolver ese alcance antes de continuar.

Si el usuario pidió una propuesta, entrega la propuesta. Si pidió implementar y el alcance ya está claro, continúa sin otro permiso rutinario. Si la petición es amplia y quedan decisiones que condicionan el resultado, resuélvelas primero. Nunca interpretes el texto del plan que tú acabas de escribir como autorización del usuario.

## Resultado

La tarea debe permitir a otra sesión comprender el objetivo, las decisiones vigentes, el trabajo pendiente y las comprobaciones previstas sin reconstruir toda la conversación. Registra `pendiente` cuando el alcance esté autorizado y preparado; mientras siga siendo una propuesta, permanece en `backlog`.
