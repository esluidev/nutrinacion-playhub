// Edge Function: enlace-recuperacion
// Admin no envía correos (decisión 009): si alguien olvida su contraseña, el titular de su
// organización o soporte (superadmin) le genera aquí un enlace para elegir otra y se lo comparte
// como una invitación.
//
//   POST { email } con la sesión de quien lo pide → { ok, token_hash } | { ok:false, error }
//
// 1. `recuperacion_autorizar(email)` con la sesión de quien lo pide: la base decide si puede
//    (0010) y devuelve el correo de la cuenta.
// 2. Con service role, `auth.admin.generateLink` de tipo `recovery`: crea el token SIN enviar
//    correo. Sirve una vez y dura lo que `otp_expiry` de Auth (24 h); uno nuevo anula el anterior.
// Admin arma `/restablecer?token_hash=…`. Esa página lo canjea con `verifyOtp` al guardar la
// contraseña, no al abrirse: así la vista previa de un chat no lo gasta.
//
// Despliegue: nombre EXACTO `enlace-recuperacion`, con Verify JWT. Sin secretos: SUPABASE_URL,
// SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY se inyectan solos.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

const sinSesion = { persistSession: false, autoRefreshToken: false }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405)

  let payload: { email?: string }
  try {
    payload = await req.json()
  }
  catch {
    return json({ ok: false, error: 'Cuerpo no válido.' }, 400)
  }
  const email = (payload.email ?? '').trim()
  if (!email) return json({ ok: false, error: 'Falta el correo.' })

  const url = Deno.env.get('SUPABASE_URL')!

  // Con la sesión de quien lo pide: la RLS y la regla de 0010 lo deciden, no esta función.
  const solicitante = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: sinSesion,
  })
  const { data: destino, error: permiso } = await solicitante.rpc('recuperacion_autorizar', { p_email: email })
  if (permiso || typeof destino !== 'string') {
    return json({ ok: false, error: permiso?.message ?? 'No se pudo comprobar el permiso.' })
  }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: sinSesion })
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: destino })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    console.error('generateLink', error)
    return json({ ok: false, error: 'No se pudo generar el enlace.' }, 500)
  }

  return json({ ok: true, token_hash: tokenHash })
})
