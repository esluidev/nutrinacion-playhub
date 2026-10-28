-- RLS por identidad, sobre el seed (supabase/seed.sql). Se ejecuta con `supabase test db`.
-- Cada bloque actúa como una identidad: superadmin, admin de Centro, colaborador de Centro,
-- admin de Norte (la organización ajena) y anon. Todo corre en una transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(69);

-- Actuar como un usuario de Auth (por su uuid del seed) o como anon.
-- Ayudas en un esquema propio (se deshace con el rollback), utilizables por anon y authenticated.
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

-- uuid del seed
--   …0001 superadmin · …0002 admin de Centro · …0003 colaborador de Centro · …0004 admin de Norte
-- Los ids que una identidad no puede ver se guardan antes, como postgres: si no, la prueba
-- fallaría por no encontrar la fila y no por la RLS.
select set_config('t.org_centro', (select id from organizaciones where nombre = 'Fundación Centro')::text, true);
select set_config('t.org_norte', (select id from organizaciones where nombre = 'Colegio Norte')::text, true);
select set_config('t.comunidad_centro', (select id from comunidades where nombre = 'Comunidad Centro')::text, true);
select set_config('t.comunidad_sur', (select id from comunidades where nombre = 'Comunidad Sur')::text, true);
select set_config('t.perfil_admin_centro', (select id from perfiles where email = 'admin@centro.test')::text, true);
select set_config('t.sb_pan', (select id from storyboards where slug = 'el-pan')::text, true);
select set_config('t.asignacion', (select min(id) from workshop_educadores)::text, true);

-- ── Superadmin ────────────────────────────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000001');
select is((select count(*)::int from organizaciones), 2, 'superadmin: ve todas las organizaciones');
select is((select count(*)::int from storyboards), 3, 'superadmin: ve todo el catálogo, también borradores y personalizados');
select throws_ok($$ select pin_hash from educadores $$, '42501', null, 'superadmin: nunca lee el PIN de los educadores');
select throws_ok($$ select codigo_activacion_hash from educadores $$, '42501', null, 'superadmin: ni su código de activación');
-- Administra organizaciones, no su operación (decisión de Luis, 2026-10-18).
select is((select count(*)::int from organizacion_licencias), 2, 'superadmin: ve todas las licencias');
select is((select count(*)::int from organizacion_administradores), 2, 'superadmin: ve los administradores de todas');
select is((select count(*)::int from perfiles), 3, 'superadmin: ve su perfil y el de los administradores…');
select is((select count(*)::int from perfiles where email = 'colaborador@centro.test'), 0, '…pero no el de los colaboradores');
select is((select count(*)::int from comunidades), 0, 'superadmin: no ve las comunidades de organizaciones ajenas');
select is((select count(*)::int from (select id from educadores) e), 0, 'superadmin: ni sus educadores');
select is((select count(*)::int from workshops), 0, 'superadmin: ni sus talleres');
select is((select count(*)::int from workshop_feedback), 0, 'superadmin: ni su feedback');
select is((select count(*)::int from comunidad_participantes), 0, 'superadmin: ni sus participantes');
select is((select count(*)::int from (select nombre from hogar_perfiles) h), 0, 'superadmin: ni los perfiles de los niños');
select is((select count(*)::int from jornadas), 0, 'superadmin: ni sus jornadas');
select is((select count(*)::int from temarios), 1, 'superadmin: solo los temarios de Nutrinación');
select throws_ok(
  format($$ insert into comunidades (nombre, pais, organizacion_id) values ('Intrusa', 'GT', %s) $$, current_setting('t.org_centro')),
  '42501', null, 'superadmin: no abre comunidades en una organización ajena');
select is(
  (select comunidades || '/' || talleres || '/' || participantes from platform_uso(current_setting('t.org_centro')::bigint)),
  '2/13/1', 'superadmin: de la operación ve cifras (comunidades, talleres, participantes)');
select is((select count(*)::int from platform_comunidades(current_setting('t.org_centro')::bigint)), 2,
  'superadmin: y el nombre y país de sus comunidades');
select is(
  (select educadores_sin_acceso || '/' || (ultima_actividad is not null) from platform_uso(current_setting('t.org_centro')::bigint)),
  '1/true', 'superadmin: para soporte, cuántos educadores no tienen acceso y cuándo hubo actividad');
select is(
  (select educadores || '/' || participantes from platform_comunidades(current_setting('t.org_centro')::bigint) where nombre = 'Comunidad Centro'),
  '2/1', 'superadmin: y las cifras de cada comunidad');
select is(
  (select email || '/' || titular from platform_administradores(current_setting('t.org_centro')::bigint)),
  'admin@centro.test/true', 'superadmin: sus administradores, con quién es titular');

