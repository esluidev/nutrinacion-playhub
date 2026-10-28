import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Tests de unidades puras (misma config que admin). No levanta Nuxt ni toca el glob de
// content/: lo que se prueba vive en `app/utils/`, sin dependencias del framework.
export default defineConfig({
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
