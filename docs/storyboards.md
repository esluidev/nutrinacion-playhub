# Storyboards y escenas

Modelo conceptual del contenido de Nutrinación: qué es un storyboard, cómo se compone de
escenas y qué estructura sigue cada categoría. Las reglas reales del runner y de las escenas
viven en `docs/game-rules.md`.

## Storyboard

Una secuencia ordenada de escenas sobre un tema (ej. "Los Frijoles"), de uno de los cuatro
tipos. La startup los crea; una comunidad los usa al programar un taller. Los metadatos de
catálogo (descripción, duración, plan, portada) acompañan al storyboard a nivel de gestión;
lo que el runner consume es el orden de las escenas.

## Escena

La unidad de un storyboard. En Studio, cada escena es una pantalla interactiva propia (un
mini-juego), con un pequeño manifiesto (título, instrucción, puntos, duración) y su parte
jugable. No hay una división fija "lectura vs juego": la escena es la interacción.

Algunas escenas cumplen un rol especial:

- **Anuncio** — avanza sola al completarse (ej. bienvenida).
- **Resumen** — la última escena cierra el taller mostrando el resultado.

Cada escena lleva su **guía pedagógica** (objetivo, guion para el educador, tips). Hoy es un
placeholder; se irá completando.

## Cómo se ejecutan

Las escenas corren dentro del **runner de Studio**: un escenario de tamaño fijo y un conjunto
de primitivas reutilizables, operado por el **educador** durante el taller.
Las reglas están en `docs/game-rules.md` y los estilos y primitivas en `docs/design.md`.
Cómo el runner llega a la app de educadores: `docs/games.md`. Cómo se modela en datos:
`docs/backend.md`.

## Cómo se crea un storyboard nuevo

Orden obligado — el objetivo va antes que las mecánicas:

1. **Contrato del tipo** — leer el contrato pedagógico del tipo de storyboard (abajo)
   y `docs/game-rules.md` completos ANTES de proponer nada.
2. **Análisis del tema** — responder los ejes del tipo CON el tema real: qué preguntas
   aplican y cómo las responde ESTE tema en concreto. Los ejes son preguntas, no
   contenidos fijos: no todo alimento se cocina (una fruta se lava, se pela o se elige
   madura); no toda actividad física usa las piernas. Un eje que el tema no pide, no se
   fuerza.
3. **El mundo** (regla 18) — dónde vive el taller; las mecánicas nacen de él.
4. **Las mecánicas** (regla 19) — primitivas primero, al menos una mecánica propia,
   nunca el set completo de otro storyboard.
5. **Mapa de escenas** — colocar las respuestas del paso 2 en la estructura base del
   tipo: cada escena responde su pregunta con el contenido del tema.
6. **Test anti-mezcla** (regla 20) — todo dato educativo (Tarjeta de Saber,
   instrucción, quiz) habla del protagonista del tipo. Si habla del protagonista de
   otro tipo, esa escena pertenece a otro taller.

El storyboard de referencia de cada tipo muestra la ESTRUCTURA funcionando, no el
contenido a imitar: se copia el rigor, no las respuestas.

## Estructura por tipo

Cuatro tipos de storyboard: alimentación, actividad física, cuidado personal y salud
emocional. Cada tipo define su **contrato pedagógico** (mensaje, objetivo, protagonista,
ejes y fronteras) y una estructura base de escenas, propia de su contenido. La **Pausa
de hidratación** es transversal, pero su mecánica es PROPIA de cada tipo (regla 19):
alimentación llena el vaso con sorbos contados; salud emocional practica el **sorbo
lento** (mantener presionado — beber con calma); los demás tipos definen la suya al
tener su primer rediseño. La narrativa
se escribe siempre para el uso real del producto: un **educador/profesional** guía el
taller frente a su audiencia, con la pantalla como material didáctico compartido. La
audiencia **no es fija**: cada storyboard declara la suya (`audience`: KIDS,
PREADOLESCENTES, ADOLESCENTES, ADULTOS) y su contenido se escribe para ella — el
contrato del tipo aplica igual.

### Alimentación (7 escenas)

Todo lo que tiene que ver con la comida — y también la hidratación. (El tipo se llama
**alimentación**; "nutrición" es el concepto global de la plataforma.)

