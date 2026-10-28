// Lógica nueva de la tarea 029: tipo de contexto derivado de la ruta, aterrizaje
// (rutaInicial), conservación de la comunidad recordada (setOrg) y asegurarComunidad.
//
// useContexto depende de los auto-imports de Nuxt: aquí se stubbean sobre globalThis
// (computed/ref reales de vue, useState en memoria, router y auth controlados por el test).

import type { AuthUser } from '~/utils/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// ── Stubs de auto-imports ────────────────────────────────────────────────────
const estado = new Map<string, ReturnType<typeof ref>>()
const rutaActual = ref({ path: '/dashboard' })
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
function hacerUsuario(opts: {
  superadmin?: boolean
  organizaciones?: { id: number, nombre: string }[]
  comunidades?: { id: number, nombre: string, organizacion_id: number, organizaciones: { id: number, nombre: string } }[]
  colaboraEn?: number[]
  titularDe?: number[]
} = {}): AuthUser {
  return {
    id: 'u1',
    email: 'test@test.com',
    perfil: { id: 1, nombre: 'Test', apellido: null, email: 'test@test.com', avatar: null, idioma: 'es', superadmin: opts.superadmin ?? false, usuario_id: 'u1', created_at: '' },
    organizaciones: (opts.organizaciones ?? []).map(o => ({ ...o, correo: null, telefono: null, website: null, tipo_id: null, created_at: '' })),
    comunidades: (opts.comunidades ?? []).map(c => ({ ...c, descripcion: null, correo: null, telefono: null, logo: null, pais: null, created_at: '' })),
    colaboraEn: opts.colaboraEn ?? [],
    titularDe: opts.titularDe ?? [],
  }
}

const ORG_A = { id: 1, nombre: 'Org A' }
const ORG_B = { id: 2, nombre: 'Org B' }
const comunidad = (id: number, nombre: string, org: { id: number, nombre: string }) =>
  ({ id, nombre, organizacion_id: org.id, organizaciones: org })

beforeEach(() => {
  estado.clear()
  almacen.clear()
  rutaActual.value = { path: '/dashboard' }
  usuario.value = null
})

function guardar(orgId: number | null, comunidadId: number | null, tipo?: 'platform' | 'organizacion' | 'comunidad') {
  almacen.set('nutrinacion.contexto', JSON.stringify({ tipo, orgId, comunidadId }))
}

// ── Tipo derivado de la ruta ─────────────────────────────────────────────────
describe('tipo', () => {
  it('lo dicta el prefijo de la ruta', () => {
    const { tipo } = useContexto()
    rutaActual.value = { path: '/platform/organizaciones' }
    expect(tipo.value).toBe('platform')
    rutaActual.value = { path: '/organizacion/administradores' }
    expect(tipo.value).toBe('organizacion')
    rutaActual.value = { path: '/dashboard/workshops' }
    expect(tipo.value).toBe('comunidad')
    rutaActual.value = { path: '/invitaciones' }
    expect(tipo.value).toBe('comunidad')
  })
})

// ── Destinos ─────────────────────────────────────────────────────────────────
describe('destinos', () => {
  it('la org que administro SIEMPRE es destino, tenga o no comunidades', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A)],
    })
    const { destinos } = useContexto()
    expect(destinos.value).toEqual([
      expect.objectContaining({ tipo: 'comunidad', comunidadId: 10 }),
      expect.objectContaining({ tipo: 'organizacion', orgId: 1 }),
    ])
  })

  it('una org donde solo colaboro NO es destino de nivel organización', () => {
    usuario.value = hacerUsuario({
      comunidades: [comunidad(10, 'Centro', ORG_A)],
      colaboraEn: [10],
    })
    const { destinos } = useContexto()
    expect(destinos.value).toEqual([expect.objectContaining({ tipo: 'comunidad', comunidadId: 10 })])
  })
})

