import { STORYBOARDS } from '~/runner/content'
import type { Json } from '../../../../supabase/database.types'
import type { Enums } from '../../../../supabase/database.types'
import { compararConBase, construirMetadata, mensajeDeLaBase, validarMetadata } from '~/utils/storyboardMetadata'
import type { EstadoCatalogo, FilaCatalogo, StoryboardMetadata } from '~/utils/storyboardMetadata'

// El catálogo de la base frente al build: qué storyboards están registrados, cuáles al día y
// cuáles no, y su publicación (decisión 006). Player los registra o actualiza con
// `sincronizar_storyboard` (la metadata del JSON) y los publica con `publicar_storyboard` (estado,
// países y organización). Solo el superadmin. La guía se escribe en Admin y aquí solo se ve.

export type EstadoPublicacion = Enums<'estado_publicacion'>

// Las secciones de la guía de cada escena (guia_escenas): para saber cuánto hay escrito por idioma.
const SECCIONES_GUIA = ['verbo', 'subtitulo', 'descripcion', 'objetivo', 'pedagogia', 'preguntas', 'psicologia',
  'cientifico', 'no_hace', 'consejos', 'mecanica', 'material'] as const

type EscenaGuia = StoryboardMetadata['escenas'][number] & Partial<Record<(typeof SECCIONES_GUIA)[number], Record<string, string> | null>>

interface FilaBase extends FilaCatalogo {
  clave: string
  estado_publicacion: EstadoPublicacion
  paises_disponibles: string[]
  organizacion_id: number | null
  guias: { guia_escenas: EscenaGuia[] } | { guia_escenas: EscenaGuia[] }[] | null
}

/** Lo publicado de un storyboard registrado y cuánta guía tiene escrita en cada idioma. */
export interface Publicacion {
  estado: EstadoPublicacion
  paises: string[]
  organizacionId: number | null
  guiaPorIdioma: { idioma: string, escritas: number, total: number }[]
}

export const ESTADO_CATALOGO: Record<EstadoCatalogo, { label: string, tone: 'coral' | 'sun' | 'lime' }> = {
  sin_registrar: { label: 'Sin registrar', tone: 'coral' },
  desactualizado: { label: 'Desactualizado', tone: 'sun' },
  al_dia: { label: 'Al día', tone: 'lime' },
}

export const ESTADO_PUBLICACION: Record<EstadoPublicacion, { label: string, desc: string }> = {
  REGISTRADO: { label: 'Registrado', desc: 'Está en la base; solo lo ve el equipo de Nutrinación.' },
  EN_REVISION: { label: 'En revisión', desc: 'El equipo revisa el contenido y la guía antes de publicarlo.' },
  PUBLICADO: { label: 'Publicado', desc: 'Lo ven las organizaciones de sus países y se puede programar.' },
  ARCHIVADO: { label: 'Archivado', desc: 'No se programa más; lo ya programado se conserva.' },
}

