import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Tests de unidades puras (misma config que admin). No levanta Nuxt ni toca el glob de
// content/: lo que se prueba vive en `app/utils/` y, del runner, en el gesto de arrastre (`useDrag.ts`), la mano que
// demuestra (`useDemo.ts`) y la animación con respaldo (`board.ts`), sin dependencias de Nuxt.
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
