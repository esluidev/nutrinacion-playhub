---
id: 015
estado: backlog
prioridad: media
creada: 2026-11-03
---
# Pendientes menores de Admin, Educators y las pruebas

## Objetivo

Cerrar lo pequeño que quedó abierto en las tareas [004](004-admin-ui-kit.md), [008](008-deuda-tras-rediseno.md), [010](010-pendientes-plataforma.md) y [011](011-organizacion-sin-comunidades.md). Cada punto es una entrega corta e independiente.

## Alcance

1. **Corregir un cierre y cerrar un taller pasado (A8), decisión:** un taller pasado sin cierre solo llega al feedback repitiendo el runner hasta «Terminar», y un cierre guardado no se corrige desde la ficha. La regla vigente dice que el feedback no es un botón (`apps/educators/AGENTS.md`). Luis decide si se añaden «Cerrar taller» y «Corregir cierre».
2. **Buscador «⌘K» (B3):** en la cabecera de Admin es un adorno sin acción (`LayoutHeader.vue`). Implementarlo o quitarlo.
3. **Colores sin decidir (tarea 004):** licencia suspendida en neutro o coral; «titular» en cielo; «Sin administradores» en sol; cifras de Platform en neutro; «Usar en taller» neutro en el catálogo.
4. **Eliminar jornada atómico (tarea 011):** Admin compone el lugar de cada taller con un update por taller antes de borrar la jornada. Iría mejor en la base (trigger o función).
5. **Textos fuera del i18n (B4):** queda poco. Por ejemplo, el placeholder «Mínimo 6 caracteres» de `pages/invitacion/[token].vue`. Revisarlo entero.
6. **Talleres por rango (D1):** `educador_workshops` se llama sin `p_desde` ni `p_hasta` y siempre trae todos los talleres. Pedir por rango cuando crezca.
7. **Pruebas (F6):** las Edge Functions no tienen `deno.json` ni pruebas y están fuera de `verify.sh`. No hay E2E. Nada prueba la política del bucket `narracion`.

## Criterios de aceptación

- [ ] Cada punto corregido y verificado, o descartado por Luis con motivo.

## Pendientes y siguiente paso

Los puntos 1 y 3 son decisiones de Luis; el resto se puede hacer en cualquier orden.

## Log

- 2026-11-03 15:06 — Creada al cerrar las tareas 001–011 (Luis: «finaliza todo y quita cosas del backlog, ordena las tareas»). Comprobado en el código que siguen abiertos A8, B3, B4, D1 y F6 de la 010, los colores de la 004 y el borrado no atómico de la 011. Fuera, por resueltos: el cierre del menú de usuario (ahora `UiUserMenu` del kit) y el resto de la tabla de la 008.
