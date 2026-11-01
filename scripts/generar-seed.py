"""Genera supabase/seed.sql desde los datos de prueba de Educators y el storyboard del huevo.

Desde la raíz del repositorio: python3 scripts/generar-seed.py  (y después `supabase db reset`).
"""
import json
import sys
from pathlib import Path

repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
talleres = json.loads((repo / 'apps/educators/app/fixtures/talleres.json').read_text())
guia = json.loads((repo / 'apps/educators/app/fixtures/guia-el-huevo.json').read_text())['escenas']
sb = json.loads((repo / 'apps/player/content/storyboards/alimentacion/el-huevo/storyboard.json').read_text())

# La jornada del fixture: la misma para todos los talleres que la llevan (nombre y días relativos).
jornada = next(t['jornada'] for t in talleres['talleres'] if t.get('jornada'))


def lit(value):
    return "'" + str(value).replace("'", "''") + "'"


def loc(value):
    if value is None or value == '':
        return 'null::jsonb'
    return lit(json.dumps({'es': value}, ensure_ascii=False)) + '::jsonb'


def arr(values):
    # Sin tipo: la columna decide (enfoque_salud[], idioma[]).
    return "'{" + ','.join(values) + "}'"


CAMPOS = [  # clave de la guía de prueba → columna de guia_escenas
    ('verb', 'verbo'), ('subtitle', 'subtitulo'), ('description', 'descripcion'), ('objective', 'objetivo'),
    ('pedagogy', 'pedagogia'), ('questions', 'preguntas'), ('psychology', 'psicologia'), ('science', 'cientifico'),
    ('notDoing', 'no_hace'), ('tips', 'consejos'), ('mechanic', 'mecanica'), ('material', 'material'),
]

out = []
w = out.append
w('''-- Datos de prueba deterministas para Supabase LOCAL (`supabase db reset`). Nunca en la nube.
-- Generado desde los datos de prueba de Educators (apps/educators/app/fixtures/talleres.json y
-- guia-el-huevo.json) y el storyboard del huevo de Player con scripts/generar-seed.py: no lo edites a mano.
-- Las fechas son relativas al día del reset.
--
-- Credenciales de prueba, solo locales:
--   Admin y Player (Supabase Auth), contraseña «playhub-local»:
--     superadmin@playhub.test  superadmin (único que entra a la gestión de Player)
--     admin@centro.test        titular de Fundación Centro (opera en Guatemala y El Salvador)
--     colaborador@centro.test  colaborador de Fundación Centro
--     admin@norte.test         titular de Colegio Norte (Guatemala; la organización «ajena» de las pruebas)
--   Educators (correo + PIN):
--     maria@ejemplo.test  246810   Fundación Centro
--     pedro@ejemplo.test  135790   Colegio Norte
--     lucia@ejemplo.test  código de activación 112233 (aún no eligió su PIN)   Fundación Centro

update configuracion set valor = 'http://localhost:3000' where clave = 'admin_url';
update configuracion set valor = 'http://localhost:3001' where clave = 'player_url';

-- ── Organizaciones y licencias ────────────────────────────────────────────────
insert into organizaciones (nombre, correo, paises, tipo_id) values
  ('Fundación Centro', 'contacto@centro.test', '{GT,SV}', (select id from tipos_organizacion where codigo = 'FUNDACION')),
  ('Colegio Norte', 'contacto@norte.test', '{GT}', (select id from tipos_organizacion where codigo = 'CENTRO_EDUCATIVO'));

insert into organizacion_licencias (organizacion_id, fecha_inicio, notas)
select id, current_date - 30, 'Contrato de prueba' from organizaciones where nombre in ('Fundación Centro', 'Colegio Norte');

-- ── Usuarios de Admin (Auth) ──────────────────────────────────────────────────
-- El trigger on_auth_user_created crea cada perfil y lo enlaza según raw_app_meta_data.
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('00000000-0000-4000-8000-000000000001'::uuid, 'superadmin@playhub.test', 'Luis', 'Superadmin', null::text, null::bigint, null::boolean),
      ('00000000-0000-4000-8000-000000000002'::uuid, 'admin@centro.test', 'Ana', 'Centro', 'ADMIN',
        (select id from organizaciones where nombre = 'Fundación Centro'), true),
      ('00000000-0000-4000-8000-000000000003'::uuid, 'colaborador@centro.test', 'Carlos', 'Centro', 'COLABORADOR',
        (select id from organizaciones where nombre = 'Fundación Centro'), null),
      ('00000000-0000-4000-8000-000000000004'::uuid, 'admin@norte.test', 'Nora', 'Norte', 'ADMIN',
        (select id from organizaciones where nombre = 'Colegio Norte'), true)
    ) as v (id, email, nombre, apellido, role, org, titular)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('playhub-local', extensions.gen_salt('bf')), now(),
      jsonb_strip_nulls(jsonb_build_object(
        'provider', 'email', 'providers', jsonb_build_array('email'),
        'role', u.role, 'organizacion_id', u.org, 'titular', u.titular)),
      jsonb_build_object('nombre', u.nombre, 'apellido', u.apellido, 'idioma', 'es'),
      now(), now(), '', '', '', '');

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text,
            jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
            'email', now(), now(), now());
  end loop;
end $$;

update perfiles set superadmin = true where email = 'superadmin@playhub.test';

-- ── Catálogo: el huevo, con la metadata de su JSON, publicado en Guatemala ─────
''')

