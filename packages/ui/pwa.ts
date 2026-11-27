import type { ModuleOptions } from '@vite-pwa/nuxt'

// Cada app se instala como una app (PWA, decisión de Luis del 2026-11-18: siempre PWA en Nuxt, sin tiendas). La capa del
// kit carga el módulo (`@vite-pwa/nuxt`) y cada app pide aquí su configuración, en su nuxt.config:
//
//   pwa: pwaDeLaApp({ clave: 'educators', nombre: 'Nutrinación Play Educadores', corto: 'Educadores', … })
//
// No se reparte entre el kit y la app porque Nuxt une las listas de las dos (los iconos o los archivos saldrían dobles).
//
// Lo que deja: el manifiesto (nombre, iconos del kit en /ui/app/, pantalla de arranque con el color del lienzo, sin las
// barras del navegador) y un service worker que guarda la app para abrirla al instante y sin red. La versión nueva se
// instala en segundo plano y espera: la app avisa con «Actualizar» (useActualizacionApp), nunca recarga sola en medio
// de un taller. El aviso nativo para instalar no sale solo: lo pide la app desde su botón (useInstalarApp).

export interface AppInstalable {
  /** La app en una palabra (admin, player, educators): nombra lo que guarda su service worker. */
  clave: string
  /** Nombre completo: la ventana para instalar y la pantalla de arranque. */
  nombre: string
  /** Bajo el icono, en la pantalla de inicio (12 letras como mucho). */
  corto: string
  descripcion: string
  /**
   * Qué se guarda al instalar el service worker. `completa`: todo el código (Admin y Educators, ligeras).
   * `esqueleto`: la página, los estilos, las fuentes y los iconos; el resto (el código, los wasm y los personajes de
   * Rive del runner) se guarda la primera vez que se usa (Player, que pesa varios MB).
   */
  guardar?: 'completa' | 'esqueleto'
  /**
   * Rutas que siempre se piden a la red, sin la página guardada: las del runner de Player, cuya respuesta lleva la
   * cabecera que dice quién puede incrustarlo (frame-ancestors) y que la página guardada no tendría.
   */
  siempreDeLaRed?: RegExp[]
}

// El lienzo del kit (`--color-night-25`): la pantalla de arranque y la barra del sistema.
const LIENZO = '#f3f7fc'

const ICONOS = [
  { src: '/ui/app/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/ui/app/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/ui/app/icono-adaptable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
]

export function pwaDeLaApp(app: AppInstalable): ModuleOptions {
  const completa = (app.guardar ?? 'completa') === 'completa'
  return {
    registerType: 'prompt',
    manifest: {
      // Cada app vive en su propio subdominio: su raíz la identifica aunque cambie el nombre.
      id: '/',
      name: app.nombre,
      short_name: app.corto,
      description: app.descripcion,
      lang: 'es',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: LIENZO,
      theme_color: LIENZO,
      icons: ICONOS,
    },
    workbox: {
      // La página (prerenderizada en la capa: `nitro.prerender.routes`) sirve todas las rutas, también sin red.
      navigateFallback: '/',
      navigateFallbackDenylist: app.siempreDeLaRed ?? [],
      // El manifiesto lo añade el módulo por su cuenta: aquí no (repetido, el service worker no se instala).
      globPatterns: completa
        ? ['**/*.{js,css,html,ico,png,svg,woff2}']
        : ['**/*.{css,html,ico,png,svg,woff2}'],
      // El código del build lleva su huella en el nombre: lo que se guardó no cambia nunca.
      runtimeCaching: completa
        ? []
        : [{
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_nuxt/'),
            handler: 'CacheFirst',
            options: { cacheName: `${app.clave}-codigo`, expiration: { maxEntries: 400, purgeOnQuotaError: true } },
          }],
      cleanupOutdatedCaches: true,
    },
    client: {
      // Sin el aviso del navegador (en el dispositivo de un niño saldría solo); la app lo pide desde su botón.
      installPrompt: true,
      // Cada hora mira si hay una versión nueva.
      periodicSyncForUpdates: 3600,
    },
    // En desarrollo no hay service worker: con la recarga en caliente, lo guardado estorbaría.
    devOptions: { enabled: false },
  }
}