**Contrato pedagógico:**

- **Mensaje:** conoce lo que comes — tienes muchos alimentos a tu
  alcance, cada uno le da algo bueno a tu cuerpo, y el agua natural es tu mejor
  bebida.
- **Objetivo:** que la audiencia CONOZCA los alimentos que tiene a su disposición y QUIERA
  comerlos: qué son y qué tipos hay, por qué conviene comerlos y qué beneficios le
  dan a su cuerpo, y cómo se preparan o llegan listos para comerse de forma segura.
- **Protagonista:** el alimento — inerte, en tercera persona (regla 1). La audiencia lo
  explora; el alimento no siente ni habla.
- **Ejes** (preguntas que cada tema responde A SU MANERA — regla 20):
  - ¿Qué es y qué tipos hay? — variedades, colores, formas, tamaños, partes;
    alimentos del entorno real de la audiencia (su mesa, su mercado).
  - ¿Por qué comerlo y qué le da a mi cuerpo? — beneficios concretos que motivan el
    consumo (energía, fuerza, corazón, pancita…).
  - ¿De dónde viene? — origen, cómo crece o se produce.
  - ¿Cómo se prepara o llega listo para comerse de forma segura? — el proceso que el
    alimento REAL pida: los frijoles se remojan y cuecen; una fruta se lava, se pela
    o se elige madura; un lácteo se conserva en frío. No asumir cocción.
  - ¿Cómo me hidrato? — el agua natural como mejor opción; beber de forma consciente
    y segura.
- **NO le pertenece:** lo que quien participa SIENTE frente al alimento (→ salud emocional) ·
  hábitos de higiene y cuidado del cuerpo (→ cuidado personal) · ejercicio y
  movimiento como contenido (→ actividad física).
- **Principio rector:** el alimento se presenta tal como es y se conoce explorándolo;
  conocer motiva — se invita a probar, nunca se obliga ni se culpa. El dato educativo
  siempre habla del alimento, no de quien participa.

Estructura base de **7 escenas**. Cada escena es a la vez una sección pedagógica y una
unidad jugable (juego, actividad, interacción o animación, según lo que pida el
contenido). El orden vive en el `storyboard.json` del storyboard; las carpetas de
escenas no se numeran.

| # | Escena | Qué busca | Mecánica típica |
|---|--------|-----------|-----------------|
| 1 | **Bienvenida** | Anunciar el tema del taller y despertar curiosidad; que los niños expresen experiencias vividas. NO adelanta contenido de escenas posteriores (regla 9). | Apertura: ilustración del tema + botón de comenzar con feedback visual |
| 2 | **Descubrimiento** | Explorar la diversidad del alimento: colores, formas, tamaños. Comparar y expresar lo que perciben. | Juego de revelación (p. ej. **la ruleta**: girar para descubrir variedades) |
| 3 | **Propiedades** | Lo que el alimento aporta al cuerpo: nutrientes principales por variedad, partes básicas, de dónde viene. | Juego de asociación (arrastrar variedad → aporte) |
| 4 | **Pausa** | Pausa de hidratación: el agua natural como mejor opción, beber de forma consciente y segura. | Actividad calmada (llenar/beber el vaso, sorbo a sorbo) |
| 5 | **Preparación** | Cómo llega el alimento a estar listo para comerse de forma segura — el proceso que el alimento pida (cocinar, lavar, pelar, madurar…); cambios de olor, sabor y textura. | Ordenar pasos del proceso (lista ordenable validada) |
| 6 | **Retroalimentación** | Consolidar lo aprendido: variedades, características y aportes. Que expresen sus ideas. | Quiz/repaso con opciones (tocar la respuesta correcta) |
| 7 | **Despedida** | Cierre con sensación de logro y motivación; expresar qué les gustó; reforzar hábitos saludables. | Celebración + mensaje positivo |

Notas transversales:

- **El educador guía la conversación**: las escenas incluyen *preguntas para conversar*
  (chips 💬) que apoyan los momentos de expresión oral que pide el contenido.
