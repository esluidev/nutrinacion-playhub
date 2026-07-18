export type BottomSheetVariant = 'default' | 'celebrate'

export interface BottomSheetProps {
  open: boolean
  /** Logical content height in stage pixels (scaled with the play stage) */
  height?: number
  /** 'celebrate' tints the sheet yellow (DS reward color) so the completion
      feedback reads as a DIFFERENT thing than the white knowledge card */
  variant?: BottomSheetVariant
}
