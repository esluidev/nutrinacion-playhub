# Base de datos nueva y acceso del educador sin Supabase Auth

Fecha: 2026-10-15
Estado: aceptada (lo que ve el superadmin lo precisa la [decisión 008](008-superadmin-administra-organizaciones.md))
Sustituye a: no aplica. Precisa la [decisión 002](002-superficies-y-guia.md) en cómo entra el educador.
Precisada por la [decisión 006](006-modelo-y-catalogo-desde-player.md) (2026-10-15): las tablas y sus nombres.
Precisada por la [decisión 007](007-educador-hogar-y-ciclo-del-workshop.md) (2026-10-16): el educador es de la organización y entra con un PIN que elige, con el código de activación de Admin.
Actualizada el 2026-11-02 (Luis, migración 0013): el código de activación pasa a ser un enlace de acceso, como las invitaciones. Llega por correo, se puede copiar y con él solo se elige el PIN, la primera vez o cuando se olvidó.

## Contexto

La base anterior (`0001`–`0011`) era de pruebas y no seguía la constitución:
- faltaban familias, afirmaciones, enfoques de salud, jornadas, idioma del taller, la ejecución real y la guía completa;
- `feedback_taller` guardaba puntos;
- dejaba tablas abiertas a cualquier sesión, al punto de permitir marcarse superadmin.

El análisis está en la [tarea 006](../../tasks/006-modelo-de-datos.md).

## Decisión

Luis, 2026-10-15:
- **Proyecto de Supabase nuevo y base nueva.** La base actual es de prueba; no hay datos que conservar y se pueden hacer los ajustes necesarios.
  - Corrección (2026-10-15): las tablas nuevas que añadí (taxonomía en tablas, familias, afirmaciones, enfoques, jornadas) eran mi propuesta, no una decisión de Luis. Luis las revisó: solo se queda `jornadas` ([decisión 006](006-modelo-y-catalogo-desde-player.md)).
- **El educador entra con el correo que se le da de alta en Admin para una comunidad y un código de acceso que Admin genera.**
  - El objetivo es no extender Supabase Auth ni tener que verificar roles y permisos por todos lados.
  - Supabase Auth queda solo para los usuarios de Admin.
- **Las voces no van a la base.** Una variable global con la URL del bucket y, en el `audio.manifest.json` de cada storyboard, el resto de la ruta de cada voz.
- **La gestión de Player pide Supabase Auth y solo deja entrar al superadmin.** El runner (`/play/**`) sigue público. (Luis, 2026-10-15; precisa la [decisión 004](004-runner-incrustado.md), que dejaba todo Player sin sesión.)

## Cómo se implementa

**El acceso del educador** está en `supabase/migrations/0006_acceso_educadores.sql`:
- El código es de 6 dígitos y se guarda con bcrypt. Admin lo genera con `educador_generar_codigo` y lo ve una sola vez. Un código nuevo cierra las sesiones abiertas.
- `educador_entrar(correo, código)` devuelve un token de sesión de 30 días, guardado con sha256. Tras 5 fallos con un mismo correo, ese correo queda bloqueado 15 minutos.
- Educators usa la anon key y un puñado de funciones que reciben el token: `educador_sesion`, `educador_workshops`, `educador_guia`, `educador_iniciar`, `educador_terminar`, `educador_guardar_feedback` y `educador_salir`.
  - Cada una comprueba el token y devuelve solo lo del educador.
  - **No hay políticas por tabla para educadores:** Educators no lee tablas.
- `educador_guia` devuelve la guía con las claves del contrato del runner ([docs/runner.md](../runner.md)), en el idioma del workshop. Educators se la pasa al runner tal cual.

**Usuarios de Admin.** El trigger de alta toma el rol y la organización de `app_metadata`, que solo escribe el servidor, nunca de `user_metadata`. El registro abierto queda desactivado.

## Consecuencias

- Las funciones del educador son `SECURITY DEFINER`: se saltan la RLS y cada una debe validar el token y el workshop. Las pruebas pgTAP de `supabase/tests/database/02_acceso_educadores.test.sql` lo cubren.
- El token viaja como argumento de la función (en el cuerpo de la petición, nunca en la URL) y Educators lo guarda en el dispositivo.
- Un correo puede estar en varias comunidades. El código es único entre los educadores con el mismo correo, así que correo y código identifican a uno.
- Admin y la Edge Function `canjear-invitacion` deben adaptarse al esquema nuevo (tarea 006, entrega 2). La función ya pasa el rol en `app_metadata`.
- En el proyecto nuevo de la nube hay que repetir la configuración de `supabase/config.toml` (registro cerrado y URL de Admin) y el webhook de `enviar-invitacion`. *El webhook lo sustituye la [decisión 009](009-acceso-admin-sin-correo.md): Admin no envía correos.*