- **Audio de instrucciones**: el botón de audio del HUD lee `meta.instruction` del
  `scene.config.ts` de la escena actual. El audio de CONTENIDO (datos, preguntas) sí
  vive en la escena. La narración se **pregraba con VoiceBox** y se reproduce bajo
  demanda, con Web Speech como fallback — ver **Narración (audio)** abajo y
  `docs/game-rules.md`.
- **Puntos**: cada escena declara sus puntos en `scene.config.ts` (`defaults`); el shell
  los acumula vía el evento `score`.

#### Implementación de referencia: "Los Frijoles"

`content/storyboards/alimentacion/los-frijoles/` es la implementación de referencia de esta
estructura (documento pedagógico del 2026-06-11):

| Escena | Carpeta | Juego |
|--------|---------|-------|
| Bienvenida | `bienvenida/` | Apertura "¡A conocer los frijoles!" (ilustración + botón Comenzar con estrellas; las variedades se revelan en Descubrimiento) |
| Descubrimiento | `descubrimiento/` | **La Ruleta de los Frijoles** (port fiel de ruleta-frijoles-v2: rueda con siluetas, cartas con flip, tooltips DATO, modal de información fuera del stage) |
| Propiedades | `propiedades/` | Unir cada frijol con su súper poder (energía ⚡ / corazón ❤️ / pancita 😊 / fuerza 💪) |
| Pausa | `pausa-hidratacion/` | Vaso de agua que se llena sorbo a sorbo (5 sorbos, StepMeter) |
| Preparación | `preparacion/` | Ordenar los pasos: escoger → lavar → remojar → cocinar → comer |
| Retroalimentación | `retroalimentacion/` | Quiz de 4 preguntas con los frijoles como opciones |
| Despedida | `despedida/` | Trofeo + frijoles decorativos + mensaje de cierre |

Assets del storyboard: los **datos canónicos** de las variedades viven en la raíz del
storyboard (`beans.ts` / `eggs.ts` — colores, nutrientes, datos, puntos). Los **sprites**
(ilustraciones tipo sticker: el frijol, el huevo, una olla…) son reutilizables entre juegos
y viven en `app/sprites/` (importables como `~/sprites/…`), no dentro del storyboard. La voz
vive en `app/primitives/narration.ts` (reproduce el audio pregrabado por clave y cae a
`speech.ts`, fallback Web Speech es-MX); respeta el mute global. Ver **Narración (audio)**.

### Actividad física (7 escenas)

**Contrato pedagógico:**

- **Mensaje:** mover tu cuerpo te hace fuerte y te sienta bien — hay una
  forma segura de activarse y también de volver a la calma.
- **Objetivo:** que la audiencia PRACTIQUE movimiento real con su cuerpo, de forma segura y
  con la **curva de intensidad** completa: activación suave → movimiento moderado →
  pausa → alta intensidad → calma. El grupo entero se mueve a la vez: el educador
  dirige el ejercicio y la pantalla guía a todos.
- **Protagonista:** el movimiento del cuerpo de los participantes en el espacio físico (el aula).
  La pantalla guía, marca el ritmo y celebra; la interacción táctil arranca, acompaña
  y confirma cada ejercicio — nunca lo reemplaza.
- **Ejes** (preguntas que cada tema responde con SUS movimientos — regla 20):
  - ¿Qué movimientos básicos enseña el tema? — lentos y controlados, coordinados con
    la respiración (postura, equilibrio, marcha… lo que el tema pida).
  - ¿Cómo se sostiene el movimiento en el tiempo? — ritmo moderado, continuo y seguro.
  - ¿Cómo se combina con control? — secuencias ágiles manteniendo la forma.
  - ¿Cómo vuelve el cuerpo a la calma? — estiramiento suave y respiración de cierre.
  - Seguridad transversal: espacio libre, sin sobreesfuerzo, duraciones cortas.
- **NO le pertenece:** nutrientes y alimentos como contenido (→ alimentación) · rutinas
  de higiene (→ cuidado personal) · la respiración como estrategia emocional
  (→ salud emocional; aquí es recuperación FÍSICA).
- **Principio rector:** la pantalla es el guía, el cuerpo hace. Si la escena se puede
  completar sin moverse, está mal diseñada.

Estructura base de **7 escenas** que recorre la curva de intensidad.

