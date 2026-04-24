import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

// 🔐 cliente admin (bypass RLS)
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

console.log('URL:', SUPABASE_URL)
console.log('SERVICE KEY:', SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20))


/* =========================
   UPDATE USER
========================= */
export const PUT: RequestHandler = async ({ params, request, locals }) => {

  // 🔐 validar admin
  if (locals.perfil?.rol !== 'admin') {
    return json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = params

  if (!id) {
    return json({ error: 'ID requerido' }, { status: 400 })
  }

  const { nombre, rol } = await request.json()

  const { error } = await supabaseAdmin
    .from('perfiles')
    .update({ nombre, rol })
    .eq('id', id)

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json({ ok: true })
}


/* =========================
   DELETE USER
========================= */
export const DELETE: RequestHandler = async ({ params, locals }) => {

  
  // 🔐 validar admin
  if (locals.perfil?.rol !== 'admin') {
    return json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = params

  console.log('DELETE ID:', id)
  
  if (!id) {
    return json({ error: 'ID requerido' }, { status: 400 })
  }

  try {

    // 🔥 1. eliminar usuario de auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      return json({ error: authError.message }, { status: 500 })
    }

    // 🔥 2. eliminar perfil
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .delete()
      .eq('id', id)

    if (perfilError) {
      return json({ error: perfilError.message }, { status: 500 })
    }

    return json({ ok: true })

  } catch (err) {
    return json({ error: 'Error interno' }, { status: 500 })
  }
}


/* =========================
   RESET PASSWORD (ADMIN)
========================= */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {

  // 🔐 solo admin
  if (locals.perfil?.rol !== 'admin') {
    return json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = params

  if (!id) {
    return json({ error: 'ID requerido' }, { status: 400 })
  }

  const { password } = await request.json()

  if (!password) {
    return json({ error: 'Password requerida' }, { status: 400 })
  }

  // 🔥 reset password
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password
  })

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json({ ok: true })
}