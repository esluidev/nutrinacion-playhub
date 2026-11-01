-- RLS por identidad (0005). Cada bloque actúa como una identidad: superadmin, admin de Centro,
-- colaborador de Centro, admin de Norte (la organización ajena) y anon. No usa el seed: crea sus
-- propios datos (prefijo «RLS») dentro de una transacción que se deshace, así corre también contra
-- la base sin seed (`supabase db reset --no-seed`).
begin;
create extension if not exists pgtap with schema extensions;
select plan(77);

-- Actuar como un usuario de Auth (por su uuid) o como anon.
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

-- Cuántas filas tocó una sentencia: la RLS no falla en update y delete, solo deja fuera las filas.
create function pruebas.afectadas(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;

-- ── Datos propios ─────────────────────────────────────────────────────────────
-- Centro opera en Guatemala y El Salvador; Norte, en México.
insert into organizaciones (nombre, paises) values ('RLS Centro', '{GT,SV}'), ('RLS Norte', '{MX}');
insert into organizacion_licencias (organizacion_id, fecha_inicio) select id, current_date - 30 from organizaciones where nombre like 'RLS %';
select set_config('t.centro', (select id from organizaciones where nombre = 'RLS Centro')::text, true);
select set_config('t.norte', (select id from organizaciones where nombre = 'RLS Norte')::text, true);

-- Usuarios: …01 superadmin · …02 admin titular de Centro · …03 colaborador de Centro (enlazado por
-- app_metadata, como hace canjear-invitacion) · …04 admin titular de Norte. El trigger crea el perfil.
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('20000000-0000-4000-8000-000000000001'::uuid, 's@rls.test', '{}'::jsonb),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'a@rls.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.centro')::bigint)),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'c@rls.test',
      jsonb_build_object('role', 'COLABORADOR', 'organizacion_id', current_setting('t.centro')::bigint)),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'n@rls.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.norte')::bigint))
  ) as v (id, email, app);
update perfiles set superadmin = true where email = 's@rls.test';
select set_config('t.perfil_a', (select id from perfiles where email = 'a@rls.test')::text, true);
select set_config('t.perfil_n', (select id from perfiles where email = 'n@rls.test')::text, true);

-- Catálogo: un estándar en Guatemala (lo tiene Centro), otro solo en México (lo tiene Norte), un
-- personalizado de Norte y uno recién registrado (no lo ve ninguna organización).
insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, estado_publicacion, paises_disponibles, organizacion_id) values
  ('a0000000-0000-4000-8000-000000000001', 'rls-huevo',    '{"es":"RLS huevo"}',    'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO',  '{GT}', null),
  ('a0000000-0000-4000-8000-000000000002', 'rls-tortilla', '{"es":"RLS tortilla"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO',  '{MX}', null),
  ('a0000000-0000-4000-8000-000000000003', 'rls-pan',      '{"es":"RLS pan"}',      'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO',  '{MX}', current_setting('t.norte')::bigint),
  ('a0000000-0000-4000-8000-000000000004', 'rls-soda',     '{"es":"RLS soda"}',     'ALIMENTACION', 'PROCESADOS', 'KIDS', '{es}', 'REGISTRADO', '{}',   null);
insert into guia_escenas (guia_id, orden, carpeta, titulo)
select g.id, 1, 'bienvenida', '{"es":"Bienvenida"}' from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'rls-huevo';
select set_config('t.sb_pan', (select id from storyboards where slug = 'rls-pan')::text, true);
select set_config('t.sb_huevo', (select id from storyboards where slug = 'rls-huevo')::text, true);

-- Educadores: María y Lucía (sin PIN aún) en Centro; Pedro en Norte.
insert into educadores (nombre, correo, pin_hash, organizacion_id) values
  ('María', 'maria@rls.test', extensions.crypt('246810', extensions.gen_salt('bf', 8)), current_setting('t.centro')::bigint),
  ('Lucía', 'lucia@rls.test', null, current_setting('t.centro')::bigint),
  ('Pedro', 'pedro@rls.test', extensions.crypt('135790', extensions.gen_salt('bf', 8)), current_setting('t.norte')::bigint);
select set_config('t.maria', (select id from educadores where correo = 'maria@rls.test')::text, true);
select set_config('t.pedro', (select id from educadores where correo = 'pedro@rls.test')::text, true);

insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ('RLS Jornada', 'Sede', current_date, current_date + 7, current_setting('t.centro')::bigint);

