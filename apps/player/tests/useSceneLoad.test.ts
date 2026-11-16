import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSceneLoad } from '~/runner/useSceneLoad'

// Cuándo se muestra una escena (app/runner/useSceneLoad.ts): entera, cuando lo que esperaba está listo.

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useSceneLoad', () => {
  it('una escena que no espera nada se muestra al asentarse', () => {
    const load = useSceneLoad(2)
    load.open(0)
    expect(load.scenes[0]!.shown).toBe(false)
    load.settle(0)
    expect(load.scenes[0]!.shown).toBe(true)
    expect(load.scenes[1]!.shown).toBe(false)
  })

  it('espera a todo lo que la retiene y se muestra con el último aviso', () => {
    const load = useSceneLoad(1)
    load.open(0)
    const hen = load.hold(0)
    const duck = load.hold(0)
    load.settle(0)
    expect(load.scenes[0]!.shown).toBe(false)
    hen()
    expect(load.scenes[0]!.shown).toBe(false)
    duck()
    expect(load.scenes[0]!.shown).toBe(true)
  })

  it('avisar dos veces cuenta una sola', () => {
    const load = useSceneLoad(1)
    load.open(0)
    const hen = load.hold(0)
    const duck = load.hold(0)
    load.settle(0)
    hen()
    hen()
    expect(load.scenes[0]!.shown).toBe(false)
    duck()
    expect(load.scenes[0]!.shown).toBe(true)
  })

  it('al agotar el plazo se muestra con lo que haya', () => {
    const load = useSceneLoad(1, 1500)
    load.open(0)
    load.hold(0) // nunca avisa
    load.settle(0)
    vi.advanceTimersByTime(1499)
    expect(load.scenes[0]!.shown).toBe(false)
    vi.advanceTimersByTime(1)
    expect(load.scenes[0]!.shown).toBe(true)
  })

  it('lo que llega con la escena ya a la vista no la oculta', () => {
    const load = useSceneLoad(1)
    load.open(0)
    load.settle(0)
    const bird = load.hold(0) // el ave que aparece al destapar una tarjeta
    expect(load.scenes[0]!.shown).toBe(true)
    expect(load.scenes[0]!.pending).toBe(0)
    bird()
    expect(load.scenes[0]!.shown).toBe(true)
  })

  it('reiniciar la escena la vuelve a ocultar y deja sin efecto los avisos de antes', () => {
    const load = useSceneLoad(1)
    load.open(0)
    const old = load.hold(0)
    load.open(0) // se reinicia mientras cargaba
    const hen = load.hold(0)
    load.settle(0)
    old() // el aviso de la escena anterior no cuenta
    expect(load.scenes[0]!.shown).toBe(false)
    hen()
    expect(load.scenes[0]!.shown).toBe(true)
  })

  it('whenShown se cumple al mostrarse, y enseguida si ya se ve', async () => {
    const load = useSceneLoad(1)
    load.open(0)
    const release = load.hold(0)
    load.settle(0)
    const seen = vi.fn()
    void load.whenShown(0).then(seen)
    await Promise.resolve()
    expect(seen).not.toHaveBeenCalled()
    release()
    await Promise.resolve()
    expect(seen).toHaveBeenCalledTimes(1)
    await expect(load.whenShown(0)).resolves.toBeUndefined()
  })

  it('una escena que no existe no rompe nada', () => {
    const load = useSceneLoad(1)
    load.open(5)
    load.settle(5)
    expect(load.hold(5)).toBeTypeOf('function')
    load.dispose()
  })
})
