-- 0016: el educador recibe el título del taller (Luis, 2026-11-03).
--
-- En Admin, el título del taller es obligatorio y sale del storyboard, pero se puede cambiar («El huevo
-- como fuente de energía»). `educador_workshops` (0006) solo traía el título del storyboard, así que
-- Educators no veía el que escribió la organización. Ahora cada fila trae también `titulo`: el del
-- taller, o null si no tiene (Educators usa entonces el del storyboard). Lo demás no cambia.

create or replace function educador_workshops(p_token text, p_desde date default null, p_hasta date default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_ids bigint[] := educadores_de_sesion(p_token);
begin
  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id', w.id::text,
               'titulo', nullif(btrim(w.titulo), ''),
               'storyboard', jsonb_build_object(
                 'titulo', localizado(s.titulo, w.idioma_contenido, s.idioma_principal),
                 'eje', replace(lower(s.categoria::text), '_', '-'),
                 'categoria', s.categoria,
                 'slug', s.slug,
                 'edicion', s.edicion,
                 'escenas', s.numero_escenas,
                 'duracion', s.duracion_min),
               'organizacion', jsonb_build_object('id', o.id, 'nombre', o.nombre),
               'jornada', case when j.id is null then null else jsonb_build_object(
                 'id', j.id, 'nombre', j.nombre, 'ubicacion', j.ubicacion, 'fecha_inicio', j.fecha_inicio, 'fecha_fin', j.fecha_fin) end,
               'fecha', w.fecha,
               'horaInicio', to_char(w.hora_inicio, 'HH24:MI'),
               'horaFin', to_char(w.hora_fin, 'HH24:MI'),
               'lugar', w.ubicacion,
               'grupo', w.grupo_asistente,
               'asistentesEstimados', w.asistentes_estimados,
               'idioma', w.idioma_contenido,
               'modalidad', lower(w.modalidad::text),
               'estadoWorkshop', lower(w.estado::text),
               'motivoCancelacion', w.motivo_cancelacion,
               'estado', lower(we.estado::text),
               'iniciadoEn', we.iniciado_en,
               'terminadoEn', we.terminado_en,
               'cierre', (
                 select jsonb_build_object(
                          'calificacion', f.calificacion,
                          'asistentes', f.asistentes_reales,
                          'participacion', lower(f.participacion_grupo::text),
                          'claridad', lower(f.claridad_contenido::text),
                          'costo', coalesce(f.dificultades_grupo, ''),
                          'faltoMaterial', coalesce(f.material_faltante, ''))
                   from workshop_feedback f
                  where f.workshop_educador_id = we.id))
             order by w.fecha, w.hora_inicio)
      from workshop_educadores we
      join workshops w on w.id = we.workshop_id
      join organizaciones o on o.id = w.organizacion_id
      join storyboards s on s.id = w.storyboard_id
      left join jornadas j on j.id = w.jornada_id
     where we.educador_id = any (v_ids)
       and we.estado <> 'CANCELADO'
       and w.publicado_en is not null
       and w.estado in ('PUBLICADO', 'FINALIZADO', 'CANCELADO')
       and (p_desde is null or w.fecha >= p_desde)
       and (p_hasta is null or w.fecha <= p_hasta)
  ), '[]'::jsonb);
end;
$$;
