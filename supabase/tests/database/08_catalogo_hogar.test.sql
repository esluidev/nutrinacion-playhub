-- El catálogo de la app del hogar (tarea 022): la marca «publicado en el hogar» del storyboard, sus
-- reglas, las unidades de estudio y lo que lee la app sin cuenta (`hogar_catalogo`). No usa el seed:
-- crea sus propios datos (prefijo «hg-», correos @hg.test) en una transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

create schema pruebas;
grant usage on schema pruebas to anon, authenticated;

create function pruebas.como(p_usuario uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create function pruebas.como_anon() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

-- ── Datos propios ─────────────────────────────────────────────────────────────
insert into organizaciones (nombre, paises) values ('HG Centro', '{GT}');
select set_config('t.org', (select id from organizaciones where nombre = 'HG Centro')::text, true);

-- …01 superadmin · …02 admin de HG Centro
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('80000000-0000-4000-8000-000000000001'::uuid, 's@hg.test', '{}'::jsonb),
    ('80000000-0000-4000-8000-000000000002'::uuid, 'a@hg.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.org')::bigint))
  ) as v (id, email, app);
update perfiles set superadmin = true where email = 's@hg.test';

-- hg-huevo y hg-leche publicados en Guatemala (la leche, también en México); hg-propio, personalizado; hg-nuevo, solo registrado.
insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, duracion_min, numero_escenas, estado_publicacion, paises_disponibles, organizacion_id)
values
  ('d0000000-0000-4000-8000-000000000001', 'hg-huevo', '{"es":"El huevo"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 30, 4, 'PUBLICADO', '{GT}', null),
  ('d0000000-0000-4000-8000-000000000002', 'hg-leche', '{"es":"La leche"}', 'ALIMENTACION', 'NUTRIENTES', 'PREADOLESCENTES', '{es}', 25, 5, 'PUBLICADO', '{GT,MX}', null),
  ('d0000000-0000-4000-8000-000000000003', 'hg-propio', '{"es":"El nuestro"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 20, 3, 'PUBLICADO', '{GT}', current_setting('t.org')::bigint),
  ('d0000000-0000-4000-8000-000000000004', 'hg-nuevo', '{"es":"Lo nuevo"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 20, 3, 'REGISTRADO', '{}', null);

-- ── Publicar en el hogar ──────────────────────────────────────────────────────
select pruebas.como('80000000-0000-4000-8000-000000000002');
select throws_ok($$ select publicar_storyboard_hogar('d0000000-0000-4000-8000-000000000001', true) $$, '42501', null,
  'el admin de una organización no publica en el hogar');
select throws_ok($$ select guardar_unidad_estudio('{"titulo": {"es": "X"}}') $$, '42501', null, 'ni crea unidades');
select is((select count(*)::int from unidades_estudio), 0, 'ni las ve');

select pruebas.como('80000000-0000-4000-8000-000000000001');
select lives_ok($$ select publicar_storyboard_hogar('d0000000-0000-4000-8000-000000000001', true) $$, 'el superadmin lo publica en el hogar');
select lives_ok($$ select publicar_storyboard_hogar('d0000000-0000-4000-8000-000000000002', true) $$, 'y otro');
select throws_ok($$ select publicar_storyboard_hogar('d0000000-0000-4000-8000-000000000003', true) $$, 'P0001', null,
  'un personalizado no sale en el hogar: solo el contenido de Nutrinación');
select throws_ok($$ select publicar_storyboard_hogar('d0000000-0000-4000-8000-000000000004', true) $$, 'P0001', null,
  'uno sin publicar, tampoco');
select throws_ok($$ select publicar_storyboard_hogar('d0000000-0000-4000-8000-000000000009', true) $$, 'P0002', null,
  'ni uno que no está registrado');

-- ── Unidades de estudio ───────────────────────────────────────────────────────
select set_config('t.unidad', guardar_unidad_estudio(jsonb_build_object(
  'titulo', '{"es": "Ganando músculos"}'::jsonb, 'descripcion', '{"es": "Proteínas para crecer"}'::jsonb, 'publicada', false,
  'storyboards', jsonb_build_array((select id from storyboards where slug = 'hg-leche'), (select id from storyboards where slug = 'hg-huevo'))))::text, true);
select is((select array_agg(s.slug order by us.orden) from unidad_estudio_storyboards us join storyboards s on s.id = us.storyboard_id
            where us.unidad_estudio_id = current_setting('t.unidad')::bigint), '{hg-leche,hg-huevo}'::text[],
  'el superadmin crea una unidad con sus storyboards en orden');
select throws_ok(format('select guardar_unidad_estudio(%L)', jsonb_build_object('id', current_setting('t.unidad')::bigint,
    'titulo', '{"es": "Ganando músculos"}'::jsonb, 'storyboards', jsonb_build_array((select id from storyboards where slug = 'hg-nuevo')))),
  '23514', null, 'a una unidad solo entran storyboards publicados en el hogar');
select lives_ok(format('select guardar_unidad_estudio(%L)', jsonb_build_object('id', current_setting('t.unidad')::bigint,
    'titulo', '{"es": "Ganando músculos"}'::jsonb, 'publicada', true,
    'storyboards', jsonb_build_array((select id from storyboards where slug = 'hg-huevo'), (select id from storyboards where slug = 'hg-leche')))),
  'se reordena y se publica');
select is((select array_agg(s.slug order by us.orden) from unidad_estudio_storyboards us join storyboards s on s.id = us.storyboard_id
            where us.unidad_estudio_id = current_setting('t.unidad')::bigint), '{hg-huevo,hg-leche}'::text[], 'con el orden nuevo');
select throws_ok($$ select guardar_unidad_estudio('{"titulo": {}, "publicada": true}') $$, '23514', null,
  'una unidad sin título no se publica');
select set_config('t.borrador', guardar_unidad_estudio(jsonb_build_object('titulo', '{"es": "En preparación"}'::jsonb,
  'storyboards', jsonb_build_array((select id from storyboards where slug = 'hg-huevo'))))::text, true);

-- ── Lo que lee la app sin cuenta ──────────────────────────────────────────────
select pruebas.como_anon();
select set_config('t.gt', hogar_catalogo('gt')::text, true);
select is((select array_agg(e->>'slug' order by e->>'slug') from jsonb_array_elements(current_setting('t.gt')::jsonb->'storyboards') e),
  '{hg-huevo,hg-leche}'::text[], 'sin cuenta, los storyboards del hogar en Guatemala (también sueltos)');
select is(jsonb_array_length(current_setting('t.gt')::jsonb->'unidades'), 1, 'y solo las unidades publicadas');
select is((current_setting('t.gt')::jsonb->'unidades'->0->'storyboards'), '["d0000000-0000-4000-8000-000000000001", "d0000000-0000-4000-8000-000000000002"]'::jsonb,
  'con sus storyboards en orden, por clave');
select is((current_setting('t.gt')::jsonb->'storyboards'->0->>'eje'), 'alimentacion', 'con lo que necesita para abrirlos');
select is((select array_agg(e->>'slug') from jsonb_array_elements(hogar_catalogo('MX')->'storyboards') e), '{hg-leche}'::text[],
  'en México, solo lo que está en México');
select is((hogar_catalogo('MX')->'unidades'->0->'storyboards'), '["d0000000-0000-4000-8000-000000000002"]'::jsonb,
  'y la unidad, solo con lo de México');
select is(jsonb_array_length(hogar_catalogo('CR')->'unidades'), 0, 'una unidad sin storyboards en ese país no sale');
select is((select count(*)::int from unidades_estudio), 0, 'anon no lee las unidades directo');

-- ── Archivar o pasar a personalizado lo saca del hogar ────────────────────────
reset role;
update storyboards set estado_publicacion = 'ARCHIVADO' where slug = 'hg-leche';
select is((select publicado_hogar from storyboards where slug = 'hg-leche'), false, 'al archivarlo, sale del hogar');
update storyboards set organizacion_id = current_setting('t.org')::bigint where slug = 'hg-huevo';
select is((select publicado_hogar from storyboards where slug = 'hg-huevo'), false, 'al pasar a personalizado, también');
select pruebas.como_anon();
select is(hogar_catalogo('GT'), '{"storyboards": [], "unidades": []}'::jsonb, 'y la app ya no los ve, ni sueltos ni en su unidad');

select * from finish();
rollback;
