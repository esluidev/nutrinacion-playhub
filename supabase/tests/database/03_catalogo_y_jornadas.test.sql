-- El catálogo desde Player (sincronizar_storyboard y publicar_storyboard, 0007), sus reglas
-- (0003), la disponibilidad por los países de la organización y las jornadas (0004). No usa el
-- seed: crea sus propios datos (prefijo «Cat», correos @cat.test) en una transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

create schema pruebas;
grant usage on schema pruebas to anon, authenticated;

create function pruebas.como(p_usuario uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

-- ── Datos propios ─────────────────────────────────────────────────────────────
-- Centro opera en Guatemala y El Salvador; Norte, en México.
insert into organizaciones (nombre, paises) values ('Cat Centro', '{GT,SV}'), ('Cat Norte', '{MX}');
insert into organizacion_licencias (organizacion_id, fecha_inicio) select id, current_date - 30 from organizaciones where nombre like 'Cat %';
select set_config('t.centro', (select id from organizaciones where nombre = 'Cat Centro')::text, true);
select set_config('t.norte', (select id from organizaciones where nombre = 'Cat Norte')::text, true);

-- …01 superadmin · …02 admin de Centro · …03 colaborador de Centro · …04 admin de Norte
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('40000000-0000-4000-8000-000000000001'::uuid, 's@cat.test', '{}'::jsonb),
    ('40000000-0000-4000-8000-000000000002'::uuid, 'a@cat.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.centro')::bigint)),
    ('40000000-0000-4000-8000-000000000003'::uuid, 'c@cat.test',
      jsonb_build_object('role', 'COLABORADOR', 'organizacion_id', current_setting('t.centro')::bigint)),
    ('40000000-0000-4000-8000-000000000004'::uuid, 'n@cat.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.norte')::bigint))
  ) as v (id, email, app);
update perfiles set superadmin = true where email = 's@cat.test';

insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, estado_publicacion, paises_disponibles, organizacion_id) values
  ('c0000000-0000-4000-8000-000000000001', 'cat-huevo', '{"es":"Cat huevo"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO',  '{GT}', null),
  ('c0000000-0000-4000-8000-000000000002', 'cat-pan',   '{"es":"Cat pan"}',   'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO',  '{MX}', current_setting('t.norte')::bigint),
  ('c0000000-0000-4000-8000-000000000003', 'cat-soda',  '{"es":"Cat soda"}',  'ALIMENTACION', 'PROCESADOS', 'KIDS', '{es}', 'REGISTRADO', '{}',   null);
select set_config('t.sb_huevo', (select id from storyboards where slug = 'cat-huevo')::text, true);
select set_config('t.sb_pan', (select id from storyboards where slug = 'cat-pan')::text, true);
select set_config('t.sb_soda', (select id from storyboards where slug = 'cat-soda')::text, true);

insert into educadores (nombre, correo, organizacion_id) values ('María', 'maria@cat.test', current_setting('t.centro')::bigint);
select set_config('t.maria', (select id from educadores where correo = 'maria@cat.test')::text, true);

insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ('Cat Jornada Norte', 'Colegio Norte', current_date, current_date + 2, current_setting('t.norte')::bigint);
select set_config('t.jornada_norte', (select id from jornadas where nombre = 'Cat Jornada Norte')::text, true);

-- La metadata tal como la arma Player desde el JSON (sin estado ni países: eso se elige al publicar).
select set_config('t.clave', 'c0000000-0000-4000-8000-0000000000aa', true);
select set_config('t.meta', '{
  "clave": "c0000000-0000-4000-8000-0000000000aa", "slug": "cat-agua", "version_build": "0.1.0",
  "titulo": {"es": "El agua"}, "categoria": "ALIMENTACION", "subcategoria": "HIDRATACION", "edicion": "KIDS",
  "enfoques_salud": ["OBESIDAD"], "idiomas": ["es"], "idioma_principal": "es", "duracion_min": 25,
  "escenas": [{"orden": 1, "carpeta": "bienvenida", "titulo": {"es": "Bienvenida"}},
              {"orden": 2, "carpeta": "origen", "titulo": {"es": "Origen"}}]}', true);

-- ── Registro desde Player ─────────────────────────────────────────────────────
select pruebas.como('40000000-0000-4000-8000-000000000002');
select throws_ok(format('select sincronizar_storyboard(%L)', current_setting('t.meta')), '42501', null,
  'un admin de organización no registra storyboards');

