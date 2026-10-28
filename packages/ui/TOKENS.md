# PlayHub UI Kit · Tokens

Versión 0.3.0. La fuente de verdad es `css/tokens.css` del paquete `@playhub/ui`. Este documento explica cómo está organizado y cómo usarlo.

## Regla principal

**Los componentes solo leen tokens.** En `css/components.css`, los `Ui*`, el runner de Player, el laboratorio y los HTML no se escriben hex, `rgb()` ni clases del tipo `text-[#…]`. Los tamaños de texto salen de `--text-*` y los radios de `--radius-*` (`rounded-chip`, `rounded-control-sm`, `rounded-control`…), no de `text-2xl` ni `rounded-xl`. El `theme-color` del navegador también se toma de un token en tiempo de ejecución. Si hace falta un color nuevo, se agrega primero en `css/tokens.css`. Como la paleta por defecto de Tailwind está eliminada (`--color-*: initial`), un color que no sea token ni siquiera existe como clase.

## Cuatro capas

Cada capa solo lee de la anterior.

| Capa | Qué contiene | Ejemplo | Quién la usa |
| --- | --- | --- | --- |
| 1 · Paleta | Escalas de color crudas | `--color-sky-400` | Roles y tonos. Rara vez un componente. |
| 2 · Roles | Para qué sirve un color | `--color-surface`, `--color-muted` | Componentes y páginas |
| 3 · Tonos | Un contrato común (`--tone-*`) que cambia con `data-tone` | `data-tone="sky"` | Todos los componentes con color |
| 4 · Escala | Tamaños, texto, relieve, movimiento, en dos densidades | `--ph-control`, `--text-body` | Todos los componentes |

### 1 · Paleta

`night` (estructura; 900 es el azul noche de marca), `lime` (acción; 400 es la lima de marca), `sun`, `coral`, `sky`, `grape`, `rose` y `mint` (reservado). Los pasos van de 50 a 900. `night` añade 0, 25, 150, 850 y 950, y `lime` añade 150. Hay alias cortos: `bg-lime` equivale a `bg-lime-400`.

### 2 · Roles

| Token | Uso | Clase Tailwind |
| --- | --- | --- |
| `--color-canvas` | Fondo de página y escenario del player | `bg-canvas` |
| `--color-surface` | Tarjetas, ventanas, controles blancos | `bg-surface` |
| `--color-sunken` | Escenarios hundidos, rieles de pestañas | `bg-sunken` |
| `--color-line` / `--color-line-strong` | Divisores / contorno de controles | `border-line` |
| `--color-depth` / `--color-depth-strong` | Base de 3–4 px bajo paneles / ventanas | `shadow-panel`, `shadow-dialog` |
| `--color-ink` | Texto principal | `text-ink` |
| `--color-muted` | Texto secundario (≥ 4,5:1 sobre canvas) | `text-muted` |
| `--color-subtle` | Separadores y adornos de texto (no para texto que haya que leer) | `text-subtle` |
| `--color-disabled` | Texto deshabilitado y placeholders | `text-disabled` |
| `--color-inverse` | Texto sobre fondos oscuros | `text-inverse` |
| `--color-focus` | Contorno de foco genérico | — |
| `--color-scrim` | Velo detrás de un diálogo y de las ventanas del player | — |
| `--color-success · info · warning · danger` (+ `-bg`, `-line`) | Estados del sistema. No son colores de marca. | `text-success`… |

### 3 · Tonos

Todo componente con color lee las mismas variables:

| Variable | Significado |
| --- | --- |
| `--tone-fill` | Cara de un control sólido, un medidor o una cinta: color plano, sin degradados ni brillos. La base en relieve se lee limpia debajo de un color plano |
| `--tone-top` | Un paso más claro del tono (icono de la cinta; lo usan los prototipos) |
| `--tone-edge` | Base en relieve bajo el control |
| `--tone-on` | Texto o icono sobre la cara sólida |
| `--tone-focus` | Marca de foco sobre el control |
| `--tone-mid` | Relleno secundario (colas de listón, chispas) |
| `--tone-wash` | Fondo más tenue (tarjeta seleccionada) |
| `--tone-tint` / `--tone-tint-edge` | Fondo suave y su base |
| `--tone-strong` | Texto sobre el fondo suave |
| `--tone-icon` | Icono sobre el fondo suave |

