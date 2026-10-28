# PlayHub player · el taller

Versión 1.1 · 14 de octubre de 2026. El prototipo vive en `lab/player.html` y el runner de Player (`apps/player/app/runner/`) lo implementa en Vue: el taller en tres modos y tres ediciones. Una escena es una **plantilla de juego** más su **contenido** (`datos-<storyboard>.js`). Este documento recoge cómo se ve y se controla, y por qué.

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
| Barra | 68 | Salir · escena del total · tiempo · puntos · ajustes |
| Escenario | el resto | La consigna y el tablero de la escena (1280 × 600, a la escala del UI como máximo) |
| Pie | 92 | Guía · feedback · Anterior y Reiniciar · Siguiente |

La barra y el pie abrazan sus controles con una sola regla en todos los modos: la distancia al borde (`--edge`), el control de 44 y su base de 4; el pie guarda además 24 encima para el feedback. El tablero se queda con el resto: en 16:10 y 16:9, el 73 % de la pantalla.

**Ancho del juego:** el juego vive en la columna x 120–1160 y el tablero se encaja entero con un solo factor (`--scene-fit`) que nunca pasa de 1. Así se dibuja a la escala del UI, sobra lienzo a los lados en pantallas anchas y en ventanas estrechas el juego se achica en vez de llegar a los bordes. En teléfonos manda el alto.

**Cómo se escala:** `zoom` de CSS sobre el marco, y las ventanas usan el mismo factor. El texto y los iconos se dibujan nítidos y los toques del juego caen en su sitio.

**Zonas seguras:** el zoom se calcula sobre el área segura (sin el notch, las esquinas redondeadas ni la barra de inicio). El escenario y la hoja del feedback llegan hasta los bordes. El margen de seguridad **sustituye** al margen del UI en vez de sumarse, y a los lados se usa el mismo en ambos para que el UI quede equilibrado.

**Distancia al borde:** los controles de la barra y del pie quedan a la misma distancia de su borde (`--edge`), medida abajo hasta el final de la base: 12 en teléfonos, donde cada píxel de alto es área de juego, y 20 en tabletas y computadoras.

**Tamaño táctil:** el HUD mide 44, el mínimo de toque, en todas las pantallas. En tabletas el zoom nunca baja de 1. En teléfonos el UI se dibuja a 44/48 de su tamaño, así que el HUD se dibuja a 48 para seguir midiendo 44 reales. Con ratón, en una ventana pequeña, el UI baja como mínimo a 40/48. En pantallas táctiles nada que se toque queda por debajo de 44 px reales: los botones pequeños toman el tamaño estándar, las pestañas la altura de un control y los mini-botones conservan su cara pequeña con un área de toque de 44.

**Modo compacto:** en pantallas táctiles, y con ratón cuando la escena perdería más de una décima parte de su espacio, los controles se acercan a los bordes y la Bienvenida se compone a 1280 × 600 como un juego. En teléfonos el pie guarda 16 en vez de 24 y la consigna ocupa una fila de 48.

**Protección táctil:** el player es una superficie de juego, no un documento. No se selecciona texto, un toque largo no abre menús ni la lupa, no hay destello al tocar, las imágenes no se arrastran y no se hace zoom con los dedos ni con el trackpad. La guía sigue desplazándose y el tablero recibe todos sus toques. El zoom del navegador con el teclado sí se permite: el player vuelve a ajustarse.

## Modos y ediciones

El modo se fija al abrir con `?mode=` y queda en `data-mode` del marco; cada pieza declara en qué modos existe (`data-modes`). Un modo desconocido vuelve a `educator` con un aviso en consola. El modo cambia el marco, nunca la escena.

| Modo | Quién | Qué ve y qué puede hacer |
| --- | --- | --- |
| `educator` (predeterminado) | La pantalla del taller | Toda la consola: conduce, pausa, reinicia, abre la guía y ve quién está conectado. |
| `device` | El dispositivo de un participante | Su icono y los puntos del grupo. No navega: la sesión le manda escena, pausa y reinicios. Su «Listo» es local. |
| `home` | Uso autónomo en casa | Salir, la escena del total, los puntos y el pie sin Guía ni Anterior; avanza con Continuar. |