| # | Escena | Qué busca | Mecánica típica |
|---|--------|-----------|-----------------|
| 1 | **Bienvenida** | Anunciar el tema y preparar el cuerpo/espacio (lugar libre y seguro). NO adelanta ejercicios posteriores (regla 9). | Apertura: ilustración del tema + botón de comenzar |
| 2 | **Motricidad** | Reconocer y practicar movimientos básicos lentos y controlados (marchar, doblar rodillas, posturas firmes), coordinando la respiración. | Imitación guiada: activar cada movimiento y sostenerlo mientras corre un temporizador (PoseGuide + ExerciseTimer) |
| 3 | **Resistencia** | Movimiento dinámico moderado, continuo y seguro (rodillas arriba, saltitos suaves, pasos laterales). | Rondas al ritmo: seguir el pulso/beat del ejercicio hasta completar la ronda |
| 4 | **Pausa** | Pausa de hidratación: agua natural, beber consciente y seguro, recuperar energía. | Actividad calmada (llenar/beber el vaso, sorbo a sorbo) |
| 5 | **Coordinación** | Mayor intensidad con control: secuencias ágiles de pasos/saltos manteniendo postura y respiración. | Secuencia de pasos (memoria + ejecución física de la secuencia mostrada) |
| 6 | **Recuperación** | Bajar el ritmo: estiramientos suaves, respiración guiada, sensación de bienestar. | Respiración guiada (BreathGuide) + estiramientos sostenidos lentos |
| 7 | **Despedida** | Cierre con logro: recordar la curva (suave → activo → calma) y motivar hábitos activos seguros. | Resumen del taller (regla 17) |

Notas transversales:

- **La pantalla es el guía, no el juego completo**: el movimiento real sucede en el
  espacio físico; la escena muestra el CÓMO (demo animada de la pose), marca el ritmo
  o el tiempo, y celebra al completar.
- **Sin sobreesfuerzo**: duraciones cortas por ejercicio, la intensidad sube por la
  estructura (no dentro de una misma escena más allá de lo declarado) y la Recuperación
  siempre baja el ritmo antes de la Despedida.
- Igual que en nutrición: instrucciones por el HUD (`meta.instruction`), datos de saber
  por `knowledge` (Tarjeta de Saber), puntos declarados en `scene.config.ts`.

#### Implementación de referencia: "Piernas Fuertes"

`content/storyboards/actividad-fisica/piernas-fuertes/` (mundo: **el patio de juegos**,
minimalista — solo los elementos que cada juego necesita):

| Escena | Carpeta | Juego |
|--------|---------|-------|
| Bienvenida | `bienvenida/` | Apertura "¡Piernas fuertes!" (niño saltando + botón Comenzar) |
| Motricidad | `motricidad/` | **El espejo del patio**: tocar cada tarjeta de movimiento y sostenerlo mientras el temporizador corre |
| Resistencia | `resistencia/` | **Rondas de energía**: 3 ejercicios al ritmo del beat, la barra se llena pulso a pulso |
| Pausa | `pausa-hidratacion/` | Vaso de agua sorbo a sorbo (Glass + StepMeter) |
| Coordinación | `coordinacion/` | **La coreografía**: secuencias de ~3 movimientos encadenados que la demo ejecuta (¡MIRA!, repetible) y el niño realiza con su cuerpo a reloj (¡MI TURNO!) — mecánica propia |
| Recuperación | `recuperacion/` | Respiración con burbuja (BreathGuide) + estiramientos suaves |
| Despedida | `despedida/` | Trofeo + estadísticas + mensaje de cierre |

Datos canónicos en `moves.ts` (raíz del storyboard); poses del niño en el sprite
`app/sprites/KidPoseSticker.vue` (reutilizable entre storyboards).

### Cuidado personal (6 escenas)

**Contrato pedagógico:**

- **Mensaje:** tu cuerpo se cuida todos los días con hábitos sencillos, y
  los adultos te acompañan en los cuidados que lo necesitan.
- **Objetivo:** que la audiencia ENTIENDA un cuidado del cuerpo (qué es y para qué
  sirve) y PRACTIQUE su rutina; el acompañamiento (adulto o profesional, según la
  audiencia) se muestra como parte natural del cuidado. Incluye normalizar los
  cuidados de salud (p. ej. la insulina): se muestran como parte tranquila de la vida
  diaria, nunca como algo que asusta.
