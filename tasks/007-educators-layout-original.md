---
id: 007
estado: revision
prioridad: media
creada: 2026-10-14
---
# Educators con su layout original

## Objetivo

Luis señaló que Educators «cambió todo por completo» respecto a la app Flutter. Se trata de recuperar su estructura (cabecera con menú de usuario, navegación por fechas, vistas de semana y mes, formulario de cierre) adaptada a web y táctil, sin perder el uso del color que Luis aprobó (lima para la acción, sol para hoy y la hora, cielo para lo próximo).

## Alcance

- Inventario del original (recuperable con `git show HEAD:apps/educators/...`):
  - cabecera con logo, nombre de la app y menú de usuario (perfil, configuración, cerrar sesión);
  - barra de fechas con anterior/siguiente, «Hoy», selector de fecha y cambio Semana/Mes;
  - vista de semana (columnas por día; hoy resaltado) y vista de mes (cuadrícula con indicadores);
  - cierre con calificación general, cantidad de niños, nivel de participación y comentarios.
- Adaptación:
  - en teléfono, una tira de días o desplazamiento horizontal;
  - piezas del kit (`ui-group`, `UiTabs fit`, `ui-tray`, `ui-day`, `ui-time`) en densidad táctil.
- Fuera:
  - el resumen de puntos y nivel del original, porque la constitución no admite puntos como evidencia;
  - datos reales (tarea 006).

## Criterios de aceptación

- [x] Semana, mes y navegación por fechas a 375, 768, 1024 y 1440 px, con los datos de prueba.
- [x] El cierre conserva los campos del original compatibles con la constitución (solo de grupo).
- [x] `verify.sh` aprobado, `check-ui.mjs` sin hallazgos.

## Plan

Recuperar la estructura del original con las piezas del kit; ver el log.

## Pendientes y siguiente paso

Aceptación de Luis. Fuera: el resumen de puntos del original (la constitución no admite puntos como evidencia).

## Log

- 2026-10-14 — Creada a partir de la revisión de Luis sobre los layouts; inventario del original hecho durante la tarea 005.
- 2026-10-14 — Luis: «el layout de Educators no es el mismo que estaba en la app de Flutter y el plan era mejorar, no empeorar». Se recupera el original leyendo el código Flutter (`git show HEAD:apps/educators/lib/...`):
  - Cabecera: logo y, a la derecha, «Hola, <nombre>» con la comunidad y el avatar, que abre el menú (Mi perfil, Cerrar sesión). Se retiran las pestañas y la barra inferior que no estaban en el original.
  - Barra de fechas: ‹ rango › en un `ui-group`; «Hoy», el botón de calendario con selector de fecha (días con taller marcados, hoy en sol, elegido en cielo) y Semana/Mes (`UiTabs fit`).
  - Semana: siete columnas (bandejas, hoy en sol suave) hasta el pie de la pantalla. Se desplazan en horizontal si no caben (en tableta, como el original) y solo se mueven solas cuando hoy queda fuera de la vista. En teléfono, agenda vertical.
  - Tarjeta: barra de color del área arriba (como el original), estado, título, hora, grupo y lugar; hoy, «Abrir el taller» (runner) y «Cerrar el taller»; si falta el cierre, «Cerrar el taller».
  - Mes: cuadrícula de lunes a domingo con punto del área, hora y título. Tocar un día abre su semana.
  - Cierre: el formulario del original, centrado a 480 px: calificación general con 5 estrellas (nuevo campo `calificacion`), asistentes, participación, claridad y los comentarios de la constitución. «Finalizar el taller» vuelve al calendario.
  - Mejoras sobre el original: aviso de cierres pendientes con acceso directo, Escape cierra menús, rango legible por lector de pantalla.
  - En el kit: `UiAlert` admite cualquier tono y una acción (slot `action`); `ui-day[aria-pressed]` para el día elegido.
  - Datos de prueba: diez talleres repartidos en dos semanas y el mes.
- 2026-10-14 — Verificación:
  - Tests: 13 aprobados, 6 nuevos (calendario y agrupación por día). Typecheck aprobado.
  - Navegador:
    - 1024 × 768: semana, mes y selector de fecha.
    - 375 × 812: agenda vertical y cierre completo (calificación 4, alta, claro; se guarda y vuelve al calendario).
    - 768 × 1024: columnas a toda la altura.
    - 1440 × 900: la semana cabe completa sin desplazamiento; botones de 140 × 40 sin cortes.
