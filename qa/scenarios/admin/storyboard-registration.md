---
id: qa-admin-storyboard-registration
app: shared
risk: reversible
status: ready
---

# Registro, sincronización y publicación de un storyboard

## Objetivo

Validar el circuito Studio build → metadata → Admin/Platform → Supabase → catálogo de comunidad y
comprobar que no se pierden guías al sincronizar escenas existentes.

## Precondiciones

- `./scripts/verify.sh` verde.
- Admin y Studio apuntan al mismo proyecto Supabase.
- Sesión de superadmin iniciada en ambas apps.
- Storyboard de QA identificado por `clave` y metadata válida.
- Organización/comunidad de QA si se probará personalizado o creación de taller.
- Autorización para escribir/publicar en cloud; sin ella ejecutar solo lectura/preview.

## Snapshot antes

```sql
select id, clave, estado, numero_escenas, idiomas, organizacion_id
from storyboards
where clave = '<storyboard-clave>';

select id, storyboard_id, orden, folder
from storyboard_escenas
where storyboard_id = <storyboard-id>
order by orden;
```

Registrar también si existe un taller QA asociado. No consultar contenido completo de guías salvo
que la prueba lo necesite.

## Pasos en navegador

1. En Studio, abrir el detalle build y confirmar badge remoto.
2. Copiar metadata y verificar clave, tipo, categoría, audiencia, idiomas y cantidad de escenas.
3. En Admin → Platform → Storyboards:
   - si no existe, validar metadata y registrar en `BORRADOR`;
   - si existe, abrir edición, validar la misma clave y revisar el diff antes de sincronizar.
4. Abrir detalle y confirmar datos editoriales y lista de escenas.
5. Editar una sección de guía de una escena QA, guardar y recargar.
6. Usar “Probar escena”; debe abrir `/play/<tipo>/<slug>` con idioma/escena correctos.
7. Si está autorizado, publicar y abrir el catálogo de una comunidad elegible.
8. Si está autorizado, iniciar el wizard de taller y confirmar que el storyboard es seleccionable.

## Resultado esperado

- Studio y Supabase concuerdan en identidad/estructura del build.
- Admin no permite registrar metadata inválida o clave duplicada.
- La sincronización conserva guía de escenas casadas por `folder`.
- Escenas nuevas nacen sin guía y escenas retiradas solo se eliminan tras confirmación del diff.
- El storyboard publicado aparece solo para comunidades permitidas por propiedad/país/licencia.
- La URL de “Probar” usa `configuracion.studio_url` y el runner sigue público.

## Snapshot después

Repetir las consultas iniciales y, si se creó taller:

```sql
select id, comunidad_id, storyboard_id, estado, fecha
from talleres
where id = <taller-qa-id>;
```

## Invariantes

- Una fila de `storyboards` por `clave`.
- `numero_escenas` coincide con el conteo y los órdenes son únicos.
- Tipo/categoría/audiencia resuelven los códigos correctos.
- Escritura solo por superadmin; lectura no expone datos de otras comunidades fuera de RLS.
- La publicación no altera metadata build-owned.

## Limpieza o reversión

- Preferir volver el registro QA a `BORRADOR` antes que eliminar si tiene relaciones.
- Restaurar la sección de guía modificada si se usó contenido real.
- Eliminar el taller QA solo con autorización y después de comprobar sus relaciones.

## Evidencia

- Run ID en `qa/artifacts/`.
- Capturas: badge Studio, metadata validada, detalle/guía, catálogo de comunidad.
- Snapshots read-only antes/después.
- Resultado resumido en la tarea activa, sin secretos ni TestDox completo.
