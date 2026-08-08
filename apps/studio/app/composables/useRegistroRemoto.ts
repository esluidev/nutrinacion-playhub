import { compararRegistro } from '~/utils/registroEstado'
import type { FilaRegistrada, ResultadoRegistro } from '~/utils/registroEstado'
import type { StoryboardMetadata } from '~/utils/storyboardMetadata'
import type { Localized } from '~/types/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA (y solo lectura) del catálogo real en Supabase.
//
// Studio no escribe nunca: el alta y la administración viven en admin/Platform, y la
// migración 0009 además cierra la escritura a superadmin del lado de la base. Acá solo se
// consulta para responder "¿este build ya está registrado, en qué estado, y sigue
// coincidiendo?".
//
// Se traen TODAS las filas de una (el catálogo es de decenas, no de miles) y se cachean en
// `useState`: la lista y el detalle comparten la misma consulta.
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistroRemoto extends FilaRegistrada {
  clave: string
  descripcion: Localized | null
  duracion_min: number | null
  organizacion_id: number | null
}

// Forma cruda de PostgREST: los embeds llegan como objeto (o null si no hay FK).
interface FilaCruda {
  clave: string
  estado: string
  numero_escenas: number
  idiomas: string[] | null
  descripcion: Localized | null
  duracion_min: number | null
  organizacion_id: number | null
  tipo: { codigo: string } | null
  categoria: { codigo: string } | null
  audiencia: { codigo: string } | null
}

const SELECT = `
  clave, estado, numero_escenas, idiomas, descripcion, duracion_min, organizacion_id,
  tipo:tipos_storyboard ( codigo ),
  categoria:categorias_storyboard ( codigo ),
  audiencia:edades_audiencia ( codigo )
`

export function useRegistroRemoto() {
  const filas = useState<Record<string, RegistroRemoto>>('registro-remoto', () => ({}))
  const cargando = useState('registro-remoto-cargando', () => false)
  const error = useState<string | null>('registro-remoto-error', () => null)
  const cargado = useState('registro-remoto-cargado', () => false)

  async function cargar(forzar = false) {
    if (cargado.value && !forzar) return
    if (!isSupabaseConfigured()) {
      error.value = 'Supabase no está configurado en esta instancia de Studio.'
      cargado.value = true
      return
    }

    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await useSupabaseClient()
        .from('storyboards')
        .select(SELECT)

      if (err) {
        error.value = 'No se pudo leer el catálogo.'
        return
      }

      const mapa: Record<string, RegistroRemoto> = {}
      for (const cruda of ((data as unknown) as FilaCruda[] | null) ?? []) {
        mapa[cruda.clave] = {
          clave: cruda.clave,
          estado: cruda.estado,
          numero_escenas: cruda.numero_escenas,
          idiomas: cruda.idiomas ?? [],
          descripcion: cruda.descripcion,
          duracion_min: cruda.duracion_min,
          organizacion_id: cruda.organizacion_id,
          tipo_codigo: cruda.tipo?.codigo ?? null,
          categoria_codigo: cruda.categoria?.codigo ?? null,
          audiencia_codigo: cruda.audiencia?.codigo ?? null,
        }
      }
      filas.value = mapa
      cargado.value = true
    }
    catch {
      error.value = 'No se pudo leer el catálogo.'
    }
    finally {
      cargando.value = false
    }
  }

  function filaDe(clave: string): RegistroRemoto | null {
    return filas.value[clave] ?? null
  }

  /** Estado de registro de un build contra lo que hay en la base. */
  function estadoDe(meta: StoryboardMetadata): ResultadoRegistro {
    return compararRegistro(meta, filaDe(meta.clave))
  }

  return { filas, cargando, cargado, error, cargar, filaDe, estadoDe }
}
