export type ReorderMode = 'readonly' | 'freeform' | 'validate'

export type ReorderColor = 'default' | 'red' | 'blue' | 'green' | 'yellow'

import type { Component } from 'vue'

export interface ReorderItem {
  id: string
  label: string
  /** Arte del paso: sprite (preferido) o emoji como fallback */
  sprite?: Component
  spriteProps?: Record<string, unknown>
  emoji?: string
}
