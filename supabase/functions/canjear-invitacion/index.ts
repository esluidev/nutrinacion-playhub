// Edge Function: canjear-invitacion
// Registro cerrado "organización primero": crear una cuenta SOLO es posible con un token de
// invitación válido. Corre con service_role (Supabase lo inyecta) para saltar el RLS.
//
// Dos caminos, según si el correo YA TIENE CUENTA:
//   · SIN cuenta → el link del correo abre /invitacion/[token] y se CANJEA creando la cuenta.
//   · CON cuenta → no hay nada que crear ni que probar: la persona ya está autenticada dentro de
//     la app, ve la invitación en su bandeja y la ACEPTA o RECHAZA desde ahí.
//
// Acciones (POST JSON):
//   { action: 'validar',  token }                                    → { ok, invitacion } | { ok:false, error }
//     (la invitación trae a quién se invita —nombre, apellido— y si será el titular)
//   { action: 'canjear',  token, email, password, nombre, apellido } → { ok } | { ok:false, error }   (sin sesión)
//   { action: 'aceptar',  token }                                    → { ok } | { ok:false, error }   (CON sesión)
//   { action: 'rechazar', token }                                    → { ok } | { ok:false, error }   (CON sesión)
//
// Despliegue: nombre EXACTO `canjear-invitacion`. Sin secretos: SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY se inyectan solos.

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

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

// Carga la invitación y aplica las reglas de validez comunes a todas las acciones.
async function cargarInvitacion(admin: ReturnType<typeof createClient>, token: string) {
  if (!token) return { error: 'Falta el token de invitación.' as string }

  const { data: inv, error } = await admin
    .from('invitaciones')
    .select('id, role, email, nombre, apellido, titular, estado, expira_en, organizacion_id, comunidad_id, idioma')
    .eq('token', token)
    .maybeSingle()

  if (error) return { error: 'No se pudo leer la invitación.' }
  if (!inv) return { error: 'La invitación no existe.' }
  if (inv.estado !== 'PENDIENTE') return { error: 'Esta invitación ya fue usada o está revocada.' }
  if (inv.expira_en && new Date(inv.expira_en) < new Date()) return { error: 'Esta invitación expiró.' }

  return { inv }
}

// ¿Ese correo ya tiene cuenta? `perfiles.email` lo llena el trigger desde auth.users, así que
// sirve de proxy fiable sin exponer el esquema auth.
async function tieneCuenta(admin: ReturnType<typeof createClient>, email: string | null) {
  if (!email) return false
  const { data } = await admin.from('perfiles').select('id').eq('email', norm(email)).limit(1)
  return (data?.length ?? 0) > 0
}

// Usuario autenticado que llama, resuelto desde el Authorization header. Devuelve null si viene
// solo la anon key (que es un JWT válido para el gateway, pero no identifica a una persona).
async function usuarioAutenticado(admin: ReturnType<typeof createClient>, req: Request) {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return null
  const { data, error } = await admin.auth.getUser(jwt)
  if (error || !data?.user) return null
  return data.user
}

