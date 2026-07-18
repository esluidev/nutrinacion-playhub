export type ThermometerVariant = 'default' | 'paper'

export type ThermometerZoneKey = 'cold' | 'normal' | 'warm' | 'hot' | 'critical'

export interface ThermometerZone {
  /** Upper bound (exclusive) of the zone in °C; Infinity for the last one */
  max: number
  key: ThermometerZoneKey
  label: string
}

export interface ThermometerPatient {
  label?: string
  emoji?: string
  tempC: number
}

/** Medical default ranges from the DS */
export const DEFAULT_ZONES: ThermometerZone[] = [
  { max: 35.0, key: 'cold', label: 'Hipotermia' },
  { max: 37.5, key: 'normal', label: 'Normal' },
  { max: 38.5, key: 'warm', label: 'Febricula' },
  { max: 40.0, key: 'hot', label: 'Fiebre alta' },
  { max: Number.POSITIVE_INFINITY, key: 'critical', label: 'Muy alta' },
]
