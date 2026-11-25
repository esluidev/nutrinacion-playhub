// Los avatares de quien juega: un animal de la librería (`avatar-<clave>`) en un círculo, con su
// nombre propio y el tono de fondo que mejor lo separa de su pelaje (entre los tonos del kit para las
// personas: cielo, uva o rosa). Quien se une a un taller elige uno y puede escribir un apodo; sin
// apodo, se le llama por el nombre del avatar (tarea 013). El nombre sirve igual en los dos idiomas.

export type TonoAvatar = 'sky' | 'grape' | 'rose'

// Solo los dibujos de los avatares (no toda la librería): la página para unirse los usa sin cargar el contenido.
const DIBUJOS = import.meta.glob<string>('../../content/library/svg/avatar-*.svg', { eager: true, query: '?url', import: 'default' })

/** URL servida del dibujo de un avatar. */
export function dibujoDe(clave: string): string | undefined {
  return DIBUJOS[`../../content/library/svg/avatar-${clave}.svg`]
}

export const AVATARES = [
  { clave: 'zorro', nombre: 'Rufo', tono: 'sky' },
  { clave: 'oso', nombre: 'Bruno', tono: 'sky' },
  { clave: 'conejo', nombre: 'Lila', tono: 'grape' },
  { clave: 'gato', nombre: 'Michi', tono: 'rose' },
  { clave: 'rana', nombre: 'Rita', tono: 'rose' },
  { clave: 'leon', nombre: 'Leo', tono: 'grape' },
] as const satisfies readonly { clave: string, nombre: string, tono: TonoAvatar }[]

export type Avatar = typeof AVATARES[number]['clave']

export const APODO_MAX = 20

export function esAvatar(clave: unknown): clave is Avatar {
  return AVATARES.some(a => a.clave === clave)
}

export function tonoDe(clave: string): TonoAvatar {
  return AVATARES.find(a => a.clave === clave)?.tono ?? 'sky'
}

/** El apodo tal como se guarda: sin espacios de más y hasta 20 letras; vacío, null. */
export function limpiarApodo(apodo: string | null | undefined): string | null {
  const limpio = (apodo ?? '').replace(/\s+/g, ' ').trim().slice(0, APODO_MAX).trim()
  return limpio || null
}

/** Cómo se le llama: su apodo o, sin él, el nombre de su avatar. */
export function nombreVisible(apodo: string | null | undefined, avatar: string): string {
  return limpiarApodo(apodo) ?? AVATARES.find(a => a.clave === avatar)?.nombre ?? AVATARES[0].nombre
}

/** Si dos se llaman igual en el mismo taller, el segundo lleva un número («Bruno 2»), en el orden en que llegaron. */
export function nombresSinRepetir<T extends { id: string, nombre: string }>(lista: T[]): Map<string, string> {
  const vistos = new Map<string, number>()
  const nombres = new Map<string, string>()
  for (const { id, nombre } of lista) {
    const clave = nombre.toLocaleLowerCase()
    const n = (vistos.get(clave) ?? 0) + 1
    vistos.set(clave, n)
    nombres.set(id, n === 1 ? nombre : `${nombre} ${n}`)
  }
  return nombres
}