`?edicion=infantil|preadolescencia|adolescencia` elige el perfil de la audiencia (`PERFILES` en `plantillas.js`): si las piezas muestran su nombre escrito y cuánto andamiaje hay (guiado, pista en el primer error o en el segundo). La interfaz y las plantillas no cambian. En el dispositivo, la edición la manda la sesión. `?escena=<id>` abre una escena.

## La consola

Una sola forma, la del resto del producto: rectángulos redondeados de 12 para los botones (cuadrados redondeados los de icono), las piezas de estado, el bloque de escena y el riel. Todo va en relieve con su base de 4; los botones neutros y las piezas de estado son blancos con el contorno de 1 px del kit. **Activo** (un panel abierto, el tiempo en pausa) no hunde la pieza, porque una pieza sin su base se ve deformada: conserva su base y se tiñe de cielo (cara `sky-50`, contorno y base `sky-400`), el lenguaje de selección del kit. Solo la pulsación la hunde.

### Barra

| Control | Pieza | Comportamiento |
| --- | --- | --- |
| **Salir** | Botón de icono neutral | Ventana de confirmación en coral con la escena en la que va el taller. |
| **Escena** | Chip: claqueta de Lucide en `sky-700`, «2/4» y un anillo de 22 en `mint-600` | El anillo es el progreso del taller: cada escena aporta su parte y, dentro de un juego, avanza con cada acción resuelta. |
| **Tiempo** | Chip, botón entero | Tiempo de la escena; se detiene con cualquier pausa. Tocarlo pausa o reanuda; en pausa muestra el signo de pausa y se tiñe de cielo. |
| **Puntos** | Chip, botón entero | Puntos del grupo. Abre la ventana de puntos. |
| **Ajustes** | Botón de icono en cielo | Abre el riel: sonido, pantalla completa y Dispositivos. El movimiento de la interfaz sigue la preferencia del sistema. |

En el dispositivo, la izquierda muestra al participante (su icono y un nombre de animal, su única identidad) y su «Listo».

### Pie

| Control | Comportamiento |
| --- | --- |
| **Guía** (cielo) | Panel lateral izquierdo con la guía de la escena en cuatro pestañas (Escena, Conducir, Preguntas, Consejos). Pausa el juego; si se cambia de escena con el panel abierto, la guía cambia con ella. |
| **Feedback** | Una hoja sube sobre el pie con el tono de su tipo (lima, cielo o sol) y los controles se apartan hasta cerrarla. Tiene escuchar y cerrar. |
| **Anterior · Reiniciar** | Un solo bloque. Anterior no pide confirmación: cambiar de escena conserva su estado. Reiniciar pide confirmación en sol; los puntos ganados se conservan. |
| **Siguiente** (lima, la acción principal, como en Admin y Educators) | Avanza. En la última escena es Terminar, con confirmación en lima. En casa dice Continuar. |

### Atajos de teclado

Funcionan sin mostrarse, pensados para los presentadores inalámbricos (Página siguiente y anterior). Se ignoran con una ventana abierta o mientras se escribe en un campo.

| Tecla | Acción |
| --- | --- |
| → · Av Pág | Siguiente escena (con el feedback abierto, lo cierra y avanza) |
| ← · Re Pág | Escena anterior |
| P | Pausar o reanudar |
| G | Abrir o cerrar la guía |
| M | Silenciar o reactivar el sonido |
| F | Pantalla completa |
| Esc | Cierra Dispositivos, el riel, la guía, el feedback o la pausa, en ese orden |

## Paneles y ventanas

**Paneles laterales** (Guía y Dispositivos): flotan sobre el escenario con la sombra flotante del kit, sin velo, y pausan la escena. Cabecera con contexto, título y cerrar; secciones con etiqueta; cajas en `canvas` para los datos. Con un panel abierto la consigna se oculta.

