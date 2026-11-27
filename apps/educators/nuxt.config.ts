import { pwaDeLaApp } from '@playhub/ui/pwa'

// Compartir en desarrollo por Tailscale: la capa @playhub/ui escucha en todas las interfaces y deja
// entrar a Vite los nombres *.ts.net, y `urlEnEsteEquipo` cambia localhost (Supabase, Player) por
// el nombre o la IP con que se abrió la app.
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  // En desarrollo.
  devServer: { port: 3002 },

  // UI Kit compartido en densidad táctil: Educators se usa sobre todo en móviles y tabletas.
  extends: ['@playhub/ui'],

  ssr: false,

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Supabase con la anon key y las funciones educador_* (sin Supabase Auth). Sin estas dos
      // variables, Educators funciona en modo demo con los datos de prueba de app/fixtures/.
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  typescript: { strict: true },

  // Se instala como app en la tableta o el teléfono del educador (pwa.ts del kit): todo su código queda guardado.
  pwa: pwaDeLaApp({
    clave: 'educators',
    nombre: 'Nutrinación Play · Educadores',
    corto: 'Educadores',
    descripcion: 'Prepara, da y reporta tus talleres de Nutrinación Play.',
  }),

  app: {
    head: {
      title: 'Educadores',
      charset: 'utf-8',
      // viewport-fit=cover: la app llega hasta los bordes y respeta las zonas seguras.
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      htmlAttrs: { 'lang': 'es', 'data-density': 'touch' },
      // El color de la barra del sistema lo pone el kit; aquí, el nombre bajo el icono en iOS.
      meta: [{ name: 'apple-mobile-web-app-title', content: 'Educadores' }],
      link: [{ rel: 'icon', href: '/ui/nutrinacion-isotipo.png', type: 'image/png' }],
    },
  },
})
