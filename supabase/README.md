# Supabase de PlayHub

Qué se ejecuta en producción, qué es solo para local y con qué usuarios se prueba. El modelo de datos está en [docs/backend.md](../docs/backend.md).

## Qué va a producción

**Solo las 12 migraciones de `migrations/`, en orden:**

| Archivo | Qué crea |
|---|---|
| `0001_catalogos.sql` | Enums, configuración, países, tipos de organización y plantillas de correo |
| `0002_organizaciones.sql` | Organizaciones (con sus países), licencias, perfiles de Admin, administradores, colaboradores e invitaciones |
| `0003_contenido.sql` | Storyboards, guías y `disponible_para_organizacion` |
| `0004_operacion.sql` | Educadores, grupos, jornadas (lugar y días; se borran al quedarse sin talleres), workshops, asignaciones y feedback |
| `0005_rls.sql` | Quién lee y escribe cada tabla; las funciones `platform_*` |
| `0006_acceso_educadores.sql` | Entrada a Educators con PIN y sus funciones |
| `0007_catalogo_desde_player.sql` | Registrar y publicar storyboards desde Player |
| `0008_storage.sql` | Bucket de audios de narración |
| `0009_tareas.sql` | Tarea horaria que finaliza los workshops vencidos (pg_cron) |
| `0010_recuperacion.sql` | Quién genera el enlace para recuperar el acceso a Admin |
| `0011_correo_invitaciones.sql` | El estado del correo de cada invitación (cuándo salió o por qué no) |
| `0012_baja_de_educadores.sql` | La baja de un educador es lógica y de los administradores: sin borrado por la API; la baja lo saca de sus grupos |

Se aplican en un **proyecto nuevo y vacío**:

```bash
supabase link --project-ref <ref-del-proyecto-nuevo>
supabase db push --dry-run   # debe listar 0001 a 0012
supabase db push
```

- **Nunca en el proyecto viejo de la nube.** Ese proyecto ya tiene registradas como aplicadas las versiones 0001 a 0011 de las migraciones antiguas. `db push` daría por hechas las nuevas con el mismo número y la base quedaría con el modelo anterior.
- **No van a producción:**
  - `seed.sql`: datos de prueba;
  - `tests/`: pruebas pgTAP;
  - `database.types.ts`: tipos de las apps;
  - `snippets/`.

### Después de las migraciones

1. **Edge Functions:** `supabase functions deploy canjear-invitacion enlace-recuperacion enviar-invitacion`.
   - `enviar-invitacion` manda las invitaciones por correo ([decisión 012](../docs/decisions/012-invitaciones-por-correo.md)) y necesita `supabase secrets set RESEND_API_KEY=<key>`. El remitente es `hello@nutrinacion.com`: verifica `nutrinacion.com` en Resend o fija otro con `supabase secrets set RESEND_FROM=…`.
   - Las otras dos no necesitan secretos.
2. **Auth:**
   - *URL Configuration → Site URL* = la URL de Admin. La recuperación no necesita *Redirect URLs*: el enlace va directo a `/restablecer` de Admin.
   - *Email → Email OTP Expiration* = `86400`: lo que dura el enlace de recuperación (24 h), como en `config.toml`.
3. **Configuración:** `update configuracion set valor = 'https://<player>' where clave = 'player_url';` («Probar» en Admin). `update configuracion set valor = 'https://<admin>' where clave = 'admin_url';`: el enlace de los correos de invitación (si está vacía, `enviar-invitacion` usa el origen desde el que se creó la invitación).
4. **El primer superadmin:**
   - Crea el usuario en *Authentication → Users*. Un trigger le crea su perfil.
   - Después: `update perfiles set superadmin = true where email = '<tu correo>';`.
   - El resto de usuarios entra por invitación desde Admin.
5. **pg_cron:** `0009` lo activa. Si el proyecto lo rechaza, actívalo en *Database → Extensions* y vuelve a correr `0009`.

## Las migraciones antiguas

