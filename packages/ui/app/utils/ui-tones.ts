// Tonos del kit (tokens.css, capa 3). Cada color dice algo; ninguno es «el color de la marca»:
// lime = la acción principal de la vista, y lo correcto, completado o cerrado · sun = hoy, ahora, acento y
// celebración · sky = lo próximo, información y selección · coral = salir, cancelar o lo que falta ·
// grape = novedad · rose = cuidado · night = estructura · neutral = acción secundaria ·
// success/info/warning/danger = estados del sistema. Tabla completa: DESIGN.md, «Roles de color».
export type UiTone =
  | 'sun' | 'lime' | 'coral' | 'sky' | 'grape' | 'rose' | 'night' | 'neutral'
  | 'success' | 'info' | 'warning' | 'danger'

export type UiSize = 'sm' | 'md' | 'lg'

// Estado de una sesión de taller, igual en Admin y en Educators.
export type UiSessionState = 'hoy' | 'proximo' | 'por_cerrar' | 'cerrado' | 'borrador' | 'cancelado'
export const UI_SESSION_TONES = {
  hoy: 'sun',
  proximo: 'sky',
  por_cerrar: 'coral',
  cerrado: 'lime',
  borrador: 'neutral',
  cancelado: 'coral',
} as const satisfies Record<UiSessionState, UiTone>

// Estado de publicación de un storyboard (o un temario), igual en Admin (Platform) y en Player:
// publicado es correcto, en revisión está pendiente de alguien, archivado quedó retirado y
// registrado todavía no dice nada.
export const UI_PUBLICATION_TONES = {
  PUBLICADO: 'lime',
  EN_REVISION: 'sun',
  ARCHIVADO: 'coral',
  REGISTRADO: 'neutral',
} as const satisfies Record<string, UiTone>
export function uiPublicationTone(estado: string | null | undefined): UiTone {
  return UI_PUBLICATION_TONES[estado as keyof typeof UI_PUBLICATION_TONES] ?? 'neutral'
}

// Área educativa → tono. Es lo mismo que hace data-area en CSS; esto sirve cuando hace falta el nombre.
export const UI_AREA_TONES = {
  'alimentacion': 'sun',
  'actividad-fisica': 'sky',
  'cuidado-personal': 'grape',
  'salud-emocional': 'rose',
} as const satisfies Record<string, UiTone>

export type UiArea = keyof typeof UI_AREA_TONES

// Código de tipos_storyboard (ALIMENTACION, ACTIVIDAD_FISICA…) → área del kit, o undefined si no es un área.
export function uiAreaOf(codigo: string | null | undefined): UiArea | undefined {
  const area = (codigo ?? '').trim().toLowerCase().replace(/_/g, '-')
  return area in UI_AREA_TONES ? area as UiArea : undefined
}

// Atributos para teñir algo con su área (v-bind). Sin un área conocida, neutro: no se inventa un significado.
export function uiAreaAttrs(area: string | null | undefined): Record<string, string> {
  return area && area in UI_AREA_TONES ? { 'data-area': area } : { 'data-tone': 'neutral' }
}

// Tono estable para lo que no tiene significado propio (avatares, grupos): mismo nombre, mismo tono.
// Sin lima ni sol: lima es la acción y lo completado, y sol es hoy.
const SEED_TONES = ['sky', 'grape', 'rose', 'coral'] as const satisfies readonly UiTone[]
export function uiToneFor(seed: string | number): UiTone {
  const text = String(seed)
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return SEED_TONES[hash % SEED_TONES.length]!
}

export function uiInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  return ((words[0]![0] ?? '') + (words.length > 1 ? words[1]![0] ?? '' : '')).toUpperCase()
}
