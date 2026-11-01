-- Datos de prueba deterministas para Supabase LOCAL (`supabase db reset`). Nunca en la nube.
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
insert into storyboards (clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud,
                         idiomas, idioma_principal, duracion_min, numero_escenas, estado_publicacion, paises_disponibles)
values ('6f375f8d-0467-4dd2-958a-91d6d6d1c060', 'el-huevo', '0.1.0', '{"es": "El huevo"}',
        'ALIMENTACION', 'NUTRIENTES', 'KIDS', '{DESNUTRICION}',
        '{es}', 'es', 30, 4, 'PUBLICADO', '{GT}');

-- La guía nace con el storyboard (trigger): se completa su cabecera y sus escenas.
update guias set
  version = '1.2',
  descripcion = '{"es":"Los niños siguen al huevo desde antes de llegar a casa hasta descubrir qué tiene por dentro y cómo se prepara."}',
  objetivo = '{"es":"Que el grupo reconozca de dónde viene el huevo, sus partes y formas sencillas de prepararlo."}',
  publico = '{"es":"Infantil, 4 a 8 años"}'
 where storyboard_id = (select id from storyboards where slug = 'el-huevo');

insert into guia_escenas (guia_id, orden, carpeta, titulo, verbo, subtitulo, descripcion, objetivo, pedagogia, preguntas, psicologia, cientifico, no_hace, consejos, mecanica, material)
select g.id, 1, 'bienvenida', '{"es": "Bienvenida"}'::jsonb, '{"es": "Situar"}'::jsonb, '{"es": "Hoy conoceremos el huevo"}'::jsonb, '{"es": "Los niños saben que el tema de hoy es el huevo y comparten lo que ya conocen. Todavía no se explica de dónde viene, qué hay dentro ni para qué sirve."}'::jsonb, '{"es": "Haz que el grupo espere el recorrido y que puedas escuchar sus palabras iniciales sobre el huevo."}'::jsonb, '{"es": "Di: “Hoy vamos a conocer el huevo”. Pregunta quién ha visto uno y acepta palabras sencillas como “blanco”, “café” o “para desayunar”. No completes ni corrijas todavía. Diles que irán siguiendo al huevo desde antes de llegar a la casa hasta descubrir qué puede aportar. Cierra con: “Primero vamos a ver de dónde viene”."}'::jsonb, '{"es": "Puedes preguntar: “¿Quién ha visto un huevo?”, “¿Dónde lo han visto?”, “¿Qué palabra se les ocurre cuando oyen ‘huevo’?”. Pide que levanten la mano si han visto uno y que digan una palabra corta en coro: “huevo”."}'::jsonb, '{"es": "Aquí manda la expectativa. Algunos van a querer contar todo lo que saben o decir cómo lo comen; recíbelo con “eso lo vamos a mirar paso a paso” para que tengan ganas de seguir."}'::jsonb, null::jsonb, '{"es": "No enseña el origen ni identifica aves. Origen sitúa de dónde llegan los huevos; Descubrimiento permite conocer las aves y comparar sus huevos."}'::jsonb, '{"es": "Si alguien usa una palabra local para una comida con huevo, repítela con respeto y vuelve al tema. Si el grupo responde poco, da dos opciones cotidianas, “¿en la casa o en una tienda?”, sin convertirlo en una prueba."}'::jsonb, null::jsonb, null::jsonb from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'el-huevo'
union all
select g.id, 2, 'origen', '{"es": "Origen"}'::jsonb, '{"es": "Reconocer"}'::jsonb, '{"es": "Antes de llegar a casa"}'::jsonb, '{"es": "Los niños reconocen que los huevos tienen un origen anterior a la tienda o la casa. Conocen un recorrido posible: una granja donde se cuidan aves que ponen huevos, una tienda y una casa. La atención está en los lugares del recorrido."}'::jsonb, '{"es": "Ayuda al grupo a reconocer, en este ejemplo, la granja como el lugar de origen y la tienda como un lugar al que pueden llegar los huevos antes de la casa."}'::jsonb, '{"es": "Empieza con lo cercano: retoma la tienda o la casa que mencionaron en Bienvenida y pregunta dónde estaban los huevos antes de llegar allí. Explica: “Los huevos que conoceremos los ponen aves. Vamos a seguir un recorrido posible: una granja donde se cuidan esas aves, una tienda y una casa”. Aclara granja como un lugar donde se cuidan animales. No presentes este camino como el de todos los huevos: también pueden llegar directamente desde donde se recogen. Invita a reconocer qué pasa en cada lugar: en la granja del ejemplo se recogen, en la tienda se venden y a la casa llegan para preparar comida. Cierra con una pregunta abierta hacia la escena siguiente: “Ya sabemos de dónde pueden llegar. ¿Se parecerán todos los huevos?”."}'::jsonb, '{"es": "Puedes preguntar: “¿Dónde han visto huevos?”, “¿Dónde estaban antes de llegar a la tienda?”, “En este recorrido, ¿dónde se recogen?”, “¿Qué lugar reconocen: la granja, la tienda o la casa?”. Invita a que nombren un lugar conocido y a completar juntos: “En este ejemplo, antes de la tienda estaban en…”."}'::jsonb, '{"es": "Aquí importa conectar un lugar conocido con lo que ocurre antes. Haber visto huevos en una tienda ya permite participar; conocer una granja no es un requisito. La curiosidad queda abierta sobre cómo serán los huevos que van a descubrir."}'::jsonb, null::jsonb, '{"es": "No presenta una especie como el origen de todos los huevos ni enumera aves. Identificar gallina, codorniz y pato y comparar sus huevos corresponde a Descubrimiento. Tampoco pide memorizar una cadena de producción."}'::jsonb, '{"es": "Si alguien menciona la gallina, acoge su aporte como un ejemplo: “Sí, es una de las aves que pone huevos; pronto conoceremos más”. Si conoce huevos que llegan de un patio o directamente de una granja, reconoce ese otro recorrido. Vuelve a la idea central: los huevos ya estaban en algún lugar antes de la tienda o la casa."}'::jsonb, null::jsonb, null::jsonb from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'el-huevo'
union all
select g.id, 3, 'descubrimiento', '{"es": "Descubrimiento"}'::jsonb, '{"es": "Descubrir"}'::jsonb, '{"es": "Huevos de aves que se parecen y se diferencian"}'::jsonb, '{"es": "Los niños descubren que no todos los huevos son iguales. Comparan huevos de gallina, codorniz y pato por rasgos sencillos, como el tamaño o el color."}'::jsonb, '{"es": "Haz que el grupo pueda nombrar al menos dos aves cuyos huevos se comen y notar una diferencia visible entre ellos."}'::jsonb, '{"es": "Retoma la curiosidad que dejó Origen: “¿Se parecerán todos los huevos?”. Escucha qué esperan encontrar. A medida que conocen cada ejemplo, invita a observarlo y relaciona su huevo con gallina, codorniz o pato, sin anunciar toda la lista al inicio. Deja que expresen las diferencias con palabras simples: “más pequeño”, “más grande”, “con manchitas” o “sin manchitas”. Explica que son huevos de aves diferentes; no digas que uno es mejor que otro ni que el color identifica siempre a un ave. Cierra recuperando dos de las aves y una diferencia que el grupo haya observado."}'::jsonb, '{"es": "Puedes preguntar: “¿Se parecerán todos los huevos?”, “¿Cuál han visto?”, “¿Cuál parece más pequeño?”, “¿Cuál tiene manchitas?”, “¿De qué ave será este?”. Invita a que digan los nombres de las aves conforme las conocen y a que usen una palabra de comparación."}'::jsonb, '{"es": "Aquí manda la curiosidad por las semejanzas y diferencias. Cada niño puede reconocer algo familiar o encontrar algo nuevo. El descubrimiento amplía lo que sabe el grupo sin necesitar que antes haya creído que todos los huevos eran de una sola ave."}'::jsonb, null::jsonb, '{"es": "No abre el huevo ni nombra sus partes. Eso corresponde a Propiedades."}'::jsonb, '{"es": "Evita dar una lista larga de aves: tres bastan para esta edad. Si alguien dice que un huevo de color distinto “es raro”, responde que los huevos pueden verse diferentes sin convertir el color en una regla sobre lo que trae dentro."}'::jsonb, null::jsonb, null::jsonb from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'el-huevo'
union all
select g.id, 4, 'preparacion', '{"es": "Preparación"}'::jsonb, '{"es": "Secuenciar"}'::jsonb, '{"es": "Pasos seguros antes de comer huevo"}'::jsonb, '{"es": "Los niños ordenan una idea de seguridad: el huevo se conserva frío y se cocina hasta que clara y yema estén firmes. Conocen que el huevo crudo no es la opción segura para comer."}'::jsonb, '{"es": "Haz que puedan decir dos cuidados: conservar el huevo refrigerado y comerlo cocido, con clara y yema firmes."}'::jsonb, '{"es": "Di que esta escena trata de dejar el huevo listo para comer, sin preparar nada en el taller. Presenta dos pasos: primero, mantenerlo refrigerado; después, cocinarlo hasta que la clara y la yema estén firmes. Usa “frío y bien cocido” como frase corta. Pregunta qué pasaría si falta uno de los pasos y escucha respuestas sencillas. No describas recetas ni métodos de cocina. Cierra pidiendo que ordenen verbalmente “frío” y “bien cocido”."}'::jsonb, '{"es": "Puedes preguntar: “¿Qué va primero: dejarlo frío o comerlo?”, “¿Cómo deben quedar la clara y la yema?”, “¿Está listo si queda líquido?”, “¿Qué dos palabras nos ayudan a recordarlo?”. Pide que digan “frío y bien cocido” en coro y que repitan la secuencia con sus palabras."}'::jsonb, '{"es": "Aquí importa el criterio: “yo sé el orden”. Si alguien responde con una receta, agradece la idea y vuelve a los dos cuidados que hacen seguro el huevo."}'::jsonb, '{"es": "Refrigerar: conservar frío en el refrigerador. Cocción completa: calentar el huevo hasta que tanto la clara como la yema queden firmes; “firme” significa que ya no están líquidas. Son dos cuidados distintos y se necesitan ambos en la secuencia que enseñamos."}'::jsonb, '{"es": "No propone cocinar ni comer huevo en el taller; tampoco explica para qué sirve la proteína. Eso corresponde a Beneficio."}'::jsonb, '{"es": "No pidas que cuenten cómo se cocina en su casa ni corrijas prácticas familiares delante del grupo. Si mencionan huevo crudo, responde con calma: “Para comerlo seguro, recordamos frío y bien cocido”."}'::jsonb, null::jsonb, null::jsonb from guias g join storyboards s on s.id = g.storyboard_id where s.slug = 'el-huevo';

