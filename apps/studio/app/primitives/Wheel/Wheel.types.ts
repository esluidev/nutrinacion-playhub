export interface WheelOptions {
  sectors?: number
  /** Called with the winning sector index when the spin ends */
  onLand?: (sectorIndex: number) => void
  /** Called on each sector-boundary crossing during the spin */
  onTick?: (count: number) => void
}

export interface WheelInstance {
  spin: () => void
  reset: () => void
  isSpinning: () => boolean
}
