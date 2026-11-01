import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { STORYBOARDS } from '~/runner/content'
import type { Json } from '../../../../supabase/database.types'
import type { Localized } from '~/types/i18n'
import { SECCIONES_GUIA, idiomasEscritos, resumenGuia } from '~/utils/catalogoResumen'
import type { EscenaGuia, EstadoPublicacion, GuiaIdioma } from '~/utils/catalogoResumen'
import { compararConBase, construirMetadata, diferenciasConBase, escenasQueSeQuitan, mensajeDeLaBase, validarMetadata } from '~/utils/storyboardMetadata'
import type { Diferencia, EstadoCatalogo, FilaCatalogo, StoryboardMetadata } from '~/utils/storyboardMetadata'

// El catálogo de la base frente al build (decisiones 006 y 007). Player registra o actualiza cada
// storyboard con `sincronizar_storyboard` (solo la metadata del JSON) y lo publica con
// `publicar_storyboard` (estado, países y organización). Solo el superadmin. La guía se escribe en
// Admin y aquí solo se mira. Se leen TODOS los storyboards de la base: los que no tienen JSON en
// este build se enseñan aparte, para archivarlos.

export interface Pais { codigo: string, nombre: string, bandera: string | null }
export interface Organizacion { id: number, nombre: string }

/** Una fila de `storyboards` con las escenas de su guía, tal como la lee Player. */
export interface FilaBase extends FilaCatalogo {
  id: number
  clave: string
  numero_escenas: number
  estado_publicacion: EstadoPublicacion
  paises_disponibles: string[]
  organizacion_id: number | null
  updated_at: string
  escenas: EscenaGuia[]
}

/** Cómo está en la base un storyboard del build, y qué habría que hacer. */
export interface EstadoBase {
  estado: EstadoCatalogo
  /** Qué campos cambiaron (palabras del equipo). */
  cambios: string[]
  /** Los mismos cambios con los dos valores, para enseñarlos. */
  diferencias: Diferencia[]
  /** Escenas que la actualización quitaría de la base, con su guía. */
  escenasQueSeQuitan: string[]
  /** Problemas del JSON frente a las listas cerradas de la base: con alguno, no se registra. */
  errores: string[]
}

/** Lo publicado de un storyboard registrado y cuánta guía tiene escrita. */
export interface Publicacion {
  id: number
  estado: EstadoPublicacion
  paises: string[]
  organizacionId: number | null
  actualizado: string
  guiaPorIdioma: GuiaIdioma[]
  /** Por carpeta de escena, en qué idiomas hay algo escrito. */
  guiaPorEscena: Record<string, string[]>
}

interface FilaLeida {
  id: number
  clave: string
  slug: string
  version_build: string | null
  titulo: Localized
  categoria: string
  subcategoria: string | null
  edicion: string
  enfoques_salud: string[]
  idiomas: string[]
  idioma_principal: string
  duracion_min: number | null
  numero_escenas: number
  estado_publicacion: EstadoPublicacion
  paises_disponibles: string[]
  organizacion_id: number | null
  updated_at: string
  guias: { guia_escenas: EscenaGuia[] } | { guia_escenas: EscenaGuia[] }[] | null
}

const CLAVES_DEL_BUILD = new Set(STORYBOARDS.map(s => s.json.key))

// Una sola lectura a la vez: las dos páginas piden recargar al montarse.
let lecturaEnCurso: Promise<void> | null = null

