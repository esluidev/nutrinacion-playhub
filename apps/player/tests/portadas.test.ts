import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Cada storyboard con `cover` trae su `portada.svg` al lado, y uno con `portada.svg` la declara (tarea 025): si no, la
// app del hogar pediría una portada que no existe o no sabría de una que sí.
const raiz = join(__dirname, '..', 'content', 'storyboards')
const storyboards = readdirSync(raiz, { withFileTypes: true }).filter(e => e.isDirectory())
  .flatMap(eje => readdirSync(join(raiz, eje.name), { withFileTypes: true }).filter(e => e.isDirectory()).map(s => join(raiz, eje.name, s.name)))

describe('portadas de los storyboards', () => {
  it.each(storyboards)('%s: `cover` y portada.svg van juntos', (dir) => {
    const json = JSON.parse(readFileSync(join(dir, 'storyboard.json'), 'utf8')) as { cover?: boolean }
    expect(Boolean(json.cover)).toBe(existsSync(join(dir, 'portada.svg')))
  })
})
