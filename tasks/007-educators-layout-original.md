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