-- ── Admin de Centro ───────────────────────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000002');
select throws_ok($$ select * from platform_uso() $$, '42501', null, 'admin: las cifras de Platform son solo del superadmin');
select is((select count(*)::int from organizaciones), 1, 'admin: solo ve su organización');
select is((select count(*)::int from organizacion_licencias), 1, 'admin: solo ve su licencia');
select is((select count(*)::int from workshops), 13, 'admin: ve los workshops de todas sus comunidades (Centro y Sur)');
select is((select array_agg(slug order by slug) from storyboards), array['el-huevo'],
  'admin: ve el estándar publicado; ni el personalizado de otra organización ni el borrador');
select is((select count(*)::int from guia_escenas), 4, 'admin: ve la guía del storyboard que ve');
select throws_ok(
  $$ insert into organizacion_administradores (organizacion_id, perfil_id)
     values (current_setting('t.org_norte')::bigint, current_setting('t.perfil_admin_centro')::bigint) $$,
  '42501', null, 'admin: no puede hacerse administrador de otra organización');
select throws_ok(
  $$ insert into invitaciones (role, email, organizacion_id)
     values ('ADMIN', 'x@test', current_setting('t.org_norte')::bigint) $$,
  '42501', null, 'admin: no puede invitar en una organización ajena');
select throws_ok(
  $$ insert into workshops (fecha, idioma_contenido, storyboard_id, comunidad_id)
     values (current_date, 'es', current_setting('t.sb_pan')::bigint, current_setting('t.comunidad_centro')::bigint) $$,
  'P0001', null, 'admin: no puede programar el personalizado de otra organización');
select throws_ok(
  $$ insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, participacion_grupo, claridad_contenido)
     values (current_setting('t.asignacion')::bigint, 5, 10, 'ALTA', 'CLARA') $$,
  '42501', null, 'admin: el feedback solo lo escribe el educador');
select lives_ok($$ update configuracion set valor = 'https://intruso.test' where clave = 'admin_url' $$,
  'admin: actualizar la configuración no falla, pero no toca nada (ver abajo)');

-- ── Colaborador de Centro ─────────────────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000003');
select throws_ok($$ update perfiles set superadmin = true where usuario_id = auth.uid() $$,
  '42501', null, 'colaborador: no puede marcarse superadmin');
select lives_ok($$ update perfiles set nombre = 'Carlos C.' where usuario_id = auth.uid() $$,
  'colaborador: puede editar sus datos');
select is((select count(*)::int from workshops), 12, 'colaborador: ve los workshops de su comunidad, no los de Comunidad Sur');
select is((select count(*)::int from educadores), 2, 'colaborador: ve los educadores de su organización');
select throws_ok(
  $$ insert into comunidad_educadores (educador_id, comunidad_id)
     values ((select id from educadores where correo = 'lucia@ejemplo.test'), current_setting('t.comunidad_sur')::bigint) $$,
  '42501', null, 'colaborador: no liga educadores a una comunidad que no opera');
select is((select array_agg(nombre order by nombre) from hogar_perfiles), array['Pepito'],
  'colaborador: ve a los participantes de su comunidad');
select throws_ok($$ select intereses from hogar_perfiles $$, '42501', null, 'colaborador: no ve los intereses de un perfil');
select throws_ok($$ select correo from hogares $$, '42501', null, 'colaborador: no ve las cuentas del hogar');
select throws_ok($$ select count(*) from hogar_perfil_avance $$, '42501', null, 'colaborador: no ve el avance de nadie');
select lives_ok(
  $$ insert into temarios (titulo, estado_publicacion, organizacion_id, comunidad_id)
     values ('{"es":"De la comunidad"}', 'PUBLICADO', current_setting('t.org_centro')::bigint, current_setting('t.comunidad_centro')::bigint) $$,
  'colaborador: arma temarios de su comunidad');
select throws_ok(
  $$ insert into temarios (titulo, organizacion_id) values ('{"es":"De toda la organización"}', current_setting('t.org_centro')::bigint) $$,
  '42501', null, 'colaborador: no arma temarios de toda la organización');
select throws_ok(
  $$ insert into organizacion_publicaciones (organizacion_id, storyboard_id)
     values (current_setting('t.org_centro')::bigint, (select id from storyboards where slug = 'el-huevo')) $$,
  '42501', null, 'colaborador: no publica para toda la organización');
select throws_ok(
  $$ insert into comunidades (nombre, organizacion_id) values ('Otra', current_setting('t.org_centro')::bigint) $$,
  '42501', null, 'colaborador: no crea comunidades');
select is((select count(*)::int from organizacion_licencias), 0, 'colaborador: no ve la licencia');