select pruebas.como('40000000-0000-4000-8000-000000000001');
select is((sincronizar_storyboard(current_setting('t.meta')::jsonb))->>'nuevo', 'true', 'el superadmin lo registra');
select is((select estado_publicacion::text || ' ' || paises_disponibles::text from storyboards where slug = 'cat-agua'), 'REGISTRADO {}',
  'nace registrado y sin países');
select is((select count(*)::int from guia_escenas ge join guias g on g.id = ge.guia_id join storyboards s on s.id = g.storyboard_id
            where s.slug = 'cat-agua'), 2, 'con su guía y las escenas del JSON');

-- La taxonomía, de las listas cerradas y de su categoría.
select throws_ok(format('select sincronizar_storyboard(%L)', (current_setting('t.meta')::jsonb) || '{"subcategoria": "NUTRIENTE"}'),
  '22P02', null, 'una subcategoría mal escrita no se registra');
select throws_ok(format('select sincronizar_storyboard(%L)', (current_setting('t.meta')::jsonb) || '{"subcategoria": "HIGIENE"}'),
  '23514', null, 'ni una de otra categoría');
select throws_ok(format('select sincronizar_storyboard(%L)', (current_setting('t.meta')::jsonb) || '{"enfoques_salud": ["ASMA"]}'),
  '23514', null, 'ni un enfoque de otra categoría');
select throws_ok(format('select sincronizar_storyboard(%L)', (current_setting('t.meta')::jsonb) || '{"idiomas": ["es", "fr"]}'),
  '22P02', null, 'ni un idioma que las apps no tienen');

-- ── Publicar desde Player ─────────────────────────────────────────────────────
select pruebas.como('40000000-0000-4000-8000-000000000002');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{GT}') $$, current_setting('t.clave')), '42501', null,
  'un admin de organización no publica');
select is((select count(*)::int from storyboards where slug = 'cat-agua'), 0, 'ni ve lo registrado');

select pruebas.como('40000000-0000-4000-8000-000000000001');
select lives_ok(format($$ select publicar_storyboard(%L, 'EN_REVISION', '{}') $$, current_setting('t.clave')),
  'el equipo lo pasa a revisión');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{}') $$, current_setting('t.clave')), 'P0001', null,
  'publicar exige al menos un país');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{XX}') $$, current_setting('t.clave')), 'P0001', null,
  'del catálogo de países');
select lives_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{GT}') $$, current_setting('t.clave')),
  'Player lo publica en Guatemala');

select pruebas.como('40000000-0000-4000-8000-000000000002');
select is((select count(*)::int from storyboards where slug = 'cat-agua'), 1, 'ya lo ve la organización que opera en Guatemala');
select pruebas.como('40000000-0000-4000-8000-000000000004');
select is((select count(*)::int from storyboards where slug = 'cat-agua'), 0, 'la que opera solo en México, no');

-- Admin escribe la guía de «origen»; después Player quita «bienvenida», añade «cierre» e inglés.
select pruebas.como('40000000-0000-4000-8000-000000000001');
update guia_escenas set objetivo = '{"es":"Escrito en Admin"}'
 where carpeta = 'origen' and guia_id = (select g.id from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'cat-agua');
