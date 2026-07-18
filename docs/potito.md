# Potito — mascota de StoryPlay: animaciones y generación de sprites

Referencia visual: render 3D del pollito (estilo clay/soft, sin outline).

## 1. Análisis del personaje

- **Cuerpo**: forma de pera/huevo, amarillo dorado con gradiente a naranja en bordes y alas. Panza frontal más clara. Sin cuello: cabeza y cuerpo son una sola masa.
- **Cresta**: llama de fuego bicolor (naranja exterior, ámbar interior) sobre la cabeza, ligeramente inclinada.
- **Banda deportiva**: cinta roja/coral en la frente, bajo la llama.
- **Cara**: ojos ovalados blancos grandes con pupilas café oscuro y brillos; cejas cafés finas levantadas (expresión curiosa/amable); pico pequeño naranja abierto en sonrisa (interior café oscuro); rubor sutil en mejillas.
- **Alas**: dos gotas cortas pegadas a los hombros, con gradiente a naranja en las puntas. Cuelgan relajadas, separadas visualmente del torso en su parte baja.
- **Zapatos**: tenis/mocasines rojos redondeados. **CLAVE: están SEPARADOS del cuerpo — no hay piernas ni contacto visible; flotan con un gap bajo el cuerpo (estilo Rayman)**. Esto es una ventaja enorme para animar: los pies se mueven de forma independiente con follow-through, y los saltos/caminatas no requieren articular piernas.
- **Estilo**: 3D suave mate, luz frontal-superior difusa, sin contornos, fondo transparente/negro.

Ya existe `apps/studio/app/sprites/PotitoSticker.vue` (versión SVG estática con grupos `.potito-*` y pivotes definidos). Paleta canónica del SVG: cuerpo `#ffc930→#f4951d`, panza `#ffd35a`, cresta `#ffb823→#ef8420` / `#f79114`, banda `#ff6a4a/#f75d40→#e8402c`, zapatos `#f34e33/#d93c25`, pico `#f39d1f`, cejas `#a97c4b`, pupilas `#6e4523/#23130a`, boca `#54310f/#7c4e24`.

## 2. Catálogo de animaciones

Convención: `potito_<anim>`. FPS estándar 12. `loop` = cíclica, `once` = una pasada.

### Núcleo (MVP)

| Anim | Frames | Tipo | Descripción | Uso en runner |
|---|---|---|---|---|
| `idle` | 8 | loop | Respiración: squash/stretch vertical ±3%, llama ondea, parpadeo cada 2 ciclos | Estado base en toda escena |
| `entrance` | 10 | once | Salta desde fuera de pantalla, aterriza con squash, zapatos llegan un frame después | Inicio de escena / aparición |
| `exit` | 8 | once | Saltito y sale de cuadro (o pop con giro) | Cambio de escena |
| `wave` | 10 | once | Ala derecha saluda 2 veces, cabeza ladeada, sonrisa amplia | Escena `bienvenida` / `despedida` |
| `talk` | 6 | loop | Pico abre/cierra en 3 posiciones, micro-gestos de ala | Mientras suena narración (`narrate()`) |
| `point` | 8 | once→hold | Se inclina y extiende ala hacia un lado, cejas arriba | Señalar instrucción o BottomSheet (tarjeta de saber) |

### Feedback (eventos del juego)

| Anim | Frames | Tipo | Descripción | Uso |
|---|---|---|---|---|
| `cheer` | 8 | once | Saltito corto con puño de ala arriba, ojos cerrados felices | Evento `score` (respuesta correcta) |
| `celebrate` | 12 | once | Salto alto: cuerpo sube, **zapatos quedan abajo y lo alcanzan tarde**, alas abiertas, confeti aparte | Evento `complete` de escena |
| `oops` | 8 | once | Encoge hombros, cejas en pena, llama se dobla, sonrisa tímida — amable, nunca punitivo | Respuesta incorrecta |
| `think` | 8 | loop | Ala al pico, mirada arriba-lado, llama en "?" sutil | Mientras el niño decide (delay >5 s) |
| `surprised` | 6 | once | Ojos enormes, salto mínimo, alas abiertas, pico "o" | Revelación de dato / tarjeta de saber |
| `clap` | 8 | loop | Alas aplauden frente a la panza | Cierre de taller, resumen de puntos |