- 2026-10-14 — Revisión de Luis:
  - Alturas: «Hoy», calendario y Semana/Mes no terminaban a la misma altura. El raíl de pestañas medía 48 sin base frente a 48 + 4 de los botones. Arreglado en el kit (tarea 002).
  - Columnas: «para el docente no es necesario separar las columnas; en Flutter eran columnas dentro de un mismo componente». La semana pasa a ser un solo panel con columnas separadas por líneas, cabecera por día (hoy teñido de sol suave, con «Hoy») y tarjetas sobre el fondo del panel. En teléfono, el mismo panel con los días uno debajo de otro.
  - Medido a 1024 × 768: el grupo de fechas, «Hoy», el calendario y el raíl empiezan en 89 px y terminan en 141, base incluida. Revisado a 1440 × 900 y 375 × 812.
- 2026-10-14 — Segunda revisión de Luis:
  - Menú de la cuenta igual que en Admin: ahora es un componente del kit (`UiUserMenu`) que usan las tres apps.
  - Fuera la etiqueta «Datos de prueba» de la cabecera.
  - Fuera el aviso de cierres pendientes («roba espacio vertical y su botón verde compite con los de las tarjetas»). La tarjeta ya lo dice, con «Falta el cierre» y su botón.
  - Las columnas de la semana pasan a blanco (no del color de la página) y las tarjetas pierden la flecha.
  - La semana y el mes nunca pasan del alto del dispositivo. En tableta y escritorio la app mide `100dvh`, el contenido se desplaza dentro de `main`, cada columna se desplaza por dentro y el mes reparte el alto entre sus semanas («+N más» si un día no cabe). En teléfono, la agenda sigue con la página.
  - Medido a 1024 × 768: semana y mes terminan en 744 px y la página no se desplaza (768).
- 2026-10-14 — Sin enlaces de vuelta encima del título (cuenta, detalle, cierre): se vuelve con el logo de la cabecera o con atrás. Pestañas con el raíl con ceja y las pestañas planas.
- 2026-10-14 — Acciones del taller (Luis: «no entiendo qué significan esos botones de cerrar taller»):
  - Las tarjetas ya no llevan botones: toda la tarjeta (y cada taller del mes) abre una ventana (`TallerAcciones`) con los datos, una línea sobre qué toca ahora y las acciones del momento, con una sola principal.
    - Hoy: iniciar el taller, preparación y guía, registrar cómo fue.
    - Por registrar: registrar cómo fue y preparación.
    - Próximo: preparación y guía, y ensayar en el player.
    - Cerrado: ver cómo fue y preparación.
  - Textos que se entienden: «Cerrar el taller» pasa a «Registrar cómo fue», «Falta el cierre» a «Por registrar», el formulario a «Cómo fue el taller» y «Abrir el taller» a «Iniciar el taller».
  - Navegador (1024 × 768): la ventana de un taller de hoy muestra sus tres acciones; ir a la preparación y volver no la reabre.
- 2026-10-14 — Cabecera plana: el menú de la cuenta, sin ceja dentro de la cabecera (`ui-appbar`, tarea 002).
- 2026-10-14 — Ventana simplificada (Luis: «es simplemente el verde para Iniciar taller y el segundo Ver guía»):
  - Dos acciones: «Iniciar taller» (lima) y «Ver guía». En un taller pasado, «Registrar cómo fue» (o «Ver cómo fue») en lugar de iniciar.
  - Hoy, además, un enlace discreto «Registrar cómo fue» para después de la sesión.
  - Fuera la frase explicativa y las acciones «Preparación y guía» y «Ensayar en el player».
  - Comprobado: próximo, «Iniciar taller» y «Ver guía»; hoy, lo mismo más el enlace.
- 2026-10-14 — El feedback como paso final (Luis: «cada vez que se completa un taller habrá una vista donde el educador completará los datos de feedback; ¿por qué los botones cambian?»):
  - La ventana del taller tiene siempre los mismos dos botones, «Iniciar taller» y «Ver guía». Fuera «Registrar cómo fue» y sus variantes.
  - Educators abre el runner con `?taller=<id>`. Al pulsar «Terminar» en la última escena (modo educador), Player lleva a `/talleres/<id>/cierre` de Educators. «Salir» a medias no lleva al feedback.
  - El formulario se llama «Feedback del taller», como en el original. Estados: «Sin completar» (pasado sin feedback) y «Completado».
  - De punta a punta en el navegador: runner en la última escena, «Terminar», feedback del taller, «Finalizar taller», y la tarjeta queda «Completado».