- **Protagonista:** el hábito/rutina de cuidado (higiene, salud, medicación, descanso…
  según el tema).
- **Ejes** (preguntas que cada tema responde a su manera — regla 20):
  - ¿Qué es el objeto/proceso de cuidado y para qué sirve en el cuerpo? — con una
    metáfora física manipulable, no con teoría.
  - ¿Cómo es la rutina? — orden, momentos del día, gestos concretos.
  - ¿Cuándo acompaña alguien más? — lo que requiera apoyo (medicación, aplicación)
    SIEMPRE se muestra acompañado (adulto o profesional, según la audiencia).
- **NO le pertenece:** nutrientes y alimentos como materia (→ alimentación) · ejercicio
  como contenido (→ actividad física) · gestión de emociones (→ salud emocional).
  Tampoco: alarmar, culpar ni hacer adivinar.
- **Principio rector:** no se adivina — se **descubre**, y cada descubrimiento enseña;
  toda acción revela un aprendizaje (nunca elegir a ciegas ni castigar errores). El
  cuidado se muestra como algo normal y positivo, nunca alarmante.

Estructura base de **6 escenas** centrada en HÁBITOS de cuidado del cuerpo.

| # | Escena | Qué busca | Mecánica típica |
|---|--------|-----------|-----------------|
| 1 | **Bienvenida** | Anunciar el tema con tono cercano y tranquilo; el cuidado como parte natural del bienestar. | Apertura: ilustración del tema + botón de comenzar |
| 2 | **Descubrimiento** | Descubrir QUÉ es el objeto/proceso de cuidado y PARA QUÉ sirve en el cuerpo, con una metáfora física manipulable. | Interacción-metáfora: cada acción revela una función (p. ej. la llave que abre la puerta de la energía) |
| 3 | **Pausa** | Pausa activa: movimientos suaves que reducen el sedentarismo y reconectan cuerpo y atención. | Estiramientos guiados breves (demo + temporizador) |
| 4 | **Autocuidado** | Practicar la RUTINA diaria del cuidado: orden, horarios, higiene, hidratación y acompañamiento adulto. | Línea del día: realizar el hábito que toca en cada momento (mañana → noche) |
| 5 | **Retroalimentación** | Consolidar lo aprendido reencontrando cada hábito — repaso por colección, sin examen. | Colección de revelaciones (cada elemento tocado re-enseña su hábito) |
| 6 | **Despedida** | Cierre positivo: reconocer la participación y motivar los hábitos en casa y la escuela. | Resumen del taller (regla 17) |

Notas transversales:

- **Tono tranquilo y cercano**: los temas pueden ser sensibles (p. ej. diabetes,
  medicación); el cuidado se muestra como algo normal y positivo, nunca alarmante.
- **El adulto acompaña**: los cuidados que lo requieren (aplicación de insulina,
  medicamentos) SIEMPRE se muestran con apoyo de un adulto.
- Igual que en los otros tipos: instrucciones por el HUD (`meta.instruction`), datos
  de saber por `knowledge` (Tarjeta de Saber), puntos declarados en `scene.config.ts`.

#### Implementación de referencia: "La Insulina: Energía con Cuidado"

| Escena | Carpeta | Juego |
|--------|---------|-------|
| Bienvenida | `bienvenida/` | Apertura "Energía con cuidado" + botón Comenzar |
| Descubrimiento | `descubrimiento/` | **La llave de la energía**: la insulina-llave abre la puerta para que la energía de la comida entre al cuerpo (jugar → aprender → crecer) |
| Pausa | `pausa-activa/` | **Pausa en movimiento**: estiramientos suaves; moverse ayuda a que la insulina trabaje mejor |
| Autocuidado | `autocuidado/` | **Un día con la insulina**: el sol recorre el día y en cada momento se hace el hábito que toca (insulina con adulto, plato equilibrado, agua, guardar en el refri) |
| Retroalimentación | `retroalimentacion/` | **Las estrellas del cuidado**: encender 5 estrellas; cada una revela un hábito aprendido |
| Despedida | `despedida/` | Trofeo + estadísticas + mensaje de cierre |

### Salud emocional (6 escenas)

**Contrato pedagógico:**

