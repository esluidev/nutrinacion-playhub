---
id: 009
estado: haciendo
prioridad: alta
creada: 2026-10-14
---
# Cómo se reparten el runner y su contenido entre las apps

## Objetivo

Decidir con Luis dónde viven el runner y su contenido, y cómo los usan las apps.

El problema de partida (Luis, 2026-10-14) es que Educators no debe navegar a otra app por URL. Tiene que contener el taller y enterarse de lo que pasa, para mostrar el feedback al terminar, como en la app Flutter original. Hoy existe una navegación provisional por URL (`?taller`, `apps/player/app/utils/alTerminar.ts`).

## Estado

**Decidido el 2026-10-15** ([decisión 004](../docs/decisions/004-runner-incrustado.md)). Luis aprobó el iframe y cómo se renderiza el runner. El contrato vigente está en [docs/runner.md](../docs/runner.md).

Lo que sigue a «Decisión y avance» es el análisis previo, que se conserva como historia.

## Decisión y avance

Luis, 2026-10-15:
- **Subdominios** `admin.`, `educator.` y `player.nutrinacion.com`.
- **Player expone el runner** y es la app de la administración de Nutrinación para construir y publicar el contenido. **No es la app del hogar**, que se creará después.
- **Las apps renderizan el runner en un iframe** con el contrato.
- **En un bucket de Supabase irán solo las voces de narración.** Efectos, Rive y SVG pesan poco (≈ 30 KB cada uno) y siguen en el build de Player.
- Empezar a implementar para probar **sin Supabase**.

### Criterios

| Criterio | Evidencia | Estado |
|---|---|---|
| Educators abre el taller con el runner incrustado, sin salir de su app | Navegador: `/workshops/t-101/jugar`, iframe de `localhost:3001` con estado `ready` | aprobado |
| La guía llega desde Educators, no desde Player | Navegador: el panel «Guía» muestra la de `apps/educators/app/fixtures/guia-el-huevo.json`; Player ya no tiene fixtures | aprobado |
| «Terminar» lleva al feedback del taller | Navegador: de la escena 4/4, «Terminar» → `/workshops/t-101/cierre` | aprobado |
| «Salir» a medias vuelve a donde estaba | Navegador: calendario → «Iniciar taller» → «Salir» → `/` | aprobado |
| Si Player no responde: error con «Reintentar» y salida | Navegador: Player parado → a los 20 s, el error con «Reintentar» y «Talleres»; Player arrancado → «Reintentar» lo abre | aprobado |
| Solo las apps permitidas pueden incrustarlo | `curl`: `/play/**` devuelve `frame-ancestors 'self' http://localhost:3002 http://localhost:3000 http://localhost:3100`; la gestión no | aprobado |
| Mensajes validados en los dos lados | Vitest: `apps/player/tests/runnerContract.test.ts` (9 casos: canal, versión, forma, guía saneada, orígenes, URL); revisión de código de `UiRunner` y `useHost` | aprobado |
| Los dispositivos siguen al educador incrustado | Navegador: una pestaña `?mode=device` en `localhost:3001` recibe la escena del educador dentro del iframe | aprobado |
| Funciona en iPad (Safari) y Android: audio, almacenamiento, sin conexión | — | no ejecutado |

### Hecho

- [x] Contrato en el kit: `packages/ui/app/utils/runner-contract.ts` (tipos, `runnerMessage`, `parseRunnerEvent`, `parseRunnerCommand` con la guía saneada, `runnerOrigins`, `runnerUrl`).
- [x] `UiRunner` en el kit:
  - iframe con `allow`;
  - escucha solo a su iframe y a su origen;
  - saludo y espera de 20 s;
  - error con «Reintentar» y un slot `failed` para la salida de la app.
- [x] Player:
  - `runner/useHost.ts` y la página `/play/**`: `listo` antes del marco, `escena`, `terminado`, `salir`, `error`; la guía llega con `iniciar`.
  - `RunnerFrame` emite en lugar de navegar cuando está incrustado.
  - `NUXT_PUBLIC_RUNNER_HOSTS` y `frame-ancestors`.
  - Se retiraron `utils/alTerminar.ts` con su test, `runner/guide.ts` y `runner/fixtures/`.
