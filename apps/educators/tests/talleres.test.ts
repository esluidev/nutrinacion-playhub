import { describe, expect, it } from 'vitest'
import datos from '~/fixtures/talleres.json'
import { agenda, cierreCompleto, codigoValido, correoValido, diaRelativo, estadoDe, grupoYAsistentes, horario, puedeIniciarse, tallerDesdeBase, tallerDesdeFixture, lugarDelTaller, talleresPorDia, urlDelTaller } from '~/utils/talleres'
import type { Cierre, Taller, WorkshopBase, WorkshopFixture } from '~/utils/talleres'

const HOY = new Date(2026, 9, 14, 9, 30) // 14 de octubre de 2026

const CIERRE: Cierre = { calificacion: 4, asistentes: 3, participacion: 'media', claridad: 'clara', costo: '', faltoMaterial: '' }

function taller(parcial: Partial<Taller>): Taller {
  return {
    id: 't',
    storyboard: { titulo: 'El huevo', eje: 'alimentacion', slug: 'el-huevo', edicion: 'KIDS', escenas: 4, duracion: 30 },
    organizacion: { id: 1, nombre: 'Fundación Centro' },
    jornada: null,
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
  jornada: { id: 1, nombre: 'Semana de la nutrición', ubicacion: 'Sede central', fecha_inicio: '2026-10-11', fecha_fin: '2026-10-30' },
  modalidad: 'presencial',
  horaInicio: '10:00',
  iniciadoEn: '2026-10-13T16:00:00+00:00',
  organizacion: { id: 1, nombre: 'Fundación Centro' },
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
  jornada: null,
  cierre: null,
  estado: 'pendiente',
  iniciadoEn: null,
  terminadoEn: null,
  estadoWorkshop: 'cancelado',
  motivoCancelacion: 'Feriado escolar',
}

describe('workshops de la base', () => {
  it('pasa una fila de educador_workshops a Taller, con su organización y su jornada', () => {
    expect(tallerDesdeBase(FINALIZADO)).toEqual({
      id: '9',
      storyboard: { titulo: 'El huevo', eje: 'alimentacion', slug: 'el-huevo', edicion: 'KIDS', escenas: 4, duracion: 30 },
      organizacion: { id: 1, nombre: 'Fundación Centro' },
      jornada: { id: 1, nombre: 'Semana de la nutrición', ubicacion: 'Sede central', fechaInicio: '2026-10-11', fechaFin: '2026-10-30' },
      fecha: '2026-10-13',
      horaInicio: '10:00',
      horaFin: '10:30',
      lugar: 'Sede central · Aula 2B',
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

  it('dentro de una jornada, el lugar es el de la jornada y el detalle del taller', () => {
    expect(lugarDelTaller('Aula 3A', { ubicacion: 'Sede central' })).toBe('Sede central · Aula 3A')
    expect(lugarDelTaller(null, { ubicacion: 'Sede central' })).toBe('Sede central')
    expect(lugarDelTaller('  ', { ubicacion: 'Sede central' })).toBe('Sede central')
    expect(lugarDelTaller('Biblioteca', null)).toBe('Biblioteca')
    expect(lugarDelTaller(null, null)).toBe('')
  })

  it('un taller suelto no tiene jornada y lleva su propio lugar', () => {
    expect(tallerDesdeBase(CANCELADO).jornada).toBeNull()
    expect(tallerDesdeBase(CANCELADO).lugar).toBe('Aula 2B')
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

describe('talleres del modo demo', () => {
  const fixture = datos.talleres as unknown as WorkshopFixture[]
  const de = (id: string) => fixture.find(w => w.id === id)!

  it('cuenta la fecha del taller y las de su jornada desde hoy', () => {
    const t = tallerDesdeFixture(de('t-101'), HOY)
    expect(t.fecha).toBe('2026-10-14')
    expect(t.organizacion).toEqual({ id: 1, nombre: 'Fundación Centro' })
    expect(t.jornada).toEqual({ id: 1, nombre: 'Semana de la nutrición', ubicacion: 'Sede central', fechaInicio: '2026-10-11', fechaFin: '2026-10-30' })
    expect(t).not.toHaveProperty('diaRelativo')
  })

  it('un taller del fixture sin jornada queda sin ella', () => {
    const t = tallerDesdeFixture(de('t-098'), HOY)
    expect(t.fecha).toBe('2026-10-06')
    expect(t.jornada).toBeNull()
    expect(t.cierre).toMatchObject({ calificacion: 5, asistentes: 21 })
  })

  it('todo el fixture pasa a Taller', () => {
    const talleres = fixture.map(w => tallerDesdeFixture(w, HOY))
    expect(talleres).toHaveLength(fixture.length)
    expect(talleres.filter(t => t.jornada)).toHaveLength(fixture.length - 1)
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

  it('en el día de hoy, aparta el siguiente y ordena el resto por fecha y hora', () => {
    const a = agenda([
      taller({ id: 'b', horaInicio: '12:00' }),
      taller({ id: 'a', horaInicio: '08:00' }),
      taller({ id: 'q', fecha: '2026-10-20', horaInicio: '11:00' }),
      taller({ id: 'p', fecha: '2026-10-20', horaInicio: '09:00' }),
      taller({ id: 'r', fecha: '2026-10-16' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
      taller({ id: 'd', fecha: '2026-10-05' }),
    ], '2026-10-14', HOY)
    expect(a.siguiente?.id).toBe('a')
    expect(a.delDia.map(t => t.id)).toEqual(['b'])
    expect(a.despues.map(d => [d.dia, d.talleres.map(t => t.id)])).toEqual([['2026-10-16', ['r']], ['2026-10-20', ['p', 'q']]])
    expect(a.porCerrar.map(t => t.id)).toEqual(['d', 'c'])
  })

  it('el siguiente de hoy no es uno cancelado, cerrado ni finalizado', () => {
    const a = agenda([
      taller({ id: 'x', horaInicio: '08:00', estadoWorkshop: 'cancelado' }),
      taller({ id: 'z', horaInicio: '09:00', cierre: CIERRE }),
      taller({ id: 'f', horaInicio: '10:00', estadoWorkshop: 'finalizado' }),
      taller({ id: 'b', horaInicio: '12:00' }),
    ], '2026-10-14', HOY)
    expect(a.siguiente?.id).toBe('b')
    expect(a.delDia.map(t => t.id)).toEqual(['x', 'z', 'f'])
    expect(agenda([taller({ estadoWorkshop: 'cancelado' })], '2026-10-14', HOY).siguiente).toBeUndefined()
  })

  it('en otro día no aparta ninguno, y lo que falta cerrar se cuenta desde hoy', () => {
    const a = agenda([
      taller({ id: 'p', fecha: '2026-10-20', horaInicio: '09:00' }),
      taller({ id: 'q', fecha: '2026-10-21' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
    ], '2026-10-20', HOY)
    expect(a.siguiente).toBeUndefined()
    expect(a.delDia.map(t => t.id)).toEqual(['p'])
    expect(a.despues.map(d => d.dia)).toEqual(['2026-10-21'])
    expect(a.porCerrar.map(t => t.id)).toEqual(['c'])
  })

  it('un cancelado sigue en su día y nunca queda por cerrar', () => {
    const a = agenda([
      taller({ id: 'x', fecha: '2026-10-01', estadoWorkshop: 'cancelado' }),
      taller({ id: 'y', fecha: '2026-10-20', estadoWorkshop: 'cancelado' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
      taller({ id: 'z', fecha: '2026-10-02', cierre: CIERRE }),
    ], '2026-10-14', HOY)
    expect(a.porCerrar.map(t => t.id)).toEqual(['c'])
    expect(a.despues.map(d => d.talleres.map(t => t.id))).toEqual([['y']])
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

describe('abrir el taller', () => {
  it('lleva al runner de Player en modo educador', () => {
    expect(urlDelTaller('http://localhost:3001/', taller({}))).toBe('http://localhost:3001/play/alimentacion/el-huevo?mode=educator&lang=es')
  })

  it('en el idioma del workshop, no en el de la interfaz', () => {
    expect(urlDelTaller('http://localhost:3001', taller({ idioma: 'en' }))).toBe('http://localhost:3001/play/alimentacion/el-huevo?mode=educator&lang=en')
  })
})
