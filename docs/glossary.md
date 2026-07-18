# Glosario del dominio

Vocabulario del producto. Usar estos términos consistentemente en código, UI y datos.
Cuando un término tiene una forma en español (UI/BD) y otra en inglés (código), se indica.

## Comunidad (community)

La organización que usa la plataforma: empresa, centro educativo, organización, fundación,
etc. Es el concepto de **tenancy** (multi-tenant). Cada comunidad tiene su propio equipo,
sus talleres y sus datos, aislados del resto.

- BD: `comunidades`, `comunidad_id`.
- Código: `community`, `communityId`.
- UI: "Comunidad".

## Colaborador

Miembro del equipo administrativo de una comunidad (además del administrador dueño).
Gestiona talleres, educadores, etc. desde la app admin.

## Educador (educator)

Persona que imparte los talleres en el aula. Pertenece a una comunidad. Accede a la app
de educadores con correo + código de acceso generado por el administrador.

- BD: `educadores`.
- Código: `educator`.
- UI: "Educador" / "Docente".

## Grupo (group)

Agrupación de educadores dentro de una comunidad. Sirve para organizar y asignar.

- BD: `grupos`.

## Storyboard

Plantilla de contenido prediseñada. Una secuencia ordenada de escenas sobre un tema
(ej. "Los Frijoles Mágicos", "El Huevo como Alimento Diario"). Pertenece a uno de los
cuatro tipos y a una subcategoría.

Tipos: gratuito, premium, personalizado.

- BD: `storyboards`.
- Código: `storyboard`.
- UI: "Storyboard".

## Escena (scene)

Una unidad de un storyboard. Combina:

- **Lectura** — la parte narrativa de la escena (historia, contenido).
- **Juego** — la parte interactiva (un juego HTML).
- **Guía pedagógica** — objetivo, guion para el educador, tips de dinámica, base nutricional/científica.

Las escenas tienen un orden dentro del storyboard.

- BD: `storyboard_escenas`.
- Código: `scene`.
- UI: "Escena".

## Taller / Workshop

Una instancia programada de un storyboard. Tiene fecha, lugar, educador asignado y estado.
Es lo que el educador ejecuta en el aula.

- BD: `talleres`.
- Código: `workshop`.
- UI: "Taller".

Estados de un taller: borrador, programado, completado, cancelado.

## Juego (game)

El contenido interactivo HTML de una escena. Creado en Studio, almacenado y expuesto para
que la app de educadores lo renderice en un webview.

- Código: `game`.
- UI: "Juego".

## Guía pedagógica (pedagogical guide)

El contenido docente de una escena o storyboard: objetivo pedagógico, guion sugerido,
tips de dinámica para el salón, conceptos clave, base nutricional/científica.

- BD: `storyboard_guias` / campos en escena.
- Código: `guide`.

## Tipo de storyboard (type)

Una de las cuatro áreas temáticas: alimentación, cuidado personal, actividad física,
salud emocional. Cada storyboard pertenece a un tipo, y cada tipo tiene su contrato
pedagógico (`docs/storyboards.md`). No se les llama "pilares".

- BD: `tipos_storyboard`.
- Código: `TipoStoryboard` / `tipo`.

## Código de acceso (access code)

Código que el administrador genera para un educador, que junto con su correo le permite
entrar a la app de educadores.

- BD: `codigo_acceso`.
- Código: `accessCode`.

## Gamificación

Términos de la capa de juego (ver `docs/games.md`):

- **XP** — puntos de experiencia que el educador/aula acumula al completar escenas.
- **Nivel (level)** — progresión basada en escenas completadas.
- **Recompensa / tesoro (reward / treasure)** — gema, diamante, ruby.
- **Estado de escena** — completada, activa, bloqueada.
