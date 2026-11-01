// Edge Function: enviar-invitacion
// Disparada por un Database Webhook al INSERT en `invitaciones`. Toma la COPY de la tabla
// `plantillas_correo` (Localized), la interpola y la envuelve en el shell HTML (que vive aquí,
// porque es layout, no copy), y envía por Resend.
//
// Despliegue: función con nombre EXACTO `enviar-invitacion`, con **Verify JWT ACTIVADO** — así el
// webhook (que manda la anon key por defecto) pasa, y un tercero sin key válida lo rechaza el
// gateway. Además NO confía en el payload: re-lee la invitación de la BD, así solo envía a
// invitaciones reales y al correo guardado. Único secret a configurar: RESEND_API_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MARCA = 'Nutrinacion'
const FROM = 'Nutrinacion <hello@nutrinacion.com>' // remitente; no es secreto (se ve en cada correo)

// role de la invitación → clave BASE de plantilla en `plantillas_correo`.
// La clave final lleva sufijo `_existente` si el correo ya tiene cuenta (ver abajo).
const CLAVE_POR_ROL: Record<string, string> = {
  ADMIN: 'invitacion_admin',
  COLABORADOR: 'invitacion_colaborador',
}

type Localized = Record<string, string> | null

// Valor en el idioma pedido, con fallback a español y luego a cualquiera.
function pick(loc: Localized, idioma: string): string {
  if (!loc) return ''
  return loc[idioma] ?? loc.es ?? Object.values(loc)[0] ?? ''
}

function interpolate(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, ch => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch))
}

// Envuelve el cuerpo (texto plano; línea en blanco = párrafo) en el shell de marca + botón CTA.
function renderHtml(cuerpo: string, ctaLabel: string, link: string): string {
  const parrafos = cuerpo
    .split(/\n\s*\n/)
    .map(p => `<p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.5;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;">
      <tr><td>
        <div style="width:40px;height:40px;border-radius:10px;background:#22c55e;color:#fff;font-weight:700;font-size:20px;text-align:center;line-height:40px;">N</div>
        <h1 style="margin:20px 0 8px;font-size:20px;color:#111827;">${MARCA}</h1>
        ${parrafos}
        <a href="${link}" style="display:inline-block;margin:24px 0 8px;background:#22c55e;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;word-break:break-all;"><a href="${link}" style="color:#22c55e;">${link}</a></p>
      </td></tr>
    </table>
  </td></tr></table>
  </body></html>`
}

function ok(msg: string) {
  return new Response(JSON.stringify({ ok: true, msg }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  }
  catch {
    return new Response('Bad body', { status: 400 })
  }

  const record = body?.record as Record<string, unknown> | undefined
  if (body?.type !== 'INSERT' || !record?.id) return ok('ignorado (no es INSERT)')

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  // No confiamos en el payload: re-leemos la invitación real de la BD (por id). Así, aunque la
  // función la llame cualquiera, solo envía a invitaciones reales y al correo guardado en la BD.
  const { data: inv } = await admin
    .from('invitaciones')
    .select('role, email, idioma, token, estado, expira_en, organizacion_id')
    .eq('id', record.id)
    .maybeSingle()
  if (!inv) return ok('invitacion no encontrada')

  const role = inv.role as string
  const email = inv.email as string | null
  const idioma = (inv.idioma as string) || 'es'
  const token = inv.token as string

  // Solo pendientes, con destinatario, y de un tipo que recibe correo.
  if (inv.estado !== 'PENDIENTE') return ok('no PENDIENTE')
  if (!email) return ok('sin email (link abierto)')
  const claveBase = CLAVE_POR_ROL[role]
  if (!claveBase) return ok('rol sin plantilla')

  // ¿Ya tiene cuenta? + nombre de la organización + URL base, en paralelo.
  // `perfiles.email` lo llena el trigger desde auth.users (que Supabase guarda en minúsculas),
  // así que es un proxy fiable de "existe la cuenta" sin exponer el esquema auth.
  const emailNorm = email.trim().toLowerCase()
  const [perfilRes, orgRes, cfgRes] = await Promise.all([
    admin.from('perfiles').select('id').eq('email', emailNorm).limit(1),
    admin.from('organizaciones').select('nombre').eq('id', inv.organizacion_id).maybeSingle(),
    admin.from('configuracion').select('valor').eq('clave', 'admin_url').maybeSingle(),
  ])

  // Sin cuenta → el link lleva al formulario de registro (canje por token).
  // Con cuenta → no hay nada que crear: la invitación se acepta DENTRO de la app, así que el
  // correo cambia de copy y el CTA apunta a la bandeja de invitaciones.
  const yaTieneCuenta = (perfilRes.data?.length ?? 0) > 0
  const clavePlantilla = yaTieneCuenta ? `${claveBase}_existente` : claveBase

  const { data: plantilla } = await admin
    .from('plantillas_correo')
    .select('asunto, cuerpo, cta_label, activo')
    .eq('clave', clavePlantilla)
    .maybeSingle()

  if (!plantilla || plantilla.activo === false) {
    console.error('Plantilla no encontrada o inactiva:', clavePlantilla)
    return new Response('template missing', { status: 500 })
  }

  const organizacion = (orgRes.data?.nombre as string) ?? ''

  // URL base de admin: la clave `admin_url` de la tabla `configuracion` (columna `valor` = text).
  const base = String(cfgRes.data?.valor ?? '').trim().replace(/\/+$/, '')
  if (!base) {
    console.error('Falta configuracion.admin_url')
    return new Response('admin_url missing', { status: 500 })
  }
  const link = yaTieneCuenta ? `${base}/invitaciones` : `${base}/invitacion/${token}`

  const expira = inv.expira_en
    ? new Date(inv.expira_en as string).toLocaleDateString(
      idioma === 'en' ? 'en-US' : 'es-ES',
      { year: 'numeric', month: 'long', day: 'numeric' },
    )
    : ''

  const vars = { org: organizacion, expira }
  const asunto = interpolate(pick(plantilla.asunto as Localized, idioma), vars)
  const cuerpo = interpolate(pick(plantilla.cuerpo as Localized, idioma), vars)
  const ctaLabel = pick(plantilla.cta_label as Localized, idioma) || 'Abrir'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: asunto,
      html: renderHtml(cuerpo, ctaLabel, link),
      text: `${cuerpo}\n\n${link}\n\n${MARCA}`,
    }),
  })

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text())
    return new Response('email failed', { status: 502 })
  }

  return ok('enviado')
})
