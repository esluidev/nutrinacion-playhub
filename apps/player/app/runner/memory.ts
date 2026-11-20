// ---- Lo que el runner recuerda de un taller en el aparato, para que recargar la página no lo devuelva al principio
// (Luis, 2026-11-20): en qué escena iba y cuáles estaban hechas. En el taller, mientras dure la pestaña del educador
// (sessionStorage); en casa, por perfil del niño, en el dispositivo (localStorage). Un dispositivo unido al taller no
// recuerda nada: sigue a la sesión. La escena vuelve desde su principio, como al reiniciarla. Sin dibujo ni Vue, con sus
// pruebas (tests/memory.test.ts). ----

export interface RunnerMemory {
  /** La carpeta de la escena en la que iba. */
  scene: string
  /** Las carpetas de las escenas hechas. */
  done: string[]
}

/** Dónde se guarda: `sessionStorage` o `localStorage`, o lo que se les parezca en una prueba. */
export type MemoryStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** La clave de un storyboard en un modo y, en casa, para un perfil. */
export const memoryKey = (storyboard: string, mode: string, who?: string) =>
  ['playhub-runner', storyboard, mode, who].filter(Boolean).join(':')

/** Lo que recuerda, o null si no hay nada (o lo guardado no se entiende, o el navegador no deja leer). */
export function readMemory(store: MemoryStore | null, key: string): RunnerMemory | null {
  try {
    const raw = store?.getItem(key)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<RunnerMemory> | null
    if (typeof value?.scene !== 'string' || !Array.isArray(value.done)) return null
    return { scene: value.scene, done: value.done.filter((folder): folder is string => typeof folder === 'string') }
  }
  catch {
    return null
  }
}

/** Lo guarda; si el navegador no deja (sin permiso o sin espacio), sigue sin recordar. */
export function writeMemory(store: MemoryStore | null, key: string, value: RunnerMemory) {
  try {
    store?.setItem(key, JSON.stringify(value))
  }
  catch { /* sin memoria: al recargar empieza de nuevo */ }
}

/** Lo olvida (al terminar el taller). */
export function forgetMemory(store: MemoryStore | null, key: string) {
  try {
    store?.removeItem(key)
  }
  catch { /* nada que olvidar */ }
}

/**
 * Con qué escena abre: la que pide la dirección (`?escena=`, que el runner abierto directamente mantiene al día), si
 * existe; si no, la que recuerda; si no, la primera.
 */
export function openingScene(folders: readonly string[], start: string | undefined, memory: RunnerMemory | null): number {
  const at = (folder?: string) => (folder ? folders.indexOf(folder) : -1)
  const asked = at(start)
  if (asked >= 0) return asked
  const remembered = at(memory?.scene)
  return remembered >= 0 ? remembered : 0
}

/** La dirección con la escena actual en `?escena=`, para que al recargar se abra en ella. */
export function urlWithScene(href: string, folder: string): string {
  const url = new URL(href)
  url.searchParams.set('escena', folder)
  return url.toString()
}
