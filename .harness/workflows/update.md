# Actualizar desde la plantilla

**Entrada:** petición de actualización y fuente o versión objetivo.
**Salida:** cambios del arnés integrados, información del proyecto conservada y versión aplicada registrada.

## Entender la actualización

1. Confirma el proyecto destino y lee su `.harness/VERSION`, contexto e instrucciones aplicables.
2. Identifica la fuente indicada por el usuario o registrada en `project.md`. Si no está disponible, pide una fuente concreta; no inventes un repositorio ni una versión.
3. Lee el `CHANGELOG.md` de la fuente y las entradas entre la versión instalada y la objetivo, en orden ascendente.
4. Consulta los archivos afectados de la versión objetivo. Las notas orientan la adaptación, pero no sustituyen el contenido real de la plantilla.

El usuario también puede explicar cambios directamente en la conversación. Si se aplican cambios todavía sin una versión publicada o identificable, conserva la versión instalada y registra brevemente la adaptación local; no inventes un número de release. Un downgrade no se infiere de una petición de actualizar.

Si falta la versión instalada, revisa el contenido y determina qué se puede incorporar. No atribuyas una versión anterior sin evidencia.

## Integrar conservando el proyecto

| Tipo de cambio | Tratamiento |
|---|---|
| Contrato, procedimientos o plantillas | Integra la mejora y conserva personalizaciones pertinentes. Usa la versión anterior como base si está disponible. |
| Nuevo campo de contexto | Añádelo solo cuando corresponda; recupera su valor de fuentes reales o déjalo pendiente. |
| Índices de documentación, skills o tareas | Integra la convención sin sustituir sus entradas y enlaces. |
| Ejemplos o texto sin completar del template | No reemplazan información real del proyecto. |
| Scripts de verificación | Conserva comandos y cobertura configurados; el marcador sin configurar nunca reemplaza un verificador real. |
| Adaptadores | Conserva reglas y configuración existentes; verifica que siguen apuntando a la entrada correcta. |
| Elementos retirados | Elimina únicamente material comprobado como propio del arnés y sin información particular; si hay dudas, conserva y señala el caso. |

Si una personalización y una regla nueva discrepan, integra lo compatible y presenta la decisión concreta restante. No resuelvas silenciosamente un conflicto de producto o permisos a favor de la plantilla.

No muevas tareas, renombres estados, sustituyas documentación ni reorganices el framework como efecto implícito de una actualización. No copies el README o changelog de la fuente sobre los del producto. La migración de información existente requiere que la petición o las decisiones acordadas cubran ese cambio.

## Comprobar y registrar

1. Revisa las modificaciones y referencias afectadas. Comprueba que el contexto, las tareas y las personalizaciones siguen presentes.
2. Ejecuta `bash scripts/harness-check.sh` y la validación adicional necesaria para scripts modificados. No ejecutes verificaciones costosas de software si el cambio documental no las requiere.
3. Si se aplicaron todos los cambios requeridos para esa versión, actualiza `.harness/VERSION`. Si solo se completó una parte, conserva la versión anterior e identifica lo pendiente en la entrega o tarea de actualización, si existe.
4. Resume versión anterior y nueva, cambios aplicados, adaptaciones y pendientes. No crees un segundo changelog obligatorio por proyecto.

Actualizar no autoriza commits, push, despliegues ni funcionalidades del producto. Repetir la misma actualización debe conservar el contenido y evitar bloques duplicados.
