import tailwindcss from '@tailwindcss/vite'

// @playhub/ui · capa de Nuxt. Las apps la extienden con `extends: ['@playhub/ui']` y reciben
// Tailwind 4, los `Ui*` (app/components/ui), sus composables y utilidades. Cada app tiene UNA
// raíz de CSS que empieza con `@import "@playhub/ui/css/index.css";` y añade lo suyo debajo:
// así el tema se extiende en el mismo punto y Tailwind no se genera dos veces.
// La densidad se elige en cada app con `data-density` (compact por defecto, touch para táctil).
//
// En desarrollo, las apps escuchan en todas las interfaces (0.0.0.0, sin `--host`): se abren con
// localhost y desde la tailnet con el nombre (*.ts.net) o la IP (100.x) de este equipo. Vite acepta
// siempre las IP y, por `allowedHosts`, los nombres *.ts.net; a cualquier otro nombre le responde 403.
// El puerto lo fija cada app (Admin 3000, Player 3001, Educators 3002).
//
// Las tres se instalan como apps (PWA): la capa carga el módulo y pone en la cabecera lo que piden Android e iOS; cada
// app da su nombre y qué guarda con `pwa: pwaDeLaApp({…})` (pwa.ts) y su título en iOS (`apple-mobile-web-app-title`).
// En desarrollo no hay manifiesto ni service worker (pwa.ts): su dirección devolvería la página y el navegador se quejaría.
const produccion = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  devServer: { host: '0.0.0.0' },

  modules: ['@vite-pwa/nuxt'],

  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: ['.ts.net'] },
  },

  // La página de la SPA como archivo (`index.html`), también con `nuxt build`: el service worker la guarda y la sirve
  // en cualquier ruta, sin red. Con ssr: false es solo el esqueleto: no se ejecuta nada de la app al prerenderizarla.
  nitro: { prerender: { routes: ['/'] } },

  app: {
    head: {
      link: [
        ...(produccion ? [{ rel: 'manifest' as const, href: '/manifest.webmanifest' }] : []),
        // iOS no lee los iconos del manifiesto: el suyo, sin transparencia (pondría negro).
        { rel: 'apple-touch-icon', href: '/ui/app/icono-apple-180.png' },
      ],
      meta: [
        // La barra del sistema con el lienzo del kit, como la pantalla de arranque.
        { name: 'theme-color', content: '#f3f7fc' },
        // Instalada en iOS, sin las barras de Safari; la barra de estado, oscura sobre claro y sin tapar la app.
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
    },
  },
})