// Enlaza un perfil según lo que diga la invitación. Es lo mismo que hace el trigger
// handle_new_user al crear la cuenta, pero aquí a mano: el trigger solo dispara en INSERT de
// auth.users, y en este camino el usuario YA existe.
async function enlazar(
  admin: ReturnType<typeof createClient>,
  inv: Record<string, unknown>,
  perfilId: number,
) {
  if (inv.role === 'ADMIN') {
    const { error } = await admin
      .from('organizacion_administradores')
      .upsert(
        { organizacion_id: inv.organizacion_id, perfil_id: perfilId },
        { onConflict: 'organizacion_id,perfil_id', ignoreDuplicates: true },
      )
    if (error) return 'No se pudo enlazar a la organización.'
    // Invitación de titular: lo pasa a esta persona (un titular por organización; el anterior
    // sigue como administrador).
    if (inv.titular) {
      const { error: e1 } = await admin.from('organizacion_administradores')
        .update({ titular: false }).eq('organizacion_id', inv.organizacion_id).eq('titular', true)
      const { error: e2 } = await admin.from('organizacion_administradores')
        .update({ titular: true }).eq('organizacion_id', inv.organizacion_id).eq('perfil_id', perfilId)
      if (e1 || e2) return 'No se pudo marcar como titular.'
    }
    return null
  }

  if (inv.role === 'COLABORADOR') {
    if (!inv.comunidad_id) return 'La invitación no trae comunidad.'
    const { error } = await admin
      .from('comunidad_colaboradores')
      .upsert(
        { comunidad_id: inv.comunidad_id, perfil_id: perfilId, activo: true },
        { onConflict: 'comunidad_id,perfil_id', ignoreDuplicates: true },
      )
    return error ? 'No se pudo enlazar a la comunidad.' : null
  }

  return 'Rol de invitación no soportado.'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  let payload: Record<string, string> = {}
  try {
    payload = await req.json()
  }
  catch {
    return json({ ok: false, error: 'Cuerpo inválido.' })
  }

  const action = payload.action
  const token = (payload.token ?? '').trim()

  // ── Validar: info para pintar la página pública de la invitación ────────────────────
  if (action === 'validar') {
    const res = await cargarInvitacion(admin, token)
    if (res.error) return json({ ok: false, error: res.error })
    const inv = res.inv!

    const { data: org } = await admin
      .from('organizaciones').select('nombre').eq('id', inv.organizacion_id).maybeSingle()

    let comunidadNombre: string | null = null
    if (inv.comunidad_id) {
      const { data: com } = await admin
        .from('comunidades').select('nombre').eq('id', inv.comunidad_id).maybeSingle()
      comunidadNombre = com?.nombre ?? null
    }

    return json({
      ok: true,
      invitacion: {
        role: inv.role,
        email: inv.email,
        nombre: inv.nombre ?? '',
        apellido: inv.apellido ?? '',
        titular: inv.titular === true,
        organizacion: org?.nombre ?? '',
        comunidad: comunidadNombre,
        // si ya hay cuenta, la página no debe ofrecer "crear cuenta" sino "inicia sesión"
        cuentaExiste: await tieneCuenta(admin, inv.email as string | null),
      },
    })
  }

  // ── Canjear: crear la cuenta (el trigger crea perfil + enlace) y marcar la invitación ──
  if (action === 'canjear') {
    const email = norm(payload.email)
    const password = payload.password ?? ''
    const nombre = (payload.nombre ?? '').trim()
    const apellido = (payload.apellido ?? '').trim()

    if (!email || !password) return json({ ok: false, error: 'Correo y contraseña son obligatorios.' })
    if (password.length < 6) return json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' })
    if (!nombre) return json({ ok: false, error: 'El nombre es obligatorio.' })

    const res = await cargarInvitacion(admin, token)
    if (res.error) return json({ ok: false, error: res.error })
    const inv = res.inv!

    if (inv.email && norm(inv.email as string) !== email) {
      return json({ ok: false, error: 'Esta invitación es para otro correo.' })
    }

    // Si ya hay cuenta, este no es el camino: se acepta desde la bandeja, ya autenticado.
    if (await tieneCuenta(admin, email)) {
      return json({
        ok: false,
        yaTieneCuenta: true,
        error: 'Ese correo ya tiene una cuenta. Inicia sesión y acepta la invitación desde tus invitaciones pendientes.',
      })
    }

    // Crear el usuario (email ya confirmado: registro cerrado por invitación). El trigger
    // on_auth_user_created crea el perfil. El enlace (y el titular) se hace aquí después, con
    // `enlazar`: Auth guarda el app_metadata DESPUÉS de insertar al usuario, así que el trigger no
    // lo ve al crearlo. El app_metadata solo lo escribe el servidor (nunca user_metadata).
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellido,
        idioma: (inv.idioma as string) || 'es',
      },
      app_metadata: {
        role: inv.role,
        organizacion_id: inv.organizacion_id,
        comunidad_id: inv.comunidad_id,
        titular: inv.titular === true,
      },
    })
    if (userErr || !created?.user) {
      return json({ ok: false, error: userErr?.message ?? 'No se pudo crear la cuenta.' })
    }

    const { data: perfil } = await admin
      .from('perfiles').select('id').eq('usuario_id', created.user.id).maybeSingle()
    if (!perfil) return json({ ok: false, error: 'No se pudo crear el perfil.' })

    const errEnlace = await enlazar(admin, inv as Record<string, unknown>, perfil.id as number)
    if (errEnlace) return json({ ok: false, error: errEnlace })

    await admin
      .from('invitaciones')
      .update({ estado: 'USADA', usada_por: perfil.id })
      .eq('id', inv.id)

    return json({ ok: true })
  }

  // ── Aceptar / Rechazar: la persona YA está autenticada dentro de la app ────────────
  if (action === 'aceptar' || action === 'rechazar') {
    const user = await usuarioAutenticado(admin, req)
    if (!user) {
      return json({ ok: false, error: 'Debes iniciar sesión para responder una invitación.' }, 401)
    }

    const res = await cargarInvitacion(admin, token)
    if (res.error) return json({ ok: false, error: res.error })
    const inv = res.inv!

    // La invitación tiene que ser para ESTE correo. Sin esto, cualquiera con el token podría
    // engancharse a una organización a la que no fue invitado.
    if (!inv.email || norm(inv.email as string) !== norm(user.email)) {
      return json({ ok: false, error: 'Esta invitación es para otro correo.' })
    }

    const { data: perfil } = await admin
      .from('perfiles').select('id').eq('usuario_id', user.id).maybeSingle()
    if (!perfil) return json({ ok: false, error: 'Tu perfil no existe.' })

    if (action === 'rechazar') {
      await admin.from('invitaciones')
        .update({ estado: 'RECHAZADA', usada_por: perfil.id })
        .eq('id', inv.id)
      return json({ ok: true })
    }

    const errEnlace = await enlazar(admin, inv as Record<string, unknown>, perfil.id as number)
    if (errEnlace) return json({ ok: false, error: errEnlace })

    await admin.from('invitaciones')
      .update({ estado: 'USADA', usada_por: perfil.id })
      .eq('id', inv.id)

    return json({ ok: true })
  }

  return json({ ok: false, error: 'Acción no reconocida.' })
})
