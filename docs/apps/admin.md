# App: Administración (`apps/admin`)

Aplicación web administrativa donde las comunidades gestionan su operación. Stack: Nuxt
+ Tailwind. Multi-idioma (hoy solo español). Web responsive.

> Estado: **conectada a Supabase**, multi-idioma (es/en) según `perfiles.idioma`. Operan contra datos
> reales: **auth** (login + registro por invitación), la **bandeja de invitaciones** (aceptar/rechazar
> desde la app cuando el correo ya tiene cuenta), el **contexto/switcher** (organización › comunidad,
> persistido), **Comunidades** (CRUD) y el área **Platform** (consola del superadmin: organizaciones,
> licencias, invitaciones). El **dashboard de cliente** (talleres, educadores, planificador,
> storyboards) sigue con **datos estáticos** hasta migrarse (tarea 013).
>
> **Stack UI:** Tailwind + design system propio (`Ui*`) + **Reka UI** (headless: solo comportamiento y
> accesibilidad; los estilos son nuestros). El rediseño visual está aplicado desde
> **`docs/Admin Rediseño.html`** — ese mock es la **fuente de verdad visual** de la app (tokens,
> layouts y medidas); ante dudas de estilo, leerlo antes de inventar.

## Audiencia

Administradores y coordinadores de las comunidades. Adultos, contexto profesional. La
interfaz es limpia y funcional (no el estilo lúdico de educators).

## Módulos (según lo implementado y planificado)

### Autenticación y onboarding

- **Login** — email + contraseña (Supabase Auth, cuando se conecte).
- **Registro** — email, contraseña, confirmación, aceptación de términos.
- **Configuración de comunidad** — al registrarse, crear la comunidad: nombre, tipo
  (empresa, institución educativa, organización, fundación, otro), descripción, datos
  de contacto, país, logo.
- **Middleware de protección** — rutas según estado de autenticación y de comunidad.

### Dashboard

Resumen de la comunidad: tarjetas de estadísticas (total talleres, pendientes, promedio,
asistentes), talleres recientes, estado general.

### Storyboards (biblioteca de contenido)

Biblioteca de las plantillas de contenido prediseñadas.

- Tarjetas con portada (color por categoría), badge de plan (gratuito/premium/personalizado),
  número de escenas, categoría, rango de edad, duración.
- Filtros por tipo/categoría, por plan, búsqueda, ordenamiento.
- Acciones: "Ver detalle" y "Usar en taller".

### Talleres

- Lista con búsqueda y filtro por estado (programado, completado, cancelado, borrador).
- Tarjetas con estadísticas.
- Acciones: ver, editar, duplicar, eliminar.
- **Creación (wizard de 4 pasos):**
  1. Seleccionar storyboard.
  2. Asignar educador/grupo.
  3. Detalles (título, ubicación, max asistentes, descripción, notas).
  4. Programar (fecha y hora, opcional).

### Planificador (kanban semanal)

Herramienta visual para programar talleres.

- Vista semanal: 7 columnas (lun-dom), drag & drop entre días.
- Vista calendario mensual.
- Código de colores por estado/categoría.
- Botón de agregar taller rápido por día.
- Navegación entre semanas/meses.

### Educadores y grupos

- **Educadores:** lista, búsqueda, filtros, tarjetas con datos, acciones (ver, editar,
  activar/desactivar, eliminar). Agregar educador (datos + generación de código de acceso).
  Perfil de educador (info, talleres asignados, historial).
- **Grupos:** CRUD, habilitar/deshabilitar, ver miembros.

## Diseño y convenciones

Identidad visual en `docs/design.md`. Idioma, capa de datos y naming en `docs/architecture.md`.
Hoy con datos estáticos; al conectar Supabase, abstraer el acceso a datos.