w(f'''insert into storyboards (clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud,
                         idiomas, idioma_principal, duracion_min, numero_escenas, estado_publicacion, paises_disponibles)
values ({lit(sb['key'])}, {lit(sb['slug'])}, {lit(sb.get('version', ''))}, {lit(json.dumps(sb['title'], ensure_ascii=False))},
        {lit(sb['type'])}, {lit(sb['category'])}, {lit(sb['audience'])}, {arr(sb.get('healthFocus', []))},
        {arr(sb['languages'])}, {lit(sb.get('defaultLanguage', 'es'))}, {sb['estimatedDuration']}, {len(sb['scenes'])}, 'PUBLICADO', '{{GT}}');

-- La guía nace con el storyboard (trigger): se completa su cabecera y sus escenas.
update guias set
  version = '1.2',
  descripcion = '{{"es":"Los niños siguen al huevo desde antes de llegar a casa hasta descubrir qué tiene por dentro y cómo se prepara."}}',
  objetivo = '{{"es":"Que el grupo reconozca de dónde viene el huevo, sus partes y formas sencillas de prepararlo."}}',
  publico = '{{"es":"Infantil, 4 a 8 años"}}'
 where storyboard_id = (select id from storyboards where slug = 'el-huevo');

''')

cols = ', '.join(c for _, c in CAMPOS)
w(f'insert into guia_escenas (guia_id, orden, carpeta, titulo, {cols})\n')
filas = []
for orden, escena in enumerate(sb['scenes'], start=1):
    g = guia.get(escena['folder'], {})
    valores = ', '.join(loc(g.get(k)) for k, _ in CAMPOS)
    filas.append(f"select g.id, {orden}, {lit(escena['folder'])}, {lit(json.dumps(escena['title'], ensure_ascii=False))}::jsonb, {valores} "
                 f"from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'el-huevo'")
w('\nunion all\n'.join(filas) + ';\n\n')