export function useCatalogoBase() {
  const filas = useState<Record<string, FilaBase>>('catalogo-base', () => ({}))
  const paises = useState<Pais[]>('catalogo-base-paises', () => [])
  const organizaciones = useState<Organizacion[]>('catalogo-base-orgs', () => [])
  const adminUrl = useState<string | null>('catalogo-base-admin-url', () => null)
  const cargado = useState('catalogo-base-cargado', () => false)
  const cargando = useState('catalogo-base-cargando', () => false)
  const error = useState<string | null>('catalogo-base-error', () => null)

  async function leer() {
    const supabase = useSupabaseClient()
    const [storyboards, listaPaises, listaOrgs, configuracion] = await Promise.all([
      supabase
        .from('storyboards')
        .select(`id, clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud, idiomas,
                 idioma_principal, duracion_min, numero_escenas, estado_publicacion, paises_disponibles, organizacion_id,
                 updated_at, guias ( guia_escenas ( orden, carpeta, titulo, ${SECCIONES_GUIA.join(', ')} ) )`)
        .order('slug'),
      supabase.from('paises').select('codigo, nombre, bandera').eq('activo', true).order('codigo'),
      supabase.from('organizaciones').select('id, nombre').order('nombre'),
      // La URL de Admin, para enlazar la guía. Si la RLS no deja leerla, no hay enlace: no se inventa.
      supabase.from('configuracion').select('valor').eq('clave', 'admin_url').maybeSingle(),
    ])
    if (storyboards.error) {
      error.value = `No se pudo leer el catálogo de la base: ${mensajeDeLaBase(storyboards.error.message)}`
      return
    }
    error.value = null
    const leidas = ((storyboards.data as unknown) as FilaLeida[] | null) ?? []
    filas.value = Object.fromEntries(leidas.map(({ guias, ...fila }) => {
      const guia = Array.isArray(guias) ? guias[0] : guias
      const escenas = [...(guia?.guia_escenas ?? [])].sort((a, b) => a.orden - b.orden)
      return [fila.clave, { ...fila, escenas }]
    }))
    paises.value = ((listaPaises.data ?? []) as { codigo: string, nombre: Record<string, string>, bandera: string | null }[])
      .map(p => ({ codigo: p.codigo, nombre: p.nombre?.es ?? p.codigo, bandera: p.bandera }))
    organizaciones.value = listaOrgs.data ?? []
    const url = configuracion.error ? null : configuracion.data?.valor?.trim() || null
    adminUrl.value = url ? urlEnEsteEquipo(url.replace(/\/+$/, '')) : null
    cargado.value = true
  }

  /** Lee (o vuelve a leer) la base. Las páginas la llaman al montarse; los botones, al pulsarlos. */
  async function cargar() {
    if (lecturaEnCurso) return lecturaEnCurso
    cargando.value = true
    lecturaEnCurso = leer()
      .catch((e: unknown) => {
        error.value = `No se pudo leer el catálogo de la base: ${mensajeDeLaBase(e instanceof Error ? e.message : String(e))}`
      })
      .finally(() => {
        cargando.value = false
        lecturaEnCurso = null
      })
    return lecturaEnCurso
  }

  function metadataDe(slug: string): StoryboardMetadata | null {
    const build = STORYBOARDS.find(s => s.json.slug === slug)
    return build ? construirMetadata(build.json) : null
  }

  /** Cómo está en la base un storyboard del build; null mientras no se ha leído la base. */
  function estadoDe(slug: string): EstadoBase | null {
    const meta = metadataDe(slug)
    if (!meta || !cargado.value) return null
    const base = filas.value[meta.clave] ?? null
    return {
      ...compararConBase(meta, base),
      diferencias: diferenciasConBase(meta, base),
      escenasQueSeQuitan: escenasQueSeQuitan(meta, base),
      errores: validarMetadata(meta),
    }
  }

  /** La publicación de un storyboard ya registrado; null si no está en la base. */
  function publicacionDe(slug: string): Publicacion | null {
    const meta = metadataDe(slug)
    const fila = meta ? filas.value[meta.clave] : undefined
    if (!fila) return null
    return {
      id: fila.id,
      estado: fila.estado_publicacion,
      paises: fila.paises_disponibles,
      organizacionId: fila.organizacion_id,
      actualizado: fila.updated_at,
      guiaPorIdioma: resumenGuia(fila.escenas, fila.idiomas),
      guiaPorEscena: Object.fromEntries(fila.escenas.map(e => [e.carpeta, idiomasEscritos(e, fila.idiomas)])),
    }
  }

  /** Los storyboards que están en la base y no tienen JSON en este build. */
  const fueraDelBuild = computed(() => Object.values(filas.value).filter(f => !CLAVES_DEL_BUILD.has(f.clave)))

  const paisDe = (codigo: string): Pais => paises.value.find(p => p.codigo === codigo) ?? { codigo, nombre: codigo, bandera: null }
  const organizacionDe = (id: number | null): Organizacion | null => (id ? organizaciones.value.find(o => o.id === id) ?? null : null)

  /** Dónde se escribe la guía de un storyboard registrado; null si no se conoce la URL de Admin. */
  const urlGuiaEnAdmin = (id: number): string | null => (adminUrl.value ? `${adminUrl.value}/platform/storyboards/${id}` : null)

  /** Registra o actualiza el storyboard en la base con lo que dice su JSON. Devuelve el error, o null. */
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
  async function publicar(slug: string, datos: { estado: EstadoPublicacion, paises: string[], organizacionId: number | null }): Promise<string | null> {
    const meta = metadataDe(slug)
    if (!meta) return 'Ese storyboard no está en el build.'
    return cambiarPublicacion(meta.clave, datos)
  }

  /** Archiva un storyboard que está en la base sin JSON en este build; conserva sus países y su organización. */
  async function archivar(clave: string): Promise<string | null> {
    const fila = filas.value[clave]
    if (!fila) return 'Ese storyboard no está en la base.'
    return cambiarPublicacion(clave, { estado: 'ARCHIVADO', paises: fila.paises_disponibles, organizacionId: fila.organizacion_id })
  }

  async function cambiarPublicacion(clave: string, datos: { estado: EstadoPublicacion, paises: string[], organizacionId: number | null }): Promise<string | null> {
    const { error: e } = await useSupabaseClient().rpc('publicar_storyboard', {
      p_clave: clave,
      p_estado: datos.estado,
      p_paises: datos.paises,
      ...(datos.organizacionId ? { p_organizacion: datos.organizacionId } : {}),
    })
    if (e) return mensajeDeLaBase(e.message)
    await cargar()
    return null
  }

  return {
    cargado, cargando, error, paises, organizaciones, fueraDelBuild,
    estadoDe, publicacionDe, paisDe, organizacionDe, urlGuiaEnAdmin,
    sincronizar, publicar, archivar, cargar,
  }
}
