export type RulerUnit = 'cm' | 'm' | 'ft'

export type RulerVariant = 'default' | 'paper'

export interface RulerObject {
  label?: string
  emoji?: string
  heightCm: number
}
