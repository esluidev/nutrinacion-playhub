# La licencia solo fija el cupo de comunidades

Fecha: 2026-10-28
Estado: aceptada
Sustituye a: los cupos de educadores y de storyboards personalizados de `organizacion_licencias` (migración `0002`) y la frase de la constitución «La licencia acota cuántos [personalizados] puede tener».

## Contexto

Al asignar una licencia, Platform pedía tres cupos: comunidades, educadores y storyboards personalizados. Solo el de comunidades se hacía cumplir (trigger `comunidades_valida_cupo`). Los otros dos se guardaban y se mostraban como «N de M» en la licencia, pero nada los aplicaba: ni el alta de educadores ni la publicación de un personalizado en Player los consultaban.

## Decisión

Aceptada por Luis el 2026-10-28:

- **La licencia fija cuántas comunidades puede tener la organización**, además de su vigencia, su estado y los países donde puede abrirlas.
- **No limita los educadores ni los storyboards personalizados.** Migración `0012` quita `max_educadores` y `max_personalizados`; Platform deja de pedirlos y Admin, de mostrarlos como cupos.

## Consecuencias

- Una organización da de alta los educadores que necesite en sus comunidades.
- Los personalizados de una organización los decide la startup al producirlos y publicarlos en Player, sin un tope en la licencia.
- El cupo de comunidades sigue igual: la base no deja crear una comunidad sin licencia vigente ni por encima del cupo.
- Si algún día se cobra por educador o por personalizado, vuelve como columna de la licencia con su regla en la base, no solo en la UI.
