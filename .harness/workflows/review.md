# Revisar un cambio

**Entrada:** petición de revisión, alcance o tarea y cambios identificables.
**Salida:** conclusión respaldada, hallazgos concretos y limitaciones de lo revisado.

## Preparar la revisión

1. Identifica qué se revisa: archivos, diff de trabajo, commits, rama o entrega parcial. Si la base es ambigua, resuélvela antes de atribuir cambios.
2. Lee los criterios y las reglas del dominio. Carga solo las skills pertinentes.
3. Incluye archivos nuevos y contexto suficiente alrededor de los cambios; una lista de nombres no basta para revisar comportamiento.

## Comprobar

- **Comportamiento:** criterios cumplidos, casos límite y regresiones.
- **Pruebas:** assertions útiles, escenarios pertinentes y resultados reales.
- **Límites:** permisos, integridad de datos y contratos entre componentes cuando apliquen.
- **Mantenimiento:** coherencia con las convenciones, claridad y documentación afectada.

Ejecuta las comprobaciones relevantes cuando estén disponibles y dentro de la autorización existente. No ejecutes migraciones, deploys o pruebas que muten servicios compartidos como efecto implícito de revisar. Si solo inspeccionaste código, dilo; no inventes una ejecución.

Las comprobaciones se eligen según el cambio. No se requiere un agente distinto para cada aspecto ni repetir toda una suite sin razón. Una revisión independiente debe realizarla otra sesión o agente; identifica cuándo se trata de una autorrevisión.

## Hallazgos

Para cada problema accionable, registra ubicación, condición que lo provoca, impacto y comportamiento esperado. Prioriza lo que afecta corrección, datos y criterios; evita convertir preferencias de estilo en bloqueos.

Distingue:

- **Problema comprobado:** evidencia de un incumplimiento o regresión.
- **Pregunta pendiente:** falta información necesaria para concluir.
- **Mejora opcional:** aporta valor, pero no invalida el alcance actual.

No inventes hallazgos para llenar una lista. No presentes un resumen del implementador como verificación propia.

## Resultado y continuidad

Entrega una conclusión como `sin hallazgos bloqueantes`, `requiere correcciones` o `revisión incompleta`, con su cobertura y límites. La primera no implica aceptación humana ni que todo el producto esté verificado.

Si la revisión forma parte del flujo autorizado de una tarea, añade una entrada breve a su log o sección de revisión. Si se pidió solo un informe sin cambios, responde en la conversación. Una petición de revisar no autoriza corregir código; si también se solicitaron correcciones, utiliza [implement.md](implement.md) para resolverlas y vuelve a comprobar lo afectado.
