-- Acceso de los educadores sin Supabase Auth (0006). Educators usa la anon key y un token: aquí
-- todo se llama como anon, salvo crear y revocar el enlace de acceso (Admin, 0013). No usa el seed: crea sus propios
-- datos (prefijo «Acceso», correos @acc.test) en una transacción que se deshace.
--   maria@acc.test PIN 246810 (Acceso Centro) · pedro@acc.test PIN 135790 (Acceso Norte)
--   lucia@acc.test con su enlace de acceso pendiente, sin PIN todavía (Acceso Centro)
begin;
create extension if not exists pgtap with schema extensions;
select plan(65);

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
insert into organizaciones (nombre, paises) values ('Acceso Centro', '{GT}'), ('Acceso Norte', '{GT}');
insert into organizacion_licencias (organizacion_id, fecha_inicio) select id, current_date - 30 from organizaciones where nombre like 'Acceso %';
select set_config('t.centro', (select id from organizaciones where nombre = 'Acceso Centro')::text, true);
select set_config('t.norte', (select id from organizaciones where nombre = 'Acceso Norte')::text, true);

-- …02 admin de Centro · …03 colaborador de Centro · …04 admin de Norte
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('30000000-0000-4000-8000-000000000002'::uuid, 'a@acc.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.centro')::bigint)),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'c@acc.test',
      jsonb_build_object('role', 'COLABORADOR', 'organizacion_id', current_setting('t.centro')::bigint)),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'n@acc.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.norte')::bigint))
  ) as v (id, email, app);

insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, duracion_min, numero_escenas, estado_publicacion, paises_disponibles)
values ('b0000000-0000-4000-8000-000000000001', 'acc-huevo', '{"es":"El huevo"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 30, 4, 'PUBLICADO', '{GT}');
select set_config('t.sb', (select id from storyboards where slug = 'acc-huevo')::text, true);
insert into guia_escenas (guia_id, orden, carpeta, titulo, verbo)
select g.id, e.orden, e.carpeta, jsonb_build_object('es', e.carpeta), jsonb_build_object('es', e.verbo)
  from guias g, (values (1, 'bienvenida', 'Situar'), (2, 'origen', 'Reconocer'), (3, 'descubrimiento', 'Descubrir'), (4, 'preparacion', 'Secuenciar')) e(orden, carpeta, verbo)
 where g.storyboard_id = current_setting('t.sb')::bigint;

insert into educadores (nombre, apellido, correo, pin_hash, acceso_token, acceso_expira_en, organizacion_id) values
  ('María', 'López', 'maria@acc.test', extensions.crypt('246810', extensions.gen_salt('bf', 8)), null, null, current_setting('t.centro')::bigint),
  ('Lucía', 'Gómez', 'lucia@acc.test', null, 'enlace-de-lucia', now() + interval '7 days', current_setting('t.centro')::bigint),
  ('Pedro', 'Ramírez', 'pedro@acc.test', extensions.crypt('135790', extensions.gen_salt('bf', 8)), null, null, current_setting('t.norte')::bigint);
select set_config('t.maria', (select id from educadores where correo = 'maria@acc.test')::text, true);
select set_config('t.pedro', (select id from educadores where correo = 'pedro@acc.test')::text, true);

insert into jornadas (nombre, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ('Acceso Jornada', 'Sede central', current_date - 3, current_date + 16, current_setting('t.centro')::bigint);
select set_config('t.jornada', (select id from jornadas where nombre = 'Acceso Jornada')::text, true);

-- Un workshop publicado (devuelve su id); con feedback, queda finalizado.
create function pruebas.workshop(p_dias int, p_org bigint, p_educador bigint, p_jornada bigint default null, p_feedback boolean default false)
returns bigint language plpgsql as $$
declare v_w bigint; v_a bigint;
begin
  insert into workshops (fecha, hora_inicio, hora_fin, ubicacion, grupo_asistente, idioma_contenido, storyboard_id, organizacion_id, jornada_id)
  values (current_date + p_dias, '09:00', '09:30', 'Aula', '2.º B', 'es', current_setting('t.sb')::bigint, p_org, p_jornada) returning id into v_w;
  insert into workshop_educadores (workshop_id, educador_id) values (v_w, p_educador) returning id into v_a;
  update workshops set estado = 'PUBLICADO' where id = v_w;
  if p_feedback then
    update workshop_educadores set iniciado_en = now() - interval '1 day', estado = 'EN_CURSO' where id = v_a;
    insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, participacion_grupo, claridad_contenido)
    values (v_a, 5, 20, 'ALTA', 'CLARA');
  end if;
  return v_w;
end $$;

-- María: dos ya dados con su feedback, uno pasado sin cerrar, dos hoy, uno por venir, uno
-- cancelado y un borrador (que no ve). Pedro: uno hoy en Norte.
select pruebas.workshop(-8, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint, null, true);
select pruebas.workshop(-3, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint, current_setting('t.jornada')::bigint, true);
select set_config('t.ayer', pruebas.workshop(-1, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint)::text, true);
update workshops set estado = 'FINALIZADO' where id = current_setting('t.ayer')::bigint;
select set_config('t.hoy', pruebas.workshop(0, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint, current_setting('t.jornada')::bigint)::text, true);
select pruebas.workshop(0, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint, current_setting('t.jornada')::bigint);
select pruebas.workshop(4, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint, current_setting('t.jornada')::bigint);
select set_config('t.cancelado', pruebas.workshop(5, current_setting('t.centro')::bigint, current_setting('t.maria')::bigint)::text, true);
update workshops set estado = 'CANCELADO', motivo_cancelacion = 'Feriado escolar' where id = current_setting('t.cancelado')::bigint;
insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id)
values (current_date + 20, 'es', current_setting('t.sb')::bigint, current_setting('t.centro')::bigint);
select set_config('t.taller_pedro', pruebas.workshop(0, current_setting('t.norte')::bigint, current_setting('t.pedro')::bigint)::text, true);