Tonos disponibles y su intención:

| `data-tone` | Intención |
| --- | --- |
| `lime` | Acción principal: avanzar, confirmar, comenzar. Es el tono por defecto. |
| `sun` | Acento y celebración; también el reintento amable. |
| `coral` | Salir o una acción con consecuencia. **No** significa error. |
| `sky` | Información, selección, tiempo. |
| `grape` | Novedad, acento secundario. |
| `rose` | Cuidado y vidas. **No** significa error. |
| `night` | Contraste. |
| `neutral` | Acción secundaria (cara blanca con contorno). |
| `success · info · warning · danger` | Estados del sistema, para avisos. |

El tono se hereda: un `data-tone` en un contenedor colorea lo que hay dentro. Algunos componentes fijan su propio tono por defecto para no heredar por accidente: `.ui-button` y `.progress-track` usan `lime`; `.ribbon` y `.progress-segments` usan `sun`; `.badge` y `.mini-action` usan `neutral`. Para cambiarlo basta ponerle `data-tone` al propio componente.

El feedback de actividad usa `data-kind`, que se traduce a un tono: `selection` → sky, `success` → lime, `retry` → sun, `complete` → lime.

```html
<button class="ui-button" data-tone="sky">…</button>
<span class="badge" data-tone="grape">Novedad</span>
<div class="ribbon" data-tone="coral">…</div>
<span class="ui-symbol" data-tone="sun"><svg class="icon">…</svg></span>
<div class="ui-feedback" data-kind="retry">…</div>
```

### 4 · Escala

La escala tiene **dos densidades**, que se heredan por contenedor con `data-density` (en `<html>` o en cualquier bloque):

| Densidad | Para qué | `--ph-control` (sm · lg) | `--ph-icon` (lg) | Relieve | Progreso |
| --- | --- | --- | --- | --- | --- |
| `compact` (por defecto) | Apps de gestión con ratón: Admin, gestión de Player | 40 (32 · 48) | 18 (24) | 3 px | 10 px |
| `touch` | Runner de Player y Educators, en teléfonos y tabletas; 48 es el área táctil mínima | 48 (40 · 56) | 20 (28) | 4 px | 16 px |

La forma no cambia con la densidad: `--ph-radius` es 12 en las dos.

Dentro de una densidad, los componentes tienen variantes `sm`, `md` y `lg` (`ui-button-sm`, `ui-button-lg`, `field-sm`, `field-lg`…) para dar jerarquía. Los tokens de texto son `--text-micro` (10), `caption` (12), `body` (14), `action` (14), `subtitle` (16), `lead` (18), `title` (20), `heading` (24) y `display` (36), disponibles como `text-body`, etc. Para la escena del player, que se lee a distancia en un proyector o una TV, hay tamaños propios: `counter` (16, valor del contador compacto), `headline` (28), `headline-lg` (32), `figure` (44), `figure-lg` (48) y `hero` (88). Radios, iguales en todas las apps y densidades: `--radius-chip` 8 (insignias), `control-sm` 12 (botones, campos, filtros, pestañas: `--ph-radius`), `control` 14 (contadores, avisos, horas), `card` 16 (símbolos), `panel` 16 (tarjetas, paneles, tablas, bandejas), `dialog` 20 (ventanas y piezas del tablero) y `pill`, solo para lo redondo por naturaleza (puntos, interruptores, progreso, burbujas de contador). Los controles de una línea miden exactamente `--ph-control`. Relieve: `--ph-depth` (3 px en compacta, 4 en táctil), la única base de todo lo elevado (controles y superficies; `--shadow-panel` y `--shadow-raised` la usan), que baja a 1 px al pulsar. Ver «Profundidad» en `DESIGN.md`. Barra de progreso: `--ph-progress` (10 px en compacta, 16 en táctil; `lg`, ×1,5). Movimiento: 160 ms y 350 ms con `--ease-playful`.

