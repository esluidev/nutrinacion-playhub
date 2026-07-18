# App: Educadores / StoryPlay (`apps/educators`)

Aplicación multiplataforma (Flutter) que los educadores usan en el aula para ejecutar los
talleres asignados. Stack: Flutter + webview para los juegos. Multi-idioma (hoy solo
español). PWA + tablets (iPad, Android), landscape como modo principal.

> Estado: parcialmente implementada, funcionando con **datos estáticos**. La base de
> datos aún no está conectada.

## Audiencia y contexto

El usuario es el educador (adulto), pero la app se ejecuta frente a niños de 4-8 años en
el aula. Por eso el estilo es lúdico, colorido (kawaii), con gamificación. Optimizada para
pantallas táctiles horizontales.

## Acceso

- Login con correo + código de acceso generado por el administrador de la comunidad.
- **No se permite crear cuentas** desde aquí; las crea el administrador en la app admin.

## Flujo de usuario

### Dashboard de talleres

- Header con identidad StoryPlay, nombre del educador, aula, avatar.
- Talleres asignados organizados por semana (lun-dom), con navegación entre semanas.
- Cada tarjeta: título, horario, educador, ubicación.
- Acciones: ver guía (preview) e iniciar taller.

### Ejecución del taller

Pantalla principal de ejecución, optimizada para landscape. Estructura observada en el
diseño actual (ver `docs/design.md`):

- **Header:** título del taller, progreso (X escenas), toggle **Lectura / Juego**,
  botón salir.
- **Columna de escenas (mapa de aventura):** lista de escenas con estados visuales
  (completada, activa, bloqueada), líneas conectoras, nodo final "Finalizar taller".
  Cada escena puede abrir su guía pedagógica y su juego.
- **Área central (canvas):** muestra la escena actual. En modo **Lectura**, la narrativa.
  En modo **Juego**, el juego HTML renderizado en un **webview**. Controles inferiores:
  reiniciar, escena anterior, contador ("1 / 4"), escena siguiente.
- **Columna de progreso/recompensas:** XP, nivel, barra de progreso, inventario de
  recompensas (gema, diamante, ruby). Ver `docs/games.md`.

### Guía pedagógica (modal)

Overlay con el contenido docente de la escena: objetivo, guion sugerido, tips de dinámica.

### Resumen de finalización

Pantalla de celebración: XP total, porcentaje de escenas completadas, recompensas
obtenidas. Continúa al feedback.

### Feedback del educador

- Calificación con estrellas (1-5).
- Cantidad de niños atendidos.
- Nivel de participación (bajo / medio / alto).
- Comentarios.
- Finaliza el taller y regresa al dashboard.

## Juegos vía webview

Cada escena tiene un juego HTML. La app de educadores **no implementa los juegos**; los
renderiza desde Studio en un webview. Ver `docs/games.md` para el contrato
(cómo se cargan, cómo se comunican el juego y la app, eventos de completado, etc.).

## Diseño y convenciones

Identidad visual en `docs/design.md` (kawaii, 3D, landscape, paleta cálida). Idioma, capa de
datos y naming en `docs/architecture.md`. Hoy con datos estáticos; al conectar Supabase,
abstraer el acceso a datos. El educador pertenece a una comunidad.