w('''-- Uno recién registrado, sin JSON en el build: no lo ve ninguna organización ni se programa.
insert into storyboards (clave, slug, titulo, categoria, subcategoria, edicion, enfoques_salud, idiomas, duracion_min,
                         estado_publicacion, paises_disponibles)
values ('9c4d2a7b-1e3f-4b6a-8c5d-0f1e2d3c4b5a', 'la-soda', '{"es":"La soda"}', 'CUIDADO_PERSONAL', 'PREVENCION', 'PREADOLESCENTES',
        '{DIABETES,OBESIDAD}', '{es}', 30, 'REGISTRADO', '{}');

-- ── Educadores de cada organización y un grupo ────────────────────────────────
insert into educadores (nombre, apellido, correo, profesion, pin_hash, codigo_activacion_hash, organizacion_id) values
  ('María', 'López', 'maria@ejemplo.test', 'Educadora', extensions.crypt('246810', extensions.gen_salt('bf', 8)), null,
   (select id from organizaciones where nombre = 'Fundación Centro')),
  ('Lucía', 'Gómez', 'lucia@ejemplo.test', 'Educadora', null, extensions.crypt('112233', extensions.gen_salt('bf', 8)),
   (select id from organizaciones where nombre = 'Fundación Centro')),
  ('Pedro', 'Ramírez', 'pedro@ejemplo.test', 'Educador', extensions.crypt('135790', extensions.gen_salt('bf', 8)), null,
   (select id from organizaciones where nombre = 'Colegio Norte'));

insert into educador_grupos (nombre, descripcion, organizacion_id)
values ('Equipo de la mañana', 'María y Lucía', (select id from organizaciones where nombre = 'Fundación Centro'));
insert into educador_grupo_miembros (educador_grupo_id, educador_id)
select g.id, e.id from educador_grupos g, educadores e
 where g.nombre = 'Equipo de la mañana' and e.correo in ('maria@ejemplo.test', 'lucia@ejemplo.test');

''')

w(f'''-- ── Jornada de Fundación Centro (la del fixture: su lugar y sus días relativos) ──
insert into jornadas (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ({lit(jornada['nombre'])}, 'Talleres de alimentación alrededor de la desnutrición.', {lit(jornada['ubicacion'])},
        current_date + ({jornada['diaInicioRelativo']}), current_date + ({jornada['diaFinRelativo']}),
        (select id from organizaciones where nombre = 'Fundación Centro'));

''')

w('''-- ── Workshops ─────────────────────────────────────────────────────────────────
-- Los de María salen de los datos de prueba de Educators (mismo día relativo, hora, lugar, grupo,
-- jornada y cierre); la referencia original va en `notas`. Las horas reales, en la zona de Guatemala.
do $$
declare
  v_org        bigint := (select id from organizaciones where nombre = 'Fundación Centro');
  v_storyboard bigint := (select id from storyboards where slug = 'el-huevo');
  v_educador   bigint := (select id from educadores where correo = 'maria@ejemplo.test');
  v_grupo      bigint := (select id from educador_grupos where nombre = 'Equipo de la mañana');
  v_jornada    bigint := (select id from jornadas where organizacion_id = (select id from organizaciones where nombre = 'Fundación Centro'));
  v_workshop   bigint;
  v_asignacion bigint;
  t record;
begin
  for t in
    select * from (values
''')

filas = []
for t in talleres['talleres']:
    c = t.get('cierre')
    feedback = 'null::jsonb' if not c else lit(json.dumps(c, ensure_ascii=False)) + '::jsonb'
    motivo = lit(t['motivoCancelacion']) if t.get('estadoWorkshop') == 'cancelado' else 'null::text'
    con_jornada = 'true' if t.get('jornada') else 'false'
    filas.append(
        f"      ({lit(t['id'])}, {t['diaRelativo']}, {lit(t['horaInicio'])}::time, {lit(t['horaFin'])}::time, "
        f"{lit(t['lugar'])}, {lit(t['grupo'])}, {t['asistentesEstimados']}, {con_jornada}, {motivo}, {feedback})")
