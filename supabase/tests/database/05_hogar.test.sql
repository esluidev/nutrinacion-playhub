-- La app del hogar (0009): cuenta con correo y PIN, perfiles, unirse a una comunidad con su
-- código, lo que ve cada perfil y su avance. Todo como anon con el token, como la app.
-- Seed: familia@ejemplo.test PIN 240218 (GT, español), Pepito (6, participa en Comunidad Centro)
-- y Ana (10); código de Comunidad Centro 482913; el huevo publicado en GT, solo en español.
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

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

select set_config('t.pepito', (select id from hogar_perfiles where nombre = 'Pepito')::text, true);
select set_config('t.ana', (select id from hogar_perfiles where nombre = 'Ana')::text, true);
select set_config('t.org_norte', (select id from organizaciones where nombre = 'Colegio Norte')::text, true);
select set_config('t.com_centro', (select id from comunidades where nombre = 'Comunidad Centro')::text, true);
select set_config('t.org_centro', (select id from organizaciones where nombre = 'Fundación Centro')::text, true);
select set_config('t.sb_huevo', (select id from storyboards where slug = 'el-huevo')::text, true);

select pruebas.como_anon();

-- ── Sin cuenta ────────────────────────────────────────────────────────────────
select is((select array_agg(o->>'nombre') from jsonb_array_elements(hogar_organizaciones()) o), array['Fundación Centro'],
  'la lista de «Unirme» trae solo las organizaciones con perfil público');
select is(hogar_catalogo_publico('GT', 'es')->0->'storyboards'->0->>'slug', 'el-huevo',
  'sin cuenta, en Guatemala y en español, ve el temario público de Nutrinación');
select is(hogar_catalogo_publico('MX', 'es')->0->'storyboards', 'null'::jsonb, 'en México no: el huevo solo está publicado en GT');
select is(hogar_catalogo_publico('GT', 'en')->0->'storyboards', 'null'::jsonb, 'ni en inglés: el huevo solo está en español');

-- ── Crear la cuenta y entrar ──────────────────────────────────────────────────
select is(hogar_crear_cuenta('', 'x@ejemplo.test', 'GT', 'es', '123456')->>'error', 'datos', 'el nombre es obligatorio');
select is(hogar_crear_cuenta('Otra', 'otra@ejemplo.test', 'XX', 'es', '123456')->>'error', 'pais', 'el país, del catálogo');
select is(hogar_crear_cuenta('Otra', 'FAMILIA@ejemplo.test', 'GT', 'es', '123456')->>'error', 'correo_en_uso',
  'el correo no puede estar en uso (sin importar mayúsculas)');
select set_config('t.otra', hogar_crear_cuenta('Ann Smith', 'ann@ejemplo.test', 'mx', 'en', '000000')->>'token', true);
select is(length(current_setting('t.otra')), 64, 'con nombre, país, correo y un PIN cualquiera (también 000000) se crea y entra');

select is(hogar_entrar('familia@ejemplo.test', '111111')->>'error', 'credenciales', 'un PIN equivocado no entra');
select set_config('t.token', hogar_entrar(' Familia@Ejemplo.test ', '240218')->>'token', true);
select is(jsonb_array_length(hogar_sesion(current_setting('t.token'))->'perfiles'), 2, 'con el bueno entra y ve sus dos perfiles');
select is(hogar_sesion(current_setting('t.token'))->'perfiles'->0->>'edicion', 'KIDS', 'la edición sale de la edad');

-- ── Perfiles ──────────────────────────────────────────────────────────────────
select is(jsonb_array_length(hogar_guardar_perfil(current_setting('t.token'),
            '{"nombre": "Gabo", "genero": "NINO", "edad": 7, "intereses": ["OBESIDAD"]}')->'perfiles'), 3,
  'crea un perfil con nombre, género, edad e intereses');
select throws_ok(format($$ select hogar_guardar_perfil(%L, '{"nombre": "X", "genero": "OTRO", "edad": 7}') $$, current_setting('t.token')),
  '22P02', null, 'el género es de la lista');
select throws_ok(format('select hogar_borrar_perfil(%L, %s)', current_setting('t.otra'), current_setting('t.pepito')),
  '42501', null, 'otra cuenta no toca a Pepito');

-- ── Unirse a una comunidad ────────────────────────────────────────────────────
select is(hogar_unirse(current_setting('t.token'), current_setting('t.ana')::bigint, '000000')->>'error', 'codigo',
  'un código equivocado no une a nadie');
select is(hogar_unirse(current_setting('t.token'), current_setting('t.ana')::bigint, '482913', current_setting('t.org_norte')::bigint)->>'error',
  'codigo', 'desde «Unirme» en Colegio Norte, el código de otra organización no vale');
select is(hogar_unirse(current_setting('t.token'), current_setting('t.ana')::bigint, '482-913')->>'ok', 'true',
  'con el código de Comunidad Centro, Ana se une');
select is(jsonb_array_length(hogar_guardar_perfil(current_setting('t.otra'), '{"nombre": "Tom", "genero": "NINO", "edad": 7}')->'perfiles'), 1,
  'la otra cuenta crea a Tom');
do $$ begin perform hogar_unirse(current_setting('t.otra'), (select (hogar_sesion(current_setting('t.otra'))->'perfiles'->0->>'id')::bigint), '000000') from generate_series(1, 5); end $$;
select is(hogar_unirse(current_setting('t.otra'), (hogar_sesion(current_setting('t.otra'))->'perfiles'->0->>'id')::bigint, '000000')->>'error',
  'bloqueado', 'tras 5 códigos equivocados, 15 minutos sin poder unirse');

