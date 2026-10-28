import type { Component } from 'vue'
import type { TemplateName } from '../types'
import TemplateAnuncio from './TemplateAnuncio.vue'
import TemplateColocar from './TemplateColocar.vue'
import TemplateDestapar from './TemplateDestapar.vue'

// Plantillas del runner: una escena es una plantilla más su contenido. Cada una dibuja su
// tablero de 1280 × 600 y habla con el marco solo con eventos (feedback, progress, complete).
export const TEMPLATES: Record<TemplateName, Component> = {
  anuncio: TemplateAnuncio,
  destapar: TemplateDestapar,
  colocar: TemplateColocar,
}
