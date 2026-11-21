# El motor del tablero

Lo que hace que un juego del runner se sienta como un juego y no como una página: el tiempo, el movimiento, el toque y la respuesta. Vive en [`apps/player/app/runner/engine/`](../apps/player/app/runner/engine/) y lo usan todas las plantillas. Un juego nuevo no escribe nada de esto: lo pide.

No es un motor gráfico. Los dibujos son los SVG de la librería, los personajes son de Rive y la pantalla la pinta el navegador; el motor decide **dónde está cada cosa en cada cuadro** y lo escribe como una transformación. Esa combinación es la que fue más fluida en la tableta modesta ([tarea 018](../tasks/018-runner-web-como-app.md)).

## Qué hereda una pieza

Una plantilla declara sus piezas con `useDrag` y dice qué se agarra, dónde descansa cada una (`home`), en qué zonas se puede soltar (`zones`) y qué pasa al soltar (`drop`). Sin escribir nada más, cada pieza:

| Hace | Cómo se nota |
|---|---|
| Sigue al dedo | Va exactamente donde está el dedo, un dedo a la vez |
| Sube y se posa poco a poco | Al arrastrarla se levanta sobre el dedo; al soltarla, baja |
| Sigue con el impulso | Al soltarla continúa un momento con la velocidad del dedo y frena hasta su sitio |
| Se posa en su zona | Sobre una zona válida conserva solo parte del impulso, para no pasarse |
| Se deja interrumpir | Se puede volver a agarrar en pleno vuelo; cada pieza termina su vuelta aunque se agarre otra |
| Cambia de sitio sin saltar | Con `drag.shift`, un toque la manda a otro sitio y llega con el mismo resorte |
| Encuentra su zona | La zona bajo el dedo, con un margen de imán; entre dos, la más cercana |
| Vuelve si la zona no la quiere | Una zona puede no aceptar la pieza (`accepts`: un lugar que no es el suyo): suena y vuelve como al soltarla fuera, y la plantilla lo recibe en `drop` para responder |
| Se elige bien entre varias | Si las piezas se pisan (`pieces`), se agarra la más cercana al dedo, no la que quedó encima |
| Suena | Al agarrarla, al soltarla en una zona, al soltarla fuera, al tocarla y, si se pide, al llegar a su sitio nuevo |
| Vibra | Al agarrarla y al soltarla en una zona, donde el dispositivo vibra |
| Se queda quieta en pausa | Con el tablero en pausa no avanza; al volver sigue desde donde estaba |
| Respeta el movimiento reducido | Todo llega de una vez |

## Mantener el dedo, cocer y temblar

Para lo que tarda (cocinar, llenar, sostener), una plantilla declara el gesto con `useHold` y dice sobre qué se puede mantener el dedo, qué avanza mientras sigue ahí (`tick`) y qué pasa al terminar (`end`). Sin escribir nada más:

| Hace | Cómo se nota |
|---|---|
| Un dedo a la vez | Mientras se mantiene una pieza, otro dedo o la palma no empiezan otra |
| Cuenta en tiempo de juego | `tick` llega en cada cuadro con lo que avanzó; con el tablero en pausa no avanza nada |
| Distingue soltar de cortarse | Levantar el dedo es una decisión (`released`); un gesto que corta el sistema, o la escena al bloquearse, no lo es: solo deja de avanzar |
| Sirve con el teclado | Mantener Espacio o Intro sobre la pieza es mantener el dedo |
| No abre el menú del sistema | Mantener pulsado no saca el menú ni selecciona nada |
| Vibra | Al apoyar el dedo, donde el dispositivo vibra |

Dos piezas lo acompañan:

- **El sonido que dura lo que dura el gesto** (`createSustain`, en `sound.ts`): no es una nota larga, son granos del mismo sonido, cada vez más seguidos y más agudos conforme lo que se hace se acerca al final. La plantilla lo avanza dentro de su `tick`, así que en pausa calla.
- **El temblor** (`createWobble`, en `wobble.ts`): algo blando recibe un empujón y vuelve a su forma pasándose y volviendo, con el resorte `SPRINGS.jelly`. Un empujón sobre otro se suma. La plantilla recibe en cada cuadro cuánto se aparta y lo dibuja con una transformación.

