// Edge Function: enviar-codigo-hogar
// Envía por correo (Resend) el código de 6 dígitos de la cuenta del hogar (0018): para crear la cuenta y elegir el
// PIN, o para elegir uno nuevo si lo olvidó. La app del hogar la llama con la anon key, sin sesión: quien pide el
// código todavía no ha entrado.
//
//   POST { correo, idioma? } → { ok: true } | { ok: false, error: correo | espera | envio }
//
// 1. `hogar_codigo_nuevo` (solo con la service role) crea la cuenta si el correo no la tiene, decide si toca esperar
//    (un minuto entre envíos, 5 por hora) y devuelve el código una sola vez.
// 2. Toma la copy de `plantillas_correo` en el idioma de la app: `codigo_hogar` si aún no tiene PIN y
//    `codigo_hogar_pin` si ya lo tiene. La envuelve en el shell de marca, con el código grande, y la manda por Resend.
//
// La respuesta no dice si el correo ya tenía cuenta. Secretos: los de `enviar-invitacion` (RESEND_API_KEY,
// RESEND_FROM).
//
// Despliegue: nombre EXACTO `enviar-codigo-hogar`, con Verify JWT (la anon key de la app basta).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MARCA = 'Nutrinación Play'
const FROM_POR_DEFECTO = 'Nutrinación <hello@nutrinacion.com>'

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

// El cuerpo (texto plano; línea en blanco = párrafo) dentro del shell de marca. El párrafo que es solo el código va
// grande y espaciado, para copiarlo sin errores.
function renderHtml(cuerpo: string, codigo: string): string {
  const parrafos = cuerpo
    .split(/\n\s*\n/)
    .map(p => p.trim() === codigo
      ? `<p style="margin:20px 0 8px;color:#111827;font-size:32px;font-weight:800;letter-spacing:8px;">${escapeHtml(codigo)}</p>`
      : `<p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.5;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#f3f7fc;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${MARCA}</h1>
        ${parrafos}
      </td></tr>
    </table>
  </td></tr></table>
  </body></html>`
}

const sinSesion = { persistSession: false, autoRefreshToken: false }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'metodo' }, 405)

  let payload: { correo?: string, idioma?: string }
  try {
    payload = await req.json()
  }
  catch {
    return json({ ok: false, error: 'correo' }, 400)
  }
  const correo = String(payload.correo ?? '').trim().toLowerCase()
  const idioma = payload.idioma === 'en' ? 'en' : 'es'

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: sinSesion })

  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!apiKey) {
    console.error('enviar-codigo-hogar: falta RESEND_API_KEY')
    return json({ ok: false, error: 'envio' })
  }

  const { data: r, error } = await admin.rpc('hogar_codigo_nuevo', { p_correo: correo })
  if (error || !r) {
    console.error('enviar-codigo-hogar:', error?.message)
    return json({ ok: false, error: 'envio' })
  }
  const resultado = r as { ok: boolean, error?: string, codigo?: string, tiene_pin?: boolean }
  if (!resultado.ok || !resultado.codigo) return json({ ok: false, error: resultado.error ?? 'envio' })

  const clave = resultado.tiene_pin ? 'codigo_hogar_pin' : 'codigo_hogar'
  const { data: plantilla } = await admin.from('plantillas_correo').select('asunto, cuerpo, activo').eq('clave', clave).maybeSingle()
  if (!plantilla || plantilla.activo === false) {
    console.error(`enviar-codigo-hogar: falta la plantilla ${clave}`)
    return json({ ok: false, error: 'envio' })
  }

  const vars = { codigo: resultado.codigo }
  const asunto = interpolate(pick(plantilla.asunto as Localized, idioma), vars)
  const cuerpo = interpolate(pick(plantilla.cuerpo as Localized, idioma), vars)

  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM')?.trim() || FROM_POR_DEFECTO,
        to: correo,
        subject: asunto,
        html: renderHtml(cuerpo, resultado.codigo),
        text: `${cuerpo}\n\n${MARCA}`,
      }),
    })
  }
  catch (e) {
    console.error('enviar-codigo-hogar: sin conexión con Resend', String(e))
    return json({ ok: false, error: 'envio' })
  }
  if (!res.ok) {
    const detalle = await res.json().then(b => b?.message ?? '').catch(() => '')
    console.error(`enviar-codigo-hogar: Resend respondió ${res.status} ${detalle}`)
    return json({ ok: false, error: 'envio' })
  }
  return json({ ok: true })
})
