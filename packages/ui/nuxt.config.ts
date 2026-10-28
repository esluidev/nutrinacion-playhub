import tailwindcss from '@tailwindcss/vite'

// @playhub/ui · capa de Nuxt. Las apps la extienden con `extends: ['@playhub/ui']` y reciben
// Tailwind 4, los `Ui*` (app/components/ui), sus composables y utilidades. Cada app tiene UNA
// raíz de CSS que empieza con `@import "@playhub/ui/css/index.css";` y añade lo suyo debajo:
// así el tema se extiende en el mismo punto y Tailwind no se genera dos veces.
// La densidad se elige en cada app con `data-density` (compact por defecto, touch para táctil).
//
// En desarrollo, el servidor de Vite acepta también los nombres de Tailscale (*.ts.net) para
// compartir las apps por la tailnet; si no, responde 403 a todo lo que no sea localhost.
export default defineNuxtConfig({
  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: ['.ts.net'] },
  },
})
