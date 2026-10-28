# Supabase de PlayHub

Qué se ejecuta en producción, qué es solo para local y con qué usuarios se prueba. El modelo de datos está en [docs/backend.md](../docs/backend.md).

## Qué va a producción

**Solo las 10 migraciones de `migrations/`, en orden:**

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

Se aplican en un **proyecto nuevo y vacío**:

```bash
supabase link --project-ref <ref-del-proyecto-nuevo>
supabase db push --dry-run   # debe listar 0001 a 0010
supabase db push
```

- **Nunca en el proyecto viejo de la nube.** Ese proyecto ya tiene registradas como aplicadas las versiones 0001 a 0011 de las migraciones antiguas. `db push` daría por hechas las nuevas con el mismo número y la base quedaría con el modelo anterior.
- **No van a producción:**
  - `seed.sql`: datos de prueba;
  - `tests/`: pruebas pgTAP;
  - `database.types.ts`: tipos de las apps;
  - `snippets/`.

### Después de las migraciones

1. **Edge Functions:** `supabase functions deploy canjear-invitacion enviar-invitacion` y su único secret, `supabase secrets set RESEND_API_KEY=<clave>`. El remitente es `hello@nutrinacion.com`: el dominio tiene que estar verificado en Resend. **Pendiente:** nada llama todavía a `enviar-invitacion` (espera un webhook al insertar en `invitaciones` que no existe); hasta entonces el enlace se comparte con «Copiar enlace».
2. **Auth → URL Configuration:**
   - *Site URL* = la URL de Admin.
   - En *Redirect URLs*, `https://<admin>/restablecer` (recuperar contraseña). Las invitaciones no lo necesitan: su enlace sale de `admin_url`.
3. **Configuración:** `update configuracion set valor = 'https://<admin>' where clave = 'admin_url';` y lo mismo con `player_url`.
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

1. **Edge Functions:** `supabase start` ya las sirve. El secret va en `supabase/functions/.env` (`RESEND_API_KEY=<clave>`, ignorado por Git) y se toma al reiniciar con `supabase stop && supabase start`.
2. **Auth:** `config.toml` ya apunta a `localhost:3000` (Site URL y `/restablecer`). Los correos de Auth (recuperar contraseña) llegan a `http://127.0.0.1:54324`, salvo que se active `[auth.email.smtp]` con el SMTP de Resend.
3. **Configuración**, en el editor SQL de Studio (`http://127.0.0.1:54323`): `update configuracion set valor = 'http://localhost:3000' where clave = 'admin_url';` y `'http://localhost:3001'` para `player_url`.
4. **El primer superadmin:** en Studio, *Authentication → Add user* con correo, contraseña y *Auto Confirm User*; después, `update perfiles set superadmin = true where email = '<correo>';`.
5. **pg_cron:** ya está activo en local.

Las pruebas pgTAP (`supabase test db`, también dentro de `verify.sh`) cuentan con el seed tal cual: contra esta base fallan. Volver a correrlas exige `supabase db reset`, que borra lo creado a mano.

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

Código de acceso de Comunidad Centro: `482913`. Correos de prueba (invitaciones, recuperar contraseña): `http://127.0.0.1:54324`.

Estas credenciales salen de `scripts/generar-seed.py`. Si cambias el generador, actualiza también esta tabla.
