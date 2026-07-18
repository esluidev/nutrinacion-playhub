// Contexto = dónde estás parado dentro de la app (como la carpeta abierta en un explorador).
//
// Hace falta porque casi todo cuelga de una comunidad: al pedir "Talleres", la app tiene que
// saber de CUÁL. Con una sola comunidad el contexto es invisible; con varias (posiblemente de
// organizaciones distintas) hay que elegir, y esa elección se recuerda.
//
//   contexto = { orgId, comunidadId | null }
//
// La comunidad es OPCIONAL: sin ella estás a nivel organización (solo válido si la administras),
// que es donde un admin recién llegado crea su primera comunidad.
//
// /platform NO es un contexto: es otro módulo (la consola del operador), gateado por
// `perfiles.superadmin`. Aparece como destino en el hub, pero no vive aquí.

import type { ComunidadConOrg } from '~/utils/types'

const CLAVE = 'nutrinacion.contexto'

export interface ComunidadCtx {
  id: number
  nombre: string
  organizacionId: number
  esColaborador: boolean   // llego por `colaboradores`; si no, llego por administrar su org
}

export interface OrgCtx {
  id: number
  nombre: string
  esAdmin: boolean         // tengo fila en organizacion_administradores
  comunidades: ComunidadCtx[]
}

// Un destino = un lugar al que puedo aterrizar. Alimenta el hub y el conteo de ambigüedad.
export interface Destino {
  tipo: 'platform' | 'comunidad' | 'organizacion'
  ruta: string
  etiqueta: string
  contexto?: string        // "Nutrinación" para una comunidad
  orgId?: number
  comunidadId?: number
}

export function useContexto() {
  const { user } = useAuth()

  const orgId = useState<number | null>('ctx-org', () => null)
  const comunidadId = useState<number | null>('ctx-comunidad', () => null)

  const esSuperadmin = computed(() => user.value?.perfil.superadmin === true)

  // ── Árbol de acceso: organizaciones → sus comunidades ──────────────────────
  // Dos fuentes: las orgs que administro (aunque NO tengan comunidades todavía — ahí se crea la
  // primera) y las orgs de mis comunidades (que pueden ser orgs que no administro: solo colaboro).
  const orgs = computed<OrgCtx[]>(() => {
    const u = user.value
    if (!u) return []

    const mapa = new Map<number, OrgCtx>()

    for (const o of u.organizaciones) {
      mapa.set(o.id, { id: o.id, nombre: o.nombre, esAdmin: true, comunidades: [] })
    }

    for (const c of u.comunidades as ComunidadConOrg[]) {
      if (!mapa.has(c.organizacion_id)) {
        mapa.set(c.organizacion_id, {
          id: c.organizacion_id,
          nombre: c.organizaciones?.nombre ?? '—',
          esAdmin: false,
          comunidades: [],
        })
      }
      mapa.get(c.organizacion_id)!.comunidades.push({
        id: c.id,
        nombre: c.nombre,
        organizacionId: c.organizacion_id,
        esColaborador: u.colaboraEn.includes(c.id),
      })
    }

    const lista = [...mapa.values()]
    for (const o of lista) o.comunidades.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  const orgActiva = computed(() => orgs.value.find(o => o.id === orgId.value) ?? null)
  const comunidadActiva = computed(() =>
    orgActiva.value?.comunidades.find(c => c.id === comunidadId.value) ?? null)
  // Solo el admin de la org activa ve el bloque "Organización" del sidebar.
  const administraOrgActiva = computed(() => orgActiva.value?.esAdmin === true)

  // ── Destinos ───────────────────────────────────────────────────────────────
  const destinos = computed<Destino[]>(() => {
    const lista: Destino[] = []

    if (esSuperadmin.value) {
      lista.push({ tipo: 'platform', ruta: '/platform', etiqueta: 'Platform' })
    }

    for (const o of orgs.value) {
      for (const c of o.comunidades) {
        lista.push({
          tipo: 'comunidad',
          ruta: '/dashboard',
          etiqueta: c.nombre,
          contexto: o.nombre,
          orgId: o.id,
          comunidadId: c.id,
        })
      }
      // Org que administro y aún no tiene comunidades: el destino es crear la primera.
      if (o.esAdmin && !o.comunidades.length) {
        lista.push({
          tipo: 'organizacion',
          ruta: '/organizacion/comunidades',
          etiqueta: o.nombre,
          orgId: o.id,
        })
      }
    }

    return lista
  })

  // ── Persistencia ───────────────────────────────────────────────────────────
  function guardar() {
    if (import.meta.client) {
      localStorage.setItem(CLAVE, JSON.stringify({ orgId: orgId.value, comunidadId: comunidadId.value }))
    }
  }

  function leer(): { orgId: number | null, comunidadId: number | null } | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(CLAVE)
      return raw ? JSON.parse(raw) : null
    }
    catch { return null }
  }

  function setContexto(nuevaOrg: number | null, nuevaComunidad: number | null = null) {
    orgId.value = nuevaOrg
    comunidadId.value = nuevaComunidad
    guardar()
  }

  function irA(d: Destino) {
    if (d.tipo === 'platform') return navigateTo(d.ruta)
    setContexto(d.orgId ?? null, d.comunidadId ?? null)
    return navigateTo(d.ruta)
  }

  // ── Aterrizaje ─────────────────────────────────────────────────────────────
  // Regla única, sin casos especiales por tipo de usuario:
  //   contexto guardado y todavía accesible → ahí
  //   un solo destino                        → ahí
  //   varios y ninguno guardado              → hub (que elija)
  //   ninguno                                → sin acceso
  function rutaInicial(): string {
    if (!user.value) return '/login'
    if (!destinos.value.length) return '/sin-acceso'

    // Validar lo guardado contra la superficie real: te pueden haber sacado de esa comunidad.
    const g = leer()
    if (g?.orgId) {
      const d = destinos.value.find(x =>
        x.tipo !== 'platform' && x.orgId === g.orgId && (x.comunidadId ?? null) === (g.comunidadId ?? null))
      if (d) {
        setContexto(d.orgId ?? null, d.comunidadId ?? null)
        return d.ruta
      }
    }

    if (destinos.value.length === 1) {
      const d = destinos.value[0]!
      if (d.tipo !== 'platform') setContexto(d.orgId ?? null, d.comunidadId ?? null)
      return d.ruta
    }

    return '/inicio'
  }

  // Asegura que SIEMPRE haya un contexto si la persona tiene alguno. Corre en cada navegación
  // autenticada: sin esto, quedarse sin contexto (p. ej. justo después de aceptar una invitación)
  // dejaba el switcher diciendo "Elegir contexto", que no le dice nada a nadie.
  // Prefiere lo guardado; si ya no existe, cae al primer destino real en vez de no hacer nada.
  function asegurarContexto(): boolean {
    if (orgActiva.value) return true
    const g = leer()
    const reales = destinos.value.filter(x => x.tipo !== 'platform')
    const d = reales.find(x => x.orgId === g?.orgId && (x.comunidadId ?? null) === (g?.comunidadId ?? null))
      ?? reales.find(x => x.orgId === g?.orgId)
      ?? reales[0]
    if (!d) return false
    setContexto(d.orgId ?? null, d.comunidadId ?? null)
    return true
  }

  return {
    orgs,
    destinos,
    esSuperadmin,
    orgActiva,
    comunidadActiva,
    administraOrgActiva,
    setContexto,
    irA,
    rutaInicial,
    asegurarContexto,
  }
}
