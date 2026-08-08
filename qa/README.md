# QA reproducible

Esta carpeta convierte pruebas manuales dispersas en escenarios ejecutables por un agente o humano.
No contiene credenciales ni snapshots reales versionados.

## Flujo

1. Elige un escenario en `scenarios/` y crea un `run-id` (`YYYYMMDD-HHMM-escenario`).
2. Confirma entorno, sesión, datos y nivel de riesgo.
3. Para escrituras cloud, solicita autorización antes de ejecutar.
4. Captura un snapshot read-only mínimo de Supabase.
5. Ejecuta el flujo en navegador integrado o navegador local.
6. Captura snapshot posterior y compara invariantes.
7. Guarda evidencia temporal en `artifacts/<run-id>/` y resume el resultado en la tarea.

## Configuración

QA no mantiene un `.env` paralelo. Admin y Studio usan sus propios `.env.local`; el navegador
integrado conserva su sesión y la inspección remota usa el MCP Supabase project-scoped/read-only
descrito en `docs/operations/database-access.md`. Cada ejecución registra en su evidencia las URLs
y el entorno usados, sin copiar credenciales ni sesiones al repositorio.

## Riesgo

- `lectura`: navegación y consultas sin mutación.
- `reversible`: crea/edita datos QA con rollback conocido.
- `destructivo`: publica, elimina, aplica migraciones o afecta operación real.

Los dos últimos requieren autorización explícita si usan cloud compartido.

## Trazabilidad Supabase

Usa consultas focales y read-only. Evita `select *`; selecciona IDs, claves, estados y relaciones
necesarias. Nunca imprimas tokens, hashes, emails no necesarios ni connection strings.

Ejemplo conceptual para un storyboard:

```sql
select id, clave, estado, numero_escenas, idiomas
from storyboards
where clave = '<uuid>';

select storyboard_id, orden, folder
from storyboard_escenas
where storyboard_id = <id>
order by orden;
```

El mecanismo preferido es el MCP oficial de Supabase limitado al proyecto y en modo read-only; ver
[`../docs/operations/database-access.md`](../docs/operations/database-access.md). También puede
usarse Supabase SQL o `psql` con rol de solo lectura. El escenario debe registrar cuál se usó.

## Evidencia mínima

- entorno y URL;
- usuario lógico/rol, sin identidad sensible;
- IDs/claves de prueba;
- snapshot antes/después;
- pasos UI observados;
- salida esperada vs real;
- limpieza/rollback;
- comandos automáticos ejecutados.
