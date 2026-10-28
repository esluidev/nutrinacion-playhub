import { parseRunnerCommand, runnerMessage } from '@playhub/ui/app/utils/runner-contract'
import type { RunnerEvent, StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'

// El runner dentro de otra app (decisión 004, docs/runner.md). Si la página está en un iframe,
// habla con la app que la contiene: le cuenta lo que pasa y recibe de ella la guía. Solo escucha
// y responde a los orígenes de NUXT_PUBLIC_RUNNER_HOSTS. Abierta directamente, no hace nada.
export function useRunnerHost(origins: string[]) {
  const embedded = import.meta.client && window.parent !== window
  const guide = shallowRef<StoryboardGuide | null>(null)
  let host: string | null = null

  function send(event: RunnerEvent) {
    if (!embedded) return
    const message = runnerMessage(event)
    // Hasta que la app responde no se sabe cuál de los orígenes permitidos es: se manda a cada
    // uno y el navegador solo lo entrega al que coincide con el de la página que lo contiene.
    for (const target of host ? [host] : origins) window.parent.postMessage(message, target)
  }

  function onMessage(event: MessageEvent) {
    if (event.source !== window.parent || !origins.includes(event.origin)) return
    const command = parseRunnerCommand(event.data)
    if (!command) return
    host = event.origin
    if (command.tipo === 'iniciar') guide.value = command.guia ?? null
  }

  if (embedded) {
    window.addEventListener('message', onMessage)
    onScopeDispose(() => window.removeEventListener('message', onMessage))
  }

  return { embedded, guide, send }
}
