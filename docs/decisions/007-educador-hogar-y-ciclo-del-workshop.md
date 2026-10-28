# Educador de la organización, app del hogar y ciclo del workshop

Fecha: 2026-10-16
Estado: aceptada
Sustituye a: no aplica. Precisa la [decisión 005](005-base-nueva-y-acceso-educador.md) (cómo entra el educador) y la [decisión 006](006-modelo-y-catalogo-desde-player.md) (publicación y países del storyboard).

## Contexto

La tarea 006 siguió con los participantes y la app del hogar (nombre temporal). Luis respondió en varias rondas y pidió simular escenarios para validar el modelo antes de escribir la migración que correrá en producción. Las simulaciones (v1 a v8) y las respuestas están en la [tarea 006](../../tasks/006-modelo-de-datos.md).

## Decisión

Luis, 2026-10-16:

**Educador**
- El educador pertenece a la organización y se liga a una o varias de sus comunidades. Su acceso está separado de la comunidad: en Educators ve lo asignado en cada una.
- Como en el hogar, un PIN que elige la persona se recuerda mejor que un código generado.

**App del hogar**
- **Uso sin cuenta:** la app funciona sin cuenta, pero no guarda nada.
- **Cuenta del adulto:** nombre, país, correo y PIN, sin Supabase Auth. Solo se valida que el correo no esté en uso; el PIN es libre.
- **Perfiles:** solo con cuenta. Cada perfil lleva nombre, género y edad (nada más) y guarda sus intereses.
- **La comunidad es el grupo:** no hay grupos dentro de una comunidad.
- **Unirse:**
  - un perfil se une con el código que le dio la comunidad («Unirme» en la organización), y se va cuando quiere;
  - no hay solicitudes;
  - cambiar el código impide altas nuevas y los miembros siguen;
  - no hay cursos ni caducidad.
- **Lo que ven las familias:**
  - lo que publica una organización (un storyboard o un temario, para toda la organización o para una comunidad) es solo para sus miembros;
  - lo público es lo de Nutrinación.
- **Lo que ve la organización:** los perfiles que se unen (nombre, género y edad) y cuántos colaboradores, educadores y participantes tiene cada comunidad.
- **Seguimiento:** solo se marca qué storyboards terminó cada perfil; nada de respuestas ni puntos. No se muestra en la primera versión, pero la base lo guarda.
- **Roles:**
  - los colaboradores publican temarios y storyboards en su comunidad;
  - los administradores de la organización (titular y demás) tienen todo en todos los niveles;
  - el superadmin administra la plataforma.
- **Nombres:** prefijo `hogar_`; los participantes, `comunidad_participantes`.

**Storyboard**
- Se publica desde Player. Los países no van en el JSON: Player los elige del catálogo de Supabase al registrar o publicar (tropicalización).
- Tiene estados como un artículo: registrado, en revisión, publicado y archivado.
- Usar enums para los estados y los demás valores fijos.

**Workshop**
- Estados: borrador, en revisión, publicado, finalizado, cancelado y archivado.
- **Finalizado:** pasó su fecha; si hace falta, se reprograma y se publica.
- **Archivado:** como un borrado o descartado.

## Cómo se implementa

Las migraciones `0001`–`0010`, las pruebas pgTAP `01`–`05` y el mapa están en [`docs/backend.md`](../backend.md). Además:
- El acceso del educador queda por organización: Admin genera un código de activación y el educador elige su PIN la primera vez.
  - Si la misma persona eligió el mismo PIN en dos organizaciones, una sola sesión le muestra las dos.
  - Cada organización controla su propio acceso: ninguna puede restablecer el de otra.
- Pasa a FINALIZADO en cuanto todos sus educadores dejan el feedback y, si no, con una tarea de pg_cron cada hora.
- Lo que pasó en la sesión (hoy, en curso, realizado, falta el feedback, sin realizar) se deduce de la fecha y de la ejecución de cada educador.
- La app del hogar usa funciones `hogar_*` con un token, como Educators.

## Consecuencias

- **Educators no está conectado todavía (entrega 3).** Cuando se conecte, su entrada pide elegir el PIN la primera vez (`definir_pin`).
- **La app del hogar no existe todavía.** Las funciones y sus pruebas definen su contrato.
- **Sin acceso a su correo y con el PIN olvidado, no hay recuperación.** La familia crea otra cuenta y vuelve a unirse con los códigos vigentes. La recuperación por correo necesita enviar correos (Edge Function) y queda pendiente.
- **Un storyboard archivado se sigue viendo, pero no se programa.** Uno usado en workshops, temarios o publicaciones no vuelve a registrado: se archiva.
- **Un código nuevo de categoría, subcategoría, enfoque, edición o idioma pide una migración** (`alter type … add value`).
