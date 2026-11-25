# Contrato del runner

Player expone el runner y las apps lo muestran en un iframe ([decisión 004](decisions/004-runner-incrustado.md)). Este documento es el contrato entre ambos lados. El código del contrato está en `packages/ui/app/utils/runner-contract.ts` y lo usan los dos.

```text
educator.nutrinacion.com                         player.nutrinacion.com
┌─────────────────────────────────┐              ┌──────────────────────────────┐
│ /workshops/<id>/jugar           │   iframe     │ /play/<eje>/<slug>?mode=…    │
│ <UiRunner :src :guide           │ ───────────▶ │ runner (sin sesión)          │
│   @finish @exit>                │              │                              │
│                                 │ ◀── listo ── │                              │
│                                 │ ── iniciar ─▶│ (guía)                       │
│                                 │ ◀── escena ─ │                              │
│ feedback del taller ◀ finish ───│ ◀ terminado ─│                              │
└─────────────────────────────────┘              └──────────────────────────────┘
```

## 1. La URL: qué cargar

`<PLAYER>/play/<eje>/<slug>?mode=<modo>&lang=<idioma>&escena=<carpeta>`

| Parámetro | Valores | Si falta o no vale |
|---|---|---|
| `mode` | `educator`, `device`, `home` o `preview` | `educator` |
| `lang` | Un idioma que declare el storyboard | El idioma por defecto del storyboard |
| `escena` | Carpeta de una escena | La escena que el aparato recuerda (abajo) o, si no recuerda ninguna, la primera |
| `conexion` | El código de la conexión del taller (6 letras y números) | Solo en `device`: sin él, el dispositivo sigue la sesión de demostración entre pestañas. Lo pone `/unirse` al aprobarse el dispositivo (abajo) |
| `sonidos` | `1` | Sin panel. Con él, un botón por cada sonido del motor para oírlo suelto y el nombre del último que sonó. No es parte del contrato |
| `medir` | `1` | Sin medidor. Con él, sobre el runner salen los números del motor (cuadros por segundo, cuadros perdidos y lo que tarda un toque en verse) para probar en un dispositivo. No es parte del contrato: la app no lo manda |

La URL no lleva nada sensible ni identificadores de la app: ni taller, ni sesión, ni datos personales. Se construye con `runnerUrl()`.

**Al recargar** (Luis, 2026-11-20), el runner vuelve a la escena en la que iba, no al principio. En `educator` y `home` recuerda en el aparato la escena y cuáles estaban hechas (`app/runner/memory.ts`): en el educador, mientras dure la pestaña; en casa, por perfil del niño. Abierto directamente, además mantiene `escena` al día en la dirección. La escena vuelve desde su principio; las hechas conservan su marca. Al terminar el taller lo olvida. `device` sigue a la sesión y `preview`, a su app: no recuerdan nada. La app no tiene que hacer nada para esto.

`preview` es la vista previa de Admin: solo el escenario (la consigna, el juego y su hoja de feedback), sin las bandas del marco: la escena se encaja en todo el alto y la hoja de feedback sube sobre ella. No lleva la consola del taller (el avance, la escena actual, Ajustes · Reiniciar · Salir, la guía ni Siguiente) ni abre la sesión con los dispositivos, y nunca manda `terminado` ni `salir`. Conduce la app con `ir` y `reiniciar`.

## 2. Los mensajes

Todos los mensajes van por `postMessage` con canal y versión: `{ canal: 'playhub-runner', v: 1, tipo, … }`.

### Runner → app

| `tipo` | Campos | Cuándo |
|---|---|---|
| `listo` | `storyboard` (`<eje>/<slug>`), `modo`, `idioma`, `escenas` (número) | Cuando lo primero que se va a ver ya está completo en pantalla; siempre antes de la primera `escena` |
| `escena` | `indice` (desde 0), `carpeta` | Cada vez que cambia la escena, también la primera (educador, casa y vista previa; un dispositivo no la manda) |
| `terminado` | — | Se confirma «Terminar» en la última escena |
| `salir` | `indice`, `carpeta` | Se confirma «Salir» a medias |
| `error` | `codigo: 'no-encontrado'` | El storyboard no existe en el build de Player |

Nunca viajan puntos, respuestas ni datos de los participantes (constitución, «Medición agregada admitida»).

### App → runner

