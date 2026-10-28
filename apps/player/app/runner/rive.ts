import riveWasm from '@rive-app/webgl2/rive.wasm?url'
import riveFallbackWasm from '@rive-app/webgl2/rive_fallback.wasm?url'

// Runtime de Rive, cargado una sola vez y solo en el cliente, con su wasm servido por la app
// (nunca desde un CDN). Contrato de PlayHub: artboard MainArtboard, máquina MainStateMachine,
// View Model con propiedades y triggers.

type RiveModule = typeof import('@rive-app/webgl2')

let runtime: Promise<RiveModule> | null = null
const buffers = new Map<string, Promise<ArrayBuffer>>()

export function loadRive(): Promise<RiveModule> {
  runtime ??= import('@rive-app/webgl2').then((mod) => {
    mod.RuntimeLoader.setWasmUrl(riveWasm)
    mod.RuntimeLoader.setWasmFallbackUrl(riveFallbackWasm)
    return mod
  })
  return runtime
}

export function loadRiveFile(url: string): Promise<ArrayBuffer> {
  let buffer = buffers.get(url)
  if (!buffer) {
    buffer = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Rive ${url}: ${r.status}`)
      return r.arrayBuffer()
    })
    buffers.set(url, buffer)
  }
  return buffer
}
