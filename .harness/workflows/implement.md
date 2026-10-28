# Implementar un cambio

**Entrada:** petición ejecutable o tarea con alcance acordado.
**Salida:** cambios acotados, comprobaciones reales y continuidad registrada.

## Antes de editar

1. Confirma el destino y observa el estado inicial de archivos y Git cuando esté disponible.
2. Lee la tarea, si existe, y las instrucciones de las rutas afectadas.
3. Recupera el contexto y las skills pertinentes desde sus índices. Comprueba el código antes de asumir que una descripción sigue vigente.
4. Si falta una decisión que cambia el resultado, vuelve a [plan.md](plan.md) únicamente para resolver ese punto.

Una tarea pasa a `haciendo` cuando empieza el trabajo. Una petición pequeña puede ejecutarse sin un archivo de tarea.

## Implementar y comprobar

- Mantén los cambios dentro del objetivo. Reutiliza las convenciones y componentes existentes.
- Para un proyecto nuevo, utiliza el generador apropiado del framework cuando corresponda. Coordina su creación con los archivos del arnés para preservar ambos; no asumas que acepta un directorio previamente poblado.
- Añade pruebas de comportamiento para lógica nueva, regresiones y límites relevantes. Si el proyecto exige TDD, conserva evidencia del fallo inicial y la corrección; no declares ese ciclo sin haberlo ejecutado.
- Ejecuta comprobaciones focales durante el cambio y la verificación aplicable a las aplicaciones afectadas antes de entregar.
- Si un verificador no está configurado, usa comandos reales disponibles y registra su alcance. No sustituyas la validación por un `echo` de éxito ni presentes su ausencia como resultado verde.
- Si un fallo es previo o ambiental, respalda esa clasificación con evidencia disponible. Si no puedes distinguir su origen, decláralo.

Si aparecen problemas adyacentes, resuelve los que invaliden el cambio dentro del alcance autorizado. Para los demás, informa o registra un pendiente breve cuando sea útil; no amplíes silenciosamente la implementación.

## Guardar continuidad

Actualiza el checklist conforme se comprueben los pasos. En cambios de varias sesiones, deja el último punto alcanzado, decisiones tomadas, verificaciones ejecutadas y siguiente paso. Conserva las entradas previas del log; corrige una conclusión errónea con una nueva entrada.

Actualiza documentación y mapa de contexto solo donde el cambio los haya afectado. Las reglas vigentes viven en su documento y se enlazan desde la tarea.

## Entregar

1. Revisa el diff o los archivos modificados, incluidos archivos nuevos, y conserva cambios ajenos.
2. Contrasta cada criterio con la evidencia disponible.
3. Registra comandos, resultado, cobertura y pendientes. No pegues logs masivos ni secretos.
4. Deja la tarea en `revision` cuando el alcance esté implementado y las verificaciones técnicas acordadas estén resueltas; identifica el QA humano pendiente. Si falta una comprobación técnica necesaria, conserva `haciendo` y explica el bloqueo.
5. Resume resultado, evidencia y límites. Un commit no es requisito universal para entregar a revisión. Si fue autorizado y realizado, registra su hash; si no, describe el estado sin commit.

El agente no cambia `revision` a `finalizada` salvo política explícita del usuario. Una autorización para implementar no implica publicar, hacer push o desplegar.
