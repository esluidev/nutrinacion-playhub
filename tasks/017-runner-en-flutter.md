---
id: 017
estado: haciendo
prioridad: alta
creada: 2026-11-09
---
# Prueba del runner en Flutter: web y app nativa

## Objetivo

Decidir con una prueba en la tableta si el runner (y después Educators y la app del hogar) pasan a Flutter. Luis percibe que una app Flutter se siente distinta a una de HTML en un dispositivo táctil, también instalada como PWA. La prueba es la escena Origen de «El huevo» en Flutter web, para compararla con la del runner web de Player.

## Alcance

Decisiones de Luis (2026-11-09):

- Sin apps nativas que obliguen a publicar en tiendas: la instalación es siempre una PWA.
- Le gusta la opción B del análisis: Educators, la app del hogar y el runner en Flutter; Admin y la gestión de Player siguen en web e incrustan el runner. **No está decidida:** depende de esta prueba.
- Su duda era si los SVG y Rive servían en Flutter. Sirven: ver el log.
- **2026-11-10:** una app nativa sí, siempre que no pase por tiendas: en Android, un APK que se descarga desde el navegador. Probó el APK de Origen en su tableta: «es mucho más fluida como app nativa», aunque le faltan ajustes. Quiere saber si la web de Flutter sirve como PWA en Apple, para trabajar un solo código (web y nativas). **Sigue sin decidirse** qué se queda: Flutter para todo, o la web actual más Flutter nativo.

Entra: `apps/runner-flutter`, con el modo educador y la escena Origen (plantilla Historia) sobre el contenido real de Player. El detalle y los límites estaban en su `AGENTS.md`, que se fue con la app.

Fuera: las demás plantillas, la sesión con dispositivos, la narración, el contrato con la app que incrusta el runner, Educators en Flutter y el kit completo en Flutter. El runner vigente sigue siendo el de Player.

## Criterios de aceptación

- [x] La escena Origen se juega entera en Flutter web con los SVG, el Rive y los textos de Player.
- [x] Se ve igual que el runner web a 1280 × 800 y a 1024 × 768.
- [x] Luis la compara en la tableta con la del runner web y decide. Primera vuelta (2026-11-09): en la tableta más modesta va mejor la web; en las algo mejores, Flutter se siente más nativo. Segunda vuelta, con las dos variantes optimizadas: «sigue siendo más fluida la web». **Decisión de Luis: el camino es la web**, optimizada y lo más nativa posible ([tarea 018](018-runner-web-como-app.md)).

## Pasos

- [x] Comprobar los 19 SVG de la librería y `aves.riv` en Flutter web.
- [x] Proyecto, contenido copiado desde Player, marco, tablero, arrastre, mano y escena Origen.
- [x] Motor de Rive servido por la app.
- [x] Segunda vuelta para la tableta modesta: dibujos fijos como imágenes ya pintadas y variante con WebAssembly.
- [x] Ejecutar `flutter test`: 13 aprobadas (2026-11-10, tras reparar la instalación de Flutter).
- [x] App nativa de Android (APK) con la escena Origen, descargable en la red local.
- [x] La web de Flutter en los simuladores de iPad e iPhone, y como PWA instalada en el iPad.
- [ ] Probar la web de Flutter en un iPhone o iPad real: el simulador no dice nada de la fluidez.
- [ ] QA de Luis en la tableta.

## Pendientes y siguiente paso

