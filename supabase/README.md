# Supabase de PlayHub

Qué se ejecuta en producción, qué es solo para local y con qué usuarios se prueba. El modelo de datos está en [docs/backend.md](../docs/backend.md).

## Qué va a producción

**Solo las 11 migraciones de `migrations/`, en orden:**

| Archivo | Qué crea |
|---|---|
| `0001_catalogos.sql` | Enums, configuración, países, tipos de organización y plantillas de correo |
| `0002_organizaciones.sql` | Organizaciones, licencias, perfiles de Admin, administradores, comunidades, colaboradores e invitaciones |
| `0003_contenido.sql` | Storyboards y guías |
| `0004_operacion.sql` | Educadores, grupos, jornadas, workshops, asignaciones y feedback |
| `0005_rls.sql` | Quién lee y escribe cada tabla |
| `0006_acceso_educadores.sql` | Entrada a Educators con PIN y sus funciones |
| `0007_catalogo_desde_player.sql` | Registrar y publicar storyboards desde Player |
| `0008_storage.sql` | Bucket de audios de narración |
| `0009_hogar.sql` | Temarios, publicaciones y la app del hogar |
| `0010_tareas.sql` | Tarea horaria que finaliza los workshops vencidos (pg_cron) |
| `0011_recuperacion.sql` | Quién genera el enlace para recuperar el acceso a Admin |

Se aplican en un **proyecto nuevo y vacío**:

```bash
supabase link --project-ref <ref-del-proyecto-nuevo>
supabase db push --dry-run   # debe listar 0001 a 0011
supabase db push
```

- **Nunca en el proyecto viejo de la nube.** Ese proyecto ya tiene registradas como aplicadas las versiones 0001 a 0011 de las migraciones antiguas. `db push` daría por hechas las nuevas con el mismo número y la base quedaría con el modelo anterior.
- **No van a producción:**
  - `seed.sql`: datos de prueba;
  - `tests/`: pruebas pgTAP;
  - `database.types.ts`: tipos de las apps;
  - `snippets/`.

### Después de las migraciones

1. **Edge Functions:** `supabase functions deploy canjear-invitacion enlace-recuperacion`. No necesitan secretos. `enviar-invitacion` no se despliega: Admin no envía correos ([decisión 009](../docs/decisions/009-acceso-admin-sin-correo.md)).
2. **Auth:**
   - *URL Configuration → Site URL* = la URL de Admin. La recuperación no necesita *Redirect URLs*: el enlace va directo a `/restablecer` de Admin.
   - *Email → Email OTP Expiration* = `86400`: lo que dura el enlace de recuperación (24 h), como en `config.toml`.
3. **Configuración:** `update configuracion set valor = 'https://<player>' where clave = 'player_url';` («Probar» en Admin). `admin_url` solo la usa `enviar-invitacion`.
4. **El primer superadmin:**
   - Crea el usuario en *Authentication → Users*. Un trigger le crea su perfil.
   - Después: `update perfiles set superadmin = true where email = '<tu correo>';`.
   - El resto de usuarios entra por invitación desde Admin.
5. **pg_cron:** `0010` lo activa. Si el proyecto lo rechaza, actívalo en *Database → Extensions* y vuelve a correr `0010`.

## Las migraciones antiguas

`0001_init.sql` … `0011_rls_operacion_por_comunidad.sql` eran del modelo anterior, que se rehízo entero (tarea 006). Se retiraron el 2026-10-28 y quedan en el historial de Git.

## Base local como en producción (sin seed)

Para el QA de punta a punta se parte de lo mismo que tendrá el proyecto nuevo: solo las migraciones.

```bash
supabase db reset --no-seed
```

Después, los pasos de [Después de las migraciones](#después-de-las-migraciones) en su versión local:

1. **Edge Functions:** `supabase start` ya las sirve. Una función nueva o un cambio de `config.toml` se toman al reiniciar con `supabase stop && supabase start`, que conserva los datos.
2. **Auth:** `config.toml` ya tiene la URL de Admin (`localhost:3000`) y el enlace de recuperación de 24 h.
3. **Configuración**, en el editor SQL de Studio (`http://127.0.0.1:54323`): `update configuracion set valor = 'http://localhost:3001' where clave = 'player_url';`.
4. **El primer superadmin:** en Studio, *Authentication → Add user* con correo, contraseña y *Auto Confirm User*; después, `update perfiles set superadmin = true where email = '<correo>';`.
5. **pg_cron:** ya está activo en local.

Una migración nueva se aplica sin borrar nada con `supabase migration up`.

Las pruebas pgTAP `01`–`05` (`supabase test db`, también dentro de `verify.sh`) cuentan con el seed tal cual: contra esta base fallan, y volver a correrlas exige `supabase db reset`, que borra lo creado a mano. `06_recuperacion` crea sus propios datos y sí corre: `supabase test db supabase/tests/database/06_recuperacion.test.sql`.

## Datos de prueba (solo local)

`supabase db reset` aplica las migraciones y carga `seed.sql`. Cada reset vuelve a dejar estos usuarios.

**Admin** (`localhost:3000`) **y Player** (`localhost:3001`): todos con la contraseña `playhub-local`.

| Correo | Quién es | Qué ve |
|---|---|---|
| `superadmin@playhub.test` | Superadmin | Todo en Admin (Platform incluido). Es el único que gestiona el catálogo en Player |
| `admin@centro.test` | Admin y titular de **Fundación Centro** | Su organización, Comunidad Centro y Comunidad Sur |
| `colaborador@centro.test` | Colaborador de **Comunidad Centro** | Solo esa comunidad |
| `admin@norte.test` | Admin y titular de **Colegio Norte** | Su organización y Comunidad Norte (la organización ajena de las pruebas) |

**Educators** (`localhost:3002`): correo y PIN.

| Correo | PIN | Comunidades |
|---|---|---|
| `maria@ejemplo.test` | `246810` | Comunidad Centro y Comunidad Sur |
| `pedro@ejemplo.test` | `135790` | Comunidad Norte |
| `lucia@ejemplo.test` | Aún no tiene: código de activación `112233` (con él elige su PIN) | Comunidad Centro |

**App del hogar** (solo las funciones `hogar_*`; la app no existe todavía):

| Correo | PIN | Cuenta |
|---|---|---|
| `familia@ejemplo.test` | `240218` | Juan Pérez (Guatemala). Perfiles: Pepito, 6, participante de Comunidad Centro; Ana, 10 |

Código de acceso de Comunidad Centro: `482913`.

Estas credenciales salen de `scripts/generar-seed.py`. Si cambias el generador, actualiza también esta tabla.
