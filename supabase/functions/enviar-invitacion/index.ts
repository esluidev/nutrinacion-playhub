// Edge Function: enviar-invitacion
// Envía por correo (Resend) una invitación a administrar o colaborar (decisión 012). Admin la llama
// al crear la invitación y desde «Reenviar correo»; el enlace se sigue pudiendo copiar.
//
//   POST { invitacion_id } con la sesión de quien la creó → { ok: true, enviado_a } | { ok: false, error }
//
// 1. Con la sesión de quien lo pide, la RLS decide si puede gestionar esa invitación (la misma
//    regla que para crearla o revocarla); quien solo la recibe no puede.
// 2. Toma la copy de `plantillas_correo` en el idioma de la invitación, la envuelve en el shell HTML
//    (layout, no copy) y la manda por Resend. Si el correo ya tiene cuenta, la plantilla
//    `_existente` lleva a la bandeja de invitaciones en vez de al alta.
// 3. Anota en la invitación cuándo salió (`correo_enviado_en`) o por qué no (`correo_error`, 0011).
//
// Secretos: RESEND_API_KEY (obligatorio) y RESEND_FROM (opcional; por defecto hello@nutrinacion.com,
// que exige el dominio verificado en Resend). En local, `supabase/.env`; en la nube,
// `supabase secrets set`. El enlace usa `configuracion.admin_url` o, si está vacía, el origen de Admin.
//
// Despliegue: nombre EXACTO `enviar-invitacion`, con Verify JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MARCA = 'Nutrinación'
const FROM_POR_DEFECTO = 'Nutrinación <hello@nutrinacion.com>'
// Entre dos envíos de la misma invitación, para que un doble clic no mande dos correos.
const ESPERA_MS = 60_000

// role de la invitación → clave base de la plantilla; con cuenta existente, sufijo `_existente`.
const CLAVE_POR_ROL: Record<string, string> = {
  ADMIN: 'invitacion_admin',
  COLABORADOR: 'invitacion_colaborador',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type Localized = Record<string, string> | null

// Valor en el idioma pedido, con respaldo al español y luego a cualquiera.
function pick(loc: Localized, idioma: string): string {
  if (!loc) return ''
  return loc[idioma] ?? loc.es ?? Object.values(loc)[0] ?? ''
}

function interpolate(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, ch => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch))
}

