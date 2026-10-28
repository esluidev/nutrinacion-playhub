-- El ciclo del workshop (0004): borrador, en revisión, publicado, finalizado, cancelado y
-- archivado; reprogramar; y qué se programa según el país y el idioma.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

create schema pruebas;
grant usage on schema pruebas to anon, authenticated;

create function pruebas.como(p_usuario uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

-- Un workshop nuevo de María en Comunidad Centro, en borrador (devuelve su id).
create function pruebas.nuevo(p_titulo text, p_dias int) returns bigint language sql as $$
  insert into workshops (titulo, fecha, hora_inicio, idioma_contenido, storyboard_id, comunidad_id)
  values (p_titulo, current_date + p_dias, '09:00', 'es', (select id from storyboards where slug = 'el-huevo'),
          (select id from comunidades where nombre = 'Comunidad Centro'))
  returning id
$$;
create function pruebas.asignar(p_workshop bigint) returns void language sql as $$
  insert into workshop_educadores (workshop_id, educador_id)
  values (p_workshop, (select id from educadores where correo = 'maria@ejemplo.test'))
$$;
grant execute on all functions in schema pruebas to authenticated;

-- El colaborador de Comunidad Centro arma los workshops.
select pruebas.como('00000000-0000-4000-8000-000000000003');

-- ── Nacer, revisar y publicar ─────────────────────────────────────────────────
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, estado, storyboard_id, comunidad_id)
     values (current_date + 7, '09:00', 'es', 'PUBLICADO', (select id from storyboards where slug = 'el-huevo'),
             (select id from comunidades where nombre = 'Comunidad Centro')) $$,
  'P0001', null, 'un workshop no nace publicado');
select set_config('t.w', pruebas.nuevo('W 2.º B', 7)::text, true);
select is((select estado::text from workshops where id = current_setting('t.w')::bigint), 'BORRADOR', 'nace en borrador');
select throws_ok(format($$ update workshops set estado = 'PUBLICADO' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'no se publica sin educador');
select pruebas.asignar(current_setting('t.w')::bigint);
select lives_ok(format($$ update workshops set estado = 'EN_REVISION' where id = %s $$, current_setting('t.w')),
  'con María asignada, se manda a revisión');
select pruebas.como('00000000-0000-4000-8000-000000000002');
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
select lives_ok(format($$ insert into workshop_educadores (workshop_id, educador_id)
                          values (%s, (select id from educadores where correo = 'lucia@ejemplo.test')) $$, current_setting('t.w')),
  'se asigna a Lucía');
select lives_ok(format($$ delete from workshop_educadores
                           where workshop_id = %s and educador_id = (select id from educadores where correo = 'maria@ejemplo.test') $$,
                       current_setting('t.w')),
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
select pruebas.como('00000000-0000-4000-8000-000000000002');
select throws_ok(format($$ update workshops set estado = 'CANCELADO' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'lo que ya se empezó no se cancela');
select throws_ok(format($$ update workshops set estado = 'ARCHIVADO' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'ni se archiva mientras está publicado');

-- La tarea horaria finaliza lo publicado que ya pasó.
reset role;
update workshops set fecha = current_date - 2 where id in (current_setting('t.w')::bigint, current_setting('t.w2')::bigint);
select cmp_ok(finalizar_workshops_vencidos(), '>=', 2, 'la tarea horaria finaliza lo que ya pasó');
select is((select array_agg(estado::text order by id) from workshops where id in (current_setting('t.w')::bigint, current_setting('t.w2')::bigint)),
  array['FINALIZADO', 'FINALIZADO'], 'los dos quedan finalizados');
select pruebas.como('00000000-0000-4000-8000-000000000002');
select throws_ok(format($$ update workshops set estado = 'PUBLICADO', fecha = current_date + 5 where id = %s $$, current_setting('t.w')),
  'P0001', null, 'lo que ya se dio (se empezó) no se reprograma: se crea uno nuevo');
select lives_ok(format($$ update workshops set estado = 'PUBLICADO', fecha = current_date + 5 where id = %s $$, current_setting('t.w2')),
  'lo que no se dio, sí');
reset role;
select throws_ok($$ update workshop_educadores set iniciado_en = now() where iniciado_en is null and workshop_id = (
                      select w.id from workshops w join workshop_educadores we on we.workshop_id = w.id
                       where w.estado = 'FINALIZADO' and we.iniciado_en is null limit 1) $$,
  'P0001', null, 'un educador no empieza uno finalizado');
select pruebas.como('00000000-0000-4000-8000-000000000002');
select lives_ok(format($$ update workshops set estado = 'ARCHIVADO' where id = %s $$, current_setting('t.w')),
  'uno finalizado se archiva (descartado)');
select throws_ok(format($$ update workshops set notas = 'x' where id = %s $$, current_setting('t.w')), 'P0001', null,
  'un archivado no se modifica');
select set_config('t.w3', pruebas.nuevo('W idea', 30)::text, true);
select lives_ok(format($$ update workshops set estado = 'ARCHIVADO' where id = %s $$, current_setting('t.w3')),
  'un borrador también se descarta archivándolo');

-- ── Qué se programa: país e idioma ────────────────────────────────────────────
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, comunidad_id)
     values (current_date + 4, '09:00', 'en', (select id from storyboards where slug = 'el-huevo'),
             (select id from comunidades where nombre = 'Comunidad Centro')) $$,
  'P0001', null, 'no se programa en un idioma que el storyboard no tiene');
select throws_ok(
  $$ insert into comunidades (nombre, pais, organizacion_id) values ('Comunidad México', 'MX', (select id from organizaciones where nombre = 'Fundación Centro')) $$,
  'P0001', null, 'una comunidad no se abre en un país fuera de su licencia');
reset role;
update organizacion_licencias set paises = '{GT,MX}' where organizacion_id = (select id from organizaciones where nombre = 'Fundación Centro');
select pruebas.como('00000000-0000-4000-8000-000000000002');
select lives_ok(
  $$ insert into comunidades (nombre, pais, organizacion_id) values ('Comunidad México', 'MX', (select id from organizaciones where nombre = 'Fundación Centro')) $$,
  'con la licencia ampliada a México, sí');
select throws_ok(
  $$ insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, comunidad_id)
     values (current_date + 4, '09:00', 'es', (select id from storyboards where slug = 'el-huevo'),
             (select id from comunidades where nombre = 'Comunidad México')) $$,
  'P0001', null, 'pero el huevo, publicado solo en Guatemala, no se programa en México');

-- ── Borrar una comunidad con talleres; desligar a un educador con asignaciones ─
-- La clave de las asignaciones se comprueba al confirmar (diferida). La prueba se deshace, así que
-- se fuerza la comprobación con `set constraints all immediate`.
select pruebas.como('00000000-0000-4000-8000-000000000002');
select lives_ok($$ delete from comunidades where nombre = 'Comunidad Sur' $$,
  'el admin borra una comunidad con talleres (se van sus talleres y sus asignaciones)');
select lives_ok($$ set constraints all immediate $$, 'y al confirmar no queda ninguna asignación colgando');
select throws_ok(
  $$ delete from comunidad_educadores
      where educador_id = (select id from educadores where correo = 'maria@ejemplo.test')
        and comunidad_id = (select id from comunidades where nombre = 'Comunidad Centro') $$,
  '23503', null, 'no se desliga a un educador que tiene asignaciones (se desactiva)');

select * from finish();
rollback;
