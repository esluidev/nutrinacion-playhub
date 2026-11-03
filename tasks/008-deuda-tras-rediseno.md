---
id: 008
estado: finalizada
prioridad: media
creada: 2026-10-14
---
# Deuda encontrada al rehacer Admin con el kit

## Objetivo

Registrar lo que apareció al pasar Admin al kit (tarea 004) y no se arregló, porque cambia comportamiento o producto.

## Alcance

Cada punto se decide y se corrige por separado; ninguno bloquea la tarea 004.

| Hallazgo | Dónde | Impacto | Propuesta | Estado |
|---|---|---|---|---|
| Fechas con un día menos y «hoy» en UTC | Platform (organizaciones, licencias, invitaciones, inicio), organización (inicio, administradores), colaboradores, participantes, «Para casa», jornadas; formularios de invitación y de licencia | Vigencias e invitaciones que se ven o vencen un día antes en América | Una utilidad compartida que lea las columnas `date` como día local | Corregido 2026-10-18 (`utils/fechas.ts`, con prueba). Las invitaciones vencen al final del día elegido. El cupo de comunidades sigue en UTC a propósito: replica el trigger |
| Confirmaciones nativas del navegador (`confirm`) al eliminar organizaciones y licencias | `pages/platform/organizaciones/index.vue`, `pages/platform/licencias/index.vue` y `[id].vue` | Rompe el sistema de diseño | `UiConfirmDialog` que dice qué se borra o qué lo impide | Corregido 2026-10-18: diálogos del kit (la organización cuenta lo que se lleva, exige el nombre y explica si sus comunidades o storyboards lo impiden); `check-ui.mjs` rechaza `confirm`/`alert`/`prompt` |
| Cancelar un taller no pide confirmación | `pages/dashboard/workshops/[id].vue` | Cancelación accidental | `UiConfirmDialog` en coral, como eliminar | Corregido (tarea 006): confirmación con motivo |
| Textos fijos en español en una app multidioma | Planner, estados de taller (`STATUS_LABELS`), «Más acciones», «Expandir/Colapsar sidebar» | Inglés incompleto | Pasar a `i18n/messages.ts` | Pendiente; las vistas nuevas (jornadas, «Para casa», participantes, configuración, perfil) ya usan i18n |
| Las cifras del inicio no miden lo que dicen | `pages/dashboard/index.vue`: «Programados · esta semana» cuenta todos; «Total · este mes», todos | Datos engañosos | Filtrar por fecha o cambiar las etiquetas | Corregido 2026-10-16: cuentan el mes y la semana (lunes a domingo) en curso, sin archivados |
| Buscador ⌘K de la cabecera es solo visual | `components/LayoutHeader.vue` | Promete algo que no hace | Implementarlo o quitarlo | Pendiente |
| Acciones sin destino | «Olvidé mi contraseña» (login); «Cambiar foto» y «Actualizar contraseña» (perfil) | Botones muertos | Conectar o retirar | Corregido 2026-10-16: «¿La olvidaste?» manda el enlace y `/restablecer` fija la nueva; el perfil guarda nombre, apellido e idioma y cambia la contraseña con la actual; «Cambiar foto» retirado (no hay almacenamiento de avatares) |
| Cierre del menú de usuario por clic fuera | `LayoutHeader.vue` busca `.relative` | Menor: un clic dentro de un popover no lo cierra | Usar el popover de Reka como en el resto | Pendiente |
| Nombre viejo «StoryPlay» | `pages/dashboard/perfil.vue` («Lo que puedes hacer en StoryPlay», «Plataforma StoryPlay»). Los del asistente y del alta de educadores ya se corrigieron con la tarea 006 | Marca equivocada | «PlayHub» | Corregido 2026-10-16 al pasar el perfil a i18n |

## Criterios de aceptación

- [ ] Cada fila decidida (corregir, posponer o descartar con motivo) y, si se corrige, verificada.

## Pendientes y siguiente paso

Finalizada el 2026-11-03 por Luis. El buscador «⌘K» y los textos fuera del i18n pasan a la [tarea 015](015-pendientes-de-admin-y-educators.md) (puntos 2 y 5). El cierre del menú de usuario ya no aplica: la cabecera usa `UiUserMenu` del kit. El resto de la tabla está corregido.

## Log

- 2026-10-14 — Creada con los informes de los agentes que rehicieron las vistas de Admin (tarea 004).
- 2026-10-16 — Añadido el texto «app de StoryPlay» del asistente, visto al revisar los estados del workshop (tarea 006).
- 2026-10-16 — Al conectar Admin a la base (tarea 006) se corrigieron las cifras del inicio, las acciones sin destino del login y del perfil, y la marca del perfil; verificado en el navegador con el seed local. Quedan los textos fijos, el ⌘K y el cierre del menú de usuario.
- 2026-10-18 — Luis encuentra un `confirm` nativo al eliminar una organización. Eran tres (organización y licencia en lista y detalle): pasan a `UiConfirmDialog` y la regla queda en `DESIGN.md` y en `check-ui.mjs`. Verificado en el navegador: organización bloqueada por su comunidad y su storyboard, organización de prueba borrada con su licencia y su jornada, licencia borrada.
- 2026-10-18 — Fechas: `utils/fechas.ts` (fecha sin hora como día local, «hoy» local, días hasta, fin del día) en lugar de 11 copias. Las invitaciones vencían a las 18:00 del día anterior; ahora a las 23:59:59 del día elegido (comprobado en la base). De paso, el detalle de organización de Platform no cargaba: embebía `licencias` en vez de `organizacion_licencias` (PGRST200). Probadas contra la API local las 57 consultas de Admin y Player que se pueden comprobar sin variables, más las tres con variables a mano: ninguna rota.
- 2026-10-19 — Detalle de organización en Platform: fuera la barra de uso de comunidades (las otras dos cifras no la tenían). La portada de la organización, que tiene barra en las tres, no cambia.
- 2026-10-19 — Detalle de organización en Platform sin licencia: «Asignar Licencia» sale de la cabecera y pasa a la tarjeta de licencia como acción principal (lima), con un aviso en coral de lo que no puede hacer; «Invitar Administrador» queda neutro mientras falte la licencia.
- 2026-11-03 15:06 — Luis: «finaliza todo y quita cosas del backlog, ordena las tareas». Finalizada; lo que quedaba abierto pasa a las tareas 012–015 (ver «Pendientes y siguiente paso»).
