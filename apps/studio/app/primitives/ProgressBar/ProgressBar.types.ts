export type ProgressBarColor = 'red' | 'blue' | 'green' | 'yellow'

export type ProgressBarSize = 'sm' | 'md' | 'lg'

export interface ProgressBarOptions {
  /** Initial progress, 0..1 */
  initial?: number
}

export interface ProgressBarInstance {
  /** Set progress immediately (CSS transition smooths the change). Clamped to 0..1 */
  setProgress: (value: number) => void
  /** Tween progress from→to with ease-out cubic, like the DS class */
  animate: (from: number, to: number, duration?: number) => void
  /** Current progress, 0..1 */
  current: () => number
}
