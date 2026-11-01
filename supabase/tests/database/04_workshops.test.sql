-- El ciclo del workshop (0004): borrador, en revisión, publicado, finalizado, cancelado y
-- archivado; reprogramar; qué se programa según los países de la organización y el idioma; y a
-- quién se asigna. No usa el seed: crea sus propios datos (prefijo «WS», correos @ws.test) en una
-- transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

create schema pruebas;
grant usage on schema pruebas to anon, authenticated;

create function pruebas.como(p_usuario uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

-- Cuántas filas tocó una sentencia: la RLS no falla en update y delete, solo deja fuera las filas.
create function pruebas.afectadas(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;

-- ── Datos propios ─────────────────────────────────────────────────────────────
insert into organizaciones (nombre, paises) values ('WS Centro', '{GT}'), ('WS Norte', '{GT}');
insert into organizacion_licencias (organizacion_id, fecha_inicio) select id, current_date - 30 from organizaciones where nombre like 'WS %';
select set_config('t.centro', (select id from organizaciones where nombre = 'WS Centro')::text, true);
select set_config('t.norte', (select id from organizaciones where nombre = 'WS Norte')::text, true);

-- …01 superadmin · …02 admin de Centro · …03 colaborador de Centro
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('50000000-0000-4000-8000-000000000001'::uuid, 's@ws.test', '{}'::jsonb),
    ('50000000-0000-4000-8000-000000000002'::uuid, 'a@ws.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.centro')::bigint)),
    ('50000000-0000-4000-8000-000000000003'::uuid, 'c@ws.test',
      jsonb_build_object('role', 'COLABORADOR', 'organizacion_id', current_setting('t.centro')::bigint))
  ) as v (id, email, app);
update perfiles set superadmin = true where email = 's@ws.test';

insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, estado_publicacion, paises_disponibles) values
  ('d0000000-0000-4000-8000-000000000001', 'ws-huevo',  '{"es":"WS huevo"}',  'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO', '{GT}'),
  ('d0000000-0000-4000-8000-000000000002', 'ws-mexico', '{"es":"WS México"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO', '{MX}');
select set_config('t.sb', (select id from storyboards where slug = 'ws-huevo')::text, true);
select set_config('t.sb_mx', (select id from storyboards where slug = 'ws-mexico')::text, true);

-- Educadores de Centro: María y Lucía activas, Inés apartada, Beto dado de baja; Pedro, de Norte.
insert into educadores (nombre, correo, activo, deleted_at, organizacion_id) values
  ('María', 'maria@ws.test', true, null, current_setting('t.centro')::bigint),
  ('Lucía', 'lucia@ws.test', true, null, current_setting('t.centro')::bigint),
  ('Inés', 'ines@ws.test', false, null, current_setting('t.centro')::bigint),
  ('Beto', 'beto@ws.test', true, now(), current_setting('t.centro')::bigint),
  ('Pedro', 'pedro@ws.test', true, null, current_setting('t.norte')::bigint);
select set_config('t.maria', (select id from educadores where correo = 'maria@ws.test')::text, true);
select set_config('t.lucia', (select id from educadores where correo = 'lucia@ws.test')::text, true);
select set_config('t.ines', (select id from educadores where correo = 'ines@ws.test')::text, true);
select set_config('t.beto', (select id from educadores where correo = 'beto@ws.test')::text, true);
select set_config('t.pedro', (select id from educadores where correo = 'pedro@ws.test')::text, true);

insert into educador_grupos (nombre, organizacion_id) values ('WS Equipo', current_setting('t.centro')::bigint), ('WS Equipo Norte', current_setting('t.norte')::bigint);
select set_config('t.grupo', (select id from educador_grupos where nombre = 'WS Equipo')::text, true);
select set_config('t.grupo_norte', (select id from educador_grupos where nombre = 'WS Equipo Norte')::text, true);
insert into educador_grupo_miembros (educador_grupo_id, educador_id) values (current_setting('t.grupo')::bigint, current_setting('t.maria')::bigint);