- **Mensaje:** todo lo que sientes está bien — puedes reconocerlo,
  calmarte y decirlo con respeto.
- **Objetivo:** que la audiencia PRACTIQUE el ciclo RECONOCER → CALMAR → EXPRESAR:
  identificar la emoción, detenerse y calmarse antes de reaccionar, y decir lo que
  siente con respeto. Las preguntas hablan directo al grupo ("¿qué sientes tú?"), sin
  personajes intermedios; el educador guía la conversación.
- **Protagonista:** la emoción de quien participa. El estímulo (un alimento, una situación) es el
  DETONANTE, nunca la materia: despierta la emoción y ahí termina su papel.
- **Ejes** (preguntas que cada tema responde con SU estímulo — regla 20):
  - ¿Qué siento yo frente a esto? — reconocer y nombrar; toda emoción es válida y
    distintas personas sienten distinto ante lo mismo.
  - ¿Cómo me calmo antes de reaccionar? — estrategias que se HACEN con el cuerpo
    (alto, respirar, sostener), no que se explican.
  - ¿Cómo lo digo con respeto? — frases reales practicables; una persona de confianza
    como parte natural de la expresión.
- **NO le pertenece:** enseñar los nutrientes/beneficios del estímulo como materia
  (→ alimentación) — un beneficio puede MENCIONARSE como apoyo a la aceptación, pero el
  dato educativo habla de la emoción y la estrategia, no del alimento · rutinas de
  cuidado (→ cuidado personal) · ejercicio como contenido (→ actividad física).
- **Principio rector:** **ninguna emoción es mala** y una reacción subjetiva NUNCA se
  trata como respuesta correcta o incorrecta; no se promete que una acción cambie la
  emoción automáticamente, ni se obliga a que algo guste (aceptar ≠ fingir que gusta).

Estructura base de **6 escenas** centrada en el ciclo RECONOCER → CALMAR → EXPRESAR; lo
que se practica es la respuesta. Las estrategias de calma se HACEN con el cuerpo y la
comunicación se practica con frases reales.

| # | Escena | Qué busca | Mecánica típica |
|---|--------|-----------|-----------------|
| 1 | **Bienvenida** | Anunciar el tema en un ambiente seguro: color, olor, textura o sabor pueden provocar curiosidad, sorpresa, desagrado, enojo o calma. NO adelanta las situaciones posteriores (regla 10). | Apertura: ilustración del tema + botón de comenzar |
| 2 | **Emociones** | Que los niños del taller expresen lo que SIENTEN ellos frente al alimento (la pregunta les habla directo, sin personajes intermedios) y aprendan los beneficios y qué hacer con el rechazo. | Elección abierta: "¿qué sientes tú?" con varias emociones válidas; cada respuesta enseña un beneficio o una estrategia (decirlo con calma, probar poquito) |
| 3 | **Pausa** | Notar el cuerpo y beber agua natural para recuperar líquidos y energía, sin prometer que el agua cambia automáticamente una emoción por otra. | El **sorbo lento**: mantener presionado para beber con calma (el vaso se vacía) + una señal corporal por sorbo (boca → garganta → cuerpo) |
| 4 | **Autocontrol** | Detenerse antes de reaccionar ante emociones intensas y completar la estrategia entera: alto → respira → habla. | Secuencia física en tres fases: detenerse, sostener la respiración (HoldAction + EmotionGauge) y practicar una frase respetuosa |
| 5 | **Reflexión** | Construir una respuesta personal que combine lo que se siente, una estrategia de cuidado y una frase respetuosa; reconocer beneficios del alimento sin obligar a que guste. | Plan personal: elegir emoción → elegir estrategia → obtener/practicar la frase propia |
| 6 | **Despedida** | Cierre con logro: recordar el ciclo (reconocer → calmar → expresar) y motivar hábitos de bienestar. | Resumen del taller (regla 17) |

Notas transversales:

- **Las emociones tienen color fijo** dentro del taller (la carita `EmotionFaceSticker`
  con su cuerpo/sombra por emoción): el niño asocia color ↔ emoción en todas las escenas.
- **La calma se practica, no se explica**: las estrategias de autocontrol usan
  interacciones físicas sostenidas (mantener presionado = respirar) para que el cuerpo
  haga la pausa de verdad.
