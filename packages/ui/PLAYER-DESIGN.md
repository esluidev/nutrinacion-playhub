# PlayHub player · el taller

Versión 1.2 · 4 de noviembre de 2026. El runner de Player (`apps/player/app/runner/`) es el taller: cuatro modos y tres ediciones. Una escena es una **plantilla de juego** más su **contenido**. Este documento recoge cómo se ve y se controla, y por qué.

La 1.2 cambia la consola (flota sobre el escenario, sin puntos ni tiempo), el escenario (el tono del área) y las piezas del tablero. El prototipo `lab/player.html`, del que se portó el runner, se queda en la 1.1: barra y pie blancos, tiempo y puntos.

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
| Pie | 92 | Una banda blanca: Guía · feedback · Siguiente |

La barra y el pie abrazan sus controles con una sola regla en todos los modos: la distancia al borde (`--edge`), el control de 44 y su base de 4; el pie guarda además 24 encima para el feedback. El tablero se queda con el resto: en 16:10 y 16:9, el 73 % de la pantalla.

**Ancho del juego:** el juego vive en la columna x 120–1160 y el tablero se encaja entero con un solo factor (`--scene-fit`) que nunca pasa de 1. Así se dibuja a la escala del UI, sobra lienzo a los lados en pantallas anchas y en ventanas estrechas el juego se achica en vez de llegar a los bordes. En teléfonos manda el alto.

**Cómo se escala:** `zoom` de CSS sobre el marco, y las ventanas usan el mismo factor. El texto y los iconos se dibujan nítidos y los toques del juego caen en su sitio.

**Zonas seguras:** el zoom se calcula sobre el área segura (sin el notch, las esquinas redondeadas ni la barra de inicio). El escenario y la hoja del feedback llegan hasta los bordes. El margen de seguridad **sustituye** al margen del UI en vez de sumarse, y a los lados se usa el mismo en ambos para que el UI quede equilibrado.

**Distancia al borde:** los controles de la barra y del pie quedan a la misma distancia de su borde (`--edge`), medida abajo hasta el final de la base: 12 en teléfonos, donde cada píxel de alto es área de juego, y 20 en tabletas y computadoras.

**Tamaño táctil:** el HUD mide 44, el mínimo de toque, en todas las pantallas. En tabletas el zoom nunca baja de 1. En teléfonos el UI se dibuja a 44/48 de su tamaño, así que el HUD se dibuja a 48 para seguir midiendo 44 reales. Con ratón, en una ventana pequeña, el UI baja como mínimo a 40/48. En pantallas táctiles nada que se toque queda por debajo de 44 px reales: los botones pequeños toman el tamaño estándar, las pestañas la altura de un control y los mini-botones conservan su cara pequeña con un área de toque de 44.

**Modo compacto:** en pantallas táctiles, y con ratón cuando la escena perdería más de una décima parte de su espacio, los controles se acercan a los bordes y la Bienvenida se compone a 1280 × 600 como un juego. En teléfonos el pie guarda 16 en vez de 24 y la consigna ocupa una fila de 48.

**Protección táctil:** el player es una superficie de juego, no un documento. No se selecciona texto, un toque largo no abre menús ni la lupa, no hay destello al tocar, las imágenes no se arrastran y no se hace zoom con los dedos ni con el trackpad. La guía sigue desplazándose y el tablero recibe todos sus toques. El zoom del navegador con el teclado sí se permite: el player vuelve a ajustarse.

## Modos y ediciones

El modo se fija al abrir con `?mode=` y queda en `data-mode` del marco; cada pieza de la consola se monta solo en los modos que la usan. Un modo desconocido vuelve a `educator` con un aviso en consola. El modo cambia el marco, nunca la escena.

| Modo | Quién | Qué ve y qué puede hacer |
| --- | --- | --- |
| `educator` (predeterminado) | La pantalla del taller | Toda la consola: conduce, salta a una escena desde la lista, pausa, reinicia, abre la guía y ve quién está conectado. |
| `device` | El dispositivo de un participante | Su icono y su «Listo», que es local. No navega: la sesión le manda escena, pausa y reinicios. El pie queda vacío hasta que sube el feedback. |
| `home` | Uso autónomo en casa | El avance (sin la lista de escenas), Reiniciar · Salir y Continuar; sin Guía ni Ajustes. |
| `preview` | La vista previa de Admin | Solo el escenario, sin consola ni sesión, a todo el alto. La conduce la app que lo incrusta (`ir`, `reiniciar`). |