-- Un workshop nuevo de Centro, en borrador (devuelve su id), y asignarle a María.
create function pruebas.nuevo(p_titulo text, p_dias int) returns bigint language sql as $$
  insert into workshops (titulo, fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id)
  values (p_titulo, current_date + p_dias, '09:00', 'es', current_setting('t.sb')::bigint, current_setting('t.centro')::bigint)
  returning id
$$;
create function pruebas.asignar(p_workshop bigint) returns void language sql as $$
  insert into workshop_educadores (workshop_id, educador_id) values (p_workshop, current_setting('t.maria')::bigint)
$$;
grant execute on all functions in schema pruebas to authenticated;

-- El colaborador de Centro arma los workshops.
select pruebas.como('50000000-0000-4000-8000-000000000003');

-- ── Nacer, revisar y publicar ─────────────────────────────────────────────────
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, estado, storyboard_id, organizacion_id)
     values (current_date + 7, '09:00', 'es', 'PUBLICADO', current_setting('t.sb')::bigint, current_setting('t.centro')::bigint) $$,
  'P0001', null, 'un workshop no nace publicado');
select set_config('t.w', pruebas.nuevo('W 2.º B', 7)::text, true);
select is((select estado::text from workshops where id = current_setting('t.w')::bigint), 'BORRADOR', 'nace en borrador');
select throws_ok(format($$ update workshops set estado = 'PUBLICADO' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'no se publica sin educador');
select pruebas.asignar(current_setting('t.w')::bigint);
select lives_ok(format($$ update workshops set estado = 'EN_REVISION' where id = %s $$, current_setting('t.w')),
  'con María asignada, se manda a revisión');
select pruebas.como('50000000-0000-4000-8000-000000000002');
select lives_ok(format($$ update workshops set estado = 'PUBLICADO' where id = %s $$, current_setting('t.w')),
  'el admin lo revisa y lo publica');
select isnt((select publicado_en from workshops where id = current_setting('t.w')::bigint), null, 'queda la fecha de publicación');
select throws_ok(format($$ update workshops set estado = 'BORRADOR' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'publicado no vuelve a borrador');
select throws_ok(format($$ update workshops set hora_inicio = null where id = %s $$, current_setting('t.w')), 'P0001', null,
  'publicado, no se queda sin hora');
select lives_ok(format($$ update workshops set ubicacion = 'Aula 4', grupo_asistente = '2.º C' where id = %s $$, current_setting('t.w')),
  'sus datos se editan sin despublicarlo');

-- ── Cambiar de educador en uno publicado ──────────────────────────────────────
select throws_ok(format($$ delete from workshop_educadores where workshop_id = %s $$, current_setting('t.w')), 'P0001', null,
  'publicado, no se queda sin educador');
select lives_ok(format($$ insert into workshop_educadores (workshop_id, educador_id) values (%s, %s) $$, current_setting('t.w'), current_setting('t.lucia')),
  'se asigna a Lucía');
select lives_ok(format($$ delete from workshop_educadores where workshop_id = %s and educador_id = %s $$, current_setting('t.w'), current_setting('t.maria')),
  'y entonces se quita a María');

-- ── Cancelar y reprogramar ────────────────────────────────────────────────────
select set_config('t.w2', pruebas.nuevo('W lluvia', 3)::text, true);
select pruebas.asignar(current_setting('t.w2')::bigint);
update workshops set estado = 'PUBLICADO' where id = current_setting('t.w2')::bigint;
select lives_ok(format($$ update workshops set estado = 'CANCELADO', motivo_cancelacion = 'Lluvia' where id = %s $$, current_setting('t.w2')),
  'uno publicado y sin empezar se cancela');
select throws_ok(format($$ update workshops set estado = 'PUBLICADO', fecha = current_date - 1 where id = %s $$, current_setting('t.w2')),
  'P0001', null, 'reprogramar a una fecha pasada no vale');
select lives_ok(format($$ update workshops set estado = 'PUBLICADO', fecha = current_date + 10 where id = %s $$, current_setting('t.w2')),
  'se reprograma a otra fecha');
select is((select reprogramaciones || ' ' || coalesce(motivo_cancelacion, '-') from workshops where id = current_setting('t.w2')::bigint),
  '1 -', 'cuenta la reprogramación y limpia la cancelación');

-- ── Empezar, finalizar y archivar ─────────────────────────────────────────────
reset role;
update workshop_educadores set iniciado_en = now(), estado = 'EN_CURSO' where workshop_id = current_setting('t.w')::bigint;
select pruebas.como('50000000-0000-4000-8000-000000000002');
select throws_ok(format($$ update workshops set estado = 'CANCELADO' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'lo que ya se empezó no se cancela');
select throws_ok(format($$ update workshops set estado = 'ARCHIVADO' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'ni se archiva mientras está publicado');

-- La tarea horaria finaliza lo publicado que ya pasó (también uno de hace tres días que nadie empezó).
reset role;
update workshops set fecha = current_date - 2 where id in (current_setting('t.w')::bigint, current_setting('t.w2')::bigint);
select set_config('t.w5', pruebas.nuevo('W pasado', -3)::text, true);
select pruebas.asignar(current_setting('t.w5')::bigint);
update workshops set estado = 'PUBLICADO' where id = current_setting('t.w5')::bigint;
select cmp_ok(finalizar_workshops_vencidos(), '>=', 3, 'la tarea horaria finaliza lo que ya pasó');
select is((select array_agg(estado::text order by id) from workshops where id in (current_setting('t.w')::bigint, current_setting('t.w2')::bigint, current_setting('t.w5')::bigint)),
  array['FINALIZADO', 'FINALIZADO', 'FINALIZADO'], 'los tres quedan finalizados');
select pruebas.como('50000000-0000-4000-8000-000000000002');
select throws_ok(format($$ update workshops set estado = 'PUBLICADO', fecha = current_date + 5 where id = %s $$, current_setting('t.w')),
  'P0001', null, 'lo que ya se dio (se empezó) no se reprograma: se crea uno nuevo');
select lives_ok(format($$ update workshops set estado = 'PUBLICADO', fecha = current_date + 5 where id = %s $$, current_setting('t.w2')),
  'lo que no se dio, sí');
reset role;
select throws_ok(format($$ update workshop_educadores set iniciado_en = now() where workshop_id = %s $$, current_setting('t.w5')),
  'P0001', null, 'un educador no empieza uno finalizado');
select pruebas.como('50000000-0000-4000-8000-000000000002');
select lives_ok(format($$ update workshops set estado = 'ARCHIVADO' where id = %s $$, current_setting('t.w')),
  'uno finalizado se archiva (descartado)');
select throws_ok(format($$ update workshops set notas = 'x' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'un archivado no se modifica');
select set_config('t.w3', pruebas.nuevo('W idea', 30)::text, true);
select lives_ok(format($$ update workshops set estado = 'ARCHIVADO' where id = %s $$, current_setting('t.w3')),
  'un borrador también se descarta archivándolo');

-- ── Qué se programa: los países de la organización y el idioma ────────────────
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id)
     values (current_date + 4, '09:00', 'en', current_setting('t.sb')::bigint, current_setting('t.centro')::bigint) $$,
  'P0001', null, 'no se programa en un idioma que el storyboard no tiene');
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id)
     values (current_date + 4, '09:00', 'es', current_setting('t.sb_mx')::bigint, current_setting('t.centro')::bigint) $$,
  'P0001', null, 'ni un storyboard publicado solo en México para una organización que opera en Guatemala');
select is(pruebas.afectadas(format($$ update organizaciones set paises = '{GT,MX}' where id = %s $$, current_setting('t.centro'))), 0,
  'los países de la organización los cambia el superadmin, no el admin');
select pruebas.como('50000000-0000-4000-8000-000000000001');
select throws_ok(format($$ update organizaciones set paises = '{GT,XX}' where id = %s $$, current_setting('t.centro')),
  'P0001', null, 'y solo con códigos del catálogo');
select throws_ok(format($$ update organizaciones set paises = '{}' where id = %s $$, current_setting('t.centro')),
  '23514', null, 'una organización opera al menos en un país');
select lives_ok(format($$ update organizaciones set paises = '{GT,MX}' where id = %s $$, current_setting('t.centro')),
  'el superadmin amplía la organización a México');
select pruebas.como('50000000-0000-4000-8000-000000000002');
select lives_ok(
  $$ insert into workshops (titulo, fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id)
     values ('W México', current_date + 4, '09:00', 'es', current_setting('t.sb_mx')::bigint, current_setting('t.centro')::bigint) $$,
  'y entonces el storyboard de México sí se programa');

-- ── A quién se asigna ─────────────────────────────────────────────────────────
select set_config('t.w4', pruebas.nuevo('W equipo', 6)::text, true);
select throws_ok(format($$ insert into workshop_educadores (workshop_id, educador_id) values (%s, %s) $$, current_setting('t.w4'), current_setting('t.ines')),
  'P0001', null, 'no se asigna a un educador apartado (activo = false)');
select throws_ok(format($$ insert into workshop_educadores (workshop_id, educador_id) values (%s, %s) $$, current_setting('t.w4'), current_setting('t.beto')),
  'P0001', null, 'ni a uno dado de baja');
select throws_ok(format($$ insert into workshop_educadores (workshop_id, educador_id) values (%s, %s) $$, current_setting('t.w4'), current_setting('t.pedro')),
  '23503', null, 'ni a uno de otra organización');
select lives_ok(format($$ insert into workshop_educadores (workshop_id, educador_id, educador_grupo_id) values (%s, %s, %s) $$,
                       current_setting('t.w4'), current_setting('t.maria'), current_setting('t.grupo')),
  'se asigna a María recordando de qué grupo vino');
select throws_ok(format($$ insert into workshop_educadores (workshop_id, educador_id, educador_grupo_id) values (%s, %s, %s) $$,
                        current_setting('t.w4'), current_setting('t.lucia'), current_setting('t.grupo_norte')),
  'P0001', null, 'pero no desde un grupo de otra organización');
select throws_ok(format($$ insert into educador_grupo_miembros (educador_grupo_id, educador_id) values (%s, %s) $$, current_setting('t.grupo'), current_setting('t.pedro')),
  '23503', null, 'un grupo solo tiene educadores de su organización');
select lives_ok(format($$ insert into educador_grupo_miembros (educador_grupo_id, educador_id) values (%s, %s) $$, current_setting('t.grupo'), current_setting('t.lucia')),
  'Lucía entra al equipo');

-- ── Borrar: el workshop se lleva sus asignaciones; el educador, no si deja uno publicado sin nadie ─
update workshops set estado = 'PUBLICADO' where id = current_setting('t.w4')::bigint;
select throws_ok(format($$ delete from educadores where id = %s $$, current_setting('t.maria')), 'P0001', null,
  'no se borra a un educador que es el único de un workshop publicado (se aparta o se reasigna)');
select lives_ok(format($$ delete from workshops where id = %s $$, current_setting('t.w4')),
  'borrar el workshop publicado sí: se van sus asignaciones con él');
update workshops set estado = 'CANCELADO', motivo_cancelacion = 'Se suspende' where id = current_setting('t.w2')::bigint;
select lives_ok(format($$ delete from educadores where id = %s $$, current_setting('t.maria')),
  'y entonces María, sin workshops publicados (el otro suyo se canceló), se puede borrar');

select * from finish();
rollback;