- **Aceptar no significa fingir que gusta**: el niño puede conocer un alimento poco a poco,
  reconocer lo que aporta y decir con respeto si su olor, sabor o textura le incomodan.
- Igual que en los otros tipos: instrucciones por el HUD (`meta.instruction`), datos
  de saber por `knowledge` (Tarjeta de Saber), puntos declarados en `scene.config.ts`.

#### Implementación de referencia: "La Sopa de Verduras"

`content/storyboards/salud-emocional/la-sopa-de-verduras/` (mundo: **la mesa de casa a
la hora de la comida** — todas las situaciones nacen de ver, oler, tocar o probar la sopa):

| Escena | Carpeta | Juego |
|--------|---------|-------|
| Bienvenida | `bienvenida/` | Apertura "¡La sopa de verduras!" (sopa + curiosidad/desagrado + botón Comenzar) |
| Emociones | `emociones/` | **¿Qué sientes tú?**: la sopa del taller en pantalla y cuatro preguntas directas al grupo (mirarla, olerla, probarla, ¿y si no te gusta?); toda emoción vale y cada saber enseña un beneficio o qué hacer con el rechazo |
| Pausa | `pausa-hidratacion/` | **El sorbo lento** (Glass + HoldAction): mantener presionado vacía el vaso con calma; cada sorbo revela una señal corporal, sin convertir la emoción en felicidad |
| Autocontrol | `autocontrol/` | **Alto, respira y habla**: cada situación se resuelve con tres acciones reales — detenerse, bajar la intensidad (EmotionGauge + HoldAction) y tocar/practicar la frase respetuosa |
| Reflexión | `reflexion/` | **Mi plan tranquilo**: elegir lo que podría sentir + una estrategia de autocuidado; el resultado muestra la frase personal para usar en la mesa |
| Despedida | `despedida/` | Trofeo + estadísticas + mensaje de cierre |

Datos canónicos en `data.ts` (raíz del storyboard): paleta de emociones (incluye
curiosidad y desagrado), rondas sensoriales, situaciones de autocontrol y estrategias
del plan personal.

#### Anatomía de una escena (contrato con el runner)

```
scenes/<slug>/
  scene.config.ts   ← manifiesto tipado (SceneConfig): meta, primitivas, defaults, puntos
  scene.vue         ← el juego. Props: { locale, config } · Emits: { complete, score, knowledge, restart }
```

- El runner (`/play/[category]/[id]`) carga `storyboard.json`, resuelve cada escena por
  path (import dinámico, sin registry) y aplica `overrides` del JSON sobre los
  `defaults` del config.
- La **acción primaria vive dentro de la escena** (GIRAR, Tomar un sorbo…); el HUD del
  shell solo maneja el meta-flujo (progreso, puntos, mute, navegación, salir).
- Layout: dejar libre la franja superior (~90px) y la inferior (~70px) para el HUD.
- `complete` se emite **una sola vez** por escena; `score` puede emitirse varias veces.
  El runner ignora eventos de escenas ya completadas (replays no inflan puntos).
- El `locale` (de `?lang=` en la URL) lo usa la escena para resolver sus textos — ver
  **Traducciones** abajo.

#### Traducciones (i18n del contenido)

Los juegos son **multi-idioma** (los sirve educators en varios idiomas). Esto es independiente
de la UI de gestión de Studio, que es solo español: lo que se traduce es el **contenido del
juego** (texto y voz dentro del runner y las escenas). El idioma activo llega por `?lang=` y
el runner lo valida contra los idiomas que declara el storyboard; cae al `defaultLanguage`.

Un campo traducible es un `Localized` (`{ es, en, … }`); tipos y helpers compartidos en
`app/types/i18n.ts` (`Localized`, `tr`, `fill`). El texto vive en cuatro lugares, por dueño:

- **`storyboard.json`** — `languages` + `defaultLanguage`, y los títulos como `{ es, en, … }`.
- **`scene.config.ts`** — `meta` (title/instruction/completionFeedback) **y** un bloque
  `strings` con TODO el texto de UI de esa escena (botones, prompts, labels). La escena lo
  resuelve con `useT(sceneConfig.strings, () => props.locale)` → `t('clave', { vars })`.
