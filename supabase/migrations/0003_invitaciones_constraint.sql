-- 0003 — Una invitación de COLABORADOR siempre debe traer comunidad
-- ─────────────────────────────────────────────────────────────────────────────
-- En 0001 "requerido si role = COLABORADOR" era solo un COMENTARIO, no una restricción.
-- El hueco: si se emite una invitación COLABORADOR sin `comunidad_id`, el trigger
-- handle_new_user no enlaza nada (solo enlaza COLABORADOR cuando hay comunidad) → nace un
-- usuario sin ningún acceso, desde el registro. Y el registro es cerrado justamente para que
-- eso no pueda pasar: toda invitación debe engancharte a algo.
--
-- ADMIN no necesita comunidad (se engancha a la organización, que es NOT NULL).
--
-- Nota: el estado RECHAZADA del enum `estado_invitacion` ya está aplicado en la base y
-- reflejado en 0001; aquí no se toca.

alter table invitaciones
  drop constraint if exists invitaciones_colaborador_requiere_comunidad;

alter table invitaciones
  add constraint invitaciones_colaborador_requiere_comunidad
  check (role <> 'COLABORADOR' or comunidad_id is not null);
