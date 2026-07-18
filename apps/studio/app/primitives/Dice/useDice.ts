import { computed, ref } from 'vue'
import { Sounds } from '../sounds'
import type { DiceDot, DiceOrientation } from './Dice.types'

// Logic ported from the Dice class of the StoryPlay reference DS.
// The die is a real 3D cube: opposite faces sum to 7, and with the
// right-handed convention there are exactly 24 valid orientations
// (6 tops × 4 rotations). Rolling picks one at random — the three visible
// faces always form a physically possible combination.

const PATTERNS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

const ORIENTATIONS: DiceOrientation[] = [
  [1, 2, 3], [1, 3, 5], [1, 5, 4], [1, 4, 2],
  [6, 2, 4], [6, 4, 5], [6, 5, 3], [6, 3, 2],
  [2, 1, 4], [2, 4, 6], [2, 6, 3], [2, 3, 1],
  [5, 1, 3], [5, 3, 6], [5, 6, 4], [5, 4, 1],
  [3, 1, 2], [3, 2, 6], [3, 6, 5], [3, 5, 1],
  [4, 1, 5], [4, 5, 6], [4, 6, 2], [4, 2, 1],
]

// Face corners in the 64×64 viewBox (measured from the DS cube SVG)
const TOP_CORNERS: [number, number][] = [[3.82, 16.26], [32, 2.85], [59.69, 16.49], [32, 29.07]]
const FRONT_CORNERS: [number, number][] = [[3.82, 16.26], [32, 29.07], [32, 62.0], [2.64, 43.38]]
const RIGHT_CORNERS: [number, number][] = [[32, 29.07], [59.69, 16.49], [61.36, 43.38], [32, 62.0]]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function interpolate(
  [tl, tr, br, bl]: [number, number][],
  u: number,
  v: number,
): [number, number] {
  const topX = lerp(tl![0], tr![0], u)
  const topY = lerp(tl![1], tr![1], u)
  const botX = lerp(bl![0], br![0], u)
  const botY = lerp(bl![1], br![1], u)
  return [lerp(topX, botX, v), lerp(topY, botY, v)]
}

function faceDots(
  corners: [number, number][],
  value: number,
  rx: number,
  ry: number,
  offset: { dx: number; dy: number },
): DiceDot[] {
  const dots = PATTERNS[value] ?? [4]
  const pad = 0.3
  const step = (1 - 2 * pad) / 2
  return dots.map((idx) => {
    const col = idx % 3
    const row = Math.floor(idx / 3)
    const [x, y] = interpolate(corners, pad + col * step, pad + row * step)
    return { cx: x + offset.dx, cy: y + offset.dy, rx, ry }
  })
}

function randomOrientation(): DiceOrientation {
  return ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)]!
}

function randomOrientationWithTop(topValue: number): DiceOrientation {
  const filtered = ORIENTATIONS.filter(([t]) => t === topValue)
  return filtered[Math.floor(Math.random() * filtered.length)] ?? ORIENTATIONS[0]!
}

export interface UseDiceOptions {
  initial?: number
  onResult?: (value: number) => void
}

export function useDice(opts: UseDiceOptions = {}) {
  const orientation = ref<DiceOrientation>(randomOrientationWithTop(opts.initial ?? 1))
  const isRolling = ref(false)
  const timers: ReturnType<typeof setTimeout>[] = []

  const value = computed(() => orientation.value[0])

  const dotsTop = computed(() =>
    faceDots(TOP_CORNERS, orientation.value[0], 2.3, 1.4, { dx: 0, dy: -1 }))
  const dotsFront = computed(() =>
    faceDots(FRONT_CORNERS, orientation.value[1], 1.8, 2.3, { dx: -0.8, dy: 0.8 }))
  const dotsRight = computed(() =>
    faceDots(RIGHT_CORNERS, orientation.value[2], 1.8, 2.3, { dx: 0.8, dy: 0 }))

  function roll() {
    // Like the DS, roll() can be re-triggered anytime: clear pending timers
    // and restart the CSS animation (class off → reflow → on)
    timers.forEach(clearTimeout)
    timers.length = 0

    isRolling.value = false
    requestAnimationFrame(() => {
      isRolling.value = true
    })

    Sounds.play('dice-roll')

    const next = randomOrientation()

    // Faces change ONCE at the peak of the jump (30% of the 800ms animation).
    // Dots stay VISIBLE during the whole tumble — they rotate with the cube.
    timers.push(setTimeout(() => {
      orientation.value = next
    }, 240))
    timers.push(setTimeout(() => {
      opts.onResult?.(next[0])
    }, 800))
    timers.push(setTimeout(() => {
      isRolling.value = false
    }, 850))
  }

  function setValue(n: number) {
    n = Math.max(1, Math.min(6, Math.round(n)))
    orientation.value = randomOrientationWithTop(n)
  }

  function destroy() {
    timers.forEach(clearTimeout)
  }

  return { orientation, value, isRolling, dotsTop, dotsFront, dotsRight, roll, setValue, destroy }
}
