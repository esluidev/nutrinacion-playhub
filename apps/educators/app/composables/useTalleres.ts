import type { StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'
import datos from '~/fixtures/talleres.json'
import { sesionNoValida, useSupabaseClient } from '~/utils/supabase'
import { cierreDesdeBase, tallerDesdeBase, tallerDesdeFixture } from '~/utils/talleres'
import type { Cierre, CierreBase, Taller, WorkshopBase, WorkshopFixture } from '~/utils/talleres'

// Talleres del educador en todas sus organizaciones (educador_workshops), la guía de cada uno
// (educador_guia, en el idioma del workshop), su ejecución (educador_iniciar y educador_terminar,
// con los eventos del runner) y el feedback (educador_guardar_feedback). Las filas de la base pasan
// a `Taller` con tallerDesdeBase (utils/talleres.ts, con tests).
// En modo demo (sin Supabase) son los datos de fixtures/, con las fechas (también las de la
// jornada) relativas a hoy; los cierres se guardan en este dispositivo y la guía sale de
// fixtures/guia-<slug>.json.

const CIERRES_DEMO = 'playhub-educadores-cierres'

const guiasDemo = import.meta.glob<{ escenas: StoryboardGuide }>('~/fixtures/guia-*.json', { eager: true, import: 'default' })

function talleresDemo(cierres: Record<string, Cierre>): Taller[] {
  return (datos.talleres as unknown as WorkshopFixture[]).map((w) => {
    const taller = tallerDesdeFixture(w)
    return cierres[taller.id] ? { ...taller, cierre: cierres[taller.id] } : taller
  })
}

export function useTalleres() {
  const { token, demo, caducada } = useSesion()
  const talleres = useState<Taller[]>('talleres', () => [])
  // Ya cargados alguna vez, cargando ahora y si la última carga falló.
  const carga = useState('talleres-carga', () => ({ lista: false, cargando: false, error: false }))
  // La guía de cada workshop, una vez pedida.
  const guias = useState<Record<string, StoryboardGuide>>('guias', () => ({}))
  const cierresDemo = useState<Record<string, Cierre>>('cierres', () => {
    if (!import.meta.client) return {}
    try { return JSON.parse(localStorage.getItem(CIERRES_DEMO) ?? '{}') }
    catch { return {} }
  })

  /** Pide sus workshops a la base (o los de prueba). La primera vez la lanza el propio composable. */
  async function cargar() {
    if (!token.value || carga.value.cargando) return
    carga.value = { ...carga.value, cargando: true }
    if (demo) {
      talleres.value = talleresDemo(cierresDemo.value)
      carga.value = { lista: true, cargando: false, error: false }
      return
    }
    const { data, error } = await useSupabaseClient().rpc('educador_workshops', { p_token: token.value })
    if (sesionNoValida(error)) return caducada()
    if (error) {
      carga.value = { ...carga.value, cargando: false, error: true }
      return
    }
    talleres.value = ((data ?? []) as unknown as WorkshopBase[]).map(tallerDesdeBase)
    carga.value = { lista: true, cargando: false, error: false }
  }

  if (import.meta.client && !carga.value.lista && !carga.value.cargando && !carga.value.error) void cargar()

  /** La primera carga, sin datos todavía: las vistas muestran que esperan en vez de «sin talleres». */
  const cargando = computed(() => !carga.value.lista && !carga.value.error)
  const error = computed(() => carga.value.error)

  function taller(id: string): Taller | undefined {
    return talleres.value.find(t => t.id === id)
  }

  /** Guarda (o corrige) el feedback del taller. Devuelve false si no se pudo. */
  async function guardarCierre(id: string, cierre: Cierre): Promise<boolean> {
    let guardado = cierre
    if (demo) {
      cierresDemo.value = { ...cierresDemo.value, [id]: cierre }
      try { localStorage.setItem(CIERRES_DEMO, JSON.stringify(cierresDemo.value)) }
      catch { /* sin almacenamiento */ }
    }
    else {
      if (!token.value) return false
      const { data, error } = await useSupabaseClient().rpc('educador_guardar_feedback', { p_token: token.value, p_workshop_id: Number(id), p_feedback: { ...cierre } })
      if (sesionNoValida(error)) {
        await caducada()
        return false
      }
      if (error || !data) return false
      guardado = cierreDesdeBase(data as unknown as CierreBase)
    }
    talleres.value = talleres.value.map(t => (t.id === id ? { ...t, cierre: guardado } : t))
    return true
  }

  /** La guía del storyboard del taller, por carpeta de escena (la da Educators al runner). */
  async function guia(t: Taller): Promise<StoryboardGuide | null> {
    if (t.id in guias.value) return guias.value[t.id]!
    if (demo) return Object.entries(guiasDemo).find(([ruta]) => ruta.endsWith(`/guia-${t.storyboard.slug}.json`))?.[1].escenas ?? null
    if (!token.value) return null
    const { data, error } = await useSupabaseClient().rpc('educador_guia', { p_token: token.value, p_workshop_id: Number(t.id) })
    if (sesionNoValida(error)) {
      await caducada()
      return null
    }
    // Sin guía, el runner funciona igual: su panel «Guía» queda vacío.
    if (error || !data) return null
    const escenas = data as unknown as StoryboardGuide
    guias.value = { ...guias.value, [t.id]: escenas }
    return escenas
  }

  /** El runner dijo «listo»: empieza la ejecución real. Solo cuenta si el workshop está publicado. */
  async function iniciar(id: string): Promise<boolean> {
    if (demo || !token.value || taller(id)?.estadoWorkshop !== 'publicado') return false
    const { error } = await useSupabaseClient().rpc('educador_iniciar', { p_token: token.value, p_workshop_id: Number(id) })
    if (sesionNoValida(error)) await caducada()
    return !error
  }

  /** El runner dijo «terminado» (vale también si el workshop ya se finalizó mientras tanto). */
  async function terminar(id: string): Promise<boolean> {
    const t = taller(id)
    if (demo || !token.value || !t || t.estadoWorkshop === 'cancelado') return false
    const { error } = await useSupabaseClient().rpc('educador_terminar', { p_token: token.value, p_workshop_id: Number(id) })
    if (sesionNoValida(error)) await caducada()
    return !error
  }

  return { talleres, cargando, error, cargar, taller, guardarCierre, guia, iniciar, terminar }
}
