import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { esNarrado, grabacionDe, textoDe, unirFrases, vozDe } from '~/runner/audio/voz'
import { useSceneText } from '~/runner/board'
import type { SceneJson } from '~/runner/types'

// Lo que se ve y lo que se dice (audio/voz.ts): un texto por idioma, o un texto narrado con su voz y su grabación.

const consigna = { es: 'Toca un huevo y descubre su ave', en: 'Tap an egg and discover its bird' }
const narrada = {
  text: consigna,
  voice: { es: 'Toca un huevo y descubre su ave. ¿Se parecerán todos los huevos?', en: 'Tap an egg and discover its bird. Will all eggs look alike?' },
  audio: 'descubrimiento-intro',
}

describe('textoDe — lo que se ve', () => {
  it('de un texto por idioma, de uno plano y de uno narrado', () => {
    expect(textoDe(consigna, 'es')).toBe('Toca un huevo y descubre su ave')
    expect(textoDe('Hola', 'en')).toBe('Hola')
    expect(textoDe(narrada, 'en')).toBe('Tap an egg and discover its bird')
  })

  it('sin texto, vacío; sin el idioma, el español', () => {
    expect(textoDe(null, 'es')).toBe('')
    expect(textoDe(undefined, 'es')).toBe('')
    expect(textoDe({ es: 'Solo en español' }, 'en')).toBe('Solo en español')
  })

  it('un texto narrado se reconoce por su `text`; uno por idioma, no', () => {
    expect(esNarrado(narrada)).toBe(true)
    expect(esNarrado(consigna)).toBe(false)
    expect(esNarrado('Hola')).toBe(false)
  })
})

describe('vozDe — lo que se dice en un momento', () => {
  it('sin ninguna voz, se lee lo que se ve, seguido y con su punto', () => {
    expect(vozDe([{ es: 'Este huevo es de gallina' }, { es: 'Sin manchitas.' }], 'es'))
      .toEqual([{ text: 'Este huevo es de gallina. Sin manchitas.' }])
  })

  it('con voz, la voz y su grabación, no lo que se ve', () => {
    expect(vozDe([narrada], 'es')).toEqual([{ text: 'Toca un huevo y descubre su ave. ¿Se parecerán todos los huevos?', audio: 'descubrimiento-intro' }])
  })

  it('si alguna parte trae voz, suenan solo las que la traen, en orden', () => {
    const titulo = { text: { es: 'Este huevo es de gallina' }, voice: { es: 'Es de gallina, y no tiene manchitas.' }, audio: 'gallina' }
    const cierre = { text: { es: 'Se comen huevos de gallina, codorniz y pato.' }, audio: 'cierre' }
    expect(vozDe([titulo, { es: 'Sin manchitas.' }, cierre], 'es')).toEqual([
      { text: 'Es de gallina, y no tiene manchitas.', audio: 'gallina' },
      { text: 'Se comen huevos de gallina, codorniz y pato.', audio: 'cierre' },
    ])
  })

  it('una grabación sin voz dice lo que se ve', () => {
    expect(vozDe([{ text: { es: 'Hoy vamos a conocer el huevo.' }, audio: 'bienvenida' }], 'es'))
      .toEqual([{ text: 'Hoy vamos a conocer el huevo.', audio: 'bienvenida' }])
  })

  it('nada que decir, ninguna voz', () => {
    expect(vozDe([null, undefined, { es: '  ' }], 'es')).toEqual([])
  })

  it('unirFrases no duplica el signo que ya trae cada frase', () => {
    expect(unirFrases(['¿Está listo si queda líquido?', 'Firme significa que ya no están líquidas.'])).toBe('¿Está listo si queda líquido? Firme significa que ya no están líquidas.')
    expect(unirFrases(['Gallina', '', 'Sin manchitas'])).toBe('Gallina. Sin manchitas')
  })
})

describe('sheet — la hoja de una plantilla, con su voz', () => {
  const scene = { strings: { hint: { es: '¿Está listo si queda líquido?' }, hintBody: { text: { es: 'Firme: ya no está líquido.' }, voice: { es: 'Firme quiere decir que ya no está líquido.' }, audio: 'pista' } } } as unknown as SceneJson
  const { sheet, raw } = useSceneText({ scene, locale: 'es' })

  it('se ve el título y el cuerpo; se dice la voz', () => {
    expect(sheet('retry', raw('hint'), raw('hintBody'))).toEqual({
      kind: 'retry',
      title: '¿Está listo si queda líquido?',
      body: 'Firme: ya no está líquido.',
      voice: [{ text: 'Firme quiere decir que ya no está líquido.', audio: 'pista' }],
    })
  })

  it('sin cuerpo, sin `body`', () => {
    expect(sheet('info', raw('hint'))).toEqual({ kind: 'info', title: '¿Está listo si queda líquido?', voice: [{ text: '¿Está listo si queda líquido?' }] })
  })
})

// ── El contenido: cada texto narrado de cada storyboard está bien formado ──────────────────────────────────────────
const ROOT = join(__dirname, '..', 'content', 'storyboards')

function storyboards(): { carpeta: string, idiomas: string[], archivos: string[] }[] {
  const lista = []
  for (const eje of readdirSync(ROOT)) {
    for (const slug of readdirSync(join(ROOT, eje))) {
      const carpeta = join(ROOT, eje, slug)
      let json: { languages?: string[] }
      try {
        json = JSON.parse(readFileSync(join(carpeta, 'storyboard.json'), 'utf8'))
      }
      catch {
        continue
      }
      const escenas = readdirSync(join(carpeta, 'scenes'), { withFileTypes: true }).filter(d => d.isDirectory())
        .map(d => join(carpeta, 'scenes', d.name, 'scene.json'))
      lista.push({ carpeta: `${eje}/${slug}`, idiomas: json.languages ?? ['es'], archivos: [join(carpeta, 'storyboard.json'), join(carpeta, 'datos.json'), ...escenas] })
    }
  }
  return lista
}

function narrados(valor: unknown, en: string, salida: { donde: string, valor: Record<string, unknown> }[] = []) {
  if (esNarrado(valor)) salida.push({ donde: en, valor: valor as unknown as Record<string, unknown> })
  else if (Array.isArray(valor)) valor.forEach((v, i) => narrados(v, `${en}[${i}]`, salida))
  else if (valor && typeof valor === 'object') Object.entries(valor).forEach(([k, v]) => narrados(v, `${en}.${k}`, salida))
  return salida
}

describe('el contenido — los textos narrados de cada storyboard', () => {
  for (const sb of storyboards()) {
    it(`${sb.carpeta}: cada uno tiene texto en sus idiomas y su grabación una clave única`, () => {
      const claves = new Map<string, string>()
      for (const archivo of sb.archivos) {
        let json: unknown
        try {
          json = JSON.parse(readFileSync(archivo, 'utf8'))
        }
        catch {
          continue
        }
        for (const { donde, valor } of narrados(json, archivo.split('content/storyboards/')[1]!)) {
          for (const idioma of sb.idiomas) expect(textoDe(valor as never, idioma), `${donde}: sin texto en ${idioma}`).not.toBe('')
          const grabacion = grabacionDe(valor, sb.idiomas)
          if (!grabacion) continue
          expect(grabacion.audio, `${donde}: clave «${grabacion.audio}»`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          const dice = JSON.stringify(grabacion.dice)
          const antes = claves.get(grabacion.audio)
          expect(antes === undefined || antes === dice, `${donde}: la clave «${grabacion.audio}» ya dice otra cosa`).toBe(true)
          claves.set(grabacion.audio, dice)
        }
      }
    })
  }
})
