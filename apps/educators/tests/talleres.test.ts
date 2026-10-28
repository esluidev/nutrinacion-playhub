import { describe, expect, it } from 'vitest'
import { agruparTalleres, cierreCompleto, codigoValido, correoValido, diaRelativo, estadoDe, grupoYAsistentes, horario, puedeIniciarse, tallerDesdeBase, talleresPorDia, urlDelTaller } from '~/utils/talleres'
import type { Cierre, Taller, WorkshopBase } from '~/utils/talleres'

const HOY = new Date(2026, 9, 14, 9, 30) // 14 de octubre de 2026

const CIERRE: Cierre = { calificacion: 4, asistentes: 3, participacion: 'media', claridad: 'clara', costo: '', faltoMaterial: '' }

function taller(parcial: Partial<Taller>): Taller {
  return {
    id: 't',
    storyboard: { titulo: 'El huevo', eje: 'alimentacion', slug: 'el-huevo', edicion: 'KIDS', escenas: 4, duracion: 30 },
    comunidad: { id: 1, nombre: 'Comunidad Centro' },
    fecha: '2026-10-14',
    horaInicio: '10:00',
    horaFin: '10:30',
    lugar: 'Aula',
    grupo: 'A',
    asistentesEstimados: 20,
    idioma: 'es',
    modalidad: 'presencial',
    estadoWorkshop: 'publicado',
    motivoCancelacion: null,
    ...parcial,
  }
}

// Filas con la forma exacta de educador_workshops (supabase/migrations/0006), copiadas del seed local.
const FINALIZADO: WorkshopBase = {
  id: '9',
  fecha: '2026-10-13',
  grupo: '3.º A',
  lugar: 'Aula 2B',
  cierre: { costo: 'Ordenar el recorrido en el primer intento.', claridad: 'clara', asistentes: 23, calificacion: 4, faltoMaterial: '', participacion: 'alta' },
  estado: 'completado',
  idioma: 'es',
  horaFin: '10:30',
  comunidad: { id: 1, nombre: 'Comunidad Centro' },
  modalidad: 'presencial',
  horaInicio: '10:00',
  iniciadoEn: '2026-10-13T16:00:00+00:00',
  storyboard: { eje: 'alimentacion', slug: 'el-huevo', titulo: 'El huevo', edicion: 'KIDS', escenas: 4, duracion: 30, categoria: 'ALIMENTACION' },
  terminadoEn: '2026-10-13T16:30:00+00:00',
  estadoWorkshop: 'finalizado',
  motivoCancelacion: null,
  asistentesEstimados: 26,
}

const CANCELADO: WorkshopBase = {
  ...FINALIZADO,
  id: '12',
  fecha: '2026-10-21',
  cierre: null,
  estado: 'pendiente',
  iniciadoEn: null,
  terminadoEn: null,
  estadoWorkshop: 'cancelado',
  motivoCancelacion: 'Feriado escolar',
}