- [x] Educators:
  - `/workshops/[id]/jugar` a pantalla completa con zonas seguras;
  - «Iniciar taller» va ahí;
  - la guía de prueba se movió a `app/fixtures/guia-el-huevo.json` (`useTalleres().guia`);
  - `urlDelTaller` sin `?taller`;
  - textos del kit en inglés.
- [x] Documentación:
  - `docs/runner.md`;
  - decisión 004 (y la nota en la 002);
  - `docs/architecture.md`, `docs/README.md`, `.harness/project.md`;
  - los `AGENTS.md` de Player y Educators;
  - el README del kit;
  - la tarea 006.

### Pendiente

- [ ] **Prueba en iPad (Safari) y Android** (QA humano o con dispositivo):
  - que la primera voz suene sin un toque extra dentro del iframe;
  - pantalla completa;
  - zonas seguras;
  - que el almacenamiento del iframe sea el de Player.
- [ ] **Sin conexión:**
  - service worker en Player;
  - orden `preparar` para que Educators pida los talleres de la semana;
  - probar que siguen días después.
- [ ] **Voces en un bucket de Supabase:** la narración (`runner/audio/narration.ts`) hoy carga WAV del build por `import.meta.glob`. Hay que pasarla a URL del bucket, publicar comprimido y decidir si el bucket es público o con enlaces firmados. Depende de Supabase local (tarea 006).
- [ ] **Admin «Probar» con `UiRunner`** y la guía de su base. Hoy abre otra pestaña. Lo de `?start=` ya está corregido (2026-10-15, tarea 006): «Probar» usa `runnerUrl` con la carpeta del área y `?escena=<carpeta>`, y la URL sale de `configuracion.player_url`.
- [ ] **Despliegue:** subdominios y `NUXT_PUBLIC_RUNNER_HOSTS` con los orígenes reales al compilar Player. Requiere autorización de Luis.
- [ ] **Peso del build de Player** con el catálogo completo (cientos de MB, miles de archivos): revisar los límites del proveedor.

## Hechos medidos (2026-10-14)

- **Contenido actual:** 216 KB. Un storyboard («El huevo», 4 escenas), 7 SVG y 1 Rive de 124 KB. Todavía no hay voces generadas.
- **Build de Player:** 5,2 MB.
  - Dos runtimes de Rive de 2,1 MB cada uno (`rive.wasm` y su respaldo).
  - El código del runner y la app.
  - El contenido.
- **El runner carga el contenido al compilar** (`import.meta.glob` en `runner/content.ts` y `audio/narration.ts`). La app que contiene el runner mete en su build **todos** los storyboards, Rive, SVG y voces.
- **Las voces se generan en WAV de 16 bits, mono y 24 kHz** (≈ 48 KB por segundo). Estimación, sin datos reales: una línea de 5 s pesa ≈ 240 KB; 60 líneas, ≈ 14 MB por storyboard e idioma.
  - Con 20 temas, 3 ediciones y 2 idiomas serían ≈ 1,7 GB en WAV.
  - Comprimidas (Opus u MP3 a ≈ 32 kbps), ≈ 0,1 GB.
- **El catálogo se publica en Supabase** para que Admin y la app de casa listen los storyboards disponibles. El listado ya es independiente de dónde estén los archivos.
- **Hay que compilar cada app que contenga el código del runner.** Comprobado con el UI Kit: el build de Educators lleva compilado el CSS del kit y copiadas sus imágenes, sin referencia al paquete en ejecución.

## Las preguntas, por separado

1. **Contenido** (estructura de los storyboards, voces, Rive): ¿dentro del build de cada app o publicado aparte y cargado en ejecución?
2. **Código del runner:** ¿una sola app lo aloja y las demás lo incrustan, o cada app lo compila?
3. **Públicos:** ¿qué app sirve a cada uno (educador, participantes, casa, prueba del equipo)?
4. **Comunicación entre la app y el taller:** eventos de un componente o mensajes entre ventanas.

## 1. Contenido

