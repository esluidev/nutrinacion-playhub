-- Programas, lugares, comunidades, grupos de audiencia, el historial del taller y el reporte
-- (tarea 021): quién los ve, cómo se heredan de la jornada, qué se rechaza y qué cuenta el reporte.
-- No usa el seed: crea sus propios datos (prefijo «PR», correos @pr.test) en una transacción que
-- se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(47);

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
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
end $$;

-- ── Datos propios ─────────────────────────────────────────────────────────────
insert into organizaciones (nombre, paises) values ('PR Centro', '{GT}'), ('PR Norte', '{GT}');
insert into organizacion_licencias (organizacion_id, fecha_inicio) select id, current_date - 90 from organizaciones where nombre like 'PR %';
select set_config('t.centro', (select id from organizaciones where nombre = 'PR Centro')::text, true);
select set_config('t.norte', (select id from organizaciones where nombre = 'PR Norte')::text, true);

-- …01 superadmin · …02 admin de Centro · …03 colaborador de Centro · …04 admin de Norte
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, v.app, '{}', now(), now()
  from (values
    ('60000000-0000-4000-8000-000000000001'::uuid, 's@pr.test', '{}'::jsonb),
    ('60000000-0000-4000-8000-000000000002'::uuid, 'a@pr.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.centro')::bigint)),
    ('60000000-0000-4000-8000-000000000003'::uuid, 'c@pr.test',
      jsonb_build_object('role', 'COLABORADOR', 'organizacion_id', current_setting('t.centro')::bigint)),
    ('60000000-0000-4000-8000-000000000004'::uuid, 'n@pr.test',
      jsonb_build_object('role', 'ADMIN', 'titular', true, 'organizacion_id', current_setting('t.norte')::bigint))
  ) as v (id, email, app);
update perfiles set superadmin = true where email = 's@pr.test';

insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, idiomas, estado_publicacion, paises_disponibles) values
  ('e0000000-0000-4000-8000-000000000001', 'pr-huevo', '{"es":"PR huevo"}', 'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{es}', 'PUBLICADO', '{GT}');
select set_config('t.sb', (select id from storyboards where slug = 'pr-huevo')::text, true);

insert into educadores (nombre, correo, organizacion_id) values
  ('Ana', 'ana@pr.test', current_setting('t.centro')::bigint), ('Marco', 'marco@pr.test', current_setting('t.centro')::bigint);
select set_config('t.ana', (select id from educadores where correo = 'ana@pr.test')::text, true);
select set_config('t.marco', (select id from educadores where correo = 'marco@pr.test')::text, true);

insert into comunidades (nombre, organizacion_id) values ('PR San Isidro', current_setting('t.centro')::bigint);
select set_config('t.san_isidro', (select id from comunidades where nombre = 'PR San Isidro')::text, true);
insert into lugares (nombre, comunidad_id, organizacion_id) values
  ('PR Escuela 2', current_setting('t.san_isidro')::bigint, current_setting('t.centro')::bigint),
  ('PR Escuela San Isidro', current_setting('t.san_isidro')::bigint, current_setting('t.centro')::bigint),
  ('PR Plaza', current_setting('t.san_isidro')::bigint, current_setting('t.centro')::bigint),
  ('PR Centro de salud', null, current_setting('t.centro')::bigint),
  ('PR Salón Norte', null, current_setting('t.norte')::bigint);
select set_config('t.e2', (select id from lugares where nombre = 'PR Escuela 2')::text, true);
select set_config('t.esi', (select id from lugares where nombre = 'PR Escuela San Isidro')::text, true);
select set_config('t.plaza', (select id from lugares where nombre = 'PR Plaza')::text, true);
select set_config('t.salud', (select id from lugares where nombre = 'PR Centro de salud')::text, true);
select set_config('t.salon_norte', (select id from lugares where nombre = 'PR Salón Norte')::text, true);
insert into grupos_audiencia (nombre, abierto, organizacion_id) values
  ('PR 1.º A', false, current_setting('t.centro')::bigint), ('PR Parvulario 6', false, current_setting('t.centro')::bigint),
  ('PR Público general', true, current_setting('t.centro')::bigint), ('PR Grupo Norte', false, current_setting('t.norte')::bigint);
