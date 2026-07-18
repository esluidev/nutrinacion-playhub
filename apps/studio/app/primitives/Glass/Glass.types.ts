export interface GlassProps {
  /** Fill fraction 0–1 (the scene maps its own units, e.g. sips/total) */
  level: number
  /** Top headroom: the water never rises past this fraction of the glass —
      a liquid flush with the rim reads as overflowing */
  maxFill?: number
}
