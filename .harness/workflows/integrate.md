# Integrar eslui-harness

**Entrada:** petición de integración, fuente de la plantilla y proyecto destino.
**Salida:** estructura integrada, entrada del agente identificada y versión registrada; contexto iniciado si la petición lo incluye.

## 1. Localizar y reconocer

- Confirma la fuente y el destino; no instales la plantilla sobre sí misma.
- Lee el README, changelog y versión de la fuente. Si viene de un repositorio remoto, identifica la versión o revisión utilizada; no necesitas publicar nada para integrarla.
- Revisa instrucciones aplicables, estructura y estado Git del destino, cuando exista.
- Busca la documentación, tareas, skills y verificaciones ya disponibles de forma focal. No leas toda la aplicación para copiar el arnés.
- Si ya existe `.harness/VERSION` de eslui-harness y se pide una versión diferente, sigue [update.md](update.md). Repetir una integración no debe duplicar bloques ni reemplazar contenido.

## 2. Integrar la estructura

| Material de la fuente | Acción en el destino |
|---|---|
| Bloque `eslui-harness:start/end` de `AGENTS.md` | Créalo si falta o intégralo una sola vez en el archivo existente. Conserva sus reglas y referencias. |
| `.harness/core.md`, `workflows/` y `templates/` | Incorpora los archivos ausentes; revisa diferencias si ya existen. |
| `.harness/project.md` | Usa la plantilla solo si falta. Si existe, conserva su información. |
| `docs/`, `skills/` y `tasks/` | Crea las rutas base y añade índices ausentes. Integra las convenciones en índices existentes; conserva todos sus documentos. |
| `scripts/harness-check.sh` | Incorpora el comprobador de estructura. Si esa ruta ya tiene otro propósito, acuerda una ubicación y ajusta sus referencias. |
| `scripts/verify.sh` | Conserva el existente. Si falta, instala el marcador de configuración pendiente. |
| `.harness/VERSION` | Regístralo al concluir las comprobaciones de integración. |
| `README.md` y `CHANGELOG.md` de la raíz | Son documentación de la fuente: no los copies sobre los del producto. |

La estructura base se conserva. Si ya existe información equivalente en otras rutas, enlázala desde los índices y registra la excepción; no muevas ni dupliques documentación para satisfacer una plantilla. Si las convenciones actuales de tareas difieren, integra su significado y documenta el acuerdo antes de renombrar estados o migrar archivos.

No edites la carpeta del framework, sus dependencias, scripts de aplicación o configuración de producción como efecto implícito de integrar instrucciones. Configurar una verificación real está dentro de la integración cuando los comandos existentes son claros; crear una suite o cambiar arquitectura requiere un alcance específico.

## 3. Conectar el agente

- Identifica cómo carga instrucciones la herramienta utilizada, con documentación o comportamiento disponible en el entorno.
- Si reconoce la entrada existente, reutilízala. Si necesita otro archivo, añade un adaptador que remita a `AGENTS.md` y conserva su contenido previo.
- No generes adaptadores para herramientas que el usuario no usa ni anuncies soporte que no comprobaste. Si falta confirmar la carga automática, deja ese punto pendiente y proporciona la ruta que debe leer el agente.

## 4. Completar lo necesario

Si se pidió definir contexto en la misma conversación, continúa con [context.md](context.md). Usa los materiales que el usuario haya señalado; una idea, un PRD, código o una combinación son entradas válidas.

Registra en `project.md` el origen de la plantilla y la revisión o versión fuente identificada. Se puede integrar la estructura con contexto parcial; no hagas preguntas de producto para una petición limitada a instalar archivos.

## 5. Comprobar y entregar

1. Revisa archivos añadidos y modificaciones de índices e instrucciones. Confirma que no se mezclaron cambios ajenos.
2. Comprueba los enlaces y comandos introducidos. Para el script base, usa `bash -n scripts/harness-check.sh scripts/verify.sh`; adapta esta comprobación si se conservó otro tipo de verificador.
3. Cuando el contenido esté integrado, escribe la versión fuente en `.harness/VERSION` y ejecuta `bash scripts/harness-check.sh`.
4. Si quedan errores estructurales, corrígelos. Si no es posible, conserva la versión previa; en una instalación nueva, deja sin registrar la versión y explica que la integración quedó incompleta.
5. Informa versión, archivos integrados, contexto pendiente y cobertura de verificación. La instalación no requiere commit, push ni publicación.

**Finaliza cuando:** la estructura y sus referencias están integradas, la versión refleja lo aplicado y las limitaciones están identificadas. No presentes una aplicación como verificada por haber instalado el arnés.