| | Dentro del build (como hoy) | Publicado aparte (Supabase Storage o CDN) y cargado en ejecución |
|---|---|---|
| Peso de cada app | Crece con el catálogo. Cada app que tenga el runner copia todo: de MB a GB con voces | Las apps solo llevan el código; el contenido se descarga al abrir un taller |
| Cambiar o añadir un storyboard | Recompilar y desplegar todas las apps con runner | Publicar una vez; las apps no se tocan |
| Sin conexión | Funciona: ya está en la app | Hay que descargar el taller antes (caché o «preparar para sin conexión»); si no, falla en un aula sin red |
| Versión del contenido | Va atada a la versión de la app | Hay que versionarlo (clave + versión) y fijar qué versión usa cada taller |
| Complejidad | Ninguna nueva | Flujo de publicación (subir archivos, registrar versión), permisos de lectura, CORS y caché |
| Coste | Almacenamiento duplicado en cada hosting | Almacenamiento y transferencia en Storage o CDN |

## 2. Código del runner

### A · Una sola app aloja el runner y las demás lo incrustan (iframe + mensajes)

- A favor:
  - El runner se compila y despliega una vez. Un cambio en el runner no obliga a tocar Educators ni la app de casa.
  - Las apps que lo incrustan siguen ligeras.
  - El educador y los participantes cargan siempre el mismo runner: no hay desfase entre apps.
  - Es el modelo del original (webview).
- En contra:
  - Educators depende en ejecución de otra app: si está caída o no carga, no hay taller.
  - Mensajes entre orígenes: hay que validar el origen en los dos lados, versionar el protocolo y hacer un saludo inicial con tiempo de espera.
  - Los navegadores limitan los iframes de otro dominio: almacenamiento particionado, permisos de audio automático, pantalla completa y bloqueo de suspensión (`allow=`), rarezas en iOS.
  - Para que el modo educador lea la guía con la sesión del educador, hay que pasar esa sesión al iframe de forma segura.
  - Sin conexión es más difícil (el service worker de otro origen).
  - Depurar entre dos apps es más lento.

### B · El runner como paquete, compilado en cada app que lo usa

- A favor:
  - No hay pieza en medio: si la app carga, el taller funciona.
  - Los eventos son de un componente, y el typecheck detecta si cambian.
  - Usa la sesión de la app sin pasarla a nadie.
  - Sin conexión es más sencillo (un solo origen).
- En contra:
  - **Cada cambio en el runner obliga a recompilar y desplegar todas las apps que lo usan.** Con distintos dominios u hostings, son varios despliegues que coordinar.
  - **Peso:** cada app lleva su copia del runner (≈ 5 MB hoy, la mayoría Rive). Si además el contenido va dentro (tabla 1), se suma todo el catálogo.
  - **Desfase:** si el educador y los participantes usan apps distintas desplegadas en momentos distintos, pueden ejecutar versiones distintas del mismo taller. Se evita si ambos usan la misma app, o con un protocolo versionado.
  - Builds más lentos en las apps que lo incluyen.

### C · El runner publicado como un módulo versionado en un CDN, que cada app carga en ejecución

- A favor:
  - Un despliegue del runner para todas las apps y sin iframe: misma página, misma sesión.
  - Cada app puede fijar una versión.
- En contra:
  - Es la más compleja de montar y mantener: empaquetado como componente web o carga remota, compatibilidad de Vue y de estilos entre la app y el módulo.
  - Pierde el tipado entre app y runner.
  - Sigue habiendo una dependencia en ejecución (el CDN).

## 3. Públicos

| Público | Necesita | Observaciones |
|---|---|---|
| Educador | Modo educador con guía y sesión; volver a su app al terminar (feedback) | Es el caso que originó la tarea |
| Participantes | Modo dispositivo sincronizado con el educador; entrar con código o QR, sin cuenta | Debe ejecutar la misma versión del taller que el educador |
| Casa | Modo casa; listar storyboards (Supabase) | Va solo, sin sincronizarse con nadie |
| Equipo de contenido | Probar todos los modos y publicar (lista en Supabase, contenido) | Hoy es la gestión de Player; Luis plantea que vuelva a ser Studio |

## Con los datos de Luis (2026-10-14)

Luis:
- Unos **700–800 storyboards**, al menos **2 idiomas**, todos con voz, más efectos y assets.
- Lo ideal es que funcionen **sin conexión**.
- Mismo proveedor, pero **cada app con su despliegue individual**.
- El contenido cambia mucho más que el runner.

