export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  // Mismo proyecto Supabase que admin. Studio solo LEE (ver app/utils/supabase.ts).
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/storyplay.css',
  ],

  typescript: {
    strict: true,
    // El tsconfig generado solo incluye app/** — sin esto, las escenas de
    // content/ quedan FUERA de `npm run typecheck` (así se coló un
    // ReferenceError a runtime en las pausas de hidratación).
    tsConfig: {
      include: ['../content/**/*.ts', '../content/**/*.vue'],
    },
  },

  app: {
    head: {
      title: 'StoryPlay Studio',
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
