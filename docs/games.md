# Juegos

Cómo se crean, ejecutan y llegan a la app de educadores los juegos (las escenas
interactivas), y la capa de progreso que los acompaña. Las reglas reales del runner están
en `docs/game-rules.md`.

## Qué son

Los juegos son las escenas interactivas de un storyboard, construidas y ejecutadas en
**Studio** (su runner). Son **juegos HTML** interactivos que viven dentro del runner (no se
sirven como archivos sueltos): el runner se parametriza por URL (modo, idioma, escena
inicial) y resuelve cada escena.

## Cómo llegan a educators

El runner se ejecuta de dos formas:

- **Standalone** en Studio — para crear y previsualizar. No hay host externo.
- **Embebido** en la app de educadores (Flutter), dentro de un **webview**, durante el taller.

Cuando está embebido, el runner se comunica con su **host** (la app de educadores): recibe
parámetros al cargar (idioma, escena) y le notifica eventos de salida (taller completado,
pedido de cierre, progreso). Standalone no necesita esa comunicación.

El contrato exacto runner↔host (mensajes y datos), el webview en Flutter, el paso de idioma
y el offline se especifican al implementar el puente — hoy existe el modelo, no el puente.
La base del runner es `docs/game-rules.md`.

## Gamificación

La capa de progreso de la experiencia: mantiene la atención de niños de 4-8 años y da
sensación de logro. Es el medio, no el fin — siempre al servicio del aprendizaje.

### Modelo actual

Liviano y basado en puntos:

- **Puntos** — cada escena/acción otorga puntos al completarse.
- **Progreso** — escenas completadas y una barra de progreso.
- **Resumen** — al cerrar el taller: puntos, escenas y tiempo.

Es lo que el runner de Studio refleja hoy (estado por taller, en memoria). No hay todavía
niveles, recompensas coleccionables ni progreso entre talleres.

### A definir

- Valores y reglas de puntaje por escena/acción.
- Si el progreso persiste entre talleres o por comunidad/educador.
- Si se suman mecánicas extra (recompensas, niveles) — es decisión de producto, no asumida.

Nota: la app de educadores tiene hoy su propia capa de progreso provisional, separada del
runner de Studio; unificarlas es trabajo futuro.
