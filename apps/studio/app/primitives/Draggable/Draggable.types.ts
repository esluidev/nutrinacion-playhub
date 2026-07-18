export type DraggableColor = 'default' | 'red' | 'blue' | 'green' | 'yellow'

export interface DraggableProps {
  /** Identifier matched against DropZone accepts */
  data: string
  label?: string
  emoji?: string
  color?: DraggableColor
  disabled?: boolean
}