describe('workshops de la base', () => {
  it('pasa una fila de educador_workshops a Taller', () => {
    expect(tallerDesdeBase(FINALIZADO)).toEqual({
      id: '9',
      storyboard: { titulo: 'El huevo', eje: 'alimentacion', slug: 'el-huevo', edicion: 'KIDS', escenas: 4, duracion: 30 },
      comunidad: { id: 1, nombre: 'Comunidad Centro' },
      fecha: '2026-10-13',
      horaInicio: '10:00',
      horaFin: '10:30',
      lugar: 'Aula 2B',
      grupo: '3.º A',
      asistentesEstimados: 26,
      idioma: 'es',
      modalidad: 'presencial',
      estadoWorkshop: 'finalizado',
      motivoCancelacion: null,
      cierre: { calificacion: 4, asistentes: 23, participacion: 'alta', claridad: 'clara', costo: 'Ordenar el recorrido en el primer intento.', faltoMaterial: '' },
    })
  })

  it('conserva el estado del workshop, el motivo, el idioma y la modalidad', () => {
    const t = tallerDesdeBase({ ...CANCELADO, idioma: 'en', modalidad: 'hibrido' })
    expect(t.estadoWorkshop).toBe('cancelado')
    expect(t.motivoCancelacion).toBe('Feriado escolar')
    expect(t.idioma).toBe('en')
    expect(t.modalidad).toBe('hibrido')
    expect(t.cierre).toBeUndefined()
  })

  it('acepta los datos opcionales vacíos y el id numérico', () => {
    const t = tallerDesdeBase({
      ...CANCELADO,
      id: 7,
      horaFin: null,
      lugar: null,
      grupo: null,
      asistentesEstimados: null,
      motivoCancelacion: '  ',
      storyboard: { ...CANCELADO.storyboard, titulo: null, duracion: null },
    })
    expect(t).toMatchObject({ id: '7', horaFin: '', lugar: '', grupo: '', asistentesEstimados: null, motivoCancelacion: null })
    expect(t.storyboard).toMatchObject({ titulo: 'el-huevo', duracion: null })
  })

  it('no inventa valores: lo desconocido cae en su respaldo', () => {
    const t = tallerDesdeBase({ ...CANCELADO, idioma: 'fr', modalidad: 'otra', estadoWorkshop: 'raro' })
    expect(t).toMatchObject({ idioma: 'es', modalidad: 'presencial', estadoWorkshop: 'publicado' })
  })
})

