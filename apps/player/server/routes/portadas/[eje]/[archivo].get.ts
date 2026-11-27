import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// La portada de un storyboard (`content/storyboards/<eje>/<storyboard>/portada.svg`), en `/portadas/<eje>/<storyboard>.svg`:
// la usa la app del hogar en sus tarjetas (tarea 025). Esta ruta la sirve en desarrollo; al compilar, las portadas se
// copian como archivos (nuxt.config, `nitro:build:public-assets`), así que sirven también como web estática.
export default defineEventHandler(async (event) => {
  const { eje, archivo } = getRouterParams(event)
  if (!eje || !archivo || !/^[a-z0-9-]+$/.test(eje) || !/^[a-z0-9-]+\.svg$/.test(archivo)) throw createError({ statusCode: 404 })
  // La carpeta del contenido: la de la configuración o, si el servidor arrancó antes de tenerla, la de Player.
  const dir = String(useRuntimeConfig(event).contenidoStoryboards || join(process.cwd(), 'content', 'storyboards'))
  try {
    const svg = await readFile(join(dir, eje, archivo.replace(/\.svg$/, ''), 'portada.svg'), 'utf8')
    setResponseHeader(event, 'Content-Type', 'image/svg+xml')
    return svg
  }
  catch {
    throw createError({ statusCode: 404 })
  }
})