La constitución añade:
- El dispositivo personal es **opcional**: un taller siempre funciona facilitado en una pantalla compartida, y con materiales.
- Los dispositivos no devuelven respuestas.

### Peso del catálogo (estimación; las voces aún no existen)

Supuesto: 3–6 minutos de voz por storyboard e idioma.

| | Por storyboard (2 idiomas) | Catálogo (750) |
|---|---|---|
| Voz en WAV (≈ 48 KB/s) | 17–35 MB | 13–26 GB |
| Voz comprimida (Opus/MP3 ≈ 32 kbps) | 1,4–2,9 MB | 1,1–2,2 GB |
| Rive, SVG y efectos (≈ 0,2–1 MB) | 0,2–1 MB | 0,15–0,75 GB |
| **Total comprimido** | **≈ 2–4 MB** | **≈ 1,3–3 GB** |

### Lo que los números deciden por sí solos

- **El contenido no puede ir dentro de ninguna app ni del runner.** Ni 1,3 GB ni 26 GB caben en un build, y menos repetidos en cada app. Va publicado aparte, por storyboard y versionado. Las apps descargan solo lo que abren.
- **Así, cambiar el contenido no toca el runner ni las apps.** Es lo que señalaba Luis: si el runner contiene el contenido, todo cambio de contenido es un cambio de runner. Separarlos lo evita.
- **Sin conexión = descargar antes.** Un taller pesa 2–4 MB comprimido. La app guarda en el dispositivo los storyboards que se van a usar (los talleres de la semana en Educators; los favoritos en casa) y funciona sin red.
- **Las voces se publican comprimidas.** El WAV se queda como original de trabajo en Studio.

### Lo que sigue abierto: el código del runner

Es pequeño (≈ 1 MB de JS más 2,1 MB del runtime de Rive) y cambia poco: sobre todo cuando aparece una plantilla o mecánica nueva. Lo usan Educators (pantalla del taller), Player (casa), Studio (probar) y los dispositivos opcionales.

**A · Un runner desplegado una vez, que las apps incrustan (iframe):**
- A favor:
  - Una plantilla nueva se despliega una vez y llega a todas las apps.
  - Educador y dispositivos usan siempre el mismo runner.
  - Encaja con los despliegues individuales.
- En contra:
  - El modo sin conexión **dentro de un iframe de otro dominio** es el punto débil. El navegador separa su almacenamiento y su service worker de los de la app que lo contiene. Safari en iOS además borra datos de terceros con frecuencia. No está probado que un taller descargado siga ahí días después.
  - Hay un protocolo de mensajes que mantener.
  - Pasar la sesión del educador para leer la guía es delicado.
  - Studio, para probar borradores sin publicar, tendría que pasarle el contenido por mensajes.

**B · El runner como paquete compilado en cada app:**
- A favor:
  - Sin conexión es directo: mismo dominio y un solo service worker para runner y contenido.
  - Sin protocolo entre ventanas.
  - Studio prueba borradores locales sin más.
- En contra:
  - **Con despliegues individuales, cada cambio del runner son 3–4 despliegues**, y entre uno y otro las apps tienen runners distintos.
  - Peor: un storyboard que use una plantilla nueva **no puede publicarse hasta que todas las apps se hayan redesplegado**. Si no, la app atrasada no sabe mostrarlo. Hace falta que cada storyboard declare la versión mínima de runner, y que las apps atrasadas digan «actualiza» en vez de fallar.

**C · Runner versionado en un CDN y cargado por cada app en su propia página:**
- A favor:
  - Un despliegue para todas.
  - Sin iframe: mismo dominio y mismo service worker, así que sin conexión funciona como en B.
- En contra:
  - Es la más compleja: empaquetarlo como componente web autónomo y aislar estilos y versión de Vue.
  - Sigue habiendo una dependencia remota (con caché).
  - Pierde el tipado entre app y runner.

### Por qué no hay una ganadora clara

- La restricción **sin conexión** empuja a B o C.
- Los **despliegues individuales** y las **plantillas nuevas** empujan a A o C.
- C es la única que cumple ambas, pero con el mayor coste de construcción y mantenimiento.
- El riesgo más grande sin medir es el sin conexión de A en iOS. Antes de elegir conviene **probarlo**: un iframe de otro dominio que descarga un taller y lo abre sin red días después, en iPad y Android.

