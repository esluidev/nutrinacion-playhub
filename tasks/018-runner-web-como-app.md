---
id: 018
estado: haciendo
prioridad: alta
creada: 2026-11-09
---
# El runner web, completo de una vez y con sensación de app

## Objetivo

Que el runner web se sienta lo más nativo posible, también en una tableta modesta. Luis lo decidió tras comparar en sus tabletas la web con la prueba de Flutter ([tarea 017](017-runner-en-flutter.md)): la web es más fluida en la modesta, pero delata que es una página porque «algunos elementos tardan más que otros en renderizarse».

## Alcance

Decisiones de Luis (2026-11-09):

- El camino es la web, no Flutter ni apps nativas (sin tiendas).
- Las apps las levanta él. Una copia de producción del Player en otro puerto también: se le propone, no se levanta.

Entra el runner de Player (`apps/player/app/runner/`) y los efectos de pasar el cursor del kit. Queda para después Educators instalable (ver pendientes).

## Criterios de aceptación

- [x] Cada escena aparece completa, de una vez: el marco, la letra, los dibujos y el personaje.
- [x] «Siguiente» muestra la escena que viene ya completa.
- [x] El huevo y la mano se mueven solo con transformaciones, y el huevo queda en los mismos píxeles que antes.
- [x] Ningún efecto de pasar el cursor se queda pegado en una pantalla táctil.
- [x] Las piezas se mueven con física: al soltarlas siguen con la velocidad del dedo, llegan a su sitio con un resorte que se puede interrumpir, y suben y se posan poco a poco.
- [x] Una pieza que cambia de sitio (la ficha de Colocar) se mueve solo con transformaciones.
- [x] Con el tablero en pausa, también las piezas, los vuelos y las esperas se quedan quietos y siguen al volver.
- [x] En Origen se puede agarrar cualquiera de los huevos que esperan en el nido.
- [x] Las acciones y la respuesta del juego suenan, con un sonido por acción, igual en todos los juegos.
- [x] El motor es general y está documentado ([`docs/motor.md`](../docs/motor.md)): un juego nuevo hereda el tiempo, el movimiento, las zonas, la física libre, el sonido y la vibración.
- [ ] Luis lo confirma en la tableta modesta, con el Player compilado para producción.

## Pasos

- [x] Medir la carga en producción y revisar el marco y las cuatro plantillas.
- [x] Carga previa de cada escena (`preload.ts`) y regla de cuándo se muestra (`useSceneLoad.ts`).
- [x] El marco entra entero; la escena siguiente se monta por adelantado; `listo` sale cuando hay algo completo que ver.
- [x] Huevo, agarre y mano con transformaciones; imágenes con `decoding="sync"`.
- [x] `:hover` solo con cursor (runner y kit); estado pulsado en iOS; pantalla encendida durante el taller.
- [x] Los dibujos de la librería viajan dentro del código; Supabase ya no viaja con el runner.
- [x] El motor del tablero (`app/runner/engine/`): un reloj único, el resorte exacto, la velocidad del dedo, la vibración y el medidor de `?medir=1`; `useDrag` sobre él, con `shift` para cambiar de sitio.
- [ ] Medir por partes la primera carga (el motor de Rive) y reducirla.
- [ ] QA de Luis en la tableta.

## Pendientes y siguiente paso

