import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Tests de lógica pura (app/utils), sin levantar Nuxt.
export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