- **Borrada el 2026-11-16, a petición de Luis** («elimina la aplicación de flutter que está ahí sin ser usada»): `apps/runner-flutter` y sus tres entradas en `.claude/launch.json`. Nunca estuvo en Git (la carpeta entera quedó fuera de los commits); se movió a la Papelera del Mac, de donde Luis la puede vaciar o recuperar. El runner sigue en web ([tarea 018](018-runner-web-como-app.md)).
- **Hecho — QA en la tableta modesta, segunda vuelta:** comparar `:3003` (optimizada) y `:3004` (WebAssembly) con `:3001/play/alimentacion/el-huevo?mode=educator&escena=origen`. Por la IP de la wifi del Mac (`http://192.168.101.2:…`): Tailscale ya no está instalado en este equipo.
- **Si en la tableta modesta sigue por debajo de la web:** el caso más pobre manda (constitución), así que el runner se queda en web y lo que toca es acercar su sensación a la de Flutter en las tabletas mejores.
- **Instalación de Flutter reparada (2026-11-10):** a Flutter 3.47.2 (fvm) le faltaba `frontend_server_aot.dart.snapshot` en `bin/cache/dart-sdk/bin/snapshots` (la carpeta cambió el 2026-11-09 a las 07:35, antes de la sesión); sin él no compilaban las pruebas ni las apps nativas. Se puso ahí un enlace al mismo archivo de `bin/cache/artifacts/engine/darwin-x64` (en la 3.41.1 las dos copias son idénticas). Se deshace borrando el enlace.
- **«Otras sensaciones» del APK:** Luis dijo que algunos botones no se sentían pulsados (corregido) «y otras sensaciones» que no detalló. Preguntarle cuáles siguen.
- **Al abrir la PWA en el iPad** se ve un instante en blanco y otro en gris antes de la escena: falta una pantalla de arranque. El icono es el de Flutter por defecto.
- **Emulador de Android del equipo:** el AVD `Pixel_3a_API_34…` no arranca («No initial system image»); la prueba se hizo en la tableta de Luis.
- **Peso:** la primera carga pesa unas tres veces más que la del runner web (ver el log).
- **WebAssembly en un solo hilo:** dibujar en otro hilo pide una página aislada (cabeceras COOP y COEP) y HTTPS; por `http` en la red local no se puede probar.
- **Instalar como PWA** pide HTTPS: por el nombre de Tailscale con `http` se puede jugar, no instalar.
- **Si Luis elige B:** portar Anuncio, Destapar y Colocar, el resto del marco y el contrato de `docs/runner.md`; decidir cómo se generan los tokens del kit para Flutter; revisar la decisión 002 (Educators pasó de Flutter a web) y la 004.
- **Si no:** borrar `apps/runner-flutter` y su entrada en `.claude/launch.json`, y retomar Educators instalable y la optimización del runner web. De la auditoría de ese día quedaron sin tocar: los efectos de `:hover` del kit se quedan pegados en pantallas táctiles, los campos miden 14 px (zoom en iPhone al enfocar), nada mantiene la pantalla encendida durante el taller y el huevo de Origen se mueve con `left`/`top`.

## Log

- **2026-11-09, tarde. Análisis y prueba técnica:**
  - Pesos medidos, comprimidos: Educators web 180 KB; runner web 255 KB más 873 KB de Rive; el build web del prototipo Flutter anterior, 789 KB más 2.103 KB (Chrome) o 2.803 KB (Safari) de motor.
  - Los 19 SVG de la librería no usan `<style>`, clases, filtros, máscaras ni texto: se ven bien con `flutter_svg` 2.3.2. `aves.riv` carga con `rive` 0.14.11: las tres aves por el enum `ave` y los triggers `aceptar`, `negar` y `volverIdle` responden. Revisado en el navegador.
- **2026-11-09, tarde. Runner y escena Origen:**
  - Medidas, colores y tiempos tomados del runner web en el navegador a 1280 × 800 (barra 68, pie 92, tablero a 0,97333) y de `runner.css`.
  - Revisado en el navegador (Chromium, ratón): tocar la tienda, arrastrar el huevo a la casa, el segundo huevo directo a la casa, la mano que demuestra, la hoja de feedback en cielo y en lima, la marca de hecho, el avance y las chispas. A 1280 × 800 y a 1024 × 768 coincide con el runner web a la vista. Sin errores en la consola.
  - `rive_native` pide su motor a jsDelivr por defecto: se sirve desde la app con `RIVE_NATIVE_WASM_HOST`; comprobado en la red del navegador (ninguna petición a jsDelivr).
  - Peso del build, comprimido: `main.dart.js` 542 KB, CanvasKit 2.011 KB (Chrome) o 2.843 KB (Safari), motor de Rive 1.053 KB. Total, unos 3,7 MB en Chrome y 4,5 MB en Safari, frente a 1,1 MB del runner web.
  - En `apps/runner-flutter`: `flutter analyze`, sin avisos; `./tool/build.sh`, aprobado. `flutter test`, **no ejecutado** (ver pendientes). En la raíz, `node scripts/check-context.mjs`, aprobado.
  - No probado: dispositivos táctiles reales, Safari, teléfono.
  - Sin commit.
