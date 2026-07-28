import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Tests de unidades puras (composables con los auto-imports de Nuxt stubbeados en el
// propio test). No levanta Nuxt: rápido y sin entorno.
export default defineConfig({
  define: {
    // En Nuxt es un flag de build; los composables lo usan para guardas de cliente.
    'import.meta.client': 'true',
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
