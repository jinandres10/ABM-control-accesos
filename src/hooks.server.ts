import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'
import { supabase } from '$lib/supabase'

const RUTAS_PROTEGIDAS: string[] = ['/edificios', '/perfiles']

export const handle: Handle = async ({ event, resolve }) => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const estaProtegida = RUTAS_PROTEGIDAS.some(ruta =>
    event.url.pathname.startsWith(ruta)
  )

  if (estaProtegida && !session) {
    throw redirect(303, '/login')
  }

  return resolve(event)
}