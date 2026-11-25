---
id: 022
estado: revision
prioridad: alta
creada: 2026-11-24
---
# El catálogo de la app del hogar: publicar para casa y unidades de estudio

## Objetivo

Que Nutrinación decida qué storyboards salen en la app del hogar y pueda agruparlos en unidades de estudio («Ganando músculos», «Reduciendo la obesidad»), para que la app los lea sin cuenta. Lo pidió Luis el 2026-11-24 («implementa lo que hemos estado hablando sobre el player y los cambios para publicar en la app del hogar»), tras acordar el diseño en la conversación de la [tarea 021](021-programas-y-reportes.md). La app del hogar todavía no existe: esto prepara su catálogo.

## Alcance

Acordado con Luis el 2026-11-24:

- **Solo Nutrinación publica para el hogar.** Las organizaciones y los storyboards personalizados no entran.
- **Una marca sí/no en el storyboard, sin países propios.** El país lo da el perfil del niño (se elige al crearlo o al usar la app) y se cruza con los países que el storyboard ya tiene (`paises_disponibles`); la edad del perfil, con su edición. La marca hace falta porque un storyboard puede estar listo para los talleres y no para casa (en casa la narración la ponen los audios). Solo cuenta si el storyboard está publicado; un personalizado nunca la lleva.
- **Storyboards sueltos sí.** No hace falta una unidad para salir en el hogar (Luis rechazó lo contrario).
- **Unidades de estudio opcionales, encima:** título y descripción por idioma, borrador o publicada, orden en la app, y sus storyboards en orden. Mezclan categorías; un storyboard puede estar en varias. Solo admiten storyboards publicados para el hogar.
- **La app sin cuenta lee una sola función:** el catálogo de un país (las unidades publicadas con sus storyboards y todos los del hogar disponibles en ese país).
- **Todo se gestiona en Player**, por el superadmin (decisión 013, sin cambios): la casilla «También en la app del hogar» en «Publicación», un filtro «Hogar» en el catálogo y una sección «App del hogar» en la barra lateral con las unidades. Luis propuso Admin y aceptó Player: un solo sitio para decidir a dónde va un storyboard, Player conoce el contenido, y la decisión 013 no cambia. Admin (Platform) solo muestra si está en el hogar.
- Fuera: la app del hogar, sus perfiles y el filtro por edad (los hace la app con el perfil, en el teléfono).

## Criterios de aceptación

- [x] En Player, el superadmin marca un storyboard publicado como «También en la app del hogar»; la base no deja marcar uno personalizado ni uno sin publicar, y al archivarlo sale del hogar.
- [x] El catálogo de Player filtra por «Hogar».
- [x] En «App del hogar» se crea una unidad con título y descripción por idioma, se le agregan storyboards del hogar en orden y se publica; la base no deja agregar uno que no esté en el hogar.
- [x] Sin cuenta, el catálogo de un país devuelve las unidades publicadas con sus storyboards y los storyboards sueltos de ese país, y nada más (pgTAP).
- [x] Solo el superadmin escribe la marca y las unidades (pgTAP).

## Plan

### Leer

`supabase/migrations/0003`, `0005`, `0007`; `apps/player/app/composables/useCatalogoBase.ts`, `utils/catalogoResumen.ts`, `pages/storyboards/`; `docs/backend.md`, `docs/glossary.md`; decisión 013.

### Tocar

- Base: `storyboards.publicado_hogar`, `unidades_estudio`, `unidad_estudio_storyboards`, sus reglas y RLS, `publicar_storyboard_hogar` y `hogar_catalogo`; pgTAP.
- Player: la casilla, el filtro, la sección «App del hogar» (lista y editor de unidades), la barra lateral y sus pruebas.
- Admin: «En el hogar» en el detalle del storyboard en Platform.
- Docs: `backend.md`, `glossary.md`, `apps/player/AGENTS.md`.

### Verificar

`./scripts/verify.sh` (typecheck, Vitest y build de las tres apps, check-ui, check-context y pgTAP); la gestión de Player en el navegador si hay sesión de superadmin.

## Pasos

- [x] Base: marca, unidades, catálogo y pgTAP.
- [x] Player: casilla del hogar y filtro del catálogo.
- [x] Player: «App del hogar» con las unidades.
- [x] Admin: «En el hogar» en Platform.
- [x] Documentación y verificación.

## Pendientes y siguiente paso

Implementado y verificado. Falta que Luis lo revise en Player con su cuenta de superadmin. Cuando exista la app del hogar, leerá `hogar_catalogo(país)` y filtrará por la edad del perfil.

## Log

- 2026-11-24 · Creada a pedido de Luis, con el diseño que acordamos en la conversación (registrado en Alcance).
- 2026-11-24 · Implementado. **Base** (migraciones editadas en su sitio): `storyboards.publicado_hogar` con su check (nunca un personalizado) y la regla en el trigger de publicación de 0003 (solo publicado y estándar; si se archiva, se despublica o pasa a personalizado, sale del hogar); `unidades_estudio` y `unidad_estudio_storyboards` (0003) con su trigger (solo entran storyboards del hogar) y su RLS de superadmin (0005); `publicar_storyboard_hogar`, `guardar_unidad_estudio` y `hogar_catalogo(país)` para anon (0007). Prueba `08_catalogo_hogar` (24). Aplicado a la base local sin reset y `database.types.ts` regenerado. **Player:** la casilla «También en la app del hogar» en Publicación (solo con un publicado estándar; se guarda después del resto), el filtro y la columna «Hogar» del catálogo (`pasaFiltroHogar`, con prueba), y la sección «App del hogar» en la barra lateral: las unidades en el orden de la app (subir y bajar) y los storyboards del hogar con sus unidades o «Suelto»; el editor de una unidad (`/hogar/unidades/[id]`, `nueva` la crea) con título y descripción por idioma, sus storyboards en orden («Agregar Storyboards» con búsqueda, subir, bajar y quitar), «Publicada» y eliminar; `useUnidadesEstudio` y `utils/unidadesEstudio.ts` (5 pruebas). **Admin:** «App del hogar: sí/no» en el detalle del storyboard en Platform. Docs: `backend.md`, `glossary.md` y los AGENTS de Player y Admin. Verificación: `./scripts/verify.sh` aprobado completo (pgTAP 406; Vitest: Player 247, Admin 95, Educators 41; check-ui y check-context). Navegador (Player 3001, con una cuenta superadmin de prueba creada y borrada después): en «El huevo» se marca la casilla y se guarda (en la base, `publicado_hogar`); «App del hogar» lo lista como suelto; se crea «Ganando músculos» con él, publicada, y `hogar_catalogo('GT')` sin cuenta devuelve la unidad y el storyboard. Después se borraron la unidad, la marca y la cuenta de prueba.