// El cuerpo (texto plano; línea en blanco = párrafo) dentro del shell de marca, con el botón.
function renderHtml(cuerpo: string, ctaLabel: string, link: string): string {
  const href = escapeHtml(link)
  const parrafos = cuerpo
    .split(/\n\s*\n/)
    .map(p => `<p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.5;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#f3f7fc;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${MARCA}</h1>
        ${parrafos}
        <a href="${href}" style="display:inline-block;margin:24px 0 8px;background:#a3cf2b;color:#1f2a0a;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;word-break:break-all;">Si el botón no funciona, copia este enlace: <a href="${href}" style="color:#4a6b0f;">${href}</a></p>
      </td></tr>
    </table>
  </td></tr></table>
  </body></html>`
}

const sinSesion = { persistSession: false, autoRefreshToken: false }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405)

  let payload: { invitacion_id?: number }
  try {
    payload = await req.json()
  }
  catch {
    return json({ ok: false, error: 'Cuerpo no válido.' }, 400)
  }
  const id = Number(payload.invitacion_id)
  if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'Falta la invitación.' })

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: sinSesion })

  // ¿Puede gestionarla quien lo pide? Con su sesión se limpia el error del intento anterior: la
  // política `invitaciones_gestion` solo deja escribir a quien puede crearla o revocarla.
  const solicitante = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: sinSesion,
  })
  const { data: inv } = await solicitante
    .from('invitaciones')
    .update({ correo_error: null })
    .eq('id', id)
    .select('id, role, email, idioma, token, estado, expira_en, organizacion_id, correo_enviado_en')
    .maybeSingle()
  if (!inv) return json({ ok: false, error: 'No puedes enviar esta invitación.' }, 403)

  if (inv.estado !== 'PENDIENTE') return json({ ok: false, error: 'La invitación ya no está pendiente.' })
  const email = String(inv.email ?? '').trim()
  if (!email) return json({ ok: false, error: 'La invitación no tiene correo.' })
  if (inv.correo_enviado_en && Date.now() - new Date(inv.correo_enviado_en).getTime() < ESPERA_MS) {
    return json({ ok: false, error: 'El correo acaba de salir: espera un minuto para reenviarlo.' })
  }

  const anotarError = async (error: string) => {
    await admin.from('invitaciones').update({ correo_error: error }).eq('id', id)
    return json({ ok: false, error })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!apiKey) return anotarError('El envío de correos no está configurado: falta RESEND_API_KEY.')

  const claveBase = CLAVE_POR_ROL[String(inv.role)]
  if (!claveBase) return anotarError('Este tipo de invitación no tiene plantilla de correo.')

  // ¿Ya tiene cuenta? `perfiles.email` lo copia el trigger de alta desde auth.users (en minúsculas).
  const emailNorm = email.toLowerCase()
  const [perfilRes, orgRes, cfgRes] = await Promise.all([
    admin.from('perfiles').select('id').eq('email', emailNorm).limit(1),
    admin.from('organizaciones').select('nombre').eq('id', inv.organizacion_id).maybeSingle(),
    admin.from('configuracion').select('valor').eq('clave', 'admin_url').maybeSingle(),
  ])
  const yaTieneCuenta = (perfilRes.data?.length ?? 0) > 0

  const { data: plantilla } = await admin
    .from('plantillas_correo')
    .select('asunto, cuerpo, cta_label, activo')
    .eq('clave', yaTieneCuenta ? `${claveBase}_existente` : claveBase)
    .maybeSingle()
  if (!plantilla || plantilla.activo === false) return anotarError('Falta la plantilla de correo de esta invitación.')

  // La URL de Admin: la de `configuracion` si está; si no, el origen desde el que se pidió el envío.
  const base = (String(cfgRes.data?.valor ?? '').trim() || req.headers.get('Origin') || '').replace(/\/+$/, '')
  if (!/^https?:\/\//.test(base)) return anotarError('Falta la URL de Admin (configuracion.admin_url).')
  const link = yaTieneCuenta ? `${base}/invitaciones` : `${base}/invitacion/${inv.token}`

  const idioma = String(inv.idioma || 'es')
  const expira = inv.expira_en
    ? new Date(inv.expira_en).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const vars = { org: String(orgRes.data?.nombre ?? ''), expira }
  const asunto = interpolate(pick(plantilla.asunto as Localized, idioma), vars)
  // Sin vencimiento, la frase «vence el …» sobra.
  const cuerpo = interpolate(pick(plantilla.cuerpo as Localized, idioma), vars).replace(/ ?(La invitación vence el|Vence el|This invitation expires on|It expires on) \./g, '')
  const ctaLabel = pick(plantilla.cta_label as Localized, idioma) || 'Abrir'

  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM')?.trim() || FROM_POR_DEFECTO,
        to: email,
        subject: asunto,
        html: renderHtml(cuerpo, ctaLabel, link),
        text: `${cuerpo}\n\n${link}\n\n${MARCA}`,
      }),
    })
  }
  catch (e) {
    return anotarError(`No se pudo conectar con Resend: ${String(e)}`)
  }
  if (!res.ok) {
    const detalle = await res.json().then(b => b?.message ?? '').catch(() => '')
    return anotarError(`Resend no envió el correo (${res.status})${detalle ? `: ${detalle}` : ''}.`)
  }

  await admin.from('invitaciones').update({ correo_enviado_en: new Date().toISOString(), correo_error: null }).eq('id', id)
  return json({ ok: true, enviado_a: email })
})