- **Probar en la tableta con el build de producción.** El 3001 es el servidor de desarrollo: carga el código a trozos, y parte del «aparece por partes» venía de ahí. El build ya está hecho (`apps/player/.output`). Lo levanta Luis: `npm --prefix apps/player run preview -- --port 3005 --host 0.0.0.0`, y en la tableta `http://192.168.101.2:3005/play/alimentacion/el-huevo?mode=educator&escena=origen`.
- **La primera carga en un dispositivo.** Con todo en caché el marco aparece entero a los 0,4 s (medido). La primera vez tardó unos 3 s en este Mac: ahora se espera al motor de Rive (2,1 MB de wasm) antes de enseñar nada, donde antes se veía el marco al momento y la gallina llegaba después. Falta medir qué parte pesa (hay marcas `playhub:*` en `performance`) y decidir con Luis si lo primero debe esperar al personaje o entrar sin él cuando tarda. Un service worker lo dejaría instantáneo desde la segunda vez ([tarea 013](013-runner-en-el-aula.md)).
- **Cambia el comportamiento, a confirmar por Luis:** con una pausa, un panel o una ventana abiertos, los personajes de Rive y lo que late o respira se quedan quietos. Al reiniciar una escena con personaje, el tablero parpadea un instante mientras vuelve a estar completo.
- **Probar el motor en la tableta, con números:** añadir `&medir=1` a la URL del runner. Arriba salen los cuadros por segundo, los perdidos, el cuadro más largo y lo que tarda un toque en llegar al cuadro. Con eso se decide lo siguiente, que no está hecho porque no hay medida que lo pida: los vuelos con guion (el huevo hacia la tarjeta) llevados por el navegador para que no dependan del código, y bajar el gasto de Rive mientras se arrastra.
- **Oír los sonidos y ajustarlos.** Los catorce sonidos los genera ahora el motor, sin archivos, diseñados por cómo suena cada material y medidos, pero sin oírlos. Luis decide de oído: con `&sonidos=1` en la URL del runner sale un panel para oír cada uno y ver el nombre del último que sonó. La tabla está en [`docs/motor.md`](../docs/motor.md), «Qué suena».
- **Física libre** (caer, rebotar, chocar): está en el motor y probada con pruebas; ninguna escena la usa todavía.
- **La skill `playhub-storyboard-games`** recoge el motor y los sonidos generados en `estructura.md`; el zip está regenerado y falta que Luis lo suba a claude.ai.
- **La vibración** (8 ms al agarrar, 14 ms al soltar sobre una zona) solo existe en Android con motor de vibración. A confirmar por Luis si la quiere; se apaga desde el medidor para comparar.
- **Sin tocar:** el desenfoque de fondo de las ventanas; cada personaje de Rive tiene su propio contexto gráfico.
- **Después:** Educators instalable y con el mismo cuidado al tocar (campos a 14 px que hacen zoom en iPhone, arranque que espera a la red). Era lo acordado antes de la prueba de Flutter.

## Log

- **2026-11-09, noche. Medición y causa:**
  - Con el Player compilado para producción, la primera carga llegaba en este orden: el marco, la letra (60 ms), los dibujos (70 ms), el código de Rive (76 ms) y su wasm (162 ms); la gallina, después. En una tableta esos pasos se estiran y se ven.
  - El runner descargaba también el cliente de Supabase (209 KB), que no usa: lo importaba el middleware global.
- **2026-11-09, noche. Cambios:**
  - `preload.ts`: deja lista una escena (dibujos decodificados, motor de Rive arrancado, sus `.riv` y su `scene.vue`). `useSceneLoad.ts`: la escena se muestra cuando sus personajes ya pintaron; 8 pruebas.
  - `RunnerFrame.vue`: el marco no enseña nada hasta tener lo primero y entra entero con un fundido de 220 ms; si tarda más de 600 ms, la carga del kit; tope de 10 s. La escena siguiente se monta por adelantado, oculta y en pausa. `listo` sale al aparecer el marco, antes de la primera `escena` (`docs/runner.md`). Pantalla encendida (`wakeLock`) y escucha de toques para el estado pulsado en iOS.
  - `RiveCharacter.vue`: retiene su escena hasta pintar, `paused` y `data-loaded`. El ave de Destapar entra cuando ya está pintada.
  - `TemplateHistoria.vue` y `DemoHand.vue`: el huevo (en una caja con `will-change`), su agarre y la mano se mueven con `transform`; antes, con `left`, `top`, `width` y `height` en cada cuadro.
  - `runner.css` y `packages/ui/css/components.css`: los efectos de `:hover` van dentro de `@media (hover: hover)`. Un tablero en pausa detiene sus animaciones.
  - `nuxt.config.ts`: los SVG de la librería van dentro del código. `sesion.global.ts`: la sesión se importa solo fuera de `/play`.
