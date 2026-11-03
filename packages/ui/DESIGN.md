# PlayHub UI Kit · dirección visual

Estado: v0.3.0. Es el paquete `@playhub/ui`, la fuente única de estilos de Admin, Player y Educators ([decisión 001](../../docs/decisions/001-ui-kit-compartido.md)): lima como acción principal, una sola forma en todo el producto y dos densidades que solo cambian tamaños (compacta para gestión y táctil para el runner y Educators). Sigue pendiente la revisión visual con Luis.

## Objetivo y alcance

Una biblioteca de UI para PlayHub, que puede llevar la marca Nutrinación y se reutiliza entre juegos y aplicaciones. Sirve a las tres audiencias del producto (4–8, 9–12, 13–17) con un solo sistema. Las referencias visuales se eligieron porque su estilo funciona para las tres edades. Comparte formas, jerarquías, color, tipografía y estados. Incluye indicadores de puntos, vidas y tiempo como interfaz. No define sus reglas de negocio, contenidos educativos, ilustraciones, objetos manipulables ni mecánicas de juego.

## Tokens

Los colores, radios, relieve, tamaños, textos y movimiento viven en `css/tokens.css`, organizados en cuatro capas: paleta → roles → tonos → escala. Los componentes solo leen tokens. Cualquier componente con color acepta `data-tone`. La guía completa está en `TOKENS.md`.

## Lenguaje visual

- Superficies claras sobre un fondo frío casi blanco.
- Lo que se pulsa tiene una cara frontal y una base inferior que expresa pulsación (3 px en compacta, 4 en táctil). Los campos y lo que contiene son planos (ver «Profundidad»). Los controles son rectángulos redondeados de 12 en todas las apps y densidades (cuadrados redondeados si solo llevan icono).
- Los botones usan `appearance: none` para evitar el bisel nativo del navegador. Los de color tienen borde de 0 px y no llevan brillo interior blanco. En la variante blanca, una silueta gris continua sostiene la cara blanca, separada 1 px arriba y a los lados (el mismo trazo de los contadores). La cara llega hasta abajo y deja que la sombra compartida dibuje una sola base (`--ph-depth`). Así se evita tanto apilar borde y relieve como cortar el contorno en las esquinas. Las dos capas comparten la misma forma en todos los tamaños.
- Sin degradados ni brillos: botones, medidores (barra, segmentos y aro de progreso), cintas y paneles usan color plano. Los botones conservan su base de 4 px.
- Cada color dice algo (ver «Roles de color»): noche para estructura y texto; los tonos vivos para significados concretos.
- Texto oscuro sobre colores vivos; blanco sobre azul noche.
- Iconos funcionales de trazo redondo en una caja de 24 × 24. Símbolos de contadores con color y volumen ligero; estrella y corazón con siluetas curvas y puntas redondeadas.
- Nunito variable: 600 para texto, 800 para etiquetas y 900 para títulos y acciones.
- Forma, la misma en Admin, Player y Educators: botones, campos, desplegables, filtros, pestañas y navegación, 12; contadores, avisos y horas, 14; tarjetas, paneles, tablas y bandejas, 16; ventanas y piezas del tablero, 20. Solo es redondo lo que lo es por naturaleza: puntos, interruptores, barras de progreso y burbujas de contador. Todo control de una línea ocupa la misma altura, `--ph-control` más la base (43 en compacta, 52 en táctil): el botón la reparte en cara y base, y el campo la ocupa entera con su borde. Así campos, desplegables, buscador y botones se alinean al píxel, arriba y abajo.
- Separaciones en múltiplos de 4 px. Altura principal de botón: 40 px en densidad compacta y 48 en táctil.

Los colores son una adaptación visual del logo suministrado, no una extracción certificada ni una guía de marca ya aprobada. Cielo y uva son acentos secundarios. Los tonos de éxito, aviso y error tienen funciones semánticas separadas del color de marca.

## Profundidad

Un solo lenguaje de relieve en todas las apps, decidido por el papel de la pieza y aplicado en el kit (las apps no lo cambian). La base inferior mide `--ph-depth`: 3 px en compacta y 4 en táctil.