La escala no cambia por audiencia. El runner usa `touch` y aplica un zoom controlado a todo el marco para ocupar el máximo de cada pantalla. Lo que distingue a cada edición (voz, ejemplos, qué se celebra) lo pone el storyboard.

## Componentes reutilizables

Todo tamaño de componente sale de `--ph-control`, `--ph-icon` o de los tokens de texto:

- **Roles de texto:** `ui-display`, `ui-heading`, `ui-title`, `ui-text` y `ui-caption`. Úsalos en lugar de `text-2xl`, `text-sm`, etc.
- **Ventana:** `dialog` + `dialog-header`, `dialog-close` (siempre arriba a la derecha, botón `neutral` redondo), `dialog-center`, `dialog-body`, `dialog-actions` y `dialog-actions-split`. Este último pone dos acciones lado a lado y las apila cuando el texto no cabe.
- **Controles con tono:** `ui-switch`, `check-control`, `ui-range`, `field` (foco), `ui-tab`, `ui-navbar` y `select-card` leen `--tone-*`. Por defecto son lima.
- **Área táctil:** `mini-action` se ve pequeño, pero su zona de toque llega a 44 px.
- **Botones:** no parten su etiqueta en dos líneas; si no cabe, el contenedor debe darle espacio.
- **Confirmaciones:** el tono sigue la intención: `lime` para continuar o terminar, `sun` para volver a empezar y `coral` para salir o borrar.

## Ajustes de paleta en 0.2.1

Todos los pares de texto cumplen al menos 4,5:1 (WCAG AA).

| Token | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| `night-600` (texto secundario) | `#637087` | `#5a6780` | Contraste de 4,4 → 5,0 sobre superficies hundidas |
| `night-500` (deshabilitado, placeholder) | `#78849b` | `#6c7890` | Placeholders legibles (4,4:1 sobre blanco) |
| `night-400` | `#8b95a7` | `#8691a4` | Escala más pareja |
| `lime-500` | `#9bc636` | `#9dc210` | Quitaba saturación y cambiaba de matiz a mitad de la escala |
| `sun-700` | `#b1840e` | `#a67a0a` | Iconos sobre tinte a ≥ 3,4:1; el acento del título pasa de 3,2 a 3,6:1 |
| `sky-200` | `#c0dce9` | `#b6e1f4` | Era grisáceo; ahora continúa la escala |
| `coral-900`, `sky-900`, `grape-900`, `rose-900` | — | un paso más oscuros | Texto sobre botón sólido ≥ 5,2:1 (rose estaba en 4,2) |

## Ajustes de paleta posteriores

| Token | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| `night-25` (`--color-canvas`) | `#f5f6fa` | `#f3f7fc` | Misma luminosidad, en el matiz del azul noche de marca (oklch 260°, como el resto de `night`). Antes se iba a 275° y se veía lavanda junto a los bordes y textos azul grisáceo |

## Revisar la biblioteca por partes

`index.html?section=tokens` muestra una sola familia.

## Usar el kit

- **Apps Nuxt:** `extends: ['@playhub/ui']` en `nuxt.config.ts`. La capa añade Tailwind 4, `css/index.css` y los componentes `Ui*` (`app/components/ui/`). La densidad se fija con `data-density`.
- **CSS propio de una app:** empieza con `@reference "@playhub/ui/css/index.css";` para poder usar `@apply` y los tokens.
- Usa `data-tone` y clases de rol (`bg-surface`, `text-muted`, `border-line`) en lugar de colores.
- Rive y otros motores leen los valores en tiempo de ejecución con `getComputedStyle(document.documentElement).getPropertyValue('--color-sun-400')`. Los tokens se emiten siempre gracias a `@theme static`.
