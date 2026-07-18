export type ScoreCounterVariant = 'default' | 'ink' | 'red' | 'blue'

export interface ScoreCounterOptions {
  /** Starting value (also the value restored by reset()) */
  initial?: number
  /** Tween duration in ms for value changes */
  duration?: number
}

export interface FloatingDelta {
  id: number
  amount: number
}

export interface ScoreCounterInstance {
  /** Set the value; animate=false applies it immediately */
  set: (target: number, animate?: boolean) => void
  add: (n: number) => void
  subtract: (n: number) => void
  reset: () => void
  /** Current (logical) value */
  value: () => number
}