select set_config('t.g1a', (select id from grupos_audiencia where nombre = 'PR 1.º A')::text, true);
select set_config('t.gp6', (select id from grupos_audiencia where nombre = 'PR Parvulario 6')::text, true);
select set_config('t.gpub', (select id from grupos_audiencia where nombre = 'PR Público general')::text, true);
select set_config('t.gnorte', (select id from grupos_audiencia where nombre = 'PR Grupo Norte')::text, true);
insert into programas (nombre, fecha_inicio, fecha_fin, organizacion_id)
values ('PR Crecer sano', current_date - 60, current_date + 30, current_setting('t.centro')::bigint);
select set_config('t.prog', (select id from programas where nombre = 'PR Crecer sano')::text, true);
insert into jornadas (nombre, lugar_id, programa_id, fecha_inicio, fecha_fin, organizacion_id)
values ('PR Feria', current_setting('t.plaza')::bigint, current_setting('t.prog')::bigint, current_date - 10, current_date - 10,
        current_setting('t.centro')::bigint);
select set_config('t.feria', (select id from jornadas where nombre = 'PR Feria')::text, true);

-- Un taller de Centro publicado (devuelve su id) y darlo con su cierre.
create function pruebas.taller(p_dias int, p_lugar bigint, p_grupo bigint, p_programa bigint,
                               p_jornada bigint default null, p_educadores bigint[] default null)
returns bigint language plpgsql as $$
declare v_w bigint; v_e bigint;
begin
  insert into workshops (fecha, hora_inicio, idioma_contenido, storyboard_id, organizacion_id, lugar_id, grupo_audiencia_id,
                         programa_id, jornada_id)
  values (current_date + p_dias, '09:00', 'es', current_setting('t.sb')::bigint, current_setting('t.centro')::bigint,
          p_lugar, p_grupo, p_programa, p_jornada)
  returning id into v_w;
  foreach v_e in array coalesce(p_educadores, array[current_setting('t.ana')::bigint]) loop
    insert into workshop_educadores (workshop_id, educador_id) values (v_w, v_e);
  end loop;
  update workshops set estado = 'PUBLICADO' where id = v_w;
  return v_w;
end $$;
create function pruebas.dar(p_taller bigint, p_total int, p_ninas int, p_ninos int,
                            p_educador bigint default null, p_dispositivos int default null)
returns void language plpgsql as $$
declare v_a bigint;
begin
  update workshop_educadores set iniciado_en = now() - interval '40 minutes', dispositivos_unidos = p_dispositivos
   where workshop_id = p_taller and educador_id = coalesce(p_educador, current_setting('t.ana')::bigint)
  returning id into v_a;
  insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, asistentes_ninas, asistentes_ninos,
                                 participacion_grupo, claridad_contenido)
  values (v_a, 4, p_total, p_ninas, p_ninos, 'ALTA', 'CLARA');
end $$;

-- El programa: 1.º A en la Escuela 2 (dos dados y uno cancelado); Parvulario 6 en la Escuela 2 y
-- en la Escuela San Isidro (este con dos educadores); la feria de público general dentro de la
-- jornada, que pide otro lugar y ningún programa. Fuera del programa, 1.º A en el Centro de salud.
select pruebas.dar(pruebas.taller(-50, current_setting('t.e2')::bigint, current_setting('t.g1a')::bigint, current_setting('t.prog')::bigint), 26, 13, 13);
select pruebas.dar(pruebas.taller(-43, current_setting('t.e2')::bigint, current_setting('t.g1a')::bigint, current_setting('t.prog')::bigint),
                   25, 12, 13, null, 7);
select pruebas.dar(pruebas.taller(-49, current_setting('t.e2')::bigint, current_setting('t.gp6')::bigint, current_setting('t.prog')::bigint), 20, 10, 10);
select set_config('t.dos', pruebas.taller(-48, current_setting('t.esi')::bigint, current_setting('t.gp6')::bigint, current_setting('t.prog')::bigint,
                                          null, array[current_setting('t.ana')::bigint, current_setting('t.marco')::bigint])::text, true);
select pruebas.dar(current_setting('t.dos')::bigint, 22, 12, 10);
select pruebas.dar(current_setting('t.dos')::bigint, 21, 11, 10, current_setting('t.marco')::bigint);
select set_config('t.taller_feria', pruebas.taller(-10, current_setting('t.e2')::bigint, current_setting('t.gpub')::bigint, null,
                                                   current_setting('t.feria')::bigint)::text, true);
select pruebas.dar(current_setting('t.taller_feria')::bigint, 150, null, null);
select set_config('t.cancelado', pruebas.taller(5, current_setting('t.e2')::bigint, current_setting('t.g1a')::bigint, current_setting('t.prog')::bigint)::text, true);
select pruebas.como('60000000-0000-4000-8000-000000000002');
update workshops set estado = 'CANCELADO', motivo_cancelacion = 'Fiesta patronal' where id = current_setting('t.cancelado')::bigint;
reset role;
select pruebas.dar(pruebas.taller(-20, current_setting('t.salud')::bigint, current_setting('t.g1a')::bigint, null), 18, 9, 9);

