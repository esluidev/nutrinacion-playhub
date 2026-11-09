# PlayHub player · el taller

Versión 1.3 · 9 de noviembre de 2026. El runner de Player (`apps/player/app/runner/`) es el taller: cuatro modos y tres ediciones. Una escena es una **plantilla de juego** más su **contenido**. Este documento recoge cómo se ve y se controla, y por qué.

La 1.2 cambia la consola (flota sobre el escenario, sin puntos ni tiempo), el escenario (el tono del área) y las piezas del tablero. La 1.3 fija un solo patrón para las piezas del tablero, igual en todos los storyboards, deja este documento sin reglas de ningún storyboard en particular y quita la banda del pie: sus controles flotan sobre el escenario y solo el feedback le da fondo. El prototipo `lab/player.html`, del que se portó el runner, se queda en la 1.1: barra y pie blancos, tiempo y puntos.

## De dónde salen las decisiones

La constitución y la especificación de storyboard fijan cinco hechos que condicionan el player:

1. **El taller facilitado es el único contexto obligatorio.** La pantalla del educador suele proyectarse o verse en una TV, y la sala entera la mira. A veces es la única pantalla: una computadora o tableta sin proyector.
2. **El educador conduce el ritmo.** Un taller dura entre 25 y 40 minutos y tiene 9 o 10 escenas en orden fijo.
3. **Cada escena trae guía y material.** La guía es para quien conduce, no para la audiencia: el juego no le habla al educador.
4. **Quien no tiene dispositivo participa con materiales**, mirando la pantalla compartida. Quien sí lo tiene se conecta y juega la escena activa, sin que nada vuelva a la pantalla del taller.
5. **Los puntos son del grupo** y los otorga el storyboard; el player solo los muestra.

## Espacio de diseño: 1280 × 800 con zoom controlado

El player se diseña sobre **1280 × 800** y ocupa **toda la pantalla, sin caja ni bordes**. El zoom es el que hace caber 1280 × 800 en el área segura (`min(ancho / 1280, alto / 800)`), con un mínimo para que el UI no se achique de más.

| Zona | Alto (diseño) | Contenido |
| --- | --- | --- |
| Barra | 68 | Sin banda: el avance del taller y el bloque Ajustes · Reiniciar · Salir flotan sobre el escenario |
| Escenario | el resto | La consigna y el tablero de la escena (1280 × 600, a la escala del UI como máximo) |
| Pie | 92 | Sin banda: Guía y Siguiente flotan sobre el escenario; el feedback sube con su tinte |

La barra y el pie abrazan sus controles con una sola regla en todos los modos: la distancia al borde (`--edge`), el control de 44 y su base de 4; el pie guarda además 24 encima para el feedback. El tablero se queda con el resto: en 16:10 y 16:9, el 73 % de la pantalla.

**Ancho del juego:** el juego vive en la columna x 120–1160 y el tablero se encaja entero con un solo factor (`--scene-fit`) que nunca pasa de 1. Así se dibuja a la escala del UI, sobra lienzo a los lados en pantallas anchas y en ventanas estrechas el juego se achica en vez de llegar a los bordes. En teléfonos manda el alto.

**Cómo se escala:** `zoom` de CSS sobre el marco, y las ventanas usan el mismo factor. El texto y los iconos se dibujan nítidos y los toques del juego caen en su sitio.

**Zonas seguras:** el zoom se calcula sobre el área segura (sin el notch, las esquinas redondeadas ni la barra de inicio). El escenario y la hoja del feedback llegan hasta los bordes. El margen de seguridad **sustituye** al margen del UI en vez de sumarse, y a los lados se usa el mismo en ambos para que el UI quede equilibrado.

**Distancia al borde:** los controles de la barra y del pie quedan a la misma distancia de su borde (`--edge`), medida abajo hasta el final de la base: 12 en teléfonos, donde cada píxel de alto es área de juego, y 20 en tabletas y computadoras.

**Tamaño táctil:** el HUD mide 44, el mínimo de toque, en todas las pantallas. En tabletas el zoom nunca baja de 1. En teléfonos el UI se dibuja a 44/48 de su tamaño, así que el HUD se dibuja a 48 para seguir midiendo 44 reales. Con ratón, en una ventana pequeña, el UI baja como mínimo a 40/48. En pantallas táctiles nada que se toque queda por debajo de 44 px reales: los botones pequeños toman el tamaño estándar, las pestañas la altura de un control y los mini-botones conservan su cara pequeña con un área de toque de 44.

