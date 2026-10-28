-- 0003: el catálogo de storyboards y sus guías.
--
-- Lo que es del juego (escenas, narración, consignas, feedback de las escenas, datos, Rive,
-- SVG, efectos) vive en los JSON del storyboard, en el build de Player, y NO entra en la base.
-- Aquí solo hay:
--   · storyboards: el catálogo, como un artículo. Copia la metadata del JSON para listar, filtrar
--     y buscar (la registra Player, 0007), y guarda lo que decide Player al publicar: el estado,
--     los países y, si es personalizado, la organización (decisión 006);
--   · guias y guia_escenas: la guía del educador, que se escribe en Admin (decisión 002).
-- Escribe solo el superadmin; las organizaciones ven lo publicado, nunca lo modifican.

-- ═════════════════════════════════════════════════════════════════════════════
-- LISTAS POR CATEGORÍA (catalogo.md, skill playhub-guides-design)
-- ═════════════════════════════════════════════════════════════════════════════
-- La subcategoría y los enfoques se eligen de la lista de la categoría del storyboard. Son reglas,
-- no tablas: si catalogo.md cambia, cambian aquí (y el enum, si hay un código nuevo).
create function subcategoria_de_categoria(p_categoria categoria_storyboard, p_subcategoria subcategoria_storyboard)
returns boolean
language sql immutable
as $$
  select p_subcategoria is null or p_subcategoria = any (case p_categoria
    when 'ALIMENTACION'     then '{NUTRIENTES,HIDRATACION,CRECIMIENTO,ENERGIA,DIGESTION,PREVENCION,PROCESADOS,TEMPORADA}'::subcategoria_storyboard[]
    when 'ACTIVIDAD_FISICA' then '{PREVENCION,ENERGIA,CRECIMIENTO,FUERZA,COORDINACION,HIDRATACION}'::subcategoria_storyboard[]
    when 'CUIDADO_PERSONAL' then '{HIGIENE,PREVENCION,RUTINAS,HIDRATACION,PIEL,DESCANSO}'::subcategoria_storyboard[]
    when 'SALUD_EMOCIONAL'  then '{ACEPTACION,CREENCIAS,PREVENCION,MEDICINA,HABITOS}'::subcategoria_storyboard[]
  end)
$$;

create function enfoques_de_categoria(p_categoria categoria_storyboard, p_enfoques enfoque_salud[])
returns boolean
language sql immutable
as $$
  select p_enfoques <@ case p_categoria
    when 'ALIMENTACION'     then '{DIABETES,OBESIDAD,DESNUTRICION,ANEMIA,CELIAQUIA,ALERGIAS,HIPERTENSION,CARIES}'::enfoque_salud[]
    when 'ACTIVIDAD_FISICA' then '{OBESIDAD,SEDENTARISMO,DIABETES,HIPERTENSION,ASMA}'::enfoque_salud[]
    when 'CUIDADO_PERSONAL' then '{DIABETES,PIE_DIABETICO,CARIES,CELIAQUIA,ALERGIAS,INFECCIONES,OBESIDAD}'::enfoque_salud[]
    when 'SALUD_EMOCIONAL'  then '{DIABETES,CELIAQUIA,ALERGIAS,OBESIDAD,DESNUTRICION,AUTOESTIMA}'::enfoque_salud[]
  end
$$;

-- Un storyboard está disponible en un país solo si lo tiene asignado (Player lo elige al publicar).
create function disponible_en_pais(p_paises text[], p_pais text)
returns boolean
language sql immutable
as $$
  select coalesce(p_pais = any (p_paises), false)
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- STORYBOARDS: el catálogo
-- ═════════════════════════════════════════════════════════════════════════════
create table storyboards (
  id                  bigint generated always as identity primary key,
  -- metadata del JSON (storyboard.json): la trae Player al registrar y al sincronizar
  clave               uuid not null unique,                  -- `key`: la identidad; el slug solo localiza
  slug                text not null,                         -- `slug`
  version_build       text,                                  -- `version`
  titulo              jsonb not null default '{}'::jsonb,    -- `title`; se corrige en el JSON, no en Admin
  categoria           categoria_storyboard not null,         -- `type`
  subcategoria        subcategoria_storyboard,               -- `category`
  edicion             edicion_storyboard not null,           -- `audience`
  enfoques_salud      enfoque_salud[] not null default '{}', -- `healthFocus` (jornadas, búsquedas, intereses)
  idiomas             idioma[] not null default '{es}',      -- `languages`
  idioma_principal    idioma not null default 'es',          -- `defaultLanguage`
  duracion_min        int check (duracion_min > 0),          -- `estimatedDuration`
  numero_escenas      int not null default 0,                -- cuántas trae `scenes`
  -- lo que decide Player al registrar o publicar (publicar_storyboard, 0007)
  estado_publicacion  estado_publicacion not null default 'REGISTRADO',
  paises_disponibles  text[] not null default '{}',          -- códigos de `paises`; publicar exige al menos uno
  organizacion_id     bigint references organizaciones (id) on delete restrict,  -- null = estándar; con valor = personalizado de esa organización
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (categoria, slug),                                  -- /play/<categoria>/<slug> en el runner
  constraint storyboards_subcategoria check (subcategoria_de_categoria(categoria, subcategoria)),
  constraint storyboards_enfoques check (enfoques_de_categoria(categoria, enfoques_salud)),
  constraint storyboards_idioma_principal check (idioma_principal = any (idiomas))
);

