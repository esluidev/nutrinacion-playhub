# El superadmin administra organizaciones, no su operación

Fecha: 2026-10-18
Estado: aceptada
Sustituye a: no aplica. Precisa la [decisión 005](005-base-nueva-y-acceso-educador.md) en lo que ve el superadmin.

## Contexto

Revisando el dashboard de Platform, Luis observa que al superadmin no le interesan las comunidades, los educadores ni los talleres: eso es trabajo de cada organización. Y duda de que tenga sentido que el superadmin vea los detalles de todas las organizaciones.

Hasta aquí, la RLS dejaba al superadmin leer y escribir todo. `mis_organizaciones()` le devolvía todas las organizaciones y de esa función cuelga toda la operación: comunidades, educadores, talleres y su feedback, jornadas, temarios, colaboradores, participantes y los perfiles de los niños (nombre, género y edad). Platform no lo mostraba, pero cualquier pantalla o consulta lo habría expuesto. Se analizaron tres opciones (dejarlo así, mínimo privilegio, acceso de soporte temporal); el análisis está en la [tarea 006](../../tasks/006-modelo-de-datos.md).

## Decisión

Luis, 2026-10-18: mínimo privilegio (opción 2).

- **Platform administra organizaciones:** sus altas y bajas, licencias, administradores, invitaciones de administrador y el contenido (catálogo y guías).
- **De la operación de cada organización, el superadmin solo ve cifras** (uso de la licencia, lo que se pierde al darla de baja) **y el nombre y país de sus comunidades.**
- **El detalle de la operación** (educadores, talleres, feedback, jornadas, temarios, colaboradores, participantes) **solo lo ve quien administra la organización o colabora en ella**, también el superadmin: ser superadmin no da acceso.
- **Debajo de Platform**, el selector de contexto solo ofrece las organizaciones que administras y las comunidades donde colaboras.
- **Para dar soporte**, el admin de la organización invita al superadmin como colaborador y luego lo quita.
- **Precisión de Luis, 2026-10-19:** el superadmin puede hacerse administrador (o titular) de una organización desde su detalle en Platform. Queda en su lista de administradores, a la vista de quienes la administran, y se quita de ella para dejarla. Ser superadmin sigue sin dar acceso por sí mismo: hay que unirse, y se nota.

## Cómo se implementa

En las migraciones (aún no aplicadas en la nube, así que se corrigen en el sitio):
- `0005`: `mis_organizaciones()` deja de incluir todas las organizaciones para el superadmin.
  - Conserva sus políticas propias sobre organizaciones, licencias, administradores y catálogo.
  - De `perfiles`, solo ve a los administradores.
  - De `invitaciones`, solo las de administrador.
  - Funciones nuevas, solo para el superadmin:
    - `platform_uso`: cifras por organización;
    - `platform_comunidades`: nombre y país de sus comunidades;
    - `platform_eliminar_organizacion`: la baja entera, con sus comunidades y su operación; la impiden sus storyboards personalizados, que se resuelven antes en Player.
- `0009`: los temarios de una organización ya no los ve el superadmin; los de Nutrinación, sí.
- `0004`: la clave de las asignaciones hacia `comunidad_educadores` pasa a diferida. Borrar una comunidad con talleres fallaba, también desde Admin; desligar a un educador con asignaciones sigue fallando.
- Pruebas pgTAP en `01_rls` (superadmin, funciones `platform_*`, baja) y `04_workshops` (borrar una comunidad con talleres).

En Admin, Platform pide las cifras y las comunidades a esas funciones, y `useAuth` limita el árbol de contexto.

## Consecuencias

- El superadmin ya no puede abrir, editar ni borrar comunidades de una organización ajena, ni gestionar sus educadores o talleres. Si administra una organización o colabora en ella, sí, como cualquiera.
- Dar de baja una organización se lleva todo lo suyo sin pasos previos, salvo los storyboards personalizados.
- El soporte necesita una invitación de la organización. Si se vuelve habitual, se puede valorar un acceso de soporte temporal concedido por cada organización (la opción 3).
- Dentro de esta decisión, el detalle de organización en Platform tiene herramientas de soporte (2026-10-18):
  - un panel «Estado» con cifras para diagnosticar (licencia, cupo, acceso de administradores, educadores sin acceso, talleres próximos, última actividad, perfil público);
  - las cifras de cada comunidad;
  - para cada administrador, su último acceso, un enlace para restablecer la contraseña y quitarlo (`platform_administradores`).
