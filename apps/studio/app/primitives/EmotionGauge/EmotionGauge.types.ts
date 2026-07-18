export type EmotionGaugeZone = 'calma' | 'atencion' | 'intensa'

export interface EmotionGaugeProps {
  /** Emotional intensity 0..1 (0 = calm, 1 = most intense) */
  value: number
}
