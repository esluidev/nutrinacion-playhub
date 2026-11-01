import { networkInterfaces } from 'node:os'

// Apps que pueden incrustar el runner (docs/runner.md): Educators y Admin. Separadas por comas.
// La misma lista vale para los mensajes (runtimeConfig) y para la cabecera frame-ancestors, que
// se fija al compilar: cambiarla en producción pide recompilar.
const runnerHosts = process.env.NUXT_PUBLIC_RUNNER_HOSTS || 'http://localhost:3002,http://localhost:3000,http://localhost:3100'
// En desarrollo, también las apps abiertas desde la tailnet: con el nombre de Tailscale (*.ts.net)
// o con una IP de este equipo (la de Tailscale o la de la red local). Una CSP no admite comodines
// en una IP: se listan las de ahora; si cambian, reinicia Player.
const ipsDeEsteEquipo = Object.values(networkInterfaces()).flatMap(lista => lista ?? [])
  .filter(i => !i.internal && i.family === 'IPv4')
  .map(i => ` http://${i.address}:*`)
const ancestrosDev = process.env.NODE_ENV === 'production' ? '' : ` http://*.ts.net:* https://*.ts.net:*${ipsDeEsteEquipo.join('')}`

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

  // Supabase solo para la entrada de la gestión (superadmin, decisión 005). El runner no lo usa.
  runtimeConfig: {
    public: {
      runnerHosts,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },

  // Solo esas apps (y Player) pueden poner el runner en un iframe.
  routeRules: {
    '/play/**': {
      headers: { 'Content-Security-Policy': `frame-ancestors 'self' ${runnerHosts.split(/[\s,]+/).filter(Boolean).join(' ')}${ancestrosDev}` },
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
    },
  },
})
