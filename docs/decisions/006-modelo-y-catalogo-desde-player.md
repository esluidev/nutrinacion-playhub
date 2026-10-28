# Modelo de datos con nombres con contexto y catálogo registrado desde Player

Fecha: 2026-10-15
Estado: aceptada
Sustituye a: no aplica. Precisa la [decisión 005](005-base-nueva-y-acceso-educador.md) en las tablas de la base nueva y la [decisión 003](003-runner-playhub.md) en quién registra el catálogo.
Precisada por la [decisión 007](007-educador-hogar-y-ciclo-del-workshop.md) (2026-10-16): Player también publica (estado, países del catálogo y organización); estados del storyboard como un artículo y enums.

## Contexto

La primera versión de la base nueva añadió tablas que yo propuse y Luis no había aprobado: la taxonomía en tablas (`areas`, `subcategorias`, `ediciones`, `enfoques_salud` y sus uniones), `familias`, `afirmaciones`, `escena_afirmaciones` y `cierres`. Luis las rechazó: la taxonomía y el contenido del juego ya están definidos en los JSON del storyboard. Además, el catálogo se registraba pegando en Admin la metadata que copiaba Player.

La revisión está en la [tarea 006](../../tasks/006-modelo-de-datos.md).

## Decisión

Luis, 2026-10-15:
- **Nombres con contexto, también en las columnas** (por ejemplo, `grupo_asistente`). La tabla principal va en plural; sus hijas llevan delante la principal en singular:
  - `guias` y `guia_escenas`;
  - `workshops`, `workshop_educadores` y `workshop_feedback` («workshop», no «taller», en todas las tablas que lo usan);
  - `educador_grupos`, `educador_grupo_miembros` y `educador_sesiones`;
  - `organizacion_licencias` y `comunidad_colaboradores`.
- **Lo que es del storyboard vive en sus JSON** (narración, consignas, feedback de las escenas, datos), no en la base. **La guía sí va en la base**, con tablas propias.
- **Sin tablas de taxonomía.** `storyboards` copia buena parte de la metadata del JSON como columnas para filtrar y buscar: categoría, subcategoría, edición, idiomas, duración. **Los enfoques de salud (etiquetas) van en el JSON** del storyboard (`healthFocus`), como la categoría.
- **De las tablas que propuse, solo se queda `jornadas`:** una organización crea jornadas en Admin desde el principio; es parte del núcleo.
- **Player registra el catálogo:** crea los registros de cada storyboard en Supabase y comprueba si lo local está al día con la base.

## Cómo se implementa

- `sincronizar_storyboard(p_metadata)` (`supabase/migrations/0007_catalogo_desde_player.sql`), solo para el superadmin:
  - inserta o actualiza el storyboard por su `clave`;
  - deja las escenas de la guía como las del JSON (orden, carpeta y título): añade, reordena y quita;
  - conserva el estado, los países, la organización y lo escrito en la guía.
- En Player, el catálogo y el detalle muestran el estado frente a la base (sin registrar, desactualizado con qué cambió, al día) y el botón «Registrar en la base» o «Actualizar en la base» (`useCatalogoBase`, `utils/storyboardMetadata.ts`).
- Se retiraron «Copiar metadata» en Player y el registro por pegado en Admin, que quedaban sin uso. Desde la decisión 007, la publicación también se hace en Player (`publicar_storyboard`) y Admin/Platform escribe la guía.

## Consecuencias

- La taxonomía tiene listas cerradas en la base (enums, decisión 007) y la subcategoría y los enfoques deben ser de su categoría; un código nuevo pide una migración. Player valida el JSON antes de registrarlo.
- El título viene del JSON: se corrige ahí y se vuelve a sincronizar.
- Si una escena desaparece del JSON, su guía se borra al sincronizar. Renombrar la carpeta de una escena equivale a quitarla y añadir otra.
- `estructura.md` (skill `playhub-storyboard-games`, fuera de este repositorio) debe recoger `healthFocus`.
