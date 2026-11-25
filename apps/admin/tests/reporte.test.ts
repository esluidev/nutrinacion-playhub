import { describe, expect, it } from 'vitest'
import type { CambioReporte, FilaReporte } from '../app/utils/reporte'
import { calificacionMedia, claridad, dificultades, estadoCelda, incidencias, lunesDe, materialAgrupado, matriz, participacion, porSemana, porTema } from '../app/utils/reporte'

function fila(p: Partial<FilaReporte> & { id: number }): FilaReporte {
  return {
    fecha: '2026-09-07', estado: 'FINALIZADO', storyboard_id: 1, lugar_id: 1, comunidad_id: null, grupo_audiencia_id: 1,
    abierto: false, programa_id: 1, jornada_id: null, asistentes_estimados: null, realizado: true, asistentes: 20, ninas: 10,
    ninos: 10, calificacion: 4, participacion: 'ALTA', claridad: 'CLARA', minutos: 30, dispositivos: null, segundos_dispositivos: 0, dificultades: [],
    material: [], motivo_cancelacion: null, ...p,
  }
}

const REPROGRAMADO: CambioReporte = { workshop_id: 3, tipo: 'REPROGRAMADO', fecha_anterior: '2026-09-14', fecha_nueva: '2026-09-15', motivo: null, cuando: '' }

describe('estadoCelda', () => {
  it('realizado, realizado en otra fecha, sin realizar o por venir', () => {
    const repro = new Set([3])
    expect(estadoCelda(fila({ id: 1 }), repro)).toBe('hecho')
    expect(estadoCelda(fila({ id: 3 }), repro)).toBe('otra')
    expect(estadoCelda(fila({ id: 4, realizado: false, estado: 'CANCELADO' }), repro)).toBe('no')
    expect(estadoCelda(fila({ id: 5, realizado: false, estado: 'FINALIZADO' }), repro)).toBe('no')
    expect(estadoCelda(fila({ id: 6, realizado: false, estado: 'PUBLICADO' }), repro)).toBe('pendiente')
  })
})

describe('matriz', () => {
  it('una fila por audiencia en cada lugar, con sus talleres por fecha y los recibidos', () => {
    const m = matriz([
      fila({ id: 2, fecha: '2026-09-14', grupo_audiencia_id: 2 }),
      fila({ id: 1, fecha: '2026-09-07' }),
      fila({ id: 3, fecha: '2026-09-15' }),
      fila({ id: 4, fecha: '2026-09-21', realizado: false, estado: 'CANCELADO' }),
      fila({ id: 5, fecha: '2026-09-08', lugar_id: 2 }),
      fila({ id: 6, fecha: '2026-09-09', grupo_audiencia_id: null }),
    ], [REPROGRAMADO])
    expect(m.map(f => `${f.grupoAudienciaId}@${f.lugarId}:${f.celdas.map(c => c.celda).join(',')}·${f.recibidas}`)).toEqual([
      '1@1:hecho,otra,no·2',
      '1@2:hecho·1',
      '2@1:hecho·1',
    ])
  })
})

describe('porSemana', () => {
  it('el lunes de cada semana', () => {
    expect(lunesDe('2026-09-10')).toBe('2026-09-07')
    expect(lunesDe('2026-09-13')).toBe('2026-09-07')
    expect(lunesDe('2026-09-07')).toBe('2026-09-07')
  })
  it('suma las asistencias de lo realizado por semana, con las semanas vacías en medio', () => {
    expect(porSemana([
      fila({ id: 1, fecha: '2026-09-07', asistentes: 20 }),
      fila({ id: 2, fecha: '2026-09-09', asistentes: 25 }),
      fila({ id: 3, fecha: '2026-09-23', asistentes: 18 }),
      fila({ id: 4, fecha: '2026-09-15', realizado: false }),
    ])).toEqual([
      { lunes: '2026-09-07', asistencias: 45, realizados: 2 },
      { lunes: '2026-09-14', asistencias: 0, realizados: 0 },
      { lunes: '2026-09-21', asistencias: 18, realizados: 1 },
    ])
  })
  it('sin nada realizado, ninguna semana', () => {
    expect(porSemana([fila({ id: 1, realizado: false })])).toEqual([])
  })
})

