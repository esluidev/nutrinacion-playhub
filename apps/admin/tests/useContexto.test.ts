// El contexto a dos niveles (decisión 011): tipo derivado de la ruta, el árbol de organizaciones
// (administradas y donde colaboro), el aterrizaje (rutaInicial) y asegurarContexto.
//
// useContexto depende de los auto-imports de Nuxt: aquí se stubbean sobre globalThis
// (computed/ref reales de vue, useState en memoria, router y auth controlados por el test).

import type { AuthUser, Organizacion } from '~/utils/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// ── Stubs de auto-imports ────────────────────────────────────────────────────
const estado = new Map<string, ReturnType<typeof ref>>()
const rutaActual = ref({ path: '/organizacion' })
const usuario = ref<AuthUser | null>(null)
const almacen = new Map<string, string>()

Object.assign(globalThis, {
  computed,
  ref,
  useState: (key: string, init?: () => unknown) => {
    if (!estado.has(key)) estado.set(key, ref(init ? init() : null))
    return estado.get(key)
  },
  useRouter: () => ({ currentRoute: rutaActual }),
  useAuth: () => ({ user: usuario }),
  isSupabaseConfigured: () => true,
  navigateTo: vi.fn(),
  localStorage: {
    getItem: (k: string) => almacen.get(k) ?? null,
    setItem: (k: string, v: string) => almacen.set(k, v),
    removeItem: (k: string) => almacen.delete(k),
  },
})

const { useContexto } = await import('~/composables/useContexto')

// ── Fixtures ─────────────────────────────────────────────────────────────────
const org = (id: number, nombre: string): Organizacion =>
  ({ id, nombre, correo: null, telefono: null, website: null, logo: null, paises: ['GT'], tipo_id: null, created_at: '' })

function hacerUsuario(opts: {
  superadmin?: boolean
  organizaciones?: Organizacion[]
  colaboraEn?: Organizacion[]
  titularDe?: number[]
} = {}): AuthUser {
  return {
    id: 'u1',
    email: 'test@test.com',
    perfil: { id: 1, nombre: 'Test', apellido: null, email: 'test@test.com', avatar: null, idioma: 'es', superadmin: opts.superadmin ?? false, usuario_id: 'u1', created_at: '' },
    organizaciones: opts.organizaciones ?? [],
    colaboraEn: opts.colaboraEn ?? [],
    titularDe: opts.titularDe ?? [],
  }
}

const ORG_A = org(1, 'Org A')
const ORG_B = org(2, 'Org B')

beforeEach(() => {
  estado.clear()
  almacen.clear()
  rutaActual.value = { path: '/organizacion' }
  usuario.value = null
})

function guardar(orgId: number | null, tipo?: 'platform' | 'organizacion') {
  almacen.set('nutrinacion.contexto', JSON.stringify({ tipo, orgId }))
}

// ── Tipo derivado de la ruta ─────────────────────────────────────────────────
describe('tipo', () => {
  it('lo dicta el prefijo de la ruta: Platform o, para todo lo demás, organización', () => {
    const { tipo } = useContexto()
    rutaActual.value = { path: '/platform/organizaciones' }
    expect(tipo.value).toBe('platform')
    rutaActual.value = { path: '/organizacion/workshops' }
    expect(tipo.value).toBe('organizacion')
    rutaActual.value = { path: '/invitaciones' }
    expect(tipo.value).toBe('organizacion')
  })
})

