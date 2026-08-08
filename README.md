# Nutrinación StoryPlay

Monorepo de una plataforma de talleres educativos. Contiene tres aplicaciones desplegables
independientes que comparten dominio y backend Supabase.

## Empieza aquí

### Developer humano

1. Lee este README para ubicar el sistema.
2. Abre el README de la aplicación que vas a tocar.
3. Consulta `obsidian/Ficha.md` para el estado vigente y la tarea asignada para el alcance.
4. Usa [`docs/README.md`](docs/README.md) como router; no leas todos los documentos.
5. Ejecuta la verificación indicada por la app y el plan de QA de la tarea.

### Agente con una tarea concreta

`AGENTS.md` define el protocolo. El recorrido mínimo es:

```text
tarea → AGENTS de la app → documentos indicados → código del dominio → pruebas/QA
```

### Análisis general

Comienza por este README, `obsidian/Ficha.md`, los AGENTS de las apps potencialmente afectadas y
el router técnico. Acota el dominio antes de recorrer código o historia.

## Aplicaciones

| Aplicación | Ruta | Stack | Responsabilidad | Estado general |
|---|---|---|---|---|
| Admin | [`apps/admin`](apps/admin/README.md) | Nuxt 4, Tailwind, Supabase | Operación de organizaciones/comunidades y consola Platform. | Activa, conectada a Supabase. |
| Studio | [`apps/studio`](apps/studio/README.md) | Nuxt 4, Tailwind, Supabase read-only | Diseñar/probar storyboards y servir el runner público. | Activa. |
| Educators | [`apps/educators`](apps/educators/README.md) | Flutter | Ejecutar talleres en aula y alojar el runner. | Prototipo con datos locales. |

Cada app conserva dependencias, entorno, build y despliegue propios. Compartir Supabase no las
convierte en un solo artefacto de producción.

## Estructura

```text
apps/        Aplicaciones desplegables independientes.
supabase/    Migraciones y Edge Functions del backend compartido.
docs/        Arquitectura, dominio, UI, testing y operación estables.
scripts/     Verificaciones reproducibles del monorepo.
obsidian/    Symlink local al segundo cerebro operativo del proyecto.
AGENTS.md    Reglas y router de contexto para agentes.
CLAUDE.md    Symlink a AGENTS.md para Claude.
```

## Preparar el entorno

### Admin

```bash
cp apps/admin/.env.example apps/admin/.env.local
cd apps/admin
npm install
npm run dev
```

### Studio

```bash
cp apps/studio/.env.example apps/studio/.env.local
cd apps/studio
npm install
npm run dev
```

### Educators

```bash
cd apps/educators
flutter pub get
flutter run
```

Los `.env.local` reales contienen configuración local y no se versionan. La anon key de
Supabase puede vivir en el cliente; la seguridad de datos depende de RLS, no de ocultarla.

## Verificación y QA

```bash
./scripts/verify.sh
```

Actualmente verifica contexto documental y ejecuta typecheck, Vitest y build de Admin/Studio.
Educators todavía se verifica de forma focal:

```bash
cd apps/educators
flutter analyze
flutter test
```

La estrategia completa y sus límites están en:

- [`docs/testing/strategy.md`](docs/testing/strategy.md): capas y criterios de evidencia;
- [`docs/operations/database-access.md`](docs/operations/database-access.md): inspección viva con
  MCP Supabase y fallback local;
- el `Plan de QA` de cada tarea: datos, pasos de navegador, invariantes y salida esperada del flujo.

No existe un directorio `qa/`: las reglas estables viven en `docs/testing/` y la ejecución concreta
se documenta en la tarea para evitar otra fuente de verdad paralela.

## Fuentes de verdad

| Información | Fuente |
|---|---|
| Orientación humana | este README y README de cada app |
| Flujo/restricciones del agente | AGENTS raíz y de cada app |
| Técnica estable | `docs/`, código y migraciones |
| Estado actual | `obsidian/Ficha.md` |
| Alcance, plan y evidencia | tarea correspondiente |
| Historia | `obsidian/Actividad.md` y su archivo |

## Despliegue

Admin, Studio y Educators se publican por separado. No crear ramas permanentes por aplicación.
Cualquier nueva app debe incorporar README, AGENTS/CLAUDE, plantilla de entorno, verificación y
release propios.