-- ── Quién ve y escribe ────────────────────────────────────────────────────────
select pruebas.como('60000000-0000-4000-8000-000000000003');
select is((select count(*)::int from grupos_audiencia where nombre like 'PR %'), 3, 'colaborador: ve los grupos de audiencia de su organización');
select is((select count(*)::int from lugares where nombre like 'PR %'), 4, 'colaborador: y sus lugares');
select lives_ok(format($$ insert into lugares (nombre, organizacion_id) values ('PR Lugar nuevo', %s) $$, current_setting('t.centro')),
  'colaborador: crea un lugar');
select lives_ok(format($$ insert into grupos_audiencia (nombre, organizacion_id) values ('PR Solo con nombre', %s) $$, current_setting('t.centro')),
  'colaborador: crea un grupo solo con el nombre');
select lives_ok(format($$ insert into programas (nombre, fecha_inicio, fecha_fin, organizacion_id) values ('PR Otro', current_date, current_date + 30, %s) $$,
                       current_setting('t.centro')), 'colaborador: crea un programa');
select pruebas.como('60000000-0000-4000-8000-000000000004');
select is((select count(*)::int from lugares where organizacion_id = current_setting('t.centro')::bigint)
          + (select count(*)::int from grupos_audiencia where organizacion_id = current_setting('t.centro')::bigint)
          + (select count(*)::int from programas where organizacion_id = current_setting('t.centro')::bigint)
          + (select count(*)::int from comunidades where organizacion_id = current_setting('t.centro')::bigint), 0,
  'el admin de otra organización no ve lugares, grupos, programas ni comunidades ajenos');
select throws_ok(format($$ insert into lugares (nombre, organizacion_id) values ('Intruso', %s) $$, current_setting('t.centro')),
  '42501', null, 'ni crea lugares en otra organización');
select pruebas.como('60000000-0000-4000-8000-000000000001');
select is((select count(*)::int from lugares where nombre like 'PR %'), 0, 'superadmin: no ve los lugares de la operación (decisión 008)');
select pruebas.como_anon();
select is((select count(*)::int from grupos_audiencia), 0, 'anon: nada');
reset role;
select is((select count(*)::int from grupos_audiencia where organizacion_id = current_setting('t.norte')::bigint
             and nombre = 'Público general' and abierto and publico_general), 1,
  'cada organización nace con su audiencia «Público general», abierta');
select set_config('t.pg_norte', (select id from grupos_audiencia where organizacion_id = current_setting('t.norte')::bigint and publico_general)::text, true);
select lives_ok(format($$ update grupos_audiencia set nombre = 'Público en general' where id = %s $$, current_setting('t.pg_norte')),
  'a «Público general» se le cambia el nombre');
select throws_ok(format($$ update grupos_audiencia set activo = false where id = %s $$, current_setting('t.pg_norte')),
  'P0001', null, 'pero no se desactiva');
select throws_ok(format($$ update grupos_audiencia set abierto = false where id = %s $$, current_setting('t.pg_norte')),
  'P0001', null, 'ni deja de ser abierta');
select throws_ok(format($$ delete from grupos_audiencia where id = %s $$, current_setting('t.pg_norte')),
  'P0001', null, 'ni se elimina');
select throws_ok(format($$ update grupos_audiencia set publico_general = true where id = %s $$, current_setting('t.gnorte')),
  'P0001', null, 'y ninguna otra pasa a serlo');

-- ── Piezas de otra organización ───────────────────────────────────────────────
reset role;
select throws_ok(format($$ insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id, lugar_id)
                           values (current_date, 'es', %s, %s, %s) $$, current_setting('t.sb'), current_setting('t.centro'), current_setting('t.salon_norte')),
  '23503', null, 'un taller no usa el lugar de otra organización');
select throws_ok(format($$ insert into workshops (fecha, idioma_contenido, storyboard_id, organizacion_id, grupo_audiencia_id)
                           values (current_date, 'es', %s, %s, %s) $$, current_setting('t.sb'), current_setting('t.centro'), current_setting('t.gnorte')),
  '23503', null, 'ni su grupo');

-- ── La jornada ────────────────────────────────────────────────────────────────
select is((select lugar_id || '/' || programa_id from workshops where id = current_setting('t.taller_feria')::bigint),
  current_setting('t.plaza') || '/' || current_setting('t.prog'), 'el taller de una jornada toma su lugar y su programa');

