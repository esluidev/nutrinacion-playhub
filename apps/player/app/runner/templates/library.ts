import type { TemplateName } from '../types'

// Los dibujos que trae una plantilla por su cuenta. Una forma compartida (la pausa de agua, la Despedida) es la misma en
// todos los storyboards y la dibuja Player: sus piezas no van en `library` de cada `scene.json`. La precarga (`preload.ts`) las
// suma a las de la escena, para que también entren ya pintadas.
export const TEMPLATE_SVG: Partial<Record<TemplateName, string[]>> = {
  beber: ['vaso', 'vaso-agua', 'vaso-agua-superficie', 'vaso-frente', 'posavasos', 'mano-apunta'],
  resumen: ['cocina-foto', 'ninos-foto', 'mano-apunta'],
}

/**
 * La foto del grupo de la Despedida (Resumen), la misma en todos los storyboards: la cocina de la casa con el
 * refrigerador y un mantel verde, distinta de las tarjetas de la cocina del taller (`cocina-foto`), y, detrás de la mesa, el niño y la niña del taller (`ninos-foto`, cortados en el borde de la mesa). Lo que va en la
 * mesa (el alimento del taller) lo trae cada storyboard en `defaults.group` de su escena.
 */
export const GROUP_PHOTO = { scenery: 'cocina-foto', kids: 'ninos-foto' }