`0001_init.sql` … `0011_rls_operacion_por_comunidad.sql` eran del modelo anterior, que se rehízo entero (tarea 006), y `0001`–`0012` del 2026-10-16 al 2026-10-28 tenían comunidades y el bloque del hogar, que salieron con la [decisión 011](../docs/decisions/011-organizacion-como-unidad-de-operacion.md) (tarea 011). Todas quedan en el historial de Git.

## Base local como en producción (sin seed)

Para el QA de punta a punta se parte de lo mismo que tendrá el proyecto nuevo: solo las migraciones.

```bash
supabase db reset --no-seed
```

Después, los pasos de [Después de las migraciones](#después-de-las-migraciones) en su versión local:

1. **Edge Functions:** `supabase start` ya las sirve. Una función nueva o un cambio de `config.toml` se toman al reiniciar con `supabase stop && supabase start`, que conserva los datos.
   - **Correo de las invitaciones:** pega tu key de Resend en `supabase/.env` (`RESEND_API_KEY=`, fuera de Git; plantilla en `supabase/.env.example`) y reinicia. Sin dominio verificado, pon también `RESEND_FROM=onboarding@resend.dev`: Resend solo enviará al correo de tu cuenta. Sin key, la invitación se crea igual y Admin avisa de que el correo no salió; el enlace se copia.
2. **Auth:** `config.toml` ya tiene la URL de Admin (`localhost:3000`) y el enlace de recuperación de 24 h.
3. **Configuración**, en el editor SQL de Studio (`http://127.0.0.1:54323`): `update configuracion set valor = 'http://localhost:3001' where clave = 'player_url';`.
4. **El primer superadmin:** en Studio, *Authentication → Add user* con correo, contraseña y *Auto Confirm User*; después, `update perfiles set superadmin = true where email = '<correo>';`.
5. **pg_cron:** ya está activo en local.

Desde ahí, todo se hace en Admin con el superadmin: la organización (nombre y los países donde opera), su licencia, la invitación al titular (enlace copiado) y, ya como titular, colaboradores, educadores, grupos, jornadas y talleres. El catálogo se registra y publica desde Player.

Una migración nueva se aplica sin borrar nada con `supabase migration up`.

Las pruebas pgTAP (`supabase test db`, también dentro de `verify.sh`) crean sus propios datos y se deshacen al terminar: corren igual contra esta base sin seed que contra la del seed, y no borran lo creado a mano.

## Datos de prueba (solo local)

`supabase db reset` aplica las migraciones y carga `seed.sql`. Cada reset vuelve a dejar estos usuarios.

**Admin** (`localhost:3000`) **y Player** (`localhost:3001`): todos con la contraseña `playhub-local`.

| Correo | Quién es | Qué ve |
|---|---|---|
| `superadmin@playhub.test` | Superadmin | Todo en Admin (Platform incluido). Es el único que gestiona el catálogo en Player |
| `admin@centro.test` | Admin y titular de **Fundación Centro** (Guatemala y El Salvador) | Su organización entera: licencia, administradores, colaboradores, educadores, grupo, jornada y talleres |
| `colaborador@centro.test` | Colaborador de **Fundación Centro** | La operación de la organización (educadores, grupos, jornada, talleres, planificador); no gestiona licencia, administradores ni colaboradores |
| `admin@norte.test` | Admin y titular de **Colegio Norte** (Guatemala; la organización ajena de las pruebas) | Su organización y su único taller |

**Educators** (`localhost:3002`): correo y PIN.

| Correo | PIN | Organización |
|---|---|---|
| `maria@ejemplo.test` | `246810` | Fundación Centro: 12 talleres (publicados, finalizados, uno cancelado y uno del grupo), la mayoría dentro de la jornada «Semana de la nutrición» |
| `pedro@ejemplo.test` | `135790` | Colegio Norte: un taller hoy |
| `lucia@ejemplo.test` | Aún no tiene: código de activación `112233` (con él elige su PIN) | Fundación Centro: el taller del grupo «Equipo de la mañana» |

El catálogo del seed: «El huevo» publicado en Guatemala (el único con JSON en el build de Player) y «La soda» solo registrada.

Estas credenciales salen de `scripts/generar-seed.py`. Si cambias el generador, actualiza también esta tabla.
