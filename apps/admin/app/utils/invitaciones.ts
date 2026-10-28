// A quién se invitó: el nombre y apellido que se escribieron al invitar, o null si no hay.
export function nombreInvitado(inv: { nombre?: string | null, apellido?: string | null }): string | null {
  return `${inv.nombre ?? ''} ${inv.apellido ?? ''}`.trim() || null
}
