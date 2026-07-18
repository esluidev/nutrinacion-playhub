export type ScaleUnit = 'kg' | 'g' | 'lb'

export type ScaleVariant = 'default' | 'paper'

export interface ScaleItem {
  key: number
  label?: string
  emoji?: string
  weightKg: number
}