-- Workshops de Centro: uno publicado por venir (en la jornada), uno ya dado con su feedback y un
-- borrador. Uno de Norte con su personalizado.
create function pruebas.workshop(p_notas text, p_dias int, p_sb bigint, p_org bigint, p_educador bigint, p_jornada bigint default null)
returns bigint language plpgsql as $$
declare v_w bigint;
begin
  insert into workshops (notas, fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id, jornada_id)
  values (p_notas, current_date + p_dias, '09:00', 'es', p_sb, p_org, p_jornada) returning id into v_w;
  insert into workshop_educadores (workshop_id, educador_id) values (v_w, p_educador);
  update workshops set estado = 'PUBLICADO' where id = v_w;
  return v_w;
end $$;
select set_config('t.w1', pruebas.workshop('RLS Centro próximo', 1, current_setting('t.sb_huevo')::bigint, current_setting('t.centro')::bigint,
                                           current_setting('t.maria')::bigint, (select id from jornadas where nombre = 'RLS Jornada'))::text, true);
select set_config('t.w2', pruebas.workshop('RLS Centro dado', -2, current_setting('t.sb_huevo')::bigint, current_setting('t.centro')::bigint,
                                           current_setting('t.maria')::bigint)::text, true);
insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, participacion_grupo, claridad_contenido)
select id, 4, 20, 'ALTA', 'CLARA' from workshop_educadores where workshop_id = current_setting('t.w2')::bigint;
select set_config('t.asignacion', (select id from workshop_educadores where workshop_id = current_setting('t.w1')::bigint)::text, true);
insert into workshops (notas, fecha, idioma_contenido, storyboard_id, organizacion_id)
values ('RLS Centro borrador', current_date + 20, 'es', current_setting('t.sb_huevo')::bigint, current_setting('t.centro')::bigint);
select set_config('t.w4', pruebas.workshop('RLS Norte hoy', 0, current_setting('t.sb_pan')::bigint, current_setting('t.norte')::bigint,
                                           current_setting('t.pedro')::bigint)::text, true);

-- ── El alta por app_metadata (lo que hace canjear-invitacion) ─────────────────
select is((select count(*)::int from organizacion_colaboradores oc join perfiles p on p.id = oc.perfil_id
            where p.email = 'c@rls.test' and oc.organizacion_id = current_setting('t.centro')::bigint and oc.activo),
  1, 'un alta con «COLABORADOR» en app_metadata queda como colaborador activo de la organización');
select is((select titular from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id where p.email = 'a@rls.test'),
  true, 'y una con «ADMIN, titular» como titular');

-- ── Superadmin ────────────────────────────────────────────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000001');
select is((select count(*)::int from organizaciones where nombre like 'RLS %'), 2, 'superadmin: ve todas las organizaciones');
select is((select count(*)::int from storyboards where slug like 'rls-%'), 4, 'superadmin: ve todo el catálogo, también registrados y personalizados');
select throws_ok($$ select pin_hash from educadores $$, '42501', null, 'superadmin: nunca lee el PIN de los educadores');
select throws_ok($$ select codigo_activacion_hash from educadores $$, '42501', null, 'superadmin: ni su código de activación');
-- Administra organizaciones, no su operación (decisión 008).
select is((select count(*)::int from organizacion_licencias where organizacion_id in (current_setting('t.centro')::bigint, current_setting('t.norte')::bigint)),
  2, 'superadmin: ve todas las licencias');
select is((select count(*)::int from organizacion_administradores where organizacion_id in (current_setting('t.centro')::bigint, current_setting('t.norte')::bigint)),
  2, 'superadmin: ve los administradores de todas');
select is((select array_agg(email order by email) from perfiles where email like '%@rls.test'), array['a@rls.test', 'n@rls.test', 's@rls.test'],
  'superadmin: ve su perfil y el de los administradores, no el de los colaboradores');
select is((select count(*)::int from organizacion_colaboradores where organizacion_id = current_setting('t.centro')::bigint), 0,
  'superadmin: no ve a los colaboradores de una organización ajena');
select is((select count(*)::int from (select id from educadores where correo like '%@rls.test') e), 0, 'superadmin: ni sus educadores');
select is((select count(*)::int from workshops where notas like 'RLS %'), 0, 'superadmin: ni sus talleres');
select is((select count(*)::int from workshop_feedback where workshop_educador_id in (
            select id from workshop_educadores where organizacion_id = current_setting('t.centro')::bigint)), 0, 'superadmin: ni su feedback');
