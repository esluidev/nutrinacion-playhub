# Acceso del agente a Supabase

## Decisión recomendada

Usar el MCP oficial de Supabase como canal de descubrimiento vivo, con un perfil cotidiano:

- limitado al proyecto de Nutrinación (`project_ref`);
- `read_only=true`;
- inicialmente solo `features=database`;
- autenticado por OAuth en el cliente, sin tokens en el repo;
- conectado a desarrollo o una branch con datos anonimizados, no a producción.

URL base:

```text
https://mcp.supabase.com/mcp?project_ref=<project-ref>&read_only=true&features=database
```

Supabase documenta que `read_only=true` ejecuta consultas con un usuario PostgreSQL de solo
lectura, `project_ref` elimina acceso a otros proyectos y `features` reduce la superficie de
herramientas. También recomienda no conectar MCP a producción:

- https://supabase.com/docs/guides/ai-tools/mcp

## Configuración local

Codex:

```bash
codex mcp add supabase-workshops \
  --url 'https://mcp.supabase.com/mcp?project_ref=<project-ref>&read_only=true&features=database'
codex mcp login supabase-workshops
```

Claude Code usa la misma URL mediante su configuración MCP de proyecto. No versionar access
tokens, connection strings ni service-role keys.

La activación requiere aprobación de Luis porque concede acceso externo al proyecto, aunque sea
read-only.

## Detección y uso por el agente

No se asume que el MCP está instalado. En una tarea relacionada con datos, el agente revisa primero
las herramientas disponibles:

- si aparece `supabase-workshops` o una capacidad Supabase equivalente para este proyecto, la usa
  para introspección y QA remoto focal;
- si no aparece, continúa con las migraciones versionadas y Supabase local; solo declara bloqueo si
  el criterio de aceptación exige observar el estado cloud;
- en el Log registra `MCP disponible: sí/no`, proyecto/branch/entorno e invariantes verificadas, sin
  copiar credenciales, PII ni resultados masivos.

Esta regla vive también en `AGENTS.md` porque debe descubrirse antes de entrar a documentación
profunda. El nombre estable recomendado del servidor es `supabase-workshops`.

## Estrategia de entornos: local primero

No hay que elegir entre Supabase local y branches cloud como alternativas excluyentes. Forman
capas distintas del mismo pipeline:

```text
migración SQL versionada
  → reset + seed + pruebas RLS en Supabase local
  → revisión/commit
  → branch cloud o proyecto dev para E2E cuando el riesgo lo justifique
  → aplicación autorizada en producción
  → verificación remota read-only con MCP
```

### Supabase local — puerta obligatoria

Usarlo para cada cambio de esquema, trigger, función o RLS y para pruebas destructivas/repetibles.
Es rápido, aislado y reconstruible: `supabase db reset` vuelve a aplicar migraciones y seed. Las
migraciones se crean y corrigen aquí antes de tocar cloud.

- https://supabase.com/docs/guides/local-development/overview
- https://supabase.com/docs/guides/deployment/database-migrations

Este repositorio ya tiene `supabase/migrations/`, pero todavía no tiene `supabase/config.toml`, un
`supabase/seed.sql` determinista ni una matriz automatizada de RLS. Por tanto, habilitar el arnés
local es trabajo pendiente y la primera mejora recomendada.

### Branch cloud — segunda puerta opcional

Usarla cuando haga falta reproducir servicios gestionados o una integración punta a punta más fiel:
Auth, Realtime, Storage, Edge Functions, correo/webhooks o un preview de PR. Cada branch es un
entorno Supabase separado, nace sin datos de producción y debe poblarse con seed seguro.

Branching es opcional y tiene coste/limitaciones de plan; no conviene crear una branch por cada
cambio pequeño. Si no está disponible, un proyecto Supabase de desarrollo separado cumple esta
segunda puerta. Nunca se usa producción como sustituto del entorno de QA.

- https://supabase.com/docs/guides/deployment/branching
- https://supabase.com/docs/guides/platform/manage-your-usage/branching

### Producción — destino, no entorno de pruebas

Solo recibe migraciones ya verificadas localmente y, cuando corresponde, en branch/proyecto dev.
La aplicación requiere autorización explícita. Después, el MCP read-only puede confirmar migration
history, forma del esquema e invariantes de datos sin convertirse en canal de escritura.

## Flujo de consulta

El agente no descarga todo el esquema al iniciar. Consulta por demanda:

1. `list_migrations` para comparar repo y estado remoto.
2. `list_tables` solo para localizar el dominio.
3. `execute_sql` sobre `information_schema`/`pg_catalog` para las tablas concretas:
   columnas, tipos, nullability, FK, unique, índices, triggers, funciones y políticas RLS.
4. Consultas de datos focales con columnas explícitas y `limit`.
5. Snapshot antes/después para QA, siempre sin PII innecesaria.
6. Registrar en la tarea fecha, proyecto/branch, consultas e invariantes verificadas.

Las migraciones del repo siguen siendo la definición versionada; la introspección MCP confirma qué
está realmente aplicado. Si difieren, se registra drift y no se adivina cuál desplegar.

## Separar lectura de escritura

El perfil permanente no debe exponer `apply_migration`, deploy de Edge Functions ni mutaciones.
Para una migración autorizada:

1. probar siempre en Supabase local y, según riesgo, en branch/proyecto dev aislado;
2. ejecutar matriz RLS con identidades sembradas;
3. revisar SQL y plan de corrección;
4. pedir autorización explícita;
5. aplicar por un canal temporal/operativo;
6. volver al perfil read-only y verificar estado.

No crear un segundo MCP write-enabled siempre activo.

## Fallback sin MCP

Para desarrollo de esquema y pruebas RLS, el primer fallback es Supabase local. Si además se
necesita observar cloud y MCP no está disponible, usar una cuenta PostgreSQL exclusiva para el
agente con `SELECT` sobre los esquemas necesarios y credenciales en entorno local. Supabase
recomienda una identidad distinta por servicio y permisos mínimos:

- https://supabase.com/docs/guides/database/postgres/roles

Este fallback es más scriptable, pero exige custodiar y rotar una contraseña. MCP con OAuth,
project scoping y read-only es preferible para trabajo interactivo.

## Lo que no resuelve MCP

- No reemplaza tests de migración/RLS en una base aislada.
- Read-only no valida INSERT/UPDATE/DELETE ni matrices de roles de aplicación.
- Leer filas reales puede exponer datos sensibles y contenido malicioso; sigue aplicando mínima
  consulta y revisión humana.
- Tipos TypeScript generados son útiles como detector de drift, pero también pueden desactualizarse;
  deben regenerarse/verificarse, no convertirse en otra fuente manual.
