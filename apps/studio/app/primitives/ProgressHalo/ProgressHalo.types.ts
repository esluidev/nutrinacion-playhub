export type ProgressHaloColor = 'red' | 'blue' | 'green' | 'yellow'

export interface ProgressHaloProps {
  /** Progreso declarativo, 0..1 */
  progress: number
  /** Color del arco (canal siempre paper-deep, como ProgressRing) */
  color?: ProgressHaloColor
}
