// Cómo se lee el estado del correo de una invitación (decisión 012, 0011).
import { describe, expect, it } from 'vitest'
import { estadoCorreo, sinPuntoFinal } from '~/utils/invitaciones'

describe('estadoCorreo', () => {
  it('sin intentos, sin enviar', () => {
    expect(estadoCorreo({ correo_enviado_en: null, correo_error: null })).toEqual({ tipo: 'sin_enviar' })
    expect(estadoCorreo({})).toEqual({ tipo: 'sin_enviar' })
  })

  it('enviado cuando Resend lo aceptó y no hubo error después', () => {
    expect(estadoCorreo({ correo_enviado_en: '2026-11-01T16:32:00Z', correo_error: null }))
      .toEqual({ tipo: 'enviado', enviadoEn: '2026-11-01T16:32:00Z' })
  })

  it('el error del último intento manda, con su motivo sin el punto final', () => {
    expect(estadoCorreo({ correo_enviado_en: null, correo_error: 'Resend no envió el correo (401): API key is invalid.' }))
      .toEqual({ tipo: 'fallido', motivo: 'Resend no envió el correo (401): API key is invalid', enviadoEn: null })
  })

  it('un reenvío fallido conserva cuándo salió el anterior', () => {
    expect(estadoCorreo({ correo_enviado_en: '2026-11-01T16:32:00Z', correo_error: 'Falta la plantilla.' }))
      .toEqual({ tipo: 'fallido', motivo: 'Falta la plantilla', enviadoEn: '2026-11-01T16:32:00Z' })
  })

  it('un error en blanco no cuenta', () => {
    expect(estadoCorreo({ correo_enviado_en: null, correo_error: '  ' })).toEqual({ tipo: 'sin_enviar' })
  })
})

describe('sinPuntoFinal', () => {
  it('quita los puntos del final y nada más', () => {
    expect(sinPuntoFinal('falta RESEND_API_KEY.')).toBe('falta RESEND_API_KEY')
    expect(sinPuntoFinal('v1.2 listo')).toBe('v1.2 listo')
  })
})
