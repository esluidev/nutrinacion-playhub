// A quién se invitó: el nombre y apellido que se escribieron al invitar, o null si no hay.
export function nombreInvitado(inv: { nombre?: string | null, apellido?: string | null }): string | null {
  return `${inv.nombre ?? ''} ${inv.apellido ?? ''}`.trim() || null
}

// El enlace que se comparte con la persona invitada (Admin no envía correos, decisión 009): abre
// el registro con su token en esta misma app.
export function enlaceInvitacion(token: string): string {
  return `${window.location.origin}/invitacion/${token}`
}