### Escenas específicas (storyboards actuales)

| Anim | Frames | Tipo | Descripción | Uso |
|---|---|---|---|---|
| `dance` | 12 | loop | Balanceo lateral con zapatos alternando despegados del piso | `retroalimentacion`, cierre |
| `exercise_squat` | 8 | loop | Sentadilla: cuerpo baja hacia los zapatos (el gap se cierra), sube | `piernas-fuertes` (espejo de KidPose) |
| `exercise_jump` | 8 | loop | Salto de tijera adaptado: alas arriba/abajo, zapatos se separan lateralmente | Actividad física |
| `drink` | 10 | once | Sostiene vaso, inclina, traga (mejillas), suspiro feliz | `pausa-hidratacion` (con primitiva Glass) |
| `breathe` | 8 | loop | Inhala (crece 8%, alas suben lento), exhala — ritmo 4 s/ciclo a 2 fps | Con `BreathGuide` (salud emocional) |

### Extras (fase 2)

`fly` (aleteo para desplazarse por pantalla), `sleep` (inactividad larga: cabecea y despierta), `laugh`, `bow` (reverencia final), `peek` (asoma desde borde de pantalla).

## 3. Integración en el runner

1. **Componente** `app/sprites/PotitoMascot.vue`: reproduce spritesheets vía CSS `steps()` o canvas; props `{ anim, size, flip }`, emite `done` en animaciones `once`. Precarga los sheets del set núcleo.
2. **Composable** `useMascot()` inyectado desde el runner (`pages/play/[category]/[id].vue`) con `MASCOT_KEY`, análogo a `NARRATOR_KEY`. API: `mascot.play('cheer')`, `mascot.moveTo(anchor)`, `mascot.hide()`. Cola simple: una `once` interrumpe el loop actual y vuelve a `idle`.
3. **Montaje a nivel runner, no por escena**: capa flotante sobre `scene-area`, anclada por defecto en esquina inferior-izquierda, respetando las franjas del HUD (120 px arriba / 104 px abajo) y sin tapar la BottomSheet. Tamaño ~140–180 px lógicos en el stage 1280×800.
4. **Hooks automáticos** (sin tocar escenas): `entrance` al montar escena, `cheer` en `score`, `celebrate` en `complete`, `surprised`+`point` al emitirse `knowledge`, `talk` mientras `narrating=true`, `clap`/`dance` en fin de storyboard. Escenas pueden pedir animaciones específicas vía el inject (opcional, p. ej. `exercise_squat` en piernas-fuertes).
5. **Modos**: `kid` = expresivo completo; `teacher` = discreto (solo `idle`/oculto, configurable). Respetar `prefers-reduced-motion` (fallback a pose estática).
6. **Sonido**: emotes propios cortos vía `sounds.ts` (no voz — Potito no narra contenido; la narración sigue siendo del narrador). No interferir con la política de autoplay.
7. **Reglas duras**: los alimentos siguen inertes; la personalidad es solo de Potito. Nada de texto hardcodeado (los emotes no llevan texto).

Nota: la alternativa vectorial (animar el SVG existente con CSS/Web Animations o Rive) daría archivos mucho más livianos y escalado perfecto en tablets; los sprites PNG son válidos si se quiere fidelidad al render 3D. Decisión recomendada: sprites 3D para momentos "hero" (celebrate, dance) y SVG/CSS para idle/talk si el peso preocupa.

## 4. Especificación para generación de sprites por IA

### 4.1 Descripción canónica del personaje (incluir en TODO prompt)