**Modo compacto:** en pantallas táctiles, y con ratón cuando la escena perdería más de una décima parte de su espacio, los controles se acercan a los bordes. En teléfonos el pie guarda 16 en vez de 24 y la consigna ocupa una fila de 48.

**Protección táctil:** el player es una superficie de juego, no un documento. No se selecciona texto, un toque largo no abre menús ni la lupa, no hay destello al tocar, las imágenes no se arrastran y no se hace zoom con los dedos ni con el trackpad. La guía sigue desplazándose y el tablero recibe todos sus toques. El zoom del navegador con el teclado sí se permite: el player vuelve a ajustarse.

## Modos y ediciones

El modo se fija al abrir con `?mode=` y queda en `data-mode` del marco; cada pieza de la consola se monta solo en los modos que la usan. Un modo desconocido vuelve a `educator` con un aviso en consola. El modo cambia el marco, nunca la escena.

| Modo | Quién | Qué ve y qué puede hacer |
| --- | --- | --- |
| `educator` (predeterminado) | La pantalla del taller | Toda la consola: conduce, salta a una escena desde la lista, pausa, reinicia, abre la guía y ve quién está conectado. |
| `device` | El dispositivo de un participante | Su icono y su «Listo», que es local. No navega: la sesión le manda escena, pausa y reinicios. El pie queda vacío hasta que sube el feedback. |
| `home` | Uso autónomo en casa | El avance (sin la lista de escenas), Reiniciar · Salir y Continuar; sin Guía ni Ajustes. |
| `preview` | La vista previa de Admin | Solo el escenario, sin consola ni sesión, a todo el alto. La conduce la app que lo incrusta (`ir`, `reiniciar`). |

La edición sale de `audience` del storyboard (un storyboard es una edición) y llega a la plantilla como un perfil (`profiles.ts`): si las piezas muestran su nombre escrito y cuánto andamiaje hay (guiado, pista en el primer error o en el segundo). La interfaz y las plantillas no cambian. `?escena=<carpeta>` abre una escena.

## La consola

Flota sobre el escenario como el HUD de un juego: un elemento por esquina, todos del alto de un control (44; 48 en teléfonos) y con la forma del resto del producto, rectángulos de 12 con su base de 4. Arriba va lo del taller y abajo lo de la escena. Las dos piezas de arriba miden lo mismo (168) y las dos de abajo también (140). Lo que se abre no cambia el botón: Guía sigue en cielo y Ajustes en blanco, con su base. Los paneles y listas temporales llevan la sombra flotante, el radio de las superficies (16) y 12 de aire bajo la base del control que los abre.

### Arriba

| Control | Pieza | Comportamiento |
| --- | --- | --- |
| **Avance** (izquierda) | Pieza blanca con base: claqueta de Lucide en `sky-700`, la barra de progreso del kit en lima y, en el educador, el chevron de un desplegable | La barra es el progreso del taller: cada escena aporta su parte y, dentro de un juego, avanza con cada acción resuelta. Al completar un juego la pieza da un pequeño salto. En el educador abre la lista de escenas. |
| **Ajustes · Reiniciar · Salir** (derecha) | Un solo bloque de botones del kit, tres segmentos iguales; Salir con su icono en coral. Es el grupo de controles del kit (`ui-group`) en su versión de la consola: flota sobre el escenario, así que sus iconos van un paso más oscuros (night-700) y cada segmento se tiñe al pasar y al pulsar | Ajustes (solo el educador) abre su riel: pausa, sonido, pantalla completa (donde el navegador la permite) y Dispositivos. Reiniciar pide confirmación en sol. Salir, una ventana en coral con la escena en la que va el taller. En casa el bloque lleva solo Reiniciar y Salir. |

En el dispositivo, arriba a la izquierda va el participante (su icono y un nombre de animal, su única identidad) y su «Listo».

### Pie

Sin banda ni línea, como la barra: el escenario llega hasta abajo y Guía y Siguiente flotan sobre él. Solo el feedback le da fondo, mientras está abierto.

| Control | Comportamiento |
| --- | --- |
| **Guía** (cielo, educador) | Panel lateral izquierdo con la guía de la escena en cuatro pestañas (Escena, Conducir, Preguntas, Consejos). Pausa el juego; si se cambia de escena con el panel abierto, la guía cambia con ella. |
| **Feedback** | Una hoja sube sobre el pie con el tono de su tipo (lima, cielo o sol) y los controles se apartan hasta cerrarla. Es una hoja de lado a lado con el tinte del tono (`--tone-tint`, 100), sin línea ni sombra. Siempre lleva escuchar y cerrar, nunca Siguiente: avanzar es del pie. |
| **Siguiente** (lima, la acción principal, como en Admin y Educators) | Avanza, con el icono de reproducir de puntas suaves. En la última escena es Terminar, con el check y confirmación en lima. En casa dice Continuar. |

