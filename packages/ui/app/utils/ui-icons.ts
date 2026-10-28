import icons from '../../icons.json'

// Iconografía del kit: una sola fuente (icons.json), de trazo redondo en una caja de 24 × 24.
// La consumen <UiIcon> y la lámina del laboratorio. Lucide (ISC) como base; ver lucide-LICENSE.txt.
export const UI_ICONS = icons

export type UiIconName = keyof typeof icons

export function uiIconMarkup(name: UiIconName): string {
  return UI_ICONS[name] ?? UI_ICONS.info
}