-- ── El reporte ────────────────────────────────────────────────────────────────
select pruebas.como('60000000-0000-4000-8000-000000000003');
select set_config('t.r', reporte_talleres(current_setting('t.centro')::bigint, current_date - 90, current_date + 30,
                                          p_programa_id => current_setting('t.prog')::bigint)::text, true);
select is((select r->'resumen'->>'previstos' || '/' || (r->'resumen'->>'realizados') || '/' || (r->'resumen'->>'cancelados')
             from (select current_setting('t.r')::jsonb as r) x), '6/5/1', 'reporte del programa: previstos, realizados y cancelados');
select is((select r->'resumen'->>'asistencias' || '/' || (r->'resumen'->>'asistencias_abiertos') from (select current_setting('t.r')::jsonb as r) x),
  '243/150', 'asistencias, y las del público general aparte');
select is((select r->'alcance'->>'total' || '/' || (r->'alcance'->>'ninas') || '/' || (r->'alcance'->>'ninos') from (select current_setting('t.r')::jsonb as r) x),
  '68/35/33', 'alcance por par grupo-lugar: Parvulario 6 suma sus dos lugares y el público general no cuenta');
select is((select p->>'ninas' || '/' || (p->>'ninos') from jsonb_array_elements(current_setting('t.r')::jsonb->'pares') p
            where (p->>'grupo_audiencia_id')::bigint = current_setting('t.gp6')::bigint and (p->>'lugar_id')::bigint = current_setting('t.esi')::bigint),
  '12/10', 'con dos cierres cuenta el de más asistentes');
select is((select p->>'recibidas' || ' de ' || (p->>'previstas') from jsonb_array_elements(current_setting('t.r')::jsonb->'pares') p
            where (p->>'grupo_audiencia_id')::bigint = current_setting('t.g1a')::bigint and (p->>'lugar_id')::bigint = current_setting('t.e2')::bigint),
  '2 de 3', 'la dosis: el cancelado cuenta como previsto y no recibido');
select is((select r->'resumen'->>'talleres_con_dispositivos' || '/' || (r->'resumen'->>'dispositivos') from (select current_setting('t.r')::jsonb as r) x),
  '1/7', 'los dispositivos');
select is((select h->>'tipo' || ' ' || (h->>'motivo') from jsonb_array_elements(current_setting('t.r')::jsonb->'historial') h),
  'CANCELADO Fiesta patronal', 'y el historial con su motivo');
select is((reporte_talleres(current_setting('t.centro')::bigint, current_date - 90, current_date + 30)->'alcance'->>'total'), '86',
  'el de la organización suma también lo de fuera del programa');
select is((reporte_talleres(current_setting('t.centro')::bigint, current_date - 90, current_date + 30,
                            p_comunidad_id => current_setting('t.san_isidro')::bigint)->'alcance'->>'total'), '68',
  'el de la comunidad, solo sus lugares');
select is((reporte_talleres(current_setting('t.centro')::bigint, current_date - 90, current_date + 30,
                            p_grupo_audiencia_id => current_setting('t.gp6')::bigint)->'alcance'->>'total'), '42',
  'el de un grupo junta todos sus lugares');
select pruebas.como('60000000-0000-4000-8000-000000000004');
select is((reporte_talleres(current_setting('t.centro')::bigint, current_date - 90, current_date + 30)->'resumen'->>'previstos'), '0',
  'el admin de otra organización no saca nada del reporte ajeno');
select pruebas.como_anon();
select throws_ok(format($$ select reporte_talleres(%s, current_date - 90, current_date) $$, current_setting('t.centro')),
  '42501', null, 'anon no llama al reporte');

-- ── Lo que se rechaza ─────────────────────────────────────────────────────────
select pruebas.como('60000000-0000-4000-8000-000000000002');
select throws_ok(format($$ update jornadas set lugar_id = %s where id = %s $$, current_setting('t.e2'), current_setting('t.feria')),
  'P0001', null, 'una jornada con talleres dados no cambia de lugar');
reset role;
insert into jornadas (nombre, lugar_id, programa_id, fecha_inicio, fecha_fin, organizacion_id)
values ('PR Visita', current_setting('t.e2')::bigint, current_setting('t.prog')::bigint, current_date + 7, current_date + 7, current_setting('t.centro')::bigint);
select set_config('t.visita', pruebas.taller(7, null, current_setting('t.g1a')::bigint, null,
                                             (select id from jornadas where nombre = 'PR Visita'))::text, true);