export function useCatalogoBase() {
  const filas = useState<Record<string, FilaCatalogo>>('catalogo-base', () => ({}))
  const publicaciones = useState<Record<string, Publicacion>>('catalogo-base-publicacion', () => ({}))
  const paises = useState<{ codigo: string, nombre: string, bandera: string | null }[]>('catalogo-base-paises', () => [])
  const organizaciones = useState<{ id: number, nombre: string }[]>('catalogo-base-orgs', () => [])
  const cargado = useState('catalogo-base-cargado', () => false)
  const error = useState<string | null>('catalogo-base-error', () => null)

  async function cargar() {
    const supabase = useSupabaseClient()
    const [{ data, error: e }, { data: listaPaises }, { data: listaOrgs }] = await Promise.all([
      supabase
        .from('storyboards')
        .select(`clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud, idiomas,
                 idioma_principal, duracion_min, estado_publicacion, paises_disponibles, organizacion_id,
                 guias ( guia_escenas ( orden, carpeta, titulo, ${SECCIONES_GUIA.join(', ')} ) )`)
        .in('clave', STORYBOARDS.map(s => s.json.key)),
      supabase.from('paises').select('codigo, nombre, bandera').eq('activo', true).order('codigo'),
      supabase.from('organizaciones').select('id, nombre').order('nombre'),
    ])
    if (e) {
      error.value = 'No se pudo leer el catálogo de la base.'
      return
    }
    error.value = null
    const leidas = ((data as unknown) as FilaBase[] | null) ?? []
    filas.value = Object.fromEntries(leidas.map(({ clave, guias, estado_publicacion: _e, paises_disponibles: _p, organizacion_id: _o, ...fila }) => {
      const guia = Array.isArray(guias) ? guias[0] : guias
      const escenas = (guia?.guia_escenas ?? []).map(({ orden, carpeta, titulo }) => ({ orden, carpeta, titulo }))
      return [clave, { ...fila, escenas }]
    }))
    publicaciones.value = Object.fromEntries(leidas.map((fila) => {
      const guia = Array.isArray(fila.guias) ? fila.guias[0] : fila.guias
      const escenas = guia?.guia_escenas ?? []
      const guiaPorIdioma = fila.idiomas.map(idioma => ({
        idioma,
        escritas: escenas.filter(es => SECCIONES_GUIA.some(sec => !!es[sec]?.[idioma]?.trim())).length,
        total: escenas.length,
      }))
      return [fila.clave, { estado: fila.estado_publicacion, paises: fila.paises_disponibles, organizacionId: fila.organizacion_id, guiaPorIdioma }]
    }))
    paises.value = ((listaPaises ?? []) as { codigo: string, nombre: Record<string, string>, bandera: string | null }[])
      .map(p => ({ codigo: p.codigo, nombre: p.nombre.es ?? p.codigo, bandera: p.bandera }))
    organizaciones.value = listaOrgs ?? []
    cargado.value = true
  }

  function metadataDe(slug: string): StoryboardMetadata | null {
    const build = STORYBOARDS.find(s => s.json.slug === slug)
    return build ? construirMetadata(build.json) : null
  }

  /** Cómo está en la base un storyboard del build; null mientras no se ha leído la base. */
  function estadoDe(slug: string) {
    const meta = metadataDe(slug)
    if (!meta || !cargado.value) return null
    return compararConBase(meta, filas.value[meta.clave] ?? null)
  }

  /** La publicación de un storyboard ya registrado; null si no está en la base. */
  function publicacionDe(slug: string): Publicacion | null {
    const meta = metadataDe(slug)
    return meta ? publicaciones.value[meta.clave] ?? null : null
  }

  /** Registra o actualiza el storyboard en la base. Devuelve el error, o null. */
  async function sincronizar(slug: string): Promise<string | null> {
    const meta = metadataDe(slug)
    if (!meta) return 'Ese storyboard no está en el build.'
    const errores = validarMetadata(meta)
    if (errores.length) return `Revisa el JSON: ${errores.join('; ')}.`
    const { error: e } = await useSupabaseClient().rpc('sincronizar_storyboard', { p_metadata: meta as unknown as Json })
    if (e) return mensajeDeLaBase(e.message)
    await cargar()
    return null
  }

  /** Cambia el estado, los países y la organización (null = estándar). Devuelve el error, o null. */
  async function publicar(slug: string, datos: { estado: EstadoPublicacion, paises: string[], organizacionId: number | null }) {
    const meta = metadataDe(slug)
    if (!meta) return 'Ese storyboard no está en el build.'
    const { error: e } = await useSupabaseClient().rpc('publicar_storyboard', {
      p_clave: meta.clave,
      p_estado: datos.estado,
      p_paises: datos.paises,
      ...(datos.organizacionId ? { p_organizacion: datos.organizacionId } : {}),
    })
    if (e) return e.message
    await cargar()
    return null
  }

  if (import.meta.client && !cargado.value) cargar()

  return { cargado, error, paises, organizaciones, estadoDe, publicacionDe, sincronizar, publicar, cargar }
}
