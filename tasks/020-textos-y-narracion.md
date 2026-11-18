---
id: 020
estado: haciendo
prioridad: alta
creada: 2026-11-18
---
# Lo que se ve y lo que se dice: textos narrados

## Objetivo

Que la narración pueda decir algo distinto de lo que se ve, para que en casa, sin educador, los audios lleven la narrativa. Luis (2026-11-17): «una cosa sería el texto que se muestra en pantalla y otro el que se usa para los audios»; el JSON de cada escena trae el texto de la UI, el texto del audio y qué audio se reproduce. En el modo casa la narración es automática desde el inicio, y el audio de la introducción de una escena dice la consigna y después la completa.

## Alcance

Entra:
- El formato del texto narrado (`text`, `voice`, `audio`) en `scene.json` y `datos.json`.
- La narración por clave y por tramos.
- La voz de cada hoja.
- La narración automática en casa.
- El script de voces desde los JSON.
- La skill `playhub-storyboard-games`.

Fuera: escribir los textos del huevo (qué se narra, el texto corto y la voz, desde la guía), que se hace con Luis. También la escena de Despedida, que falta en el storyboard.

## Criterios de aceptación

- [x] Un texto puede ser por idioma o narrado; lo que se ve sale de `text` y lo que se dice, de `voice` (o de `text` si no la trae).
- [x] La grabación se busca por su clave (`audio/<idioma>/<clave>.wav`), no por el texto.
- [x] Las 15 hojas de las plantillas llevan su voz, hecha con los mismos textos que muestran.
- [x] En casa suenan solas la introducción de cada escena y cada hoja; en el taller, solo con «Escuchar».
- [x] `scripts/generate_audio.py` genera desde los JSON, vuelve a generar lo que cambió y marca una clave que dice dos cosas.
- [x] Probado en el navegador.
- [ ] Los textos del huevo, escritos con Luis.

## Pendientes y siguiente paso

- Los textos del huevo, con Luis, desde la guía: qué se narra en cada escena, el texto corto y la voz.
- La voz del storyboard (`narration` en `storyboard.json`): motor, semilla y tono, a acordar con Luis antes de generar.
- Un navegador puede no dejar sonar la narración de la primera escena hasta el primer toque: los navegadores bloquean el sonido que empieza sin que nadie haya tocado la página. Revisarlo cuando exista la app del hogar, que abre el runner tras un toque.
- La voz del navegador es siempre la de español (es-MX), también en inglés (`speech.ts`).

## Log

- 2026-11-18 · Hecho:
  - `audio/voz.ts`: `textoDe`, `vozDe` y `unirFrases`.
  - `Narrado` y `Texto` en `types.ts`. Se quita `DatosItem.voice`, que nada usaba.
  - `useSceneText`: `raw` y `sheet` (board.ts).
  - Las 15 hojas de Abrir, Señalar, Beber, Estaciones, Colocar, Historia, Repasar y Destapar, con `sheet`. La portada de la Bienvenida narra la voz de su frase.
  - `narration.ts`: la grabación por clave (`.wav` o `.mp3`) y la narración por tramos, que se corta entre tramos. Se quita la búsqueda por texto y `audio.manifest.json`: no había ninguno.
  - `RunnerFrame`: «Escuchar» dice la voz de la consigna o de la hoja; en casa, la introducción suena cuando la escena ya se ve y cada hoja al abrirse.
  - `scripts/generate_audio.py` lee los JSON, recuerda lo que dice cada grabación en `audio/<idioma>/voces.json` y toma la voz del storyboard de `narration`.
  - Documentación: el README del script, `apps/player/AGENTS.md` y `PLAYER-DESIGN.md`.
  - La skill: `estructura.md` («Textos narrados y audio/») y `SKILL.md`. El zip está regenerado y falta que Luis lo suba a claude.ai.
- 2026-11-18 · Verificación:
  - `tests/voz.test.ts`: 12 pruebas aprobadas. Cubren las reglas de la voz, `sheet` y que cada texto narrado del contenido esté bien formado.
  - `generate_audio.py --dry-run` sobre el huevo: nada que generar. Sobre una copia con dos textos narrados y una clave repetida: lista las dos grabaciones y marca la repetida (código 1).
- 2026-11-18 · QA en el navegador (Player en 3001), registrando la voz del navegador y lo que reproduce el `<audio>`:
  - **En casa:** al pasar de la Bienvenida a Origen suena sola su introducción («Vamos a seguir un recorrido posible»). Al tocar la tienda, la hoja se dice sola: «Tienda. En la tienda se venden. Después llegan a la casa.».
  - **En el taller:** al entrar en Descubrimiento no suena nada y la hoja tampoco se dice sola. «Escuchar» dice la consigna, y el de la hoja, «Este huevo es de gallina. Sin manchitas.».
  - **Con un texto narrado y una grabación temporales en Descubrimiento:** la pantalla muestra la consigna corta y «Escuchar» reproduce `audio/es/descubrimiento-intro.wav`, sin la voz del navegador. Sin la grabación, dice la voz y en la consola avisa «falta audio/es/descubrimiento-intro». Vite no ve un archivo de audio nuevo hasta tocar `narration.ts`, como pasa con los SVG nuevos.
  - Lo temporal se quitó y el contenido quedó como estaba. Sin errores en la consola al cargar de cero Descubrimiento en casa.
  - Aprobado.
- 2026-11-18 · `apps/player`:
  - `npm run typecheck`, aprobado.
  - `npm test`, aprobado (13 archivos, 210 pruebas).
  - `npm run build`, aprobado.
  - En la raíz, `check-ui` y `check-context`, aprobados.

