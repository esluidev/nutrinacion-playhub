-- Quién puede generar el enlace para recuperar el acceso a Admin (0011, decisión 009).
-- No usa el seed: crea sus propias organizaciones y cuentas, así corre también contra una base
-- sin seed (`supabase test db supabase/tests/database/06_recuperacion.test.sql`). Todo corre en
-- una transacción que se deshace.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

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

-- ── Organizaciones: A y C con el mismo titular; B, ajena ─────────────────────
insert into organizaciones (nombre) values ('Rec A'), ('Rec B'), ('Rec C');
insert into organizacion_licencias (organizacion_id, max_comunidades, max_educadores, fecha_inicio, paises)
select id, 3, 10, current_date, '{GT}' from organizaciones where nombre like 'Rec %';
insert into comunidades (nombre, pais, organizacion_id)
select 'Comunidad ' || nombre, 'GT', id from organizaciones where nombre like 'Rec %';

-- ── Cuentas (el trigger de alta crea cada perfil) ────────────────────────────
--   s1, s2 superadmins · sa superadmin y admin de A · ta titular de A y C · tb titular de B
--   aa admin de A · ca colaboradora de A · ci colaboradora inactiva de A · ac colaboradora de A y
--   admin de C · x admin de A y colaborador de B · cb colaboradora de B · p colaboradora de A con
--   una invitación pendiente de B · n sin acceso a nada
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, '{}', '{}', now(), now()
  from (values
    ('10000000-0000-4000-8000-000000000001'::uuid, 's1@rec.test'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 's2@rec.test'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'sa@rec.test'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'ta@rec.test'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'tb@rec.test'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'aa@rec.test'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'ca@rec.test'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'ci@rec.test'),
    ('10000000-0000-4000-8000-000000000009'::uuid, 'ac@rec.test'),
    ('10000000-0000-4000-8000-000000000010'::uuid, 'x@rec.test'),
    ('10000000-0000-4000-8000-000000000011'::uuid, 'cb@rec.test'),
    ('10000000-0000-4000-8000-000000000012'::uuid, 'p@rec.test'),
    ('10000000-0000-4000-8000-000000000013'::uuid, 'n@rec.test')
  ) as v (id, email);

update perfiles set superadmin = true where email in ('s1@rec.test', 's2@rec.test', 'sa@rec.test');

insert into organizacion_administradores (organizacion_id, perfil_id, titular)
select o.id, p.id, v.titular
  from (values
    ('Rec A', 'ta@rec.test', true), ('Rec C', 'ta@rec.test', true), ('Rec B', 'tb@rec.test', true),
    ('Rec A', 'aa@rec.test', false), ('Rec A', 'sa@rec.test', false), ('Rec C', 'ac@rec.test', false),
    ('Rec A', 'x@rec.test', false)
  ) as v (org, email, titular)
  join organizaciones o on o.nombre = v.org
  join perfiles p on p.email = v.email;

insert into comunidad_colaboradores (comunidad_id, perfil_id, activo)
select c.id, p.id, v.activo
  from (values
    ('Comunidad Rec A', 'ca@rec.test', true), ('Comunidad Rec A', 'ci@rec.test', false),
    ('Comunidad Rec A', 'ac@rec.test', true), ('Comunidad Rec B', 'x@rec.test', true),
    ('Comunidad Rec B', 'cb@rec.test', true), ('Comunidad Rec A', 'p@rec.test', true)
  ) as v (comunidad, email, activo)
  join comunidades c on c.nombre = v.comunidad
  join perfiles p on p.email = v.email;

insert into invitaciones (role, email, estado, expira_en, organizacion_id)
select 'ADMIN', 'p@rec.test', 'PENDIENTE', now() + interval '7 days', id from organizaciones where nombre = 'Rec B';

