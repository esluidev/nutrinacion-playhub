# Glosario

Cómo se nombra cada concepto en la base de datos, en el JSON del storyboard y en la UI. La definición de producto de cada término está en `../product/01 - Constitucion de producto.md` (raíz de PlayHub); los estados exactos, en los enums de `supabase/migrations/0001_catalogos.sql`. En el código conviven nombres en inglés (`workshop`, `educator`, `scene`, `audience`, `category`) y los de la BD en español; sigue el que ya use el módulo. Las tablas siguen la convención de [backend.md](backend.md#nombres).

| Concepto | BD | JSON del storyboard | UI | Nota |
|---|---|---|---|---|
| Organización | `organizaciones` | — | Organización | **La unidad de operación** ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)): países donde opera (`paises`), licencia, administradores, colaboradores, educadores, jornadas y talleres |
| Licencia | `organizacion_licencias` | — | Licencia | El contrato: vigencia, estado y notas. Sin cupos |
| Colaborador | `organizacion_colaboradores` | — | Colaborador | Opera la organización desde Admin (educadores, grupos, talleres, jornadas, planificador); no toca licencia, administradores ni colaboradores |
| Invitación | `invitaciones` | — | Invitación | Única vía de alta en Admin; su `role` dice qué relación crea |
| Educador | `educadores` | — | Educador / Docente | De la organización. Entra en Educators con correo y un PIN que elige con el código de activación que le genera Admin; generar otro código lo reinicia |
| Grupo de educadores | `educador_grupos`, `educador_grupo_miembros` | — | Grupo | Para asignar un taller a varios educadores de la organización a la vez |
| Storyboard | `storyboards` | `storyboard.json` (`key` = `clave`) | Storyboard | Secuencia fija de escenas de un taller. Estándar (`organizacion_id` nulo) o personalizado de una organización |
| Estado del storyboard | `estado_publicacion` | — | Registrado, En revisión, Publicado, Archivado | Como un artículo; lo cambia Player al publicar |
| Países del storyboard | `storyboards.paises_disponibles` | — | Países | Los elige Player del catálogo `paises` (tropicalización); publicar exige al menos uno |
| Categoría | `storyboards.categoria` (`categoria_storyboard`) | `type` | Categoría | Alimentación, actividad física, cuidado personal o salud emocional. En rutas y carpetas, el eje (`/play/alimentacion/...`). No se llaman “pilares” |
| Subcategoría | `storyboards.subcategoria` (`subcategoria_storyboard`) | `category` | Subcategoría | De la lista de su categoría (nutrientes, prevención…) |
| Edición | `storyboards.edicion` (`edicion_storyboard`) | `audience` | Edición | Infantil, preadolescencia o adolescencia. Un storyboard es una edición |
| Enfoque de salud | `enfoque_salud` en storyboards | `healthFocus` | Enfoque | Las etiquetas (diabetes, obesidad…): búsquedas y filtros |
| Idioma | `idioma` | `languages`, `defaultLanguage` | Idioma | `es`, `en`. El del contenido es del workshop; el de la app, de cada usuario |
| Escena | `guia_escenas.carpeta` | `scenes[].folder` | Escena | Cada escena es un juego y vive en el build; la base solo guarda su guía |
| Guía | `guias`, `guia_escenas` | — | Guía | La guía del educador: cabecera y una por escena, por idioma. Se escribe en Admin |
| Jornada | `jornadas` | — | Jornada | Dónde y cuándo se va: nombre, lugar y uno o varios días. Se crea o se elige al programar un taller; sus talleres caen en sus días y heredan su lugar. Se borra sola al quedarse sin talleres |
| Taller (workshop) | `workshops` | — | Taller | Instancia programada de un storyboard en una organización, suelto o dentro de una jornada |
| Estado del taller | `estado_workshop` | — | Borrador, En revisión, Publicado, Finalizado, Cancelado, Archivado | Finalizado: pasó su fecha (se reprograma); archivado: descartado. Programado, hoy, en curso, realizado y sin realizar se deducen |
| Asignación | `workshop_educadores` | — | Asignación | Un educador (y opcionalmente su grupo) en un workshop, con la ejecución real |
| Feedback | `workshop_feedback` | — | Feedback | Lo que cuenta el educador al terminar, del grupo. Nunca puntos ni datos de una persona |
