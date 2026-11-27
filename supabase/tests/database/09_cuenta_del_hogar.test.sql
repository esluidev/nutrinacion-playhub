-- La cuenta del adulto en la app del hogar (0018): correo y PIN, sin Supabase Auth; el código por correo lo pide solo
-- la Edge Function (service_role). La app usa la anon key y un token: aquí todo se llama como anon salvo pedir el
-- código. No usa el seed: crea sus propios datos (correos @hogar.test) en una transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

create schema pruebas;
grant usage on schema pruebas to anon, authenticated, service_role;

create function pruebas.como_anon() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

create function pruebas.como_service() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  execute 'set local role service_role';
end $$;

-- Un perfil como lo manda la app.
create function pruebas.perfil(p_id text, p_nombre text, p_actualizado timestamptz, p_eliminado boolean default false)
returns jsonb language sql as $$
  select jsonb_build_object('id', p_id, 'nombre', p_nombre, 'avatar', 'zorro', 'mes', 3, 'anio', 2018, 'genero', 'nino',
    'terminados', jsonb_build_array('GT-ALI-EL-HUEVO'), 'avance', jsonb_build_object('clave', 'GT-ALI-LA-LECHE', 'indice', 2, 'escenas', 6),
    'actualizado', p_actualizado, 'eliminado', p_eliminado)
$$;
grant execute on function pruebas.perfil(text, text, timestamptz, boolean) to anon;

-- El perfil con ese identificador en una lista (en la misma transacción, todos se crean a la vez).
create function pruebas.de(p_lista jsonb, p_id text) returns jsonb language sql as $$
  select p from jsonb_array_elements(p_lista) p where p->>'id' = p_id
$$;
grant execute on function pruebas.de(jsonb, text) to anon;

-- ── Nadie lee las tablas ni pide un código por la API ─────────────────────────
select pruebas.como_anon();
select throws_ok('select * from hogar_cuentas', '42501', null, 'anon no lee las cuentas');
select throws_ok('select * from hogar_perfiles', '42501', null, 'ni los perfiles');
select throws_ok('select * from hogar_sesiones', '42501', null, 'ni las sesiones');
select throws_ok($$select hogar_codigo_nuevo('ana@hogar.test')$$, '42501', null, 'ni pide un código: solo la Edge Function');
select throws_ok($$select hogar_abrir_sesion(1)$$, '42501', null, 'ni abre una sesión sin PIN');

-- ── El código ─────────────────────────────────────────────────────────────────
select pruebas.como_service();
select set_config('t.r', hogar_codigo_nuevo(' Ana@Hogar.TEST ')::text, true);
select is(current_setting('t.r')::jsonb->>'ok', 'true', 'la Edge Function pide un código para un correo nuevo');
select matches(current_setting('t.r')::jsonb->>'codigo', '^\d{6}$', 'son 6 dígitos');
select is(current_setting('t.r')::jsonb->>'tiene_pin', 'false', 'y la cuenta aún no tiene PIN (el correo de crear la cuenta)');
select set_config('t.codigo', current_setting('t.r')::jsonb->>'codigo', true);
select is(hogar_codigo_nuevo('ana@hogar.test')->>'error', 'espera', 'otro antes de un minuto, no');
select is(hogar_codigo_nuevo('no-es-correo')->>'error', 'correo', 'un correo mal escrito, tampoco');
reset role;
select is((select correo from hogar_cuentas where correo = 'ana@hogar.test'), 'ana@hogar.test', 'el correo se guarda en minúsculas y sin espacios');
select isnt((select codigo_hash from hogar_cuentas where correo = 'ana@hogar.test'), current_setting('t.codigo'), 'y el código, con hash');

