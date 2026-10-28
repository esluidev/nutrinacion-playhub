-- Acceso de los educadores sin Supabase Auth (0006), sobre el seed. Educators usa la anon key
-- y un token: aquí todo se llama como anon, salvo la generación del código (Admin).
-- Seed: maria@ejemplo.test PIN 246810 (Fundación Centro: Comunidad Centro y Sur),
--       pedro@ejemplo.test PIN 135790 (Colegio Norte), lucia@ejemplo.test con código de activación 112233.
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

create function pruebas.como_anon() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

select set_config('t.maria', (select id from educadores where correo = 'maria@ejemplo.test')::text, true);
select set_config('t.taller_pedro', (select w.id from workshops w join workshop_educadores we on we.workshop_id = w.id
                                      join educadores e on e.id = we.educador_id where e.correo = 'pedro@ejemplo.test')::text, true);
select set_config('t.taller_hoy', (select min(w.id) from workshops w join workshop_educadores we on we.workshop_id = w.id
                                    join educadores e on e.id = we.educador_id
                                   where e.correo = 'maria@ejemplo.test' and w.fecha = current_date)::text, true);
select set_config('t.taller_cancelado', (select id from workshops where estado = 'CANCELADO')::text, true);

select pruebas.como_anon();

-- ── Entrar con PIN ────────────────────────────────────────────────────────────
select is(educador_entrar('maria@ejemplo.test', '000000'), '{"ok": false, "error": "credenciales"}'::jsonb,
  'un PIN incorrecto no entra');
select is(educador_entrar('maria@ejemplo.test', 'abc'), '{"ok": false, "error": "credenciales"}'::jsonb,
  'un PIN mal formado no entra');
select is(educador_entrar('nadie@ejemplo.test', '246810'), '{"ok": false, "error": "credenciales"}'::jsonb,
  'un correo desconocido da el mismo error');

do $$ begin perform educador_entrar('pedro@ejemplo.test', '111111') from generate_series(1, 5); end $$;
select is(educador_entrar('pedro@ejemplo.test', '135790')->>'error', 'bloqueado', 'tras 5 fallos, el correo queda bloqueado');

-- ── Primera vez: código de activación y PIN propio ────────────────────────────
select is(educador_entrar('lucia@ejemplo.test', '112233')->>'error', 'definir_pin',
  'con el código de activación, Educators le pide elegir su PIN');
select is(educador_activar('lucia@ejemplo.test', '999999', '000000')->>'error', 'credenciales',
  'activar con un código equivocado no vale');
select is(educador_activar('lucia@ejemplo.test', '112233', '12')->>'error', 'pin_invalido', 'el PIN son 6 dígitos');
select is(educador_activar('lucia@ejemplo.test', '112233', '000000')->>'ok', 'true',
  'con el código bueno elige su PIN (cualquiera, también 000000) y entra');
select is(educador_entrar('lucia@ejemplo.test', '000000')->>'ok', 'true', 'desde entonces entra con su PIN');
select is(educador_entrar('lucia@ejemplo.test', '112233')->>'error', 'credenciales', 'y el código de activación ya no sirve');

-- ── María: una cuenta, dos comunidades ────────────────────────────────────────
select set_config('t.token', educador_entrar(' Maria@Ejemplo.test ', '246-810')->>'token', true);
select is(length(current_setting('t.token')), 64, 'con correo y PIN entra (sin importar mayúsculas, espacios ni guiones)');
select is(educador_sesion(current_setting('t.token'))->>'correo', 'maria@ejemplo.test', 'la sesión dice quién es');
select is(
  (select array_agg(c->>'nombre' order by c->>'nombre')
     from jsonb_array_elements(educador_sesion(current_setting('t.token'))->'organizaciones'->0->'comunidades') c),
  array['Comunidad Centro', 'Comunidad Sur'], 'y sus comunidades en Fundación Centro');

-- ── Sus workshops y su guía ───────────────────────────────────────────────────
select is(jsonb_array_length(educador_workshops(current_setting('t.token'))), 12,
  've 12 workshops de sus dos comunidades: publicados, finalizados y el cancelado (no el borrador ni los de otros)');
select is(
  (select count(distinct t->'comunidad'->>'nombre')::int from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t),
  2, 'de Comunidad Centro y de Comunidad Sur, con la misma sesión');
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

select is((select count(*)::int from jsonb_object_keys(educador_guia(current_setting('t.token'), current_setting('t.taller_hoy')::bigint))), 4,
  'la guía trae sus 4 escenas');
select is(educador_guia(current_setting('t.token'), current_setting('t.taller_hoy')::bigint)->'bienvenida'->>'verb', 'Situar',
  'con las claves del contrato del runner');
select throws_ok(
  format('select educador_guia(%L, %s)', current_setting('t.token'), current_setting('t.taller_pedro')),
  '42501', null, 'no puede leer la guía de un workshop que no es suyo');
select throws_ok(
  format('select educador_iniciar(%L, %s)', current_setting('t.token'), current_setting('t.taller_cancelado')),
  '42501', null, 'no puede empezar un workshop cancelado');

