# Admin

SPA Nuxt 4 (capa `@playhub/ui`, Tailwind 4, densidad `compact`, Reka UI) conectada al Supabase compartido: operación de organizaciones y comunidades, más la consola interna Platform. Datos: [`../../docs/backend.md`](../../docs/backend.md).

## Estructura

- Tres contextos excluyentes y la ruta manda: `app/pages/platform/` (superadmin: organizaciones, licencias, invitaciones y catálogo de storyboards), `app/pages/organizacion/` (administradores, licencia, comunidades, jornadas y «Para casa» con el perfil público) y `app/pages/dashboard/` (comunidad: talleres con su ciclo y su edición, planner, educadores ligados, colaboradores, participantes con el código de acceso, «Para casa», configuración y catálogo disponible). Mi perfil y la contraseña van con Supabase Auth. Admin no envía correos ([decisión 009](../../docs/decisions/009-acceso-admin-sin-correo.md)): las invitaciones se comparten con «Copiar enlace» y, si alguien olvida su contraseña, el titular o soporte le genera un enlace a `/restablecer` (`EnlaceRecuperacion`, en Platform, Administradores y Colaboradores). Sidebar, switcher, breadcrumb y guards reflejan el mismo contexto; el switcher solo elige contexto. Al entrar se vuelve al último contexto del switcher; sin él, por rol (superadmin → Platform, admin → su organización, colaborador → su comunidad). No hay página intermedia para elegir destino (`useContexto.rutaInicial`).
- `app/composables/`: todo acceso a Supabase. Páginas y componentes no consultan directamente. El cliente está tipado con el esquema (`supabase/database.types.ts`, regenerado con `npm run db:types` en la raíz; tipos en `~/utils/db`): una columna mal escrita en un insert o un filtro falla en typecheck. Los `select` con embebidos se siguen convirtiendo con `as unknown`: revísalos a mano al cambiar el esquema.
- Los `Ui*` vienen del UI Kit (`packages/ui`); sus textos salen del i18n de Admin con `provideUiLabels` en `app.vue`. Reka UI aporta comportamiento accesible (prefijo `Reka`) a los componentes propios de Admin, no otra estética.
- `app/i18n/messages.ts`: todos los textos visibles, en español e inglés.

## Reglas

- Reutiliza los `Ui*`, confirmaciones, tablas, iconos, toolbars y estados existentes antes de crear variantes.
- Diseño: el UI Kit manda (`packages/ui/DESIGN.md`, «Profundidad» y «Roles de color»), igual que en Educators. El color dice algo: lima solo para la acción principal y lo completado; sol para hoy; cielo para lo próximo; coral para cancelar o lo que falta; la navegación actual, en tinte lima claro (`ui-nav-item`). Las vistas no escriben pasos de paleta, hex, sombras, anillos ni tamaños sueltos: roles (`text-muted`, `bg-sunken`, `border-line`), `data-tone` con `bg-(--tone-tint)`/`text-(--tone-strong)` y los `Ui*`. Los composables entregan `tone`, no clases. Referencia: `components/Planner*.vue`. Campos con `UiInput`/`field`. Contenido con `max-w-[1440px]`.
- Platform administra organizaciones (altas, licencias, administradores, invitaciones y catálogo). Su dashboard no muestra la operación de cada organización (comunidades, educadores, talleres). Debajo de Platform, el selector solo ofrece las organizaciones que administras y las comunidades donde colaboras, también al superadmin (`useAuth`). La RLS no le deja leer la operación ajena: Platform pide cifras, comunidades y administradores a `platform_uso`/`platform_comunidades`/`platform_administradores` (el detalle de organización usa esas cifras como panel de soporte) y da de baja con `platform_eliminar_organizacion` ([decisión 008](../../docs/decisions/008-superadmin-administra-organizaciones.md)).
- Toda restricción sensible también va en RLS o trigger: un gate de UI no es seguridad.
- Fechas con `utils/fechas.ts`: las columnas `date` son un día del calendario (`fechaCorta`, `diasHasta`), «hoy» es local (`hoyLocal`) y un vencimiento elegido en un campo de fecha vale hasta el final de ese día (`finDelDia`). `new Date('YYYY-MM-DD')` y `toISOString().slice(0, 10)` dan el día en UTC; solo se usan a propósito para replicar una regla de la base, que compara con `current_date` (UTC).
- Platform es la única superficie que escribe las guías. La metadata del storyboard la registra Player desde su JSON y la publicación (estado, países y organización) también se decide en Player (decisiones [006](../../docs/decisions/006-modelo-y-catalogo-desde-player.md) y [007](../../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)): en Admin son de solo lectura.
- Invitaciones: llevan nombre y apellido de a quién se invita. La de titular solo la emite el superadmin (Platform); al canjearla, la titularidad pasa a esa persona. El superadmin puede unirse a una organización como administrador o titular desde su detalle en Platform ([decisión 008](../../docs/decisions/008-superadmin-administra-organizaciones.md)).
- El educador es de la organización: darlo de alta en una comunidad lo liga si ya existe con ese correo. Su acceso a Educators es un código de activación con el que elige su PIN.
- El ciclo del workshop lo hace cumplir la base (borrador, en revisión, publicado, finalizado, cancelado, archivado); la UI ofrece solo las acciones que caben y muestra el mensaje de la base si rechaza algo. «Realizado», «sin realizar», «hoy» y «en curso» se deducen (`useWorkshops`).
- Los participantes de la comunidad: la base solo deja ver nombre, género y edad.
- «Para casa» (`ContenidoCasa`): temarios y publicaciones para los participantes; la organización publica para todas sus comunidades o una, y quien opera una comunidad, para la suya. El perfil público de la organización se guarda con `organizacion_actualizar_perfil_publico`.
- Un taller publicado conserva fecha, hora y al menos un educador (lo exige la base): para cambiar de educador se asigna el nuevo antes de quitar al anterior.

## Desarrollo y verificación

```bash
cp .env.example .env.local   # NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY
npm install                  # desde la raíz del monorepo
npm run dev                  # http://localhost:3000; npm run dev:demo, sin Supabase, en :3100
npm run typecheck && npm test && npm run build
```

Cambios de auth, RLS, invitaciones, catálogo o talleres necesitan además evidencia de Supabase y un escenario de navegador. Sin mutaciones contra cloud sin autorización.
