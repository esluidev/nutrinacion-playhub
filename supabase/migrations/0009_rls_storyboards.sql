-- 0009 — El catálogo de contenido lo escribe SOLO el superadmin
-- ─────────────────────────────────────────────────────────────────────────────
-- Hoy `storyboards` y `storyboard_escenas` están en `authenticated using(true)`: cualquier
-- usuario autenticado —incluido un colaborador de una comunidad cliente— puede reescribir el
-- catálogo de contenido y las guías pedagógicas. Con la administración mudándose a
-- admin/Platform (tarea 030), la escritura es de la consola del operador y de nadie más.
--
-- Lectura: sigue abierta a cualquier autenticado. El filtrado real de qué storyboard ve cada
-- comunidad (PUBLICADO, estándar o personalizado de su org, país) lo hace la app en
-- `apps/admin/app/composables/useStoryboards.ts`; acá no se duplica.
--
-- Mismo patrón que 0002/0005/0006: subconsultas inline, sin funciones `rls_*()`. No recursa:
-- `perfiles` sigue en `authenticated using(true)`.
--
-- Cómo se combinan las dos políticas de cada tabla (son PERMISSIVE, se suman con OR):
--   SELECT → la de lectura da `true` ⇒ cualquier autenticado lee.
--   INSERT → solo cuenta el `with check` de la de escritura ⇒ superadmin.
--   UPDATE/DELETE → la de lectura no aplica (es FOR SELECT) ⇒ solo el `using` de escritura.

-- ── storyboards ──────────────────────────────────────────────────────────────
drop policy if exists storyboards_authenticated on storyboards;

create policy storyboards_lectura on storyboards
  for select to authenticated
  using (true);

create policy storyboards_escritura on storyboards
  for all to authenticated
  using (
    exists (select 1 from perfiles p where p.usuario_id = auth.uid() and p.superadmin)
  )
  with check (
    exists (select 1 from perfiles p where p.usuario_id = auth.uid() and p.superadmin)
  );

-- ── storyboard_escenas ───────────────────────────────────────────────────────
drop policy if exists storyboard_escenas_authenticated on storyboard_escenas;

create policy storyboard_escenas_lectura on storyboard_escenas
  for select to authenticated
  using (true);

create policy storyboard_escenas_escritura on storyboard_escenas
  for all to authenticated
  using (
    exists (select 1 from perfiles p where p.usuario_id = auth.uid() and p.superadmin)
  )
  with check (
    exists (select 1 from perfiles p where p.usuario_id = auth.uid() and p.superadmin)
  );
