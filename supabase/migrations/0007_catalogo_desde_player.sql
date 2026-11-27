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
                           idiomas, idioma_principal, duracion_min, numero_escenas, portada)
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
    jsonb_array_length(v_escenas),
    nullif(p_metadata->>'portada', ''))
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
         portada          = excluded.portada,
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

-- Si un storyboard sale en la app del hogar (tarea 022). Las reglas (publicado y de Nutrinación) están en el trigger
-- de 0003.
create function publicar_storyboard_hogar(p_clave uuid, p_hogar boolean)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin publica storyboards' using errcode = '42501';
  end if;
  update storyboards set publicado_hogar = coalesce(p_hogar, false) where clave = p_clave;
  if not found then
    raise exception 'El storyboard % no está registrado', p_clave using errcode = 'P0002';
  end if;
end;
$$;

-- Guarda una unidad de estudio con sus storyboards en orden (tarea 022): crea o actualiza su cabecera y
-- reemplaza su lista. Devuelve su id.
--   { id?, titulo: { es, en }, descripcion?: { es, en }, publicada, storyboards: [id, …] }
create function guardar_unidad_estudio(p_unidad jsonb)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_id bigint := nullif(p_unidad->>'id', '')::bigint;
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin gestiona las unidades de estudio' using errcode = '42501';
  end if;

  if v_id is null then
    insert into unidades_estudio (titulo, descripcion, publicada, orden)
    values (coalesce(p_unidad->'titulo', '{}'::jsonb), nullif(p_unidad->'descripcion', 'null'::jsonb),
            coalesce((p_unidad->>'publicada')::boolean, false),
            coalesce((select max(orden) + 1 from unidades_estudio), 1))
    returning id into v_id;
  else
    update unidades_estudio
       set titulo = coalesce(p_unidad->'titulo', '{}'::jsonb),
           descripcion = nullif(p_unidad->'descripcion', 'null'::jsonb),
           publicada = coalesce((p_unidad->>'publicada')::boolean, false)
     where id = v_id;
    if not found then
      raise exception 'La unidad % no existe', v_id using errcode = 'P0002';
    end if;
  end if;

  delete from unidad_estudio_storyboards where unidad_estudio_id = v_id;
  insert into unidad_estudio_storyboards (unidad_estudio_id, storyboard_id, orden)
  select v_id, s::bigint, n::int
    from jsonb_array_elements_text(coalesce(p_unidad->'storyboards', '[]'::jsonb)) with ordinality as e(s, n);
  return v_id;
end;
$$;

-- El catálogo de la app del hogar para un país (tarea 022), sin cuenta: los storyboards de Nutrinación
-- publicados para el hogar en ese país y las unidades publicadas con los suyos, en orden (por clave).
-- Una unidad sin ningún storyboard en ese país no sale. La edad la filtra la app con el perfil.
--   { storyboards: [{ clave, eje, slug, titulo, categoria, subcategoria, edicion, enfoques_salud, idiomas,
--                     idioma_principal, duracion_min, numero_escenas }],
--     unidades: [{ id, titulo, descripcion, storyboards: [clave, …] }] }
create function hogar_catalogo(p_pais text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  with del_hogar as (
    select s.* from storyboards s
     where s.publicado_hogar and s.estado_publicacion = 'PUBLICADO' and s.organizacion_id is null
       and upper(coalesce(p_pais, '')) = any (s.paises_disponibles)
  ), unidades as (
    select u.id, u.titulo, u.descripcion, u.orden,
           jsonb_agg(h.clave order by us.orden) as storyboards
      from unidades_estudio u
      join unidad_estudio_storyboards us on us.unidad_estudio_id = u.id
      join del_hogar h on h.id = us.storyboard_id
     where u.publicada
     group by u.id
  )
  select jsonb_build_object(
    'storyboards', coalesce((
      select jsonb_agg(jsonb_build_object(
               'clave', clave, 'eje', replace(lower(categoria::text), '_', '-'), 'slug', slug, 'titulo', titulo,
               'categoria', categoria, 'subcategoria', subcategoria, 'edicion', edicion, 'enfoques_salud', enfoques_salud,
               'idiomas', idiomas, 'idioma_principal', idioma_principal, 'duracion_min', duracion_min,
               'numero_escenas', numero_escenas, 'creado', created_at, 'portada', portada) order by slug)
        from del_hogar), '[]'::jsonb),
    'unidades', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'titulo', titulo, 'descripcion', descripcion, 'storyboards', storyboards)
                       order by orden, id)
        from unidades), '[]'::jsonb))
$$;

revoke all on function sincronizar_storyboard(jsonb) from public, anon;
grant execute on function sincronizar_storyboard(jsonb) to authenticated;
revoke all on function publicar_storyboard(uuid, estado_publicacion, text[], bigint) from public, anon;
grant execute on function publicar_storyboard(uuid, estado_publicacion, text[], bigint) to authenticated;
revoke all on function publicar_storyboard_hogar(uuid, boolean) from public, anon;
grant execute on function publicar_storyboard_hogar(uuid, boolean) to authenticated;
revoke all on function guardar_unidad_estudio(jsonb) from public, anon;
grant execute on function guardar_unidad_estudio(jsonb) to authenticated;
-- La app del hogar, sin cuenta.
revoke all on function hogar_catalogo(text) from public;
grant execute on function hogar_catalogo(text) to anon, authenticated;
