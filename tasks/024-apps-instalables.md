---
id: 024
estado: haciendo
prioridad: alta
creada: 2026-11-27
---
# Las tres apps, instalables (PWA) y cuidadas en el móvil

## Objetivo

Que Admin, Player y Educators se instalen como apps, abran al instante y sin las barras del navegador, y que cada educador pueda instalar Educators fácilmente en sus dispositivos. Lo pidió Luis el 2026-11-27: «prepara las 3 aplicaciones con soporte completo para PWA, bien optimizadas para móviles y sobre todo la aplicación de los educadores una forma/opción fácil para que cada educador pueda instalarla». Sigue la decisión del 2026-11-18 (siempre PWA en Nuxt, sin tiendas; [tarea 018](018-runner-web-como-app.md)) y el despliegue como web estática que conversamos ese día.

## Alcance

- Lo compartido, en el kit: el módulo `@vite-pwa/nuxt` en la capa, la configuración de cada app con `pwaDeLaApp` (`packages/ui/pwa.ts`), los iconos (`packages/ui/public/ui/app/`), instalar con un toque (`useInstalarApp`), el aviso de versión nueva (`useActualizacionApp`) y el QR (`UiQr`, que era `RunnerQr` de Player).
- Las tres apps: «Instalar app» en el menú de la cuenta, solo donde el navegador la instala con un toque, y al pulsarlo instala.
- Móvil: campos a 16 px en pantallas táctiles (iOS ya no acerca la página al escribir), barra del sistema y pantalla de arranque con el lienzo del kit, título bajo el icono en iOS.

Fuera, por ahora: pantallas de arranque propias de iOS (una imagen por modelo), un icono distinto por app, notificaciones.

## Criterios de aceptación

- [x] Cada build trae su manifiesto (nombre, iconos, pantalla de arranque, sin barras) y su service worker; la página se sirve sin red (inspección del build de Educators y de Player).
- [x] El aviso del navegador para instalar no sale solo (tampoco en el dispositivo de un niño); lo pide la app desde su botón.
- [x] «Instalar app» en el menú de la cuenta instala con un toque; donde el navegador no lo permite (iPhone y iPad, o en desarrollo), no aparece. Sin tarjeta en el inicio ni diálogo con instrucciones.
- [x] Una versión nueva no recarga la app sola: avisa con «Actualizar», nunca durante un taller en curso.
- [x] El runner de Player y la página para unirse se piden siempre a la red (conservan la cabecera `frame-ancestors`); su código se guarda la primera vez que se usa.
- [x] Campos de 16 px en pantallas táctiles.
- [ ] Luis instala Educators en Android con un toque desde el menú, con el build de producción por HTTPS, y la abre sin red.
- [ ] El aviso «Actualizar» aparece tras publicar una versión nueva.

## Pendientes y siguiente paso

- **Probar con el build de producción en aparatos reales.** En desarrollo no hay service worker ni manifiesto (`devOptions` apagado, a propósito): la ventana del navegador para instalar no aparece y el diálogo enseña los pasos del menú. Lo levanta Luis, con la app compilada (`npm --prefix apps/educators run build` y después `npm --prefix apps/educators run preview -- --port 3012 --host 0.0.0.0`), y en la tableta la abre por la IP del Mac. Ojo: el navegador solo ofrece instalar desde HTTPS o localhost; por la IP en http «Instalar app» no aparece. Para probar la instalación de verdad hace falta HTTPS (Tailscale Funnel, que ya usamos, o el despliegue).
- **En el despliegue estático (DigitalOcean):** `nuxt generate` por app; servir `sw.js` y `manifest.webmanifest` sin caché larga (`Cache-Control: no-cache`) y todas las rutas con la página (`index.html` o `200.html`); en Player, además, la cabecera `frame-ancestors` en `/play/**` ([decisión 004](../docs/decisions/004-runner-incrustado.md)).
- **iPhone y iPad:** Safari no deja que una página se instale con un botón; solo desde Compartir › «Agregar a inicio». La app no ofrece nada ahí (Luis no quiere instrucciones).
- **iOS** muestra una pantalla en blanco al arrancar (sin imágenes de arranque por modelo). Si Luis la quiere, se generan desde el isotipo.

## Log

- 2026-11-27 · Implementado (sin commit). `@vite-pwa/nuxt` 1.1.1, exacta: la serie 2 salió del 13 al 22 de noviembre y cambia de arquitectura; la 1.1.1 usa `vite-plugin-pwa` 1.3.0, que admite Vite 8. El lockfile solo subió parches de Babel (los pide Workbox). Iconos generados con Python desde el isotipo de 2709 px de la web (`website/resources/logos/nutrinacion.png`): 192 y 512 transparentes, 512 adaptable con fondo blanco y el isotipo en el 66 % central, y 180 para Apple con fondo. `nuxt build` no dejaba `index.html` (SPA servida por Nitro): la capa prerenderiza `/` para que el service worker tenga qué servir; con `generate` sale igual. Builds: Educators guarda 52 archivos (961 KB) y sirve la página en toda ruta; Player guarda 20 (453 KB), deja `/play/` y `/workshop/` a la red y guarda `/_nuxt/` al usarlo (CacheFirst). En el navegador (desarrollo): la invitación y el diálogo en Educators (escritorio y 375 px; a 375 px el texto se aplastaba y se corrigió), «Instalar App» en Admin e «Instalar app» en Player; el runner carga con su personaje de Rive y el QR del kit en Dispositivos, sin errores. El manifiesto se enlaza solo en producción: en desarrollo su dirección devolvía la página.
- 2026-11-27 · `./scripts/verify.sh` desde la raíz: aprobado (contexto, UI Kit en las vistas, typecheck, Vitest —Admin 123, Player 259, Educators 54— y build de las tres, y `supabase test db`). Service worker por build: Admin guarda 141 archivos (1,58 MB), Player 20 (453 KB) y Educators 51 (960 KB). Avisos: solo los dos de `supabase/config.toml` que ya estaban (`enable_signup` obsoleto). La primera pasada falló en tipos (`rel` del manifiesto condicional, en la capa) y se corrigió con `as const`. Pendiente: el QA en aparatos con el build de producción por HTTPS.
- 2026-11-27 · Luis, ante la tarjeta «Instala Educadores» y su diálogo: «tiene un botón de instalar y lo que hace es abrir un modal con las instrucciones… además de ensuciar el UX/UI y layout». Fuera `UiInstalarAviso` y `UiInstalarApp` (y sus textos e iconos): «Instalar app» queda en el menú de la cuenta de las tres apps solo donde el navegador instala con un toque (`useInstalarApp().puedeInstalar`), y al pulsarlo abre la ventana del navegador. En iPhone y iPad no se ofrece nada.