select is((sincronizar_storyboard((current_setting('t.meta')::jsonb) || '{
  "idiomas": ["es", "en"], "titulo": {"es": "El agua", "en": "Water"},
  "escenas": [{"orden": 1, "carpeta": "origen", "titulo": {"es": "Origen"}},
              {"orden": 2, "carpeta": "cierre", "titulo": {"es": "Cierre"}}]}'::jsonb))->>'nuevo', 'false',
  'al sincronizar de nuevo, actualiza la misma fila');
select is((select array_agg(carpeta order by orden) from guia_escenas ge join guias g on g.id = ge.guia_id
            join storyboards s on s.id = g.storyboard_id where s.slug = 'cat-agua'), array['origen', 'cierre'],
  'las escenas siguen al JSON: quita, reordena y añade');
select is((select ge.objetivo->>'es' from guia_escenas ge join guias g on g.id = ge.guia_id
            join storyboards s on s.id = g.storyboard_id where s.slug = 'cat-agua' and ge.carpeta = 'origen'), 'Escrito en Admin',
  'lo escrito en la guía se conserva');
select is((select estado_publicacion::text || ' ' || paises_disponibles::text from storyboards where slug = 'cat-agua'), 'PUBLICADO {GT}',
  'el estado y los países los decide Player al publicar: sincronizar no los toca');
select is((select idiomas::text from storyboards where slug = 'cat-agua'), '{es,en}', 'la metadata del JSON sí se actualiza');

-- ── Disponible para la organización (sus países o su personalizado) ───────────
select set_config('t.sb_agua', (select id from storyboards where slug = 'cat-agua')::text, true);
select is(disponible_para_organizacion(current_setting('t.sb_agua')::bigint, current_setting('t.centro')::bigint), true,
  'un estándar publicado en Guatemala está disponible para quien opera en Guatemala y El Salvador');
select is(disponible_para_organizacion(current_setting('t.sb_agua')::bigint, current_setting('t.norte')::bigint), false,
  'y no para quien opera solo en México');
select is(disponible_para_organizacion(current_setting('t.sb_pan')::bigint, current_setting('t.norte')::bigint), true,
  'un personalizado está disponible para su organización');
select is(disponible_para_organizacion(current_setting('t.sb_pan')::bigint, current_setting('t.centro')::bigint), false,
  'y para ninguna otra, aunque compartan país');
select is(disponible_para_organizacion(current_setting('t.sb_soda')::bigint, current_setting('t.centro')::bigint), false,
  'uno sin publicar no está disponible para nadie');

-- ── Países e idiomas en uso ───────────────────────────────────────────────────
-- Centro programa el agua en inglés, con María, y lo publica.
select pruebas.como('40000000-0000-4000-8000-000000000002');
insert into workshops (titulo, fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id)
values ('Agua en inglés', current_date + 3, '09:00', 'en', current_setting('t.sb_agua')::bigint, current_setting('t.centro')::bigint);
insert into workshop_educadores (workshop_id, educador_id)
values ((select id from workshops where titulo = 'Agua en inglés'), current_setting('t.maria')::bigint);
update workshops set estado = 'PUBLICADO' where titulo = 'Agua en inglés';

select pruebas.como('40000000-0000-4000-8000-000000000001');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{MX}') $$, current_setting('t.clave')), 'P0001', null,
  'no se deja fuera a una organización con workshops publicados por venir');
select lives_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{SV}') $$, current_setting('t.clave')),
  'pasarlo a El Salvador sí: Centro también opera ahí');
select throws_ok(format('select sincronizar_storyboard(%L)', (current_setting('t.meta')::jsonb) || '{"idiomas": ["es"]}'), 'P0001', null,
  'ni se quita un idioma con workshops publicados en él por venir');
select throws_ok(format($$ select publicar_storyboard(%L, 'REGISTRADO', '{SV}') $$, current_setting('t.clave')), 'P0001', null,
  'lo que ya se usa no se despublica');
select lives_ok(format($$ select publicar_storyboard(%L, 'ARCHIVADO', '{SV}') $$, current_setting('t.clave')), 'se archiva');
select pruebas.como('40000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id)
     values (current_date + 9, '09:00', 'es', current_setting('t.sb_agua')::bigint, current_setting('t.centro')::bigint) $$,
  'P0001', null, 'y ya no se programa');
select is((select estado::text from workshops where titulo = 'Agua en inglés'), 'PUBLICADO', 'lo ya programado se conserva');

-- ── Jornadas: un lugar y sus días ─────────────────────────────────────────────
select lives_ok(format($$ insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
                          values ('Cat Jornada', 'Escuela Las Flores', current_date + 10, current_date + 12, %s) $$,
                       current_setting('t.centro')), 'el admin crea una jornada de su organización, con su lugar y sus días');
select set_config('t.jornada', (select id from jornadas where nombre = 'Cat Jornada')::text, true);
select throws_ok(format($$ insert into jornadas (nombre, ubicacion, organizacion_id) values ('Sin días', 'Sede', %s) $$, current_setting('t.centro')),
  '23502', null, 'una jornada necesita sus fechas');
select throws_ok(format($$ insert into jornadas (nombre, fecha_inicio, fecha_fin, organizacion_id) values ('Sin lugar', current_date, current_date, %s) $$,
                        current_setting('t.centro')), '23502', null, 'y su lugar');
select throws_ok(format($$ insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id) values ('Al revés', 'Sede', current_date + 2, current_date, %s) $$,
                        current_setting('t.centro')), '23514', null, 'y que el fin no sea antes del inicio');
select lives_ok(format($$ insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id) values ('Cat Un día', 'Sede', current_date + 1, current_date + 1, %s) $$,
                       current_setting('t.centro')), 'una jornada puede durar un solo día');
select throws_ok(format($$ insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id) values ('Ajena', 'Sede', current_date, current_date, %s) $$,
                        current_setting('t.norte')), '42501', null, 'pero no de otra organización');
