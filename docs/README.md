# Documentación técnica — router

Lee solo lo necesario para la tarea. El estado de trabajo no vive aquí: consulta
`obsidian/Ficha.md` y la tarea activa.

## Sistema y datos

| Necesidad | Leer |
|---|---|
| Mapa de apps y flujo punta a punta | [`architecture.md`](architecture.md) |
| Vocabulario del dominio | [`glossary.md`](glossary.md) |
| Supabase, auth, RLS y migraciones | [`backend.md`](backend.md) + migración concreta |
| Acceso vivo del agente a Supabase | [`operations/database-access.md`](operations/database-access.md) |
| Entornos y despliegues separados | [`operations/environments.md`](operations/environments.md) |

## Aplicaciones

| App | Documento |
|---|---|
| Admin | [`apps/admin.md`](apps/admin.md) |
| Studio | [`apps/studio.md`](apps/studio.md) |
| Educators | [`apps/educators.md`](apps/educators.md) |

## Contenido y UI

| Necesidad | Leer |
|---|---|
| Crear o modificar un storyboard | [`storyboards.md`](storyboards.md) |
| Runner y contrato con Educators | [`games.md`](games.md) |
| Reglas obligatorias de escenas | [`game-rules.md`](game-rules.md) completo |
| Tokens, componentes y primitivas | [`design.md`](design.md) |
| Mascota Potito | [`potito.md`](potito.md) solo si la tarea la toca |
| Referencia visual Admin | [`Admin Rediseño.html`](Admin%20Redise%C3%B1o.html) |

## Calidad

- [`testing/strategy.md`](testing/strategy.md): capas de verificación y evidencia.
- [`../qa/README.md`](../qa/README.md): ejecución de escenarios de navegador/Supabase.

## Autoridad y mantenimiento

- Código/configuración mandan sobre una descripción de implementación.
- `supabase/migrations/` manda sobre la forma ejecutable del esquema/RLS.
- Un documento de diseño debe distinguir explícitamente “vigente” de “propuesto”.
- El material histórico pesado vive en `archive/` y no forma parte de la lectura normal.
- No copies estado de tareas en docs técnicos.
