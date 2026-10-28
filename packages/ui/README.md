# @playhub/ui · PlayHub UI Kit

La fuente única de estilos y componentes de las apps web de PlayHub (Admin, Player y Educators): tokens, CSS de componentes, componentes Vue `Ui*`, iconos y fuente Nunito, empaquetados como **capa de Nuxt**. Un cambio aquí llega a todas las apps al recompilarlas ([decisión 001](../../docs/decisions/001-ui-kit-compartido.md)).

| Ruta | Contenido |
| --- | --- |
| `css/tokens.css` | Tokens en cuatro capas: paleta, roles, tonos (`data-tone`) y escala en dos densidades (`data-density`) |
| `css/base.css`, `css/components.css` | Fuente, reglas base y familias de componentes (`ui-button`, `field`, `dialog`, `ui-table`…) |
| `css/index.css` | Entrada para las apps: Tailwind 4 más todo lo anterior |
| `app/components/ui/` | Componentes Vue `Ui*` (botón, campos, selector, tabla, ventana, avisos…) y `UiRunner`, el runner de Player incrustado |
| `app/composables/` | `useToast` y `useUiLabels` (textos del kit, inyectables por cada app) |
| `app/utils/` | Iconos (`ui-icons.ts`) y tonos (`ui-tones.ts`): tipos y los mapas compartidos de estado de sesión, publicación, área y tono estable por nombre. `runner-contract.ts`: el contrato entre el runner y las apps que lo incrustan ([`docs/runner.md`](../../docs/runner.md)) |
| `icons.json` | La iconografía: una sola fuente para los `Ui*` y el laboratorio |
| `lab/` | Laboratorio: lámina de componentes (`index.html`) y player de prototipo (`player.html`) |
| `TOKENS.md`, `DESIGN.md`, `PLAYER-DESIGN.md` | Cómo usar los tokens, la dirección visual y el diseño del player |

## Usar en una app

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['@playhub/ui'] })
```

- Densidad: `compact` por defecto (gestión con ratón). El runner y Educators fijan `data-density="touch"`.
- Textos del kit en otro idioma: `provideUiLabels(() => ({ cancel: t('common.cancel'), … }))` en `app.vue`.
- Avisos flotantes: monta `<UiToaster />` una vez y usa `useToast()`.
- CSS propio: `@reference "@playhub/ui/css/index.css";` al inicio del archivo.
- Las dependencias se instalan desde la raíz del monorepo (`npm install`).

## Laboratorio

```bash
npm run lab:build --workspace @playhub/ui   # assets, iconos y CSS
npm run lab --workspace @playhub/ui         # http://localhost:4178/lab/
```

`lab:build` copia al laboratorio el logo, la fuente, el runtime de Rive y los dibujos del huevo desde la librería de Player, y genera `lab/icons.js` desde `icons.json`. Todo eso queda fuera de Git. Para trabajar los estilos, `npm run lab:watch --workspace @playhub/ui`.

El player de prototipo (`lab/player.html`) es la referencia de diseño del runner de Player: `?mode=educator|device|home`, `?escena=<id>`. La sesión entre dispositivos se simula entre pestañas.

## Mantener

- Los componentes solo leen tokens. Un color nuevo empieza en `css/tokens.css`.
- Cambiar un `Ui*` o un token afecta a todas las apps: verifica con `./scripts/verify.sh` desde la raíz (incluye `check-ui.mjs`, que vigila que las vistas no escriban colores ni medidas sueltas) y revisa el laboratorio.
- Iconos: Lucide (ISC, ver `lucide-LICENSE.txt`). Fuente: Nunito (OFL, `fonts/Nunito-LICENSE.txt`).