El motor no decide cuánto dura ni cuándo está listo: eso es del juego.

## Las partes

| Parte | Archivo | Qué da |
|---|---|---|
| Reloj | `ticker.ts` | Un solo bucle de cuadros para todo. Solo corre mientras algo se mueve y, si el navegador deja de pintar, sigue por temporizador: nada se queda a medias |
| Tiempo de juego | `world.ts` | El reloj de un tablero (`useWorld`): `after`, `every`, `tween` y `onFrame`. En pausa no corre. `realTime` es el que nunca se pausa |
| Resorte | `spring.ts` | Llegar a un sitio partiendo de la velocidad que ya se lleva. Paso exacto, con nombre: `SPRINGS.settle`, `SPRINGS.lift` y `SPRINGS.jelly` |
| Temblor | `wobble.ts` | `createWobble`: lo blando que recibe un empujón y vuelve a su forma (un líquido, algo que se mece) |
| Velocidad del dedo | `velocity.ts` | La de los últimos 100 ms, sin que una muestra con ruido la dispare; cero si el dedo ya estaba quieto |
| Zonas | `zones.ts` | `zoneAt` (dónde cae lo que se suelta) y `nearest` (qué pieza se agarra) |
| Física libre | `physics.ts` | Cuerpos redondos que caen, ruedan, rebotan y chocan: gravedad, bordes, roce, peso, descanso. `simulate` los pone a andar en un mundo |
| Sonido | `sound.ts` | Un sonido por acción (`SOUNDS`), generado por el motor, sin archivos: `playSound`. La respuesta del juego, con `cueSound`: de las pedidas a la vez suena solo la que más pesa. Lo que dura un gesto, con `createSustain`. Respeta el silencio |
| Vibración | `haptics.ts` | Una vibración muy corta al agarrar y al soltar en una zona (Android) |
| Medidor | `meter.ts` | Con `?medir=1`: cuadros por segundo, cuadros perdidos, el cuadro más largo y lo que tarda un toque en verse |

Sobre el motor, en `app/runner/`: las piezas (`useDrag.ts`), mantener el dedo (`useHold.ts`), las animaciones con guion por un camino (`animate` y `useAnimation`, en `board.ts`), la mano que demuestra (`useDemo.ts`, `DemoHand.vue`), los personajes de Rive (`RiveCharacter.vue`) y tener lista la escena antes de mostrarla (`preload.ts`).

## Cómo se usa en una plantilla

```ts
const world = useWorld(() => props.blocked)          // el tiempo de juego de esta escena

const drag = useDrag<string, number>({
  layer, world,
  home: id => ({ x: piece(id).x, y: piece(id).y }),  // dónde descansa cada pieza
  zones: () => slots.map((slot, i) => ({ id: i, ...slot })), margin: 60,
  drop: (id, slot) => { if (slot !== null) place(piece(id), slot) },
  tap: id => tap(piece(id)),
  lift: -24, reduced,
})

world.after(700, () => pieces.forEach(back))          // una espera, en tiempo de juego
const flight = useAnimation(world)                     // un vuelo con guion, que también se pausa
```

La plantilla dibuja cada pieza en `home + drag.offsetOf(id)` escribiendo la transformación de su caja (`placeEgg` en Historia, `placePiece` en Colocar), y cambia una pieza de sitio dentro de `drag.shift(id, () => { … })`.

Para algo que cae o rebota: `simulate(world, bodies, { gravity, bounds }, paint)`, con cuerpos de `createBody`.

Para algo que tarda mientras se mantiene el dedo (Estaciones):

```ts
const simmer = createSustain('cocer')                 // suena mientras dura, cada vez más seguido y agudo
const wobble = createWobble(world, x => paint(x))     // lo de dentro tiembla

const hold = useHold<number>({
  world,
  canStart: i => station(i).waiting,
  tick: (i, dt) => { cook(i, dt); simmer.tick(dt, done(i)) },
  end: (i, { released }) => { if (released) (ready(i) ? serve(i) : wobble.kick()) },
})
```