select is((select count(*)::int from jornadas where nombre = 'RLS Jornada'), 0, 'superadmin: ni sus jornadas');
select throws_ok(
  format($$ insert into educadores (nombre, correo, organizacion_id) values ('Intruso', 'intruso@rls.test', %s) $$, current_setting('t.centro')),
  '42501', null, 'superadmin: no da de alta educadores en una organización que no opera');
select is(
  (select educadores || '/' || talleres || '/' || jornadas || '/' || talleres_proximos from platform_uso(current_setting('t.centro')::bigint)),
  '2/3/1/1', 'superadmin: de la operación ve cifras (educadores, talleres, jornadas, próximos)');
select is(
  (select educadores_sin_acceso || '/' || (ultima_actividad is not null) from platform_uso(current_setting('t.centro')::bigint)),
  '1/true', 'superadmin: para soporte, cuántos educadores no tienen acceso y cuándo hubo actividad');
select is((select personalizados from platform_uso(current_setting('t.norte')::bigint)), 1, 'superadmin: y cuántos personalizados tiene cada una');
select is(
  (select email || '/' || titular from platform_administradores(current_setting('t.centro')::bigint)),
  'a@rls.test/true', 'superadmin: sus administradores, con quién es titular');

-- ── Admin de Centro ───────────────────────────────────────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000002');
select throws_ok($$ select * from platform_uso() $$, '42501', null, 'admin: las cifras de Platform son solo del superadmin');
select is((select array_agg(nombre) from organizaciones where nombre like 'RLS %'), array['RLS Centro'], 'admin: solo ve su organización');
select is((select count(*)::int from organizacion_licencias where organizacion_id in (current_setting('t.centro')::bigint, current_setting('t.norte')::bigint)),
  1, 'admin: solo ve su licencia');
select is((select count(*)::int from workshops where notas like 'RLS %'), 3, 'admin: ve los talleres de su organización, también el borrador');
select is((select array_agg(slug order by slug) from storyboards where slug like 'rls-%'), array['rls-huevo'],
  'admin: ve el estándar publicado en sus países; ni el de México, ni el personalizado de otra organización, ni el registrado');
select is((select count(*)::int from guia_escenas ge join guias g on g.id = ge.guia_id where g.storyboard_id = current_setting('t.sb_huevo')::bigint),
  1, 'admin: ve la guía del storyboard que ve');
select is((select count(*)::int from organizacion_colaboradores where organizacion_id = current_setting('t.centro')::bigint), 1,
  'admin: ve a los colaboradores de su organización');
select lives_ok(
  format($$ insert into organizacion_colaboradores (organizacion_id, perfil_id) values (%s, %s) $$, current_setting('t.centro'), current_setting('t.perfil_n')),
  'admin: suma un colaborador a su organización');
select lives_ok(
  format($$ delete from organizacion_colaboradores where organizacion_id = %s and perfil_id = %s $$, current_setting('t.centro'), current_setting('t.perfil_n')),
  'admin: y lo quita');
select throws_ok(
  $$ insert into organizacion_administradores (organizacion_id, perfil_id)
     values (current_setting('t.norte')::bigint, current_setting('t.perfil_a')::bigint) $$,
  '42501', null, 'admin: no puede hacerse administrador de otra organización');
select throws_ok(
  $$ insert into invitaciones (role, email, organizacion_id)
     values ('ADMIN', 'x@rls.test', current_setting('t.norte')::bigint) $$,
  '42501', null, 'admin: no puede invitar en una organización ajena');
select throws_ok(
  $$ insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id)
     values (current_date, 'es', current_setting('t.sb_pan')::bigint, current_setting('t.centro')::bigint) $$,
  'P0001', null, 'admin: no puede programar el personalizado de otra organización');
select throws_ok(
  $$ insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, participacion_grupo, claridad_contenido)
     values (current_setting('t.asignacion')::bigint, 5, 10, 'ALTA', 'CLARA') $$,
  '42501', null, 'admin: el feedback solo lo escribe el educador');
select lives_ok($$ update configuracion set valor = 'https://intruso.test' where clave = 'admin_url' $$,
  'admin: actualizar la configuración no falla, pero no toca nada (ver abajo)');
select lives_ok($$ delete from educadores where correo = 'lucia@rls.test' $$, 'admin: da de baja a un educador de su organización');

-- ── Colaborador de Centro ─────────────────────────────────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000003');
select throws_ok($$ update perfiles set superadmin = true where usuario_id = auth.uid() $$,
  '42501', null, 'colaborador: no puede marcarse superadmin');