create index on storyboards (organizacion_id);
create index on storyboards (categoria);
create index on storyboards using gin (enfoques_salud);
create index on storyboards using gin (idiomas);
create index on storyboards using gin (paises_disponibles);

-- ═════════════════════════════════════════════════════════════════════════════
-- GUÍAS: la guía del educador de cada storyboard
-- ═════════════════════════════════════════════════════════════════════════════
-- La cabecera de la guía (plantilla de la guía). Una por storyboard.
create table guias (
  id            bigint generated always as identity primary key,
  version       text,                                  -- «1.2»
  descripcion   jsonb,                                 -- qué van a conocer y por qué importa
  objetivo      jsonb,                                 -- qué logra el educador con este taller
  publico       jsonb,                                 -- la edición, con las palabras de la organización
  adaptado_a    jsonb,                                 -- si es personalizado: para quién y a qué está adaptado
  storyboard_id bigint not null unique references storyboards (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- La guía de cada escena, con los campos de la plantilla y en su orden. `orden`, `carpeta` y
-- `titulo` se copian del JSON (las escenas del storyboard); el resto se escribe en Admin, por idioma.
create table guia_escenas (
  id          bigint generated always as identity primary key,
  orden       int not null check (orden > 0),
  carpeta     text not null,                          -- la carpeta de la escena en el build
  titulo      jsonb not null default '{}'::jsonb,
  verbo       jsonb,                                  -- qué hace el niño
  subtitulo   jsonb,                                  -- de qué va la escena en este taller
  descripcion jsonb,
  objetivo    jsonb,
  pedagogia   jsonb,
  preguntas   jsonb,                                  -- preguntas e interacciones sugeridas
  psicologia  jsonb,
  cientifico  jsonb,
  no_hace     jsonb,                                  -- lo que esta escena no hace
  consejos    jsonb,
  mecanica    jsonb,
  material    jsonb,                                  -- con qué participa quien no tiene dispositivo
  guia_id     bigint not null references guias (id) on delete cascade,
  unique (guia_id, orden),
  unique (guia_id, carpeta)
);

create index on guia_escenas (guia_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═════════════════════════════════════════════════════════════════════════════
create function toca_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger storyboards_updated_at before update on storyboards for each row execute function toca_updated_at();
create trigger guias_updated_at before update on guias for each row execute function toca_updated_at();

-- Cada storyboard nace con su guía (vacía): Admin la escribe después.
create function storyboards_crea_guia()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into guias (storyboard_id) values (new.id);
  return new;
end;
$$;

create trigger storyboards_guia after insert on storyboards for each row execute function storyboards_crea_guia();

-- Reglas de la publicación, para cualquier camino (Player, Admin o SQL). Usa tablas de 0004 y
-- 0009 (workshops, temarios, publicaciones): existen cuando el trigger corre.
--   · los países, del catálogo `paises` y activos; publicar exige al menos uno;
--   · volver a registrado o a revisión, solo si nadie lo usa (si no, se archiva);
--   · un personalizado no cambia de organización si ya tiene workshops;
--   · no se le quita un país ni un idioma en el que haya workshops publicados por venir.
create function storyboards_valida_publicacion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_pais   text;
  v_idioma idioma;
  v_n      int;
begin
  select p into v_pais from unnest(new.paises_disponibles) p
   where not exists (select 1 from paises x where x.codigo = p and x.activo) limit 1;
  if v_pais is not null then
    raise exception 'El país % no está en el catálogo de países', v_pais;
  end if;
  if new.estado_publicacion = 'PUBLICADO' and cardinality(new.paises_disponibles) = 0 then
    raise exception 'Para publicar «%» elige al menos un país', new.slug;
  end if;
  if tg_op = 'INSERT' then
    return new;
  end if;

  if new.estado_publicacion in ('REGISTRADO', 'EN_REVISION') and old.estado_publicacion in ('PUBLICADO', 'ARCHIVADO')
     and (exists (select 1 from workshops where storyboard_id = new.id)
          or exists (select 1 from temario_storyboards where storyboard_id = new.id)
          or exists (select 1 from organizacion_publicaciones where storyboard_id = new.id)) then
    raise exception '«%» ya se usa en workshops, temarios o publicaciones: archívalo en lugar de despublicarlo', new.slug;
  end if;

  if new.organizacion_id is distinct from old.organizacion_id and exists (select 1 from workshops where storyboard_id = new.id) then
    raise exception '«%» ya tiene workshops: no puede cambiar de organización', new.slug;
  end if;

  select c.pais, count(*) over () into v_pais, v_n
    from workshops w join comunidades c on c.id = w.comunidad_id
   where w.storyboard_id = new.id and w.estado = 'PUBLICADO' and w.fecha >= current_date
     and not disponible_en_pais(new.paises_disponibles, c.pais)
   limit 1;
  if v_pais is not null then
    raise exception 'No se puede quitar %: hay % workshop(s) publicado(s) ahí por venir', v_pais, v_n;
  end if;

  foreach v_idioma in array old.idiomas loop
    continue when v_idioma = any (new.idiomas);
    select count(*) into v_n from workshops
     where storyboard_id = new.id and idioma_contenido = v_idioma and estado = 'PUBLICADO' and fecha >= current_date;
    if v_n > 0 then
      raise exception 'No se puede quitar el idioma «%»: hay % workshop(s) publicado(s) en ese idioma por venir', v_idioma, v_n;
    end if;
  end loop;

  return new;
end;
$$;

create trigger storyboards_publicacion
  before insert or update of estado_publicacion, paises_disponibles, organizacion_id, idiomas on storyboards
  for each row execute function storyboards_valida_publicacion();
