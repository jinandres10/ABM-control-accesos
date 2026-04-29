import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

/**
 * 🔐 Cliente público (auth)
 * - SOLO se usa para autenticar usuario (email/password)
 * - Respeta reglas de Supabase Auth
 */
const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
)

/**
 * 🔥 Cliente ADMIN (service role)
 * - Bypass TOTAL de RLS
 * - Usar únicamente en backend (server)
 * - Permite actualizar intentos y leer perfiles sin restricciones
 */
const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

/**
 * 🔒 Máximo de intentos antes de bloquear usuario
 */
const MAX_INTENTOS = 5;

export const POST: RequestHandler = async ({ request }) => {

  /* =============================
     1️⃣ Obtener y normalizar datos
  ============================== */
  const body = await request.json()

  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return json(
      { error: 'Debe ingresar email y contraseña' },
      { status: 400 }
    )
  }

  /* =============================
     2️⃣ LOGIN contra Supabase Auth
     ⚠️ Este paso NO toca perfiles
  ============================== */
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  console.log('LOGIN ERROR:', error)
  console.log('LOGIN DATA:', data)

  /* =============================
     3️⃣ LOGIN FALLIDO
     → incrementa intentos en perfiles
  ============================== */
  if (error) {

    // 🔍 Buscar perfil usando ADMIN (evita RLS)
    const { data: perfil, error: perfilError } =
      await supabaseAdmin
        .from('perfiles')
        .select('id, intentos_fallidos, bloqueada')
        .ilike('email', email) // 🔥 case-insensitive FIX
        .maybeSingle()

    if (perfilError) {
      console.error('Error buscando perfil:', perfilError)
    }

    if (perfil) {

      const nuevosIntentos = (perfil.intentos_fallidos ?? 0) + 1
      const bloquear = nuevosIntentos >= MAX_INTENTOS

      const { error: updateError } =
        await supabaseAdmin
          .from('perfiles')
          .update({
            intentos_fallidos: nuevosIntentos,
            bloqueada: bloquear,
            fecha_ultimo_intento: new Date().toISOString()
          })
          .eq('id', perfil.id)

      if (updateError) {
        console.error('Error actualizando intentos:', updateError)
      }

      // ⚠️ último intento antes del bloqueo
      if (nuevosIntentos === MAX_INTENTOS) {
        return json(
          { error: 'Último intento antes del bloqueo del usuario' },
          { status: 401 }
        )
      }

      // 🔒 usuario bloqueado
      if (bloquear) {
        return json(
          { error: 'Usuario bloqueado por múltiples intentos fallidos' },
          { status: 403 }
        )
      }
    }

    // ❌ credenciales incorrectas
    return json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    )
  }

  /* =============================
     4️⃣ LOGIN OK → validar perfil
     ⚠️ IMPORTANTE:
     - auth OK NO implica acceso permitido
  ============================== */
  const userId = data.user?.id

  if (!userId) {
    return json(
      { error: 'Error de autenticación (user null)' },
      { status: 500 }
    )
  }

  const { data: perfil, error: perfilError } =
    await supabaseAdmin
      .from('perfiles')
      .select('id, bloqueada')
      .eq('id', userId)
      .maybeSingle()

  if (perfilError) {
    console.error('Error leyendo perfil:', perfilError)
    return json({ error: 'Error interno' }, { status: 500 })
  }

  if (!perfil) {
    return json(
      { error: 'Perfil no encontrado (usuario sin alta administrativa)' },
      { status: 403 }
    )
  }

  /* =============================
     5️⃣ Validar bloqueo post-login
  ============================== */
  if (perfil.bloqueada) {
    return json(
      { error: 'Usuario bloqueado' },
      { status: 403 }
    )
  }

  /* =============================
     6️⃣ RESET de intentos
     → solo si login OK
  ============================== */
  const { error: resetError } =
    await supabaseAdmin
      .from('perfiles')
      .update({
        intentos_fallidos: 0,
        bloqueada: false,
        fecha_ultimo_intento: new Date().toISOString()
      })
      .eq('id', perfil.id)

  if (resetError) {
    console.error('Error reseteando intentos:', resetError)
  }

  /* =============================
     7️⃣ RESPUESTA FINAL
     ⚠️ IMPORTANTE:
     - NO crea sesión SSR
     - La sesión real se crea en frontend
  ============================== */
  return json({ ok: true })
}