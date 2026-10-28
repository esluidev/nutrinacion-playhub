# Documentación y mapa de contexto

`docs/` describe cómo funciona el sistema: se lee por área, solo cuando la tarea la toca. Cómo se trabaja está en [`.harness/`](../.harness/project.md) y qué se está haciendo, en [`tasks/`](../tasks/README.md).

## Mapa por área

| Área y cuándo leer | Documentación | Entrada de código | Skill | Verificación |
|---|---|---|---|---|
| Sistema completo: apps, flujo de punta a punta y límites de datos | [`architecture.md`](architecture.md), [`glossary.md`](glossary.md) | `apps/`, `supabase/` | — | `./scripts/verify.sh` |
| Supabase: esquema, nombres, auth, RLS, acceso del educador, registro del catálogo, migraciones y acceso del agente; qué va a producción y usuarios de prueba | [`backend.md`](backend.md), [`supabase/README.md`](../supabase/README.md), decisiones [005](decisions/005-base-nueva-y-acceso-educador.md), [006](decisions/006-modelo-y-catalogo-desde-player.md) y [008](decisions/008-superadmin-administra-organizaciones.md) y la migración concreta | `supabase/migrations/`, `supabase/functions/`, `supabase/seed.sql` | — | `supabase test db` (pgTAP en `supabase/tests/`), con Supabase local levantado |
| Admin | [`../apps/admin/AGENTS.md`](../apps/admin/AGENTS.md) | `apps/admin/app/` | — | `typecheck`, Vitest y build |
| Player: gestión y runner `/play/**` | [`../apps/player/AGENTS.md`](../apps/player/AGENTS.md) | `apps/player/app/`, `apps/player/content/` | — | `typecheck`, Vitest y build |
| Runner incrustado: contrato entre Player y las apps (URL, mensajes, seguridad) | [`runner.md`](runner.md), [decisión 004](decisions/004-runner-incrustado.md) | `packages/ui/app/utils/runner-contract.ts`, `UiRunner.vue`, `apps/player/app/runner/useHost.ts` | — | Vitest (`apps/player/tests/runnerContract.test.ts`) y el flujo en el navegador |
| UI Kit: tokens, componentes y laboratorio | [`../packages/ui/README.md`](../packages/ui/README.md), [`TOKENS.md`](../packages/ui/TOKENS.md), [`DESIGN.md`](../packages/ui/DESIGN.md) | `packages/ui/` | — | Lo verifican las tres apps; lámina en `packages/ui/lab` |
| Juegos, escenas y runner (PlayHub) | [`PLAYER-DESIGN.md`](../packages/ui/PLAYER-DESIGN.md), `../product/` (raíz de PlayHub) | `apps/player/app/runner/`, `apps/player/content/` | `playhub-storyboard-games` | QA visual a tamaño de teléfono y de tableta |
| Voces de un storyboard | [`../apps/player/scripts/README.md`](../apps/player/scripts/README.md) | `apps/player/scripts/generate_audio.py` | `playhub-storyboard-games` | — |
| Educators | [`../apps/educators/AGENTS.md`](../apps/educators/AGENTS.md) | `apps/educators/app/` | — | `typecheck`, Vitest y build; revisión a tamaño de teléfono y tableta |

Decisiones duraderas y sus razones: [`decisions/`](decisions/README.md).

## Convenciones

- Código y configuración mandan sobre una descripción; `supabase/migrations/` manda sobre la forma del esquema y la RLS.
- Lo vigente y lo previsto se distinguen explícitamente.
- Un dato vive en un solo sitio: `docs/` no copia estado de tareas ni reglas del arnés, y lo que el modelo ya sabe (frameworks, herramientas) no se documenta.
- Si una tarea cambia una regla vigente, actualiza su documento y enlázalo desde la tarea.