`?edicion=infantil|preadolescencia|adolescencia` elige el perfil de la audiencia (`PERFILES` en `plantillas.js`): si las piezas muestran su nombre escrito y cuánto andamiaje hay (guiado, pista en el primer error o en el segundo). La interfaz y las plantillas no cambian. En el dispositivo, la edición la manda la sesión. `?escena=<id>` abre una escena.

## La consola

Flota sobre el escenario como el HUD de un juego: un elemento por esquina, todos del alto de un control (44; 48 en teléfonos) y con la forma del resto del producto, rectángulos de 12 con su base de 4. Arriba va lo del taller y abajo lo de la escena. Las dos piezas de arriba miden lo mismo (168) y las dos de abajo también (140). Lo que se abre no cambia el botón: Guía sigue en cielo y Ajustes en blanco, con su base. Los paneles y listas temporales llevan la sombra flotante, el radio de las superficies (16) y 12 de aire bajo la base del control que los abre.

### Arriba

| Control | Pieza | Comportamiento |
| --- | --- | --- |
| **Avance** (izquierda) | Pieza blanca con base: claqueta de Lucide en `sky-700`, la barra de progreso del kit en lima y, en el educador, el chevron de un desplegable | La barra es el progreso del taller: cada escena aporta su parte y, dentro de un juego, avanza con cada acción resuelta. Al completar un juego la pieza da un pequeño salto. En el educador abre la lista de escenas. |
| **Escena actual** | Bocadillo noche, plano, bajo el avance y centrado con él, con la flecha al centro | El nombre de la escena (hasta 240, con puntos suspensivos). Se esconde con la lista abierta. En teléfonos, donde la consigna empieza justo bajo la barra, va al lado del avance con la flecha hacia él. |
| **Ajustes · Reiniciar · Salir** (derecha) | Un solo bloque de botones del kit, tres segmentos iguales; Salir con su icono en coral | Ajustes (solo el educador) abre su riel: pausa, sonido, pantalla completa (donde el navegador la permite) y Dispositivos. Reiniciar pide confirmación en sol. Salir, una ventana en coral con la escena en la que va el taller. En casa el bloque lleva solo Reiniciar y Salir. |

En el dispositivo, arriba a la izquierda va el participante (su icono y un nombre de animal, su única identidad) y su «Listo».

### Pie

Una banda blanca de lado a lado que da base a sus botones y al feedback. Es un contenedor, así que se separa del escenario con una línea plana de 2 en el gris de las bases, no con una base («Profundidad» en `DESIGN.md`).

| Control | Comportamiento |
| --- | --- |
| **Guía** (cielo, educador) | Panel lateral izquierdo con la guía de la escena en cuatro pestañas (Escena, Conducir, Preguntas, Consejos). Pausa el juego; si se cambia de escena con el panel abierto, la guía cambia con ella. |
| **Feedback** | Una hoja sube sobre el pie con el tono de su tipo (lima, cielo o sol) y los controles se apartan hasta cerrarla. Tapa la línea del pie y trae la suya, del mismo grosor, en su tono 200. Tiene escuchar y cerrar; con la escena completa, en lugar de cerrar lleva Siguiente. |
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

El escenario toma el tono más suave del área del storyboard (`--tone-wash`; alimentación → sol), como el suelo de un juego, de borde a borde y hasta arriba, detrás de la consola. Sobre el tablero va la **consigna**: qué hacer en la escena, fija durante toda la escena, en `text-headline` con el botón de escuchar de 44. Lo único que cambia con cada acción es el feedback, en el pie. Al completar un juego salen chispas del centro del tablero, en los tonos de las piezas y el lima, sin texto (no salen con movimiento reducido). Las insignias neutras van en blanco para no perderse en el escenario.

## Plantillas de juego

