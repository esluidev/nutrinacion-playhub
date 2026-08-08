# Entornos y ejecución

Las aplicaciones comparten Supabase, pero tienen runtime y despliegue independientes.

## Local

| App | Comando | URL/target |
|---|---|---|
| Admin | `npm --prefix apps/admin run dev` | `http://localhost:3000` |
| Admin demo | `npm --prefix apps/admin run dev:demo` | `http://localhost:3100` |
| Studio | `npm --prefix apps/studio run dev` | `http://localhost:3001` |
| Educators | `flutter run` desde su app | dispositivo/web seleccionado |

Admin y Studio leen `apps/<app>/.env.local`:

```dotenv
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
```

Usar las `.env.example` versionadas como contrato. No versionar valores reales.

## Supabase

- Proyecto compartido para Auth, datos y funciones.
- Desarrollo de esquema/RLS sigue un flujo local-first; branch cloud o proyecto dev es una segunda
  puerta opcional para integraciones gestionadas. Ver `database-access.md`.
- El arnés local aún no está completo: faltan `supabase/config.toml`, seed determinista y pruebas RLS.
- `supabase/migrations/0001_init.sql` reconstruye el esquema y es destructiva; no se usa como
  “reset” accidental de cloud.
- Migraciones incrementales se aplican en orden, con autorización y verificación posterior.
- Edge Functions y webhooks se despliegan por separado de las apps.
- `configuracion.admin_url` y `configuracion.studio_url` conectan correos/runner con URLs reales.

## Build

```bash
npm --prefix apps/admin run build
npm --prefix apps/studio run build
```

El artefacto de una app no incluye a las demás. Educators sigue su pipeline Flutter/PWA propio.

## Reglas operativas

- No asumir que local, preview y cloud comparten datos o migraciones.
- No usar una sesión cloud para tests destructivos sin aprobación y plan de reversión.
- Registrar en la tarea qué entorno, usuario lógico y dataset se usaron.
- Deploy, aplicación de migraciones y cambios de configuración cloud requieren autorización.
