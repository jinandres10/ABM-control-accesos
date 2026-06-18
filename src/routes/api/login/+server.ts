import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

/**
 * =========================================
 * 🔐 CLIENTE PÚBLICO (SOLO LECTURA LIGHT)
 * -----------------------------------------
 * ⚠️ IMPORTANTE:
 * - NO se usa para login acá
 * - Solo se mantiene por consistencia
 * =========================================
 */
const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
)

/**
 * =========================================
 * 🔥 CLIENTE ADMIN (SERVICE ROLE)
 * -----------------------------------------
 * - Bypass TOTAL de RLS
 * - Uso EXCLUSIVO en backend
 * - Permite leer/escribir perfiles sin restricciones
 * =========================================
 */
const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

/**
 * =========================================
 * 🔒 CONFIGURACIÓN DE SEGURIDAD
 * =========================================
 */
const MAX_INTENTOS = 5

export const POST: RequestHandler = async ({ request }) => {

  /* =============================
     1️⃣ VALIDACIÓN DE INPUT
     ============================= */
  let body: any

  try {
    body = await request.json()
  } catch {
    return json({ error: 'Formato de request inválido' }, { status: 400 })
  }

  const email = body?.email?.trim().toLowerCase()
  const password = body?.password

  if (!email || typeof email !== 'string' || !password) {
    return json(
      { error: 'Debe ingresar email y contraseña' },
      { status: 400 }
    )
  }

  /* =============================
     2️⃣ BUSCAR PERFIL (ANTES DEL LOGIN)
     ⚠️ IMPORTANTE:
     - Solo verificamos estado del usuario
     - NO autenticamos acá
     ============================= */
const { data: perfil, error: perfilError } =
  await supabaseAdmin
    .from('perfiles')
    .select(`
      id,
      rol,
      intentos_fallidos,
      bloqueada,
      activo,
      fecha_baja
    `)
    .ilike('email', email)
    .maybeSingle()

    
  if (perfilError) {
    console.error('Error buscando perfil:', perfilError.message)
    return json({ error: 'Error interno' }, { status: 500 })
  }

  

  /**
   * 🔒 Si no existe perfil
   * 👉 no revelamos información (seguridad)
   */
  if (!perfil) {
    return json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    )
  }

  /**
   * 🔒 Si usuario está bloqueado
   */
  if (perfil.bloqueada) {
    return json(
      { error: 'Usuario bloqueado' },
      { status: 403 }
    )
  }

  if (perfil.activo === false) {

  return json(
    {
      error:
        'Usuario dado de baja. Contacte al administrador.'
    },
    { status: 403 }
  )
}
  /**
 * =========================================
 * 🚫 ROL OPERADOR
 * =========================================
 *
 * No puede ingresar al panel administrativo.
 */
if (perfil.rol === 'operador') {

  return json(
    {
      error:
        'Usted tiene el rol de Operador, no tiene permitido ingresar al panel administrativo, contáctese con el administrador del sistema'
    },
    { status: 403 }
  )
}

  /* =============================
     3️⃣ VALIDACIÓN DE PASSWORD
     ⚠️ IMPORTANTE:
     - Se usa Supabase Auth
     - PERO solo para validar credenciales
     - NO usamos la sesión generada
     ============================= */
  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password
    })

  /* =============================
     4️⃣ LOGIN FALLIDO
     → incrementar intentos
     ============================= */
  if (loginError) {

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
      console.error('Error actualizando intentos:', updateError.message)
    }

    /**
     * ⚠️ último intento antes de bloquear
     */
    if (nuevosIntentos === MAX_INTENTOS - 1) {
      return json(
        { error: 'Último intento antes del bloqueo del usuario' },
        { status: 401 }
      )
    }

    /**
     * 🔒 usuario bloqueado
     */
    if (bloquear) {
      return json(
        { error: 'Usuario bloqueado por múltiples intentos fallidos' },
        { status: 403 }
      )
    }

    return json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    )
  }

  /* =============================
   4.5️⃣ VALIDAR ROL
============================= */

if (perfil.rol === 'operador') {

  return json(
    {
      error:
        'Usted tiene el rol de Operador, no tiene permitido ingresar al panel administrativo. Contáctese con el administrador del sistema.'
    },
    { status: 403 }
  );
}
  /* =============================
     5️⃣ LOGIN OK
     → reset intentos
     ============================= */
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
    console.error('Error reseteando intentos:', resetError.message)
  }

  /* =============================
     6️⃣ RESPUESTA FINAL
     ⚠️ IMPORTANTE:
     - NO crea sesión en navegador
     - El frontend DEBE hacer login real
     ============================= */
  return json({
    ok: true,
    message: 'Validación OK'
  })
}