Cada plantilla (`plantillas.js`) dibuja su tablero de 1280 × 600 con las piezas de juego del kit (`src/plantillas.css`) y los objetos o personajes de Rive, y habla con el marco solo con eventos: `consigna`, `feedback`, `progreso` y `completo`. No sabe en qué modo corre ni para qué audiencia: la audiencia llega como un perfil de edición.

| Plantilla | Familias | Datos |
| --- | --- | --- |
| `anuncio` | Anuncio (Situar) | La Bienvenida: área y edición, «Hoy vamos a conocer», el tema y su ilustración, en el tono del área |
| `destapar` | Revelar, Contrastar | `elementos[{ seVe: { imagen, alto, descripcion }, seDescubre: { ave, etiqueta }, tono, feedback }]` y una síntesis |
| `colocar` | Emparejar, Ordenar, Recorrido | `fichas[{ id, etiqueta, imagen, nido?, alto?, icono?, tono }]`, `orden`, `pista`, `reintento` y `completo` |

Un valor de contenido puede ser un texto o un objeto por edición (`{ infantil, preadolescencia, adolescencia }`); si falta una edición se usa infantil. Los personajes de las aves son `assets/aves.riv` (View Model `Aves`: `ave` y los triggers `aceptar`, `negar` y `volverIdle`).

Las piezas de juego usan los tonos de sol, coral, cielo, uva y rosa (cara 200, contorno 300, base 400, texto 800); lima y night son del UI. Sus esquinas son de 28 (la tapa de Destapar, 24). En el runner, a partir de las cartas de Seedle, el tablero tiene su material y lo que se mueve tiene cuerpo:

- **Fichas de Colocar:** la cara en el pastel de su tono con el croma bajado (65 % del 200 con un gris neutro) y el relieve en una sola tinta para todas, `--color-ink`: contorno 2 y base 3 (1 al pulsar). La ficha cielo toma el azul gris de Seedle. En la bandeja van un poco giradas, como una mano de cartas; la que se toca se endereza y sube. Al caer en su destino rebota y al completar saltan en fila. Sin nombre escrito (infantil), el dibujo ocupa la ficha. No dejan pozo en la bandeja.
- **Ranuras de Colocar:** huecos planos, sin contorno, en un tono medio muy apagado del área (arena en alimentación), con su número dentro como marca de agua, un paso más oscuro, igual que las flechas. La ranura que toca y la que recibe una ficha arrastrada van en azul gris, sin borde punteado; la que toca respira.
- **Cartas de Destapar:** la tapa en el tono del área con su «?» blanco en relieve; abierta, el huevo con su nido llena la carta.

Los colores del tablero se derivan con `color-mix` de los tokens del área y de un gris del kit (`runner.css`). Los dibujos siguen la regla de la skill `eslui-motion-design`: volumen con colores planos y sin sombra de apoyo; el suelo lo pone la ficha o la ranura.

## Sesión

La sesión del taller se simula entre pestañas del mismo navegador (BroadcastChannel). Del educador a los dispositivos van solo la escena, la pausa, los reinicios y la edición. Del dispositivo vuelve solo su presencia (icono, escena y si está en pausa), nunca respuestas, intentos ni si terminó. Recargar o salir reinicia la sesión.

Desde la 1.2 el player no muestra puntos ni tiempo: la consola se queda con lo que el educador necesita para conducir. El contenido conserva `pointsOnComplete`, pero el runner no lo usa.

## Decisiones abiertas

1. **Ventana de presentador.** Con un proyector en espejo, la sala ve la guía cuando se abre. La solución completa es una segunda ventana para el educador mientras el proyector muestra solo el marco.
2. **Servicio de sesión.** El código, los dispositivos de prueba y la sesión entre pestañas son de demostración.
3. **Audio.** Los botones de escuchar y el sonido solo se colocan; las grabaciones están pendientes.
4. **Puntos.** El hecho 5 sale de la constitución, pero desde la 1.2 el player no muestra puntos. Falta decidir si se ven en otro sitio o si la constitución cambia.
5. **Plantillas que faltan.** Existen Anuncio, Destapar y Colocar. El resto de las familias (Señalar, Simular, Beber, Repasar, Resumen…) no tiene plantilla todavía.