> A cute chubby baby chick mascot named Potito, soft 3D clay render style, matte material, no outlines. Egg/pear-shaped golden-yellow body (#FFC930 fading to #F4951D at edges), lighter yellow belly (#FFD35A), head and body are one single mass with no neck. A two-tone flame-shaped crest on top of the head (outer orange #EF8420, inner amber #FFB823), slightly tilted. A red-coral sport headband (#FF6A4A) across the forehead, under the flame. Big oval white eyes with large dark-brown pupils (#23130A) and white specular highlights, thin brown eyebrows (#A97C4B), small orange beak (#F39D1F) open in a happy smile showing dark brown mouth interior, subtle blush on cheeks. Two short teardrop-shaped wings attached at the shoulders, tips fading to orange. **Red rounded sneaker-like shoes (#F34E33, darker sole #D93C25) that are DETACHED from the body: no legs, a visible gap between the bottom of the body and the shoes (Rayman-style floating feet).** Soft top-front diffuse lighting, transparent background, no cast shadow.

### 4.2 Reglas globales de generación

- **Consistencia**: usar la imagen de referencia como input (image-to-image / character reference) en cada frame o secuencia. Mismo personaje, mismos colores, misma cámara.
- **Cámara**: frontal fija, altura de ojos, sin perspectiva agresiva. Nunca rotar la cámara entre frames (rota el personaje si hace falta).
- **Lienzo**: 1024×1024 px por frame (entrega final 512×512), fondo transparente (PNG RGBA). Sin sombra proyectada (la sombra se agrega en runtime como elipse CSS aparte para que siga los saltos).
- **Anclaje**: la línea de piso es y = 88% del lienzo. En pose neutral los zapatos tocan esa línea y el personaje ocupa ~70% de la altura, centrado horizontalmente. El anclaje NO cambia entre frames: los desplazamientos (saltos) ocurren dentro del lienzo.
- **Gap obligatorio**: en toda pose debe verse la separación cuerpo–zapatos (salvo squat, donde se cierra intencionalmente). Los zapatos siguen el movimiento con 1–2 frames de retraso (follow-through).
- **Principios**: squash & stretch moderado (máx ±10%), anticipación de 1–2 frames antes de saltos, la llama y las alas siempre tienen movimiento secundario (nunca rígidas).
- **Salida**: frames individuales `potito_<anim>_<nn>.png` (`potito_celebrate_01.png`…) y spritesheet horizontal por animación `potito_<anim>_sheet.png` (1 fila, N columnas, sin padding, frames del mismo tamaño). FPS objetivo 12 salvo `breathe` (2 fps).

### 4.3 Plantilla de prompt por secuencia

```
[DESCRIPCIÓN CANÓNICA 4.1]
Animation: <nombre> — <intención en una frase>.
Generate a sprite sequence of N frames, 12 fps, <loop: last frame flows back into first / one-shot: starts and ends in neutral idle pose>.
Fixed front camera, transparent background, 1024x1024, ground line at 88% height, character centered.
Frame-by-frame:
  1: <pose clave>
  2: <pose clave>
  ...
Remember: shoes are detached from the body with a visible gap; shoes lag 1-2 frames behind body motion; flame crest and wings always show secondary motion.
```

### 4.4 Desglose frame a frame (set núcleo)

**idle (8, loop)** — 1: neutral. 2–3: cuerpo comprime 3%, llama ondea a la izquierda. 4: neutral. 5–6: cuerpo estira 3%, llama a la derecha, alas se separan 2°. 7: neutral. 8: parpadeo (ojos cerrados, línea curva feliz).

**entrance (10, once)** — 1–2: vacío/entra desde arriba-fuera, cuerpo estirado cayendo, zapatos arriba pegados al cuerpo. 3: contacto, squash fuerte (85% alto, 110% ancho), zapatos tocan piso. 4: zapatos rebotan y se re-separan al gap normal. 5–6: rebote suave hacia arriba. 7–8: asentamiento. 9–10: transición a idle con sonrisa.

**wave (10, once)** — 1–2: anticipación, cuerpo gira 10° a su derecha, cabeza se ladea. 3: ala derecha sube extendida sobre la cabeza. 4–7: ala oscila izquierda-derecha ×2 (pico abierto alegre, cejas arriba). 8–9: ala baja. 10: neutral.

**talk (6, loop)** — alterna 3 aperturas de pico (cerrado sonriente / medio / abierto) con micro-movimiento de cabeza (±3°) y un gesto de ala en frames 3–4. Diseñada para ciclar sin corte.

**point (8, once→hold)** — 1–2: anticipación (se encoge levemente hacia atrás). 3–5: se inclina 15° al lado señalado, ala extendida con "dedo" de pluma, mirada y cejas hacia el objetivo. 6–8: hold con micro-bounce (el frame 8 puede ciclarse con el 6 para sostener).

**cheer (8, once)** — 1–2: anticipación, squash. 3–4: saltito (despega ~10% de la altura del lienzo), ala derecha en puño arriba, ojos cerrados de felicidad, zapatos aún abajo. 5: zapatos lo alcanzan en el aire. 6–7: aterrizaje con squash suave. 8: neutral orgulloso.

**celebrate (12, once)** — 1–2: anticipación profunda (squash 80%). 3–5: salto alto (cuerpo sube al 60% del lienzo), alas abiertas en V, llama estirada, boca abierta de júbilo, **zapatos quedan cerca del piso y suben tarde**. 6–7: cima flotante, zapatos alcanzan. 8–9: caída con estiramiento. 10: aterrizaje squash fuerte. 11–12: rebote y pose final con alas en alto. (Confeti/partículas NO en el sprite: usar primitiva de partículas del runner.)

**oops (8, once)** — 1–2: pestañeo, cejas caen a pena. 3–5: hombros/alas se encogen, cuerpo se hunde 5%, llama se dobla hacia adelante, sonrisa tímida de lado, mejillas más rojas. 6–8: se recompone a neutral optimista (mensaje: "intenta de nuevo", nunca tristeza profunda).

**think (8, loop)** — ala izquierda al borde del pico, pupilas arriba-derecha, ceja izquierda más alta; la llama se curva lentamente como "?"; balanceo mínimo del cuerpo. Cicla suave.

**surprised (6, once)** — 1: neutral. 2: ojos enormes + pupilas pequeñas, pico en "o", salto mínimo con alas abiertas, zapatos se separan 1 cm extra. 3–4: hold de sorpresa. 5–6: relaja a sonrisa encantada.

**clap (8, loop)** — alas se juntan frente a la panza y se abren, ×2 por ciclo; cabeza asiente al ritmo; zapatos alternan taps (uno se despega 2° y baja).

**dance (12, loop)** — balanceo lateral: peso a la izquierda (cuerpo inclina 8°, zapato derecho se despega y cruza), centro, peso a la derecha (espejo); alas en ritmo opuesto; llama ondea amplio; ojos cerrados felices en los extremos.

**exercise_squat (8, loop)** — 1: de pie, alas al frente. 2–4: cuerpo baja hacia los zapatos hasta casi cerrarlos (gap→0), alas extendidas al frente, mejillas de esfuerzo. 5–7: sube. 8: neutral con exhalación.

**exercise_jump (8, loop)** — jumping jack: 1–2: anticipación. 3–4: en el aire, alas en V arriba, zapatos separados a los lados. 5–6: aterriza con zapatos juntos, alas abajo. 7–8: retorno. 

**drink (10, once)** — 1–2: vaso azul simple aparece en ala derecha. 3–5: inclina vaso al pico, cabeza atrás. 6–7: traga (mejillas infladas, ojos cerrados). 8–9: baja el vaso, "ahh" feliz. 10: neutral. (El vaso puede omitirse y componerse con la primitiva Glass; generar ambas variantes.)

**breathe (8, loop @2 fps)** — 1–4: inhala: cuerpo crece 8%, alas suben lento, ojos se cierran, llama se alza. 5–8: exhala: todo desciende suave. Ciclo de 4 s para guiar respiración real.

### 4.5 Flujo de trabajo recomendado con el modelo de IA

1. Generar primero una **hoja de modelo**: pose neutral frontal + 3/4 izquierda + 3/4 derecha + hoja de expresiones (feliz, sorpresa, pena, esfuerzo, ojos cerrados). Validarla contra la referencia antes de producir secuencias.
2. Generar cada secuencia con la plantilla 4.3 usando referencia + hoja de modelo como inputs. Pedir los N frames en una sola imagen-grid cuando el modelo lo soporte (mejor coherencia) y luego recortar.
3. Post-proceso por script: recortar/alinear por la línea de piso, verificar dimensiones idénticas, empaquetar spritesheet, optimizar (pngquant/webp con alpha).
4. QA: reproducir a 12 fps en un HTML de prueba; revisar jitter de anclaje, consistencia de color (comparar contra paleta 4.1) y que el gap cuerpo–zapatos exista en todos los frames.