- 2026-11-03 — Luis: la experiencia «se siente bastante pobre y mal distribuida, partiendo desde el header principal». Revisado a 375, 768 y 1024 px con una educadora y talleres temporales: la cabecera no decía dónde estabas ni llevaba a ningún lado (de la ficha solo se volvía tocando el logo); el inicio era la semana en columnas (a 768 px, tres columnas y media con desplazamiento horizontal; en el teléfono, el lunes ya pasado antes que hoy). Luis aprobó empezar por la cabecera y el inicio, con una precisión: «el educador no planea… él solo ve lo que se le ha asignado».
  - Cabecera única, con las piezas de la de Admin: logo, migas («Mis talleres › título», o «› Mi perfil»), que son la vuelta, y el menú de la cuenta. En el teléfono, dentro de una página, un botón para volver y el título.
  - «Mis talleres» es la agenda de lo asignado (`agenda` en `utils/talleres.ts`, en lugar de `agruparTalleres`): «Hola, Ana» con la fecha; «Hoy», con el siguiente taller en grande (`TallerDestacado`: hora, título, grupo y lugar, «Iniciar taller» y «Ver guía») y el resto de hoy; «Falta el cierre»; «Próximos» día por día, solo los días con talleres («Mañana · …»); y «Anteriores», los últimos cuatro con «Ver más». En tableta horizontal y escritorio, lo próximo y lo anterior van en una columna al lado.
  - Quité la barra de fechas, la semana y el mes; Luis los pidió de vuelta en la siguiente entrada.
  - Educators: typecheck y 29 tests **aprobados**. Navegador a 375, 768 y 1024 px con una educadora y nueve talleres temporales (hoy, próximos, uno cancelado, uno sin cierre y uno cerrado; ya borrados): migas y vuelta, la ventana del taller desde una tarjeta y el perfil.
- 2026-11-03 — Luis: «no solo debe haber una vista de mes, sino también de la semana; si ver el día es la principal, luego debe verse el resto». Y el contenido no encajaba con el ancho de la cabecera (el inicio iba centrado a 1152 px; la cabecera, a 1440).
  - Vuelven la barra de fechas, la semana y el mes del original, con una vista **Día** delante y por defecto (Día/Semana/Mes). Día es lo que era el inicio: si es hoy, el siguiente taller en grande, el resto del día y «Falta el cierre»; al lado, «Próximos» después de ese día (los primeros cinco días con talleres y «Ver más»). Sin «Anteriores»: lo pasado se ve en Semana y Mes. Anterior y siguiente mueven un día; tocar un día del mes lo abre en Día.
  - `agenda(talleres, dia)` mira el día elegido; lo que falta cerrar se cuenta siempre desde hoy. `utils/calendario.ts` suma el día (`moverRango`, `textoDelRango`); los días de la jornada se quedan en `utils/fechas.ts`.
  - El inicio ocupa el ancho de la cabecera: el título, la barra y las vistas empiezan y terminan en el mismo píxel que el logo y el menú de la cuenta (32 y 1408 a 1440 px). Sin la fecha bajo el saludo: ya la dice la barra.
  - Educators: typecheck y 35 tests **aprobados**. Navegador con una educadora y nueve talleres temporales (ya borrados): Día, Semana y Mes a 1440 px (semana y mes ocupan el alto), un día futuro con talleres y uno vacío, del mes a Día; Día a 1024, 768 y 375 px.
- 2026-11-03 — La ficha del taller (Luis: «Sí, la ficha»). «Ver guía» llevaba a una página sin la guía: otro bloque «Iniciar taller» (título y botón con el mismo texto), una lista «Antes de empezar» igual en todos los talleres, «Materiales: todavía no están definidos» y una columna que repetía la hora.
  - Ahora muestra la guía escena por escena, en orden: número, verbo, título y subtítulo; al abrir una (la primera, de entrada), sus secciones con texto en el orden en que se conduce (objetivo, descripción, pedagogía, preguntas, psicología, consejos, lo que no hace, mecánica, material, científico), como texto, igual que el runner. Un solo «Iniciar taller»; si está completado, su feedback; si se canceló, el motivo. Los datos una vez, sin la fecha ni la hora, que ya dice la cabecera. Fuera los textos genéricos.
  - Migración `0015_guia_con_orden_y_titulo`, aplicada en local: `educador_guia` trae también `order` y `title` de cada escena (el runner los descarta). `escenasDeLaGuia` las ordena; sin orden (el fixture del modo demo), quedan como llegan.
  - Educators: typecheck, 37 tests y check-ui **aprobados**; pgTAP 279 **aprobados** (dos nuevos: orden y título). Navegador con una educadora y talleres temporales, uno con una guía de cuatro escenas (ya borrados): la ficha a 1024, 768 y 375 px, abrir y cerrar escenas, un taller cancelado y uno sin guía.
- 2026-11-03 — Luis: «en las páginas donde usas 2 columnas siempre la segunda no está al nivel de la primera».
  - Ficha del taller: la cabecera del taller (estado, título, fecha) es la primera fila de la primera columna, y «Iniciar taller» (o el aviso del cancelado, o el feedback) va a su altura en la segunda; la guía y los datos empiezan juntos en la fila siguiente. Medido a 1440 px: 93 y 201 px en las dos columnas.
  - Día: la primera columna tiene título («Hoy», «Mañana» o la fecha, con cuántos talleres), como «Próximos» en la segunda; los dos empiezan a 215 px.
  - Educators: typecheck y check-ui **aprobados**. Navegador a 1440 y 375 px con una educadora y talleres temporales (ya borrados).
