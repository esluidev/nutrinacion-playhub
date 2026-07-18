export type BreathPhase = 'in' | 'out'

export interface BreathGuideOptions {
  /** Full breath cycles (inhale + exhale) */
  cycles?: number
  /** Inhale length in ms */
  inhaleMs?: number
  /** Exhale length in ms */
  exhaleMs?: number
}
