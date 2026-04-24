import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

// cliente público (auth)
const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
)

// cliente admin (bypass RLS)
const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

export const POST: RequestHandler = async ({ request }) => {

  const { email, password } = await request.json()

  const { data: perfil } = await supabaseAdmin
    .from('perfiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (!perfil) {
    return json({ error: 'Usuario no existe' }, { status: 400 })
  }

  if (perfil.bloqueada) {
    return json({ error: 'Usuario bloqueado' }, { status: 403 })
  }

  return json({ ok: true }) // 🔥 SOLO valida
}