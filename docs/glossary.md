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
| Guía | `guias`, `guia_escenas` | — | Guía | La guía del educador: cabecera y una por escena, por idioma. Se escribe en Player |
| Publicado en el hogar | `storyboards.publicado_hogar` | — | También en la app del hogar | Si un storyboard sale en la app del hogar (tarea 022). Solo Nutrinación publica para casa: un publicado estándar; el país y la edad los pone el perfil del niño |
| Unidad de estudio | `unidades_estudio`, `unidad_estudio_storyboards` | — | Unidad de estudio | Un recorrido de la app del hogar con storyboards del hogar en orden, de cualquier categoría («Ganando músculos»). Opcional: cada storyboard sale también suelto |
| Programa | `programas` | — | Programa | Para qué y cuándo (tarea 021): nombre y fechas. Junta talleres sueltos y jornadas, que caen en sus fechas. Opcional |
| Lugar | `lugares` | — | Lugar | Un sitio concreto donde se dan talleres (escuela, centro, plaza). Lo de dentro del lugar («Aula 3A») es el `espacio` del taller. Se retira con `activo` |
| Comunidad | `comunidades` | — | Comunidad | Agrupa los lugares de un mismo territorio para el reporte por territorio; solo agrupa (no es la comunidad de la decisión 005). Existe aunque no tenga lugares; al borrarla, sus lugares quedan sin ella |
| Grupo de audiencia | `grupos_audiencia` | — | Audiencia | A quién se atiende («Parvulario 6»), independiente del lugar. Solo el nombre es obligatorio; sin número de niños. `abierto` («Público general» en pantalla): cuenta asistencias y no alcance, y el cierre lleva solo el total. Cada organización nace con su audiencia «Público general», fija: solo se le cambia el nombre |
| Jornada | `jornadas` | — | Jornada | Dónde y cuándo se va: nombre, lugar y uno o varios días, y si es parte de un programa. Se crea en su sección de Admin, antes que sus talleres, y al programar un taller se elige («Pertenece a»); sus talleres caen en sus días y toman su lugar y su programa. Existe aunque no tenga talleres |
| Taller (workshop) | `workshops` | — | Taller | Instancia programada de un storyboard en una organización: une un lugar y un grupo de audiencia (para publicar), suelto o dentro de una jornada, y en un programa si lo tiene |
| Historial del taller | `workshop_historial` | — | Historial | Cada cancelación, reprogramación o cambio de fecha de un taller publicado, con la fecha anterior y el motivo. Lo escribe la base |
| Estado del taller | `estado_workshop` | — | Borrador, En revisión, Publicado, Finalizado, Cancelado, Archivado | Finalizado: pasó su fecha (se reprograma); archivado: descartado. Programado, hoy, en curso, realizado y sin realizar se deducen |
| Asignación | `workshop_educadores` | — | Asignación | Un educador (y opcionalmente su grupo) en un workshop, con la ejecución real |
| Feedback | `workshop_feedback` | — | Feedback | Lo que cuenta el educador al terminar, del grupo: el total y, en un grupo cerrado, cuántas niñas y cuántos niños. Nunca puntos ni datos de una persona |
| Conexión del taller | `workshop_conexiones` | — | Código para unirse | La que abre un taller cada vez que se da para que otros dispositivos se unan con el QR o el código (tarea 013). El código vale mientras el taller está en curso |
| Participante | `workshop_conexion_participantes` | — | Quien se une (en el panel, su apodo) | Un dispositivo que se unió a una conexión del taller: un avatar (Rufo, Bruno, Lila, Michi, Rita o Leo) y un apodo opcional, su estado (esperando, aprobado, rechazado, quitado) y su tiempo conectado. No es una persona registrada ni se le sigue de un taller a otro |
