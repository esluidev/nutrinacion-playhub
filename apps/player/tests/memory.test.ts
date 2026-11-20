import { describe, expect, it } from 'vitest'
import { forgetMemory, memoryKey, openingScene, readMemory, urlWithScene, writeMemory } from '~/runner/memory'
import type { MemoryStore } from '~/runner/memory'

// Lo que el runner recuerda de un taller en el aparato (app/runner/memory.ts): en qué escena iba y cuáles hizo.

function fakeStore(): MemoryStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

const FOLDERS = ['bienvenida', 'origen', 'descubrimiento', 'despedida']

describe('memoria del taller', () => {
  it('guarda, lee y olvida la escena y las hechas', () => {
    const store = fakeStore()
    const key = memoryKey('sb-1', 'educator')
    expect(readMemory(store, key)).toBeNull()
    writeMemory(store, key, { scene: 'origen', done: ['bienvenida'] })
    expect(readMemory(store, key)).toEqual({ scene: 'origen', done: ['bienvenida'] })
    forgetMemory(store, key)
    expect(readMemory(store, key)).toBeNull()
  })

  it('en casa, cada perfil tiene la suya', () => {
    expect(memoryKey('sb-1', 'home', 'zorro-Jeffrey')).not.toBe(memoryKey('sb-1', 'home', 'oso-Ana'))
    expect(memoryKey('sb-1', 'educator')).toBe('playhub-runner:sb-1:educator')
  })

  it('lo que no se entiende es como no recordar nada', () => {
    const store = fakeStore()
    store.data.set('a', '{roto')
    store.data.set('b', JSON.stringify({ scene: 3, done: [] }))
    store.data.set('c', JSON.stringify({ scene: 'origen', done: ['bienvenida', 7] }))
    expect(readMemory(store, 'a')).toBeNull()
    expect(readMemory(store, 'b')).toBeNull()
    expect(readMemory(store, 'c')).toEqual({ scene: 'origen', done: ['bienvenida'] })
  })

  it('si el navegador no deja leer ni escribir, sigue sin recordar', () => {
    const broken: MemoryStore = {
      getItem: () => { throw new Error('sin permiso') },
      setItem: () => { throw new Error('sin espacio') },
      removeItem: () => { throw new Error('sin permiso') },
    }
    expect(readMemory(broken, 'k')).toBeNull()
    expect(() => writeMemory(broken, 'k', { scene: 'origen', done: [] })).not.toThrow()
    expect(() => forgetMemory(broken, 'k')).not.toThrow()
    expect(readMemory(null, 'k')).toBeNull()
  })

  it('abre en la escena que pide la dirección, si no en la que recuerda, si no en la primera', () => {
    const memory = { scene: 'descubrimiento', done: [] }
    expect(openingScene(FOLDERS, 'origen', memory)).toBe(1)
    expect(openingScene(FOLDERS, undefined, memory)).toBe(2)
    expect(openingScene(FOLDERS, 'no-existe', memory)).toBe(2)
    expect(openingScene(FOLDERS, undefined, { scene: 'ya-no-esta', done: [] })).toBe(0)
    expect(openingScene(FOLDERS, undefined, null)).toBe(0)
  })

  it('la dirección lleva la escena actual y conserva lo demás', () => {
    const url = urlWithScene('http://localhost:3001/play/alimentacion/el-huevo?mode=home&escena=origen', 'despedida')
    expect(new URL(url).searchParams.get('escena')).toBe('despedida')
    expect(new URL(url).searchParams.get('mode')).toBe('home')
  })
})
