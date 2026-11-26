import { describe, expect, it } from 'vitest'
import datos from '~/fixtures/talleres.json'
import { accionesDe, cierreCompleto, conLosDeHoy, desgloseDe, escenasDeLaGuia, escenasYDuracion, codigoValido, correoValido, diaRelativo, estadoDe, grupoYAsistentes, horario, portada, puedeEjecutarse, puedeEnsayarse, puedeReportarse, tallerDesdeBase, tallerDesdeFixture, lugarDelTaller, obvioDelDia, talleresPorDia, urlDelTaller } from '~/utils/talleres'
import type { Cierre, Taller, WorkshopBase, WorkshopFixture } from '~/utils/talleres'

const HOY = new Date(2026, 9, 14, 9, 30) // 14 de octubre de 2026

const CIERRE: Cierre = { calificacion: 4, asistentes: 3, participacion: 'media', claridad: 'clara', costo: '', faltoMaterial: '' }

function taller(parcial: Partial<Taller>): Taller {
  return {
    id: 't',
    titulo: 'El huevo',
    storyboard: { clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', titulo: 'El huevo', eje: 'alimentacion', slug: 'el-huevo', edicion: 'KIDS', escenas: 4, duracion: 30 },
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
  titulo: 'El huevo en el desayuno',
  storyboard: { clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', eje: 'alimentacion', slug: 'el-huevo', titulo: 'El huevo', edicion: 'KIDS', escenas: 4, duracion: 30, categoria: 'ALIMENTACION' },
  terminadoEn: '2026-10-13T16:30:00+00:00',
  estadoWorkshop: 'finalizado',
  motivoCancelacion: null,
  asistentesEstimados: 26,
}

const CANCELADO: WorkshopBase = {
  ...FINALIZADO,
  id: '12',
  fecha: '2026-10-21',
  titulo: null,
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
      titulo: 'El huevo en el desayuno',
      storyboard: { clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', titulo: 'El huevo', eje: 'alimentacion', slug: 'el-huevo', edicion: 'KIDS', escenas: 4, duracion: 30 },
      organizacion: { id: 1, nombre: 'Fundación Centro' },
      jornada: { id: 1, nombre: 'Semana de la nutrición', ubicacion: 'Sede central', fechaInicio: '2026-10-11', fechaFin: '2026-10-30' },
      fecha: '2026-10-13',
      horaInicio: '10:00',
      horaFin: '10:30',
      lugar: 'Sede central · Aula 2B',
      grupo: '3.º A',
      grupoAbierto: false,
      asistentesEstimados: 26,
      idioma: 'es',
      modalidad: 'presencial',
      estadoWorkshop: 'finalizado',
      motivoCancelacion: null,
      terminado: true,
      cierre: { calificacion: 4, asistentes: 23, ninas: null, ninos: null, participacion: 'alta', claridad: 'clara', costo: 'Ordenar el recorrido en el primer intento.', faltoMaterial: '', dispositivos: null },
    })
  })

  it('sin título propio, el taller se llama como su storyboard', () => {
    expect(tallerDesdeBase(CANCELADO).titulo).toBe('El huevo')
    expect(tallerDesdeBase({ ...CANCELADO, titulo: '  ' }).titulo).toBe('El huevo')
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

  it('un cancelado tiene su propio estado, pase lo que pase con la fecha, y no se hace nada con él', () => {
    for (const fecha of ['2026-10-10', '2026-10-14', '2026-10-20']) {
      const cancelado = taller({ fecha, estadoWorkshop: 'cancelado' })
      expect(estadoDe(cancelado, HOY)).toBe('cancelado')
      expect(accionesDe(cancelado, HOY)).toEqual([])
      expect(puedeEnsayarse(cancelado)).toBe(false)
      expect(puedeReportarse(cancelado, HOY)).toBe(false)
    }
  })
})

describe('ensayar, ejecutar y reportar', () => {
  it('antes de su día solo se ensaya', () => {
    const t = taller({ fecha: '2026-10-16' })
    expect(accionesDe(t, HOY)).toEqual(['ensayar'])
    expect(puedeEjecutarse(t, HOY)).toBe(false)
    expect(puedeEnsayarse(t)).toBe(true)
    expect(puedeReportarse(t, HOY)).toBe(false)
  })

  it('el día del taller se ejecuta, y también se puede ensayar', () => {
    expect(accionesDe(taller({}), HOY)).toEqual(['ejecutar', 'ensayar'])
    expect(puedeEjecutarse(taller({}), HOY)).toBe(true)
    expect(puedeReportarse(taller({}), HOY)).toBe(true)
  })

  it('ejecutado hasta el final, toca reportarlo', () => {
    expect(accionesDe(taller({ terminado: true }), HOY)).toEqual(['reportar'])
    expect(puedeEjecutarse(taller({ terminado: true }), HOY)).toBe(false)
  })

  it('pasado su día sin reporte, se reporta; ya no se ejecuta', () => {
    for (const t of [taller({ fecha: '2026-10-10' }), taller({ fecha: '2026-10-10', estadoWorkshop: 'finalizado' })]) {
      expect(accionesDe(t, HOY)).toEqual(['reportar'])
      expect(puedeEjecutarse(t, HOY)).toBe(false)
    }
  })

  it('ya reportado no tiene acciones: el reporte se corrige desde su ficha', () => {
    const t = taller({ fecha: '2026-10-10', cierre: CIERRE })
    expect(accionesDe(t, HOY)).toEqual([])
    expect(puedeReportarse(t, HOY)).toBe(true)
  })
})

describe('la portada', () => {
  it('hoy por hora, lo que falta reportar del más reciente, los próximos día por día y los anteriores', () => {
    const p = portada([
      taller({ id: 'b', horaInicio: '12:00' }),
      taller({ id: 'a', horaInicio: '08:00' }),
      taller({ id: 'q', fecha: '2026-10-20', horaInicio: '11:00' }),
      taller({ id: 'p', fecha: '2026-10-20', horaInicio: '09:00' }),
      taller({ id: 'r', fecha: '2026-10-16' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
      taller({ id: 'd', fecha: '2026-10-05' }),
      taller({ id: 'y', fecha: '2026-10-08', horaInicio: '11:00', cierre: CIERRE }),
      taller({ id: 'x', fecha: '2026-10-08', horaInicio: '09:00', cierre: CIERRE }),
      taller({ id: 'w', fecha: '2026-10-03', cierre: CIERRE }),
    ], HOY)
    expect(p.hoy.map(t => t.id)).toEqual(['a', 'b'])
    expect(p.porReportar.map(t => t.id)).toEqual(['d', 'c'])
    expect(p.proximos.map(d => [d.dia, d.talleres.map(t => t.id)])).toEqual([['2026-10-16', ['r']], ['2026-10-20', ['p', 'q']]])
    expect(p.anteriores.map(d => [d.dia, d.talleres.map(t => t.id)])).toEqual([['2026-10-08', ['x', 'y']], ['2026-10-03', ['w']]])
  })

  it('un cancelado sigue en su día y nunca falta reportarlo', () => {
    const p = portada([
      taller({ id: 'x', fecha: '2026-10-01', estadoWorkshop: 'cancelado' }),
      taller({ id: 'y', fecha: '2026-10-20', estadoWorkshop: 'cancelado' }),
      taller({ id: 'c', fecha: '2026-10-01' }),
    ], HOY)
    expect(p.porReportar.map(t => t.id)).toEqual(['c'])
    expect(p.proximos.map(d => d.talleres.map(t => t.id))).toEqual([['y']])
    expect(p.anteriores.map(d => d.talleres.map(t => t.id))).toEqual([['x']])
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

  it('el día ya dice hoy o próximo; un día pasado no dice nada', () => {
    expect(obvioDelDia('2026-10-14', '2026-10-14')).toBe('hoy')
    expect(obvioDelDia('2026-10-15', '2026-10-14')).toBe('proximo')
    expect(obvioDelDia('2026-10-13', '2026-10-14')).toBeUndefined()
  })
})

describe('la agenda de hoy al día', () => {
  const hoy = '2026-11-25'
  const lista = [
    taller({ id: 'a', fecha: hoy, horaInicio: '09:00' }),
    taller({ id: 'b', fecha: hoy, horaInicio: '11:00' }),
    taller({ id: 'c', fecha: '2026-11-26' }),
  ]

  it('sin cambios, la misma lista (no se vuelve a pintar)', () => {
    const r = conLosDeHoy(lista, [lista[1]!, lista[0]!], hoy)
    expect(r.lista).toBe(lista)
    expect(r.seFueron).toBe(false)
  })

  it('cambia los de hoy por los recién pedidos: uno cancelado, otro a otra hora y uno nuevo', () => {
    const r = conLosDeHoy(lista, [
      { ...lista[0]!, estadoWorkshop: 'cancelado', motivoCancelacion: 'Lluvia' },
      { ...lista[1]!, horaInicio: '12:00' },
      taller({ id: 'd', fecha: hoy, horaInicio: '15:00' }),
    ], hoy)
    expect(r.lista.map(t => t.id).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(r.lista.find(t => t.id === 'a')!.estadoWorkshop).toBe('cancelado')
    expect(r.lista.find(t => t.id === 'b')!.horaInicio).toBe('12:00')
    expect(r.seFueron).toBe(false)
  })

  it('si uno dejó de ser de hoy, avisa para pedir la lista entera', () => {
    const r = conLosDeHoy(lista, [lista[0]!], hoy)
    expect(r.lista.map(t => t.id).sort()).toEqual(['a', 'c'])
    expect(r.seFueron).toBe(true)
  })

  it('uno que se movió a hoy no queda repetido', () => {
    const r = conLosDeHoy(lista, [lista[0]!, lista[1]!, { ...lista[2]!, fecha: hoy }], hoy)
    expect(r.lista.filter(t => t.id === 'c')).toHaveLength(1)
    expect(r.lista.find(t => t.id === 'c')!.fecha).toBe(hoy)
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

  it('resume el contenido en escenas y duración, sin la duración si no la tiene', () => {
    const escenas = (n: number) => `${n} escenas`
    const minutos = (n: number) => `${n} min`
    expect(escenasYDuracion(taller({}), escenas, minutos)).toBe('4 escenas · 30 min')
    const sinDuracion = taller({})
    sinDuracion.storyboard = { ...sinDuracion.storyboard, duracion: null }
    expect(escenasYDuracion(sinDuracion, escenas, minutos)).toBe('4 escenas')
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
  const BASE = { calificacion: 4, asistentes: 20, ninas: 11, ninos: 9, participacion: 'alta', claridad: 'clara' } as const
  it('pide calificación, asistentes, niñas y niños y las dos observaciones; el texto libre es opcional', () => {
    expect(cierreCompleto(BASE)).toBe(true)
    expect(cierreCompleto({ ...BASE, calificacion: undefined })).toBe(false)
    expect(cierreCompleto({ ...BASE, calificacion: 6 })).toBe(false)
    expect(cierreCompleto({ ...BASE, claridad: undefined })).toBe(false)
    expect(cierreCompleto({ ...BASE, asistentes: undefined })).toBe(false)
  })
  it('en una audiencia cerrada, niñas y niños son opcionales; si van, suman los asistentes', () => {
    expect(cierreCompleto({ ...BASE, ninas: null, ninos: null })).toBe(true)
    expect(cierreCompleto({ ...BASE, ninas: 12, ninos: 9 })).toBe(false)
    expect(cierreCompleto({ ...BASE, ninas: 20, ninos: 0 })).toBe(true)
    expect(cierreCompleto({ ...BASE, ninas: 11, ninos: null })).toBe(false)
  })
  it('en una abierta (una feria) basta el total, sin niñas ni niños', () => {
    expect(cierreCompleto({ ...BASE, asistentes: 150, ninas: null, ninos: null }, true)).toBe(true)
    expect(cierreCompleto({ ...BASE, asistentes: 150, ninas: 80, ninos: 70 }, true)).toBe(false)
  })
  it('los dispositivos son opcionales; si van, un entero desde cero', () => {
    expect(cierreCompleto({ ...BASE, dispositivos: null })).toBe(true)
    expect(cierreCompleto({ ...BASE, dispositivos: 0 })).toBe(true)
    expect(cierreCompleto({ ...BASE, dispositivos: 9 })).toBe(true)
    expect(cierreCompleto({ ...BASE, dispositivos: -1 })).toBe(false)
    expect(cierreCompleto({ ...BASE, dispositivos: 2.5 })).toBe(false)
  })
  it('el desglose: sin ninguno, ninguno; con uno, el otro es el resto; con los dos, suman el total', () => {
    expect(desgloseDe(23, undefined, null)).toBeNull()
    expect(desgloseDe(23, 12, undefined)).toEqual({ ninas: 12, ninos: 11 })
    expect(desgloseDe(23, undefined, 11)).toEqual({ ninas: 12, ninos: 11 })
    expect(desgloseDe(23, 12, 11)).toEqual({ ninas: 12, ninos: 11 })
    expect(desgloseDe(23, 12, 12)).toBe(false)
    expect(desgloseDe(23, 24, undefined)).toBe(false)
    expect(desgloseDe(undefined, 12, undefined)).toBe(false)
  })
})

describe('guía del taller', () => {
  it('ordena las escenas por su orden y las numera', () => {
    const escenas = escenasDeLaGuia({
      descubrimiento: { order: 3, title: 'Descubrimiento', verb: 'Descubrir' },
      bienvenida: { order: 1, title: 'Bienvenida' },
      origen: { order: 2 },
    })
    expect(escenas.map(e => [e.numero, e.carpeta])).toEqual([[1, 'bienvenida'], [2, 'origen'], [3, 'descubrimiento']])
    expect(escenas[2]).toMatchObject({ title: 'Descubrimiento', verb: 'Descubrir' })
  })

  it('sin orden, deja las escenas como llegan', () => {
    expect(escenasDeLaGuia({ bienvenida: {}, origen: {}, preparacion: {} }).map(e => e.carpeta)).toEqual(['bienvenida', 'origen', 'preparacion'])
    expect(escenasDeLaGuia({})).toEqual([])
  })
})

describe('abrir el runner', () => {
  it('lleva al runner de Player por la clave del storyboard, en modo educador', () => {
    expect(urlDelTaller('http://localhost:3001/', taller({}))).toBe('http://localhost:3001/play/6f375f8d-0467-4dd2-958a-91d6d6d1c060?mode=educator&lang=es')
  })

  it('en el idioma del workshop, no en el de la interfaz', () => {
    expect(urlDelTaller('http://localhost:3001', taller({ idioma: 'en' }))).toBe('http://localhost:3001/play/6f375f8d-0467-4dd2-958a-91d6d6d1c060?mode=educator&lang=en')
  })

  it('el ensayo, en modo rehearsal', () => {
    expect(urlDelTaller('http://localhost:3001', taller({}), true)).toBe('http://localhost:3001/play/6f375f8d-0467-4dd2-958a-91d6d6d1c060?mode=rehearsal&lang=es')
  })
})
