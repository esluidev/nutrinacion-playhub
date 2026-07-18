# Reglas duras de juego (StoryPlay)

Reglas NO negociables para el diseño, estructura y manejo de juegos/escenas.
Definidas con el usuario el 2026-06-11. Aplican a toda escena nueva y a todo cambio
sobre escenas existentes. Los estilos y primitivas que estas reglas usan están en
`docs/design.md`.

## 1. Los alimentos no tienen personalidad

**Un alimento es un elemento inerte, sin vida y sin personalidad.** Se presenta tal
como es, siempre en tercera persona.

- ✅ "Este es el frijol rojo. Es pequeño y de color rojo oscuro."
- ✅ "Tiene mucho hierro, nos da energía."
- ❌ "¡Hola! Soy el frijol rojo." (primera persona)
- ❌ Alimentos que saludan, hablan, sienten o son "amigos" del niño.

**Por qué:** humanizar el alimento hace que el niño lo perciba como un ser vivo y lo
"amigue", lo cual distorsiona el objetivo: aquí se enseña nutrición, actividad física,
cuidado personal y salud emocional — los alimentos son alimentos. Aplica a textos,
voces, animaciones y mecánicas (una animación decorativa de rebote es aceptable; un
alimento "despidiéndose" o "hablando", no).

## 2. Layout del HUD (contrato fijo)

```
┌──────────────────────────────────────────────────────────┐
│ [✕]            ▓▓▓▓▓▓░░░░ (ProgressBar)   ⭐pts 🔊 [⚙|▤] │ ← top
│                                                          │
│                  ÁREA DE LA ESCENA                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│            BOTTOMSHEET (franja inferior)                 │ ← ver regla 5 y 15
└──────────────────────────────────────────────────────────┘
```

**Todas las acciones del HUD son botones DIRECTOS — sin menús anidados.** En juego
se necesitan acciones rápidas: un dropdown/menú de sistema agrega un paso y confunde
(probado y descartado).

- **Arriba-izquierda**: cerrar (✕) — **siempre presente**: el storyboard se puede
  cerrar en cualquier momento. Ver regla 8.
- **Arriba-centro**: progreso del storyboard con la **primitiva ProgressBar** (las
  primitivas existen para esto; nunca indicadores ad-hoc como circulitos). El tamaño
  debe pesar visualmente como el resto del HUD (círculos de 56px).
- **Arriba-derecha**: contador de puntos + **audio de instrucciones** + el
  **toggle del panel del docente** (icono panel-bottom; el estado abierto se
  comunica SOLO con el cambio del icono — franja rellena — nunca con cambio de
  color del botón).
- **Abajo NO hay barra fija**: la franja inferior pertenece a la **BottomSheet**
  (primitiva del DS): ancho completo del viewport, sin esquinas redondeadas, solo
  borde superior 3px ink, contenido alineado lateralmente con el HUD. Cuando se abre,
  **el stage cede el espacio** (se reescala y recentra) — la sheet **jamás se monta
  sobre contenido jugable**. Sus dos contenidos (un solo lugar donde llega todo el
  feedback del sistema): la **Tarjeta de Saber** y el **panel del docente** son
  estados independientes que coexisten — se muestra el último activado, y cerrar
  el panel **restaura la tarjeta** que estaba abierta. **Altura única** para
  TODOS los contenidos: alternar tarjeta/panel nunca redimensiona la franja (el
  stage no debe saltar).
- **Panel del docente** (dentro de la sheet, EXCLUSIVO de teacher): info de la escena
  (n/total + título + estado), Guía, ⚙ config, reset de escena, atrás y adelante
  (navegación a voluntad, estilo Duolingo). Invocable en cualquier momento desde el
  toggle y se abre solo al completar una escena; **al navegar (◀ ▶) se oculta** —
  cada escena carga limpia, sin la franja ocupada. Reset va **separado por
  proximidad** del par ◀ ▶ (es utilidad, no navegación; la proximidad agrupa más
  fuerte que el color). Las escenas no anclan nada en la franja.

**Color jerárquico del HUD.** Principio UX: **el juego es el protagonista** — los
colores saturados pertenecen a los elementos del juego (su CTA, la ruleta, las
piezas). El HUD señala su función con **tintes suaves + icono en el acento oscuro**,
haciéndose notar de forma sutil según la importancia de lo que hace, sin competir
por la atención. Consistente en todas las escenas — un botón no cambia de color
entre escenas:

