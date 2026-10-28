-- 0008: archivos.
--
-- `narracion`: las voces de los storyboards (decisión 005). El runner de Player las carga por
-- URL pública: NUXT_PUBLIC_NARRATION_URL + la ruta `file` de cada línea del audio.manifest.json
-- (con un hash del contenido en el nombre, así nunca se sirve una voz vieja). Nadie las lee de la
-- base. Lectura pública; solo el superadmin (o el proceso de publicación con service role) sube,
-- cambia o borra.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('narracion', 'narracion', true, 5242880, array['audio/mpeg', 'audio/mp4', 'audio/aac'])
on conflict (id) do nothing;

create policy narracion_superadmin on storage.objects for all to authenticated
  using (bucket_id = 'narracion' and (select public.es_superadmin()))
  with check (bucket_id = 'narracion' and (select public.es_superadmin()));
