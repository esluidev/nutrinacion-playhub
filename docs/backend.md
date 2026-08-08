# Backend compartido — Supabase

Supabase proporciona Auth, PostgreSQL, Row Level Security (RLS), Realtime y Edge Functions para
las tres apps. Este documento es un mapa operativo; la definición ejecutable está en
`supabase/migrations/`.

## Autoridad

1. Migraciones SQL versionadas: esquema, triggers y políticas.
2. Edge Functions: boundaries con `service_role` y flujos de invitación.
3. Composables/repositorios de cada app: contrato de consumo.
4. Este documento: resumen y decisiones, no sustituto del SQL.

El diseño detallado previo a las migraciones 0008–0011 quedó archivado en
[`archive/backend-design-2026-07.md`](archive/backend-design-2026-07.md) para investigación, no
como estado vigente.

Para inspección viva desde un agente, ver
[`operations/database-access.md`](operations/database-access.md). No mantener un volcado Markdown
completo del esquema como fuente paralela.

## Modelo

```text
organizaciones
  ├── organizacion_administradores
  ├── licencias
  └── comunidades                  ← tenancy operativo
       ├── colaboradores
       ├── educadores y grupos
       └── talleres/asignaciones/feedback

storyboards ── storyboard_escenas  ← catálogo compartido
```

- IDs de negocio: `bigint identity`; usuarios de Auth: UUID.
- Textos localizados de contenido: `jsonb` (`{ es, en, ... }`).
- Identidad lógica de storyboard: `clave` UUID; slug solo localiza el build/URL.
- “Ser admin/colaborador” es una relación, no una propiedad global del perfil.

## Auth y superficies

- Admin: Supabase Auth por email/contraseña; onboarding cerrado por invitación.
- Studio gestión: Supabase Auth y acceso restringido a superadmin.
- Studio runner `/play/**`: público; no usa sesión de gestión.
- Educators: auth por correo+código/JWT está diseñado pero no implementado de punta a punta.

Las Edge Functions `canjear-invitacion` y `enviar-invitacion` implementan los boundaries de
invitación. Cualquier cambio debe revisar tanto función como políticas y trigger asociado.

## Migraciones incrementales

| Migración | Responsabilidad |
|---|---|
| `0001` | esquema base y catálogos; es destructiva si se ejecuta completa |
| `0002`–`0006` | RLS de comunidades/invitaciones y titulares |
| `0007` | cupo de comunidades por licencia |
| `0008` | comunidad y organización coherentes en invitaciones |
| `0009` | catálogo de storyboards: escribe superadmin, lee authenticated |
| `0010` | Realtime de invitaciones |
| `0011` | aislamiento de operación por comunidad |

La presencia de un archivo no demuestra que esté aplicado en cloud. La tarea/Actividad debe
registrar la última verificación real. Antes de una nueva migración:

1. inspeccionar políticas/triggers vigentes;
2. probar en Supabase local o PostgreSQL efímero con matriz de roles;
3. documentar rollback o corrección incremental;
4. pedir autorización antes de aplicar en cloud;
5. verificar después con consultas read-only.

## Seguridad

- La anon key es pública por diseño; RLS protege los datos.
- Un filtro por `comunidad_id` en un composable no es aislamiento.
- `service_role` nunca se entrega a aplicaciones cliente ni a escenarios de navegador.
- Los triggers 0007/0008 aplican reglas también fuera de la UI.
- `0011` usa una función `SECURITY DEFINER` para cortar recursión RLS; cambios allí requieren
  pruebas explícitas de superadmin, admin, colaborador y ajeno.
- Evitar incluir tokens, correos sensibles o cadenas de conexión en logs/artefactos QA.

## Estado conocido y huecos

- Admin opera contra Supabase y Platform administra storyboards.
- Studio autentica y consulta el catálogo, pero no escribe.
- El estado cloud de 0008/0009 fue verificado en el trabajo de la tarea 030.
- 0010/0011 existen en el repo; confirmar aplicación cloud antes de depender de ellas.
- Educators y su auth/bridge real siguen pendientes.
- El arnés aún no levanta Supabase local ni ejecuta pruebas automatizadas de migraciones/RLS.