| Capa | Qué es | Cómo se ve |
| --- | --- | --- |
| Control | Botón (cualquier tono), filtro, grupo de controles (`ui-group`) y pestañas (`ui-tabs`). También las tarjetas que se pulsan o se eligen (`ui-panel-interactive`, `select-card`) y las piezas de la barra del reproductor | Cara de `--ph-control` y base debajo (`--color-depth` en los blancos, con contorno de 1 px; `--tone-edge` en los de color). Las pestañas son un carril gris con base; la activa es la cara blanca con su contorno |
| Campo | Campo, área de texto, buscador y desplegable, en un formulario o en una barra | Plano: blanco, borde de 2 px `line`, sin sombra. Mide `--ph-control` más la base: ocupa con su borde la misma altura que un botón con su base. Al enfocarlo, el borde toma el tono con su halo |
| Superficie | Lo que contiene o informa: panel, tabla, tarjeta informativa, cifra, bandeja (`ui-tray`) | Plana: cara blanca (gris la bandeja) y borde `line` |
| Estructura | La cabecera (`ui-appbar`) y la barra lateral | Plana. Dentro, los controles van sin base y no se mueven al pulsar; sus campos miden `--ph-control`. La cabecera es la misma en las tres apps: 60 de alto y densidad `compact`, también en Educators |
| Marca | Lo actual dentro de un conjunto: pestaña activa, página actual, opción elegida, lugar de la navegación, día de hoy | Se marca con color, sin base propia |
| Flotante | Menú, aviso, ventana | Sombra difusa (`--shadow-float`, `--shadow-dialog`), sin base |

Reglas:

- Todo control de una línea ocupa la misma altura. Lo que se pulsa la reparte en cara y base. El campo, plano, la ocupa entera con su borde. En una fila, botones, filtros, pestañas, campos, desplegables y buscador empiezan y terminan en el mismo píxel, se alineen arriba, al centro o abajo. El campo conserva una caja de `--ph-control` con un margen negativo, igual que el botón, cuya base cuelga fuera de su caja.
- Un campo no lleva sombra: con base parecería una tarjeta.
- Lo que contiene va plano, aunque sea blanco. Una tarjeta solo lleva base si se pulsa o se elige entera.
- La excepción es el hueco discontinuo para agregar (`ui-slot`): es un espacio vacío, no una pieza.
- Una tecla dentro de otra baja sola: al pulsar «Editar» en una tarjeta clicable, la tarjeta no se hunde.
- Una sola base por pieza: nada de sombras extra debajo.
- El tablero de juego sigue la misma idea, con sus medidas y colores de `PLAYER-DESIGN.md`. Lo que se arrastra o se voltea (las fichas de Colocar, las cartas de Destapar) lleva una base de 6 en su color. Donde caen las fichas (las ranuras) y la tapa de una carta son huecos grises, planos. La cinta (`ribbon`) es una ilustración.
- Las sombras de Tailwind (`shadow-sm`, `shadow-md`…), los anillos (`ring-*`) y los radios sueltos no forman parte del lenguaje. `scripts/check-ui.mjs` los rechaza en las vistas.

## Roles de color

El color comunica. Una vista se entiende por sus colores sin leer: qué es la acción, qué es hoy, qué viene, qué falta. Los tonos se aplican con `data-tone` (o `data-area`) y los componentes del kit; las vistas no escriben pasos de paleta (`bg-lime-400`, `text-night-600`).

| Tono | Significa | Ejemplos |
| --- | --- | --- |
| `lime` | La acción principal de la vista (una por vista) y lo correcto, completado o cerrado | «Nuevo taller», «Abrir el taller», estado «Cerrado» o «Completado», progreso, interruptor activo, lugar actual de la navegación (en tinte) |
| `sun` | Hoy, ahora, acento y celebración | Estado «Hoy», día actual del calendario, la hora de una sesión de alimentación, reintento amable |
| `sky` | Lo próximo, información y selección | Estado «Próximo» o «Programado», avisos informativos, enlaces |
| `coral` | Salir, cancelar o lo que falta | «Falta el cierre», «Cancelado», eliminar, cerrar sesión |
| `grape` | Novedad | Invitaciones nuevas, contenido recién publicado |
| `rose` | Cuidado | Avisos sobre bienestar, salud emocional |
| `night` | Estructura | Texto, filtro activo, página actual |
| `neutral` | Acción secundaria | «Cancelar», «Hoy» en el calendario, acciones de tabla |