-- ── Titular ───────────────────────────────────────────────────────────────────
select pruebas.como('10000000-0000-4000-8000-000000000004');
select is(recuperacion_autorizar('ca@rec.test'), 'ca@rec.test', 'titular: genera el enlace de una colaboradora de su organización');
select is(recuperacion_autorizar('aa@rec.test'), 'aa@rec.test', 'titular: y de otro administrador');
select is(recuperacion_autorizar('ci@rec.test'), 'ci@rec.test', 'titular: también de una colaboradora inactiva');
select is(recuperacion_autorizar('ac@rec.test'), 'ac@rec.test', 'titular: y de alguien que está en dos organizaciones suyas');
select is(recuperacion_autorizar('  CA@Rec.Test '), 'ca@rec.test', 'titular: el correo no distingue mayúsculas ni espacios');
select throws_ok($$ select recuperacion_autorizar('x@rec.test') $$, '42501',
  'Esa cuenta también tiene acceso a otra organización: el enlace lo genera soporte',
  'titular: no, si la cuenta también está en otra organización');
select throws_ok($$ select recuperacion_autorizar('p@rec.test') $$, '42501',
  'Esa cuenta también tiene acceso a otra organización: el enlace lo genera soporte',
  'titular: no, si tiene una invitación pendiente de otra');
select throws_ok($$ select recuperacion_autorizar('cb@rec.test') $$, '42501', 'Esa cuenta no está en tu organización',
  'titular: no, para una cuenta ajena');
select throws_ok($$ select recuperacion_autorizar('n@rec.test') $$, '42501', 'Esa cuenta no está en tu organización',
  'titular: no, para una cuenta sin acceso a nada');
select throws_ok($$ select recuperacion_autorizar('nadie@rec.test') $$, '42501', 'Esa cuenta no está en tu organización',
  'titular: una cuenta que no existe responde igual que una ajena');
select throws_ok($$ select recuperacion_autorizar('sa@rec.test') $$, '42501',
  'Esa cuenta es de soporte: el enlace lo genera otro superadmin', 'titular: no, para un superadmin de su organización');
select throws_ok($$ select recuperacion_autorizar('ta@rec.test') $$, 'P0001', 'Tu contraseña se cambia desde tu perfil',
  'titular: no, para sí mismo');

reset role;
update invitaciones set expira_en = now() - interval '1 day' where email = 'p@rec.test';
select pruebas.como('10000000-0000-4000-8000-000000000004');
select is(recuperacion_autorizar('p@rec.test'), 'p@rec.test', 'titular: una invitación vencida ya no cuenta');

-- ── Administrador que no es titular y colaboradora ────────────────────────────
select pruebas.como('10000000-0000-4000-8000-000000000006');
select throws_ok($$ select recuperacion_autorizar('ca@rec.test') $$, '42501',
  'Este enlace lo genera el titular de la organización o soporte', 'admin no titular: no genera enlaces');
select pruebas.como('10000000-0000-4000-8000-000000000007');
select throws_ok($$ select recuperacion_autorizar('ci@rec.test') $$, '42501',
  'Este enlace lo genera el titular de la organización o soporte', 'colaboradora: tampoco');

-- ── Superadmin (soporte) ──────────────────────────────────────────────────────
select pruebas.como('10000000-0000-4000-8000-000000000001');
select is(recuperacion_autorizar('x@rec.test'), 'x@rec.test', 'superadmin: genera el de alguien en dos organizaciones');
select is(recuperacion_autorizar('cb@rec.test'), 'cb@rec.test', 'superadmin: y el de una colaboradora que no ve en Admin');
select is(recuperacion_autorizar('ta@rec.test'), 'ta@rec.test', 'superadmin: y el de un titular');
select is(recuperacion_autorizar('s2@rec.test'), 's2@rec.test', 'superadmin: y el de otro superadmin');
select throws_ok($$ select recuperacion_autorizar('s1@rec.test') $$, 'P0001', 'Tu contraseña se cambia desde tu perfil',
  'superadmin: no, para sí mismo');
select throws_ok($$ select recuperacion_autorizar('nadie@rec.test') $$, 'P0001', 'No hay ninguna cuenta de Admin con ese correo',
  'superadmin: avisa si el correo no tiene cuenta');

-- ── anon ──────────────────────────────────────────────────────────────────────
select pruebas.como_anon();
select throws_ok($$ select recuperacion_autorizar('ca@rec.test') $$, '42501', null, 'anon: no puede llamarla');

select * from finish();
rollback;
