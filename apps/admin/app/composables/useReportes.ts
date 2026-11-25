// El reporte de la organización activa (tarea 021): `reporte_talleres` (0005) con el periodo y los
// filtros de la vista. La base aplica las reglas (qué es realizado, el alcance por audiencia en cada
// lugar, las sesiones recibidas) y la RLS deja solo lo que se opera; aquí solo se pide y, sin
// Supabase, se devuelve un ejemplo. El orden para pintarlo está en utils/reporte.ts.
import type { Reporte } from '~/utils/reporte'

export interface FiltrosReporte {
  desde: string
  hasta: string
  programaId: number | null
  comunidadId: number | null
  lugarId: number | null
  audienciaId: number | null
}

// Modo demo: cuatro sesiones de «2.º B» en el Centro Comunitario (una cancelada y otra en otra
// fecha) y una feria abierta al público.
function demoReporte(): Reporte {
  const fila = (id: number, dias: number, storyboard: number, extra: Partial<Reporte['talleres'][number]>): Reporte['talleres'][number] => ({
    id, fecha: hoyLocal(dias), estado: 'FINALIZADO', storyboard_id: storyboard, lugar_id: 1, comunidad_id: 1, grupo_audiencia_id: 1,
    abierto: false, programa_id: 1, jornada_id: null, asistentes_estimados: 25, realizado: true, asistentes: 22, ninas: 12, ninos: 10,
    calificacion: 4, participacion: 'ALTA', claridad: 'CLARA', minutos: 35, dispositivos: null, segundos_dispositivos: 0, dificultades: [], material: [],
    motivo_cancelacion: null, ...extra,
  })
  const talleres = [
    fila(11, -28, 1, { calificacion: 5, claridad: 'MUY_CLARA', material: ['Frijoles reales para tocar'] }),
    fila(12, -20, 2, { asistentes: 20, ninas: 11, ninos: 9, participacion: 'MEDIA', dificultades: ['Contar las porciones del día'] }),
    fila(13, -14, 3, { estado: 'CANCELADO', realizado: false, asistentes: null, ninas: null, ninos: null, calificacion: null, participacion: null, claridad: null, minutos: null, motivo_cancelacion: 'Lluvia: la escuela suspendió clases' }),
    fila(14, -6, 1, { asistentes: 24, ninas: 13, ninos: 11, claridad: 'POCO_CLARA', dificultades: ['Diferenciar legumbres de verduras'], material: ['frijoles reales para tocar'] }),
    fila(15, -10, 2, { grupo_audiencia_id: 2, abierto: true, asistentes: 48, ninas: null, ninos: null, minutos: 25, dispositivos: 9, segundos_dispositivos: 9 * 22 * 60 }),
  ]
  return {
    resumen: { previstos: 5, realizados: 4, cancelados: 1, sin_realizar: 0, asistencias: 114, asistencias_abiertos: 48, minutos: 130, talleres_con_dispositivos: 1, dispositivos: 9, segundos_dispositivos: 9 * 22 * 60 },
    alcance: { total: 24, ninas: 13, ninos: 11 },
    pares: [{ grupo_audiencia_id: 1, lugar_id: 1, previstas: 4, recibidas: 3, ninas: 13, ninos: 11 }],
    talleres,
    historial: [
      { workshop_id: 14, tipo: 'REPROGRAMADO', fecha_anterior: hoyLocal(-7), fecha_nueva: hoyLocal(-6), motivo: 'Acto cívico en la escuela', cuando: '' },
      { workshop_id: 13, tipo: 'CANCELADO', fecha_anterior: hoyLocal(-14), fecha_nueva: null, motivo: 'Lluvia: la escuela suspendió clases', cuando: '' },
    ],
  }
}

export function useReportes() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()

  async function cargar(f: FiltrosReporte): Promise<{ reporte: Reporte | null, error: string | null }> {
    if (demo) return { reporte: demoReporte(), error: null }
    if (!orgActiva.value) return { reporte: null, error: null }
    const { data, error } = await useSupabaseClient().rpc('reporte_talleres', {
      p_organizacion_id: orgActiva.value.id,
      p_desde: f.desde,
      p_hasta: f.hasta,
      p_programa_id: f.programaId ?? undefined,
      p_comunidad_id: f.comunidadId ?? undefined,
      p_lugar_id: f.lugarId ?? undefined,
      p_grupo_audiencia_id: f.audienciaId ?? undefined,
    })
    return { reporte: (data as unknown) as Reporte | null, error: error?.message ?? null }
  }

  return { cargar }
}
