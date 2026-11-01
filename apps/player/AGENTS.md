# Player

SPA Nuxt 4 (capa `@playhub/ui`, Tailwind 4): la app de la administración de Nutrinación para construir, probar y publicar los juegos. Expone el runner público (`/play/**`), que las demás apps incrustan en un iframe con el contrato de [`docs/runner.md`](../../docs/runner.md) ([decisión 004](../../docs/decisions/004-runner-incrustado.md)); el resto es la gestión del build (catálogo, detalle, su registro en la base y su publicación). No es la app del hogar, que no se construye ahora ([decisión 011](../../docs/decisions/011-organizacion-como-unidad-de-operacion.md)). **La gestión es solo para el superadmin** (Supabase Auth con las cuentas de Admin, [decisión 005](../../docs/decisions/005-base-nueva-y-acceso-educador.md)); **el runner `/play/**` es público** y no usa Supabase. El runner es el player de referencia de PlayHub (`../../packages/ui/lab/`, `PLAYER-DESIGN.md`) portado a Vue; el contenido sigue `../../../skills/playhub-storyboard-games/references/estructura.md` ([decisión 003](../../docs/decisions/003-runner-playhub.md)).

## Estructura

- `app/pages/play/[category]/[id].vue`: runner público. `?mode=educator|device|home`, `?lang=` y `?escena=<carpeta>`. Dentro de un iframe de un origen de `NUXT_PUBLIC_RUNNER_HOSTS`, habla con la app que lo contiene (`runner/useHost.ts`): le manda `listo`, `escena`, `terminado`, `salir` y `error`, y recibe la guía con `iniciar`.
- `app/runner/`: el marco del taller (`RunnerFrame.vue`, portado del player de referencia), la guía y los dispositivos, las plantillas (`templates/`: Anuncio, Destapar, Colocar), la carga del contenido (`content.ts`), los perfiles de edición, Rive, la narración (`audio/`) y su CSS (`runner.css`). La guía no vive aquí: la da la app que incrusta el runner; abierto directamente, el panel «Guía» sale vacío.
- `app/pages/storyboards/`: la gestión del catálogo (decisiones [006](../../docs/decisions/006-modelo-y-catalogo-desde-player.md) y [007](../../docs/decisions/007-educador-hogar-y-ciclo-del-workshop.md)). La lista es una tabla: por storyboard, su estado frente a la base (sin registrar, desactualizado, al día), su publicación (estado, organización, países), su guía escrita por idioma y «Registrar/Actualizar» en la fila; con «Registrar N pendientes» como acción principal y, aparte, «En la base, sin JSON en este build» solo para archivar. El detalle lleva los dos estados y qué toca hacer en la cabecera, una sola acción en lima (registrar/actualizar, solo cuando hace falta), «Lo que viene del JSON» (metadata, qué cambió campo por campo si está desactualizado, escenas con plantilla y guía por idioma), «Publicación» (estado, países del catálogo `paises` como filtros, organización si es personalizado) y «Guía» (escenas escritas de N por idioma, solo lectura, con enlace a Admin si `configuracion.admin_url` se puede leer). Lógica en `composables/useCatalogoBase.ts`; la metadata, su validación contra los enums de la base (`Constants`), la comparación con sus diferencias y la traducción de los errores de la base en `utils/storyboardMetadata.ts`; los estados, la guía por idioma y «qué toca ahora» en `utils/catalogoResumen.ts`. Todo puro y con test.
- Entrada de la gestión: `app/pages/entrar.vue`, `composables/useSesion.ts` (comprueba `perfiles.superadmin`; si no lo es, cierra la sesión) y `middleware/sesion.global.ts`, que deja pasar `/play/**` sin tocar Supabase. Cliente tipado en `utils/supabase.ts` (`supabase/database.types.ts`).
- `content/storyboards/<eje>/<storyboard>/`: `storyboard.json` (con la metadata que va al catálogo: `key`, `type`, `category`, `audience`, `healthFocus`, idiomas, duración y escenas), `datos.json`, voces y `scenes/<escena>/scene.json` (+ `scene.vue` si no hay plantilla).
- `content/library/` (`rive/`, `svg/`, `sfx/`): la única librería de dibujos, animaciones y efectos.
- `scripts/generate_audio.py`: genera las voces ([`scripts/README.md`](scripts/README.md)).

## Reglas

- Una escena es una plantilla más su contenido: `scene.json` declara `template`; un `scene.vue` propio existe solo cuando ninguna plantilla sirve. Una plantilla habla con el marco solo con eventos (`feedback`, `progress`, `complete`) y no sabe en qué modo corre.
- La edición sale de `audience` del storyboard (un storyboard es una edición).
- Todo texto de juego va en JSON por idioma, nunca en el código. La UI de gestión es español.
- Todo sale de `@playhub/ui`: la gestión en densidad `compact`, el runner en `touch`. El kit manda (`packages/ui/DESIGN.md`, «Profundidad» y «Roles de color»): sin pasos de paleta, hex, sombras ni tamaños sueltos; la navegación actual en tinte lima claro (`ui-nav-item`).
- El runner no usa Supabase ni sesión: nunca lo importes desde `app/runner/` ni desde `/play/**`. La gestión lo usa para la entrada del superadmin, para registrar el catálogo con `sincronizar_storyboard` y para publicarlo con `publicar_storyboard`. La guía es de Admin/Platform: nunca la escribas desde Player. Los países no van en el JSON. Si cambia una columna de la metadata, cambia `utils/storyboardMetadata.ts`, la función de la base y su prueba pgTAP.
- El contrato con las apps que incrustan el runner (`packages/ui/app/utils/runner-contract.ts`) solo cambia de forma aditiva; documenta cualquier cambio en `docs/runner.md`. Nunca mandes puntos ni respuestas a la app.

## Desarrollo y verificación

```bash
cp .env.example .env.local   # NUXT_PUBLIC_RUNNER_HOSTS y la URL y anon key de Supabase (supabase status)
npm install
npm run dev                  # http://localhost:3001
npm run typecheck && npm test && npm run build
```

`typecheck` incluye `content/**/*.ts|vue`. Para escenas, añade QA en el runner a tamaño de teléfono y de tableta, con el idioma y el audio que apliquen.
