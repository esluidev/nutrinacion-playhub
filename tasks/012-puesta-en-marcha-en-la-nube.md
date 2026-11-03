---
id: 012
estado: backlog
prioridad: alta
creada: 2026-11-03
---
# Puesta en marcha en la nube

## Objetivo

Que Supabase y las tres apps funcionen fuera de local, con todo lo que hoy solo está aplicado aquí. Reúne lo que quedaba de despliegue en las tareas [009](009-runner-dentro-de-educators.md) y [010](010-pendientes-plataforma.md) (F1–F4) y en la [006](006-modelo-de-datos.md).

## Alcance

Cada paso en la nube necesita la autorización de Luis.

- **Decisión (F1):** dónde y cómo se despliega cada app y Supabase. Hoy no hay hosting, `.github/`, Dockerfile ni preset de Nitro. Las tres apps son SPA y Educators no tiene script `generate`.
- **Base:** aplicar las migraciones `0013`–`0016` y desplegar las Edge Functions que falten (`enviar-acceso-educador`; comprobar `canjear-invitacion`, `enlace-recuperacion` y `enviar-invitacion`). Confirmar la versión de Postgres: 17 en local.
- **Player (F2):** `frame-ancestors` de `/play/**` sale de `routeRules` al compilar. Con `nuxt generate` no hay servidor que la mande y tendría que ponerla el hosting. Decidir servidor Node o estático y documentarlo. Al compilar, `NUXT_PUBLIC_RUNNER_HOSTS` con los orígenes reales.
- **Auth (F3):** añadir a `supabase/README.md` los pasos que no viajan con las migraciones: `site_url`, `otp_expiry` y `enable_signup = false` (el proyecto nuevo nace con el alta abierta).
- **A mano (F4):** checklist de puesta en marcha: `configuracion.player_url` y `educators_url`, el primer superadmin, pg_cron (0010) y la clave de Resend.

## Criterios de aceptación

- [ ] Admin, Player y Educators abren en sus dominios contra el proyecto en la nube.
- [ ] La base en la nube está en la última migración y las Edge Functions responden.
- [ ] Educators incrusta el runner de Player en producción (cabecera `frame-ancestors` correcta).
- [ ] `supabase/README.md` tiene la puesta en marcha completa.

## Pendientes y siguiente paso

Empieza por la decisión F1, con Luis.

## Log

- 2026-11-03 15:06 — Creada al cerrar las tareas 001–011 (Luis: «finaliza todo y quita cosas del backlog, ordena las tareas»). Reúne F1–F4 de la 010, el despliegue de la 009 y la versión de Postgres de la 006. Las migraciones `0013`–`0016` están solo en local.
