# Contrato de trabajo

## Intención y alcance

- Conversar, evaluar o pedir una propuesta permite investigar y explicar; no inicia una implementación.
- Una petición concreta de implementación autoriza el trabajo necesario dentro de su alcance. No pidas confirmación por cada paso rutinario ni repitas una autorización vigente.
- Si falta una decisión que cambia el producto o el alcance, presenta el punto concreto antes de ejecutar lo que dependa de ella. Los supuestos reversibles y menores pueden explicarse y seguir adelante.
- Un plan escrito por el agente no equivale a un plan aceptado por el usuario.
- El usuario puede corregir o limitar el trabajo en cualquier momento. Las instrucciones aplicables de la herramienta y del proyecto siguen vigentes.

## Contexto suficiente

Lee la tarea y las fuentes del área antes de ampliar búsquedas. Usa rutas, símbolos e imports para localizar dependencias. Evita recorrer dependencias, archivos generados, históricos y material ajeno al alcance por defecto; consulta contenido concreto de esas rutas cuando sea necesario, por ejemplo documentación de la versión instalada del framework.

| Información | Fuente principal |
|---|---|
| Objetivo, restricciones y decisiones particulares | `project.md` y referencias del proyecto |
| Reglas y contratos vigentes | Documentación del dominio; decisiones aceptadas |
| Lo implementado | Código, manifiestos, pruebas y configuraciones pertinentes |
| Lo realmente verificado | Evidencia ejecutada sobre el estado y entorno identificados |
| Alcance y continuidad del cambio | Petición actual y tarea correspondiente |

Ante una discrepancia, distingue el comportamiento observado de la intención documentada. No cambies silenciosamente el requisito para hacerlo coincidir con el código. Una nota histórica puede estar desactualizada.

## Elegir el procedimiento

| Necesidad | Leer |
|---|---|
| Integrar la plantilla en un proyecto | [workflows/integrate.md](workflows/integrate.md) |
| Definir o actualizar contexto | [workflows/context.md](workflows/context.md) |
| Aclarar o planificar un cambio que necesita continuidad | [workflows/plan.md](workflows/plan.md) |
| Implementar una petición ejecutable o tarea acordada | [workflows/implement.md](workflows/implement.md) |
| Revisar trabajo | [workflows/review.md](workflows/review.md) |
| Actualizar el arnés desde otra versión | [workflows/update.md](workflows/update.md) |

Un cambio pequeño y claro puede implementarse y comprobarse sin crear una tarea. Una discusión puede quedarse en la conversación. Registra un archivo cuando haga falta conservar acuerdos, coordinar trabajo o retomar después.

## Trabajar y verificar

- Confirma el directorio objetivo. Si hay Git, observa el estado inicial y preserva cambios ajenos. La ausencia de Git no impide conversar, integrar la estructura o preparar contexto.
- Sigue las convenciones del framework y del proyecto. El arnés no reorganiza aplicaciones ni elige arquitectura por defecto.
- Ejecuta primero comprobaciones focales y después las aplicables al alcance. Añade pruebas de comportamiento cuando protejan lógica nueva o una regresión relevante. Usa TDD cuando se haya acordado o lo requiera el proyecto.
- Distingue `aprobado`, `fallido`, `no ejecutado` y `no aplicable`. Un comando que no corrió no cuenta como comprobación aprobada; un build no demuestra todos los criterios del producto.
- No elimines pruebas ni reduzcas criterios para obtener un resultado verde. Si un fallo persiste, cambia la hipótesis o documenta el bloqueo; repetir lo mismo sin nueva evidencia no es progreso.
- Una revisión sin petición de corrección produce hallazgos, no cambios de código.

## Herramientas y efectos externos

Las capacidades se comprueban en la sesión real: no inventes acceso a skills, modelos, bases de datos o servicios. Consulta fuentes externas solo cuando la tarea lo requiera y con el ámbito adecuado.

No publiques, hagas commits o push, despliegues, apliques migraciones ni modifiques datos externos sin autorización que cubra esa operación. Una autorización explícita o política de automatización acordada puede reutilizarse dentro de su alcance; no se vuelve a pedir por rutina. El permiso para instalar o actualizar el arnés no autoriza esas operaciones.

## Modelos y continuidad

Usa un agente por defecto. La delegación es opcional según la petición, las reglas aplicables y las herramientas disponibles. Si se delega, entrega objetivo, límites, referencias y resultado esperado; mantén un único escritor en el mismo ámbito salvo coordinación explícita. No presentes una autorrevisión como revisión independiente.

Al retomar, lee la tarea y contrasta el avance con los archivos actuales. No repitas pasos terminados sin una razón concreta ni confíes en pruebas antiguas cuando cambió lo que cubrían.

Al entregar, resume resultado, verificaciones, límites y pendientes. Actualiza la tarea y la documentación afectada; conserva un solo lugar para cada dato. Solo el usuario acepta una tarea como `finalizada`, salvo que haya establecido explícitamente otra política.
