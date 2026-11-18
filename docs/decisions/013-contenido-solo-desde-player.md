# Todo el contenido se gestiona desde Player; Admin solo lo muestra

Fecha: 2026-11-17
Estado: aceptada
Sustituye a: «Admin/Platform escribe la guía» de las decisiones [006](006-modelo-y-catalogo-desde-player.md) y [007](007-educador-hogar-y-ciclo-del-workshop.md), y el borrado de storyboards en Platform. El registro y la publicación siguen como los decidieron la 006 y la 007.

## Contexto

Un storyboard se registraba y se publicaba en Player, pero su guía se completaba en Admin › Platform: alguien la copiaba a mano, escena por escena y en cada idioma, desde la guía pulida que se escribe fuera (`playhub/storyboards/<eje>/<storyboard>/01-guia-educador.md`). Luis, el 2026-11-17: la administración del contenido queda en dos lados y eso complica el proceso. El registro, la corrección y la publicación deben estar solo en Player y en lo que permita a un modelo hacer ese mismo proceso.

Se valoró que la guía fuera un archivo del storyboard, junto a su JSON, y que el registro la subiera. Luis lo descartó: con la guía ya pulida, un modelo puede registrarla en la base, y Player da los campos para corregirla. Así no hay archivos que mantener y todo queda en la base.

## Decisión

- **Player es la única superficie que cambia el contenido.** Registra y actualiza el storyboard desde su JSON, lo publica (estado, países y organización), escribe su guía (la cabecera y cada escena, en cada idioma) y lo elimina.
- **Admin solo lo muestra.** Platform enseña la lista de storyboards, su detalle y la guía de cada escena, con «Editar en Player». La organización sigue viendo sus storyboards disponibles como hasta ahora.
- **La guía vive en la base** (`guias` y `guia_escenas`). Se escribe fuera, se revisa y se pule; después pasa a la base, y desde ahí la que vale es la de la base. Los ajustes posteriores, de la guía al storyboard o del storyboard a la guía, se hacen en Player.
- **Un modelo podrá hacer el mismo proceso**: registrar, actualizar, escribir la guía y publicar. El medio está por decidir ([tarea 019](../../tasks/019-contenido-solo-desde-player.md)).

## Consecuencias

- Platform pierde «Editar», la edición de la guía y «Eliminar». Player gana la cabecera de la guía (`/storyboards/<eje>/<slug>/guia`), la guía de cada escena (`/guia/<carpeta>`) y «Eliminar» en lo que está en la base sin JSON en este build.
- Player deja de leer `configuracion.admin_url`, que servía para enlazar la guía en Admin. Admin usa `player_url` para «Editar en Player».
- La RLS no cambia: las dos apps entran como superadmin (`guias_superadmin`, `guia_escenas_superadmin`). Que solo Player escriba es una regla del proceso, no una barrera de seguridad.
- No cambia cómo leen la guía Educators (`educador_guia`) ni la organización en Admin.
