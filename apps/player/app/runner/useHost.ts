import type { Ref } from 'vue'
import { parseRunnerCommand, runnerMessage } from '@playhub/ui/app/utils/runner-contract'
import type { RunnerEvent, StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'

// El runner dentro de otra app (decisión 004, docs/runner.md). Si la página está en un iframe,
// habla con la app que la contiene: le cuenta lo que pasa y recibe de ella la guía y, en la vista
// previa, a qué escena ir y cuándo reiniciar (`conducir`); en el taller, la conexión para que se
// unan otros dispositivos (`conexion`, tarea 013). Solo escucha y responde a los orígenes permitidos,
// los de Admin y Educators en la base (`urlsDeLasApps.ts`); mientras se leen, lo que cuenta espera
// (la app no manda nada antes de «listo»). Abierta directamente, no hace nada.
export function useRunnerHost(
  origins: Ref<string[] | null>,
  conducir?: { ir: (escena: number | string) => void, reiniciar: () => void },
) {
  const embedded = import.meta.client && window.parent !== window
  const guide = shallowRef<StoryboardGuide | null>(null)
  const conexion = shallowRef<{ codigo: string, llave: string } | null>(null)
  let host: string | null = null
  const pendientes: RunnerEvent[] = []

  function enviar(event: RunnerEvent, permitidos: string[]) {
    const message = runnerMessage(event)
    // Hasta que la app responde no se sabe cuál de los orígenes permitidos es: se manda a cada
    // uno y el navegador solo lo entrega al que coincide con el de la página que lo contiene.
    for (const target of host ? [host] : permitidos) window.parent.postMessage(message, target)
  }

  function send(event: RunnerEvent) {
    if (!embedded) return
    if (origins.value) enviar(event, origins.value)
    else pendientes.push(event)
  }

  if (embedded) {
    watch(origins, (permitidos) => {
      if (permitidos) pendientes.splice(0).forEach(e => enviar(e, permitidos))
    })
  }

  function onMessage(event: MessageEvent) {
    if (event.source !== window.parent || !origins.value?.includes(event.origin)) return
    const command = parseRunnerCommand(event.data)
    if (!command) return
    host = event.origin
    if (command.tipo === 'iniciar') guide.value = command.guia ?? null
    else if (command.tipo === 'ir') conducir?.ir('indice' in command ? command.indice : command.escena)
    else if (command.tipo === 'reiniciar') conducir?.reiniciar()
    else if (command.tipo === 'conexion') conexion.value = { codigo: command.codigo, llave: command.llave }
  }

  if (embedded) {
    window.addEventListener('message', onMessage)
    onScopeDispose(() => window.removeEventListener('message', onMessage))
  }

  return { embedded, guide, conexion, send }
}
