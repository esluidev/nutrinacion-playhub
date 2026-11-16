// Lo que se muestra del contacto de un perfil, además del correo (0017).

/** Los teléfonos de un perfil en una línea («Móvil +502 … · Oficina +502 …»); vacío si no tiene. */
export function telefonosDe(
  perfil: { telefono_movil: string | null, telefono_oficina: string | null } | null | undefined,
  labels: { movil: string, oficina: string },
) {
  return [
    perfil?.telefono_movil && `${labels.movil} ${perfil.telefono_movil}`,
    perfil?.telefono_oficina && `${labels.oficina} ${perfil.telefono_oficina}`,
  ].filter(Boolean).join(' · ')
}
