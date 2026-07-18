export type ModalVariant = 'default' | 'info' | 'success' | 'warning' | 'danger'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  /** Header eyebrow text ("INFORMACIÓN", "CONFIGURACIÓN"…) */
  eyebrow: string
  /** Subtle accent (eyebrow color + dot). White background NEVER changes (DS) */
  variant?: ModalVariant
  size?: ModalSize
  /** If set, the footer shows the secondary audio button that speaks this text */
  audioText?: string
  /** aria-label of the audio button (default Spanish; localize in the runner) */
  audioLabel?: string
  /** Speak audioText automatically when the modal opens (non-readers) */
  autoSpeak?: boolean
  /** Clicking the overlay closes the modal (emits close) */
  closeOnOverlay?: boolean
}
