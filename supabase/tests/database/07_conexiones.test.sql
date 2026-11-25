-- La conexión del taller (tarea 013): Educators la abre al iniciar (código y llave), la pantalla del
-- educador aprueba y quita con la llave, el dispositivo se une solo con el código, y se cierra al
-- terminar o al dejar de estar publicado. No usa el seed: crea sus propios datos (prefijo «Cx»,
-- correos @cx.test) en una transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

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
insert into organizaciones (nombre, paises) values ('Cx Centro', '{GT}'), ('Cx Norte', '{GT}');
insert into organizacion_licencias (organizacion_id, fecha_inicio) select id, current_date - 30 from organizaciones where nombre like 'Cx %';
select set_config('t.centro', (select id from organizaciones where nombre = 'Cx Centro')::text, true);
select set_config('t.norte', (select id from organizaciones where nombre = 'Cx Norte')::text, true);

-- …02 admin de Centro · …04 admin de Norte
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('70000000-0000-4000-8000-000000000002'::uuid, 'a@cx.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.centro')::bigint)),
    ('70000000-0000-4000-8000-000000000004'::uuid, 'n@cx.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.norte')::bigint))
  ) as v (id, email, app);

insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, duracion_min, numero_escenas, estado_publicacion, paises_disponibles)
values ('c0000000-0000-4000-8000-000000000001', 'cx-huevo', '{"es":"El huevo"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 30, 4, 'PUBLICADO', '{GT}');
insert into lugares (nombre, organizacion_id) values ('Cx Escuela', current_setting('t.centro')::bigint);
insert into grupos_audiencia (nombre, organizacion_id) values ('Cx 2.º B', current_setting('t.centro')::bigint);
insert into educadores (nombre, apellido, correo, pin_hash, organizacion_id)
values ('Ana', 'Ruiz', 'ana@cx.test', extensions.crypt('246810', extensions.gen_salt('bf', 8)), current_setting('t.centro')::bigint);

-- Dos talleres publicados hoy con Ana.
create function pruebas.taller() returns bigint language plpgsql as $$
declare v_w bigint;
begin
  insert into workshops (fecha, hora_inicio, hora_fin, espacio, idioma_contenido, storyboard_id, organizacion_id, lugar_id, grupo_audiencia_id, titulo)
  values (current_date, '09:00', '09:30', 'Aula', 'es', (select id from storyboards where slug = 'cx-huevo'),
          current_setting('t.centro')::bigint, (select id from lugares where nombre = 'Cx Escuela'),
          (select id from grupos_audiencia where nombre = 'Cx 2.º B'), 'El huevo en el recreo')
  returning id into v_w;
  insert into workshop_educadores (workshop_id, educador_id) values (v_w, (select id from educadores where correo = 'ana@cx.test'));
  update workshops set estado = 'PUBLICADO' where id = v_w;
  return v_w;
end $$;
select set_config('t.w1', pruebas.taller()::text, true);
select set_config('t.w2', pruebas.taller()::text, true);

select pruebas.como_anon();
select set_config('t.token', educador_entrar('ana@cx.test', '246810')->>'token', true);

-- ── Educators abre la conexión al iniciar ─────────────────────────────────────
select set_config('t.c1', educador_iniciar(current_setting('t.token'), current_setting('t.w1')::bigint)::text, true);
select set_config('t.codigo', current_setting('t.c1')::jsonb->>'codigo', true);
select set_config('t.llave_vieja', current_setting('t.c1')::jsonb->>'llave', true);
select matches(current_setting('t.codigo'), '^[A-HJKMNP-Z2-9]{6}$', 'al iniciar, el taller abre su conexión con un código de 6, sin letras que se confundan');
select set_config('t.c1b', educador_iniciar(current_setting('t.token'), current_setting('t.w1')::bigint)::text, true);
select set_config('t.llave', current_setting('t.c1b')::jsonb->>'llave', true);
select is(current_setting('t.c1b')::jsonb->>'codigo', current_setting('t.codigo'), 'si la pantalla se recarga, sigue el mismo código');
select isnt(current_setting('t.llave'), current_setting('t.llave_vieja'), 'con una llave nueva');
select throws_ok(format('select conexion_participantes(%L, %L)', current_setting('t.codigo'), current_setting('t.llave_vieja')),
  '28000', null, 'y la anterior ya no vale');
select isnt(educador_iniciar(current_setting('t.token'), current_setting('t.w2')::bigint)->>'codigo', current_setting('t.codigo'),
  'otro taller en curso tiene otro código');

-- ── El dispositivo se une con el código ───────────────────────────────────────
select is(participante_buscar(lower(current_setting('t.codigo')))->>'titulo', 'El huevo en el recreo',
  'con el código (también en minúsculas) encuentra el taller');
select is(participante_buscar(current_setting('t.codigo'))->'storyboard'->>'slug', 'cx-huevo', 'y lo que necesita para abrirlo');
select is(participante_buscar('ZZZZZZ'), null, 'un código que no está en curso no encuentra nada');
select is(participante_entrar(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000001', 'oso', 'Pedrito')->>'estado',
  'esperando', 'pide entrar con su avatar y su apodo, y espera');
select is(participante_entrar(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000001', 'rana', 'Pedrito')->>'estado',
  'esperando', 'mientras espera puede cambiar de avatar');
select is(participante_estado(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000001')->>'avatar', 'rana', 'y queda el nuevo');
select participante_entrar(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000002', 'zorro', '   ');
select is(participante_estado(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000002')->>'apodo', null,
  'sin apodo, queda vacío (se muestra el nombre del avatar)');
select participante_entrar(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000003', 'gato', 'Un apodo larguísimo de verdad');
select is(char_length(participante_estado(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000003')->>'apodo'), 20,
  'el apodo se corta a 20 letras');
select throws_ok(format('select participante_entrar(%L, %L, %L)', current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000009', 'Perro 1'),
  '23514', null, 'un avatar que no es una clave se rechaza');
select throws_ok(format('select participante_entrar(%L, %L, %L)', 'ZZZZZZ', 'd0000000-0000-4000-8000-000000000009', 'oso'),
  'P0002', null, 'sin un taller en curso con ese código no se entra');

-- ── La pantalla del educador aprueba y quita con la llave ─────────────────────
select is(jsonb_array_length(conexion_participantes(current_setting('t.codigo'), current_setting('t.llave'))), 3,
  'el educador ve a los que piden entrar');
select throws_ok(format('select conexion_participantes(%L, %L)', current_setting('t.codigo'), 'otra-llave'),
  '28000', null, 'sin la llave, nadie más los ve');
select throws_ok(format('select conexion_aprobar(%L, %L)', current_setting('t.codigo'), 'otra-llave'),
  '28000', null, 'ni los aprueba');
select is(jsonb_array_length(conexion_aprobar(current_setting('t.codigo'), current_setting('t.llave'),
  '{d0000000-0000-4000-8000-000000000003}')), 1, 'aprueba a uno');
select is(conexion_rechazar(current_setting('t.codigo'), current_setting('t.llave'), 'd0000000-0000-4000-8000-000000000002'), true,
  'rechaza a otro que espera');
select is(participante_estado(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000002')->>'estado', 'rechazado',
  'y el dispositivo lo sabe');
select is(jsonb_array_length(conexion_aprobar(current_setting('t.codigo'), current_setting('t.llave'))), 1,
  '«Aprobar a todos» solo aprueba a los que esperan');
select is(participante_entrar(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000001', 'leon', 'Otro')->>'estado',
  'aprobado', 'ya aprobado, volver a pedir entrar no lo devuelve a la espera');
select is(participante_estado(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000001')->>'avatar', 'rana',
  'ni le cambia el avatar');

-- El tiempo conectado: entra, pasa minuto y medio, sale y vuelve.
select conexion_presencia(current_setting('t.codigo'), current_setting('t.llave'), '{d0000000-0000-4000-8000-000000000001}', null);
select ok((conexion_participantes(current_setting('t.codigo'), current_setting('t.llave'))->0->>'conectado')::boolean,
  'la pantalla anota que se conectó');
reset role;
update workshop_conexion_participantes set conectado_desde = now() - interval '90 seconds'
 where dispositivo = 'd0000000-0000-4000-8000-000000000001';
select pruebas.como_anon();
select conexion_presencia(current_setting('t.codigo'), current_setting('t.llave'), null, '{d0000000-0000-4000-8000-000000000001}');
select is((conexion_participantes(current_setting('t.codigo'), current_setting('t.llave'))->0->>'segundos')::int, 90,
  'al salir, suma el tiempo que estuvo');
select conexion_presencia(current_setting('t.codigo'), current_setting('t.llave'), '{d0000000-0000-4000-8000-000000000001,d0000000-0000-4000-8000-000000000002}', null);
select is((conexion_participantes(current_setting('t.codigo'), current_setting('t.llave'))->1->>'conectado')::boolean, false,
  'a un rechazado no se le cuenta tiempo');
select is(conexion_rechazar(current_setting('t.codigo'), current_setting('t.llave'), 'd0000000-0000-4000-8000-000000000003'), true,
  'quita a uno que ya estaba');
select is(participante_estado(current_setting('t.codigo'), 'd0000000-0000-4000-8000-000000000003')->>'estado', 'quitado', 'queda quitado');

-- ── Nadie lee las tablas sin permiso ──────────────────────────────────────────
select is((select count(*)::int from workshop_conexiones), 0, 'anon no lee las conexiones');
select is((select count(*)::int from workshop_conexion_participantes), 0, 'ni los participantes');
select pruebas.como('70000000-0000-4000-8000-000000000004');
select is((select count(*)::int from workshop_conexion_participantes), 0, 'el admin de otra organización tampoco');
select pruebas.como('70000000-0000-4000-8000-000000000002');
select is((select count(*)::int from workshop_conexion_participantes), 3, 'el de su organización sí, para el reporte');

-- ── Al terminar se cierra ─────────────────────────────────────────────────────
select pruebas.como_anon();
select educador_terminar(current_setting('t.token'), current_setting('t.w1')::bigint);
select is(participante_buscar(current_setting('t.codigo')), null, 'al terminar el taller, el código deja de valer');
select is((select (t->>'dispositivosUnidos')::int from jsonb_array_elements(educador_workshops(current_setting('t.token'))) t
            where t->>'id' = current_setting('t.w1')), 2,
  'y quedan para el cierre los dispositivos que se unieron (los aprobados, también el quitado)');
reset role;
select is((select conectado_desde from workshop_conexion_participantes where dispositivo = 'd0000000-0000-4000-8000-000000000001'), null,
  'y se cierra el tiempo de quien seguía conectado');
select pruebas.como('70000000-0000-4000-8000-000000000002');
select ok((reporte_talleres(current_setting('t.centro')::bigint, current_date - 1, current_date + 1)->'resumen'->>'segundos_dispositivos')::int >= 90,
  'el reporte suma el tiempo conectado de los dispositivos');

-- Un taller que deja de estar publicado sin que el educador lo termine (la tarea horaria lo
-- finaliza) también cierra su conexión.
reset role;
update workshops set estado = 'FINALIZADO' where id = current_setting('t.w2')::bigint;
select is((select count(*)::int from workshop_conexiones where workshop_id = current_setting('t.w2')::bigint and cerrada_en is null), 0,
  'al finalizarse un taller sin terminarlo, su conexión se cierra');

select * from finish();
rollback;