- ⚪ blanco neutro = utilidades que no piden atención: cerrar (✕), configuración (⚙️)
  y reset de escena (↺) — reset NO es destructivo (remonta la escena, no daña nada);
  no lleva color de peligro.
- 💧 azul claro (#dde8f0) = información: audio de instrucciones y Guía — misma
  identidad que el botón de audio del Modal. La Guía abre su popup (Modal del DS)
  con la guía pedagógica de la escena.
- 🟡 tinte amarillo = recompensa: píldora de puntos.
- 🟢 tinte verde + icono en acento oscuro = navegación: atrás (◀) y adelante (▶)
  comparten el MISMO tono (son la misma función en dos direcciones). Si no se puede
  navegar, el botón se deshabilita.
- Deshabilitado = fondo blanco atenuado (el color desaparece junto con la función).

## 3. Audio de instrucciones vs audio de contenido

- El **botón de audio del HUD reproduce las instrucciones de la escena actual**
  (lee `meta.instruction` del `scene.config.ts`). NO es mute.
- El **audio de contenido** (datos de un alimento, preguntas del quiz) sí vive dentro
  de la escena, junto al contenido que narra.
- Las escenas **no** ponen botones sueltos de "escuchar instrucción": eso es del HUD.

## 4. Mute y configuración

- El mute vive **dentro del popup de Configuración**, nunca como botón directo del
  HUD. El popup se abre con ⚙️ desde el **panel del docente** (regla 2).
- El popup configura **el storyboard** (no la escena actual, salvo que aplique):
  sonido on/off (silencia efectos + voz) y reiniciar taller.

## 5. Completado de escena (panel del docente, no modal)

Al completarse una escena se abre el **panel del docente** en la BottomSheet con
la flecha ▶ encendida — el educador decide cuándo avanzar. El resultado visual de
la escena ES el premio y queda **siempre visible** — nunca se tapa con un overlay
ni se anuncia con un modal.

- **NUNCA se auto-narra** (principio: el chrome no habla solo — ver regla 15).
- Aparece **después** del feedback de la escena, nunca encima: espera un beat
  corto para que el jingle de éxito aterrice.
- Si hay una **Tarjeta de Saber** abierta, esta conserva la franja (el guion del
  último dato importa) y **gana el botón ▶** junto a su audio — un tap para
  avanzar directo desde la tarjeta, sin tener que abrir el panel. La flecha
  aparece con un pop único al completarse (animación con final, regla 13).
- **Última escena**: la última escena ES el resumen del taller (regla 17) y su
  botón principal cierra el storyboard directamente.
- **Sin redundancias con la escena**: al completarse, el botón de acción principal
  de la escena NO se transforma en "reiniciar" (el replay vive en el reset del
  panel del docente) — el botón **se deshabilita** conservando su etiqueta.
  Aplica a toda escena con botón de acción.

## 6. Aislamiento de estilos en escenas

Las escenas **no usan nombres de clase del chrome de gestión** (`.card`, `.btn`,
`.badge`, `.chip`, `.input`, `.section-title`…): el CSS global del chrome se filtra y
rompe el visual (p. ej. fondos blancos fantasma). Prefijar las clases propias de la
escena (p. ej. `rf-card`) o usar nombres específicos del juego.

## 7. Franja superior e inferior

Las escenas dejan libres **120px arriba y 104px abajo** (padding del contenedor raíz
de la escena). El HUD ocupa hasta 76px en cada franja (botones de 56px + 20px de
margen): estos paddings garantizan un respiro real (~44px arriba, ~28px abajo) entre
el área de juego y el HUD — sin él, todo se ve apretado. Nada de contenido de escena
fijado en esas franjas.

**El área jugable se centra VERTICALMENTE** dentro del espacio restante de la escena
(`justify-content: center` en el contenedor raíz): el contenido nunca queda anclado
arriba dejando un vacío abajo.

## 8. Cerrar siempre disponible, con confirmación hablada

Cerrar el storyboard está **siempre disponible**. Al tocar ✕ aparece un popup de
confirmación que:

- **Tiene botón de audio** para escuchar la confirmación bajo demanda.
- Ofrece dos salidas claras: **Seguir jugando** (verde) y **Salir** (rojo).
- En Educators, el ✕ emitirá `storyboard:close-request` y Flutter mostrará el diálogo
  nativo (bridge); este popup es el equivalente standalone de Studio.

## 9. Modal del DS solo para decisiones e interrupciones

Cualquier popup/diálogo usa **la primitiva `Modal`** (`app/primitives/Modal/`), que es
el componente Popup del design system (anatomía header-eyebrow / body / footer,
variantes sutiles, tamaños sm/md/lg, bounce de entrada, overlay que oscurece, botón de
audio integrado vía `audioText`/`autoSpeak`). **Nunca overlays ad-hoc** — crear popups
distintos rompe la consistencia del diseño.

**Pero su alcance es limitado**: el Modal es semánticamente una *interrupción* y se
reserva para **decisiones e interrupciones reales** — confirmar salida, configuración,
guía pedagógica. El **contenido educativo** (datos, saberes), el **completado de
escena** y el **resumen del taller** NUNCA van en modal: los dos primeros viajan por
la franja inferior (Tarjeta de Saber — regla 15 — y BottomSheet de completado —
regla 5) y el resumen ES la última escena (regla 17), porque tapar el juego en el
momento de pago visual es contraproducente.

## 10. La Bienvenida anuncia, no adelanta contenido

La escena de Bienvenida **introduce el tema** del taller ("¡A conocer los frijoles!",
"Conozcamos el pie diabético") con feedback visual y una sola acción de apertura.

- ❌ NO muestra variedades, propiedades ni nada que pertenezca a escenas posteriores —
  eso compite con el flujo definido (p. ej. mostrar los tipos de frijol en Bienvenida
  canibaliza al Descubrimiento).
- ✅ Una ilustración representativa del tema + título de apertura + botón de comenzar.
- **Comenzar avanza de inmediato**: si la bienvenida no tiene interacción real (solo
  el botón), al presionarlo se pasa directamente a la siguiente escena en TODOS los
  modos — sin popup de completado ni feedback intermedio ("¡muy bien!…" ahí es
  absurdo). Se declara con `advanceOnComplete: true` en los `defaults` del
  `scene.config.ts`. Solo si la bienvenida incluye una animación/interacción real
  (presentar el alimento, la actividad física, etc.) aplica el flujo normal del resto
  de escenas.
- En escenas con `advanceOnComplete`, el botón **siguiente** del panel del docente
  queda **deshabilitado** hasta completarla: el flujo entra por el botón de la escena
  (Comenzar), no por la navegación. El botón de la escena avanza SIEMPRE, incluso si
  la escena ya estaba completada (replay).

Aplica a todas las categorías de storyboards: cada escena respeta el contenido que le
toca dentro del flujo definido, sin adelantarse.

## 11. Sin labels de escena

No se muestran etiquetas tipo "ESCENA 1 · BIENVENIDA" (número o nombre de la escena)
en **ninguna** escena. Solo sobrecargan; el progreso ya lo comunica el HUD.

## 12. Sin notas para el docente dentro de la escena

Nada de chips o textos de apoyo al docente ("💬 Pregunta para conversar…") dentro de
las escenas — en ningún modo. Toda la guía pedagógica (qué hacer, cómo funciona el
juego, preguntas para conversar) vive en el **botón Guía** del HUD.

## 13. Sin efectos en reposo

Los botones (navegación, HUD o de escena) **no tienen animaciones ociosas**: solo
reaccionan al presionarse (hover/active del DS). Los estados se comunican con cambios
estáticos (p. ej. un botón no disponible se atenúa en neutro — sin pulsos ni rebotes
en loop, y sin cambiar el color jerárquico del botón).

## 14. Botones de popup: una palabra, sin iconos, jerarquía de color

En los footers del Modal:

- **Una sola palabra** por botón ("Seguir", "Salir", "Repetir", "Listo", "Reiniciar").
- **Sin iconos** dentro del botón (el `btn-icon` circular es otro componente y sí es
  solo-icono).
- **Jerarquía de color** para identificar importancia y tipo de acción:
  verde = acción principal/continuar · azul = acción secundaria/alternativa ·
  rojo = acción destructiva/salir.

## 15. Feedback en escena: acción vs saber (Tarjeta de Saber)

Durante el juego conviven **dos feedbacks de naturaleza distinta**, cada uno con UNA
forma fija — nunca se mezclan ni se inventan formas nuevas por escena:

**A. Feedback de acción** ("¿lo hice bien?"): inmediato, efímero y no-verbal —
sonido (success/error) + micro-animación del elemento + puntos. Nunca modal, nunca
texto largo. Idéntico en todos los modos.

**B. Feedback de saber** (el dato educativo — la razón pedagógica de la
interacción): SIEMPRE la **Tarjeta de Saber**, en todas las escenas:

- **Contrato**: la escena solo DECLARA el dato — emite `knowledge` con
  `{ title, html, voice, visual }` (emitir `null` lo oculta, p. ej. al iniciar el
  siguiente giro). El **shell** lo presenta; la escena no renderiza popups ni
  reproduce voz de saber por su cuenta.
- **Dónde**: la franja inferior reservada (BottomSheet) — un solo lugar donde el
  niño aprende a mirar. El stage cede el espacio: el dato **nunca tapa el juego ni
  el resultado visual** (que ES el premio).
- **Anatomía FIJA — nunca varía entre escenas**: ilustración SIEMPRE (componente
  específico del elemento, o un **emoji genérico** si no lo hay) + título SIEMPRE
  (el sujeto del dato, p. ej. "Frijol Rojo", "Agua natural") + dato en 1–2 líneas +
  **botón de audio al extremo derecho** (pegado a la ilustración, dos formas redondas
  juntas se leen como un solo grupo confuso). Triple canal siempre: imagen + texto +
  voz (codificación dual). Una tarjeta de una sola línea sin imagen ni título rompe
  la consistencia estructural y está prohibida. Fondo blanco — el tinte verde es
  exclusivo del completado (regla 5).
- **Política de voz**: la tarjeta NUNCA se auto-narra — el texto visible es el
  guion del educador y el botón de audio la reproduce bajo demanda. El chrome
  (navegación, completado) tampoco habla solo. El educador marca el ritmo.
- **Recuperable SIEMPRE**: tocar el elemento ya descubierto vuelve a abrir su
  tarjeta. El saber nunca es irrecuperable (aulas ruidosas, distracciones,
  hipoacusia: el texto visible y la re-escucha son la red de seguridad).
- **Convivencia en la franja**: la tarjeta y el panel del docente son
  **independientes** — un dato nuevo toma la franja, el toggle trae el panel al
  frente, y cerrar el panel **restaura la tarjeta** que estaba abierta.

## 18. Cada storyboard imagina su MUNDO

Antes de diseñar las escenas de un storyboard nuevo, se define el **mundo** en el que
vive, según su categoría y su tema: la cocina, el gallinero, el mercado, el parque,
el cuarto de baño… Las escenas habitan ese mundo y sus mecánicas nacen de él (en una
cocina se cocina, en un gallinero se buscan huevos, en un mercado se compra). El
mundo le da coherencia al taller y evita que las escenas sean pantallas sueltas.

## 19. Mecánicas propias por juego (y primitivas primero)

**Un storyboard NUNCA copia el set de mecánicas de otro.** El catálogo de mecánicas
(descubrir, arrastrar y soltar, puzzles, acciones físicas como cocinar/cascar/batir,
quiz…) se COMBINA distinto en cada juego y cada storyboard aporta al menos una
mecánica que le es propia, nacida de su mundo (regla 18). Si dos talleres de la
misma categoría se juegan igual, el segundo está mal diseñado.

- **Las primitivas van primero**: si una mecánica necesita una pieza que no existe
  en `app/primitives/`, se CREA la primitiva antes de construir la escena — nunca
  un hack local de escena para algo que es mecánica genérica reutilizable. La
  primitiva nueva se registra en el catálogo (`usePrimitivesCatalog`).
- Reutilizar una primitiva existente está bien (Glass, StepMeter, DropZone…); lo
  prohibido es clonar la COMBINACIÓN completa de mecánicas de otro storyboard.

## 16. Las escenas muestran juego, no texto

La escena es el **área de juego**: solo elementos jugables. Nada de títulos,
subtítulos, instrucciones escritas ni textos de feedback dentro de la escena.

- **Las instrucciones se escuchan, no se leen**: viven en `meta.instruction` y las
  reproduce el botón de audio del HUD (regla 3). Los niños de 4-8 mayormente no leen;
  un texto de instrucciones es ruido visual.
- **El feedback nunca es texto en la escena**: el feedback de acción es
  sonido + micro-animación, y el de saber/completado llega por la franja inferior
  (reglas 5 y 15). Textos tipo "¡Muy bien! …" dentro de la escena están prohibidos.
- **Excepciones de texto** (solo cuando el texto ES necesario): Bienvenida y
  Despedida (anuncian/cierran el taller), y los **prompts** de escenas de quiz como
  Retroalimentación (la pregunta es el juego). Etiquetas que forman parte del
  elemento jugable (nombre en una carta, título de una zona de arrastre) sí se
  permiten — son el juego, no decoración.
- **Botones de escena**: etiqueta corta en texto, **sin iconos ni emojis**. Nunca se
  ocultan ni se intercambian por un texto al completar: **se deshabilitan**
  conservando su etiqueta (regla 5). El estado final de la escena queda visible tal
  cual quedó (tablero resuelto, vaso lleno) — ese estado ES el premio.

## 17. La última escena es el resumen del taller

La escena de cierre (Despedida) ES el **resumen del taller** — no existe un modal de
"fin de taller" aparte. Aplica a todo storyboard:

- **Vista GENÉRICA**: sin imágenes del elemento/tema (nada de frijoles aquí) —
  trofeo, título de celebración y un mensaje corto de cierre (texto permitido,
  regla 16).
- **Estadísticas útiles** para el niño y el docente, en tarjetas sticker
  horizontales: **puntos obtenidos** (con el ícono de monedas apiladas
  `PlayCoinStackIcon`), **escenas jugadas** (n/total) y **tiempo** transcurrido
  (m:ss). Los datos salen de `useGameState` (`points`, `completedCount`,
  `totalScenes`, `startedAt`).
- **Una sola acción, centrada**: **¡Hasta pronto!** (verde, principal — emite
  `complete` y el runner **cierra el storyboard de inmediato**: sin sheet de
  completado, sin modal; en Educators será `storyboard:complete` vía bridge).
  Reiniciar el taller NO vive aquí: está en el panel del docente / Configuración.
  Espaciado generoso: las tarjetas respiran respecto al texto y el botón respecto
  a las tarjetas (~30px).
- La escena de resumen **no otorga puntos** (`pointsOnComplete: 0`): muestra las
  recompensas, no las infla.

## 20. Un storyboard enseña SOLO el objetivo de su tipo

Cada tipo de storyboard tiene un **contrato pedagógico** (`docs/storyboards.md`):
mensaje, objetivo, protagonista, ejes y fronteras. Todo dato educativo del
storyboard (Tarjeta de Saber, instrucción, quiz) habla del **protagonista de SU
tipo**; el contenido de otro tipo no entra ni "de paso":

- Un taller de salud emocional NUNCA enseña nutrientes — el alimento es el
  detonante de la emoción, no la materia.
- Un taller de alimentación NUNCA gestiona lo que el niño siente frente al
  alimento — enseña el alimento.
- La respiración en actividad física es recuperación FÍSICA; como estrategia
  emocional pertenece a salud emocional.

Los ejes del tipo son **preguntas que cada tema responde a su manera, no
contenidos fijos**: no todo alimento se cocina (una fruta se lava o se elige
madura); no toda actividad física usa las piernas. Forzar sobre un tema un eje
que no le aplica — o copiar las respuestas del storyboard de referencia — es un
error de diseño.

Antes de diseñar un storyboard nuevo: el protocolo de creación en
`docs/storyboards.md` (Cómo se crea un storyboard nuevo).

## Apéndice: experiencia del niño (futura)

El runner actual es del EDUCADOR. La experiencia individual del niño será un
runner/app propio; estas decisiones de diseño, probadas en el modo kid retirado
(historial git, tarea 025), son su punto de partida:

- **Nudge de instrucciones**: el botón de audio llama la atención (wiggle +
  anillo radiante) al cargar cada escena y se calma al presionarlo — un no-lector
  no tiene otra forma de saber dónde viven las indicaciones.
- **Auto-narración del saber + gating**: la Tarjeta de Saber se narra sola al
  revelarse y, mientras suena, la escena deshabilita su acción principal (prop
  `narrating`) — el dato aterriza garantizado, sin tapar la pantalla.
- **Completado con celebración**: sheet verde (`celebrate`) con título rotativo,
  logro (`meta.completionFeedback`) + puntos ganados, y dos acciones SIEMPRE:
  **Repetir** (azul) y **Seguir** (verde) — la única salida de la escena.
- **Navegación dosificada**: solo revisitar escenas ya vistas, nunca saltar
  adelante (el flujo es la lección); candados en la lista de escenas.
- **Confirmación de salida hablada**: el modal de salir se auto-anuncia al abrir.
- **La bienvenida no puede autonarrar** (los navegadores bloquean el autoplay sin
  gesto previo): su anuncio completo va en `meta.instruction` y el nudge invita a
  tocar el botón que sí suena.
