export type ParticlesKind = 'steam' | 'splatter' | 'bubbles'

export interface ParticlesProps {
  /** steam = rising puffs · splatter = oil pops · bubbles = boiling water */
  kind: ParticlesKind
  active?: boolean
}
