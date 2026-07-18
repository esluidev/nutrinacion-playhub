import type { Component } from 'vue'

export type TapColor = 'red' | 'blue' | 'green' | 'yellow'

export interface TapTarget {
  id: string
  label?: string
  /** Arte del objetivo: sprite (preferido) o emoji como fallback */
  sprite?: Component
  spriteProps?: Record<string, unknown>
  emoji?: string
  correct: boolean
  /** Accent tint of the card — pastel background, like the DS variants */
  color?: TapColor
}

export interface TapFlyer {
  sprite?: Component
  spriteProps?: Record<string, unknown>
  emoji?: string
  color?: TapColor
  left: number
  top: number
  size: number
}

export interface TapBasketItem {
  sprite?: Component
  spriteProps?: Record<string, unknown>
  emoji?: string
  color?: TapColor
}

export interface TapStar {
  id: number
  cx: string
  cy: string
  rot: string
  delay: string
}
