# Estrategia de testing y QA

El objetivo es detectar regresiones con evidencia proporcional al riesgo. Ninguna capa sustituye a
las demás.

## Capas

### 1. Código determinista

- Admin: TypeScript + Vitest para reglas puras/composables desacoplados.
- Studio: TypeScript + Vitest para metadata, rutas públicas, runner y utilidades.
- Educators: `flutter analyze`, unit/widget tests.

Toda lógica de negocio nueva debe tener caso feliz y bordes relevantes.

### 2. Integración/build por app

- Nuxt: `typecheck` y build de producción.
- Flutter: compilación/plataforma cuando la tarea lo requiera.
- El verify raíz cubre Admin/Studio; no afirmar que cubre Educators.

### 3. Supabase y RLS

Migraciones, triggers y políticas se prueban primero en Supabase local con una matriz de identidades:
superadmin, admin, colaborador, ajeno y anon cuando aplique. Una branch cloud o proyecto dev agrega
la segunda puerta solo cuando el flujo necesita servicios gestionados o E2E más fiel.

En cloud, la validación normal es read-only:

1. snapshot mínimo antes;
2. acción autorizada en UI;
3. snapshot después;
4. comparar filas, relaciones, estado y aislamiento;
5. comprobar idempotencia/error cuando sea importante.

La existencia de una migración en Git no demuestra que esté aplicada.

### 4. Navegador/agente

Los flujos críticos viven como escenarios versionados en `qa/scenarios/`. El navegador integrado
puede reutilizar sesiones iniciadas, ejecutar pasos y capturar evidencia. Un escenario define:

- riesgo y autorización necesaria;
- datos/estado inicial;
- pasos observables;
- invariantes Supabase;
- salida esperada;
- limpieza o reversibilidad.

Capturas solas no prueban persistencia; consultas solas no prueban que la UI represente el estado.

### 5. E2E determinista

Promover a una suite automatizada los flujos estables de mayor riesgo cuando exista entorno y datos
aislados. Prioridades: auth/contextos, invitaciones, registro/publicación de storyboard, creación de
taller y bridge Educators↔runner.

## Evidencia

- Resumen exacto de comandos en el Log de la tarea.
- Artefactos temporales en `qa/artifacts/<run-id>/` (ignorado por Git).
- Sin contraseñas, tokens, anon/service keys, connection strings ni datos personales innecesarios.
- Actividad recibe solo el hito, no la salida completa.

## Warnings y hallazgos

Un exit code cero no convierte todos los warnings en inocuos. El agente debe clasificar cada aviso:

- bloqueante: invalida la prueba o indica que una parte no se ejecutó;
- deuda accionable: no bloquea hoy, pero puede volver el resultado no reproducible;
- ruido conocido: se descarta con razón y, de ser posible, se elimina en tooling.

Los dos primeros se registran en la tarea activa o en una tarea de deuda. No ocultarlos bajo
“verify verde”.

## Cobertura actual y huecos

| Capa | Estado |
|---|---|
| Admin typecheck/Vitest/build | activa en `verify.sh` |
| Studio typecheck/Vitest/build | activa en `verify.sh` |
| Educators analyze/test | focal, fuera del verify raíz |
| Supabase local + migraciones/RLS automatizadas | pendiente: faltan config, seed y matriz RLS |
| Branch/proyecto dev cloud | opcional por riesgo; no sustituye pruebas locales |
| Browser scenarios | definidos, ejecución asistida |
| E2E determinista | pendiente |

No pasar una tarea a revisión si la capa necesaria no se ejecutó o el hueco no quedó explícito.
