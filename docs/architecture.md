# Arquitectura

Visión de conjunto del sistema Nutrinación: los tipos de contenido, cómo se conectan las
tres apps y las convenciones transversales con las que se construyen. El detalle de cada
app vive en `docs/apps/`.

## Los cuatro tipos

El contenido se organiza en cuatro **tipos** de storyboard, cada uno con subcategorías
y su contrato pedagógico (`docs/storyboards.md`):

1. **Alimentación** — la comida y la hidratación: qué alimentos hay, por qué comerlos,
   cómo se preparan…
2. **Cuidado personal** — higiene, hábitos saludables, cuidados de salud…
3. **Actividad física** — movimiento, ejercicio, juego activo…
4. **Salud emocional** — manejo de emociones, autoestima, convivencia…

## Las tres apps

- **admin** (Nuxt) — las comunidades gestionan equipo y programan talleres → `docs/apps/admin.md`
- **educators / StoryPlay** (Flutter) — los educadores ejecutan los talleres en el aula → `docs/apps/educators.md`
- **studio** (Nuxt) — el equipo crea y sirve los juegos de las escenas → `docs/apps/studio.md`

## Flujo de punta a punta

```
[Administrador de una comunidad] → app admin (Nuxt)
    ├── Crea la comunidad y su equipo
    ├── Agrega educadores (con código de acceso) y grupos
    ├── Explora storyboards prediseñados
    ├── Crea talleres (elige storyboard, fecha, lugar, educador)
    └── Programa en el planificador semanal y da seguimiento
                          │
                          ▼
[Educador] → app educators / StoryPlay (Flutter)
    ├── Entra con correo + código de acceso
    ├── Ve sus talleres asignados de la semana
    ├── Ejecuta el taller en el aula, escena por escena
    │     ├── Lectura: narrativa de la escena + guía pedagógica
    │     └── Juego: juego HTML interactivo (servido por studio, vía webview)
    └── Completa el taller
                          ▲
                          │ (los juegos se crean en)
[Equipo Nutrinación] → app studio (Nuxt)
    ├── Crea los juegos HTML de cada escena
    ├── Los almacena
    └── Los expone para que educators los renderice
```

## Convenciones

Convenciones transversales a las tres apps. Lo esencial está en `CLAUDE.md`; aquí el detalle.

### Idioma

- **UI** (textos visibles): español. **Código** (nombres, variables, comentarios): inglés.
- **BD**: snake_case; español o inglés según el concepto (`taller`, `comunidad`, `educador`;
  `storyboard` queda en inglés porque no tiene una forma natural en español). No es regla
  dura — se decide caso por caso.
- **i18n**: admin y educators son multi-idioma desde español (strings de UI en archivos de
  traducción, no hardcodeados; hoy solo español activo). La UI de studio es solo español,
  pero el **contenido de los juegos** que produce SÍ es multi-idioma — patrón en
  `docs/storyboards.md` (Traducciones).

Ejemplos: `const communityId` (código) · `comunidad_id` (BD) · "Crear comunidad" (UI).

### Naming contextual

Nombres (páginas, funciones, rutas, componentes) con significado según su uso, no genéricos.

- Nuxt (admin, studio): camelCase variables/funciones, PascalCase componentes, kebab-case archivos/rutas.
- Flutter (educators): camelCase variables/funciones, PascalCase clases/widgets, snake_case archivos.

### Acceso a datos (hoy estático → mañana dinámico)

Las apps funcionan con **datos estáticos**. Al introducir Supabase: abstraer el acceso detrás
de una capa (composables/servicios en Nuxt, repositorios/servicios en Flutter), no esparcir
llamadas por componentes. Así se pasa de estático a dinámico cambiando una capa, no toda la
app. Validar en boundaries; no exponer datos sensibles (claves, tokens) en cliente ni logs.
Esquema, RLS y storage en `docs/backend.md`.

### Monorepo

Tres apps independientes bajo `apps/`, cada una con su build (`apps/admin` y `apps/studio`
Nuxt; `apps/educators` Flutter). No hay paquete compartido por ahora; si la duplicación entre
las dos apps Nuxt se vuelve dolorosa (cliente Supabase, tipos), introducir uno recién entonces.

### Commits

Conventional Commits con scope de app cuando aplique: `feat(admin):`, `fix(educators):`,
`chore(studio):`, o sin scope para cambios transversales.
