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
| `mode` | `educator`, `device` o `home` | `educator` |
| `lang` | Un idioma que declare el storyboard | El idioma por defecto del storyboard |
| `escena` | Carpeta de una escena | La primera escena |

La URL no lleva nada sensible ni identificadores de la app: ni taller, ni sesión, ni datos personales. Se construye con `runnerUrl()`.

## 2. Los mensajes

Todos los mensajes van por `postMessage` con canal y versión: `{ canal: 'playhub-runner', v: 1, tipo, … }`.

### Runner → app

| `tipo` | Campos | Cuándo |
|---|---|---|
| `listo` | `storyboard` (`<eje>/<slug>`), `modo`, `idioma`, `escenas` (número) | Al cargar, antes de la primera escena |
| `escena` | `indice` (desde 0), `carpeta` | Cada vez que cambia la escena, también la primera (educador y casa) |
| `terminado` | — | Se confirma «Terminar» en la última escena |
| `salir` | `indice`, `carpeta` | Se confirma «Salir» a medias |
| `error` | `codigo: 'no-encontrado'` | El storyboard no existe en el build de Player |

Nunca viajan puntos, respuestas ni datos de los participantes (constitución, «Medición agregada admitida»).

### App → runner

| `tipo` | Campos | Cuándo |
|---|---|---|
| `iniciar` | `guia?`: la guía del educador por carpeta de escena (`{ [carpeta]: { verb, objective, … } }`) | Al recibir `listo`, y de nuevo si la guía cambia |

## 3. El saludo

1. La app monta el iframe y espera `listo`, por defecto 20 s.
2. El runner manda `listo` y empieza a funcionar sin esperar respuesta. El taller no se bloquea si la guía tarda.
3. La app responde `iniciar` con la guía. El runner la muestra en su panel «Guía».
4. Si no llega `listo` a tiempo, o llega `error`, la app muestra «No se pudo abrir el taller» con «Reintentar» (recarga el iframe) y su propia salida.

Si nadie contiene el runner (abierto directamente), no manda mensajes y funciona solo: casa, dispositivos y pruebas. En modo educador, la guía aparece vacía.

## 4. Qué hace cada lado al terminar o salir

| | Dentro de una app | Abierto directamente |
|---|---|---|
| «Terminar» | Manda `terminado`. Debajo queda «El taller terminó» por si la app no reacciona | Vuelve atrás o muestra «El taller terminó» |
| «Salir» | Manda `salir`, con el mismo respaldo | Vuelve atrás o muestra «El taller terminó» |

En los dos casos el runner avisa a los dispositivos de que el taller se cerró.

## 5. Seguridad

- **El runner solo habla con orígenes permitidos:** la lista `NUXT_PUBLIC_RUNNER_HOSTS` de Player.
  - Acepta mensajes de la ventana que lo contiene y de esos orígenes.
  - Hasta saber cuál es, manda cada evento a cada origen permitido; el navegador solo lo entrega al que coincide.
  - Después, solo a ese. Nunca a `*`.
- **La app solo escucha a su iframe:** mismo origen que la URL del runner y `event.source` igual a ese iframe.
- **Player limita quién lo incrusta:** `Content-Security-Policy: frame-ancestors 'self' <orígenes>` en `/play/**`, con la misma lista.
- **La guía se sanea al llegar:** solo pasan los campos de texto conocidos de cada escena y se muestra como texto, nunca como HTML.
- **Permisos del iframe:** `allow="autoplay; fullscreen; screen-wake-lock"`.

## 6. Versiones

- Un cambio del contrato es **aditivo**: un campo nuevo es opcional y un `tipo` nuevo se ignora en el lado que no lo conoce. Así Player y las apps se despliegan cada uno cuando quiere.
- Un mensaje con `v` mayor se acepta si su `tipo` es conocido.
- Un cambio incompatible sube `v` y obliga a mantener los dos formatos mientras haya apps sin actualizar.

## 7. Quién lo usa

| App | Cómo | Estado |
|---|---|---|
| Educators | `/workshops/<id>/jugar`: pantalla completa con `UiRunner` en modo educador y la guía. `terminado` lleva al feedback del taller; `salir`, a donde estaba | Hecho, con Supabase (`educador_iniciar` con `listo`, `educador_terminar` con `terminado`) |
| Admin | «Probar» con `UiRunner` y la guía de su base, para revisarla antes de publicar | Pendiente; hoy abre el runner en otra pestaña |
| App del hogar | `UiRunner` en modo casa | Por crear |
| Dispositivos de participantes | Abren Player directamente (`?mode=device`), sin iframe | Sesión simulada entre pestañas |

## 8. Configuración

| App | Variable | Para qué |
|---|---|---|
| Player | `NUXT_PUBLIC_RUNNER_HOSTS` | Orígenes que pueden incrustar el runner, separados por comas. Se usa para los mensajes y para `frame-ancestors`, que se fija al compilar |
| Educators (y Admin) | `NUXT_PUBLIC_PLAYER_URL` | Dónde está Player |

En local, `localhost:3001` dentro de `localhost:3002` también es el mismo sitio, así que se comporta como en producción.

## 9. Pendiente

En la [tarea 009](../tasks/009-runner-dentro-de-educators.md):
- `preparar` para usar sin conexión;
- voces desde el bucket;
- Admin «Probar» con `UiRunner`;
- prueba en iPad y Android.
