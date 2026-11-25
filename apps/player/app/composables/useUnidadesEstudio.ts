import { mensajeDeLaBase } from '~/utils/storyboardMetadata'
import type { FormUnidad, TextoPorIdioma } from '~/utils/unidadesEstudio'
import { mover, textoLimpio } from '~/utils/unidadesEstudio'
import type { Json } from '../../../../supabase/database.types'

// Las unidades de estudio de la app del hogar (tarea 022): Nutrinación agrupa storyboards del hogar en
// un recorrido. Solo el superadmin, desde Player (la RLS lo exige). Se leen de `unidades_estudio` con
// sus storyboards en orden; se guardan con `guardar_unidad_estudio` (la cabecera y la lista de una vez)
// y la base solo admite storyboards publicados en el hogar.

export interface UnidadEstudio {
  id: number
  titulo: TextoPorIdioma
  descripcion: TextoPorIdioma | null
  publicada: boolean
  orden: number
  /** Ids de sus storyboards, en orden. */
  storyboards: number[]
}

interface UnidadLeida {
  id: number
  titulo: TextoPorIdioma
  descripcion: TextoPorIdioma | null
  publicada: boolean
  orden: number
  unidad_estudio_storyboards: { storyboard_id: number, orden: number }[]
}

export function useUnidadesEstudio() {
  const unidades = useState<UnidadEstudio[]>('unidades-estudio', () => [])
  const cargando = useState('unidades-estudio-cargando', () => false)
  const error = useState<string | null>('unidades-estudio-error', () => null)

  async function cargar() {
    cargando.value = true
    const { data, error: e } = await useSupabaseClient()
      .from('unidades_estudio')
      .select('id, titulo, descripcion, publicada, orden, unidad_estudio_storyboards ( storyboard_id, orden )')
      .order('orden')
      .order('id')
    cargando.value = false
    if (e) {
      error.value = `No se pudieron leer las unidades: ${mensajeDeLaBase(e.message)}`
      return
    }
    error.value = null
    unidades.value = (((data as unknown) as UnidadLeida[] | null) ?? []).map(u => ({
      id: u.id,
      titulo: u.titulo ?? {},
      descripcion: u.descripcion,
      publicada: u.publicada,
      orden: u.orden,
      storyboards: [...u.unidad_estudio_storyboards].sort((a, b) => a.orden - b.orden).map(s => s.storyboard_id),
    }))
  }

  const unidad = (id: number) => unidades.value.find(u => u.id === id)

  /** Guarda la unidad (nueva si no tiene id). Devuelve su id, o el error de la base. */
  async function guardar(id: number | null, form: FormUnidad): Promise<{ id: number | null, error: string | null }> {
    const { data, error: e } = await useSupabaseClient().rpc('guardar_unidad_estudio', {
      p_unidad: {
        ...(id ? { id } : {}),
        titulo: textoLimpio(form.titulo) ?? {},
        descripcion: textoLimpio(form.descripcion),
        publicada: form.publicada,
        storyboards: form.storyboards,
      } as unknown as Json,
    })
    if (e) return { id: null, error: mensajeDeLaBase(e.message) }
    await cargar()
    return { id: Number(data), error: null }
  }

  async function eliminar(id: number): Promise<string | null> {
    const { error: e } = await useSupabaseClient().from('unidades_estudio').delete().eq('id', id)
    if (e) return mensajeDeLaBase(e.message)
    await cargar()
    return null
  }

  /** Cambia su lugar en la app con la de al lado (arriba o abajo): se renumeran todas, 1, 2, 3… */
  async function moverUnidad(id: number, delta: -1 | 1): Promise<string | null> {
    const i = unidades.value.findIndex(u => u.id === id)
    const nuevas = mover(unidades.value, i, delta)
    if (nuevas === unidades.value) return null
    const supabase = useSupabaseClient()
    const resultados = await Promise.all(nuevas.map((u, n) => (u.orden === n + 1
      ? null
      : supabase.from('unidades_estudio').update({ orden: n + 1 }).eq('id', u.id))))
    const e = resultados.find(r => r?.error)?.error
    await cargar()
    return e ? mensajeDeLaBase(e.message) : null
  }

  return { unidades, cargando, error, cargar, unidad, guardar, eliminar, moverUnidad }
}
