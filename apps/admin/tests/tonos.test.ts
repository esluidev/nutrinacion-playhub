// El mismo estado, el mismo tono en todo Admin.
import { describe, expect, it } from 'vitest'
import { finLicenciaTone, invitacionTone, licenciaTone } from '~/utils/tonos'

describe('licenciaTone', () => {
  it('vigente en lima, prueba en cielo, vencida en coral y el resto neutro', () => {
    expect(licenciaTone('ACTIVA')).toBe('lime')
    expect(licenciaTone('TRIAL')).toBe('sky')
    expect(licenciaTone('VENCIDA')).toBe('coral')
    expect(licenciaTone('SUSPENDIDA')).toBe('neutral')
    expect(licenciaTone(undefined)).toBe('neutral')
  })
})

describe('invitacionTone', () => {
  it('pendiente en uva, aceptada en lima y cerrada sin aceptar en coral', () => {
    expect(invitacionTone('PENDIENTE')).toBe('grape')
    expect(invitacionTone('USADA')).toBe('lime')
    for (const e of ['EXPIRADA', 'REVOCADA', 'RECHAZADA']) expect(invitacionTone(e)).toBe('coral')
    expect(invitacionTone('OTRA')).toBe('neutral')
  })
})

describe('finLicenciaTone', () => {
  const HOY = '2026-07-22'
  it('vencida en coral', () => {
    expect(finLicenciaTone({ estado: 'ACTIVA', fecha_fin: '2026-07-21' }, HOY)).toBe('coral')
  })
  it('vigente que vence en 30 días o menos en sol', () => {
    expect(finLicenciaTone({ estado: 'ACTIVA', fecha_fin: '2026-08-21' }, HOY)).toBe('sun')
    expect(finLicenciaTone({ estado: 'TRIAL', fecha_fin: '2026-07-22' }, HOY)).toBe('sun')
  })
  it('lejana, suspendida o sin fecha, sin tono', () => {
    expect(finLicenciaTone({ estado: 'ACTIVA', fecha_fin: '2026-08-22' }, HOY)).toBeUndefined()
    expect(finLicenciaTone({ estado: 'SUSPENDIDA', fecha_fin: '2026-07-30' }, HOY)).toBeUndefined()
    expect(finLicenciaTone({ estado: 'ACTIVA', fecha_fin: null }, HOY)).toBeUndefined()
  })
})