- **2026-11-09, noche. Verificación:**
  - En `apps/player`: `npm run typecheck`, 0 errores; `npx vitest run`, 84 aprobadas (76 más 8 nuevas); `npm run build`, aprobado. En la raíz: `node scripts/check-ui.mjs` y `node scripts/check-context.mjs`, aprobados.
  - En el navegador (Chromium, ratón, 1280 × 800), con el 3001: las cuatro escenas. Origen entera (tocar, arrastrar, los dos huevos, chispas), «Siguiente» a Descubrimiento completa a los 150 ms, dos aves destapadas, Preparación con arrastre y toque hasta el acierto.
  - El huevo, igual al píxel que antes del cambio: `[861.6, 226.7, 86.5, 101.2]` en la tienda y `[334.4, 505.3, 115.9, 124.7]` en el nido.
  - Arrastre, 300 movimientos simulados: de 0,157 ms de cálculo y 0,068 ms de layout por movimiento a 0,027 y 0,018; ya solo se escribe una transformación por pieza.
  - En producción, con todo en caché: el marco aparece entero a los 388 ms; ningún SVG se pide aparte.
  - No verificado: dispositivos táctiles, Safari, Educators con el runner dentro (`listo` al aparecer), la vista previa de Admin y el modo dispositivo. La medición por partes de la primera carga quedó a medias: Luis pidió detener la copia de producción del 3005.
  - Sin commit.
- **2026-11-10. El motor del tablero** (Luis: «crea una especie de game engine para dar esa sensación de juegos como funcionarían en motores»; Rive se queda):
  - `app/runner/engine/`: `ticker.ts` (un solo bucle de cuadros, que solo corre mientras algo se mueve y sigue por temporizador si no se pintan cuadros), `spring.ts` (resorte con paso exacto y nombres: `settle`, `lift`), `velocity.ts` (velocidad del dedo por mínimos cuadrados sobre 100 ms), `haptics.ts`, `settings.ts` y `meter.ts` (`?medir=1`).
  - `useDrag.ts`, reescrito sobre el motor: la pieza sigue con la velocidad del dedo al soltarla (sobre una zona válida, solo con el 30 %), vuelve con resorte, sube y se posa poco a poco, y cada pieza termina su vuelta aunque se agarre otra. `shift` cambia de casa una pieza sin gesto. La opción `returnMs` pasa a ser `reduced`. `toBoard` pasa a ser `boardPoint` (lee la caja del tablero una vez por evento).
  - `TemplateColocar.vue` y `runner.css`: cada ficha va en una caja (`tb-ficha-caja`) que lleva su posición con una transformación; se fueron las transiciones de `left` y `top`. La inclinación de la bandeja sale de `data-tilt`; la ficha arrastrada se endereza.
  - Documentado en `apps/player/AGENTS.md` (regla nueva: el movimiento de las piezas es física y la pone el motor), `packages/ui/PLAYER-DESIGN.md` («Arrastrar y soltar») y `docs/runner.md` (`medir`).
- **2026-11-10. Error y arreglo: el huevo temblaba al arrastrarlo** (lo vio Luis en Origen). La causa fue la predicción del dedo del navegador (`getPredictedEvents`), que yo había añadido para que la pieza no fuera un paso atrás. Reproducido con un puntero real a paso constante (10 px por cuadro): el huevo avanzaba 21, 10, 6, 12, 8 y 14 px y, al detener el puntero, saltaba 30 px atrás y 27 adelante. Se quitó la predicción (código, ajuste y botón del medidor); con el mismo arrastre, el huevo avanza lo mismo que el puntero en cada cuadro y no se mueve con el puntero quieto.
- **2026-11-10. Verificación:**
  - En `apps/player`: `npm run typecheck`, 0 errores; `npx vitest run`, 104 aprobadas (84 más 20 nuevas: el resorte, la velocidad, el reloj y el arrastre con física); `npm run build`, aprobado. En la raíz: `check-ui.mjs` y `check-context.mjs`, aprobados.
  - En el navegador (Chromium, ratón, contra el 3001): Preparación, un toque lleva la ficha de (376, 328) a su hueco (340, 32) en unos 0,35 s y lo cubre exacto; un arrastre al hueco la posa; con el orden mal, las dos vuelven a la vez; con el orden bien, acierto. Origen: soltado fuera, el huevo sigue unos 10 px en la dirección del dedo y vuelve exactamente a (447,083, 454,792) con su tamaño y su giro; soltado en la tienda, salta y se posa como antes.
  - No verificado: nada en un dispositivo táctil (la sensación, la vibración, los números del medidor en la tableta), Safari, movimiento reducido en el navegador, Educators con el runner dentro, la vista previa de Admin y el modo dispositivo.
  - Sin commit.
