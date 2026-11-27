import { pwaDeLaApp } from '@playhub/ui/pwa'

// La app del hogar (tarea 025): las familias juegan en casa los storyboards publicados para el hogar, con el perfil de
// cada niño guardado en el dispositivo, y desde ella se unen a un taller (`/code`). Sin cuenta: lee de la base con la
// anon key el catálogo del hogar, los países y las direcciones de las apps. Los juegos son el runner de Player,
// incrustado como en Educators (decisión 004). En producción, `play.nutrinacion.com`.
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  // En desarrollo.
  devServer: { port: 3003 },

  // UI Kit compartido en densidad táctil: se usa en teléfonos y tabletas, y la usan niños.
  extends: ['@playhub/ui'],

  ssr: false,

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  typescript: { strict: true },

  // Se instala como app en el teléfono o la tableta de la familia (pwa.ts del kit): todo su código queda guardado.
  pwa: pwaDeLaApp({
    clave: 'home',
    nombre: 'Nutrinación Play',
    corto: 'Play',
    descripcion: 'Juegos para aprender a cuidarte, en casa y en los talleres de Nutrinación.',
  }),

  app: {
    head: {
      title: 'Nutrinación Play',
      charset: 'utf-8',
      // viewport-fit=cover: la app llega hasta los bordes y respeta las zonas seguras.
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      htmlAttrs: { 'lang': 'es', 'data-density': 'touch' },
      link: [{ rel: 'icon', href: '/ui/nutrinacion-isotipo.png', type: 'image/png' }],
      // El nombre bajo el icono en iOS; el resto de la cabecera de la app instalada lo pone el kit.
      meta: [{ name: 'apple-mobile-web-app-title', content: 'Play' }],
    },
  },
})