- 2026-11-03 — Luis: «por qué razón no eliminas esa forma en que colocas los títulos… y simplemente agregas un header a los cards de cada sección».
  - Día: «Hoy», «Falta el cierre» y «Próximos» son cards con su encabezado (`ui-panel-header`), como en Mi perfil; el siguiente taller de hoy va dentro del card «Hoy» (`TallerDestacado` ya no es un card aparte) y el resto del día, debajo. «Ver más» va en el pie de «Próximos». Ficha: «Datos del taller» y el feedback, con su encabezado.
  - Educators: typecheck y check-ui **aprobados**. Navegador a 1440 y 375 px con una educadora y talleres temporales (ya borrados): «Hoy» y «Próximos» empiezan a 215 px.
- 2026-11-03 — Luis: Mi perfil «sigue con el tamaño de un móvil»; falta un botón de inicio («una persona no sabe que el logo se puede presionar»); el menú del educador, con el correo como en Admin; los botones del taller destacado «son enormes» y una columna con diseños distintos en Día «es contradictorio y de mal gusto».
  - Cabecera: botón de inicio a la vista (icono de casa) junto al menú de la cuenta; en el teléfono, dentro de una página, no se repite con el de volver. El menú dice el correo bajo el nombre, como en Admin (fuera `lugarDeTrabajo` y su texto).
  - Mi perfil, con el ancho de la cabecera: un card debajo de otro en el teléfono, dos en tableta y tres en escritorio.
  - Día: fuera el taller destacado (`TallerDestacado`); todos los talleres usan la misma tarjeta, que abre la ventana del taller con «Iniciar taller» y «Ver guía». `agenda` ya no aparta el siguiente. En la ficha, «Iniciar taller» del tamaño normal del kit.
  - Educators: typecheck, 35 tests y check-ui **aprobados**. Navegador a 1440, 1024, 768 y 375 px con una educadora y talleres temporales (ya borrados).
- 2026-11-03 — Luis, sobre la ficha: «un botón enorme, mal posicionado, una pantalla cargada de badges amarillos sin jerarquía de colores… pareciera que no estuvieras usando un UI kit general».
  - La ficha usa el patrón de detalle del kit, el mismo del detalle de un taller en Admin: `ui-page-header` con el título y su estado (una sola etiqueta), la fecha debajo y «Iniciar taller» a la derecha, del tamaño normal (en el teléfono, en su línea). Si se canceló, el motivo en coral bajo la cabecera.
  - Debajo, como el detalle de un storyboard en Admin: la guía en dos tercios (escenas con número neutro, «título: subtítulo» y el verbo debajo; al abrirlas, sus secciones en un recuadro gris) y, en un tercio, el feedback si está completado y «Datos del taller» en filas de etiqueta y valor (área, contenido, grupo, lugar, jornada, organización, modalidad, idioma, edición). Sin el tono del área en toda la página ni la etiqueta «7 escenas · 30 min»: el único color es el estado.
  - Educators: typecheck y check-ui **aprobados**. Navegador a 1440 y 375 px con una educadora y talleres temporales (ya borrados): un taller de hoy con guía y uno cancelado.
- 2026-11-03 — Luis: «empeoraste el layout del perfil en la computadora» (tres cards de alturas distintas, uno junto a otro).
  - Mi perfil sigue el patrón de las fichas: en dos tercios, Preferencias (el desplegable del idioma, de su ancho de campo) y Tu PIN, uno debajo de otro; en el tercio de al lado, Tus organizaciones. Uno debajo de otro por debajo de 1024 px.
  - Educators: typecheck y check-ui **aprobados**. Navegador a 1440, 1024 y 768 px con una educadora temporal (ya borrada).
- 2026-11-03 — Luis: «por qué razón el header de la aplicación de los educadores es tan distinto al del admin, es más grande, los botones también son distintos y hasta el menú de perfil».
  - Era la densidad: Educators es `touch` (controles de 48 + 4) y su cabecera la heredaba, sin la altura fija de la de Admin. Ahora la cabecera va en densidad `compact` y mide 60 (h-15), como en Admin: el botón de inicio y el menú de la cuenta, del mismo tamaño (40, el mínimo táctil de Educators). El comportamiento táctil del kit (sin zoom por doble toque ni selección) se mantiene: lo da el `html` en `touch`. Anotado en `DESIGN.md` («Estructura»: la cabecera es la misma en las tres apps).
  - Educators: check-ui **aprobado**. Navegador a 1440 y 375 px: la cabecera mide 61 con el borde, como en Admin.