- **2026-11-10, más tarde. El motor, general y documentado** (Luis: «¿solo lo has hecho para este juego… o ya has incluido todo lo que lleva un motor de juegos común, para que los elementos hereden esas funcionalidades y no las creen, además de documentar todo esto?»). Tenía solo la base. Se añadió:
  - `engine/world.ts`: el tiempo de juego de cada tablero (`useWorld`): `after`, `every`, `tween` y `onFrame`; en pausa no corre. `animate` y `useAnimation` (`board.ts`) y `useDrag` corren en él. Las cuatro plantillas dejaron `setTimeout`, `setInterval`, `requestAnimationFrame` y `useTimers`. La mano que demuestra sigue en tiempo real: al pausar se corta, como antes.
  - `engine/zones.ts`: `zoneAt` (la zona bajo el dedo, con margen; entre dos, la más cercana) y `nearest`. `useDrag` acepta `zones` y `margin` (Historia y Colocar ya no calculan a mano qué tarjeta o hueco queda debajo) y `pieces`: de varias piezas que se pisan se agarra la más cercana al dedo.
  - `engine/physics.ts`: cuerpos redondos con gravedad, bordes, rebote, roce, peso, choques y descanso, en pasos fijos de 1/120 s; `simulate` los pone a andar en un mundo.
  - `engine/sound.ts`: efectos desde `content/library/sfx/` (`librarySfx` en `content.ts`; se cargan con la escena en `preload.ts`), con variación de tono y respetando el silencio.
  - `docs/motor.md`: la referencia (qué hereda una pieza, las partes, cómo se usa, las reglas, qué está probado y qué no tiene). Enlazada desde `docs/README.md`, `apps/player/AGENTS.md` y la skill.
- **2026-11-10, más tarde. Origen: cualquier huevo del nido** (Luis: «no me gusta que no puedes arrastrar el huevo que quieras, siempre tiene que ser el mismo»). Mientras ninguno ha salido, se agarra cualquiera de los que esperan (el más cercano al dedo); el que ya salió termina su camino antes de que salga otro, para que ningún recorrido quede sin huevo. Al tocar una tarjeta vuela el que va de camino o, si ninguno salió, el de siempre. Documentado en `PLAYER-DESIGN.md` (Historia).
- **2026-11-10, más tarde. Verificación:**
  - En `apps/player`: `npm run typecheck`, 0 errores; `npx vitest run`, 124 aprobadas (40 del motor y del arrastre son de hoy); `npm run build`, aprobado. En la raíz: `check-ui.mjs` y `check-context.mjs`, aprobados.
  - En el navegador (Chromium, contra el 3001), con un arrastre de puntero real: en Origen, apoyando a la izquierda del nido se lleva el huevo de la izquierda y el otro no se mueve; soltado en la tienda, llega y queda un solo agarre (el suyo); tocando la casa, sigue hasta ella y el otro huevo queda agarrable.
  - Pausa en pleno vuelo (tecla P): el huevo se queda en (477, 395) dos segundos, no sale la hoja, y al volver sigue hasta la tienda.
  - Preparación (orden mal: las dos vuelven; orden bien: acierto), Descubrimiento (destapar una) y Bienvenida (el salto empieza y termina): sin errores.
  - No verificado: nada en una pantalla táctil ni en Safari; el sonido (no hay archivos); la física libre en una escena; la vibración; movimiento reducido en el navegador; Educators con el runner dentro, la vista previa de Admin y el modo dispositivo.
  - Sin commit.
