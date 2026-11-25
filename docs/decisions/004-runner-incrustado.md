# El runner se expone desde Player y las apps lo incrustan

Fecha: 2026-10-15
Estado: aceptada
Sustituye a: no aplica. Precisa la [decisión 002](002-superficies-y-guia.md) en cómo llega la guía al runner.
Actualizada el 2026-11-25 (Luis): las direcciones de las apps viven en la base (`configuraciones`). Quién puede incrustar el runner ya no se fija al compilar Player, y el runner lee la base sin sesión.

## Contexto

Educators debe contener el taller y enterarse de lo que pasa en él, para llevar al educador al feedback al terminar, como hacía la app Flutter original con su webview. Hasta ahora navegaba a Player por URL y Player redirigía de vuelta.

El análisis con sus alternativas está en la [tarea 009](../../tasks/009-runner-dentro-de-educators.md):
- iframe;
- paquete compilado en cada app;
- componente web cargado en ejecución.

Datos que pesaron (Luis, 2026-10-14 y 2026-10-15):
- 700–800 storyboards, al menos dos idiomas, todos con voz;
- sin conexión es lo ideal;
- cada app con su despliegue individual;
- el contenido cambia más que el runner.

## Decisión

Aceptada por Luis el 2026-10-15.

- **Cada app en su subdominio de `nutrinacion.com`:** `admin.`, `educator.` y `player.`. Para el navegador son el mismo sitio. Un iframe de `player.` dentro de `educator.` no es de terceros: comparte almacenamiento y service worker con Player abierto directamente.
- **Player expone el runner** (`/play/**`) y es la app con la que la administración de Nutrinación construye, prueba y publica el contenido. **No es la app del hogar**, que se creará después.
- **Las apps renderizan el runner en un iframe** con el contrato de [docs/runner.md](../runner.md):
  - La URL dice qué cargar.
  - La app manda `iniciar` con la guía.
  - El runner cuenta `listo`, `escena`, `terminado`, `salir` y `error`.
  - Todas usan el mismo componente del kit (`UiRunner`).
- **El runner no usa sesión.** La guía la lee la app que incrusta el runner, con su sesión, y se la pasa. El runner no la pide a nadie. Sin sesión, solo lee de la base las direcciones de las apps y, en un taller con dispositivos, su conexión ([tarea 013](../../tasks/013-runner-en-el-aula.md)). (La gestión de Player pasó a pedir sesión de superadmin: [decisión 005](005-base-nueva-y-acceso-educador.md).)
- **Las direcciones de las apps viven en la base** (2026-11-25): `configuraciones` guarda `admin_url`, `player_url` y `educators_url`. Admin y Educators abren el runner con la de Player. Player solo se deja incrustar por Admin y Educators y solo les habla a ellas, y su QR lleva la suya. Nada de eso va fijo en el código ni en una variable de entorno: en producción se cambia la fila y todo sigue sin recompilar. Cada app solo necesita saber dónde está la base.
- **Contenido:**
  - Las **voces de narración** irán a un bucket de Supabase y se cargarán por URL.
  - Efectos, Rive, SVG, estructuras y `scene.vue` siguen en el build de Player, porque pesan poco (≈ 30 KB por archivo).

## Consecuencias

- Una plantilla o un arreglo del runner se despliega una vez, en Player, y llega a todas las apps. El protocolo lleva versión y solo crece con campos opcionales, así que Player y las apps se despliegan sin coordinarse.
- Si `player.` no responde y no hay nada en caché, no hay taller. La app muestra un error con «Reintentar» y su propia salida.
- El build de Player crece con el catálogo. Con 750 storyboards y unos pocos archivos de 30 KB cada uno, son cientos de MB y miles de archivos. Hay que revisar los límites del proveedor antes de llegar ahí.
- Cambiar el dominio de una app es cambiar su fila en `configuraciones`. El runner lee de ahí con quién puede hablar, y el servidor de Player arma con eso la cabecera `frame-ancestors` (la recuerda un minuto). Antes, la lista iba en una variable de Player (`NUXT_PUBLIC_RUNNER_HOSTS`) y cambiarla pedía recompilarlo.
- Si la base no responde, el runner usa las últimas direcciones que guardó en el aparato. El servidor usa las últimas que leyó; sin ninguna, solo deja incrustar a Player.
- `frame-ancestors` la pone el servidor de Player. Servido como archivos estáticos, la tendría que poner el proveedor.
- `configuraciones` la lee cualquiera, también sin cuenta: nunca guarda un secreto.
- Falta probar en iPad (Safari) y Android:
  - que la primera voz suene sin un toque extra dentro del iframe;
  - que el almacenamiento del iframe sea el de Player;
  - que lo descargado para usar sin conexión siga ahí días después.

  Si algo de eso falla, se revisa esta decisión.
