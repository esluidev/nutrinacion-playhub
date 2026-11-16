import type { TemplateName } from '../types'

// Los dibujos que trae una plantilla por su cuenta. Una forma compartida (la pausa de agua) es la misma en todos los
// storyboards y la dibuja Player: sus piezas no van en `library` de cada `scene.json`. La precarga (`preload.ts`) las
// suma a las de la escena, para que también entren ya pintadas.
export const TEMPLATE_SVG: Partial<Record<TemplateName, string[]>> = {
  beber: ['vaso', 'vaso-agua', 'vaso-agua-superficie', 'vaso-frente', 'posavasos', 'mano-apunta'],
}
