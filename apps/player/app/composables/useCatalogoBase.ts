import { STORYBOARDS } from '~/runner/content'
import type { Json } from '../../../../supabase/database.types'
import type { Localized } from '~/types/i18n'
import { SECCIONES_GUIA, idiomasEscritos, resumenGuia } from '~/utils/catalogoResumen'
import type { CabeceraGuia, EscenaGuia, EstadoPublicacion, GuiaIdioma, SeccionGuia } from '~/utils/catalogoResumen'
import { compararConBase, construirMetadata, diferenciasConBase, escenasQueSeQuitan, mensajeDeLaBase, validarMetadata } from '~/utils/storyboardMetadata'
import type { Diferencia, EstadoCatalogo, FilaCatalogo, StoryboardMetadata } from '~/utils/storyboardMetadata'

// El catálogo de la base frente al build (decisiones 006, 007 y 013). Player es el único que lo
// cambia: registra o actualiza cada storyboard con `sincronizar_storyboard` (solo la metadata del
// JSON), lo publica con `publicar_storyboard` (estado, países y organización) y, si sale en la app
// del hogar, con `publicar_storyboard_hogar` (tarea 022), escribe su guía
// (`guias` y `guia_escenas`, la cabecera y cada escena) y lo elimina. Solo el superadmin; Admin solo
// lo muestra. Se leen TODOS los storyboards de la base: los que no tienen JSON en este build se
// enseñan aparte, para archivarlos o eliminarlos.

export interface Pais { codigo: string, nombre: string, bandera: string | null }
export interface Organizacion { id: number, nombre: string }

/** La cabecera de la guía con su id, para guardarla. */
export interface CabeceraGuardada extends CabeceraGuia {
  id: number
}

/** Una fila de `storyboards` con su guía (la cabecera y las escenas), tal como la lee Player. */
export interface FilaBase extends FilaCatalogo {
  id: number
  clave: string
  numero_escenas: number
  estado_publicacion: EstadoPublicacion
  paises_disponibles: string[]
  organizacion_id: number | null
  publicado_hogar: boolean
  updated_at: string
  guia: CabeceraGuardada | null
  escenas: EscenaGuia[]
}

/** La guía de un storyboard registrado, para escribirla. */
export interface GuiaEditable {
  cabecera: CabeceraGuardada | null
  /** Las escenas en su orden, con su id en la base. */
  escenas: (EscenaGuia & { id: number })[]
  /** Los idiomas del storyboard: la guía se escribe en cada uno. */
  idiomas: string[]
  /** Un personalizado lleva «Adaptado a» en la cabecera. */
  personalizado: boolean
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
  /** Si sale en la app del hogar (tarea 022): solo publicado y estándar. */
  hogar: boolean
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
  publicado_hogar: boolean
  updated_at: string
  guias: GuiaLeida | GuiaLeida[] | null
}

type GuiaLeida = CabeceraGuardada & { guia_escenas: EscenaGuia[] }

const CLAVES_DEL_BUILD = new Set(STORYBOARDS.map(s => s.json.key))

// Una sola lectura a la vez: las dos páginas piden recargar al montarse.
let lecturaEnCurso: Promise<void> | null = null

