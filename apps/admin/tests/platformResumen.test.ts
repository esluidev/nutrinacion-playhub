// Reglas de negocio del dashboard del operador: vigencia de licencias, desglose del
// parque y la lista de "necesita atención". Funciones puras — sin stubs de Nuxt.

import type { LicenciaLigera, OrgLigera } from '~/utils/platformResumen'
import { describe, expect, it } from 'vitest'
import { construirActividad, construirAtencion, esVigente, resumenLicencias, resumenOrganizaciones } from '~/utils/platformResumen'

const HOY = '2026-07-22'

let seq = 0
function lic(sobre: Partial<LicenciaLigera>): LicenciaLigera {
  seq++
  return {
    id: seq,
    estado: 'ACTIVA',
    fecha_inicio: '2026-01-01',
    fecha_fin: null,
    organizacion_id: 1,
    created_at: `2026-01-01T00:00:0${seq % 10}Z`,
    ...sobre,
  }
}

function org(sobre: Partial<OrgLigera>): OrgLigera {
  seq++
  return {
    id: seq,
    nombre: `Org ${seq}`,
    created_at: '2026-01-01T00:00:00Z',
    administradores: [{ id: 1, created_at: '2026-01-01T00:00:00Z', nombre: 'Ana' }],
    ...sobre,
  }
}

describe('esVigente', () => {
  it('ACTIVA sin fecha_fin (indefinida) es vigente', () => {
    expect(esVigente(lic({}), HOY)).toBe(true)
  })
  it('TRIAL con fin futuro es vigente', () => {
    expect(esVigente(lic({ estado: 'TRIAL', fecha_fin: '2026-08-01' }), HOY)).toBe(true)
  })
  it('estado VENCIDA no es vigente aunque las fechas den', () => {
    expect(esVigente(lic({ estado: 'VENCIDA' }), HOY)).toBe(false)
  })
  it('fecha_fin pasada no es vigente aunque el estado diga ACTIVA', () => {
    expect(esVigente(lic({ fecha_fin: '2026-07-21' }), HOY)).toBe(false)
  })
  it('todavía no iniciada no es vigente', () => {
    expect(esVigente(lic({ fecha_inicio: '2026-08-01' }), HOY)).toBe(false)
  })
})

describe('resumenLicencias', () => {
  it('desglosa vigentes, trials, por vencer y vencidas', () => {
    const licencias = [
      lic({}),                                                       // vigente indefinida
      lic({ estado: 'TRIAL', fecha_fin: '2026-07-30' }),             // vigente, trial, por vencer
      lic({ fecha_fin: '2026-12-31' }),                              // vigente, no por vencer
      lic({ estado: 'ACTIVA', fecha_fin: '2026-07-01' }),            // vencida por fecha
      lic({ estado: 'VENCIDA', fecha_fin: null }),                   // vencida por estado
    ]
    expect(resumenLicencias(licencias, HOY)).toEqual({
      vigentes: 3,
      trials: 1,
      porVencer: 1,
      vencidas: 2,
    })
  })
})

describe('construirAtencion', () => {
  it('licencia vencida por fecha con estado activo va primero y no duplica "sin licencia"', () => {
    const o = org({ id: 1, nombre: 'Rota' })
    const items = construirAtencion([o], [lic({ organizacion_id: 1, fecha_fin: '2026-07-01' })], HOY)
    expect(items.map(x => x.tipo)).toEqual(['lic_vencida_activa'])
  })

  it('org sin ninguna licencia → sin_licencia', () => {
    const items = construirAtencion([org({ id: 1 })], [], HOY)
    expect(items.map(x => x.tipo)).toEqual(['sin_licencia'])
  })

  it('licencia vigente que vence pronto → lic_vence con los días', () => {
    const items = construirAtencion(
      [org({ id: 1 })],
      [lic({ organizacion_id: 1, fecha_fin: '2026-07-30' })],
      HOY,
    )
    expect(items).toEqual([expect.objectContaining({ tipo: 'lic_vence', dias: 8 })])
  })

  it('vigente con fin lejano o sin fin no genera atención', () => {
    const items = construirAtencion(
      [org({ id: 1 })],
      [lic({ organizacion_id: 1, fecha_fin: '2026-12-31' })],
      HOY,
    )
    expect(items).toEqual([])
  })

  it('sin administradores se reporta después de lo de la licencia', () => {
    const o = org({ id: 1, nombre: 'En alta', administradores: [] })
    const items = construirAtencion([o], [lic({ organizacion_id: 1, fecha_fin: '2026-07-30' })], HOY)
    expect(items.map(x => x.tipo)).toEqual(['lic_vence', 'sin_admins'])
  })

  it('ordena entre orgs: roto > sin licencia > vence pronto (asc por días)', () => {
    const orgs = [
      org({ id: 1, nombre: 'VencePronto' }),
      org({ id: 2, nombre: 'SinLic' }),
      org({ id: 3, nombre: 'VenceMuyPronto' }),
    ]
    const licencias = [
      lic({ organizacion_id: 1, fecha_fin: '2026-08-10' }),
      lic({ organizacion_id: 3, fecha_fin: '2026-07-25' }),
    ]
    const items = construirAtencion(orgs, licencias, HOY)
    expect(items.map(x => [x.tipo, x.orgNombre])).toEqual([
      ['sin_licencia', 'SinLic'],
      ['lic_vence', 'VenceMuyPronto'],
      ['lic_vence', 'VencePronto'],
    ])
  })
})

describe('resumenOrganizaciones', () => {
  it('separa operando, en alta y sin licencia, y cuenta las nuevas de 30 días', () => {
    const orgs = [
      org({ id: 1, created_at: '2026-01-01T00:00:00Z' }),                       // operando
      org({ id: 2, created_at: '2026-07-10T00:00:00Z', administradores: [] }),  // en alta, nueva
      org({ id: 3, created_at: '2026-06-01T00:00:00Z' }),                       // sin licencia
    ]
    const licencias = [lic({ organizacion_id: 1 }), lic({ organizacion_id: 2 })]
    expect(resumenOrganizaciones(orgs, licencias, HOY)).toEqual({ total: 3, nuevas: 1, operando: 1, enAlta: 1, sinLicencia: 1 })
  })
})

describe('construirActividad', () => {
  it('altas, licencias (la segunda de una org es renovación) y administradores, por fecha descendente', () => {
    const orgs = [
      org({ id: 1, nombre: 'Vieja', created_at: '2026-01-01T00:00:00Z', administradores: [{ id: 1, created_at: '2026-07-20T00:00:00Z', nombre: 'Ana' }] }),
      org({ id: 2, nombre: 'Reciente', created_at: '2026-07-10T00:00:00Z', administradores: [] }),
    ]
    const licencias = [
      lic({ organizacion_id: 1, created_at: '2026-01-02T00:00:00Z' }),
      lic({ organizacion_id: 1, created_at: '2026-07-15T00:00:00Z' }),
    ]
    const items = construirActividad(orgs, licencias, 3)
    expect(items.map(x => [x.tipo, x.orgNombre])).toEqual([['admin', 'Vieja'], ['renovacion', 'Vieja'], ['org', 'Reciente']])
    expect(items[0]!.persona).toBe('Ana')
  })
})
