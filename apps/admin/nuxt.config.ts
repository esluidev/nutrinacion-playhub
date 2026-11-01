// Compartir en desarrollo por Tailscale: la capa @playhub/ui escucha en todas las interfaces y deja
// entrar a Vite los nombres *.ts.net, y `urlEnEsteEquipo` cambia localhost (Supabase, Player) por
// el nombre o la IP con que se abrió la app.
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  // En desarrollo; `npm run dev:demo` usa el 3100.
  devServer: { port: 3000 },

  // Herramienta interna (sin SEO). SPA: todo renderiza y autentica en el cliente, donde vive
  // la sesión de Supabase (localStorage). Evita el redirect a /login en cada refresh por SSR.
  ssr: false,

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  // UI Kit compartido (packages/ui): tokens, Ui* y Tailwind 4, en densidad compact.
  extends: ['@playhub/ui'],

  modules: [
    // Reka UI: primitivas SIN estilos (foco, teclado, ARIA, portales, colisión). Va DEBAJO de
    // los Ui* del kit, que ponen los estilos. Los componentes se auto-importan
    // con el prefijo `Reka` para no chocar con los nuestros.
    'reka-ui/nuxt',
  ],

  reka: {
    prefix: 'Reka',
  },

  css: [
    '~/assets/css/main.css',
  ],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  app: {
    head: {
      title: 'PlayHub Admin',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'es',
      },
      link: [{ rel: 'icon', href: '/ui/nutrinacion-isotipo.png', type: 'image/png' }],
    },
  },
})
