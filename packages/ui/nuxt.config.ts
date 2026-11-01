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
export default defineNuxtConfig({
  devServer: { host: '0.0.0.0' },

  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: ['.ts.net'] },
  },
})