-- Uno recién registrado, sin JSON en el build: no lo ve ninguna organización ni se programa.
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

-- ── Jornada de Fundación Centro (la del fixture: su lugar y sus días relativos) ──
insert into jornadas (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, organizacion_id)
values ('Semana de la nutrición', 'Talleres de alimentación alrededor de la desnutrición.', 'Sede central',
        current_date + (-3), current_date + (16),
        (select id from organizaciones where nombre = 'Fundación Centro'));

-- ── Workshops ─────────────────────────────────────────────────────────────────
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
      ('t-101', 0, '10:00'::time, '10:30'::time, 'Aula 3A', '2.º B', 24, true, null::text, null::jsonb),
      ('t-102', 0, '12:00'::time, '12:30'::time, 'Salón de usos múltiples', '1.º A', 20, true, null::text, null::jsonb),
      ('t-100', -1, '09:00'::time, '09:30'::time, 'Aula 1C', '1.º C', 22, true, null::text, null::jsonb),
      ('t-103', 2, '09:00'::time, '09:30'::time, 'Centro comunitario', 'Grupo de la tarde', 15, true, null::text, null::jsonb),
      ('t-104', 1, '11:00'::time, '11:30'::time, 'Biblioteca', '3.º B', 25, true, null::text, null::jsonb),
      ('t-105', 4, '10:00'::time, '10:30'::time, 'Aula 2A', '2.º A', 23, true, null::text, null::jsonb),
      ('t-108', 5, '11:00'::time, '11:30'::time, 'Aula 2C', '2.º C', 22, true, 'Feriado escolar', null::jsonb),
      ('t-106', 9, '09:30'::time, '10:00'::time, 'Patio cubierto', '4.º A', 28, true, null::text, null::jsonb),
      ('t-107', 16, '12:00'::time, '12:30'::time, 'Centro comunitario', 'Grupo de la mañana', 18, true, null::text, null::jsonb),
      ('t-099', -3, '10:00'::time, '10:30'::time, 'Aula 2B', '3.º A', 26, true, null::text, '{"calificacion": 4, "asistentes": 23, "participacion": "alta", "claridad": "clara", "costo": "Ordenar el recorrido en el primer intento.", "faltoMaterial": ""}'::jsonb),
      ('t-098', -8, '11:00'::time, '11:30'::time, 'Aula 1A', '1.º A', 21, false, null::text, '{"calificacion": 5, "asistentes": 21, "participacion": "alta", "claridad": "muy_clara", "costo": "", "faltoMaterial": ""}'::jsonb)
    ) as v (ref, dia, inicio, fin, lugar, grupo, asistentes, en_jornada, motivo, feedback)
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