select throws_ok(
  format($$ insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id, jornada_id) values (current_date, 'es', %s, %s, %s) $$,
         current_setting('t.sb_huevo'), current_setting('t.centro'), current_setting('t.jornada_norte')),
  'P0001', null, 'un workshop no puede ir en la jornada de otra organización');

select pruebas.como('40000000-0000-4000-8000-000000000003');
select lives_ok(format($$ insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id) values ('Cat Del colaborador', 'Sede', current_date, current_date, %s) $$,
                       current_setting('t.centro')), 'un colaborador también crea jornadas');
select lives_ok(format($$ update jornadas set ubicacion = 'Patio' where id = %s $$, current_setting('t.jornada')), 'y las edita');

-- Un workshop dentro de una jornada cae en sus días.
select throws_ok(
  format($$ insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id, jornada_id) values (current_date + 20, 'es', %s, %s, %s) $$,
         current_setting('t.sb_huevo'), current_setting('t.centro'), current_setting('t.jornada')),
  'P0001', null, 'un workshop con fecha fuera de los días de su jornada se rechaza');
select lives_ok(
  format($$ insert into workshops (titulo, fecha, idioma_contenido, storyboard_id, organizacion_id, jornada_id) values ('Cat dentro', current_date + 11, 'es', %s, %s, %s) $$,
         current_setting('t.sb_huevo'), current_setting('t.centro'), current_setting('t.jornada')),
  'uno dentro de sus días, sí');
select lives_ok(
  format($$ insert into workshops (titulo, idioma_contenido, storyboard_id, organizacion_id, jornada_id) values ('Cat sin fecha', 'es', %s, %s, %s) $$,
         current_setting('t.sb_huevo'), current_setting('t.centro'), current_setting('t.jornada')),
  'y un borrador sin fecha también (la fecha se comprueba cuando la tenga)');
select throws_ok(format($$ update jornadas set fecha_inicio = current_date + 12, fecha_fin = current_date + 14 where id = %s $$, current_setting('t.jornada')),
  'P0001', null, 'la jornada no cambia de días si deja fuera a un workshop suyo');
select lives_ok(format($$ update jornadas set fecha_inicio = current_date + 10, fecha_fin = current_date + 14 where id = %s $$, current_setting('t.jornada')),
  'si todos siguen dentro, sí');
select throws_ok($$ update workshops set fecha = current_date + 15 where titulo = 'Cat dentro' $$,
  'P0001', null, 'ni el workshop se mueve a un día fuera de su jornada');
update workshops set estado = 'ARCHIVADO' where titulo = 'Cat dentro';
select lives_ok(format($$ update jornadas set fecha_inicio = current_date + 12, fecha_fin = current_date + 14 where id = %s $$, current_setting('t.jornada')),
  'un workshop archivado (descartado) ya no ata a la jornada');

-- Una jornada existe mientras tiene workshops.
insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ('Cat Efímera', 'Patio', current_date + 30, current_date + 31, current_setting('t.centro')::bigint);
select set_config('t.efimera', (select id from jornadas where nombre = 'Cat Efímera')::text, true);
insert into workshops (titulo, fecha, idioma_contenido, storyboard_id, organizacion_id, jornada_id)
select t, current_date + 30, 'es', current_setting('t.sb_huevo')::bigint, current_setting('t.centro')::bigint, current_setting('t.efimera')::bigint
  from unnest(array['Cat Efímera 1', 'Cat Efímera 2']) t;
delete from workshops where titulo = 'Cat Efímera 1';
select is((select count(*)::int from jornadas where id = current_setting('t.efimera')::bigint), 1,
  'si se borra uno de sus workshops, la jornada sigue');
update workshops set jornada_id = null where titulo = 'Cat Efímera 2';
select is((select count(*)::int from jornadas where id = current_setting('t.efimera')::bigint), 0,
  'si su último workshop sale de ella, la jornada se borra sola');
insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ('Cat Efímera B', 'Patio', current_date + 30, current_date + 30, current_setting('t.centro')::bigint);
update workshops set jornada_id = (select id from jornadas where nombre = 'Cat Efímera B') where titulo = 'Cat Efímera 2';
delete from workshops where titulo = 'Cat Efímera 2';
select is((select count(*)::int from jornadas where nombre = 'Cat Efímera B'), 0,
  'y también si su último workshop se borra');
select lives_ok(format($$ delete from jornadas where id = %s $$, current_setting('t.jornada')),
  'borrar una jornada a mano se puede');
select is((select count(*)::int from workshops where titulo = 'Cat sin fecha' and jornada_id is null), 1,
  'y sus workshops quedan sueltos');

select * from finish();
rollback;
