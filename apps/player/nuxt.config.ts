import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { pwaDeLaApp } from '@playhub/ui/pwa'
import { fileURLToPath } from 'node:url'

// Las apps que pueden incrustar el runner (docs/runner.md), Admin y Educators, salen de la base (`configuraciones`): el
// runner las lee para hablarles y el servidor, para la cabecera frame-ancestors (server/middleware/marco-del-runner.ts).
// En desarrollo, además, las apps abiertas desde la tailnet: con el nombre de Tailscale (*.ts.net) o con una IP de este
// equipo (la de Tailscale o la de la red local). Una CSP no admite comodines en una IP: se listan las de ahora; si
// cambian, reinicia Player.
const ipsDeEsteEquipo = Object.values(networkInterfaces()).flatMap(lista => lista ?? [])
  .filter(i => !i.internal && i.family === 'IPv4')
  .map(i => `http://${i.address}:*`)
const ancestrosDev = process.env.NODE_ENV === 'production' ? '' : ['http://*.ts.net:*', 'https://*.ts.net:*', ...ipsDeEsteEquipo].join(' ')
// En desarrollo, la IP de este equipo en la red local (el Wi‑Fi, una interfaz `en*`): el QR para unirse a un taller
// (tarea 013) la usa cuando la pantalla del educador está en localhost, que en un teléfono sería el propio teléfono.
// En producción el QR lleva la dirección pública de Player y esto queda vacío.
const ipEnLaRed = process.env.NODE_ENV === 'production'
  ? ''
  : Object.entries(networkInterfaces())
      .filter(([nombre]) => /^en\d/.test(nombre))
      .flatMap(([, lista]) => lista ?? [])
      .find(i => !i.internal && i.family === 'IPv4' && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(i.address))?.address ?? ''

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  // En desarrollo (host en la capa @playhub/ui).
  devServer: { port: 3001 },

  // UI Kit compartido (packages/ui): tokens, Ui* y Tailwind 4. La gestión usa la densidad
  // compact por defecto; el runner fija data-density="touch" en su marco.
  extends: ['@playhub/ui'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  ssr: false,

  // En desarrollo, Vite solo vigila app/ (su raíz) y los archivos que lee él mismo; los dibujos de la
  // librería entran con `?url` y no los vigila: corregido uno, seguía sirviendo el de antes. Vigilando
  // content/library, un dibujo modificado recarga la página como cualquier otro archivo.
  vite: {
    // Los dibujos de la librería (SVG de pocos KB) van dentro del código en vez de pedirse uno a uno: el runner los
    // tiene todos desde el arranque y ninguna escena espera a la red por un dibujo. Lo demás, como siempre.
    build: {
      assetsInlineLimit: (file: string) => (file.includes('/content/library/svg/') ? true : undefined),
    },
    plugins: [{
      name: 'playhub:vigilar-libreria',
      configureServer(server) {
        server.watcher.add(fileURLToPath(new URL('./content/library', import.meta.url)))
      },
    }],
  },

  // Se instala como app (pwa.ts del kit). Pesa varios MB (los wasm y los personajes de Rive): de entrada solo se guarda
  // el esqueleto, y el código se guarda la primera vez que se usa; así el runner abre al instante desde la segunda vez,
  // también en el dispositivo de un niño. El runner y la página para unirse se piden siempre a la red: su respuesta
  // trae la cabecera que dice quién puede incrustarlo (server/middleware/marco-del-runner.ts).
  pwa: pwaDeLaApp({
    clave: 'player',
    nombre: 'Nutrinación Play · Player',
    corto: 'Player',
    descripcion: 'Construye, prueba y publica los juegos de Nutrinación Play.',
    guardar: 'esqueleto',
    siempreDeLaRed: [/^\/play\//, /^\/workshop\//],
  }),

  // Las portadas de los storyboards, para la app del hogar (tarea 025): al compilar, cada `portada.svg` se copia a
  // `/portadas/<eje>/<storyboard>.svg`; en desarrollo las sirve server/routes/portadas.
  hooks: {
    async 'nitro:build:public-assets'(nitro) {
      const origen = fileURLToPath(new URL('./content/storyboards', import.meta.url))
      for (const eje of await readdir(origen, { withFileTypes: true })) {
        if (!eje.isDirectory()) continue
        for (const storyboard of await readdir(join(origen, eje.name), { withFileTypes: true })) {
          if (!storyboard.isDirectory()) continue
          const destino = join(nitro.options.output.publicDir, 'portadas', eje.name)
          await mkdir(destino, { recursive: true })
          await copyFile(join(origen, eje.name, storyboard.name, 'portada.svg'), join(destino, `${storyboard.name}.svg`)).catch(() => {})
        }
      }
    },
  },

  // Supabase para la gestión (superadmin, decisión 005), las direcciones de las apps (`configuraciones`) y la conexión
  // del taller. `ancestrosDev` solo lo usa el servidor.
  runtimeConfig: {
    ancestrosDev,
    // Solo el servidor de desarrollo: de dónde leer las portadas (server/routes/portadas).
    contenidoStoryboards: fileURLToPath(new URL('./content/storyboards', import.meta.url)),
    public: {
      ipEnLaRed,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  typescript: {
    strict: true,
    // El tsconfig generado solo incluye app/**: sin esto, las escenas propias de content/
    // (scene.vue) quedarían fuera de `npm run typecheck`.
    tsConfig: {
      include: ['../content/**/*.ts', '../content/**/*.vue'],
    },
  },

  app: {
    head: {
      title: 'PlayHub Player',
      charset: 'utf-8',
      htmlAttrs: { lang: 'es' },
      link: [{ rel: 'icon', href: '/ui/nutrinacion-isotipo.png', type: 'image/png' }],
      // El nombre bajo el icono en iOS; el resto de la cabecera de la app instalada lo pone el kit.
      meta: [{ name: 'apple-mobile-web-app-title', content: 'Player' }],
    },
  },
})
