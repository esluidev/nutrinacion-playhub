-- El catálogo desde Player (sincronizar_storyboard y publicar_storyboard, 0007), sus reglas
-- (0003) y las jornadas de la organización.
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

create schema pruebas;
grant usage on schema pruebas to anon, authenticated;

create function pruebas.como(p_usuario uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

-- uuid del seed: …0001 superadmin · …0002 admin de Centro · …0003 colaborador de Centro · …0004 admin de Norte
select set_config('t.org_centro', (select id from organizaciones where nombre = 'Fundación Centro')::text, true);
select set_config('t.org_norte', (select id from organizaciones where nombre = 'Colegio Norte')::text, true);
select set_config('t.comunidad_centro', (select id from comunidades where nombre = 'Comunidad Centro')::text, true);
select set_config('t.sb_huevo', (select id from storyboards where slug = 'el-huevo')::text, true);
select set_config('t.maria', (select id from educadores where correo = 'maria@ejemplo.test')::text, true);
insert into jornadas (nombre, organizacion_id) values ('Jornada de Norte', current_setting('t.org_norte')::bigint);
select set_config('t.jornada_norte', (select id from jornadas where nombre = 'Jornada de Norte')::text, true);

-- La metadata tal como la arma Player desde el JSON (sin estado ni países: eso se elige al publicar).
select set_config('t.clave', '1f0c3b2a-9d8e-4f7a-8b6c-5d4e3f2a1b0c', true);
select set_config('t.meta', '{
  "clave": "1f0c3b2a-9d8e-4f7a-8b6c-5d4e3f2a1b0c", "slug": "el-agua", "version_build": "0.1.0",
  "titulo": {"es": "El agua"}, "categoria": "ALIMENTACION", "subcategoria": "HIDRATACION", "edicion": "KIDS",
  "enfoques_salud": ["OBESIDAD"], "idiomas": ["es"], "idioma_principal": "es", "duracion_min": 25,
  "escenas": [{"orden": 1, "carpeta": "bienvenida", "titulo": {"es": "Bienvenida"}},
              {"orden": 2, "carpeta": "origen", "titulo": {"es": "Origen"}}]}', true);

-- ── Registro desde Player ─────────────────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000002');
select throws_ok(format('select sincronizar_storyboard(%L)', current_setting('t.meta')), '42501', null,
  'un admin de organización no registra storyboards');

select pruebas.como('00000000-0000-4000-8000-000000000001');
select is((sincronizar_storyboard(current_setting('t.meta')::jsonb))->>'nuevo', 'true', 'el superadmin lo registra');
select is((select estado_publicacion::text || ' ' || paises_disponibles::text from storyboards where slug = 'el-agua'), 'REGISTRADO {}',
  'nace registrado y sin países');
select is((select count(*)::int from guia_escenas ge join guias g on g.id = ge.guia_id join storyboards s on s.id = g.storyboard_id
            where s.slug = 'el-agua'), 2, 'con su guía y las escenas del JSON');

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
select pruebas.como('00000000-0000-4000-8000-000000000002');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{GT}') $$, current_setting('t.clave')), '42501', null,
  'un admin de organización no publica');
select is((select count(*)::int from storyboards where slug = 'el-agua'), 0, 'ni ve lo registrado');

select pruebas.como('00000000-0000-4000-8000-000000000001');
select lives_ok(format($$ select publicar_storyboard(%L, 'EN_REVISION', '{}') $$, current_setting('t.clave')),
  'el equipo lo pasa a revisión');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{}') $$, current_setting('t.clave')), 'P0001', null,
  'publicar exige al menos un país');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{XX}') $$, current_setting('t.clave')), 'P0001', null,
  'del catálogo de países');
select lives_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{GT}') $$, current_setting('t.clave')),
  'Player lo publica en Guatemala');

select pruebas.como('00000000-0000-4000-8000-000000000002');
select is((select count(*)::int from storyboards where slug = 'el-agua'), 1, 'ya lo ven las organizaciones');

-- Admin escribe la guía de «origen»; después Player quita «bienvenida», añade «cierre» e inglés.
select pruebas.como('00000000-0000-4000-8000-000000000001');
update guia_escenas set objetivo = '{"es":"Escrito en Admin"}'
 where carpeta = 'origen' and guia_id = (select g.id from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'el-agua');