select pruebas.como_anon();

-- ── Entrar con PIN ────────────────────────────────────────────────────────────
select is(educador_entrar('maria@acc.test', '000000'), '{"ok": false, "error": "credenciales"}'::jsonb,
  'un PIN incorrecto no entra');
select is(educador_entrar('maria@acc.test', 'abc'), '{"ok": false, "error": "credenciales"}'::jsonb,
  'un PIN mal formado no entra');
select is(educador_entrar('nadie@acc.test', '246810'), '{"ok": false, "error": "credenciales"}'::jsonb,
  'un correo desconocido da el mismo error');

do $$ begin perform educador_entrar('pedro@acc.test', '111111') from generate_series(1, 5); end $$;
select is(educador_entrar('pedro@acc.test', '135790')->>'error', 'bloqueado', 'tras 5 fallos, el correo queda bloqueado');

-- ── Primera vez: el enlace de acceso (0013) y su PIN propio ───────────────────
select is(educador_acceso('enlace-de-lucia')->>'correo', 'lucia@acc.test', 'el enlace dice de quién es');
select is(educador_acceso('enlace-de-lucia')->>'primera_vez', 'true', 'y que elige su primer PIN');
select is(educador_acceso('enlace-falso')->>'error', 'no_vale', 'un enlace falso no vale');
select is(educador_usar_acceso('enlace-de-lucia', '12')->>'error', 'pin_invalido', 'el PIN son 6 dígitos');
select is(educador_usar_acceso('enlace-de-lucia', '000000')->>'ok', 'true',
  'con el enlace elige su PIN (cualquiera, también 000000) y entra');
select is(educador_entrar('lucia@acc.test', '000000')->>'ok', 'true', 'desde entonces entra con su PIN');
select is(educador_usar_acceso('enlace-de-lucia', '111111')->>'error', 'no_vale', 'y el enlace ya no sirve otra vez');

-- ── María: su sesión ──────────────────────────────────────────────────────────
select set_config('t.token', educador_entrar(' Maria@Acc.test ', '246-810')->>'token', true);
select is(length(current_setting('t.token')), 64, 'con correo y PIN entra (sin importar mayúsculas, espacios ni guiones)');
select is(educador_sesion(current_setting('t.token'))->>'correo', 'maria@acc.test', 'la sesión dice quién es');
select is(
  (select array_agg(o->>'nombre') from jsonb_array_elements(educador_sesion(current_setting('t.token'))->'organizaciones') o),
  array['Acceso Centro'], 'y en qué organizaciones trabaja');
select is(educador_sesion(current_setting('t.token'))->'organizaciones'->0 ? 'comunidades', false,
  'la organización va sola, sin comunidades');

-- ── Sus workshops y su guía ───────────────────────────────────────────────────
select is(jsonb_array_length(educador_workshops(current_setting('t.token'))), 7,
  've 7 workshops: publicados, finalizados y el cancelado (no el borrador ni los de otros)');
select is(
  (select array_agg(distinct t->'organizacion'->>'nombre') from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t),
  array['Acceso Centro'], 'cada workshop dice de qué organización es');
select is(
  (select count(*)::int from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t where t->'jornada' <> 'null'),
  4, 'y de qué jornada, si es parte de una');
select is(
  (select t->'jornada'->>'nombre' || ' ' || (t->'jornada'->>'fecha_inicio') from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t
    where t->>'id' = current_setting('t.hoy')),
  'Acceso Jornada ' || (current_date - 3)::text, 'con su nombre y sus fechas');
select is(
  (select count(*)::int from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t where t->'cierre' <> 'null'),
  2, 'dos ya tienen su feedback');