select lives_ok($$ update perfiles set nombre = 'Carlos C.' where usuario_id = auth.uid() $$,
  'colaborador: puede editar sus datos');
select is((select array_agg(nombre) from organizaciones where nombre like 'RLS %'), array['RLS Centro'], 'colaborador: ve la organización donde colabora');
select is((select count(*)::int from workshops where notas like 'RLS %'), 3, 'colaborador: ve los talleres de la organización');
select is((select array_agg(correo) from educadores where correo like '%@rls.test'), array['maria@rls.test'],
  'colaborador: ve a los educadores de la organización (Lucía ya no está; Pedro es de otra)');
select is((select count(*)::int from jornadas where nombre = 'RLS Jornada'), 1, 'colaborador: ve sus jornadas');
select is((select array_agg(slug) from storyboards where slug like 'rls-%'), array['rls-huevo'], 'colaborador: ve el catálogo disponible para la organización');
select is((select count(*)::int from organizacion_licencias where organizacion_id = current_setting('t.centro')::bigint), 1,
  'colaborador: ve la licencia');
select is(pruebas.afectadas(format($$ update organizacion_licencias set notas = 'x' where organizacion_id = %s $$, current_setting('t.centro'))),
  0, 'colaborador: pero no la edita');
select lives_ok(
  format($$ insert into educadores (nombre, correo, organizacion_id) values ('Nuevo', 'nuevo@rls.test', %s) $$, current_setting('t.centro')),
  'colaborador: da de alta educadores');
select lives_ok($$ update educadores set telefono = '5555' where correo = 'maria@rls.test' $$, 'colaborador: y los edita');
select is(pruebas.afectadas($$ delete from educadores where correo = 'nuevo@rls.test' $$), 0,
  'colaborador: pero no los da de baja (eso es de los administradores)');
select lives_ok(
  format($$ insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id) values ('RLS Jornada 2', 'Sede', current_date, current_date, %s) $$, current_setting('t.centro')),
  'colaborador: crea jornadas');
select lives_ok(
  format($$ insert into educador_grupos (nombre, organizacion_id) values ('RLS Grupo', %s) $$, current_setting('t.centro')),
  'colaborador: crea grupos de educadores');
select lives_ok(
  format($$ insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id) values (current_date + 3, 'es', %s, %s) $$,
         current_setting('t.sb_huevo'), current_setting('t.centro')),
  'colaborador: programa talleres');
select throws_ok(
  format($$ insert into organizacion_colaboradores (organizacion_id, perfil_id) values (%s, %s) $$, current_setting('t.centro'), current_setting('t.perfil_n')),
  '42501', null, 'colaborador: no gestiona colaboradores');
select throws_ok(
  format($$ insert into invitaciones (role, email, organizacion_id) values ('COLABORADOR', 'x@rls.test', %s) $$, current_setting('t.centro')),
  '42501', null, 'colaborador: ni invita');
select is((select count(*)::int from organizacion_administradores where organizacion_id = current_setting('t.centro')::bigint), 1,
  'colaborador: ve quién administra la organización');
reset role;
update organizacion_colaboradores set activo = false where perfil_id = (select id from perfiles where email = 'c@rls.test');
select pruebas.como('20000000-0000-4000-8000-000000000003');
select is((select count(*)::int from workshops where notas like 'RLS %'), 0, 'colaborador inactivo: ya no ve la operación');
select is((select count(*)::int from organizaciones where nombre like 'RLS %'), 0, 'colaborador inactivo: ni la organización');
reset role;
update organizacion_colaboradores set activo = true where perfil_id = (select id from perfiles where email = 'c@rls.test');

-- ── Admin de Norte (ajeno a Centro) ───────────────────────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000004');
select is((select count(*)::int from workshops where notas like 'RLS Centro%'), 0, 'ajeno: no ve talleres de otra organización');
select is((select count(*)::int from educadores where correo = 'maria@rls.test'), 0, 'ajeno: no ve educadores de otra organización');
select is((select array_agg(slug order by slug) from storyboards where slug like 'rls-%'), array['rls-pan', 'rls-tortilla'],
  'ajeno: ve el estándar de México y su personalizado, no el de Guatemala');
select is((select count(*)::int from perfiles where email = 'a@rls.test'), 0, 'ajeno: no ve perfiles de otra organización');
select is((select count(*)::int from jornadas where nombre like 'RLS Jornada%'), 0, 'ajeno: no ve jornadas de otra organización');
select is((select count(*)::int from organizacion_colaboradores where organizacion_id = current_setting('t.centro')::bigint), 0,
  'ajeno: no ve colaboradores de otra organización');