-- ── Admin de Norte (ajeno a Centro) ───────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000004');
select is((select count(*)::int from workshops w join comunidades c on c.id = w.comunidad_id where c.nombre = 'Comunidad Centro'), 0,
  'ajeno: no ve workshops de otra organización');
select is((select count(*)::int from educadores where correo = 'maria@ejemplo.test'), 0, 'ajeno: no ve educadores de otra organización');
select is((select array_agg(slug order by slug) from storyboards), array['el-huevo', 'el-pan'],
  'ajeno: ve el estándar y su personalizado');
select is((select count(*)::int from perfiles where email = 'admin@centro.test'), 0, 'ajeno: no ve perfiles de otra organización');
select is((select count(*)::int from comunidad_participantes), 0, 'ajeno: no ve participantes de otra organización');
select is((select count(*)::int from temarios where organizacion_id is not null), 0, 'ajeno: no ve temarios de otra organización');

-- ── anon ──────────────────────────────────────────────────────────────────────
select pruebas.como_anon();
select throws_ok($$ select count(*) from educadores $$, '42501', null, 'anon: ni siquiera puede consultar educadores');
select is((select count(*)::int from workshops), 0, 'anon: no ve workshops');
select is((select count(*)::int from storyboards), 0, 'anon: no ve el catálogo');
select is((select count(*)::int from perfiles), 0, 'anon: no ve perfiles');
select throws_ok($$ select count(*) from hogares $$, '42501', null, 'anon: no consulta las cuentas del hogar (usa las funciones)');

-- ── Comprobaciones como postgres ──────────────────────────────────────────────
select pruebas.como_anon();
reset role;
select is((select valor from configuracion where clave = 'admin_url'), 'http://localhost:3000',
  'la actualización del admin no cambió la configuración');

-- Registro abierto con metadatos falsos: el trigger no enlaza nada (lee app_metadata).
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000ff', 'authenticated', 'authenticated',
        'intruso@test', '{}',
        json_build_object('role', 'ADMIN', 'organizacion_id', (select id from organizaciones where nombre = 'Fundación Centro'))::jsonb,
        now(), now());
select is(
  (select count(*)::int from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id where p.email = 'intruso@test'),
  0, 'un registro con «role: ADMIN» en user_metadata no administra nada');

-- ── Invitaciones de titular ───────────────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000002');
select lives_ok(
  format($$ insert into invitaciones (role, email, nombre, organizacion_id) values ('ADMIN', 'coadmin@test', 'Co', %s) $$, current_setting('t.org_centro')),
  'el titular invita a otro administrador, con su nombre');
select throws_ok(
  format($$ insert into invitaciones (role, email, titular, organizacion_id) values ('ADMIN', 'otro@test', true, %s) $$, current_setting('t.org_centro')),
  '42501', null, 'pero no a un titular');
select pruebas.como('00000000-0000-4000-8000-000000000001');
select lives_ok(
  format($$ insert into invitaciones (role, email, nombre, titular, organizacion_id) values ('ADMIN', 'nuevo-titular@test', 'Nuevo', true, %s) $$, current_setting('t.org_centro')),
  'el superadmin invita a un titular');
reset role;
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000aa', 'authenticated', 'authenticated',
        'nuevo-titular@test', json_build_object('role', 'ADMIN', 'organizacion_id', current_setting('t.org_centro')::bigint, 'titular', true)::jsonb,
        '{"nombre": "Nuevo"}', now(), now());
select is(
  (select string_agg(p.email, ',') from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id
    where oa.organizacion_id = current_setting('t.org_centro')::bigint and oa.titular),
  'nuevo-titular@test', 'quien canjea una invitación de titular pasa a ser el titular (y el anterior sigue como administrador)');

-- ── El superadmin se une a una organización ───────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000001');
select lives_ok(
  format($$ insert into organizacion_administradores (organizacion_id, perfil_id) values (%s, mi_perfil_id()) $$, current_setting('t.org_norte')),
  'el superadmin se hace administrador de una organización (a la vista de sus administradores)');
select is((select count(*)::int from comunidades), 1, 'y entonces ve su operación, como cualquier administrador');

-- ── Baja de una organización (al final: borra datos) ──────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000001');
select throws_ok(format($$ select platform_eliminar_organizacion(%s) $$, current_setting('t.org_norte')), 'P0001', null,
  'baja: con storyboards personalizados no se da de baja (se resuelven en Player)');
select lives_ok(format($$ select platform_eliminar_organizacion(%s) $$, current_setting('t.org_centro')),
  'baja: la organización se va entera, con sus comunidades y sus talleres');
reset role;
select is((select count(*)::int from comunidades where organizacion_id = current_setting('t.org_centro')::bigint), 0,
  'baja: no quedan sus comunidades');

select * from finish();
rollback;
