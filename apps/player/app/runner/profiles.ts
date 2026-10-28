import type { EditionId, Profile } from './types'

// Perfiles de edición (PLAYER-DESIGN.md). Un storyboard es una edición: su `audience` lo elige.
export const PROFILES: Record<EditionId, Profile> = {
  infantil: { id: 'infantil', label: 'Infantil · 4–8', labels: false, scaffolding: 'guiado' },
  preadolescencia: { id: 'preadolescencia', label: 'Preadolescencia · 9–12', labels: true, scaffolding: 'pista' },
  adolescencia: { id: 'adolescencia', label: 'Adolescencia · 13–17', labels: true, scaffolding: 'libre' },
}

const BY_AUDIENCE: Record<string, EditionId> = {
  KIDS: 'infantil',
  PREADOLESCENTES: 'preadolescencia',
  ADOLESCENTES: 'adolescencia',
}

export function profileOf(audience: string): Profile {
  return PROFILES[BY_AUDIENCE[audience] ?? 'infantil']
}

export const AREA_LABELS: Record<string, string> = {
  'alimentacion': 'Alimentación',
  'actividad-fisica': 'Actividad física',
  'cuidado-personal': 'Cuidado personal',
  'salud-emocional': 'Salud emocional',
}