| `tipo` | Campos | Cuándo |
|---|---|---|
| `iniciar` | `guia?`: la guía del educador por carpeta de escena (`{ [carpeta]: { verb, objective, … } }`) | Al recibir `listo`, y de nuevo si la guía cambia |
| `ir` | `indice` (desde 0) o `escena` (carpeta) | Solo en `preview`: la app pasa de escena. El runner responde con `escena` |
| `reiniciar` | — | Solo en `preview`: la app reinicia la escena actual |
| `conexion` | `codigo` (6, sin letras que se confundan), `llave` (hexadecimal) | En `educator`, cuando la app abre la conexión del taller (`educador_iniciar`, después de `listo`) y de nuevo si el runner se recarga. Con ella el runner muestra el QR y aprueba a los dispositivos |

## 3. El saludo

1. La app monta el iframe y espera `listo`, por defecto 20 s.
2. El runner prepara lo primero que se va a ver (la letra, los dibujos de la escena y su personaje) y entonces manda `listo` y empieza a funcionar sin esperar respuesta: la app quita su carga justo cuando hay una escena entera que mostrar. Con mala red no espera para siempre: a los 10 s manda `listo` con lo que haya. El taller no se bloquea si la guía tarda.
3. La app responde `iniciar` con la guía. El runner la muestra en su panel «Guía».
4. Si no llega `listo` a tiempo, o llega `error`, la app muestra «No se pudo abrir el taller» con «Reintentar» (recarga el iframe) y su propia salida.

Si nadie contiene el runner (abierto directamente), no manda mensajes y funciona solo: casa, dispositivos y pruebas. En modo educador, la guía aparece vacía.

## 4. Qué hace cada lado al terminar o salir

| | Dentro de una app | Abierto directamente |
|---|---|---|
| «Terminar» | Manda `terminado`. Debajo queda «El taller terminó» por si la app no reacciona | Vuelve atrás o muestra «El taller terminó» |
| «Salir» | Manda `salir`, con el mismo respaldo | Vuelve atrás o muestra «El taller terminó» |

En los dos casos el runner avisa a los dispositivos de que el taller se cerró.

## 4 bis. La conexión del taller: los dispositivos que se unen (tarea 013)

Un dispositivo se une al taller sin instalar nada ni tener cuenta:

1. En la pantalla del educador, el panel Dispositivos muestra un **QR** (abre `<PLAYER>/unirse/<código>`), el **código** y la dirección corta (`<PLAYER>/unirse`) para escribirlo. Solo hay QR en un taller real: la conexión la abre Educators al iniciar un taller publicado; abierto directamente o en la vista previa no hay conexión. En desarrollo, si la pantalla está en `localhost`, el QR lleva la IP de este equipo en el Wi‑Fi (`ipEnLaRed`, de `nuxt.config.ts`), porque en un teléfono `localhost` es el propio teléfono; abierta por Tailscale o Funnel, lleva esa dirección.
2. En `/unirse/<código>` elige un **avatar** y escribe un **apodo** (opcional; sin él, el nombre del avatar: Rufo, Bruno, Lila, Michi, Rita, Leo) y pide entrar (`participante_entrar`). Espera.
3. El educador lo **aprueba** (a uno, o «Aprobar a Todos» los que esperan) o lo rechaza. «Entrar sin aprobar», un interruptor de su pantalla, aprueba solo a quien llega (una feria).
4. Aprobado, el dispositivo abre `/play/<eje>/<slug>?mode=device&lang=<idioma>&conexion=<código>` y sigue la escena y la pausa del educador. Al recargar vuelve como el mismo: recuerda su identificador, su avatar y su apodo para ese código.

Los mensajes van por **Realtime de Supabase, solo Broadcast**, en dos canales por conexión: `workshop-<código>` (educador → dispositivos: estado, órdenes, aprobado, rechazado, cierre) y `workshop-<código>-educador` (dispositivos → educador: solicitud, presencia cada 10 segundos, hola, adiós), que solo escucha el educador. Lo que manda y queda registrado va por las funciones de la base: el educador con el código y la llave (`conexion_*`), el dispositivo con el código (`participante_*`); ver [backend](backend.md). El código vale mientras el taller está en curso; `educador_terminar` cierra la conexión y deja en el cierre cuántos dispositivos se unieron. Sin conexión (abierto directamente, o una app sin Supabase), la sesión es la de demostración entre pestañas del mismo navegador, con seis dispositivos de prueba. Todo lo que depende del servicio está en `app/runner/conexion/realtime.ts`.

## 5. Seguridad

- **El runner solo habla con orígenes permitidos:** los de Admin y Educators, con su dirección en la base (`configuraciones`, `admin_url` y `educators_url`). Los lee al abrirse dentro de un iframe, sin sesión, y los guarda en el aparato por si la base no responde (`runner/urlsDeLasApps.ts`); hasta tenerlos, lo que tiene que contar espera.
  - Acepta mensajes de la ventana que lo contiene y de esos orígenes.
  - Hasta saber cuál es, manda cada evento a cada origen permitido; el navegador solo lo entrega al que coincide.
  - Después, solo a ese. Nunca a `*`.
