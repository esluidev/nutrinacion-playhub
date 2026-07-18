export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  // Herramienta interna (sin SEO). SPA: todo renderiza y autentica en el cliente, donde vive
  // la sesión de Supabase (localStorage). Evita el redirect a /login en cada refresh por SSR.
  ssr: false,

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    // Reka UI: primitivas SIN estilos (foco, teclado, ARIA, portales, colisión). Va DEBAJO de
    // nuestros Ui*, que siguen poniendo el Tailwind y la marca. Los componentes se auto-importan
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
      title: 'Nutrinacion Workshops',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'es',
      },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
})