-- ── Confirmar el correo y elegir el PIN ───────────────────────────────────────
select pruebas.como_anon();
select is(hogar_entrar('ana@hogar.test', '123456')->>'error', 'credenciales', 'sin confirmar el correo no se entra');
select is(hogar_confirmar('ana@hogar.test', current_setting('t.codigo'), '12a456')->>'error', 'pin_invalido', 'el PIN son 6 dígitos');
select is(hogar_confirmar('ana@hogar.test', lpad(((current_setting('t.codigo')::int + 1) % 1000000)::text, 6, '0'), '123456')->>'error',
  'credenciales', 'un código equivocado no vale');
select set_config('t.r', hogar_confirmar('ANA@hogar.test', current_setting('t.codigo'), '123-456')::text, true);
select is(current_setting('t.r')::jsonb->>'ok', 'true', 'con el código elige su PIN y entra');
select is(current_setting('t.r')::jsonb->'cuenta'->>'correo', 'ana@hogar.test', 'con su correo');
select set_config('t.token', current_setting('t.r')::jsonb->>'token', true);
select is(hogar_confirmar('ana@hogar.test', current_setting('t.codigo'), '654321')->>'error', 'credenciales', 'el código ya no vale otra vez');

-- ── Entrar ────────────────────────────────────────────────────────────────────
select is(hogar_entrar(' ana@hogar.test ', '123456')->>'ok', 'true', 'entra con correo y PIN');
select is(hogar_cuenta(current_setting('t.token'))->>'correo', 'ana@hogar.test', 'la sesión dice de quién es la cuenta');
select throws_ok($$select hogar_cuenta('no-vale')$$, '28000', null, 'un token que no vale: error 28000');
select is(hogar_entrar('ana@hogar.test', '000000')->>'error', 'credenciales', 'un PIN equivocado no entra');
select hogar_entrar('ana@hogar.test', '000000') from generate_series(1, 4);
select is(hogar_entrar('ana@hogar.test', '123456')->>'error', 'bloqueado', 'tras 5 fallos, 15 minutos sin entrar, ni con el PIN bueno');
reset role;
update hogar_cuentas set pin_bloqueado_hasta = now() - interval '1 second' where correo = 'ana@hogar.test';

-- ── Los perfiles ──────────────────────────────────────────────────────────────
select pruebas.como_anon();
select is(jsonb_array_length(hogar_perfiles(current_setting('t.token'))), 0, 'una cuenta nueva no tiene perfiles');
select set_config('t.r', hogar_guardar_perfiles(current_setting('t.token'), jsonb_build_array(
  pruebas.perfil('p-leo', 'Leo', now() - interval '1 hour'), pruebas.perfil('p-ana', 'Ana', now() - interval '1 hour')))::text, true);
select is(jsonb_array_length(current_setting('t.r')::jsonb), 2, 'suben los perfiles del dispositivo');
select is(pruebas.de(current_setting('t.r')::jsonb, 'p-leo')->'terminados'->>0, 'GT-ALI-EL-HUEVO', 'con lo que terminó');
select is(pruebas.de(current_setting('t.r')::jsonb, 'p-leo')->'avance'->>'indice', '2', 'y dónde iba');
select is(pruebas.de(hogar_guardar_perfiles(current_setting('t.token'), jsonb_build_array(pruebas.perfil('p-leo', 'Leíto', now() - interval '2 hours'))), 'p-leo')->>'nombre',
  'Leo', 'un cambio más viejo que el guardado no lo pisa');
select is(pruebas.de(hogar_guardar_perfiles(current_setting('t.token'), jsonb_build_array(pruebas.perfil('p-leo', 'Leíto', now()))), 'p-leo')->>'nombre',
  'Leíto', 'uno más nuevo, sí');