- **2026-11-10, tarde. Sonido en las acciones** (Luis: «en mi carpeta de proyecto sounds tengo una gran cantidad de sonidos y efectos… revisa los audios y mira cómo usarlos en el motor de juegos»):
  - Revisados los 281 MP3 de `../sounds/` (`impact` 131, `interface` 101, `ui` 52; 44,1 kHz, estéreo, 1,8 MB en total): duración, volumen, brillo y si el tono sube o baja, de cada uno.
  - Diez acciones con un sonido cada una, copiados sin recodificar a `apps/player/content/library/sfx/` con el nombre de la acción (39 KB): `agarrar`, `soltar`, `volver`, `tocar`, `volar`, `destapar`, `aviso`, `acierto`, `reintento` y `completar`. Su origen, en `docs/motor.md`.
  - `engine/sound.ts`: `SOUNDS` (el volumen de cada uno, calculado de su medición para que queden parejos, entre 0,20 y 0,52, y cuánto varía su tono), el recorte del silencio inicial y `cueSound` (de las respuestas pedidas a la vez suena la que más pesa). Se cargan con la primera escena.
  - Quién los pide: `useDrag` (agarrar, soltar, volver, tocar, y al llegar con `shift(…, { arrive })`), Historia (volar y soltar al posarse tras un toque), Destapar (destapar, tocar), Anuncio (tocar), Colocar (soltar al llegar) y el marco (aviso, acierto, reintento, completar).
  - Verificación: `npm run typecheck`, 0 errores; `npx vitest run`, 128 aprobadas; `npm run build`, aprobado (cinco sonidos van como archivo y cinco dentro del código); `check-ui.mjs` y `check-context.mjs`, aprobados. En el navegador (Chromium, contra el 3001), anotando cada sonido que se dispara: Origen (arrastre a la tienda: agarrar, soltar, aviso; toque en la casa: volar, soltar al posarse a 1,1 s, acierto; soltado fuera: agarrar, volver; toque al huevo: tocar), Preparación (orden mal: tocar, soltar, tocar, soltar, reintento; orden bien: …, completar, sin acierto encima), Descubrimiento (destapar y acierto; el último, destapar y completar; repetir: tocar y aviso) y Bienvenida (tocar). Con el runner en silencio no se dispara ninguno.
  - No verificado: cómo suenan (no se pueden oír desde aquí: ni si cada uno es el adecuado ni el volumen frente a la voz), en un dispositivo táctil, en Safari y dentro de Educators.
  - Sin commit.
- **2026-11-10, tarde. Los sonidos de archivo, descartados; el motor los genera** (Luis: «los sonidos que escogiste son raros para acciones como tomar y soltar… para mostrar las aves son sonidos como de juegos espaciales, nada que ver con nuestro contexto y tampoco has agregado sonidos a interacciones con elementos del UI. Si los sonidos no son buenos entonces genera unos mediante el motor sin archivos de audio»):
  - Fuera los diez MP3 de `content/library/sfx/` (queda vacía). `engine/sound.ts` genera cada sonido con una receta (`SOUNDS`), de tres materiales: madera (`knock`: pulsar, tocar, agarrar, soltar), aire (`breath`: volver, volar, abrir, cerrar, pasar) y marimba (`mallet`: aviso, acierto, reintento, destapar, completar). Sin barridos de tono, ondas cuadradas ni ecos. `renderSound` saca las muestras de un sonido para medirlo; `onSound` avisa de cada uno que suena.
  - Interfaz: el marco hace sonar `pulsar` al apoyar el dedo en cualquier botón que no sea del tablero, `abrir` y `cerrar` con los paneles y las ventanas, y `pasar` al cambiar de escena. Destapar: el toque suena siempre y, al descubrir, `destapar` (le gana al acierto que llega con él).
  - Panel de sonidos (`?sonidos=1`, en `engine/meter.ts`): un botón por sonido y el nombre del último que sonó.
  - Cambia una regla de la skill: `estructura.md` decía que los sonidos sintetizados ya no existían y que los efectos eran archivos de `library/sfx`. Ahora los de las acciones los genera el motor y `library/sfx` queda para una grabación propia de una escena (con grupos, `ui/click2`, como dice la skill).
  - Medido en el navegador con `renderSound`, dos pasadas. En la primera los soplos salían unos 15 dB por debajo de la madera y dos sonidos juntos podían saturar: se compensó el ruido filtrado, se bajó el volumen general a 0,7 y la madera pasó de una nota pura a un taco con su parcial propio. En la segunda: duran de 19 a 636 ms; picos de −14 a −6 dB; la madera y la marimba, sin energía por encima de 4 kHz y con su tono donde se diseñó (agarrar 641 Hz, soltar 211, acierto 783, completar 1.047).
  - Verificación: `npm run typecheck`, 0 errores; `npx vitest run`, 130 aprobadas; `npm run build`, aprobado, sin ningún MP3; `check-ui.mjs` y `check-context.mjs`, aprobados. En el navegador (Chromium, contra el 3001), con el aviso de cada sonido: Origen (agarrar, soltar, aviso), la interfaz (cerrar la hoja: pulsar; abrir la guía: pulsar, abrir; Escape: cerrar; Siguiente: pulsar, pasar) y Descubrimiento (tocar y destapar; el último, tocar y completar; repetir: tocar y aviso).
  - No verificado: cómo suenan (no se pueden oír desde aquí), en un dispositivo táctil, en Safari y dentro de Educators.
  - Sin commit.
