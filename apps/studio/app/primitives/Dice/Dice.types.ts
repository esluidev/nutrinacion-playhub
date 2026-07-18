export type DiceColor = 'ink' | 'red' | 'blue'

/** [top, front, right] faces of a physically valid orientation */
export type DiceOrientation = readonly [number, number, number]

export interface DiceDot {
  cx: number
  cy: number
  rx: number
  ry: number
}