**Ventanas** (pausa, puntos y confirmaciones): la misma anatomía y superficie que los paneles, centradas sobre el velo de las ventanas. Llevan solo lo necesario:

- **Pausa:** «En pausa», «Conversen con calma. Todo sigue donde quedó.», el tiempo de la escena y Continuar. También reanudan cerrar, Esc y P. Con G se abre la guía sin reanudar y la ventana vuelve al cerrarla.
- **Puntos:** el total sobre lo posible y cómo se ganan. No lista escenas.
- **Confirmaciones:** salir (con la escena en la que va el taller), terminar, reiniciar la escena y quitar un dispositivo.

**Dispositivos:** el código para unirse, quién está conectado (siete de prueba que siguen la escena y obedecen ahí mismo, y cada pestaña con `?mode=device`) y, al tocar uno, su escena y las acciones pausar o liberar, reiniciar su escena o quitarlo. Nunca qué respondió ni si terminó.

## El escenario

El escenario tiene su propio color, `--color-canvas`, de borde a borde, entre la barra y el pie blancos. Sobre el tablero va la **consigna**: qué hacer en la escena, fija durante toda la escena, con el botón pequeño de escuchar. Lo único que cambia con cada acción es el feedback, en el pie. Las insignias neutras van en blanco para no perderse en el canvas.

## Plantillas de juego

Cada plantilla (`plantillas.js`) dibuja su tablero de 1280 × 600 con las piezas de juego del kit (`src/plantillas.css`) y los objetos o personajes de Rive, y habla con el marco solo con eventos: `consigna`, `feedback`, `progreso` y `completo`. No sabe en qué modo corre ni para qué audiencia: la audiencia llega como un perfil de edición.

| Plantilla | Familias | Datos |
| --- | --- | --- |
| `anuncio` | Anuncio (Situar) | La Bienvenida: área y edición, «Hoy vamos a conocer», el tema y su ilustración, en el tono del área |
| `destapar` | Revelar, Contrastar | `elementos[{ seVe: { imagen, alto, descripcion }, seDescubre: { ave, etiqueta }, tono, feedback }]` y una síntesis |
| `colocar` | Emparejar, Ordenar, Recorrido | `fichas[{ id, etiqueta, imagen, nido?, alto?, icono?, tono }]`, `orden`, `pista`, `reintento` y `completo` |

Un valor de contenido puede ser un texto o un objeto por edición (`{ infantil, preadolescencia, adolescencia }`); si falta una edición se usa infantil. Los personajes de las aves son `assets/aves.riv` (View Model `Aves`: `ave` y los triggers `aceptar`, `negar` y `volverIdle`).

Las piezas de juego usan las caras suaves de la paleta (200, base 300, texto 800) de sol, coral, cielo, uva y rosa; lima y night son del UI. Sus esquinas son de 28 (la tapa de Destapar, 24).

## Sesión y puntos

La sesión del taller se simula entre pestañas del mismo navegador (BroadcastChannel). Del educador a los dispositivos van solo la escena, la pausa, los reinicios, los puntos y la edición. Del dispositivo vuelve solo su presencia (icono, escena y si está en pausa), nunca respuestas, intentos ni si terminó.

Cada juego completado suma 10 puntos para el grupo, una sola vez por sesión. Reiniciar o repetir una escena no vuelve a sumarlos. Recargar o salir reinicia la sesión.

## Decisiones abiertas

1. **Ventana de presentador.** Con un proyector en espejo, la sala ve la guía cuando se abre. La solución completa es una segunda ventana para el educador mientras el proyector muestra solo el marco.
2. **Servicio de sesión.** El código, los dispositivos de prueba y la sesión entre pestañas son de demostración.
3. **Audio.** Los botones de escuchar y el sonido solo se colocan; las grabaciones están pendientes.
4. **Plantillas que faltan.** Existen Anuncio, Destapar y Colocar. El resto de las familias (Señalar, Simular, Beber, Repasar, Resumen…) no tiene plantilla todavía.