- **2026-11-10, tarde. La interfaz, con su propio sonido, y una vez por interacción** (Luis: «hay 2 sonidos que se repiten demasiado: el de presionar un botón, que prácticamente es el mismo para presionar o comenzar a arrastrar cualquier elemento; los controles de UI deben tener sonidos distintos a los elementos del juego… el otro es la transición entre escenas, es el mismo para desplegar los controles como dropdowns»):
  - Causa: `pulsar`, `tocar` y `agarrar` eran el mismo taco de madera a 540, 760 y 640 Hz; `abrir`, `cerrar`, `pasar` y `volar` eran el mismo soplo.
  - Cuarto material, papel (`tick`: un toque seco y sin tono), solo para la interfaz: `pulsar` (un toque), `abrir` (dos, el segundo más claro) y `cerrar` (al revés). `pasar` es ahora un soplo grave de 0,3 s con un golpe grave al caer; `volar`, un soplo ligero y claro.
  - Una vez por interacción: `pulsar` pasó del apoyo del dedo al clic, y `cueInterface` junta lo pedido en 30 ms y hace sonar lo que más pesa (pulsar, cerrar, abrir, pasar). `cueSound` y `cueInterface` salen de la misma `createCue`.
  - Medido con `renderSound`: `pulsar` 10 ms y pico −14 dB (los de madera, 27 a 69 ms, con su tono en 760, 641 y 211 Hz); `abrir` y `cerrar`, 60 ms; `pasar`, 287 ms con su pico de espectro en 121 Hz; `volar`, 140 ms.
  - Verificación: `npm run typecheck`, 0 errores; `npx vitest run`, 133 aprobadas (tres nuevas: los controles no llevan tono y las piezas sí; pasar no se parece a desplegar; una interacción suena una vez); `npm run build`, aprobado; `check-ui.mjs` y `check-context.mjs`, aprobados. En el navegador (Chromium, contra el 3001), con el aviso de cada sonido: arrastrar a la tienda (agarrar, soltar, aviso), cerrar la hoja (pulsar), abrir la guía (solo abrir), Escape (cerrar), desplegar la lista de escenas (solo abrir), recogerla (cerrar) y Siguiente (solo pasar).
  - No verificado: cómo suenan (no se pueden oír desde aquí), en un dispositivo táctil, en Safari y dentro de Educators.
  - Sin commit.