- **Datos del alimento** (`beans.ts` / `eggs.ts` en la raíz del storyboard) — campos de texto
  `Localized`, resueltos UNA vez con `beansFor(locale)` / `eggsFor(locale)` (compartidos por
  varias escenas: NO duplicar la traducción por escena).
- **Shell del runner** (HUD, modales config/salir/guía, feedback) — diccionario único en
  `app/i18n/runner.ts` (`RUNNER_STRINGS`); es experiencia de juego, sigue el `locale`.

Audio narrado: cada storyboard pregraba su narración (texto compuesto a partir de estos
campos) — ver **Narración (audio)** abajo.

**Regla práctica:** nunca hardcodear texto de cara al niño en `scene.vue` ni en el shell —
va a `strings` (UI de la escena), a los datos del storyboard (texto del alimento) o a
`RUNNER_STRINGS` (shell). Implementación de referencia: `alimentacion/los-frijoles` y
`alimentacion/el-huevo` (es + en completos).

#### Narración (audio)

La narración se pregraba con **VoiceBox** y se sirve por storyboard e idioma en
`content/storyboards/<cat>/<id>/audio/<locale>/<clave>.wav`. Capa en
`app/primitives/narration.ts` (glob de manifiestos + `.wav` + player + fallback) y `useNarrator`
para las escenas que narran bajo demanda.

**Resolución POR TEXTO (no por clave).** El runner ya tiene el texto exacto de cada narración
(instruction, completionFeedback, `voice` de la tarjeta de saber, pregunta del quiz, cierre):
`narrate(ctx, text)` busca ese texto en el manifiesto del storyboard → si está, suena el `.wav`;
si no, lo dice Web Speech. **Las escenas NO pasan claves** — solo su texto, que ya pasan. Agregar
audio a un storyboard = escribir el manifiesto + generar; **cero ediciones de escena**.

Hay dos espacios de nombres: el **contenido por storyboard** y el **shell compartido del
runner** (`content/runner/audio.manifest.json` + `audio/<locale>/…`): strings del HUD/modales
iguales en todos los storyboards (p. ej. el audio de confirmación de salida). Se resuelven por
idioma, no por storyboard: `narrate` busca primero en el storyboard activo y, si no, en el shell
compartido. El `Modal` del DS narra su `audioText` por esta vía (`useNarrator`).

Cada storyboard lleva un **`audio.manifest.json`** en su raíz: la fuente de verdad de QUÉ se
narra. Es una lista por idioma de `{ key, text }`, con `engine` / `instruct` (tono para 4-8
años) / `personality: false` (habla el texto literal, no lo reescribe) / `seed` a nivel raíz.
La `key` solo **nombra el `.wav`** (semántica, con prefijo de escena: `descubrimiento-frijol-rojo`,
`retroalimentacion-pregunta-1`…); la resolución en runtime es por el `text`. **Requisito:** el
`text` del manifiesto debe ser IDÉNTICO al de runtime (una sola fuente de verdad). En dev, si un
storyboard con manifiesto narra un texto sin match, `narration.ts` emite un `console.warn`
(detectas el *drift* al instante).

**Cuándo suena:** en el runner del educador **nada se auto-narra** (regla 15): el educador
es el narrador y los botones de audio (instrucciones del HUD, Tarjeta de Saber, contenido de
la escena) reproducen bajo demanda. Las políticas de autoplay de la futura experiencia del
niño están en el apéndice de `docs/game-rules.md`.

**Cómo se construye el manifiesto: a mano, lo autora el modelo — NO hay automatización.** El
texto narrado no es copia 1:1 de los `strings`: se compone (p. ej. `factSpeech` = nombre + dato;
`matchVoice` con sus variables; título + subtítulo unidos sin el HTML del título) y lleva
decisiones editoriales (qué líneas tienen audio, las claves, corregir gramática). Como ese texto
vive en TS con lógica (fills, helpers), no existe un extractor estático: el modelo lo deriva
leyendo la narración de las escenas. El script `apps/studio/scripts/generate_audio.py` **solo
consume** el manifiesto (lo renderiza a `.wav` en lote vía VoiceBox); nunca lo crea. Cómo
correrlo: `apps/studio/scripts/README.md`.