La pieza lleva `v-bind="hold.bind(i)"`.

Para que algo suene: `playSound('soltar')` con una de las acciones del motor (abajo).

## Qué suena

Los sonidos no son archivos: el motor los genera en el momento, cada uno con su receta (`SOUNDS`, en `sound.ts`). Suenan al instante, no pesan y cambiar uno es cambiar sus números. Cada acción tiene un solo sonido, el mismo en todos los juegos.

Qué suena en cada acción lo deciden los patrones de sonido de los juegos:

| Patrón | Qué significa aquí |
|---|---|
| **El tono sigue al gesto** | Lo que sube suena hacia arriba y lo que baja, hacia abajo: tomar una pieza es un «pop» que sube; dejarla, un «plop» que baja y se asienta; un toque que la hace saltar, un «boing» |
| **Lo que va bien sube; lo que no, baja** | Un acierto son campanas hacia arriba. Un «otra vez» son dos notas graves y apagadas hacia abajo, que nunca suenan a castigo |
| **Una familia, un timbre** | De oído se sabe qué pasó: las piezas son burbujas; lo que se mueve, aire; la respuesta del juego, campanas; la interfaz, toques secos sin tono. Un control nunca suena como una pieza |
| **Capas** | Un sonido bueno tiene el golpe del principio, el cuerpo y la cola. La hoja de la respuesta suena a cómo entra (el soplo con que sube) y a lo que dice (sus campanas) |
| **La racha se oye** | Cada acierto seguido en una escena suena un paso más arriba en la escala (`SCALE`), hasta el cierre. Un «otra vez», pasar de escena o reiniciarla la devuelven al principio |
| **Lo que tarda suena mientras dura** | Mantener el dedo no es una nota larga: son burbujas pequeñas, cada vez más seguidas y más agudas conforme se acerca el final. Al llegar, una campanilla de temporizador de cocina |
| **Descubrir es voltear una carta** | El soplo grave de una hoja que gira y su golpe al caer; después llega la hoja con sus campanas |
| **Nunca dos veces igual** | Cada vez cambia un poco el tono (`vary`), para que lo repetido no canse |
| **Una interacción suena una vez** | De lo que se pide a la vez suena lo que más pesa (`cueSound`, `cueInterface`): un acierto que completa la escena suena a escena completa; un botón que despliega algo suena a desplegar, no a las dos cosas |

Nada lleva barridos largos de tono, ondas cuadradas ni ecos, que es lo que suena a juego espacial.

