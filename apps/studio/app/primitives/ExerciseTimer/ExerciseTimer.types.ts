export type ExerciseTimerColor = 'red' | 'blue' | 'green' | 'yellow'

export interface ExerciseTimerOptions {
  /** Exercise length in seconds */
  duration: number
  /** Optional beat period in ms: plays a tick + emits `beat` (rhythm moves).
      Omit for calm/hold exercises (silent countdown). */
  beatMs?: number
}