describe('fechas y estados', () => {
  it('calcula días relativos sin desfases de zona horaria', () => {
    expect(diaRelativo(0, HOY)).toBe('2026-10-14')
    expect(diaRelativo(-14, HOY)).toBe('2026-09-30')
    expect(diaRelativo(18, HOY)).toBe('2026-11-01')
  })

  it('distingue hoy, próximo, por cerrar y cerrado', () => {
    expect(estadoDe(taller({ fecha: '2026-10-14' }), HOY)).toBe('hoy')
    expect(estadoDe(taller({ fecha: '2026-10-16' }), HOY)).toBe('proximo')
    expect(estadoDe(taller({ fecha: '2026-10-10' }), HOY)).toBe('por_cerrar')
    expect(estadoDe(taller({ fecha: '2026-10-10', cierre: CIERRE }), HOY)).toBe('cerrado')
    // Finalizado por la base sin feedback: sigue por cerrar.
    expect(estadoDe(taller({ fecha: '2026-10-10', estadoWorkshop: 'finalizado' }), HOY)).toBe('por_cerrar')
  })

  it('un cancelado tiene su propio estado, pase lo que pase con la fecha, y no se inicia', () => {
    for (const fecha of ['2026-10-10', '2026-10-14', '2026-10-20']) {
      expect(estadoDe(taller({ fecha, estadoWorkshop: 'cancelado' }), HOY)).toBe('cancelado')
    }
    expect(puedeIniciarse(taller({ estadoWorkshop: 'cancelado' }))).toBe(false)
    expect(puedeIniciarse(taller({ estadoWorkshop: 'publicado' }))).toBe(true)
    expect(puedeIniciarse(taller({ estadoWorkshop: 'finalizado' }))).toBe(true)
  })

  it('agrupa y ordena por fecha y hora', () => {
    const grupos = agruparTalleres([
      taller({ id: 'b', horaInicio: '12:00' }),
      taller({ id: 'a', horaInicio: '08:00' }),
      taller({ id: 'p', fecha: '2026-10-20' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
    ], HOY)
    expect(grupos.hoy.map(t => t.id)).toEqual(['a', 'b'])
    expect(grupos.proximos.map(t => t.id)).toEqual(['p'])
    expect(grupos.porCerrar.map(t => t.id)).toEqual(['c'])
    expect(grupos.cerrados).toEqual([])
    expect(grupos.cancelados).toEqual([])
  })

  it('los cancelados van aparte y nunca quedan por cerrar', () => {
    const grupos = agruparTalleres([
      taller({ id: 'x', fecha: '2026-10-01', estadoWorkshop: 'cancelado' }),
      taller({ id: 'y', fecha: '2026-10-14', estadoWorkshop: 'cancelado' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
      taller({ id: 'z', fecha: '2026-10-02', cierre: CIERRE }),
    ], HOY)
    expect(grupos.porCerrar.map(t => t.id)).toEqual(['c'])
    expect(grupos.hoy).toEqual([])
    expect(grupos.cancelados.map(t => t.id)).toEqual(['x', 'y'])
    expect(grupos.cerrados.map(t => t.id)).toEqual(['z'])
  })

  it('agrupa las filas de la base', () => {
    const grupos = agruparTalleres([FINALIZADO, CANCELADO].map(tallerDesdeBase), HOY)
    expect(grupos.cerrados.map(t => t.id)).toEqual(['9'])
    expect(grupos.cancelados.map(t => t.id)).toEqual(['12'])
    expect(grupos.porCerrar).toEqual([])
  })
})

describe('textos del taller', () => {
  it('muestra el horario aunque falte el fin', () => {
    expect(horario(taller({}))).toBe('10:00 – 10:30')
    expect(horario(taller({ horaFin: '' }))).toBe('10:00')
  })

  it('junta grupo y asistentes sin las partes que faltan', () => {
    const asistentes = (n: number) => `${n} previstos`
    expect(grupoYAsistentes(taller({}), asistentes)).toBe('A · 20 previstos')
    expect(grupoYAsistentes(taller({ grupo: '' }), asistentes)).toBe('20 previstos')
    expect(grupoYAsistentes(taller({ asistentesEstimados: null }), asistentes)).toBe('A')
    expect(grupoYAsistentes(taller({ grupo: '', asistentesEstimados: null }), asistentes)).toBe('')
  })
})

describe('entrada con correo y PIN', () => {
  it('acepta 6 dígitos aunque se escriban con espacios o guion', () => {
    expect(codigoValido('482 913')).toBe(true)
    expect(codigoValido('482-913')).toBe(true)
    expect(codigoValido('48291')).toBe(false)
    expect(codigoValido('48291a')).toBe(false)
  })

  it('valida la forma del correo', () => {
    expect(correoValido('maria@ejemplo.test')).toBe(true)
    expect(correoValido('maria@')).toBe(false)
  })
})

describe('cierre del facilitador', () => {
  it('pide calificación, asistentes y las dos observaciones; el texto libre es opcional', () => {
    expect(cierreCompleto({ calificacion: 4, asistentes: 20, participacion: 'alta', claridad: 'clara' })).toBe(true)
    expect(cierreCompleto({ asistentes: 20, participacion: 'alta', claridad: 'clara' })).toBe(false)
    expect(cierreCompleto({ calificacion: 6, asistentes: 20, participacion: 'alta', claridad: 'clara' })).toBe(false)
    expect(cierreCompleto({ calificacion: 4, asistentes: 20, participacion: 'alta' })).toBe(false)
    expect(cierreCompleto({ calificacion: 4, participacion: 'alta', claridad: 'clara' })).toBe(false)
  })
})

describe('talleres por día', () => {
  it('agrupa por fecha y ordena por hora', () => {
    const porDia = talleresPorDia([
      taller({ id: 'b', fecha: '2026-10-14', horaInicio: '12:00' }),
      taller({ id: 'a', fecha: '2026-10-14', horaInicio: '09:00' }),
      taller({ id: 'c', fecha: '2026-10-15' }),
    ])
    expect(porDia['2026-10-14']!.map(t => t.id)).toEqual(['a', 'b'])
    expect(porDia['2026-10-15']!.map(t => t.id)).toEqual(['c'])
  })
})

describe('abrir el taller', () => {
  it('lleva al runner de Player en modo educador', () => {
    expect(urlDelTaller('http://localhost:3001/', taller({}))).toBe('http://localhost:3001/play/alimentacion/el-huevo?mode=educator&lang=es')
  })

  it('en el idioma del workshop, no en el de la interfaz', () => {
    expect(urlDelTaller('http://localhost:3001', taller({ idioma: 'en' }))).toBe('http://localhost:3001/play/alimentacion/el-huevo?mode=educator&lang=en')
  })
})