| Acción | Cuándo suena | Quién lo pide | Qué es |
|---|---|---|---|
| `agarrar` | Se toma una pieza | El motor, en toda pieza | Burbuja: un «pop» que sube (300 a 620 Hz en 45 ms) |
| `soltar` | Se deja en una zona válida, o llega a su sitio | El motor al soltar; la plantilla al llegar (`shift` con `arrive`, o al posarse tras un vuelo); Estaciones, al servir; Beber, en cada sorbo; Comer, cuando el alimento elegido con un toque llega a la boca | Burbuja: un «plop» que baja (440 a 170 Hz) y se asienta |
| `tocar` | Un toque sobre una pieza, que la hace saltar | El motor; Destapar (sobre una ya descubierta) y Anuncio; Estaciones, cuando se levanta el dedo antes de tiempo y lo de dentro tiembla; Abrir, en cada toque al entero y a una parte; Beber, sobre el vaso ya lleno; Señalar, al elegir una tarjeta y al tocar una zona del personaje; Comer, al tocar un alimento o su tarjeta y al tocar al personaje sin haber elegido | Burbuja: un «boing» que sube, con su brillo |
| `volver` | Se suelta fuera y vuelve a su sitio | El motor | Aire que baja, corto |
| `volar` | Algo sale volando hacia su sitio | Historia y Estaciones, al tocar una tarjeta; Comer, al darle al personaje el alimento elegido con un toque | Aire rápido que sube |
| `destapar` | Algo se descubre | Destapar; Estaciones, al servir lo que no se veía hecho; Abrir, cuando el entero se abre | La carta que se voltea: un soplo grave y un golpe grave al caer |
| `cocer` | Mientras se mantiene el dedo sobre lo que tarda | Estaciones, con `createSustain`: un grano cada 340 ms al empezar y cada 130 al final, hasta un 60 % más agudo | Burbuja pequeña que sube (520 a 860 Hz), la más baja de todas |
| `listo` | Lo que tardaba quedó hecho | Estaciones | La campanilla de un temporizador de cocina: dos campanas rápidas que suben (do, mi), sin el soplo de la hoja |
| `aviso` | Sale la hoja que explica algo | El marco | El soplo de la hoja y dos campanas, la segunda una quinta más arriba (sol, re) |
| `acierto` | Sale la hoja de un acierto | El marco, un paso más arriba con cada acierto seguido | El soplo de la hoja, tres campanas que suben por el acorde (do, mi, sol) y un brillo |
| `reintento` | Sale la hoja de «otra vez» | El marco | El soplo de la hoja y dos notas de madera, graves y apagadas, que bajan (sol, mi) |
| `completar` | La escena queda completa (con las chispas) | El marco; le gana a las demás respuestas | El acorde entero hacia arriba (do, mi, sol, do), que se queda sonando con su chispa |
| `pulsar` | Se pulsa un control de la interfaz | El marco, en cualquier botón que no sea del tablero | Un toque seco sin tono, el más corto de todos |
| `abrir` | Se despliega un control, un panel o una ventana | El marco | Dos toques secos, el segundo más claro |
| `cerrar` | Se recoge | El marco | Los mismos dos, al revés |

- **Las campanas** son de caja de música: la nota con su octava, su quinta y un brillo arriba, cada uno más corto que el anterior. Nada pasa de 4.200 Hz, para que un altavoz pequeño no chille.
- **Pasar de escena no suena.** No tiene sonido propio: «Siguiente» suena como cualquier botón, y con las teclas no suena nada.
- **Dos a la vez no saturan:** todos salen por un limitador.
- **Oírlos y decir cuál no gusta.** Con `?sonidos=1` en la URL del runner sale un panel con un botón por sonido, para oírlo suelto, y el nombre del último que sonó mientras se juega.
- **Cambiar uno.** Sus números en `SOUNDS`: las frecuencias (`tone`, `to`), lo que tarda en apagarse (`decay`) y su volumen (`volume`). `MASTER` es el volumen de todos.
- **Añadir una acción.** Primero, qué patrón le toca; después, su receta en `SOUNDS` con el generador de su familia (`bubble` para una pieza, `bell` o `mallet` para una respuesta, `breath` para un movimiento, `tick` para un control) y la llamada a `playSound` donde ocurre.
- **Medido.** Cada sonido se puede sacar sin hacerlo sonar (`renderSound`) para medirlo. El grano de `cocer` dura 82 ms y su pico queda en −20,5 dB, 8 por debajo de tomar una pieza; `listo` dura 504 ms, con el pico en −11,7 dB, 2 por debajo de `aviso`. Del resto, hoy: las piezas duran de 40 a 84 ms y los controles, de 9 a 61; las respuestas, de 433 a 706 ms; los picos van de −15 a −6 dB; las burbujas y las campanas casi no tienen energía por encima de 4 kHz.
- **Una grabación de verdad** (un cacareo) sigue siendo posible para una escena: el archivo en `content/library/sfx/`, su nombre en `library.sfx` de su `scene.json` y `playSound('nombre')`.
- **Descartado**, todo por Luis el 2026-11-10: los 281 efectos de la carpeta `sounds/` del proyecto (sonaban a interfaz de máquina y a juego espacial); una nota de madera al tomar una pieza (sonaba a marimba, rara para agarrar); el mismo sonido para pulsar un control y para tocar una pieza, y el mismo para pasar de escena y para desplegar un control; una sola nota para la hoja de la respuesta («demasiado pobre»); y el sonido de pasar de escena, en sus tres versiones («está mal hecho e implementado»): se quitó.

