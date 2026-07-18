import type { DragPayload } from '../dragdrop/registry'

export type DropZoneColor = 'default' | 'red' | 'blue' | 'green' | 'yellow'

export interface DropZoneProps {
  /** data ids this zone accepts; null/undefined = accepts anything */
  accepts?: string[] | null
  max?: number
  title?: string
  emoji?: string
  color?: DropZoneColor
  hint?: string
}

export interface DroppedChip extends DragPayload {
  key: number
}