- **2026-11-10, tarde. Los sonidos, por patrones de juego** (Luis: «ese sonido de marimba al tomar un objeto para arrastrarlo y ese de las transiciones son raros. El de la transición me parece que se puede utilizar cuando vas a descubrir una carta… también el sonido para mostrar el panel de feedback es raro y demasiado pobre. Vamos, aplica patrones de juegos para determinar los sonidos»):
  - Las recetas dejaron de salir de «materiales» y salen de patrones: el tono sigue al gesto, lo que va bien sube, una familia un timbre, capas, la racha se oye, descubrir es voltear una carta, nunca dos veces igual y una interacción suena una vez.
  - Piezas, ahora burbujas (`bubble`): `agarrar` es un «pop» que sube (300 a 620 Hz); `soltar`, un «plop» que baja (440 a 170 Hz); `tocar`, un «boing» que sube.
  - `destapar` es el sonido que tenía la transición (el soplo grave con su golpe al caer), como propuso Luis, y lo pide Destapar al descubrir. `pasar` es ahora un soplo que crece y se va, sin golpe.
  - La hoja, en capas: el soplo con que sube y campanas de caja de música (`bell`: la nota, su octava, su quinta y un brillo). `aviso`, dos campanas (sol, re); `acierto`, tres que suben y un brillo; `reintento`, dos notas de madera graves que bajan; `completar`, el acorde entero que se queda sonando, con su chispa.
  - La racha: el marco hace sonar cada acierto seguido de la escena un paso más arriba en la escala mayor (`SCALE`); la cortan un «otra vez», pasar de escena y reiniciarla. `cueSound` y `cueInterface` llevan ahora las opciones del sonido que gana.
  - Un limitador en la salida, para que dos sonidos juntos no saturen; `onSound` avisa también del tono.
  - Medido con `renderSound`: piezas de 40 a 84 ms; respuestas de 433 a 706 ms; `pasar`, `destapar` y `completar` salían con picos de −3 a −5 dB y se bajaron a −10, −9 y −6.
  - Verificación: `npm run typecheck`, 0 errores; `npx vitest run`, 137 aprobadas (las del sonido, reescritas: el tono sigue al gesto, las respuestas suben o bajan, la hoja tiene capas, la racha sube por la escala); `npm run build`, aprobado; `check-ui.mjs` y `check-context.mjs`, aprobados. En el navegador (Chromium, contra el 3001), con el aviso de cada sonido: Descubrimiento (destapar y acierto; destapar y acierto un paso más arriba, ×1,13; repetir: tocar y aviso; la última: destapar y completar) y Origen (tocar; agarrar y volver; agarrar, soltar y acierto; volar, soltar al posarse y aviso).
  - No verificado: cómo suenan (no se pueden oír desde aquí), en un dispositivo táctil, en Safari y dentro de Educators.
  - Sin commit.