## Reglas

- Una plantilla no usa `setTimeout`, `setInterval` ni `requestAnimationFrame`: pide el tiempo a su mundo. Así la pausa lo detiene todo y al desmontarse no queda nada colgado.
- No escribe resortes, velocidades, cuentas de «está dentro de esta caja» ni bucles de cuadros propios. Si un juego necesita una física que no está, se añade al motor, con sus pruebas, y la usan todos.
- Lo que se mueve cambia solo su transformación (y su opacidad), en su propia capa.
- Los números del movimiento tienen nombre en el motor (`SPRINGS`); no van sueltos en una plantilla.
- La pieza no se adelanta al dedo con la predicción del navegador (`getPredictedEvents`): medida, variaba de un cuadro a otro y la pieza temblaba.
- Cada cambio en cómo sigue una pieza al dedo se comprueba con un arrastre de puntero real, no con uno instantáneo.

## Qué está probado y qué no

| Parte | Pruebas (`apps/player/tests/`) | En una escena |
|---|---|---|
| Reloj, tiempo de juego, resorte, velocidad, zonas | `engine.test.ts` | Las ocho del huevo |
| Piezas: arrastre, impulso, levantar, cambio de sitio, elegir la más cercana, la zona que no acepta, pausa | `useDrag.test.ts` | Origen, Preparación y Retroalimentación, con ratón |
| Mantener el dedo: un dedo a la vez, soltar frente a cortarse, pausa, teclado | `useHold.test.ts` | Preparación, con un puntero simulado y un clic real. Sin probar con un dedo |
| Temblor y sonido que dura el gesto | `engine.test.ts` | Preparación y, el temblor, Propiedades e Hidratación. El sonido, medido; nadie lo ha oído |
| La mano que demuestra: el arrastre, mantener el dedo, el toque y pedirla al momento (`show`) | `useDemo.test.ts` | Origen, Descubrimiento, Preparación, Propiedades, Hidratación y Beneficio |
| Abrir a toques y tocar las partes (las reglas de la plantilla Abrir) | `abrir.test.ts` | Propiedades, con clics. Sin probar con un dedo |
| Contar los sorbos y el agua dentro del vaso (las reglas de la plantilla Beber) | `beber.test.ts` | Hidratación, con clics. Sin probar con un dedo |
| Elegir lo que se busca y tocar su zona (las reglas de la plantilla Señalar) | `senalar.test.ts` | Ninguna escena la usa desde el 2026-11-20 |
| Darle de comer al personaje: cualquiera, en cualquier orden, uno a la vez (las reglas de la plantilla Comer) | `comer.test.ts` | Beneficio, con arrastres del ratón y con clics. Sin probar con un dedo |
| Armar el recorrido: cada ficha solo se queda en su lugar (las reglas de la plantilla Repasar) | `repasar.test.ts` | Retroalimentación, con clics y con arrastres del ratón. Sin probar con un dedo |
| Física libre | `engine.test.ts` | Ninguna escena la usa todavía |
| Sonido | `engine.test.ts` (las recetas son cortas y suaves; la prioridad de la respuesta) y `useDrag.test.ts` (qué suena en cada gesto) | Cada acción dispara el suyo en las cuatro escenas del huevo y en la interfaz, medidos uno por uno. Nadie los ha oído todavía: se diseñaron por cómo suena cada material, sin poder escucharlos |
| Vibración | Sin pruebas | Sin probar en un dispositivo |

Nada del motor está probado todavía en una pantalla táctil ni en Safari.

## Lo que no tiene

- **Efectos de partículas propios.** Las chispas al completar un juego son del marco.
- **Cuerpos que no sean redondos** en la física libre.
- **Cámara** (acercar, temblar): los juegos son un tablero fijo.
- **Vuelos llevados por el navegador.** Los vuelos con guion los mueve el código en cada cuadro; pasarlos al navegador depende de lo que marque el medidor en un dispositivo.
