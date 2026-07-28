# Diseño

> Estado: **skeleton.** Captura la identidad visual actual de cada app para no romperla;
> los tokens y el sistema de componentes definitivos se pulen después. No introducir un
> lenguaje visual nuevo sin acordarlo.

Fuentes display redondeadas (tipo Fredoka) para títulos; cuerpo legible (tipo Nunito).

## admin

Limpia, profesional, amigable pero no infantil. **Fuente de verdad visual:
`docs/Admin Rediseño.html`** (mock completo de las pantallas con los valores exactos);
los tokens viven en `apps/admin/tailwind.config.ts` + `app/assets/css/main.css`.

- Color de marca: verde `#43b435` (oscuro `#1a2e22`); neutrales verdosos vía la escala `gray` remapeada.
- **Dos familias de gris**: neutrales verdosos para texto/bordes del contenido, y grises **fríos**
  (`#f4f5f7`/`#e9ebee`, la familia del fondo de página) para el chrome del header y los controles.
- **Regla global de campos**: todo control de formulario sobre tarjeta blanca (input, textarea,
  select) lleva relleno `#f4f5f7`, borde `#dfe3e0`, radio 11 y foco verde con fondo blanco.
  Vive en `.input`/`.input-sm` de `main.css` — nunca estilos por pantalla. El autofill del
  navegador está neutralizado globalmente.
- Layout con sidebar de navegación + header con breadcrumb, búsqueda y usuario; título grande en el
  contenido, con `max-w-[1440px]` (el diseño es a 1440; sin tope se desparrama en monitores anchos).
- Tarjetas redondeadas (18px) con color por categoría en storyboards.
- Planificador: vista semanal de columnas tintadas por día + vista mensual, color por estado/categoría.
- El switcher de contexto **solo elige contexto** — ninguna acción (crear/editar) vive dentro.

## educators (StoryPlay)

Kawaii/cartoon colorido y lúdico (se ejecuta frente a niños de 4-8 años). Táctil y
**landscape** como modo principal en la ejecución del taller.

- Componentes 3D: botones y tarjetas con borde inferior grueso (efecto presionable),
  `:active`/`:hover` con leve desplazamiento vertical. Sombras por borde, no box-shadow.
- Paleta:
  - Coral `#FF6B6B` (marca principal) · Teal `#4ECDC4` (secundario)
  - Amarillo `#FFE66D` (recompensas) · Púrpura `#A29BFE` (acentos)
  - Verde `#22c55e` (éxito/progreso) · Fondo cálido claro, superficies blancas.
- Targets táctiles grandes (mín. ~44px).
- Gamificación visible: XP, nivel, barra de progreso, mapa de aventura, recompensas.

## studio

Herramienta interna, funcional, no de cara al cliente: prioriza productividad sobre estética.
UI en español. Puede reusar tokens de admin (ambas Nuxt). Se define al construir la app.

## Estilos y primitivas de los juegos (StoryPlay)

El lenguaje visual de los juegos/escenas y sus piezas reutilizables ya están definidos en el
código de studio; al crear o tocar escenas se reutilizan, no se reinventan. Dónde están:

- **Design system de los juegos** — tokens (color, tipografía, sombra, motion) **y**
  componentes/runtime: `apps/studio/app/assets/css/storyplay.css`. Ahí viven las clases `.sp-*`
  del lenguaje visual sticker: botón `.sp-btn` (color/tamaño), botón circular `.sp-circle`,
  ruleta `.sp-wheel*`, cartas de revelación `.sp-reveal-*`, opción de quiz `.sp-quiz-option`,
  dots `.sp-dots`, y el layout del runner (`.play-layout`, `.play-stage`). **No redefinir
  botones/cards/ruleta/etc. por escena** — reusar las clases del DS; en cada escena vive solo
  su layout/composición y los tamaños puntuales de su contenido (p. ej. el contenedor del sprite).
- **Base de la app + chrome de gestión** (Tailwind + UI de admin de studio):
  `apps/studio/app/assets/css/main.css`. No es el DS de los juegos.
- **Primitivas reutilizables** (las mecánicas): `apps/studio/app/primitives/`. Cada una sigue
  la misma estructura (componente + composable), con un catálogo y una página de showcase para
  explorarlas; para una mecánica nueva, crear una primitiva siguiendo esa estructura.
- **Sprites reutilizables** (elementos simples del juego: alimentos, utensilios y props —
  un huevo, una cuchara, un frijol, un bowl): `apps/studio/app/sprites/`. Como las primitivas pero sencillos: solo el arte sticker, sin mecánica.

Explorar esas fuentes para ver qué hay disponible al momento de la tarea; las reglas de uso
están en `docs/game-rules.md`.

## Por definir

Tokens definitivos (color, tipografía, espaciado, radios), sistema de componentes (3D en
educators), responsive, estados (hover/focus/loading/vacío/error), accesibilidad.