- **2026-11-10, tarde. Fuera el sonido de pasar de escena** (Luis: «quita el sonido de la transición de escenas, está mal hecho e implementado»). Se quitó la receta `pasar` de `SOUNDS`, la llamada del marco al cambiar de escena (`show`) y su lugar en `cueInterface`. «Siguiente» suena como cualquier botón (`pulsar`) y con las teclas no suena nada. Verificación: `npm run typecheck`, 0 errores; `npx vitest run`, 137 aprobadas (una comprueba que `pasar` no existe); `npm run build`, aprobado; `check-ui.mjs` y `check-context.mjs`, aprobados. En el navegador: el motor tiene trece sonidos; «Siguiente» dispara solo `pulsar` y la escena cambia; con las flechas, ninguno. Sin commit.
- **2026-11-10, tarde. Prueba: «Siguiente» en rojo** (Luis: «pon el botón siguiente del danger/rojo que tiene el UI kit para probar… ese botón de siguiente en el color verde, aunque es el primario, pasa súper desapercibido y es un color que no encaja con el resto del UI, al menos en el runner»). `tone="danger"` en el botón del pie; el mismo botón dice «Terminar» en la última escena. Medido en el navegador, el relleno de cada tono del kit contra el escenario: lima 1,59 a 1; sol 1,57; cielo (el de «Guía») 1,98; uva 2,46; coral 2,48; peligro 6,26; noche 11,72. El lima es, con el sol, el tono que menos se separa del escenario, y «Guía» se ve más que la acción principal; los dos botones miden lo mismo (44 de alto en el diseño). `npm run typecheck`, 0 errores. Sin commit.
- **2026-11-10, tarde. Corrección de la prueba: `danger` no es un tono de botón** (Luis: «¿ese rojo es el que está en el UI kit? ¿Estás reutilizando el botón? Porque no parece: tiene un estilo plano y sin la ceja inferior»). Sí era el `UiButton` del kit y un color del kit (`--color-danger`), pero `danger` es un tono de estado, el de los avisos (`UiAlert`): su cara y su borde son el mismo color, así que la ceja del botón no se ve y queda plano. El rojo de los botones del kit es `coral` (el de `UiConfirmDialog`). Cambiado a `tone="coral"`: cara `#ff8055`, ceja `#d75938` de 4, igual de alta que la de «Guía». Contra el escenario, el coral se separa 2,48 a 1 (el lima, 1,59; el de peligro, 6,26). Sin commit.
- **2026-11-10, tarde. «Siguiente», en cielo como «Guía»** (Luis, tras ver el coral: «siendo honesto creo que para siguiente yo usaría el mismo info del de la guía, para mantener un equilibrio similar a como están arriba los elementos en blanco»). `tone="sky"` en el botón del pie (`RunnerFrame.vue`); ya no es una prueba. `PLAYER-DESIGN.md` lo recoge: el pie queda en equilibrio, dos botones iguales, como arriba dos elementos blancos; el cielo es «lo próximo» en el kit, y el lima queda en el runner para lo correcto y lo completado. Comprobado en el navegador: los dos botones tienen la misma cara (`#46c6f2`), la misma ceja (`#279bc3`), el mismo tamaño y los mismos márgenes. `npm run typecheck`, 0 errores; `npx vitest run`, 137 aprobadas; `npm run build`, aprobado; `check-ui.mjs` y `check-context.mjs`, aprobados. Sin commit.
- **2026-11-10, tarde. La hoja de feedback, con más color y entrada con carácter** (Luis: «lo que sí creo que falta es personalidad a la hoja de feedback… siendo colores suaves no se notan tanto cuando deben llamar la atención al momento que aparecen»; tras el análisis: «sí, aplica la parte de carácter, pero creo que se necesita un poco más de color… piensa en cómo lo hace Duolingo, ya que es el mismo patrón»):
  - Análisis, con medidas y solo con el kit actual (Luis: las láminas `references/design-ui-*.png` «no son parte del UI kit actual»): la hoja se separaba del escenario 1,16 a 1 en el aviso y 1,08 en el acierto y el «otra vez»; el símbolo, 1,15 de la hoja; la entrada era solo subir en 0,3 s, y la clase `is-entering` que el marco pone con cada hoja no tenía estilos.
  - Color (`runner.css`): el fondo pasa del 100 al 200 del tono (`--tone-tint-edge`); el texto del cuerpo, de gris al tono en fuerte, como el título; el símbolo, de un recuadro pálido a un punto sólido (`--tone-fill` con el icono en `--tone-on`).
  - Entrada: la hoja sube con un rebote corto (se pasa unos 5 de su sitio y vuelve; se alarga 24 por debajo de la pantalla para que no se vea el escenario); el símbolo salta a los 300 ms y el texto llega a los 360. El del acierto salta hasta 1,22 de su tamaño y se ladea; el icono del «otra vez» da una vuelta; el del aviso solo salta. Con movimiento reducido, sin gestos.
  - `PLAYER-DESIGN.md` recoge la hoja nueva.
  - Verificación: `npx vitest run`, 137 aprobadas; `npm run build`, aprobado; `check-ui.mjs` y `check-context.mjs`, aprobados. En el navegador (Chromium, contra el 3001), las tres hojas en pantalla: fondo `#b6e1f4`, `#ffe1a0` y `#d8eaae`; contra el escenario, 1,34, 1,22 y 1,24; el título y el texto contra la hoja, 4,8 a 1 en el acierto; el icono contra su símbolo, 7,9. La entrada se leyó instante a instante con las animaciones del navegador, porque el panel estaba en segundo plano y no pinta cuadros: la hoja pasa por −3,6 y −5,3 antes de asentarse y el símbolo por 1,06 (aviso y «otra vez») y 1,22 (acierto).
  - No verificado: verla moverse de corrido, en un dispositivo táctil, en Safari y con movimiento reducido.
  - Sin commit.