Anterior no tiene botón: queda en las teclas (← y Re Pág) y en la lista de escenas. Cambiar de escena conserva su estado.

### Atajos de teclado

Funcionan sin mostrarse, pensados para los presentadores inalámbricos (Página siguiente y anterior). Se ignoran con una ventana abierta o mientras se escribe en un campo.

| Tecla | Acción |
| --- | --- |
| → · Av Pág | Siguiente escena (con el feedback abierto, lo cierra y avanza) |
| ← · Re Pág | Escena anterior (educador y vista previa) |
| P | Pausar o reanudar (educador) |
| G | Abrir o cerrar la guía (educador) |
| M | Silenciar o reactivar el sonido |
| F | Pantalla completa |
| Esc | Cierra la lista de escenas, Dispositivos, el riel, la guía, el feedback o la pausa, en ese orden |

## Paneles y ventanas

**Paneles laterales** (Guía y Dispositivos): flotan sobre el escenario con la sombra flotante del kit, sin velo, y pausan la escena. Cabecera con contexto, título y cerrar; secciones con etiqueta; cajas en `canvas` para los datos. Con un panel abierto la consigna se oculta. Dispositivos se abre a la izquierda del riel de Ajustes, alineado arriba con él.

**Lista de escenas** (educador): el menú de los desplegables del kit bajo el avance, de 264. Arriba, la cabecera de tarjeta con «Taller» y su nombre (hasta dos líneas). Debajo, una fila por escena, con una insignia de estado: hecha (check en lima), la actual (su número en sol lleno, la fila seleccionada) o pendiente (su número en neutro). Un nombre largo se corta con puntos suspensivos y se lee entero en su título. Pausa la escena mientras está abierta; un toque fuera la cierra.

**Ventanas** (pausa y confirmaciones): la misma anatomía y superficie que los paneles, centradas sobre el velo de las ventanas y a la escala de la consola: 400 de ancho y controles de 44, así sus dos botones miden lo que Siguiente. Llevan solo lo necesario:

- **Pausa:** «En pausa», «Conversen con calma. Todo sigue donde quedó.» y Continuar. También reanudan cerrar, Esc y P. Con G se abre la guía sin reanudar y la ventana vuelve al cerrarla.
- **Confirmaciones:** salir (con la escena en la que va el taller), terminar, reiniciar la escena y quitar un dispositivo.

**Dispositivos:** el código para unirse, quién está conectado (siete de prueba que siguen la escena y obedecen ahí mismo, y cada pestaña con `?mode=device`) y, al tocar uno, su escena y las acciones pausar o liberar, reiniciar su escena o quitarlo. Nunca qué respondió ni si terminó.

## El escenario

El escenario toma el tono más suave del área del storyboard (`--tone-wash`; alimentación → sol), como el suelo de un juego, de borde a borde, hasta arriba detrás de la consola y hasta abajo detrás del pie. Sobre el tablero va la **consigna**: qué hacer en la escena, fija durante toda la escena, en `text-headline` con el botón de escuchar de 44. Una escena sin consigna (la Bienvenida) no deja vacía esa fila: su tablero sube la mitad y queda centrado en todo el escenario. Lo único que cambia con cada acción es el feedback, en el pie. Al completar un juego salen chispas del centro del tablero, en los tonos de las piezas y el lima, sin texto (no salen con movimiento reducido). Las insignias neutras van en blanco para no perderse en el escenario.

## Plantillas de juego

Cada plantilla (`app/runner/templates/`) dibuja su tablero de 1280 × 600 con las piezas de juego (`runner.css`), los dibujos de la librería y los personajes de Rive, y habla con el marco solo con eventos: `feedback`, `progress` y `complete`. La consigna la pone el marco, desde `meta.instruction`. Lo que comparten las plantillas (la caja de cada pieza, el puntero en coordenadas del tablero, los textos de la escena y el movimiento reducido) está en `board.ts`. No sabe en qué modo corre ni para qué audiencia: la audiencia llega como un perfil de edición.