- **2026-11-09, noche. Resultado de Luis y segunda vuelta:**
  - Luis, en sus tabletas: en la más modesta se mueve mejor la versión web; en las algo mejores, Flutter se siente más nativo. No dijo los modelos.
  - Causa probable, no medida en el dispositivo: Flutter web vuelve a dibujar la escena entera en cada cuadro (la gallina se mueve siempre) y los SVG iban como trazos, con recortes, una capa de opacidad y un difuminado por cuadro; el navegador guarda cada `<img>` como imagen.
  - Cambio: `raster.dart`. Los dibujos fijos (granero, nido, tarjetas con su suelo y su edificio, interiores, cartón, huevo, mano) se pintan una vez en una imagen al tamaño con que se ven; el recorte y la sombra del arrastre van dentro de la imagen y la opacidad, en la propia imagen. La mano y su copia ya no cambian de tamaño de layout.
  - Variante `build/web-wasm` (`--wasm`, skwasm en un solo hilo), servida en el 3004.
  - Revisado en el navegador a 1280 × 800: las dos variantes se ven y se juegan igual que antes (tocar la tienda, arrastrar a la casa, feedback, marca de hecho). Sin errores en la consola. `flutter analyze`, sin avisos. `flutter test`, no ejecutado (mismo bloqueo).
  - No medido: cuánto mejora en la tableta modesta. Es la prueba de Luis.
- **2026-11-09, noche. Resultado de la segunda vuelta:** Luis: «sigue siendo más fluida la web… flutter en dispositivos modestos parece que no ayuda mucho». El runner se queda en web; el trabajo sigue en la tarea 018. La prueba de Flutter no se borra hasta que Luis lo diga.
- **2026-11-10, mañana. App nativa de Android:**
  - `flutter create --platforms android` sobre el mismo proyecto. La app abre a pantalla completa (`immersiveSticky`), en horizontal y con la pantalla siempre encendida (`FLAG_KEEP_SCREEN_ON` en `MainActivity`). Nombre «PlayHub», Android 7 o superior, 66,8 MB con las tres arquitecturas.
  - Servida con su página de descarga en el puerto 3006 (`runner-flutter-apk` en `.claude/launch.json`), a petición de Luis. La instaló en su tableta modesta: «mucho más fluida».
  - Botones que no se sentían pulsados: con un toque rápido se pulsaban y soltaban en el mismo cuadro. `lib/kit/pressable.dart`: responden al tocar y el estado pulsado dura un mínimo de 130 ms. Lo usan el botón del kit, los segmentos del HUD, el avance, escuchar la consigna y las tarjetas.
  - La tarjeta recorrida ya no lleva el check, como en la web (tarea 016).
  - En `apps/runner-flutter`: `flutter analyze`, sin avisos; `flutter test`, 13 aprobadas; `flutter build apk --release` y `./tool/build.sh`, aprobados.
- **2026-11-10, mañana. La web de Flutter en simuladores de Apple (iOS 18.0):**
  - iPad (10.ª generación), Safari: la escena se ve completa (dibujos, gallina de Rive, letra); tocar la tienda y arrastrar el huevo a la casa con el dedo funcionan.
  - iPad, instalada con «Agregar a Inicio»: abre a pantalla completa, sin las barras de Safari, y se juega igual.
  - iPhone SE (3.ª generación), Safari en horizontal: se ve y responde; el tablero queda pequeño, como en la web actual. No se llegó a instalar como PWA en el iPhone.
  - En el simulador, el primer toque tras una pausa se pierde también en los botones del propio Safari: es del simulador, no de la app.
  - **No dice nada de la fluidez:** el simulador usa el procesador del Mac. Falta un dispositivo Apple real, abriendo `http://192.168.101.2:3003/`.
  - Sin commit.