describe('cómo salieron', () => {
  const t = [
    fila({ id: 1, participacion: 'ALTA', claridad: 'MUY_CLARA', calificacion: 5 }),
    fila({ id: 2, participacion: 'MEDIA', claridad: 'POCO_CLARA', calificacion: 3 }),
    fila({ id: 3, participacion: 'ALTA', claridad: 'CLARA', calificacion: 4 }),
    fila({ id: 4, realizado: false, participacion: null, claridad: null, calificacion: null }),
  ]
  it('cuenta participación y claridad de lo realizado', () => {
    expect(participacion(t)).toEqual({ ALTA: 2, MEDIA: 1, BAJA: 0 })
    expect(claridad(t)).toEqual({ MUY_CLARA: 1, CLARA: 1, POCO_CLARA: 1 })
  })
  it('la calificación media, con un decimal', () => {
    expect(calificacionMedia(t)).toBe(4)
    expect(calificacionMedia([fila({ id: 1, calificacion: 4 }), fila({ id: 2, calificacion: 5 }), fila({ id: 3, calificacion: 5 })])).toBe(4.7)
    expect(calificacionMedia([])).toBeNull()
  })
})

describe('porTema', () => {
  it('por storyboard: previstos, realizados, participación alta y claridad', () => {
    expect(porTema([
      fila({ id: 1, storyboard_id: 7, fecha: '2026-09-08', participacion: 'ALTA', claridad: 'POCO_CLARA' }),
      fila({ id: 2, storyboard_id: 5, fecha: '2026-09-07' }),
      fila({ id: 3, storyboard_id: 7, fecha: '2026-09-09', realizado: false }),
    ])).toEqual([
      { storyboardId: 5, previstos: 1, realizados: 1, alta: 1, pocoClara: 0, muyClara: 0 },
      { storyboardId: 7, previstos: 2, realizados: 1, alta: 1, pocoClara: 1, muyClara: 0 },
    ])
  })
})

describe('lo que contaron', () => {
  it('junta el material escrito igual y lo ordena de más a menos', () => {
    expect(materialAgrupado([
      fila({ id: 1, material: ['Parlante.'] }),
      fila({ id: 2, material: ['parlante', 'Frutas reales'] }),
      fila({ id: 3, material: ['  '] }),
    ])).toEqual([
      { texto: 'Parlante.', veces: 2, talleres: [1, 2] },
      { texto: 'Frutas reales', veces: 1, talleres: [2] },
    ])
  })
  it('lo que costó, por fecha y con su taller', () => {
    const d = dificultades([fila({ id: 2, fecha: '2026-09-14', dificultades: ['El hierro'] }), fila({ id: 1, fecha: '2026-09-07', dificultades: ['Ruido', ' '] })])
    expect(d.map(x => `${x.taller.id}:${x.texto}`)).toEqual(['1:Ruido', '2:El hierro'])
  })
})

describe('incidencias', () => {
  it('el historial y los finalizados sin cierre, por fecha', () => {
    const r = incidencias(
      [fila({ id: 5, fecha: '2026-09-10', realizado: false }), fila({ id: 6, fecha: '2026-09-01' }), fila({ id: 7, fecha: '2026-09-03', realizado: false, estado: 'PUBLICADO' })],
      [
        { workshop_id: 3, tipo: 'CANCELADO', fecha_anterior: '2026-09-14', fecha_nueva: null, motivo: 'Lluvia', cuando: '1' },
        { workshop_id: 3, tipo: 'REPROGRAMADO', fecha_anterior: '2026-09-14', fecha_nueva: '2026-09-16', motivo: null, cuando: '2' },
        { workshop_id: 4, tipo: 'FECHA_CAMBIADA', fecha_anterior: '2026-09-02', fecha_nueva: '2026-09-04', motivo: null, cuando: '3' },
      ],
    )
    expect(r.map(i => `${i.tipo}:${i.workshopId}`)).toEqual(['FECHA_CAMBIADA:4', 'SIN_CIERRE:5', 'CANCELADO:3', 'REPROGRAMADO:3'])
  })
})