update jornadas set lugar_id = current_setting('t.esi')::bigint where nombre = 'PR Visita';
select is((select lugar_id from workshops where id = current_setting('t.visita')::bigint), current_setting('t.esi')::bigint,
  'si aún no se da, sus talleres la siguen');
select throws_ok(format($$ select pruebas.taller(40, %s, %s, %s) $$, current_setting('t.e2'), current_setting('t.g1a'), current_setting('t.prog')),
  'P0001', null, 'un taller fuera de las fechas de su programa');
select throws_ok(format($$ update programas set fecha_fin = current_date where id = %s $$, current_setting('t.prog')),
  'P0001', null, 'un programa no se acorta dejando talleres fuera');
update grupos_audiencia set activo = false where id = current_setting('t.g1a')::bigint;
update lugares set activo = false where id = current_setting('t.salud')::bigint;
select throws_ok(format($$ select pruebas.taller(1, %s, %s, null) $$, current_setting('t.e2'), current_setting('t.g1a')),
  'P0001', null, 'un grupo retirado no entra en un taller nuevo');
select throws_ok(format($$ select pruebas.taller(1, %s, %s, null) $$, current_setting('t.salud'), current_setting('t.gp6')),
  'P0001', null, 'ni un lugar retirado');
select is((select count(*)::int from workshops where grupo_audiencia_id = current_setting('t.g1a')::bigint), 5,
  'lo retirado conserva sus talleres');
update grupos_audiencia set activo = true where id = current_setting('t.g1a')::bigint;
update lugares set activo = true where id = current_setting('t.salud')::bigint;
select throws_ok(format($$ delete from grupos_audiencia where id = %s $$, current_setting('t.g1a')), '23503', null,
  'un grupo con talleres no se borra');
select throws_ok(format($$ delete from programas where id = %s $$, current_setting('t.prog')), '23503', null,
  'ni un programa con talleres');
select lives_ok($$ delete from lugares where nombre = 'PR Lugar nuevo' $$, 'un lugar sin talleres, sí');

-- ── La comunidad (tarea 023): existe aunque no agrupe lugares; al borrarla, sus lugares quedan sin ella ──
insert into comunidades (nombre, organizacion_id) values ('PR El Tejar', current_setting('t.centro')::bigint);
update lugares set comunidad_id = (select id from comunidades where nombre = 'PR El Tejar') where id = current_setting('t.salud')::bigint;
update lugares set comunidad_id = null where id = current_setting('t.salud')::bigint;
select is((select count(*)::int from comunidades where nombre = 'PR El Tejar'), 1, 'una comunidad sin lugares se queda');
update lugares set comunidad_id = (select id from comunidades where nombre = 'PR El Tejar') where id = current_setting('t.salud')::bigint;
delete from comunidades where nombre = 'PR El Tejar';
select is((select comunidad_id from lugares where id = current_setting('t.salud')::bigint), null::bigint,
  'al borrarla, sus lugares quedan sin comunidad');
update lugares set comunidad_id = null where id = current_setting('t.plaza')::bigint;

-- ── El cierre ─────────────────────────────────────────────────────────────────
select throws_ok(format($$ select pruebas.dar(pruebas.taller(-1, %s, %s, null), 26, null, null) $$, current_setting('t.e2'), current_setting('t.g1a')),
  'P0001', null, 'en un grupo cerrado, el cierre lleva niñas y niños');
select lives_ok(format($$ select pruebas.dar(pruebas.taller(-1, %s, %s, null), 90, null, null) $$, current_setting('t.plaza'), current_setting('t.gpub')),
  'en uno abierto basta el total');
select throws_ok(format($$ select pruebas.dar(pruebas.taller(-1, %s, %s, null), 90, 50, 30) $$, current_setting('t.plaza'), current_setting('t.gpub')),
  '23514', null, 'y si van, suman el total');

-- ── El historial ──────────────────────────────────────────────────────────────
select pruebas.como('60000000-0000-4000-8000-000000000002');
select throws_ok(format($$ insert into workshop_historial (tipo, workshop_id) values ('CANCELADO', %s) $$, current_setting('t.cancelado')),
  '42501', null, 'el historial no se escribe por la API');
select is((select count(*)::int from workshop_historial where workshop_id = current_setting('t.cancelado')::bigint
              and perfil_id = (select id from perfiles where email = 'a@pr.test')), 1,
  'quien opera la organización lo lee, con quién lo hizo');

select * from finish();
rollback;