- Estados de una sesión (`UI_SESSION_TONES`, igual en Admin y Educators): hoy → sol; próximo o programado → cielo; falta el cierre → coral; cerrado o completado → lima; borrador → neutro; cancelado → coral.
- Estado de publicación de un storyboard (`UI_PUBLICATION_TONES`, igual en Admin y Player): publicado → lima; en revisión → sol; archivado → coral; borrador → neutro.
- Áreas educativas (`data-area`, `UI_AREA_TONES`): alimentación → sol; actividad física → cielo; cuidado personal → uva; salud emocional → rosa. Tiñen la hora, el símbolo y el acento de lo que pertenece a esa área.
- La navegación marca el lugar actual con un tinte claro de lima (`--nav-current`, entre `tint` y `tint-edge`), texto en tinta e icono en lima (`ui-nav-item`), igual en las tres apps. Es un tinte, nunca el relleno de la acción principal.
- Las personas y lo que no tiene significado propio (grupos, organizaciones) llevan un tono estable que sale de su nombre (`UiAvatar`, `uiToneFor`): cielo, uva, rosa o coral, nunca lima ni sol.
- Acciones de fila en tablas y listas: botones neutros, pequeños y solo icono, también eliminar; el coral queda para la confirmación (`UiConfirmDialog`).
- Toda confirmación, aviso o pregunta va en un diálogo del kit (`UiConfirmDialog`, `UiDialog`) o en un toast; nunca `confirm`, `alert` ni `prompt` del navegador. Si algo impide la acción, el diálogo lo explica y el botón queda desactivado (`disabled`). `scripts/check-ui.mjs` lo comprueba.
- El foco, la selección del texto y los interruptores usan lima porque es el tono por defecto del kit.

## Navegación

- Nada de enlaces de vuelta encima del título («← Storyboards», «← Talleres»): ensucian la cabecera de cada página y duplican lo que ya hace la app. Se vuelve con la navegación de la app (barra lateral, migas de la cabecera, el logo) o con el botón atrás del sistema.
- Una página de error o vacía («no encontrado») sí lleva una acción para salir, dentro del estado vacío (`UiEmptyState`).
- Moverse entre elementos hermanos (escena anterior/siguiente, semana anterior/siguiente) no es volver: va en un `ui-group` o en la barra de la vista.

## Familias

| Familia | Contrato inicial |
| --- | --- |
| Botón | Texto opcional solo si hay nombre accesible; icono opcional; cualquier tono (`lime` principal, `sun` acento, `neutral` secundario, `night` contraste, `coral`, `sky`, `grape`, `rose`); tamaños pequeño, normal y grande. |
| Botón de icono | Caja circular, etiqueta accesible y estado de pulsación. |
| Tarjeta | Informativa (plana), clicable entera (`ui-panel-interactive`, tecla) o seleccionable (`select-card`, tecla); la selección usa borde y marca además de color. |
| Título/cinta | Título neutro como base; cinta decorativa reservada para momentos especiales. |
| Contador | Símbolo + etiqueta + valor; máximo y acciones opcionales; cifras tabulares. |
| Progreso | Lineal continuo, segmentado y circular con valor accesible; carga indeterminada diferenciada. |
| Navegación | Pestañas con panel asociado y teclado, menú de selección y paginación con límites. El menú de un desplegable (`UiSelect`) se abre donde cabe: hacia la izquierda si a la derecha se sale de la ventana y hacia arriba si abajo no cabe. Nunca asoma fuera ni abre el desplazamiento de la página. Las pestañas (`ui-tabs`) son un carril gris con base, del alto y el radio de un control. No tienen margen interior: cada pestaña llena el carril con la altura, el radio y la letra de los controles. Las inactivas conservan el gris del carril; la activa es la cara blanca con el contorno de 1 px de las piezas blancas. Las ajustadas (`fit`) miden lo que su texto y nunca se salen de su sitio: en el teléfono se estrechan y, si aun así no caben, el texto pasa a dos líneas dentro del control. |
| Ventana | `dialog` nativo, título, contenido y acciones. El cierre devuelve el foco al disparador. |
| Campo | Etiqueta persistente, ayuda asociada, validación y mensaje de error. |
| Preferencias | Selector, checkbox, radio, switch y rango; etiquetas visibles o accesibles. |
| Aviso | Color + icono + texto; `data-tone` success, info, warning o danger. |
| Símbolo | `ui-symbol`: cuadro con tinte y pictograma, en cualquier tono; tamaños sm, normal y lg. |
| Etiqueta y punto | `badge` y `ui-dot` en cualquier tono. |
| Grupo | `ui-group`: controles unidos que actúan como uno (paso de fechas). Una tecla, alto de control. |
| Bandeja y hueco | `ui-tray`: columna plana que aloja tarjetas (días del planner); `data-tone` la tiñe. `ui-slot`: hueco discontinuo para agregar, gris un paso más oscuro que la bandeja. |
| Día y hora | `ui-day` (hoy con `aria-current="date"`, en sol) y `ui-time` (hora de una sesión con el tono de su área o estado). |
| Navegación | `ui-nav-item` para barras laterales y pestañas superiores; el actual con `aria-current="page"`. |
| Menú de la cuenta | `UiUserMenu`: el mismo en Admin, Player y Educators (botón de contorno con avatar, nombre y un dato; identidad, opciones de la app y «Cerrar sesión» en coral). |
| Entrada | `UiAuthShell`: la misma en Admin, Player y Educators. El logo con el nombre de la app y una tarjeta: título «Entra con tu correo», una línea con lo propio de la app, los campos (sin marcadores de posición ni asteriscos) y «Entrar». Siempre en densidad `touch`, con campos y botón del tamaño normal (48; en `lg` los campos quedan grandes para sus etiquetas): mide igual en las tres, y sus enlaces (invitación, recuperación) se abren casi siempre en el teléfono. |
| Selector con símbolo | `ui-picker`: símbolo y dos líneas (contexto, organización); un paso más alto que un campo, con el mismo espacio alrededor del símbolo. |
| Portada | `ui-cover`: superficie grande teñida por su tono o área, más suave que un tinte. |
| Avatar y cifra | `UiAvatar` (iniciales, tono estable) y `ui-stat` (cifra y etiqueta sobre un panel). |
| Feedback de actividad | `ui-feedback` con `data-kind` selection, success, retry o complete. |