## Con subdominios (Luis, 2026-10-15)

Luis acepta servir cada app en su subdominio: `admin.nutrinacion.com`, `educator.nutrinacion.com` y `player.nutrinacion.com`. Pide la forma eficiente y correcta de que Player exponga el runner con sus parámetros y de que las otras apps lo rendericen.

### Lo que cambia

- **Los subdominios de `nutrinacion.com` son el mismo sitio para el navegador.** Un iframe de `player.` dentro de `educator.` no es de terceros.
  - En Chrome (documentado), su almacenamiento y su service worker son los mismos que los de Player abierto directamente.
  - Los contras de A sobre el sin conexión y el almacenamiento particionado venían de suponer dominios distintos. Con subdominios no aplican, salvo lo que queda por probar en Safari (abajo).
- **En local pasa lo mismo:** `localhost:3001` dentro de `localhost:3002` también es el mismo sitio, así que una prueba local se comporta como en producción.
- Las URL de vista previa del proveedor (`*.vercel.app`, `*.netlify.app` y similares) sí son de terceros entre sí. Allí el sin conexión no es representativo.

### Propuesta en análisis: Player expone una página incrustable con un contrato

No está decidida. El contrato tiene tres partes:

| Parte | Qué lleva | Por qué ahí |
|---|---|---|
| **URL** (qué cargar) | `/play/<eje>/<slug>?mode=&lang=&escena=&embed=1` | No es sensible. Se puede guardar en caché, sobrevive a una recarga y se prueba abriéndola directamente |
| **Mensaje `iniciar`** (lo que pone la app) | La guía (modo educador), el id del taller y la versión del protocolo | La app ya tiene la sesión y lee la base. **Player sigue sin Supabase ni sesión**, y nada sensible va en la URL |
| **Eventos del runner** | `listo` (versión, escenas), `escena`, `terminado`, `salir` (escena), `error` | La app decide qué hacer: Educators va al feedback con `terminado` |

- **Saludo:** el runner manda `listo` y la app responde `iniciar`. Si no hay respuesta en N segundos, la app muestra un error con «Reintentar». Sin padre (abierto directamente), el runner funciona solo: casa, dispositivos y pruebas.
- **Seguridad:**
  - El runner acepta mensajes solo de los orígenes configurados y responde a ese origen, nunca a `*`.
  - La app acepta solo mensajes de `player.` que vengan de su iframe.
  - Player limita quién lo incrusta con `frame-ancestors`.
  - El iframe pide `allow="autoplay; fullscreen; screen-wake-lock"`.
- **Quién lo usa:**
  - Educators: una ruta a pantalla completa `/talleres/<id>/jugar` con el iframe; `terminado` lleva a `/talleres/<id>/cierre`.
  - Admin: «Probar» con la guía de su base, para revisarla antes de publicar.
  - Casa y dispositivos: abren Player directamente, sin iframe.
- **En la app:** un solo componente (iframe, validación de origen y eventos tipados) que usan Educators y Admin.
- **Sin conexión:** Educators sabe qué talleres hay en la semana y puede pedir a Player que los prepare (mensaje `preparar`). Como es el mismo sitio, se guardan en la caché que luego usa el runner.
- **Desfase de versiones:** el protocolo lleva versión y los cambios son aditivos. Player y Educators despliegan cada uno por su lado sin coordinarse.

### Peso medido del runner (build del 2026-10-14, gzip)

| Pieza | Peso |
|---|---|
| JS (16 archivos) | 169 KB |
| CSS | 14 KB |
| Rive (`rive.wasm`; el respaldo solo se carga si falla) | 0,9 MB |

La primera apertura descarga ≈ 1,1 MB más el contenido del storyboard (2–4 MB, del bucket). Después todo sale de la caché.

### Contras y lo que falta probar

- Hay dos apps en memoria: Educators, que es ligera, y Player. El peso real es Rive, que se carga igual en cualquier opción.
- Hay un protocolo que mantener, aunque son pocos mensajes y versionados.
- Si `player.` no responde y no hay caché, no hay taller. Es la misma dependencia que con un CDN.
- La depuración pasa entre dos ventanas.
- Hay que probarlo en iPad (Safari) y Android:
  - Que el almacenamiento del iframe sea el de Player. Una fuente secundaria dice que Safari particiona por dominio registrable, lo que daría el mismo resultado que en Chrome.
  - Que la primera voz suene sin un toque extra dentro del iframe.
  - Que lo descargado siga ahí días después. Safari borra los datos de un sitio sin uso en 7 días, salvo que la app esté instalada en la pantalla de inicio.