select is((sincronizar_storyboard((current_setting('t.meta')::jsonb) || '{
  "idiomas": ["es", "en"], "titulo": {"es": "El agua", "en": "Water"},
  "escenas": [{"orden": 1, "carpeta": "origen", "titulo": {"es": "Origen"}},
              {"orden": 2, "carpeta": "cierre", "titulo": {"es": "Cierre"}}]}'::jsonb))->>'nuevo', 'false',
  'al sincronizar de nuevo, actualiza la misma fila');
select is((select array_agg(carpeta order by orden) from guia_escenas ge join guias g on g.id = ge.guia_id
            join storyboards s on s.id = g.storyboard_id where s.slug = 'el-agua'), array['origen', 'cierre'],
  'las escenas siguen al JSON: quita, reordena y añade');
select is((select ge.objetivo->>'es' from guia_escenas ge join guias g on g.id = ge.guia_id
            join storyboards s on s.id = g.storyboard_id where s.slug = 'el-agua' and ge.carpeta = 'origen'), 'Escrito en Admin',
  'lo escrito en la guía se conserva');
select is((select estado_publicacion::text || ' ' || paises_disponibles::text from storyboards where slug = 'el-agua'), 'PUBLICADO {GT}',
  'el estado y los países los decide Player al publicar: sincronizar no los toca');
select is((select idiomas::text from storyboards where slug = 'el-agua'), '{es,en}', 'la metadata del JSON sí se actualiza');

-- ── Países e idiomas en uso ───────────────────────────────────────────────────
-- Fundación Centro programa el agua en inglés, en Comunidad Centro (GT), con María.
select pruebas.como('00000000-0000-4000-8000-000000000002');
insert into workshops (titulo, fecha, hora_inicio, idioma_contenido, storyboard_id, comunidad_id)
values ('Agua en inglés', current_date + 3, '09:00', 'en', (select id from storyboards where slug = 'el-agua'),
        current_setting('t.comunidad_centro')::bigint);
insert into workshop_educadores (workshop_id, educador_id)
values ((select id from workshops where titulo = 'Agua en inglés'), current_setting('t.maria')::bigint);
update workshops set estado = 'PUBLICADO' where titulo = 'Agua en inglés';

select pruebas.como('00000000-0000-4000-8000-000000000001');
select throws_ok(format($$ select publicar_storyboard(%L, 'PUBLICADO', '{MX}') $$, current_setting('t.clave')), 'P0001', null,
  'no se le quita un país con workshops publicados ahí por venir');
select throws_ok(format('select sincronizar_storyboard(%L)', (current_setting('t.meta')::jsonb) || '{"idiomas": ["es"]}'), 'P0001', null,
  'ni un idioma con workshops publicados en él por venir');
select throws_ok(format($$ select publicar_storyboard(%L, 'REGISTRADO', '{GT}') $$, current_setting('t.clave')), 'P0001', null,
  'lo que ya se usa no se despublica');
select lives_ok(format($$ select publicar_storyboard(%L, 'ARCHIVADO', '{GT}') $$, current_setting('t.clave')), 'se archiva');
select pruebas.como('00000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, comunidad_id)
     values (current_date + 9, '09:00', 'es', (select id from storyboards where slug = 'el-agua'),
             current_setting('t.comunidad_centro')::bigint) $$,
  'P0001', null, 'y ya no se programa');
select is((select estado::text from workshops where titulo = 'Agua en inglés'), 'PUBLICADO', 'lo ya programado se conserva');

-- ── Jornadas ──────────────────────────────────────────────────────────────────
select lives_ok(format($$ insert into jornadas (nombre, enfoque_salud, organizacion_id) values ('Semana del agua', 'OBESIDAD', %s) $$,
                       current_setting('t.org_centro')), 'el admin crea jornadas de su organización');
select throws_ok(format($$ insert into jornadas (nombre, organizacion_id) values ('Ajena', %s) $$, current_setting('t.org_norte')),
  '42501', null, 'pero no de otra organización');
select throws_ok(format($$ insert into jornadas (nombre, enfoque_salud, organizacion_id) values ('Mal', 'DIABETIS', %s) $$,
                        current_setting('t.org_centro')),
  '22P02', null, 'el enfoque de la jornada es de la lista cerrada');
select throws_ok(
  format($$ insert into workshops (fecha, idioma_contenido, storyboard_id, comunidad_id, jornada_id)
            values (current_date, 'es', %s, %s, %s) $$,
         current_setting('t.sb_huevo'), current_setting('t.comunidad_centro'), current_setting('t.jornada_norte')),
  'P0001', null, 'un workshop no puede ir en la jornada de otra organización');

select pruebas.como('00000000-0000-4000-8000-000000000003');
select throws_ok(format($$ insert into jornadas (nombre, organizacion_id) values ('Del colaborador', %s) $$, current_setting('t.org_centro')),
  '42501', null, 'un colaborador no crea jornadas');
select is((select count(*)::int from jornadas where nombre = 'Semana de la nutrición'), 1, 'pero sí las ve');

select * from finish();
rollback;