select is(
  (select t->>'motivoCancelacion' from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t
    where t->>'estadoWorkshop' = 'cancelado'),
  'Feriado escolar', 'el cancelado llega con su motivo');
select is(
  (select t->'storyboard'->>'eje' from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t limit 1),
  'alimentacion', 'cada workshop trae la carpeta de la categoría para la URL del runner');
select is(jsonb_array_length(educador_workshops(current_setting('t.token'), current_date, current_date)), 2,
  'filtra por rango de fechas');

select is((select count(*)::int from jsonb_object_keys(educador_guia(current_setting('t.token'), current_setting('t.hoy')::bigint))), 4,
  'la guía trae sus 4 escenas');
select is(educador_guia(current_setting('t.token'), current_setting('t.hoy')::bigint)->'bienvenida'->>'verb', 'Situar',
  'con las claves del contrato del runner');
select is(educador_guia(current_setting('t.token'), current_setting('t.hoy')::bigint)->'descubrimiento'->>'order', '3',
  'y el orden de cada escena, para mostrarla en la ficha (0015)');
select is(educador_guia(current_setting('t.token'), current_setting('t.hoy')::bigint)->'origen'->>'title', 'origen',
  'y su título en el idioma del taller');
select throws_ok(
  format('select educador_guia(%L, %s)', current_setting('t.token'), current_setting('t.taller_pedro')),
  '42501', null, 'no puede leer la guía de un workshop que no es suyo');
select throws_ok(
  format('select educador_iniciar(%L, %s)', current_setting('t.token'), current_setting('t.cancelado')),
  '42501', null, 'no puede empezar un workshop cancelado');

-- ── Ejecución y feedback ──────────────────────────────────────────────────────
select lives_ok(format('select educador_iniciar(%L, %s)', current_setting('t.token'), current_setting('t.hoy')),
  'el runner dijo «listo»: empieza');
select is((select count(*)::int from workshop_educadores), 0, 'anon no lee asignaciones directamente');
reset role;
select is((select estado::text from workshop_educadores we where we.workshop_id = current_setting('t.hoy')::bigint
              and we.educador_id = current_setting('t.maria')::bigint), 'EN_CURSO', 'la asignación queda en curso');
select pruebas.como_anon();
select is(
  educador_guardar_feedback(current_setting('t.token'), current_setting('t.hoy')::bigint,
    '{"calificacion": 4, "asistentes": 22, "participacion": "alta", "claridad": "clara", "costo": "", "faltoMaterial": "Láminas"}'),
  '{"calificacion": 4, "asistentes": 22, "participacion": "alta", "claridad": "clara", "costo": "", "faltoMaterial": "Láminas"}'::jsonb,
  'guarda el feedback del grupo');
reset role;
select is((select estado::text from workshop_educadores we where we.workshop_id = current_setting('t.hoy')::bigint
              and we.educador_id = current_setting('t.maria')::bigint), 'COMPLETADO', 'con el feedback, la asignación queda completada');
select is((select estado::text from workshops where id = current_setting('t.hoy')::bigint), 'FINALIZADO',
  'y el workshop, finalizado (era su única educadora)');
select pruebas.como_anon();
select throws_ok(
  format('select educador_guardar_feedback(%L, %s, %L)', current_setting('t.token'), current_setting('t.hoy'),
         '{"calificacion": 9, "asistentes": 22, "participacion": "alta", "claridad": "clara"}'),
  '23514', null, 'puede corregir el feedback ya finalizado, pero con una calificación de 1 a 5');

-- ── La misma persona en otra organización ─────────────────────────────────────
reset role;
insert into educadores (nombre, correo, pin_hash, organizacion_id)
values ('María', 'maria@acc.test', extensions.crypt('246810', extensions.gen_salt('bf', 8)), current_setting('t.norte')::bigint);
insert into workshop_educadores (workshop_id, educador_id)
select current_setting('t.taller_pedro')::bigint, e.id from educadores e
 where e.correo = 'maria@acc.test' and e.organizacion_id = current_setting('t.norte')::bigint;
select pruebas.como_anon();
select set_config('t.token2', educador_entrar('maria@acc.test', '246810')->>'token', true);
select is(jsonb_array_length(educador_sesion(current_setting('t.token2'))->'organizaciones'), 2,
  'con el mismo PIN en Acceso Norte, una sola sesión le muestra sus dos organizaciones');
select is(
  (select count(distinct t->'organizacion'->>'nombre')::int from jsonb_array_elements(educador_workshops(current_setting('t.token2'))) t),
  2, 'y sus workshops de las dos');

-- ── Lo que no puede hacer nadie sin permiso ───────────────────────────────────
select throws_ok($$ select educador_workshops('token-falso') $$, '28000', null, 'un token falso no vale');
select throws_ok($$ select educadores_de_sesion('x') $$, '42501', null, 'las funciones internas no se pueden llamar');
select throws_ok(format('select educador_crear_acceso(%s)', current_setting('t.maria')), '42501', null,
  'anon no crea enlaces de acceso');
