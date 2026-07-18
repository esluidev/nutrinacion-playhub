import type { SceneConfig } from '~/types/scene'

// ─────────────────────────────────────────────────────────────────────────────
// Uso REAL de primitivas en el contenido: escanea los scene.config.ts de todos
// los storyboards (campo `primitives`) y agrega métricas útiles para admins:
// qué primitivas consume el contenido, cuáles no se usan aún y cuánto contenido
// jugable existe. Misma fuente de verdad que el runner (glob de configs).
// ─────────────────────────────────────────────────────────────────────────────

const configModules = import.meta.glob<{ default: SceneConfig }>(
  '../../content/storyboards/*/*/scenes/*/scene.config.ts',
  { eager: true },
)

const storyboardModules = import.meta.glob(
  '../../content/storyboards/*/*/storyboard.json',
  { eager: true },
)

// Solo claves (lazy): alcanza para contar los sprites del catálogo
const spriteModules = import.meta.glob('../sprites/*.vue')

export interface PrimitiveUsage {
  /** Escenas que declaran la primitiva */
  scenes: number
  /** Storyboards distintos que la consumen */
  storyboards: number
}

export function usePrimitivesUsage() {
  const usage = new Map<string, { scenes: number, storyboards: Set<string> }>()

  for (const [path, mod] of Object.entries(configModules)) {
    // path: ../../content/storyboards/<cat>/<storyboard>/scenes/<slug>/scene.config.ts
    const storyboard = path.split('/storyboards/')[1]?.split('/scenes/')[0] ?? path
    for (const name of mod.default.primitives ?? []) {
      const entry = usage.get(name) ?? { scenes: 0, storyboards: new Set<string>() }
      entry.scenes++
      entry.storyboards.add(storyboard)
      usage.set(name, entry)
    }
  }

  const totalScenes = Object.keys(configModules).length
  const totalStoryboards = Object.keys(storyboardModules).length
  const spritesCount = Object.keys(spriteModules).filter(p => !p.endsWith('kid-poses.ts')).length

  function usageFor(name: string): PrimitiveUsage {
    const u = usage.get(name)
    return { scenes: u?.scenes ?? 0, storyboards: u?.storyboards.size ?? 0 }
  }

  /** La primitiva más consumida por el contenido */
  const topUsage = [...usage.entries()]
    .map(([name, u]) => ({ name, scenes: u.scenes, storyboards: u.storyboards.size }))
    .sort((a, b) => b.scenes - a.scenes)[0] ?? null

  return { usageFor, topUsage, totalScenes, totalStoryboards, spritesCount }
}