-- ── Ejecución y feedback ──────────────────────────────────────────────────────
select lives_ok(format('select educador_iniciar(%L, %s)', current_setting('t.token'), current_setting('t.taller_hoy')),
  'el runner dijo «listo»: empieza');
select is((select count(*)::int from workshop_educadores), 0, 'anon no lee asignaciones directamente');
reset role;
select is((select estado::text from workshop_educadores we where we.workshop_id = current_setting('t.taller_hoy')::bigint
              and we.educador_id = current_setting('t.maria')::bigint), 'EN_CURSO', 'la asignación queda en curso');
select pruebas.como_anon();
select is(
  educador_guardar_feedback(current_setting('t.token'), current_setting('t.taller_hoy')::bigint,
    '{"calificacion": 4, "asistentes": 22, "participacion": "alta", "claridad": "clara", "costo": "", "faltoMaterial": "Láminas"}'),
  '{"calificacion": 4, "asistentes": 22, "participacion": "alta", "claridad": "clara", "costo": "", "faltoMaterial": "Láminas"}'::jsonb,
  'guarda el feedback del grupo');
reset role;
select is((select estado::text from workshop_educadores we where we.workshop_id = current_setting('t.taller_hoy')::bigint
              and we.educador_id = current_setting('t.maria')::bigint), 'COMPLETADO', 'con el feedback, la asignación queda completada');
select is((select estado::text from workshops where id = current_setting('t.taller_hoy')::bigint), 'FINALIZADO',
  'y el workshop, finalizado (era su única educadora)');
select pruebas.como_anon();
select throws_ok(
  format('select educador_guardar_feedback(%L, %s, %L)', current_setting('t.token'), current_setting('t.taller_hoy'),
         '{"calificacion": 9, "asistentes": 22, "participacion": "alta", "claridad": "clara"}'),
  '23514', null, 'puede corregir el feedback ya finalizado, pero con una calificación de 1 a 5');

-- ── La misma persona en otra organización ─────────────────────────────────────
reset role;
insert into educadores (nombre, correo, pin_hash, organizacion_id)
values ('María', 'maria@ejemplo.test', extensions.crypt('246810', extensions.gen_salt('bf', 8)),
        (select id from organizaciones where nombre = 'Colegio Norte'));
insert into comunidad_educadores (educador_id, comunidad_id)
select e.id, c.id from educadores e, comunidades c
 where e.correo = 'maria@ejemplo.test' and e.organizacion_id = c.organizacion_id and c.nombre = 'Comunidad Norte';
insert into workshop_educadores (workshop_id, educador_id)
select current_setting('t.taller_pedro')::bigint, e.id from educadores e
  join organizaciones o on o.id = e.organizacion_id where e.correo = 'maria@ejemplo.test' and o.nombre = 'Colegio Norte';
select pruebas.como_anon();
select set_config('t.token2', educador_entrar('maria@ejemplo.test', '246810')->>'token', true);
select is(jsonb_array_length(educador_sesion(current_setting('t.token2'))->'organizaciones'), 2,
  'con el mismo PIN en Colegio Norte, una sola sesión le muestra sus dos organizaciones');
select is(
  (select count(distinct t->'comunidad'->>'nombre')::int from jsonb_array_elements(educador_workshops(current_setting('t.token2'))) t),
  3, 'y sus workshops de las tres comunidades');

-- ── Lo que no puede hacer nadie sin permiso ───────────────────────────────────
select throws_ok($$ select educador_workshops('token-falso') $$, '28000', null, 'un token falso no vale');
select throws_ok($$ select educadores_de_sesion('x') $$, '42501', null, 'las funciones internas no se pueden llamar');
select throws_ok(format('select educador_generar_codigo(%s)', current_setting('t.maria')), '42501', null,
  'anon no genera códigos');
select throws_ok($$ select count(*) from educador_sesiones $$, '42501', null, 'anon no lee las sesiones');

-- ── Admin genera un código de activación nuevo ────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000004');
select throws_ok(format('select educador_generar_codigo(%s)', current_setting('t.maria')), '42501', null,
  'el admin de otra organización no genera códigos para María de Fundación Centro');
select pruebas.como('00000000-0000-4000-8000-000000000003');
select set_config('t.codigo', educador_generar_codigo(current_setting('t.maria')::bigint), true);
select matches(current_setting('t.codigo'), '^\d{6}$', 'el colaborador de una comunidad donde está ligada sí: 6 dígitos');
select pruebas.como_anon();
select throws_ok(format('select educador_sesion(%L)', current_setting('t.token')), '28000', null,
  'el código nuevo cierra sus sesiones de Fundación Centro');
select is(educador_entrar('maria@ejemplo.test', current_setting('t.codigo'))->>'error', 'definir_pin',
  'y con él vuelve a elegir PIN');
select is(educador_activar('maria@ejemplo.test', current_setting('t.codigo'), '135135')->>'ok', 'true', 'elige uno nuevo');
select lives_ok(format('select educador_cambiar_pin(%L, %L)', educador_entrar('maria@ejemplo.test', '135135')->>'token', '246246'),
  'y lo puede cambiar desde su sesión');
select is(educador_entrar('maria@ejemplo.test', '246246')->>'ok', 'true', 'entra con el PIN cambiado');

select * from finish();
rollback;
