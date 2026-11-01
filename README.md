# Nutrinación PlayHub — aplicaciones

Monorepo con tres aplicaciones web desplegables por separado (Admin, Player y Educators) que comparten un backend Supabase y un UI Kit (`packages/ui`). Vive dentro del proyecto PlayHub, cuya raíz (`../`) tiene la dirección de producto, contenido y diseño.

| App | Ruta | Qué hace | Estado |
|---|---|---|---|
| Admin | [`apps/admin`](apps/admin/AGENTS.md) | Operación de la organización (educadores, colaboradores, talleres, jornadas, planificador); consola Platform | Activa, conectada a Supabase |
| Player | [`apps/player`](apps/player/AGENTS.md) | Construye y sirve los juegos; runner público `/play/**` | Activa; runner sobre el player de referencia |
| Educators | [`apps/educators`](apps/educators/AGENTS.md) | El educador prepara, abre y cierra sus talleres; móviles y tabletas | Activa, conectada a Supabase |

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

Arranca cada app con `npm run dev`, sin `--host` ni `--port`. Con las apps y Supabase local en marcha, las abres en este equipo con `localhost` y desde cualquier equipo de tu tailnet con el nombre o la IP de este (`tailscale status`): `http://<equipo>.<tailnet>.ts.net:3000` o `http://100.x.y.z:3000` (Admin), `:3001` (Player) y `:3002` (Educators). No hace falta tocar los `.env.local`:
- la capa `@playhub/ui` hace que las apps escuchen en todas las interfaces (`0.0.0.0`); cada app fija su puerto en su `nuxt.config.ts`;
- Vite acepta las IP y, por la capa, los nombres `*.ts.net`; a cualquier otro nombre, como el corto sin `.ts.net`, le responde 403;
- `urlEnEsteEquipo` (`packages/ui/app/utils/equipo-local.ts`) cambia `localhost` y `127.0.0.1` de Supabase y de Player por el nombre o la IP con que se abrió la app: la API va al mismo equipo, en `:54321`;
- Player acepta que lo incrusten Admin y Educators abiertos con un nombre `*.ts.net` o con una IP de este equipo (las lee al arrancar: si cambia la IP, reinícialo);
- Auth local admite volver a `*.ts.net:3000`.

Es http: los botones de copiar usan un método alternativo, porque el portapapeles moderno exige HTTPS. Escuchar en todas las interfaces también abre las apps a la red local (la Wi-Fi), no solo a la tailnet. Si cambias la capa o `supabase/config.toml`, reinicia las apps o Supabase.

### Compartir con alguien sin Tailscale (Funnel)

La tailnet solo llega a tus equipos. Para que otra persona pruebe las apps con un enlace, sin instalar nada, se publican con [Tailscale Funnel](https://tailscale.com/kb/1223/funnel):

```bash
./scripts/funnel.sh        # con las apps y Supabase local en marcha
./scripts/funnel.sh off    # al terminar
```

Funnel solo sirve HTTPS y solo en los puertos 443, 8443 y 10000. El script pone una app en cada uno y Supabase local en `/supabase` de cada app: `https://<equipo>.<tailnet>.ts.net` (Admin), `:8443` (Player) y `:10000` (Educators). `urlEnEsteEquipo` sigue el mismo reparto: en una página https, Player pasa a su puerto de Funnel y Supabase a `/supabase` del mismo origen, Realtime incluido. Los enlaces de invitación y de recuperación salen con esa dirección.

Mientras está publicado, cualquiera con el enlace llega a las apps y a la API de Supabase local, cuyas claves son las de ejemplo de Supabase (públicas): solo con datos de prueba, y apágalo al terminar. Sin altas abiertas: `enable_signup = false`.

## Verificación

```bash
./scripts/verify.sh
```

Comprueba el contexto y ejecuta typecheck, Vitest y build de Admin, Player y Educators (y con ellas, el UI Kit). Cobertura y huecos: [`.harness/project.md`](.harness/project.md).

## Despliegue

Cada app se publica por separado; no se crean ramas permanentes por aplicación. Con workspaces, la plataforma instala desde la raíz del monorepo. Una app nueva extiende `@playhub/ui` e incorpora su `AGENTS.md` (con `CLAUDE.md`), `.env.example`, verificación y despliegue propios.