-- ── Lo que ve cada perfil y su avance ─────────────────────────────────────────
select is((select array_agg(c->>'origen' order by c->>'origen') from jsonb_array_elements(hogar_catalogo(current_setting('t.token'), current_setting('t.pepito')::bigint)) c),
  array['nutrinacion', 'organizacion'], 'Pepito ve lo de Nutrinación y lo que publica su comunidad');
select is(hogar_catalogo(current_setting('t.token'), current_setting('t.ana')::bigint), '[]'::jsonb,
  'Ana (10) no ve nada: no hay contenido de preadolescencia');
select lives_ok(format('select hogar_completar(%L, %s, %s)', current_setting('t.token'), current_setting('t.pepito'), current_setting('t.sb_huevo')),
  'el runner dijo «terminado»: Pepito terminó el huevo');
select is((hogar_catalogo(current_setting('t.token'), current_setting('t.pepito')::bigint)->0->'storyboards'->0->>'terminado'), 'true',
  'su catálogo lo marca terminado');
select is((hogar_catalogo(current_setting('t.token'), current_setting('t.pepito')::bigint)->0->'storyboards'->0->>'porInteres'), 'true',
  'y le dice que toca su interés (desnutrición)');

-- ── Lo que ve la comunidad ────────────────────────────────────────────────────
select pruebas.como('00000000-0000-4000-8000-000000000003');
select is((select array_agg(nombre order by nombre) from hogar_perfiles), array['Ana', 'Pepito'],
  'el colaborador de Comunidad Centro ve a sus participantes');
select set_config('t.codigo_nuevo', comunidad_generar_codigo_acceso(current_setting('t.com_centro')::bigint), true);
select matches(current_setting('t.codigo_nuevo'), '^\d{6}$', 'y cambia el código de su comunidad');
select pruebas.como('00000000-0000-4000-8000-000000000004');
select throws_ok(format('select comunidad_generar_codigo_acceso(%s)', current_setting('t.com_centro')), '42501', null,
  'el admin de otra organización no');
select throws_ok(format($$ select organizacion_actualizar_perfil_publico(%s, true, null, null) $$, current_setting('t.org_centro')), '42501', null,
  'ni edita el perfil público de otra organización');
select pruebas.como('00000000-0000-4000-8000-000000000002');
select lives_ok(format($$ select organizacion_actualizar_perfil_publico(%s, false, null, null) $$, current_setting('t.org_centro')),
  'la admin de Fundación Centro la saca de la lista de «Unirme»');
select pruebas.como_anon();
select is(hogar_unirse(current_setting('t.token'), (hogar_sesion(current_setting('t.token'))->'perfiles'->2->>'id')::bigint, '482913')->>'error',
  'codigo', 'el código viejo ya no une a nadie');
select is((select count(*)::int from jsonb_array_elements(hogar_sesion(current_setting('t.token'))->'perfiles') p
            where jsonb_array_length(p->'comunidades') > 0), 2, 'y Pepito y Ana siguen en la comunidad');

-- ── Licencia vencida, salir y borrar ──────────────────────────────────────────
reset role;
update organizacion_licencias set estado = 'VENCIDA' where organizacion_id = (select organizacion_id from comunidades where id = current_setting('t.com_centro')::bigint);
select pruebas.como_anon();
select is((select array_agg(c->>'origen') from jsonb_array_elements(hogar_catalogo(current_setting('t.token'), current_setting('t.pepito')::bigint)) c),
  array['nutrinacion'], 'con la licencia de Fundación Centro vencida, Pepito solo ve lo de Nutrinación');
select is(jsonb_array_length(hogar_salir_de_comunidad(current_setting('t.token'), current_setting('t.pepito')::bigint,
            current_setting('t.com_centro')::bigint)->'perfiles'->0->'comunidades'), 0, 'Pepito sale de la comunidad cuando quiere');
select throws_ok($$ select count(*) from hogares $$, '42501', null, 'anon no consulta las cuentas: solo las funciones');
select throws_ok($$ select hogar_de_sesion('x') $$, '42501', null, 'las funciones internas no se pueden llamar');
select throws_ok($$ select hogar_sesion('token-falso') $$, '28000', null, 'un token falso no vale');
select lives_ok(format('select hogar_borrar_cuenta(%L)', current_setting('t.token')), 'la familia borra su cuenta');
reset role;
select is((select count(*)::int from hogar_perfiles p join hogares h on h.id = p.hogar_id where h.correo = 'familia@ejemplo.test'), 0,
  'y con ella sus perfiles, sus comunidades y su avance');

-- ── Lo que llama la API ──────────────────────────────────────────────────────
-- PostgREST corre en solo lectura las funciones STABLE; las que validan una sesión la renuevan
-- (escriben), así que tienen que ser VOLATILE o fallan desde las apps aunque aquí pasen.
select is(
  (select array_agg(proname::text order by proname) from pg_proc
    where pronamespace = 'public'::regnamespace and provolatile <> 'v'
      and (prosrc like '%hogar_de_sesion(%' or prosrc like '%educadores_de_sesion(%')),
  null,
  'las funciones que validan una sesión no son STABLE (la API las correría en solo lectura)');

select * from finish();
rollback;
