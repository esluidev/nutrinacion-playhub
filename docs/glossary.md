# Glosario

Cómo se nombra cada concepto en la base de datos, en el JSON del storyboard y en la UI. La definición de producto de cada término está en `../product/01 - Constitucion de producto.md` (raíz de PlayHub); los estados exactos, en los enums de `supabase/migrations/0001_catalogos.sql`. En el código conviven nombres en inglés (`workshop`, `educator`, `scene`, `audience`, `category`) y los de la BD en español; sigue el que ya use el módulo. Las tablas siguen la convención de [backend.md](backend.md#nombres).

| Concepto | BD | JSON del storyboard | UI | Nota |
|---|---|---|---|---|
| Organización | `organizaciones` | — | Organización | Relación comercial: administradores, licencia, educadores, jornadas y comunidades. Con perfil público sale en «Unirme» de la app del hogar |
| Licencia | `organizacion_licencias` | — | Licencia | Cupos y los países donde puede abrir comunidades |
| Comunidad | `comunidades`, `comunidad_id` | — | Comunidad | **El tenancy**, y el grupo (no hay grupos dentro). Nunca “workspace”. Tiene país y código para unirse |
| Colaborador | `comunidad_colaboradores` | — | Colaborador | Opera una comunidad desde Admin; también publica en ella |
| Invitación | `invitaciones` | — | Invitación | Única vía de alta en Admin; su `role` dice qué relación crea |
| Educador | `educadores`, `comunidad_educadores` | — | Educador / Docente | De la organización, ligado a una o varias comunidades. Entra en Educators con correo y un PIN que elige con el código de activación de Admin |
| Grupo de educadores | `educador_grupos`, `educador_grupo_miembros` | — | Grupo | Para asignar un workshop a varios educadores de una comunidad a la vez |
| Storyboard | `storyboards` | `storyboard.json` (`key` = `clave`) | Storyboard | Secuencia fija de escenas de un taller. Estándar (`organizacion_id` nulo) o personalizado de una organización |
| Estado del storyboard | `estado_publicacion` | — | Registrado, En revisión, Publicado, Archivado | Como un artículo; lo cambia Player al publicar |
| Países del storyboard | `storyboards.paises_disponibles` | — | Países | Los elige Player del catálogo `paises` (tropicalización); publicar exige al menos uno |
| Categoría | `storyboards.categoria` (`categoria_storyboard`) | `type` | Categoría | Alimentación, actividad física, cuidado personal o salud emocional. En rutas y carpetas, el eje (`/play/alimentacion/...`). No se llaman “pilares” |
| Subcategoría | `storyboards.subcategoria` (`subcategoria_storyboard`) | `category` | Subcategoría | De la lista de su categoría (nutrientes, prevención…) |
| Edición | `storyboards.edicion` (`edicion_storyboard`) | `audience` | Edición | Infantil, preadolescencia o adolescencia. Un storyboard es una edición; la de un perfil del hogar sale de su edad |
| Enfoque de salud | `enfoque_salud` en storyboards, jornadas e intereses | `healthFocus` | Enfoque | Las etiquetas (diabetes, obesidad…): jornadas, búsquedas y la ruta por interés |
| Idioma | `idioma` | `languages`, `defaultLanguage` | Idioma | `es`, `en`. El del contenido es del workshop; el de la app, de cada usuario |
| Escena | `guia_escenas.carpeta` | `scenes[].folder` | Escena | Cada escena es un juego y vive en el build; la base solo guarda su guía |
| Guía | `guias`, `guia_escenas` | — | Guía | La guía del educador: cabecera y una por escena, por idioma. Se escribe en Admin |
| Jornada | `jornadas` | — | Jornada | La crea la organización: reúne workshops alrededor de un enfoque de salud |
| Taller (workshop) | `workshops` | — | Taller | Instancia programada de un storyboard en una comunidad |
| Estado del taller | `estado_workshop` | — | Borrador, En revisión, Publicado, Finalizado, Cancelado, Archivado | Finalizado: pasó su fecha (se reprograma); archivado: descartado. Programado, hoy, en curso, realizado y sin realizar se deducen |
| Asignación | `workshop_educadores` | — | Asignación | Un educador (y opcionalmente su grupo) en un workshop, con la ejecución real |
| Feedback | `workshop_feedback` | — | Feedback | Lo que cuenta el educador al terminar, del grupo. Nunca puntos ni datos de una persona |
| Temario | `temarios`, `temario_storyboards` | — | Temario | Un tema que agrupa storyboards («Reduciendo la grasa visceral»): de Nutrinación, de una organización o de una comunidad |
| Publicación | `organizacion_publicaciones` | — | Publicación | Lo que una organización ofrece a sus participantes (storyboard o temario), a toda la organización o a una comunidad |
| Cuenta del hogar | `hogares` | — | Cuenta | El adulto: nombre, país, correo y PIN. Sin Supabase Auth |
| Perfil | `hogar_perfiles` | — | Perfil | Un niño de la cuenta: nombre, género, edad e intereses. No confundir con `perfiles` (usuarios de Admin) |
| Participante | `comunidad_participantes` | — | Participante | Un perfil que se unió a una comunidad con su código |
| Código de acceso | `comunidades.codigo_acceso` | — | Código | 6 dígitos que la comunidad reparte a las familias; cambiarlo solo impide altas nuevas |
| Avance | `hogar_perfil_avance` | — | — | Qué storyboards terminó un perfil. Solo «terminado»; no se muestra en la primera versión |