select throws_ok($$ select count(*) from educador_sesiones $$, '42501', null, 'anon no lee las sesiones');

-- ── Admin crea un enlace para un PIN nuevo (lo olvidó) ────────────────────────
select pruebas.como('30000000-0000-4000-8000-000000000004');
select throws_ok(format('select educador_crear_acceso(%s)', current_setting('t.maria')), '42501', null,
  'el admin de otra organización no crea enlaces para María de Acceso Centro');
select pruebas.como('30000000-0000-4000-8000-000000000003');
select set_config('t.enlace', educador_crear_acceso(current_setting('t.maria')::bigint)->>'token', true);
select is(length(current_setting('t.enlace')), 48, 'el colaborador de su organización sí');
select isnt((select acceso_creado_en from educadores where id = current_setting('t.maria')::bigint), null, 'y queda cuándo se creó');
select pruebas.como_anon();
select is(educador_sesion(current_setting('t.token'))->>'correo', 'maria@acc.test', 'crear el enlace no cierra su sesión');
select is(educador_entrar('maria@acc.test', '246810')->>'ok', 'true', 'y su PIN sigue valiendo hasta que lo use');
select is(educador_acceso(current_setting('t.enlace'))->>'primera_vez', 'false', 'el enlace sabe que es un PIN nuevo');
select is(educador_usar_acceso(current_setting('t.enlace'), '135135')->>'ok', 'true', 'con él elige uno nuevo y entra');
select throws_ok(format('select educador_sesion(%L)', current_setting('t.token')), '28000', null,
  'y sus sesiones anteriores de Acceso Centro se cierran');
select is(jsonb_array_length(educador_entrar('maria@acc.test', '246810')->'educador'->'organizaciones'), 1,
  'con el PIN anterior ya solo entra a Acceso Norte, que no cambió');
select set_config('t.token4', educador_entrar('maria@acc.test', '135135')->>'token', true);
select is(educador_verificar_pin(current_setting('t.token4'), '000000')->>'error', 'pin_actual',
  'para cambiarlo desde su sesión, primero confirma que es él con su PIN actual');
select is(educador_verificar_pin(current_setting('t.token4'), '135135')->>'ok', 'true', 'con el correcto, sí');
select is(educador_cambiar_pin(current_setting('t.token4'), '000000', '246246')->>'error', 'pin_actual',
  'y cambiarlo lo vuelve a comprobar');
select is(educador_cambiar_pin(current_setting('t.token4'), '135135', '246246')->>'ok', 'true', 'y con él lo cambia');
select set_config('t.token3', educador_entrar('maria@acc.test', '246246')->>'token', true);
select is(length(current_setting('t.token3')), 64, 'entra con el PIN cambiado');

-- ── Revocar el enlace pendiente, como una invitación ──────────────────────────
select pruebas.como('30000000-0000-4000-8000-000000000003');
select set_config('t.enlace2', educador_crear_acceso(current_setting('t.maria')::bigint)->>'token', true);
select pruebas.como('30000000-0000-4000-8000-000000000004');
select throws_ok(format('select educador_revocar_acceso(%s)', current_setting('t.maria')), '42501', null,
  'el admin de otra organización no revoca el enlace de María');
select pruebas.como_anon();
select throws_ok(format('select educador_revocar_acceso(%s)', current_setting('t.maria')), '42501', null, 'anon tampoco');
select pruebas.como('30000000-0000-4000-8000-000000000003');
select lives_ok(format('select educador_revocar_acceso(%s)', current_setting('t.maria')), 'quien opera su organización lo revoca');
select is((select acceso_token from educadores where id = current_setting('t.maria')::bigint), null, 'y ya no queda pendiente');
select pruebas.como_anon();
select is(educador_acceso(current_setting('t.enlace2'))->>'error', 'no_vale', 'el enlace revocado no vale');
select is(educador_usar_acceso(current_setting('t.enlace2'), '999999')->>'error', 'no_vale', 'ni para elegir un PIN');
select is(educador_entrar('maria@acc.test', '246246')->>'ok', 'true', 'y su PIN sigue valiendo');

-- ── Un educador apartado (activo = false) deja de entrar ──────────────────────
reset role;
update educadores set activo = false where id = current_setting('t.maria')::bigint;
select pruebas.como_anon();
select throws_ok(format('select educador_sesion(%L)', current_setting('t.token3')), '28000', null,
  'al desactivar a María en Acceso Centro, su sesión de ahí deja de valer');
select is(educador_entrar('maria@acc.test', '246246')->>'error', 'credenciales', 'y no vuelve a entrar con ese acceso');

select * from finish();
rollback;
