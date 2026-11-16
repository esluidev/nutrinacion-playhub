import type { Component } from 'vue'
import type { TemplateName } from '../types'
import TemplateAbrir from './TemplateAbrir.vue'
import TemplateAnuncio from './TemplateAnuncio.vue'
import TemplateBeber from './TemplateBeber.vue'
import TemplateColocar from './TemplateColocar.vue'
import TemplateDestapar from './TemplateDestapar.vue'
import TemplateEstaciones from './TemplateEstaciones.vue'
import TemplateHistoria from './TemplateHistoria.vue'
import TemplateRepasar from './TemplateRepasar.vue'
import TemplateSenalar from './TemplateSenalar.vue'

// Plantillas del runner: una escena es una plantilla más su contenido. Cada una dibuja su
// tablero de 1280 × 600 y habla con el marco solo con eventos (feedback, progress, complete).
export const TEMPLATES: Record<TemplateName, Component> = {
  anuncio: TemplateAnuncio,
  destapar: TemplateDestapar,
  colocar: TemplateColocar,
  historia: TemplateHistoria,
  estaciones: TemplateEstaciones,
  abrir: TemplateAbrir,
  beber: TemplateBeber,
  senalar: TemplateSenalar,
  repasar: TemplateRepasar,
}