| Plantilla | Familias | Datos |
| --- | --- | --- |
| `anuncio` | Anuncio (Situar) | La Bienvenida, igual en todos los storyboards: una portada en el tablero. Arriba, de uno a tres protagonistas del tema (ítems de `datos.json`; el primero, el principal, y los demás delante y recostados) sobre un suelo plano en el tinte del área, con tres chispas en su tono; debajo, el título en grande (`--text-hero`, 120, en una línea: si no cabe, se reduce) y una línea que lo presenta. Sin área ni edición: el educador dice «Hoy vamos a conocer…». Los protagonistas aparecen uno tras otro; al tocarlos saltan y suena la frase de la escena (`instruction`). Todo va en una columna centrada en el tablero por su alto (con una línea, dos o ninguna) y, como la Bienvenida no muestra consigna, su tablero ocupa también esa fila: el grupo queda centrado entre la consola y el pie |
| `destapar` | Revelar, Contrastar | `defaults.items`, una carta por ítem, y por ítem `svg` (lo que se ve), `sizeScale`, `tone`, `description`, `name`, `fact` (la hoja al destapar) y `character` (el personaje de Rive que aparece). Al destaparlas todas, `meta.completionFeedback` |
| `colocar` | Emparejar, Ordenar | `defaults.items` en el orden correcto (las fichas nunca empiezan así) y por ítem `svg`, `tone`, `name`, `icon`, `nest` y `sizeScale`. En `strings`, `hint`, `retry` y `completeTitle`; al completar, `meta.completionFeedback` |
| `historia` | Recorrido | `defaults.items` (el origen y los lugares), `defaults.traveler` (lo que viaja), `defaults.routes` (los recorridos válidos, cada uno con su cierre) y, por lugar, `svg`, `name`, `fact` y `backdrop` (su escenario); en el origen, `character` |

Todo texto de contenido va por idioma (`{ "es": … }`), en los JSON del storyboard; la edición la da el storyboard. Los personajes son Rive de la librería (`content/library/rive/`, con su fuente en `assets/`): sus enums y triggers (por ejemplo `aceptar`, `negar` y `volverIdle`) se leen del archivo; no se suponen.

### Piezas del tablero

Un solo patrón en todas las plantillas y en todos los storyboards: **la cara dice qué es la pieza; el borde, en qué estado está.** Todas tienen la forma del tablero (`--radius-board`, 26: un poco más redonda que la del UI), son planas, sin base ni sombra, y llevan el contorno suave del kit, de 3. Nunca un contorno oscuro. Lima y night son del UI; en el tablero, lima solo va en la marca ✓ de lo resuelto.

| Pieza | Para qué | Cara y contorno |
| --- | --- | --- |
| Tarjeta | Un objeto o una idea que se toca o que recibe algo | Blanca, con el gris de toda pieza blanca (`--color-depth`) |
| Tarjeta con escenario | Un lugar o un contexto | El mismo marco. El escenario es solo el suelo del lugar (una franja de la librería, sin cielo), abajo y a lo ancho dentro del margen blanco de 3; el cielo es el blanco de la tarjeta. El objeto, grande, centrado y apoyado en el suelo, siempre dentro de la tarjeta. Los colores del suelo son del asset: la tarjeta no los cambia |
| Ficha | Lo que se mueve hasta un hueco | El tinte más suave de su tono (`--tone-wash`) con el contorno un paso más; mide lo mismo que su hueco, así al caer lo cubre |
| Hueco | Donde cae una ficha | La arena del área, plana y sin contorno, con su número como marca de agua |

| Estado | Cómo se ve, en cualquier pieza |
| --- | --- |
| Quieta | Su contorno suave |
| Invita | Respira: crece y vuelve, sin ningún color nuevo. Si la plantilla demuestra la acción con la mano, nada respira: la mano ya invita, y las dos juntas recargan el tablero |
| Activa | Elegida, tocada, arrastrada o con algo encima: contorno cielo de 4 (`--board-active`, la selección del kit) y un poco más grande; la ficha, además, sube |
| Resuelta | Apagada, con su marca ✓: blanca, con el contorno y el icono en lima |
| Descubierta | Solo Revelar y Contrastar: el tinte de su tono (`--tone-tint`) con su borde (`--tone-tint-edge`) |

El tono de cada ítem (`tone`: sol, coral, cielo, uva o rosa) se elige en contraste suave con su dibujo, para que el protagonista sea siempre el objeto. Las insignias de una pieza (un icono del kit) son blancas y planas, con el contorno suave. Los dibujos siguen la regla de la skill `eslui-motion-design`: volumen con colores planos y sin sombra de apoyo; el suelo lo pone la pieza o su escenario. Los colores del tablero se derivan de los tokens con `color-mix` (`runner.css`); los grises `night` de la consola no van en el escenario, que es cálido: ahí se leen azules.