w(',\n'.join(filas) + '\n')
w('''    ) as v (ref, dia, inicio, fin, lugar, grupo, asistentes, en_jornada, motivo, feedback)
  loop
    -- Nace en borrador; con su educadora asignada, se publica.
    insert into workshops (fecha, hora_inicio, hora_fin, ubicacion, grupo_asistente, asistentes_estimados, idioma_contenido,
                           modalidad, notas, storyboard_id, jornada_id, organizacion_id)
    values (current_date + t.dia, t.inicio, t.fin, t.lugar, t.grupo, t.asistentes, 'es',
            'PRESENCIAL', 'Datos de prueba ' || t.ref, v_storyboard, case when t.en_jornada then v_jornada end, v_org)
    returning id into v_workshop;

    insert into workshop_educadores (workshop_id, educador_id) values (v_workshop, v_educador)
    returning id into v_asignacion;
    update workshops set estado = 'PUBLICADO' where id = v_workshop;

    -- Cancelado después de publicarse: María lo ve cancelado, con su motivo.
    if t.motivo is not null then
      update workshops set estado = 'CANCELADO', motivo_cancelacion = t.motivo where id = v_workshop;
    end if;

    -- Los que ya se dieron: su ejecución y su feedback (el workshop queda finalizado).
    if t.feedback is not null then
      update workshop_educadores
         set iniciado_en = ((current_date + t.dia) + t.inicio) at time zone 'America/Guatemala',
             terminado_en = ((current_date + t.dia) + t.fin) at time zone 'America/Guatemala',
             estado = 'EN_CURSO'
       where id = v_asignacion;
      insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, participacion_grupo,
                                     claridad_contenido, dificultades_grupo, material_faltante)
      values (v_asignacion, (t.feedback->>'calificacion')::int, (t.feedback->>'asistentes')::int,
              upper(t.feedback->>'participacion')::participacion_grupo, upper(t.feedback->>'claridad')::claridad_contenido,
              nullif(t.feedback->>'costo', ''), nullif(t.feedback->>'faltoMaterial', ''));
    end if;
  end loop;

  -- Un borrador: María no lo ve hasta que se publique.
  insert into workshops (fecha, hora_inicio, hora_fin, ubicacion, grupo_asistente, idioma_contenido, notas,
                         storyboard_id, organizacion_id)
  values (current_date + 20, '09:00', '09:30', 'Aula 1B', '1.º B', 'es', 'Datos de prueba: borrador', v_storyboard, v_org)
  returning id into v_workshop;
  insert into workshop_educadores (workshop_id, educador_id) values (v_workshop, v_educador);

  -- Uno asignado al grupo entero (María y Lucía), dentro de la jornada.
  insert into workshops (fecha, hora_inicio, hora_fin, ubicacion, grupo_asistente, asistentes_estimados, idioma_contenido,
                         notas, storyboard_id, jornada_id, organizacion_id)
  values (current_date + 2, '14:00', '14:30', 'Salón principal', '3.º B', 20, 'es', 'Datos de prueba: equipo de la mañana',
          v_storyboard, v_jornada, v_org)
  returning id into v_workshop;
  insert into workshop_educadores (workshop_id, educador_id, educador_grupo_id)
  select v_workshop, m.educador_id, v_grupo from educador_grupo_miembros m where m.educador_grupo_id = v_grupo;
  update workshops set estado = 'PUBLICADO' where id = v_workshop;
end $$;

-- Un workshop de Pedro en Colegio Norte, hoy, con el mismo estándar.
with w as (
  insert into workshops (fecha, hora_inicio, hora_fin, ubicacion, grupo_asistente, asistentes_estimados, idioma_contenido,
                         notas, storyboard_id, organizacion_id)
  values (current_date, '08:00', '08:30', 'Aula Norte', '2.º A', 18, 'es', 'Datos de prueba: Norte',
          (select id from storyboards where slug = 'el-huevo'), (select id from organizaciones where nombre = 'Colegio Norte'))
  returning id
)
insert into workshop_educadores (workshop_id, educador_id)
select w.id, e.id from w, educadores e where e.correo = 'pedro@ejemplo.test';
update workshops set estado = 'PUBLICADO' where notas = 'Datos de prueba: Norte';

-- Lo publicado que ya pasó queda finalizado, como lo dejaría la tarea horaria (0009).
select finalizar_workshops_vencidos();
''')

(repo / 'supabase/seed.sql').write_text(''.join(out))
print('seed.sql escrito:', len(''.join(out)), 'bytes')
