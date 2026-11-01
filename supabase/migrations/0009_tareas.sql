-- 0009: tareas programadas (pg_cron).
--
-- Cada hora pasa a FINALIZADO lo publicado cuya fecha ya pasó (finalizar_workshops_vencidos, 0004).
-- Lo que sus educadores terminan con feedback ya se finaliza al instante (trigger de 0004); esta
-- tarea cubre el resto. En el proyecto de la nube pg_cron se activa con esta misma migración; si el
-- plan no lo permitiera, la tarea se agenda desde el panel de Supabase (Integrations → Cron).
create extension if not exists pg_cron;

-- cron.schedule con nombre reemplaza la tarea si ya existe: la migración se puede volver a correr.
select cron.schedule('finalizar-workshops', '0 * * * *', 'select public.finalizar_workshops_vencidos()');