**Arrastrar y soltar** se siente igual en todas las plantillas (`useDrag` en el runner). Se mueve con un dedo a la vez: otro dedo o la palma no lo cambian. Hasta pasar un umbral corto es un toque, y el toque hace lo mismo que con el teclado. Lo que se arrastra sube un poco sobre el dedo y marca como activa la zona válida que queda debajo. Al soltar sobre ella sale desde donde se soltó, sin saltos; fuera, o si el gesto se corta, vuelve deslizándose a su sitio, que es siempre el que tiene en la escena, nunca el punto donde se agarró. Agarrarlo mientras vuelve lo detiene ahí. Con movimiento reducido, la vuelta es inmediata.

### Cómo juega cada plantilla

- **Colocar:** los huecos arriba y las fichas abajo, un poco giradas, como una mano de cartas; la que se toca se endereza y sube. Tocar una ficha la lleva al siguiente hueco libre, y también se arrastra a uno concreto. El hueco que toca respira. Al caer, la ficha rebota; al completar, todas saltan en fila. Sin nombre escrito (infantil), el dibujo ocupa la ficha. Sin «Comprobar»: al llenarse los huecos, el juego responde.
- **Destapar:** una carta por ítem. Lo que se ve queda a la vista y lo que se descubre espera bajo su tapa (radio 16, en el tono de la carta, con su «?» en relieve). Al tocarla, la tapa sube, aparece el personaje y la carta queda descubierta.
- **Historia (Recorrido):** dos columnas que pesan lo mismo. A la izquierda, el origen como escena: su dibujo, su personaje y lo que viaja, uno por recorrido. A la derecha, una tarjeta por lugar, una encima de otra, lo más grandes que quepan en la columna, con su suelo si el ítem lo trae (`backdrop`); lo que llega se posa delante del lugar, sobre el suelo. Las tarjetas no respiran: lo que se puede hacer lo dice la mano. En cada tramo (del origen al primer lugar y de un lugar de paso al siguiente), si nadie toca, la mano puntero de la librería demuestra el arrastre: presiona lo que viaja, lleva una copia translúcida hasta una tarjeta, que se activa como al soltar encima, y se desvanece. Lo que viaja se arrastra hasta una tarjeta (activa mientras está encima; fuera, vuelve a su sitio) o se toca la tarjeta, y vuela hasta ella. Cada lugar al que llega dice en la hoja qué pasa ahí, con su nombre y su `fact`; en un lugar de paso, también adónde siguen (`strings.next`), y la mano demuestra el tramo que sigue. Si el lugar tiene interior (`interior`), la tarjeta se acerca mientras lo que viaja está ahí y muestra el interior, con un sitio donde se posa a su tamaño (el cartón de huevos, en dos capas: `carton` detrás y `carton-frente` delante); cuando lo que viaja se va, la tarjeta vuelve a su exterior. Sin interior, se posa delante del lugar, sobre el suelo. Al destino la hoja le suma el cierre del recorrido (`body`, o `meta.completionFeedback`) y se queda hasta que la cierran: nada cambia solo, así no le quita el ritmo al educador. Puede haber varios recorridos y ninguno es un error; un lugar de paso ya recorrido queda resuelto. Sin caminos dibujados.

## Sesión

La sesión del taller se simula entre pestañas del mismo navegador (BroadcastChannel). Del educador a los dispositivos van solo la escena, la pausa y los reinicios. Del dispositivo vuelve solo su presencia (icono, escena y si está en pausa), nunca respuestas, intentos ni si terminó. Recargar o salir reinicia la sesión.

Desde la 1.2 el player no muestra puntos ni tiempo: la consola se queda con lo que el educador necesita para conducir. El contenido conserva `pointsOnComplete`, pero el runner no lo usa.

## Decisiones abiertas

1. **Ventana de presentador.** Con un proyector en espejo, la sala ve la guía cuando se abre. La solución completa es una segunda ventana para el educador mientras el proyector muestra solo el marco.
2. **Servicio de sesión.** El código, los dispositivos de prueba y la sesión entre pestañas son de demostración.
3. **Audio.** Los botones de escuchar y el sonido solo se colocan; las grabaciones están pendientes.
4. **Puntos.** El hecho 5 sale de la constitución, pero desde la 1.2 el player no muestra puntos. Falta decidir si se ven en otro sitio o si la constitución cambia.
5. **Plantillas que faltan.** Existen Anuncio, Destapar, Colocar e Historia (Recorrido). El resto de las familias (Señalar, Simular, Beber, Repasar, Resumen…) no tiene plantilla todavía.
6. **Plantillas atadas a su primer tema.** Destapar e Historia llevan fijos en el código algunos dibujos de la librería (el nido y su borde anterior) y la composición del origen. Para otro tema, eso tiene que pasar a los datos, o la escena a su propio `scene.vue`.