- **La app solo escucha a su iframe:** mismo origen que la URL del runner y `event.source` igual a ese iframe.
- **Player limita quién lo incrusta:** `Content-Security-Policy: frame-ancestors 'self' <orígenes>` en `/play/**`, con los mismos orígenes. La pone el servidor de Player leyendo la base, con un minuto de memoria (`server/middleware/marco-del-runner.ts`): cambiar una dirección no pide recompilar. Servido como archivos estáticos, la tendría que poner el proveedor.
- **La guía se sanea al llegar:** solo pasan los campos de texto conocidos de cada escena y se muestra como texto, nunca como HTML.
- **Permisos del iframe:** `allow="autoplay; fullscreen; screen-wake-lock"`.
- **La conexión del taller:** lo que llega por Realtime lo puede mandar cualquiera que tenga el código, así que se lee con su forma (`conexion/mensajes.ts`) y el educador solo cuenta a quien aprobó en la base. Aprobar, rechazar y anotar presencia piden la llave, que solo tiene la pantalla del educador (la base guarda su huella). Un dispositivo no recibe las señales de los demás.

## 6. Versiones

- Un cambio del contrato es **aditivo**: un campo nuevo es opcional y un `tipo` nuevo se ignora en el lado que no lo conoce. Así Player y las apps se despliegan cada uno cuando quiere.
- Un mensaje con `v` mayor se acepta si su `tipo` es conocido.
- Un cambio incompatible sube `v` y obliga a mantener los dos formatos mientras haya apps sin actualizar.

## 7. Quién lo usa

| App | Cómo | Estado |
|---|---|---|
| Educators | `/workshops/<id>/jugar`: pantalla completa con `UiRunner` en modo educador y la guía. `terminado` lleva al feedback del taller; `salir`, a donde estaba | Hecho, con Supabase (`educador_iniciar` con `listo`, `educador_terminar` con `terminado`) |
| Admin | En el detalle de un storyboard de la organización, «Vista previa» con `UiRunner` en modo `preview`: Admin conduce con `ir` y `reiniciar` (anterior, siguiente, la escena de la lista) y lleva la cuenta con `listo` y `escena`. «Probar» de Platform sigue abriendo el modo educador en otra pestaña | Hecho |
| App del hogar | `UiRunner` en modo casa y, con «Unirme», en modo dispositivo dentro de un taller: escanea el QR o escribe el código y entra con el perfil del niño (diseño en la [tarea 013](../tasks/013-runner-en-el-aula.md)) | Por construir ([decisión 011](decisions/011-organizacion-como-unidad-de-operacion.md)) |
| Dispositivos de participantes | Se unen con el QR o el código en `/unirse` y abren Player directamente (`?mode=device&conexion=`), sin iframe | Hecho, por Realtime de Supabase (tarea 013; falta la prueba en teléfonos reales) |

## 8. Configuración

Las direcciones de las apps no son variables: viven en la base, en `configuraciones` (`admin_url`, `player_url`, `educators_url`), y en producción solo se cambian ahí ([backend](backend.md)). Con ellas, Admin y Educators abren el runner, Player sabe quién puede incrustarlo y el QR del taller lleva a Player. Cada app solo necesita saber dónde está la base:

| App | Variable | Para qué |
|---|---|---|
| Player | `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY` | La gestión y la conexión del taller (Realtime y las funciones `conexion_*` y `participante_*`). El QR lleva `configuraciones.player_url`: en producción, la dirección pública de Player |
| Educators y Admin | `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Todo lo demás, también dónde está Player (`configuraciones.player_url`) |

En local, `localhost:3001` dentro de `localhost:3002` también es el mismo sitio, así que se comporta como en producción. En desarrollo, Player también se deja incrustar desde la tailnet (nombres `*.ts.net` y las IP de este equipo); ver «Compartir en desarrollo por Tailscale» en el [README](../README.md).

## 9. Pendiente

En la [tarea 013](../tasks/013-runner-en-el-aula.md):
- la prueba de la conexión del taller en teléfonos reales;
- `preparar` para usar sin conexión;
- voces desde el bucket;
- prueba en iPad y Android;
- «Probar» de Platform con `UiRunner`.

El `material` de cada escena, en la [tarea 014](../tasks/014-guia-completa-para-el-educador.md).
