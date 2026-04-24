import { json } from '@sveltejs/kit'

import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import type { RequestHandler } from '@sveltejs/kit'
// cliente admin (bypass RLS)
const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

export const POST: RequestHandler = async ({ request }) => {

  const { email } = await request.json()

  const { data: perfil } = await supabaseAdmin
    .from('perfiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (!perfil) return json({ ok: false })

  const intentos = (perfil.intentos_fallidos ?? 0) + 1

  await supabaseAdmin
    .from('perfiles')
    .update({
      intentos_fallidos: intentos,
      bloqueada: intentos >= 3
    })
    .eq('id', perfil.id)

  return json({ ok: true })
}