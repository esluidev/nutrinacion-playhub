# Arquitectura

## Topología

Nutrinación StoryPlay es un monorepo con tres aplicaciones desplegables por separado y un backend
Supabase compartido:

```text
Admin ───────────────┐
                     ├── Supabase (Auth, PostgreSQL, RLS, Edge Functions)
Studio gestión ──────┘

Studio /play/** ── runner HTML público ── webview futuro de Educators
```

| Aplicación | Responsabilidad actual | No es responsable de |
|---|---|---|
| Admin | Organizaciones, comunidades, operación y catálogo editorial en Platform. | Construir juegos. |
| Studio | Contenido compilado, metadata, preview y runner público; lectura de estado remoto. | Escribir el catálogo Supabase. |
| Educators | Experiencia Flutter del educador; hoy prototipo local. | Implementar juegos HTML. |

## Flujo objetivo punta a punta

1. El equipo construye un storyboard y sus escenas en Studio.
2. Studio produce metadata build-owned (`clave`, slugs, idiomas, escenas, taxonomía).
3. Un superadmin registra esa metadata en Admin/Platform y completa datos editoriales/guía.
4. Una comunidad programa un taller usando un storyboard publicado.
5. Educators recibe la asignación y carga el runner público de Studio en un webview.
6. Educators persiste el resultado/feedback en Supabase.

Los pasos 1–4 existen en distinto grado. La integración real de Educators, bridge y auth propio
sigue pendiente; no documentarla como terminada.

## Límites de datos

- `organizacion`: relación comercial, administradores y licencia.
- `comunidad`: tenancy operativo.
- `storyboard.json`/contenido Studio: verdad build-owned del juego.
- Supabase: catálogo editorial, operación y relaciones.
- La `clave` UUID une build y catálogo; el slug es localizador, no identidad.

## Convenciones

- Código en inglés; tablas/columnas y vocabulario de negocio según el esquema en español.
- UI Admin/Educators localizada; Studio UI español; contenido de juegos localizado.
- Datos remotos detrás de composables/repositorios, no dispersos por componentes.
- Validar y autorizar en boundaries; RLS es la barrera de datos del cliente.
- Apps independientes: dependencias, env, build y despliegue propios.

## Fuentes de detalle

- Dominio: [`glossary.md`](glossary.md).
- Apps: [`apps/`](apps/).
- Supabase: [`backend.md`](backend.md) y `../supabase/migrations/`.
- Contenido/runner: [`storyboards.md`](storyboards.md), [`games.md`](games.md) y
  [`game-rules.md`](game-rules.md).