// ── Árbol y destinos ─────────────────────────────────────────────────────────
describe('orgs y destinos', () => {
  it('las que administro y donde colaboro, con su rol, ordenadas por nombre', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_B], colaboraEn: [ORG_A] })
    const { orgs, destinos } = useContexto()
    expect(orgs.value).toEqual([
      { id: 1, nombre: 'Org A', esAdmin: false, esColaborador: true },
      { id: 2, nombre: 'Org B', esAdmin: true, esColaborador: false },
    ])
    expect(destinos.value.map(d => d.orgId)).toEqual([1, 2])
  })

  it('administrar y colaborar en la misma organización es una sola fila, administrada', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A], colaboraEn: [ORG_A] })
    const { orgs, administraOrgActiva, setOrg } = useContexto()
    expect(orgs.value).toHaveLength(1)
    setOrg(1)
    expect(administraOrgActiva.value).toBe(true)
  })

  it('Platform solo es destino del superadmin', () => {
    usuario.value = hacerUsuario({ superadmin: true, organizaciones: [ORG_A] })
    expect(useContexto().destinos.value.map(d => d.tipo)).toEqual(['platform', 'organizacion'])
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    expect(useContexto().destinos.value.map(d => d.tipo)).toEqual(['organizacion'])
  })
})

// ── Aterrizaje ───────────────────────────────────────────────────────────────
describe('rutaInicial', () => {
  it('sin destinos → sin acceso', () => {
    usuario.value = hacerUsuario()
    expect(useContexto().rutaInicial()).toBe('/sin-acceso')
  })

  it('el admin sin contexto recordado aterriza en su organización', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(1)
  })

  it('el colaborador aterriza en la suya, con la navegación recortada', () => {
    usuario.value = hacerUsuario({ colaboraEn: [ORG_A] })
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(1)
    expect(ctx.administraOrgActiva.value).toBe(false)
  })

  it('con varias → la organización guardada', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A, ORG_B] })
    guardar(2)
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(2)
  })

  it('la guardada ya inaccesible → la primera', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A, ORG_B] })
    guardar(99, 'organizacion')
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(1)
  })

  it('superadmin sin contexto recordado → Platform, aunque opere organizaciones', () => {
    usuario.value = hacerUsuario({ superadmin: true, organizaciones: [ORG_A], colaboraEn: [ORG_B] })
    expect(useContexto().rutaInicial()).toBe('/platform')
  })

  it('manda el selector: el superadmin que quedó en una organización vuelve a ella', () => {
    usuario.value = hacerUsuario({ superadmin: true, organizaciones: [ORG_A], colaboraEn: [ORG_B] })
    guardar(2, 'organizacion')
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(2)
  })

  it('admin que quedó en Platform sin ser superadmin → su organización', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    guardar(1, 'platform')
    expect(useContexto().rutaInicial()).toBe('/organizacion')
  })

  it('recordarRuta guarda el tipo de la ruta y la organización; lo global no cuenta', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    const ctx = useContexto()
    ctx.setOrg(1)
    ctx.recordarRuta('/organizacion/planner')
    expect(JSON.parse(almacen.get('nutrinacion.contexto')!)).toEqual({ tipo: 'organizacion', orgId: 1 })
    ctx.recordarRuta('/perfil')
    expect(JSON.parse(almacen.get('nutrinacion.contexto')!).tipo).toBe('organizacion')
    ctx.recordarRuta('/platform/licencias')
    expect(JSON.parse(almacen.get('nutrinacion.contexto')!).tipo).toBe('platform')
  })

  it('superadmin sin organizaciones → Platform', () => {
    usuario.value = hacerUsuario({ superadmin: true })
    expect(useContexto().rutaInicial()).toBe('/platform')
  })
})

describe('asegurarContexto', () => {
  it('sin organización activa cae a la guardada o a la primera', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A, ORG_B] })
    guardar(2)
    const ctx = useContexto()
    expect(ctx.asegurarContexto()).toBe(true)
    expect(ctx.orgActiva.value?.id).toBe(2)
  })

  it('sin ninguna organización → false (el middleware decide a dónde ir)', () => {
    usuario.value = hacerUsuario({ superadmin: true })
    expect(useContexto().asegurarContexto()).toBe(false)
  })

  it('el titular se reconoce sobre la organización activa', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A, ORG_B], titularDe: [2] })
    const ctx = useContexto()
    ctx.setOrg(1)
    expect(ctx.esTitularOrgActiva.value).toBe(false)
    ctx.setOrg(2)
    expect(ctx.esTitularOrgActiva.value).toBe(true)
  })
})
