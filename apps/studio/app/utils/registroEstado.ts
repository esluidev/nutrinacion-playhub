import type { StoryboardMetadata } from '~/utils/storyboardMetadata'

// ─────────────────────────────────────────────────────────────────────────────
// ¿Este storyboard compilado ya está registrado en Supabase, y sigue coincidiendo con
// lo que hay en el build?
//
// Tres estados, no dos: "registrado" no alcanza. Si alguien agrega una escena al build
// después de registrarlo, la base sigue diciendo el número viejo y admin publicaría un
// storyboard que no coincide con el runner desplegado. Ese caso tiene que verse.
//
// Lógica PURA (sin Nuxt, sin red) para poder testearla: la consulta vive en
// `composables/useRegistroRemoto.ts`.
// ─────────────────────────────────────────────────────────────────────────────

export type EstadoRegistro = 'sin_registrar' | 'al_dia' | 'desactualizado'

/** Lo build-owned tal como quedó guardado en `storyboards` al registrar. */
export interface FilaRegistrada {
  estado: string                    // storyboards.estado (BORRADOR | EN_REVISION | PUBLICADO | ARCHIVADO)
  numero_escenas: number
  idiomas: string[]
  tipo_codigo: string | null
  categoria_codigo: string | null
  audiencia_codigo: string | null
}

export interface ResultadoRegistro {
  estado: EstadoRegistro
  /** Qué cambió en el build respecto a lo registrado. Vacío salvo en 'desactualizado'. */
  diferencias: string[]
}

const mismosIdiomas = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',')

export function compararRegistro(
  meta: StoryboardMetadata,
  fila: FilaRegistrada | null | undefined,
): ResultadoRegistro {
  // Sin fila = compilado pero nunca dado de alta en admin.
  if (!fila) return { estado: 'sin_registrar', diferencias: [] }

  const diferencias: string[] = []

  if (fila.numero_escenas !== meta.numero_escenas) {
    diferencias.push(`escenas: ${fila.numero_escenas} registradas → ${meta.numero_escenas} en el build`)
  }
  if (!mismosIdiomas(fila.idiomas ?? [], meta.idiomas)) {
    diferencias.push(`idiomas: ${(fila.idiomas ?? []).join('·').toUpperCase() || '—'} → ${meta.idiomas.join('·').toUpperCase()}`)
  }
  if (fila.tipo_codigo !== meta.tipo_codigo) {
    diferencias.push(`tipo: ${fila.tipo_codigo ?? '—'} → ${meta.tipo_codigo}`)
  }
  if ((fila.categoria_codigo ?? null) !== meta.categoria_codigo) {
    diferencias.push(`categoría: ${fila.categoria_codigo ?? '—'} → ${meta.categoria_codigo ?? '—'}`)
  }
  if (fila.audiencia_codigo !== meta.audiencia_codigo) {
    diferencias.push(`audiencia: ${fila.audiencia_codigo ?? '—'} → ${meta.audiencia_codigo}`)
  }

  return { estado: diferencias.length ? 'desactualizado' : 'al_dia', diferencias }
}

// Etiquetas del estado de PUBLICACIÓN, que es de la base (no del build). Se muestran
// solo cuando hay fila; sin registro no hay estado que mostrar.
const ETIQUETAS_PUBLICACION: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  PUBLICADO: 'Publicado',
  ARCHIVADO: 'Archivado',
}

export function etiquetaPublicacion(estado: string | null | undefined): string {
  if (!estado) return '—'
  return ETIQUETAS_PUBLICACION[estado] ?? estado
}

export function varianteBadgePublicacion(estado: string | null | undefined) {
  switch (estado) {
    case 'PUBLICADO': return 'green' as const
    case 'EN_REVISION': return 'yellow' as const
    case 'ARCHIVADO': return 'coral' as const
    default: return 'gray' as const
  }
}
