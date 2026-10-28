# Nutrinación PlayHub — aplicaciones

Monorepo con tres aplicaciones web desplegables por separado (Admin, Player y Educators) que comparten un backend Supabase y un UI Kit (`packages/ui`). Vive dentro del proyecto PlayHub, cuya raíz (`../`) tiene la dirección de producto, contenido y diseño.

| App | Ruta | Qué hace | Estado |
|---|---|---|---|
| Admin | [`apps/admin`](apps/admin/AGENTS.md) | Operación de organizaciones y comunidades; consola Platform | Activa, conectada a Supabase |
| Player | [`apps/player`](apps/player/AGENTS.md) | Construye y sirve los juegos; runner público `/play/**` | Activa; runner sobre el player de referencia |
| Educators | [`apps/educators`](apps/educators/AGENTS.md) | El educador prepara, abre y cierra sus talleres; móviles y tabletas | Web, con datos de prueba |

El `AGENTS.md` de cada app explica qué es, sus reglas y cómo arrancarla y verificarla.

## Estructura

```text
apps/        Aplicaciones.
packages/ui  UI Kit compartido (@playhub/ui): tokens, Ui*, iconos y laboratorio.
supabase/    Migraciones y Edge Functions compartidas.
docs/        Cómo funciona el sistema: arquitectura, glosario y backend.
tasks/       Qué se está haciendo: alcance, plan y evidencia de cada cambio.
skills/      Índice de las skills disponibles.
.harness/    Cómo se trabaja con agentes (eslui-harness): contrato, contexto del proyecto y procedimientos.
scripts/     verify.sh, check-context.mjs y harness-check.sh.
AGENTS.md    Entrada para agentes; CLAUDE.md es un symlink a él.
```

## Empezar

1. Contexto vigente, reglas y riesgos: [`.harness/project.md`](.harness/project.md).
2. Mapa de la documentación: [`docs/README.md`](docs/README.md).
3. El `AGENTS.md` de la app que vas a tocar y la tarea en [`tasks/`](tasks/README.md).

Instala todo desde la raíz con `npm install` (npm workspaces). Cada app usa su `.env.local` a partir de `.env.example`; los valores reales no se versionan. La anon key de Supabase es pública por diseño: la seguridad depende de RLS.

### Compartir en desarrollo por Tailscale

Con las apps y Supabase local en marcha, cualquier equipo de tu tailnet las abre con el nombre de este equipo: `http://<equipo>.<tailnet>.ts.net:3000` (Admin), `:3001` (Player) y `:3002` (Educators). No hace falta tocar los `.env.local`:
- la capa `@playhub/ui` deja entrar a Vite los nombres `*.ts.net` (si no, responde 403);
- `urlEnEsteEquipo` (`packages/ui/app/utils/equipo-local.ts`) cambia `localhost` y `127.0.0.1` de Supabase y de Player por el nombre con que se abrió la app;
- Player acepta que lo incrusten Admin y Educators abiertos por la tailnet;
- Auth local admite volver a `*.ts.net:3000`.

Es http: los botones de copiar usan un método alternativo, porque el portapapeles moderno exige HTTPS. Para HTTPS, `tailscale serve`. Si cambias la capa o `supabase/config.toml`, reinicia las apps o Supabase.

## Verificación

```bash
./scripts/verify.sh
```

Comprueba el contexto y ejecuta typecheck, Vitest y build de Admin, Player y Educators (y con ellas, el UI Kit). Cobertura y huecos: [`.harness/project.md`](.harness/project.md).

## Despliegue

Cada app se publica por separado; no se crean ramas permanentes por aplicación. Con workspaces, la plataforma instala desde la raíz del monorepo. Una app nueva extiende `@playhub/ui` e incorpora su `AGENTS.md` (con `CLAUDE.md`), `.env.example`, verificación y despliegue propios.
