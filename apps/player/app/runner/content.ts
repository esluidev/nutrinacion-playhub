import type { Component } from 'vue'
import { tr } from '~/types/i18n'
import type { StoryboardJson, TipoStoryboard } from '~/types/storyboard'
import type { DatosItem, DatosJson, LoadedStoryboard, SceneJson } from './types'

// El contenido compilado con Player. Una sola lectura de content/ para el runner y para la
// gestión: si cambia un json, cambia la app.

const ROOT = '../../content/storyboards/'

const storyboardModules = import.meta.glob<StoryboardJson>('../../content/storyboards/*/*/storyboard.json', { eager: true, import: 'default' })
const datosModules = import.meta.glob<DatosJson>('../../content/storyboards/*/*/datos.json', { eager: true, import: 'default' })
const sceneModules = import.meta.glob<SceneJson>('../../content/storyboards/*/*/scenes/*/scene.json', { eager: true, import: 'default' })
const customScenes = import.meta.glob<Component>('../../content/storyboards/*/*/scenes/*/scene.vue', { import: 'default' })

const svgModules = import.meta.glob<string>('../../content/library/svg/*.svg', { eager: true, query: '?url', import: 'default' })
const riveModules = import.meta.glob<string>('../../content/library/rive/*.riv', { eager: true, query: '?url', import: 'default' })

const byName = (modules: Record<string, string>, ext: string) => new Map(
  Object.entries(modules).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -ext.length), url]),
)
const SVG = byName(svgModules, '.svg')
const RIVE = byName(riveModules, '.riv')

/** URL servida de un dibujo de la librería, por nombre sin extensión. */
export function librarySvg(name: string | undefined): string | undefined {
  return name ? SVG.get(name) : undefined
}

/** URL servida de un Rive de la librería, por nombre sin extensión. */
export function libraryRive(name: string | undefined): string | undefined {
  return name ? RIVE.get(name) : undefined
}

export const tipoDeType = (type: string) => type.toLowerCase().replace(/_/g, '-') as TipoStoryboard

/** Todos los `storyboard.json` del build, con su eje. */
export const STORYBOARDS = Object.entries(storyboardModules).map(([path, json]) => ({
  path,
  folderCategory: path.slice(ROOT.length).split('/')[0] as TipoStoryboard,
  json,
}))

export function loadStoryboard(category: string, slug: string, locale = 'es'): LoadedStoryboard | null {
  const entry = STORYBOARDS.find(s => s.folderCategory === category && s.json.slug === slug)
  if (!entry) return null
  const base = `${ROOT}${category}/${slug}/`
  const datos = datosModules[`${base}datos.json`] ?? { items: [] }
  const scenes = entry.json.scenes.flatMap((s, i) => {
    const json = sceneModules[`${base}scenes/${s.folder}/scene.json`]
    if (!json) return []
    return [{
      folder: s.folder,
      number: i + 1,
      title: tr(s.title ?? s.folder, locale),
      json,
      custom: json.template ? undefined : customScenes[`${base}scenes/${s.folder}/scene.vue`],
    }]
  })
  return { category: entry.folderCategory, json: entry.json, datos, scenes }
}

/** Los ítems de `datos.json` que nombra una escena, en su orden. */
export function itemsOf(storyboard: LoadedStoryboard, ids: string[] | undefined): DatosItem[] {
  return (ids ?? []).flatMap(id => storyboard.datos.items.find(item => item.id === id) ?? [])
}
