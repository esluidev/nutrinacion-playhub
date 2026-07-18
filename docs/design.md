# Diseño

> Estado: **skeleton.** Captura la identidad visual actual de cada app para no romperla;
> los tokens y el sistema de componentes definitivos se pulen después. No introducir un
> lenguaje visual nuevo sin acordarlo.

Fuentes display redondeadas (tipo Fredoka) para títulos; cuerpo legible (tipo Nunito).

## admin

Limpia, profesional, amigable pero no infantil.

- Color de marca: verde (tipo `#22c55e` — confirmar el hex en el código).
- Layout con sidebar de navegación + header con búsqueda y usuario.
- Tarjetas redondeadas con color por categoría en storyboards.
- Planificador kanban: columnas por día, color por estado/categoría.

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
