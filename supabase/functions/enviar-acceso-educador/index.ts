// Edge Function: enviar-acceso-educador
// Envía por correo (Resend) el enlace de acceso de un educador a Educators (0013): la primera vez,
// para que elija su PIN, o cuando lo olvidó, para que elija uno nuevo. Admin la llama al crear el
// enlace y desde «Reenviar correo»; el enlace se sigue pudiendo copiar.
//
//   POST { educador_id, educators_url? } con la sesión de quien opera su organización
//     → { ok: true, enviado_a } | { ok: false, error }
//
// 1. Con la sesión de quien lo pide, la RLS decide si puede (la de editar educadores: quien opera la
//    organización).
// 2. Toma la copy de `plantillas_correo` en el idioma del educador: `acceso_educador` si aún no tiene
//    PIN, `acceso_educador_pin` si ya lo tiene. La envuelve en el shell HTML y la manda por Resend.
// 3. Anota en el educador cuándo salió (`acceso_correo_enviado_en`) o por qué no (`acceso_correo_error`).
//
// El enlace usa `configuracion.educators_url`. Si está vacía (desarrollo), vale la `educators_url`
// que manda Admin, solo si es del mismo equipo que Admin (mismo host que el origen de la petición).
// Secretos: los de `enviar-invitacion` (RESEND_API_KEY, RESEND_FROM).
//
// Despliegue: nombre EXACTO `enviar-acceso-educador`, con Verify JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MARCA = 'Nutrinación'
const FROM_POR_DEFECTO = 'Nutrinación <hello@nutrinacion.com>'
// Entre dos envíos del mismo enlace, para que un doble clic no mande dos correos.
const ESPERA_MS = 60_000

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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// La línea bajo el botón, en el idioma del correo.
const SI_NO_FUNCIONA: Record<string, string> = {
  es: 'Si el botón no funciona, copia este enlace:',
  en: 'If the button does not work, copy this link:',
}

// El cuerpo (texto plano; línea en blanco = párrafo) dentro del shell de marca, con el botón.
function renderHtml(cuerpo: string, ctaLabel: string, link: string, idioma: string): string {
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
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;word-break:break-all;">${escapeHtml(SI_NO_FUNCIONA[idioma] ?? SI_NO_FUNCIONA.es)} <a href="${href}" style="color:#4a6b0f;">${href}</a></p>
      </td></tr>
    </table>
  </td></tr></table>
  </body></html>`
}

function hostDe(url: string | null): string | null {
  try { return url ? new URL(url).hostname : null }
  catch { return null }
}

const sinSesion = { persistSession: false, autoRefreshToken: false }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405)

  let payload: { educador_id?: number, educators_url?: string }
  try {
    payload = await req.json()
  }
  catch {
    return json({ ok: false, error: 'Cuerpo no válido.' }, 400)
  }
  const id = Number(payload.educador_id)
  if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'Falta el educador.' })

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: sinSesion })

  // ¿Opera su organización quien lo pide? Con su sesión se limpia el error del intento anterior:
  // la política `educadores_edicion` solo deja escribir a quien opera la organización.
  const solicitante = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: sinSesion,
  })
  const { data: edu } = await solicitante
    .from('educadores')
    .update({ acceso_correo_error: null })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, nombre, correo, idioma, tiene_pin, organizacion_id, acceso_token, acceso_expira_en, acceso_correo_enviado_en')
    .maybeSingle()
  if (!edu) return json({ ok: false, error: 'No puedes enviar el acceso de este educador.' }, 403)

  if (!edu.acceso_token || !edu.acceso_expira_en || new Date(edu.acceso_expira_en).getTime() <= Date.now()) {
    return json({ ok: false, error: 'El educador no tiene un enlace de acceso vigente.' })
  }
  const email = String(edu.correo ?? '').trim()
  if (!email) return json({ ok: false, error: 'El educador no tiene correo.' })
  if (edu.acceso_correo_enviado_en && Date.now() - new Date(edu.acceso_correo_enviado_en).getTime() < ESPERA_MS) {
    return json({ ok: false, error: 'El correo acaba de salir: espera un minuto para reenviarlo.' })
  }

  const anotarError = async (error: string) => {
    await admin.from('educadores').update({ acceso_correo_error: error }).eq('id', id)
    return json({ ok: false, error })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!apiKey) return anotarError('El envío de correos no está configurado: falta RESEND_API_KEY.')

  const clave = edu.tiene_pin ? 'acceso_educador_pin' : 'acceso_educador'
  const [plantillaRes, orgRes, cfgRes] = await Promise.all([
    admin.from('plantillas_correo').select('asunto, cuerpo, cta_label, activo').eq('clave', clave).maybeSingle(),
    admin.from('organizaciones').select('nombre').eq('id', edu.organizacion_id).maybeSingle(),
    admin.from('configuracion').select('valor').eq('clave', 'educators_url').maybeSingle(),
  ])
  const plantilla = plantillaRes.data
  if (!plantilla || plantilla.activo === false) return anotarError('Falta la plantilla de correo del acceso.')

  // La URL de Educators: la de `configuracion`; si está vacía, la que manda Admin si es de su mismo equipo.
  const configurada = String(cfgRes.data?.valor ?? '').trim()
  const propuesta = String(payload.educators_url ?? '').trim()
  const mismoEquipo = !!propuesta && hostDe(propuesta) !== null && hostDe(propuesta) === hostDe(req.headers.get('Origin'))
  const base = (configurada || (mismoEquipo ? propuesta : '')).replace(/\/+$/, '')
  if (!/^https?:\/\//.test(base)) return anotarError('Falta la URL de Educators (configuracion.educators_url).')
  const link = `${base}/acceso/${edu.acceso_token}`

  const idioma = String(edu.idioma || 'es')
  const expira = new Date(edu.acceso_expira_en).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const vars = { nombre: String(edu.nombre ?? ''), org: String(orgRes.data?.nombre ?? ''), expira }
  const asunto = interpolate(pick(plantilla.asunto as Localized, idioma), vars)
  const cuerpo = interpolate(pick(plantilla.cuerpo as Localized, idioma), vars)
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
        html: renderHtml(cuerpo, ctaLabel, link, idioma),
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

  await admin.from('educadores').update({ acceso_correo_enviado_en: new Date().toISOString(), acceso_correo_error: null }).eq('id', id)
  return json({ ok: true, enviado_a: email })
})