### Comparado con las alternativas

- **Componente web cargado desde `player.`:**
  - Corre en el origen de cada app, así que la caché y el service worker son de cada una: Educators y Admin descargan su propia copia.
  - Obliga a sacar el runner de Nuxt y a aislar a mano estilos y fuentes.
  - Si falla, arrastra a la app.
- **Navegación por URL (hoy):** Educators no contiene el taller, que es el problema de partida.

## Pendientes y siguiente paso

Ver «Pendiente» en «Decisión y avance». Siguiente paso: la prueba en iPad y Android con Educators incrustando Player en la red local. Después, el modo sin conexión (`preparar`) y Admin «Probar».

## Log

- 2026-10-14 — Abierta a partir de la corrección de Luis sobre la conexión entre Educators y Player.
- 2026-10-14 — Corrección: había registrado propuestas como decisiones (004 y 005) sin que Luis aprobara nada. Se retiraron de `docs/decisions/` (copia en el scratchpad) y el contenido se rehízo aquí como análisis.
  - Se añadieron las medidas de peso: contenido de 216 KB hoy, build de 5,2 MB, runtimes de Rive de 2 × 2,1 MB, voces a ≈ 48 KB/s.
  - Se comprobó que el contenido entra en el build por `import.meta.glob`.
- 2026-10-14 — Análisis rehecho con los datos de Luis (700–800 storyboards, 2 idiomas, voz, sin conexión, despliegues individuales) y la constitución (dispositivo opcional). Conclusión de los números: el contenido va publicado aparte y se descarga por storyboard. Sigue abierto el código del runner (A, B, C), con sus contras.
- 2026-10-15 — Luis acepta subdominios por app. Se comprobó que los subdominios son el mismo sitio para el navegador, lo que quita los contras del sin conexión en A. Se midió el runner (≈ 1,1 MB gzip la primera vez) y se añadió la propuesta del contrato incrustable (URL, `iniciar`, eventos) en análisis, sin decidir.
- 2026-10-15 — Luis aprueba el iframe y el contrato. Player pasa a ser la app que expone el runner y publica el contenido, y no la del hogar. Solo las voces irán a un bucket de Supabase. Se registra la decisión 004 y la tarea pasa a `haciendo`.
- 2026-10-15 — Implementado sin Supabase (kit, Player y Educators). Verificación:
  - Vitest: Player 23 tests (antes 17: −3 de `alTerminar`, +9 del contrato), Educators 13.
  - `nuxt typecheck` de Player y Educators: aprobado.
  - Navegador:
    - abrir el taller;
    - la guía desde Educators;
    - «Terminar» → feedback;
    - «Salir» → calendario;
    - Player caído → error y «Reintentar»;
    - `frame-ancestors` en `/play/**`;
    - dispositivo en otra pestaña.
  - `./scripts/verify.sh` en la entrada siguiente.
- 2026-10-15 — `./scripts/verify.sh` (raíz): **aprobado**, sin avisos.
  - Contexto y check-ui en verde.
  - Admin 51, Player 23 y Educators 13 tests.
  - Typecheck y build de las tres apps.
  - El build de Player lleva la regla `frame-ancestors` con los orígenes de desarrollo; en producción hay que compilar con `NUXT_PUBLIC_RUNNER_HOSTS`.
  - Sin commit.
- 2026-10-15 — A petición de Luis, las rutas de Educators pasan de `/talleres/…` a `/workshops/…`: `/workshops/<id>`, `/workshops/<id>/jugar` y `/workshops/<id>/cierre`. Se cambió el segmento compartido; `jugar` y `cierre` siguen igual. Verificación:
  - Navegador, contra los servidores que Luis levantó a mano: `/workshops/t-101/jugar` (runner `ready`) → «Terminar» → `/workshops/t-101/cierre`.
  - Typecheck y 13 tests de Educators.
  - check-ui y check-context en verde.
