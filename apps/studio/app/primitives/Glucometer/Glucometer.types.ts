export type GlucoZoneKey = 'low' | 'normal' | 'high' | 'critical'

export interface GlucometerPatient {
  id: string
  name: string
  age: number
  /** Emoji avatar */
  avatar?: string
  /** Glucose value in mg/dL revealed when measuring */
  glucose: number
}

export type GlucometerState = 'empty' | 'patient-selected' | 'measuring' | 'done'

export interface BloodFly {
  left: number
  top: number
  dx: number
  dy: number
  flying: boolean
}
