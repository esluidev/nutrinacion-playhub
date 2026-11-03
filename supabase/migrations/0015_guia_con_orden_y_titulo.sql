-- 0015: la guía que lee el educador trae el orden y el título de cada escena (Luis, 2026-11-03).
--
-- «Ver guía» lleva a la ficha del taller y la ficha muestra la guía escena por escena. Hasta ahora
-- `educador_guia` (0006) solo servía al runner, que saca el orden y el título de su storyboard.
-- Ahora cada escena trae también `order` y `title`, y la ficha la muestra en su orden. El runner
-- descarta las claves que no son de su contrato (docs/runner.md), así que recibe lo mismo de antes.

create or replace function educador_guia(p_token text, p_workshop_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_asignacion workshop_educadores := educador_asignacion(educadores_de_sesion(p_token), p_workshop_id, 'ver');
  v_workshop   workshops;
  v_respaldo   idioma;
begin
  select * into v_workshop from workshops where id = v_asignacion.workshop_id;
  select idioma_principal into v_respaldo from storyboards where id = v_workshop.storyboard_id;
  return coalesce((
    select jsonb_object_agg(ge.carpeta, jsonb_strip_nulls(jsonb_build_object(
             'order',       ge.orden,
             'title',       localizado(ge.titulo, v_workshop.idioma_contenido, v_respaldo),
             'verb',        localizado(ge.verbo, v_workshop.idioma_contenido, v_respaldo),
             'subtitle',    localizado(ge.subtitulo, v_workshop.idioma_contenido, v_respaldo),
             'description', localizado(ge.descripcion, v_workshop.idioma_contenido, v_respaldo),
             'objective',   localizado(ge.objetivo, v_workshop.idioma_contenido, v_respaldo),
             'pedagogy',    localizado(ge.pedagogia, v_workshop.idioma_contenido, v_respaldo),
             'questions',   localizado(ge.preguntas, v_workshop.idioma_contenido, v_respaldo),
             'psychology',  localizado(ge.psicologia, v_workshop.idioma_contenido, v_respaldo),
             'science',     localizado(ge.cientifico, v_workshop.idioma_contenido, v_respaldo),
             'notDoing',    localizado(ge.no_hace, v_workshop.idioma_contenido, v_respaldo),
             'tips',        localizado(ge.consejos, v_workshop.idioma_contenido, v_respaldo),
             'mechanic',    localizado(ge.mecanica, v_workshop.idioma_contenido, v_respaldo),
             'material',    localizado(ge.material, v_workshop.idioma_contenido, v_respaldo))))
      from guia_escenas ge
      join guias g on g.id = ge.guia_id
     where g.storyboard_id = v_workshop.storyboard_id
  ), '{}'::jsonb);
end;
$$;
