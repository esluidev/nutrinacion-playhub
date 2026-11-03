---
id: 014
estado: backlog
prioridad: media
creada: 2026-11-03
---
# La guía completa para el educador

## Objetivo

Que el educador reciba toda la guía que escribe Platform, en la ficha y en el runner, y que quede claro dónde se escribe cada parte del storyboard. Reúne C1, C4, C5, E5 y el hallazgo 1 de la [tarea 010](010-pendientes-plataforma.md), y lo de la guía de la [006](006-modelo-de-datos.md).

## Alcance

- **Material (C4):** `material` no está en el contrato del runner (`runner-contract.ts`). `educador_guia` lo manda, el saneado lo descarta y el panel no lo muestra. Hay que añadirlo al contrato (cambio aditivo) y mostrarlo.
- **Cabecera de la guía (C5):** `descripcion`, `objetivo`, `publico` y `adaptado_a` nunca llegan al educador: ni `educador_guia` ni `educador_workshops` los devuelven. Deberían verse en la ficha.
- **Decisión (hallazgo 1):** quién edita qué. Player registra la metadata desde el JSON y Platform escribe la guía. Opciones:
  - A. Hacer visible ese reparto (recomendada).
  - B. Que Player también escriba la guía.
  - C. Que Admin edite los datos básicos.

  El análisis está en la 010.
- **Decisión (E5):** afirmaciones y fuentes de la guía no tienen sitio en la base. `estructura.md` (skill `playhub-storyboard-games`, fuera de este repositorio) no documenta `healthFocus`.
- **Contenido (C1):** solo «El huevo» tiene JSON. «El pan» y «La soda» existen solo en `seed.sql`, y la guía del seed de «El huevo» tiene `mecanica` y `material` en null. Hay que crear esos storyboards en Studio o sacarlos del seed.

## Criterios de aceptación

- [ ] La ficha de Educators muestra la cabecera de la guía y el material de cada escena.
- [ ] El panel de la guía en el runner muestra el material.
- [ ] Luis decidió el hallazgo 1 y E5.

## Pendientes y siguiente paso

C4 y C5 se pueden hacer ya; las decisiones, con Luis.

## Log

- 2026-11-03 15:06 — Creada al cerrar las tareas 001–011 (Luis: «finaliza todo y quita cosas del backlog, ordena las tareas»). Viene de C1, C4, C5, E5 y el hallazgo 1 de la 010. Comprobado en el código: `material` sigue fuera de `runner-contract.ts` y `0015` no devuelve la cabecera de la guía.