// ── Aterrizaje ───────────────────────────────────────────────────────────────
describe('rutaInicial', () => {
  it('sin destinos → sin acceso', () => {
    usuario.value = hacerUsuario()
    expect(useContexto().rutaInicial()).toBe('/sin-acceso')
  })

  it('el admin sin contexto recordado aterriza en su organización', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A)],
    })
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(1)
  })

  it('admin de varias orgs → aterriza en la org guardada', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A, ORG_B],
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(20, 'Sur', ORG_B)],
    })
    guardar(2, null)
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.orgActiva.value?.id).toBe(2)
  })

  it('admin conserva la comunidad guardada al aterrizar', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(11, 'Norte', ORG_A)],
    })
    guardar(1, 11)
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/organizacion')
    expect(ctx.comunidadActiva.value?.id).toBe(11)
  })

  it('colaborador con una sola comunidad → directo a operar', () => {
    usuario.value = hacerUsuario({
      comunidades: [comunidad(10, 'Centro', ORG_A)],
      colaboraEn: [10],
    })
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/dashboard')
    expect(ctx.comunidadActiva.value?.id).toBe(10)
  })

  it('colaborador con contexto guardado y aún accesible → ahí', () => {
    usuario.value = hacerUsuario({
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(11, 'Norte', ORG_A)],
      colaboraEn: [10, 11],
    })
    guardar(1, 11)
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/dashboard')
    expect(ctx.comunidadActiva.value?.id).toBe(11)
  })

  it('colaborador con guardado ya inaccesible + varias comunidades → su primera comunidad', () => {
    usuario.value = hacerUsuario({
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(11, 'Norte', ORG_A)],
      colaboraEn: [10, 11],
    })
    guardar(2, 99, 'comunidad')
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/dashboard')
    expect(ctx.comunidadActiva.value?.id).toBe(10)
  })

  it('manda el selector: el admin que quedó en una comunidad vuelve a ella', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(11, 'Norte', ORG_A)],
    })
    guardar(1, 11, 'comunidad')
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/dashboard')
    expect(ctx.comunidadActiva.value?.id).toBe(11)
  })

  it('superadmin sin contexto recordado → platform, aunque vea comunidades', () => {
    usuario.value = hacerUsuario({
      superadmin: true,
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(20, 'Sur', ORG_B)],
    })
    expect(useContexto().rutaInicial()).toBe('/platform')
  })

  it('superadmin que quedó en una comunidad vuelve a ella', () => {
    usuario.value = hacerUsuario({
      superadmin: true,
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(20, 'Sur', ORG_B)],
    })
    guardar(2, 20, 'comunidad')
    const ctx = useContexto()
    expect(ctx.rutaInicial()).toBe('/dashboard')
    expect(ctx.comunidadActiva.value?.id).toBe(20)
  })

  it('admin que quedó en Platform sin ser superadmin → su organización', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    guardar(1, null, 'platform')
    expect(useContexto().rutaInicial()).toBe('/organizacion')
  })

  it('recordarRuta guarda el tipo de la ruta y la elección actual', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A)],
    })
    const ctx = useContexto()
    ctx.setContexto(1, 10)
    ctx.recordarRuta('/organizacion/jornadas')
    expect(JSON.parse(almacen.get('nutrinacion.contexto')!)).toEqual({ tipo: 'organizacion', orgId: 1, comunidadId: 10 })
    ctx.recordarRuta('/dashboard/perfil')
    expect(JSON.parse(almacen.get('nutrinacion.contexto')!).tipo).toBe('organizacion')
    ctx.recordarRuta('/dashboard/workshops')
    expect(JSON.parse(almacen.get('nutrinacion.contexto')!).tipo).toBe('comunidad')
  })

  it('superadmin sin org ni comunidades → platform', () => {
    usuario.value = hacerUsuario({ superadmin: true })
    expect(useContexto().rutaInicial()).toBe('/platform')
  })

  it('admin sin comunidades → nivel organización', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    expect(useContexto().rutaInicial()).toBe('/organizacion')
  })

  it('guardado a nivel organización (sin comunidad) → nivel organización', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(11, 'Norte', ORG_A)],
    })
    guardar(1, null)
    expect(useContexto().rutaInicial()).toBe('/organizacion')
  })
})

// ── Cambiar de contexto no destruye estado ───────────────────────────────────
describe('setOrg', () => {
  it('conserva la comunidad recordada si es de esa org', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A)],
    })
    const ctx = useContexto()
    ctx.setContexto(1, 10)
    ctx.setOrg(1)
    expect(ctx.comunidadActiva.value?.id).toBe(10)
  })

  it('al cambiar de org no arrastra la comunidad de la anterior', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A, ORG_B],
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(20, 'Sur', ORG_B)],
    })
    const ctx = useContexto()
    ctx.setContexto(1, 10)
    ctx.setOrg(2)
    expect(ctx.orgActiva.value?.id).toBe(2)
    expect(ctx.comunidadActiva.value).toBeNull()
  })
})

describe('asegurarComunidad', () => {
  it('sin comunidad activa cae a la primera de la org activa', () => {
    usuario.value = hacerUsuario({
      organizaciones: [ORG_A],
      comunidades: [comunidad(10, 'Centro', ORG_A), comunidad(11, 'Norte', ORG_A)],
    })
    const ctx = useContexto()
    ctx.setContexto(1, null)
    expect(ctx.asegurarComunidad()).toBe(true)
    // orden alfabético del árbol: Centro antes que Norte
    expect(ctx.comunidadActiva.value?.id).toBe(10)
  })

  it('org sin comunidades → false (el middleware decide a dónde ir)', () => {
    usuario.value = hacerUsuario({ organizaciones: [ORG_A] })
    const ctx = useContexto()
    ctx.setContexto(1, null)
    expect(ctx.asegurarComunidad()).toBe(false)
  })
})
