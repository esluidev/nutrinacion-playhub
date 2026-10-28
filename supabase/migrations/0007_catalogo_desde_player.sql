-- 0007: Player registra, actualiza y publica el catálogo (Luis, 2026-10-15 y 2026-10-16; decisión 006).
--
-- Player (solo el superadmin entra a su gestión) hace dos cosas distintas:
--   · sincronizar_storyboard: manda la metadata del storyboard tal como la lee de su JSON; crea o
--     actualiza la fila de `storyboards` y las escenas de su guía. No toca el estado, los países ni
--     la organización, ni lo escrito en la guía. Una escena que el JSON ya no tiene se borra con su guía.
--   · publicar_storyboard: el estado del artículo (registrado, en revisión, publicado, archivado),
--     los países (del catálogo `paises`) y, si es personalizado, la organización.
-- Las reglas de la publicación están en el trigger de 0003; las de la taxonomía, en sus enums y
-- checks: un código que no está en la lista falla aquí (Player lo valida antes con los tipos).
--
-- La metadata (la misma forma que arma apps/player/app/utils/storyboardMetadata.ts):
--   { clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud,
--     idiomas, idioma_principal, duracion_min, escenas: [{ orden, carpeta, titulo }] }
create function sincronizar_storyboard(p_metadata jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_escenas jsonb := coalesce(p_metadata->'escenas', '[]'::jsonb);
  v_id      bigint;
  v_nuevo   boolean;
  v_guia    bigint;
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin registra storyboards' using errcode = '42501';
  end if;

  insert into storyboards (clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud,
                           idiomas, idioma_principal, duracion_min, numero_escenas)
  values (
    (p_metadata->>'clave')::uuid,
    p_metadata->>'slug',
    p_metadata->>'version_build',
    coalesce(p_metadata->'titulo', '{}'::jsonb),
    (p_metadata->>'categoria')::categoria_storyboard,
    nullif(p_metadata->>'subcategoria', '')::subcategoria_storyboard,
    (p_metadata->>'edicion')::edicion_storyboard,
    array(select jsonb_array_elements_text(coalesce(p_metadata->'enfoques_salud', '[]'::jsonb)))::enfoque_salud[],
    array(select jsonb_array_elements_text(coalesce(p_metadata->'idiomas', '[]'::jsonb)))::idioma[],
    coalesce(p_metadata->>'idioma_principal', 'es')::idioma,
    (p_metadata->>'duracion_min')::int,
    jsonb_array_length(v_escenas))
  on conflict (clave) do update
     set slug             = excluded.slug,
         version_build    = excluded.version_build,
         titulo           = excluded.titulo,
         categoria        = excluded.categoria,
         subcategoria     = excluded.subcategoria,
         edicion          = excluded.edicion,
         enfoques_salud   = excluded.enfoques_salud,
         idiomas          = excluded.idiomas,
         idioma_principal = excluded.idioma_principal,
         duracion_min     = excluded.duracion_min,
         numero_escenas   = excluded.numero_escenas
  returning id, (xmax = 0) into v_id, v_nuevo;

  select id into v_guia from guias where storyboard_id = v_id;

  -- Escenas de la guía, casadas por carpeta: las que ya no están se van; las demás se reordenan
  -- (primero a un rango libre, por el unique de orden) y las nuevas nacen sin guía.
  delete from guia_escenas
   where guia_id = v_guia
     and carpeta not in (select e->>'carpeta' from jsonb_array_elements(v_escenas) e);
  update guia_escenas set orden = orden + 1000 where guia_id = v_guia;
  insert into guia_escenas (guia_id, orden, carpeta, titulo)
  select v_guia, (e->>'orden')::int, e->>'carpeta', coalesce(e->'titulo', '{}'::jsonb)
    from jsonb_array_elements(v_escenas) e
  on conflict (guia_id, carpeta) do update
     set orden = excluded.orden,
         titulo = excluded.titulo;

  return jsonb_build_object('id', v_id, 'nuevo', v_nuevo);
end;
$$;

-- El estado, los países y la organización (null = estándar) de un storyboard ya registrado.
create function publicar_storyboard(p_clave uuid, p_estado estado_publicacion, p_paises text[], p_organizacion bigint default null)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin publica storyboards' using errcode = '42501';
  end if;

  update storyboards
     set estado_publicacion = p_estado,
         paises_disponibles = coalesce(p_paises, '{}'),
         organizacion_id = p_organizacion
   where clave = p_clave;

  if not found then
    raise exception 'El storyboard % no está registrado', p_clave using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function sincronizar_storyboard(jsonb) from public, anon;
grant execute on function sincronizar_storyboard(jsonb) to authenticated;
revoke all on function publicar_storyboard(uuid, estado_publicacion, text[], bigint) from public, anon;
grant execute on function publicar_storyboard(uuid, estado_publicacion, text[], bigint) to authenticated;