-- ── anon ──────────────────────────────────────────────────────────────────────
select pruebas.como_anon();
select throws_ok($$ select count(*) from educadores $$, '42501', null, 'anon: ni siquiera puede consultar educadores');
select is((select count(*)::int from workshops), 0, 'anon: no ve workshops');
select is((select count(*)::int from storyboards), 0, 'anon: no ve el catálogo');
select is((select count(*)::int from perfiles), 0, 'anon: no ve perfiles');
select is((select count(*)::int from organizaciones), 0, 'anon: no ve organizaciones');

-- ── Comprobaciones como postgres ──────────────────────────────────────────────
reset role;
select isnt((select valor from configuracion where clave = 'admin_url'), 'https://intruso.test',
  'la actualización del admin no cambió la configuración');

-- Registro abierto con metadatos falsos: el trigger no enlaza nada (lee app_metadata).
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-0000000000ff', 'authenticated', 'authenticated',
        'intruso@rls.test', '{}',
        jsonb_build_object('role', 'ADMIN', 'organizacion_id', current_setting('t.centro')::bigint),
        now(), now());
select is(
  (select count(*)::int from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id where p.email = 'intruso@rls.test'),
  0, 'un registro con «role: ADMIN» en user_metadata no administra nada');

-- ── Invitaciones de titular ───────────────────────────────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000002');
select lives_ok(
  format($$ insert into invitaciones (role, email, nombre, organizacion_id) values ('ADMIN', 'coadmin@rls.test', 'Co', %s) $$, current_setting('t.centro')),
  'el titular invita a otro administrador, con su nombre');
select lives_ok(
  format($$ insert into invitaciones (role, email, nombre, organizacion_id) values ('COLABORADOR', 'colab2@rls.test', 'Co', %s) $$, current_setting('t.centro')),
  'y a un colaborador (sin comunidad: la invitación es a la organización)');
select throws_ok(
  format($$ insert into invitaciones (role, email, titular, organizacion_id) values ('ADMIN', 'otro@rls.test', true, %s) $$, current_setting('t.centro')),
  '42501', null, 'pero no a un titular');
select pruebas.como('20000000-0000-4000-8000-000000000001');
select lives_ok(
  format($$ insert into invitaciones (role, email, nombre, titular, organizacion_id) values ('ADMIN', 'nuevo-titular@rls.test', 'Nuevo', true, %s) $$, current_setting('t.centro')),
  'el superadmin invita a un titular');
reset role;
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-0000000000aa', 'authenticated', 'authenticated',
        'nuevo-titular@rls.test', jsonb_build_object('role', 'ADMIN', 'organizacion_id', current_setting('t.centro')::bigint, 'titular', true),
        '{"nombre": "Nuevo"}', now(), now());
select is(
  (select string_agg(p.email, ',') from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id
    where oa.organizacion_id = current_setting('t.centro')::bigint and oa.titular),
  'nuevo-titular@rls.test', 'quien canjea una invitación de titular pasa a ser el titular (y el anterior sigue como administrador)');

-- ── El superadmin se une a una organización ───────────────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000001');
select lives_ok(
  format($$ insert into organizacion_administradores (organizacion_id, perfil_id) values (%s, mi_perfil_id()) $$, current_setting('t.norte')),
  'el superadmin se hace administrador de una organización (a la vista de sus administradores)');
select is((select count(*)::int from educadores where correo = 'pedro@rls.test'), 1, 'y entonces ve su operación, como cualquier administrador');

-- ── Baja de una organización (al final: borra datos) ──────────────────────────
select pruebas.como('20000000-0000-4000-8000-000000000001');
select throws_ok(format($$ select platform_eliminar_organizacion(%s) $$, current_setting('t.norte')), 'P0001', null,
  'baja: con storyboards personalizados no se da de baja (se resuelven en Player)');
select lives_ok(format($$ select platform_eliminar_organizacion(%s) $$, current_setting('t.centro')),
  'baja: la organización se va entera, con sus educadores, talleres y jornadas');
reset role;
select is((select count(*)::int from workshops where organizacion_id = current_setting('t.centro')::bigint)
          + (select count(*)::int from educadores where organizacion_id = current_setting('t.centro')::bigint)
          + (select count(*)::int from jornadas where organizacion_id = current_setting('t.centro')::bigint)
          + (select count(*)::int from organizacion_colaboradores where organizacion_id = current_setting('t.centro')::bigint),
  0, 'baja: no queda nada suyo');

select * from finish();
rollback;