select is(pruebas.de(hogar_guardar_perfiles(current_setting('t.token'), jsonb_build_array(pruebas.perfil('p-reloj', 'Reloj', now() + interval '1 day'))), 'p-reloj')->>'actualizado',
  to_jsonb(now()) #>> '{}', 'una fecha del futuro (un reloj mal puesto) cuenta como ahora');
select set_config('t.r', hogar_guardar_perfiles(current_setting('t.token'), jsonb_build_array(
  jsonb_build_object('id', 'p-ana', 'actualizado', now(), 'eliminado', true)))::text, true);
select is(pruebas.de(current_setting('t.r')::jsonb, 'p-ana')->>'eliminado', 'true',
  'uno eliminado queda marcado, para quitarlo de los demás dispositivos');
select is(pruebas.de(current_setting('t.r')::jsonb, 'p-ana')->>'nombre', null,
  'y sin sus datos');
select throws_ok(format($$select hogar_guardar_perfiles(%L, (select jsonb_agg(pruebas.perfil('p-' || i, 'N' || i, now())) from generate_series(1, 21) i))$$,
  current_setting('t.token')), '22023', null, 'hasta 20 perfiles por cuenta');
select throws_ok(format($$select hogar_guardar_perfiles(%L, jsonb_build_array(pruebas.perfil('p-x', 'X', now()) || '{"genero":"otro"}'))$$,
  current_setting('t.token')), '23514', null, 'el género, solo niña o niño');

-- ── Otra cuenta no ve los de Ana ──────────────────────────────────────────────
reset role;
select pruebas.como_service();
select set_config('t.codigo2', hogar_codigo_nuevo('beto@hogar.test')->>'codigo', true);
select pruebas.como_anon();
select set_config('t.token2', hogar_confirmar('beto@hogar.test', current_setting('t.codigo2'), '222222')->>'token', true);
select is(jsonb_array_length(hogar_perfiles(current_setting('t.token2'))), 0, 'otra cuenta no ve los perfiles de Ana');
select is(pruebas.de(hogar_guardar_perfiles(current_setting('t.token2'), jsonb_build_array(pruebas.perfil('p-leo', 'Otro', now()))), 'p-leo')->>'nombre',
  'Otro', 'y el mismo identificador en otra cuenta es otro perfil');
select is(pruebas.de(hogar_perfiles(current_setting('t.token')), 'p-leo')->>'nombre', 'Leíto', 'sin tocar el de Ana');

-- ── Un PIN nuevo (lo olvidó) ──────────────────────────────────────────────────
reset role;
update hogar_cuentas set codigo_enviado_en = now() - interval '2 minutes' where correo = 'ana@hogar.test';
select pruebas.como_service();
select set_config('t.r', hogar_codigo_nuevo('ana@hogar.test')::text, true);
select is(current_setting('t.r')::jsonb->>'tiene_pin', 'true', 'si ya tiene PIN, el correo es el de un PIN nuevo');
select pruebas.como_anon();
select set_config('t.token3', hogar_confirmar('ana@hogar.test', current_setting('t.r')::jsonb->>'codigo', '777777')->>'token', true);
select is(hogar_entrar('ana@hogar.test', '777777')->>'ok', 'true', 'entra con el PIN nuevo');
select throws_ok(format('select hogar_cuenta(%L)', current_setting('t.token')), '28000', null, 'y las sesiones de antes se cierran');

-- ── Salir y eliminar la cuenta ────────────────────────────────────────────────
select hogar_salir(current_setting('t.token3'));
select throws_ok(format('select hogar_cuenta(%L)', current_setting('t.token3')), '28000', null, 'al salir, el token deja de valer');
select set_config('t.token4', hogar_entrar('ana@hogar.test', '777777')->>'token', true);
select hogar_eliminar_cuenta(current_setting('t.token4'));
reset role;
select is((select count(*)::int from hogar_cuentas where correo = 'ana@hogar.test'), 0, 'eliminar la cuenta borra la cuenta');
select is((select count(*)::int from hogar_perfiles p where not exists (select 1 from hogar_cuentas c where c.id = p.cuenta_id)), 0,
  'con sus perfiles');

select * from finish();
rollback;