export function useCatalogoBase() {
  const filas = useState<Record<string, FilaBase>>('catalogo-base', () => ({}))
  const paises = useState<Pais[]>('catalogo-base-paises', () => [])
  const organizaciones = useState<Organizacion[]>('catalogo-base-orgs', () => [])
  const cargado = useState('catalogo-base-cargado', () => false)
  const cargando = useState('catalogo-base-cargando', () => false)
  const error = useState<string | null>('catalogo-base-error', () => null)

  async function leer() {
    const supabase = useSupabaseClient()
    const [storyboards, listaPaises, listaOrgs] = await Promise.all([
      supabase
        .from('storyboards')
        .select(`id, clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud, idiomas,
                 idioma_principal, duracion_min, numero_escenas, estado_publicacion, paises_disponibles, organizacion_id,
                 publicado_hogar, updated_at, guias ( id, version, descripcion, objetivo, publico, adaptado_a,
                 guia_escenas ( id, orden, carpeta, titulo, ${SECCIONES_GUIA.join(', ')} ) )`)
        .order('slug'),
      supabase.from('paises').select('codigo, nombre, bandera').eq('activo', true).order('codigo'),
      supabase.from('organizaciones').select('id, nombre').order('nombre'),
    ])
    if (storyboards.error) {
      error.value = `No se pudo leer el catálogo de la base: ${mensajeDeLaBase(storyboards.error.message)}`
      return
    }
    error.value = null
    const leidas = ((storyboards.data as unknown) as FilaLeida[] | null) ?? []
    filas.value = Object.fromEntries(leidas.map(({ guias, ...fila }) => {
      const leida = Array.isArray(guias) ? guias[0] : guias
      const { guia_escenas: escenasLeidas = [], ...cabecera } = leida ?? {}
      const escenas = [...escenasLeidas].sort((a, b) => a.orden - b.orden)
      return [fila.clave, { ...fila, guia: leida ? (cabecera as CabeceraGuardada) : null, escenas }]
    }))
    paises.value = ((listaPaises.data ?? []) as { codigo: string, nombre: Record<string, string>, bandera: string | null }[])
      .map(p => ({ codigo: p.codigo, nombre: p.nombre?.es ?? p.codigo, bandera: p.bandera }))
    organizaciones.value = listaOrgs.data ?? []
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
      hogar: fila.publicado_hogar,
      actualizado: fila.updated_at,
      guiaPorIdioma: resumenGuia(fila.escenas, fila.idiomas),
      guiaPorEscena: Object.fromEntries(fila.escenas.map(e => [e.carpeta, idiomasEscritos(e, fila.idiomas)])),
    }
  }

  /** La guía de un storyboard registrado, para escribirla; null si no está en la base. */
  function guiaDe(slug: string): GuiaEditable | null {
    const meta = metadataDe(slug)
    const fila = meta ? filas.value[meta.clave] : undefined
    if (!fila) return null
    return {
      cabecera: fila.guia,
      escenas: fila.escenas.filter((e): e is EscenaGuia & { id: number } => typeof e.id === 'number'),
      idiomas: fila.idiomas.length ? fila.idiomas : ['es'],
      personalizado: fila.organizacion_id !== null,
    }
  }

  /** Los storyboards que están en la base y no tienen JSON en este build. */
  const fueraDelBuild = computed(() => Object.values(filas.value).filter(f => !CLAVES_DEL_BUILD.has(f.clave)))

  const paisDe = (codigo: string): Pais => paises.value.find(p => p.codigo === codigo) ?? { codigo, nombre: codigo, bandera: null }
  const organizacionDe = (id: number | null): Organizacion | null => (id ? organizaciones.value.find(o => o.id === id) ?? null : null)

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
  async function publicar(slug: string, datos: { estado: EstadoPublicacion, paises: string[], organizacionId: number | null, hogar?: boolean }): Promise<string | null> {
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

  /** Guarda la cabecera de la guía. Un campo en null borra lo escrito. Devuelve el error, o null. */
  async function guardarCabecera(guiaId: number, datos: CabeceraGuia): Promise<string | null> {
    const { error: e } = await useSupabaseClient().from('guias').update(datos as never).eq('id', guiaId)
    if (e) return mensajeDeLaBase(e.message)
    await cargar()
    return null
  }

  /** Guarda las secciones de la guía de una escena. Una sección en null borra lo escrito. Devuelve el error, o null. */
  async function guardarEscena(escenaId: number, secciones: Record<SeccionGuia, Localized | null>): Promise<string | null> {
    const { error: e } = await useSupabaseClient().from('guia_escenas').update(secciones as never).eq('id', escenaId)
    if (e) return mensajeDeLaBase(e.message)
    await cargar()
    return null
  }

  /**
   * Elimina un storyboard de la base, con su guía. La base lo frena si ya se usó en un workshop
   * (`workshops.storyboard_id` restringe el borrado): entonces se archiva. Devuelve el error, o null.
   */
  async function eliminar(clave: string): Promise<string | null> {
    const fila = filas.value[clave]
    if (!fila) return 'Ese storyboard no está en la base.'
    const { error: e } = await useSupabaseClient().from('storyboards').delete().eq('id', fila.id)
    if (e) return mensajeDeLaBase(e.message)
    await cargar()
    return null
  }

  // Primero el estado, los países y la organización; después, si se pide, el hogar (la base solo lo deja
  // en un publicado estándar y lo quita sola si deja de serlo).
  async function cambiarPublicacion(clave: string, datos: { estado: EstadoPublicacion, paises: string[], organizacionId: number | null, hogar?: boolean }): Promise<string | null> {
    const supabase = useSupabaseClient()
    const { error: e } = await supabase.rpc('publicar_storyboard', {
      p_clave: clave,
      p_estado: datos.estado,
      p_paises: datos.paises,
      ...(datos.organizacionId ? { p_organizacion: datos.organizacionId } : {}),
    })
    if (e) return mensajeDeLaBase(e.message)
    if (datos.hogar !== undefined) {
      const enHogar = datos.hogar && datos.estado === 'PUBLICADO' && !datos.organizacionId
      const { error: eh } = await supabase.rpc('publicar_storyboard_hogar', { p_clave: clave, p_hogar: enHogar })
      if (eh) {
        await cargar()
        return mensajeDeLaBase(eh.message)
      }
    }
    await cargar()
    return null
  }

  /** Los storyboards de la base que salen en la app del hogar (tarea 022): publicados, estándar y marcados. */
  const delHogar = computed(() => Object.values(filas.value)
    .filter(f => f.publicado_hogar && f.estado_publicacion === 'PUBLICADO' && f.organizacion_id === null)
    .sort((a, b) => a.slug.localeCompare(b.slug)))

  /** Una fila de la base por su id (las unidades guardan ids). */
  function filaPorId(id: number): FilaBase | undefined {
    return Object.values(filas.value).find(f => f.id === id)
  }

  return {
    cargado, cargando, error, paises, organizaciones, fueraDelBuild, delHogar, filaPorId,
    estadoDe, publicacionDe, guiaDe, paisDe, organizacionDe,
    sincronizar, publicar, archivar, eliminar, guardarCabecera, guardarEscena, cargar,
  }
}