## Estados y movimiento

Normal, hover, pulsado, foco, seleccionado, deshabilitado y error según el componente. La pulsación baja 3 px y reduce la profundidad. Las transiciones duran 160 ms; el progreso 350 ms. El movimiento puede desactivarse y respeta `prefers-reduced-motion`.

Los listones separan la cara frontal, las colas traseras y los pliegues. El foco de los botones conserva su cara limpia y su relieve: añade un halo difuminado de su mismo color y una pequeña marca centrada sobre el botón, sin marcos interiores ni aros exteriores. La marca mantiene una señal definida además del halo. La muestra y el foco real de teclado comparten la misma regla; la pulsación sigue reduciendo el relieve. En el modo de colores forzados del sistema se utiliza un contorno con el color de resaltado del usuario.

Los ejemplos de foco y pulsación en Fundamentos son muestras no interactivas. Los botones deshabilitados usan `disabled` real. Los switches comunican `aria-checked`; las selecciones usan `aria-pressed` o `aria-selected` según el patrón.

## Variantes para barras de controles

`counter-compact` conserva la familia del contador con altura de 48 px, iconos de 28 px y valor en una línea. La etiqueta continúa disponible para lectores de pantalla. Se alinea con el botón estándar de 48 px sin dominarlo. `progress-track-lg` amplía la barra a 24 px para acompañar esos controles. Ambas variantes se muestran en la biblioteca y se reutilizan en el reproductor.

## Dos densidades, tres audiencias

El kit tiene dos densidades (ver `TOKENS.md`): `compact` para las apps de gestión, con ratón, y `touch` para el runner, Educators y la entrada de las tres apps (`UiAuthShell`), en teléfonos y tabletas. Solo cambian medidas (alto de control, iconos, relieve, separaciones); la forma y el color son los mismos. No cambia por audiencia: lo que distingue a cada edición (voz, ejemplos, qué se celebra) vive en el storyboard, no en el kit.

## Responsive

La lámina organiza familias en dos columnas en pantallas amplias, pasa a una columna por debajo de 1280 px y oculta la navegación lateral por debajo de 1024 px. Los filtros y el buscador permanecen disponibles en móvil. Los componentes mantienen su área de interacción y permiten ajustar el texto.

## Para la siguiente revisión

Validar con Luis la intensidad del relieve, la paleta, el tamaño de los controles y el nivel de decoración. Esta lámina es un prototipo de diseño y comportamiento; no declara completada una auditoría de accesibilidad ni una biblioteca lista para integrar sin adaptación.
